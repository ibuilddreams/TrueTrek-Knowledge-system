from django.contrib import admin

from .models import TeacherCredential, TeacherOnboarding


class TeacherCredentialInline(admin.TabularInline):
    model = TeacherCredential
    extra = 0
    readonly_fields = ("original_name", "file_size", "created_at")


@admin.register(TeacherOnboarding)
class TeacherOnboardingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "step", "submitted_at", "reviewed_by", "reviewed_at")
    list_filter = ("status", "step", "highest_qualification")
    search_fields = ("user__email", "user__name", "user__username", "headline")
    readonly_fields = ("created_at", "updated_at", "submitted_at", "reviewed_at")
    inlines = [TeacherCredentialInline]


@admin.register(TeacherCredential)
class TeacherCredentialAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "credential_type", "institution", "year_awarded", "onboarding")
    list_filter = ("credential_type",)
    search_fields = ("title", "institution", "onboarding__user__email")
    readonly_fields = ("created_at", "updated_at", "original_name", "file_size")
