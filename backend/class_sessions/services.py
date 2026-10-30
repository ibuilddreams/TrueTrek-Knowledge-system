"""Live classes — scheduling, who may attend, and Agora join credentials.

Three things live here:

1. A class's UPCOMING/LIVE/ENDED state, derived from the clock rather than
   stored (`live_state`), exactly as `live_sessions.services` does it.
2. Membership, resolved live from the course's instructors and its ACTIVE
   enrolments (`can_manage` / `can_attend`) — the same rule
   `warroom.services.can_access_room` uses, so a class and its course group
   chat can never disagree about who is in the room.
3. The only places a credential is minted — `issue_join_credentials` for the
   Agora RTC call and `issue_whiteboard_credentials` for the Interactive
   Whiteboard the teacher presents on — both gated on the same door
   (`_assert_room_open`), so video and board can never disagree about who is
   allowed into a class or when.
"""

import logging
import re
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.db.models import Count, DateTimeField, ExpressionWrapper, F, Q, Value
from django.utils import timezone

from courses.services import is_course_instructor
from enrollments.models import Enrollment
from notifications.services import create_notifications_for_users

from .agora import MAX_EXPIRE_SECONDS, ROLE_PUBLISHER, AgoraTokenError, build_rtc_token
from .exceptions import (
    AgoraNotConfiguredError,
    SessionAccessDeniedError,
    SessionNotJoinableError,
    SessionScheduleError,
    WhiteboardNotConfiguredError,
)
from .models import ClassSession, ClassSessionAttendance
from .whiteboard import (
    MAX_LIFESPAN_SECONDS,
    ROLE_ADMIN,
    ROLE_NAMES,
    ROLE_READER,
    ROLE_WRITER,
    WHITEBOARD_REGIONS,
    WhiteboardTokenError,
    build_room_token,
    build_sdk_token,
)
from .whiteboard_api import create_room

logger = logging.getLogger(__name__)

# Students are let in shortly before the advertised start so nobody is locked
# out by a slow page load or a few seconds of clock skew. The teacher gets a
# much wider door: setting a room up, sharing a screen and checking a camera
# all happen before the class is due to begin.
STUDENT_JOIN_WINDOW_MINUTES_BEFORE = 15
HOST_JOIN_WINDOW_MINUTES_BEFORE = 60
# A class stays joinable a little past its scheduled end — these run over.
LIVE_GRACE_MINUTES_AFTER = 15

MIN_DURATION_MINUTES = 5
MAX_DURATION_MINUTES = 8 * 60

# A token has to outlive the class comfortably: Agora drops a participant
# whose token expires mid-call, and the frontend's renewal is a safety net,
# not the plan. Clamped to Agora's own 24-hour ceiling in `_token_lifetime`.
TOKEN_TAIL_BUFFER_SECONDS = 30 * 60
MIN_TOKEN_SECONDS = 15 * 60

UPCOMING = "UPCOMING"
LIVE = "LIVE"
ENDED = "ENDED"
CANCELLED = "CANCELLED"


# ---------------------------------------------------------------------------
# Clock-derived state
# ---------------------------------------------------------------------------


def session_window(session):
    """(opens_at, starts_at, ends_at) for a student, in that order."""
    starts_at = session.scheduled_at
    ends_at = starts_at + timedelta(minutes=session.duration_minutes or 0)
    opens_at = starts_at - timedelta(minutes=STUDENT_JOIN_WINDOW_MINUTES_BEFORE)
    return opens_at, starts_at, ends_at


def host_opens_at(session):
    return session.scheduled_at - timedelta(minutes=HOST_JOIN_WINDOW_MINUTES_BEFORE)


def live_state(session, now=None):
    """Derived status — never stored. A cancelled class stays cancelled
    whatever the clock says; everything else is decided by where `now` falls
    in the session window."""
    if session.status == ClassSession.SessionStatus.CANCELLED:
        return CANCELLED

    now = now or timezone.now()
    opens_at, _, ends_at = session_window(session)

    if now < opens_at:
        return UPCOMING
    if now <= ends_at + timedelta(minutes=LIVE_GRACE_MINUTES_AFTER):
        return LIVE
    return ENDED


