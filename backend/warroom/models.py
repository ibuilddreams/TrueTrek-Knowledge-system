from django.conf import settings
from django.db import models

from common.models import BaseModel
from courses.models import Course


class RoomMessage(BaseModel):
    """A message in a course's War Room — one group chat per course, with
    every enrolled student and every instructor of that course as members.

    There is deliberately no `Room` model: the room *is* `course_id` (a fixed
    1:1 with Course, not an independently created/renamed thing), and
    membership is resolved live from Enrollment/CourseInstructor rather than
    stored (see warroom.services), so there is nothing else to persist about
    a "room" itself."""

    class AttachmentType(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        VIDEO = "VIDEO", "Video"
        DOCUMENT = "DOCUMENT", "Document"

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="room_messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_room_messages"
    )
    # Blank is allowed because a message can carry only an attachment with no
    # caption text — mirrors messaging.Message.
    body = models.TextField(blank=True)

    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    # Soft delete: the row is kept (so thread ordering stays intact) but
    # body/attachment are cleared — mirrors messaging.Message.
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    attachment = models.FileField(upload_to="warroom/attachments/%Y/%m/", blank=True, null=True)
    attachment_original_name = models.CharField(max_length=255, blank=True)
    attachment_type = models.CharField(max_length=20, choices=AttachmentType.choices, blank=True)
    attachment_size = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["course", "-created_at"])]

    def __str__(self):
        return f"{self.sender} @ {self.created_at}: {self.body[:30]}"
