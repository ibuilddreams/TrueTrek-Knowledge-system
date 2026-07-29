from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from courses.models import Course
from users.permissions import IsAdmin

from .models import Module
from .serializers import ModuleOrderEntrySerializer, ModuleSerializer, ModuleWriteSerializer
from .services import ModuleReorderError, reorder_modules


class ModuleListCreateView(generics.ListCreateAPIView):
    queryset = Module.objects.select_related("course")
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        permission = IsAdmin()
        permission.message = "You do not have permission to perform this action. Only admin can perform this action."
        return [permission]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)

        user = self.request.user
        if self.request.method == "GET" and not (user.is_authenticated and user.is_admin):
            queryset = queryset.filter(course__status=Status.PUBLISHED)

        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ModuleWriteSerializer
        return ModuleSerializer

    def list(self, request, *args, **kwargs):
        modules = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(modules)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Modules fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        module = serializer.save()
        return success_response(
            ModuleSerializer(module).data,
            message="Module created successfully",
            status_code=201,
        )


class ModuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Module.objects.select_related("course")

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        permission = IsAdmin()
        permission.message = "You do not have permission to perform this action. Only admin can perform this action."
        return [permission]

    def get_queryset(self):
        queryset = super().get_queryset()

        user = self.request.user
        if self.request.method == "GET" and not (user.is_authenticated and user.is_admin):
            queryset = queryset.filter(course__status=Status.PUBLISHED)

        return queryset

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return ModuleWriteSerializer
        return ModuleSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            module = self.get_queryset().get(pk=kwargs["pk"])
        except Module.DoesNotExist:
            return error_response(message="Module with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(module)
        return success_response(serializer.data, message="Module fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            module = self.get_queryset().get(pk=kwargs["pk"])
        except Module.DoesNotExist:
            return error_response(message="Module with the given id does not exist.", status_code=404)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(module, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        module = serializer.save()
        return success_response(ModuleSerializer(module).data, message="Module updated successfully")

    def destroy(self, request, *args, **kwargs):
        try:
            module = self.get_queryset().get(pk=kwargs["pk"])
        except Module.DoesNotExist:
            return error_response(message="Module with the given id does not exist.", status_code=404)

        module.delete()
        return success_response(None, message="Module deleted successfully")


class ModuleOrderView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    serializer_class = ModuleOrderEntrySerializer

    def get_permissions(self):
        permission = IsAdmin()
        permission.message = "You do not have permission to perform this action. Only admin can perform this action."
        return [permission]

    def patch(self, request, *args, **kwargs):
        course_id = kwargs["course_id"]
        if not Course.objects.filter(pk=course_id).exists():
            return error_response(message="Course with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            modules = reorder_modules(course_id, serializer.validated_data)
        except ModuleReorderError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            ModuleSerializer(modules, many=True).data,
            message="Modules reordered successfully",
        )
