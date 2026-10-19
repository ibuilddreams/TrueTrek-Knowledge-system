"""Upload validation, plus repair/validation of the provider's response.

The second half exists for the same reason `ai_courses/validators.py` does:
a provider response is never written to the database as-is. A model that
returns a score of 140, a weakness with no severity, or a string where a list
belongs must degrade into a sensible review rather than a 500 or a corrupt
row.
"""

import os

from rest_framework import serializers

# Gemini reads PDFs and images natively as inline parts, which is the whole
# point here — a media kit is a *designed page*, and converting it to plain
# text would throw away the layout the sponsor is actually reacting to. So
# only natively-viewable formats are accepted; .docx is deliberately not,
# rather than being silently text-extracted into a worse review.
ALLOWED_MIME_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}

MAX_MEDIA_KIT_SIZE_MB = 15

SEVERITIES = {"HIGH", "MEDIUM", "LOW"}


def validate_media_kit_file(value):
    """Validates the upload and returns its mime type."""
    extension = os.path.splitext(value.name)[1].lower()

    mime_type = ALLOWED_MIME_TYPES.get(extension)
    if mime_type is None:
        allowed = ", ".join(sorted(ALLOWED_MIME_TYPES))
        raise serializers.ValidationError(
            f"Unsupported file type '{extension}'. Upload your media kit as {allowed}."
        )

    if value.size > MAX_MEDIA_KIT_SIZE_MB * 1024 * 1024:
        raise serializers.ValidationError(
            f"Your media kit must not exceed {MAX_MEDIA_KIT_SIZE_MB}MB."
        )

    return mime_type


def _clean_text(value, limit=2000):
    if not isinstance(value, str):
        return ""
    return value.strip()[:limit]


def _clean_entries(value, *, extra_keys=()):
    """Normalises a findings list into [{title, detail, **extra}].

    Tolerates the two shapes a model actually produces when it drifts off
    schema — a list of bare strings, and a dict with the real list nested one
    level down — rather than discarding the whole review over formatting.
    """
    if isinstance(value, dict):
        value = next((v for v in value.values() if isinstance(v, list)), [])
    if not isinstance(value, list):
        return []

    entries = []
    for item in value:
        if isinstance(item, str):
            title, detail = _clean_text(item, 200), ""
        elif isinstance(item, dict):
            title = _clean_text(item.get("title"), 200)
            detail = _clean_text(item.get("detail"))
        else:
            continue

        if not title and not detail:
            continue
        # A bare string becomes the detail with no title, which reads better
        # than a truncated sentence masquerading as a heading.
        entry = {"title": title or "Feedback", "detail": detail or title}

        for key in extra_keys:
            raw = item.get(key) if isinstance(item, dict) else None
            if key == "severity":
                severity = str(raw).upper() if raw else ""
                entry["severity"] = severity if severity in SEVERITIES else "MEDIUM"
            elif key == "priority":
                try:
                    entry["priority"] = max(1, int(raw))
                except (TypeError, ValueError):
                    entry["priority"] = len(entries) + 1
        entries.append(entry)

    return entries


def normalize_review_payload(payload):
    """Turns a raw provider payload into exactly the fields MediaKitReview
    stores. Never raises on bad content — only on a payload that isn't an
    object at all, which means the call genuinely failed."""
    if not isinstance(payload, dict):
        raise ValueError("The review service returned an unexpected response.")

    try:
        score = int(payload.get("overall_score"))
    except (TypeError, ValueError):
        score = 0
    score = max(0, min(100, score))

    recommendations = _clean_entries(payload.get("recommendations"), extra_keys=("priority",))
    recommendations.sort(key=lambda entry: entry["priority"])

    missing = payload.get("missing_elements")
    if not isinstance(missing, list):
        missing = []
    missing = [_clean_text(item, 200) for item in missing if _clean_text(item, 200)]

    # Absent or non-boolean means the model didn't dispute it — treat the
    # upload as a media kit rather than hiding a real review behind the
    # wrong-file screen.
    is_media_kit = payload.get("is_media_kit")
    if not isinstance(is_media_kit, bool):
        is_media_kit = True

    return {
        "is_media_kit": is_media_kit,
        "overall_score": score,
        "verdict": _clean_text(payload.get("verdict"), 255) or "Review complete",
        "sponsor_verdict": _clean_text(payload.get("sponsor_verdict")),
        "summary": _clean_text(payload.get("summary")),
        "strengths": _clean_entries(payload.get("strengths")),
        "weaknesses": _clean_entries(payload.get("weaknesses"), extra_keys=("severity",)),
        "recommendations": recommendations,
        "missing_elements": missing,
    }
