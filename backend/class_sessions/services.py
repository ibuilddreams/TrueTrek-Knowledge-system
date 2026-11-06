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
4. The recording of a class, from the recorder Agora sends into the channel
   to the signed link every enrolled student is handed afterwards (see
   "Recording" below). A playback URL is minted per viewer, per click, from
   the same roster rule as the door — a recording is as private as the class
   it is of.
5. The **meeting notes** of a class, from the transcription bot Agora sends
   into the channel to the write-up every enrolled student is emailed about
   (see "Meeting notes" below). A separate Agora product from the recorder,
   on a separate switch, writing captions rather than video — a class can be
   written up without ever being filmed, and either one being broken never
   touches the other or the class itself.
"""

import base64
import io
import json
import logging
import re
import secrets
import threading
import time
from datetime import timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMessage, send_mass_mail
from django.db import IntegrityError, close_old_connections, transaction
from django.db.models import (
    Count,
    DateTimeField,
    Exists,
    ExpressionWrapper,
    F,
    Max,
    OuterRef,
    Q,
    Value,
)
from django.utils import timezone

from ai_courses.providers import get_provider
from ai_courses.providers.base import ProviderError, ProviderTransportError
from courses.services import is_course_instructor
from enrollments.models import Enrollment
from notifications.services import create_notifications_for_users

from . import (
    notes_audio,
    notes_document,
    notes_prompt,
    notes_validators,
    recording_api,
    storage,
    transcript,
    transcription_api,
)
from .agora import (
    MAX_EXPIRE_SECONDS,
    ROLE_PUBLISHER,
    ROLE_SUBSCRIBER,
    AgoraTokenError,
    build_rtc_token,
)
from .exceptions import (
    AgoraNotConfiguredError,
    NotesGoneError,
    NotesNotConfiguredError,
    NotesUnavailableError,
    RecordingGoneError,
    RecordingNotConfiguredError,
    RecordingUnavailableError,
    SessionAccessDeniedError,
    SessionNotJoinableError,
    SessionScheduleError,
    WhiteboardNotConfiguredError,
)
from .models import (
    ClassSession,
    ClassSessionAttendance,
    ClassSessionNotes,
    ClassSessionNotesAudio,
    ClassSessionRecording,
)
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

# The room opens on the stroke of the advertised time and not a minute
# before, for the teacher and the students alike: a class said to start at
# 5:51 is one nobody — including its host — can be in at 5:50, and the card
# says "Starts in 1 min" rather than offering a button. Both doors are still
# named separately, and everything that asks when a room opens
# (`session_window`, `host_opens_at`, `live_state`, `can_join_now`,
# `_assert_room_open`) reads one of these two numbers rather than the clock
# directly — so a lead time can be handed back to either side by changing a
# number here, and the host's can differ from the students' again.
STUDENT_JOIN_WINDOW_MINUTES_BEFORE = 0
HOST_JOIN_WINDOW_MINUTES_BEFORE = 0
# How long a class stays open past its advertised end, in minutes. **Zero**:
# a class booked for an hour is over after an hour, the room shuts on both
# sides, and the classroom closes itself (`useClassroomClosing` warns the room
# twice on the way there, so nobody is cut off without notice). Anything else
# needs the whole of this number — a room that is shut while the card still
# says LIVE, or a class in "upcoming" that nobody can get into, is a worse
# state than either end of the choice.
#
# Still a named number rather than a deleted one: a grace period is the thing
# most likely to be wanted back, and everything that asks when a class is over
# (`live_state`, `can_join_now`, `_assert_room_open`, `_list_cutoff`,
# `_token_lifetime`, and both monitors' deadlines) reads it here rather than
# the clock, so handing one back is changing this line.
LIVE_GRACE_MINUTES_AFTER = 0

MIN_DURATION_MINUTES = 5
MAX_DURATION_MINUTES = 8 * 60

# A start time is only refused for being in the *past*, and "now" is read with
# a little slack either side: the browser's picker resolves to the minute, the
# teacher carries on filling the form after choosing a time, and their clock
# and this one are never exactly in step. A class starting about now is an
# ordinary thing to schedule — the room is open well before the start in any
# case — while yesterday's date is the mistake worth catching.
SCHEDULE_PAST_GRACE_MINUTES = 2

# That same minute-resolution picker is why an edit sends a start time back a
# few seconds off the stored one (the frontend's `toDateTimeLocalValue` drops
# the seconds). Two times this close are the same slot: the class has not been
# moved, so it needs neither a future start nor a reschedule notice.
SLOT_UNCHANGED_TOLERANCE = timedelta(seconds=60)

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


def slot_is_unchanged(scheduled_at, other):
    """Whether two start times mean the same slot.

    See `SLOT_UNCHANGED_TOLERANCE`: the teacher's picker cannot express the
    seconds, so an unmoved class comes back a fraction off itself.
    """
    if scheduled_at is None or other is None:
        return scheduled_at is other
    return abs(scheduled_at - other) < SLOT_UNCHANGED_TOLERANCE


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

    Asked per viewer because the two doors are separate numbers
    (`HOST_JOIN_WINDOW_MINUTES_BEFORE` / `STUDENT_JOIN_WINDOW_MINUTES_BEFORE`)
    even while both stand at the scheduled start — a host lead time is one
    constant away, and a card that re-derived this from the clock would be
    wrong on the day that changes.
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
    """The shape every listing is built on.

    The four recording and notes flags are subqueries rather than a per-row
    lookup in the serializer: a student's past-classes page renders twenty
    cards and each one needs to know whether there is something to watch and
    something to read, which is eighty extra queries the moment they are asked
    one card at a time.
    """
    statuses = ClassSessionRecording.RecordingStatus
    note_statuses = ClassSessionNotes.NotesStatus
    return queryset.annotate(
        attendee_count=Count("attendances", distinct=True),
        ends_at=_ENDS_AT,
        has_recording=Exists(
            ClassSessionRecording.objects.filter(
                session=OuterRef("pk"), status=statuses.AVAILABLE
            ).exclude(storage_key="")
        ),
        recording_in_progress=Exists(
            ClassSessionRecording.objects.filter(
                session=OuterRef("pk"),
                status__in=[statuses.STARTING, statuses.RECORDING],
            )
        ),
        has_notes=Exists(
            ClassSessionNotes.objects.filter(
                session=OuterRef("pk"), status=note_statuses.AVAILABLE
            ).exclude(summary="")
        ),
        notes_in_progress=Exists(
            ClassSessionNotes.objects.filter(
                session=OuterRef("pk"),
                # Working, not merely in flight: a paused run is a teacher's
                # bookmark in a class that is still going, and a "Notes" badge
                # over it would tell the room it is being listened to when it
                # is not.
                status__in=list(ClassSessionNotes.WORKING_STATUSES),
            )
        ),
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
    # Compared through `slot_is_unchanged` rather than `!=`: an edit that only
    # fixed the title still posts the start time back, a few seconds off
    # itself, and that must not read as a move — it would re-check the
    # timetable and tell every student on the course to be somewhere new.
    slot_moved = (
        not slot_is_unchanged(scheduled_at, session.scheduled_at)
        or duration_minutes != session.duration_minutes
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

    # A cancelled class is over, whoever is still in the room — leaving a
    # recorder running in it would bill for an empty channel until Agora's
    # idle timer noticed.
    try:
        stop_recording(session=session, reason="the class was cancelled")
    except Exception:  # noqa: BLE001 - cancelling must always succeed
        logger.exception("class_sessions: could not stop the recording of cancelled class %s", session.pk)

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
            if minutes
            else "The classroom opens when the class starts."
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

    # The class records because its teacher is in it. Deliberately after the
    # token is signed and the register written: a recording service that is
    # down, unconfigured or out of quota must never be the reason a class
    # cannot open, so `maybe_start_recording` swallows everything into a log
    # line and the join carries on regardless.
    #
    # The fallback is not a tidy-up: a *student* joining never starts
    # anything, and they are precisely the person who most needs to be told
    # the class is already being recorded.
    recording = maybe_start_recording(session, user, now) or active_recording(session)

    # And the class writes itself up because its teacher is in it, for exactly
    # the same reasons and with exactly the same guarantees — a separate Agora
    # product on a separate switch, swallowing every failure into a log line so
    # neither it nor the recorder can be the reason a classroom won't open.
    notes = maybe_start_notes(session, user, now) or active_notes(session)

    return {
        "channel_name": session.channel_name,
        "token": token,
        "uid": user.pk,
        "role": role,
        "expires_at": now + timedelta(seconds=expire_seconds),
        "expires_in": expire_seconds,
        "roster": get_roster(session),
        # So the classroom can show everyone that the class is being recorded
        # from the moment they arrive, rather than on the next poll. The
        # recorder's own uid range travels with it: it joins the channel as a
        # participant, and a browser that didn't know would render an empty
        # video tile for it.
        "is_recording": bool(recording and recording.is_in_flight),
        # The floor above which a uid in this channel is one of Agora's bots
        # rather than a person — the recorder and the transcription bot both
        # live above it, and a browser only ever needs the one question
        # answered before it draws a tile.
        "recorder_uid_min": SERVICE_UID_MIN,
        # Said at the moment of arrival for the same reason the recording is:
        # a class that is being written up is a fact about the room, and
        # everybody in it should know on their first frame rather than on the
        # next poll.
        "is_taking_notes": bool(notes and notes.is_listening),
        # And everything the capturing browser needs to start recording,
        # here rather than only on the notes endpoint. The two requests race
        # on the way into a classroom, and the seconds between them are the
        # start of the lesson — a recorder that has to wait for a second
        # round trip is a recorder that misses the first thing said.
        "notes_capture": notes_capture_config(session, notes),
    }


def record_leave(*, session, user, now=None, ended=False):
    """Best-effort: a browser that crashes never gets here, which is why
    attendance is presented as arrival rather than as minutes attended.

    **`ended` is the whole of the difference between walking out and blinking.**
    A browser says "left" for several reasons that look identical from here —
    the red button, the classroom closing itself at the advertised end, a page
    reload, a navigation, and React's development double-mount, which mounts,
    joins, unmounts and leaves inside a single frame. Only the first two are
    the class being over, and only they set this flag.

    Getting that wrong is not a small thing, and it is worth saying why: when
    every leave ended the class's notes, a reload two seconds into a lesson
    finished the run before the teacher's browser had recorded a syllable,
    and the rejoin found a run already being written up — so the classroom
    sat on "writing up the notes" for the rest of the hour and the class got
    a failure saying no audio ever arrived. The same leave would have stopped
    a recording and started a second one beside it.

    So an ambiguous leave only **pauses** the notes, which a rejoin resumes
    (`start_notes`), and leaves a recording running. Nothing is lost either
    way: a teacher who really has gone is caught by each monitor's own
    deadline a few minutes past the end of the class
    (`RECORDING_STOP_MARGIN_MINUTES` / `NOTES_STOP_MARGIN_MINUTES`), and by
    Agora's own idle timer once the channel is empty.

    Every call is swallowed into a log line: leaving a class must always
    succeed.
    """
    now = now or timezone.now()

    if ended:
        maybe_stop_recording(session, user)
        maybe_stop_notes(session, user)
    else:
        maybe_pause_notes(session, user, reason="the host's browser disconnected")

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


# ---------------------------------------------------------------------------
# Recording
# ---------------------------------------------------------------------------
#
# Agora Cloud Recording sends a headless client into the class's channel, mixes
# everyone into one video and uploads it to a bucket we own. Three consequences
# shape everything below.
#
# **Nothing here can be allowed to break a class.** Recording is started from
# inside the host's join and stopped from inside their leave, so every call on
# those paths is wrapped: a recorder that cannot be acquired leaves a row
# marked FAILED and a teacher who never notices, which is the right trade
# against a classroom that refuses to open because a third party is down.
#
# **There is no scheduler in this codebase** (no Celery, no cron — the same
# constraint that makes `live_state` derive from the clock), so a recording
# cannot be ended by a job at a given time. It is ended by whichever of these
# comes first: the teacher pressing stop, the host leaving the room, the
# class's own end plus its grace passing, or — if this process died with a
# recording running — Agora's own idle timer, with `_adopt_orphaned_recordings`
# picking the row back up on the next request that asks about it.
#
# **A stopped recording is not a watchable one.** Agora reports the recorder as
# gone before the last bytes reach the bucket, so a recording only becomes
# AVAILABLE once `storage.object_exists` confirms the file is really there.
# Thirty students are told once, and only then.

# Agora puts bots of its own in a class's channel — the cloud recorder, and
# the transcription bot behind the meeting notes — and each needs a uid. They
# are drawn from a range no real user can reach, because ids here are
# `user.pk`, so a bot can never be mistaken for a student and both portals
# hide anything in this range rather than rendering an empty tile for a robot
# (frontend/src/components/features/classroom/classSessionUtils.js).
#
# The range is split in two so the two bots can never collide in one channel,
# while a single floor still answers the only question a browser ever asks:
# is this a person?
SERVICE_UID_MIN = 2_000_000_000
SERVICE_UID_MAX = 4_000_000_000

RECORDER_UID_MIN = SERVICE_UID_MIN
RECORDER_UID_MAX = 3_000_000_000

# How often the monitor thread asks Agora how a running recording is doing.
# Deliberately unhurried: a class runs for an hour and nobody is watching this
# number, so the poll exists to notice an ending, not to track progress.
RECORDING_POLL_SECONDS = 30

# How long after the class's advertised end (plus its usual overrun grace) we
# stop recording regardless of who is still in the room. Without it, a class
# whose last browser crashed would record an empty channel until Agora's idle
# timer noticed.
RECORDING_STOP_MARGIN_MINUTES = 5

# Agora's own backstop: it removes the recorder once the channel has been
# empty this long. Only ever reached if this process died mid-class, because
# the monitor above normally stops the recording first — so it is set short
# enough to bound the bill rather than long enough to survive a reconnection.
RECORDING_MAX_IDLE_SECONDS = 5 * 60

# How long we wait for the finished file to appear in the bucket, and how
# often we look. Generous: a long class takes real time to assemble, and the
# only cost of waiting is that the notification arrives later.
RECORDING_SETTLE_TIMEOUT_SECONDS = 20 * 60
RECORDING_SETTLE_POLL_SECONDS = 20

# A row this stale with no monitor behind it has been orphaned by a restart.
# Longer than a poll and a settle poll together, so a working monitor is never
# mistaken for a dead one.
RECORDING_ORPHAN_AFTER_SECONDS = 4 * 60

# The mixed layout Agora composites into. 720p15 is the honest ceiling for a
# class recording watched back in a browser tile: higher costs more to record
# and more to store for a picture nobody inspects frame by frame.
RECORDING_VIDEO = {"width": 1280, "height": 720, "fps": 15, "bitrate": 2000}

# Which recordings the catalog of a class considers watchable.
_AVAILABLE = ClassSessionRecording.RecordingStatus.AVAILABLE

# Recording ids this process is already monitoring. The DB constraint stops two
# recordings existing for one class; this stops two *threads* watching the same
# row after an orphan has been adopted.
_monitored_ids = set()
_monitored_lock = threading.Lock()


def _customer_key(*prefixes):
    """The Agora console's RESTful API key, from the first complete pair.

    There is **one RESTful key per Agora account**, not one per product: Cloud
    Recording and Real-Time Transcription authenticate with the same pair. So
    the ordinary case is `AGORA_CUSTOMER_ID` / `_SECRET` alone, and the
    product-specific names are only consulted first, in the order given, for a
    deployment that was issued a second key or wants to revoke one product's
    access without touching the other.

    A pair is only taken when **both** halves are set, so a half-filled
    override can never shadow a working account key with an unusable one —
    which would fail as "the service rejected these credentials" and send
    somebody looking at Agora rather than at their own .env.
    """
    for prefix in prefixes:
        customer_id = (getattr(settings, f"{prefix}_CUSTOMER_ID", "") or "").strip()
        customer_secret = (getattr(settings, f"{prefix}_CUSTOMER_SECRET", "") or "").strip()
        if customer_id and customer_secret:
            return customer_id, customer_secret
    return "", ""


def _recording_customer_key():
    return _customer_key("AGORA_RECORDING", "AGORA")


def is_recording_configured():
    """Whether this server can record a class at all.

    Asked once per row of every listing, so it stays a pure settings read and
    complains nowhere — the logging belongs on the request that was actually
    refused (`_recording_credentials`), exactly as `is_whiteboard_configured`
    is quiet and `_whiteboard_settings` is not.
    """
    if not getattr(settings, "AGORA_RECORDING_ENABLED", True):
        return False
    customer_id, customer_secret = _recording_customer_key()
    app_id = (getattr(settings, "AGORA_APP_ID", "") or "").strip()
    app_certificate = (getattr(settings, "AGORA_APP_CERTIFICATE", "") or "").strip()
    return bool(
        customer_id
        and customer_secret
        and app_id
        and app_certificate
        and storage.is_storage_configured()
    )


def _recording_credentials():
    """The three credential families a recording needs, checked together.

    Cloud Recording is the only feature in this app that needs all three at
    once: the RTC pair to sign the recorder's own join token, the RESTful
    Customer pair to command the service, and the bucket keys to hand Agora
    somewhere to upload. Missing any of them is a configuration fault, so it
    is logged here, in full, once per attempt.
    """
    if not getattr(settings, "AGORA_RECORDING_ENABLED", True):
        raise RecordingNotConfiguredError("Class recording is switched off on this server.")

    app_id, app_certificate = _agora_credentials()

    customer_id, customer_secret = _recording_customer_key()
    if not customer_id or not customer_secret:
        logger.error(
            "class_sessions: no Agora RESTful key is set (AGORA_CUSTOMER_ID / "
            "_CUSTOMER_SECRET, or the recording-only AGORA_RECORDING_CUSTOMER_ID / "
            "_SECRET) — classes will run normally but nothing can be recorded. This is "
            "the console's RESTful API key, not the RTC App Certificate."
        )
        raise RecordingNotConfiguredError("Class recording isn't set up on this server yet.")

    if not storage.is_storage_configured():
        logger.error(
            "class_sessions: no recording bucket is configured (AGORA_RECORDING_BUCKET / "
            "_ACCESS_KEY / _SECRET_KEY) — Agora uploads recordings to storage we own, so "
            "there is nowhere for a recording to go."
        )
        raise RecordingNotConfiguredError(
            "Class recording has no storage configured on this server yet."
        )

    return app_id, app_certificate, recording_api.basic_auth_header(customer_id, customer_secret)


def _storage_endpoint_host():
    """`AGORA_RECORDING_S3_ENDPOINT` as Agora wants it — a bare host.

    We store the endpoint as a URL because `storage.py` needs a scheme to
    sign against, while Agora's `extensionParams.endpoint` is documented as a
    *domain name*. Normalising here rather than asking an operator to set the
    same value twice in two spellings, which is the kind of duplication the
    two region settings already force and that nothing else should.
    """
    endpoint = (getattr(settings, "AGORA_RECORDING_S3_ENDPOINT", "") or "").strip()
    if not endpoint:
        return ""
    _, _, host = endpoint.partition("://")
    return (host or endpoint).strip("/")


def _storage_config(session):
    """Where Agora puts this class's files.

    The prefix is a path, one folder per class, so a bucket of a year's
    teaching is still navigable by hand and a lifecycle rule can be written
    against it. Agora returns each file's name already carrying this prefix,
    which is what `_pick_playable_file` stores as the object key.

    `extensionParams.endpoint` is what makes a store that merely speaks S3 —
    Cloudflare R2, MinIO, DigitalOcean Spaces, Wasabi — work at all: Agora
    documents those as `vendor` 11 rather than 1, and *requires* the domain
    name alongside. Sent whenever an endpoint is configured, so the operator
    sets `AGORA_RECORDING_VENDOR=11` and the endpoint and nothing else has to
    know which store it is.
    """
    config = {
        "vendor": int(getattr(settings, "AGORA_RECORDING_VENDOR", 1)),
        "region": int(getattr(settings, "AGORA_RECORDING_STORAGE_REGION", 0)),
        "bucket": (getattr(settings, "AGORA_RECORDING_BUCKET", "") or "").strip(),
        "accessKey": (getattr(settings, "AGORA_RECORDING_ACCESS_KEY", "") or "").strip(),
        "secretKey": (getattr(settings, "AGORA_RECORDING_SECRET_KEY", "") or "").strip(),
        "fileNamePrefix": ["class-recordings", str(session.pk)],
    }

    endpoint = _storage_endpoint_host()
    if endpoint:
        config["extensionParams"] = {"endpoint": endpoint}

    return config


def _transcoding_config():
    return {
        **RECORDING_VIDEO,
        # 1 = best fit: every participant gets an equal cell, which is the
        # right default for a class where the speaker changes constantly and
        # nobody has told the recorder who the teacher is.
        "mixedVideoLayout": 1,
        "backgroundColor": "#123524",
    }


def _new_recorder_uid():
    return secrets.SystemRandom().randint(RECORDER_UID_MIN, RECORDER_UID_MAX)


def is_recorder_uid(uid):
    """Whether a uid in a channel belongs to Agora's recorder rather than a person."""
    try:
        return RECORDER_UID_MIN <= int(uid) <= RECORDER_UID_MAX
    except (TypeError, ValueError):
        return False


