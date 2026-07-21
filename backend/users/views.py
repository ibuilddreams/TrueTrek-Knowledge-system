from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework_simplejwt.views import TokenObtainPairView

from common.pagination import Pagination
from common.response import success_response
from rest_framework.permissions import IsAuthenticated

from .serializers import CreateStudentSerializer, CustomTokenObtainPairSerializer, StudentSerializer

UserModel = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Login endpoint: authenticates a user and returns JWT tokens."""

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return success_response(serializer.data, message="Login Successful")


class StudentListCreateView(generics.ListCreateAPIView):
    """Lists all users with the STUDENT role, and creates new ones."""

    queryset = UserModel.objects.filter(role=UserModel.Roles.STUDENT)
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

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
