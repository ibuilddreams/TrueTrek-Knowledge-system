import uuid

from django.conf import settings
from django.db import models

from common.models import BaseModel


def generate_channel_name():
    """A fresh Agora channel name for a War Room Live session.

    Random rather than derived from the title or the date, for the same
    reason `class_sessions.generate_channel_name` is: an Agora channel is
    joinable by anyone holding a token for it, and a guessable name plus a
    leaked token from another session is a way into a live room. Well inside
    Agora's 64-byte limit and its permitted character set.
    """
    return f"wrl-{uuid.uuid4().hex}"


class SessionSpeaker(BaseModel):
    """A guest athlete who speaks on War Room Live sessions — typically a
    current college athlete talking about how they built their brand in high
    school.

    Deliberately *not* a `User`: speakers are usually outside guests with no
    LMS account, and the ones who do have accounts are students whose
    speaker bio ("D1 WR, University of Oregon") is editorial copy, not
    profile data. Kept as its own row so one speaker can appear across many
    sessions without their bio being re-typed each time.
    """

    name = models.CharField(max_length=255)
    # The line shown under the name on a session card, e.g.
    # "D1 Wide Receiver — University of Oregon".
    headline = models.CharField(max_length=255, blank=True)
    sport = models.CharField(max_length=100, blank=True)
    school = models.CharField(max_length=255, blank=True)
    graduation_year = models.PositiveSmallIntegerField(null=True, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="live_sessions/speakers/", blank=True, null=True)
    instagram_handle = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class LiveSession(BaseModel):
    """A scheduled War Room Live audio session.

    The audio itself happens on an external platform (Zoom, Meet, X Spaces),
    so this model owns *scheduling, discovery and access* — the join URL is
    withheld until the session is about to start (see
    `services.get_join_url`) rather than being handed out with the listing,
    which is what stops a link from a public card being shared around weeks
    early.

    `status` holds only an admin's explicit decision (scheduled or
    cancelled). Whether a session is upcoming / live / ended is *derived*
    from `scheduled_at` + `duration_minutes` by `services.live_state` — a
    stored "LIVE" flag would need a cron to stay honest, and this codebase
    has no Celery/Redis (see ai_courses/services.py for the same constraint).
    """

    class SessionStatus(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Scheduled"
        CANCELLED = "CANCELLED", "Cancelled"

    class AudienceAccess(models.TextChoices):
        """Who may speak in the room, as opposed to listen to it.

        A drop-in session is a guest athlete talking to a roomful of students,
        so the default is that the students listen. Opening the floor is a
        deliberate act by whoever is hosting — and it is stored rather than
        held in a browser because it decides the **role inside the Agora
        token** every participant is minted (`services.issue_join_credentials`):
        a student who arrives ten minutes after the floor was opened has to
        turn up able to speak, and a page that merely behaved as though it
        could not would be one console command away from talking over the
        guest.
        """

        LISTEN_ONLY = "LISTEN_ONLY", "Hosts and speakers only"
        EVERYONE = "EVERYONE", "Everyone in the room"

    class MeetingMethod(models.TextChoices):
        # Hosted here, on this platform's own Agora project: the audio runs
        # in the student portal and the admin portal rather than on somebody
        # else's link. The default for anything scheduled from now on — the
        # rest are kept because sessions already scheduled on them still have
        # to render, and a guest who insists on their own Zoom room is an
        # ordinary thing to accommodate.
        AGORA = "AGORA", "Cool Nerds Live Audio"
        ZOOM = "ZOOM", "Zoom"
        GOOGLE_MEET = "GOOGLE_MEET", "Google Meet"
        TEAMS = "TEAMS", "Microsoft Teams"
        X_SPACES = "X_SPACES", "X Spaces"
        DISCORD = "DISCORD", "Discord Stage"
        OTHER = "OTHER", "Other"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    topic = models.CharField(max_length=255, blank=True)
    # What the session promises to cover — rendered as a bullet list on the
    # detail panel. A plain list of strings; nothing queries into it.
    talking_points = models.JSONField(default=list, blank=True)

    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)

    meeting_method = models.CharField(
        max_length=20, choices=MeetingMethod.choices, default=MeetingMethod.AGORA
    )
    # Only ever used by the external methods above. An AGORA session has no
    # link at all: the room is this platform's own, and the way in is a token
    # minted per person, per join (`services.issue_join_credentials`).
    meeting_url = models.URLField(blank=True, null=True)

    # The Agora channel this session's audio runs in, when it is hosted here.
    # The only link between this row and the call; no credential is stored.
    channel_name = models.CharField(max_length=64, unique=True, default=generate_channel_name)

    audience_access = models.CharField(
        max_length=20,
        choices=AudienceAccess.choices,
        default=AudienceAccess.LISTEN_ONLY,
    )

    # Whether this session should write itself up afterwards. Default on, for
    # the same reason a class's `takes_notes` is: a session nobody thought to
    # take notes on is a session the students who missed it have nothing to
    # read back, and the host can still stop a running write-up from the
    # control bar.
    #
    # Unlike a class, this is the *only* capture switch here: a War Room Live
    # session is not filmed. The notes are written from the room's own audio
    # — the host's browser mixes it and posts it to this server — so there is
    # no bucket, no second Agora product and no second bill in the path.
    takes_notes = models.BooleanField(default=True)

    speakers = models.ManyToManyField(SessionSpeaker, related_name="sessions", blank=True)

    # Null means unlimited. Enforced at RSVP time in services.rsvp_to_session.
    capacity = models.PositiveIntegerField(null=True, blank=True)

    status = models.CharField(
        max_length=20, choices=SessionStatus.choices, default=SessionStatus.SCHEDULED
    )
    cancellation_reason = models.CharField(max_length=255, blank=True)

    cover_image = models.ImageField(upload_to="live_sessions/covers/", blank=True, null=True)
    recording_url = models.URLField(blank=True, null=True)
    # Admin-written notes published after the session — "what worked, what
    # they regret posting" — so a past session is still useful without
    # watching the whole recording.
    recap = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        ordering = ["-scheduled_at"]
        indexes = [models.Index(fields=["status", "scheduled_at"])]

    def __str__(self):
        return f"{self.title} ({self.scheduled_at:%Y-%m-%d %H:%M})"

    @property
    def is_hosted_here(self):
        """Whether this session's audio runs on this platform's own Agora
        project, as opposed to somebody else's meeting link."""
        return self.meeting_method == self.MeetingMethod.AGORA

    def notes_context(self):
        """What this session is, for the two things that write it up.

        `class_sessions.notes_prompt` and `class_sessions.notes_document` are
        shared with the live classes, which have a course and a teacher where
        this has a line-up of guests and no course at all — so neither of
        them reads a field off a model directly. Each kind of session
        describes itself here instead, which is what lets one prompt and one
        renderer serve both (see `ClassSession.notes_context`).

        The guest line-up is in the heading deliberately: it is almost all of
        the proper nouns in the room, and a transcript that has been told who
        is in it mishears far fewer of them.
        """
        guests = ", ".join(
            " — ".join(part for part in (speaker.name, speaker.headline) if part)
            for speaker in self.speakers.all()
        )
        host = ""
        if self.created_by_id and self.created_by:
            host = self.created_by.name or self.created_by.username

        heading = "War Room Live — a drop-in audio session with current college athletes."
        if self.topic:
            heading += f"\nTopic: {self.topic}"
        if guests:
            heading += f"\nGuests on the call: {guests}"

        return {
            "heading": heading,
            "title": self.title,
            "description": self.description,
            "agenda": list(self.talking_points or []),
            "meta": [
                "War Room Live",
                self.topic,
                self.scheduled_at.strftime("%d %B %Y, %H:%M UTC"),
                f"Hosted by {host}" if host else "",
                f"{self.duration_minutes} minutes",
            ],
            "transcript_note": (
                "The full conversation, as it was heard. Only the team running "
                "War Room Live receives this page."
            ),
            "footnote": (
                "These notes were written automatically from a transcript of the "
                "session and have not been checked by anyone who was in it. The "
                "transcript can mishear names and terms, so treat anything "
                "surprising as a note to ask about rather than as a record of what "
                "was said."
            ),
            "document_name": (
                f"war-room-live-{self.scheduled_at:%Y-%m-%d}-notes.pdf"
            ),
        }


