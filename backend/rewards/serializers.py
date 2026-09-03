from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import PointsTransaction, Reward, RewardFulfillment, RewardRedemption
from .services import get_points_summary

UserModel = get_user_model()


class StudentBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()


class RewardSerializer(serializers.ModelSerializer):
    redemptions_count = serializers.SerializerMethodField()

    class Meta:
        model = Reward
        fields = [
            "id", "name", "description", "reward_type", "fulfillment_type", "duration_minutes",
            "points_required", "status", "redemptions_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "redemptions_count", "created_at", "updated_at"]

    def get_redemptions_count(self, reward):
        return reward.redemptions.count()


class RewardWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = ["name", "description", "reward_type", "fulfillment_type", "duration_minutes", "points_required"]

    def validate_points_required(self, value):
        if value <= 0:
            raise serializers.ValidationError("Points required must be greater than zero.")
        return value

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be blank.")
        return value.strip()

    def validate_duration_minutes(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Duration must be greater than zero minutes.")
        return value


class RewardCatalogSerializer(serializers.ModelSerializer):
    """Student-facing catalog row — includes the affordability flag the
    frontend needs to render the "Redeem" vs "Not enough points" state
    without a second round-trip."""

    can_afford = serializers.SerializerMethodField()

    class Meta:
        model = Reward
        fields = [
            "id", "name", "description", "reward_type", "fulfillment_type",
            "duration_minutes", "points_required", "can_afford",
        ]
        read_only_fields = fields

    def get_can_afford(self, reward):
        balance = self.context.get("student_balance", 0)
        return balance >= reward.points_required


class RewardBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = ["id", "name", "reward_type", "fulfillment_type", "duration_minutes", "points_required"]
        read_only_fields = fields


class RewardFulfillmentSerializer(serializers.ModelSerializer):
    mentor = StudentBriefSerializer(read_only=True)

    class Meta:
        model = RewardFulfillment
        fields = [
            "mentor", "scheduled_date", "start_time", "end_time",
            "meeting_method", "meeting_url", "notes", "completed_at",
        ]
        read_only_fields = fields


class RewardRedemptionSerializer(serializers.ModelSerializer):
    """Own-redemption-history shape — no `student` field since the caller
    (a student, via /my/redemptions/) already knows it's their own."""

    reward = RewardBriefSerializer(read_only=True)
    processed_by = StudentBriefSerializer(read_only=True)
    approved_by = StudentBriefSerializer(read_only=True)
    cancelled_by = StudentBriefSerializer(read_only=True)
    fulfillment = RewardFulfillmentSerializer(read_only=True)

    class Meta:
        model = RewardRedemption
        fields = [
            "id", "reward", "points_cost", "status", "student_note",
            "processed_at", "processed_by", "approved_at", "approved_by",
            "cancelled_at", "cancelled_by", "cancellation_reason",
            "fulfillment", "created_at",
        ]
        read_only_fields = fields


class AdminRewardRedemptionSerializer(RewardRedemptionSerializer):
    student = StudentBriefSerializer(read_only=True)

    class Meta(RewardRedemptionSerializer.Meta):
        fields = RewardRedemptionSerializer.Meta.fields + ["student"]
        read_only_fields = fields


class RewardRedeemRequestSerializer(serializers.Serializer):
    """Optional body for `POST /rewards/<id>/redeem/` — everything about the
    redemption itself (cost, affordability, reward status) is still
    determined entirely server-side; this only carries the student's
    free-text note."""

    student_note = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class RedemptionProcessSerializer(serializers.Serializer):
    STATUS_CHOICES = [
        RewardRedemption.RedemptionStatus.APPROVED,
        RewardRedemption.RedemptionStatus.READY,
        RewardRedemption.RedemptionStatus.COMPLETED,
        RewardRedemption.RedemptionStatus.CANCELLED,
    ]

    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    cancellation_reason = serializers.CharField(required=False, allow_blank=True, max_length=255)
    # Only used when transitioning to READY — e.g. a digital code or access
    # instructions to show the student. Optional everywhere else.
    fulfillment_notes = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate(self, attrs):
        if attrs["status"] == RewardRedemption.RedemptionStatus.CANCELLED and not attrs.get(
            "cancellation_reason", ""
        ).strip():
            raise serializers.ValidationError(
                {"cancellation_reason": "A reason is required when cancelling a redemption."}
            )
        return attrs


class RewardScheduleWriteSerializer(serializers.Serializer):
    """Body for `PATCH /rewards/admin/redemptions/<id>/schedule/` — used for
    both the initial schedule (APPROVED -> SCHEDULED) and a reschedule
    (SCHEDULED -> SCHEDULED); `end_time` is deliberately not accepted here,
    it's always derived server-side from the reward's `duration_minutes`."""

    mentor_id = serializers.IntegerField(required=False, allow_null=True)
    scheduled_date = serializers.DateField()
    start_time = serializers.TimeField()
    meeting_method = serializers.ChoiceField(
        choices=[*RewardFulfillment.MeetingMethod.choices, ("", "")], required=False, allow_blank=True
    )
    meeting_url = serializers.URLField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=2000)

    def validate_mentor_id(self, value):
        if value is None:
            return value
        try:
            mentor = UserModel.objects.get(pk=value, role__in=[UserModel.Roles.TEACHER, UserModel.Roles.ADMIN])
        except UserModel.DoesNotExist:
            raise serializers.ValidationError("No eligible mentor with this id exists.")
        self._mentor = mentor
        return value

    def get_mentor(self):
        return getattr(self, "_mentor", None)

    def validate(self, attrs):
        meeting_method = attrs.get("meeting_method", "")
        meeting_url = attrs.get("meeting_url", "")
        if meeting_method and meeting_method != RewardFulfillment.MeetingMethod.IN_PERSON and not meeting_url:
            raise serializers.ValidationError(
                {"meeting_url": "A meeting link is required for an online meeting method."}
            )
        return attrs


class PointsTransactionSerializer(serializers.ModelSerializer):
    actor = StudentBriefSerializer(read_only=True)
    redemption_reward_name = serializers.CharField(source="redemption.reward.name", read_only=True, default=None)

    class Meta:
        model = PointsTransaction
        fields = [
            "id", "amount", "transaction_type", "reason", "balance_after",
            "drill_attempt_id", "redemption_id", "redemption_reward_name",
            "actor", "created_at",
        ]
        read_only_fields = fields


class AdminPointsTransactionSerializer(PointsTransactionSerializer):
    student = StudentBriefSerializer(read_only=True)

    class Meta(PointsTransactionSerializer.Meta):
        fields = PointsTransactionSerializer.Meta.fields + ["student"]
        read_only_fields = fields


class PointsSummarySerializer(serializers.Serializer):
    balance = serializers.IntegerField()
    total_earned = serializers.IntegerField()
    total_spent = serializers.IntegerField()


class AdminStudentPointsSerializer(serializers.Serializer):
    """One row of the admin "student points" list — operates on CustomUser
    instances (role=STUDENT), not StudentPointsAccount, so a student who has
    never earned a point still shows up with a zero balance."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()
    balance = serializers.SerializerMethodField()
    total_earned = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    def _summary(self, student):
        cache = self.context.setdefault("_summary_cache", {})
        if student.id not in cache:
            cache[student.id] = get_points_summary(student)
        return cache[student.id]

    def get_balance(self, student):
        return self._summary(student)["balance"]

    def get_total_earned(self, student):
        return self._summary(student)["total_earned"]

    def get_total_spent(self, student):
        return self._summary(student)["total_spent"]


class ManualAdjustmentSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    amount = serializers.IntegerField()
    reason = serializers.CharField(max_length=255)

    def validate_amount(self, value):
        if value == 0:
            raise serializers.ValidationError("Adjustment amount must be non-zero.")
        return value

    def validate_reason(self, value):
        if not value.strip():
            raise serializers.ValidationError("A reason is required.")
        return value.strip()

    def validate_student_id(self, value):
        try:
            student = UserModel.objects.get(pk=value, role=UserModel.Roles.STUDENT)
        except UserModel.DoesNotExist:
            raise serializers.ValidationError("No student with this id exists.")
        self._student = student
        return value

    def get_student(self):
        return self._student
