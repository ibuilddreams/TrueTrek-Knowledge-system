from django.db import transaction
from django.db.models import F

from .models import Module


class ModuleReorderError(Exception):
    pass


def reorder_module(course_id, module_id, new_order):
    modules = list(Module.objects.filter(course_id=course_id).order_by("order"))

    current_module = next((module for module in modules if module.id == module_id), None)
    if current_module is None:
        raise ModuleReorderError("Module does not belong to this course.")

    if new_order < 1:
        raise ModuleReorderError("Order must be a positive number.")

    old_order = current_module.order

    if old_order != new_order:
        with transaction.atomic():
            if new_order > old_order:
                Module.objects.filter(
                    course_id=course_id, order__gt=old_order, order__lte=new_order
                ).update(order=F("order") - 1)
            else:
                Module.objects.filter(
                    course_id=course_id, order__gte=new_order, order__lt=old_order
                ).update(order=F("order") + 1)

            current_module.order = new_order
            current_module.save(update_fields=["order"])

    return Module.objects.select_related("course").filter(course_id=course_id).order_by("order")
