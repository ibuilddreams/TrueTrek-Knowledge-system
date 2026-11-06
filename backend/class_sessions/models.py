import uuid

from django.conf import settings
from django.db import models

from common.models import BaseModel
from courses.models import Course


def generate_channel_name():
    """A fresh Agora channel name.

    Random rather than derived from the course or the title, because an Agora
    channel is joinable by anyone who knows its name and holds a token for it:
    a guessable name ("math-101") plus a leaked token from another session is
    a way into a live classroom. 36 characters of `[a-z0-9-]` is well inside
    Agora's 64-byte limit and its permitted character set.
    """
    return f"cls-{uuid.uuid4().hex}"


class ClassSession(BaseModel):
    """A live class a teacher scheduled for one of their courses.

    The video itself runs on Agora: this model owns *scheduling, access and
    attendance*, and `channel_name` is the only link between the two. No
    Agora credential is stored — a join token is minted per user, per join,
    and only while the room is open (`services.issue_join_credentials`).

    The whiteboard the teacher presents on runs on Agora's Interactive
    Whiteboard, which is a separate product with separate credentials
    (`whiteboard.py`), and is linked by `whiteboard_room_uuid` in exactly the
    same way: an identifier, no credential, and a room token minted per user,
    per open, behind the same door (`services.issue_whiteboard_credentials`).

    Two things a class can do to itself afterwards hang off it, and they are
    deliberately independent of each other and of the class: Agora Cloud
    Recording writes the video (`ClassSessionRecording`) and Agora Real-Time
    Transcription writes the words, which an AI model turns into meeting notes
    (`ClassSessionNotes`). Different products, different bills, different
    switches (`is_recorded`, `takes_notes`) — and either one being broken,
    unconfigured or switched off never stops the class running or the other
    one working.

    `status` holds only the teacher's own decision (scheduled or cancelled).
    Whether a session is upcoming / live / ended is **derived from the clock**
    by `services.live_state`, the same way `live_sessions` does it, because a
    stored "LIVE" flag would need a scheduler this codebase does not have.

    The class is addressed to a *course*, not to a hand-picked list of
    students: who may attend is resolved live from `CourseInstructor` and
    `Enrollment` (`services.can_attend`), so a student who enrols the morning
    of the class is in it, and one whose enrolment was cancelled is not —
    exactly the membership rule `warroom.services.can_access_room` uses for
    the course group chat.
    """

    class SessionStatus(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        CANCELLED = "CANCELLED", "Cancelled"

    class WhiteboardAccess(models.TextChoices):
        """Who may draw on this class's whiteboard.

        The teacher presents by default and hands the pen over deliberately.
        It is stored rather than held in the browser because it decides the
        *role inside the room token* every participant is minted
        (`services.issue_whiteboard_credentials`) — a student who joins ten
        minutes after the board was opened up has to arrive able to draw, and
        a page that merely behaved as though it couldn't would be one console
        command away from scribbling over the lesson.
        """

        HOST_ONLY = "HOST_ONLY", "Teacher only"
        EVERYONE = "EVERYONE", "Everyone in the class"

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="class_sessions")
    # Who scheduled and hosts it. SET_NULL rather than CASCADE so removing a
    # teacher account never erases the attendance record of classes that were
    # actually taught; permission to manage the session is resolved from the
    # course's instructor list, not from this field, so a session whose host
    # left is still manageable by the course's remaining teachers.
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hosted_class_sessions",
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    # What the class will cover — a plain list of strings shown as bullets.
    agenda = models.JSONField(default=list, blank=True)

    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)

    channel_name = models.CharField(max_length=64, unique=True, default=generate_channel_name)

    # The Agora Interactive Whiteboard room this class presents on, created
    # lazily the first time somebody opens the board (`services.
    # ensure_whiteboard_room`) rather than when the class is scheduled: a room
    # is a third-party resource asked for over HTTP, and most classes never
    # need one. Empty means "no board has been opened on this class yet",
    # which is a state both portals render.
    #
    # The region is stored beside the uuid, not read from settings at join
    # time, because a room lives in exactly one data centre and a browser
    # pointed at another simply never finds it — so moving
    # AGORA_WHITEBOARD_REGION must not orphan the boards already drawn on.
    whiteboard_room_uuid = models.CharField(max_length=64, blank=True, default="")
    whiteboard_region = models.CharField(max_length=20, blank=True, default="")
    whiteboard_access = models.CharField(
        max_length=20,
        choices=WhiteboardAccess.choices,
        default=WhiteboardAccess.HOST_ONLY,
    )

    # Whether this class should record itself. Default on, because a class
    # nobody thought to record is a class the students who missed it cannot
    # get back, and the teacher can still stop a running recording from the
    # control bar. Recording is billed by the minute on top of the call, so it
    # is a per-class decision made at scheduling time rather than a property
    # of the deployment — `settings.AGORA_RECORDING_ENABLED` is the separate,
    # blunter switch for turning the whole feature off.
    is_recorded = models.BooleanField(default=True)

    # Whether this class should write itself up afterwards. Default on, for
    # the same reason recording is: a class nobody thought to take notes on is
    # a class the students who missed it have nothing to read back, and the
    # teacher can still stop a running transcription from the control bar.
    #
    # Deliberately **separate from `is_recorded`**, not derived from it.
    # Transcription is a different Agora product, billed separately, and the
    # two decisions genuinely come apart: a seminar where students would not
    # speak freely on camera is exactly the class that most wants notes and
    # least wants a tape, and a practical demonstration is the reverse.
    takes_notes = models.BooleanField(default=True)

    status = models.CharField(
        max_length=20, choices=SessionStatus.choices, default=SessionStatus.SCHEDULED
    )
    cancellation_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-scheduled_at"]
        indexes = [
            models.Index(fields=["course", "scheduled_at"]),
            models.Index(fields=["status", "scheduled_at"]),
        ]

    def __str__(self):
        return f"{self.title} — {self.course.code} ({self.scheduled_at:%Y-%m-%d %H:%M})"


