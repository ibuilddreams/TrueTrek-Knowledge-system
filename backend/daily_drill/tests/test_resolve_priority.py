import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone

from ai_courses.providers.base import ProviderResult

from ..models import AdminDrillSchedule, AIDrillGeneration, DrillOption, DrillQuestion
from ..services import compute_streak, get_drill_stats, resolve_todays_drill

UserModel = get_user_model()

VALID_DRILL_JSON = json.dumps(
    {
        "title": "t", "question": "q", "context": "c",
        "options": [{"key": "A", "text": "a"}, {"key": "B", "text": "b"}, {"key": "C", "text": "c"}],
        "correct_answer": "B", "explanation": "e", "difficulty": "EASY", "topic": "Sample Topic",
    }
)


def make_student(username):
    return UserModel.objects.create_user(
        username=username, email=f"{username}@example.com", password="StrongPass123!",
        role=UserModel.Roles.STUDENT, gender=UserModel.Gender.MALE,
    )


class StubProvider:
    def generate_course(self, prompt, response_schema, timeout):
        return ProviderResult(text=VALID_DRILL_JSON, input_tokens=1, output_tokens=1)


class ResolvePriorityTests(TestCase):
    def setUp(self):
        self.student = make_student("priostudent")
        self.today = timezone.localdate()
        self.legacy_question = DrillQuestion.objects.create(scenario="Legacy", guidelines="g")
        DrillOption.objects.create(question=self.legacy_question, key="A", text="x", impact="i", rationale="r", score=50)

    @override_settings(GEMINI_API_KEY=None)
    def test_falls_back_to_legacy_when_admin_and_ai_unavailable(self):
        source, obj = resolve_todays_drill(self.student, self.today)
        self.assertEqual(source, "LEGACY_QUESTION")
        self.assertEqual(obj.pk, self.legacy_question.pk)

    def test_ai_takes_priority_over_legacy_when_available(self):
        with patch("daily_drill.ai_generation.get_provider", return_value=StubProvider()):
            source, obj = resolve_todays_drill(self.student, self.today)
        self.assertEqual(source, "AI_QUESTION")
        self.assertIsInstance(obj, AIDrillGeneration)

    def test_admin_schedule_takes_priority_over_ai_and_legacy(self):
        schedule = AdminDrillSchedule.objects.create(
            title="Admin Drill", video_url="https://example.com/v.mp4",
            scheduled_date=self.today, reward_points=50, status="PUBLISHED",
        )
        with patch("daily_drill.ai_generation.get_provider", return_value=StubProvider()):
            source, obj = resolve_todays_drill(self.student, self.today)
        self.assertEqual(source, "ADMIN_VIDEO")
        self.assertEqual(obj.pk, schedule.pk)

    def test_draft_admin_schedule_does_not_take_priority(self):
        AdminDrillSchedule.objects.create(
            title="Draft Drill", video_url="https://example.com/v.mp4",
            scheduled_date=self.today, reward_points=50, status="DRAFT",
        )
        with patch("daily_drill.ai_generation.get_provider", return_value=StubProvider()):
            source, obj = resolve_todays_drill(self.student, self.today)
        self.assertEqual(source, "AI_QUESTION")


@override_settings(GEMINI_API_KEY=None)
class UnifiedStatsTests(TestCase):
    """get_drill_stats/compute_streak must union completions across all
    three sources, since a student's history can span all of them."""

    def setUp(self):
        self.student = make_student("statsstudent")
        self.today = timezone.localdate()

    def test_streak_counts_ai_and_admin_completions(self):
        AIDrillGeneration.objects.create(
            student=self.student, drill_date=self.today - timezone.timedelta(days=1),
            title="t", question="q", options=[{"key": "A", "text": "a"}, {"key": "B", "text": "b"}],
            correct_answer="A", selected_key="A", is_completed=True, topic="x",
        )
        schedule = AdminDrillSchedule.objects.create(
            title="Admin", video_url="https://example.com/v.mp4",
            scheduled_date=self.today, reward_points=50, status="PUBLISHED",
        )
        from ..models import AdminDrillProgress

        AdminDrillProgress.objects.create(
            student=self.student, schedule=schedule,
            status=AdminDrillProgress.ProgressStatus.COMPLETED, score_percent=100,
        )

        self.assertEqual(compute_streak(self.student), 2)

    def test_points_stat_reflects_ledger_across_sources(self):
        from rewards.services import award_points
        from rewards.models import PointsTransaction

        award_points(
            student=self.student, amount=80,
            transaction_type=PointsTransaction.TransactionType.DRILL_REWARD, reason="test",
        )
        stats = get_drill_stats(self.student)
        self.assertEqual(stats["points"], 80)
