from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.text import slugify

from common.models import BaseModel, Status
from courses.models import Course


class Pathway(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    summary = models.CharField(max_length=500, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class PathwayCourse(BaseModel):
    pathway = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name="pathway_courses")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="pathway_courses")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("pathway", "course")
        ordering = ["pathway", "order"]
        constraints = [
            models.UniqueConstraint(
                fields=["pathway", "order"],
                condition=Q(pathway__isnull=False),
                name="unique_pathwaycourse_order_per_pathway",
            )
        ]

    def __str__(self):
        return f"{self.pathway} -> {self.course}"


class PathwayBundleRule(BaseModel):
    pathway_count = models.PositiveIntegerField(unique=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        ordering = ["pathway_count"]

    def __str__(self):
        return f"{self.pathway_count} pathways -> {self.discount_percent}% off"


class PathwayEnrollment(BaseModel):
    class EnrollmentStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        CANCELLED = "CANCELLED", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="pathway_enrollments"
    )
    pathway = models.ForeignKey(Pathway, on_delete=models.CASCADE, related_name="enrollments")
    status = models.CharField(
        max_length=20, choices=EnrollmentStatus.choices, default=EnrollmentStatus.ACTIVE
    )
    price_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "pathway")
        ordering = ["-enrolled_at"]

    def __str__(self):
        return f"{self.user} -> {self.pathway}"
