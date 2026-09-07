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
    is_locked = serializers.SerializerMethodField()
    lock_info = serializers.SerializerMethodField()

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
            "is_locked",
            "lock_info",
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

    def _lock_map_for_course(self, obj):
        # Task 18 — only meaningful for a student (admins/teachers are never
        # gated). Cached per course_id on the shared serializer context so a
        # `many=True` module list only computes the lock map once per course,
        # not once per module row.
        request = self.context.get("request")
        user = getattr(request, "user", None)
        cache_key = f"_module_lock_map_{obj.course_id}"
        if cache_key not in self.context:
            if user and user.is_authenticated and user.is_student:
                from progress.services import get_module_lock_map

                self.context[cache_key] = get_module_lock_map(user, obj.course)
            else:
                self.context[cache_key] = {}
        return self.context[cache_key]

    def get_is_locked(self, obj):
        return obj.id in self._lock_map_for_course(obj)

    def get_lock_info(self, obj):
        return self._lock_map_for_course(obj).get(obj.id)


class ModuleWriteSerializer(serializers.ModelSerializer):
    order = serializers.IntegerField(min_value=1)

    class Meta:
        model = Module
        fields = ["id", "course", "title", "description", "order"]
        read_only_fields = ["id"]


class ModuleOrderEntrySerializer(serializers.Serializer):
    module_id = serializers.IntegerField()
    order = serializers.IntegerField(min_value=1)
