from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics

from common.pagination import Pagination
from common.response import error_response, success_response
from users.permissions import IsAdmin, IsStudent

from .exceptions import (
    FulfillmentError,
    InsufficientPointsError,
    RedemptionStateError,
    RewardNotAvailableError,
)
from .models import PointsTransaction, Reward, RewardRedemption
from .serializers import (
    AdminPointsTransactionSerializer,
    AdminRewardRedemptionSerializer,
    AdminStudentPointsSerializer,
    ManualAdjustmentSerializer,
    PointsSummarySerializer,
    PointsTransactionSerializer,
    RedemptionProcessSerializer,
    RewardCatalogSerializer,
    RewardRedeemRequestSerializer,
    RewardRedemptionSerializer,
    RewardScheduleWriteSerializer,
    RewardSerializer,
    RewardWriteSerializer,
)
from .services import adjust_points, get_points_summary, process_redemption, redeem_reward, schedule_redemption

UserModel = get_user_model()


# ---------------------------------------------------------------------------
# Admin — Reward catalog management
# ---------------------------------------------------------------------------


class RewardListCreateView(generics.ListCreateAPIView):
    queryset = Reward.objects.all()
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return RewardWriteSerializer
        return RewardSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))

        return queryset

    def list(self, request, *args, **kwargs):
        rewards = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(rewards)
        serializer = RewardSerializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Rewards fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reward = serializer.save()
        return success_response(
            RewardSerializer(reward).data, message="Reward created successfully", status_code=201
        )


class RewardDetailView(generics.RetrieveUpdateAPIView):
    queryset = Reward.objects.all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return RewardWriteSerializer
        return RewardSerializer

    def retrieve(self, request, *args, **kwargs):
        reward = self.get_object()
        return success_response(RewardSerializer(reward).data, message="Reward fetched successfully")

    def update(self, request, *args, **kwargs):
        reward = self.get_object()
        serializer = self.get_serializer(reward, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        reward = serializer.save()
        return success_response(RewardSerializer(reward).data, message="Reward updated successfully")


class RewardActivateView(generics.GenericAPIView):
    queryset = Reward.objects.all()
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        reward = self.get_object()
        reward.status = "ACTIVE"
        reward.save(update_fields=["status", "updated_at"])
        return success_response(RewardSerializer(reward).data, message="Reward activated successfully")


class RewardDeactivateView(generics.GenericAPIView):
    queryset = Reward.objects.all()
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        reward = self.get_object()
        reward.status = "ARCHIVED"
        reward.save(update_fields=["status", "updated_at"])
        return success_response(RewardSerializer(reward).data, message="Reward deactivated successfully")


# ---------------------------------------------------------------------------
# Student — catalog browsing & redemption
# ---------------------------------------------------------------------------


class RewardCatalogView(generics.GenericAPIView):
    """Active rewards only, with a `can_afford` flag against the caller's
    current balance. Intentionally unpaginated (plain array in `data`) — the
    admin-curated catalog is expected to stay small, matching the convention
    used for other bounded personal-ish lists (daily_drill, onboarding
    questions)."""

    permission_classes = [IsStudent]

    def get(self, request, *args, **kwargs):
        rewards = Reward.objects.filter(status="ACTIVE")
        summary = get_points_summary(request.user)
        serializer = RewardCatalogSerializer(
            rewards, many=True, context={"student_balance": summary["balance"]}
        )
        return success_response(
            {"balance": summary["balance"], "rewards": serializer.data},
            message="Rewards catalog fetched successfully",
        )


class RewardRedeemView(generics.GenericAPIView):
    queryset = Reward.objects.all()
    serializer_class = RewardRedeemRequestSerializer
    permission_classes = [IsStudent]

    def post(self, request, *args, **kwargs):
        reward_id = kwargs["pk"]
        body_serializer = self.get_serializer(data=request.data)
        body_serializer.is_valid(raise_exception=True)

        try:
            redemption = redeem_reward(
                student=request.user,
                reward_id=reward_id,
                student_note=body_serializer.validated_data.get("student_note", ""),
            )
        except Reward.DoesNotExist:
            return error_response(message="This reward no longer exists.", status_code=404)
        except (RewardNotAvailableError, InsufficientPointsError) as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            RewardRedemptionSerializer(redemption).data,
            message="Reward redeemed successfully",
            status_code=201,
        )


class MyRedemptionsView(generics.ListAPIView):
    serializer_class = RewardRedemptionSerializer
    permission_classes = [IsStudent]
    pagination_class = Pagination

    def get_queryset(self):
        return RewardRedemption.objects.filter(student=self.request.user).select_related(
            "reward", "processed_by", "approved_by", "cancelled_by", "fulfillment", "fulfillment__mentor"
        )

    def list(self, request, *args, **kwargs):
        redemptions = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(redemptions)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Redemption history fetched successfully")


# ---------------------------------------------------------------------------
# Admin — redemption management
# ---------------------------------------------------------------------------


