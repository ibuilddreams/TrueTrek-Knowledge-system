from rest_framework import generics

from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin

from .models import Lesson, LessonResource
from .serializers import (
    LessonResourceSerializer,
    LessonResourceWriteSerializer,
    LessonSerializer,
    LessonWriteSerializer,
)


class LessonListCreateView(generics.ListCreateAPIView):
    queryset = Lesson.objects.select_related("module")
    pagination_class = Pagination

    def get_permissions(self):
        permission = IsAdmin()
        permission.message = "You do not have permission to perform this action. Only admin can perform this action."
        return [permission]

    def get_queryset(self):
        queryset = super().get_queryset()
        module_id = self.request.query_params.get("module")
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LessonWriteSerializer
        return LessonSerializer

    def list(self, request, *args, **kwargs):
        lessons = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(lessons)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Lessons fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lesson = serializer.save()
        return success_response(
            LessonSerializer(lesson).data,
            message="Lesson created successfully",
            status_code=201,
        )


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Lesson.objects.select_related("module")

    def get_permissions(self):
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

        serializer = self.get_serializer(lesson)
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
        return success_response(LessonSerializer(lesson).data, message="Lesson updated successfully")

    def destroy(self, request, *args, **kwargs):
        try:
            lesson = self.get_queryset().get(pk=kwargs["pk"])
        except Lesson.DoesNotExist:
            return error_response(message="Lesson with the given id does not exist.", status_code=404)

        lesson.delete()
        return success_response(None, message="Lesson deleted successfully")


class LessonResourceListCreateView(generics.ListCreateAPIView):
    queryset = LessonResource.objects.select_related("lesson")
    pagination_class = Pagination

    def get_permissions(self):
        permission = IsAdmin()
        permission.message = "You do not have permission to perform this action. Only admin can perform this action."
        return [permission]

    def get_queryset(self):
        queryset = super().get_queryset()
        lesson_id = self.request.query_params.get("lesson")
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LessonResourceWriteSerializer
        return LessonResourceSerializer

    def list(self, request, *args, **kwargs):
        resources = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(resources)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Lesson resources fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resource = serializer.save()
        return success_response(
            LessonResourceSerializer(resource).data,
            message="Lesson resource created successfully",
            status_code=201,
        )


class LessonResourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = LessonResource.objects.select_related("lesson")

    def get_permissions(self):
        permission = IsAdmin()
        permission.message = "You do not have permission to perform this action. Only admin can perform this action."
        return [permission]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return LessonResourceWriteSerializer
        return LessonResourceSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            resource = self.get_queryset().get(pk=kwargs["pk"])
        except LessonResource.DoesNotExist:
            return error_response(message="Lesson resource with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(resource)
        return success_response(serializer.data, message="Lesson resource fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            resource = self.get_queryset().get(pk=kwargs["pk"])
        except LessonResource.DoesNotExist:
            return error_response(message="Lesson resource with the given id does not exist.", status_code=404)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(resource, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        resource = serializer.save()
        return success_response(LessonResourceSerializer(resource).data, message="Lesson resource updated successfully")

    def destroy(self, request, *args, **kwargs):
        try:
            resource = self.get_queryset().get(pk=kwargs["pk"])
        except LessonResource.DoesNotExist:
            return error_response(message="Lesson resource with the given id does not exist.", status_code=404)

        resource.delete()
        return success_response(None, message="Lesson resource deleted successfully")
