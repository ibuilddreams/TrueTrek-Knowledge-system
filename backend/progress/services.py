from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from common.models import Status
from lessons.models import Lesson
from quizzes.models import Quiz, QuizResult

from .models import CourseProgress, LearningActivity, LessonProgress, ModuleProgress


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