def is_service_uid(uid):
    """Whether a uid in a channel belongs to any of Agora's bots.

    The question a browser actually asks before drawing a video tile, and the
    only one it needs: a nameless black square is just as wrong whether the
    robot behind it is recording the class or transcribing it.
    """
    try:
        return SERVICE_UID_MIN <= int(uid) <= SERVICE_UID_MAX
    except (TypeError, ValueError):
        return False


def active_recording(session):
    """The recording Agora is running for this class right now, if any."""
    return (
        session.recordings.filter(status__in=ClassSessionRecording.IN_FLIGHT_STATUSES)
        .order_by("-created_at")
        .first()
    )


def latest_available_recording(session):
    """The finished recording a student watches. The newest wins: a class that
    was recorded twice (stopped and restarted) shows the last complete take."""
    return (
        session.recordings.filter(status=_AVAILABLE)
        .exclude(storage_key="")
        .order_by("-created_at")
        .first()
    )


def _pick_playable_file(files):
    """The one object out of Agora's file list that a student is pointed at.

    MP4 first, because that is what a plain `<video>` element plays in every
    browser. The HLS playlist is the fallback and is only ever reached when a
    recording ended without us — Agora's idle timer removing the recorder
    after this process died — because the MP4 is the last thing it writes.
    """
    names = [str(entry.get("filename") or "").strip() for entry in files or []]
    names = [name for name in names if name]
    for suffix in (".mp4", ".m3u8"):
        matches = [name for name in names if name.lower().endswith(suffix)]
        if matches:
            return matches[-1]
    return names[0] if names else ""


# ---------------------------------------------------------------------------
# Starting and stopping
# ---------------------------------------------------------------------------


def _spawn(target, *args):
    """Starts a daemon thread, the way `ai_courses` and `brand_validator` do.

    Split out so tests can replace it: everything the threads do is otherwise
    reachable synchronously through the functions they call.
    """
    thread = threading.Thread(target=target, args=args, daemon=True)
    thread.start()
    return thread


def start_recording(*, session, user=None, now=None):
    """Begins recording this class, or returns the recording already running.

    The row is created up front and the work happens on a thread — the same
    shape as `ai_courses` and `brand_validator` — because acquiring a recorder
    is two round trips to Agora and this is called from inside a teacher's
    join, which must not wait for them.

    `session.is_recorded` is deliberately **not** checked. It says whether
    this class starts recording by itself when its teacher opens the room
    (`maybe_start_recording`), not whether recording is permitted at all — a
    teacher who left the box unticked when they scheduled the class must
    still be able to press the button during it, and one who decides halfway
    through that the rest is worth keeping must be able to say so.

    Idempotent by database constraint rather than by checking first: two
    co-instructors arriving in the same second would otherwise bill two
    recorders into one channel.
    """
    now = now or timezone.now()

    if session.status == ClassSession.SessionStatus.CANCELLED:
        raise RecordingNotConfiguredError("This class was cancelled.")

    # Checked before the row is written so a misconfigured server leaves no
    # FAILED rows behind on every join.
    _recording_credentials()

    existing = active_recording(session)
    if existing is not None:
        _ensure_monitored(existing)
        return existing

    try:
        with transaction.atomic():
            recording = ClassSessionRecording.objects.create(
                session=session,
                started_by=user if (user is not None and user.is_authenticated) else None,
                status=ClassSessionRecording.RecordingStatus.STARTING,
                recorder_uid=_new_recorder_uid(),
            )
    except IntegrityError:
        # Lost the race to the partial unique constraint — the other request's
        # recording is the one that counts.
        existing = active_recording(session)
        if existing is not None:
            return existing
        raise

    logger.info(
        "class_sessions: starting a recording of class %s (recording %s)", session.pk, recording.pk
    )
    _mark_monitored(recording.pk)
    _spawn(_run_recording_safe, recording.pk)
    return recording


def stop_recording(*, session, user=None, reason=""):
    """Asks the running recording to finish.

    Only ever *asks*: the monitor thread owns the call to Agora, so there is
    one path that stops a recording, reads its file list and notifies the
    class, rather than two that can disagree. The row flips to PROCESSING
    immediately, which is what both portals show while the file is assembled.
    """
    recording = active_recording(session)
    if recording is None:
        return None

    if recording.status == ClassSessionRecording.RecordingStatus.PROCESSING:
        _ensure_monitored(recording)
        return recording

    updated = ClassSessionRecording.objects.filter(
        pk=recording.pk,
        status__in=[
            ClassSessionRecording.RecordingStatus.STARTING,
            ClassSessionRecording.RecordingStatus.RECORDING,
        ],
    ).update(
        status=ClassSessionRecording.RecordingStatus.PROCESSING,
        stopped_at=timezone.now(),
        updated_at=timezone.now(),
    )
    if updated:
        logger.info(
            "class_sessions: stop requested for recording %s of class %s%s",
            recording.pk,
            session.pk,
            f" ({reason})" if reason else "",
        )

    recording.refresh_from_db()
    _ensure_monitored(recording)
    return recording


def maybe_start_recording(session, user, now=None):
    """Starts the tape when the teacher opens the room.

    Called from inside `issue_join_credentials`, which is why every failure is
    swallowed into a log line: a class must open even when the recording
    service is down, out of quota or misconfigured. Students joining never
    reach this — a class records because its teacher is in it.
    """
    if not is_host(user, session) or not session.is_recorded:
        return None
    if not is_recording_configured():
        return None

    try:
        return start_recording(session=session, user=user, now=now)
    except (RecordingNotConfiguredError, RecordingUnavailableError) as exc:
        logger.warning(
            "class_sessions: could not start recording class %s: %s", session.pk, exc
        )
    except Exception:  # noqa: BLE001 - a recording must never fail a class
        logger.exception("class_sessions: unexpected error starting recording of class %s", session.pk)
    return None


def maybe_stop_recording(session, user, reason="the host left"):
    """Ends the tape when the teacher leaves — the natural end of a class.

    A student leaving changes nothing: the class continues without them. If
    the teacher's browser never says goodbye, the monitor's own deadline
    (`RECORDING_STOP_MARGIN_MINUTES` past the end of the class) catches it.
    """
    if not is_host(user, session):
        return None
    try:
        return stop_recording(session=session, user=user, reason=reason)
    except Exception:  # noqa: BLE001 - leaving a class must always succeed
        logger.exception("class_sessions: unexpected error stopping recording of class %s", session.pk)
    return None


# ---------------------------------------------------------------------------
# The monitor thread
# ---------------------------------------------------------------------------


def _mark_monitored(recording_id):
    with _monitored_lock:
        if recording_id in _monitored_ids:
            return False
        _monitored_ids.add(recording_id)
        return True


def _release_monitored(recording_id):
    with _monitored_lock:
        _monitored_ids.discard(recording_id)


def _ensure_monitored(recording):
    """Puts a thread behind a recording that has lost the one it had.

    A deploy, a crash or a worker recycle during a class leaves a row running
    with nothing watching it. Rather than a scheduler this codebase does not
    have, the next request that asks about the class adopts it — the row
    carries Agora's two identifiers, so a fresh thread can pick up exactly
    where the dead one left off.
    """
    if not recording or not recording.is_in_flight:
        return False
    if not recording.resource_id:
        # Still being acquired by the thread that created it.
        return False
    age = (timezone.now() - recording.updated_at).total_seconds()
    if age < RECORDING_ORPHAN_AFTER_SECONDS:
        return False
    if not _mark_monitored(recording.pk):
        return False
    logger.info("class_sessions: adopting orphaned recording %s", recording.pk)
    _spawn(_monitor_recording_safe, recording.pk)
    return True


def _run_recording_safe(recording_id):
    """Thread entrypoint for a brand-new recording: acquire, start, then watch.

    Every exit path has to leave the row in a state somebody can act on — a
    recording stuck on STARTING would show a teacher a spinner for the rest of
    the class — so the bare `except` is deliberate and always writes FAILED.
    """
    close_old_connections()
    try:
        _begin_recording(recording_id)
        _monitor_recording(recording_id)
    except Exception as exc:  # noqa: BLE001 - see docstring
        logger.exception("class_sessions: recording %s crashed", recording_id)
        _fail_recording(recording_id, str(exc))
    finally:
        _release_monitored(recording_id)
        close_old_connections()


def _monitor_recording_safe(recording_id):
    """Thread entrypoint for a recording that is already running at Agora."""
    close_old_connections()
    try:
        _monitor_recording(recording_id)
    except Exception as exc:  # noqa: BLE001 - see `_run_recording_safe`
        logger.exception("class_sessions: monitor for recording %s crashed", recording_id)
        _fail_recording(recording_id, str(exc))
    finally:
        _release_monitored(recording_id)
        close_old_connections()


def _fail_recording(recording_id, message):
    ClassSessionRecording.objects.filter(pk=recording_id).exclude(status=_AVAILABLE).update(
        status=ClassSessionRecording.RecordingStatus.FAILED,
        error_message=str(message)[:500],
        updated_at=timezone.now(),
    )


def _begin_recording(recording_id):
    """Acquires a recorder and sends it into the channel.

    The `resourceId` is saved the moment Agora hands it over and before the
    recorder is started, because `resourceId` + `sid` are the only handle on a
    running recording: a process that died between the two calls would
    otherwise leave a recorder in a channel that nothing could ever stop.
    """
    recording = ClassSessionRecording.objects.select_related("session").get(pk=recording_id)
    session = recording.session
    app_id, app_certificate, auth_header = _recording_credentials()

    handle = recording_api.acquire(
        app_id=app_id,
        auth_header=auth_header,
        channel_name=session.channel_name,
        recorder_uid=recording.recorder_uid,
    )
    recording.resource_id = handle.resource_id
    recording.save(update_fields=["resource_id", "updated_at"])

    now = timezone.now()
    # The recorder's pass has to outlive the class it is recording, so it is
    # cut from the same cloth as a participant's — class, grace and buffer.
    token = build_rtc_token(
        app_id=app_id,
        app_certificate=app_certificate,
        channel_name=session.channel_name,
        uid=recording.recorder_uid,
        expire_seconds=_token_lifetime(session, now),
        # It only ever listens. A publisher token would work too; a subscriber
        # one is the honest description and is refused by Agora if the project
        # ever turns co-host authentication on.
        role=ROLE_SUBSCRIBER,
    )

    recording_api.start(
        app_id=app_id,
        auth_header=auth_header,
        recording=handle,
        channel_name=session.channel_name,
        recorder_uid=recording.recorder_uid,
        token=token,
        storage_config=_storage_config(session),
        max_idle_seconds=RECORDING_MAX_IDLE_SECONDS,
        transcoding_config=_transcoding_config(),
    )

    # Promoted conditionally, never written outright: a teacher who opened the
    # room and left again inside the second or two this takes will have flipped
    # the row to PROCESSING, and saving RECORDING over it would lose their stop
    # and leave a recorder in the channel until the class's deadline.
    now = timezone.now()
    promoted = ClassSessionRecording.objects.filter(
        pk=recording.pk, status=ClassSessionRecording.RecordingStatus.STARTING
    ).update(
        sid=handle.sid,
        status=ClassSessionRecording.RecordingStatus.RECORDING,
        started_at=now,
        updated_at=now,
    )
    if not promoted:
        # Somebody asked it to stop while it was starting. The sid still has
        # to be recorded — without it the recorder cannot be stopped at all.
        ClassSessionRecording.objects.filter(pk=recording.pk).update(
            sid=handle.sid, started_at=now, updated_at=now
        )
        logger.info(
            "class_sessions: recording %s was asked to stop while it was starting",
            recording.pk,
        )

    recording.refresh_from_db()
    logger.info(
        "class_sessions: recording %s is running (sid %s) for class %s",
        recording.pk,
        handle.sid,
        session.pk,
    )


