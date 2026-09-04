"""Orchestrates AI-graded assignment review: builds the prompt, calls the
shared AIProvider, validates the response, persists an audit-trail
AssignmentAIReview row per attempt, and grades the submission from the
backend-computed score. This is a purely academic marks/scoring feature —
it never touches the rewards app.

Concurrency/idempotency: the parent AssignmentSubmission row is locked
(select_for_update) to serialize concurrent submit-for-review calls for the
same student+assignment — this app has no single mutable "the review" row to
lock (AssignmentAIReview is append-only, one row per attempt, kept as an
audit trail), so the lock lives on the row that already uniquely identifies
"this student's work on this assignment" (unique_together=(assignment,
student)). The AI provider call itself always happens OUTSIDE any DB lock.
"""

import logging
import time
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from ai_courses.providers import get_provider
from ai_courses.providers.base import ProviderError, ProviderTransportError

from ..models import Assignment, AssignmentAIReview, AssignmentSubmission
from ..services import grade_submission
from .exceptions import AIReviewAlreadyProcessingError, AIReviewValidationError, NoReadableContentError
from .extraction import extract_reference_content, extract_submission_content
from .prompts import RESPONSE_SCHEMA, build_prompt
from .validators import validate_and_repair_review

logger = logging.getLogger("assignments.ai_review")

ReviewStatus = AssignmentAIReview.ReviewStatus

# Unlike advisor/services.py and daily_drill/ai_generation.py, a transport
# failure here always gets one retry, even if it consumed the full timeout.
# Those other call sites assume a slow failure means the provider is
# uniformly slow right now (so retrying would just double an already-long
# wait for a likely-identical outcome) — but real-world testing here showed
# the opposite pattern: some grading calls fail on a full timeout while
# concurrent/adjacent calls of the same size succeed quickly, which points to
# occasional per-request stalls rather than sustained slowness. A retry has a
# real chance of avoiding the same stall, and the cost is only paid in the
# failure case, which was already a bad outcome for the student.
TRANSPORT_RETRY_BACKOFF_SECONDS = 1

# One generic, safe message covers every AI-side failure mode (provider down,
# timeout, malformed response, unreadable file) per Task 13/21's required
# copy — never a raw provider error, stack trace, or internal detail.
AI_REVIEW_UNAVAILABLE_MESSAGE = (
    "Your submission was saved, but the AI review is taking longer than expected "
    "or is temporarily unavailable. Please try again shortly. If the problem "
    "continues, make sure your file is a supported format (PDF, DOCX, JPG, PNG, "
    "WEBP, or a plain-text/source file such as .txt or .cpp)."
)