def can_join_now(session, user=None, now=None):
    """Whether the room would open for this user right now.

    Role matters: the teacher's door opens an hour early, so a card that
    shows "Start class" to the host must show "Opens 15 min before" to a
    student looking at the same class at the same moment.
    """
    if session.status == ClassSession.SessionStatus.CANCELLED:
        return False

    now = now or timezone.now()
    _, _, ends_at = session_window(session)
    if now > ends_at + timedelta(minutes=LIVE_GRACE_MINUTES_AFTER):
        return False

    opens_at = (
        host_opens_at(session)
        if user is not None and is_host(user, session)
        else session_window(session)[0]
    )
    return now >= opens_at


# ---------------------------------------------------------------------------
# Membership
# ---------------------------------------------------------------------------


def is_host(user, session):
    """Hosts are the course's instructors (and admins, who can sit in on any
    class). Deliberately resolved from the course rather than from
    `session.teacher`, so a co-instructor can cover a colleague's class
    without the row being reassigned."""
    if not user or not user.is_authenticated:
        return False
    if user.is_admin:
        return True
    return user.is_teacher and is_course_instructor(user, session.course)


def can_manage(user, session):
    """Schedule, edit, cancel, and read the attendance list."""
    return is_host(user, session)


def can_attend(user, session):
    """Host, or a student with an ACTIVE enrolment in the course."""
    if is_host(user, session):
        return True
    if not user or not user.is_authenticated or not user.is_student:
        return False
    return Enrollment.objects.filter(
        student=user, course=session.course, status=Enrollment.EnrollmentStatus.ACTIVE
    ).exists()


def participant_role(user, session):
    return (
        ClassSessionAttendance.ParticipantRole.HOST
        if is_host(user, session)
        else ClassSessionAttendance.ParticipantRole.STUDENT
    )


# ---------------------------------------------------------------------------
# Querysets
# ---------------------------------------------------------------------------

# Split lists on a class's *end* time, not its start: a 90-minute class that
# began 20 minutes ago is still live and belongs in "upcoming", not "past" —
# the same reasoning (and the same expression) as live_sessions.services.
_ENDS_AT = ExpressionWrapper(
    F("scheduled_at") + F("duration_minutes") * Value(timedelta(minutes=1)),
    output_field=DateTimeField(),
)


def _annotated(queryset):
    return queryset.annotate(
        attendee_count=Count("attendances", distinct=True), ends_at=_ENDS_AT
    ).select_related("course", "teacher")


def _list_cutoff():
    return timezone.now() - timedelta(minutes=LIVE_GRACE_MINUTES_AFTER)


def teacher_sessions(user):
    """Every class on a course this teacher instructs — including ones a
    co-instructor scheduled, which is the point of resolving hosts from the
    course."""
    if user.is_admin:
        return _annotated(ClassSession.objects.all())
    return _annotated(
        ClassSession.objects.filter(course__instructors__instructor=user).distinct()
    )


def student_sessions(user):
    return _annotated(
        ClassSession.objects.filter(
            course__enrollments__student=user,
            course__enrollments__status=Enrollment.EnrollmentStatus.ACTIVE,
        ).distinct()
    )


def visible_sessions(user):
    """Everything `user` is allowed to see, whichever side of the class they
    are on. Used by the shared detail endpoint."""
    if user.is_teacher or user.is_admin:
        return teacher_sessions(user)
    if user.is_student:
        return student_sessions(user)
    return _annotated(ClassSession.objects.none())


def upcoming(queryset):
    """Scheduled classes that haven't finished yet — one that is live right
    now belongs here."""
    return queryset.filter(
        status=ClassSession.SessionStatus.SCHEDULED, ends_at__gte=_list_cutoff()
    ).order_by("scheduled_at")


def past(queryset):
    """Finished classes, plus every cancelled one whatever its date — a
    cancelled class has to stay visible to the students who were expecting
    it, and has no future worth listing under "upcoming"."""
    return queryset.filter(
        Q(ends_at__lt=_list_cutoff()) | Q(status=ClassSession.SessionStatus.CANCELLED)
    ).order_by("-scheduled_at")


def attendance_for(session):
    return ClassSessionAttendance.objects.filter(session=session).select_related("user")


