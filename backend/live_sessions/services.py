"""War Room Live — scheduling state, RSVPs, and the way into the room.

Four things live here:

1. A session's UPCOMING/LIVE/ENDED state, derived from the clock rather than
   stored (`live_state`) — the same constraint `class_sessions` works under,
   because this codebase has no scheduler to keep a stored flag honest.
2. RSVPs and the capacity they are checked against.
3. The door, in both of its forms. A session on somebody else's platform
   releases a meeting link (`get_join_url`); one hosted here mints an Agora
   token per person, per join (`issue_join_credentials`). Both go through the
   same window, so the two can never disagree about when a room is open.
4. Who may *speak* in a room hosted here, which is a decision carried in the
   token rather than enforced in a browser (`audience_can_speak`).

The notes a session takes on itself live next door in `notes.py`.
"""

import logging
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Count, DateTimeField, ExpressionWrapper, F, Q, Value
from django.utils import timezone

from class_sessions.agora import (
    MAX_EXPIRE_SECONDS,
    ROLE_PUBLISHER,
    ROLE_SUBSCRIBER,
    AgoraTokenError,
    build_rtc_token,
)

from . import notes
from .exceptions import (
    AgoraNotConfiguredError,
    SessionAccessDeniedError,
    SessionClosedError,
    SessionFullError,
    SessionNotJoinableError,
)
from .models import LiveSession, SessionRSVP

# The doors open shortly before the advertised start so nobody is locked out
# by a slow page load or a clock skew, and stay open for the whole session.
JOIN_WINDOW_MINUTES_BEFORE = 15
# A session stays "live" a little past its scheduled end — these run over.
LIVE_GRACE_MINUTES_AFTER = 15

UPCOMING = "UPCOMING"
LIVE = "LIVE"
ENDED = "ENDED"
CANCELLED = "CANCELLED"

logger = logging.getLogger(__name__)

# Only the audience is counted as "going", and only the audience is checked
# against the capacity. Running the room is not attending it — the host has a
# row in the same table so the roster can put a name on their voice, and
# counting it would quietly take a seat off every session an admin opened
# (`SessionRSVP.role`).
AUDIENCE_RSVPS = Q(rsvps__role=SessionRSVP.ParticipantRole.AUDIENCE)


def session_window(session):
    """(opens_at, starts_at, ends_at) for one session."""
    starts_at = session.scheduled_at
    ends_at = starts_at + timedelta(minutes=session.duration_minutes or 0)
    opens_at = starts_at - timedelta(minutes=JOIN_WINDOW_MINUTES_BEFORE)
    return opens_at, starts_at, ends_at


def live_state(session, now=None):
    """Derived status — never stored. A cancelled session is cancelled
    regardless of the clock; everything else is decided by where `now` falls
    relative to the session window."""
    if session.status == LiveSession.SessionStatus.CANCELLED:
        return CANCELLED

    now = now or timezone.now()
    opens_at, _, ends_at = session_window(session)

    if now < opens_at:
        return UPCOMING
    if now <= ends_at + timedelta(minutes=LIVE_GRACE_MINUTES_AFTER):
        return LIVE
    return ENDED


def can_join(session, now=None):
    """Whether the room is open to walk into right now.

    Two kinds of session, one rule: it has to be live, and there has to be
    somewhere to go. For a session on somebody else's platform that means a
    published link; for one hosted here it means this server actually holding
    Agora credentials, since without them there is no token to mint and the
    card would offer a button that could only fail.
    """
    if live_state(session, now) != LIVE:
        return False
    if session.is_hosted_here:
        return is_agora_configured()
    return bool(session.meeting_url)


# The two list queries split on a session's *end* time, not its start: a
# 90-minute session that began 20 minutes ago is still live and must stay in
# "upcoming", not drop into "past". Splitting on `scheduled_at` alone would
# put it in both the wrong list and in disagreement with `live_state` above.
_ENDS_AT = ExpressionWrapper(
    F("scheduled_at") + F("duration_minutes") * Value(timedelta(minutes=1)),
    output_field=DateTimeField(),
)


def _list_cutoff():
    return timezone.now() - timedelta(minutes=LIVE_GRACE_MINUTES_AFTER)


def upcoming_sessions():
    """Scheduled sessions that haven't ended yet — a session that is live
    right now belongs here, not in the past list."""
    return (
        LiveSession.objects.filter(status=LiveSession.SessionStatus.SCHEDULED)
        .annotate(rsvp_count=Count("rsvps", filter=AUDIENCE_RSVPS, distinct=True), ends_at=_ENDS_AT)
        .filter(ends_at__gte=_list_cutoff())
        .order_by("scheduled_at")
    )


