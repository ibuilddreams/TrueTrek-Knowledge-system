from rest_framework.throttling import ScopedRateThrottle


class AIGenerationThrottle(ScopedRateThrottle):
    """First throttle class in this codebase. Burst protection only — there is no
    CACHES setting, so this rides Django's default per-process LocMemCache and is
    therefore not authoritative across the 3 gunicorn workers. The real spend limit
    is the DB-backed monthly counter enforced in ai_courses.services against
    AICourseGeneration rows, which this throttle sits in front of."""

    scope = "ai-generation"
