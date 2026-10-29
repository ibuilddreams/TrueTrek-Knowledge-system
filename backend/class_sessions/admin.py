from django.contrib import admin

from .models import ClassSession, ClassSessionAttendance


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "teacher", "scheduled_at", "duration_minutes", "status")
    list_filter = ("status", "scheduled_at")
    search_fields = ("title", "course__title", "course__code", "teacher__email")
    # Server-owned: a channel name is minted once per class and every token
    # already issued is bound to it (see services.issue_join_credentials).
    readonly_fields = ("channel_name",)


@admin.register(ClassSessionAttendance)
class ClassSessionAttendanceAdmin(admin.ModelAdmin):
    list_display = ("session", "user", "role", "first_joined_at", "last_joined_at", "join_count")
    list_filter = ("role",)
    search_fields = ("user__email", "session__title")
