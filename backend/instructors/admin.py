from django.contrib import admin

from .models import InstructorFeedback, InstructorProfile


@admin.register(InstructorProfile)
class InstructorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "headline", "updated_at")
    search_fields = ("user__username", "user__email", "user__name", "headline")
    autocomplete_fields = ("user",)


@admin.register(InstructorFeedback)
class InstructorFeedbackAdmin(admin.ModelAdmin):
    list_display = ("instructor", "student", "course", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("instructor__email", "student__email", "course__title", "comment")
    autocomplete_fields = ("instructor", "student", "course")