class ClassSessionAttendance(BaseModel):
    """Evidence that one person opened one class.

    Written when a join token is issued, which is the only moment the server
    hears from a participant at all — the media itself never touches this
    server. `left_at` is therefore best-effort (a browser that crashes or a
    laptop lid closed mid-class never reports it) and `join_count` counts
    reconnections, so these fields are presented to the teacher as *arrival*,
    not as minutes attended. Named and documented the same way
    `live_sessions.SessionRSVP.attended` is.
    """

    class ParticipantRole(models.TextChoices):
        HOST = "HOST", "Host"
        STUDENT = "STUDENT", "Student"

    session = models.ForeignKey(
        ClassSession, on_delete=models.CASCADE, related_name="attendances"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="class_attendances"
    )
    role = models.CharField(
        max_length=20, choices=ParticipantRole.choices, default=ParticipantRole.STUDENT
    )
    first_joined_at = models.DateTimeField()
    last_joined_at = models.DateTimeField()
    left_at = models.DateTimeField(null=True, blank=True)
    join_count = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["first_joined_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["session", "user"], name="one_attendance_row_per_user_per_class"
            ),
        ]

    def __str__(self):
        return f"{self.user} @ {self.session_id}"


class ClassSessionRecording(BaseModel):
    """One recording of one class, from the moment Agora accepts it to the
    moment its students are told it is ready.

    The media never touches this server: Agora's cloud recorder joins the
    channel as an ordinary participant and uploads the finished file straight
    into a bucket we own, so what this row holds is *the two identifiers that
    recording exists under* and *where the file landed* — never a credential
    and never a playable URL. A link is signed per viewer, per click, by
    `services.recording_playback_url`, which is the same rule
    `live_sessions` applies to a meeting link.

    `resource_id` and `sid` are written before the recorder is running,
    because together they are the only handle Agora offers: losing them means
    a recording that cannot be stopped, queried or found again.

    The states are a straight line and the row is never stuck between them
    (`services._monitor_recording` is the thread that walks it):

        STARTING    accepted by Agora, recorder on its way into the channel
        RECORDING   running; `query` is answering and files are accumulating
        PROCESSING  stopped, waiting for the last bytes to land in the bucket
        AVAILABLE   confirmed present in the bucket; students have been told
        FAILED      gave up, with a reason — the class itself was unaffected

    `notified_at` is what makes the fan-out happen exactly once. A recording
    reaches AVAILABLE from more than one path — the teacher stopping it, the
    host leaving, the class's end passing, Agora's own idle timer — and thirty
    students must not be told twice because two of them raced.
    """

    class RecordingStatus(models.TextChoices):
        STARTING = "STARTING", "Starting"
        RECORDING = "RECORDING", "Recording"
        PROCESSING = "PROCESSING", "Processing"
        AVAILABLE = "AVAILABLE", "Available"
        FAILED = "FAILED", "Failed"

    # The states in which Agora still has a recorder of ours in a channel, or
    # a file of ours still landing. One of these per class at a time — see the
    # constraint below.
    IN_FLIGHT_STATUSES = (
        RecordingStatus.STARTING,
        RecordingStatus.RECORDING,
        RecordingStatus.PROCESSING,
    )

    session = models.ForeignKey(
        ClassSession, on_delete=models.CASCADE, related_name="recordings"
    )
    # Who caused it to start. SET_NULL rather than CASCADE for the same reason
    # as `ClassSession.teacher`: deleting a teacher's account must not delete
    # the recording of a class that was taught.
    started_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="started_class_recordings",
    )

    status = models.CharField(
        max_length=20, choices=RecordingStatus.choices, default=RecordingStatus.STARTING
    )

    # Agora's two handles on this recording. Not credentials — they identify a
    # job, they do not authorise anything — but they are never serialized to a
    # browser either, for the same reason `external_job_id` isn't in
    # `ai_courses`: nothing in the UI can act on them.
    resource_id = models.CharField(max_length=512, blank=True, default="")
    sid = models.CharField(max_length=128, blank=True, default="")

    # The uid the recorder joined the channel under. Drawn from a range far
    # above any real user id (`services.RECORDER_UID_MIN`) so it can never
    # collide with a student's, and so both portals can recognise and hide it
    # rather than rendering an empty video tile for a robot.
    recorder_uid = models.BigIntegerField(null=True, blank=True)

    # The object the student actually watches, and everything Agora said it
    # wrote. The key is kept rather than a URL because a URL is signed fresh
    # on every click; the full list is kept because a long class is split
    # across several files and only the first is linked today.
    storage_key = models.CharField(max_length=1024, blank=True, default="")
    file_list = models.JSONField(default=list, blank=True)

    started_at = models.DateTimeField(null=True, blank=True)
    stopped_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    # Set once, the first time students are told the recording exists.
    notified_at = models.DateTimeField(null=True, blank=True)

    error_message = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["session", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]
        constraints = [
            # At most one live recording per class. Starting is triggered from
            # several places (the host joining, the host pressing record, a
            # co-instructor arriving first), and two recorders in one channel
            # would bill twice and write two half-files.
            models.UniqueConstraint(
                fields=["session"],
                condition=models.Q(status__in=["STARTING", "RECORDING", "PROCESSING"]),
                name="one_in_flight_recording_per_class",
            ),
        ]

    def __str__(self):
        return f"Recording of {self.session_id} ({self.status})"

    @property
    def is_in_flight(self):
        return self.status in self.IN_FLIGHT_STATUSES

    @property
    def is_available(self):
        return self.status == self.RecordingStatus.AVAILABLE and bool(self.storage_key)


