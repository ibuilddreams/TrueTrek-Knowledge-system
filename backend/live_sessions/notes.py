"""AI meeting notes for a War Room Live session.

Something listens to the session, an AI model turns the transcript into
notes, and everybody who was in the room — or who said they would be — gets
them in the portal, as a PDF and by email.

**There is one source of that audio and it is the room's own.** The host's
browser mixes everybody who is speaking, records the session in segments and
posts them to this server, where they are kept as ordinary Django files under
`MEDIA_ROOT/live-session-audio/` (`LiveSessionNotesAudio`) and read by the
model. No transcription product, no bucket, no second Agora bill: a
deployment with an AI key and nothing else can write a session up.

This is the local half of `class_sessions`' notes, which is the richer
feature because a class can also be written up from Agora's own transcription
service. The pipeline from the transcript onwards is *literally* the same
code — `class_sessions.notes_prompt`, `notes_validators` and `notes_document`
are shared, and each kind of session describes itself to them through its own
`notes_context()`. What is deliberately **not** shared is the orchestration:
a class resolves its roster from a course's enrolments, is hosted by a
teacher and can be filmed, while a War Room Live session is a drop-in
addressed to everybody, hosted by an admin, and never filmed. Collapsing the
two would mean each pretending to be the other at every step.

Five things in here are load-bearing, and all five are the reasons
`class_sessions` gives for them:

* **There is no third party, so there is nothing to poll.** The row *is* the
  instruction: a run in TRANSCRIBING means "record this session", and the
  capturing browser acts on it. `start_notes` spawns no thread.

* **Exactly one browser captures.** The run's `started_by` is the nominated
  capturer and `notes_capture_config` tells every client which one of them it
  is, so a second admin opening the same room records nothing.

* **The server numbers the segments in arrival order**, and `client_key`
  makes an upload idempotent — a capturer that crashed and came back would
  otherwise restart its own numbering and overwrite the first half of the
  session, and a retried upload would store the same five minutes twice.

* **The final upload, not the stop button, starts the write-up.** At the
  moment the host presses stop the audio the notes need is still going up,
  which is why `stop_notes` only parks the run and why the browser flushes
  before it calls stop or leaves. The stop button is a **pause**: a session
  taken in two stretches comes out as one set of notes covering both.

* **Each segment keeps its own transcript**, so a write-up adopted after a
  restart resumes at the first segment nobody has read, and one segment the
  model refuses is stepped over rather than losing the hour.
"""

import base64
import io
import json
import logging
import secrets
import threading
import time
from datetime import timedelta

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMessage
from django.db import IntegrityError, close_old_connections, transaction
from django.db.models import Max
from django.utils import timezone

from ai_courses.providers import get_provider
from ai_courses.providers.base import ProviderError, ProviderTransportError
from class_sessions import notes_audio, notes_document, notes_prompt, notes_validators
from notifications.services import create_notifications_for_users

from . import services
from .exceptions import (
    NotesNotConfiguredError,
    NotesUnavailableError,
    SessionAccessDeniedError,
)
from .models import (
    LiveSession,
    LiveSessionNotes,
    LiveSessionNotesAudio,
    SessionRSVP,
)

logger = logging.getLogger(__name__)

_AVAILABLE = LiveSessionNotes.NotesStatus.AVAILABLE

# Runs this process has a thread behind. Not the same guard as the one-run-
# per-session database constraint: that stops two *runs* existing for one
# session, while this stops two *threads* working the same row after an
# orphan has been adopted.
_monitored_ids = set()
_monitored_lock = threading.Lock()

# How long after a run stops listening the server waits for the last segment
# to arrive before giving up on it. Generous, because the segment being
# uploaded is the one somebody just finished talking over — and because the
# cost of waiting is a progress badge, while the cost of not waiting is the
# end of the session missing from its notes.
UPLOAD_GRACE_SECONDS = 3 * 60

# How long one segment's transcription may take. Longer than the write-up's
# own call: a model reading ten minutes of audio is doing more work than one
# reading the text it produced, and nobody is watching either.
TRANSCRIBE_TIMEOUT_SECONDS = 10 * 60

# How long the write-up itself may take, and how a transport failure is
# treated. Only `ProviderTransportError` is retried, matching
# `brand_validator._call_provider`: a request that never got a verdict is free
# to send again, while a rejected one or a spent quota would bill the same
# failure twice.
SUMMARY_TIMEOUT_SECONDS = 240
MAX_TRANSPORT_ATTEMPTS = 3
TRANSPORT_BACKOFF_SECONDS = (5, 15)

# How long past the end of a session a run that nobody closed is left alone
# before the deadline finishes it.
STOP_MARGIN_MINUTES = 5

# How long a write-up may be quiet before another request decides it has been
# orphaned by a restart and adopts it.
#
# **Derived, not chosen.** A run makes one model call per segment and only
# refreshes its heartbeat between them, so the quietest a *healthy* run can be
# is one segment stalling for its full timeout and every retry. A window
# shorter than the work it is watching does not recover an orphan — it starts
# a second thread transcribing the same session beside the first and bills the
# model twice for it.
ORPHAN_AFTER_SECONDS = (
    TRANSCRIBE_TIMEOUT_SECONDS * MAX_TRANSPORT_ATTEMPTS
    + sum(TRANSPORT_BACKOFF_SECONDS)
    # Enough slack that a run which really is dead is still picked up before
    # anybody goes looking for notes that never arrived.
    + 10 * 60
)

# How much of the previous segment the model is shown as context for the next
# one. A session is cut on a timer, so a sentence really does straddle two
# recordings; this is enough to hear where the thread was, and far too little
# to be worth repeating.
TAIL_CHARS = 600

# The transcript as much of it as the model is shown. Well under the context
# window, because the notes themselves and the schema have to fit beside it.
MAX_TRANSCRIPT_CHARS = 200_000


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


def _summariser_configured():
    """Whether there is an AI provider ready to write the notes up.

    Checked before a run is ever created rather than at the end, because a
    session recorded with nothing to summarise it is an hour of audio nobody
    can use: the host is better told before the session that notes are
    unavailable than after it that they failed.
    """
    if getattr(settings, "AI_PROVIDER", "") == "gemini":
        return bool((getattr(settings, "GEMINI_API_KEY", "") or "").strip())
    # Any other provider validates its own configuration when it is
    # constructed; `get_provider()` raises there rather than lying here.
    return True


def is_notes_configured():
    """Whether this server can write a session up at all.

    Asked once per row of every listing, so it stays a pure settings read and
    complains nowhere — the logging belongs on the request that was actually
    refused (`_assert_configured`), exactly as `services.is_agora_configured`
    is quiet and `services._agora_credentials` is not.
    """
    if not getattr(settings, "LIVE_SESSION_NOTES_ENABLED", True):
        return False
    return _summariser_configured()


