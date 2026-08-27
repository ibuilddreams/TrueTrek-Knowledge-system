from django.conf import settings
from django.db import models

from common.models import BaseModel


class Conversation(BaseModel):
    """A 1:1 thread between two users. participant_one is always the lower-pk user
    (enforced in services.get_or_create_conversation) so (a, b) and (b, a) collapse
    to the same row and unique_together can do its job."""

    participant_one = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations_as_one"
    )
    participant_two = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations_as_two"
    )
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("participant_one", "participant_two")
        ordering = ["-last_message_at", "-created_at"]

    def __str__(self):
        return f"{self.participant_one} <-> {self.participant_two}"

    def other_participant(self, user):
        return self.participant_two if user.pk == self.participant_one_id else self.participant_one


class Message(BaseModel):
    class AttachmentType(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        VIDEO = "VIDEO", "Video"
        DOCUMENT = "DOCUMENT", "Document"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages"
    )
    # Blank is allowed because a message can carry only an attachment with no
    # caption text — see services.send_message / SendMessageSerializer.validate.
    body = models.TextField(blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)

    # Soft delete: the row is kept (so conversation history/ordering stays intact)
    # but body/attachment are cleared and the API reports it as deleted rather
    # than exposing stale content — see services.delete_message.
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    attachment = models.FileField(upload_to="messaging/attachments/%Y/%m/", blank=True, null=True)
    attachment_original_name = models.CharField(max_length=255, blank=True)
    attachment_type = models.CharField(max_length=20, choices=AttachmentType.choices, blank=True)
    attachment_size = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["conversation", "-created_at"]),
            models.Index(fields=["conversation", "is_read"]),
        ]

    def __str__(self):
        return f"{self.sender} @ {self.created_at}: {self.body[:30]}"


class MessageReaction(BaseModel):
    """One reaction per user per message — picking a new emoji replaces the
    previous one rather than stacking, matching WhatsApp's reaction model."""

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="reactions")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="message_reactions"
    )
    emoji = models.CharField(max_length=8)

    class Meta:
        unique_together = ("message", "user")

    def __str__(self):
        return f"{self.user} reacted {self.emoji} to message {self.message_id}"
