from django.contrib import admin

from .models import FeedPost


@admin.register(FeedPost)
class FeedPostAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "course", "teacher", "attachment_type", "created_at")
    list_filter = ("attachment_type",)
    search_fields = ("title", "caption", "teacher__email", "teacher__name", "course__title")
    readonly_fields = ("created_at", "updated_at")
