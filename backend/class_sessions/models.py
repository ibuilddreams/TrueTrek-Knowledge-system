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
