from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from common.models import BaseModel
from courses.models import Course


class InstructorProfile(BaseModel):
    """Public-facing teacher details. Bio, photo and website live on the user's
    existing UserProfile; this holds the instructor-only extras."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="instructor_profile"
    )
    headline = models.CharField(max_length=120, blank=True)
    linkedin_url = models.URLField(blank=True)
    x_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    intro_video_url = models.URLField(blank=True)
    skills = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"Instructor profile of {self.user}"


class InstructorFeedback(BaseModel):
    """A student's rating/comment for an instructor, left for a course the
    student is enrolled in. One entry per (student, instructor, course)."""

    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feedback_received"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="instructor_feedback_given"
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="instructor_feedback")
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)

    class Meta:
        unique_together = ("student", "instructor", "course")
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.student} -> {self.instructor} ({self.rating})"
