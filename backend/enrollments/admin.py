from django.contrib import admin

from .models import Enrollment, EnrollmentHistory


class EnrollmentHistoryInline(admin.TabularInline):
    model = EnrollmentHistory
    extra = 0
    readonly_fields = ("previous_status", "new_status", "note", "created_at")
    can_delete = False


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ("student", "course", "status", "enrolled_at")
    list_filter = ("status", "course")
    search_fields = ("student__username", "student__email", "course__title")
    autocomplete_fields = ("student", "course")
    inlines = (EnrollmentHistoryInline,)


@admin.register(EnrollmentHistory)
class EnrollmentHistoryAdmin(admin.ModelAdmin):
    list_display = ("enrollment", "previous_status", "new_status", "created_at")
    list_filter = ("previous_status", "new_status")
    search_fields = ("enrollment__student__username", "enrollment__course__title")
    autocomplete_fields = ("enrollment",)
