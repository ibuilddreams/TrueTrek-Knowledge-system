from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Avg, Count, Sum
from django.utils import timezone

from common.image import build_absolute_image_url
from common.models import Status
from rewards.models import PointsTransaction
from rewards.services import award_points

from .ai_generation import get_or_create_ai_drill
from .exceptions import DrillAlreadyAttemptedError, DrillUnavailableError, InvalidDrillOptionError
from .models import AdminDrillProgress, AdminDrillSchedule, AIDrillGeneration, DrillAttempt, DrillOption, DrillQuestion
from .serializers import DrillQuestionSerializer

# Re-exported for backward compatibility — views.py and tests previously
# imported these two exceptions directly from this module.
__all__ = [
    "DrillAlreadyAttemptedError",
    "InvalidDrillOptionError",
    "get_todays_question",
    "compute_streak",
    "get_drill_stats",
    "record_attempt",
    "resolve_todays_drill",
    "build_todays_drill_payload",
    "submit_single_question_answer",
]


def get_todays_question():
    """Deterministic "question of the day" from the legacy static bank — same
    question for every student, rotating by calendar day. This is no longer
    the primary Daily Drill source (see `resolve_todays_drill` below); it now
    only serves as the last-resort fallback when neither an admin-scheduled
    drill nor an AI generation is available for today."""
    questions = DrillQuestion.objects.filter(status=Status.PUBLISHED).order_by("id")
    total = questions.count()
    if not total:
        return None
    index = timezone.localdate().toordinal() % total
    return questions[index]


def compute_streak(student):
    """Consecutive-day streak ending today, unioned across all three Daily
    Drill sources a student may have completed on any given day (only one of
    the three is ever active per day, but a student's history can span all
    three over time as admin schedules/AI availability change)."""
    legacy_dates = set(DrillAttempt.objects.filter(student=student).values_list("attempt_date", flat=True))
    ai_dates = set(
        AIDrillGeneration.objects.filter(student=student, is_completed=True).values_list(
            "drill_date", flat=True
        )
    )
    admin_dates = set(
        AdminDrillProgress.objects.filter(
            student=student, status=AdminDrillProgress.ProgressStatus.COMPLETED
        ).values_list("schedule__scheduled_date", flat=True)
    )
    attempt_dates = legacy_dates | ai_dates | admin_dates
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
    """`points` is the lifetime sum of every DRILL_REWARD transaction in the
    rewards ledger — the single source of truth now that all three Daily
    Drill sources award through the same `rewards.services.award_points`
    path. `aggregate_score` normalizes each source's notion of "score" onto a
    0-100 scale and averages across every completion, regardless of source."""
    total_points = (
        PointsTransaction.objects.filter(
            student=student, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
        ).aggregate(total=Sum("amount"))["total"]
        or 0
    )

    legacy_agg = DrillAttempt.objects.filter(student=student).aggregate(
        score_sum=Sum("score_awarded"), count=Count("id")
    )
    ai_completions = list(
        AIDrillGeneration.objects.filter(student=student, is_completed=True).values_list(
            "selected_key", "correct_answer"
        )
    )
    ai_score_sum = sum(100 for selected, correct in ai_completions if selected == correct)
    admin_agg = AdminDrillProgress.objects.filter(
        student=student, status=AdminDrillProgress.ProgressStatus.COMPLETED
    ).aggregate(score_sum=Sum("score_percent"), count=Count("id"))

    total_count = (legacy_agg["count"] or 0) + len(ai_completions) + (admin_agg["count"] or 0)
    total_score = (legacy_agg["score_sum"] or 0) + ai_score_sum + (admin_agg["score_sum"] or 0)

    return {
        "points": total_points,
        "streak": compute_streak(student),
        "aggregate_score": round(total_score / total_count) if total_count else 0,
        "attempts_count": total_count,
    }


def record_attempt(student, question, option_id):
    """Legacy submission path — unchanged since before Phase 1's AI/admin
    Daily Drill work, kept exactly as-is (including its own score-scaled XP
    formula) as the fallback-of-last-resort's completion recorder."""
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
        with transaction.atomic():
            attempt = DrillAttempt.objects.create(
                student=student,
                question=question,
                selected_option=option,
                attempt_date=today,
                score_awarded=option.score,
                xp_earned=xp_earned,
            )
            if xp_earned > 0:
                award_points(
                    student=student,
                    amount=xp_earned,
                    transaction_type=PointsTransaction.TransactionType.DRILL_REWARD,
                    reason=f"Daily Drill completed ({option.score}% score)",
                    drill_attempt=attempt,
                )
    except IntegrityError:
        # Lost a race to a duplicate submit for the same day.
        raise DrillAlreadyAttemptedError("You have already completed today's drill.")

    return attempt


def resolve_todays_drill(student, drill_date=None):
    """The single backend-owned source of truth for "what is today's Daily
    Drill for this student" — the frontend never decides this. Priority:

        1. An admin-scheduled, PUBLISHED video drill for this date, if any.
        2. Otherwise, this student's AI-generated drill for this date
           (generated on first request, then persisted — see ai_generation.py).
        3. If AI generation is unavailable, the legacy static question bank.
        4. If none of the above produce anything, "UNAVAILABLE".

    Returns (source, obj) where source is one of "ADMIN_VIDEO", "AI_QUESTION",
    "LEGACY_QUESTION", "UNAVAILABLE" and obj is the corresponding model
    instance (or None for UNAVAILABLE).
    """
    drill_date = drill_date or timezone.localdate()

    schedule = AdminDrillSchedule.objects.filter(scheduled_date=drill_date, status=Status.PUBLISHED).first()
    if schedule is not None:
        return "ADMIN_VIDEO", schedule

    generation = get_or_create_ai_drill(student, drill_date)
    if generation is not None:
        return "AI_QUESTION", generation

    question = get_todays_question()
    if question is not None:
        return "LEGACY_QUESTION", question

    return "UNAVAILABLE", None