class ClassSessionNotes(BaseModel):
    """One run of AI meeting notes over one class — Agora hears it, the model
    writes it up, and the class is handed a document afterwards.

    Deliberately **not** part of `ClassSessionRecording`, and not derived from
    it. They are two different Agora products, billed separately and enabled
    separately, and a class can honestly want one without the other: nothing
    here needs a video of the room, and a class that is written up is not a
    class that was filmed. The two run side by side, start and stop
    independently, and neither one failing touches the other.

    The audio never touches this server either. Agora's transcription bot
    joins the channel as an ordinary participant, listens, and writes WebVTT
    caption slices into the **same bucket we own** that the cloud recorder
    uploads into. So what this row holds is *the handle that transcription
    exists under at Agora*, *where the captions landed*, *the transcript they
    were turned into* and *the notes the model wrote from it* — never a
    credential, and never a forwardable link to the document.

    The states are a straight line and the row is never stuck between them
    (`services._monitor_notes` and `services._collect_and_summarize` walk it):

        STARTING      accepted by Agora, the bot is on its way into the channel
        TRANSCRIBING  running; the class is being listened to
        PAUSED        the teacher stopped mid-class; the audio so far is kept
        COLLECTING    finished; waiting for the last of the audio to land
        SUMMARIZING   transcript assembled, the model is writing the notes up
        AVAILABLE     notes written and the class has been told, exactly once
        FAILED        gave up, with a reason — the class itself was unaffected

    PAUSED is what makes "stop" mean *pause* rather than *finish*. A teacher
    who takes notes for the first ten minutes, stops while the class does an
    exercise and starts again for the last ten expects **one** set of notes
    covering twenty minutes — not two write-ups, the second of which replaces
    the first on the card. So a run is only ever written up when the class
    itself ends, and everything recorded across every stretch belongs to the
    one run (`services.pause_notes` / `start_notes` / `_finish_local_notes`).

    `notified_at` is what makes the fan-out happen exactly once, for the same
    reason it does on a recording: notes reach AVAILABLE from more than one
    path (the teacher stopping them, the host leaving, the class's end
    passing, Agora's own idle timer) and thirty students must not be told
    twice because two of those raced.
    """

    class NotesStatus(models.TextChoices):
        STARTING = "STARTING", "Starting"
        TRANSCRIBING = "TRANSCRIBING", "Transcribing"
        PAUSED = "PAUSED", "Paused"
        COLLECTING = "COLLECTING", "Collecting the transcript"
        SUMMARIZING = "SUMMARIZING", "Writing the notes"
        AVAILABLE = "AVAILABLE", "Available"
        FAILED = "FAILED", "Failed"

    # The states in which a run is still this class's one notes run. One of
    # these per class at a time — see the constraint below.
    IN_FLIGHT_STATUSES = (
        NotesStatus.STARTING,
        NotesStatus.TRANSCRIBING,
        NotesStatus.PAUSED,
        NotesStatus.COLLECTING,
        NotesStatus.SUMMARIZING,
    )

    # The states in which something is actually *happening* — in flight minus
    # paused. This is what the cards and the classroom badge read: a paused
    # run is the teacher's bookmark in a class that is still going, and
    # announcing "notes are being taken" over it would be a lie.
    WORKING_STATUSES = (
        NotesStatus.STARTING,
        NotesStatus.TRANSCRIBING,
        NotesStatus.COLLECTING,
        NotesStatus.SUMMARIZING,
    )

    # The states in which the class is actually being listened to. Narrower
    # than WORKING_STATUSES: once the captions are being collected the bot has
    # already left (or the browser has stopped recording), and only our own
    # work is outstanding.
    LISTENING_STATUSES = (NotesStatus.STARTING, NotesStatus.TRANSCRIBING)

    session = models.ForeignKey(
        ClassSession, on_delete=models.CASCADE, related_name="notes_runs"
    )
    # Who caused it to start. SET_NULL rather than CASCADE for the same reason
    # as `ClassSession.teacher`: deleting a teacher's account must not delete
    # the write-up of a class that was taught.
    started_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="started_class_notes",
    )

    status = models.CharField(
        max_length=20, choices=NotesStatus.choices, default=NotesStatus.STARTING
    )

    # Agora's handle on this transcription. `agent_id` is what `query` and
    # `leave` are addressed to — lose it and the bot cannot be stopped or
    # asked about — and `agent_name` is the unique name we submitted it under,
    # which Agora refuses to see twice. Neither is a credential; neither is
    # ever serialized to a browser, for the same reason `external_job_id`
    # isn't in `ai_courses`: nothing in the UI can act on them.
    agent_id = models.CharField(max_length=128, blank=True, default="")
    agent_name = models.CharField(max_length=64, blank=True, default="")

    # The uid the bot joined the channel under. Drawn from a range far above
    # any real user id (`services.NOTES_BOT_UID_MIN`) so it can never collide
    # with a student's or with the cloud recorder's, and so both portals can
    # recognise and hide it rather than rendering an empty tile for a robot.
    bot_uid = models.BigIntegerField(null=True, blank=True)

    # The folder in the bucket this run's caption slices were written under.
    # Stored rather than recomputed because it is what the collector lists,
    # and a class recorded twice must not read the other run's captions.
    storage_prefix = models.CharField(max_length=512, blank=True, default="")
    # Every caption object this run actually read, in the order it read them.
    # Kept so a transcript that came out wrong can be traced back to the files
    # behind it without a trip to the bucket.
    transcript_keys = models.JSONField(default=list, blank=True)

    # What was said, as plain text. Kept beside the notes rather than thrown
    # away: it is the evidence behind every line the model wrote, it is what a
    # re-run would start from, and a student who wants the actual words of a
    # definition is not served by a summary of it.
    transcript = models.TextField(blank=True, default="")

    # The notes themselves — the shape `notes_prompt.RESPONSE_SCHEMA` asks for
    # and `notes_validators.normalize_notes_payload` guarantees.
    title = models.CharField(max_length=255, blank=True, default="")
    summary = models.TextField(blank=True, default="")
    key_topics = models.JSONField(default=list, blank=True)
    important_points = models.JSONField(default=list, blank=True)
    action_items = models.JSONField(default=list, blank=True)
    next_class = models.TextField(blank=True, default="")

    # The rendered hand-out. Lives in MEDIA_ROOT like a course handout rather
    # than in the Agora bucket: it is ours, it is small, and nothing outside
    # this server ever writes it. It is still served only through
    # `views.ClassSessionNotesDocumentView`, behind the class's own roster —
    # the file name carries a random suffix so a guessed MEDIA path is not a
    # second way in.
    document = models.FileField(upload_to="meeting-notes/", blank=True, null=True)

    started_at = models.DateTimeField(null=True, blank=True)
    stopped_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    # Set once, the first time the class is told the notes exist.
    notified_at = models.DateTimeField(null=True, blank=True)

    error_message = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["session", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]
        constraints = [
            # At most one live transcription per class. Starting is triggered
            # from several places (the host joining, the host pressing the
            # button, a co-instructor arriving first), and two bots in one
            # channel would bill twice and write two half-transcripts into the
            # same folder.
            models.UniqueConstraint(
                fields=["session"],
                condition=models.Q(
                    status__in=[
                        "STARTING",
                        "TRANSCRIBING",
                        "PAUSED",
                        "COLLECTING",
                        "SUMMARIZING",
                    ]
                ),
                name="one_in_flight_notes_run_per_class",
            ),
        ]

    def __str__(self):
        return f"Notes on {self.session_id} ({self.status})"

    @property
    def is_in_flight(self):
        return self.status in self.IN_FLIGHT_STATUSES

    @property
    def is_working(self):
        return self.status in self.WORKING_STATUSES

    @property
    def is_listening(self):
        return self.status in self.LISTENING_STATUSES

    @property
    def is_paused(self):
        return self.status == self.NotesStatus.PAUSED

    @property
    def is_available(self):
        return self.status == self.NotesStatus.AVAILABLE and bool(self.summary)


