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

The content itself now comes from our own LLM service rather than Gemini. That
service is a job API of its own (submit -> SSE progress -> read the finished
structure), so this module runs *two* jobs side by side: the AICourseGeneration
row the admin wizard polls, and the service-side job it mirrors. Everything
around that — entitlement, quota, concurrency, cancellation, retry, validation,
the ORM write — is unchanged, and so is every other AI feature in this backend
(advisor chat, AI grading, content suggestions, the daily drill), which all
still call Gemini through providers.get_provider().
"""

import json
import logging
import random
import threading
import time
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.utils import timezone

from .custom_llm_mapping import adapt_job_result, build_request_payload
from .models import AICourseGeneration
from .prompts.course import PROMPT_VERSION
from .providers import get_course_provider
from .providers.custom_llm import RAG_ENABLED
from .providers.base import (
    ProviderError,
    ProviderJobFailedError,
    ProviderQuotaError,
    ProviderTransportError,
)
from .validators import PlanValidationError, validate_and_repair
from .writer import write_course_tree

# --- Gemini course generation (replaced by our own LLM service) --------------
# The prompt template and its structured-output schema are kept intact so that
# restoring this path is uncommenting, not rewriting. See also the commented
# branch in ai_courses/providers/__init__.py::get_course_provider.
# from .prompts.course import RESPONSE_SCHEMA, build_prompt
# from .providers import get_provider
# -----------------------------------------------------------------------------

logger = logging.getLogger("ai_courses")

GenerationStatus = AICourseGeneration.GenerationStatus

# These bound the retry budget for *submitting* the job to the AI service. A
# transport error there is the only failure worth retrying — a rejected request
# (bad payload, service misconfigured) would be rejected identically the second
# time. Once the service has accepted the job there is nothing left to retry:
# losing the progress stream falls back to polling the same job rather than
# starting a second generation (see providers/custom_llm.py).
#
# Full-course generation gets a far larger retry budget than the smaller
# per-answer/per-drill AI calls elsewhere in the app (those use a single flat
# retry — see e.g. quizzes/ai_grading.py), because this is a background job the
# admin polls for, not a blocking request: waiting costs wall-clock time, not a
# held connection or a risk of hitting a proxy timeout. See _retry_delay below
# for why the window is this long.
MAX_TRANSPORT_ATTEMPTS = 5
TRANSPORT_RETRY_BACKOFF_SECONDS = 2
TRANSPORT_RETRY_MAX_BACKOFF_SECONDS = 20
# Bounds the whole submit-retry loop. A single attempt can itself burn up to
# the provider's REQUEST_TIMEOUT_SECONDS before failing, so without a deadline five attempts
# could stack into minutes of an admin watching a spinner before being told the
# service is unreachable.
TRANSPORT_RETRY_DEADLINE_SECONDS = 120

# The slice of our 0-100 progress bar that the AI service's own progress drives.
# Below the floor is our setup (building the request, submitting it); above the
# ceiling is validation and the ORM write, which the service has no view of.
GENERATION_PROGRESS_FLOOR = 15
GENERATION_PROGRESS_CEILING = 65

# Smallest gap between two progress writes for one job. An SSE stream can emit
# events much faster than the wizard's 2s poll can show them, and every write is
# an UPDATE on the row that poll reads.
PROGRESS_WRITE_INTERVAL_SECONDS = 2

# How often an event that reports nothing new is still worth a log line. Every
# change is logged; this is what keeps a long unchanging stage legible in the
# log as "alive but not moving" rather than looking like the stream died. The
# live service sends a keep-alive roughly every 15s and can sit on one stage for
# tens of minutes, so without this the log would either spam or go silent.
EVENT_LOG_REPEAT_SECONDS = 60

# raw_response keeps the service's finished job body for debugging. A full course
# is tens of KB of JSON, which is fine; this only guards against a pathological
# payload (an embedded data URI, a repeated retrieval dump) bloating the row.
RAW_RESPONSE_MAX_CHARS = 1_000_000

# Written to AICourseGeneration.provider. Distinct from settings.AI_PROVIDER
# ("gemini"), which still describes every other AI call in this backend, so an
# old Gemini-generated job row stays distinguishable from a new one.
COURSE_PROVIDER_NAME = "custom-llm"


def _retry_delay(attempt):
    """Exponential backoff with jitter: ~2s, 4s, 8s, 16s (capped), so the whole
    retry window is ~30-40s instead of the flat 2s-per-retry it used to be.

    A 503 from an AI service means "overloaded right now", which does not clear
    in the 4 seconds three flat 2s retries used to allow. The jitter keeps the
    (up to AI_MAX_CONCURRENT_GENERATIONS) jobs in flight from retrying in
    lockstep and re-colliding on the same overloaded service.

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