def _monitor_recording(recording_id):
    """Watches one running recording until there is a file to hand out.

    Polls Agora, keeps the newest file list it is given, and stops the
    recording when the teacher asks, when the class's own deadline passes, or
    when Agora says the recorder has already gone. The last of those is the
    reason the file list is cached rather than read from the stop response: a
    404 carries no files, and a recording that ended without us is still a
    recording the students should get.
    """
    recording = ClassSessionRecording.objects.select_related("session").get(pk=recording_id)
    if not recording.is_in_flight:
        return

    session = recording.session
    app_id, _, auth_header = _recording_credentials()
    handle = recording_api.RecordingSession(recording.resource_id, recording.sid)

    _, _, ends_at = session_window(session)
    deadline = (
        ends_at
        + timedelta(minutes=LIVE_GRACE_MINUTES_AFTER)
        + timedelta(minutes=RECORDING_STOP_MARGIN_MINUTES)
    )

    known_files = list(recording.file_list or [])

    while True:
        time.sleep(RECORDING_POLL_SECONDS)

        recording.refresh_from_db()
        if not recording.is_in_flight:
            # Somebody else finished it — nothing left to watch.
            return

        stop_requested = recording.status == ClassSessionRecording.RecordingStatus.PROCESSING
        past_deadline = timezone.now() >= deadline

        if not stop_requested and not past_deadline:
            try:
                response = recording_api.query(
                    app_id=app_id, auth_header=auth_header, recording=handle
                )
            except RecordingGoneError:
                logger.info(
                    "class_sessions: recording %s ended at Agora without us (idle channel)",
                    recording.pk,
                )
                break
            except RecordingUnavailableError as exc:
                # A blip in somebody else's service is not a reason to abandon
                # a recording that is probably still running; the deadline
                # above is what eventually ends this loop either way.
                logger.warning("class_sessions: query for recording %s failed: %s", recording.pk, exc)
                continue

            # Agora names no files at all while a recorder is still
            # initialising, so an empty answer keeps the last real list
            # rather than erasing it.
            known_files = recording_api.file_list_from(response) or known_files
            _touch_recording(recording, known_files)
            continue

        if past_deadline and not stop_requested:
            logger.info(
                "class_sessions: recording %s reached the class's deadline — stopping",
                recording.pk,
            )
        break

    files = _stop_at_agora(
        recording=recording,
        handle=handle,
        app_id=app_id,
        auth_header=auth_header,
        fallback_files=known_files,
    )
    _settle_and_publish(recording.pk, files)


def _touch_recording(recording, files):
    """Refreshes the row's heartbeat so an orphan detector can tell a live
    monitor from a dead one, and keeps the newest file list on the row so a
    process that dies here still knows what was written."""
    recording.file_list = files
    recording.save(update_fields=["file_list", "updated_at"])


def _stop_at_agora(*, recording, handle, app_id, auth_header, fallback_files):
    """Ends the recording and returns the best file list available.

    Every failure falls back to the list the monitor already has: a recording
    whose stop call fails is still a recording sitting in the bucket, and
    throwing that away because the service answered badly would lose a class.
    """
    ClassSessionRecording.objects.filter(pk=recording.pk).exclude(status=_AVAILABLE).update(
        status=ClassSessionRecording.RecordingStatus.PROCESSING,
        stopped_at=recording.stopped_at or timezone.now(),
        updated_at=timezone.now(),
    )

    try:
        response = recording_api.stop(
            app_id=app_id,
            auth_header=auth_header,
            recording=handle,
            channel_name=recording.session.channel_name,
            recorder_uid=recording.recorder_uid,
        )
    except RecordingGoneError:
        return fallback_files
    except RecordingUnavailableError as exc:
        logger.warning("class_sessions: stop for recording %s failed: %s", recording.pk, exc)
        return fallback_files

    return recording_api.file_list_from(response) or fallback_files


def _settle_and_publish(recording_id, files):
    """Waits for the file to actually exist, then tells the class.

    Agora reports a recording as stopped a little before the last bytes land,
    so the bucket — not the API — is the authority on whether there is
    anything to watch. A recording that never appears is FAILED with a reason
    rather than a link to a 404.
    """
    key = _pick_playable_file(files)
    if not key:
        logger.error("class_sessions: recording %s produced no files", recording_id)
        _fail_recording(recording_id, "The recording service produced no file for this class.")
        return

    ClassSessionRecording.objects.filter(pk=recording_id).exclude(status=_AVAILABLE).update(
        file_list=files, storage_key=key, updated_at=timezone.now()
    )

    deadline = time.monotonic() + RECORDING_SETTLE_TIMEOUT_SECONDS
    while True:
        if storage.object_exists(key):
            break
        if time.monotonic() >= deadline:
            logger.error(
                "class_sessions: recording %s never appeared in the bucket as %s",
                recording_id,
                key,
            )
            _fail_recording(
                recording_id,
                "The recording didn't finish uploading. Check the recording bucket.",
            )
            return
        time.sleep(RECORDING_SETTLE_POLL_SECONDS)

    publish_recording(recording_id)


def publish_recording(recording_id):
    """Marks a recording watchable and notifies the class — exactly once.

    The guard is the row itself, locked: a recording reaches here from the
    teacher stopping it, the host leaving, the deadline passing and Agora's
    own idle timer, and two of those racing must not send a class two
    notifications. `notified_at` is written in the same transaction as the
    notifications, so a rollback takes both.
    """
    with transaction.atomic():
        recording = (
            ClassSessionRecording.objects.select_for_update()
            .select_related("session", "session__course")
            .filter(pk=recording_id)
            .first()
        )
        if recording is None or recording.notified_at is not None:
            return recording
        if not recording.storage_key:
            return recording

        session = recording.session
        now = timezone.now()
        if recording.started_at and not recording.stopped_at:
            recording.stopped_at = now
        if recording.started_at and recording.stopped_at:
            recording.duration_seconds = max(
                0, int((recording.stopped_at - recording.started_at).total_seconds())
            )

        recording.status = _AVAILABLE
        recording.error_message = ""
        recording.notified_at = now
        recording.save(
            update_fields=[
                "status",
                "stopped_at",
                "duration_seconds",
                "error_message",
                "notified_at",
                "updated_at",
            ]
        )

        # The students who were told to turn up are the students told it was
        # recorded — the same roster, resolved the same way. The notification
        # deliberately carries no URL: `related_object_type` points the portal
        # at the class, and the link itself is signed per viewer when they
        # click (`recording_playback_url`), so nothing forwardable is stored.
        _notify_students(
            session,
            verb="class_recording_ready",
            title=f"Recording ready: {session.title}",
            message=(
                f"{session.course.title} — the recording of this class is now in "
                "Live Classes under Past Classes."
            ),
        )
        # The host is told too, and is not on the student roster.
        if session.teacher_id:
            create_notifications_for_users(
                [session.teacher_id],
                verb="class_recording_ready",
                title=f"Recording ready: {session.title}",
                message=f"{session.course.title} — your class recording is ready to share.",
                related_object_type="class_session",
                related_object_id=session.pk,
            )

        # The email goes out only once the row is safely committed: a
        # rollback here would otherwise have told a class about a recording
        # this server then forgot, and an email is the one thing in this
        # function that cannot be taken back.
        transaction.on_commit(lambda: _email_recording_ready(session))

    logger.info(
        "class_sessions: recording %s of class %s is available (%s)",
        recording.pk,
        recording.session_id,
        recording.storage_key,
    )
    return recording


def _recording_email_recipients(session):
    """Everyone who gets an email, as (address, is_teacher) pairs.

    The same roster as the in-app notification — the course's ACTIVE
    enrolments plus the host — because a recording is only ever as widely
    shared as the class it is of.
    """
    students = list(
        Enrollment.objects.filter(
            course=session.course, status=Enrollment.EnrollmentStatus.ACTIVE
        )
        .exclude(student__email="")
        .values_list("student__email", "student__name", "student__username")
    )
    recipients = [
        (email, name or username, False) for email, name, username in students if email
    ]

    teacher = session.teacher
    if teacher is not None and teacher.email:
        recipients.append((teacher.email, teacher.name or teacher.username, True))

    # One address, one email — a student who also teaches the course should
    # not get two.
    seen = set()
    unique = []
    for email, name, is_teacher in recipients:
        key = email.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append((email, name, is_teacher))
    return unique


def _email_recording_ready(session):
    """Tells the class, by email, that the recording is up.

    The link is to the **portal**, never to the recording itself. A playback
    URL is signed for one viewer and expires in hours, while an email outlives
    it and is forwardable to anyone — so the email gets somebody to the screen
    where a fresh link is minted for them, which is the whole point of keeping
    the bucket private.

    Sent with `fail_silently=True` and one message per recipient, matching
    `users.services.send_password_reset_email` and
    `daily_drill.engagement.send_reengagement_email`: a broken SMTP
    configuration must not fail a recording that is sitting there perfectly
    fine, and nobody's address belongs in anybody else's To: header.
    """
    if not getattr(settings, "CLASS_RECORDING_EMAIL_ENABLED", True):
        return 0

    recipients = _recording_email_recipients(session)
    if not recipients:
        return 0

    base_url = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    student_link = f"{base_url}{getattr(settings, 'CLASS_RECORDING_PORTAL_PATH', '')}"
    teacher_link = f"{base_url}{getattr(settings, 'CLASS_RECORDING_TEACHER_PORTAL_PATH', '')}"
    subject = f"Recording ready: {session.title}"

    messages = []
    for email, name, is_teacher in recipients:
        link = teacher_link if is_teacher else student_link
        where = (
            "It's under Live Classes → Past Classes in your teacher portal."
            if is_teacher
            else "It's under Live Classes → Past Classes in your student portal."
        )
        body = (
            f"Hi {name},\n\n"
            f"The recording of \"{session.title}\" ({session.course.code} — "
            f"{session.course.title}) is ready to watch.\n\n"
            f"{where}\n{link}\n\n"
            "The recording is only available to people on this course, and the "
            "link you get there is tied to you and expires, so please don't "
            "share it on.\n\n"
            "The Cool Nerds Team"
        )
        messages.append((subject, body, settings.DEFAULT_FROM_EMAIL, [email]))

    # One connection, one message per address.
    send_mass_mail(tuple(messages), fail_silently=True)
    logger.info(
        "class_sessions: emailed %s people about the recording of class %s",
        len(messages),
        session.pk,
    )
    return len(messages)


# ---------------------------------------------------------------------------
# Playback
# ---------------------------------------------------------------------------


def recording_playback_url(recording):
    """A signed link to one recording, good for a few hours.

    Minted per viewer, per click, and never stored: the bucket is private, so
    this is the only way to the file, and a link that leaks expires on its own
    rather than outliving the course. Same rule as `live_sessions`' meeting
    url, for the same reason.
    """
    if not recording or not recording.is_available:
        return None, None
    try:
        url = storage.build_presigned_url(recording.storage_key)
    except storage.StorageNotConfiguredError:
        logger.error(
            "class_sessions: recording %s exists but no bucket is configured to serve it",
            recording.pk,
        )
        return None, None
    ttl = getattr(settings, "AGORA_RECORDING_URL_TTL_SECONDS", 6 * 60 * 60)
    return url, timezone.now() + timedelta(seconds=int(ttl))


def recording_state(*, session, user, include_url=True):
    """Everything a portal needs to know about this class's recording.

    One payload serves three surfaces — the REC indicator in the classroom,
    the teacher's record button and the student's "Watch recording" — so they
    cannot disagree about whether a class is being recorded. The url is only
    ever present for somebody who may attend the class, which is the same
    check the classroom door makes.
    """
    configured = is_recording_configured()
    running = active_recording(session)
    available = latest_available_recording(session)

    # A monitor that died with the process is picked back up by whoever asks
    # next — there is no scheduler here to do it on a timer.
    if running is not None:
        _ensure_monitored(running)

    state = {
        "configured": configured,
        "is_recorded": bool(session.is_recorded),
        "recorder_uid_min": RECORDER_UID_MIN,
        "status": (running or available).status if (running or available) else "NONE",
        "is_recording": bool(
            running
            and running.status
            in (
                ClassSessionRecording.RecordingStatus.STARTING,
                ClassSessionRecording.RecordingStatus.RECORDING,
            )
        ),
        "is_processing": bool(
            running and running.status == ClassSessionRecording.RecordingStatus.PROCESSING
        ),
        "available": bool(available),
        "recorded_at": available.started_at if available else None,
        "duration_seconds": available.duration_seconds if available else None,
        "url": None,
        "url_expires_at": None,
    }

    if available and include_url and can_attend(user, session):
        url, expires_at = recording_playback_url(available)
        state["url"] = url
        state["url_expires_at"] = expires_at
        if url is None:
            state["available"] = False

    return state


# ---------------------------------------------------------------------------
# Meeting notes
# ---------------------------------------------------------------------------
#
# Agora Real-Time Transcription sends a second headless client into the class's
# channel. Unlike the cloud recorder it keeps no media: it listens, and writes
# what it hears into the same bucket we own as a run of WebVTT caption slices.
# When the class ends those slices are stitched back into one transcript and an
# AI model writes it up as the notes a student reads, downloads and is emailed
# about. Four consequences shape everything below.
#
# **It is a separate feature from recording, not a by-product of one.** Two
# Agora products, two bills, two switches (`is_recorded`, `takes_notes`), two
# rows, two threads. A class can be written up without ever being filmed —
# which is the point: a seminar where students would not speak freely on camera
# is exactly the class that most wants notes and least wants a tape.
#
# **Nothing here can be allowed to break a class.** Transcription is started
# from inside the host's join and stopped from inside their leave, so every
# call on those paths is swallowed into a log line, exactly as recording's are.
#
# **Agora does not document what it names the files it writes.** It documents
# *where* — the `fileNamePrefix` we hand it — and the naming has already
# changed between API versions. So each run gets a folder of its own and the
# collector lists it (`storage.list_objects`) rather than guessing at a key.
#
# **There is no scheduler in this codebase.** Transcription ends on whichever
# comes first: the teacher's button, the host leaving, the class's own end plus
# grace plus `NOTES_STOP_MARGIN_MINUTES`, Agora's `maxIdleTime`, or the agent
# reporting itself STOPPED/FAILED. A row left behind by a restart is adopted by
# the next request that asks about it (`_ensure_notes_monitored`).

# The transcription bot joins the channel as a participant and so needs a uid
# of its own. Drawn from the upper half of the same no-person range the cloud
# recorder uses, so the two bots can never collide and one check in the browser
# hides both (`classSessionUtils.isServiceUid`).
NOTES_BOT_UID_MIN = RECORDER_UID_MAX + 1
NOTES_BOT_UID_MAX = SERVICE_UID_MAX

# How often the monitor thread asks Agora how a running transcription is doing.
# Unhurried for the same reason recording's poll is: it exists to notice an
# ending, not to track progress.
NOTES_POLL_SECONDS = 30