def get_roster(session):
    """uid → person, for labelling the video tiles.

    Agora identifies a remote participant by the numeric uid we minted their
    token with, which is their user id (see `issue_join_credentials`), and
    nothing else — without this map a class is a grid of anonymous squares.
    Only names and roles are exposed: a student has no business reading a
    classmate's email off the call screen.
    """
    hosts = [
        {"uid": link.instructor_id, "name": link.instructor.name or link.instructor.username,
         "role": ClassSessionAttendance.ParticipantRole.HOST}
        for link in session.course.instructors.select_related("instructor")
    ]
    students = [
        {"uid": enrollment.student_id, "name": enrollment.student.name or enrollment.student.username,
         "role": ClassSessionAttendance.ParticipantRole.STUDENT}
        for enrollment in Enrollment.objects.filter(
            course=session.course, status=Enrollment.EnrollmentStatus.ACTIVE
        ).select_related("student")
    ]
    seen = set()
    roster = []
    for entry in hosts + students:
        if entry["uid"] in seen:
            continue
        seen.add(entry["uid"])
        roster.append(entry)
    return roster


# ---------------------------------------------------------------------------
# Scheduling
# ---------------------------------------------------------------------------


def _clashes_with(*, teacher, scheduled_at, duration_minutes, exclude_pk=None):
    """The teacher's own classes that overlap this slot.

    Only the teacher's timetable is checked, not the course's: two different
    teachers may legitimately run parallel classes on one course, but nobody
    can host two rooms at once, and a double-booking is only ever discovered
    by the students sitting in the empty one.
    """
    if teacher is None:
        return ClassSession.objects.none()

    ends_at = scheduled_at + timedelta(minutes=duration_minutes)
    queryset = ClassSession.objects.filter(
        teacher=teacher, status=ClassSession.SessionStatus.SCHEDULED
    ).annotate(computed_ends_at=_ENDS_AT).filter(
        scheduled_at__lt=ends_at, computed_ends_at__gt=scheduled_at
    )
    if exclude_pk is not None:
        queryset = queryset.exclude(pk=exclude_pk)
    return queryset


def assert_no_clash(*, teacher, scheduled_at, duration_minutes, exclude_pk=None):
    clash = _clashes_with(
        teacher=teacher,
        scheduled_at=scheduled_at,
        duration_minutes=duration_minutes,
        exclude_pk=exclude_pk,
    ).first()
    if clash is not None:
        raise SessionScheduleError(
            f'This overlaps "{clash.title}", which you are already hosting at that time.'
        )


def enrolled_student_ids(course):
    return list(
        Enrollment.objects.filter(
            course=course, status=Enrollment.EnrollmentStatus.ACTIVE
        ).values_list("student_id", flat=True)
    )


def _notify_students(session, *, verb, title, message):
    student_ids = enrolled_student_ids(session.course)
    if not student_ids:
        return
    create_notifications_for_users(
        student_ids,
        verb=verb,
        title=title,
        message=message,
        related_object_type="class_session",
        related_object_id=session.pk,
    )


def schedule_class(*, teacher, course, **fields):
    """Creates the class and tells the course's students it exists.

    The caller (the serializer) has already checked the shape of the fields;
    what is enforced here is the part that needs the database — that the
    teacher actually instructs this course, and isn't already hosting
    something else at that hour.
    """
    if not is_course_instructor(teacher, course) and not teacher.is_admin:
        raise SessionScheduleError("You can only schedule classes for courses you teach.")

    assert_no_clash(
        teacher=teacher,
        scheduled_at=fields["scheduled_at"],
        duration_minutes=fields.get("duration_minutes") or 60,
    )

    session = ClassSession.objects.create(course=course, teacher=teacher, **fields)
    _notify_students(
        session,
        verb="class_scheduled",
        title=f"New live class: {session.title}",
        message=f"{session.course.title} — starts {session.scheduled_at:%d %b %Y at %H:%M} UTC.",
    )
    return session


