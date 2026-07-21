import logging

from rest_framework import status as http_status
from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler as drf_exception_handler

from .response import error_response

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Reformat every DRF exception into the project's standard
    {"status", "message", "data"} response envelope.
    """
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
