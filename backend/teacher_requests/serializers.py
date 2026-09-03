from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import TeacherRequest, TeacherRequestStatus

UserModel = get_user_model()


class TeacherRequestUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ["id", "name", "email"]
        read_only_fields = fields


class TeacherRequestSerializer(serializers.ModelSerializer):
    """Read serializer used everywhere a request is returned — teacher's own list/detail and admin's."""

    teacher = TeacherRequestUserSerializer(read_only=True)
    handled_by = TeacherRequestUserSerializer(read_only=True)
    request_type_display = serializers.CharField(source="get_request_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = TeacherRequest
        fields = [
            "id",
            "teacher",
            "request_type",
            "request_type_display",
            "title",
            "description",
            "status",
            "status_display",
            "resolution_description",
            "handled_by",
            "completed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class TeacherRequestCreateSerializer(serializers.ModelSerializer):
    """Teacher-facing create serializer — the teacher and status are always server-assigned, never client input."""

    class Meta:
        model = TeacherRequest
        fields = ["request_type", "title", "description"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value

    def validate_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Description is required.")
        return value

    def to_representation(self, instance):
        return TeacherRequestSerializer(instance, context=self.context).data


class TeacherRequestAdminUpdateSerializer(serializers.ModelSerializer):
    """Admin-facing status/resolution update — title/description are never writable here, preserving the original submission."""

    class Meta:
        model = TeacherRequest
        fields = ["status", "resolution_description"]

    def validate(self, attrs):
        instance = self.instance
        if instance.status == TeacherRequestStatus.COMPLETED:
            raise serializers.ValidationError(
                "This request has already been completed and can no longer be modified."
            )

        new_status = attrs.get("status", instance.status)
        resolution_description = attrs.get("resolution_description", instance.resolution_description).strip()

        if new_status == TeacherRequestStatus.COMPLETED and not resolution_description:
            raise serializers.ValidationError(
                {"resolution_description": "A completion description is required when marking a request as completed."}
            )

        attrs["status"] = new_status
        if "resolution_description" in attrs:
            attrs["resolution_description"] = resolution_description
        return attrs

    def update(self, instance, validated_data):
        request = self.context["request"]
        instance.status = validated_data["status"]
        if "resolution_description" in validated_data:
            instance.resolution_description = validated_data["resolution_description"]
        instance.handled_by = request.user
        if instance.status == TeacherRequestStatus.COMPLETED:
            instance.completed_at = timezone.now()
        instance.save()
        return instance

    def to_representation(self, instance):
        return TeacherRequestSerializer(instance, context=self.context).data
