from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin

from .exceptions import (
    NotEnoughTurnsError,
    RolePlayError,
    ScenarioUnavailableError,
    SessionClosedError,
    SimulatorUnavailableError,
    TurnLimitReachedError,
)
from .models import RolePlayScenario, RolePlaySession
from .serializers import (
    AdminRolePlaySessionSerializer,
    RolePlayScenarioSerializer,
    RolePlayScenarioWriteSerializer,
    RolePlaySessionListSerializer,
    RolePlaySessionSerializer,
    ScenarioListItemSerializer,
    StartSessionSerializer,
    SubmitTurnSerializer,
)
from .services import (
    abandon_session,
    best_sessions_by_scenario,
    evaluate_session,
    get_admin_stats,
    get_module_stats,
    published_scenarios,
    scenario_usage_counts,
    start_session,
    submit_turn,
)
from .throttling import RolePlayEvaluationThrottle, RolePlayTurnThrottle

# Which HTTP status each failure means. Kept in one place so the two action
# views can't drift: "you can't do that yet" (400), "that moment has passed"
# (409) and "our provider broke" (502) are three different things to a client.
_ERROR_STATUS = {
    ScenarioUnavailableError: 400,
    NotEnoughTurnsError: 400,
    SessionClosedError: 409,
    TurnLimitReachedError: 409,
    SimulatorUnavailableError: 502,
}


def _roleplay_error_response(exc):
    return error_response(message=str(exc), status_code=_ERROR_STATUS.get(type(exc), 409))


class _OwnedSessionView(APIView):
    """Shared owner-scoped lookup.

    Another student's session is a 404, never a 403 — the same convention
    quests and custom pathways use, so probing an id can't confirm that a row
    exists.
    """

    permission_classes = [IsAuthenticated]

    def get_session(self, request, pk):
        return (
            RolePlaySession.objects.filter(pk=pk, student=request.user)
            .select_related("scenario")
            .prefetch_related("turns")
            .first()
        )


