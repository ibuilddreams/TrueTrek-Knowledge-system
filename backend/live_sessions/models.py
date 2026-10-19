from django.conf import settings
from django.db import models

from common.models import BaseModel


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

    class MeetingMethod(models.TextChoices):
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
        max_length=20, choices=MeetingMethod.choices, default=MeetingMethod.ZOOM
    )
    meeting_url = models.URLField(blank=True, null=True)

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


class SessionRSVP(BaseModel):
    """A student's reservation for a session.

    `attended` is set when the student actually opens the join link (see
    services.get_join_url), which is the only attendance signal available
    for a session hosted on someone else's platform — it means "showed up to
    the door", not "stayed for the hour", and is named/documented that way
    rather than being presented as true attendance.
    """

    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name="rsvps")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="session_rsvps"
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
