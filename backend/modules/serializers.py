from django.db.models import Sum
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
    lessons_count = serializers.SerializerMethodField()
    total_duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = [
            "id",
            "course",
            "title",
            "description",
            "order",
            "lessons_count",
            "total_duration_minutes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_lessons_count(self, obj):
        return obj.lessons.count()

    def get_total_duration_minutes(self, obj):
        return obj.lessons.aggregate(total=Sum("duration_minutes"))["total"] or 0


class ModuleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ["id", "course", "title", "description", "order"]
        read_only_fields = ["id"]
