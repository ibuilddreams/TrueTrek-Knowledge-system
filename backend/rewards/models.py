from django.conf import settings
from django.db import models

from common.models import BaseModel, Status


class Reward(BaseModel):
    """A catalog item students can redeem points for.

    Reuses common.Status (ACTIVE/ARCHIVED) instead of a bespoke boolean so it
    can be deactivated (hidden from the catalog) without breaking the
    on_delete=PROTECT relation from RewardRedemption — redemption history is
    never lost by archiving a reward.
    """

    class RewardType(models.TextChoices):
        MERCHANDISE = "MERCHANDISE", "Merchandise"
        MENTORSHIP = "MENTORSHIP", "Mentorship"
        DISCOUNT = "DISCOUNT", "Discount"
        EXPERIENCE = "EXPERIENCE", "Experience"
        OTHER = "OTHER", "Other"

    class FulfillmentType(models.TextChoices):
        """How a redemption of this reward actually gets delivered — separate
        from `reward_type` (what the reward *is*) on purpose: two rewards of
        the same `reward_type` can be fulfilled completely differently (e.g.
        a MENTORSHIP reward could in principle be a scheduled session or a
        pre-recorded digital access grant). Drives which redemption statuses
        a fulfillment goes through and which admin UI is shown."""

        SCHEDULED_SESSION = "SCHEDULED_SESSION", "Scheduled Session"
        EVENT_ACCESS = "EVENT_ACCESS", "Event Access"
        DIGITAL_CODE = "DIGITAL_CODE", "Digital Code"
        DIGITAL_ACCESS = "DIGITAL_ACCESS", "Digital Access"
        PHYSICAL_DELIVERY = "PHYSICAL_DELIVERY", "Physical Delivery"
        PROFILE_BADGE = "PROFILE_BADGE", "Profile Badge"
        MANUAL_FULFILLMENT = "MANUAL_FULFILLMENT", "Manual Fulfillment"

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    reward_type = models.CharField(max_length=20, choices=RewardType.choices, default=RewardType.OTHER)
    fulfillment_type = models.CharField(
        max_length=20, choices=FulfillmentType.choices, default=FulfillmentType.MANUAL_FULFILLMENT
    )
    # Only meaningful for SCHEDULED_SESSION (and optionally EVENT_ACCESS) rewards —
    # used to auto-compute a fulfillment's end_time from its start_time.
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    points_required = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["points_required", "name"]

    def __str__(self):
        return self.name


class StudentPointsAccount(BaseModel):
    """The student's current spendable balance.

    A cache, not a second source of truth: every write to `balance` happens
    inside the same `transaction.atomic()` block that creates the
    PointsTransaction row explaining it (see rewards/services.py) — the
    ledger is what makes the balance auditable/reconstructible, the account
    row just avoids re-summing the whole ledger on every read.
    """

    student = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="points_account"
    )
    balance = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.student} — {self.balance} pts"


class RewardRedemption(BaseModel):
    class RedemptionStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        SCHEDULED = "SCHEDULED", "Scheduled"
        READY = "READY", "Ready"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reward_redemptions"
    )
    reward = models.ForeignKey(Reward, on_delete=models.PROTECT, related_name="redemptions")
    points_cost = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20, choices=RedemptionStatus.choices, default=RedemptionStatus.PENDING
    )
    # Optional message the student attaches at redemption time (e.g. what
    # they'd like to discuss in a mentor session) — shown to the admin
    # alongside the redemption, never editable after the fact.
    student_note = models.TextField(blank=True)

    # `processed_at`/`processed_by` predate the fulfillment workflow and are
    # kept exactly as before (updated on every transition — "who/when did
    # the most recent status change"), for backward compatibility with
    # existing code/tests. `approved_at`/`approved_by` and
    # `cancelled_at`/`cancelled_by` are additive, precise milestone markers
    # requested by the fulfillment workflow — each set exactly once and never
    # overwritten by a later transition, unlike `processed_at`/`processed_by`.
    processed_at = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reward_redemptions_processed",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reward_redemptions_approved",
    )
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reward_redemptions_cancelled",
    )
    cancellation_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student} — {self.reward} ({self.status})"


class RewardFulfillment(BaseModel):
    """Fulfillment details for a redemption — split out from
    `RewardRedemption` rather than added as more columns on it, since a
    scheduled-session's mentor/date/time/meeting fields are only meaningful
    for a subset of redemptions and would otherwise sit null on every other
    row. One-to-one because a redemption has exactly one fulfillment record
    that gets updated in place (rescheduling updates this row, it never
    creates a second one)."""

    class MeetingMethod(models.TextChoices):
        ZOOM = "ZOOM", "Zoom"
        GOOGLE_MEET = "GOOGLE_MEET", "Google Meet"
        TEAMS = "TEAMS", "Microsoft Teams"
        IN_PERSON = "IN_PERSON", "In Person"

    redemption = models.OneToOneField(RewardRedemption, on_delete=models.CASCADE, related_name="fulfillment")
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mentor_reward_sessions",
    )
    scheduled_date = models.DateField(null=True, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    meeting_method = models.CharField(max_length=20, choices=MeetingMethod.choices, blank=True)
    meeting_url = models.URLField(blank=True, null=True)
    # Free-text field reused across fulfillment types: scheduling notes for a
    # session, or a digital code/access instructions for DIGITAL_CODE /
    # DIGITAL_ACCESS rewards — kept generic rather than adding a dedicated
    # column per fulfillment type, per the brief's "don't overbuild" guidance.
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reward_fulfillments_completed",
    )

    def __str__(self):
        return f"Fulfillment for redemption #{self.redemption_id}"


class PointsTransaction(BaseModel):
    """Immutable, append-only ledger row. Every balance change — earn, spend,
    refund, or manual adjustment — has exactly one row here; nothing in this
    app ever mutates a transaction after creation.
    """

    class TransactionType(models.TextChoices):
        DRILL_REWARD = "DRILL_REWARD", "Daily Drill Reward"
        REDEMPTION = "REDEMPTION", "Reward Redemption"
        REDEMPTION_REFUND = "REDEMPTION_REFUND", "Redemption Refund"
        MANUAL_ADJUSTMENT = "MANUAL_ADJUSTMENT", "Manual Adjustment"

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="points_transactions"
    )
    amount = models.IntegerField()
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    reason = models.CharField(max_length=255, blank=True)
    balance_after = models.PositiveIntegerField()
    drill_attempt = models.ForeignKey(
        "daily_drill.DrillAttempt",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="points_transactions",
    )
    ai_drill_generation = models.ForeignKey(
        "daily_drill.AIDrillGeneration",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="points_transactions",
    )
    admin_drill_progress = models.ForeignKey(
        "daily_drill.AdminDrillProgress",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="points_transactions",
    )
    redemption = models.ForeignKey(
        RewardRedemption,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="points_transactions",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="points_adjustments_made",
    )

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["drill_attempt"],
                condition=models.Q(drill_attempt__isnull=False),
                name="one_points_transaction_per_drill_attempt",
            ),
        ]

    def __str__(self):
        return f"{self.student} — {self.amount:+d} ({self.transaction_type})"