def past_sessions():
    """Everything that has finished, plus every cancelled session regardless
    of date — a cancelled session must stay visible to the students who
    RSVP'd, and it has no future worth listing under "upcoming"."""
    return (
        LiveSession.objects.annotate(
            rsvp_count=Count("rsvps", filter=AUDIENCE_RSVPS, distinct=True), ends_at=_ENDS_AT
        )
        .filter(Q(ends_at__lt=_list_cutoff()) | Q(status=LiveSession.SessionStatus.CANCELLED))
        .order_by("-scheduled_at")
    )


def rsvp_to_session(*, session, student):
    """Reserves a spot. Idempotent — a second RSVP returns the existing row
    rather than erroring, so a double-tap doesn't show a scary message.

    The capacity check and the insert run inside one transaction with the
    session row locked, so two students competing for the last seat can't
    both pass the check (the same select_for_update-then-recheck shape
    rewards.services.redeem_reward uses).
    """
    with transaction.atomic():
        session = LiveSession.objects.select_for_update().get(pk=session.pk)

        if session.status == LiveSession.SessionStatus.CANCELLED:
            raise SessionClosedError("This session was cancelled.")
        if live_state(session) == ENDED:
            raise SessionClosedError("This session has already ended.")

        existing = SessionRSVP.objects.filter(session=session, student=student).first()
        if existing:
            return existing

        if session.capacity is not None and seats_taken(session) >= session.capacity:
            raise SessionFullError("This session is full. Check back for the next one.")

        try:
            return SessionRSVP.objects.create(session=session, student=student)
        except IntegrityError:
            # Lost a race against the same student's concurrent RSVP — the
            # unique constraint did its job; return what the winner created.
            return SessionRSVP.objects.get(session=session, student=student)


def seats_taken(session):
    """How many of this session's seats are spoken for.

    Audience rows only, for the reason `AUDIENCE_RSVPS` gives: an admin who
    opened the room has a row here too, and it is not a seat.
    """
    return SessionRSVP.objects.filter(
        session=session, role=SessionRSVP.ParticipantRole.AUDIENCE
    ).count()


def cancel_rsvp(*, session, student):
    if live_state(session) == ENDED:
        raise SessionClosedError("This session has already ended.")

    deleted, _ = SessionRSVP.objects.filter(session=session, student=student).delete()
    return bool(deleted)


def get_join_url(*, session, student):
    """Returns the meeting URL if the join window is open, and records that
    this student reached the door. Raises otherwise — the URL is never
    serialized into a listing, so this is the only way to obtain it."""
    if session.status == LiveSession.SessionStatus.CANCELLED:
        raise SessionNotJoinableError("This session was cancelled.")
    if session.is_hosted_here:
        # There is no link to release: the room is ours, and the way in is a
        # token minted per person by `issue_join_credentials`. Said plainly
        # rather than as "no link has been published", which would have an
        # admin hunting for a Zoom URL that is never going to exist.
        raise SessionNotJoinableError(
            "This session runs in the portal — open the room instead of a link."
        )
    if not session.meeting_url:
        raise SessionNotJoinableError("No join link has been published for this session yet.")

    state = live_state(session)
    if state == UPCOMING:
        # Deliberately no timestamp: this string is rendered verbatim to a
        # student, and the server only knows UTC. Every time the frontend
        # shows for a session is formatted in the viewer's own timezone
        # (live/sessionUtils.js), so quoting a UTC time here would contradict
        # the clock right next to it.
        raise SessionNotJoinableError(
            f"The room opens {JOIN_WINDOW_MINUTES_BEFORE} minutes before the session starts."
        )
    if state == ENDED:
        raise SessionNotJoinableError("This session has already ended.")

    rsvp, _ = SessionRSVP.objects.get_or_create(session=session, student=student)
    if not rsvp.attended:
        rsvp.attended = True
        rsvp.joined_at = timezone.now()
        rsvp.save(update_fields=["attended", "joined_at", "updated_at"])

    return session.meeting_url


def get_session_stats(student):
    """Header numbers for the War Room Live tab. "Upcoming" is counted from
    the same queryset the upcoming list renders, so the stat card can never
    disagree with the cards underneath it."""
    upcoming = upcoming_sessions()
    rsvps = SessionRSVP.objects.filter(
        student=student, role=SessionRSVP.ParticipantRole.AUDIENCE
    )

    return {
        "upcoming_count": upcoming.count(),
        "my_rsvp_count": rsvps.filter(session__in=upcoming.values("pk")).count(),
        "sessions_attended": rsvps.filter(attended=True).count(),
        "recordings_available": past_sessions()
        .exclude(recording_url__isnull=True)
        .exclude(recording_url="")
        .count(),
    }