# How long after the class's advertised end (plus its usual overrun grace) the
# bot is pulled out regardless of who is still in the room.
NOTES_STOP_MARGIN_MINUTES = 5

# Agora's own backstop: it removes the bot once the channel has been empty this
# long. Only ever reached if this process died mid-class.
NOTES_MAX_IDLE_SECONDS = 5 * 60

# How often Agora flushes a caption slice into the bucket, in seconds. Agora
# allows [5, 28800] and defaults to 60. Kept at a minute: the slices are only
# ever read once, after the class, so cutting them finer buys nothing and
# multiplies the objects a collector has to list and fetch.
NOTES_SLICE_SECONDS = 60

# How long the collector waits for the last caption slice to appear after the
# bot has left, how often it looks, and how many unchanging looks it takes
# before it believes the folder is complete. A slice is flushed on a timer, so
# "no new file yet" and "no new file ever" are indistinguishable in one glance.
NOTES_SETTLE_TIMEOUT_SECONDS = 15 * 60
NOTES_SETTLE_POLL_SECONDS = 20
NOTES_SETTLE_STABLE_ROUNDS = 2

# A row this stale with no thread behind it has been orphaned by a restart.
# Longer than a poll and a settle poll together, so a working monitor is never
# mistaken for a dead one — but the model call is slower than either, so a row
# that is SUMMARIZING is given considerably longer before anyone adopts it.
NOTES_ORPHAN_AFTER_SECONDS = 4 * 60
NOTES_SUMMARIZING_ORPHAN_AFTER_SECONDS = 15 * 60

# What the model is given and how long it is given. A class is written up on a
# background thread nobody is watching, so this is the patient end of the scale
# — `advisor`'s fail-fast reasoning is for a human staring at a spinner.
NOTES_SUMMARY_TIMEOUT_SECONDS = 240
NOTES_MAX_TRANSPORT_ATTEMPTS = 3
NOTES_TRANSPORT_BACKOFF_SECONDS = (5, 15)

# How much transcript the model is shown. An hour of teaching is far inside
# this; the cap exists for the eight-hour class the scheduler permits. When it
# bites, the middle is dropped rather than the end — the last minutes of a
# class carry the recap and the homework, which is half of what the notes are
# for.
NOTES_MAX_TRANSCRIPT_CHARS = 200_000

_NOTES_AVAILABLE = ClassSessionNotes.NotesStatus.AVAILABLE

# Notes ids this process is already working on. The DB constraint stops two
# runs existing for one class; this stops two *threads* working the same row
# after an orphan has been adopted.
_notes_monitored_ids = set()
_notes_monitored_lock = threading.Lock()


def is_notes_bot_uid(uid):
    """Whether a uid in a channel belongs to the transcription bot."""
    try:
        return NOTES_BOT_UID_MIN <= int(uid) <= NOTES_BOT_UID_MAX
    except (TypeError, ValueError):
        return False


def _new_notes_bot_uid():
    return secrets.SystemRandom().randint(NOTES_BOT_UID_MIN, NOTES_BOT_UID_MAX)


def _new_agent_name(session, notes):
    """The unique name this run is submitted to Agora under.

    Agora refuses a `name` it has already seen, forever — so this cannot be
    derived from the class alone (a class transcribed twice needs two), and it
    cannot be derived from our primary keys alone either (a staging server and
    a production server pointed at one Agora project hand out the same ids).
    The random tail is what makes it safe in both directions. Alphanumeric and
    well inside Agora's 64-character limit.
    """
    return f"cls{session.pk}n{notes.pk}{secrets.token_hex(6)}"


def _notes_storage_prefix(session, notes):
    """The folder in the bucket this run's caption slices are written to.

    Returned as Agora's `fileNamePrefix` list and as the plain path the
    collector lists. The segments are **letters and digits only**: Agora's
    transcription API rejects a prefix segment containing anything else, which
    is a rule Cloud Recording does not share — `_storage_config` above happily
    uses "class-recordings", and copying that hyphen here is a 400 with
    nothing in it that says why.
    """
    parts = ["classnotes", str(session.pk), str(notes.pk)]
    return parts, "/".join(parts) + "/"


def _summariser_configured():
    """Whether there is an AI provider ready to write the notes up.

    Checked alongside the Agora credentials rather than at the end, because a
    class transcribed with nothing to summarise it is a bill for nothing: the
    teacher is better told before the class that notes are unavailable than
    after it that they failed.
    """
    if getattr(settings, "AI_PROVIDER", "") == "gemini":
        return bool((getattr(settings, "GEMINI_API_KEY", "") or "").strip())
    # Any other provider validates its own configuration when it is
    # constructed; `get_provider()` raises there rather than lying here.
    return True


def _stt_customer_key():
    """The console RESTful key the transcription API authenticates with.

    The same key Cloud Recording uses, because it is literally the same key —
    one RESTful credential per Agora account, used by every REST product on
    it, which is why the ordinary case is `AGORA_CUSTOMER_ID` / `_SECRET` and
    nothing else. `AGORA_STT_*` is consulted first and `AGORA_RECORDING_*`
    last, so a deployment with a transcription-only key, or an older one that
    only ever named the pair after recording, both work unchanged.
    """
    return _customer_key("AGORA_STT", "AGORA", "AGORA_RECORDING")


def notes_source():
    """Where a class's audio comes from — `"local"` or `"agora"`.

    `"local"` is the default and the one that needs nothing but an AI key: the
    teacher's browser records the room and posts the audio here (see "Notes
    from the classroom's own audio" below). `"agora"` is the transcription
    service writing captions into a bucket. Read through this function rather
    than from settings directly, so the spelling is normalised in one place.
    """
    return (getattr(settings, "CLASS_NOTES_SOURCE", "local") or "local").strip().lower()


def is_local_notes():
    """Whether this server writes classes up from their own audio.

    Anything other than an explicit `"agora"` is local, deliberately: a typo
    in the setting falls back to the path that works with no bucket, no
    transcription product and no second bill, rather than to the one that
    silently needs four more values filled in.
    """
    return notes_source() != "agora"


def is_notes_configured():
    """Whether this server can take notes on a class at all.

    Asked once per row of every listing, so it stays a pure settings read and
    complains nowhere — the logging belongs on the request that was actually
    refused (`_notes_credentials`), exactly as `is_recording_configured` is
    quiet and `_recording_credentials` is not.

    The local source needs **only an AI provider**: the audio is recorded by
    the teacher's own browser and stored on this server, so there is no
    transcription product to enable, no RESTful key to issue and no bucket to
    point at. That is the whole reason it exists.
    """
    if not getattr(settings, "CLASS_NOTES_ENABLED", True):
        return False
    if is_local_notes():
        return _summariser_configured()
    customer_id, customer_secret = _stt_customer_key()
    app_id = (getattr(settings, "AGORA_APP_ID", "") or "").strip()
    app_certificate = (getattr(settings, "AGORA_APP_CERTIFICATE", "") or "").strip()
    return bool(
        customer_id
        and customer_secret
        and app_id
        and app_certificate
        and storage.is_storage_configured()
        and _summariser_configured()
    )


def _notes_credentials():
    """The four things notes need, checked together and complained about once.

    Transcription needs more than any other feature here: the RTC pair to sign
    the bot's own join token, the RESTful Customer pair to command the
    service, the bucket keys to give it somewhere to write, and an AI provider
    to turn what it wrote into notes. Missing any of them is a configuration
    fault, so it is logged here, in full, once per attempt.
    """
    if not getattr(settings, "CLASS_NOTES_ENABLED", True):
        raise NotesNotConfiguredError("Class notes are switched off on this server.")

    if is_local_notes():
        # Nothing here is reachable in the local source — there is no service
        # to command and no bucket to write into — but the model that writes
        # the notes still has to exist, and a teacher is better told that
        # before the class than after it.
        if not _summariser_configured():
            logger.error(
                "class_sessions: no AI provider is configured (GEMINI_API_KEY) — a "
                "class could be recorded but nothing could transcribe it or write "
                "the notes up, so notes are refused before anybody is recorded."
            )
            raise NotesNotConfiguredError(
                "The AI that writes class notes isn't set up on this server yet."
            )
        return None, None, None

    app_id, app_certificate = _agora_credentials()

    customer_id, customer_secret = _stt_customer_key()
    if not customer_id or not customer_secret:
        logger.error(
            "class_sessions: no Agora RESTful key is set (AGORA_CUSTOMER_ID / "
            "_CUSTOMER_SECRET, or the transcription-only AGORA_STT_CUSTOMER_ID / "
            "_SECRET) — classes will run normally but none can be transcribed. This "
            "is the console's RESTful API key, not the RTC App Certificate."
        )
        raise NotesNotConfiguredError("Class notes aren't set up on this server yet.")

    if not storage.is_storage_configured():
        logger.error(
            "class_sessions: no bucket is configured (AGORA_RECORDING_BUCKET / "
            "_ACCESS_KEY / _SECRET_KEY) — Agora writes a class's captions into "
            "storage we own, so there is nowhere for a transcript to go."
        )
        raise NotesNotConfiguredError(
            "Class notes have no storage configured on this server yet."
        )

    if not _summariser_configured():
        logger.error(
            "class_sessions: no AI provider is configured (GEMINI_API_KEY) — a class "
            "could be transcribed but nothing could write the notes up, so notes are "
            "refused before the transcription is billed."
        )
        raise NotesNotConfiguredError(
            "The AI that writes class notes isn't set up on this server yet."
        )

    return (
        app_id,
        app_certificate,
        recording_api.basic_auth_header(customer_id, customer_secret),
    )


def notes_languages():
    """The languages Agora is asked to listen for.

    Agora accepts at most four and rejects the request outright if given more,
    so the setting is clamped rather than passed through. An empty or
    unparseable setting falls back to US English rather than to nothing — a
    transcription with no language is refused.
    """
    raw = getattr(settings, "CLASS_NOTES_LANGUAGES", "") or ""
    languages = [part.strip() for part in str(raw).split(",") if part.strip()]
    return (languages or ["en-US"])[:4]


def _caption_config(prefix_parts):
    """Where Agora writes this run's captions, and how often.

    Two details differ from `_storage_config` (Cloud Recording's equivalent)
    and both are easy to copy wrong:

    * `extensionParams` lives **inside** `captionConfig`, beside `storage`,
      rather than inside the storage object.
    * its `endpoint` is the **full URL** (`https://host:9000`), where cloud
      recording documents the same field as a bare domain. We keep the setting
      as a URL because `storage.py` needs a scheme to sign against, so this is
      the one place that passes it through unchanged.
    """
    config = {
        "sliceDuration": NOTES_SLICE_SECONDS,
        "storage": {
            # Agora's v7 field table spells these all-lowercase while every
            # example it publishes — and Cloud Recording's identical block —
            # uses camelCase. camelCase is what is sent; if a `join` ever
            # starts failing with a storage complaint, this is the line.
            "accessKey": (getattr(settings, "AGORA_RECORDING_ACCESS_KEY", "") or "").strip(),
            "secretKey": (getattr(settings, "AGORA_RECORDING_SECRET_KEY", "") or "").strip(),
            "bucket": (getattr(settings, "AGORA_RECORDING_BUCKET", "") or "").strip(),
            "vendor": int(getattr(settings, "AGORA_RECORDING_VENDOR", 1)),
            "region": int(getattr(settings, "AGORA_RECORDING_STORAGE_REGION", 0)),
            "fileNamePrefix": list(prefix_parts),
        },
    }

    endpoint = (getattr(settings, "AGORA_RECORDING_S3_ENDPOINT", "") or "").strip()
    if endpoint:
        config["extensionParams"] = {"endpoint": endpoint, "type": "s3"}

    return config


def active_notes(session):
    """The notes run Agora is working on for this class right now, if any."""
    return (
        session.notes_runs.filter(status__in=ClassSessionNotes.IN_FLIGHT_STATUSES)
        .order_by("-created_at")
        .first()
    )


def latest_available_notes(session):
    """The finished notes a student reads. The newest wins: a class
    transcribed twice shows the last complete write-up."""
    return (
        session.notes_runs.filter(status=_NOTES_AVAILABLE)
        .exclude(summary="")
        .order_by("-created_at")
        .first()
    )


def _speaker_map(session):
    """Channel uid → person, for labelling the transcript.

    WebVTT carries the speaker as `<v 4071>`, where the number is the uid the
    caption was heard from — which is `user.pk` for everyone in the room
    (`issue_join_credentials`). A uid with nobody behind it keeps its number
    rather than being invented around.
    """
    return {str(person["uid"]): person["name"] for person in get_roster(session)}


# ---------------------------------------------------------------------------
# Starting and stopping notes
# ---------------------------------------------------------------------------


def start_notes(*, session, user=None, now=None):
    """Begins transcribing this class, or returns the run already going.

    The row is created up front and the work happens on a thread — the same
    shape as recording, `ai_courses` and `brand_validator` — because sending a
    bot into a channel is a round trip to Agora and this is called from inside
    a teacher's join, which must not wait for it. The local source has no bot
    to send and so no thread to start here: the row *is* the instruction, and
    the teacher's browser acts on it the moment it sees it.

    `session.takes_notes` is deliberately **not** checked. It says whether
    this class starts taking notes by itself when its teacher opens the room
    (`maybe_start_notes`), not whether notes are permitted at all — a teacher
    who left the box unticked when they scheduled the class must still be able
    to press the button during it, and one who changes their mind halfway
    through a class must be able to start a write-up of the rest of it.

    Idempotent by database constraint rather than by checking first: two
    co-instructors arriving in the same second would otherwise put two bots in
    one channel and bill both.
    """
    now = now or timezone.now()

    if session.status == ClassSession.SessionStatus.CANCELLED:
        raise NotesNotConfiguredError("This class was cancelled.")

    # Checked before the row is written so a misconfigured server leaves no
    # FAILED rows behind on every join.
    _notes_credentials()

    existing = active_notes(session)
    if existing is not None:
        if existing.is_paused:
            # Resuming, not starting: everything recorded before the teacher
            # paused belongs to this run, and a class taken in two stretches
            # has to come out as one set of notes covering both. A second run
            # would write up the second half and replace the first half on
            # the card — see `ClassSessionNotes`'s docstring.
            ClassSessionNotes.objects.filter(
                pk=existing.pk, status=ClassSessionNotes.NotesStatus.PAUSED
            ).update(
                status=ClassSessionNotes.NotesStatus.TRANSCRIBING,
                stopped_at=None,
                updated_at=timezone.now(),
            )
            existing.refresh_from_db()
            logger.info(
                "class_sessions: resuming notes run %s on class %s",
                existing.pk,
                session.pk,
            )
            return existing
        _ensure_notes_monitored(existing)
        return existing

    local = is_local_notes()
    try:
        with transaction.atomic():
            notes = ClassSessionNotes.objects.create(
                session=session,
                started_by=user if (user is not None and user.is_authenticated) else None,
                # A local run is listening from the instant it exists: the row
                # is what tells the teacher's browser to start recording, so
                # there is no "being admitted by Agora" stage to sit in.
                status=(
                    ClassSessionNotes.NotesStatus.TRANSCRIBING
                    if local
                    else ClassSessionNotes.NotesStatus.STARTING
                ),
                started_at=now if local else None,
                bot_uid=None if local else _new_notes_bot_uid(),
            )
    except IntegrityError:
        # Lost the race to the partial unique constraint — the other request's
        # run is the one that counts.
        existing = active_notes(session)
        if existing is not None:
            return existing
        raise

    logger.info(
        "class_sessions: starting notes on class %s (notes run %s, source %s)",
        session.pk,
        notes.pk,
        notes_source(),
    )
    if local:
        # Nothing to spawn and nothing to call: the capturing browser polls
        # the notes endpoint, sees this row and starts recording.
        return notes

    _mark_notes_monitored(notes.pk)
    _spawn(_run_notes_safe, notes.pk)
    return notes


