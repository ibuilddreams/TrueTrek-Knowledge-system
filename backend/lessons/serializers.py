from rest_framework import serializers

from modules.models import Module

from .models import Lesson, LessonResource


class LessonModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "title"]
        read_only_fields = fields


class LessonSerializer(serializers.ModelSerializer):
    module = LessonModuleSerializer(read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "module",
            "title",
            "description",
            "content",
            "duration_minutes",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class LessonWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "module", "title", "description", "content", "duration_minutes", "order"]
        read_only_fields = ["id"]


class LessonResourceLessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ["id", "title"]
        read_only_fields = fields


class LessonResourceSerializer(serializers.ModelSerializer):
    lesson = LessonResourceLessonSerializer(read_only=True)

    class Meta:
        model = LessonResource
        fields = [
            "id",
            "lesson",
            "title",
            "resource_type",
            "url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class LessonResourceWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonResource
        fields = ["id", "lesson", "title", "resource_type", "url"]
        read_only_fields = ["id"]
