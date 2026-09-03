from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from rewards.models import PointsTransaction, StudentPointsAccount

from ..models import AdminDrillProgress, AdminDrillQuizChoice, AdminDrillQuizQuestion, AdminDrillSchedule, DrillQuestion

UserModel = get_user_model()


@override_settings(GEMINI_API_KEY=None, DAILY_DRILL_VIDEO_WATCH_THRESHOLD_PERCENT=80)
class AdminDrillFlowTestCase(APITestCase):
    def setUp(self):
        self.student = UserModel.objects.create_user(
            username="videodrillstudent",
            email="videodrillstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.schedule = AdminDrillSchedule.objects.create(
            title="Handling Feedback",
            video_url="https://example.com/feedback.mp4",
            scheduled_date=timezone.localdate(),
            reward_points=150,
            passing_score_percent=60,
            status="PUBLISHED",
        )
        question = AdminDrillQuizQuestion.objects.create(schedule=self.schedule, text="What matters most?", order=1)
        self.correct_choice = AdminDrillQuizChoice.objects.create(
            question=question, text="Listen first", is_correct=True, order=1
        )
        self.wrong_choice = AdminDrillQuizChoice.objects.create(
            question=question, text="Ignore it", is_correct=False, order=2
        )
        self.question_id = question.id

        self.today_url = reverse("daily-drill-today")
        self.progress_url = reverse("daily-drill-video-progress", args=[self.schedule.pk])
        self.submit_url = reverse("daily-drill-submit-quiz", args=[self.schedule.pk])

    def submit(self, choice_id):
        return self.client.post(self.submit_url, {"answers": [{"question_id": self.question_id, "choice_id": choice_id}]}, format="json")


class TodayResolvesAdminVideoTests(AdminDrillFlowTestCase):
    def test_today_resolves_admin_scheduled_drill_without_revealing_correct_choice(self):
        # A legacy question also exists — admin-scheduled must take priority.
        DrillQuestion.objects.create(scenario="Legacy scenario", guidelines="g")

        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.today_url)

        data = response.data["data"]
        self.assertEqual(data["type"], "ADMIN_VIDEO")
        self.assertEqual(data["schedule_id"], self.schedule.pk)
        self.assertEqual(len(data["quiz_questions"]), 1)
        choice = data["quiz_questions"][0]["choices"][0]
        self.assertNotIn("is_correct", choice)
        self.assertEqual(data["progress"]["status"], "NOT_STARTED")
        self.assertFalse(data["progress"]["quiz_unlocked"])


class VideoProgressTests(AdminDrillFlowTestCase):
    def test_progress_is_a_high_water_mark(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.progress_url, {"progress_percent": 50})
        self.client.post(self.progress_url, {"progress_percent": 30})  # should not regress
        response = self.client.post(self.progress_url, {"progress_percent": 90})

        self.assertEqual(response.data["data"]["video_progress_percent"], 90)
        progress = AdminDrillProgress.objects.get(student=self.student, schedule=self.schedule)
        self.assertEqual(progress.video_progress_percent, 90)

    def test_quiz_unlocked_flag_reflects_threshold(self):
        self.client.force_authenticate(user=self.student)
        below = self.client.post(self.progress_url, {"progress_percent": 50})
        self.assertFalse(below.data["data"]["quiz_unlocked"])

        above = self.client.post(self.progress_url, {"progress_percent": 85})
        self.assertTrue(above.data["data"]["quiz_unlocked"])


class QuizSubmitTests(AdminDrillFlowTestCase):
    def test_submit_below_watch_threshold_rejected(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.progress_url, {"progress_percent": 10})
        response = self.submit(self.correct_choice.id)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_passing_awards_points_exactly_once(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.progress_url, {"progress_percent": 100})
        response = self.submit(self.correct_choice.id)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["data"]["passed"])
        self.assertEqual(response.data["data"]["progress"]["status"], "COMPLETED")
        self.assertEqual(response.data["data"]["progress"]["points_awarded"], 150)

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 150)
        self.assertEqual(
            PointsTransaction.objects.filter(
                student=self.student, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
            ).count(),
            1,
        )

    def test_failing_completes_the_drill_without_awarding_points_and_blocks_retry(self):
        """One-shot submission: a failing score still marks the drill
        COMPLETED (not IN_PROGRESS) with zero points, and — like a passing
        submission — a later resubmission is rejected outright."""
        self.client.force_authenticate(user=self.student)
        self.client.post(self.progress_url, {"progress_percent": 100})
        first = self.submit(self.wrong_choice.id)

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertFalse(first.data["data"]["passed"])
        self.assertEqual(first.data["data"]["progress"]["status"], "COMPLETED")
        self.assertEqual(first.data["data"]["progress"]["points_awarded"], 0)
        self.assertFalse(StudentPointsAccount.objects.filter(student=self.student).exists())

        second = self.submit(self.correct_choice.id)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(StudentPointsAccount.objects.filter(student=self.student).exists())

    def test_cannot_resubmit_after_passing(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.progress_url, {"progress_percent": 100})
        self.submit(self.correct_choice.id)
        second = self.submit(self.correct_choice.id)

        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 150)  # unchanged — not double-awarded

    def test_double_submit_same_moment_does_not_double_award(self):
        """Simulates a retried/duplicate request rather than true thread
        concurrency (SQLite/Postgres test transactions aren't parallel here)
        — the same guard (select_for_update + status check) that protects
        this sequential case is what protects true concurrent requests."""
        self.client.force_authenticate(user=self.student)
        self.client.post(self.progress_url, {"progress_percent": 100})
        first = self.submit(self.correct_choice.id)
        second = self.submit(self.correct_choice.id)

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            PointsTransaction.objects.filter(
                student=self.student, transaction_type=PointsTransaction.TransactionType.DRILL_REWARD
            ).count(),
            1,
        )