def stop_notes(*, session, user=None, reason=""):
    """The teacher's stop button — **pause**, on the source that can pause.

    The two sources genuinely differ here and the difference is the feature.
    On the **local** source the audio is ours and pausing costs nothing, so
    stopping mid-class is a bookmark: the run stays this class's run, what
    was recorded stays on it, and pressing the button again resumes the same
    row. A class taken in two stretches comes out as one set of notes
    covering both, which is what a teacher who stopped for an exercise
    expects — two runs would write up the second stretch and replace the
    first on the card.

    On the **Agora** source there is a bot in the channel being billed by the
    minute and writing captions into a folder belonging to this run. It
    cannot be parked, so stopping ends the run there, exactly as it always
    did.

    Either way the class itself is untouched, and nothing here waits: the
    work that follows belongs to a thread.
    """
    notes = active_notes(session)
    if notes is None:
        return None

    if is_local_notes():
        if not notes.is_listening:
            # Already paused, or already past the point a stop would change
            # anything.
            _ensure_notes_monitored(notes)
            return notes
        return _pause_local_notes(notes, reason=reason)

    return _end_agora_notes(notes, session=session, reason=reason)


def finish_notes(*, session, user=None, reason=""):
    """Ends this class's notes for good and starts the write-up.

    The counterpart to `stop_notes`: that is a teacher pausing inside a class
    that is still going, this is the class being over — the host leaving, the
    classroom closing itself at the advertised end, or the deadline catching a
    laptop that was simply shut. It is the only thing that turns a run into
    notes, which is why a paused run is finished by it as readily as a
    listening one: the twenty minutes already recorded are still a class.
    """
    notes = active_notes(session)
    if notes is None:
        return None

    if is_local_notes():
        return _finish_local_notes(notes, reason=reason)

    return _end_agora_notes(notes, session=session, reason=reason)


def _end_agora_notes(notes, *, session, reason=""):
    """Asks the transcription bot to leave and hands the rest to the monitor.

    Only ever *asks*: the monitor thread owns the call to Agora and everything
    after it, so there is one path that ends a transcription, collects its
    captions and writes the class up, rather than two that can disagree. The
    row flips to COLLECTING immediately, which is what both portals show while
    the notes are being put together.
    """
    if not notes.is_listening:
        # Already collecting or summarising — the thread is past the point a
        # stop would change anything.
        _ensure_notes_monitored(notes)
        return notes

    updated = ClassSessionNotes.objects.filter(
        pk=notes.pk, status__in=list(ClassSessionNotes.LISTENING_STATUSES)
    ).update(
        status=ClassSessionNotes.NotesStatus.COLLECTING,
        stopped_at=timezone.now(),
        updated_at=timezone.now(),
    )
    if updated:
        logger.info(
            "class_sessions: notes stop requested for run %s of class %s%s",
            notes.pk,
            session.pk,
            f" ({reason})" if reason else "",
        )

    notes.refresh_from_db()
    _ensure_notes_monitored(notes)
    return notes


def maybe_start_notes(session, user, now=None):
    """Starts transcribing when the teacher opens the room.

    Called from inside `issue_join_credentials`, which is why every failure is
    swallowed into a log line: a class must open even when the transcription
    service is down, out of quota or misconfigured. Students joining never
    reach this — a class is written up because its teacher is in it.
    """
    if not is_host(user, session) or not session.takes_notes:
        return None
    if not is_notes_configured():
        return None

    try:
        return start_notes(session=session, user=user, now=now)
    except (NotesNotConfiguredError, NotesUnavailableError) as exc:
        logger.warning("class_sessions: could not start notes on class %s: %s", session.pk, exc)
    except Exception:  # noqa: BLE001 - notes must never fail a class
        logger.exception("class_sessions: unexpected error starting notes on class %s", session.pk)
    return None


def maybe_pause_notes(session, user, reason="the host left"):
    """Parks the notes when the host's browser goes quiet without saying why.

    A reload, a navigation or a dropped connection all arrive here, and none
    of them is the class being over — so the run is parked rather than
    written up, and the rejoin that follows a moment later picks it straight
    back up with everything recorded so far still on it. A host who really
    has gone leaves it parked until the class's own deadline finishes it.

    Local source only: there is no way to park a transcription bot that Agora
    is billing by the minute, so on that source an ambiguous leave is left
    alone entirely and the deadline does the work.
    """
    if not is_host(user, session) or not is_local_notes():
        return None
    try:
        notes = active_notes(session)
        if notes is None or not notes.is_listening:
            return None
        return _pause_local_notes(notes, reason=reason)
    except Exception:  # noqa: BLE001 - leaving a class must always succeed
        logger.exception("class_sessions: unexpected error pausing notes on class %s", session.pk)
    return None


def maybe_stop_notes(session, user, reason="the host left"):
    """Ends the notes when the teacher leaves — the end of the class.

    `finish_notes`, never `stop_notes`: the host walking out is not a pause,
    and a run left parked would never become notes. A student leaving changes
    nothing. If the teacher's browser never says goodbye, the deadline in
    `_ensure_local_notes_progress` (or the Agora monitor's) catches it.
    """
    if not is_host(user, session):
        return None
    try:
        return finish_notes(session=session, user=user, reason=reason)
    except Exception:  # noqa: BLE001 - leaving a class must always succeed
        logger.exception("class_sessions: unexpected error stopping notes on class %s", session.pk)
    return None


def set_capture_preference(session, *, is_recorded=None, takes_notes=None):
    """Remembers that the teacher turned recording or notes on or off here.

    `is_recorded` and `takes_notes` are *this class's* switches, not
    permissions: they decide whether a class starts recording and writing
    itself up the moment its teacher opens the room. The teacher sets them
    when they schedule the class and can change their mind inside it, and
    pressing a button in the control bar is exactly that — changing their
    mind — so it is written down rather than treated as a one-off override.

    Writing it down is also what stops a stopped recording from coming back
    by itself. `maybe_start_recording` runs inside every host join, and a
    classroom re-joins on its own whenever Agora renews a token, so a switch
    left on would quietly restart the thing the teacher had just switched
    off, minutes after they switched it off.
    """
    changed = []
    if is_recorded is not None and session.is_recorded != bool(is_recorded):
        session.is_recorded = bool(is_recorded)
        changed.append("is_recorded")
    if takes_notes is not None and session.takes_notes != bool(takes_notes):
        session.takes_notes = bool(takes_notes)
        changed.append("takes_notes")

    if changed:
        session.save(update_fields=[*changed, "updated_at"])
    return session


# ---------------------------------------------------------------------------
# The notes threads
# ---------------------------------------------------------------------------


def _mark_notes_monitored(notes_id):
    with _notes_monitored_lock:
        if notes_id in _notes_monitored_ids:
            return False
        _notes_monitored_ids.add(notes_id)
        return True


def _release_notes_monitored(notes_id):
    with _notes_monitored_lock:
        _notes_monitored_ids.discard(notes_id)


def _ensure_notes_monitored(notes):
    """Puts a thread behind a run that has lost the one it had.

    A deploy, a crash or a worker recycle leaves a row in flight with nothing
    working it. Rather than a scheduler this codebase does not have, the next
    request that asks about the class adopts it — and picks up at the right
    stage, because the row says which one it reached: a run still listening is
    monitored, one past that is collected and summarised, and the transcript
    already on the row means the model is not paid for twice.
    """
    if not notes or not notes.is_in_flight:
        return False

    if is_local_notes():
        return _ensure_local_notes_progress(notes)

    status = notes.status
    if notes.is_listening and not notes.agent_id:
        # Still being admitted by the thread that created it.
        return False

    stale_after = (
        NOTES_SUMMARIZING_ORPHAN_AFTER_SECONDS
        if status == ClassSessionNotes.NotesStatus.SUMMARIZING
        else NOTES_ORPHAN_AFTER_SECONDS
    )
    if (timezone.now() - notes.updated_at).total_seconds() < stale_after:
        return False

    if not _mark_notes_monitored(notes.pk):
        return False

    logger.info("class_sessions: adopting orphaned notes run %s (%s)", notes.pk, status)
    if notes.is_listening:
        _spawn(_monitor_notes_safe, notes.pk)
    else:
        _spawn(_collect_notes_safe, notes.pk)
    return True


def _run_notes_safe(notes_id):
    """Thread entrypoint for a brand-new run: start the bot, watch it, write up.

    Every exit path has to leave the row in a state somebody can act on — a
    run stuck on STARTING would show a teacher a spinner for the rest of the
    class — so the bare `except` is deliberate and always writes FAILED.
    """
    close_old_connections()
    try:
        _begin_notes(notes_id)
        _monitor_notes(notes_id)
    except Exception as exc:  # noqa: BLE001 - see docstring
        logger.exception("class_sessions: notes run %s crashed", notes_id)
        _fail_notes(notes_id, str(exc))
    finally:
        _release_notes_monitored(notes_id)
        close_old_connections()


def _monitor_notes_safe(notes_id):
    """Thread entrypoint for a run whose bot is already in the channel."""
    close_old_connections()
    try:
        _monitor_notes(notes_id)
    except Exception as exc:  # noqa: BLE001 - see `_run_notes_safe`
        logger.exception("class_sessions: notes monitor for run %s crashed", notes_id)
        _fail_notes(notes_id, str(exc))
    finally:
        _release_notes_monitored(notes_id)
        close_old_connections()


def _collect_notes_safe(notes_id):
    """Thread entrypoint for a run whose bot has already left."""
    close_old_connections()
    try:
        _collect_and_summarize(notes_id)
    except Exception as exc:  # noqa: BLE001 - see `_run_notes_safe`
        logger.exception("class_sessions: notes collector for run %s crashed", notes_id)
        _fail_notes(notes_id, str(exc))
    finally:
        _release_notes_monitored(notes_id)
        close_old_connections()


def _fail_notes(notes_id, message):
    """Gives up on a run, with a reason, and tells the teacher — once.

    The notification matters more than it looks. A failed run is neither
    running nor available, so it leaves no trace anywhere a teacher looks: no
    card button, no reader, nothing on the class at all. Somebody who took
    notes on an hour's lesson and got silence has no way to find out whether
    the notes are still coming, and the first thing they do is take notes on
    another class the same way.

    Only the teacher. The reason names providers, quotas and files, and
    thirty students pulled to a page that says a write-up failed is noise
    they can do nothing with.
    """
    updated = ClassSessionNotes.objects.filter(pk=notes_id).exclude(
        status__in=[_NOTES_AVAILABLE, ClassSessionNotes.NotesStatus.FAILED]
    ).update(
        status=ClassSessionNotes.NotesStatus.FAILED,
        error_message=str(message)[:500],
        updated_at=timezone.now(),
    )
    # Not the first failure of this run: the reason already on the row is the
    # specific one, and this is the generic unwinding behind it.
    if not updated:
        return

    notes = (
        ClassSessionNotes.objects.select_related("session", "session__course")
        .filter(pk=notes_id)
        .first()
    )
    if notes is None or notes.session.teacher_id is None:
        return

    session = notes.session
    try:
        create_notifications_for_users(
            [session.teacher_id],
            verb="class_notes_failed",
            title=f"Class notes couldn't be written: {session.title}",
            message=(
                f"{session.course.title} — {str(message)[:200]} Your students "
                "haven't been told."
            ),
            related_object_type="class_session",
            related_object_id=session.pk,
        )
    except Exception:  # noqa: BLE001 - a failed run must not fail twice
        logger.exception(
            "class_sessions: could not tell the teacher that notes run %s failed",
            notes_id,
        )


def _touch_notes(notes):
    """Refreshes the row's heartbeat so the orphan detector can tell a live
    thread from a dead one."""
    notes.save(update_fields=["updated_at"])


def _begin_notes(notes_id):
    """Sends the transcription bot into the channel.

    The agent's name and storage prefix are written **before** the call, and
    the agent id the instant it comes back: `agent_id` is Agora's only handle
    on a running transcription, and a process that died between the two would
    otherwise leave a bot in a channel that nothing could ever stop.
    """
    notes = ClassSessionNotes.objects.select_related("session").get(pk=notes_id)
    session = notes.session
    app_id, app_certificate, auth_header = _notes_credentials()

    prefix_parts, prefix = _notes_storage_prefix(session, notes)
    notes.agent_name = _new_agent_name(session, notes)
    notes.storage_prefix = prefix
    notes.save(update_fields=["agent_name", "storage_prefix", "updated_at"])

    now = timezone.now()
    # The bot's pass has to outlive the class it is listening to, so it is cut
    # from the same cloth as a participant's — class, grace and buffer. It
    # publishes (the live captions go out over the channel's data stream), so
    # unlike the recorder it is not a subscriber-only guest.
    token = build_rtc_token(
        app_id=app_id,
        app_certificate=app_certificate,
        channel_name=session.channel_name,
        uid=notes.bot_uid,
        expire_seconds=_token_lifetime(session, now),
        role=ROLE_PUBLISHER,
    )

    agent = transcription_api.join(
        app_id=app_id,
        auth_header=auth_header,
        name=notes.agent_name,
        channel_name=session.channel_name,
        bot_uid=notes.bot_uid,
        bot_token=token,
        languages=notes_languages(),
        caption_config=_caption_config(prefix_parts),
        max_idle_seconds=NOTES_MAX_IDLE_SECONDS,
    )

    # Promoted conditionally, never written outright: a teacher who opened the
    # room and left again inside the second or two this takes will have
    # flipped the row to COLLECTING, and saving TRANSCRIBING over it would
    # lose their stop and leave a bot in the channel until the deadline.
    now = timezone.now()
    promoted = ClassSessionNotes.objects.filter(
        pk=notes.pk, status=ClassSessionNotes.NotesStatus.STARTING
    ).update(
        agent_id=agent.agent_id,
        status=ClassSessionNotes.NotesStatus.TRANSCRIBING,
        started_at=now,
        updated_at=now,
    )
    if not promoted:
        # Somebody asked it to stop while it was starting. The agent id still
        # has to be recorded — without it the bot cannot be stopped at all.
        ClassSessionNotes.objects.filter(pk=notes.pk).update(
            agent_id=agent.agent_id, started_at=now, updated_at=now
        )
        logger.info(
            "class_sessions: notes run %s was asked to stop while it was starting",
            notes.pk,
        )

    logger.info(
        "class_sessions: notes run %s is transcribing (agent %s) for class %s",
        notes.pk,
        agent.agent_id,
        session.pk,
    )


def _monitor_notes(notes_id):
    """Watches one running transcription until the bot is out of the channel.

    Polls Agora and ends the transcription when the teacher asks, when the
    class's own deadline passes, when Agora says the bot has gone, or when the
    agent reports itself finished. The last of those matters as much as the
    404: a bot can stop itself for reasons we never hear about, and a monitor
    watching only for 404s would poll a dead agent until the deadline while
    the class waited for notes that were already finished being written.
    """
    notes = ClassSessionNotes.objects.select_related("session").get(pk=notes_id)
    if not notes.is_in_flight:
        return

    session = notes.session
    app_id, _, auth_header = _notes_credentials()
    agent = transcription_api.TranscriptionAgent(notes.agent_id, name=notes.agent_name)

    if not notes.is_listening:
        # Nothing left to watch — a stop landed while the bot was still being
        # admitted, or this run was adopted past the bot's lifetime. It still
        # goes through the leave: the bot may have been let into the channel a
        # fraction of a second after somebody pressed stop, and skipping
        # straight to the transcript would leave it listening until Agora's
        # idle timer noticed, billing the whole time.
        _leave_at_agora(notes=notes, agent=agent, app_id=app_id, auth_header=auth_header)
        _collect_and_summarize(notes_id)
        return

    _, _, ends_at = session_window(session)
    deadline = (
        ends_at
        + timedelta(minutes=LIVE_GRACE_MINUTES_AFTER)
        + timedelta(minutes=NOTES_STOP_MARGIN_MINUTES)
    )

    while True:
        time.sleep(NOTES_POLL_SECONDS)

        notes.refresh_from_db()
        if not notes.is_in_flight:
            # Somebody else finished it — nothing left to watch.
            return
        if not notes.is_listening:
            # A stop landed, or another process has already taken this run
            # past the bot's lifetime. Either way the bot has to come out,
            # which is what the break leads to.
            break

        stop_requested = notes.status == ClassSessionNotes.NotesStatus.COLLECTING
        past_deadline = timezone.now() >= deadline

        if not stop_requested and not past_deadline:
            try:
                response = transcription_api.query(
                    app_id=app_id, auth_header=auth_header, agent=agent
                )
            except NotesGoneError:
                logger.info(
                    "class_sessions: notes run %s ended at Agora without us (idle channel)",
                    notes.pk,
                )
                break
            except NotesUnavailableError as exc:
                # A blip in somebody else's service is not a reason to abandon
                # a transcription that is probably still running; the deadline
                # above is what eventually ends this loop either way.
                logger.warning(
                    "class_sessions: query for notes run %s failed: %s", notes.pk, exc
                )
                continue

            if transcription_api.has_finished(response):
                logger.info(
                    "class_sessions: notes run %s reported %s at Agora",
                    notes.pk,
                    transcription_api.status_of(response),
                )
                break

            _touch_notes(notes)
            continue

        if past_deadline and not stop_requested:
            logger.info(
                "class_sessions: notes run %s reached the class's deadline — stopping",
                notes.pk,
            )
        break

    _leave_at_agora(notes=notes, agent=agent, app_id=app_id, auth_header=auth_header)
    _collect_and_summarize(notes.pk)


