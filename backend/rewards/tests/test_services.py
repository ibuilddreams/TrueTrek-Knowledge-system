from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase

from ..exceptions import InsufficientPointsError, RedemptionStateError, RewardNotAvailableError
from ..models import PointsTransaction, Reward, RewardRedemption, StudentPointsAccount
from ..services import (
    adjust_points,
    award_points,
    get_points_summary,
    process_redemption,
    redeem_reward,
)

UserModel = get_user_model()


def make_student(username="student1"):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.STUDENT,
        gender=UserModel.Gender.MALE,
    )


def make_admin(username="admin1"):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.ADMIN,
        gender=UserModel.Gender.MALE,
    )


class AwardPointsTests(TestCase):
    def setUp(self):
        self.student = make_student()

    def test_creates_account_and_transaction_on_first_award(self):
        txn = award_points(
            student=self.student, amount=100, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
        )
        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 100)
        self.assertEqual(txn.balance_after, 100)
        self.assertEqual(txn.amount, 100)

    def test_balance_accumulates_across_awards(self):
        award_points(student=self.student, amount=100, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        award_points(student=self.student, amount=50, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 150)
        self.assertEqual(PointsTransaction.objects.filter(student=self.student).count(), 2)

    def test_negative_amount_below_zero_raises_and_writes_nothing(self):
        award_points(student=self.student, amount=50, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        with self.assertRaises(InsufficientPointsError):
            award_points(
                student=self.student, amount=-100, transaction_type=PointsTransaction.TransactionType.MANUAL_ADJUSTMENT
            )
        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 50)
        self.assertEqual(PointsTransaction.objects.filter(student=self.student).count(), 1)

    def test_zero_amount_rejected(self):
        with self.assertRaises(ValueError):
            award_points(student=self.student, amount=0, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)


class DrillAttemptIdempotencyTests(TestCase):
    """Guards the DB-level uniqueness constraint tying at most one
    PointsTransaction to a given drill attempt — belt-and-suspenders on top
    of the fact that award_points is called inside the same atomic block as
    the DrillAttempt creation."""

    def setUp(self):
        self.student = make_student()

    def test_duplicate_transaction_for_same_attempt_rejected_at_db_level(self):
        txn = award_points(
            student=self.student,
            amount=80,
            transaction_type=PointsTransaction.TransactionType.DRILL_REWARD,
        )
        # Fabricate a drill_attempt-linked transaction, then try to attach a
        # second one to the same attempt id.
        from daily_drill.models import DrillAttempt, DrillOption, DrillQuestion

        question = DrillQuestion.objects.create(scenario="s", guidelines="g")
        option = DrillOption.objects.create(question=question, key="A", text="t", impact="i", rationale="r", score=40)
        from django.utils import timezone

        attempt = DrillAttempt.objects.create(
            student=self.student,
            question=question,
            selected_option=option,
            attempt_date=timezone.localdate(),
            score_awarded=40,
            xp_earned=80,
        )
        PointsTransaction.objects.filter(pk=txn.pk).update(drill_attempt=attempt)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                PointsTransaction.objects.create(
                    student=self.student,
                    amount=80,
                    transaction_type=PointsTransaction.TransactionType.DRILL_REWARD,
                    balance_after=160,
                    drill_attempt=attempt,
                )


class RedeemRewardTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.reward = Reward.objects.create(name="Mentor Session", points_required=500, status="ACTIVE")
        award_points(student=self.student, amount=800, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)

    def test_successful_redemption_deducts_points_and_records_transaction(self):
        redemption = redeem_reward(student=self.student, reward_id=self.reward.pk)

        self.assertEqual(redemption.points_cost, 500)
        self.assertEqual(redemption.status, RewardRedemption.RedemptionStatus.PENDING)

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 300)

        txn = PointsTransaction.objects.get(redemption=redemption)
        self.assertEqual(txn.amount, -500)
        self.assertEqual(txn.transaction_type, PointsTransaction.TransactionType.REDEMPTION)

    def test_insufficient_points_rejected(self):
        cheap_reward = Reward.objects.create(name="Expensive", points_required=10000, status="ACTIVE")
        with self.assertRaises(InsufficientPointsError):
            redeem_reward(student=self.student, reward_id=cheap_reward.pk)
        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 800)

    def test_inactive_reward_cannot_be_redeemed(self):
        self.reward.status = "ARCHIVED"
        self.reward.save(update_fields=["status"])
        with self.assertRaises(RewardNotAvailableError):
            redeem_reward(student=self.student, reward_id=self.reward.pk)
        self.assertEqual(RewardRedemption.objects.count(), 0)

    def test_double_redeem_cannot_double_spend(self):
        """Two redemptions of the same 500-point reward against an 800-point
        balance must not both succeed — the second must see the balance
        already reduced by the first and fail on insufficient points."""
        redeem_reward(student=self.student, reward_id=self.reward.pk)
        with self.assertRaises(InsufficientPointsError):
            redeem_reward(student=self.student, reward_id=self.reward.pk)

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 300)
        self.assertEqual(RewardRedemption.objects.filter(student=self.student).count(), 1)


class ProcessRedemptionTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.admin = make_admin()
        self.reward = Reward.objects.create(name="Mentor Session", points_required=500, status="ACTIVE")
        award_points(student=self.student, amount=800, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        self.redemption = redeem_reward(student=self.student, reward_id=self.reward.pk)

    def test_pending_to_approved_to_completed(self):
        redemption = process_redemption(
            redemption_id=self.redemption.pk,
            new_status=RewardRedemption.RedemptionStatus.APPROVED,
            actor=self.admin,
        )
        self.assertEqual(redemption.status, RewardRedemption.RedemptionStatus.APPROVED)

        redemption = process_redemption(
            redemption_id=self.redemption.pk,
            new_status=RewardRedemption.RedemptionStatus.COMPLETED,
            actor=self.admin,
        )
        self.assertEqual(redemption.status, RewardRedemption.RedemptionStatus.COMPLETED)
        self.assertEqual(redemption.processed_by, self.admin)

    def test_completed_is_terminal(self):
        process_redemption(
            redemption_id=self.redemption.pk,
            new_status=RewardRedemption.RedemptionStatus.APPROVED,
            actor=self.admin,
        )
        process_redemption(
            redemption_id=self.redemption.pk,
            new_status=RewardRedemption.RedemptionStatus.COMPLETED,
            actor=self.admin,
        )
        with self.assertRaises(RedemptionStateError):
            process_redemption(
                redemption_id=self.redemption.pk,
                new_status=RewardRedemption.RedemptionStatus.CANCELLED,
                actor=self.admin,
            )

    def test_cancellation_refunds_points_as_new_transaction(self):
        process_redemption(
            redemption_id=self.redemption.pk,
            new_status=RewardRedemption.RedemptionStatus.CANCELLED,
            actor=self.admin,
            cancellation_reason="Out of stock",
        )

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 800)

        original_txn = PointsTransaction.objects.get(
            redemption=self.redemption, transaction_type=PointsTransaction.TransactionType.REDEMPTION
        )
        self.assertEqual(original_txn.amount, -500)  # untouched, not rewritten

        refund_txn = PointsTransaction.objects.get(
            redemption=self.redemption, transaction_type=PointsTransaction.TransactionType.REDEMPTION_REFUND
        )
        self.assertEqual(refund_txn.amount, 500)
        self.assertEqual(refund_txn.actor, self.admin)


class AdjustPointsTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.admin = make_admin()

    def test_positive_adjustment_recorded_with_actor_and_reason(self):
        txn = adjust_points(student=self.student, amount=200, reason="Contest winner", actor=self.admin)
        self.assertEqual(txn.transaction_type, PointsTransaction.TransactionType.MANUAL_ADJUSTMENT)
        self.assertEqual(txn.actor, self.admin)
        self.assertEqual(txn.reason, "Contest winner")

        summary = get_points_summary(self.student)
        self.assertEqual(summary["balance"], 200)
        self.assertEqual(summary["total_earned"], 200)

    def test_negative_adjustment_below_zero_rejected(self):
        with self.assertRaises(InsufficientPointsError):
            adjust_points(student=self.student, amount=-50, reason="Penalty", actor=self.admin)

    def test_blank_reason_rejected(self):
        with self.assertRaises(ValueError):
            adjust_points(student=self.student, amount=50, reason="   ", actor=self.admin)

    def test_zero_amount_rejected(self):
        with self.assertRaises(ValueError):
            adjust_points(student=self.student, amount=0, reason="whatever", actor=self.admin)


class PointsSummaryTests(TestCase):
    def test_summary_for_student_with_no_account(self):
        student = make_student()
        summary = get_points_summary(student)
        self.assertEqual(summary, {"balance": 0, "total_earned": 0, "total_spent": 0})

    def test_earn_and_spend_totals(self):
        student = make_student()
        award_points(student=student, amount=300, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        reward = Reward.objects.create(name="Small reward", points_required=100, status="ACTIVE")
        redeem_reward(student=student, reward_id=reward.pk)

        summary = get_points_summary(student)
        self.assertEqual(summary["balance"], 200)
        self.assertEqual(summary["total_earned"], 300)
        self.assertEqual(summary["total_spent"], 100)
