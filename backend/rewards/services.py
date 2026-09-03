from datetime import datetime, timedelta

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from .exceptions import (
    FulfillmentError,
    InsufficientPointsError,
    RedemptionStateError,
    RewardNotAvailableError,
)
from .models import PointsTransaction, Reward, RewardFulfillment, RewardRedemption, StudentPointsAccount

TransactionType = PointsTransaction.TransactionType
RedemptionStatus = RewardRedemption.RedemptionStatus

# Which current status a redemption can move into via `process_redemption`.
# COMPLETED and CANCELLED are terminal — mirrors the read-only-once-terminal
# pattern used by enrollments' status state machine and quizzes' attempt
# lifecycle. SCHEDULED -> SCHEDULED (reschedule) is handled separately by
# `schedule_redemption`, not this simple-status-transition map.
_ALLOWED_TRANSITIONS = {
    RedemptionStatus.PENDING: {RedemptionStatus.APPROVED, RedemptionStatus.CANCELLED},
    RedemptionStatus.APPROVED: {
        RedemptionStatus.SCHEDULED,
        RedemptionStatus.READY,
        RedemptionStatus.COMPLETED,
        RedemptionStatus.CANCELLED,
    },
    RedemptionStatus.SCHEDULED: {RedemptionStatus.COMPLETED, RedemptionStatus.CANCELLED},
    RedemptionStatus.READY: {RedemptionStatus.COMPLETED, RedemptionStatus.CANCELLED},
    RedemptionStatus.COMPLETED: set(),
    RedemptionStatus.CANCELLED: set(),
}

# Statuses `schedule_redemption` may be called from — an initial schedule
# (APPROVED) or a reschedule of an already-scheduled session (SCHEDULED).
_SCHEDULABLE_STATUSES = {RedemptionStatus.APPROVED, RedemptionStatus.SCHEDULED}


def award_points(*, student, amount, transaction_type, reason="", drill_attempt=None,
                  ai_drill_generation=None, admin_drill_progress=None, redemption=None, actor=None):
    """Creates exactly one PointsTransaction and updates the student's balance
    to match, atomically. `amount` may be negative (a spend/adjustment-down);
    a negative amount that would drop the balance below zero raises
    InsufficientPointsError instead of writing anything.

    Locks the student's StudentPointsAccount row for the duration of the
    transaction (same select_for_update-then-recheck shape as
    future_clients.services.approve_application) so two concurrent awards/
    spends for the same student can't race past each other and both read a
    stale balance.
    """
    if amount == 0:
        raise ValueError("Points amount must be non-zero.")

    with transaction.atomic():
        account, _ = StudentPointsAccount.objects.select_for_update().get_or_create(student=student)

        new_balance = account.balance + amount
        if new_balance < 0:
            raise InsufficientPointsError("This would take the student's balance below zero.")

        account.balance = new_balance
        account.save(update_fields=["balance", "updated_at"])

        txn = PointsTransaction.objects.create(
            student=student,
            amount=amount,
            transaction_type=transaction_type,
            reason=reason,
            balance_after=new_balance,
            drill_attempt=drill_attempt,
            ai_drill_generation=ai_drill_generation,
            admin_drill_progress=admin_drill_progress,
            redemption=redemption,
            actor=actor,
        )

    return txn


def get_points_summary(student):
    account = StudentPointsAccount.objects.filter(student=student).first()
    balance = account.balance if account else 0

    total_earned = (
        PointsTransaction.objects.filter(student=student, amount__gt=0).aggregate(total=Sum("amount"))["total"]
        or 0
    )
    total_spent = (
        PointsTransaction.objects.filter(student=student, amount__lt=0).aggregate(total=Sum("amount"))["total"]
        or 0
    )

    return {
        "balance": balance,
        "total_earned": total_earned,
        "total_spent": abs(total_spent),
    }


def redeem_reward(*, student, reward_id, student_note=""):
    """Atomically validates and performs a redemption: reward must be active,
    the student must be able to afford it, and the whole thing (redemption
    row + balance deduction + ledger entry) commits together or not at all.

    Locks the Reward row (so a concurrent deactivate can't slip through
    mid-redemption) and the student's points account row (so two concurrent
    redemption requests from the same student can't both pass the balance
    check against the same starting balance — the second request blocks
    until the first commits, then re-reads the now-lower balance).

    `student_note` is optional free text the student attaches at redemption
    time (e.g. what they'd like to cover in a mentor session) — purely
    informational, never affects validation or points.
    """
    with transaction.atomic():
        reward = Reward.objects.select_for_update().get(pk=reward_id)

        if reward.status != "ACTIVE":
            raise RewardNotAvailableError("This reward is not currently available.")

        account, _ = StudentPointsAccount.objects.select_for_update().get_or_create(student=student)
        if account.balance < reward.points_required:
            raise InsufficientPointsError("You don't have enough points for this reward.")

        redemption = RewardRedemption.objects.create(
            student=student,
            reward=reward,
            points_cost=reward.points_required,
            status=RedemptionStatus.PENDING,
            student_note=student_note,
        )

        new_balance = account.balance - reward.points_required
        account.balance = new_balance
        account.save(update_fields=["balance", "updated_at"])

        PointsTransaction.objects.create(
            student=student,
            amount=-reward.points_required,
            transaction_type=TransactionType.REDEMPTION,
            reason=f"Redeemed: {reward.name}",
            balance_after=new_balance,
            redemption=redemption,
        )

    return redemption