def _leave_at_agora(*, notes, agent, app_id, auth_header):
    """Pulls the bot out of the channel and moves the row on to collecting.

    Every failure is a log line and nothing more: the captions written so far
    are sitting in the bucket either way, and throwing a class's transcript
    away because a stop call answered badly would be the worse mistake. If the
    bot really is still in the channel, Agora's own idle timer removes it.
    """
    ClassSessionNotes.objects.filter(pk=notes.pk).exclude(status=_NOTES_AVAILABLE).update(
        status=ClassSessionNotes.NotesStatus.COLLECTING,
        stopped_at=notes.stopped_at or timezone.now(),
        updated_at=timezone.now(),
    )

    if not agent.agent_id:
        return

    try:
        transcription_api.leave(app_id=app_id, auth_header=auth_header, agent=agent)
    except NotesGoneError:
        pass
    except NotesUnavailableError as exc:
        logger.warning("class_sessions: leave for notes run %s failed: %s", notes.pk, exc)


# ---------------------------------------------------------------------------
# Notes from the classroom's own audio
# ---------------------------------------------------------------------------
#
# The default source, and the one that needs nothing but an AI key. Instead of
# sending a transcription bot into the channel and reading what it wrote into
# a bucket, the **teacher's own browser** mixes everybody who is speaking into
# one track, records it in segments and posts them here, where they are kept
# as ordinary Django files under `MEDIA_ROOT/class-audio/`. The model
# transcribes each segment, the transcript is stitched together, and from
# there everything is identical to the Agora path: same prompt, same schema,
# same repair, same document, same notifications, same emails.
#
# Four consequences shape what follows.
#
# **There is no third party in the loop, so there is nothing to poll.** No
# agent to admit, no agent to pull out, no folder to list until it stops
# growing. The row *is* the instruction — a run in TRANSCRIBING means "record
# this class" and the capturing browser acts on it — which is why
# `start_notes` spawns no thread here and `stop_notes` makes no call.
#
# **The browser is the only thing that can end a run cleanly**, by posting its
# last segment. Everything else is a backstop: `_ensure_local_notes_progress`
# is what finishes a class whose teacher closed their laptop, and it is
# reached from the same request that adopts an orphaned Agora run, for the
# same reason — there is no scheduler in this codebase.
#
# **Exactly one browser captures a class.** The run's `started_by` is the
# nominated capturer and `notes_capture_config` says so to every client, so a
# co-instructor opening the same classroom listens rather than recording a
# second, overlapping copy of the hour.
#
# **A write-up that dies halfway must not pay twice.** Each segment keeps its
# own transcript, so an adopted run resumes at the first segment nobody has
# read yet rather than re-reading the whole class — the same reasoning that
# keeps `ClassSessionNotes.transcript` on the row in the Agora path.

# How long after a run stops listening the server waits for the last segment
# to arrive before giving up on it. Generous, because the segment being
# uploaded is the one the teacher just finished talking over and a classroom
# uplink is the slowest link in this chain — and because the cost of waiting
# is a progress badge, while the cost of not waiting is the end of the class
# missing from its notes.
LOCAL_NOTES_UPLOAD_GRACE_SECONDS = 3 * 60

# How long one segment's transcription may take. Longer than the write-up's
# own call: a model reading ten minutes of audio is doing more work than one
# reading the text it produced, and nobody is watching either.
LOCAL_NOTES_TRANSCRIBE_TIMEOUT_SECONDS = 10 * 60

# How long a local write-up may be quiet before another request decides it has
# been orphaned by a restart and adopts it.
#
# **Derived, not chosen.** A local run makes one model call per segment and
# only refreshes its heartbeat between them, so the quietest a *healthy* run
# can be is one segment stalling for its full timeout and every retry. The
# Agora path's 15 minutes is far under that — a 60-minute class is fifteen
# segments, and fifteen chances for one of them to sit on a slow response for
# half an hour — and a window shorter than the work it is watching does not
# recover an orphan, it starts a second thread transcribing the same class
# beside the first and bills the model twice for it.
LOCAL_NOTES_ORPHAN_AFTER_SECONDS = (
    LOCAL_NOTES_TRANSCRIBE_TIMEOUT_SECONDS * NOTES_MAX_TRANSPORT_ATTEMPTS
    + sum(NOTES_TRANSPORT_BACKOFF_SECONDS)
    # Enough slack that a run which really is dead is still picked up before
    # anybody goes looking for notes that never arrived.
    + 10 * 60
)

# How much of the previous segment the model is shown as context for the next
# one. A class is cut on a timer, so a sentence really does straddle two
# recordings; this is enough to hear where the thread was, and far too little
# to be worth repeating.
LOCAL_NOTES_TAIL_CHARS = 600


def notes_capture_config(session, running):
    """What a client needs in order to record this class.

    Carried on `notes_state` rather than hard-coded in the browser so the
    recording settings live beside the server that has to accept the result —
    a bitrate the server would refuse as too large is not a decision to make
    in two places. `capturer_id` is the whole of the "only one browser
    records" rule: every client is told which one of them it is.

    Keyed on *listening*, not on the run existing: a run the teacher paused
    nominates nobody and carries no id, which is what makes the capturing
    browser stop recording — and start again, into the same run, the moment
    the teacher presses the button and `capturer_id` comes back.

    `running` is passed in rather than looked up, because the one caller has
    already asked and a listing renders a lot of these.
    """
    if not is_local_notes():
        return {"mode": "agora"}

    listening = bool(running and running.is_listening)
    return {
        "mode": "local",
        "run_id": running.pk if listening else None,
        # The user whose browser should be recording. `None` while nothing is
        # running, and never a student: a run is only ever started by a host.
        "capturer_id": running.started_by_id if listening else None,
        "segment_seconds": max(
            30, int(getattr(settings, "CLASS_NOTES_AUDIO_SEGMENT_SECONDS", 600))
        ),
        "audio_bitrate": max(
            8000, int(getattr(settings, "CLASS_NOTES_AUDIO_BITRATE", 16000))
        ),
        "max_bytes": _local_audio_max_bytes(),
        "mime_types": list(notes_audio.PREFERRED_RECORDING_TYPES),
    }


def _local_audio_max_bytes():
    return max(1, int(getattr(settings, "CLASS_NOTES_AUDIO_MAX_MB", 40))) * 1024 * 1024


# How many speaker samples one segment may carry. The browser samples a few
# times a second and only writes a line when the speaker changes, so a busy
# four-minute segment is a few dozen — this is a ceiling on what one request
# can put in a JSON column, not a budget anybody should be near.
MAX_SPEAKER_SAMPLES = 2000


def _clean_speaker_timeline(raw):
    """The browser's "who was speaking when", trusted no further than it needs
    to be.

    Shape only: a list of `{at: seconds, uid: user id}`. Whether the uid
    belongs to somebody who was actually in the class is settled later, when
    it is resolved against the roster (`_speaker_names`) — a uid nobody
    recognises simply never becomes a name.
    """
    if not isinstance(raw, list):
        return []
    cleaned = []
    for entry in raw[:MAX_SPEAKER_SAMPLES]:
        if not isinstance(entry, dict):
            continue
        try:
            at = float(entry.get("at"))
            uid = int(entry.get("uid"))
        except (TypeError, ValueError):
            continue
        if at < 0:
            continue
        cleaned.append({"at": round(at, 2), "uid": uid})
    cleaned.sort(key=lambda item: item["at"])
    return cleaned


def store_notes_audio(
    *,
    session,
    user,
    upload,
    client_key="",
    duration_seconds=None,
    end=False,
    speakers=None,
):
    """Takes one segment of a class's audio from the browser recording it.

    Everything that could let two recordings of one hour end up in one
    transcript is closed here rather than trusted to the client. The segment's
    **index is assigned by this server in arrival order**, never taken from
    the request: a capturer that crashed and came back would restart its own
    numbering and silently overwrite the first half of the class. `client_key`
    makes the upload idempotent, so a segment that timed out on its way up but
    landed anyway is recognised rather than stored twice. And only the run's
    nominated capturer is accepted, so a co-instructor's classroom cannot post
    a second, overlapping copy of the same hour.

    `end` is the browser saying "the class is over" — the classroom closing,
    the teacher leaving — and is what actually starts the write-up. It is
    **not** set when the teacher merely presses stop: that is a pause, the
    class is still going, and the segment being uploaded is simply the last
    of that stretch. The audio already here waits on the run for the next one.
    """
    if not is_local_notes():
        raise NotesNotConfiguredError(
            "This server writes classes up from Agora's transcription service, "
            "not from the classroom's own audio."
        )
    if not is_host(user, session):
        raise SessionAccessDeniedError(
            "Only this class's teacher can send the audio its notes are written from."
        )

    notes = active_notes(session)
    if notes is None or notes.status not in (
        ClassSessionNotes.NotesStatus.STARTING,
        ClassSessionNotes.NotesStatus.TRANSCRIBING,
        # PAUSED and COLLECTING are both accepted because the segment in
        # flight when the teacher pressed stop — or when the class closed —
        # is the end of what they were just saying. Refusing it would lose
        # precisely the minutes nobody wants to lose.
        ClassSessionNotes.NotesStatus.PAUSED,
        ClassSessionNotes.NotesStatus.COLLECTING,
    ):
        raise NotesUnavailableError("This class isn't taking notes right now.")

    if notes.started_by_id and notes.started_by_id != user.pk:
        raise NotesUnavailableError(
            "Another device is already recording this class for its notes."
        )

    if upload is None:
        raise NotesUnavailableError("No audio was attached to that upload.")

    # Refused at the door rather than stored and found unreadable when the
    # class is over and the teacher has gone home.
    media_type, extension = notes_audio.resolve(
        getattr(upload, "content_type", "") or ""
    )

    size = int(getattr(upload, "size", 0) or 0)
    max_bytes = _local_audio_max_bytes()
    if size > max_bytes:
        raise NotesUnavailableError(
            "That piece of the class is too large to accept "
            f"({size // (1024 * 1024)} MB; the limit is {max_bytes // (1024 * 1024)} MB)."
        )
    if size < notes_audio.MIN_SEGMENT_BYTES:
        # An empty container and nothing else — a recorder stopped in the same
        # second it started. Not an error, and not something to keep, but a
        # closing one still has to end the run.
        logger.info(
            "class_sessions: ignoring an empty audio segment for notes run %s", notes.pk
        )
        return _finish_local_notes(notes, reason="the classroom closed") if end else notes

    key = (str(client_key).strip() or secrets.token_hex(8))[:64]

    with transaction.atomic():
        # Locking the run, not the segment table: this is what serialises
        # index assignment between two uploads arriving together.
        locked = ClassSessionNotes.objects.select_for_update().filter(pk=notes.pk).first()
        if locked is None:
            raise NotesUnavailableError("This class isn't taking notes right now.")

        existing = ClassSessionNotesAudio.objects.filter(
            notes=locked, client_key=key
        ).first()
        if existing is None:
            highest = ClassSessionNotesAudio.objects.filter(notes=locked).aggregate(
                top=Max("index")
            )["top"]
            segment = ClassSessionNotesAudio(
                notes=locked,
                index=0 if highest is None else highest + 1,
                client_key=key,
                content_type=notes_audio.base_type(upload.content_type),
                size_bytes=size,
                duration_seconds=duration_seconds,
                speakers=_clean_speaker_timeline(speakers),
            )
            filename = (
                f"class-{session.pk}-notes-{locked.pk}-"
                f"{segment.index:03d}-{secrets.token_hex(6)}.{extension}"
            )
            segment.file.save(filename, upload, save=False)
            segment.save()
            logger.info(
                "class_sessions: notes run %s took segment %s (%s bytes, %s)",
                locked.pk,
                segment.index,
                size,
                media_type,
            )
        else:
            logger.info(
                "class_sessions: notes run %s already had segment %s — upload ignored",
                locked.pk,
                existing.index,
            )

    notes.refresh_from_db()
    if end:
        return _finish_local_notes(notes, reason="the classroom closed")

    # A heartbeat as well as a save: `_ensure_local_notes_progress` tells a
    # browser that is still recording from one that stopped answering by how
    # long it has been since the run last moved.
    _touch_notes(notes)
    return notes


def _pause_local_notes(notes, *, reason=""):
    """Parks a run between stretches of one class.

    Nothing is written up and nothing is thrown away: the segments already
    uploaded stay on the row, the run stays this class's run (PAUSED is in
    `IN_FLIGHT_STATUSES`, so the constraint still allows only one), and
    `start_notes` picks it straight back up. `stopped_at` is deliberately
    left alone — the run has not stopped, and a duration measured from a
    pause would be wrong for the class that followed it.
    """
    ClassSessionNotes.objects.filter(
        pk=notes.pk, status__in=list(ClassSessionNotes.LISTENING_STATUSES)
    ).update(
        status=ClassSessionNotes.NotesStatus.PAUSED, updated_at=timezone.now()
    )
    notes.refresh_from_db()
    logger.info(
        "class_sessions: notes run %s on class %s paused%s",
        notes.pk,
        notes.session_id,
        f" ({reason})" if reason else "",
    )
    return notes


def _finish_local_notes(notes, *, reason=""):
    """Ends a run for good and, if there is anything to read, writes it up.

    Reached from every way a class can be over — the host leaving, the
    classroom closing itself at the advertised end, the closing upload, and
    the deadline that catches a laptop that was simply shut — so it has to be
    safe to call twice and safe to call on a run in any state. A run already
    past COLLECTING is left to the thread that owns it.

    A run with no audio at all is not failed here: the segment that was in
    flight when the class closed is still on its way, and
    `_ensure_local_notes_progress` gives it `LOCAL_NOTES_UPLOAD_GRACE_SECONDS`
    before deciding it never arrives.
    """
    statuses = ClassSessionNotes.NotesStatus
    if notes.status in (statuses.AVAILABLE, statuses.FAILED, statuses.SUMMARIZING):
        return notes

    if notes.status != statuses.COLLECTING:
        ClassSessionNotes.objects.filter(
            pk=notes.pk,
            status__in=[*ClassSessionNotes.LISTENING_STATUSES, statuses.PAUSED],
        ).update(
            status=statuses.COLLECTING,
            stopped_at=timezone.now(),
            updated_at=timezone.now(),
        )
        notes.refresh_from_db()
        logger.info(
            "class_sessions: notes run %s on class %s is finishing%s",
            notes.pk,
            notes.session_id,
            f" ({reason})" if reason else "",
        )

    if ClassSessionNotesAudio.objects.filter(notes=notes).exists():
        return _begin_local_summary(notes)
    return notes


