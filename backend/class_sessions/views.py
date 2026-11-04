from django.http import FileResponse
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.pagination import Pagination
from common.response import error_response, success_response

from .exceptions import (
    AgoraNotConfiguredError,
    NotesNotConfiguredError,
    NotesUnavailableError,
    RecordingNotConfiguredError,
    RecordingUnavailableError,
    SessionAccessDeniedError,
    SessionNotJoinableError,
    SessionScheduleError,
    WhiteboardNotConfiguredError,
    WhiteboardUnavailableError,
)
from .permissions import IsTeacherOrAdmin
from .serializers import (
    ClassSessionAttendanceSerializer,
    ClassSessionSerializer,
    ClassSessionWriteSerializer,
)
from .services import (
    ENDED,
    LIVE,
    attendance_for,
    can_attend,
    can_manage,
    cancel_class,
    is_host,
    issue_join_credentials,
    issue_whiteboard_credentials,
    latest_available_notes,
    live_state,
    notes_state,
    past,
    record_leave,
    recording_state,
    schedule_class,
    set_whiteboard_access,
    start_notes,
    start_recording,
    stop_notes,
    stop_recording,
    student_sessions,
    teacher_sessions,
    upcoming,
    update_class,
    visible_sessions,
)


def _scoped(queryset, scope):
    """`?scope=upcoming|past` over any of the annotated querysets."""
    if scope == "upcoming":
        return upcoming(queryset)
    if scope == "past":
        return past(queryset)
    return queryset.order_by("-scheduled_at")


class _ClassSessionListView(generics.ListAPIView):
    serializer_class = ClassSessionSerializer
    pagination_class = Pagination

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Classes fetched successfully")


# ---------------------------------------------------------------------------
# Teacher — scheduling
# ---------------------------------------------------------------------------


class TeacherClassSessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsTeacherOrAdmin]
    pagination_class = Pagination

    def get_serializer_class(self):
        return (
            ClassSessionWriteSerializer
            if self.request.method == "POST"
            else ClassSessionSerializer
        )

    def get_queryset(self):
        queryset = teacher_sessions(self.request.user)
        params = self.request.query_params
        if params.get("course"):
            queryset = queryset.filter(course_id=params["course"])
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("search"):
            queryset = queryset.filter(title__icontains=params["search"])
        return _scoped(queryset, params.get("scope"))

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = ClassSessionSerializer(page, many=True, context={"request": request})
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Classes fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = ClassSessionWriteSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        try:
            session = schedule_class(teacher=request.user, **serializer.validated_data)
        except SessionScheduleError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            ClassSessionSerializer(session, context={"request": request}).data,
            message="Class scheduled — enrolled students have been notified.",
            status_code=201,
        )


class TeacherClassSessionDetailView(generics.GenericAPIView):
    permission_classes = [IsTeacherOrAdmin]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_object(self):
        return teacher_sessions(self.request.user).filter(pk=self.kwargs["pk"]).first()

    def get(self, request, *args, **kwargs):
        session = self.get_object()
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)
        return success_response(
            ClassSessionSerializer(session, context={"request": request}).data,
            message="Class fetched successfully",
        )

    def patch(self, request, *args, **kwargs):
        session = self.get_object()
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)
        if not can_manage(request.user, session):
            return error_response(message="You don't teach this course.", status_code=403)

        serializer = ClassSessionWriteSerializer(
            session, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        try:
            session = update_class(session, **serializer.validated_data)
        except SessionScheduleError as exc:
            return error_response(message=str(exc), status_code=400)

        session = self.get_object()
        return success_response(
            ClassSessionSerializer(session, context={"request": request}).data,
            message="Class updated successfully",
        )

    def delete(self, request, *args, **kwargs):
        """Cancels rather than deletes once a class has been taught or joined.

        A class that has started, or that anyone opened the room for, is part
        of the record: the students who attended it must keep seeing it, and
        the attendance rows behind it have to survive. A class still ahead of
        everyone with nobody through the door is simply removed — but the
        students were told it existed when it was scheduled, so they are told
        it is off either way.
        """
        session = self.get_object()
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)
        if not can_manage(request.user, session):
            return error_response(message="You don't teach this course.", status_code=403)

        reason = request.data.get("cancellation_reason") if hasattr(request, "data") else ""
        has_been_taught = session.attendances.exists() or live_state(session) in (LIVE, ENDED)

        cancel_class(session, reason or "")
        if has_been_taught:
            session = self.get_object()
            return success_response(
                ClassSessionSerializer(session, context={"request": request}).data,
                message="Class cancelled — students who joined it keep seeing it with the reason.",
            )

        session.delete()
        return success_response({}, message="Class deleted — enrolled students have been notified.")