def update_class(session, **fields):
    """Applies an edit, re-checking the timetable only when the slot moved.

    Students are told about a change of time (they have to be somewhere), and
    not about a typo fixed in the description.
    """
    scheduled_at = fields.get("scheduled_at", session.scheduled_at)
    duration_minutes = fields.get("duration_minutes", session.duration_minutes)
    slot_moved = (
        scheduled_at != session.scheduled_at or duration_minutes != session.duration_minutes
    )

    if slot_moved:
        assert_no_clash(
            teacher=session.teacher,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            exclude_pk=session.pk,
        )

    for field, value in fields.items():
        setattr(session, field, value)
    session.save()

    if slot_moved and session.status == ClassSession.SessionStatus.SCHEDULED:
        _notify_students(
            session,
            verb="class_rescheduled",
            title=f"Class rescheduled: {session.title}",
            message=f"{session.course.title} — now starts {session.scheduled_at:%d %b %Y at %H:%M} UTC.",
        )
    return session


def cancel_class(session, reason=""):
    """Cancels rather than deletes, so the students who were told to show up
    see why nobody is there. Deleting is reserved for a class nobody has
    joined and nobody was told about (see the view)."""
    session.status = ClassSession.SessionStatus.CANCELLED
    session.cancellation_reason = reason or "This class was cancelled."
    session.save(update_fields=["status", "cancellation_reason", "updated_at"])

    _notify_students(
        session,
        verb="class_cancelled",
        title=f"Class cancelled: {session.title}",
        message=session.cancellation_reason,
    )
    return session


# ---------------------------------------------------------------------------
# Agora credentials
# ---------------------------------------------------------------------------


def _agora_credentials():
    app_id = (getattr(settings, "AGORA_APP_ID", "") or "").strip()
    app_certificate = (getattr(settings, "AGORA_APP_CERTIFICATE", "") or "").strip()
    if not app_id or not app_certificate:
        logger.error(
            "class_sessions: AGORA_APP_ID / AGORA_APP_CERTIFICATE are not set — "
            "no class can be joined until both are configured in the backend environment."
        )
        raise AgoraNotConfiguredError("Live classes are not configured on this server yet.")
    return app_id, app_certificate


def _token_lifetime(session, now, ceiling=MAX_EXPIRE_SECONDS):
    """Seconds of validity for a token minted at `now`.

    Covers the rest of the class, its overrun grace and a further buffer, so
    an ordinary class never reaches the renewal path at all; clamped to the
    issuing service's own maximum, and floored so that joining in the last
    minute of a class still yields a usable token. Both credentials a class
    hands out are measured the same way — a whiteboard token that outlived
    the video token would leave a board open on a class nobody is in.
    """
    _, _, ends_at = session_window(session)
    remaining = (ends_at - now).total_seconds()
    lifetime = int(remaining) + LIVE_GRACE_MINUTES_AFTER * 60 + TOKEN_TAIL_BUFFER_SECONDS
    return max(MIN_TOKEN_SECONDS, min(lifetime, ceiling))


def _record_attendance(session, user, role, now):
    """One row per person per class, updated on every rejoin.

    `get_or_create` under a transaction rather than a plain create: a
    reconnect after a dropped connection is the normal case, not an error.
    """
    with transaction.atomic():
        attendance, created = ClassSessionAttendance.objects.get_or_create(
            session=session,
            user=user,
            defaults={
                "role": role,
                "first_joined_at": now,
                "last_joined_at": now,
                "join_count": 1,
            },
        )
        if not created:
            attendance.role = role
            attendance.last_joined_at = now
            attendance.left_at = None
            attendance.join_count = F("join_count") + 1
            attendance.save(update_fields=["role", "last_joined_at", "left_at", "join_count", "updated_at"])
            attendance.refresh_from_db(fields=["join_count"])
    return attendance


