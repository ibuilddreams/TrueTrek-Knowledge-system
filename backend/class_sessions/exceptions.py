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
