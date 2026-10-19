from django.db.models import Count
from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin

from .exceptions import LiveSessionError
from .models import LiveSession, SessionRSVP, SessionSpeaker
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
    past_sessions,
    rsvp_to_session,
    upcoming_sessions,
)


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
            context={"request": request, "rsvped_session_ids": _rsvped_ids(request.user, page)},
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
            .annotate(rsvp_count=Count("rsvps", distinct=True))
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
        return LiveSession.objects.filter(pk=pk).annotate(rsvp_count=Count("rsvps", distinct=True)).first()

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
# Admin — session scheduling & speaker roster
# ---------------------------------------------------------------------------


class AdminSessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    pagination_class = Pagination
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        queryset = LiveSession.objects.annotate(rsvp_count=Count("rsvps", distinct=True)).prefetch_related(
            "speakers"
        )
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
        serializer = AdminLiveSessionSerializer(page, many=True, context={"request": request})
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
            .annotate(rsvp_count=Count("rsvps", distinct=True))
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
        return SessionRSVP.objects.filter(session_id=self.kwargs["pk"]).select_related("student")

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
