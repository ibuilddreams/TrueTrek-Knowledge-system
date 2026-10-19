from django.contrib import admin

from .models import MediaKitReview


@admin.register(MediaKitReview)
class MediaKitReviewAdmin(admin.ModelAdmin):
    list_display = ("student", "original_name", "status", "overall_score", "created_at")
    list_filter = ("status",)
    search_fields = ("student__email", "original_name")
    readonly_fields = ("created_at", "updated_at", "started_at", "completed_at")
