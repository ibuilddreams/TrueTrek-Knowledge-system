from rest_framework.throttling import ScopedRateThrottle


class MediaKitReviewThrottle(ScopedRateThrottle):
    """Burst guard on a per-student AI spend path. Same LocMemCache caveat as
    ai_courses.throttling.AIGenerationThrottle (no CACHES setting, so this is
    not authoritative across gunicorn workers) — the hard ceiling is the
    in-flight check in brand_validator.services.start_review, which is DB
    backed and therefore is."""

    scope = "media-kit-review"