def _assert_configured():
    if not getattr(settings, "LIVE_SESSION_NOTES_ENABLED", True):
        raise NotesNotConfiguredError(
            "Meeting notes are switched off on this server."
        )
    if not _summariser_configured():
        logger.error(
            "live_sessions: no AI provider is configured — no session can be "
            "written up until one is."
        )
        raise NotesNotConfiguredError(
            "Meeting notes are not configured on this server yet."
        )


def _audio_max_bytes():
    # Shared with the live classes on purpose: this is a limit on what one
    # browser may post in one request, and the two recorders are the same
    # recorder. Two numbers that had to stay in step would not.
    return max(1, int(getattr(settings, "CLASS_NOTES_AUDIO_MAX_MB", 40))) * 1024 * 1024


# ---------------------------------------------------------------------------
# Reading the current run
# ---------------------------------------------------------------------------


def active_notes(session):
    """The notes run this session has going right now, if any."""
    return (
        session.notes_runs.filter(status__in=LiveSessionNotes.IN_FLIGHT_STATUSES)
        .order_by("-created_at")
        .first()
    )


def latest_available_notes(session):
    """The finished notes somebody reads. The newest wins: a session written
    up twice shows the last complete write-up."""
    return (
        session.notes_runs.filter(status=_AVAILABLE)
        .exclude(summary="")
        .order_by("-created_at")
        .first()
    )


def notes_capture_config(session, running):
    """What a client needs in order to record this session.

    Carried on the join payload and on `notes_state` rather than hard-coded in
    the browser, so the recording settings live beside the server that has to
    accept the result — a bitrate the server would refuse as too large is not
    a decision to make in two places. `capturer_id` is the whole of the "only
    one browser records" rule: every client is told which one of them it is.

    Keyed on *listening*, not on the run existing: a run the host paused
    nominates nobody and carries no id, which is what makes the capturing
    browser stop recording — and start again, into the same run, the moment
    the host presses the button and `capturer_id` comes back.
    """
    listening = bool(running and running.is_listening)
    return {
        "mode": "local",
        "run_id": running.pk if listening else None,
        # The person whose browser should be recording. `None` while nothing
        # is running, and never a student: a run is only ever started by a
        # host.
        "capturer_id": running.started_by_id if listening else None,
        "segment_seconds": max(
            30, int(getattr(settings, "CLASS_NOTES_AUDIO_SEGMENT_SECONDS", 240))
        ),
        "audio_bitrate": max(
            8000, int(getattr(settings, "CLASS_NOTES_AUDIO_BITRATE", 24000))
        ),
        "max_bytes": _audio_max_bytes(),
        "mime_types": list(notes_audio.PREFERRED_RECORDING_TYPES),
    }


# ---------------------------------------------------------------------------
# Starting, pausing and finishing
# ---------------------------------------------------------------------------


def start_notes(*, session, user=None, now=None):
    """Begins writing this session up, or resumes the run already going.

    `session.takes_notes` is deliberately **not** checked. It says whether a
    session starts taking notes by itself when its host opens the room
    (`maybe_start_notes`), not whether notes are permitted at all — an admin
    who left the box unticked must still be able to press the button during
    the session, and one who changes their mind halfway through must be able
    to write up the rest of it.

    Idempotent by database constraint rather than by checking first: two
    admins arriving in the same second would otherwise create two runs, each
    writing up half the session and replacing the other on the card.
    """
    now = now or timezone.now()

    if session.status == LiveSession.SessionStatus.CANCELLED:
        raise NotesNotConfiguredError("This session was cancelled.")

    # Checked before the row is written so a misconfigured server leaves no
    # FAILED rows behind on every join.
    _assert_configured()

    existing = active_notes(session)
    if existing is not None:
        if existing.is_paused:
            # Resuming, not starting: everything recorded before the host
            # paused belongs to this run, and a session taken in two
            # stretches has to come out as one set of notes covering both.
            LiveSessionNotes.objects.filter(
                pk=existing.pk, status=LiveSessionNotes.NotesStatus.PAUSED
            ).update(
                status=LiveSessionNotes.NotesStatus.TRANSCRIBING,
                stopped_at=None,
                # The browser that resumes is the one that asked to: a host
                # who reloaded, or a colleague taking over a room the first
                # admin walked out of, has to become the capturer or nothing
                # records the rest of the session.
                started_by=user if (user is not None and user.is_authenticated) else None,
                updated_at=timezone.now(),
            )
            existing.refresh_from_db()
            logger.info(
                "live_sessions: resuming notes run %s on session %s",
                existing.pk,
                session.pk,
            )
            return existing
        _ensure_notes_progress(existing)
        return existing

    try:
        with transaction.atomic():
            run = LiveSessionNotes.objects.create(
                session=session,
                started_by=user if (user is not None and user.is_authenticated) else None,
                # Listening from the instant it exists: the row is what tells
                # the host's browser to start recording, so there is no
                # "being admitted" stage to sit in.
                status=LiveSessionNotes.NotesStatus.TRANSCRIBING,
                started_at=now,
            )
    except IntegrityError:
        # Lost the race to the partial unique constraint — the other
        # request's run is the one that counts.
        existing = active_notes(session)
        if existing is not None:
            return existing
        raise

    logger.info(
        "live_sessions: taking notes on session %s (notes run %s)", session.pk, run.pk
    )
    # Nothing to spawn and nothing to call: the capturing browser sees this
    # row and starts recording.
    return run


def stop_notes(*, session, user=None, reason=""):
    """The host's stop button — a **pause**, not the end of the notes.

    The audio is ours and pausing costs nothing, so stopping mid-session is a
    bookmark: the run stays this session's run, what was recorded stays on
    it, and pressing the button again resumes the same row. A session taken
    in two stretches comes out as one set of notes covering both, which is
    what somebody who stopped while the room chatted expects — two runs would
    write up the second stretch and replace the first on the card.
    """
    run = active_notes(session)
    if run is None:
        return None

    if not run.is_listening:
        # Already paused, or already past the point a stop would change
        # anything.
        _ensure_notes_progress(run)
        return run
    return _pause_notes(run, reason=reason)


def finish_notes(*, session, user=None, reason=""):
    """Ends this session's notes for good and starts the write-up.

    The counterpart to `stop_notes`: that is a host pausing inside a session
    that is still going, this is the session being over — the host leaving,
    the room closing itself at the advertised end, or the deadline catching a
    laptop that was simply shut. It is the only thing that turns a run into
    notes, which is why a paused run is finished by it as readily as a
    listening one: the twenty minutes already recorded are still a session.
    """
    run = active_notes(session)
    if run is None:
        return None
    return _finish_run(run, reason=reason)