class TeacherClassSessionAttendanceView(generics.ListAPIView):
    """The register for one class."""

    permission_classes = [IsTeacherOrAdmin]
    serializer_class = ClassSessionAttendanceSerializer
    pagination_class = Pagination

    def get_queryset(self):
        session = teacher_sessions(self.request.user).filter(pk=self.kwargs["pk"]).first()
        if session is None:
            return None
        return attendance_for(session)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if queryset is None:
            return error_response(message="Class does not exist.", status_code=404)

        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Attendance fetched successfully")


# ---------------------------------------------------------------------------
# Student — the classes on courses they're enrolled in
# ---------------------------------------------------------------------------


class StudentUpcomingClassesView(_ClassSessionListView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return upcoming(student_sessions(self.request.user))


class StudentPastClassesView(_ClassSessionListView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return past(student_sessions(self.request.user))


# ---------------------------------------------------------------------------
# Shared — detail, join, leave
# ---------------------------------------------------------------------------


class ClassSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        session = visible_sessions(request.user).filter(pk=pk).first()
        # 404 rather than 403 for a class on a course the user has nothing to
        # do with: they aren't entitled to learn it exists.
        if session is None or not can_attend(request.user, session):
            return error_response(message="Class does not exist.", status_code=404)

        return success_response(
            ClassSessionSerializer(session, context={"request": request}).data,
            message="Class fetched successfully",
        )


class ClassSessionJoinView(APIView):
    """Mints this user's Agora token — the only way into a classroom.

    Returns `{channel_name, token, uid, role, expires_at, expires_in,
    roster}`. The Agora **App ID is deliberately not in that payload**: it is
    a public identifier the frontend carries as NEXT_PUBLIC_AGORA_APP_ID,
    while the App Certificate that signs the token never leaves the server.

    Called again by the frontend when Agora warns a token is about to expire,
    so it must stay cheap and idempotent: it writes at most one attendance
    row per person and never changes the channel.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        session = visible_sessions(request.user).filter(pk=pk).first()
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)

        try:
            credentials = issue_join_credentials(session=session, user=request.user)
        except SessionAccessDeniedError as exc:
            return error_response(message=str(exc), status_code=403)
        except SessionNotJoinableError as exc:
            # 403, not 404: the student is allowed to know the class exists —
            # they just can't get in yet.
            return error_response(message=str(exc), status_code=403)
        except AgoraNotConfiguredError as exc:
            return error_response(message=str(exc), status_code=503)

        return success_response(credentials, message="Classroom opened")


class ClassSessionLeaveView(APIView):
    """Best-effort "I've left" ping, so the register shows a departure time
    when the browser got the chance to send one."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk, *args, **kwargs):
        session = visible_sessions(request.user).filter(pk=pk).first()
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)

        record_leave(session=session, user=request.user)
        return success_response({}, message="Left the classroom")


class ClassSessionWhiteboardView(APIView):
    """The classroom whiteboard — one URL, two verbs.

    `POST` mints this user's Netless room token, creating the class's board
    on the first call (`services.issue_whiteboard_credentials`). It is behind
    exactly the same door as the video call, and is safe to call again: it
    never creates a second room and writes nothing to the register, so the
    frontend uses it both to open the board and to pick a fresh token up
    after the teacher changed who may draw.

    `PATCH` is the teacher handing the pen to the class, or taking it back —
    `{"whiteboard_access": "HOST_ONLY" | "EVERYONE"}`. It returns the updated
    class so both portals can render the new state without a second fetch.
    """

    permission_classes = [IsAuthenticated]
    http_method_names = ["post", "patch", "head", "options"]

    def _session(self, request, pk):
        return visible_sessions(request.user).filter(pk=pk).first()

    def post(self, request, pk, *args, **kwargs):
        session = self._session(request, pk)
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)

        try:
            credentials = issue_whiteboard_credentials(session=session, user=request.user)
        except SessionAccessDeniedError as exc:
            return error_response(message=str(exc), status_code=403)
        except SessionNotJoinableError as exc:
            # 403 rather than 404, same as joining the call: the student may
            # know the class exists — they just can't open its board yet.
            return error_response(message=str(exc), status_code=403)
        except (WhiteboardNotConfiguredError, WhiteboardUnavailableError) as exc:
            # Both are 503: one is a server missing its keys and the other is
            # Netless being unreachable, and in both cases the class itself is
            # fine and the board is what cannot be served.
            return error_response(message=str(exc), status_code=503)

        return success_response(credentials, message="Whiteboard opened")

    def patch(self, request, pk, *args, **kwargs):
        session = self._session(request, pk)
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)

        access = request.data.get("whiteboard_access")
        try:
            session = set_whiteboard_access(session=session, user=request.user, access=access)
        except SessionAccessDeniedError as exc:
            return error_response(message=str(exc), status_code=403)
        except SessionScheduleError as exc:
            return error_response(message=str(exc), status_code=400)

        message = (
            "Students can now draw on the whiteboard."
            if session.whiteboard_access == session.WhiteboardAccess.EVERYONE
            else "The whiteboard is yours to present on again."
        )
        return success_response(
            ClassSessionSerializer(session, context={"request": request}).data,
            message=message,
        )