def _begin_local_summary(notes):
    """Moves a local run on to the write-up and puts a thread behind it.

    Under a lock and spawning at most once, because the things that end a
    class — the browser's closing segment, the host's leave ping, the
    classroom closing itself at the advertised end, and the deadline that
    catches a laptop simply shut — can all arrive within a second of each
    other, and two threads reading the same audio would bill the model twice
    for one class. (The teacher's stop button is *not* among them: that is a
    pause, and `_pause_local_notes` is where it goes.)
    """
    statuses = ClassSessionNotes.NotesStatus
    with transaction.atomic():
        row = ClassSessionNotes.objects.select_for_update().filter(pk=notes.pk).first()
        if row is None or row.status in (statuses.AVAILABLE, statuses.FAILED):
            return row
        # Whether *this* call is the one that started the write-up. The row,
        # locked, is the only thing that can answer that across workers — the
        # in-process `_monitored` set cannot, and two gunicorn workers both
        # deciding to write a class up would pay the model twice for it. A
        # row already SUMMARIZING with nothing behind it is a different case
        # entirely, and is adopted by `_ensure_local_notes_progress`.
        moved = row.status != statuses.SUMMARIZING
        if moved:
            row.status = statuses.SUMMARIZING
            row.stopped_at = row.stopped_at or timezone.now()
            row.save(update_fields=["status", "stopped_at", "updated_at"])

    if moved and _mark_notes_monitored(row.pk):
        logger.info("class_sessions: writing up local notes run %s", row.pk)
        _spawn(_run_local_notes_safe, row.pk)
    return row


def _ensure_local_notes_progress(notes):
    """The backstop for a class whose teacher simply closed their laptop.

    A local run has no thread while it is listening — the browser is the only
    thing doing anything — so this is where a run that will never hear from
    that browser again is finished off. Reached from the same place an
    orphaned Agora run is adopted (`_ensure_notes_monitored`), for the same
    reason: this codebase has no scheduler, so the next request that asks
    about a class is what moves it along.

    Deliberately unhurried at every step. A listening run is left alone until
    its class's own end has been and gone; a finished one is given
    `LOCAL_NOTES_UPLOAD_GRACE_SECONDS` for its last segment to arrive before
    anybody decides it never will; and a run that was mid-write-up is only
    adopted once it has been quiet far longer than a model call takes.

    The one place it does not wait is a run the teacher had **paused**. The
    browser stopped and flushed when they pressed the button, so there is
    nothing on its way up and the grace would only hold back notes that are
    already complete.
    """
    statuses = ClassSessionNotes.NotesStatus
    now = timezone.now()

    if notes.status == statuses.SUMMARIZING:
        if (now - notes.updated_at).total_seconds() < LOCAL_NOTES_ORPHAN_AFTER_SECONDS:
            return False
        if not _mark_notes_monitored(notes.pk):
            return False
        logger.info("class_sessions: adopting orphaned local notes run %s", notes.pk)
        _spawn(_run_local_notes_safe, notes.pk)
        return True

    # Whether anything could still be on its way up. A paused run has no
    # recorder behind it — the browser stopped and flushed when the teacher
    # pressed the button — so there is no in-flight segment to wait for, and
    # the grace below would only delay notes that are already complete.
    nothing_in_flight = notes.is_paused

    if notes.is_listening or notes.is_paused:
        # A paused run is finished by the same deadline as a listening one.
        # The teacher stopped mid-class and then the class ended without
        # anybody saying so — the twenty minutes already recorded are still a
        # class, and leaving them parked forever would mean notes that never
        # arrive and a row nothing can clear.
        _, _, ends_at = session_window(notes.session)
        deadline = ends_at + timedelta(
            minutes=LIVE_GRACE_MINUTES_AFTER + NOTES_STOP_MARGIN_MINUTES
        )
        if now < deadline:
            return False
        logger.info(
            "class_sessions: local notes run %s outlived its class — finishing it",
            notes.pk,
        )
        ClassSessionNotes.objects.filter(
            pk=notes.pk,
            status__in=[*ClassSessionNotes.LISTENING_STATUSES, statuses.PAUSED],
        ).update(
            status=statuses.COLLECTING, stopped_at=now, updated_at=now
        )
        notes.refresh_from_db()
        # Fall through: the grace below starts from this moment, so the last
        # segment still in flight gets its chance to land.

    if notes.status == statuses.COLLECTING:
        if (
            not nothing_in_flight
            and (now - notes.updated_at).total_seconds() < LOCAL_NOTES_UPLOAD_GRACE_SECONDS
        ):
            return False
        if ClassSessionNotesAudio.objects.filter(notes=notes).exists():
            logger.info(
                "class_sessions: local notes run %s stopped waiting for its last "
                "segment and is writing up what arrived",
                notes.pk,
            )
            _begin_local_summary(notes)
            return True
        _fail_notes(
            notes.pk,
            "No audio from this class ever reached the server, so there was "
            "nothing to write up.",
        )
        return True

    return False


def _run_local_notes_safe(notes_id):
    """Thread entrypoint for a local write-up: transcribe, summarise, publish.

    Every exit path leaves the row in a state somebody can act on, for the
    same reason `_run_notes_safe`'s does: a run stuck on SUMMARIZING shows a
    class a spinner forever.
    """
    close_old_connections()
    try:
        _write_up_local_notes(notes_id)
    except Exception as exc:  # noqa: BLE001 - see docstring
        logger.exception("class_sessions: local notes run %s crashed", notes_id)
        _fail_notes(notes_id, str(exc))
    finally:
        _release_notes_monitored(notes_id)
        close_old_connections()


def _write_up_local_notes(notes_id):
    """The whole second half of a local run, resumable at every step.

    The transcript is written to the row as soon as it is assembled — exactly
    as the Agora path does — so a process that dies between transcribing and
    summarising resumes at the model's second call rather than paying for the
    first one again.
    """
    notes = ClassSessionNotes.objects.select_related("session", "session__course").get(
        pk=notes_id
    )
    if notes.status == _NOTES_AVAILABLE:
        return notes

    transcript_text = notes.transcript
    if not transcript_text:
        transcript_text, problem = _transcribe_local_audio(notes)
        if not transcript_text:
            logger.info(
                "class_sessions: local notes run %s has nothing to write up", notes.pk
            )
            _fail_notes(
                notes_id,
                problem
                or "Nothing was transcribed from this class — no one was heard speaking.",
            )
            return None
        ClassSessionNotes.objects.filter(pk=notes_id).exclude(
            status=_NOTES_AVAILABLE
        ).update(transcript=transcript_text, updated_at=timezone.now())

    notes.refresh_from_db()
    payload = _summarize(notes, transcript_text)
    return _write_notes(notes_id, payload)


def _transcribe_local_audio(notes):
    """Reads every segment of this class, in order, into one transcript.

    Returns `(transcript, problem)`. A segment the model refuses is logged and
    **skipped rather than fatal**: losing ten minutes out of an hour is worth
    far more than losing the hour, and the one case where that judgement would
    mislead — every segment failing — comes back as an empty transcript with
    the reason attached, so the teacher is told what broke rather than that
    nobody spoke.

    A segment that produced nothing is still marked read, so a resumed run
    does not pay to listen to the same silence again. A segment the *provider*
    refused is deliberately left unmarked: that is the one failure worth
    another attempt if this run is ever picked up again.
    """
    segments = list(notes.audio_segments.all())
    if not segments:
        return "", ""

    parts = []
    problem = ""
    for position, segment in enumerate(segments):
        if segment.transcribed_at is not None:
            if segment.transcript:
                parts.append(segment.transcript)
            continue

        tail = parts[-1][-LOCAL_NOTES_TAIL_CHARS:] if parts else ""
        try:
            text = _transcribe_segment(
                notes,
                segment,
                position=position,
                total=len(segments),
                previous_tail=tail,
            )
        except (ProviderError, ProviderTransportError) as exc:
            # A refusal, a spent quota, or a transport failure that outlived
            # its retries — the two are separate classes, not one and its
            # subclass. Logged, remembered and stepped over: see the
            # docstring.
            logger.warning(
                "class_sessions: could not transcribe segment %s of notes run %s: %s",
                segment.index,
                notes.pk,
                exc,
            )
            problem = f"Part of this class could not be transcribed: {exc}"
            continue

        segment.transcript = text
        segment.transcribed_at = timezone.now()
        segment.save(update_fields=["transcript", "transcribed_at", "updated_at"])
        # The run's heartbeat, so a long class is never mistaken for a dead
        # thread while it is genuinely being read.
        _touch_notes(notes)
        if text:
            parts.append(text)

    transcript_text = "\n".join(part for part in parts if part).strip()
    logger.info(
        "class_sessions: local notes run %s read %s segments into %s characters",
        notes.pk,
        len(segments),
        len(transcript_text),
    )
    return transcript_text, ("" if transcript_text else problem)


def _speaker_names(session, timeline):
    """The browser's uid timeline, as `[(seconds, name), ...]`.

    The roster is the authority on who those uids are — the same map the
    video tiles are labelled from — and a uid it does not recognise is
    dropped rather than turned into a number the model would print as a
    name. That is the whole safeguard: a name reaches the transcript only if
    the server can say whose it is.
    """
    if not timeline:
        return []
    names = _speaker_map(session)
    resolved = []
    for entry in timeline:
        name = names.get(str(entry.get("uid")))
        if name:
            resolved.append((entry.get("at", 0), name))
    return resolved


def _transcribe_segment(notes, segment, *, position, total, previous_tail):
    """One segment of audio → what was said in it.

    The file is sent as an inline part, the same mechanism `brand_validator`
    uses for a media kit — which is why segments exist at all: a class arrives
    in pieces small enough to send that way however long it ran.

    Only `ProviderTransportError` is retried, matching `_summarize` and
    `brand_validator._call_provider`: a request that never got a verdict is
    free to send again, while a rejected one or a spent quota would bill the
    same failure twice.
    """
    try:
        with segment.file.open("rb") as handle:
            data = handle.read()
    except (FileNotFoundError, OSError, ValueError):
        # The row says there is audio and the disk disagrees — a restored
        # database against a fresh media volume, most often. The rest of the
        # class is still perfectly readable.
        logger.warning(
            "class_sessions: audio segment %s of notes run %s is missing from disk",
            segment.index,
            notes.pk,
        )
        return ""

    if len(data) < notes_audio.MIN_SEGMENT_BYTES:
        return ""

    media_type, _ = notes_audio.resolve(segment.content_type)
    prompt = notes_prompt.build_transcript_prompt(
        session=notes.session,
        part_index=position,
        part_count=total,
        previous_tail=previous_tail,
        speakers=_speaker_names(notes.session, segment.speakers),
    )

    provider = get_provider()
    result = None
    for attempt in range(NOTES_MAX_TRANSPORT_ATTEMPTS):
        try:
            result = provider.generate_course(
                prompt,
                notes_prompt.TRANSCRIPT_SCHEMA,
                LOCAL_NOTES_TRANSCRIBE_TIMEOUT_SECONDS,
                files=[
                    {
                        "mime_type": media_type,
                        "data_base64": base64.b64encode(data).decode("ascii"),
                    }
                ],
            )
            break
        except ProviderTransportError as exc:
            if attempt + 1 >= NOTES_MAX_TRANSPORT_ATTEMPTS:
                raise
            backoff = NOTES_TRANSPORT_BACKOFF_SECONDS[
                min(attempt, len(NOTES_TRANSPORT_BACKOFF_SECONDS) - 1)
            ]
            logger.warning(
                "class_sessions: segment %s of notes run %s hit a transport error "
                "(%s) — retrying in %ss",
                segment.index,
                notes.pk,
                exc,
                backoff,
            )
            time.sleep(backoff)

    try:
        answer = json.loads(result.text)
    except (TypeError, ValueError):
        # Not fatal for the class: the model answered with something that is
        # not the schema it was given, and the next segment may well be fine.
        logger.warning(
            "class_sessions: segment %s of notes run %s came back unreadable",
            segment.index,
            notes.pk,
        )
        return ""

    if not isinstance(answer, dict) or answer.get("has_speech") is False:
        return ""
    return str(answer.get("transcript") or "").strip()


# ---------------------------------------------------------------------------
# Collecting the transcript and writing it up
# ---------------------------------------------------------------------------


def _collect_and_summarize(notes_id):
    """The second half of a run: captions in the bucket, notes on the row.

    Split from the monitor so a process that died with a bot in the channel
    and a process that died halfway through summarising are both recoverable,
    and recoverable *differently* — the transcript is kept on the row the
    moment it is assembled, so an adopted run resumes at the model call rather
    than paying to list, fetch and stitch a class's captions again.
    """
    notes = ClassSessionNotes.objects.select_related("session", "session__course").get(
        pk=notes_id
    )
    if notes.status == _NOTES_AVAILABLE:
        return notes

    transcript_text = notes.transcript
    if not transcript_text:
        transcript_text = _collect_transcript(notes)
        if not transcript_text:
            logger.info("class_sessions: notes run %s found nothing transcribed", notes.pk)
            _fail_notes(
                notes_id,
                "Nothing was transcribed from this class — no one was heard speaking.",
            )
            return None
        ClassSessionNotes.objects.filter(pk=notes_id).exclude(
            status=_NOTES_AVAILABLE
        ).update(transcript=transcript_text, updated_at=timezone.now())

    ClassSessionNotes.objects.filter(pk=notes_id).exclude(status=_NOTES_AVAILABLE).update(
        status=ClassSessionNotes.NotesStatus.SUMMARIZING, updated_at=timezone.now()
    )

    notes.refresh_from_db()
    payload = _summarize(notes, transcript_text)
    return _write_notes(notes_id, payload)


def _collect_transcript(notes):
    """Lists this run's folder until it stops growing, then reads what is in it.

    Agora flushes a caption slice on a timer, so the last one lands after the
    bot has already gone and "no new file yet" is indistinguishable from "no
    new file ever" in a single glance — hence waiting for the count to hold
    still rather than for one successful listing. A folder that never fills at
    all times out as an empty transcript, which is the honest answer for a
    class nobody spoke in.
    """
    prefix = notes.storage_prefix
    if not prefix:
        logger.error("class_sessions: notes run %s has no storage prefix", notes.pk)
        return ""

    deadline = time.monotonic() + NOTES_SETTLE_TIMEOUT_SECONDS
    caption_keys = []
    playlist_keys = []
    previous_count = -1
    steady_rounds = 0

    while True:
        try:
            keys = storage.list_objects(prefix)
        except storage.StorageNotConfiguredError:
            logger.error(
                "class_sessions: notes run %s cannot be collected — no bucket is configured",
                notes.pk,
            )
            return ""

        caption_keys = [key for key in keys if key.lower().endswith(".vtt")]
        playlist_keys = [key for key in keys if key.lower().endswith(".m3u8")]

        if caption_keys and len(caption_keys) == previous_count:
            steady_rounds += 1
            if steady_rounds >= NOTES_SETTLE_STABLE_ROUNDS:
                break
        else:
            steady_rounds = 0
        previous_count = len(caption_keys)

        if time.monotonic() >= deadline:
            if not caption_keys:
                logger.warning(
                    "class_sessions: no captions ever appeared under %s for notes run %s",
                    prefix,
                    notes.pk,
                )
                return ""
            logger.info(
                "class_sessions: notes run %s stopped waiting with %s caption slices",
                notes.pk,
                len(caption_keys),
            )
            break

        time.sleep(NOTES_SETTLE_POLL_SECONDS)

    playlist = ""
    if playlist_keys:
        raw = storage.get_object(sorted(playlist_keys)[0])
        playlist = raw.decode("utf-8", "replace") if raw else ""

    ordered = transcript.playlist_order(playlist, sorted(caption_keys))

    slices = []
    for key in ordered:
        raw = storage.get_object(key)
        if raw is None:
            logger.warning("class_sessions: could not read the caption slice %s", key)
            continue
        slices.append((key, raw.decode("utf-8", "replace")))

    text = transcript.transcript_from_slices(
        slices, speaker_names=_speaker_map(notes.session)
    )

    ClassSessionNotes.objects.filter(pk=notes.pk).update(
        transcript_keys=[key for key, _ in slices], updated_at=timezone.now()
    )
    logger.info(
        "class_sessions: notes run %s read %s caption slices into %s characters",
        notes.pk,
        len(slices),
        len(text),
    )
    return text