# How long after it finished a generation is still "the one you were waiting on"
# rather than history. A generation now runs for as long as the service needs, so
# an admin may well start one in the evening and first see its outcome the next
# morning; past this window the Generations list is the right place to look.
RESUMABLE_RESULT_WINDOW = timedelta(hours=24)


def get_resumable_generation(user):
    """The generation Admin -> Courses should offer to pick back up: the one still
    running, or the one that finished recently and whose outcome this admin may
    not have seen. None when there is nothing to show.

    This exists because the wizard's job id lives in React state — switching admin
    tab or reloading the page loses it, while the generation itself carries on on
    the server. Without this the only way back to a running job was to leave the
    modal open.

    A job still in flight always wins; _check_concurrency allows the user only one
    of those at a time, so there is never a second one to choose between. Jobs the
    admin cancelled themselves are left out — they already know how that ended."""

    jobs = AICourseGeneration.objects.select_related("course").filter(requested_by=user)

    in_flight = (
        jobs.filter(status__in=[GenerationStatus.PENDING, GenerationStatus.RUNNING])
        .order_by("-created_at")
        .first()
    )
    if in_flight:
        return in_flight

    return (
        jobs.exclude(status=GenerationStatus.CANCELLED)
        .filter(finished_at__gte=timezone.now() - RESUMABLE_RESULT_WINDOW)
        .order_by("-finished_at")
        .first()
    )


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
        # Our own service, not settings.AI_PROVIDER/AI_MODEL (those still
        # describe the Gemini calls the rest of the backend makes). The service
        # picks its own model; model_name is filled in only if it reports one.
        provider=COURSE_PROVIDER_NAME,
        model_name="",
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
    # A step/progress write is the only evidence that the generation is actually
    # moving: heartbeat_at is refreshed on every pass, including the ones that
    # report nothing new, so on its own it cannot tell "working" from "stuck on
    # one stage" — and a real run on the live service sat on one stage for 25
    # minutes.
    if {"step", "step_detail", "progress_percent"} & set(fields):
        fields.setdefault("step_changed_at", timezone.now())
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


# --- Gemini multi-model fallback (replaced by our own LLM service) -----------
# Gemini answers 503 per model, so a failed primary model was retried on
# settings.AI_FALLBACK_MODEL. Our own service chooses its own model, so there is
# no second model here to fall back to and nothing for this helper to name.
#
# def _join_models(models):
#     if len(models) == 1:
#         return models[0]
#     if len(models) == 2:
#         return f"both {models[0]} and {models[1]}"
#     return ", ".join(models[:-1]) + f" and {models[-1]}"
# -----------------------------------------------------------------------------


def _failure_message(exc):
    """The sentence the admin actually reads in the generation modal.

    A service's own error text is a multi-sentence blob with doc links and an
    embedded quota dump; rendered verbatim it filled the whole dialog. This keeps
    one plain explanation plus the short technical cause, and says what to do next.
    """

    if isinstance(exc, ProviderJobFailedError):
        # The service took the job and broke while running it. Nothing about the
        # admin's settings was refused, so saying "rejected" here would send them
        # off editing a form that was never the problem.
        return (
            "The AI service accepted this course but failed while generating it. "
            "That is a fault inside the generation service rather than anything in "
            f"your course settings — the service reported: {exc}"
        )

    if isinstance(exc, ProviderQuotaError):
        resets_in = _humanize_seconds(getattr(exc, "retry_after_seconds", None))
        when = f" It reports that this resets in about {resets_in}." if resets_in else ""
        return (
            f"The AI service's request quota is used up.{when} Raise its limits or "
            f"try again once the quota resets. ({exc})"
        )

    if isinstance(exc, ProviderTransportError):
        # Note this no longer covers "took too long": the wait has no deadline
        # (providers/custom_llm.py::await_course_job), so reaching here means the
        # service could not be reached at all, not that it was being slow.
        return (
            "The AI service could not be reached. This is a problem on the service "
            "side, not with your course settings, so trying again in a few minutes "
            f"usually works. ({exc})"
        )

    return (
        "The AI service rejected the request. This usually means the service "
        "itself needs attention rather than anything in this form. "
        f"({exc})"
    )