class ClassSessionRecordingView(APIView):
    """This class's recording — one URL, three verbs.

    `GET` is what every surface reads: the classroom's REC indicator while a
    class runs, and the student's "Watch recording" button afterwards. It is
    the **only** thing that releases a playback link, and the link is signed
    fresh on each call and expires in hours, so a recording is exactly as
    private as the class it is of — the same rule that keeps a channel name
    and a whiteboard room uuid out of every listing.

    `POST` starts a recording and `DELETE` asks the running one to stop. Both
    are the host's alone: a student cannot start a recorder in a class, and
    cannot switch one off either.

    Stopping is deliberately not instant. The server flips the recording to
    PROCESSING and the monitor thread that owns it does the rest — reading the
    final file list, waiting for the file to land in the bucket and notifying
    the class — so there is one path that finishes a recording however it was
    ended, rather than two that can disagree.
    """

    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def _session(self, request, pk):
        return visible_sessions(request.user).filter(pk=pk).first()

    def get(self, request, pk, *args, **kwargs):
        session = self._session(request, pk)
        # 404 rather than 403 for a class on a course this user has nothing to
        # do with — they aren't entitled to learn it exists, let alone that it
        # was recorded.
        if session is None or not can_attend(request.user, session):
            return error_response(message="Class does not exist.", status_code=404)

        return success_response(
            recording_state(session=session, user=request.user),
            message="Recording state fetched successfully",
        )

    def post(self, request, pk, *args, **kwargs):
        session = self._session(request, pk)
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)
        if not is_host(request.user, session):
            return error_response(
                message="Only this class's teacher can start a recording.", status_code=403
            )

        try:
            start_recording(session=session, user=request.user)
        except RecordingNotConfiguredError as exc:
            return error_response(message=str(exc), status_code=503)
        except RecordingUnavailableError as exc:
            return error_response(message=str(exc), status_code=503)

        return success_response(
            recording_state(session=session, user=request.user),
            message="Recording started — everyone in the class is shown that it is on.",
        )

    def delete(self, request, pk, *args, **kwargs):
        session = self._session(request, pk)
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)
        if not is_host(request.user, session):
            return error_response(
                message="Only this class's teacher can stop the recording.", status_code=403
            )

        stopped = stop_recording(session=session, user=request.user, reason="the teacher stopped it")
        return success_response(
            recording_state(session=session, user=request.user),
            message=(
                "Recording stopped — your students are notified once it has finished processing."
                if stopped
                else "This class isn't being recorded."
            ),
        )


