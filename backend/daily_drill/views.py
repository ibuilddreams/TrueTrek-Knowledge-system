from django.conf import settings
from django.db.models import Count, Q, Sum
from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin, IsStudent

from .admin_drill_services import record_video_progress, submit_admin_drill_quiz
from .exceptions import (
    DrillAlreadyAttemptedError,
    DrillUnavailableError,
    InvalidDrillOptionError,
    QuizSubmissionError,
    VideoProgressError,
)
from .models import AdminDrillProgress, AdminDrillSchedule
from .serializers import (
    AdminDrillQuizSubmitSerializer,
    AdminDrillQuizWriteSerializer,
    AdminDrillScheduleSerializer,
    AdminDrillScheduleWriteSerializer,
    DrillAnswerSubmitSerializer,
    VideoProgressSerializer,
)
from .services import build_todays_drill_payload, submit_single_question_answer

# ---------------------------------------------------------------------------
# Student — today's Daily Drill (whichever source resolves)
# ---------------------------------------------------------------------------


class DailyDrillTodayView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request):
        data = build_todays_drill_payload(request.user, request=request)
        if data["type"] == "UNAVAILABLE":
            return success_response(data, message="No Daily Drill is available right now.")
        return success_response(data, message="Today's Daily Drill retrieved successfully.")


class DailyDrillAttemptView(generics.GenericAPIView):
    """Submits an answer for the AI_QUESTION or LEGACY_QUESTION source only —
    an ADMIN_VIDEO drill's quiz goes through DailyDrillSubmitQuizView instead
    (see resolve_todays_drill's source-specific shapes)."""

    permission_classes = [IsStudent]
    serializer_class = DrillAnswerSubmitSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            source, obj = submit_single_question_answer(
                request.user, serializer.validated_data["answer_key"].upper()
            )
        except DrillAlreadyAttemptedError as exc:
            return error_response(message=str(exc), status_code=400)
        except InvalidDrillOptionError as exc:
            return error_response(message=str(exc), status_code=400)
        except DrillUnavailableError as exc:
            return error_response(message=str(exc), status_code=404)

        data = build_todays_drill_payload(request.user, request=request)
        return success_response(data, message="Drill submitted successfully.", status_code=201)


class DailyDrillVideoProgressView(generics.GenericAPIView):
    permission_classes = [IsStudent]
    serializer_class = VideoProgressSerializer

    def post(self, request, schedule_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            progress = record_video_progress(
                request.user, schedule_id, serializer.validated_data["progress_percent"]
            )
        except VideoProgressError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            {
                "video_progress_percent": progress.video_progress_percent,
                "quiz_unlocked": progress.video_progress_percent
                >= settings.DAILY_DRILL_VIDEO_WATCH_THRESHOLD_PERCENT,
            },
            message="Video progress recorded.",
        )


class DailyDrillSubmitQuizView(generics.GenericAPIView):
    permission_classes = [IsStudent]
    serializer_class = AdminDrillQuizSubmitSerializer

    def post(self, request, schedule_id):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            progress, passed = submit_admin_drill_quiz(
                request.user, schedule_id, serializer.validated_data["answers"]
            )
        except QuizSubmissionError as exc:
            return error_response(message=str(exc), status_code=400)

        data = build_todays_drill_payload(request.user, request=request)
        data["passed"] = passed
        return success_response(
            data,
            message="Quiz submitted successfully." if passed else "Quiz submitted — you did not reach the passing score.",
            status_code=201,
        )


# ---------------------------------------------------------------------------
# Admin — Daily Drill schedule management
# ---------------------------------------------------------------------------


class AdminDrillScheduleListCreateView(generics.ListCreateAPIView):
    queryset = AdminDrillSchedule.objects.prefetch_related("quiz_questions__choices").select_related("created_by")
    permission_classes = [IsAdmin]
    pagination_class = Pagination
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminDrillScheduleWriteSerializer
        return AdminDrillScheduleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))

        return queryset

    def list(self, request, *args, **kwargs):
        schedules = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(schedules)
        serializer = AdminDrillScheduleSerializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Daily Drill schedules fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        schedule = serializer.save(created_by=request.user)
        return success_response(
            AdminDrillScheduleSerializer(schedule, context={"request": request}).data,
            message="Daily Drill schedule created successfully",
            status_code=201,
        )


class AdminDrillScheduleDetailView(generics.RetrieveUpdateAPIView):
    queryset = AdminDrillSchedule.objects.prefetch_related("quiz_questions__choices").select_related("created_by")
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return AdminDrillScheduleWriteSerializer
        return AdminDrillScheduleSerializer

    def retrieve(self, request, *args, **kwargs):
        schedule = self.get_object()
        return success_response(
            AdminDrillScheduleSerializer(schedule, context={"request": request}).data, message="Daily Drill schedule fetched successfully"
        )

    def update(self, request, *args, **kwargs):
        schedule = self.get_object()
        serializer = self.get_serializer(schedule, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        schedule = serializer.save()
        return success_response(
            AdminDrillScheduleSerializer(schedule, context={"request": request}).data, message="Daily Drill schedule updated successfully"
        )


class AdminDrillQuizView(generics.GenericAPIView):
    queryset = AdminDrillSchedule.objects.all()
    serializer_class = AdminDrillQuizWriteSerializer
    permission_classes = [IsAdmin]

    def put(self, request, *args, **kwargs):
        schedule = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(schedule)
        return success_response(
            AdminDrillScheduleSerializer(schedule, context={"request": request}).data, message="Daily Drill quiz saved successfully"
        )


class AdminDrillScheduleActivateView(generics.GenericAPIView):
    queryset = AdminDrillSchedule.objects.all()
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        schedule = self.get_object()
        if not schedule.quiz_questions.exists():
            return error_response(
                message="Add at least one quiz question before publishing this Daily Drill.",
                status_code=400,
            )
        schedule.status = "PUBLISHED"
        schedule.save(update_fields=["status", "updated_at"])
        return success_response(
            AdminDrillScheduleSerializer(schedule, context={"request": request}).data, message="Daily Drill activated successfully"
        )


class AdminDrillScheduleDeactivateView(generics.GenericAPIView):
    queryset = AdminDrillSchedule.objects.all()
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        schedule = self.get_object()
        schedule.status = "ARCHIVED"
        schedule.save(update_fields=["status", "updated_at"])
        return success_response(
            AdminDrillScheduleSerializer(schedule, context={"request": request}).data, message="Daily Drill deactivated successfully"
        )


class AdminDrillSchedulePerformanceView(generics.GenericAPIView):
    queryset = AdminDrillSchedule.objects.all()
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        schedule = self.get_object()
        aggregate = AdminDrillProgress.objects.filter(schedule=schedule).aggregate(
            viewed_count=Count("id"),
            completed_count=Count("id", filter=Q(status=AdminDrillProgress.ProgressStatus.COMPLETED)),
        )
        total_points_awarded = (
            AdminDrillProgress.objects.filter(schedule=schedule).aggregate(total=Sum("points_awarded"))["total"]
            or 0
        )

        return success_response(
            {
                "viewed_count": aggregate["viewed_count"] or 0,
                "completed_count": aggregate["completed_count"] or 0,
                "points_awarded_total": total_points_awarded,
            },
            message="Daily Drill performance fetched successfully",
        )
