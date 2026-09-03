import json
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ai_courses.providers.base import ProviderResult
from rewards.models import PointsTransaction, StudentPointsAccount

from ..models import AIDrillGeneration

UserModel = get_user_model()

VALID_DRILL_JSON = json.dumps(
    {
        "title": "Handling a Missed Deadline",
        "question": "A teammate missed a shared deadline. What do you do?",
        "context": "Address it without damaging the working relationship.",
        "options": [
            {"key": "A", "text": "Publicly call them out in the team channel."},
            {"key": "B", "text": "Privately check in and offer to help unblock them."},
            {"key": "C", "text": "Ignore it and hope it doesn't happen again."},
        ],
        "correct_answer": "B",
        "explanation": "A private, supportive check-in preserves trust while addressing the issue.",
        "difficulty": "EASY",
        "topic": "Teamwork",
    }
)


class StubProvider:
    def generate_course(self, prompt, response_schema, timeout):
        return ProviderResult(text=VALID_DRILL_JSON, input_tokens=1, output_tokens=1)


@override_settings(GEMINI_API_KEY=None)
class AIDrillSubmissionFlowTests(APITestCase):
    """GEMINI_API_KEY stays disabled at the settings level; the provider
    factory itself is patched per-test instead, matching this codebase's
    convention (see advisor/ai_courses tests) — this proves the mock is what
    actually supplies the drill, not a real key slipping through."""

    def setUp(self):
        self.student = UserModel.objects.create_user(
            username="aiflowstudent", email="aiflowstudent@example.com",
            password="StrongPass123!", role=UserModel.Roles.STUDENT, gender=UserModel.Gender.MALE,
        )
        self.today_url = reverse("daily-drill-today")
        self.attempt_url = reverse("daily-drill-attempt")

    def test_correct_answer_awards_the_configured_flat_points(self):
        self.client.force_authenticate(user=self.student)

        with patch("daily_drill.ai_generation.get_provider", return_value=StubProvider()):
            today = self.client.get(self.today_url)
            self.assertEqual(today.data["data"]["type"], "AI_QUESTION")
            self.assertFalse(today.data["data"]["attempted"])
            self.assertEqual(len(today.data["data"]["options"]), 3)
            self.assertIsNone(today.data["data"]["correct_answer"])

            response = self.client.post(self.attempt_url, {"answer_key": "B"})  # correct answer

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data["data"]
        self.assertEqual(data["type"], "AI_QUESTION")
        self.assertTrue(data["attempted"])
        self.assertEqual(data["correct_answer"], "B")
        self.assertEqual(data["selected_key"], "B")
        self.assertEqual(data["points_awarded"], settings.DAILY_DRILL_DEFAULT_AI_REWARD_POINTS)

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, settings.DAILY_DRILL_DEFAULT_AI_REWARD_POINTS)

    def test_incorrect_answer_awards_zero_points(self):
        """The AI never controls the *amount* (still the flat configured
        setting), but whether it's paid out at all depends entirely on the
        student's own correctness — a wrong answer earns nothing and writes
        no points transaction, unlike the legacy score-scaled fallback path
        which can still award partial credit."""
        self.client.force_authenticate(user=self.student)
        with patch("daily_drill.ai_generation.get_provider", return_value=StubProvider()):
            self.client.get(self.today_url)
            response = self.client.post(self.attempt_url, {"answer_key": "C"})  # wrong answer

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data["data"]
        self.assertTrue(data["attempted"])
        self.assertEqual(data["selected_key"], "C")
        self.assertEqual(data["correct_answer"], "B")
        self.assertEqual(data["points_awarded"], 0)

        self.assertFalse(StudentPointsAccount.objects.filter(student=self.student).exists())
        self.assertFalse(
            PointsTransaction.objects.filter(
                student=self.student, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
            ).exists()
        )

    def test_cannot_submit_twice(self):
        self.client.force_authenticate(user=self.student)
        with patch("daily_drill.ai_generation.get_provider", return_value=StubProvider()):
            self.client.get(self.today_url)
            first = self.client.post(self.attempt_url, {"answer_key": "B"})
            second = self.client.post(self.attempt_url, {"answer_key": "A"})

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            PointsTransaction.objects.filter(
                student=self.student, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
            ).count(),
            1,
        )

    def test_invalid_answer_key_rejected(self):
        self.client.force_authenticate(user=self.student)
        with patch("daily_drill.ai_generation.get_provider", return_value=StubProvider()):
            self.client.get(self.today_url)
            response = self.client.post(self.attempt_url, {"answer_key": "Z"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(AIDrillGeneration.objects.get(student=self.student).is_completed)
