import os

from rest_framework import serializers

from .models import FeedPost

MAX_ATTACHMENT_SIZE_MB = {
    FeedPost.AttachmentType.IMAGE: 10,
    FeedPost.AttachmentType.VIDEO: 100,
}

ALLOWED_ATTACHMENT_EXTENSIONS = {
    FeedPost.AttachmentType.IMAGE: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    FeedPost.AttachmentType.VIDEO: [".mp4", ".mov", ".webm", ".mkv", ".avi"],
}


def _category_for_extension(extension):
    for category, extensions in ALLOWED_ATTACHMENT_EXTENSIONS.items():
        if extension in extensions:
            return category
    return None


def validate_feed_attachment(value):
    """Validates an uploaded feed attachment and returns its inferred category
    (FeedPost.AttachmentType). Raises serializers.ValidationError otherwise —
    mirrors messaging.validators.validate_message_attachment, restricted to
    image/video only since the feed is for short posted content, not documents."""
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
