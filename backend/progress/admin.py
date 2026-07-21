from django.contrib import admin

from .models import CourseProgress, LearningActivity, LessonProgress, ModuleProgress


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("student", "lesson", "is_completed", "completed_at")
    list_filter = ("is_completed",)
    search_fields = ("student__username", "lesson__title")
    autocomplete_fields = ("student", "lesson")


@admin.register(ModuleProgress)
class ModuleProgressAdmin(admin.ModelAdmin):
    list_display = ("student", "module", "completion_percentage", "is_completed", "completed_at")
    list_filter = ("is_completed",)
    search_fields = ("student__username", "module__title")
    autocomplete_fields = ("student", "module")


@admin.register(CourseProgress)
class CourseProgressAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "completion_percentage", "is_completed", "completed_at")
    list_filter = ("is_completed", "course")
    search_fields = ("student__username", "course__title")
    autocomplete_fields = ("student", "course")


@admin.register(LearningActivity)
class LearningActivityAdmin(admin.ModelAdmin):
    list_display = ("student", "activity_type", "course", "lesson", "created_at")
    list_filter = ("activity_type",)
    search_fields = ("student__username", "course__title", "lesson__title")
    autocomplete_fields = ("student", "course", "lesson")
