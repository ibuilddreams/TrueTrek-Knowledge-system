from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import PointsTransaction, Reward, RewardRedemption, StudentPointsAccount
from ..services import award_points

UserModel = get_user_model()


class RewardsTestCase(APITestCase):
    def setUp(self):
        self.student = UserModel.objects.create_user(
            username="rewardstudent",
            email="rewardstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.other_student = UserModel.objects.create_user(
            username="otherstudent",
            email="otherstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.admin = UserModel.objects.create_user(
            username="rewardsadmin",
            email="rewardsadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )
        self.teacher = UserModel.objects.create_user(
            username="rewardsteacher",
            email="rewardsteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )
        self.reward = Reward.objects.create(
            name="Mentor 1-on-1 Session", points_required=500, status="ACTIVE"
        )


class RewardAdminCrudTests(RewardsTestCase):
    def test_student_cannot_list_admin_rewards(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("rewards-list-create"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_reward(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("rewards-list-create"),
            {"name": "Free T-Shirt", "description": "Cotton tee", "reward_type": "MERCHANDISE", "points_required": 150},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["status"], "ACTIVE")

    def test_admin_create_rejects_zero_points(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("rewards-list-create"),
            {"name": "Bad reward", "points_required": 0},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_update_reward(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("rewards-detail", args=[self.reward.pk]), {"points_required": 750}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reward.refresh_from_db()
        self.assertEqual(self.reward.points_required, 750)

    def test_admin_can_activate_and_deactivate(self):
        self.client.force_authenticate(user=self.admin)
        deactivate = self.client.post(reverse("rewards-deactivate", args=[self.reward.pk]))
        self.assertEqual(deactivate.status_code, status.HTTP_200_OK)
        self.reward.refresh_from_db()
        self.assertEqual(self.reward.status, "ARCHIVED")

        activate = self.client.post(reverse("rewards-activate", args=[self.reward.pk]))
        self.assertEqual(activate.status_code, status.HTTP_200_OK)
        self.reward.refresh_from_db()
        self.assertEqual(self.reward.status, "ACTIVE")


class RewardCatalogTests(RewardsTestCase):
    def test_catalog_only_shows_active_rewards(self):
        Reward.objects.create(name="Archived reward", points_required=50, status="ARCHIVED")
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("rewards-catalog"))
        names = [r["name"] for r in response.data["data"]["rewards"]]
        self.assertIn("Mentor 1-on-1 Session", names)
        self.assertNotIn("Archived reward", names)

    def test_can_afford_flag_reflects_balance(self):
        award_points(student=self.student, amount=300, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("rewards-catalog"))
        row = next(r for r in response.data["data"]["rewards"] if r["id"] == self.reward.pk)
        self.assertFalse(row["can_afford"])

        award_points(student=self.student, amount=300, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        response = self.client.get(reverse("rewards-catalog"))
        row = next(r for r in response.data["data"]["rewards"] if r["id"] == self.reward.pk)
        self.assertTrue(row["can_afford"])

    def test_admin_cannot_access_student_catalog(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("rewards-catalog"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class RewardRedeemTests(RewardsTestCase):
    def test_redeem_with_sufficient_points_succeeds(self):
        award_points(student=self.student, amount=800, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("rewards-redeem", args=[self.reward.pk]))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["status"], "PENDING")

    def test_redeem_with_insufficient_points_rejected(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("rewards-redeem", args=[self.reward.pk]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(RewardRedemption.objects.count(), 0)

    def test_redeem_inactive_reward_rejected(self):
        self.reward.status = "ARCHIVED"
        self.reward.save(update_fields=["status"])
        award_points(student=self.student, amount=800, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("rewards-redeem", args=[self.reward.pk]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_my_redemptions_only_shows_own_history(self):
        award_points(student=self.student, amount=800, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        award_points(student=self.other_student, amount=800, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)

        self.client.force_authenticate(user=self.student)
        self.client.post(reverse("rewards-redeem", args=[self.reward.pk]))

        self.client.force_authenticate(user=self.other_student)
        response = self.client.get(reverse("rewards-my-redemptions"))
        self.assertEqual(response.data["data"]["count"], 0)


class AdminRedemptionManagementTests(RewardsTestCase):
    def setUp(self):
        super().setUp()
        award_points(student=self.student, amount=800, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        self.client.force_authenticate(user=self.student)
        redeem = self.client.post(reverse("rewards-redeem", args=[self.reward.pk]))
        self.redemption_id = redeem.data["data"]["id"]

    def test_student_cannot_process_redemptions(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(
            reverse("rewards-admin-redemption-process", args=[self.redemption_id]), {"status": "APPROVED"}
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_and_approve(self):
        self.client.force_authenticate(user=self.admin)
        listing = self.client.get(reverse("rewards-admin-redemptions"))
        self.assertEqual(listing.data["data"]["count"], 1)

        approve = self.client.patch(
            reverse("rewards-admin-redemption-process", args=[self.redemption_id]), {"status": "APPROVED"}
        )
        self.assertEqual(approve.status_code, status.HTTP_200_OK)
        self.assertEqual(approve.data["data"]["status"], "APPROVED")

    def test_cancellation_requires_reason_and_refunds(self):
        self.client.force_authenticate(user=self.admin)
        no_reason = self.client.patch(
            reverse("rewards-admin-redemption-process", args=[self.redemption_id]), {"status": "CANCELLED"}
        )
        self.assertEqual(no_reason.status_code, status.HTTP_400_BAD_REQUEST)

        cancelled = self.client.patch(
            reverse("rewards-admin-redemption-process", args=[self.redemption_id]),
            {"status": "CANCELLED", "cancellation_reason": "Out of stock"},
        )
        self.assertEqual(cancelled.status_code, status.HTTP_200_OK)
        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 800)

    def test_completed_redemption_cannot_be_reprocessed(self):
        self.client.force_authenticate(user=self.admin)
        self.client.patch(reverse("rewards-admin-redemption-process", args=[self.redemption_id]), {"status": "APPROVED"})
        self.client.patch(reverse("rewards-admin-redemption-process", args=[self.redemption_id]), {"status": "COMPLETED"})
        response = self.client.patch(
            reverse("rewards-admin-redemption-process", args=[self.redemption_id]), {"status": "CANCELLED", "cancellation_reason": "x"}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PointsSelfServiceTests(RewardsTestCase):
    def test_my_points_summary(self):
        award_points(student=self.student, amount=250, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("points-my-summary"))
        self.assertEqual(response.data["data"]["balance"], 250)

    def test_my_transactions_paginated_and_scoped(self):
        award_points(student=self.student, amount=100, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        award_points(student=self.other_student, amount=100, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)

        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("points-my-transactions"))
        self.assertEqual(response.data["data"]["count"], 1)


class AdminPointsVisibilityTests(RewardsTestCase):
    def test_student_forbidden_from_admin_points_views(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("points-admin-students"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_student_points_including_zero_balance(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("points-admin-students"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [row["email"] for row in response.data["data"]["results"]]
        self.assertIn(self.student.email, emails)

    def test_admin_can_view_student_detail(self):
        award_points(student=self.student, amount=300, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("points-admin-student-detail", args=[self.student.pk]))
        self.assertEqual(response.data["data"]["balance"], 300)
        self.assertEqual(len(response.data["data"]["recent_transactions"]), 1)

    def test_admin_transactions_filter_by_student(self):
        award_points(student=self.student, amount=100, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        award_points(student=self.other_student, amount=100, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("points-admin-transactions"), {"student": self.student.pk})
        self.assertEqual(response.data["data"]["count"], 1)


class AdminAdjustPointsTests(RewardsTestCase):
    def test_student_cannot_adjust_points(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("points-admin-adjust"),
            {"student_id": self.other_student.pk, "amount": 100, "reason": "test"},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_adjust_points_up_and_down(self):
        self.client.force_authenticate(user=self.admin)
        up = self.client.post(
            reverse("points-admin-adjust"),
            {"student_id": self.student.pk, "amount": 200, "reason": "Contest winner"},
        )
        self.assertEqual(up.status_code, status.HTTP_201_CREATED)

        down = self.client.post(
            reverse("points-admin-adjust"),
            {"student_id": self.student.pk, "amount": -50, "reason": "Correction"},
        )
        self.assertEqual(down.status_code, status.HTTP_201_CREATED)

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 150)
        txn = PointsTransaction.objects.filter(student=self.student).order_by("-created_at").first()
        self.assertEqual(txn.actor, self.admin)

    def test_adjust_requires_reason(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("points-admin-adjust"),
            {"student_id": self.student.pk, "amount": 100, "reason": ""},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_adjustment_below_zero_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("points-admin-adjust"),
            {"student_id": self.student.pk, "amount": -50, "reason": "Penalty"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
