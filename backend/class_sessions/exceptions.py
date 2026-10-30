class ClassSessionError(Exception):
    """Base for errors whose message is safe to show a teacher or student."""


class SessionAccessDeniedError(ClassSessionError):
    """The user doesn't teach this course and isn't actively enrolled in it."""


class SessionNotJoinableError(ClassSessionError):
    """The room isn't open — too early, already over, or the class was cancelled."""


class SessionScheduleError(ClassSessionError):
    """The class can't be scheduled as asked (a clash with the teacher's own
    timetable, or a course they don't teach)."""


class AgoraNotConfiguredError(ClassSessionError):
    """No Agora App ID / App Certificate is set on this environment.

    A configuration fault rather than a user one, so the message the view
    shows is deliberately generic — the detail goes to the server log.
    """


class WhiteboardNotConfiguredError(ClassSessionError):
    """No Agora Interactive Whiteboard credentials are set on this environment.

    Separate from `AgoraNotConfiguredError` because the whiteboard is a
    separate product with its own console section and its own keys: a server
    with working video and no whiteboard credentials is an ordinary, expected
    state, and the class must still run. The message says which of the two is
    missing so nobody goes looking in the RTC settings.
    """


class WhiteboardUnavailableError(ClassSessionError):
    """Netless could not be reached, or refused to create a room.

    A third-party outage rather than a configuration fault — the class itself
    is unaffected, so this is reported as "the board couldn't be opened"
    rather than as a broken classroom.
    """