class SessionRSVP(BaseModel):
    """One person's place in a session — reserved, arrived, or both.

    `attended` is set when they actually open the door (see
    `services.get_join_url` for a session on somebody else's platform, and
    `services.issue_join_credentials` for one hosted here). It means "showed
    up at the door", not "stayed for the hour", and is named and documented
    that way rather than presented as true attendance — the same honesty
    `class_sessions.ClassSessionAttendance` applies to its own fields.

    `role` is what keeps the table meaning one thing while holding two. A
    session hosted on this platform has somebody running it, and that person
    has to be in the room's roster or everyone else's screen labels them
    "Participant 7" — so opening the room writes them a row here too. They
    are not an attendee, though: every count of how many people are coming,
    and the capacity that count is checked against, reads audience rows only
    (`services.AUDIENCE_RSVPS`).
    """

    class ParticipantRole(models.TextChoices):
        HOST = "HOST", "Host"
        AUDIENCE = "AUDIENCE", "Audience"

    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name="rsvps")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="session_rsvps"
    )
    role = models.CharField(
        max_length=20, choices=ParticipantRole.choices, default=ParticipantRole.AUDIENCE
    )
    attended = models.BooleanField(default=False)
    joined_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["session", "student"], name="one_rsvp_per_student_per_session"),
        ]

    def __str__(self):
        return f"{self.student} -> {self.session_id}"


