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
    assignments_count = serializers.SerializerMethodField()
    quizzes_count = serializers.SerializerMethodField()

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
            "assignments_count",
            "quizzes_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_lessons_count(self, obj):
        return obj.lessons.count()

    def get_total_duration_minutes(self, obj):
        return obj.lessons.aggregate(total=Sum("duration_minutes"))["total"] or 0

    def get_assignments_count(self, obj):
        return obj.assignments.count()

    def get_quizzes_count(self, obj):
        return obj.quizzes.count()


class ModuleWriteSerializer(serializers.ModelSerializer):
    order = serializers.IntegerField(min_value=1)

    class Meta:
        model = Module
        fields = ["id", "course", "title", "description", "order"]
        read_only_fields = ["id"]


class ModuleOrderEntrySerializer(serializers.Serializer):
    module_id = serializers.IntegerField()
    order = serializers.IntegerField(min_value=1)