def maybe_start_notes(session, user, now=None):
    """Starts the notes when the host opens the room.

    Called from inside `services.issue_join_credentials`, which is why every
    failure is swallowed into a log line: a room must open even when the AI
    provider is down, out of quota or unconfigured. A student joining never
    reaches this — a session is written up because the person running it is
    in it.
    """
    if not services.is_host(user, session) or not session.takes_notes:
        return None
    if not is_notes_configured():
        return None

    try:
        return start_notes(session=session, user=user, now=now)
    except (NotesNotConfiguredError, NotesUnavailableError) as exc:
        logger.warning(
            "live_sessions: could not start notes on session %s: %s", session.pk, exc
        )
    except Exception:  # noqa: BLE001 - notes must never fail a session
        logger.exception(
            "live_sessions: unexpected error starting notes on session %s", session.pk
        )
    return None


def maybe_pause_notes(session, user, reason="the host left"):
    """Parks the notes when the host's browser goes quiet without saying why.

    A reload, a navigation or a dropped connection all arrive here, and none
    of them is the session being over — so the run is parked rather than
    written up, and the rejoin that follows a moment later picks it straight
    back up with everything recorded so far still on it. A host who really
    has gone leaves it parked until the session's own deadline finishes it.
    """
    if not services.is_host(user, session):
        return None
    try:
        run = active_notes(session)
        if run is None or not run.is_listening:
            return None
        return _pause_notes(run, reason=reason)
    except Exception:  # noqa: BLE001 - leaving a room must always succeed
        logger.exception(
            "live_sessions: unexpected error pausing notes on session %s", session.pk
        )
    return None


def maybe_stop_notes(session, user, reason="the host left"):
    """Ends the notes when the host leaves — the end of the session.

    `finish_notes`, never `stop_notes`: the host walking out is not a pause,
    and a run left parked would never become notes. A student leaving changes
    nothing. If the host's browser never says goodbye, the deadline in
    `_ensure_notes_progress` catches it.
    """
    if not services.is_host(user, session):
        return None
    try:
        return finish_notes(session=session, user=user, reason=reason)
    except Exception:  # noqa: BLE001 - leaving a room must always succeed
        logger.exception(
            "live_sessions: unexpected error stopping notes on session %s", session.pk
        )
    return None


def set_capture_preference(session, *, takes_notes):
    """Remembers that the host turned the notes on or off here.

    `takes_notes` is *this session's* switch, not a permission: it decides
    whether a session starts writing itself up the moment its host opens the
    room. The admin sets it when they schedule the session and can change
    their mind inside it, and pressing the button in the control bar is
    exactly that.

    Writing it down is also what stops paused notes from restarting by
    themselves: `maybe_start_notes` runs inside *every* host join, and a room
    re-joins on its own whenever Agora renews a token.
    """
    if session.takes_notes != bool(takes_notes):
        session.takes_notes = bool(takes_notes)
        session.save(update_fields=["takes_notes", "updated_at"])
    return session


# ---------------------------------------------------------------------------
# The audio arriving
# ---------------------------------------------------------------------------

# How many speaker samples one segment may carry. The browser samples a few
# times a second and only writes a line when the speaker changes, so a busy
# four-minute segment is a few dozen — a ceiling on what one request can put
# in a JSON column, not a budget anybody should be near.
MAX_SPEAKER_SAMPLES = 2000