def _submit_with_retry(job, provider, request_payload):
    """Submits the generation request, retrying only transport failures, and
    returns the AI service's job id.

    Raises the last ProviderTransportError when the budget is spent, ProviderError
    for a permanent rejection no retry would fix, and _JobCancelled if the admin
    cancelled during a backoff.

    A retry here can in principle leave an orphaned job running on the service
    (the request was accepted but the response never arrived). That costs the
    service some work, but it cannot produce a duplicate course: only the job id
    this function returns is ever followed or written."""

    started = time.monotonic()
    last_transport_error = None

    for attempt in range(1, MAX_TRANSPORT_ATTEMPTS + 1):
        try:
            return provider.submit_course_job(request_payload)
        except ProviderTransportError as exc:
            last_transport_error = exc
            if attempt == MAX_TRANSPORT_ATTEMPTS:
                break

            delay = _retry_delay(attempt)
            if time.monotonic() - started + delay > TRANSPORT_RETRY_DEADLINE_SECONDS:
                logger.warning(
                    "Job %s: giving up on the AI service after %.0fs (retry deadline).",
                    job.id, time.monotonic() - started,
                )
                break

            logger.warning(
                "Transport error submitting job %s to the AI service (attempt %d/%d) — "
                "retrying in %.1fs.",
                job.id, attempt, MAX_TRANSPORT_ATTEMPTS, delay,
            )
            time.sleep(delay)

            # The retry window is long enough that an admin can hit Cancel during
            # it — check before spending another call, rather than only noticing
            # once the whole loop is done.
            job.refresh_from_db(fields=["status"])
            if job.status == GenerationStatus.CANCELLED:
                raise _JobCancelled from exc

            # Keep the heartbeat fresh across the backoff so the stale-job reaper —
            # which runs on every poll — can't mistake a legitimately-still-retrying
            # job for one orphaned by a server restart.
            _touch(job, step=f"Retrying the AI service ({attempt}/{MAX_TRANSPORT_ATTEMPTS - 1})")

    raise last_transport_error


def _map_progress(service_percent):
    """The AI service's own 0-100 maps onto the slice of our bar between
    "request sent" and "validating" — our progress also covers validation and the
    ORM write, which the service knows nothing about."""
    fraction = max(0.0, min(float(service_percent), 100.0)) / 100
    return int(GENERATION_PROGRESS_FLOOR + fraction * (GENERATION_PROGRESS_CEILING - GENERATION_PROGRESS_FLOOR))


def _log_event(job_id, event, state, now):
    """One line per progress event, as *this app read it* — the parsed stage,
    detail and progress that then become the step the admin sees.

    The verbatim stream sits beside this in the log already
    (providers/custom_llm.py logs every raw SSE line); this is the interpreted
    view, which is what tells you whether a stage we are showing wrongly came
    from a payload we misread. Changes go to INFO; an event repeating what the
    last one said goes to DEBUG at most once every EVENT_LOG_REPEAT_SECONDS,
    since the raw keep-alives are already on INFO and saying it twice helps
    nobody.

    `data` is the service's own per-event payload — empty or
    {"keep_alive": true} on every event observed against the live instance, but
    it is where anything richer (counts, per-module detail) would arrive, so it
    is logged whenever it carries something other than the keep-alive flag."""

    changed = (
        event.stage != state.get("logged_stage")
        or event.detail != state.get("logged_detail")
        or event.progress != state.get("logged_progress")
    )
    if not changed and now - state.get("last_log", 0.0) < EVENT_LOG_REPEAT_SECONDS:
        return

    state["last_log"] = now
    state["logged_stage"] = event.stage
    state["logged_detail"] = event.detail
    state["logged_progress"] = event.progress

    payload = event.raw.get("data") if isinstance(event.raw, dict) else None
    if isinstance(payload, dict):
        payload = {key: value for key, value in payload.items() if key != "keep_alive"}

    log = logger.info if changed else logger.debug
    log(
        "Job %s %s: stage=%r detail=%r progress=%r status=%r event=%r%s",
        job_id,
        "progress" if changed else "still",
        event.stage,
        event.detail,
        event.progress,
        event.status,
        event.event_type,
        f" data={json.dumps(payload, default=str)[:500]}" if payload else "",
    )


