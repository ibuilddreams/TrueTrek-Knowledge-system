"""Orchestration for AI course generation (plan §6, §9).

Runs the provider call and the DB write on a background thread so the request
handler returns 202 immediately and the view's heartbeat resumes — the sync
gunicorn worker's 60s timeout never applies to the detached thread (plan §6,
option B). This is the first concurrency primitive in this backend; there is no
Celery/Redis to hand this off to yet, so everything below — the one-in-flight-
per-user guard, the global cap, the monthly spend counter, the stale-job
reaper — is enforced against the AICourseGeneration table itself rather than a
queue or a cache, because there is no CACHES setting and no cross-process shared
memory (3 sync gunicorn worker processes).
"""

import logging
import random
import threading
import time
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.utils import timezone

from .models import AICourseGeneration
from .prompts.course import PROMPT_VERSION, RESPONSE_SCHEMA, build_prompt
from .providers import get_provider
from .providers.base import ProviderError, ProviderQuotaError, ProviderTransportError
from .validators import PlanValidationError, validate_and_repair
from .writer import write_course_tree

logger = logging.getLogger("ai_courses")

GenerationStatus = AICourseGeneration.GenerationStatus

# A transport error is the only failure worth retrying — retrying a schema
# failure would just bill the same broken prompt twice for the same result.
# Full-course generation gets a far larger retry budget than the smaller
# per-answer/per-drill AI calls elsewhere in the app (those use a single flat
# retry — see e.g. quizzes/ai_grading.py), because this is a background job the
# admin polls for, not a blocking request: waiting costs wall-clock time, not a
# held connection or a risk of hitting a proxy timeout. See _retry_delay below
# for why the window is this long.
MAX_TRANSPORT_ATTEMPTS = 5
TRANSPORT_RETRY_BACKOFF_SECONDS = 2
TRANSPORT_RETRY_MAX_BACKOFF_SECONDS = 20
# Bounds one model's whole retry loop. A single attempt can itself burn up to
# AI_REQUEST_TIMEOUT before failing (a 91s 503 was observed), so without a
# deadline five attempts could stack into ten minutes of an admin watching a
# spinner.
TRANSPORT_RETRY_DEADLINE_SECONDS = 120


def _retry_delay(attempt):
    """Exponential backoff with jitter: ~2s, 4s, 8s, 16s (capped), so the whole
    retry window is ~30-40s instead of the flat 2s-per-retry it used to be.

    A Gemini 503 means "the model is overloaded right now", which does not clear
    in the 4 seconds three flat 2s retries used to allow — observed failures
    burned all their attempts in ~14s total while successful generations on the
    same prompt take 60-80s. The jitter keeps the (up to
    AI_MAX_CONCURRENT_GENERATIONS) jobs in flight from retrying in lockstep and
    re-colliding on the same overloaded model.

    This is deliberately more patient than the single flat retry used by the
    request-scoped AI calls elsewhere (quizzes/ai_grading.py, advisor, daily
    drill): those are blocking a live HTTP request, while this is a detached
    background job the admin polls, so waiting costs wall-clock time only. The
    worst-case gap between heartbeats (one attempt plus one backoff) stays well
    under AI_STALE_JOB_THRESHOLD_SECONDS, so the stale-job reaper still can't
    mistake a retrying job for an orphaned one.
    """
    delay = min(
        TRANSPORT_RETRY_BACKOFF_SECONDS * (2 ** (attempt - 1)),
        TRANSPORT_RETRY_MAX_BACKOFF_SECONDS,
    )
    return delay + random.uniform(0, delay * 0.25)


class _JobCancelled(Exception):
    """The admin cancelled while the worker was between retries."""


class GenerationConcurrencyError(Exception):
    pass


class GenerationQuotaError(Exception):
    pass


def _month_start():
    now = timezone.now()
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def get_monthly_usage(user):
    used = (
        AICourseGeneration.objects.filter(requested_by=user, created_at__gte=_month_start())
        .exclude(status=GenerationStatus.CANCELLED)
        .count()
    )
    return {"used": used, "limit": settings.AI_MONTHLY_LIMIT}