class LiveSessionNotes(BaseModel):
    """One run of AI meeting notes over one War Room Live session.

    Shaped after `class_sessions.ClassSessionNotes` and deliberately narrower
    than it in one respect: there is **only one source of audio here**, and it
    is the room's own. The host's browser mixes everybody who is speaking,
    records the session in segments and posts them to this server, where they
    are kept as ordinary Django files and read by the AI model
    (`LiveSessionNotesAudio`). No transcription product, no bucket, no second
    Agora bill — a deployment with an AI key and nothing else can write a
    session up. That is also why there is no STARTING state: a run is
    listening from the instant it exists, because the row *is* the
    instruction the capturing browser acts on.

    A War Room Live session is **not filmed** either, so unlike a class this
    is the only thing a session does to itself afterwards. Nothing in this
    path can stop the room opening: every failure is swallowed into a log
    line and the session carries on (`notes.maybe_start_notes`).

    The states are a straight line and the row is never stuck between them:

        TRANSCRIBING  running; the room is being recorded for its notes
        PAUSED        the host stopped mid-session; the audio so far is kept
        COLLECTING    finished; waiting for the last of the audio to land
        SUMMARIZING   transcript assembled, the model is writing the notes up
        AVAILABLE     notes written and the room has been told, exactly once
        FAILED        gave up, with a reason — the session was unaffected

    PAUSED is what makes "stop" mean *pause* rather than *finish*, exactly as
    it does for a class: a host who takes notes through the guest's answers,
    stops while the room chats and starts again expects **one** write-up
    covering both stretches, not a second one that replaces the first on the
    card. So a run is only written up when the session itself ends, and
    everything recorded across every stretch belongs to the one run.

    `notified_at` is what makes the fan-out happen exactly once: notes reach
    AVAILABLE from the host stopping them, the host leaving, and the
    session's own end passing, and the people who RSVP'd must not be told
    twice because two of those raced.
    """

    class NotesStatus(models.TextChoices):
        TRANSCRIBING = "TRANSCRIBING", "Transcribing"
        PAUSED = "PAUSED", "Paused"
        COLLECTING = "COLLECTING", "Collecting the audio"
        SUMMARIZING = "SUMMARIZING", "Writing the notes"
        AVAILABLE = "AVAILABLE", "Available"
        FAILED = "FAILED", "Failed"

    # The states in which a run is still this session's one notes run. One of
    # these per session at a time — see the constraint below.
    IN_FLIGHT_STATUSES = (
        NotesStatus.TRANSCRIBING,
        NotesStatus.PAUSED,
        NotesStatus.COLLECTING,
        NotesStatus.SUMMARIZING,
    )

    # The states in which something is actually *happening* — in flight minus
    # paused. This is what the cards and the room badge read: a paused run is
    # the host's bookmark in a session that is still going, and announcing
    # "notes are being taken" over it would be a lie.
    WORKING_STATUSES = (
        NotesStatus.TRANSCRIBING,
        NotesStatus.COLLECTING,
        NotesStatus.SUMMARIZING,
    )

    # The states in which the room is actually being recorded. Narrower than
    # WORKING_STATUSES: once the audio is being collected the browser has
    # already stopped, and only our own work is outstanding.
    LISTENING_STATUSES = (NotesStatus.TRANSCRIBING,)

    session = models.ForeignKey(
        LiveSession, on_delete=models.CASCADE, related_name="notes_runs"
    )
    # Who caused it to start, and — because exactly one browser records a
    # session — whose browser is doing the recording. SET_NULL rather than
    # CASCADE so removing an admin account never erases the write-up of a
    # session that actually happened.
    started_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="started_live_session_notes",
    )

    status = models.CharField(
        max_length=20, choices=NotesStatus.choices, default=NotesStatus.TRANSCRIBING
    )

    # What was said, as plain text. Kept beside the notes rather than thrown
    # away: it is the evidence behind every line the model wrote, it is what
    # a re-run would start from, and it is written to the row as soon as it
    # is assembled so a process that dies between transcribing and
    # summarising never pays the model for the first half twice.
    transcript = models.TextField(blank=True, default="")

    # The notes themselves — the shape `class_sessions.notes_prompt
    # .RESPONSE_SCHEMA` asks for and `notes_validators.normalize_notes_payload`
    # guarantees.
    title = models.CharField(max_length=255, blank=True, default="")
    summary = models.TextField(blank=True, default="")
    key_topics = models.JSONField(default=list, blank=True)
    important_points = models.JSONField(default=list, blank=True)
    action_items = models.JSONField(default=list, blank=True)
    next_class = models.TextField(blank=True, default="")

    # The rendered hand-out. Served only through the notes document view,
    # behind the same check as the room itself — the file name carries a
    # random suffix so a guessed MEDIA path is not a second way in.
    document = models.FileField(upload_to="meeting-notes/", blank=True, null=True)

    started_at = models.DateTimeField(null=True, blank=True)
    stopped_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    # Set once, the first time the room is told the notes exist.
    notified_at = models.DateTimeField(null=True, blank=True)

    error_message = models.CharField(max_length=500, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["session", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]
        constraints = [
            # At most one live run per session. Starting is triggered from
            # more than one place (the host joining, the host pressing the
            # button, a second admin arriving first), and two runs would each
            # write up half the session and replace the other on the card.
            models.UniqueConstraint(
                fields=["session"],
                condition=models.Q(
                    status__in=[
                        "TRANSCRIBING",
                        "PAUSED",
                        "COLLECTING",
                        "SUMMARIZING",
                    ]
                ),
                name="one_in_flight_notes_run_per_live_session",
            ),
        ]

    def __str__(self):
        return f"Notes on live session {self.session_id} ({self.status})"

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


class LiveSessionNotesAudio(BaseModel):
    """One slice of the audio a War Room Live session was written up from.

    The same shape, and for the same reasons, as
    `class_sessions.ClassSessionNotesAudio`: the audio arrives in **segments
    rather than as one file at the end**, so a browser that crashes loses the
    slice in progress instead of the hour and the model is handed minutes of
    audio per call however long the session ran.

    `index` is assigned **by the server, in arrival order**, never taken from
    the client: a capturer that crashed and came back would otherwise restart
    its own numbering and overwrite the first half of the session.
    `client_key` is what makes an upload safe to retry — a segment that timed
    out on its way up but landed anyway is recognised rather than stored
    twice.

    `transcript` is kept per segment so a write-up that died halfway resumes
    at the first segment nobody has read yet instead of paying the model for
    the whole session again.
    """

    notes = models.ForeignKey(
        LiveSessionNotes, on_delete=models.CASCADE, related_name="audio_segments"
    )

    # Arrival order, assigned by `notes.store_notes_audio` under a lock.
    index = models.PositiveIntegerField()

    # The capturing browser's own id for this blob. Unique per run, so the
    # same segment sent twice (a retry after a timeout) is one row.
    client_key = models.CharField(max_length=64)

    file = models.FileField(upload_to="live-session-audio/")
    content_type = models.CharField(max_length=100, blank=True, default="")
    size_bytes = models.PositiveBigIntegerField(default=0)
    # What the browser says it recorded. Evidence, never arithmetic: a tab
    # throttled in the background records less wall clock than it claims.
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    # Who was speaking, and when, through this segment: a list of
    # `{"at": <seconds from the start of this segment>, "uid": <user id>}`
    # sampled by the capturing browser from the individual audio tracks it is
    # mixing. It exists because what reaches the model is **one mixed track**,
    # and no amount of listening to a mix says which voice belongs to whom —
    # the browser is the only place that knows, so it writes down what it
    # measured and the model is handed the answer rather than asked to guess.
    # A guess is what files a quote under the wrong person's name, which is
    # worse than filing it under nobody's.
    speakers = models.JSONField(default=list, blank=True)

    transcript = models.TextField(blank=True, default="")
    transcribed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["index"]
        constraints = [
            models.UniqueConstraint(
                fields=["notes", "index"],
                name="one_audio_segment_per_index_per_live_run",
            ),
            models.UniqueConstraint(
                fields=["notes", "client_key"],
                name="one_audio_segment_per_client_key_per_live_run",
            ),
        ]

    def __str__(self):
        return f"Audio {self.index} of live notes run {self.notes_id}"
