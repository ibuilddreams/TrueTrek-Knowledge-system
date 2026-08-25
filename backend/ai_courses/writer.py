"""AI plan -> ORM tree (plan §9). Writes through the ORM directly inside a single
transaction.atomic() block rather than through HTTP or the apps' own DRF write
serializers: lessons are multipart-only and reject JSON with 415, AssignmentWriteSerializer
needs a request in context, and Quiz.status is read-only on its serializer — none of
that is usable from a background thread with no request. A failed write rolls back
every row; nothing partial is ever left in the DB for a FAILED generation (only a
PARTIAL result, decided by the caller from warnings, keeps its Course row).
"""

import re
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from assignments.models import Assignment
from common.models import Status
from common.ordering import get_next_order
from courses.models import Course, CourseInstructor
from lessons.models import Lesson
from modules.models import Module
from quizzes.models import Choice, Question, Quiz

CODE_MAX_LENGTH = 50
SLUG_MAX_LENGTH = 255


def _unique_code(title):
    base = re.sub(r"[^A-Za-z0-9]", "", title).upper()[: CODE_MAX_LENGTH - 4] or "AICOURSE"
    candidate = base
    suffix = 2
    while Course.objects.filter(code__iexact=candidate).exists():
        candidate = f"{base}{suffix}"[:CODE_MAX_LENGTH]
        suffix += 1
    return candidate


def _unique_slug(title):
    base = slugify(title)[: SLUG_MAX_LENGTH - 6] or "course"
    candidate = base
    suffix = 2
    while Course.objects.filter(slug=candidate).exists():
        candidate = f"{base}-{suffix}"[:SLUG_MAX_LENGTH]
        suffix += 1
    return candidate


def write_course_tree(normalized_plan, form_payload):
    """form_payload is GenerationRequestSerializer.validated_data (category and
    instructors are already resolved model instances/querysets). Returns the
    created Course. Raises whatever the ORM raises on a genuine DB error — the
    caller is responsible for the transaction boundary being this whole function."""

    with transaction.atomic():
        course = Course.objects.create(
            title=form_payload["title"],
            code=_unique_code(form_payload["title"]),
            slug=_unique_slug(form_payload["title"]),
            description=form_payload.get("description") or normalized_plan.get("summary", ""),
            category=form_payload["category"],
            difficulty=form_payload["difficulty"],
            amount=form_payload.get("amount") or 0,
            # status intentionally omitted — the model default (DRAFT) is exactly
            # right and must never be overridden during generation (plan §13).
        )

        for instructor in form_payload["instructors"]:
            CourseInstructor.objects.create(
                course=course, instructor=instructor, is_lead=(instructor == form_payload["instructors"][0])
            )

        weeks_between_modules = form_payload["weeks_between_modules"]
        total_lesson_minutes = 0

        for module_order, module_plan in enumerate(normalized_plan["modules"], start=1):
            module = Module.objects.create(
                course=course,
                title=module_plan["title"],
                description=module_plan["description"],
                order=module_order,
            )

            for lesson_order, lesson_plan in enumerate(module_plan["lessons"], start=1):
                minutes = lesson_plan["estimated_minutes"]
                total_lesson_minutes += minutes or 0
                Lesson.objects.create(
                    module=module,
                    title=lesson_plan["title"],
                    content_type=Lesson.ContentType.TEXT,
                    content_data=lesson_plan["body"],
                    content_format=Lesson.ContentFormat.MARKDOWN,
                    duration_minutes=minutes,
                    order=lesson_order,
                )

            quiz_plan = module_plan.get("quiz")
            if quiz_plan:
                quiz = Quiz.objects.create(
                    course=course,
                    module=module,
                    title=f"{module_plan['title']} — Quiz",
                    status=Status.DRAFT,
                    order=get_next_order(Quiz.objects.filter(module=module)),
                )
                for question_order, question_plan in enumerate(quiz_plan["questions"], start=1):
                    question = Question.objects.create(
                        quiz=quiz,
                        text=question_plan["text"],
                        question_type=question_plan["question_type"],
                        marks=question_plan["marks"],
                        order=question_order,
                    )
                    for choice_plan in question_plan["choices"]:
                        Choice.objects.create(
                            question=question,
                            text=choice_plan["text"],
                            is_correct=choice_plan["is_correct"],
                        )

            assignment_plan = module_plan.get("assignment")
            if assignment_plan:
                Assignment.objects.create(
                    course=course,
                    module=module,
                    title=f"{module_plan['title']} — Assignment",
                    description=assignment_plan["instructions"],
                    due_date=timezone.now() + timedelta(weeks=weeks_between_modules * module_order),
                    status=Status.DRAFT,
                    order=get_next_order(Assignment.objects.filter(module=module)),
                    created_by=form_payload["instructors"][0],
                )

        if total_lesson_minutes:
            course.duration_minutes = total_lesson_minutes
            course.save(update_fields=["duration_minutes"])

        return course
