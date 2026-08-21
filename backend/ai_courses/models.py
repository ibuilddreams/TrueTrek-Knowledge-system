from django.conf import settings
from django.db import models

from common.models import BaseModel
from courses.models import Course


class AICourseGeneration(BaseModel):
    """One request to generate a full course tree from an AI provider.

    Deliberately not reusing common.models.Status — that enum has no PENDING/RUNNING
    member, and reusing DRAFT for "awaiting review" would collide with human-authored
    drafts across five unrelated models. PARTIAL is a first-class outcome here, not an
    error: a course with some warnings is still a real, reviewable draft.
    """

    class GenerationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        RUNNING = "RUNNING", "Running"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        PARTIAL = "PARTIAL", "Partial"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_course_generations"
    )
    status = models.CharField(
        max_length=20, choices=GenerationStatus.choices, default=GenerationStatus.PENDING
    )
    step = models.CharField(max_length=255, blank=True)
    progress_percent = models.PositiveIntegerField(default=0)

    provider = models.CharField(max_length=50, blank=True)
    model_name = models.CharField(max_length=100, blank=True)

    input_payload = models.JSONField()
    prompt_version = models.CharField(max_length=20, blank=True)
    raw_response = models.TextField(blank=True)
    normalized_plan = models.JSONField(null=True, blank=True)

    course = models.ForeignKey(
        Course, on_delete=models.SET_NULL, null=True, blank=True, related_name="ai_generations"
    )
    warnings = models.JSONField(default=list, blank=True)
    error_message = models.TextField(blank=True)

    input_tokens = models.PositiveIntegerField(null=True, blank=True)
    output_tokens = models.PositiveIntegerField(null=True, blank=True)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)

    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    heartbeat_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"AICourseGeneration #{self.pk} ({self.status})"

    @property
    def is_terminal(self):
        return self.status in (
            self.GenerationStatus.SUCCEEDED,
            self.GenerationStatus.PARTIAL,
            self.GenerationStatus.FAILED,
            self.GenerationStatus.CANCELLED,
        )