def reap_stale_jobs():
    """Any RUNNING job whose heartbeat has gone stale was almost certainly killed by
    a deploy restart (Restart=always, TimeoutStopSec=30 of grace) rather than still
    genuinely running. Called on every poll and on every new generation start."""
    threshold = timezone.now() - timedelta(seconds=settings.AI_STALE_JOB_THRESHOLD_SECONDS)
    stale = AICourseGeneration.objects.filter(
        status=GenerationStatus.RUNNING,
        heartbeat_at__lt=threshold,
    )
    count = stale.update(
        status=GenerationStatus.FAILED,
        error_message="Generation failed: the server restarted mid-generation.",
        finished_at=timezone.now(),
    )
    if count:
        logger.warning("Reaped %d stale AI generation job(s).", count)


def _check_concurrency(user):
    if AICourseGeneration.objects.filter(
        requested_by=user, status__in=[GenerationStatus.PENDING, GenerationStatus.RUNNING]
    ).exists():
        raise GenerationConcurrencyError(
            "You already have a course generation in progress. Wait for it to finish before starting another."
        )

    global_in_flight = AICourseGeneration.objects.filter(
        status__in=[GenerationStatus.PENDING, GenerationStatus.RUNNING]
    ).count()
    if global_in_flight >= settings.AI_MAX_CONCURRENT_GENERATIONS:
        raise GenerationConcurrencyError(
            "AI course generation is at capacity right now. Please try again in a few minutes."
        )


def _check_monthly_quota(user):
    usage = get_monthly_usage(user)
    if usage["used"] >= usage["limit"]:
        raise GenerationQuotaError(
            f"Monthly AI generation limit reached ({usage['limit']}). Try again next month."
        )


def start_generation(user, validated_data):
    """Validates entitlement/quota/concurrency, creates the PENDING job row, and
    starts the background worker. Returns the job. Raises GenerationConcurrencyError
    or GenerationQuotaError if the request should be rejected before any provider
    call is made — no cost is incurred for either rejection."""

    reap_stale_jobs()
    _check_concurrency(user)
    _check_monthly_quota(user)

    job = AICourseGeneration.objects.create(
        requested_by=user,
        status=GenerationStatus.PENDING,
        step="Queued",
        provider=settings.AI_PROVIDER,
        model_name=settings.AI_MODEL,
        input_payload=_serialize_input(validated_data),
        prompt_version=PROMPT_VERSION,
    )

    thread = threading.Thread(target=_run_generation_safe, args=(job.id,), daemon=True)
    thread.start()

    return job


def _serialize_input(validated_data):
    """input_payload is a JSONField — model instances (category, tier, instructors)
    must be reduced to plain ids/values before storage."""
    payload = dict(validated_data)
    payload["category"] = validated_data["category"].id
    payload["instructors"] = [instructor.id for instructor in validated_data["instructors"]]
    payload["tier"] = validated_data["tier"].id if validated_data.get("tier") else None
    payload["amount"] = str(validated_data.get("amount") or 0)
    return payload


def _touch(job, **fields):
    fields["heartbeat_at"] = timezone.now()
    for key, value in fields.items():
        setattr(job, key, value)
    job.save(update_fields=list(fields.keys()))


def _run_generation_safe(job_id):
    try:
        _run_generation(job_id)
    except Exception as exc:  # noqa: BLE001 — a background thread must never crash silently
        logger.exception("Unhandled error running AI generation job %s", job_id)
        # Include the real exception in the job so an admin (or the next debugging
        # session) isn't stuck with an opaque message — the full traceback is
        # already in the server log via logger.exception above; this is the honest
        # short version of it, not a fabricated placeholder.
        AICourseGeneration.objects.filter(pk=job_id).update(
            status=GenerationStatus.FAILED,
            error_message=f"Generation failed due to an unexpected server error: "
            f"{type(exc).__name__}: {exc}",
            finished_at=timezone.now(),
            heartbeat_at=timezone.now(),
        )
    finally:
        connection.close()


def _humanize_seconds(seconds):
    """49225 -> "13h 40m". Returns None when there is nothing useful to say."""
    if not seconds or seconds <= 0:
        return None
    seconds = int(seconds)
    if seconds < 60:
        return f"{seconds}s"
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def _join_models(models):
    if len(models) == 1:
        return models[0]
    if len(models) == 2:
        return f"both {models[0]} and {models[1]}"
    return ", ".join(models[:-1]) + f" and {models[-1]}"


