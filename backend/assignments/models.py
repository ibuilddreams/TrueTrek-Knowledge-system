from django.conf import settings
from django.db import models
from django.db.models import Q

from common.models import BaseModel, Status
from courses.models import Course
from modules.models import Module


class Assignment(BaseModel):
    class GradingMode(models.TextChoices):
        MANUAL = "MANUAL", "Manual Review"
        AI = "AI", "AI Grading"

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


class AssignmentRubric(BaseModel):
    """Trusted grading configuration for an AI-graded assignment. One rubric
    per assignment; criteria are written wholesale (delete-all-then-recreate)
    from a nested list on the assignment write serializer — same convention
    as onboarding.Question options / AdminDrillQuizQuestion — rather than a
    separate CRUD API."""

    class GradingMethod(models.TextChoices):
        # Whole-submission evaluation against named dimensions (Understanding,
        # Accuracy, Completeness, ...) — the right fit for open-ended, single-
        # task assignments with no discrete question structure.
        RUBRIC = "RUBRIC", "Rubric / Criteria Based"
        # Each criterion IS a discrete question (with its own name/description
        # holding the question text and its own max_marks) — the AI matches
        # each part of the submission to the question it answers and grades
        # them independently. Same underlying criteria list either way; only
        # the AI's instructions and the frontend's labels differ by mode.
        QUESTION_BASED = "QUESTION_BASED", "Question Based"

    assignment = models.OneToOneField(Assignment, on_delete=models.CASCADE, related_name="rubric")
    grading_method = models.CharField(
        max_length=20, choices=GradingMethod.choices, default=GradingMethod.RUBRIC
    )

    def __str__(self):
        return f"Rubric for {self.assignment}"


class AssignmentRubricCriterion(BaseModel):
    """A single gradable item within a rubric — either a rubric dimension
    (RUBRIC mode) or a discrete question (QUESTION_BASED mode); see
    AssignmentRubric.GradingMethod. `name` is a short label ("Understanding"
    or "Question 1"); `description` doubles as either a longer criterion
    description or the actual question text. `max_marks` values across a
    rubric's criteria must sum to exactly `assignment.total_marks` — enforced
    at publish time (assignments/services.py::publish_assignment) so a final
    "earned / max" score is always precise."""

    rubric = models.ForeignKey(AssignmentRubric, on_delete=models.CASCADE, related_name="criteria")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    max_marks = models.PositiveIntegerField(default=10)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["rubric", "order"]

    def __str__(self):
        return self.name


class AssignmentAIReview(BaseModel):
    """One row per AI grading attempt for a submission (append-only, never
    overwritten) — unlike AssignmentSubmission's single-mutable-row
    resubmission convention, a history is kept here as a genuine audit trail
    of every evaluation attempt for teachers/admins to review.

    A single-pass grading feature: a COMPLETED review always immediately
    grades the submission from its backend-computed score — there is no
    pass/revision-required verdict or gating threshold. This mirrors how
    quiz short-answer AI grading already works (quizzes/ai_grading.py)."""

    class ReviewStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    submission = models.ForeignKey(
        AssignmentSubmission, on_delete=models.CASCADE, related_name="ai_reviews"
    )
    attempt_number = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING
    )
    # Backend-computed percentage (0-100): sum(validated awarded_marks) /
    # sum(criterion.max_marks) * 100 — never an AI-provided total.
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    # [{"name", "max_marks", "awarded_marks", "feedback"}, ...] — one entry
    # per AssignmentRubricCriterion, backend-validated and clamped.
    criteria_results = models.JSONField(default=list, blank=True)
    strengths = models.JSONField(default=list, blank=True)
    improvements = models.JSONField(default=list, blank=True)
    provider = models.CharField(max_length=50, blank=True)
    model_name = models.CharField(max_length=100, blank=True)
    # Internal-only — never serialized to students. Safe, generic messaging
    # is what the API actually returns; this is for admin/teacher/debugging.
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["submission", "-attempt_number"]
        unique_together = ("submission", "attempt_number")

    def __str__(self):
        return f"AI review #{self.attempt_number} for {self.submission}"
