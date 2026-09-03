"""AI-generated, personalized Daily Drill questions.

One drill = one small Gemini call, made synchronously in the request/response
cycle (same pattern as `advisor/services.py`'s live chat — a fast model,
short timeout, retry-once-on-transport-error) rather than the backgrounded
thread-and-poll pattern `ai_courses` uses for full course generation, because
a single MCQ question is a few hundred tokens, not a whole curriculum.

Persistence (`AIDrillGeneration`, unique on `(student, drill_date)`) is what
actually protects Gemini usage/cost (§10/§37 of the brief): this module is
only ever asked to generate on the *first* request for a given student+date;
every subsequent request for the same day is served from the DB with zero
provider calls, enforced by `get_or_create_ai_drill`'s pre-check plus the
model's own unique constraint as a race-condition backstop.
"""

import hashlib
import logging
import time

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Avg
from django.utils import timezone

from ai_courses.providers import get_provider
from ai_courses.providers.base import ProviderError, ProviderTransportError
from enrollments.models import Enrollment
from progress.models import CourseProgress
from quizzes.models import QuizResult

from .exceptions import DrillGenerationError
from .models import AIDrillGeneration
from .prompts.drill import RESPONSE_SCHEMA, build_prompt
from .validators import DrillValidationError, validate_and_repair_drill

logger = logging.getLogger("daily_drill")

# Same reasoning as advisor/services.py's identically-named constants: a
# transport failure that comes back almost instantly is worth one quick
# retry; one that ate the whole timeout means the provider is just slow
# right now, so retrying with the same timeout would only double the wait.
SLOW_FAILURE_THRESHOLD_SECONDS = settings.DAILY_DRILL_AI_TIMEOUT_SECONDS * 0.75
TRANSPORT_RETRY_BACKOFF_SECONDS = 1


def build_personalization_context(student):
    """Minimal, non-PII context sent to Gemini — course/topic names and
    aggregate numbers only. Deliberately excludes email, name, tokens, or any
    other account/identity data (§5 of the brief)."""

    course_titles = list(
        Enrollment.objects.filter(student=student, status=Enrollment.EnrollmentStatus.ACTIVE)
        .select_related("course")
        .values_list("course__title", flat=True)[:5]
    )

    avg_progress = CourseProgress.objects.filter(student=student).aggregate(avg=Avg("completion_percentage"))[
        "avg"
    ]
    avg_quiz_score = QuizResult.objects.filter(attempt__student=student).aggregate(avg=Avg("percentage"))["avg"]

    return {
        "enrolled_courses": course_titles,
        "average_progress_percent": round(avg_progress) if avg_progress is not None else None,
        "average_quiz_score": round(avg_quiz_score) if avg_quiz_score is not None else None,
    }


def _fingerprint(topic, question):
    digest = hashlib.sha256(f"{topic.strip().lower()}|{question.strip().lower()}".encode()).hexdigest()
    return digest[:32]


def _recent_fingerprints_and_topics(student):
    lookback_date = timezone.localdate() - timezone.timedelta(days=settings.DAILY_DRILL_VARIATION_LOOKBACK_DAYS)
    recent = AIDrillGeneration.objects.filter(student=student, drill_date__gte=lookback_date).values_list(
        "content_fingerprint", "topic", "question"
    )
    fingerprints = set()
    avoid_topics = []
    for fingerprint, topic, question in recent:
        fingerprints.add(fingerprint)
        avoid_topics.append(f"{topic}: {question[:120]}")
    return fingerprints, avoid_topics


def _call_provider(prompt):
    provider = get_provider(model=settings.AI_CHAT_MODEL)
    timeout = settings.DAILY_DRILL_AI_TIMEOUT_SECONDS

    start = time.monotonic()
    try:
        return provider.generate_course(prompt, RESPONSE_SCHEMA, timeout)
    except ProviderTransportError as exc:
        elapsed = time.monotonic() - start
        if elapsed >= SLOW_FAILURE_THRESHOLD_SECONDS:
            logger.warning("Daily Drill generation timed out after %.1fs — not retrying.", elapsed)
            raise
        logger.warning("Daily Drill generation transport error after %.1fs — retrying once.", elapsed)
        time.sleep(TRANSPORT_RETRY_BACKOFF_SECONDS)
        return provider.generate_course(prompt, RESPONSE_SCHEMA, timeout)


def _generate_once(student, avoid_topics):
    context = build_personalization_context(student)
    prompt = build_prompt(context, avoid_topics=avoid_topics)

    try:
        result = _call_provider(prompt)
    except (ProviderTransportError, ProviderError) as exc:
        raise DrillGenerationError(f"AI provider call failed: {exc}") from exc

    try:
        normalized, warnings = validate_and_repair_drill(result.text)
    except DrillValidationError as exc:
        raise DrillGenerationError(f"AI response failed validation: {exc}") from exc

    for warning in warnings:
        logger.warning("Daily Drill AI generation repair: %s", warning)

    return normalized


def generate_ai_drill(student, drill_date):
    """Calls Gemini once (with the day-to-day-variation retry described
    below) and returns a normalized drill dict — never persists anything
    itself. Raises DrillGenerationError on any failure; callers must catch
    this and fall back rather than let it propagate to the student."""

    recent_fingerprints, avoid_topics = _recent_fingerprints_and_topics(student)

    normalized = _generate_once(student, avoid_topics)
    fingerprint = _fingerprint(normalized["topic"], normalized["question"])

    if fingerprint in recent_fingerprints:
        logger.info(
            "Daily Drill generation for student %s produced a repeat of a recent drill — retrying once for variety.",
            student.pk,
        )
        try:
            retried = _generate_once(student, avoid_topics)
            retried_fingerprint = _fingerprint(retried["topic"], retried["question"])
            if retried_fingerprint not in recent_fingerprints:
                normalized, fingerprint = retried, retried_fingerprint
            # Still a repeat after retry — accept it anyway rather than loop
            # indefinitely or burn a third Gemini call for the same student/day.
        except DrillGenerationError:
            # The retry failing doesn't invalidate the first, already-valid result.
            pass

    normalized["content_fingerprint"] = fingerprint
    return normalized


def get_or_create_ai_drill(student, drill_date):
    """Returns the persisted AIDrillGeneration for (student, drill_date),
    generating and saving one via Gemini only if it doesn't exist yet.
    Returns None (never raises) if generation fails — the caller is expected
    to fall back to the legacy question bank in that case."""

    existing = AIDrillGeneration.objects.filter(student=student, drill_date=drill_date).first()
    if existing:
        return existing

    try:
        normalized = generate_ai_drill(student, drill_date)
    except DrillGenerationError as exc:
        logger.warning("Daily Drill AI generation unavailable for student %s: %s", student.pk, exc)
        return None

    try:
        return AIDrillGeneration.objects.create(
            student=student,
            drill_date=drill_date,
            title=normalized["title"],
            question=normalized["question"],
            context=normalized["context"],
            options=normalized["options"],
            correct_answer=normalized["correct_answer"],
            explanation=normalized["explanation"],
            difficulty=normalized["difficulty"],
            topic=normalized["topic"],
            content_fingerprint=normalized["content_fingerprint"],
            provider=settings.AI_PROVIDER,
            model_name=settings.AI_CHAT_MODEL,
        )
    except IntegrityError:
        # Lost a race to a concurrent request for the same (student, date) —
        # the winner's row is what we serve; our own generation is discarded
        # rather than erroring, since a duplicate persisted drill would break
        # the "one drill per student per day" guarantee.
        return AIDrillGeneration.objects.get(student=student, drill_date=drill_date)
