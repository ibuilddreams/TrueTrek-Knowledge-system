from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from common.models import Status
from courses.models import Course
from courses.serializers import PublicCourseListSerializer

from .models import ApplicationStatus, FutureClientApplication

UserModel = get_user_model()


class FutureClientReviewerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="name", read_only=True)

    class Meta:
        model = UserModel
        fields = ["id", "full_name", "email"]
        read_only_fields = fields


class FutureClientApplicationSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    courses = PublicCourseListSerializer(many=True, read_only=True)
    reviewed_by = FutureClientReviewerSerializer(read_only=True)
    submitted_at = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = FutureClientApplication
        fields = [
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "courses",
            "status",
            "rejection_reason",
            "submitted_at",
            "reviewed_at",
            "reviewed_by",
        ]
        read_only_fields = fields

    def get_full_name(self, instance):
        return f"{instance.first_name} {instance.last_name}".strip()


class PublicApplicationCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    courses = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Course.objects.filter(status=Status.PUBLISHED)
    )

    class Meta:
        model = FutureClientApplication
        fields = ["id", "first_name", "last_name", "email", "password", "courses"]

    def validate_email(self, value):
        email = UserModel.objects.normalize_email(value)
        if UserModel.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        if FutureClientApplication.objects.filter(
            email__iexact=email, status=ApplicationStatus.PENDING
        ).exists():
            raise serializers.ValidationError(
                "An application with this email is already pending review."
            )
        return email

    def validate_courses(self, value):
        if not value:
            raise serializers.ValidationError("Select at least one course.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        courses = validated_data.pop("courses")

        application = FutureClientApplication.objects.create(
            password_hash=make_password(password),
            status=ApplicationStatus.PENDING,
            **validated_data,
        )
        application.courses.set(courses)
        return application

    def to_representation(self, instance):
        return FutureClientApplicationSerializer(instance, context=self.context).data


class ApplicationRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(required=True, allow_blank=False)
