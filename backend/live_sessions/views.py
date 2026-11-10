import json

from django.db.models import Count, Q
from django.http import FileResponse
from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from class_sessions.notes_audio import UnsupportedAudioError
from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin

from . import notes as notes_services
from .exceptions import (
    AgoraNotConfiguredError,
    LiveSessionError,
    NotesNotConfiguredError,
    NotesUnavailableError,
    SessionAccessDeniedError,
    SessionNotJoinableError,
)
from .models import LiveSession, LiveSessionNotes, SessionRSVP, SessionSpeaker
from .serializers import (
    AdminLiveSessionSerializer,
    LiveSessionSerializer,
    LiveSessionWriteSerializer,
    SessionRSVPSerializer,
    SessionSpeakerSerializer,
    SessionSpeakerWriteSerializer,
)
from .services import (
    cancel_rsvp,
    get_join_url,
    get_session_stats,
    is_host,
    issue_join_credentials,
    past_sessions,
    record_leave,
    rsvp_to_session,
    set_audience_access,
    upcoming_sessions,
)


def _as_json_list(value):
    """A JSON array sent as a multipart field, or an empty list.

    Never raises: this carries who was speaking when, which makes a
    transcript nicer to read. A malformed one costs the names on that
    segment, and must not cost the audio it came with — that is the session.
    """
    if isinstance(value, list):
        return value
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except (TypeError, ValueError):
        return []
    return parsed if isinstance(parsed, list) else []


def _as_positive_int(value):
    """A browser-sent number, or None. Never raises — a malformed duration is
    a missing one, not a failed upload of a session nobody can re-record."""
    try:
        number = int(value)
    except (TypeError, ValueError):
        return None
    return number if number >= 0 else None


def _sessions_with_notes(sessions):
    """One query for "which of these have notes to read", instead of one per
    card."""
    ids = [session.pk for session in sessions]
    if not ids:
        return set()
    return set(
        LiveSessionNotes.objects.filter(
            session_id__in=ids, status=LiveSessionNotes.NotesStatus.AVAILABLE
        )
        .exclude(summary="")
        .values_list("session_id", flat=True)
    )


# Only the audience is "going". An admin who opened the room has a row in
# the same table so the roster can put a name on their voice, and counting it
# would quietly take a seat off every session they hosted (`SessionRSVP.role`).
_AUDIENCE = Q(rsvps__role=SessionRSVP.ParticipantRole.AUDIENCE)


def _rsvped_ids(user, sessions):
    """One query for "which of these did I RSVP to", instead of one per card."""
    if not user.is_authenticated:
        return set()
    return set(
        SessionRSVP.objects.filter(
            student=user, session__in=[session.pk for session in sessions]
        ).values_list("session_id", flat=True)
    )


class _SessionListView(generics.ListAPIView):
    serializer_class = LiveSessionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset().prefetch_related("speakers")
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(
            page,
            many=True,
            context={
                "request": request,
                "rsvped_session_ids": _rsvped_ids(request.user, page),
                "sessions_with_notes": _sessions_with_notes(page),
            },
        )
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Sessions fetched successfully")


class UpcomingSessionsView(_SessionListView):
    def get_queryset(self):
        return upcoming_sessions()


class PastSessionsView(_SessionListView):
    def get_queryset(self):
        return past_sessions()


class SessionStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return success_response(
            get_session_stats(request.user), message="Session stats fetched successfully"
        )


class SessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        session = (
            LiveSession.objects.filter(pk=pk)
            .annotate(rsvp_count=Count("rsvps", filter=_AUDIENCE, distinct=True))
            .prefetch_related("speakers")
            .first()
        )
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        return success_response(
            LiveSessionSerializer(session, context={"request": request}).data,
            message="Session fetched successfully",
        )


