from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import DrillAttempt, DrillOption, DrillQuestion

UserModel = get_user_model()


@override_settings(GEMINI_API_KEY=None)
class DailyDrillTestCase(APITestCase):
    """GEMINI_API_KEY is disabled for this whole legacy-path test class: with
    no admin-scheduled drill for today either, `resolve_todays_drill` will
    deterministically fall through AI (fails fast — no api key configured,
    no network call made) to the legacy question bank, which is exactly the
    path these tests exercise. AI generation itself is covered separately in
    test_ai_generation.py with a mocked provider."""

    def setUp(self):
        self.today_url = reverse("daily-drill-today")
        self.attempt_url = reverse("daily-drill-attempt")

        # Exactly one published question keeps the legacy fallback's "today's
        # question" deterministic (get_todays_question() picks
        # index = today.toordinal() % total).
        self.question = DrillQuestion.objects.create(
            scenario="Test scenario", guidelines="Test guidelines"
        )
        self.option_low = DrillOption.objects.create(
            question=self.question,
            key="A",
            text="Low score option",
            impact="Bad impact",
            rationale="Bad rationale",
            score=40,
        )
        self.option_perfect = DrillOption.objects.create(
            question=self.question,
            key="B",
            text="Perfect option",
            impact="Great impact",
            rationale="Great rationale",
            score=100,
        )

        self.student = UserModel.objects.create_user(
            username="drillstudent",
            email="drillstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.teacher = UserModel.objects.create_user(
            username="drillteacher",
            email="drillteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )


class DailyDrillTodayViewTests(DailyDrillTestCase):
    def test_requires_authentication(self):
        response = self.client.get(self.today_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbidden_for_non_student(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.today_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_falls_back_to_legacy_bank_without_revealing_scores(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.today_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["type"], "LEGACY_QUESTION")
        self.assertFalse(data["attempted"])
        self.assertEqual(data["stats"]["points"], 0)
        self.assertEqual(data["stats"]["streak"], 0)

        options = data["question"]["options"]
        self.assertEqual(len(options), 2)
        for option in options:
            self.assertNotIn("score", option)
            self.assertNotIn("rationale", option)

    def test_shows_result_after_already_attempted_today(self):
        DrillAttempt.objects.create(
            student=self.student,
            question=self.question,
            selected_option=self.option_perfect,
            attempt_date=timezone.localdate(),
            score_awarded=self.option_perfect.score,
            xp_earned=300,
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.today_url)

        data = response.data["data"]
        self.assertTrue(data["attempted"])
        self.assertEqual(data["xp_earned"], 300)

        revealed = next(
            o for o in data["question"]["options"] if o["id"] == self.option_perfect.id
        )
        self.assertEqual(revealed["score"], 100)
        self.assertEqual(revealed["rationale"], "Great rationale")

        hidden = next(o for o in data["question"]["options"] if o["id"] == self.option_low.id)
        self.assertNotIn("score", hidden)


class DailyDrillAttemptViewTests(DailyDrillTestCase):
    def test_requires_authentication(self):
        response = self.client.post(self.attempt_url, {"answer_key": self.option_perfect.key})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_perfect_score_awards_bonus_xp(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.attempt_url, {"answer_key": self.option_perfect.key})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data["data"]
        self.assertEqual(data["score_awarded"], 100)
        # score(100) * 2 + 100 perfect bonus
        self.assertEqual(data["xp_earned"], 300)
        self.assertEqual(data["stats"]["points"], 300)
        self.assertEqual(data["stats"]["streak"], 1)
        self.assertEqual(data["stats"]["aggregate_score"], 100)

    def test_non_perfect_score_has_no_bonus(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.attempt_url, {"answer_key": self.option_low.key})

        data = response.data["data"]
        self.assertEqual(data["score_awarded"], 40)
        self.assertEqual(data["xp_earned"], 80)

    def test_cannot_attempt_twice_same_day(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.attempt_url, {"answer_key": self.option_perfect.key})
        second = self.client.post(self.attempt_url, {"answer_key": self.option_low.key})

        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(DrillAttempt.objects.filter(student=self.student).count(), 1)

    def test_invalid_option_rejected(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.attempt_url, {"answer_key": "Z"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_streak_continues_from_yesterday(self):
        DrillAttempt.objects.create(
            student=self.student,
            question=self.question,
            selected_option=self.option_low,
            attempt_date=timezone.localdate() - timedelta(days=1),
            score_awarded=40,
            xp_earned=80,
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.attempt_url, {"answer_key": self.option_perfect.key})

        self.assertEqual(response.data["data"]["stats"]["streak"], 2)
