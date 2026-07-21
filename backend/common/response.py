from rest_framework import status as http_status
from rest_framework.response import Response


def success_response(data, message="Success", status_code=http_status.HTTP_200_OK):
    return Response(
        {
            "status": status_code,
            "message": message,
            "data": data,
        },
        status=status_code,
    )


def error_response(message="Something went wrong", status_code=http_status.HTTP_400_BAD_REQUEST, data=None):
    return Response(
        {
            "status": status_code,
            "message": message,
            "data": data if data is not None else {},
        },
        status=status_code,
    )
