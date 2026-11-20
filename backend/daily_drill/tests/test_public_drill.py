from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import DrillAttempt, DrillOption, DrillQuestion
from ..services import get_public_drill_question, get_todays_question

UserModel = get_user_model()


def _make_question(scenario, scores):
    question = DrillQuestion.objects.create(scenario=scenario, guidelines="Goal: test")
    for key, score in zip("ABC", scores):
        DrillOption.objects.create(
            question=question,
            key=key,
            text=f"{scenario} option {key}",
            impact=f"impact {key}",
            rationale=f"rationale {key}",
            score=score,
        )
    return question


class PublicDrillTests(APITestCase):
    """The home page's signed-out taster drill."""

    def setUp(self):
        self.today_url = reverse("daily-drill-public-today")
        self.attempt_url = reverse("daily-drill-public-attempt")
        # Four, so "the question the portal would serve" and "the question a
        # visitor is offered" are genuinely different rows.
        self.questions = [_make_question(f"Scenario {index}", (30, 100, 60)) for index in range(4)]

    def test_guest_can_read_todays_taster(self):
        response = self.client.get(self.today_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertTrue(data["available"])
        self.assertEqual(len(data["options"]), 3)

    def test_taster_never_ships_the_answer_key(self):
        """Scores, impacts and rationales are what give the answer away, so
        none of them travel with the question — exactly the rule the
        student-facing serializer follows."""
        response = self.client.get(self.today_url)

        for option in response.data["data"]["options"]:
            self.assertEqual(set(option), {"id", "key", "text"})

    def test_taster_is_never_the_question_the_portal_serves(self):
        """A signed-in student must not be able to read their own drill's
        answer from an unauthenticated URL."""
        self.assertNotEqual(get_public_drill_question().id, get_todays_question().id)

    def test_grading_explains_the_answer_without_recording_it(self):
        response = self.client.post(self.attempt_url, {"answer_key": "A"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["selected"]["key"], "A")
        self.assertEqual(data["best"]["key"], "B")
        self.assertFalse(data["is_best"])
        self.assertTrue(data["best"]["rationale"])
        # A guest has no account to attribute an attempt to, and nothing here
        # should pretend otherwise.
        self.assertEqual(DrillAttempt.objects.count(), 0)

    def test_grading_marks_the_strongest_option(self):
        response = self.client.post(self.attempt_url, {"answer_key": "b"})

        self.assertTrue(response.data["data"]["is_best"])

    def test_unknown_option_is_rejected(self):
        response = self.client.post(self.attempt_url, {"answer_key": "Z"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reports_unavailable_rather_than_failing_with_an_empty_bank(self):
        DrillQuestion.objects.all().delete()

        response = self.client.get(self.today_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["available"])

    def test_a_signed_in_session_does_not_break_the_public_endpoints(self):
        """These clear `authentication_classes` precisely so a browser holding
        a Django session cookie isn't authenticated here and then refused on
        CSRF — see users.views.PUBLIC_AUTH_AUTHENTICATION_CLASSES."""
        admin = UserModel.objects.create_user(
            username="drilladmin",
            email="drilladmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
        )
        client = APITestCase.client_class(enforce_csrf_checks=True)
        client.force_login(admin)

        response = client.post(self.attempt_url, {"answer_key": "A"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
