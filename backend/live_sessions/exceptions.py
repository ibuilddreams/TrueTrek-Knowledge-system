class LiveSessionError(Exception):
    """Base for errors whose message is safe to show the student."""


class SessionFullError(LiveSessionError):
    """The session has reached its capacity."""


class SessionNotJoinableError(LiveSessionError):
    """The join window isn't open (or the session was cancelled / has no link)."""


class SessionClosedError(LiveSessionError):
    """RSVPs can't change — the session already started or was cancelled."""


class SessionAccessDeniedError(LiveSessionError):
    """This person has no business in this room at all."""


class AgoraNotConfiguredError(LiveSessionError):
    """The server has no Agora credentials, so no room can be opened.

    Always a deployment fault rather than something a request caused, which
    is why it is answered with a 503 and a sentence about the server rather
    than about the student.
    """


class NotesNotConfiguredError(LiveSessionError):
    """This server cannot write a session up — no AI provider, or the
    feature is switched off."""


class NotesUnavailableError(LiveSessionError):
    """Notes are configured, but this particular request has nowhere to go —
    the run was stopped elsewhere, or another device is already recording."""
