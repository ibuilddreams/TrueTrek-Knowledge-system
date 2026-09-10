from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from common.models import Status
from lessons.models import Lesson
from modules.models import Module
from quizzes.models import Quiz, QuizAttempt, QuizResult

from .models import CourseProgress, LearningActivity, LessonProgress, ModuleProgress

# Task 18 (Phase 5) — a module-linked quiz failed this many times (with no
# later pass) locks every module ordered after it. Matches the requirement
# literally ("if a student fails a quiz twice"). Attempts on the blocking
# quiz itself are unlimited — every retry regenerates a fresh AI question
# set (quizzes.ai_generation) — so this lock is purely about pacing progress
# past the module, never a dead end: the student can always keep retrying
# the blocking quiz to clear it.
MODULE_LOCK_FAILURE_THRESHOLD = 2


def _completion_percentage(completed_items, total_items):
    if not total_items:
        return Decimal("0")
    return Decimal(str(round(completed_items / total_items * 100, 2)))


def _recompute_module_progress(student, module):
    total_lessons = Lesson.objects.filter(module=module).count()
    completed_lessons = LessonProgress.objects.filter(
        student=student, lesson__module=module, is_completed=True
    ).count()
    total_quizzes = Quiz.objects.filter(module=module, status=Status.PUBLISHED).count()
    completed_quizzes = (
        QuizResult.objects.filter(attempt__student=student, attempt__quiz__module=module)
        .values("attempt__quiz")
        .distinct()
        .count()
    )

    total_items = total_lessons + total_quizzes
    completed_items = completed_lessons + completed_quizzes
    is_completed = total_items > 0 and completed_items >= total_items

    existing = ModuleProgress.objects.filter(student=student, module=module).first()
    completed_at = existing.completed_at if existing else None
    if is_completed and not completed_at:
        completed_at = timezone.now()
    elif not is_completed:
        completed_at = None

    ModuleProgress.objects.update_or_create(
        student=student,
        module=module,
        defaults={
            "completion_percentage": _completion_percentage(completed_items, total_items),
            "is_completed": is_completed,
            "completed_at": completed_at,
        },
    )


def _recompute_course_progress(student, course):
    total_lessons = Lesson.objects.filter(module__course=course).count()
    completed_lessons = LessonProgress.objects.filter(
        student=student, lesson__module__course=course, is_completed=True
    ).count()
    total_quizzes = Quiz.objects.filter(course=course, status=Status.PUBLISHED).count()
    completed_quizzes = (
        QuizResult.objects.filter(attempt__student=student, attempt__quiz__course=course)
        .values("attempt__quiz")
        .distinct()
        .count()
    )

    total_items = total_lessons + total_quizzes
    completed_items = completed_lessons + completed_quizzes
    is_completed = total_items > 0 and completed_items >= total_items

    existing = CourseProgress.objects.filter(student=student, course=course).first()
    completed_at = existing.completed_at if existing else None
    if is_completed and not completed_at:
        completed_at = timezone.now()
    elif not is_completed:
        completed_at = None

    CourseProgress.objects.update_or_create(
        student=student,
        course=course,
        defaults={
            "completion_percentage": _completion_percentage(completed_items, total_items),
            "is_completed": is_completed,
            "completed_at": completed_at,
        },
    )


def mark_lesson_complete(student, lesson):
    module = lesson.module
    course = module.course

    with transaction.atomic():
        lesson_progress, _ = LessonProgress.objects.update_or_create(
            student=student,
            lesson=lesson,
            defaults={"is_completed": True, "completed_at": timezone.now()},
        )
        _recompute_module_progress(student, module)
        _recompute_course_progress(student, course)
        LearningActivity.objects.create(
            student=student,
            activity_type=LearningActivity.ActivityType.LESSON_VIEW,
            course=course,
            lesson=lesson,
        )

    return lesson_progress


def get_module_lock_map(student, course):
    """Task 18 (Phase 5) — computes which modules in `course` are currently
    locked for `student`, and why. Always recomputed live from real
    QuizAttempt/QuizResult data (never stored) — same "derived, never set
    directly" convention as ModuleProgress/CourseProgress above, so a lock
    can never go stale or need a separate invalidation step when the
    student retakes and passes the blocking quiz.

    A module becomes a "blocker" once it has a PUBLISHED, module-linked quiz
    the student has failed at least MODULE_LOCK_FAILURE_THRESHOLD times with
    no later pass. Every module ordered after the *earliest* such blocker is
    locked — not just the immediately-next one — since a student can't
    validly be progressing through a module whose prerequisite module they
    were never allowed into. The blocking module itself is never locked, so
    the student can keep reviewing its lessons (the "study guide" for this
    task, per its own content) and retrying the quiz.

    Course-level quizzes (module=None) don't gate module progression — there
    is no "next module" concept for them.

    Returns {module_id: lock_info_dict} — only for locked modules; an
    unlocked module simply doesn't appear as a key.
    """
    modules = list(Module.objects.filter(course=course).order_by("order", "id"))
    if not modules:
        return {}

    module_quizzes = list(
        Quiz.objects.filter(course=course, module__isnull=False, status=Status.PUBLISHED).select_related(
            "module"
        )
    )
    if not module_quizzes:
        return {}

    quiz_ids = [quiz.id for quiz in module_quizzes]
    result_rows = QuizResult.objects.filter(
        attempt__student=student, attempt__quiz_id__in=quiz_ids
    ).values("attempt__quiz_id", "is_passed")

    failed_counts = {}
    passed_quiz_ids = set()
    for row in result_rows:
        quiz_id = row["attempt__quiz_id"]
        if row["is_passed"]:
            passed_quiz_ids.add(quiz_id)
        else:
            failed_counts[quiz_id] = failed_counts.get(quiz_id, 0) + 1

    blocking_quiz = None
    for quiz in module_quizzes:
        if quiz.id in passed_quiz_ids:
            continue
        if failed_counts.get(quiz.id, 0) >= MODULE_LOCK_FAILURE_THRESHOLD:
            if blocking_quiz is None or quiz.module.order < blocking_quiz.module.order:
                blocking_quiz = quiz

    if blocking_quiz is None:
        return {}

    attempts_used = QuizAttempt.objects.filter(student=student, quiz=blocking_quiz).count()
    reason = (
        f"You've failed \"{blocking_quiz.title}\" too many times to continue past "
        f"\"{blocking_quiz.module.title}\". Review that module's lessons, then try again — "
        "each retry gives you a freshly generated set of questions."
    )
    lock_info = {
        "blocking_module_id": blocking_quiz.module_id,
        "blocking_module_title": blocking_quiz.module.title,
        "blocking_quiz_id": blocking_quiz.id,
        "blocking_quiz_title": blocking_quiz.title,
        "attempts_used": attempts_used,
        "reason": reason,
    }

    return {
        module.id: lock_info for module in modules if module.order > blocking_quiz.module.order
    }


def get_module_lock_info(student, module):
    """None if `module` is unlocked for `student`, else the lock_info dict
    from get_module_lock_map."""
    return get_module_lock_map(student, module.course).get(module.id)


def is_module_locked(student, module):
    return get_module_lock_info(student, module) is not None
