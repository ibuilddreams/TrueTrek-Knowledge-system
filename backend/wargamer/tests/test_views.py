"""Endpoint contracts: the response envelope, owner scoping and permissions.

The scoring/turn services are exercised directly in test_services.py; what
these cover is the HTTP layer around them — who may call what, what shape
comes back, and which failure maps to which status code.
"""

import json
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ai_courses.providers.base import ProviderError, ProviderResult

from ..models import RolePlayScenario, RolePlaySession
from ..services import start_session, submit_turn
from .factories import EVALUATION_PAYLOAD, TURN_PAYLOAD, make_scenario, make_user

UserModel = get_user_model()


def provider_returning(payload):
    def _generate_course(prompt, schema, timeout=None, files=None):
        return ProviderResult(text=json.dumps(payload))

    return _generate_course


class WargamerViewTestCase(APITestCase):
    def setUp(self):
        self.student = make_user("rpviewstudent")
        self.other_student = make_user("rpviewother")
        self.admin = make_user("rpviewadmin", UserModel.Roles.ADMIN)
        self.scenario = make_scenario()


class ScenarioListViewTests(WargamerViewTestCase):
    def test_requires_authentication(self):
        response = self.client.get(reverse("roleplay-scenarios"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_the_module_header_catalog_and_stats(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("roleplay-scenarios"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(body["module"]["code"], "LS-302")
        self.assertEqual(len(body["scenarios"]), 1)
        self.assertEqual(body["stats"]["scenarios_total"], 1)

    def test_never_leaks_the_answer_key_before_a_run_is_scored(self):
        self.client.force_authenticate(user=self.student)
        card = self.client.get(reverse("roleplay-scenarios")).json()["data"]["scenarios"][0]

        for field in ("ideal_acknowledge", "ideal_boundary", "ideal_pivot", "opening_message"):
            self.assertNotIn(field, card)

    def test_hides_unpublished_scenarios(self):
        make_scenario(code="LS-302-S9", status="DRAFT")
        self.client.force_authenticate(user=self.student)

        body = self.client.get(reverse("roleplay-scenarios")).json()["data"]
        self.assertEqual(len(body["scenarios"]), 1)

    def test_surfaces_a_resumable_session_on_the_card(self):
        session, _ = start_session(self.student, self.scenario)
        self.client.force_authenticate(user=self.student)

        card = self.client.get(reverse("roleplay-scenarios")).json()["data"]["scenarios"][0]
        self.assertEqual(card["active_session_id"], session.id)
        self.assertEqual(card["attempts"], 1)


class StartSessionViewTests(WargamerViewTestCase):
    def test_starts_a_scene_with_the_opening_line_visible(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("roleplay-session-start"), {"scenario_id": self.scenario.id}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()["data"]
        self.assertEqual(len(body["turns"]), 1)
        self.assertEqual(body["turns"][0]["content"], self.scenario.opening_message)
        self.assertIsNone(body["ideal_response"])
        self.assertFalse(body["can_evaluate"])

    def test_resuming_returns_200_and_the_same_session(self):
        self.client.force_authenticate(user=self.student)
        first = self.client.post(
            reverse("roleplay-session-start"), {"scenario_id": self.scenario.id}, format="json"
        )
        second = self.client.post(
            reverse("roleplay-session-start"), {"scenario_id": self.scenario.id}, format="json"
        )

        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(second.json()["data"]["id"], first.json()["data"]["id"])

    def test_unknown_scenario_is_404(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("roleplay-session-start"), {"scenario_id": 9999}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_an_unpublished_scenario_is_refused(self):
        draft = make_scenario(code="LS-302-S8", status="DRAFT")
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("roleplay-session-start"), {"scenario_id": draft.id}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class SessionDetailViewTests(WargamerViewTestCase):
    def setUp(self):
        super().setUp()
        self.session, _ = start_session(self.student, self.scenario)

    def test_another_students_session_is_a_404_never_a_403(self):
        self.client.force_authenticate(user=self.other_student)
        response = self.client.get(reverse("roleplay-session-detail", args=[self.session.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_resume(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("roleplay-session-detail", args=[self.session.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["id"], self.session.id)


class SubmitTurnViewTests(WargamerViewTestCase):
    def setUp(self):
        super().setUp()
        self.session, _ = start_session(self.student, self.scenario)
        self.url = reverse("roleplay-session-reply", args=[self.session.id])

    def test_returns_the_whole_updated_scene(self):
        self.client.force_authenticate(user=self.student)
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = provider_returning(TURN_PAYLOAD)
            response = self.client.post(self.url, {"message": "I can't invest."}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]["session"]
        self.assertEqual(len(body["turns"]), 3)
        self.assertEqual(body["athlete_turn_count"], 1)

    def test_a_blank_message_is_rejected_before_any_provider_call(self):
        self.client.force_authenticate(user=self.student)
        with patch("wargamer.services.get_provider") as get_provider:
            response = self.client.post(self.url, {"message": "   "}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        get_provider.assert_not_called()

    def test_a_provider_failure_is_a_502_and_writes_nothing(self):
        self.client.force_authenticate(user=self.student)
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = ProviderError("boom")
            response = self.client.post(self.url, {"message": "No."}, format="json")

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.session.refresh_from_db()
        self.assertEqual(self.session.turns.count(), 1)

    def test_another_students_session_cannot_be_replied_to(self):
        self.client.force_authenticate(user=self.other_student)
        response = self.client.post(self.url, {"message": "Hello."}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


@override_settings(ROLEPLAY_MIN_ATHLETE_TURNS=1)
class EvaluateSessionViewTests(WargamerViewTestCase):
    def setUp(self):
        super().setUp()
        self.session, _ = start_session(self.student, self.scenario)
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = provider_returning(TURN_PAYLOAD)
            submit_turn(self.session, "I can't invest, but I'll share your store.")
        self.session.refresh_from_db()
        self.url = reverse("roleplay-session-evaluate", args=[self.session.id])

    def test_returns_the_report_card_with_the_answer_key_revealed(self):
        self.client.force_authenticate(user=self.student)
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = provider_returning(
                EVALUATION_PAYLOAD
            )
            response = self.client.post(self.url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(body["status"], "COMPLETED")
        self.assertEqual(body["overall_score"], 80)
        self.assertEqual(len(body["rubric"]), 3)
        self.assertEqual(body["rubric"][0]["key"], "time_to_boundary")
        self.assertEqual(body["ideal_response"]["pivot"], self.scenario.ideal_pivot)

    @override_settings(ROLEPLAY_MIN_ATHLETE_TURNS=5)
    def test_too_short_a_conversation_is_a_400(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_abandoning_then_scoring_is_a_409(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(reverse("roleplay-session-abandon", args=[self.session.id]), {}, format="json")

        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)


class SessionHistoryViewTests(WargamerViewTestCase):
    def test_lists_only_this_students_runs_paginated(self):
        start_session(self.student, self.scenario)
        start_session(self.other_student, self.scenario)

        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("roleplay-session-history"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(body["count"], 1)
        self.assertEqual(body["results"][0]["scenario_code"], self.scenario.code)


class AdminScenarioViewTests(WargamerViewTestCase):
    def test_a_student_cannot_reach_the_catalog(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("roleplay-admin-scenarios"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_lists_with_usage_counts(self):
        start_session(self.student, self.scenario)
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(reverse("roleplay-admin-scenarios"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = response.json()["data"]["results"][0]
        self.assertEqual(row["session_count"], 1)
        self.assertEqual(row["completion_count"], 0)

    def test_admin_creates_a_scenario(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("roleplay-admin-scenarios"),
            {
                "code": "ls-302-s4",
                "title": "The Group Chat Favour",
                "relationship": "FRIENDS",
                "pressure_type": "ACCESS",
                "key_skill": "Social boundaries",
                "counterpart_role": "A teammate",
                "setup": "A teammate wants your sponsor code.",
                "opening_message": "Just send me the code, nobody will know.",
                "exercise": "Decline without making it personal.",
                "persona": "PERSISTENT",
                "difficulty": "EASY",
                "points_reward": 25,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # The code is normalised on write, so a lowercase entry still matches
        # seeddata's natural key.
        self.assertEqual(response.json()["data"]["code"], "LS-302-S4")

    def test_deleting_a_scenario_students_have_run_archives_it_instead(self):
        start_session(self.student, self.scenario)
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(reverse("roleplay-admin-scenario-detail", args=[self.scenario.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.scenario.refresh_from_db()
        self.assertEqual(self.scenario.status, "ARCHIVED")

    def test_deleting_an_unused_scenario_really_deletes_it(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(reverse("roleplay-admin-scenario-detail", args=[self.scenario.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(RolePlayScenario.objects.filter(pk=self.scenario.id).exists())


class AdminSessionViewTests(WargamerViewTestCase):
    def test_feed_is_admin_only_and_flattens_the_row(self):
        start_session(self.student, self.scenario)

        self.client.force_authenticate(user=self.student)
        self.assertEqual(
            self.client.get(reverse("roleplay-admin-sessions")).status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("roleplay-admin-sessions"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = response.json()["data"]["results"][0]
        self.assertEqual(row["student_email"], self.student.email)
        self.assertEqual(row["scenario_code"], self.scenario.code)

    def test_admin_can_read_any_transcript(self):
        session, _ = start_session(self.student, self.scenario)
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(reverse("roleplay-admin-session-detail", args=[session.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["student_email"], self.student.email)

    def test_admin_stats_are_derived_from_sessions(self):
        start_session(self.student, self.scenario)
        self.client.force_authenticate(user=self.admin)

        body = self.client.get(reverse("roleplay-admin-stats")).json()["data"]
        self.assertEqual(body["published_scenarios"], 1)
        self.assertEqual(body["total_sessions"], 1)
        self.assertEqual(body["sessions_in_progress"], 1)