# ---------------------------------------------------------------------------
# The room this platform hosts itself
# ---------------------------------------------------------------------------
#
# A session whose `meeting_method` is AGORA runs in the portals rather than on
# somebody else's link: the audio is an Agora RTC channel, and the only way
# into it is a token minted here, per person, per join. The App Certificate
# that signs those tokens never leaves this process; the browser carries only
# the public App ID (NEXT_PUBLIC_AGORA_APP_ID) and the short-lived token.
#
# The token signing itself is `class_sessions.agora` — one implementation of
# Agora's AccessToken2 for the whole codebase, pinned against Agora's own
# published test vectors in `class_sessions/tests/test_agora.py`. A second
# copy of that wire format is the last thing this project needs: a drift in
# either copy shows up first as a browser that silently cannot join.

# A token has to outlive the session comfortably — Agora drops a participant
# whose token expires mid-call, and the frontend's renewal is a safety net
# rather than the plan. Clamped to Agora's own 24-hour ceiling, and floored so
# that walking in during the last minute still yields a usable token.
TOKEN_TAIL_BUFFER_SECONDS = 30 * 60
MIN_TOKEN_SECONDS = 15 * 60


def is_agora_configured():
    """Whether this server can open a room at all.

    A pure settings read that complains nowhere: it is asked once per row of
    every listing, so the logging belongs on the request that was actually
    refused (`_agora_credentials`) — the same split `class_sessions
    .is_recording_configured` makes.
    """
    return bool(
        (getattr(settings, "AGORA_APP_ID", "") or "").strip()
        and (getattr(settings, "AGORA_APP_CERTIFICATE", "") or "").strip()
    )


def _agora_credentials():
    app_id = (getattr(settings, "AGORA_APP_ID", "") or "").strip()
    app_certificate = (getattr(settings, "AGORA_APP_CERTIFICATE", "") or "").strip()
    if not app_id or not app_certificate:
        logger.error(
            "live_sessions: AGORA_APP_ID / AGORA_APP_CERTIFICATE are not set — no "
            "War Room Live room can be opened until both are configured in the "
            "backend environment."
        )
        raise AgoraNotConfiguredError(
            "War Room Live rooms are not configured on this server yet."
        )
    return app_id, app_certificate


def is_host(user, session=None):
    """Who runs a War Room Live room.

    Admins, and only admins — these sessions are scheduled from the admin
    portal and the guests speaking on them have no LMS account at all
    (`SessionSpeaker` is deliberately not a `User`). `session` is accepted and
    unused so that callers read the same way they do in `class_sessions`,
    where hosting really is per-session.
    """
    return bool(user and user.is_authenticated and user.is_admin)


def can_attend(user, session=None):
    """Who may be in the room.

    Everyone signed in. A War Room Live session is a drop-in: it is
    advertised to the whole student body, RSVPs are a courtesy rather than a
    ticket, and somebody who hears about it ten minutes in should be able to
    walk in. Capacity is the one thing that closes the door, and it is
    checked at the door itself (`_assert_room_open`).
    """
    return bool(user and user.is_authenticated)


def participant_role(user, session):
    return (
        SessionRSVP.ParticipantRole.HOST
        if is_host(user, session)
        else SessionRSVP.ParticipantRole.AUDIENCE
    )


def audience_can_speak(session):
    """Whether somebody who is not hosting may turn their microphone on.

    Stored on the session rather than decided in a browser, because it is
    carried in the Agora token (`issue_join_credentials`): a page that merely
    behaved as though it could not publish would be one console command away
    from talking over the guest.
    """
    return session.audience_access == LiveSession.AudienceAccess.EVERYONE


def _token_lifetime(session, now, ceiling=MAX_EXPIRE_SECONDS):
    """Seconds of validity for a token minted at `now`.

    Covers the rest of the session, its overrun grace and a further buffer, so
    an ordinary session never reaches the renewal path at all.
    """
    _, _, ends_at = session_window(session)
    remaining = (ends_at - now).total_seconds()
    lifetime = int(remaining) + LIVE_GRACE_MINUTES_AFTER * 60 + TOKEN_TAIL_BUFFER_SECONDS
    return max(MIN_TOKEN_SECONDS, min(lifetime, ceiling))