class ClassSessionNotesView(APIView):
    """This class's AI meeting notes — one URL, three verbs.

    Deliberately a separate URL from `/recording/`, backed by a separate
    Agora product and a separate switch on the class. A class can be written
    up without being filmed and filmed without being written up, and nothing
    in either path can break the other or the class itself.

    `GET` is what every surface reads: the "taking notes" indicator while a
    class runs, and the notes themselves afterwards. The write-up goes to
    anyone who may attend the class; the **verbatim transcript goes only to
    the course's teachers**, because it is a record of who said what in a
    room that may be full of minors, kept so the person who taught the class
    can check the notes against it.

    `POST` starts transcribing and `DELETE` asks the running transcription to
    stop. Both are the host's alone: a student cannot start a bot listening to
    a class, and cannot switch one off either.

    Stopping is deliberately not instant. The server flips the run to
    COLLECTING and the thread that owns it does the rest — pulling the bot out,
    waiting for the last caption slice to land, stitching the transcript,
    writing the notes up and telling the class — so there is one path that
    finishes a run however it was ended, rather than several that can
    disagree.
    """

    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def _session(self, request, pk):
        return visible_sessions(request.user).filter(pk=pk).first()

    def get(self, request, pk, *args, **kwargs):
        session = self._session(request, pk)
        # 404 rather than 403 for a class on a course this user has nothing to
        # do with — they aren't entitled to learn it exists, let alone what
        # was said in it.
        if session is None or not can_attend(request.user, session):
            return error_response(message="Class does not exist.", status_code=404)

        return success_response(
            notes_state(session=session, user=request.user),
            message="Class notes fetched successfully",
        )

    def post(self, request, pk, *args, **kwargs):
        session = self._session(request, pk)
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)
        if not is_host(request.user, session):
            return error_response(
                message="Only this class's teacher can start taking notes.",
                status_code=403,
            )

        try:
            start_notes(session=session, user=request.user)
        except NotesNotConfiguredError as exc:
            return error_response(message=str(exc), status_code=503)
        except NotesUnavailableError as exc:
            return error_response(message=str(exc), status_code=503)

        return success_response(
            notes_state(session=session, user=request.user),
            message="Taking notes — everyone in the class is shown that it is on.",
        )

    def delete(self, request, pk, *args, **kwargs):
        session = self._session(request, pk)
        if session is None:
            return error_response(message="Class does not exist.", status_code=404)
        if not is_host(request.user, session):
            return error_response(
                message="Only this class's teacher can stop the notes.", status_code=403
            )

        stopped = stop_notes(
            session=session, user=request.user, reason="the teacher stopped them"
        )
        return success_response(
            notes_state(session=session, user=request.user),
            message=(
                "Notes stopped — your students are notified once they're written up."
                if stopped
                else "This class isn't taking notes."
            ),
        )


class ClassSessionNotesDocumentView(APIView):
    """The notes as a PDF to keep.

    The file lives in MEDIA_ROOT, so this view is what makes it as private as
    the class it is of: the same roster check as the classroom door, on every
    download, and a random tail in the stored file name so the MEDIA path
    behind it is not a second way in that checks nothing. That is the same
    reasoning that keeps a recording's bucket private — the mechanism differs
    because the renderer is ours and the recorder's bucket is not.

    Streamed rather than redirected to for the same reason: a redirect would
    hand out a URL that outlives the check.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        session = visible_sessions(request.user).filter(pk=pk).first()
        if session is None or not can_attend(request.user, session):
            return error_response(message="Class does not exist.", status_code=404)

        notes = latest_available_notes(session)
        if notes is None or not notes.document:
            return error_response(
                message="There's no notes document for this class.", status_code=404
            )

        try:
            handle = notes.document.open("rb")
        except (FileNotFoundError, OSError):
            # The row says there is a document and the disk disagrees — a
            # restored database against a fresh media volume, most often. The
            # notes themselves are still on screen, so this is a missing
            # download rather than missing notes.
            return error_response(
                message="This notes document is no longer on the server.",
                status_code=404,
            )

        filename = f"{session.course.code}-{session.scheduled_at:%Y-%m-%d}-notes.pdf"
        return FileResponse(handle, as_attachment=True, filename=filename)
