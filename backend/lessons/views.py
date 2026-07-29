from rest_framework import generics
from rest_framework.parsers import FormParser, MultiPartParser

from common.pagination import Pagination
from common.response import error_response, success_response
from enrollments.models import Enrollment
from modules.models import Module
from users.permissions import IsAdmin

from .models import Lesson
from .permissions import IsEnrolledStudentOrAdmin
from .serializers import LessonOrderEntrySerializer, LessonSerializer, LessonWriteSerializer
from .services import LessonReorderError, reorder_lessons


class LessonListCreateView(generics.ListCreateAPIView):
    queryset = Lesson.objects.select_related("module", "module__course")
    pagination_class = Pagination
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsEnrolledStudentOrAdmin()]
        permission = IsAdmin()
        permission.message = "You do not have permission to perform this action. Only admin can perform this action."
        return [permission]

    def get_queryset(self):
        queryset = super().get_queryset()
        module_id = self.request.query_params.get("module")
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(module__course_id=course_id)

        user = self.request.user
        if self.request.method == "GET" and user.is_authenticated and user.is_student:
            enrolled_course_ids = Enrollment.objects.filter(
                student=user, status=Enrollment.EnrollmentStatus.ACTIVE
            ).values_list("course_id", flat=True)
            queryset = queryset.filter(module__course_id__in=enrolled_course_ids)

        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LessonWriteSerializer
        return LessonSerializer

    def list(self, request, *args, **kwargs):
        lessons = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(lessons)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Lessons fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save()
        return success_response(
            LessonSerializer(lesson, context={"request": request}).data,
            message="Lesson created successfully",
            status_code=201,
        )


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Lesson.objects.select_related("module", "module__course")
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsEnrolledStudentOrAdmin()]
        permission = IsAdmin()
        permission.message = "You do not have permission to perform this action. Only admin can perform this action."
        return [permission]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return LessonWriteSerializer
        return LessonSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            lesson = self.get_queryset().get(pk=kwargs["pk"])
        except Lesson.DoesNotExist:
            return error_response(message="Lesson with the given id does not exist.", status_code=404)

        self.check_object_permissions(request, lesson)

        serializer = self.get_serializer(lesson, context={"request": request})
        return success_response(serializer.data, message="Lesson fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            lesson = self.get_queryset().get(pk=kwargs["pk"])
        except Lesson.DoesNotExist:
            return error_response(message="Lesson with the given id does not exist.", status_code=404)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(lesson, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save()
        return success_response(
            LessonSerializer(lesson, context={"request": request}).data,
            message="Lesson updated successfully",
        )

    def destroy(self, request, *args, **kwargs):
        try:
            lesson = self.get_queryset().get(pk=kwargs["pk"])
        except Lesson.DoesNotExist:
            return error_response(message="Lesson with the given id does not exist.", status_code=404)

        lesson.delete()
        return success_response(None, message="Lesson deleted successfully")


class LessonOrderView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    serializer_class = LessonOrderEntrySerializer

    def get_permissions(self):
        permission = IsAdmin()
        permission.message = "You do not have permission to perform this action. Only admin can perform this action."
        return [permission]

    def patch(self, request, *args, **kwargs):
        module_id = kwargs["module_id"]
        if not Module.objects.filter(pk=module_id).exists():
            return error_response(message="Module with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            lessons = reorder_lessons(module_id, serializer.validated_data)
        except LessonReorderError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            LessonSerializer(lessons, many=True, context={"request": request}).data,
            message="Lessons reordered successfully",
        )