class SessionRSVPView(APIView):
    """POST reserves a spot, DELETE gives it back."""

    permission_classes = [IsAuthenticated]

    def _get_session(self, pk):
        return (
            LiveSession.objects.filter(pk=pk)
            .annotate(rsvp_count=Count("rsvps", filter=_AUDIENCE, distinct=True))
            .first()
        )

    def post(self, request, pk, *args, **kwargs):
        session = self._get_session(pk)
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        try:
            rsvp_to_session(session=session, student=request.user)
        except LiveSessionError as exc:
            return error_response(message=str(exc), status_code=400)

        session = self._get_session(pk)
        return success_response(
            LiveSessionSerializer(session, context={"request": request}).data,
            message="You're on the list for this session",
        )

    def delete(self, request, pk, *args, **kwargs):
        session = self._get_session(pk)
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        try:
            cancel_rsvp(session=session, student=request.user)
        except LiveSessionError as exc:
            return error_response(message=str(exc), status_code=400)

        session = self._get_session(pk)
        return success_response(
            LiveSessionSerializer(session, context={"request": request}).data,
            message="RSVP cancelled",
        )


class SessionJoinView(APIView):
    """Releases the meeting link, but only while the room is open — see
    services.get_join_url. 403 (not 404) because the student is allowed to
    know the session exists; they just can't get in yet."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        session = LiveSession.objects.filter(pk=pk).first()
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        try:
            url = get_join_url(session=session, student=request.user)
        except LiveSessionError as exc:
            return error_response(message=str(exc), status_code=403)

        return success_response(
            {"meeting_url": url, "meeting_method": session.meeting_method},
            message="Join link released",
        )


# ---------------------------------------------------------------------------
# The room this platform hosts itself
# ---------------------------------------------------------------------------


class SessionRoomView(APIView):
    """A War Room Live room — one URL, two verbs.

    `POST` mints this person's Agora token, which is the only way into the
    room. It returns `{channel_name, token, uid, role, can_speak, expires_at,
    roster, ...}`; the Agora **App ID is deliberately not in that payload**,
    because it is a public identifier the frontend already carries as
    NEXT_PUBLIC_AGORA_APP_ID, while the App Certificate that signs the token
    never leaves this server.

    It is called again by the frontend when Agora warns a token is about to
    expire, and again when the floor is opened or closed — the role lives
    inside the token, so changing who may speak means re-asking for one. It
    therefore has to stay cheap and idempotent: it writes at most one arrival
    row per person and never changes the channel.

    `PATCH` is a host opening the floor to the room, or taking it back —
    `{"audience_access": "LISTEN_ONLY" | "EVERYONE"}`. It returns the updated
    session so both portals can render the new state without a second fetch.
    """

    permission_classes = [IsAuthenticated]
    http_method_names = ["post", "patch", "head", "options"]

    def _session(self, pk):
        return (
            LiveSession.objects.filter(pk=pk)
            .annotate(rsvp_count=Count("rsvps", filter=_AUDIENCE, distinct=True))
            .prefetch_related("speakers")
            .first()
        )

    def post(self, request, pk, *args, **kwargs):
        session = self._session(pk)
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        try:
            credentials = issue_join_credentials(session=session, user=request.user)
        except SessionAccessDeniedError as exc:
            return error_response(message=str(exc), status_code=403)
        except LiveSessionError as exc:
            # 403 rather than 404 for a room that is shut, full or on another
            # platform: the student is allowed to know the session exists —
            # they just can't get in. `AgoraNotConfiguredError` is the one
            # exception, and it is answered below as a server fault.
            if isinstance(exc, AgoraNotConfiguredError):
                return error_response(message=str(exc), status_code=503)
            return error_response(message=str(exc), status_code=403)

        return success_response(credentials, message="Room opened")

    def patch(self, request, pk, *args, **kwargs):
        session = self._session(pk)
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        try:
            session = set_audience_access(
                session=session,
                user=request.user,
                access=request.data.get("audience_access"),
            )
        except SessionAccessDeniedError as exc:
            return error_response(message=str(exc), status_code=403)
        except SessionNotJoinableError as exc:
            return error_response(message=str(exc), status_code=400)

        opened = session.audience_access == LiveSession.AudienceAccess.EVERYONE
        return success_response(
            LiveSessionSerializer(session, context={"request": request}).data,
            message=(
                "The floor is open — everyone in the room can unmute."
                if opened
                else "The floor is closed — only hosts and guests can speak now."
            ),
        )


class SessionLeaveView(APIView):
    """Best-effort "I've left" ping.

    `{"ended": true}` is the browser saying this was a **deliberate** exit —
    the red button, or the room closing itself at the advertised end — as
    opposed to a reload, a navigation or a dropped connection, which reach
    here looking exactly the same. Only a deliberate exit writes the notes
    up; see `services.record_leave` for why that distinction is worth a flag.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        session = LiveSession.objects.filter(pk=pk).first()
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        ended = str((request.data or {}).get("ended", "")).lower() in ("1", "true", "yes")
        record_leave(session=session, user=request.user, ended=ended)
        return success_response({}, message="Left the room")


