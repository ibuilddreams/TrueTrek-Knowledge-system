from django.db import transaction

from .models import Module


class ModuleReorderError(Exception):
    pass


def reorder_modules(course_id, modules_data):
    module_ids = [entry["module_id"] for entry in modules_data]

    if len(module_ids) != len(set(module_ids)):
        raise ModuleReorderError("Duplicate module ids are not allowed.")

    orders = [entry["order"] for entry in modules_data]
    if len(orders) != len(set(orders)):
        raise ModuleReorderError("Duplicate order values are not allowed.")

    existing_ids = set(Module.objects.filter(course_id=course_id).values_list("id", flat=True))
    if set(module_ids) != existing_ids:
        raise ModuleReorderError(
            "Submitted module ids must exactly match the modules belonging to this course."
        )

    with transaction.atomic():
        for entry in modules_data:
            Module.objects.filter(pk=entry["module_id"], course_id=course_id).update(order=entry["order"])

    return Module.objects.select_related("course").filter(course_id=course_id).order_by("order")
