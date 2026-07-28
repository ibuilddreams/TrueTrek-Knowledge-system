from django.contrib import admin

from .models import Lesson


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "content_type", "order", "duration_minutes", "created_at")
    list_filter = ("module__course", "content_type")
    search_fields = ("title", "module__title")
    ordering = ("module", "order")
    autocomplete_fields = ("module",)