def _assert_room_open(session, user, now):
    """The classroom door, in one place: may this person be let in right now?

    Returns whether they are a host, which is the other thing every caller
    needs. Raises rather than returning a verdict so there is no route to a
    credential that forgets to check one of these — every surface a class has
    (the video call and the whiteboard) goes through here, so they can never
    disagree about who is in the room or when it opened.
    """
    if not can_attend(user, session):
        raise SessionAccessDeniedError("You're not enrolled in this class.")

    if session.status == ClassSession.SessionStatus.CANCELLED:
        raise SessionNotJoinableError(
            session.cancellation_reason or "This class was cancelled."
        )

    _, _, ends_at = session_window(session)
    if now > ends_at + timedelta(minutes=LIVE_GRACE_MINUTES_AFTER):
        raise SessionNotJoinableError("This class has already ended.")

    host = is_host(user, session)
    opens_at = host_opens_at(session) if host else session_window(session)[0]
    if now < opens_at:
        # Deliberately no timestamp in the message: the server only knows
        # UTC, while every time the frontend renders is in the viewer's own
        # timezone, so quoting one here would contradict the clock beside it
        # (the same reason live_sessions.get_join_url quotes none).
        minutes = HOST_JOIN_WINDOW_MINUTES_BEFORE if host else STUDENT_JOIN_WINDOW_MINUTES_BEFORE
        raise SessionNotJoinableError(
            f"The classroom opens {minutes} minutes before the class starts."
        )

    return host


def issue_join_credentials(*, session, user, now=None):
    """Mints the Agora token for one person joining one class.

    This is the only place an RTC token is created, and the gate lives in
    `_assert_room_open` rather than in the view, so there is no route to a
    credential that skips it. The token is bound to this channel *and* to
    this user's uid, so it cannot be passed to a classmate who was never
    enrolled.
    """
    now = now or timezone.now()
    _assert_room_open(session, user, now)

    app_id, app_certificate = _agora_credentials()
    expire_seconds = _token_lifetime(session, now)

    try:
        token = build_rtc_token(
            app_id=app_id,
            app_certificate=app_certificate,
            channel_name=session.channel_name,
            # The uid *is* the user id: stable across reconnects, unique
            # within the channel, and what `get_roster` maps back to a name.
            uid=user.pk,
            expire_seconds=expire_seconds,
            role=ROLE_PUBLISHER,
        )
    except AgoraTokenError:
        logger.exception("class_sessions: failed to sign an Agora token for session %s", session.pk)
        raise AgoraNotConfiguredError("Live classes are not configured correctly on this server.")

    role = participant_role(user, session)
    _record_attendance(session, user, role, now)

    return {
        "channel_name": session.channel_name,
        "token": token,
        "uid": user.pk,
        "role": role,
        "expires_at": now + timedelta(seconds=expire_seconds),
        "expires_in": expire_seconds,
        "roster": get_roster(session),
    }


def record_leave(*, session, user, now=None):
    """Best-effort: a browser that crashes never gets here, which is why
    attendance is presented as arrival rather than as minutes attended."""
    now = now or timezone.now()
    attendance = ClassSessionAttendance.objects.filter(session=session, user=user).first()
    if attendance is None:
        return None
    attendance.left_at = now
    attendance.save(update_fields=["left_at", "updated_at"])
    return attendance


# ---------------------------------------------------------------------------
# Whiteboard credentials
# ---------------------------------------------------------------------------

# An Agora whiteboard App Identifier is `<team>/<app>`, and the SDK enforces
# exactly this pattern before it will even construct. Checked here so a
# mistyped value is a log line and an honest 503 rather than an exception
# thrown from inside the bundle in somebody's browser.
APP_IDENTIFIER_PATTERN = re.compile(r"^[0-9a-zA-Z\-_]+/[0-9a-zA-Z\-_]+$")

# How long the SDK token used to create a room is good for. It never leaves
# this process and is used within milliseconds of being signed, so it is given
# the shortest lifetime that survives a slow clock between us and Netless
# rather than a convenient one.
WHITEBOARD_SDK_TOKEN_SECONDS = 10 * 60


def _read_whiteboard_settings():
    """`(values, problem)` — the four configured values and what's wrong.

    Silent on purpose. Every serialized class asks whether a board could be
    opened (`is_whiteboard_configured`), so complaining here would put one log
    line per row of every listing on a server that simply doesn't use the
    whiteboard. The complaint belongs with the request that was actually
    refused, which is `_whiteboard_settings` below.
    """
    values = (
        (getattr(settings, "AGORA_WHITEBOARD_APP_IDENTIFIER", "") or "").strip(),
        (getattr(settings, "AGORA_WHITEBOARD_ACCESS_KEY", "") or "").strip(),
        (getattr(settings, "AGORA_WHITEBOARD_SECRET_KEY", "") or "").strip(),
        (getattr(settings, "AGORA_WHITEBOARD_REGION", "") or "").strip(),
    )
    app_identifier, access_key, secret_key, region = values

    if not app_identifier or not access_key or not secret_key:
        return values, "missing_keys"
    if not APP_IDENTIFIER_PATTERN.match(app_identifier):
        return values, "bad_identifier"
    if region not in WHITEBOARD_REGIONS:
        return values, "unknown_region"
    return values, None


