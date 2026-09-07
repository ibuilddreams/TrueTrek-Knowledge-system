from django.conf import settings
from django.db import models

from common.models import BaseModel


class Notification(BaseModel):
    """A generic in-app notification for one recipient. `related_object_type`
    / `related_object_id` are a plain typed pair rather than a
    GenericForeignKey (no app in this codebase uses contenttypes) or a stored
    URL (which would go stale if a frontend route is ever restructured) —
    routing to the right screen is entirely the frontend's job."""

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    verb = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["recipient", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.verb} -> {self.recipient_id}"
