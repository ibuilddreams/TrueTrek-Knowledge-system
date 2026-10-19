from django.conf import settings
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import generics
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin

from .exceptions import QuestError
from .models import DailyQuestAssignment, Quest
from .serializers import (
    AdminQuestSubmissionSerializer,
    CompleteQuestSerializer,
    DailyQuestAssignmentSerializer,
    QuestSerializer,
    QuestWriteSerializer,
)
from .services import complete_quest, get_or_assign_todays_quests, get_quest_stats, skip_quest
from .validators import validate_quest_proof


class TodaysQuestsView(APIView):
    """The student's quest board for today — assigning the day's set on the
    first call (see services.get_or_assign_todays_quests) so there is no
    separate "generate my quests" step the frontend has to remember to make."""

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        assignments = get_or_assign_todays_quests(request.user)
        return success_response(
            {
                "quests": DailyQuestAssignmentSerializer(
                    assignments, many=True, context={"request": request}
                ).data,
                "stats": get_quest_stats(request.user),
            },
            message="Today's quests fetched successfully",
        )


class QuestStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return success_response(get_quest_stats(request.user), message="Quest stats fetched successfully")


class QuestHistoryView(generics.ListAPIView):
    """Every quest this student has ever been assigned, newest first."""

    serializer_class = DailyQuestAssignmentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = DailyQuestAssignment.objects.filter(student=self.request.user).select_related("quest")
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Quest history fetched successfully")


class _StudentAssignmentActionView(APIView):
    """Shared owner-scoped lookup for the two completion actions below.

    Another student's assignment is a 404, never a 403 — the same
    owner-scoping convention custom pathways use, so an id probe can't
    confirm a row exists."""

    permission_classes = [IsAuthenticated]

    def get_assignment(self, request, assignment_id):
        return (
            DailyQuestAssignment.objects.filter(pk=assignment_id, student=request.user)
            .select_related("quest")
            .first()
        )


class CompleteQuestView(_StudentAssignmentActionView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request, assignment_id, *args, **kwargs):
        assignment = self.get_assignment(request, assignment_id)
        if assignment is None:
            return error_response(message="Quest assignment does not exist.", status_code=404)

        serializer = CompleteQuestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        proof_file = serializer.validated_data.get("proof_file")
        if proof_file:
            validate_quest_proof(proof_file)

        try:
            assignment = complete_quest(
                assignment=assignment,
                reflection=serializer.validated_data.get("reflection", ""),
                proof_file=proof_file,
                proof_original_name=proof_file.name if proof_file else "",
                proof_url=serializer.validated_data.get("proof_url", ""),
            )
        except QuestError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            {
                "quest": DailyQuestAssignmentSerializer(assignment, context={"request": request}).data,
                "stats": get_quest_stats(request.user),
            },
            message="Quest completed successfully",
        )


class SkipQuestView(_StudentAssignmentActionView):
    def post(self, request, assignment_id, *args, **kwargs):
        assignment = self.get_assignment(request, assignment_id)
        if assignment is None:
            return error_response(message="Quest assignment does not exist.", status_code=404)

        try:
            assignment = skip_quest(assignment)
        except QuestError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            {
                "quest": DailyQuestAssignmentSerializer(assignment, context={"request": request}).data,
                "stats": get_quest_stats(request.user),
            },
            message="Quest skipped",
        )


# ---------------------------------------------------------------------------
# Admin — quest catalog management
# ---------------------------------------------------------------------------


class AdminQuestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_serializer_class(self):
        return QuestWriteSerializer if self.request.method == "POST" else QuestSerializer

    def get_queryset(self):
        queryset = Quest.objects.annotate(
            assignment_count=Count("assignments", distinct=True),
            completion_count=Count(
                "assignments",
                filter=Q(assignments__status=DailyQuestAssignment.AssignmentStatus.COMPLETED),
                distinct=True,
            ),
        )
        params = self.request.query_params
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("category"):
            queryset = queryset.filter(category=params["category"])
        if params.get("difficulty"):
            queryset = queryset.filter(difficulty=params["difficulty"])
        if params.get("search"):
            queryset = queryset.filter(title__icontains=params["search"])
        # Annotating drops Meta.ordering, which leaves pagination free to
        # return the same row on two pages — order explicitly.
        return queryset.order_by("category", "title")

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = QuestSerializer(page, many=True)
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Quests fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quest = serializer.save(created_by=request.user)
        return success_response(
            QuestSerializer(quest).data, message="Quest created successfully", status_code=201
        )