class ClassSessionNotesAudio(BaseModel):
    """One slice of the audio a class was written up from.

    Only ever written in the **local** notes source (`settings
    .CLASS_NOTES_SOURCE`), where the class's own audio never leaves this
    deployment: the teacher's browser mixes everybody who is speaking into one
    stream, records it in segments and posts each one here, where it is kept
    as an ordinary Django file under `MEDIA_ROOT/class-audio/` and handed to
    the AI model to transcribe. There is no bucket in that path at all — and
    because these are plain `FileField`s, moving them into one later is a
    storage change rather than a rewrite.

    The audio arrives in **segments rather than as one file at the end**, and
    both halves of that matter. A browser that crashes, a laptop lid closed or
    a tab reloaded mid-class loses only the slice that was in progress instead
    of the whole hour; and a model is handed minutes of audio per call, which
    keeps every request well inside the inline-upload limit however long the
    class ran.

    `index` is assigned **by the server, in arrival order**, never taken from
    the client: a capturer that crashed and came back would otherwise restart
    its own numbering and overwrite the first half of its class. `client_key`
    is what makes an upload safe to retry — a segment that timed out on its
    way up but landed anyway is recognised rather than stored twice.

    `transcript` is kept per segment rather than only on the run, so a write-up
    that died halfway resumes at the first segment nobody has read yet instead
    of paying the model for the whole class again — the same reasoning that
    keeps `ClassSessionNotes.transcript` on the row in the Agora path.
    """

    notes = models.ForeignKey(
        ClassSessionNotes, on_delete=models.CASCADE, related_name="audio_segments"
    )

    # Arrival order, assigned by `services.store_notes_audio` under a lock.
    index = models.PositiveIntegerField()

    # The capturing browser's own id for this blob. Unique per run, so the
    # same segment sent twice (a retry after a timeout) is one row.
    client_key = models.CharField(max_length=64)

    file = models.FileField(upload_to="class-audio/")
    content_type = models.CharField(max_length=100, blank=True, default="")
    size_bytes = models.PositiveBigIntegerField(default=0)
    # What the browser says it recorded. Evidence for the teacher, never
    # arithmetic: a tab throttled in the background records less wall clock
    # than it claims.
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    # Who was speaking, and when, through this segment: a list of
    # `{"at": <seconds from the start of this segment>, "uid": <user id>}`
    # sampled by the capturing browser from the individual audio tracks it
    # is mixing (`useClassNotesRecorder`).
    #
    # This exists because the thing that reaches the model is **one mixed
    # track**, and no amount of listening to a mix tells you which of three
    # voices belongs to which person in the room. The browser is the only
    # place that knows — it holds every participant's track separately
    # before they are added together — so it writes down what it measured
    # and the model is handed the answer rather than asked to guess it.
    # Guessing is what produces a quote filed under the wrong student's
    # name, which is worse than a quote filed under nobody's.
    speakers = models.JSONField(default=list, blank=True)

    transcript = models.TextField(blank=True, default="")
    transcribed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["index"]
        constraints = [
            models.UniqueConstraint(
                fields=["notes", "index"], name="one_audio_segment_per_index_per_run"
            ),
            models.UniqueConstraint(
                fields=["notes", "client_key"],
                name="one_audio_segment_per_client_key_per_run",
            ),
        ]

    def __str__(self):
        return f"Audio {self.index} of notes run {self.notes_id}"
