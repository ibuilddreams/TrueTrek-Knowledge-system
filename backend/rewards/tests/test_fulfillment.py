from datetime import date, time

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..exceptions import FulfillmentError, RedemptionStateError
from ..models import PointsTransaction, Reward, RewardFulfillment, RewardRedemption, StudentPointsAccount
from ..services import (
    award_points,
    process_redemption,
    redeem_reward,
    schedule_redemption,
)

UserModel = get_user_model()
RedemptionStatus = RewardRedemption.RedemptionStatus


def make_student(username="fulfillstudent"):
    return UserModel.objects.create_user(
        username=username, email=f"{username}@example.com", password="StrongPass123!",
        role=UserModel.Roles.STUDENT, gender=UserModel.Gender.MALE,
    )


def make_admin(username="fulfilladmin"):
    return UserModel.objects.create_user(
        username=username, email=f"{username}@example.com", password="StrongPass123!",
        role=UserModel.Roles.ADMIN, gender=UserModel.Gender.MALE,
    )


def make_mentor(username="fulfillmentor"):
    return UserModel.objects.create_user(
        username=username, email=f"{username}@example.com", password="StrongPass123!",
        role=UserModel.Roles.TEACHER, gender=UserModel.Gender.MALE,
    )


def make_mentor_reward(points=150, duration=30):
    return Reward.objects.create(
        name="Mentor 1-on-1 Session",
        reward_type="MENTORSHIP",
        fulfillment_type=Reward.FulfillmentType.SCHEDULED_SESSION,
        duration_minutes=duration,
        points_required=points,
        status="ACTIVE",
    )


class RedeemWithNoteTests(TestCase):
    def test_redeem_stores_optional_student_note(self):
        student = make_student()
        reward = make_mentor_reward()
        award_points(student=student, amount=200, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)

        redemption = redeem_reward(student=student, reward_id=reward.pk, student_note="Discuss Tier 2 pathway.")
        self.assertEqual(redemption.student_note, "Discuss Tier 2 pathway.")

    def test_redeem_without_note_defaults_blank(self):
        student = make_student()
        reward = make_mentor_reward()
        award_points(student=student, amount=200, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)

        redemption = redeem_reward(student=student, reward_id=reward.pk)
        self.assertEqual(redemption.student_note, "")


class ApprovalMilestoneTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.admin = make_admin()
        self.reward = make_mentor_reward()
        award_points(
            student=self.student, amount=200, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
        )
        self.redemption = redeem_reward(student=self.student, reward_id=self.reward.pk)

    def test_approve_records_actor_and_timestamp_without_completing(self):
        redemption = process_redemption(
            redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin
        )
        self.assertEqual(redemption.status, RedemptionStatus.APPROVED)
        self.assertIsNotNone(redemption.approved_at)
        self.assertEqual(redemption.approved_by, self.admin)
        # Admin approval must NOT imply fulfillment.
        self.assertNotEqual(redemption.status, RedemptionStatus.COMPLETED)

    def test_cannot_approve_a_cancelled_redemption(self):
        process_redemption(
            redemption_id=self.redemption.pk, new_status=RedemptionStatus.CANCELLED,
            actor=self.admin, cancellation_reason="Not needed",
        )
        with self.assertRaises(RedemptionStateError):
            process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)

    def test_cannot_approve_a_completed_redemption(self):
        process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.COMPLETED, actor=self.admin)
        with self.assertRaises(RedemptionStateError):
            process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)


class SchedulingTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.admin = make_admin()
        self.mentor = make_mentor()
        self.reward = make_mentor_reward(points=150, duration=30)
        award_points(
            student=self.student, amount=200, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
        )
        self.redemption = redeem_reward(student=self.student, reward_id=self.reward.pk)

    def test_cannot_schedule_before_approval(self):
        with self.assertRaises(FulfillmentError):
            schedule_redemption(
                redemption_id=self.redemption.pk, actor=self.admin, mentor=self.mentor,
                scheduled_date=date(2026, 9, 10), start_time=time(15, 0),
            )

    def test_schedule_moves_to_scheduled_and_computes_end_time(self):
        process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        redemption = schedule_redemption(
            redemption_id=self.redemption.pk, actor=self.admin, mentor=self.mentor,
            scheduled_date=date(2026, 9, 10), start_time=time(15, 0),
            meeting_method="GOOGLE_MEET", meeting_url="https://meet.google.com/abc",
        )

        self.assertEqual(redemption.status, RedemptionStatus.SCHEDULED)
        fulfillment = redemption.fulfillment
        self.assertEqual(fulfillment.mentor, self.mentor)
        self.assertEqual(str(fulfillment.start_time), "15:00:00")
        self.assertEqual(str(fulfillment.end_time), "15:30:00")  # 30-minute duration
        self.assertEqual(RewardFulfillment.objects.filter(redemption=self.redemption).count(), 1)

    def test_no_additional_points_deducted_on_schedule(self):
        process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        schedule_redemption(
            redemption_id=self.redemption.pk, actor=self.admin,
            scheduled_date=date(2026, 9, 10), start_time=time(15, 0),
        )
        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 50)  # 200 - 150, unchanged by scheduling
        self.assertEqual(
            PointsTransaction.objects.filter(student=self.student, redemption=self.redemption).count(), 1
        )  # only the original REDEMPTION spend

    def test_reschedule_updates_same_fulfillment_row_not_a_new_one(self):
        process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        schedule_redemption(
            redemption_id=self.redemption.pk, actor=self.admin,
            scheduled_date=date(2026, 9, 10), start_time=time(15, 0),
        )
        redemption = schedule_redemption(
            redemption_id=self.redemption.pk, actor=self.admin,
            scheduled_date=date(2026, 9, 12), start_time=time(16, 0),
        )

        self.assertEqual(redemption.status, RedemptionStatus.SCHEDULED)
        self.assertEqual(RewardFulfillment.objects.filter(redemption=self.redemption).count(), 1)
        fulfillment = redemption.fulfillment
        self.assertEqual(str(fulfillment.start_time), "16:00:00")
        self.assertEqual(RewardRedemption.objects.filter(student=self.student).count(), 1)  # no duplicate redemption

    def test_reschedule_does_not_create_another_transaction(self):
        process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        schedule_redemption(
            redemption_id=self.redemption.pk, actor=self.admin, scheduled_date=date(2026, 9, 10), start_time=time(15, 0)
        )
        schedule_redemption(
            redemption_id=self.redemption.pk, actor=self.admin, scheduled_date=date(2026, 9, 12), start_time=time(16, 0)
        )
        # Baseline from setUp: 1 DRILL_REWARD (the initial award_points) + 1
        # REDEMPTION (the redeem_reward spend) — scheduling/rescheduling
        # must add zero more.
        self.assertEqual(PointsTransaction.objects.filter(student=self.student).count(), 2)


class CompletionTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.admin = make_admin()
        self.reward = make_mentor_reward()
        award_points(
            student=self.student, amount=200, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
        )
        self.redemption = redeem_reward(student=self.student, reward_id=self.reward.pk)
        process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        schedule_redemption(
            redemption_id=self.redemption.pk, actor=self.admin, scheduled_date=date(2026, 9, 10), start_time=time(15, 0)
        )

    def test_scheduled_to_completed_records_completion_and_no_refund(self):
        redemption = process_redemption(
            redemption_id=self.redemption.pk, new_status=RedemptionStatus.COMPLETED, actor=self.admin
        )
        self.assertEqual(redemption.status, RedemptionStatus.COMPLETED)
        fulfillment = redemption.fulfillment
        self.assertIsNotNone(fulfillment.completed_at)
        self.assertEqual(fulfillment.completed_by, self.admin)

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 50)  # points were spent at redemption, not refunded on completion
        self.assertEqual(
            PointsTransaction.objects.filter(
                student=self.student, transaction_type=PointsTransaction.TransactionType.REDEMPTION_REFUND
            ).count(),
            0,
        )

    def test_cannot_complete_twice(self):
        process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.COMPLETED, actor=self.admin)
        with self.assertRaises(RedemptionStateError):
            process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.COMPLETED, actor=self.admin)

    def test_cannot_complete_a_cancelled_redemption(self):
        process_redemption(
            redemption_id=self.redemption.pk, new_status=RedemptionStatus.CANCELLED,
            actor=self.admin, cancellation_reason="Mentor unavailable",
        )
        with self.assertRaises(RedemptionStateError):
            process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.COMPLETED, actor=self.admin)

    def test_ready_to_completed_for_digital_reward(self):
        digital_reward = Reward.objects.create(
            name="Course Discount Code", fulfillment_type=Reward.FulfillmentType.DIGITAL_CODE,
            points_required=50, status="ACTIVE",
        )
        redemption = redeem_reward(student=self.student, reward_id=digital_reward.pk)
        process_redemption(redemption_id=redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        redemption = process_redemption(
            redemption_id=redemption.pk, new_status=RedemptionStatus.READY,
            actor=self.admin, fulfillment_notes="CODE: SAVE20",
        )
        self.assertEqual(redemption.status, RedemptionStatus.READY)
        self.assertEqual(redemption.fulfillment.notes, "CODE: SAVE20")

        redemption = process_redemption(redemption_id=redemption.pk, new_status=RedemptionStatus.COMPLETED, actor=self.admin)
        self.assertEqual(redemption.status, RedemptionStatus.COMPLETED)


class CancellationTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.admin = make_admin()
        self.reward = make_mentor_reward()
        award_points(
            student=self.student, amount=370, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
        )

    def _redeem(self):
        return redeem_reward(student=self.student, reward_id=self.reward.pk)

    # Cancellation-reason-required is a serializer-level (API) constraint,
    # not a service-level one — already covered by
    # test_views.py::AdminRedemptionManagementTests::test_cancellation_requires_reason_and_refunds.

    def test_pending_cancellation_refunds_in_full(self):
        redemption = self._redeem()
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 220)

        redemption = process_redemption(
            redemption_id=redemption.pk, new_status=RedemptionStatus.CANCELLED,
            actor=self.admin, cancellation_reason="Changed my mind",
        )
        self.assertEqual(redemption.status, RedemptionStatus.CANCELLED)
        self.assertIsNotNone(redemption.cancelled_at)
        self.assertEqual(redemption.cancelled_by, self.admin)
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 370)

    def test_approved_cancellation_refunds_and_preserves_original_transaction(self):
        redemption = self._redeem()
        process_redemption(redemption_id=redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        process_redemption(
            redemption_id=redemption.pk, new_status=RedemptionStatus.CANCELLED,
            actor=self.admin, cancellation_reason="Mentor unavailable for the requested period.",
        )

        original = PointsTransaction.objects.get(
            redemption=redemption, transaction_type=PointsTransaction.TransactionType.REDEMPTION
        )
        self.assertEqual(original.amount, -150)  # untouched

        refund = PointsTransaction.objects.get(
            redemption=redemption, transaction_type=PointsTransaction.TransactionType.REDEMPTION_REFUND
        )
        self.assertEqual(refund.amount, 150)
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 370)

    def test_scheduled_cancellation_refunds(self):
        redemption = self._redeem()
        process_redemption(redemption_id=redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        schedule_redemption(redemption_id=redemption.pk, actor=self.admin, scheduled_date=date(2026, 9, 10), start_time=time(15, 0))

        redemption = process_redemption(
            redemption_id=redemption.pk, new_status=RedemptionStatus.CANCELLED,
            actor=self.admin, cancellation_reason="Mentor unavailable.",
        )
        self.assertEqual(redemption.status, RedemptionStatus.CANCELLED)
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 370)

    def test_cannot_cancel_completed_redemption(self):
        redemption = self._redeem()
        process_redemption(redemption_id=redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        process_redemption(redemption_id=redemption.pk, new_status=RedemptionStatus.COMPLETED, actor=self.admin)
        with self.assertRaises(RedemptionStateError):
            process_redemption(
                redemption_id=redemption.pk, new_status=RedemptionStatus.CANCELLED,
                actor=self.admin, cancellation_reason="too late",
            )

    def test_cannot_cancel_twice(self):
        redemption = self._redeem()
        process_redemption(
            redemption_id=redemption.pk, new_status=RedemptionStatus.CANCELLED,
            actor=self.admin, cancellation_reason="first cancel",
        )
        with self.assertRaises(RedemptionStateError):
            process_redemption(
                redemption_id=redemption.pk, new_status=RedemptionStatus.CANCELLED,
                actor=self.admin, cancellation_reason="second cancel",
            )
        # Refund must not be applied twice.
        self.assertEqual(
            PointsTransaction.objects.filter(
                redemption=redemption, transaction_type=PointsTransaction.TransactionType.REDEMPTION_REFUND
            ).count(),
            1,
        )
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 370)