def _failure_message(exc, models_tried):
    """The sentence the admin actually reads in the generation modal.

    The provider's own error text is a multi-sentence blob with doc links and an
    embedded quota dump; rendered verbatim it filled the whole dialog. This keeps
    one plain explanation plus the short technical cause, and says what to do next.
    """
    models = _join_models(models_tried)

    if isinstance(exc, ProviderQuotaError):
        resets_in = _humanize_seconds(getattr(exc, "retry_after_seconds", None))
        when = f" The provider reports it resets in about {resets_in}." if resets_in else ""
        return (
            f"The AI provider's request quota is used up for {models}.{when} Raise the "
            f"API plan's limits or try again once the quota resets. ({exc})"
        )

    if isinstance(exc, ProviderTransportError):
        return (
            f"The AI provider is temporarily unavailable — {models} did not answer "
            "within the retry window. This is provider-side overload, not a problem "
            f"with your course settings, so trying again in a few minutes usually "
            f"works. ({exc})"
        )

    return (
        f"The AI provider rejected the request to {models}. This usually means the "
        f"server's API credentials or model name need attention rather than anything "
        f"in this form. ({exc})"
    )


def _call_model(job, model, prompt, step_label):
    """Runs one model through the whole transport-retry budget.

    Returns (result, last_transport_error) — result is None when every attempt hit
    a transport error, which is the caller's cue to try the fallback model. Raises
    ProviderError for a permanent failure (bad key, rejected request) that no retry
    and no other model would fix, and _JobCancelled if the admin cancelled during a
    backoff."""

    provider = get_provider(model=model)
    started = time.monotonic()
    last_transport_error = None

    for attempt in range(1, MAX_TRANSPORT_ATTEMPTS + 1):
        try:
            return provider.generate_course(
                prompt, RESPONSE_SCHEMA, settings.AI_REQUEST_TIMEOUT
            ), None
        except ProviderQuotaError as exc:
            # Quota and rate limits are per model, so retrying this one is just a
            # guaranteed second rejection — hand straight back so the caller can
            # try the fallback model, which has its own quota.
            logger.warning("Job %s: %s is out of quota (%s).", job.id, model, exc)
            return None, exc
        except ProviderTransportError as exc:
            last_transport_error = exc
            if attempt == MAX_TRANSPORT_ATTEMPTS:
                break

            delay = _retry_delay(attempt)
            if time.monotonic() - started + delay > TRANSPORT_RETRY_DEADLINE_SECONDS:
                logger.warning(
                    "Job %s: giving up on %s after %.0fs (retry deadline).",
                    job.id, model, time.monotonic() - started,
                )
                break

            logger.warning(
                "Transport error calling %s for job %s (attempt %d/%d) — retrying in %.1fs.",
                model, job.id, attempt, MAX_TRANSPORT_ATTEMPTS, delay,
            )
            time.sleep(delay)

            # The retry window is long enough that an admin can hit Cancel during
            # it — check before spending another provider call, rather than only
            # noticing once the whole loop is done.
            job.refresh_from_db(fields=["status"])
            if job.status == GenerationStatus.CANCELLED:
                raise _JobCancelled from exc

            # A failed attempt that ran close to AI_REQUEST_TIMEOUT already consumed
            # most of it without a heartbeat update. Refresh it before the next
            # attempt (which can itself take up to AI_REQUEST_TIMEOUT again) so the
            # stale-job reaper — which runs on every poll — can't mistake a
            # legitimately-still-running retry for a job orphaned by a server restart.
            _touch(job, step=f"{step_label} (retry {attempt}/{MAX_TRANSPORT_ATTEMPTS - 1})")

    return None, last_transport_error


