from django.contrib import admin

from .models import RoomMessage


@admin.register(RoomMessage)
class RoomMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "course", "sender", "attachment_type", "is_deleted", "created_at")
    list_filter = ("attachment_type", "is_deleted")
    search_fields = ("body", "sender__email", "sender__name", "course__title")
    readonly_fields = ("created_at", "updated_at")
