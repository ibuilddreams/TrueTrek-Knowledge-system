from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from common.pagination import Pagination
from common.response import error_response, success_response
from courses.models import Course
from users.permissions import IsAdmin, IsStudent, IsTeacher

from .models import Enrollment, EnrollmentHistory
from .serializers import (
    AdminEnrollmentWriteSerializer,
    CourseEnrolledStudentSerializer,
    EnrollmentListSerializer,
    EnrollmentManageSerializer,
    EnrollmentStatusUpdateSerializer,
    EnrollmentWriteSerializer,
)


class EnrollmentListCreateView(generics.ListCreateAPIView):
    # Student self-enroll (POST) is temporarily disabled — commented out below, not removed.
    http_method_names = ["get", "head", "options"]
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_permissions(self):
        # if self.request.method == "POST":
        #     return [IsStudent()]
        return super().get_permissions()

    def get_queryset(self):
        return (
            Enrollment.objects.filter(student=self.request.user)
            .select_related("course", "course__category")
            .prefetch_related("course__tags", "course__instructors__instructor")
        )

    def get_serializer_class(self):
        # if self.request.method == "POST":
        #     return EnrollmentWriteSerializer
        return EnrollmentListSerializer

    def list(self, request, *args, **kwargs):
        enrollments = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(enrollments)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Enrollments fetched successfully")

    # def create(self, request, *args, **kwargs):
    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #     enrollment = serializer.save()
    #     return success_response(
    #         EnrollmentListSerializer(enrollment).data,
    #         message="Enrolled successfully",
    #         status_code=201,
    #     )


class AdminEnrollmentListView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = Enrollment.objects.select_related(
            "student", "course", "course__category"
        ).prefetch_related("course__tags", "course__instructors__instructor")

        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminEnrollmentWriteSerializer
        return EnrollmentManageSerializer

    def list(self, request, *args, **kwargs):
        enrollments = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(enrollments)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Enrollments fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        return success_response(
            EnrollmentManageSerializer(enrollment).data,
            message="Student enrolled successfully",
            status_code=201,
        )


class AdminEnrollmentDetailView(generics.GenericAPIView):
    serializer_class = EnrollmentStatusUpdateSerializer
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        try:
            enrollment = Enrollment.objects.select_related(
                "student", "course", "course__category"
            ).get(pk=pk)
        except Enrollment.DoesNotExist:
            return error_response(
                message="Enrollment with the given id does not exist.", status_code=404
            )

        serializer = self.get_serializer(instance=enrollment, data=request.data)
        serializer.is_valid(raise_exception=True)

        previous_status = enrollment.status
        enrollment.status = serializer.validated_data["status"]
        enrollment.save(update_fields=["status", "updated_at"])

        EnrollmentHistory.objects.create(
            enrollment=enrollment,
            previous_status=previous_status,
            new_status=enrollment.status,
            note=serializer.validated_data["note"],
        )

        return success_response(
            EnrollmentManageSerializer(enrollment).data,
            message="Enrollment status updated successfully",
        )


class AdminCourseEnrollmentListView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, course_id):
        if not Course.objects.filter(pk=course_id).exists():
            return error_response(message="Course with the given id does not exist.", status_code=404)

        enrollments = Enrollment.objects.filter(course_id=course_id).select_related("student")

        data = {
            "total_students": enrollments.count(),
            "students": CourseEnrolledStudentSerializer(enrollments, many=True).data,
        }
        return success_response(data, message="Enrolled students fetched successfully")


class TeacherEnrollmentListView(generics.ListAPIView):
    serializer_class = EnrollmentManageSerializer
    permission_classes = [IsTeacher]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = Enrollment.objects.filter(
            course__instructors__instructor=self.request.user
        ).select_related("student", "course", "course__category").prefetch_related(
            "course__tags", "course__instructors__instructor"
        )

        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        return queryset

    def list(self, request, *args, **kwargs):
        enrollments = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(enrollments)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Enrollments fetched successfully")
