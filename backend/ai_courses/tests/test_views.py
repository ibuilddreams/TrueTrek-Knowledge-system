from datetime import timedelta
from unittest.mock import patch

from django.conf import settings as django_settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ai_courses.models import AICourseGeneration
from ai_courses.services import RESUMABLE_RESULT_WINDOW
from courses.models import Category

UserModel = get_user_model()
GenerationStatus = AICourseGeneration.GenerationStatus


def _user(email, role):
    return UserModel.objects.create_user(
        username=email, email=email, password="StrongPass123!", role=role, gender=UserModel.Gender.OTHER,
    )


class GenerationListCreateViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("ai-course-generation-list-create")
        self.admin = _user("admin@example.com", UserModel.Roles.ADMIN)
        self.teacher = _user("teacher@example.com", UserModel.Roles.TEACHER)
        self.student = _user("student@example.com", UserModel.Roles.STUDENT)
        self.category = Category.objects.create(name="Cat")

    def _payload(self):
        return {
            "title": "New AI Course",
            "category": self.category.id,
            "instructors": [self.teacher.id],
            "modules_count": 3,
            "lessons_per_module": 2,
        }

    def test_teacher_gets_403(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_gets_403(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_create_returns_202_with_job_id(self):
        self.client.force_authenticate(user=self.admin)
        with patch("ai_courses.services.threading.Thread"):
            response = self.client.post(self.url, self._payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertIn("job_id", response.data["data"])
        self.assertTrue(AICourseGeneration.objects.filter(pk=response.data["data"]["job_id"]).exists())

    def test_create_without_instructor_is_rejected(self):
        self.client.force_authenticate(user=self.admin)
        payload = self._payload()
        payload["instructors"] = []
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_list_requires_admin(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_throttle_blocks_burst_beyond_configured_rate(self):
        # Regression test: ScopedRateThrottle reads its scope off the *view's*
        # throttle_scope attribute, not off the throttle class itself — a view
        # missing that attribute silently never throttles at all. This failed
        # before GenerationListCreateView.throttle_scope was added.
        #
        # DRF's SimpleRateThrottle.THROTTLE_RATES is captured from api_settings at
        # import time, so overriding settings.REST_FRAMEWORK mid-test does not
        # change it — this exercises the real configured rate (5/hour) instead.
        limit = int(django_settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["ai-generation"].split("/")[0])
        cache.clear()
        self.client.force_authenticate(user=self.admin)
        try:
            with patch("ai_courses.services.threading.Thread"):
                for _ in range(limit):
                    response = self.client.post(self.url, self._payload(), format="json")
                    self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
                    job_id = response.data["data"]["job_id"]
                    # Free the per-user concurrency guard so only the throttle is
                    # exercised by the next request.
                    AICourseGeneration.objects.filter(pk=job_id).update(status=GenerationStatus.FAILED)

                response = self.client.post(self.url, self._payload(), format="json")
                self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        finally:
            cache.clear()

    def test_admin_list_returns_paginated_envelope(self):
        AICourseGeneration.objects.create(requested_by=self.admin, input_payload={"title": "x"})
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data["data"])


class GenerationDetailViewTests(APITestCase):
    def setUp(self):
        self.admin = _user("admin@example.com", UserModel.Roles.ADMIN)
        self.teacher = _user("teacher@example.com", UserModel.Roles.TEACHER)
        self.job = AICourseGeneration.objects.create(
            requested_by=self.admin,
            status=GenerationStatus.RUNNING,
            input_payload={"title": "x"},
            raw_response="{secret raw provider payload}",
            normalized_plan={"secret": "plan"},
        )
        self.url = reverse("ai-course-generation-detail", args=[self.job.id])

    def test_teacher_gets_403(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_poll_never_leaks_raw_response_or_normalized_plan(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("raw_response", response.data["data"])
        self.assertNotIn("normalized_plan", response.data["data"])

    def test_poll_response_shape(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        data = response.data["data"]
        for field in ("id", "status", "step", "progress_percent", "warnings", "course"):
            self.assertIn(field, data)


class GenerationLatestViewTests(APITestCase):
    """The resume banner's source of truth — see GenerationLatestView."""

    def setUp(self):
        self.url = reverse("ai-course-generation-latest")
        self.admin = _user("admin@example.com", UserModel.Roles.ADMIN)
        self.other_admin = _user("other@example.com", UserModel.Roles.ADMIN)
        self.teacher = _user("teacher@example.com", UserModel.Roles.TEACHER)

    def _job(self, user=None, **fields):
        fields.setdefault("input_payload", {"title": "x"})
        return AICourseGeneration.objects.create(requested_by=user or self.admin, **fields)

    def test_teacher_gets_403(self):
        self.client.force_authenticate(user=self.teacher)
        self.assertEqual(self.client.get(self.url).status_code, status.HTTP_403_FORBIDDEN)

    def test_nothing_to_resume_is_null_not_a_404(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["data"])

    def test_a_running_generation_is_returned(self):
        job = self._job(status=GenerationStatus.RUNNING, step="Generating course", progress_percent=40)
        self.client.force_authenticate(user=self.admin)
        data = self.client.get(self.url).data["data"]
        self.assertEqual(data["id"], job.id)
        self.assertEqual(data["progress_percent"], 40)

    def test_another_admins_generation_is_not_offered(self):
        self._job(user=self.other_admin, status=GenerationStatus.RUNNING)
        self.client.force_authenticate(user=self.admin)
        self.assertIsNone(self.client.get(self.url).data["data"])

    def test_a_recently_failed_generation_is_still_offered(self):
        # The whole point of the banner for a failure: the admin closed the
        # wizard, the job failed, and the reason must still be reachable.
        job = self._job(
            status=GenerationStatus.FAILED,
            error_message="The AI service could not be reached.",
            finished_at=timezone.now(),
        )
        self.client.force_authenticate(user=self.admin)
        data = self.client.get(self.url).data["data"]
        self.assertEqual(data["id"], job.id)
        self.assertIn("could not be reached", data["error_message"])

    def test_a_running_generation_outranks_a_finished_one(self):
        self._job(status=GenerationStatus.SUCCEEDED, finished_at=timezone.now())
        running = self._job(status=GenerationStatus.RUNNING)
        self.client.force_authenticate(user=self.admin)
        self.assertEqual(self.client.get(self.url).data["data"]["id"], running.id)

    def test_an_old_finished_generation_is_history_not_a_banner(self):
        self._job(
            status=GenerationStatus.SUCCEEDED,
            finished_at=timezone.now() - RESUMABLE_RESULT_WINDOW - timedelta(minutes=1),
        )
        self.client.force_authenticate(user=self.admin)
        self.assertIsNone(self.client.get(self.url).data["data"])

    def test_a_generation_the_admin_cancelled_is_not_offered_back(self):
        self._job(status=GenerationStatus.CANCELLED, finished_at=timezone.now())
        self.client.force_authenticate(user=self.admin)
        self.assertIsNone(self.client.get(self.url).data["data"])

    def test_it_never_leaks_raw_response_or_normalized_plan(self):
        self._job(
            status=GenerationStatus.RUNNING,
            raw_response="{secret raw provider payload}",
            normalized_plan={"secret": "plan"},
        )
        self.client.force_authenticate(user=self.admin)
        data = self.client.get(self.url).data["data"]
        self.assertNotIn("raw_response", data)
        self.assertNotIn("normalized_plan", data)


class GenerationCancelViewTests(APITestCase):
    def setUp(self):
        self.admin = _user("admin@example.com", UserModel.Roles.ADMIN)
        self.job = AICourseGeneration.objects.create(
            requested_by=self.admin, status=GenerationStatus.PENDING, input_payload={"title": "x"}
        )
        self.url = reverse("ai-course-generation-cancel", args=[self.job.id])

    def test_admin_can_cancel_pending_job(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.job.refresh_from_db()
        self.assertEqual(self.job.status, GenerationStatus.CANCELLED)


class GenerationRetryViewTests(APITestCase):
    def setUp(self):
        self.admin = _user("admin@example.com", UserModel.Roles.ADMIN)
        self.teacher = _user("teacher@example.com", UserModel.Roles.TEACHER)
        self.category = Category.objects.create(name="Cat")
        self.job = AICourseGeneration.objects.create(
            requested_by=self.admin,
            status=GenerationStatus.FAILED,
            input_payload={
                "title": "x",
                "description": "",
                "category": self.category.id,
                "difficulty": "BEGINNER",
                "instructors": [self.teacher.id],
                "amount": "0",
                "target_audience": "",
                "objectives": [],
                "tier": None,
                "modules_count": 3,
                "lessons_per_module": 2,
                "include_quizzes": True,
                "questions_per_quiz": 5,
                "include_assignments": True,
                "weeks_between_modules": 2,
                "additional_instructions": "",
            },
        )
        self.url = reverse("ai-course-generation-retry", args=[self.job.id])

    def test_retry_creates_a_new_job_with_same_input(self):
        self.client.force_authenticate(user=self.admin)
        with patch("ai_courses.services.threading.Thread"):
            response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        new_job_id = response.data["data"]["job_id"]
        self.assertNotEqual(new_job_id, self.job.id)
        new_job = AICourseGeneration.objects.get(pk=new_job_id)
        self.assertEqual(new_job.input_payload["title"], "x")


class GenerationUsageViewTests(APITestCase):
    def setUp(self):
        self.admin = _user("admin@example.com", UserModel.Roles.ADMIN)
        self.url = reverse("ai-course-generation-usage")

    def test_usage_returns_used_and_limit(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("used", response.data["data"])
        self.assertIn("limit", response.data["data"])
