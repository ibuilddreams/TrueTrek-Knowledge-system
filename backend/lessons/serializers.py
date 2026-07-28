from rest_framework import serializers

from modules.models import Module

from .models import Lesson


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
