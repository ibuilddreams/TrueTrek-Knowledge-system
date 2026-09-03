from django.db.models import Q
from rest_framework import generics

from common.pagination import Pagination
from common.response import success_response
from users.permissions import IsAdmin, IsTeacher

from .models import TeacherRequest
from .serializers import (
    TeacherRequestAdminUpdateSerializer,
    TeacherRequestCreateSerializer,
    TeacherRequestSerializer,
)


class TeacherRequestListCreateView(generics.ListCreateAPIView):
    """Teacher-facing: submit a new request, list only requests submitted by the current teacher."""

    permission_classes = [IsTeacher]
    pagination_class = Pagination

    def get_queryset(self):
        return (
            TeacherRequest.objects.filter(teacher=self.request.user)
            .select_related("teacher", "handled_by")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TeacherRequestCreateSerializer
        return TeacherRequestSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = TeacherRequestSerializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Requests fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(teacher=request.user)
        return success_response(
            TeacherRequestSerializer(instance).data,
            message="Request submitted successfully",
            status_code=201,
        )


class TeacherRequestDetailView(generics.RetrieveAPIView):
    """Teacher-facing: retrieve one of the current teacher's own requests. Another teacher's request 404s."""

    serializer_class = TeacherRequestSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return TeacherRequest.objects.filter(teacher=self.request.user).select_related(
            "teacher", "handled_by"
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return success_response(
            self.get_serializer(instance).data, message="Request fetched successfully"
        )


class AdminTeacherRequestListView(generics.ListAPIView):
    serializer_class = TeacherRequestSerializer
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = TeacherRequest.objects.select_related("teacher", "handled_by").order_by(
            "-created_at"
        )

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        request_type = self.request.query_params.get("request_type")
        if request_type:
            queryset = queryset.filter(request_type=request_type.upper())

        teacher_id = self.request.query_params.get("teacher")
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(teacher__name__icontains=search)
                | Q(teacher__email__icontains=search)
            )

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Requests fetched successfully")


class AdminTeacherRequestDetailView(generics.RetrieveUpdateAPIView):
    """Admin-facing: view any request, and update its status / completion description."""

    queryset = TeacherRequest.objects.select_related("teacher", "handled_by")
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return TeacherRequestAdminUpdateSerializer
        return TeacherRequestSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return success_response(
            TeacherRequestSerializer(instance).data, message="Request fetched successfully"
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return success_response(
            TeacherRequestSerializer(updated).data, message="Request updated successfully"
        )
