from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from common.pagination import Pagination
from common.response import error_response, success_response
from enrollments.models import Enrollment
from enrollments.serializers import CourseEnrolledStudentSerializer
from users.permissions import IsAdmin

from .models import Category, Course, Tag
from .serializers import (
    CategorySerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    CourseWriteSerializer,
    TagSerializer,
    TeacherSerializer,
)

UserModel = get_user_model()


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.prefetch_related("courses__tags", "courses__instructors__instructor")
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def list(self, request, *args, **kwargs):
        categories = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(categories)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Categories fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return success_response(
            self.get_serializer(category).data,
            message="Category created successfully",
            status_code=201,
        )


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def retrieve(self, request, *args, **kwargs):
        category = self.get_object()
        serializer = self.get_serializer(category)
        return success_response(serializer.data, message="Category fetched successfully")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        category = self.get_object()
        serializer = self.get_serializer(category, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return success_response(serializer.data, message="Category updated successfully")

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        category.delete()
        return success_response(None, message="Category deleted successfully")


class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def list(self, request, *args, **kwargs):
        tags = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(tags, many=True)
        return success_response(serializer.data, message="Tags fetched successfully")


class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.select_related("category").prefetch_related("tags", "instructors__instructor")
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdmin()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CourseWriteSerializer
        return CourseListSerializer

    def list(self, request, *args, **kwargs):
        courses = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(courses)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Courses fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return success_response(
            CourseDetailSerializer(course).data,
            message="Course created successfully",
            status_code=201,
        )


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.select_related("category").all()
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CourseWriteSerializer
        return CourseDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        course = self.get_object()
        serializer = self.get_serializer(course)
        return success_response(serializer.data, message="Course fetched successfully")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        course = self.get_object()
        serializer = self.get_serializer(course, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return success_response(
            CourseDetailSerializer(course).data, message="Course updated successfully"
        )

    def destroy(self, request, *args, **kwargs):
        try:
            course = self.get_queryset().get(pk=kwargs["pk"])
        except Course.DoesNotExist:
            return error_response(message="Course with the given id does not exist.", status_code=404)
        course.delete()
        return success_response(None, message="Course deleted successfully")


class AdminTeacherAssignedCoursesView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, teacher_id):
        try:
            teacher = UserModel.objects.get(pk=teacher_id, role=UserModel.Roles.TEACHER)
        except UserModel.DoesNotExist:
            return error_response(
                message="Teacher with the given id does not exist.", status_code=404
            )

        courses = Course.objects.filter(
            instructors__instructor_id=teacher_id
        ).select_related("category").prefetch_related("tags", "instructors__instructor")

        data = {
            "teacher": TeacherSerializer(teacher).data,
            "total_courses": courses.count(),
            "courses": CourseListSerializer(courses, many=True).data,
        }
        return success_response(data, message="Teacher's assigned courses fetched successfully")


class AdminTeacherAssignedCoursesWithStudentsView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, teacher_id):
        try:
            teacher = UserModel.objects.get(pk=teacher_id, role=UserModel.Roles.TEACHER)
        except UserModel.DoesNotExist:
            return error_response(
                message="Teacher with the given id does not exist.", status_code=404
            )

        courses = Course.objects.filter(instructors__instructor_id=teacher_id)

        courses_data = []
        for course in courses:
            enrollments = Enrollment.objects.filter(course=course).select_related("student")
            courses_data.append(
                {
                    "id": course.id,
                    "title": course.title,
                    "slug": course.slug,
                    "status": course.status,
                    "total_students": enrollments.count(),
                    "students": CourseEnrolledStudentSerializer(enrollments, many=True).data,
                }
            )

        data = {
            "teacher": TeacherSerializer(teacher).data,
            "total_courses": len(courses_data),
            "courses": courses_data,
        }
        return success_response(
            data, message="Assigned courses with enrolled students fetched successfully"
        )
