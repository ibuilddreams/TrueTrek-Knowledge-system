from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from courses.models import Course
from courses.serializers import CourseListSerializer
from enrollments.models import Enrollment
from enrollments.services import can_view_student_in_course

from .models import ConcernStatus, StudentConcern

UserModel = get_user_model()


class ConcernUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ["id", "name", "email"]
        read_only_fields = fields


class StudentConcernSerializer(serializers.ModelSerializer):
    """Read serializer used everywhere a concern is returned — teacher's own list/detail and admin's."""

    teacher = ConcernUserSerializer(read_only=True)
    student = ConcernUserSerializer(read_only=True)
    handled_by = ConcernUserSerializer(read_only=True)
    course = CourseListSerializer(read_only=True)
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = StudentConcern
        fields = [
            "id",
            "teacher",
            "student",
            "course",
            "category",
            "category_display",
            "description",
            "requires_admin_attention",
            "status",
            "status_display",
            "resolution_notes",
            "handled_by",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class StudentConcernCreateSerializer(serializers.ModelSerializer):
    """Teacher-facing create serializer — the teacher is always server-assigned, never client input."""

    # Explicit `default=None` (rather than relying on the FK's bare
    # required=False) guarantees "course" is always a key in validated_data,
    # since flag_student_concern() is called with **validated_data.
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), required=False, allow_null=True, default=None
    )

    class Meta:
        model = StudentConcern
        fields = ["student", "course", "category", "description", "requires_admin_attention"]

    def validate_description(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Description is required.")
        return value

    def validate(self, attrs):
        teacher = self.context["request"].user
        student = attrs["student"]
        course = attrs.get("course")

        if course is not None:
            if not can_view_student_in_course(teacher, student.id, course):
                raise serializers.ValidationError(
                    {"course": "This student is not enrolled with you in that course."}
                )
        elif not Enrollment.objects.filter(student=student, teacher=teacher).exists():
            raise serializers.ValidationError({"student": "This student is not in your roster."})

        return attrs

    def to_representation(self, instance):
        return StudentConcernSerializer(instance, context=self.context).data


class StudentConcernAdminUpdateSerializer(serializers.ModelSerializer):
    """Admin-facing status/resolution update — everything else is read-only, preserving the original report."""

    class Meta:
        model = StudentConcern
        fields = ["status", "resolution_notes"]

    def validate(self, attrs):
        instance = self.instance
        if instance.status == ConcernStatus.RESOLVED:
            raise serializers.ValidationError(
                "This concern has already been resolved and can no longer be modified."
            )

        new_status = attrs.get("status", instance.status)
        resolution_notes = attrs.get("resolution_notes", instance.resolution_notes).strip()

        if new_status == ConcernStatus.RESOLVED and not resolution_notes:
            raise serializers.ValidationError(
                {"resolution_notes": "Resolution notes are required when marking a concern as resolved."}
            )

        attrs["status"] = new_status
        if "resolution_notes" in attrs:
            attrs["resolution_notes"] = resolution_notes
        return attrs

    def update(self, instance, validated_data):
        request = self.context["request"]
        instance.status = validated_data["status"]
        if "resolution_notes" in validated_data:
            instance.resolution_notes = validated_data["resolution_notes"]
        instance.handled_by = request.user
        if instance.status == ConcernStatus.RESOLVED:
            instance.resolved_at = timezone.now()
        instance.save()
        return instance

    def to_representation(self, instance):
        return StudentConcernSerializer(instance, context=self.context).data
