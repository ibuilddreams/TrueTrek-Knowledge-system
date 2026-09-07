from django.conf import settings
from django.db import models

from common.models import BaseModel
from courses.models import Course


class FeedPost(BaseModel):
    """A short video/content post a teacher shares with everyone enrolled in
    one of their courses — a lightweight broadcast, distinct from War Room
    (discussion) and from Lesson content (structured curriculum)."""

    class AttachmentType(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        VIDEO = "VIDEO", "Video"

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="feed_posts")
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="feed_posts",
        limit_choices_to={"role": "TEACHER"},
    )
    title = models.CharField(max_length=255, blank=True)
    caption = models.TextField(blank=True)
    attachment = models.FileField(upload_to="class_feed/attachments/%Y/%m/", blank=True, null=True)
    attachment_original_name = models.CharField(max_length=255, blank=True)
    attachment_type = models.CharField(max_length=20, choices=AttachmentType.choices, blank=True)
    attachment_size = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["course", "-created_at"])]

    def __str__(self):
        return f"{self.title or 'Post'} ({self.course_id})"