class ScenarioListView(APIView):
    """The scenario picker: the published catalog plus this student's progress
    against each row.

    Progress is gathered in three queries up front and handed to the
    serializer through context, rather than one query per card.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        scenarios = list(published_scenarios())

        best_by_scenario = best_sessions_by_scenario(request.user)
        attempts_by_scenario = {
            row["scenario"]: row["total"]
            for row in RolePlaySession.objects.filter(student=request.user)
            .values("scenario")
            .annotate(total=Count("id"))
        }
        active_by_scenario = dict(
            RolePlaySession.objects.filter(
                student=request.user, status=RolePlaySession.SessionStatus.IN_PROGRESS
            ).values_list("scenario_id", "id")
        )

        serializer = ScenarioListItemSerializer(
            scenarios,
            many=True,
            context={
                "request": request,
                "best_by_scenario": best_by_scenario,
                "attempts_by_scenario": attempts_by_scenario,
                "active_by_scenario": active_by_scenario,
            },
        )

        # The module header is read off the first scenario rather than stored
        # separately — every scenario in the catalog carries the same module
        # code/title today, and an empty catalog has no module to name.
        module = (
            {"code": scenarios[0].module_code, "title": scenarios[0].module_title}
            if scenarios
            else None
        )

        return success_response(
            {
                "module": module,
                "scenarios": serializer.data,
                "stats": get_module_stats(request.user),
            },
            message="Role-play scenarios fetched successfully",
        )


class ModuleStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return success_response(
            get_module_stats(request.user), message="Role-play stats fetched successfully"
        )


class StartSessionView(APIView):
    """Opens a scene, or returns the one already open on that scenario."""

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = StartSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        scenario = RolePlayScenario.objects.filter(pk=serializer.validated_data["scenario_id"]).first()
        if scenario is None:
            return error_response(message="Scenario does not exist.", status_code=404)

        try:
            session, created = start_session(request.user, scenario)
        except RolePlayError as exc:
            return _roleplay_error_response(exc)

        return success_response(
            RolePlaySessionSerializer(session, context={"request": request}).data,
            message="Role-play started" if created else "Resumed your conversation",
            status_code=201 if created else 200,
        )


class SessionDetailView(_OwnedSessionView):
    def get(self, request, pk, *args, **kwargs):
        session = self.get_session(request, pk)
        if session is None:
            return error_response(message="Role-play session does not exist.", status_code=404)

        return success_response(
            RolePlaySessionSerializer(session, context={"request": request}).data,
            message="Role-play session fetched successfully",
        )


class SubmitTurnView(_OwnedSessionView):
    """One exchange: the athlete's line in, the counterpart's answer back.

    A provider failure rolls the athlete's line back with it (see
    services.submit_turn), so a 502 here means nothing was written and the
    frontend can safely restore the text to the composer.
    """

    throttle_classes = [RolePlayTurnThrottle]
    throttle_scope = "roleplay-turn"

    def post(self, request, pk, *args, **kwargs):
        session = self.get_session(request, pk)
        if session is None:
            return error_response(message="Role-play session does not exist.", status_code=404)

        serializer = SubmitTurnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            athlete_turn, counterpart_turn = submit_turn(session, serializer.validated_data["message"])
        except RolePlayError as exc:
            return _roleplay_error_response(exc)

        session.refresh_from_db()
        return success_response(
            {
                "session": RolePlaySessionSerializer(session, context={"request": request}).data,
                "athlete_turn_id": athlete_turn.id,
                "counterpart_turn_id": counterpart_turn.id,
            },
            message="Reply received",
        )


class EvaluateSessionView(_OwnedSessionView):
    """Closes the scene and returns the report card. Safe to call twice — an
    already-scored session comes back unchanged and is never paid for twice."""

    throttle_classes = [RolePlayEvaluationThrottle]
    throttle_scope = "roleplay-evaluation"

    def post(self, request, pk, *args, **kwargs):
        session = self.get_session(request, pk)
        if session is None:
            return error_response(message="Role-play session does not exist.", status_code=404)

        try:
            session = evaluate_session(session)
        except RolePlayError as exc:
            return _roleplay_error_response(exc)

        return success_response(
            RolePlaySessionSerializer(session, context={"request": request}).data,
            message="Role-play scored successfully",
        )


class AbandonSessionView(_OwnedSessionView):
    def post(self, request, pk, *args, **kwargs):
        session = self.get_session(request, pk)
        if session is None:
            return error_response(message="Role-play session does not exist.", status_code=404)

        try:
            session = abandon_session(session)
        except RolePlayError as exc:
            return _roleplay_error_response(exc)

        return success_response(
            RolePlaySessionSerializer(session, context={"request": request}).data,
            message="Conversation ended without scoring",
        )


class SessionHistoryView(generics.ListAPIView):
    """Every run this student has made, newest first."""

    permission_classes = [IsAuthenticated]
    pagination_class = Pagination
    serializer_class = RolePlaySessionListSerializer

    def get_queryset(self):
        queryset = RolePlaySession.objects.filter(student=self.request.user).select_related("scenario")
        params = self.request.query_params
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("scenario"):
            queryset = queryset.filter(scenario_id=params["scenario"])
        return queryset

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(page, many=True)
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Role-play history fetched successfully")


# ---------------------------------------------------------------------------
# Admin — scenario catalog
# ---------------------------------------------------------------------------


class AdminScenarioListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_serializer_class(self):
        return (
            RolePlayScenarioWriteSerializer
            if self.request.method == "POST"
            else RolePlayScenarioSerializer
        )

    def get_queryset(self):
        queryset = scenario_usage_counts()
        params = self.request.query_params
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("relationship"):
            queryset = queryset.filter(relationship=params["relationship"])
        if params.get("pressure_type"):
            queryset = queryset.filter(pressure_type=params["pressure_type"])
        if params.get("persona"):
            queryset = queryset.filter(persona=params["persona"])
        if params.get("search"):
            queryset = queryset.filter(title__icontains=params["search"])
        # Annotating drops Meta.ordering, which leaves pagination free to
        # return the same row on two pages — order explicitly.
        return queryset.order_by("order", "code")

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = RolePlayScenarioSerializer(page, many=True)
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Scenarios fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        scenario = serializer.save(created_by=request.user)
        return success_response(
            RolePlayScenarioSerializer(scenario).data,
            message="Scenario created successfully",
            status_code=201,
        )


class AdminScenarioDetailView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_object(self):
        return RolePlayScenario.objects.filter(pk=self.kwargs["pk"]).first()

    def get(self, request, *args, **kwargs):
        scenario = self.get_object()
        if scenario is None:
            return error_response(message="Scenario does not exist.", status_code=404)
        return success_response(
            RolePlayScenarioSerializer(scenario).data, message="Scenario fetched successfully"
        )

    def patch(self, request, *args, **kwargs):
        scenario = self.get_object()
        if scenario is None:
            return error_response(message="Scenario does not exist.", status_code=404)

        serializer = RolePlayScenarioWriteSerializer(scenario, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        scenario = serializer.save()
        return success_response(
            RolePlayScenarioSerializer(scenario).data, message="Scenario updated successfully"
        )

    def delete(self, request, *args, **kwargs):
        """Archives rather than deletes once students have run it —
        `RolePlaySession.scenario` is PROTECT, because a scored run backs a
        points ledger entry that has to stay explainable. A scenario nobody
        has ever opened is a genuine mistake and is really deleted."""
        scenario = self.get_object()
        if scenario is None:
            return error_response(message="Scenario does not exist.", status_code=404)

        if scenario.sessions.exists():
            scenario.status = Status.ARCHIVED
            scenario.save(update_fields=["status", "updated_at"])
            return success_response(
                RolePlayScenarioSerializer(scenario).data,
                message="Scenario archived — students have already run it.",
            )

        scenario.delete()
        return success_response({}, message="Scenario deleted successfully")


class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        return success_response(get_admin_stats(), message="Role-play stats fetched successfully")


class AdminSessionListView(generics.ListAPIView):
    """Every student's role-play activity, newest first.

    Read-only by design, for the same reason the quest submissions screen is:
    scoring is automatic and already paid out, so there is nothing to approve
    here. Reversing a wrongly awarded run is a points adjustment in `rewards`,
    which keeps that ledger append-only instead of editing history here.
    """

    permission_classes = [IsAdmin]
    pagination_class = Pagination
    serializer_class = AdminRolePlaySessionSerializer

    def get_queryset(self):
        queryset = RolePlaySession.objects.select_related("student", "scenario")
        params = self.request.query_params

        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("scenario"):
            queryset = queryset.filter(scenario_id=params["scenario"])
        if params.get("student"):
            queryset = queryset.filter(student_id=params["student"])
        if params.get("passed") in ("true", "false"):
            queryset = queryset.filter(passed=params["passed"] == "true")
        if params.get("date_from"):
            queryset = queryset.filter(created_at__date__gte=params["date_from"])
        if params.get("date_to"):
            queryset = queryset.filter(created_at__date__lte=params["date_to"])

        search = (params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(student__name__icontains=search)
                | Q(student__email__icontains=search)
                | Q(student__username__icontains=search)
                | Q(scenario__title__icontains=search)
                | Q(scenario__code__icontains=search)
            )

        return queryset.order_by("-created_at", "-id")

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(page, many=True)
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Role-play sessions fetched successfully")


class AdminSessionDetailView(APIView):
    """One run's full transcript and report card, for the admin drill-down."""

    permission_classes = [IsAdmin]

    def get(self, request, pk, *args, **kwargs):
        session = (
            RolePlaySession.objects.filter(pk=pk)
            .select_related("scenario", "student")
            .prefetch_related("turns")
            .first()
        )
        if session is None:
            return error_response(message="Role-play session does not exist.", status_code=404)

        data = RolePlaySessionSerializer(session, context={"request": request}).data
        data["student_name"] = session.student.name
        data["student_email"] = session.student.email
        return success_response(data, message="Role-play session fetched successfully")