class AdminQuestDetailView(generics.GenericAPIView):
    permission_classes = [IsAdmin]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_object(self):
        return Quest.objects.filter(pk=self.kwargs["pk"]).first()

    def get(self, request, *args, **kwargs):
        quest = self.get_object()
        if quest is None:
            return error_response(message="Quest does not exist.", status_code=404)
        return success_response(QuestSerializer(quest).data, message="Quest fetched successfully")

    def patch(self, request, *args, **kwargs):
        quest = self.get_object()
        if quest is None:
            return error_response(message="Quest does not exist.", status_code=404)

        serializer = QuestWriteSerializer(quest, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        quest = serializer.save()
        return success_response(QuestSerializer(quest).data, message="Quest updated successfully")

    def delete(self, request, *args, **kwargs):
        """Archives rather than deletes once a quest has been assigned —
        `DailyQuestAssignment.quest` is PROTECT, because a completed
        assignment backs a points ledger entry that must stay explainable.
        A never-assigned quest is a genuine mistake and is really deleted."""
        quest = self.get_object()
        if quest is None:
            return error_response(message="Quest does not exist.", status_code=404)

        if quest.assignments.exists():
            quest.status = Status.ARCHIVED
            quest.save(update_fields=["status", "updated_at"])
            return success_response(
                QuestSerializer(quest).data,
                message="Quest archived — it has already been assigned to students.",
            )

        quest.delete()
        return success_response({}, message="Quest deleted successfully")


class AdminQuestStatsView(APIView):
    """Catalog health for the admin Daily Quests screen.

    Everything here is derived from `DailyQuestAssignment` rather than stored
    counters, so it can't drift from what students actually did. The numbers
    answer the two questions an admin has: is the catalog big enough to keep
    rotating, and are students finishing what they're given?"""

    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        today = timezone.localdate()
        published = Quest.objects.filter(status=Status.PUBLISHED).count()
        assignments = DailyQuestAssignment.objects.all()
        completed = assignments.filter(status=DailyQuestAssignment.AssignmentStatus.COMPLETED)

        total_assigned = assignments.count()
        total_completed = completed.count()

        return success_response(
            {
                "published_quests": published,
                "draft_quests": Quest.objects.filter(status=Status.DRAFT).count(),
                "archived_quests": Quest.objects.filter(status=Status.ARCHIVED).count(),
                "quests_per_student_per_day": settings.DAILY_QUEST_COUNT,
                # How many days the catalog can run before a student starts
                # seeing repeats — the single most useful number for deciding
                # whether to write more quests.
                "days_of_rotation": published // settings.DAILY_QUEST_COUNT
                if settings.DAILY_QUEST_COUNT
                else 0,
                "total_assigned": total_assigned,
                "total_completed": total_completed,
                "completion_rate": round(total_completed / total_assigned * 100)
                if total_assigned
                else 0,
                "points_awarded": completed.aggregate(total=Sum("points_awarded"))["total"] or 0,
                "assigned_today": assignments.filter(assigned_date=today).count(),
                "completed_today": completed.filter(assigned_date=today).count(),
                "active_students_today": assignments.filter(assigned_date=today)
                .values("student")
                .distinct()
                .count(),
            },
            message="Quest stats fetched successfully",
        )


class AdminQuestSubmissionsView(generics.ListAPIView):
    """Every student's quest activity, newest first — "who did which quest".

    Admin-only and read-only by design: there is no approval workflow to
    action here (completion is self-attested and already paid out), so this
    screen exists to inspect and audit, never to grade. Reversing a wrongly
    awarded quest is a points adjustment in the rewards app, which keeps the
    ledger append-only rather than editing history here.
    """

    permission_classes = [IsAdmin]
    pagination_class = Pagination
    serializer_class = AdminQuestSubmissionSerializer

    def get_queryset(self):
        queryset = DailyQuestAssignment.objects.select_related("student", "quest")
        params = self.request.query_params

        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("quest"):
            queryset = queryset.filter(quest_id=params["quest"])
        if params.get("student"):
            queryset = queryset.filter(student_id=params["student"])
        if params.get("date_from"):
            queryset = queryset.filter(assigned_date__gte=params["date_from"])
        if params.get("date_to"):
            queryset = queryset.filter(assigned_date__lte=params["date_to"])
        if params.get("has_proof") == "true":
            # Either kind of proof counts — a student may attach a link, a
            # file, or both.
            queryset = queryset.filter(
                Q(proof_file__isnull=False) & ~Q(proof_file="")
                | Q(proof_url__isnull=False) & ~Q(proof_url="")
            )

        search = (params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(student__name__icontains=search)
                | Q(student__email__icontains=search)
                | Q(student__username__icontains=search)
                | Q(quest__title__icontains=search)
            )

        # Explicit ordering: the model's Meta ordering is by title within a
        # day, which is the wrong axis for an activity feed.
        return queryset.order_by("-assigned_date", "-completed_at", "-id")

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated, message="Quest submissions fetched successfully")
