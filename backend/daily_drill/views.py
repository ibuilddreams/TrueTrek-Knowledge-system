from django.utils import timezone
from rest_framework import generics

from common.response import error_response, success_response
from users.permissions import IsStudent

from .models import DrillAttempt
from .serializers import DrillAttemptCreateSerializer
from .services import (
    DrillAlreadyAttemptedError,
    InvalidDrillOptionError,
    build_drill_payload,
    get_todays_question,
    record_attempt,
)


class DailyDrillTodayView(generics.GenericAPIView):
    permission_classes = [IsStudent]
    serializer_class = DrillAttemptCreateSerializer

    def get(self, request):
        question = get_todays_question()
        if question is None:
            return error_response(
                message="No drill questions are available right now.", status_code=404
            )

        attempt = DrillAttempt.objects.filter(
            student=request.user, attempt_date=timezone.localdate()
        ).first()

        data = build_drill_payload(request.user, question, attempt)
        return success_response(data, message="Today's drill retrieved successfully.")


class DailyDrillAttemptView(generics.GenericAPIView):
    permission_classes = [IsStudent]
    serializer_class = DrillAttemptCreateSerializer

    def post(self, request):
        question = get_todays_question()
        if question is None:
            return error_response(
                message="No drill questions are available right now.", status_code=404
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            attempt = record_attempt(
                request.user, question, serializer.validated_data["option_id"]
            )
        except DrillAlreadyAttemptedError as exc:
            return error_response(message=str(exc), status_code=400)
        except InvalidDrillOptionError as exc:
            return error_response(message=str(exc), status_code=400)

        data = build_drill_payload(request.user, question, attempt)
        return success_response(data, message="Drill submitted successfully.", status_code=201)