def _trim_transcript(text):
    """The transcript as much of it as the model is shown.

    When the cap bites the **middle** is dropped, never the end: the last
    minutes of a class carry the recap, the homework and what next week
    covers, which is half of what notes are for. The gap is marked in words so
    the model knows it is reading two halves rather than one continuous hour.
    """
    if len(text) <= NOTES_MAX_TRANSCRIPT_CHARS:
        return text

    marker = (
        "\n\n[... the middle of this class is not shown — it was too long to "
        "include in full. What follows is the end of the class. ...]\n\n"
    )
    # The marker counts against the budget rather than being added on top of
    # it: a transcript a few characters over the cap must not come back
    # *longer* than it went in.
    half = max(1, (NOTES_MAX_TRANSCRIPT_CHARS - len(marker)) // 2)
    logger.info(
        "class_sessions: trimmed a %s-character transcript to %s",
        len(text),
        NOTES_MAX_TRANSCRIPT_CHARS,
    )
    return f"{text[:half]}{marker}{text[-half:]}"


def _summarize(notes, transcript_text):
    """Hands the transcript to the model and returns the repaired notes.

    Only `ProviderTransportError` is retried — it means the request never got
    a verdict, so trying again is free of side effects. A rejected request or
    a spent quota is re-raised: re-sending either would bill the same failure
    twice. The patience is `brand_validator`'s rather than `advisor`'s,
    because this runs on a background thread nobody is watching.
    """
    session = notes.session
    prompt = notes_prompt.build_prompt(
        session=session,
        transcript=_trim_transcript(transcript_text),
        agenda=session.agenda,
    )

    provider = get_provider()
    last_error = None
    for attempt in range(NOTES_MAX_TRANSPORT_ATTEMPTS):
        try:
            result = provider.generate_course(
                prompt,
                notes_prompt.RESPONSE_SCHEMA,
                NOTES_SUMMARY_TIMEOUT_SECONDS,
            )
            break
        except ProviderTransportError as exc:
            last_error = exc
            if attempt + 1 >= NOTES_MAX_TRANSPORT_ATTEMPTS:
                raise
            backoff = NOTES_TRANSPORT_BACKOFF_SECONDS[
                min(attempt, len(NOTES_TRANSPORT_BACKOFF_SECONDS) - 1)
            ]
            logger.warning(
                "class_sessions: notes run %s hit a transport error (%s) — retrying in %ss",
                notes.pk,
                exc,
                backoff,
            )
            time.sleep(backoff)
    else:  # pragma: no cover - the loop always breaks or raises
        raise last_error

    try:
        payload = json.loads(result.text)
    except (TypeError, ValueError) as exc:
        raise ProviderError(
            "The model's notes could not be read as JSON."
        ) from exc

    return notes_validators.normalize_notes_payload(
        payload, fallback_title=session.title
    )


def _write_notes(notes_id, payload):
    """Saves the notes, renders the hand-out, and tells the class — once.

    The document is rendered after the row is written rather than before, so a
    server without reportlab still gets its notes: a missing renderer costs a
    download, not a lesson (`notes_document.PDF_AVAILABLE`).
    """
    updated = ClassSessionNotes.objects.filter(pk=notes_id).exclude(
        status=_NOTES_AVAILABLE
    ).update(
        title=payload["title"],
        summary=payload["summary"],
        key_topics=payload["key_topics"],
        important_points=payload["important_points"],
        action_items=payload["action_items"],
        next_class=payload["next_class"],
        error_message="",
        updated_at=timezone.now(),
    )
    if not updated:
        return ClassSessionNotes.objects.filter(pk=notes_id).first()

    notes = ClassSessionNotes.objects.select_related("session", "session__course").get(
        pk=notes_id
    )

    # Rendered whatever the model made of the class, including "nothing was
    # taught here". A run that reaches this line *has* notes — it is about to
    # be published, both portals will offer them, and the card and the reader
    # both offer them as a document to download. Skipping the render for an
    # empty class left those buttons promising a file that was deliberately
    # never made, which is a worse answer than a one-line PDF saying what the
    # notes say.
    _render_notes_document(notes)

    if not payload["has_content"]:
        logger.info(
            "class_sessions: notes run %s found no lesson in the transcript", notes.pk
        )
        return _publish_notes(notes_id, announce_to_students=False)

    return _publish_notes(notes_id, announce_to_students=True)


def render_notes_document(notes, *, with_transcript=False):
    """The notes as a PDF, in memory, or `None`.

    `with_transcript` appends the verbatim record of the class under the
    write-up. It is **off by default and never set by the pipeline**: the
    stored document is the one emailed to the whole class, and the words of a
    room that may be full of minors are the course teachers' alone. The only
    caller that passes it is the download view, which has already asked who
    is on the other end of the request.

    Never raises: a PDF that will not render costs a download, not a lesson.
    """
    if not notes_document.PDF_AVAILABLE:
        logger.warning(
            "class_sessions: reportlab is not installed — notes run %s has no PDF",
            notes.pk,
        )
        return None

    try:
        buffer = io.BytesIO()
        notes_document.build_notes_pdf(
            notes,
            session=notes.session,
            destination=buffer,
            transcript=notes.transcript if with_transcript else None,
        )
        buffer.seek(0)
        return buffer
    except Exception:  # noqa: BLE001 - see docstring
        logger.exception(
            "class_sessions: could not render the notes document for run %s", notes.pk
        )
        return None


def _render_notes_document(notes):
    """Writes the shareable PDF onto the row, or logs why it could not.

    Shareable means **without the transcript**: this is the file attached to
    the email every student on the course receives, so it carries the
    write-up and nothing else.

    Never raises: the notes are in the database and on the screen whatever
    happens here, and failing a class's write-up because a PDF would not
    render would be throwing away the thing people actually read.
    """
    buffer = render_notes_document(notes)
    if buffer is None:
        return None

    try:
        # A random tail rather than a guessable name: the document is served
        # through a view that checks the class's roster, and a MEDIA path that
        # could be guessed would be a second way in that checks nothing.
        filename = f"class-{notes.session_id}-notes-{secrets.token_hex(8)}.pdf"
        notes.document.save(filename, ContentFile(buffer.getvalue()), save=False)
        notes.save(update_fields=["document", "updated_at"])
        return notes.document
    except Exception:  # noqa: BLE001 - see docstring
        logger.exception(
            "class_sessions: could not save the notes document for run %s", notes.pk
        )
        return None


def _publish_notes(notes_id, *, announce_to_students):
    """Marks the notes readable and notifies the class — exactly once.

    The guard is the row itself, locked: notes reach here from the teacher
    stopping them, the host leaving, the deadline passing and Agora's own idle
    timer, and two of those racing must not send a class two notifications.
    `notified_at` is written in the same transaction as the notifications, so
    a rollback takes both.

    A class where nothing was taught is still *published* — the teacher can
    see what came of it — but the students are not told. Thirty people pulled
    back to a page that says "nothing was taught in this class" is noise they
    did not ask for, and the one person who needs to know is the one who was
    in the room.
    """
    with transaction.atomic():
        notes = (
            ClassSessionNotes.objects.select_for_update()
            .select_related("session", "session__course")
            .filter(pk=notes_id)
            .first()
        )
        if notes is None or notes.notified_at is not None:
            return notes

        session = notes.session
        now = timezone.now()
        if notes.started_at and not notes.stopped_at:
            notes.stopped_at = now
        if notes.started_at and notes.stopped_at:
            notes.duration_seconds = max(
                0, int((notes.stopped_at - notes.started_at).total_seconds())
            )

        notes.status = _NOTES_AVAILABLE
        notes.error_message = ""
        notes.notified_at = now
        notes.save(
            update_fields=[
                "status",
                "stopped_at",
                "duration_seconds",
                "error_message",
                "notified_at",
                "updated_at",
            ]
        )

        title = f"Class notes ready: {session.title}"
        if announce_to_students:
            # The students who were told to turn up are the students told the
            # notes exist — the same roster, resolved the same way. The
            # notification carries no link: `related_object_type` points the
            # portal at the class, and the document is served behind the
            # class's own roster when they get there.
            _notify_students(
                session,
                verb="class_notes_ready",
                title=title,
                message=(
                    f"{session.course.title} — the notes from this class are now in "
                    "Live Classes under Past Classes."
                ),
            )

        # The host is told either way, and is not on the student roster.
        if session.teacher_id:
            create_notifications_for_users(
                [session.teacher_id],
                verb="class_notes_ready",
                title=title,
                message=(
                    f"{session.course.title} — your class notes are ready."
                    if announce_to_students
                    else f"{session.course.title} — nothing much was said in this class, "
                    "so the notes are empty. Your students haven't been told."
                ),
                related_object_type="class_session",
                related_object_id=session.pk,
            )

        if announce_to_students:
            # The email goes out only once the row is safely committed: a
            # rollback here would otherwise have told a class about notes this
            # server then forgot, and an email is the one thing in this
            # function that cannot be taken back.
            transaction.on_commit(lambda: _email_notes_ready(session, notes))

    logger.info(
        "class_sessions: notes run %s of class %s is available",
        notes.pk,
        notes.session_id,
    )
    return notes


def _notes_attachment(notes):
    """The rendered notes as `(filename, bytes)`, or `None`.

    Read once and handed to every message rather than re-opened per
    recipient: thirty students is thirty copies of the same few kilobytes,
    and a media volume that has lost the file should cost one log line, not
    thirty failures.
    """
    if notes is None or not notes.document:
        return None
    try:
        with notes.document.open("rb") as handle:
            content = handle.read()
    except (FileNotFoundError, OSError, ValueError):
        # The row says there is a document and the disk disagrees — a restored
        # database against a fresh media volume, most often. The notes are
        # still on screen and the email still has somewhere to send people.
        logger.warning(
            "class_sessions: notes run %s has no readable document to attach", notes.pk
        )
        return None

    session = notes.session
    filename = f"{session.course.code}-{session.scheduled_at:%Y-%m-%d}-notes.pdf"
    return filename, content


def _email_notes_ready(session, notes=None):
    """Tells the class, by email, that the notes are up — **with the PDF**.

    The document is attached rather than linked. It is the one thing a class
    is given afterwards that is genuinely meant to be kept, read offline and
    revised from, and a link that only works while somebody is signed into
    the portal is not that. What makes that safe here is what the notes *are*
    (`notes_prompt`): the material that was taught, with no student named and
    nothing in them that was not said out loud to the whole room. The
    verbatim transcript is a different matter and is never sent — it stays
    behind `can_manage`, for the teacher alone.

    The portal link stays in the body, because the attachment is a snapshot
    and the portal is where the class, its recording and any later correction
    actually live.

    One message per recipient, built and sent individually so a single
    unreachable address cannot take the rest of the class's email with it,
    and the whole thing is wrapped: a broken SMTP configuration must not fail
    notes that are sitting there perfectly fine, and nobody's address belongs
    in anybody else's To: header.
    """
    if not getattr(settings, "CLASS_NOTES_EMAIL_ENABLED", True):
        return 0

    recipients = _recording_email_recipients(session)
    if not recipients:
        return 0

    base_url = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    student_link = f"{base_url}{getattr(settings, 'CLASS_RECORDING_PORTAL_PATH', '')}"
    teacher_link = f"{base_url}{getattr(settings, 'CLASS_RECORDING_TEACHER_PORTAL_PATH', '')}"
    subject = f"Class notes ready: {session.title}"
    attachment = _notes_attachment(notes)

    sent = 0
    for email, name, is_teacher in recipients:
        link = teacher_link if is_teacher else student_link
        where = (
            "They're under Live Classes → Past Classes in your teacher portal."
            if is_teacher
            else "They're under Live Classes → Past Classes in your student portal."
        )
        attached_line = (
            "They're attached to this email as a PDF, and they're also in your "
            "portal:\n"
            if attachment
            else "You'll find them in your portal:\n"
        )
        body = (
            f"Hi {name},\n\n"
            f"The notes from \"{session.title}\" ({session.course.code} — "
            f"{session.course.title}) are ready to read.\n\n"
            f"{attached_line}{where}\n{link}\n\n"
            "They were written automatically from a transcript of the class and "
            "haven't been checked by your teacher, so treat anything surprising "
            "as something to ask about.\n\n"
            "The Cool Nerds Team"
        )

        try:
            message = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email],
            )
            if attachment:
                message.attach(attachment[0], attachment[1], "application/pdf")
            message.send(fail_silently=True)
            sent += 1
        except Exception:  # noqa: BLE001 - one bad address must not stop the class
            logger.exception(
                "class_sessions: could not email the notes from class %s to a recipient",
                session.pk,
            )

    logger.info(
        "class_sessions: emailed %s people about the notes from class %s (%s)",
        sent,
        session.pk,
        "with the PDF attached" if attachment else "no document to attach",
    )
    return sent


# ---------------------------------------------------------------------------
# Reading the notes
# ---------------------------------------------------------------------------


def notes_payload(notes):
    """The notes themselves, as both portals render them."""
    return {
        "id": notes.pk,
        "title": notes.title,
        "summary": notes.summary,
        "key_topics": list(notes.key_topics or []),
        "important_points": list(notes.important_points or []),
        "action_items": list(notes.action_items or []),
        "next_class": notes.next_class,
        "has_document": bool(notes.document),
        "written_at": notes.notified_at or notes.updated_at,
        "duration_seconds": notes.duration_seconds,
    }


def notes_state(*, session, user, include_notes=True):
    """Everything a portal needs to know about this class's notes.

    One payload serves three surfaces — the "taking notes" indicator in the
    classroom, the teacher's notes button and the student's "Class notes" —
    so they cannot disagree about whether a class is being transcribed. The
    notes themselves are only ever present for somebody who may attend the
    class, which is the same check the classroom door makes.

    The **transcript only ever reaches the teacher**. It is a verbatim record
    of who said what in a room that may be full of minors, kept as the
    evidence behind the notes and for the person who taught the class to check
    them against — not a thing to hand around a class. Students get the
    write-up; the words stay with the course's instructors.
    """
    configured = is_notes_configured()
    running = active_notes(session)
    available = latest_available_notes(session)

    # A thread that died with the process is picked back up by whoever asks
    # next — there is no scheduler here to do it on a timer.
    if running is not None:
        _ensure_notes_monitored(running)

    statuses = ClassSessionNotes.NotesStatus
    state = {
        "configured": configured,
        "takes_notes": bool(session.takes_notes),
        "notes_bot_uid_min": NOTES_BOT_UID_MIN,
        "status": (running or available).status if (running or available) else "NONE",
        "is_transcribing": bool(running and running.is_listening),
        # Parked mid-class by the teacher. Deliberately neither "taking
        # notes" nor "writing them up": nothing is happening, the button is
        # free, and pressing it resumes this run rather than starting another.
        "is_paused": bool(running and running.is_paused),
        "is_writing": bool(
            running
            and running.status in (statuses.COLLECTING, statuses.SUMMARIZING)
        ),
        "available": bool(available),
        "notes": None,
        "transcript": None,
        # Everything the capturing browser needs, including *which* browser
        # that is. Sent to everyone rather than only to the capturer, because
        # a client finding its own id in here is how it knows it is the one.
        "capture": notes_capture_config(session, running),
        "error": "",
    }

    # Why the last attempt came to nothing — the teacher's alone. It is the
    # only place a failure is visible at all (a FAILED run is neither running
    # nor available), and the reason can name a provider, a quota or a file
    # on disk, none of which is a student's business or any use to them.
    if running is None and available is None and can_manage(user, session):
        latest = session.notes_runs.order_by("-created_at").first()
        if latest is not None and latest.status == statuses.FAILED:
            state["status"] = statuses.FAILED
            state["error"] = latest.error_message

    if available and include_notes and can_attend(user, session):
        state["notes"] = notes_payload(available)
        if can_manage(user, session):
            state["transcript"] = available.transcript

    return state
