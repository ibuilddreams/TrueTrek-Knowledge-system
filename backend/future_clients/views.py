from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny

from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin

from .models import FutureClientApplication
from .serializers import (
    ApplicationRejectSerializer,
    FutureClientApplicationSerializer,
    PublicApplicationCreateSerializer,
)
from .services import ApplicationApprovalError, approve_application, reject_application


class FutureClientApplicationCreateView(generics.CreateAPIView):
    """Public endpoint: a prospect submits their info and desired course(s)."""

    serializer_class = PublicApplicationCreateSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return success_response(
            serializer.to_representation(application),
            message="Application submitted successfully. We'll be in touch once it's reviewed.",
            status_code=201,
        )


class AdminApplicationListView(generics.ListAPIView):
    serializer_class = FutureClientApplicationSerializer
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = FutureClientApplication.objects.select_related("reviewed_by").prefetch_related(
            "courses", "courses__tags"
        )

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(email__icontains=search)
            )

        return queryset

    def list(self, request, *args, **kwargs):
        applications = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(applications)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Applications fetched successfully")


class AdminApplicationDetailView(generics.RetrieveAPIView):
    queryset = FutureClientApplication.objects.select_related("reviewed_by").prefetch_related(
        "courses", "courses__tags"
    )
    serializer_class = FutureClientApplicationSerializer
    permission_classes = [IsAdmin]

    def retrieve(self, request, *args, **kwargs):
        application = self.get_object()
        serializer = self.get_serializer(application)
        return success_response(serializer.data, message="Application fetched successfully")


class AdminApplicationApproveView(generics.GenericAPIView):
    queryset = FutureClientApplication.objects.all()
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        application = self.get_object()
        try:
            result = approve_application(application, request.user)
        except ApplicationApprovalError as exc:
            return error_response(message=str(exc), status_code=400)

        enrolled_count = len(result["enrolled"])
        failed_count = len(result["failed"])
        if failed_count:
            message = (
                f"Application approved — enrolled in {enrolled_count} course(s), "
                f"{failed_count} couldn't be processed."
            )
        else:
            message = f"Application approved — enrolled in {enrolled_count} course(s)."

        application.refresh_from_db()
        data = FutureClientApplicationSerializer(application).data
        data["enrollment_result"] = {"enrolled": result["enrolled"], "failed": result["failed"]}
        return success_response(data, message=message)


class AdminApplicationRejectView(generics.GenericAPIView):
    queryset = FutureClientApplication.objects.all()
    serializer_class = ApplicationRejectSerializer
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        application = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            application = reject_application(
                application, request.user, serializer.validated_data["rejection_reason"]
            )
        except ApplicationApprovalError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            FutureClientApplicationSerializer(application).data,
            message="Application rejected",
        )
