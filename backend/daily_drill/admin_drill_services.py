"""Student-facing progress tracking for admin-scheduled video Daily Drills:
video-watch reporting and quiz grading/completion. Schedule CRUD validation
(the future-date rule) lives in `serializers.py`, mirroring how other apps in
this codebase (assignments, lessons) validate business rules at the
serializer layer rather than a separate service module.
"""

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from rewards.models import PointsTransaction
from rewards.services import award_points

from .exceptions import QuizSubmissionError, VideoProgressError
from .models import AdminDrillProgress, AdminDrillSchedule


def _get_todays_published_schedule(schedule_id):
    try:
        schedule = AdminDrillSchedule.objects.get(pk=schedule_id)
    except AdminDrillSchedule.DoesNotExist:
        return None
    if schedule.status != "PUBLISHED" or schedule.scheduled_date != timezone.localdate():
        return None
    return schedule


def record_video_progress(student, schedule_id, progress_percent):
    schedule = _get_todays_published_schedule(schedule_id)
    if schedule is None:
        raise VideoProgressError("This Daily Drill is not currently active.")

    progress_percent = max(0, min(100, int(progress_percent)))

    with transaction.atomic():
        progress, _ = AdminDrillProgress.objects.select_for_update().get_or_create(
            student=student, schedule=schedule
        )
        # Never let a rewind/replay report a lower watched percentage than
        # what was already recorded — the quiz-unlock threshold is a
        # high-water mark, not the latest playhead position.
        if progress_percent > progress.video_progress_percent:
            progress.video_progress_percent = progress_percent
            progress.save(update_fields=["video_progress_percent", "updated_at"])

    return progress


def submit_admin_drill_quiz(student, schedule_id, answers):
    """`answers` is a list of {"question_id": int, "choice_id": int}. Grades
    against the schedule's quiz. This is a **one-shot** submission — like the
    AI_QUESTION and LEGACY_QUESTION sources, there is no retry: the progress
    row is marked COMPLETED on this single submission regardless of outcome,
    and `reward_points` are awarded exactly once only if the score meets
    `passing_score_percent` (guarded by the atomic status check below, the
    same shape as `rewards.services.redeem_reward`'s locked-row pattern). A
    later resubmission is always rejected, pass or fail.
    """

    schedule = _get_todays_published_schedule(schedule_id)
    if schedule is None:
        raise QuizSubmissionError("This Daily Drill is not currently active.")

    questions = list(schedule.quiz_questions.prefetch_related("choices").all())
    if not questions:
        raise QuizSubmissionError("This Daily Drill has no quiz configured.")

    with transaction.atomic():
        progress, _ = AdminDrillProgress.objects.select_for_update().get_or_create(
            student=student, schedule=schedule
        )

        if progress.status == AdminDrillProgress.ProgressStatus.COMPLETED:
            raise QuizSubmissionError("You have already completed this Daily Drill.")

        if progress.video_progress_percent < settings.DAILY_DRILL_VIDEO_WATCH_THRESHOLD_PERCENT:
            raise QuizSubmissionError(
                f"Watch at least {settings.DAILY_DRILL_VIDEO_WATCH_THRESHOLD_PERCENT}% of the video "
                "before submitting the quiz."
            )

        answers_by_question = {}
        for entry in answers or []:
            question_id = entry.get("question_id")
            choice_id = entry.get("choice_id")
            if question_id is not None and choice_id is not None:
                answers_by_question[int(question_id)] = int(choice_id)

        correct_count = 0
        for question in questions:
            chosen_choice_id = answers_by_question.get(question.id)
            if chosen_choice_id is None:
                continue
            chosen_choice = next((c for c in question.choices.all() if c.id == chosen_choice_id), None)
            if chosen_choice is not None and chosen_choice.is_correct:
                correct_count += 1

        score_percent = round((correct_count / len(questions)) * 100)
        passed = score_percent >= schedule.passing_score_percent

        progress.quiz_answers = [
            {"question_id": qid, "choice_id": cid} for qid, cid in answers_by_question.items()
        ]
        progress.score_percent = score_percent
        progress.attempts_count += 1
        progress.status = AdminDrillProgress.ProgressStatus.COMPLETED
        progress.completed_at = timezone.now()
        if passed:
            progress.points_awarded = schedule.reward_points
        progress.save(
            update_fields=[
                "quiz_answers", "score_percent", "attempts_count",
                "status", "completed_at", "points_awarded", "updated_at",
            ]
        )

        if passed and schedule.reward_points > 0:
            award_points(
                student=student,
                amount=schedule.reward_points,
                transaction_type=PointsTransaction.TransactionType.DRILL_REWARD,
                reason=f"Daily Drill completed: {schedule.title}",
                admin_drill_progress=progress,
            )

    return progress, passed
