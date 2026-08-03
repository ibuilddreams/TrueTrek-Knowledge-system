from django.contrib.auth import get_user_model
from django.http import FileResponse
from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from common.import_files import ImportFileError
from common.pagination import Pagination
from common.response import error_response, success_response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .permissions import IsAdmin, IsTeacher
from .serializers import (
    CreateStudentSerializer,
    CreateTeacherSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ResetPasswordSerializer,
    StudentSerializer,
    StudentUpdateSerializer,
    TeacherCourseStatsSerializer,
    TeacherSerializer,
    TeacherUpdateSerializer,
)
from courses.models import Course
from courses.services import get_course_students_detail, is_course_instructor

from .services import (
    bulk_import_students,
    bulk_import_teachers,
    get_student_import_sample,
    get_teacher_assigned_courses,
    get_teacher_assigned_courses_with_students,
    get_teacher_enrolled_student_detail,
    get_teacher_enrolled_students_roster,
    get_teacher_import_sample,
    send_password_reset_email,
)

UserModel = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login endpoint: authenticates a user and returns JWT tokens."""

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(serializer.data, message="Login Successful")


class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(serializer.validated_data, message="Token refreshed")


class StudentListCreateView(generics.ListCreateAPIView):
    """Lists all users with the STUDENT role, and creates new ones."""

    queryset = UserModel.objects.filter(role=UserModel.Roles.STUDENT)
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            permission = IsAdmin()
            permission.message = (
                "You don't have permission to perform this action. "
                "This action can be performed only by admin. "
                "Students can be created only by admin."
            )
            return [permission]
        if self.request.method == "GET":
            permission = IsAdmin()
            permission.message = (
                "You don't have permission to perform this action. "
                "This action can be performed only by admin. "
                "Students can be viewed only by admin."
            )
            return [permission]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateStudentSerializer
        return StudentSerializer

    def list(self, request, *args, **kwargs):
        students = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(students)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        paginated_data["users"] = paginated_data.pop("results")
        return success_response(paginated_data, message="Students fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return success_response(
            serializer.to_representation(student),
            message="Student created successfully",
            status_code=201,
        )


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieves, updates, or deactivates a single student account."""

    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = UserModel.objects.filter(role=UserModel.Roles.STUDENT)
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ("GET", "PATCH", "DELETE"):
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return StudentUpdateSerializer
        return StudentSerializer

    def retrieve(self, request, *args, **kwargs):
        student = self.get_object()
        serializer = self.get_serializer(student)
        return success_response(serializer.data, message="Student fetched successfully")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        student = self.get_object()
        serializer = self.get_serializer(student, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        return success_response(serializer.data, message="Student updated successfully")

    def destroy(self, request, *args, **kwargs):
        student = self.get_object()
        student.account_status = UserModel.AccountStatus.DEACTIVATED
        student.is_active = False
        student.save(update_fields=["account_status", "is_active"])
        return success_response(None, message="Student deactivated successfully")


class StudentBulkImportView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get("file")
        try:
            result = bulk_import_students(uploaded_file)
        except ImportFileError as exc:
            return error_response(message=str(exc), status_code=400)

        message = (
            f"Import completed: {result['success_count']} created, "
            f"{result['skipped_count']} skipped as duplicates, "
            f"{result['failed_count']} failed."
        )
        return success_response(result, message=message)


class StudentBulkImportSampleView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        file_format = request.query_params.get("file_format", "csv")
        try:
            buffer, filename, content_type = get_student_import_sample(file_format)
        except ImportFileError as exc:
            return error_response(message=str(exc), status_code=400)

        response = FileResponse(buffer, as_attachment=True, filename=filename)
        response["Content-Type"] = content_type
        return response


class TeacherListCreateView(generics.ListCreateAPIView):
    """Lists all users with the TEACHER role, and creates new ones."""

    queryset = UserModel.objects.filter(role=UserModel.Roles.TEACHER)
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            permission = IsAdmin()
            permission.message = (
                "You don't have permission to perform this action. "
                "This action can be performed only by admin. "
                "Teachers can be created only by admin."
            )
            return [permission]
        if self.request.method == "GET":
            permission = IsAdmin()
            permission.message = (
                "You don't have permission to perform this action. "
                "This action can be performed only by admin. "
                "Teachers can be viewed only by admin."
            )
            return [permission]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CreateTeacherSerializer
        return TeacherSerializer

    def list(self, request, *args, **kwargs):
        teachers = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(teachers)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        paginated_data["users"] = paginated_data.pop("results")
        return success_response(paginated_data, message="Teachers fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()
        return success_response(
            serializer.to_representation(teacher),
            message="Teacher created successfully",
            status_code=201,
        )


class TeacherDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieves, updates, or deactivates a single teacher account."""

    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = UserModel.objects.filter(role=UserModel.Roles.TEACHER)
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "GET":
            return [(IsTeacher | IsAdmin)()]
        if self.request.method in ("PATCH", "DELETE"):
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return TeacherUpdateSerializer
        return TeacherSerializer

    def retrieve(self, request, *args, **kwargs):
        teacher = self.get_object()
        serializer = self.get_serializer(teacher)
        return success_response(serializer.data, message="Teacher fetched successfully")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        teacher = self.get_object()
        serializer = self.get_serializer(teacher, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()
        return success_response(serializer.data, message="Teacher updated successfully")

    def destroy(self, request, *args, **kwargs):
        teacher = self.get_object()
        teacher.account_status = UserModel.AccountStatus.DEACTIVATED
        teacher.is_active = False
        teacher.save(update_fields=["account_status", "is_active"])
        return success_response(None, message="Teacher deactivated successfully")


class TeacherBulkImportView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get("file")
        try:
            result = bulk_import_teachers(uploaded_file)
        except ImportFileError as exc:
            return error_response(message=str(exc), status_code=400)

        message = (
            f"Import completed: {result['success_count']} created, "
            f"{result['skipped_count']} skipped as duplicates, "
            f"{result['failed_count']} failed."
        )
        return success_response(result, message=message)


class TeacherBulkImportSampleView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        file_format = request.query_params.get("file_format", "csv")
        try:
            buffer, filename, content_type = get_teacher_import_sample(file_format)
        except ImportFileError as exc:
            return error_response(message=str(exc), status_code=400)

        response = FileResponse(buffer, as_attachment=True, filename=filename)
        response["Content-Type"] = content_type
        return response


class ProfileView(generics.RetrieveUpdateAPIView):
    """Returns and updates the profile information of the currently logged-in user."""

    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProfileUpdateSerializer
        return ProfileSerializer

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(serializer.data, message="Profile fetched successfully")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data, message="Profile updated successfully")


class TeacherAssignedCoursesListView(generics.GenericAPIView):
    serializer_class = TeacherCourseStatsSerializer
    permission_classes = [IsTeacher]

    def get(self, request):
        courses = get_teacher_assigned_courses(request.user)
        data = {
            "total_courses": courses.count(),
            "courses": self.get_serializer(courses, many=True).data,
        }
        return success_response(data, message="Assigned courses fetched successfully")


class TeacherAssignedCoursesStudentsView(generics.GenericAPIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        courses_data = get_teacher_assigned_courses_with_students(request.user)
        data = {
            "total_courses": len(courses_data),
            "courses": courses_data,
        }
        return success_response(
            data, message="Assigned courses with enrolled students fetched successfully"
        )


class TeacherCourseStudentsDetailView(generics.GenericAPIView):
    permission_classes = [IsTeacher]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return error_response(message="Course with the given id does not exist.", status_code=404)

        if not is_course_instructor(request.user, course):
            return error_response(message="You are not assigned to this course.", status_code=403)

        students_data = get_course_students_detail(course, teacher=request.user)
        data = {
            "course_id": course.id,
            "total_students": len(students_data),
            "students": students_data,
        }
        return success_response(data, message="Students' details fetched successfully")


class TeacherEnrolledStudentsRosterView(generics.GenericAPIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        students = get_teacher_enrolled_students_roster(request.user)
        data = {
            "total_students": len(students),
            "students": students,
        }
        return success_response(data, message="Enrolled students roster fetched successfully")


class TeacherEnrolledStudentDetailView(generics.GenericAPIView):
    permission_classes = [IsTeacher]

    def get(self, request, student_id):
        data = get_teacher_enrolled_student_detail(request.user, student_id)
        if data is None:
            return error_response(
                message="Student is not enrolled in any of your assigned courses.",
                status_code=404,
            )
        return success_response(data, message="Enrolled student's details fetched successfully")


class ForgotPasswordView(generics.GenericAPIView):
    """Sends a password reset link to the given email if an account exists."""

    serializer_class = ForgotPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        send_password_reset_email(serializer.validated_data["email"])
        return success_response(
            None,
            message="If an account exists with this email address, a password reset link has been sent.",
        )


class ResetPasswordView(generics.GenericAPIView):
    """Resets a user's password given a valid uid/token pair."""

    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(None, message="Your password has been reset successfully.")