def is_whiteboard_configured():
    """Whether a board could be opened at all on this server.

    A plain boolean for the serializers, which have to render a button or an
    explanation and must not raise — or log — while doing it.
    """
    return _read_whiteboard_settings()[1] is None


def _whiteboard_settings():
    """The four configured values, or an honest refusal.

    Deliberately separate from `_agora_credentials`: a server can perfectly
    well have working video and no whiteboard, and conflating the two would
    report a missing board as a broken classroom.
    """
    values, problem = _read_whiteboard_settings()

    if problem == "missing_keys":
        logger.error(
            "class_sessions: AGORA_WHITEBOARD_APP_IDENTIFIER / _ACCESS_KEY / _SECRET_KEY "
            "are not all set — the classroom whiteboard stays unavailable until they are. "
            "They come from the Whiteboard panel of the Agora Console, not from the RTC project."
        )
        raise WhiteboardNotConfiguredError(
            "The classroom whiteboard isn't configured on this server yet."
        )

    if problem == "bad_identifier":
        # Caught here rather than in the browser. The SDK validates this shape
        # itself and refuses with `find invalid appIdentifier`, thrown from a
        # constructor three layers inside a 2.8 MB bundle — which reads as a
        # broken whiteboard rather than as a mistyped environment variable.
        logger.error(
            "class_sessions: AGORA_WHITEBOARD_APP_IDENTIFIER=%r is not of the form "
            "<team>/<app>. The Agora Console shows it with the slash in it; copying "
            "only the half after it is the usual mistake.",
            values[0],
        )
        raise WhiteboardNotConfiguredError(
            "The classroom whiteboard's App Identifier is not in the expected format."
        )

    if problem == "unknown_region":
        # Loud rather than silently falling back to a default: a room created
        # in the wrong data centre works, but works badly, from the far side
        # of the planet — and the symptom (a slow, jittery board) never points
        # back at a typo in an environment variable.
        logger.error(
            "class_sessions: AGORA_WHITEBOARD_REGION=%r is not one of %s.",
            values[3],
            ", ".join(sorted(WHITEBOARD_REGIONS)),
        )
        raise WhiteboardNotConfiguredError(
            "The classroom whiteboard is configured with an unknown region."
        )

    return values


def ensure_whiteboard_room(session, *, access_key, secret_key, region):
    """The class's whiteboard room, created on first use.

    Rooms are made lazily rather than when a class is scheduled, because a
    room is somebody else's resource asked for over HTTP and most classes
    never carry a board. Once made it is kept for the life of the class, so
    the teacher can set a board up an hour early and everything drawn on it
    survives a dropped connection, a reload and a student arriving late.

    The row is locked across the HTTP call on purpose. A race here — two
    people opening the board in the same second — would otherwise create two
    rooms and leave one of them orphaned at Netless forever, with half the
    class drawing on a board the other half cannot see. The wait is bounded
    by `whiteboard_api.REQUEST_TIMEOUT_SECONDS` and only ever affects people
    opening the same class's board at the same moment.
    """
    if session.whiteboard_room_uuid:
        return session.whiteboard_room_uuid, session.whiteboard_region or region

    with transaction.atomic():
        locked = ClassSession.objects.select_for_update().get(pk=session.pk)
        if locked.whiteboard_room_uuid:
            session.whiteboard_room_uuid = locked.whiteboard_room_uuid
            session.whiteboard_region = locked.whiteboard_region
            return locked.whiteboard_room_uuid, locked.whiteboard_region or region

        sdk_token = build_sdk_token(
            access_key=access_key,
            secret_key=secret_key,
            lifespan_seconds=WHITEBOARD_SDK_TOKEN_SECONDS,
            role=ROLE_ADMIN,
        )
        room_uuid = create_room(sdk_token=sdk_token, region=region)

        locked.whiteboard_room_uuid = room_uuid
        locked.whiteboard_region = region
        locked.save(update_fields=["whiteboard_room_uuid", "whiteboard_region", "updated_at"])

    session.whiteboard_room_uuid = room_uuid
    session.whiteboard_region = region
    return room_uuid, region


