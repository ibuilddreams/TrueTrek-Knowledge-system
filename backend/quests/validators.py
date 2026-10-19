import os

from rest_framework import serializers

# Quest proof is evidence the student did a real-world task — a screenshot of
# an updated bio, a short clip of the video they posted. Deliberately
# narrower than messaging's attachment rules (no documents/archives): nothing
# else is meaningful as proof here, and a tight allowlist keeps an
# unreviewed, student-writable upload path small. Mirrors the shape of
# messaging.validators.validate_message_attachment.
MAX_PROOF_SIZE_MB = {"IMAGE": 10, "VIDEO": 50}

ALLOWED_PROOF_EXTENSIONS = {
    "IMAGE": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    "VIDEO": [".mp4", ".mov", ".webm"],
}


def validate_quest_proof(value):
    """Validates an uploaded proof file and returns its inferred category.
    Raises serializers.ValidationError otherwise."""
    extension = os.path.splitext(value.name)[1].lower()

    category = next(
        (cat for cat, extensions in ALLOWED_PROOF_EXTENSIONS.items() if extension in extensions), None
    )
    if category is None:
        allowed = ", ".join(
            sorted({ext for extensions in ALLOWED_PROOF_EXTENSIONS.values() for ext in extensions})
        )
        raise serializers.ValidationError(
            f"Unsupported proof type '{extension}'. Attach an image or short video ({allowed})."
        )

    max_size_mb = MAX_PROOF_SIZE_MB[category]
    if value.size > max_size_mb * 1024 * 1024:
        raise serializers.ValidationError(f"Proof must not exceed {max_size_mb}MB for this file type.")

    return category
