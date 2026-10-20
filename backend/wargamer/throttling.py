from rest_framework.throttling import ScopedRateThrottle


class RolePlayTurnThrottle(ScopedRateThrottle):
    """Burst guard on the per-turn AI call. Same LocMemCache caveat as every
    other throttle here (no CACHES setting, so it isn't authoritative across
    gunicorn workers) — the hard ceilings on spend are
    settings.ROLEPLAY_MAX_ATHLETE_TURNS and the one-active-session-per-
    scenario constraint, both of which are database-backed."""

    scope = "roleplay-turn"


class RolePlayEvaluationThrottle(ScopedRateThrottle):
    scope = "roleplay-evaluation"