def whiteboard_role(user, session):
    """Netless role for one person on this class's board.

    The teacher presents and the class watches, until the teacher hands the
    pen over (`ClassSession.WhiteboardAccess`). This is the *only* thing that
    decides whether a student can draw: a reader's token is refused by
    Netless itself, so no amount of persuading the page changes it.
    """
    if is_host(user, session):
        return ROLE_WRITER
    if session.whiteboard_access == ClassSession.WhiteboardAccess.EVERYONE:
        return ROLE_WRITER
    return ROLE_READER


def issue_whiteboard_credentials(*, session, user, now=None):
    """Mints the room token for one person opening one class's whiteboard.

    Behind the same door as the video call (`_assert_room_open`), so a board
    cannot be opened on a class that was cancelled, hasn't opened yet or
    finished an hour ago — and a student who was never enrolled gets nothing
    whichever surface they ask for.

    Unlike `issue_join_credentials` this writes **no attendance row**: opening
    a board is not arriving at a class, and stamping someone as present
    because they looked at the whiteboard would quietly make the register say
    something it cannot know.

    The App Identifier and the region travel in this payload rather than being
    configured into the frontend the way the RTC App ID is. They are not
    secret — but a room token, the identifier it was signed under and the data
    centre its room lives in only work as a set, and serving all three
    together is what makes it impossible for a browser pointed at one
    environment to half-work against another's board.
    """
    now = now or timezone.now()
    _assert_room_open(session, user, now)

    app_identifier, access_key, secret_key, region = _whiteboard_settings()
    room_uuid, room_region = ensure_whiteboard_room(
        session,
        access_key=access_key,
        secret_key=secret_key,
        region=region,
    )

    expire_seconds = _token_lifetime(session, now, ceiling=MAX_LIFESPAN_SECONDS)
    role = whiteboard_role(user, session)

    try:
        token = build_room_token(
            access_key=access_key,
            secret_key=secret_key,
            lifespan_seconds=expire_seconds,
            room_uuid=room_uuid,
            role=role,
        )
    except WhiteboardTokenError:
        logger.exception(
            "class_sessions: failed to sign a whiteboard room token for session %s", session.pk
        )
        raise WhiteboardNotConfiguredError(
            "The classroom whiteboard isn't configured correctly on this server."
        )

    return {
        "app_identifier": app_identifier,
        "region": room_region,
        "room_uuid": room_uuid,
        "room_token": token,
        # Netless identifies a participant by an opaque string, where Agora
        # RTC wants a number. It is the same user id underneath, so the two
        # rosters line up, but it has to be sent as the string the whiteboard
        # SDK will compare against.
        "uid": str(user.pk),
        "role": ROLE_NAMES[role],
        "writable": role != ROLE_READER,
        "access": session.whiteboard_access,
        "is_host": is_host(user, session),
        "display_name": user.name or user.username,
        "expires_at": now + timedelta(seconds=expire_seconds),
        "expires_in": expire_seconds,
    }


def set_whiteboard_access(*, session, user, access):
    """Hands the pen to the class, or takes it back. Hosts only.

    Persisted rather than announced over the board's own realtime state,
    because it has to survive everyone currently in the room: a student who
    opens the board after the teacher opened it up must be minted a writer's
    token, and one who reloads after it was closed again must not.
    """
    if not can_manage(user, session):
        raise SessionAccessDeniedError("Only the teacher can change who may draw.")

    valid = {choice for choice, _ in ClassSession.WhiteboardAccess.choices}
    if access not in valid:
        raise SessionScheduleError("Unknown whiteboard access setting.")

    session.whiteboard_access = access
    session.save(update_fields=["whiteboard_access", "updated_at"])
    return session
