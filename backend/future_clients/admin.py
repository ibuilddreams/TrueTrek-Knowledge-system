from django.contrib import admin

from .models import FutureClientApplication


@admin.register(FutureClientApplication)
class FutureClientApplicationAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "status", "created_at", "reviewed_at")
    list_filter = ("status", "created_at")
    search_fields = ("first_name", "last_name", "email")
    autocomplete_fields = ("courses", "reviewed_by", "created_student")
