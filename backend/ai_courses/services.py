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
import threading
import time
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.utils import timezone

from .models import AICourseGeneration
from .prompts.course import PROMPT_VERSION, RESPONSE_SCHEMA, build_prompt
from .providers import get_provider
from .providers.base import ProviderError, ProviderTransportError
from .validators import PlanValidationError, validate_and_repair
from .writer import write_course_tree

logger = logging.getLogger("ai_courses")

GenerationStatus = AICourseGeneration.GenerationStatus

# One retry, short fixed backoff — a transport error is the only failure worth
# retrying (plan §9 step 2 / §16); retrying a schema failure would just bill the
# same broken prompt twice for the same result.
TRANSPORT_RETRY_BACKOFF_SECONDS = 2


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
        provider = get_provider()
    except ProviderError as exc:
        _fail(job, f"AI provider could not be configured: {exc}")
        return

    # This is the longest step by far (the blocking Gemini call, up to
    # AI_REQUEST_TIMEOUT) — held at a fixed value rather than faked upward on a
    # timer, since there's no real signal of sub-progress within a single HTTP
    # call. The step label is what actually communicates "still working."
    _touch(job, step="Calling AI provider", progress_percent=15)
    try:
        result = provider.generate_course(prompt, RESPONSE_SCHEMA, settings.AI_REQUEST_TIMEOUT)
    except ProviderTransportError:
        logger.warning("Transport error calling provider for job %s — retrying once.", job_id)
        time.sleep(TRANSPORT_RETRY_BACKOFF_SECONDS)
        # A first attempt that timed out already consumed up to AI_REQUEST_TIMEOUT
        # without a heartbeat update. Refresh it before the second attempt (which
        # can itself take up to AI_REQUEST_TIMEOUT again) so the stale-job reaper
        # — which runs on every poll — can't mistake a legitimately-still-running
        # retry for a job orphaned by a server restart.
        _touch(job, step="Calling AI provider (retry)")
        try:
            result = provider.generate_course(prompt, RESPONSE_SCHEMA, settings.AI_REQUEST_TIMEOUT)
        except (ProviderTransportError, ProviderError) as exc:
            _fail(job, f"AI provider request failed: {exc}")
            return
    except ProviderError as exc:
        _fail(job, f"AI provider request failed: {exc}")
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