class RewardPriceChangeTests(TestCase):
    def test_existing_redemption_retains_original_points_cost(self):
        student = make_student()
        reward = make_mentor_reward(points=150)
        award_points(student=student, amount=200, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)

        redemption = redeem_reward(student=student, reward_id=reward.pk)
        self.assertEqual(redemption.points_cost, 150)

        reward.points_required = 200
        reward.save(update_fields=["points_required"])

        redemption.refresh_from_db()
        self.assertEqual(redemption.points_cost, 150)  # unchanged historical snapshot


class SchedulingPermissionAndValidationAPITests(APITestCase):
    def setUp(self):
        self.student = make_student("apischedulestudent")
        self.admin = make_admin("apischeduleadmin")
        self.mentor = make_mentor("apischedulementor")
        self.reward = make_mentor_reward()
        award_points(
            student=self.student, amount=200, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
        )
        self.redemption = redeem_reward(student=self.student, reward_id=self.reward.pk)
        process_redemption(redemption_id=self.redemption.pk, new_status=RedemptionStatus.APPROVED, actor=self.admin)
        self.schedule_url = reverse("rewards-admin-redemption-schedule", args=[self.redemption.pk])

    def test_student_cannot_schedule(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(
            self.schedule_url, {"scheduled_date": "2026-09-10", "start_time": "15:00"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_online_meeting_method_requires_url(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            self.schedule_url,
            {"scheduled_date": "2026-09-10", "start_time": "15:00", "meeting_method": "ZOOM"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_in_person_does_not_require_url(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            self.schedule_url,
            {"scheduled_date": "2026-09-10", "start_time": "15:00", "meeting_method": "IN_PERSON"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_ineligible_mentor_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            self.schedule_url,
            {"scheduled_date": "2026-09-10", "start_time": "15:00", "mentor_id": self.student.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_eligible_mentor_accepted(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            self.schedule_url,
            {"scheduled_date": "2026-09-10", "start_time": "15:00", "mentor_id": self.mentor.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["status"], "SCHEDULED")
        self.assertEqual(response.data["data"]["fulfillment"]["mentor"]["id"], self.mentor.id)
