from django.conf import settings
from django.db import models

from common.models import BaseModel


class MediaKitReview(BaseModel):
    """One AI critique of one uploaded athlete media kit.

    The row is created immediately (status PENDING) and filled in by a
    background thread, exactly like `ai_courses.AICourseGeneration` — there
    is still no Celery/Redis in this codebase, so the frontend polls this row
    rather than holding a request open for the length of a model call.

    The structured findings are stored as JSON lists rather than as separate
    related tables because nothing ever queries *into* them: they are written
    once by the provider mapping and read back wholesale to render the
    results screen. Shape is enforced on write by `validators.py`, never
    trusted straight from the provider.
    """

    class ReviewStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        FAILED = "FAILED", "Failed"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="media_kit_reviews"
    )
    file = models.FileField(upload_to="brand_validator/media_kits/%Y/%m/")
    original_name = models.CharField(max_length=255, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True)

    # Optional free-text the student adds before submitting ("I'm a junior
    # point guard looking for local sponsors") — passed to the model as
    # context so the critique is specific rather than generic.
    athlete_context = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)

    # --- Findings, all populated together when status becomes COMPLETED ---
    # False when the upload turned out not to be a media kit at all (a random
    # photo, a blank page). The review still COMPLETES — nothing failed — but
    # the UI shows "that isn't a media kit" instead of a misleading 0/100.
    is_media_kit = models.BooleanField(default=True)
    overall_score = models.PositiveSmallIntegerField(null=True, blank=True)  # 0-100
    verdict = models.CharField(max_length=255, blank=True)
    summary = models.TextField(blank=True)
    # [{"title": str, "detail": str}]
    strengths = models.JSONField(default=list, blank=True)
    # [{"title": str, "detail": str, "severity": "HIGH"|"MEDIUM"|"LOW"}]
    weaknesses = models.JSONField(default=list, blank=True)
    # [{"title": str, "detail": str, "priority": int}]
    recommendations = models.JSONField(default=list, blank=True)
    # ["Engagement statistics", "Clear value proposition", ...]
    missing_elements = models.JSONField(default=list, blank=True)
    # What a sponsor would literally say — the "local business owner" voice
    # the brief asks for, kept separate from `summary` so the UI can quote it.
    sponsor_verdict = models.TextField(blank=True)

    provider = models.CharField(max_length=50, blank=True)
    model_name = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["student", "-created_at"])]

    def __str__(self):
        return f"{self.student} - media kit review #{self.pk} ({self.status})"