def _record_arrival(session, user, role, now, *, enforce_capacity=False):
    """One row per person per session, stamped the first time they arrive.

    Reaching the door is what writes the row: a student who RSVP'd weeks ago
    already has one, a walk-in gets theirs here, and a host gets one too
    because the roster has to be able to put a name on their voice.

    `joined_at` is only ever written once — it is when they first showed up,
    not when their browser last reconnected, since a dropped connection and
    the rejoin that follows are the normal case rather than an error.

    **The seat is taken here, under the session's own row lock**, which is the
    only place it can be taken exactly. `_assert_room_open` checks capacity
    too, and does it first so a full session is refused before a token is
    signed and with a sentence somebody can read — but two walk-ins arriving
    in the same millisecond would both pass that check, which is the same race
    `rsvp_to_session` locks against. A host never takes a seat.
    """
    with transaction.atomic():
        locked = LiveSession.objects.select_for_update().get(pk=session.pk)
        rsvp = SessionRSVP.objects.filter(session=locked, student=user).first()

        if rsvp is None:
            if (
                enforce_capacity
                and locked.capacity is not None
                and seats_taken(locked) >= locked.capacity
            ):
                raise SessionFullError(
                    "This session is full. Check back for the next one."
                )
            return SessionRSVP.objects.create(
                session=locked,
                student=user,
                role=role,
                attended=True,
                joined_at=now,
            )

        fields = []
        if rsvp.role != role:
            # An admin who RSVP'd as an ordinary attendee and then opened the
            # room is hosting it; the row follows what they actually did.
            rsvp.role = role
            fields.append("role")
        if not rsvp.attended:
            rsvp.attended = True
            rsvp.joined_at = rsvp.joined_at or now
            fields.extend(["attended", "joined_at"])
        if fields:
            rsvp.save(update_fields=[*fields, "updated_at"])
    return rsvp


def _assert_room_open(session, user, now):
    """The door, in one place: may this person be let in right now?

    Returns whether they are hosting, which is the other thing every caller
    needs. Raises rather than returning a verdict so there is no route to a
    token that forgets one of these checks.
    """
    if not can_attend(user, session):
        raise SessionAccessDeniedError("You need to be signed in to join this session.")

    if not session.is_hosted_here:
        raise SessionNotJoinableError(
            "This session runs on another platform — use the join link instead."
        )

    if session.status == LiveSession.SessionStatus.CANCELLED:
        raise SessionNotJoinableError(
            session.cancellation_reason or "This session was cancelled."
        )

    state = live_state(session, now)
    if state == ENDED:
        raise SessionNotJoinableError("This session has already ended.")
    if state == UPCOMING:
        # Deliberately no timestamp: this string is rendered verbatim to a
        # student, the server only knows UTC, and every time the frontend
        # shows is in the viewer's own timezone — so quoting one here would
        # contradict the clock right beside it.
        raise SessionNotJoinableError(
            f"The room opens {JOIN_WINDOW_MINUTES_BEFORE} minutes before the session starts."
        )

    host = is_host(user, session)

    # Capacity closes the door on a walk-in, never on somebody who already has
    # a seat and never on the person running the room. Checked here as well as
    # at RSVP time because a drop-in session is joinable without an RSVP at
    # all, and "full" has to mean full at both doors.
    if not host and session.capacity is not None:
        has_seat = SessionRSVP.objects.filter(session=session, student=user).exists()
        if not has_seat and seats_taken(session) >= session.capacity:
            raise SessionFullError("This session is full. Check back for the next one.")

    return host


def get_roster(session):
    """uid → person, for labelling the voices in the room.

    Agora identifies a participant by the numeric uid their token was minted
    with, which is their user id (see `issue_join_credentials`) and nothing
    else — without this map a session is a wall of anonymous squares. Only
    names and roles are exposed: nobody in a drop-in session has any business
    reading a stranger's email off the call screen.

    Everyone who could be in the channel is in here, because everyone who
    opens the door gets a row — a student by RSVP or by walking in, an admin
    by opening the room (`_record_arrival`).
    """
    return [
        {
            "uid": rsvp.student_id,
            "name": rsvp.student.name or rsvp.student.username,
            "role": rsvp.role,
        }
        for rsvp in SessionRSVP.objects.filter(session=session).select_related("student")
    ]


