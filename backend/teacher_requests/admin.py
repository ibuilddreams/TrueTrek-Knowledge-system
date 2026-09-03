from django.contrib import admin

from .models import TeacherRequest


@admin.register(TeacherRequest)
class TeacherRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "teacher", "request_type", "status", "handled_by", "created_at")
    list_filter = ("status", "request_type")
    search_fields = ("title", "description", "teacher__email", "teacher__name")
    readonly_fields = ("created_at", "updated_at")
