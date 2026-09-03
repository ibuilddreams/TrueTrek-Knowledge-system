from django.conf import settings
from django.db import models

from common.models import BaseModel


class TeacherRequestType(models.TextChoices):
    CHANGE_REQUEST = "CHANGE_REQUEST", "Request a Change"
    ERROR_REPORT = "ERROR_REPORT", "Report an Error"


class TeacherRequestStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    COMPLETED = "COMPLETED", "Completed"


class TeacherRequest(BaseModel):
    """A teacher-submitted change request or error report, tracked through to admin resolution."""

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="teacher_requests",
        limit_choices_to={"role": "TEACHER"},
    )
    request_type = models.CharField(max_length=20, choices=TeacherRequestType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField(max_length=5000)
    status = models.CharField(
        max_length=20, choices=TeacherRequestStatus.choices, default=TeacherRequestStatus.PENDING
    )
    resolution_description = models.TextField(max_length=5000, blank=True, default="")
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="handled_teacher_requests",
        limit_choices_to={"role": "ADMIN"},
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.teacher_id})"
