from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from common.pagination import Pagination
from common.response import success_response

from .models import Category, Course
from .serializers import (
    CategorySerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    CourseWriteSerializer,
)


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

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
    lookup_field = "slug"

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


class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.select_related("category").all()
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

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
    lookup_field = "slug"

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
        course = self.get_object()
        course.delete()
        return success_response(None, message="Course deleted successfully")
