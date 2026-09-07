from django.contrib import admin

from .models import StudentConcern


@admin.register(StudentConcern)
class StudentConcernAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "student",
        "teacher",
        "category",
        "status",
        "requires_admin_attention",
        "handled_by",
        "created_at",
    )
    list_filter = ("status", "category", "requires_admin_attention")
    search_fields = ("description", "teacher__email", "teacher__name", "student__email", "student__name")
    readonly_fields = ("created_at", "updated_at")