def _run_generation(job_id):
    job = AICourseGeneration.objects.select_related("requested_by").get(pk=job_id)
    validated_data = _rehydrate_input(job.input_payload)

    _touch(
        job,
        status=GenerationStatus.RUNNING,
        step="Building prompt",
        progress_percent=5,
        started_at=timezone.now(),
    )

    try:
        prompt = build_prompt(validated_data)
        # Built and thrown away: this is the configuration pre-check (missing API
        # key, unknown AI_PROVIDER), so a misconfigured server fails here with a
        # clear message instead of inside the retry loop. _call_model builds its
        # own provider per model.
        get_provider()
    except ProviderError as exc:
        _fail(job, f"AI provider could not be configured: {exc}")
        return

    # This is the longest step by far (the blocking Gemini call, up to
    # AI_REQUEST_TIMEOUT) — held at a fixed value rather than faked upward on a
    # timer, since there's no real signal of sub-progress within a single HTTP
    # call. The step label is what actually communicates "still working."
    _touch(job, step="Calling AI provider", progress_percent=15)

    fallback_model = (getattr(settings, "AI_FALLBACK_MODEL", "") or "").strip()
    fallback_note = None
    models_tried = [settings.AI_MODEL]
    try:
        result, last_error = _call_model(job, settings.AI_MODEL, prompt, "Calling AI provider")

        if result is None and fallback_model and fallback_model != settings.AI_MODEL:
            logger.warning(
                "Job %s: %s was unusable (%s) — falling back to %s.",
                job_id, settings.AI_MODEL, last_error, fallback_model,
            )
            _touch(job, step=f"Primary model unavailable — switching to {fallback_model}")
            models_tried.append(fallback_model)
            result, fallback_error = _call_model(
                job, fallback_model, prompt, "Calling backup AI provider"
            )
            if result is None:
                last_error = fallback_error or last_error
            else:
                fallback_note = (
                    f"Generated with the backup model {fallback_model} because "
                    f"{settings.AI_MODEL} was unavailable — give the content a closer "
                    "read than usual before publishing."
                )
    except _JobCancelled:
        return
    except ProviderError as exc:
        # A rejected request (bad key, bad model name) is the same rejection for
        # every model, so there is nothing for the fallback to fix. Quota errors
        # are the exception and never reach here — _call_model returns those so
        # the fallback does get its turn.
        _fail(job, _failure_message(exc, [settings.AI_MODEL]))
        return

    if result is None:
        _fail(job, _failure_message(last_error, models_tried))
        return

    job.refresh_from_db(fields=["status"])
    if job.status == GenerationStatus.CANCELLED:
        return

    _touch(
        job,
        step="Validating response",
        progress_percent=70,
        raw_response=result.text,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
    )

    try:
        normalized_plan, warnings = validate_and_repair(
            result.text, validated_data, settings.AI_MAX_MODULES
        )
    except PlanValidationError as exc:
        _fail(job, f"AI response could not be used: {exc}")
        return

    if fallback_note:
        # First, so it is the first thing the admin reads in the warnings panel.
        warnings.insert(0, fallback_note)

    job.refresh_from_db(fields=["status"])
    if job.status == GenerationStatus.CANCELLED:
        return

    _touch(job, step="Writing course", progress_percent=90, normalized_plan=normalized_plan, warnings=warnings)

    try:
        course = write_course_tree(normalized_plan, validated_data)
    except Exception as exc:  # noqa: BLE001 — any DB failure here must not vanish
        logger.exception("Writing AI-generated course tree failed for job %s", job_id)
        _fail(job, f"Saving the generated course failed: {exc}")
        return

    final_status = GenerationStatus.PARTIAL if warnings else GenerationStatus.SUCCEEDED
    _touch(
        job,
        status=final_status,
        step="Done",
        course=course,
        progress_percent=100,
        finished_at=timezone.now(),
    )


def _fail(job, message):
    logger.error("AI generation job %s failed: %s", job.id, message)
    _touch(job, status=GenerationStatus.FAILED, step="Failed", error_message=message, finished_at=timezone.now())


def _rehydrate_input(input_payload):
    """Reverses _serialize_input so the worker thread can rebuild the prompt and
    writer context from what was persisted, without depending on request-scoped
    querysets that no longer exist on a background thread."""
    from django.contrib.auth import get_user_model

    from courses.models import Category
    from tiers.models import Tier

    UserModel = get_user_model()

    data = dict(input_payload)
    data["category"] = Category.objects.get(pk=input_payload["category"])
    data["instructors"] = list(UserModel.objects.filter(id__in=input_payload["instructors"]))
    data["tier"] = Tier.objects.filter(pk=input_payload["tier"]).first() if input_payload.get("tier") else None
    return data


def cancel_generation(job):
    if job.status not in (GenerationStatus.PENDING, GenerationStatus.RUNNING):
        return job
    job.status = GenerationStatus.CANCELLED
    job.finished_at = timezone.now()
    job.error_message = "Cancelled by the requesting admin."
    job.save(update_fields=["status", "finished_at", "error_message"])
    return job


def retry_generation(user, original_job):
    """Re-runs the exact same validated input without the admin retyping anything
    (plan §16 — never lose the request)."""
    validated_data = _rehydrate_input(original_job.input_payload)
    return start_generation(user, validated_data)
