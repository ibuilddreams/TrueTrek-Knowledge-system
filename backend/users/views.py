from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework_simplejwt.views import TokenObtainPairView

from common.pagination import Pagination
from common.response import success_response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .permissions import IsAdmin
from .serializers import (
    CreateStudentSerializer,
    CustomTokenObtainPairSerializer,
    ForgotPasswordSerializer,
    ProfileSerializer,
    ResetPasswordSerializer,
    StudentSerializer,
)
from .services import send_password_reset_email

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

    def get_permissions(self):
        if self.request.method == "POST":
            permission = IsAdmin()
            permission.message = (
                "You don't have permission to perform this action. "
                "This action can be performed only by admin. "
                "Students can be created only by admin."
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


class ProfileView(generics.RetrieveAPIView):
    """Returns the profile information of the currently logged-in user."""

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return success_response(serializer.data, message="Profile fetched successfully")


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
