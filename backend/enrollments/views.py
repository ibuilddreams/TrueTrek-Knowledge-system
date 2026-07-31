from django.contrib.auth import get_user_model
from django.http import FileResponse
from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from common.import_files import ImportFileError
from common.pagination import Pagination
from common.response import error_response, success_response
from courses.models import Course
from courses.serializers import CourseListSerializer
from users.permissions import IsAdmin, IsStudent, IsTeacher

from progress.models import CourseProgress

from .models import Enrollment, EnrollmentHistory
from .serializers import (
    AdminEnrollmentWriteSerializer,
    CourseEnrolledStudentSerializer,
    EnrollmentListSerializer,
    EnrollmentManageSerializer,
    EnrollmentStatusUpdateSerializer,
    EnrollmentStudentSerializer,
    EnrollmentWriteSerializer,
)
from .services import (
    bulk_import_enrollments,
    get_enrollment_import_sample,
    get_student_enrolled_course_detail,
)

UserModel = get_user_model()


class StudentEnrolledCourseDetailView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request, course_id):
        data = get_student_enrolled_course_detail(request.user, course_id, request=request)
        if data is None:
            return error_response(
                message="You are not enrolled in this course.",
                status_code=404,
            )
        return success_response(data, message="Enrolled course details fetched successfully")


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

    def get_serializer_context(self):
        context = super().get_serializer_context()
        course_ids = list(
            Enrollment.objects.filter(student=self.request.user).values_list(
                "course_id", flat=True
            )
        )
        progress_map = {
            progress.course_id: progress
            for progress in CourseProgress.objects.filter(
                student=self.request.user, course_id__in=course_ids
            )
        }
        context["progress_map"] = progress_map
        return context

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


class EnrollmentBulkImportView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get("file")
        try:
            result = bulk_import_enrollments(uploaded_file)
        except ImportFileError as exc:
            return error_response(message=str(exc), status_code=400)

        message = (
            f"Import completed: {result['success_count']} succeeded, "
            f"{result['failed_count']} failed."
        )
        return success_response(result, message=message)


class EnrollmentBulkImportSampleView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        file_format = request.query_params.get("file_format", "csv")
        try:
            buffer, filename, content_type = get_enrollment_import_sample(file_format)
        except ImportFileError as exc:
            return error_response(message=str(exc), status_code=400)

        response = FileResponse(buffer, as_attachment=True, filename=filename)
        response["Content-Type"] = content_type
        return response


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


class AdminStudentEnrollmentListView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, student_id):
        try:
            student = UserModel.objects.get(pk=student_id, role=UserModel.Roles.STUDENT)
        except UserModel.DoesNotExist:
            return error_response(
                message="Student with the given id does not exist.", status_code=404
            )

        courses = Course.objects.filter(
            enrollments__student_id=student_id
        ).select_related("category").prefetch_related("tags", "instructors__instructor")

        data = {
            "student": EnrollmentStudentSerializer(student).data,
            "total_courses": courses.count(),
            "courses": CourseListSerializer(courses, many=True).data,
        }
        return success_response(data, message="Student's courses fetched successfully")


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
