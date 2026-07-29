from django.db import transaction

from .models import Lesson


class LessonReorderError(Exception):
    pass


def reorder_lessons(module_id, lessons_data):
    lesson_ids = [entry["lesson_id"] for entry in lessons_data]

    if len(lesson_ids) != len(set(lesson_ids)):
        raise LessonReorderError("Duplicate lesson ids are not allowed.")

    orders = [entry["order"] for entry in lessons_data]
    if len(orders) != len(set(orders)):
        raise LessonReorderError("Duplicate order values are not allowed.")

    existing_ids = set(Lesson.objects.filter(module_id=module_id).values_list("id", flat=True))
    if set(lesson_ids) != existing_ids:
        raise LessonReorderError(
            "Submitted lesson ids must exactly match the lessons belonging to this module."
        )

    with transaction.atomic():
        for entry in lessons_data:
            Lesson.objects.filter(pk=entry["lesson_id"], module_id=module_id).update(order=entry["order"])

    return (
        Lesson.objects.select_related("module", "module__course")
        .filter(module_id=module_id)
        .order_by("order")
    )
