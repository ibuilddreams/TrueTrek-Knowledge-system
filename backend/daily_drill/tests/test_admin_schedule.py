from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import AdminDrillSchedule

UserModel = get_user_model()


class AdminDrillScheduleTestCase(APITestCase):
    def setUp(self):
        self.list_url = reverse("daily-drill-admin-schedules")
        self.admin = UserModel.objects.create_user(
            username="drilladmin",
            email="drilladmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )
        self.student = UserModel.objects.create_user(
            username="scheduleviewer",
            email="scheduleviewer@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.tomorrow = timezone.localdate() + timedelta(days=1)
        self.yesterday = timezone.localdate() - timedelta(days=1)


class ScheduleCreateTests(AdminDrillScheduleTestCase):
    def test_student_cannot_create_schedule(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            self.list_url,
            {
                "title": "Leadership 101", "video_url": "https://example.com/v.mp4",
                "scheduled_date": self.tomorrow.isoformat(), "reward_points": 100,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_future_schedule(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            self.list_url,
            {
                "title": "Leadership 101", "video_url": "https://example.com/v.mp4",
                "scheduled_date": self.tomorrow.isoformat(), "reward_points": 100,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["status"], "DRAFT")

    def test_past_date_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            self.list_url,
            {
                "title": "Leadership 101", "video_url": "https://example.com/v.mp4",
                "scheduled_date": self.yesterday.isoformat(), "reward_points": 100,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(AdminDrillSchedule.objects.count(), 0)

    def test_today_is_allowed(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            self.list_url,
            {
                "title": "Leadership 101", "video_url": "https://example.com/v.mp4",
                "scheduled_date": timezone.localdate().isoformat(), "reward_points": 100,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_zero_reward_points_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            self.list_url,
            {
                "title": "Leadership 101", "video_url": "https://example.com/v.mp4",
                "scheduled_date": self.tomorrow.isoformat(), "reward_points": 0,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_both_video_url_and_file_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        self.client.force_authenticate(user=self.admin)
        video = SimpleUploadedFile("clip.mp4", b"fake video bytes", content_type="video/mp4")
        response = self.client.post(
            self.list_url,
            {
                "title": "Leadership 101", "video_url": "https://example.com/v.mp4", "file": video,
                "scheduled_date": self.tomorrow.isoformat(), "reward_points": 100,
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_neither_video_url_nor_file_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            self.list_url,
            {"title": "Leadership 101", "scheduled_date": self.tomorrow.isoformat(), "reward_points": 100},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_scheduled_date_rejected(self):
        AdminDrillSchedule.objects.create(
            title="Existing", video_url="https://example.com/a.mp4",
            scheduled_date=self.tomorrow, reward_points=50,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            self.list_url,
            {
                "title": "Another", "video_url": "https://example.com/b.mp4",
                "scheduled_date": self.tomorrow.isoformat(), "reward_points": 100,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ScheduleEditTests(AdminDrillScheduleTestCase):
    def setUp(self):
        super().setUp()
        self.future_schedule = AdminDrillSchedule.objects.create(
            title="Future Drill", video_url="https://example.com/a.mp4",
            scheduled_date=self.tomorrow, reward_points=100,
        )
        self.past_schedule = AdminDrillSchedule.objects.create(
            title="Past Drill", video_url="https://example.com/b.mp4",
            scheduled_date=self.yesterday, reward_points=50, status="PUBLISHED",
        )

    def test_admin_can_edit_future_schedule(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("daily-drill-admin-schedule-detail", args=[self.future_schedule.pk]),
            {"reward_points": 200},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.future_schedule.refresh_from_db()
        self.assertEqual(self.future_schedule.reward_points, 200)

    def test_cannot_edit_already_passed_schedule(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("daily-drill-admin-schedule-detail", args=[self.past_schedule.pk]),
            {"reward_points": 999},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.past_schedule.refresh_from_db()
        self.assertEqual(self.past_schedule.reward_points, 50)

    def test_cannot_move_future_schedule_into_the_past(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("daily-drill-admin-schedule-detail", args=[self.future_schedule.pk]),
            {"scheduled_date": self.yesterday.isoformat()},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_uploading_a_file_replaces_an_existing_video_url(self):
        """Regression test: editing a schedule that already has a video_url
        and sending only a new `file` (the frontend's "switch to Upload File
        mode" flow) must succeed and clear the old video_url — it must not
        be rejected as "both provided" by comparing against stale instance
        state."""
        from django.core.files.uploadedfile import SimpleUploadedFile

        self.assertTrue(self.future_schedule.video_url)
        video = SimpleUploadedFile("clip.mp4", b"fake video bytes", content_type="video/mp4")

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("daily-drill-admin-schedule-detail", args=[self.future_schedule.pk]),
            {"file": video},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.future_schedule.refresh_from_db()
        self.assertFalse(self.future_schedule.video_url)
        self.assertTrue(self.future_schedule.file)

    def test_providing_a_new_url_replaces_an_existing_file(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        video = SimpleUploadedFile("clip.mp4", b"fake video bytes", content_type="video/mp4")
        file_only_schedule = AdminDrillSchedule.objects.create(
            title="File Based", file=video, scheduled_date=self.tomorrow + timedelta(days=1), reward_points=100,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("daily-drill-admin-schedule-detail", args=[file_only_schedule.pk]),
            {"video_url": "https://example.com/new.mp4"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        file_only_schedule.refresh_from_db()
        self.assertEqual(file_only_schedule.video_url, "https://example.com/new.mp4")
        self.assertFalse(file_only_schedule.file)

    def test_sending_both_url_and_file_in_one_request_still_rejected(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        video = SimpleUploadedFile("clip.mp4", b"fake video bytes", content_type="video/mp4")
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            reverse("daily-drill-admin-schedule-detail", args=[self.future_schedule.pk]),
            {"video_url": "https://example.com/new.mp4", "file": video},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ScheduleActivateDeactivateTests(AdminDrillScheduleTestCase):
    def setUp(self):
        super().setUp()
        self.schedule = AdminDrillSchedule.objects.create(
            title="Drill", video_url="https://example.com/a.mp4",
            scheduled_date=self.tomorrow, reward_points=100,
        )

    def test_cannot_activate_without_quiz_questions(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("daily-drill-admin-schedule-activate", args=[self.schedule.pk])
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_activate_and_deactivate_with_quiz(self):
        quiz_url = reverse("daily-drill-admin-schedule-quiz", args=[self.schedule.pk])
        self.client.force_authenticate(user=self.admin)
        self.client.put(
            quiz_url,
            {
                "questions": [
                    {
                        "text": "What should you do?",
                        "choices": [
                            {"text": "Right answer", "is_correct": True},
                            {"text": "Wrong answer", "is_correct": False},
                        ],
                    }
                ]
            },
            format="json",
        )

        activate = self.client.post(reverse("daily-drill-admin-schedule-activate", args=[self.schedule.pk]))
        self.assertEqual(activate.status_code, status.HTTP_200_OK)
        self.assertEqual(activate.data["data"]["status"], "PUBLISHED")

        deactivate = self.client.post(
            reverse("daily-drill-admin-schedule-deactivate", args=[self.schedule.pk])
        )
        self.assertEqual(deactivate.status_code, status.HTTP_200_OK)
        self.assertEqual(deactivate.data["data"]["status"], "ARCHIVED")


class ScheduleQuizWriteTests(AdminDrillScheduleTestCase):
    def setUp(self):
        super().setUp()
        self.schedule = AdminDrillSchedule.objects.create(
            title="Drill", video_url="https://example.com/a.mp4",
            scheduled_date=self.tomorrow, reward_points=100,
        )
        self.quiz_url = reverse("daily-drill-admin-schedule-quiz", args=[self.schedule.pk])

    def test_replace_is_destructive(self):
        self.client.force_authenticate(user=self.admin)
        self.client.put(
            self.quiz_url,
            {"questions": [{"text": "Q1", "choices": [{"text": "a", "is_correct": True}, {"text": "b", "is_correct": False}]}]},
            format="json",
        )
        self.assertEqual(self.schedule.quiz_questions.count(), 1)

        self.client.put(
            self.quiz_url,
            {
                "questions": [
                    {"text": "New Q1", "choices": [{"text": "a", "is_correct": True}, {"text": "b", "is_correct": False}]},
                    {"text": "New Q2", "choices": [{"text": "c", "is_correct": True}, {"text": "d", "is_correct": False}]},
                ]
            },
            format="json",
        )
        self.assertEqual(self.schedule.quiz_questions.count(), 2)
        self.assertFalse(self.schedule.quiz_questions.filter(text="Q1").exists())

    def test_question_needs_exactly_one_correct_choice(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.put(
            self.quiz_url,
            {
                "questions": [
                    {
                        "text": "Q1",
                        "choices": [{"text": "a", "is_correct": True}, {"text": "b", "is_correct": True}],
                    }
                ]
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_too_many_questions_rejected(self):
        self.client.force_authenticate(user=self.admin)
        questions = [
            {"text": f"Q{i}", "choices": [{"text": "a", "is_correct": True}, {"text": "b", "is_correct": False}]}
            for i in range(6)
        ]
        response = self.client.put(self.quiz_url, {"questions": questions}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