def _build_admin_video_payload(student, schedule, request=None):
    progress = AdminDrillProgress.objects.filter(student=student, schedule=schedule).first()
    quiz_questions = [
        {
            "id": question.id,
            "text": question.text,
            "choices": [{"id": choice.id, "text": choice.text} for choice in question.choices.all()],
        }
        for question in schedule.quiz_questions.prefetch_related("choices").all()
    ]

    if progress is None:
        progress_data = {
            "status": "NOT_STARTED",
            "video_progress_percent": 0,
            "quiz_unlocked": False,
            "attempts_count": 0,
            "score_percent": None,
            "points_awarded": 0,
        }
    else:
        progress_data = {
            "status": progress.status,
            "video_progress_percent": progress.video_progress_percent,
            "quiz_unlocked": progress.video_progress_percent >= settings.DAILY_DRILL_VIDEO_WATCH_THRESHOLD_PERCENT,
            "attempts_count": progress.attempts_count,
            "score_percent": progress.score_percent,
            "points_awarded": progress.points_awarded,
        }

    return {
        "type": "ADMIN_VIDEO",
        "schedule_id": schedule.id,
        "title": schedule.title,
        "description": schedule.description,
        "video_url": schedule.video_url,
        "file_url": build_absolute_image_url(request, schedule.file) if schedule.file else None,
        "reward_points": schedule.reward_points,
        "passing_score_percent": schedule.passing_score_percent,
        "video_watch_threshold_percent": settings.DAILY_DRILL_VIDEO_WATCH_THRESHOLD_PERCENT,
        "quiz_questions": quiz_questions,
        "progress": progress_data,
    }


def _build_ai_question_payload(generation):
    attempted = generation.is_completed
    return {
        "type": "AI_QUESTION",
        "generation_id": generation.id,
        "title": generation.title,
        "question": generation.question,
        "context": generation.context,
        "difficulty": generation.difficulty,
        "topic": generation.topic,
        "options": generation.options,
        "attempted": attempted,
        "selected_key": generation.selected_key or None,
        "correct_answer": generation.correct_answer if attempted else None,
        "explanation": generation.explanation if attempted else None,
        "points_awarded": generation.points_awarded,
    }


def _build_legacy_question_payload(student, question):
    attempt = DrillAttempt.objects.filter(student=student, attempt_date=timezone.localdate()).first()
    selected_option_id = attempt.selected_option_id if attempt else None
    question_data = DrillQuestionSerializer(question, context={"selected_option_id": selected_option_id}).data

    return {
        "type": "LEGACY_QUESTION",
        "question": question_data,
        "attempted": attempt is not None,
        "score_awarded": attempt.score_awarded if attempt else None,
        "xp_earned": attempt.xp_earned if attempt else None,
    }


def build_todays_drill_payload(student, request=None):
    drill_date = timezone.localdate()
    source, obj = resolve_todays_drill(student, drill_date)

    if source == "ADMIN_VIDEO":
        content = _build_admin_video_payload(student, obj, request=request)
    elif source == "AI_QUESTION":
        content = _build_ai_question_payload(obj)
    elif source == "LEGACY_QUESTION":
        content = _build_legacy_question_payload(student, obj)
    else:
        content = {"type": "UNAVAILABLE"}

    return {
        **content,
        "drill_date": drill_date.isoformat(),
        "streak": compute_streak(student),
        "stats": get_drill_stats(student),
    }


def submit_single_question_answer(student, answer_key):
    """Handles submission for the two single-MCQ sources (AI_QUESTION and
    LEGACY_QUESTION) — ADMIN_VIDEO drills are submitted through
    `admin_drill_services.submit_admin_drill_quiz` instead, since their shape
    (multi-question quiz + video gate) is genuinely different."""
    drill_date = timezone.localdate()
    source, obj = resolve_todays_drill(student, drill_date)

    if source == "AI_QUESTION":
        generation = obj
        option_keys = {option["key"] for option in generation.options}
        if answer_key not in option_keys:
            raise InvalidDrillOptionError("Selected option does not belong to today's drill.")

        with transaction.atomic():
            locked = AIDrillGeneration.objects.select_for_update().get(pk=generation.pk)
            if locked.is_completed:
                raise DrillAlreadyAttemptedError("You have already completed today's drill.")

            is_correct = answer_key == locked.correct_answer
            points = settings.DAILY_DRILL_DEFAULT_AI_REWARD_POINTS if is_correct else 0
            locked.is_completed = True
            locked.selected_key = answer_key
            locked.points_awarded = points
            locked.completed_at = timezone.now()
            locked.save(
                update_fields=["is_completed", "selected_key", "points_awarded", "completed_at", "updated_at"]
            )
            if points > 0:
                award_points(
                    student=student,
                    amount=points,
                    transaction_type=PointsTransaction.TransactionType.DRILL_REWARD,
                    reason=f"Daily Drill completed: {locked.title}",
                    ai_drill_generation=locked,
                )

        return "AI_QUESTION", locked

    if source == "LEGACY_QUESTION":
        question = obj
        try:
            option = question.options.get(key=answer_key)
        except DrillOption.DoesNotExist:
            raise InvalidDrillOptionError("Selected option does not belong to today's drill.")
        attempt = record_attempt(student, question, option.id)
        return "LEGACY_QUESTION", attempt

    if source == "ADMIN_VIDEO":
        raise InvalidDrillOptionError("Today's Daily Drill is a video — submit the quiz instead.")

    raise DrillUnavailableError("No Daily Drill is available today.")
