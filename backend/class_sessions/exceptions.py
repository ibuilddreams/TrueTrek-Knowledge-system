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


class RecordingNotConfiguredError(ClassSessionError):
    """No Agora Cloud Recording credentials, or nowhere to put the files.

    A third separate product from the RTC and whiteboard credentials, with a
    third set of keys (the console's RESTful Customer ID / Secret) and a
    bucket of our own — so a server that can run a class but not record it is
    an ordinary, supported state, and a class must never fail to open merely
    because nobody has set these. The message says which family of settings
    is missing so nobody goes looking in the RTC ones.
    """


class RecordingUnavailableError(ClassSessionError):
    """Agora's recording service could not be reached, or refused the request.

    A third-party outage rather than a configuration fault. The class itself
    is unaffected — this is reported as "the recording couldn't be started",
    never as a broken classroom, because the lesson matters more than the
    tape of it.
    """


class RecordingGoneError(RecordingUnavailableError):
    """Agora has no such recording any more — a 404 from `query` or `stop`.

    Not a failure in itself: the recorder leaves a channel on its own once
    everybody else has, so the ordinary end of a class reaches this. It is a
    distinct type only so the monitor can tell "it finished without me" from
    "the service is broken" and still publish the file list it already has.
    """


class NotesNotConfiguredError(ClassSessionError):
    """No Agora Real-Time Transcription credentials, or nowhere to put the
    captions, or no AI provider to turn them into notes.

    A **fourth** Agora product beside the RTC call, the whiteboard and Cloud
    Recording. It shares the console's RESTful key and the upload bucket with
    Cloud Recording — Agora's transcription bot writes its caption files into
    storage we own, exactly as the recorder writes its video there — but it is
    enabled separately on an Agora project and fails separately here, so a
    server that can record a class but not take notes on it is an ordinary,
    supported state. The message says which family of settings is missing so
    nobody goes looking in the RTC ones.
    """


class NotesUnavailableError(ClassSessionError):
    """Agora's transcription service could not be reached, or refused.

    A third-party outage rather than a configuration fault. The class itself
    is unaffected — the lesson matters more than the write-up of it — so this
    is reported as "notes couldn't be started", never as a broken classroom.
    """


class NotesGoneError(NotesUnavailableError):
    """Agora has no such transcription agent any more — a 404 from `query` or
    `leave`, or an agent that has already reported itself STOPPED.

    Not a failure in itself: the bot leaves a channel on its own once everyone
    else has (`maxIdleTime`), so the ordinary end of a class reaches this. It
    is a distinct type only so the monitor can tell "it finished without me"
    from "the service is broken" and still go and collect the captions it
    already wrote.
    """
