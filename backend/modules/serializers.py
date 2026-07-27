from rest_framework import serializers

from courses.models import Course

from .models import Module


class ModuleCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "slug"]
        read_only_fields = fields


class ModuleSerializer(serializers.ModelSerializer):
    course = ModuleCourseSerializer(read_only=True)

    class Meta:
        model = Module
        fields = ["id", "course", "title", "description", "order", "created_at", "updated_at"]
        read_only_fields = fields


class ModuleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "course", "title", "description", "order"]
        read_only_fields = ["id"]