def _progress_handler(job):
    """Builds the on_event callback the provider calls for every SSE event (or
    poll). It does four things: log what the service reported, mirror its stage
    onto the row the wizard polls, keep heartbeat_at fresh, and notice a
    cancellation.

    Writes are throttled because an SSE stream can be far chattier than the 2s
    poll the wizard runs — without this, a talkative stream would turn into one
    UPDATE per event for a step label nobody can read that fast. A heartbeat is
    still written at least every PROGRESS_WRITE_INTERVAL_SECONDS, which is an
    order of magnitude below AI_STALE_JOB_THRESHOLD_SECONDS. Logging is throttled
    separately and more loosely — see _log_event."""

    state = {"last_write": 0.0, "step": None, "percent": None, "detail": None}

    def handle(event):
        now = time.monotonic()
        _log_event(job.id, event, state, now)

        step = (event.label or "")[:255]
        # Only when it says more than the step already does — the service sends
        # stage "starting" with detail "Pipeline starting", and showing both
        # would just be the same words twice.
        detail = (event.detail or "")[:500]
        if detail and detail.strip().lower() == step.strip().lower():
            detail = ""
        percent = _map_progress(event.progress) if event.progress is not None else None

        # The service's progress is not monotonic — a real run reported
        # 5% -> 10% -> 5% -> 0% as its pipeline moved between nodes. A bar that
        # slides backwards reads as something going wrong, so the percentage only
        # ever moves forward; the stage label still shows what is actually
        # happening. (The job's *outcome* is never inferred from progress, so
        # ignoring a decrease cannot hide a failure.)
        if percent is not None and state["percent"] is not None and percent < state["percent"]:
            percent = None

        changed = (
            (step and step != state["step"])
            or detail != state["detail"]
            or (percent is not None and percent != state["percent"])
        )
        if not changed and now - state["last_write"] < PROGRESS_WRITE_INTERVAL_SECONDS:
            return

        state["last_write"] = now

        job.refresh_from_db(fields=["status"])
        if job.status == GenerationStatus.CANCELLED:
            raise _JobCancelled

        fields = {}
        if step and step != state["step"]:
            state["step"] = step
            fields["step"] = step
        if detail != state["detail"]:
            state["detail"] = detail
            fields["step_detail"] = detail
        if percent is not None and percent != state["percent"]:
            state["percent"] = percent
            fields["progress_percent"] = percent

        # Even with nothing new to report, this refreshes heartbeat_at (and
        # _touch stamps step_changed_at whenever `fields` carries a real move).
        _touch(job, **fields)

    return handle


def _usage_from_job(job_body):
    """(input_tokens, output_tokens) if the service reports them, else (None, None).
    Purely informational — a service that reports nothing is not an error."""

    if not isinstance(job_body, dict):
        return None, None

    # The live service reports these under `metrics`; `usage` is the more common
    # convention elsewhere. Both are checked before falling back to the top level.
    usage = (
        job_body.get("metrics")
        or job_body.get("usage")
        or job_body.get("token_usage")
        or job_body.get("tokens")
    )
    if not isinstance(usage, dict):
        usage = job_body

    def _read(keys):
        for key in keys:
            value = usage.get(key)
            if isinstance(value, bool):
                continue
            if isinstance(value, (int, float)) and value >= 0:
                return int(value)
        return None

    return (
        _read(("input_tokens", "prompt_tokens", "promptTokenCount", "tokens_in")),
        _read(("output_tokens", "completion_tokens", "candidatesTokenCount", "tokens_out")),
    )


def _model_from_job(job_body):
    """The model the service says it used, if it says. Recorded for traceability
    the same way the Gemini model name used to be."""
    if not isinstance(job_body, dict):
        return ""

    metrics = job_body.get("metrics")
    sources = [job_body, metrics if isinstance(metrics, dict) else {}]
    for source in sources:
        for key in ("generation_model", "model", "model_name", "model_id", "llm_model"):
            value = source.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()[:100]
    return ""


