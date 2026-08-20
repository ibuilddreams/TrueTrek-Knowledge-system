import logging

from django.db.models.deletion import ProtectedError
from rest_framework import status as http_status
from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler as drf_exception_handler

from .response import error_response

logger = logging.getLogger(__name__)


def _describe_protected_objects(exc):
    counts = {}
    for obj in getattr(exc, "protected_objects", []):
        counts.setdefault(obj._meta.model, 0)
        counts[obj._meta.model] += 1
    return ", ".join(
        f"{count} {model._meta.verbose_name if count == 1 else model._meta.verbose_name_plural}"
        for model, count in counts.items()
    )


def custom_exception_handler(exc, context):
    """
    Reformat every DRF exception into the project's standard
    {"status", "message", "data"} response envelope.
    """
    if isinstance(exc, ProtectedError):
        # Raised by Django when deleting a row that other rows still reference via
        # on_delete=PROTECT (e.g. a Category still used by Courses/Tiers) — DRF's
        # own exception_handler doesn't recognize this Django-level exception at
        # all (returns None for it), so left unhandled it surfaces as a raw 500.
        description = _describe_protected_objects(exc)
        message = (
            f"Cannot delete this — it is still used by {description}. "
            "Remove or reassign those first."
            if description
            else "Cannot delete this — it is still referenced by other records."
        )
        return error_response(message=message, status_code=http_status.HTTP_409_CONFLICT)

    response = drf_exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled exception in %s", context.get("view"), exc_info=exc)
        return error_response(
            message="Internal server error",
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = response.data

    if isinstance(detail, dict) and "detail" in detail and len(detail) == 1:
        return error_response(message=str(detail["detail"]), status_code=response.status_code)

    if isinstance(exc, ValidationError) and isinstance(detail, dict) and set(detail.keys()) == {"non_field_errors"}:
        message = str(detail["non_field_errors"][0])
        return error_response(message=message, status_code=response.status_code)

    if isinstance(detail, dict):
        return error_response(message="Validation Error", status_code=response.status_code, data=detail)

    return error_response(message="Something went wrong", status_code=response.status_code)
