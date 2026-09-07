from django.conf import settings
from django.db import models

from common.models import BaseModel
from courses.models import Course


class ConcernCategory(models.TextChoices):
    ACADEMIC = "ACADEMIC", "Academic"
    BEHAVIORAL = "BEHAVIORAL", "Behavioral"
    ATTENDANCE = "ATTENDANCE", "Attendance"
    SAFETY = "SAFETY", "Safety"
    OTHER = "OTHER", "Other"


class ConcernStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    RESOLVED = "RESOLVED", "Resolved"


class StudentConcern(BaseModel):
    """A teacher-flagged concern about a specific student, optionally escalated
    to admin attention — modeled on teacher_requests.TeacherRequest."""

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="flagged_concerns",
        limit_choices_to={"role": "TEACHER"},
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="concerns_raised_about_me",
        limit_choices_to={"role": "STUDENT"},
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_concerns",
    )
    category = models.CharField(max_length=20, choices=ConcernCategory.choices)
    description = models.TextField(max_length=5000)
    requires_admin_attention = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=ConcernStatus.choices, default=ConcernStatus.PENDING)
    resolution_notes = models.TextField(max_length=5000, blank=True, default="")
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="handled_student_concerns",
        limit_choices_to={"role": "ADMIN"},
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Concern about {self.student_id} by {self.teacher_id}"