# --- Gemini single-call path (replaced by our own LLM service) ---------------
# Gemini answered the whole course in one blocking generate_course() call, so the
# retry loop wrapped the content call itself and a quota error handed back to the
# caller to try settings.AI_FALLBACK_MODEL. Our service accepts the job and
# streams progress instead, so submitting (above) and waiting (in the provider)
# are separate concerns with separate failure handling.
#
# def _call_model(job, model, prompt, step_label):
#     provider = get_provider(model=model)
#     started = time.monotonic()
#     last_transport_error = None
#
#     for attempt in range(1, MAX_TRANSPORT_ATTEMPTS + 1):
#         try:
#             return provider.generate_course(
#                 prompt, RESPONSE_SCHEMA, settings.AI_REQUEST_TIMEOUT
#             ), None
#         except ProviderQuotaError as exc:
#             logger.warning("Job %s: %s is out of quota (%s).", job.id, model, exc)
#             return None, exc
#         except ProviderTransportError as exc:
#             last_transport_error = exc
#             if attempt == MAX_TRANSPORT_ATTEMPTS:
#                 break
#             delay = _retry_delay(attempt)
#             if time.monotonic() - started + delay > TRANSPORT_RETRY_DEADLINE_SECONDS:
#                 break
#             time.sleep(delay)
#             job.refresh_from_db(fields=["status"])
#             if job.status == GenerationStatus.CANCELLED:
#                 raise _JobCancelled from exc
#             _touch(job, step=f"{step_label} (retry {attempt}/{MAX_TRANSPORT_ATTEMPTS - 1})")
#
#     return None, last_transport_error
# -----------------------------------------------------------------------------


def _run_generation(job_id):
    job = AICourseGeneration.objects.select_related("requested_by").get(pk=job_id)
    validated_data = _rehydrate_input(job.input_payload)

    _touch(
        job,
        status=GenerationStatus.RUNNING,
        step="Preparing request",
        progress_percent=5,
        started_at=timezone.now(),
    )

    try:
        # Constructing the provider is the configuration pre-check (missing
        # service URL), so a misconfigured server fails here with a clear
        # message instead of inside the retry loop.
        provider = get_course_provider()
        request_payload = build_request_payload(validated_data, rag_enabled=RAG_ENABLED)
    except ProviderError as exc:
        _fail(job, f"AI provider could not be configured: {exc}")
        return

    _touch(job, step="Sending the course brief to the AI service", progress_percent=10)

    try:
        external_job_id = _submit_with_retry(job, provider, request_payload)
    except _JobCancelled:
        return
    except (ProviderTransportError, ProviderError) as exc:
        # Both are the end of the road here — the retry budget is spent, or the
        # service rejected the request outright. ProviderTransportError does not
        # subclass ProviderError, so both have to be named. _failure_message
        # tells them apart for the admin.
        _fail(job, _failure_message(exc))
        return

    logger.info("Job %s: AI service accepted generation as job %s.", job_id, external_job_id)
    _touch(
        job,
        step="Generating course",
        progress_percent=GENERATION_PROGRESS_FLOOR,
        external_job_id=str(external_job_id)[:128],
    )

    # The long wait — and it really is unbounded: the provider follows the job
    # until the service gives a verdict, however long that takes, because this
    # thread is not holding a request open and the admin is not holding a modal
    # open either (the wizard can be closed and the banner on Admin -> Courses
    # picks the same row back up). It follows the service's SSE stream (falling
    # back to polling if it drops) and calls the handler for every update, which
    # is what keeps step/progress_percent moving and heartbeat_at fresh — there
    # is no fixed-value "still working" placeholder here any more.
    try:
        result_body = provider.await_course_job(external_job_id, on_event=_progress_handler(job))
    except _JobCancelled:
        return
    except (ProviderTransportError, ProviderError) as exc:
        _fail(job, _failure_message(exc))
        return

    job.refresh_from_db(fields=["status"])
    if job.status == GenerationStatus.CANCELLED:
        return

    input_tokens, output_tokens = _usage_from_job(result_body)
    _touch(
        job,
        step="Validating response",
        progress_percent=70,
        raw_response=json.dumps(result_body, default=str)[:RAW_RESPONSE_MAX_CHARS],
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        model_name=_model_from_job(result_body),
    )

    # The service owns its own output schema, so everything it returns is mapped
    # onto the plan shape validate_and_repair/write_course_tree already expect.
    # Anything the mapping had to guess at becomes a warning on the draft course.
    adapter_warnings = []
    plan = adapt_job_result(result_body, adapter_warnings)

    try:
        normalized_plan, warnings = validate_and_repair(
            json.dumps(plan), validated_data, settings.AI_MAX_MODULES
        )
    except PlanValidationError as exc:
        _fail(job, f"AI response could not be used: {exc}")
        return

    # First, so mapping problems are the first thing the admin reads in the
    # warnings panel — they explain anything validation then dropped.
    warnings = adapter_warnings + warnings

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
