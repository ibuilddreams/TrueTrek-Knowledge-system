"""War Room Live — scheduling state, RSVPs and gated join links.

The audio runs on an external platform, so the two things this module owns
are (a) deriving a session's live state from the clock instead of storing it,
and (b) deciding when the join URL may be handed to a student.
"""

from datetime import timedelta

from django.db import IntegrityError, transaction
from django.db.models import Count, DateTimeField, ExpressionWrapper, F, Q, Value
from django.utils import timezone

from .exceptions import SessionClosedError, SessionFullError, SessionNotJoinableError
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
    """A student may join only while the session is live *and* there is
    actually a link to send them to."""
    return bool(session.meeting_url) and live_state(session, now) == LIVE


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
        .annotate(rsvp_count=Count("rsvps", distinct=True), ends_at=_ENDS_AT)
        .filter(ends_at__gte=_list_cutoff())
        .order_by("scheduled_at")
    )


def past_sessions():
    """Everything that has finished, plus every cancelled session regardless
    of date — a cancelled session must stay visible to the students who
    RSVP'd, and it has no future worth listing under "upcoming"."""
    return (
        LiveSession.objects.annotate(
            rsvp_count=Count("rsvps", distinct=True), ends_at=_ENDS_AT
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

        if session.capacity is not None:
            if SessionRSVP.objects.filter(session=session).count() >= session.capacity:
                raise SessionFullError("This session is full. Check back for the next one.")

        try:
            return SessionRSVP.objects.create(session=session, student=student)
        except IntegrityError:
            # Lost a race against the same student's concurrent RSVP — the
            # unique constraint did its job; return what the winner created.
            return SessionRSVP.objects.get(session=session, student=student)


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
    rsvps = SessionRSVP.objects.filter(student=student)

    return {
        "upcoming_count": upcoming.count(),
        "my_rsvp_count": rsvps.filter(session__in=upcoming.values("pk")).count(),
        "sessions_attended": rsvps.filter(attended=True).count(),
        "recordings_available": past_sessions()
        .exclude(recording_url__isnull=True)
        .exclude(recording_url="")
        .count(),
    }
