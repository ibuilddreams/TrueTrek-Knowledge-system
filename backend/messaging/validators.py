import os

from rest_framework import serializers

from .models import Message

MAX_ATTACHMENT_SIZE_MB = {
    Message.AttachmentType.IMAGE: 10,
    Message.AttachmentType.VIDEO: 100,
    Message.AttachmentType.DOCUMENT: 25,
}

ALLOWED_ATTACHMENT_EXTENSIONS = {
    Message.AttachmentType.IMAGE: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    Message.AttachmentType.VIDEO: [".mp4", ".mov", ".webm", ".mkv", ".avi"],
    Message.AttachmentType.DOCUMENT: [
        ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".zip", ".txt",
    ],
}


def _category_for_extension(extension):
    for category, extensions in ALLOWED_ATTACHMENT_EXTENSIONS.items():
        if extension in extensions:
            return category
    return None


def validate_message_attachment(value):
    """Validates an uploaded attachment and returns its inferred category
    (Message.AttachmentType). Raises serializers.ValidationError otherwise —
    mirrors assignments.validators.validate_assignment_file."""
    extension = os.path.splitext(value.name)[1].lower()
    category = _category_for_extension(extension)
    if category is None:
        allowed = ", ".join(
            sorted({ext for extensions in ALLOWED_ATTACHMENT_EXTENSIONS.values() for ext in extensions})
        )
        raise serializers.ValidationError(f"Unsupported file type '{extension}'. Allowed types: {allowed}.")

    max_size_mb = MAX_ATTACHMENT_SIZE_MB[category]
    if value.size > max_size_mb * 1024 * 1024:
        raise serializers.ValidationError(f"File size must not exceed {max_size_mb}MB for this file type.")

    return category