def _round_half_up(value):
    return int(Decimal(str(value)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _call_provider(prompt, inline_files):
    provider = get_provider(model=settings.AI_CHAT_MODEL)
    timeout = settings.AI_GRADING_TIMEOUT_SECONDS

    start = time.monotonic()
    try:
        return provider.generate_course(prompt, RESPONSE_SCHEMA, timeout, files=inline_files)
    except ProviderTransportError:
        elapsed = time.monotonic() - start
        logger.warning("AI assignment review transport error after %.1fs — retrying once.", elapsed)
        time.sleep(TRANSPORT_RETRY_BACKOFF_SECONDS)
        return provider.generate_course(prompt, RESPONSE_SCHEMA, timeout, files=inline_files)


def _fail(review, internal_message):
    review.status = ReviewStatus.FAILED
    review.error_message = internal_message
    review.finished_at = timezone.now()
    review.save(update_fields=["status", "error_message", "finished_at", "updated_at"])
    logger.warning(
        "AI review #%s for submission %s failed: %s",
        review.attempt_number,
        review.submission_id,
        internal_message,
    )
    return review


def submit_for_ai_review(submission):
    """Runs (or re-runs, for retry) one AI grading attempt for `submission`.

    Always returns an AssignmentAIReview — never raises for an AI-side
    failure (provider error, timeout, malformed response, unreadable
    file(s)): those are captured on the returned review
    (status=FAILED, error_message) so the caller can always report success
    on the submission itself (Task 15: "AI failure != submission failure").
    Only AIReviewAlreadyProcessingError propagates, for a genuine
    concurrent-processing conflict.
    """

    if submission.assignment.grading_mode != Assignment.GradingMode.AI:
        raise ValueError("submit_for_ai_review called for a non-AI-graded assignment.")

    with transaction.atomic():
        # select_for_update() can't be combined with select_related() across
        # the nullable joins here (assignment.module, the reverse-o2o
        # assignment.rubric) — Postgres rejects "FOR UPDATE" on the nullable
        # side of an outer join. `of=("self",)` locks only the submission
        # row itself; the related assignment/rubric/student objects are then
        # fetched normally (unlocked) via ordinary attribute access below —
        # they're read-only config here, not what this lock protects.
        submission = (
            AssignmentSubmission.objects.select_for_update(of=("self",))
            .select_related("assignment__course", "assignment__module", "assignment__rubric", "student")
            .get(pk=submission.pk)
        )

        # A review stuck at PROCESSING well past any real request's possible
        # duration (timeout + one retry) means the worker handling it died
        # mid-call rather than that a review is genuinely still running —
        # without this staleness cutoff, that row would permanently block
        # every future submit/retry for this student+assignment with no way
        # to recover (Task 15: AI unavailability must never permanently
        # block a student).
        stale_cutoff = timezone.now() - timedelta(seconds=settings.AI_GRADING_TIMEOUT_SECONDS * 3)
        if submission.ai_reviews.filter(
            Q(started_at__isnull=True) | Q(started_at__gt=stale_cutoff), status=ReviewStatus.PROCESSING
        ).exists():
            raise AIReviewAlreadyProcessingError(
                "An AI review is already in progress for this submission."
            )

        # A prior completed review does NOT block a new attempt — the student
        # may keep improving and resubmitting. Each resubmission simply
        # produces a fresh, independent academic evaluation that immediately
        # re-grades the submission from its own computed score.
        latest = submission.ai_reviews.first()  # Meta.ordering = ("submission", "-attempt_number")

        review = AssignmentAIReview.objects.create(
            submission=submission,
            attempt_number=(latest.attempt_number + 1 if latest else 1),
            status=ReviewStatus.PROCESSING,
            started_at=timezone.now(),
            provider=settings.AI_PROVIDER,
            model_name=settings.AI_CHAT_MODEL,
        )

    rubric = getattr(submission.assignment, "rubric", None)
    if rubric is None or not rubric.criteria.exists():
        return _fail(review, "Assignment has no configured grading rubric/questions.")

    try:
        sub_inline, sub_text_blocks, sub_unreadable = extract_submission_content(submission)
    except NoReadableContentError as exc:
        return _fail(review, str(exc))

    ref_inline, ref_text_blocks, ref_unreadable = extract_reference_content(submission.assignment)

    prompt = build_prompt(
        submission.assignment,
        rubric,
        sub_text_blocks,
        sub_unreadable,
        reference_texts=ref_text_blocks,
        reference_unreadable=ref_unreadable,
    )
    inline_files = ref_inline + sub_inline

    try:
        result = _call_provider(prompt, inline_files)
    except (ProviderTransportError, ProviderError) as exc:
        return _fail(review, str(exc))

    try:
        normalized, warnings = validate_and_repair_review(result.text, list(rubric.criteria.all()))
    except AIReviewValidationError as exc:
        return _fail(review, str(exc))

    for warning in warnings:
        logger.warning("AI review #%s repair: %s", review.attempt_number, warning)

    criteria_results = normalized["criteria_results"]
    total_max = sum(item["max_marks"] for item in criteria_results)
    total_awarded = sum(Decimal(str(item["awarded_marks"])) for item in criteria_results)
    percentage = (total_awarded / total_max * 100) if total_max else Decimal("0")

    with transaction.atomic():
        review.status = ReviewStatus.COMPLETED
        review.score = percentage
        review.feedback = normalized["feedback"]
        review.criteria_results = criteria_results
        review.strengths = normalized["strengths"]
        review.improvements = normalized["improvements"]
        review.finished_at = timezone.now()
        review.save()

        # Single-pass grading: a COMPLETED review always immediately grades
        # the submission from its computed score — no pass/revision-required
        # verdict or threshold gating (matches quiz short-answer AI grading).
        assignment = submission.assignment
        marks = _round_half_up((percentage / Decimal("100")) * assignment.total_marks)
        grade_submission(submission, grader=None, marks=marks, feedback=review.feedback)

    return review
