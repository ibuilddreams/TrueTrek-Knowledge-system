from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers

from courses.models import Category, Course
from tiers.models import Tier

from .models import AICourseGeneration

UserModel = get_user_model()


class SimpleCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "slug", "code", "status"]
        read_only_fields = fields


class GenerationRequestSerializer(serializers.Serializer):
    """What the admin supplies (plan §8.1). Everything the AI is forbidden from
    emitting — code, slug, status, category, instructors, order, due_date — is a
    real FK/value picked here, never invented by the model (plan §8.3)."""

    # Step 1 — course basics
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    difficulty = serializers.ChoiceField(
        choices=Course.Difficulty.choices, default=Course.Difficulty.BEGINNER
    )
    instructors = serializers.PrimaryKeyRelatedField(
        queryset=UserModel.objects.filter(role=UserModel.Roles.TEACHER),
        many=True,
    )
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, default=0, min_value=0)

    # Step 2 — curriculum context
    target_audience = serializers.CharField(required=False, allow_blank=True, default="")
    objectives = serializers.ListField(
        child=serializers.CharField(max_length=500), required=False, default=list
    )
    tier = serializers.PrimaryKeyRelatedField(
        queryset=Tier.objects.all(), required=False, allow_null=True, default=None
    )

    # Step 3 — structure & instructions
    modules_count = serializers.IntegerField(min_value=1, max_value=settings.AI_MAX_MODULES)
    lessons_per_module = serializers.IntegerField(min_value=1, max_value=settings.AI_MAX_LESSONS)
    include_quizzes = serializers.BooleanField(default=True)
    questions_per_quiz = serializers.IntegerField(min_value=1, max_value=20, default=5)
    include_assignments = serializers.BooleanField(default=True)
    weeks_between_modules = serializers.IntegerField(min_value=1, max_value=52, default=2)
    additional_instructions = serializers.CharField(
        required=False, allow_blank=True, default="", max_length=2000
    )

    def validate_instructors(self, value):
        if not value:
            raise serializers.ValidationError(
                "At least one instructor is required — a generated course with no "
                "instructor can never be enrolled."
            )
        return value

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title cannot be blank.")
        return value


class GenerationDetailSerializer(serializers.ModelSerializer):
    """Cheap, poll-safe fields only. Never expose raw_response or normalized_plan
    here — the poll endpoint is hit every 2s by every open wizard and both fields
    are unbounded-size provider payloads used only for debugging."""

    course = SimpleCourseSerializer(read_only=True)

    class Meta:
        model = AICourseGeneration
        fields = [
            "id",
            "status",
            "step",
            "progress_percent",
            "warnings",
            "error_message",
            "course",
            "created_at",
            "started_at",
            "finished_at",
        ]
        read_only_fields = fields


class GenerationListSerializer(serializers.ModelSerializer):
    course = SimpleCourseSerializer(read_only=True)
    title = serializers.SerializerMethodField()
    requested_by_email = serializers.CharField(source="requested_by.email", read_only=True)

    class Meta:
        model = AICourseGeneration
        fields = [
            "id",
            "title",
            "status",
            "step",
            "progress_percent",
            "course",
            "requested_by_email",
            "created_at",
            "started_at",
            "finished_at",
        ]
        read_only_fields = fields

    def get_title(self, obj):
        return (obj.input_payload or {}).get("title", "")
