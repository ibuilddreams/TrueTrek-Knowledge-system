from django.contrib import admin

from .models import (
    Assignment,
    AssignmentAIReview,
    AssignmentAttachment,
    AssignmentRubric,
    AssignmentRubricCriterion,
    AssignmentSubmission,
    AssignmentSubmissionFile,
)


class AssignmentAttachmentInline(admin.TabularInline):
    model = AssignmentAttachment
    extra = 1
    fields = ("file", "original_name", "file_type", "uploaded_by")


class AssignmentRubricCriterionInline(admin.TabularInline):
    model = AssignmentRubricCriterion
    extra = 0
    fields = ("name", "description", "max_marks", "order")


class AssignmentSubmissionFileInline(admin.TabularInline):
    model = AssignmentSubmissionFile
    extra = 0
    fields = ("file", "original_name", "file_type")


class AssignmentAIReviewInline(admin.TabularInline):
    """Read-only audit trail of every AI grading attempt for a submission —
    same "visible but not editable" convention as AIDrillGeneration's admin
    registration."""

    model = AssignmentAIReview
    extra = 0
    fields = (
        "attempt_number",
        "status",
        "score",
        "created_at",
    )
    readonly_fields = fields
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


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


@admin.register(AssignmentRubric)
class AssignmentRubricAdmin(admin.ModelAdmin):
    list_display = ("assignment", "grading_method")
    search_fields = ("assignment__title",)
    autocomplete_fields = ("assignment",)
    inlines = (AssignmentRubricCriterionInline,)


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "assignment", "status", "marks", "submitted_at", "graded_at")
    list_filter = ("status",)
    search_fields = ("student__username", "assignment__title")
    autocomplete_fields = ("assignment", "student", "graded_by")
    inlines = (AssignmentSubmissionFileInline, AssignmentAIReviewInline)
