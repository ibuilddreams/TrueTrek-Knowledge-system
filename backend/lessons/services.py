from django.db import transaction
from django.db.models import F

from .models import Lesson


class LessonReorderError(Exception):
    pass


def reorder_lesson(module_id, lesson_id, new_order):
    lessons = list(Lesson.objects.filter(module_id=module_id).order_by("order"))

    current_lesson = next((lesson for lesson in lessons if lesson.id == lesson_id), None)
    if current_lesson is None:
        raise LessonReorderError("Lesson does not belong to this module.")

    if new_order < 1:
        raise LessonReorderError("Order must be a positive number.")

    old_order = current_lesson.order

    if old_order != new_order:
        with transaction.atomic():
            if new_order > old_order:
                Lesson.objects.filter(
                    module_id=module_id, order__gt=old_order, order__lte=new_order
                ).update(order=F("order") - 1)
            else:
                Lesson.objects.filter(
                    module_id=module_id, order__gte=new_order, order__lt=old_order
                ).update(order=F("order") + 1)

            current_lesson.order = new_order
            current_lesson.save(update_fields=["order"])

    return (
        Lesson.objects.select_related("module", "module__course")
        .filter(module_id=module_id)
        .order_by("order")
    )