def _clean_speaker_timeline(raw):
    """The browser's "who was speaking when", trusted no further than it needs
    to be.

    Shape only: a list of `{at: seconds, uid: user id}`. Whether the uid
    belongs to somebody who was actually in the room is settled later, when it
    is resolved against the roster (`_speaker_names`) — a uid nobody
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
    """Takes one segment of a session's audio from the browser recording it.

    Everything that could let two recordings of one hour end up in one
    transcript is closed here rather than trusted to the client: the index is
    assigned **by this server in arrival order**, `client_key` makes the
    upload idempotent, and only the run's nominated capturer is accepted.

    `end` is the browser saying "the session is over" — the room closing, the
    host leaving — and is what actually starts the write-up. It is **not** set
    when the host merely presses stop: that is a pause, the session is still
    going, and the segment being uploaded is simply the last of that stretch.
    """
    if not services.is_host(user, session):
        raise SessionAccessDeniedError(
            "Only a host can send the audio a session's notes are written from."
        )

    run = active_notes(session)
    statuses = LiveSessionNotes.NotesStatus
    if run is None or run.status not in (
        statuses.TRANSCRIBING,
        # PAUSED and COLLECTING are both accepted because the segment in
        # flight when the host pressed stop — or when the room closed — is
        # the end of what was just being said. Refusing it would lose
        # precisely the minutes nobody wants to lose.
        statuses.PAUSED,
        statuses.COLLECTING,
    ):
        raise NotesUnavailableError("This session isn't taking notes right now.")

    if run.started_by_id and run.started_by_id != user.pk:
        raise NotesUnavailableError(
            "Another device is already recording this session for its notes."
        )

    if upload is None:
        raise NotesUnavailableError("No audio was attached to that upload.")

    # Refused at the door rather than stored and found unreadable when the
    # session is over and everybody has gone home.
    media_type, extension = notes_audio.resolve(
        getattr(upload, "content_type", "") or ""
    )

    size = int(getattr(upload, "size", 0) or 0)
    max_bytes = _audio_max_bytes()
    if size > max_bytes:
        raise NotesUnavailableError(
            "That piece of the session is too large to accept "
            f"({size // (1024 * 1024)} MB; the limit is {max_bytes // (1024 * 1024)} MB)."
        )
    if size < notes_audio.MIN_SEGMENT_BYTES:
        # An empty container and nothing else — a recorder stopped in the same
        # second it started. Not an error, and not something to keep, but a
        # closing one still has to end the run.
        logger.info(
            "live_sessions: ignoring an empty audio segment for notes run %s", run.pk
        )
        return _finish_run(run, reason="the room closed") if end else run

    key = (str(client_key).strip() or secrets.token_hex(8))[:64]

    with transaction.atomic():
        # Locking the run, not the segment table: this is what serialises
        # index assignment between two uploads arriving together.
        locked = LiveSessionNotes.objects.select_for_update().filter(pk=run.pk).first()
        if locked is None:
            raise NotesUnavailableError("This session isn't taking notes right now.")

        existing = LiveSessionNotesAudio.objects.filter(
            notes=locked, client_key=key
        ).first()
        if existing is None:
            highest = LiveSessionNotesAudio.objects.filter(notes=locked).aggregate(
                top=Max("index")
            )["top"]
            segment = LiveSessionNotesAudio(
                notes=locked,
                index=0 if highest is None else highest + 1,
                client_key=key,
                content_type=notes_audio.base_type(upload.content_type),
                size_bytes=size,
                duration_seconds=duration_seconds,
                speakers=_clean_speaker_timeline(speakers),
            )
            filename = (
                f"live-{session.pk}-notes-{locked.pk}-"
                f"{segment.index:03d}-{secrets.token_hex(6)}.{extension}"
            )
            segment.file.save(filename, upload, save=False)
            segment.save()
            logger.info(
                "live_sessions: notes run %s took segment %s (%s bytes, %s)",
                locked.pk,
                segment.index,
                size,
                media_type,
            )
        else:
            logger.info(
                "live_sessions: notes run %s already had segment %s — upload ignored",
                locked.pk,
                existing.index,
            )

    run.refresh_from_db()
    if end:
        return _finish_run(run, reason="the room closed")

    # A heartbeat as well as a save: `_ensure_notes_progress` tells a browser
    # that is still recording from one that stopped answering by how long it
    # has been since the run last moved.
    _touch_notes(run)
    return run


# ---------------------------------------------------------------------------
# Moving a run along
# ---------------------------------------------------------------------------


def _spawn(target, *args):
    """A daemon thread, the same shape `ai_courses` and `brand_validator`
    use — there is still no Celery or Redis in this codebase."""
    thread = threading.Thread(target=target, args=args, daemon=True)
    thread.start()
    return thread


def _mark_monitored(notes_id):
    with _monitored_lock:
        if notes_id in _monitored_ids:
            return False
        _monitored_ids.add(notes_id)
        return True


def _release_monitored(notes_id):
    with _monitored_lock:
        _monitored_ids.discard(notes_id)


def _touch_notes(run):
    """Refreshes the row's heartbeat so the orphan detector can tell a live
    thread from a dead one."""
    run.save(update_fields=["updated_at"])


def _pause_notes(run, *, reason=""):
    """Parks a run between stretches of one session.

    Nothing is written up and nothing is thrown away: the segments already
    uploaded stay on the row, the run stays this session's run (PAUSED is in
    `IN_FLIGHT_STATUSES`, so the constraint still allows only one), and
    `start_notes` picks it straight back up. `stopped_at` is deliberately left
    alone — the run has not stopped, and a duration measured from a pause
    would be wrong for the stretch that followed it.
    """
    LiveSessionNotes.objects.filter(
        pk=run.pk, status__in=list(LiveSessionNotes.LISTENING_STATUSES)
    ).update(status=LiveSessionNotes.NotesStatus.PAUSED, updated_at=timezone.now())
    run.refresh_from_db()
    logger.info(
        "live_sessions: notes run %s on session %s paused%s",
        run.pk,
        run.session_id,
        f" ({reason})" if reason else "",
    )
    return run


def _finish_run(run, *, reason=""):
    """Ends a run for good and, if there is anything to read, writes it up.

    Reached from every way a session can be over — the host leaving, the room
    closing itself at the advertised end, the closing upload, and the deadline
    that catches a laptop simply shut — so it has to be safe to call twice and
    safe to call on a run in any state. A run already past COLLECTING is left
    to the thread that owns it.

    A run with no audio at all is not failed here: the segment in flight when
    the room closed is still on its way, and `_ensure_notes_progress` gives it
    `UPLOAD_GRACE_SECONDS` before deciding it never arrives.
    """
    statuses = LiveSessionNotes.NotesStatus
    if run.status in (statuses.AVAILABLE, statuses.FAILED, statuses.SUMMARIZING):
        return run

    if run.status != statuses.COLLECTING:
        LiveSessionNotes.objects.filter(
            pk=run.pk,
            status__in=[*LiveSessionNotes.LISTENING_STATUSES, statuses.PAUSED],
        ).update(
            status=statuses.COLLECTING,
            stopped_at=timezone.now(),
            updated_at=timezone.now(),
        )
        run.refresh_from_db()
        logger.info(
            "live_sessions: notes run %s on session %s is finishing%s",
            run.pk,
            run.session_id,
            f" ({reason})" if reason else "",
        )

    if LiveSessionNotesAudio.objects.filter(notes=run).exists():
        return _begin_summary(run)
    return run


def _begin_summary(run):
    """Moves a run on to the write-up and puts a thread behind it.

    Under a lock and spawning at most once, because the things that end a
    session — the browser's closing segment, the host's leave ping, the room
    closing itself at the advertised end, and the deadline that catches a
    laptop simply shut — can all arrive within a second of each other, and two
    threads reading the same audio would bill the model twice for one session.
    """
    statuses = LiveSessionNotes.NotesStatus
    with transaction.atomic():
        row = LiveSessionNotes.objects.select_for_update().filter(pk=run.pk).first()
        if row is None or row.status in (statuses.AVAILABLE, statuses.FAILED):
            return row
        # Whether *this* call is the one that started the write-up. The row,
        # locked, is the only thing that can answer that across workers — the
        # in-process `_monitored_ids` set cannot, and two gunicorn workers both
        # deciding to write a session up would pay the model twice for it.
        moved = row.status != statuses.SUMMARIZING
        if moved:
            row.status = statuses.SUMMARIZING
            row.stopped_at = row.stopped_at or timezone.now()
            row.save(update_fields=["status", "stopped_at", "updated_at"])

    if moved and _mark_monitored(row.pk):
        logger.info("live_sessions: writing up notes run %s", row.pk)
        _spawn(_run_notes_safe, row.pk)
    return row


def _ensure_notes_progress(run):
    """The backstop for a session whose host simply closed their laptop.

    A run has no thread while it is listening — the browser is the only thing
    doing anything — so this is where a run that will never hear from that
    browser again is finished off, and where a write-up orphaned by a restart
    is adopted. There is no scheduler in this codebase, so the next request
    that asks about the session is what moves it along.

    Deliberately unhurried at every step. A listening run is left alone until
    the session's own end has been and gone; a finished one is given
    `UPLOAD_GRACE_SECONDS` for its last segment to arrive; and a run that was
    mid-write-up is only adopted once it has been quiet far longer than a
    model call takes.

    The one place it does not wait is a run the host had **paused**. The
    browser stopped and flushed when they pressed the button, so there is
    nothing on its way up and the grace would only hold back notes that are
    already complete.
    """
    statuses = LiveSessionNotes.NotesStatus
    now = timezone.now()

    if run.status == statuses.SUMMARIZING:
        if (now - run.updated_at).total_seconds() < ORPHAN_AFTER_SECONDS:
            return False
        if not _mark_monitored(run.pk):
            return False
        logger.info("live_sessions: adopting orphaned notes run %s", run.pk)
        _spawn(_run_notes_safe, run.pk)
        return True

    # Whether anything could still be on its way up. A paused run has no
    # recorder behind it, so there is no in-flight segment to wait for.
    nothing_in_flight = run.is_paused

    if run.is_listening or run.is_paused:
        # A paused run is finished by the same deadline as a listening one.
        # The host stopped mid-session and then the session ended without
        # anybody saying so — the twenty minutes already recorded are still a
        # session, and leaving them parked forever would mean notes that never
        # arrive and a row nothing can clear.
        _, _, ends_at = services.session_window(run.session)
        deadline = ends_at + timedelta(
            minutes=services.LIVE_GRACE_MINUTES_AFTER + STOP_MARGIN_MINUTES
        )
        if now < deadline:
            return False
        logger.info(
            "live_sessions: notes run %s outlived its session — finishing it", run.pk
        )
        LiveSessionNotes.objects.filter(
            pk=run.pk,
            status__in=[*LiveSessionNotes.LISTENING_STATUSES, statuses.PAUSED],
        ).update(status=statuses.COLLECTING, stopped_at=now, updated_at=now)
        run.refresh_from_db()
        # Fall through: the grace below starts from this moment, so the last
        # segment still in flight gets its chance to land.

    if run.status == statuses.COLLECTING:
        if (
            not nothing_in_flight
            and (now - run.updated_at).total_seconds() < UPLOAD_GRACE_SECONDS
        ):
            return False
        if LiveSessionNotesAudio.objects.filter(notes=run).exists():
            logger.info(
                "live_sessions: notes run %s stopped waiting for its last segment "
                "and is writing up what arrived",
                run.pk,
            )
            _begin_summary(run)
            return True
        _fail_notes(
            run.pk,
            "No audio from this session ever reached the server, so there was "
            "nothing to write up.",
        )
        return True

    return False


def _fail_notes(notes_id, message):
    """Gives up on a run, with a reason, and tells the host — once.

    The notification matters more than it looks. A failed run is neither
    running nor available, so it leaves no trace anywhere a host looks: no
    card button, no reader, nothing on the session at all. Somebody who took
    notes on an hour and got silence has no way to find out whether they are
    still coming, and the first thing they do is take notes on another
    session the same way.

    Only the host. The reason names providers, quotas and files, and the
    students in the room can do nothing with any of it.
    """
    updated = LiveSessionNotes.objects.filter(pk=notes_id).exclude(
        status__in=[_AVAILABLE, LiveSessionNotes.NotesStatus.FAILED]
    ).update(
        status=LiveSessionNotes.NotesStatus.FAILED,
        error_message=str(message)[:500],
        updated_at=timezone.now(),
    )
    # Not the first failure of this run: the reason already on the row is the
    # specific one, and this is the generic unwinding behind it.
    if not updated:
        return

    run = (
        LiveSessionNotes.objects.select_related("session")
        .filter(pk=notes_id)
        .first()
    )
    if run is None:
        return

    recipients = [pk for pk in {run.started_by_id, run.session.created_by_id} if pk]
    if not recipients:
        return

    try:
        create_notifications_for_users(
            recipients,
            verb="live_session_notes_failed",
            title=f"Session notes couldn't be written: {run.session.title}",
            message=(
                f"War Room Live — {str(message)[:200]} The people who were in the "
                "room haven't been told."
            ),
            related_object_type="live_session",
            related_object_id=run.session_id,
        )
    except Exception:  # noqa: BLE001 - a failed run must not fail twice
        logger.exception(
            "live_sessions: could not tell the host that notes run %s failed", notes_id
        )


# ---------------------------------------------------------------------------
# The write-up
# ---------------------------------------------------------------------------


def _run_notes_safe(notes_id):
    """Thread entrypoint: transcribe, summarise, publish.

    Every exit path leaves the row in a state somebody can act on — a run
    stuck on SUMMARIZING shows a room a spinner forever.
    """
    close_old_connections()
    try:
        _write_up(notes_id)
    except Exception as exc:  # noqa: BLE001 - see docstring
        logger.exception("live_sessions: notes run %s crashed", notes_id)
        _fail_notes(notes_id, str(exc))
    finally:
        _release_monitored(notes_id)
        close_old_connections()


def _write_up(notes_id):
    """The whole second half of a run, resumable at every step.

    The transcript is written to the row as soon as it is assembled, so a
    process that dies between transcribing and summarising resumes at the
    model's second call rather than paying for the first one again.
    """
    run = LiveSessionNotes.objects.select_related("session").get(pk=notes_id)
    if run.status == _AVAILABLE:
        return run

    transcript_text = run.transcript
    if not transcript_text:
        transcript_text, problem = _transcribe_audio(run)
        if not transcript_text:
            logger.info("live_sessions: notes run %s has nothing to write up", run.pk)
            _fail_notes(
                notes_id,
                problem
                or "Nothing was transcribed from this session — no one was heard "
                "speaking.",
            )
            return None
        LiveSessionNotes.objects.filter(pk=notes_id).exclude(status=_AVAILABLE).update(
            transcript=transcript_text, updated_at=timezone.now()
        )

    run.refresh_from_db()
    payload = _summarize(run, transcript_text)
    return _write_notes(notes_id, payload)


def _speaker_names(session, timeline):
    """The browser's uid timeline, as `[(seconds, name), ...]`.

    The roster is the authority on who those uids are — the same map the
    voices in the room are labelled from — and a uid it does not recognise is
    dropped rather than turned into a number the model would print as a name.
    That is the whole safeguard: a name reaches the transcript only if the
    server can say whose it is.
    """
    if not timeline:
        return []
    names = {
        str(person["uid"]): person["name"] for person in services.get_roster(session)
    }
    resolved = []
    for entry in timeline:
        name = names.get(str(entry.get("uid")))
        if name:
            resolved.append((entry.get("at", 0), name))
    return resolved


def _transcribe_audio(run):
    """Reads every segment of this session, in order, into one transcript.

    Returns `(transcript, problem)`. A segment the model refuses is logged and
    **skipped rather than fatal**: losing ten minutes out of an hour is worth
    far more than losing the hour, and the one case where that judgement would
    mislead — every segment failing — comes back as an empty transcript with
    the reason attached, so the host is told what broke rather than that
    nobody spoke.

    A segment that produced nothing is still marked read, so a resumed run
    does not pay to listen to the same silence again. A segment the *provider*
    refused is deliberately left unmarked: that is the one failure worth
    another attempt if this run is ever picked up again.
    """
    segments = list(run.audio_segments.all())
    if not segments:
        return "", ""

    parts = []
    problem = ""
    for position, segment in enumerate(segments):
        if segment.transcribed_at is not None:
            if segment.transcript:
                parts.append(segment.transcript)
            continue

        tail = parts[-1][-TAIL_CHARS:] if parts else ""
        try:
            text = _transcribe_segment(
                run,
                segment,
                position=position,
                total=len(segments),
                previous_tail=tail,
            )
        except (ProviderError, ProviderTransportError) as exc:
            logger.warning(
                "live_sessions: could not transcribe segment %s of notes run %s: %s",
                segment.index,
                run.pk,
                exc,
            )
            problem = f"Part of this session could not be transcribed: {exc}"
            continue

        segment.transcript = text
        segment.transcribed_at = timezone.now()
        segment.save(update_fields=["transcript", "transcribed_at", "updated_at"])
        # The run's heartbeat, so a long session is never mistaken for a dead
        # thread while it is genuinely being read.
        _touch_notes(run)
        if text:
            parts.append(text)

    transcript_text = "\n".join(part for part in parts if part).strip()
    logger.info(
        "live_sessions: notes run %s read %s segments into %s characters",
        run.pk,
        len(segments),
        len(transcript_text),
    )
    return transcript_text, ("" if transcript_text else problem)


def _transcribe_segment(run, segment, *, position, total, previous_tail):
    """One segment of audio → what was said in it.

    The file is sent as an inline part, the same mechanism `brand_validator`
    uses for a media kit — which is why segments exist at all: a session
    arrives in pieces small enough to send that way however long it ran.

    Only `ProviderTransportError` is retried: a request that never got a
    verdict is free to send again, while a rejected one or a spent quota would
    bill the same failure twice.
    """
    try:
        with segment.file.open("rb") as handle:
            data = handle.read()
    except (FileNotFoundError, OSError, ValueError):
        # The row says there is audio and the disk disagrees — a restored
        # database against a fresh media volume, most often. The rest of the
        # session is still perfectly readable.
        logger.warning(
            "live_sessions: audio segment %s of notes run %s is missing from disk",
            segment.index,
            run.pk,
        )
        return ""

    if len(data) < notes_audio.MIN_SEGMENT_BYTES:
        return ""

    media_type, _ = notes_audio.resolve(segment.content_type)
    prompt = notes_prompt.build_transcript_prompt(
        context=run.session.notes_context(),
        part_index=position,
        part_count=total,
        previous_tail=previous_tail,
        speakers=_speaker_names(run.session, segment.speakers),
    )

    provider = get_provider()
    result = None
    for attempt in range(MAX_TRANSPORT_ATTEMPTS):
        try:
            result = provider.generate_course(
                prompt,
                notes_prompt.TRANSCRIPT_SCHEMA,
                TRANSCRIBE_TIMEOUT_SECONDS,
                files=[
                    {
                        "mime_type": media_type,
                        "data_base64": base64.b64encode(data).decode("ascii"),
                    }
                ],
            )
            break
        except ProviderTransportError as exc:
            if attempt + 1 >= MAX_TRANSPORT_ATTEMPTS:
                raise
            backoff = TRANSPORT_BACKOFF_SECONDS[
                min(attempt, len(TRANSPORT_BACKOFF_SECONDS) - 1)
            ]
            logger.warning(
                "live_sessions: segment %s of notes run %s hit a transport error "
                "(%s) — retrying in %ss",
                segment.index,
                run.pk,
                exc,
                backoff,
            )
            time.sleep(backoff)

    try:
        answer = json.loads(result.text)
    except (TypeError, ValueError):
        # Not fatal for the session: the model answered with something that is
        # not the schema it was given, and the next segment may well be fine.
        logger.warning(
            "live_sessions: segment %s of notes run %s came back unreadable",
            segment.index,
            run.pk,
        )
        return ""

    if not isinstance(answer, dict) or answer.get("has_speech") is False:
        return ""
    return str(answer.get("transcript") or "").strip()


def _trim_transcript(text):
    """The transcript as much of it as the model is shown.

    When the cap bites the **middle** is dropped, never the end: the last
    minutes of a session carry the closing advice and whatever the guest was
    asked last, which is half of what notes are for. The gap is marked in
    words so the model knows it is reading two halves rather than one
    continuous hour.
    """
    if len(text) <= MAX_TRANSCRIPT_CHARS:
        return text

    marker = (
        "\n\n[... the middle of this session is not shown — it was too long to "
        "include in full. What follows is the end of the session. ...]\n\n"
    )
    # The marker counts against the budget rather than being added on top of
    # it: a transcript a few characters over the cap must not come back
    # *longer* than it went in.
    half = max(1, (MAX_TRANSCRIPT_CHARS - len(marker)) // 2)
    logger.info(
        "live_sessions: trimmed a %s-character transcript to %s",
        len(text),
        MAX_TRANSCRIPT_CHARS,
    )
    return f"{text[:half]}{marker}{text[-half:]}"


def _summarize(run, transcript_text):
    """Hands the transcript to the model and returns the repaired notes.

    The patience is `brand_validator`'s rather than `advisor`'s, because this
    runs on a background thread nobody is watching.
    """
    session = run.session
    prompt = notes_prompt.build_prompt(
        context=session.notes_context(),
        transcript=_trim_transcript(transcript_text),
    )

    provider = get_provider()
    last_error = None
    for attempt in range(MAX_TRANSPORT_ATTEMPTS):
        try:
            result = provider.generate_course(
                prompt, notes_prompt.RESPONSE_SCHEMA, SUMMARY_TIMEOUT_SECONDS
            )
            break
        except ProviderTransportError as exc:
            last_error = exc
            if attempt + 1 >= MAX_TRANSPORT_ATTEMPTS:
                raise
            backoff = TRANSPORT_BACKOFF_SECONDS[
                min(attempt, len(TRANSPORT_BACKOFF_SECONDS) - 1)
            ]
            logger.warning(
                "live_sessions: notes run %s hit a transport error (%s) — retrying "
                "in %ss",
                run.pk,
                exc,
                backoff,
            )
            time.sleep(backoff)
    else:  # pragma: no cover - the loop always breaks or raises
        raise last_error

    try:
        payload = json.loads(result.text)
    except (TypeError, ValueError) as exc:
        raise ProviderError("The model's notes could not be read as JSON.") from exc

    # Never trust a provider response directly: the same repair the live
    # classes apply, from the same module.
    return notes_validators.normalize_notes_payload(
        payload, fallback_title=session.title
    )


def _write_notes(notes_id, payload):
    """Saves the notes, renders the hand-out, and tells the room — once.

    The document is rendered after the row is written rather than before, so a
    server without reportlab still gets its notes: a missing renderer costs a
    download, not a session.
    """
    updated = LiveSessionNotes.objects.filter(pk=notes_id).exclude(
        status=_AVAILABLE
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
        return LiveSessionNotes.objects.filter(pk=notes_id).first()

    run = LiveSessionNotes.objects.select_related("session").get(pk=notes_id)

    # Rendered whatever the model made of the session, including "nothing was
    # said here". A run that reaches this line *has* notes — it is about to be
    # published and both portals will offer the document — so skipping the
    # render for an empty session would leave those buttons promising a file
    # that was deliberately never made.
    _render_notes_document(run)

    if not payload["has_content"]:
        logger.info(
            "live_sessions: notes run %s found no session in the transcript", run.pk
        )
        return _publish_notes(notes_id, announce_to_room=False)

    return _publish_notes(notes_id, announce_to_room=True)


def render_notes_document(run, *, with_transcript=False):
    """The notes as a PDF, in memory, or `None`.

    `with_transcript` appends the verbatim record of the session under the
    write-up. It is **off by default and never set by the pipeline**: the
    stored document is the one emailed to everybody who was in the room, and
    the words of a room that may be full of minors belong to the team running
    it. The only caller that passes it is the download view, which has
    already asked who is on the other end of the request.

    Never raises: a PDF that will not render costs a download, not a session.
    """
    if not notes_document.PDF_AVAILABLE:
        logger.warning(
            "live_sessions: reportlab is not installed — notes run %s has no PDF",
            run.pk,
        )
        return None

    try:
        buffer = io.BytesIO()
        notes_document.build_notes_pdf(
            run,
            context=run.session.notes_context(),
            destination=buffer,
            transcript=run.transcript if with_transcript else None,
        )
        buffer.seek(0)
        return buffer
    except Exception:  # noqa: BLE001 - see docstring
        logger.exception(
            "live_sessions: could not render the notes document for run %s", run.pk
        )
        return None


def _render_notes_document(run):
    """Writes the shareable PDF onto the row, or logs why it could not.

    Shareable means **without the transcript**: this is the file attached to
    the email everybody in the room receives, so it carries the write-up and
    nothing else.
    """
    buffer = render_notes_document(run)
    if buffer is None:
        return None

    try:
        # A random tail rather than a guessable name: the document is served
        # through a view that checks who is asking, and a MEDIA path that
        # could be guessed would be a second way in that checks nothing.
        filename = f"live-{run.session_id}-notes-{secrets.token_hex(8)}.pdf"
        run.document.save(filename, ContentFile(buffer.getvalue()), save=False)
        run.save(update_fields=["document", "updated_at"])
        return run.document
    except Exception:  # noqa: BLE001 - see docstring
        logger.exception(
            "live_sessions: could not save the notes document for run %s", run.pk
        )
        return None


def _room_audience_and_hosts(session):
    """`(audience ids, host ids)` for this session.

    The same roster the room itself resolves from — people who reserved a
    seat or walked in — because the notes are exactly as widely shared as the
    session they are of. The two are split because they are told different
    things: the room is told the notes exist, while whoever ran it is told
    even when there was nothing to write up.

    The two sets never overlap, so nobody is notified twice.
    """
    audience = set()
    hosts = set()
    for student_id, role in session.rsvps.values_list("student_id", "role"):
        if role == SessionRSVP.ParticipantRole.HOST:
            hosts.add(student_id)
        else:
            audience.add(student_id)

    if session.created_by_id:
        hosts.add(session.created_by_id)
    return audience - hosts, hosts


def _publish_notes(notes_id, *, announce_to_room):
    """Marks the notes readable and notifies the room — exactly once.

    The guard is the row itself, locked: notes reach here from the host
    stopping them, the host leaving and the deadline passing, and two of those
    racing must not send a room two notifications. `notified_at` is written in
    the same transaction as the notifications, so a rollback takes both.

    A session where nothing was said is still *published* — the host can see
    what came of it — but the room is not told. People pulled back to a page
    that says nothing was said is noise they did not ask for, and the one
    person who needs to know is the one who was running it.
    """
    with transaction.atomic():
        run = (
            LiveSessionNotes.objects.select_for_update()
            .select_related("session")
            .filter(pk=notes_id)
            .first()
        )
        if run is None or run.notified_at is not None:
            return run

        session = run.session
        now = timezone.now()
        if run.started_at and not run.stopped_at:
            run.stopped_at = now
        if run.started_at and run.stopped_at:
            run.duration_seconds = max(
                0, int((run.stopped_at - run.started_at).total_seconds())
            )

        run.status = _AVAILABLE
        run.error_message = ""
        run.notified_at = now
        run.save(
            update_fields=[
                "status",
                "stopped_at",
                "duration_seconds",
                "error_message",
                "notified_at",
                "updated_at",
            ]
        )

        title = f"Session notes ready: {session.title}"
        audience_ids, host_ids = _room_audience_and_hosts(session)
        if run.started_by_id:
            host_ids.add(run.started_by_id)
            audience_ids.discard(run.started_by_id)

        if announce_to_room and audience_ids:
            # The notification carries no link: `related_object_type` points
            # the portal at the session, and the document is served behind its
            # own check when they get there.
            create_notifications_for_users(
                sorted(audience_ids),
                verb="live_session_notes_ready",
                title=title,
                message=(
                    "War Room Live — the notes from this session are now in "
                    "War Room Live under Past & Recordings."
                ),
                related_object_type="live_session",
                related_object_id=session.pk,
            )

        # Whoever ran the session is told either way — including when there
        # was nothing to write up, which is the one case nobody else hears
        # about at all.
        if host_ids:
            create_notifications_for_users(
                sorted(host_ids),
                verb="live_session_notes_ready",
                title=title,
                message=(
                    f"War Room Live — the notes from \"{session.title}\" are ready."
                    if announce_to_room
                    else f"War Room Live — nothing much was said in \"{session.title}\", "
                    "so the notes are empty. Nobody else has been told."
                ),
                related_object_type="live_session",
                related_object_id=session.pk,
            )

        if announce_to_room:
            # The email goes out only once the row is safely committed: a
            # rollback here would otherwise have told a room about notes this
            # server then forgot, and an email is the one thing in this
            # function that cannot be taken back.
            transaction.on_commit(lambda: _email_notes_ready(session, run))

    logger.info(
        "live_sessions: notes run %s of session %s is available", run.pk, run.session_id
    )
    return run


# ---------------------------------------------------------------------------
# Telling the room
# ---------------------------------------------------------------------------


def _email_recipients(session):
    """Everyone who gets an email, as (address, name, is_host) triples.

    The same roster as the in-app notification, because the notes are only
    ever as widely shared as the session they are of.
    """
    recipients = [
        (rsvp.student.email, rsvp.student.name or rsvp.student.username, rsvp.role)
        for rsvp in session.rsvps.select_related("student")
        if rsvp.student.email
    ]

    creator = session.created_by
    if creator is not None and creator.email:
        recipients.append(
            (
                creator.email,
                creator.name or creator.username,
                SessionRSVP.ParticipantRole.HOST,
            )
        )

    # One address, one email — somebody who hosted and also RSVP'd should not
    # get two.
    seen = set()
    unique = []
    for email, name, role in recipients:
        key = email.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append((email, name, role == SessionRSVP.ParticipantRole.HOST))
    return unique


def _notes_attachment(run):
    """The rendered notes as `(filename, bytes)`, or `None`.

    Read once and handed to every message rather than re-opened per
    recipient: thirty people is thirty copies of the same few kilobytes, and a
    media volume that has lost the file should cost one log line, not thirty
    failures.
    """
    if run is None or not run.document:
        return None
    try:
        with run.document.open("rb") as handle:
            content = handle.read()
    except (FileNotFoundError, OSError, ValueError):
        logger.warning(
            "live_sessions: notes run %s has no readable document to attach", run.pk
        )
        return None

    return run.session.notes_context()["document_name"], content


def _email_notes_ready(session, run=None):
    """Tells the room, by email, that the notes are up — **with the PDF**.

    The document is attached rather than linked, the one place this feature
    departs from the rule that an email carries no artifact. What makes that
    safe is what the notes *are* (`class_sessions.notes_prompt`): the material
    that was actually discussed, with nobody named and nothing in them that
    was not said out loud to the whole room. The verbatim transcript is the
    opposite and is never sent.

    The portal link stays in the body, because that is where the session, its
    recording and any later correction actually live.

    One message per recipient, built and sent individually so a single
    unreachable address cannot take the rest of the room's email with it, and
    the whole thing is wrapped: a broken SMTP configuration must not fail
    notes that are sitting there perfectly fine, and nobody's address belongs
    in anybody else's To: header.
    """
    if not getattr(settings, "LIVE_SESSION_NOTES_EMAIL_ENABLED", True):
        return 0

    recipients = _email_recipients(session)
    if not recipients:
        return 0

    base_url = (getattr(settings, "FRONTEND_URL", "") or "").rstrip("/")
    student_link = f"{base_url}{getattr(settings, 'LIVE_SESSION_PORTAL_PATH', '')}"
    admin_link = f"{base_url}{getattr(settings, 'LIVE_SESSION_ADMIN_PORTAL_PATH', '')}"
    subject = f"Session notes ready: {session.title}"
    attachment = _notes_attachment(run)

    sent = 0
    for email, name, is_host in recipients:
        link = admin_link if is_host else student_link
        where = (
            "They're under War Room Live in your admin portal."
            if is_host
            else "They're under War Room Live → Past & Recordings in your student portal."
        )
        attached_line = (
            "They're attached to this email as a PDF, and they're also in your "
            "portal:\n"
            if attachment
            else "You'll find them in your portal:\n"
        )
        body = (
            f"Hi {name},\n\n"
            f"The notes from \"{session.title}\" — the War Room Live session on "
            f"{session.scheduled_at:%d %B %Y} — are ready to read.\n\n"
            f"{attached_line}{where}\n{link}\n\n"
            "They were written automatically from a transcript of the session and "
            "haven't been checked by anyone who was in it, so treat anything "
            "surprising as something to ask about.\n\n"
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
        except Exception:  # noqa: BLE001 - one bad address must not stop the room
            logger.exception(
                "live_sessions: could not email the notes from session %s to a "
                "recipient",
                session.pk,
            )

    logger.info(
        "live_sessions: emailed %s people about the notes from session %s (%s)",
        sent,
        session.pk,
        "with the PDF attached" if attachment else "no document to attach",
    )
    return sent


# ---------------------------------------------------------------------------
# Reading the notes
# ---------------------------------------------------------------------------


def notes_payload(run):
    """The notes themselves, as both portals render them."""
    return {
        "id": run.pk,
        "title": run.title,
        "summary": run.summary,
        "key_topics": list(run.key_topics or []),
        "important_points": list(run.important_points or []),
        "action_items": list(run.action_items or []),
        # The schema's own field name, kept as it is so the one validator and
        # the one renderer serve both kinds of session. On a War Room Live
        # session it holds whatever was said about the next one.
        "next_class": run.next_class,
        "has_document": bool(run.document),
        "written_at": run.notified_at or run.updated_at,
        "duration_seconds": run.duration_seconds,
    }


def notes_state(*, session, user, include_notes=True):
    """Everything a portal needs to know about this session's notes.

    One payload serves three surfaces — the "taking notes" indicator in the
    room, the host's notes button and everybody else's "Session notes" — so
    they cannot disagree about whether a session is being written up.

    The write-up goes to **anybody signed in**, deliberately, and that is
    where this differs from a class: a class is written up for the thirty
    people on its course, while a War Room Live session is advertised to the
    whole student body and its recording link already sits on the card for
    every one of them. The notes are the same kind of thing — what the guest
    said to a room that anyone could have walked into — and withholding them
    from somebody who missed the hour would be withholding the only thing
    they can get back.

    The **transcript only ever reaches a host**. It is a verbatim record of
    who said what in a room that may be full of minors, kept as the evidence
    behind the notes; everybody else gets the write-up.
    """
    running = active_notes(session)
    available = latest_available_notes(session)
    host = services.is_host(user, session)

    # A thread that died with the process, and a run whose host closed their
    # laptop, are both picked back up by whoever asks next — there is no
    # scheduler here to do it on a timer.
    if running is not None:
        _ensure_notes_progress(running)

    statuses = LiveSessionNotes.NotesStatus
    state = {
        "configured": is_notes_configured(),
        "takes_notes": bool(session.takes_notes),
        "status": (running or available).status if (running or available) else "NONE",
        "is_transcribing": bool(running and running.is_listening),
        # Parked mid-session by the host. Deliberately neither "taking notes"
        # nor "writing them up": nothing is happening, the button is free, and
        # pressing it resumes this run rather than starting another.
        "is_paused": bool(running and running.is_paused),
        "is_writing": bool(
            running and running.status in (statuses.COLLECTING, statuses.SUMMARIZING)
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

    # Why the last attempt came to nothing — the host's alone. It is the only
    # place a failure is visible at all (a FAILED run is neither running nor
    # available), and the reason can name a provider, a quota or a file on
    # disk, none of which is a student's business or any use to them.
    if running is None and available is None and host:
        latest = session.notes_runs.order_by("-created_at").first()
        if latest is not None and latest.status == statuses.FAILED:
            state["status"] = statuses.FAILED
            state["error"] = latest.error_message

    if available and include_notes:
        state["notes"] = notes_payload(available)
        if host:
            state["transcript"] = available.transcript

    return state
