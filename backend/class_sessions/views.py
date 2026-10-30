from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.pagination import Pagination
from common.response import error_response, success_response

from .exceptions import (
    AgoraNotConfiguredError,
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
    issue_join_credentials,
    issue_whiteboard_credentials,
    live_state,
    past,
    record_leave,
    schedule_class,
    set_whiteboard_access,
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
