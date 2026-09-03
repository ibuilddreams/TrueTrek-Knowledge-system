from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from daily_drill.models import DrillOption, DrillQuestion

from ..models import PointsTransaction, StudentPointsAccount

UserModel = get_user_model()


@override_settings(GEMINI_API_KEY=None)
class DailyDrillPointsIntegrationTests(APITestCase):
    """Exercises the full Daily Drill completed -> points awarded -> ledger
    -> balance chain through the real API endpoints (not the service layer
    directly), and checks the duplicate-submission idempotency guarantee.
    GEMINI_API_KEY is disabled so `resolve_todays_drill` deterministically
    falls back to the legacy question bank (no admin schedule exists either)
    — AI-path point-awarding is covered in test_ai_generation.py instead."""

    def setUp(self):
        self.attempt_url = reverse("daily-drill-attempt")
        self.question = DrillQuestion.objects.create(scenario="Scenario", guidelines="Guidelines")
        self.option = DrillOption.objects.create(
            question=self.question, key="A", text="Option A", impact="Impact", rationale="Rationale", score=40
        )
        self.student = UserModel.objects.create_user(
            username="integrationstudent",
            email="integrationstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )

    def test_completing_drill_awards_points_exactly_once(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.attempt_url, {"answer_key": self.option.key})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["xp_earned"], 80)

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 80)

        transactions = PointsTransaction.objects.filter(
            student=self.student, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
        )
        self.assertEqual(transactions.count(), 1)
        self.assertEqual(transactions.first().amount, 80)
        self.assertEqual(transactions.first().balance_after, 80)

    def test_duplicate_submission_does_not_duplicate_points(self):
        self.client.force_authenticate(user=self.student)
        first = self.client.post(self.attempt_url, {"answer_key": self.option.key})
        second = self.client.post(self.attempt_url, {"answer_key": self.option.key})

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 80)
        self.assertEqual(
            PointsTransaction.objects.filter(
                student=self.student, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
            ).count(),
            1,
        )

    def test_zero_score_option_awards_no_points_but_records_attempt(self):
        zero_option = DrillOption.objects.create(
            question=self.question, key="B", text="Option B", impact="Impact", rationale="Rationale", score=0
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.attempt_url, {"answer_key": zero_option.key})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["xp_earned"], 0)
        self.assertFalse(StudentPointsAccount.objects.filter(student=self.student).exists())
