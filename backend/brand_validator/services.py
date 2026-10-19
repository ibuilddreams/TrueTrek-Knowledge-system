"""Brand Validator — runs a media kit through the AI provider.

Mirrors `ai_courses.services`: the row is created up front, a daemon thread
does the work, and the frontend polls. The provider is reached through
`ai_courses.providers.get_provider()` (Gemini) rather than a second factory,
because this *is* a prompt-based structured-output call — the job-API split
described in CLAUDE.md applies only to course generation.
"""

import base64
import json
import logging
import threading
import time

from django.conf import settings
from django.db import close_old_connections
from django.utils import timezone

from ai_courses.providers import get_provider
from ai_courses.providers.base import ProviderError, ProviderQuotaError, ProviderTransportError

from .models import MediaKitReview
from .prompts import RESPONSE_SCHEMA, build_prompt
from .validators import normalize_review_payload

logger = logging.getLogger("brand_validator")

# A one-page PDF/image critique is a small job, but it is multimodal and the
# model has to actually read the page — more generous than advisor chat's 15s,
# far below course generation's budget.
REVIEW_TIMEOUT_SECONDS = 90
REVIEW_TEMPERATURE = 0.4

# One running review per student at a time. The real reason is cost and
# fairness rather than correctness: nothing breaks if two run at once, but a
# student holding the upload button should not be able to fan out N model
# calls. Checked against the DB, so it holds across gunicorn workers in a way
# the throttle cannot.
MAX_IN_FLIGHT_PER_STUDENT = 1

# A media kit review runs on a background thread while the browser polls, so
# unlike advisor chat (where a human is watching a spinner and a slow retry
# just doubles their wait) there is no cost to being patient here. Gemini
# returns a transient 503 often enough that a single un-retried attempt was
# failing real reviews outright — see _call_provider.
MAX_TRANSPORT_ATTEMPTS = 3
TRANSPORT_BACKOFF_SECONDS = (2, 5)

_ACTIVE_STATUSES = (MediaKitReview.ReviewStatus.PENDING, MediaKitReview.ReviewStatus.PROCESSING)


class MediaKitReviewError(Exception):
    """Message is safe to show the student."""


def has_review_in_flight(student):
    return (
        MediaKitReview.objects.filter(student=student, status__in=_ACTIVE_STATUSES).count()
        >= MAX_IN_FLIGHT_PER_STUDENT
    )


def start_review(*, student, file, original_name, mime_type, athlete_context=""):
    """Creates the review row and kicks off the background thread."""
    if has_review_in_flight(student):
        raise MediaKitReviewError(
            "You already have a media kit being reviewed. Wait for it to finish before uploading another."
        )

    review = MediaKitReview.objects.create(
        student=student,
        file=file,
        original_name=original_name,
        file_size=getattr(file, "size", None),
        athlete_context=athlete_context or "",
        status=MediaKitReview.ReviewStatus.PENDING,
    )

    thread = threading.Thread(target=_run_review_safe, args=(review.id, mime_type), daemon=True)
    thread.start()

    return review


def _read_file_part(review, mime_type):
    with review.file.open("rb") as handle:
        raw = handle.read()
    return {"mime_type": mime_type, "data_base64": base64.b64encode(raw).decode("ascii")}


def _run_review_safe(review_id, mime_type):
    """Thread entrypoint. Every exit path must leave the row in a terminal
    state — a review stuck on PROCESSING would poll forever in the browser —
    so the bare `except` here is deliberate and always writes FAILED."""
    close_old_connections()
    try:
        _run_review(review_id, mime_type)
    except Exception as exc:  # noqa: BLE001 - see docstring
        logger.exception("Media kit review %s crashed", review_id)
        MediaKitReview.objects.filter(pk=review_id).update(
            status=MediaKitReview.ReviewStatus.FAILED,
            error_message=str(exc)[:500],
            completed_at=timezone.now(),
        )
    finally:
        close_old_connections()


def _call_provider(provider, prompt, file_part, review_id):
    """Calls the model, retrying a transport failure.

    Only `ProviderTransportError` is retried — it means the request never got
    a verdict (timeout, connection reset, 5xx), so trying again is free of
    side effects. A `ProviderError` means the request itself was refused and
    a `ProviderQuotaError` means this model's quota is spent; re-sending
    either would just bill the same failure twice, so both propagate
    immediately.
    """
    last_error = None

    for attempt in range(MAX_TRANSPORT_ATTEMPTS):
        try:
            return provider.generate_course(
                prompt, RESPONSE_SCHEMA, timeout=REVIEW_TIMEOUT_SECONDS, files=[file_part]
            )
        except ProviderTransportError as exc:
            last_error = exc
            if attempt < MAX_TRANSPORT_ATTEMPTS - 1:
                backoff = TRANSPORT_BACKOFF_SECONDS[attempt]
                logger.warning(
                    "Media kit review %s transport error (attempt %s/%s): %s — retrying in %ss",
                    review_id, attempt + 1, MAX_TRANSPORT_ATTEMPTS, exc, backoff,
                )
                time.sleep(backoff)

    raise last_error


def _run_review(review_id, mime_type):
    review = MediaKitReview.objects.get(pk=review_id)
    review.status = MediaKitReview.ReviewStatus.PROCESSING
    review.started_at = timezone.now()
    review.save(update_fields=["status", "started_at", "updated_at"])

    provider = get_provider()
    prompt = build_prompt(athlete_context=review.athlete_context)

    try:
        file_part = _read_file_part(review, mime_type)
    except (OSError, ValueError) as exc:
        _fail(review, "We couldn't read that file. Please re-upload your media kit.")
        logger.warning("Media kit review %s could not read its file: %s", review_id, exc)
        return

    try:
        result = _call_provider(provider, prompt, file_part, review_id)
    except ProviderQuotaError:
        _fail(review, "The review service is at capacity right now. Please try again a little later.")
        return
    except ProviderTransportError as exc:
        logger.warning("Media kit review %s gave up after transport errors: %s", review_id, exc)
        _fail(review, "We couldn't reach the review service. Please try again in a moment.")
        return
    except ProviderError as exc:
        logger.error("Media kit review %s provider error: %s", review_id, exc)
        _fail(review, "The review service couldn't process that media kit. Please try again.")
        return

    try:
        payload = json.loads(result.text)
    except (TypeError, ValueError) as exc:
        logger.error("Media kit review %s returned non-JSON: %s", review_id, exc)
        _fail(review, "The review came back in an unreadable format. Please try again.")
        return

    try:
        fields = normalize_review_payload(payload)
    except ValueError as exc:
        _fail(review, str(exc))
        return

    for key, value in fields.items():
        setattr(review, key, value)
    review.status = MediaKitReview.ReviewStatus.COMPLETED
    review.provider = settings.AI_PROVIDER
    review.model_name = settings.AI_MODEL
    review.completed_at = timezone.now()
    review.error_message = ""
    review.save()

    return review


def _fail(review, message):
    review.status = MediaKitReview.ReviewStatus.FAILED
    review.error_message = message
    review.completed_at = timezone.now()
    review.save(update_fields=["status", "error_message", "completed_at", "updated_at"])