class AdminRedemptionListView(generics.ListAPIView):
    serializer_class = AdminRewardRedemptionSerializer
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = RewardRedemption.objects.select_related(
            "student", "reward", "processed_by", "approved_by", "cancelled_by", "fulfillment", "fulfillment__mentor"
        )

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        student_id = self.request.query_params.get("student")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        return queryset

    def list(self, request, *args, **kwargs):
        redemptions = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(redemptions)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Redemptions fetched successfully")


class AdminRedemptionProcessView(generics.GenericAPIView):
    """Handles every status transition except scheduling — approve, mark
    ready (optionally attaching a digital code/access note), mark completed,
    or cancel (with a required reason, refunding points). Admin approval
    never implies fulfillment: this view cannot short-circuit APPROVED
    straight to a fulfilled state without an explicit, separate action."""

    queryset = RewardRedemption.objects.all()
    serializer_class = RedemptionProcessSerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        redemption = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            redemption = process_redemption(
                redemption_id=redemption.pk,
                new_status=serializer.validated_data["status"],
                actor=request.user,
                cancellation_reason=serializer.validated_data.get("cancellation_reason", ""),
                fulfillment_notes=serializer.validated_data.get("fulfillment_notes"),
            )
        except RedemptionStateError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            AdminRewardRedemptionSerializer(redemption).data,
            message="Redemption updated successfully",
        )


class AdminRedemptionScheduleView(generics.GenericAPIView):
    """Schedules (APPROVED -> SCHEDULED) or reschedules (SCHEDULED ->
    SCHEDULED) a redemption's fulfillment — a separate endpoint from the
    generic status PATCH above because it carries a materially richer
    payload (mentor/date/time/meeting info) that doesn't fit the simple
    `{status}` shape."""

    queryset = RewardRedemption.objects.all()
    serializer_class = RewardScheduleWriteSerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        redemption = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            redemption = schedule_redemption(
                redemption_id=redemption.pk,
                actor=request.user,
                mentor=serializer.get_mentor(),
                scheduled_date=data["scheduled_date"],
                start_time=data["start_time"],
                meeting_method=data.get("meeting_method", ""),
                meeting_url=data.get("meeting_url", ""),
                notes=data.get("notes", ""),
            )
        except FulfillmentError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            AdminRewardRedemptionSerializer(redemption).data,
            message="Redemption scheduled successfully",
        )


# ---------------------------------------------------------------------------
# Points — student self-service
# ---------------------------------------------------------------------------


class MyPointsSummaryView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request, *args, **kwargs):
        summary = get_points_summary(request.user)
        return success_response(
            PointsSummarySerializer(summary).data, message="Points summary fetched successfully"
        )


class MyPointsTransactionsView(generics.ListAPIView):
    serializer_class = PointsTransactionSerializer
    permission_classes = [IsStudent]
    pagination_class = Pagination

    def get_queryset(self):
        return PointsTransaction.objects.filter(student=self.request.user).select_related(
            "actor", "redemption__reward"
        )

    def list(self, request, *args, **kwargs):
        transactions = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(transactions)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Transaction history fetched successfully")


# ---------------------------------------------------------------------------
# Points — admin visibility & manual adjustment
# ---------------------------------------------------------------------------


class AdminStudentPointsListView(generics.ListAPIView):
    serializer_class = AdminStudentPointsSerializer
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = UserModel.objects.filter(role=UserModel.Roles.STUDENT)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(email__icontains=search))

        return queryset.order_by("name")

    def list(self, request, *args, **kwargs):
        students = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(students)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Student points fetched successfully")


class AdminStudentPointsDetailView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        try:
            student = UserModel.objects.get(pk=kwargs["student_id"], role=UserModel.Roles.STUDENT)
        except UserModel.DoesNotExist:
            return error_response(message="No student with this id exists.", status_code=404)

        summary = get_points_summary(student)
        recent_transactions = PointsTransaction.objects.filter(student=student).select_related(
            "actor", "redemption__reward"
        )[:10]

        data = {
            "student": {"id": student.id, "name": student.name, "email": student.email},
            **summary,
            "recent_transactions": PointsTransactionSerializer(recent_transactions, many=True).data,
        }
        return success_response(data, message="Student points detail fetched successfully")


class AdminPointsTransactionsListView(generics.ListAPIView):
    serializer_class = AdminPointsTransactionSerializer
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = PointsTransaction.objects.select_related("student", "actor", "redemption__reward")

        student_id = self.request.query_params.get("student")
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        transaction_type = self.request.query_params.get("type")
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type.upper())

        return queryset

    def list(self, request, *args, **kwargs):
        transactions = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(transactions)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Transactions fetched successfully")


class AdminAdjustPointsView(generics.GenericAPIView):
    serializer_class = ManualAdjustmentSerializer
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.get_student()

        try:
            txn = adjust_points(
                student=student,
                amount=serializer.validated_data["amount"],
                reason=serializer.validated_data["reason"],
                actor=request.user,
            )
        except InsufficientPointsError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            PointsTransactionSerializer(txn).data,
            message="Points adjustment recorded successfully",
            status_code=201,
        )
