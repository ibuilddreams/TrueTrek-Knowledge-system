from rest_framework import serializers

from courses.serializers import CourseListSerializer
from lessons.models import Lesson
from modules.models import Module

from .models import CourseProgress, LessonProgress, ModuleProgress


class ProgressModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "title", "order"]
        read_only_fields = fields


class ProgressLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "title", "order"]
        read_only_fields = fields


class CourseProgressSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)

    class Meta:
        model = CourseProgress
        fields = ["id", "course", "completion_percentage", "is_completed", "completed_at"]
        read_only_fields = fields


class ModuleProgressSerializer(serializers.ModelSerializer):
    module = ProgressModuleSerializer(read_only=True)

    class Meta:
        model = ModuleProgress
        fields = ["id", "module", "completion_percentage", "is_completed", "completed_at"]
        read_only_fields = fields


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson = ProgressLessonSerializer(read_only=True)

    class Meta:
        model = LessonProgress
        fields = ["id", "lesson", "is_completed", "completed_at"]
        read_only_fields = fields
