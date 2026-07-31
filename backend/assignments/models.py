from django.conf import settings
from django.db import models
from django.db.models import Q

from common.models import BaseModel, Status
from courses.models import Course
from modules.models import Module


class Assignment(BaseModel):
    class GradingMode(models.TextChoices):
        MANUAL = "MANUAL", "Manual Review"
        AUTO = "AUTO", "Auto-Check on Submit"

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="assignments")
    module = models.ForeignKey(
        Module, on_delete=models.CASCADE, related_name="assignments", null=True, blank=True
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateTimeField()
    total_marks = models.PositiveIntegerField(default=100)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    grading_mode = models.CharField(
        max_length=20, choices=GradingMode.choices, default=GradingMode.MANUAL
    )
    order = models.PositiveIntegerField(default=0)
    allow_resubmission = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_assignments",
    )

    class Meta:
        ordering = ["module", "order"]
        constraints = [
            models.UniqueConstraint(
                fields=["module", "order"],
                condition=Q(module__isnull=False),
                name="unique_assignment_order_per_module",
            )
        ]

    def __str__(self):
        return self.title


class AssignmentAttachment(BaseModel):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="assignments/attachments/")
    original_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=20, blank=True)
    order = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        ordering = ["assignment", "order"]

    def __str__(self):
        return self.original_name or self.file.name


class AssignmentSubmission(BaseModel):
    class SubmissionStatus(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"
        LATE = "LATE", "Late"
        GRADED = "GRADED", "Graded"
        RETURNED = "RETURNED", "Returned"
        RESUBMITTED = "RESUBMITTED", "Resubmitted"

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name="submissions")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assignment_submissions"
    )
    submission_text = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=SubmissionStatus.choices, default=SubmissionStatus.DRAFT
    )
    marks = models.PositiveIntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="graded_assignment_submissions",
    )
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("assignment", "student")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student} -> {self.assignment}"


class AssignmentSubmissionFile(BaseModel):
    submission = models.ForeignKey(AssignmentSubmission, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="assignments/submissions/")
    original_name = models.CharField(max_length=255, blank=True)
    file_type = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.original_name or self.file.name
