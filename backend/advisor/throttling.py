from rest_framework.throttling import ScopedRateThrottle


class AdvisorChatThrottle(ScopedRateThrottle):
    """Guards a public, unauthenticated endpoint — the first throttle in this
    codebase keying off IP address rather than an authenticated user. Burst
    protection only, same LocMemCache caveat as
    ai_courses.throttling.AIGenerationThrottle (no CACHES setting, so this isn't
    authoritative across the 3 gunicorn workers)."""

    scope = "advisor-chat"
