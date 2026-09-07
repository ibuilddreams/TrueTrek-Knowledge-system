from django.db.models import Q
from rest_framework import generics

from common.pagination import Pagination
from common.response import success_response
from users.permissions import IsAdmin, IsTeacher

from .models import StudentConcern
from .serializers import (
    StudentConcernAdminUpdateSerializer,
    StudentConcernCreateSerializer,
    StudentConcernSerializer,
)
from .services import flag_student_concern


class StudentConcernListCreateView(generics.ListCreateAPIView):
    """Teacher-facing: flag a new concern, list only concerns the current teacher flagged."""

    permission_classes = [IsTeacher]
    pagination_class = Pagination

    def get_queryset(self):
        return StudentConcern.objects.filter(teacher=self.request.user).select_related(
            "teacher", "student", "course", "handled_by"
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StudentConcernCreateSerializer
        return StudentConcernSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = StudentConcernSerializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Concerns fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        concern = flag_student_concern(request.user, **serializer.validated_data)
        return success_response(
            StudentConcernSerializer(concern).data,
            message="Concern submitted successfully",
            status_code=201,
        )


class StudentConcernDetailView(generics.RetrieveAPIView):
    """Teacher-facing: retrieve one of the current teacher's own concerns. Another teacher's concern 404s."""

    serializer_class = StudentConcernSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return StudentConcern.objects.filter(teacher=self.request.user).select_related(
            "teacher", "student", "course", "handled_by"
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return success_response(
            self.get_serializer(instance).data, message="Concern fetched successfully"
        )


class AdminStudentConcernListView(generics.ListAPIView):
    serializer_class = StudentConcernSerializer
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = StudentConcern.objects.select_related(
            "teacher", "student", "course", "handled_by"
        ).order_by("-created_at")

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category.upper())

        teacher_id = self.request.query_params.get("teacher")
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)

        student_id = self.request.query_params.get("student")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        requires_admin_attention = self.request.query_params.get("requires_admin_attention")
        if requires_admin_attention is not None:
            queryset = queryset.filter(
                requires_admin_attention=requires_admin_attention.lower() in ("true", "1")
            )

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search)
                | Q(teacher__name__icontains=search)
                | Q(teacher__email__icontains=search)
                | Q(student__name__icontains=search)
                | Q(student__email__icontains=search)
            )

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Concerns fetched successfully")


class AdminStudentConcernDetailView(generics.RetrieveUpdateAPIView):
    """Admin-facing: view any concern, and update its status / resolution notes."""

    queryset = StudentConcern.objects.select_related("teacher", "student", "course", "handled_by")
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return StudentConcernAdminUpdateSerializer
        return StudentConcernSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return success_response(
            StudentConcernSerializer(instance).data, message="Concern fetched successfully"
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return success_response(
            StudentConcernSerializer(updated).data, message="Concern updated successfully"
        )