def process_redemption(*, redemption_id, new_status, actor, cancellation_reason="", fulfillment_notes=None):
    """Admin-driven status transition (everything except scheduling — see
    `schedule_redemption` below for APPROVED/SCHEDULED -> SCHEDULED, which
    carries its own richer payload). A transition into CANCELLED refunds the
    spent points as a brand-new PointsTransaction (REDEMPTION_REFUND) — the
    original REDEMPTION transaction is never edited, keeping the ledger
    append-only/immutable per the historical-transaction rule. Admin
    approval does NOT imply fulfillment: APPROVED is not a terminal or
    fulfilled state, and COMPLETED is only ever reached explicitly.
    """
    with transaction.atomic():
        redemption = RewardRedemption.objects.select_for_update().get(pk=redemption_id)

        allowed = _ALLOWED_TRANSITIONS.get(redemption.status, set())
        if new_status not in allowed:
            raise RedemptionStateError(
                f"Cannot move a redemption from {redemption.status} to {new_status}."
            )

        now = timezone.now()
        update_fields = ["status", "processed_at", "processed_by", "updated_at"]

        if new_status == RedemptionStatus.CANCELLED:
            account, _ = StudentPointsAccount.objects.select_for_update().get_or_create(
                student=redemption.student
            )
            new_balance = account.balance + redemption.points_cost
            account.balance = new_balance
            account.save(update_fields=["balance", "updated_at"])

            PointsTransaction.objects.create(
                student=redemption.student,
                amount=redemption.points_cost,
                transaction_type=TransactionType.REDEMPTION_REFUND,
                reason=f"Refund for cancelled redemption: {redemption.reward.name}",
                balance_after=new_balance,
                redemption=redemption,
                actor=actor,
            )
            redemption.cancellation_reason = cancellation_reason
            redemption.cancelled_at = now
            redemption.cancelled_by = actor
            update_fields += ["cancellation_reason", "cancelled_at", "cancelled_by"]

        elif new_status == RedemptionStatus.APPROVED:
            redemption.approved_at = now
            redemption.approved_by = actor
            update_fields += ["approved_at", "approved_by"]

        elif new_status == RedemptionStatus.COMPLETED:
            # Points were already spent at redemption time — completing a
            # reward never touches the ledger again.
            fulfillment = getattr(redemption, "fulfillment", None)
            if fulfillment is not None:
                fulfillment.completed_at = now
                fulfillment.completed_by = actor
                fulfillment.save(update_fields=["completed_at", "completed_by", "updated_at"])

        if new_status == RedemptionStatus.READY and fulfillment_notes is not None:
            fulfillment, _ = RewardFulfillment.objects.get_or_create(redemption=redemption)
            fulfillment.notes = fulfillment_notes
            fulfillment.save(update_fields=["notes", "updated_at"])

        redemption.status = new_status
        redemption.processed_at = now
        redemption.processed_by = actor
        redemption.save(update_fields=update_fields)

    return redemption


def schedule_redemption(
    *, redemption_id, actor, scheduled_date, start_time, mentor=None,
    meeting_method="", meeting_url="", notes="",
):
    """Schedules (APPROVED -> SCHEDULED) or reschedules (SCHEDULED ->
    SCHEDULED) a redemption's fulfillment. Never touches points or creates a
    second redemption/transaction — rescheduling updates the same
    `RewardFulfillment` row in place. `end_time` is derived from the
    reward's `duration_minutes` (never accepted from the client), so the
    student can't be shown — or the mentor double-booked against — an
    inconsistent session length.
    """
    with transaction.atomic():
        redemption = RewardRedemption.objects.select_for_update().get(pk=redemption_id)

        if redemption.status not in _SCHEDULABLE_STATUSES:
            raise FulfillmentError(
                f"Cannot schedule a redemption in {redemption.status} status."
            )

        end_time = None
        duration = redemption.reward.duration_minutes
        if duration:
            start_dt = datetime.combine(scheduled_date, start_time)
            end_time = (start_dt + timedelta(minutes=duration)).time()

        fulfillment, _ = RewardFulfillment.objects.get_or_create(redemption=redemption)
        fulfillment.mentor = mentor
        fulfillment.scheduled_date = scheduled_date
        fulfillment.start_time = start_time
        fulfillment.end_time = end_time
        fulfillment.meeting_method = meeting_method
        fulfillment.meeting_url = meeting_url or None
        fulfillment.notes = notes
        fulfillment.save()

        redemption.status = RedemptionStatus.SCHEDULED
        redemption.processed_at = timezone.now()
        redemption.processed_by = actor
        redemption.save(update_fields=["status", "processed_at", "processed_by", "updated_at"])

    return redemption


def adjust_points(*, student, amount, reason, actor):
    """Authorized manual adjustment. Always routes through award_points so it
    gets the same locking/negative-balance guard as every other points
    movement — there is no separate "set balance" path."""
    if not reason or not reason.strip():
        raise ValueError("A reason is required for manual point adjustments.")
    if amount == 0:
        raise ValueError("Adjustment amount must be non-zero.")

    return award_points(
        student=student,
        amount=amount,
        transaction_type=TransactionType.MANUAL_ADJUSTMENT,
        reason=reason.strip(),
        actor=actor,
    )
