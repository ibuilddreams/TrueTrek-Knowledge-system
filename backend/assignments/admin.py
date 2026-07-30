from django.contrib import admin

from .models import (
    Assignment,
    AssignmentAttachment,
    AssignmentSubmission,
    AssignmentSubmissionFile,
)


class AssignmentAttachmentInline(admin.TabularInline):
    model = AssignmentAttachment
    extra = 1
    fields = ("file", "original_name", "file_type", "uploaded_by")


class AssignmentSubmissionFileInline(admin.TabularInline):
    model = AssignmentSubmissionFile
    extra = 0
    fields = ("file", "original_name", "file_type")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "course",
        "status",
        "grading_mode",
        "due_date",
        "total_marks",
        "order",
        "created_at",
    )
    list_filter = ("status", "grading_mode", "allow_resubmission")
    search_fields = ("title", "course__title")
    autocomplete_fields = ("course", "module", "created_by")
    inlines = (AssignmentAttachmentInline,)


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "assignment", "status", "marks", "submitted_at", "graded_at")
    list_filter = ("status",)
    search_fields = ("student__username", "assignment__title")
    autocomplete_fields = ("assignment", "student", "graded_by")
    inlines = (AssignmentSubmissionFileInline,)