# ---------------------------------------------------------------------------
# Meeting notes
# ---------------------------------------------------------------------------


class SessionNotesView(APIView):
    """This session's AI meeting notes — one URL, three verbs.

    `GET` is what every surface reads: the "taking notes" indicator while a
    session runs, and the notes themselves afterwards. The write-up goes to
    anybody signed in who can see the session; the **verbatim transcript goes
    only to a host**, because it is a record of who said what in a room that
    may be full of minors.

    `POST` starts the notes and `DELETE` pauses them. Both are a host's
    alone: a student cannot start a recording of a room, and cannot switch
    one off either.

    Stopping is deliberately not instant, and is deliberately a **pause**: a
    session taken in two stretches comes out as one set of notes covering
    both, and the write-up happens when the session ends.
    """

    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def _session(self, pk):
        return LiveSession.objects.filter(pk=pk).prefetch_related("speakers").first()

    def get(self, request, pk, *args, **kwargs):
        session = self._session(pk)
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        return success_response(
            notes_services.notes_state(session=session, user=request.user),
            message="Session notes fetched successfully",
        )

    def post(self, request, pk, *args, **kwargs):
        session = self._session(pk)
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)
        if not is_host(request.user, session):
            return error_response(
                message="Only a host can start taking notes on a session.",
                status_code=403,
            )

        try:
            notes_services.start_notes(session=session, user=request.user)
        except (NotesNotConfiguredError, NotesUnavailableError) as exc:
            return error_response(message=str(exc), status_code=503)

        # The host changing their mind about a session they scheduled not to
        # write up — written down for the same reason a class's is: this room
        # re-joins by itself whenever Agora renews a token, and
        # `maybe_start_notes` runs inside every one of those.
        notes_services.set_capture_preference(session, takes_notes=True)

        return success_response(
            notes_services.notes_state(session=session, user=request.user),
            message="Taking notes — everyone in the room is shown that it is on.",
        )

    def delete(self, request, pk, *args, **kwargs):
        session = self._session(pk)
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)
        if not is_host(request.user, session):
            return error_response(
                message="Only a host can stop the notes.", status_code=403
            )

        notes_services.stop_notes(
            session=session, user=request.user, reason="the host stopped them"
        )
        notes_services.set_capture_preference(session, takes_notes=False)
        state = notes_services.notes_state(session=session, user=request.user)
        return success_response(
            state,
            message=(
                # Said in the words of what actually happened: the session is
                # still going, so this is a pause and the notes are written up
                # when it ends — not "stopped", which would have a host
                # watching for a document that is not coming yet.
                "Notes paused — what's been said so far is kept, and the write-up "
                "goes out when the session ends."
                if state["is_paused"]
                else "This session isn't taking notes."
            ),
        )


class SessionNotesAudioView(APIView):
    """Where the audio a session is written up from actually arrives.

    The host's browser mixes everybody who is speaking, records the session in
    segments and posts them here, one at a time, while the session is still
    running. They are kept on this server — `MEDIA_ROOT/live-session-audio/`
    — and read by the AI model. No bucket is involved anywhere.

    A host's alone, and narrower still: only the one browser the run
    nominated is accepted, so a second admin's room cannot post an
    overlapping copy of the same hour.

    Posting a segment with `end=true` is what starts the write-up — the room
    closing, or the host leaving. The **stop button does not**: that is a
    pause in a session that is still running, and the segment it sends is
    simply the last of that stretch.
    """

    permission_classes = [IsAuthenticated]
    http_method_names = ["post", "head", "options"]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk, *args, **kwargs):
        session = LiveSession.objects.filter(pk=pk).first()
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        data = request.data
        try:
            run = notes_services.store_notes_audio(
                session=session,
                user=request.user,
                upload=request.FILES.get("audio"),
                client_key=data.get("client_key") or "",
                duration_seconds=_as_positive_int(data.get("duration_seconds")),
                end=str(data.get("end", "")).lower() in ("1", "true", "yes"),
                speakers=_as_json_list(data.get("speakers")),
            )
        except SessionAccessDeniedError as exc:
            return error_response(message=str(exc), status_code=403)
        except UnsupportedAudioError as exc:
            return error_response(message=str(exc), status_code=415)
        except NotesNotConfiguredError as exc:
            return error_response(message=str(exc), status_code=503)
        except NotesUnavailableError as exc:
            # 409: the session is real and this person may post to it — this
            # particular upload simply has nowhere to go, which is a state the
            # browser recovers from by stopping rather than an error to show.
            return error_response(message=str(exc), status_code=409)

        statuses = LiveSessionNotes.NotesStatus
        return success_response(
            notes_services.notes_state(session=session, user=request.user),
            message=(
                "That's the last of the audio — the notes are being written."
                if run is not None
                and run.status in (statuses.COLLECTING, statuses.SUMMARIZING)
                else "Audio received."
            ),
        )


