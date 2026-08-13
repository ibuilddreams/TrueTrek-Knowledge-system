from datetime import timedelta

from django.db import IntegrityError
from django.db.models import Avg, Count, Sum
from django.utils import timezone

from common.models import Status

from .models import DrillAttempt, DrillOption, DrillQuestion
from .serializers import DrillQuestionSerializer


class DrillAlreadyAttemptedError(Exception):
    pass


class InvalidDrillOptionError(Exception):
    pass


def get_todays_question():
    """Deterministic "question of the day" — same question for every student,
    rotating through the published bank by calendar day. No scheduler needed:
    the day's index is derived from the date itself, not stored anywhere."""
    questions = DrillQuestion.objects.filter(status=Status.PUBLISHED).order_by("id")
    total = questions.count()
    if not total:
        return None
    index = timezone.localdate().toordinal() % total
    return questions[index]


def compute_streak(student):
    """Consecutive-day streak ending today, computed from the attempt log
    rather than stored — a missed day breaks it the next time it's read."""
    attempt_dates = set(
        DrillAttempt.objects.filter(student=student).values_list("attempt_date", flat=True)
    )
    if not attempt_dates:
        return 0

    cursor = timezone.localdate()
    if cursor not in attempt_dates:
        cursor -= timedelta(days=1)

    streak = 0
    while cursor in attempt_dates:
        streak += 1
        cursor -= timedelta(days=1)

    return streak


def get_drill_stats(student):
    aggregates = DrillAttempt.objects.filter(student=student).aggregate(
        total_points=Sum("xp_earned"),
        avg_score=Avg("score_awarded"),
        attempts_count=Count("id"),
    )
    avg_score = aggregates["avg_score"]

    return {
        "points": aggregates["total_points"] or 0,
        "streak": compute_streak(student),
        "aggregate_score": round(avg_score) if avg_score is not None else 0,
        "attempts_count": aggregates["attempts_count"] or 0,
    }


def record_attempt(student, question, option_id):
    today = timezone.localdate()

    if DrillAttempt.objects.filter(student=student, attempt_date=today).exists():
        raise DrillAlreadyAttemptedError("You have already completed today's drill.")

    try:
        option = question.options.get(id=option_id)
    except DrillOption.DoesNotExist:
        raise InvalidDrillOptionError("Selected option does not belong to today's drill.")

    is_perfect = option.score == 100
    xp_earned = option.score * 2 + (100 if is_perfect else 0)

    try:
        attempt = DrillAttempt.objects.create(
            student=student,
            question=question,
            selected_option=option,
            attempt_date=today,
            score_awarded=option.score,
            xp_earned=xp_earned,
        )
    except IntegrityError:
        # Lost a race to a duplicate submit for the same day.
        raise DrillAlreadyAttemptedError("You have already completed today's drill.")

    return attempt


def build_drill_payload(student, question, attempt):
    selected_option_id = attempt.selected_option_id if attempt else None
    question_data = DrillQuestionSerializer(
        question, context={"selected_option_id": selected_option_id}
    ).data

    return {
        "question": question_data,
        "attempted": attempt is not None,
        "score_awarded": attempt.score_awarded if attempt else None,
        "xp_earned": attempt.xp_earned if attempt else None,
        "stats": get_drill_stats(student),
    }
