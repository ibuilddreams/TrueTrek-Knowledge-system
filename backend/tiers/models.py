from django.conf import settings
from django.db import models
from django.utils.text import slugify

from common.models import BaseModel, Status
from pathways.models import Pathway


class Tier(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    level = models.PositiveIntegerField(unique=True)
    audience = models.CharField(max_length=255, blank=True)
    focus_description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    category = models.ForeignKey(
        "courses.Category", on_delete=models.PROTECT, related_name="tiers", null=True, blank=True
    )
    estimated_duration = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["level"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class TierProgress(BaseModel):
    class ProgressStatus(models.TextChoices):
        LOCKED = "LOCKED", "Locked"
        UNLOCKED = "UNLOCKED", "Unlocked"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tier_progress"
    )
    tier = models.ForeignKey(Tier, on_delete=models.CASCADE, related_name="progress_records")
    progress_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20, choices=ProgressStatus.choices, default=ProgressStatus.LOCKED
    )
    unlocked_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("student", "tier")

    def __str__(self):
        return f"{self.student} -> {self.tier} ({self.status})"


class TierPathway(BaseModel):
    """A pathway can belong to more than one tier (e.g. a cross-cutting pathway
    shared between an athlete tier and its recruiting-window tier) — this is a
    genuine many-to-many, not a Pathway.tier FK, with its own per-tier ordering."""

    tier = models.ForeignKey(Tier, on_delete=models.CASCADE, related_name="tier_pathways")
    pathway = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name="tier_pathways")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("tier", "pathway")
        ordering = ["tier", "order"]
        constraints = [
            models.UniqueConstraint(
                fields=["tier", "order"],
                name="unique_tierpathway_order_per_tier",
            )
        ]

    def __str__(self):
        return f"{self.tier} -> {self.pathway}"