class SessionNotesDocumentView(APIView):
    """The notes as a PDF to keep.

    The file lives in MEDIA_ROOT, so this view is what makes it as private as
    the session it is of: signed in, and a random tail in the stored file name
    so the MEDIA path behind it is not a second way in that checks nothing.
    Streamed rather than redirected to, for the same reason — a redirect would
    hand out a URL that outlives the check.

    "As private as the session it is of" is a wider circle than a class's: a
    War Room Live session is advertised to every student and its recording
    link already sits on the card for all of them, so the write-up goes to
    anybody signed in (see `notes.notes_state`). The verbatim transcript does
    not, and this is where that is decided — a host's copy of the PDF carries
    it and everybody else's does not.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        session = LiveSession.objects.filter(pk=pk).prefetch_related("speakers").first()
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        run = notes_services.latest_available_notes(session)
        if run is None:
            return error_response(
                message="There are no notes for this session.", status_code=404
            )

        filename = session.notes_context()["document_name"]

        # A host's copy carries the transcript under the notes; the stored one
        # does not, because that is the file emailed to the whole room.
        # Rendered here rather than kept as a second file: it is a couple of
        # kilobytes of reportlab, and a document that only exists for the
        # length of one authorised request cannot be the one that ends up
        # attached to the wrong email.
        if run.transcript and is_host(request.user, session):
            document = notes_services.render_notes_document(run, with_transcript=True)
            if document is not None:
                return FileResponse(document, as_attachment=True, filename=filename)

        if not run.document:
            return error_response(
                message="There's no notes document for this session.", status_code=404
            )

        try:
            handle = run.document.open("rb")
        except (FileNotFoundError, OSError):
            # The row says there is a document and the disk disagrees — a
            # restored database against a fresh media volume, most often. The
            # notes themselves are still on screen, so this is a missing
            # download rather than missing notes.
            return error_response(
                message="This notes document is no longer on the server.",
                status_code=404,
            )

        return FileResponse(handle, as_attachment=True, filename=filename)


# ---------------------------------------------------------------------------
# Admin — session scheduling & speaker roster
# ---------------------------------------------------------------------------


class AdminSessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    pagination_class = Pagination
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = LiveSession.objects.annotate(
            rsvp_count=Count("rsvps", filter=_AUDIENCE, distinct=True)
        ).prefetch_related("speakers")
        params = self.request.query_params
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("search"):
            queryset = queryset.filter(title__icontains=params["search"])
        return queryset.order_by("-scheduled_at")

    def get_serializer_class(self):
        return LiveSessionWriteSerializer if self.request.method == "POST" else AdminLiveSessionSerializer

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = AdminLiveSessionSerializer(
            page,
            many=True,
            context={
                "request": request,
                # One query for "which of these have notes", rather than one
                # per row of the table.
                "sessions_with_notes": _sessions_with_notes(page),
            },
        )
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Sessions fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = LiveSessionWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(created_by=request.user)
        return success_response(
            AdminLiveSessionSerializer(session, context={"request": request}).data,
            message="Session scheduled successfully",
            status_code=201,
        )


class AdminSessionDetailView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    http_method_names = ["get", "patch", "delete", "head", "options"]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        return (
            LiveSession.objects.filter(pk=self.kwargs["pk"])
            .annotate(rsvp_count=Count("rsvps", filter=_AUDIENCE, distinct=True))
            .first()
        )

    def get(self, request, *args, **kwargs):
        session = self.get_object()
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)
        return success_response(
            AdminLiveSessionSerializer(session, context={"request": request}).data,
            message="Session fetched successfully",
        )

    def patch(self, request, *args, **kwargs):
        session = self.get_object()
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        serializer = LiveSessionWriteSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        session = self.get_object()
        return success_response(
            AdminLiveSessionSerializer(session, context={"request": request}).data,
            message="Session updated successfully",
        )

    def delete(self, request, *args, **kwargs):
        """Cancels rather than deletes once students have RSVP'd — those
        students were told to show up, so the session has to remain visible
        with a reason attached instead of vanishing from their list."""
        session = self.get_object()
        if session is None:
            return error_response(message="Session does not exist.", status_code=404)

        if session.rsvps.exists():
            session.status = LiveSession.SessionStatus.CANCELLED
            session.cancellation_reason = (
                request.data.get("cancellation_reason") or "This session was cancelled."
            )
            session.save(update_fields=["status", "cancellation_reason", "updated_at"])
            return success_response(
                AdminLiveSessionSerializer(session, context={"request": request}).data,
                message="Session cancelled — students who RSVP'd keep seeing it with the reason.",
            )

        session.delete()
        return success_response({}, message="Session deleted successfully")


class AdminSessionRSVPListView(generics.ListAPIView):
    """The attendee list for one session."""

    permission_classes = [IsAdmin]
    serializer_class = SessionRSVPSerializer
    pagination_class = Pagination

    def get_queryset(self):
        # Hosts are in this table too (see `SessionRSVP.role`), and they are
        # not attendees — the person who ran the room has no business in a
        # list of who turned up to it.
        return SessionRSVP.objects.filter(
            session_id=self.kwargs["pk"],
            role=SessionRSVP.ParticipantRole.AUDIENCE,
        ).select_related("student")

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(page, many=True)
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Attendees fetched successfully")


class SpeakerListCreateView(generics.ListCreateAPIView):
    """GET is open to any authenticated user (the student-facing speaker
    roster); POST is admin-only."""

    pagination_class = Pagination
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        return [IsAdmin()] if self.request.method == "POST" else [IsAuthenticated()]

    def get_queryset(self):
        queryset = SessionSpeaker.objects.all()
        if self.request.query_params.get("active") == "true":
            queryset = queryset.filter(is_active=True)
        if self.request.query_params.get("search"):
            queryset = queryset.filter(name__icontains=self.request.query_params["search"])
        return queryset

    def get_serializer_class(self):
        return SessionSpeakerWriteSerializer if self.request.method == "POST" else SessionSpeakerSerializer

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = SessionSpeakerSerializer(page, many=True, context={"request": request})
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Speakers fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = SessionSpeakerWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        speaker = serializer.save()
        return success_response(
            SessionSpeakerSerializer(speaker, context={"request": request}).data,
            message="Speaker added successfully",
            status_code=201,
        )


class SpeakerDetailView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    http_method_names = ["patch", "delete", "head", "options"]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self):
        return SessionSpeaker.objects.filter(pk=self.kwargs["pk"]).first()

    def patch(self, request, *args, **kwargs):
        speaker = self.get_object()
        if speaker is None:
            return error_response(message="Speaker does not exist.", status_code=404)

        serializer = SessionSpeakerWriteSerializer(speaker, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        speaker = serializer.save()
        return success_response(
            SessionSpeakerSerializer(speaker, context={"request": request}).data,
            message="Speaker updated successfully",
        )

    def delete(self, request, *args, **kwargs):
        """Deactivates rather than deletes a speaker who has already appeared
        on a session, so past session cards keep their line-up."""
        speaker = self.get_object()
        if speaker is None:
            return error_response(message="Speaker does not exist.", status_code=404)

        if speaker.sessions.exists():
            speaker.is_active = False
            speaker.save(update_fields=["is_active", "updated_at"])
            return success_response(
                SessionSpeakerSerializer(speaker, context={"request": request}).data,
                message="Speaker deactivated — they already appear on scheduled sessions.",
            )

        speaker.delete()
        return success_response({}, message="Speaker deleted successfully")
