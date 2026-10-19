class LiveSessionError(Exception):
    """Base for errors whose message is safe to show the student."""


class SessionFullError(LiveSessionError):
    """The session has reached its capacity."""


class SessionNotJoinableError(LiveSessionError):
    """The join window isn't open (or the session was cancelled / has no link)."""


class SessionClosedError(LiveSessionError):
    """RSVPs can't change — the session already started or was cancelled."""
