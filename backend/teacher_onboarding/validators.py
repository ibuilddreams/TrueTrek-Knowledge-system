"""Upload rules for a teacher's application documents.

Deliberately module constants rather than settings, matching
`brand_validator/validators.py`: there is nothing here an environment would
sensibly want to differ on, and an env var nobody sets is a worse place to
read the real limit from than the code that enforces it.
"""

import os

from rest_framework import serializers

# A qualification document is something an admin reads on screen. PDFs and
# images are what a scan or a photo of a certificate actually is; .docx is
# excluded for the same reason brand_validator excludes it — accepting it
# means rendering somebody's Word file in a review panel that cannot show it.
ALLOWED_DOCUMENT_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}

# Formats a browser's <video> element plays natively — the admin watches the
# intro in the review modal, so anything needing a transcode is refused at
# upload rather than failing silently at playback. .mov is accepted because
# it is what an iPhone records, and Safari plays it.
ALLOWED_VIDEO_TYPES = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".m4v": "video/x-m4v",
}

MAX_DOCUMENT_SIZE_MB = 10
#: An intro video is meant to be a *short* introduction, so the limit is as
#: much a brief as it is a storage rule: roughly two minutes of phone video.
MAX_VIDEO_SIZE_MB = 60


def _validate_upload(value, *, allowed_types, max_size_mb, noun):
    extension = os.path.splitext(value.name)[1].lower()

    content_type = allowed_types.get(extension)
    if content_type is None:
        allowed = ", ".join(sorted(allowed_types))
        raise serializers.ValidationError(
            f"Unsupported file type '{extension or value.name}'. Upload your {noun} as {allowed}."
        )

    if value.size > max_size_mb * 1024 * 1024:
        raise serializers.ValidationError(f"Your {noun} must not exceed {max_size_mb}MB.")

    return content_type


def validate_credential_document(value):
    """Validates a qualification document and returns its content type."""
    return _validate_upload(
        value,
        allowed_types=ALLOWED_DOCUMENT_TYPES,
        max_size_mb=MAX_DOCUMENT_SIZE_MB,
        noun="document",
    )


def validate_intro_video(value):
    """Validates an intro video and returns its content type."""
    return _validate_upload(
        value,
        allowed_types=ALLOWED_VIDEO_TYPES,
        max_size_mb=MAX_VIDEO_SIZE_MB,
        noun="intro video",
    )