def issue_join_credentials(*, session, user, now=None):
    """Mints this person's Agora token — the only way into a War Room Live room.

    The gate lives in `_assert_room_open` rather than in the view, so there is
    no route to a credential that skips it. The token is bound to this channel
    *and* to this user's uid, so it cannot be passed to somebody the door
    would have turned away.

    The **role is the enforcement point** for who may speak: the host
    publishes, and the audience only publishes while the floor is open
    (`audience_can_speak`). Handing the floor over therefore means every
    student's client asking for a fresh token, which is the same call as this
    one — exactly as the classroom whiteboard hands over the pen.
    """
    now = now or timezone.now()
    host = _assert_room_open(session, user, now)

    app_id, app_certificate = _agora_credentials()
    expire_seconds = _token_lifetime(session, now)
    may_speak = host or audience_can_speak(session)

    try:
        token = build_rtc_token(
            app_id=app_id,
            app_certificate=app_certificate,
            channel_name=session.channel_name,
            # The uid *is* the user id: stable across reconnects, unique
            # within the channel, and what `get_roster` maps back to a name.
            uid=user.pk,
            expire_seconds=expire_seconds,
            role=ROLE_PUBLISHER if may_speak else ROLE_SUBSCRIBER,
        )
    except AgoraTokenError:
        logger.exception(
            "live_sessions: failed to sign an Agora token for session %s", session.pk
        )
        raise AgoraNotConfiguredError(
            "War Room Live rooms are not configured correctly on this server."
        )

    role = participant_role(user, session)
    _record_arrival(session, user, role, now, enforce_capacity=not host)

    # The session writes itself up because the person running it is in it.
    # Deliberately after the token is signed and the arrival recorded: a
    # missing AI key, a provider outage or a run that failed to start must
    # never be the reason a room cannot open, so `maybe_start_notes` swallows
    # everything into a log line and the join carries on regardless.
    #
    # The fallback is not a tidy-up: a *student* joining never starts
    # anything, and they are precisely the person who most needs to be told
    # that the session is already being written up.
    running = notes.maybe_start_notes(session, user, now) or notes.active_notes(session)

    return {
        "channel_name": session.channel_name,
        "token": token,
        "uid": user.pk,
        "role": role,
        "is_host": host,
        # Whether this token may publish audio. The browser reads it to decide
        # whether to offer a microphone button at all; Agora is what actually
        # enforces it.
        "can_speak": may_speak,
        "audience_access": session.audience_access,
        "expires_at": now + timedelta(seconds=expire_seconds),
        "expires_in": expire_seconds,
        "roster": get_roster(session),
        # Said at the moment of arrival rather than on the next poll: a
        # session that is being written up is a fact about the room, and
        # everybody in it should know on their first frame.
        "is_taking_notes": bool(running and running.is_listening),
        # And everything the capturing browser needs to start recording, here
        # rather than only on the notes endpoint. The two requests race on the
        # way into a room, and the seconds between them are the first thing
        # the guest says.
        "notes_capture": notes.notes_capture_config(session, running),
    }


def record_leave(*, session, user, now=None, ended=False):
    """Best-effort "I've left" ping.

    **`ended` is the whole of the difference between walking out and
    blinking.** A browser says "left" for several reasons that look identical
    from here — the red button, the room closing itself at the advertised
    end, a page reload, a navigation, and React's development double-mount,
    which mounts, joins, unmounts and leaves inside a single frame. Only the
    first two are the session being over, and only they set this flag.

    So an ambiguous leave only **pauses** the notes, which a rejoin resumes;
    nothing is lost either way, because a host who really has gone is caught
    by the deadline a few minutes past the end of the session
    (`notes._ensure_notes_progress`). Getting this wrong is not a small
    thing: when every leave ended a run, a reload two seconds in wrote the
    session up before a word had been recorded.

    Every call is swallowed into a log line: leaving a room must always
    succeed.
    """
    if ended:
        notes.maybe_stop_notes(session, user)
    else:
        notes.maybe_pause_notes(session, user, reason="the host's browser disconnected")
    return None


def set_audience_access(*, session, user, access):
    """Opens the floor to the room, or takes it back.

    Written to the session rather than announced over the call, because the
    token is what decides who may speak and the server is what signs tokens:
    a student who arrives after the floor was opened has to turn up able to
    speak, and one who misses the announcement still gets the right token the
    next time their client asks.
    """
    if not is_host(user, session):
        raise SessionAccessDeniedError(
            "Only an admin can decide who may speak in a War Room Live session."
        )

    choices = LiveSession.AudienceAccess.values
    if access not in choices:
        raise SessionNotJoinableError(
            f"Audience access must be one of: {', '.join(choices)}."
        )

    if session.audience_access != access:
        session.audience_access = access
        session.save(update_fields=["audience_access", "updated_at"])
    return session
