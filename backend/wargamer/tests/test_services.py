"""Session lifecycle, scoring and payout.

The provider is always patched — nothing here ever reaches Gemini — and the
payloads come back as JSON strings wrapped in a ProviderResult, exactly as
`generate_course` returns them.
"""

import json
from unittest.mock import patch

from django.test import TestCase, override_settings

from ai_courses.providers.base import ProviderError, ProviderResult, ProviderTransportError
from rewards.models import PointsTransaction, StudentPointsAccount

from ..exceptions import (
    NotEnoughTurnsError,
    ScenarioUnavailableError,
    SessionClosedError,
    SimulatorUnavailableError,
    TurnLimitReachedError,
)
from ..models import RolePlayScenario, RolePlaySession, RolePlayTurn
from ..services import (
    abandon_session,
    evaluate_session,
    get_module_stats,
    start_session,
    submit_turn,
)
from .factories import EVALUATION_PAYLOAD, TURN_PAYLOAD, make_scenario, make_user


def provider_returning(payload):
    """A patched provider whose single method returns `payload` as JSON."""
    def _generate_course(prompt, schema, timeout=None, files=None):
        return ProviderResult(text=json.dumps(payload))

    return _generate_course


class StartSessionTests(TestCase):
    def setUp(self):
        self.student = make_user("rpstudent")
        self.scenario = make_scenario()

    def test_opens_the_scene_with_the_authored_opening_line_and_no_provider_call(self):
        with patch("wargamer.services.get_provider") as provider:
            session, created = start_session(self.student, self.scenario)

        self.assertTrue(created)
        provider.assert_not_called()
        self.assertEqual(session.turns.count(), 1)
        opening = session.turns.first()
        self.assertEqual(opening.speaker, RolePlayTurn.Speaker.COUNTERPART)
        self.assertEqual(opening.content, self.scenario.opening_message)
        self.assertEqual(opening.order, 0)

    def test_snapshots_the_persona_so_a_later_catalog_edit_does_not_rewrite_history(self):
        session, _ = start_session(self.student, self.scenario)
        self.scenario.persona = RolePlayScenario.Persona.AGGRESSIVE
        self.scenario.save(update_fields=["persona"])

        session.refresh_from_db()
        self.assertEqual(session.persona, RolePlayScenario.Persona.GUILT_TRIP)

    def test_second_start_resumes_rather_than_duplicating(self):
        first, created_first = start_session(self.student, self.scenario)
        second, created_second = start_session(self.student, self.scenario)

        self.assertTrue(created_first)
        self.assertFalse(created_second)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(RolePlaySession.objects.count(), 1)

    def test_a_finished_run_does_not_block_a_fresh_one(self):
        first, _ = start_session(self.student, self.scenario)
        abandon_session(first)

        second, created = start_session(self.student, self.scenario)
        self.assertTrue(created)
        self.assertNotEqual(first.pk, second.pk)

    def test_refuses_an_unpublished_scenario(self):
        draft = make_scenario(code="LS-302-S9", status="DRAFT")
        with self.assertRaises(ScenarioUnavailableError):
            start_session(self.student, draft)


class SubmitTurnTests(TestCase):
    def setUp(self):
        self.student = make_user("rpturnstudent")
        self.scenario = make_scenario()
        self.session, _ = start_session(self.student, self.scenario)

    def _reply(self, message="I can't invest, but I'll share your store.", payload=None):
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = provider_returning(
                payload or TURN_PAYLOAD
            )
            return submit_turn(self.session, message)

    def test_appends_both_lines_in_order(self):
        athlete, counterpart = self._reply()

        self.assertEqual(athlete.speaker, RolePlayTurn.Speaker.ATHLETE)
        self.assertEqual(athlete.order, 1)
        self.assertEqual(counterpart.speaker, RolePlayTurn.Speaker.COUNTERPART)
        self.assertEqual(counterpart.order, 2)
        self.assertEqual(counterpart.content, TURN_PAYLOAD["reply"])
        self.assertEqual(counterpart.pressure_level, 4)

        self.session.refresh_from_db()
        self.assertEqual(self.session.athlete_turn_count, 1)

    def test_concession_latches_on(self):
        self._reply(payload={**TURN_PAYLOAD, "conceded": True})
        self.session.refresh_from_db()
        self.assertTrue(self.session.counterpart_conceded)

        # A later line that doesn't repeat the flag must not un-concede.
        self._reply(payload=TURN_PAYLOAD)
        self.session.refresh_from_db()
        self.assertTrue(self.session.counterpart_conceded)

    def test_a_provider_failure_rolls_the_athlete_line_back(self):
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = ProviderError("boom")
            with self.assertRaises(SimulatorUnavailableError):
                submit_turn(self.session, "I can't do that.")

        self.session.refresh_from_db()
        # Only the authored opening line survives — nothing half-written.
        self.assertEqual(self.session.turns.count(), 1)
        self.assertEqual(self.session.athlete_turn_count, 0)

    def test_an_unusable_payload_is_treated_as_a_failure_not_an_empty_line(self):
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = provider_returning(
                {"reply": "   ", "conceded": False, "pressure_level": 3}
            )
            with self.assertRaises(SimulatorUnavailableError):
                submit_turn(self.session, "No.")

        self.session.refresh_from_db()
        self.assertEqual(self.session.turns.count(), 1)

    @override_settings(ROLEPLAY_MAX_ATHLETE_TURNS=1)
    def test_stops_at_the_turn_limit(self):
        self._reply()
        self.session.refresh_from_db()
        with self.assertRaises(TurnLimitReachedError):
            submit_turn(self.session, "One more thing.")

    def test_refuses_to_continue_a_finished_scene(self):
        abandon_session(self.session)
        with self.assertRaises(SessionClosedError):
            submit_turn(self.session, "Wait.")


@override_settings(ROLEPLAY_MIN_ATHLETE_TURNS=2, ROLEPLAY_PASS_SCORE_PERCENT=70)
class EvaluateSessionTests(TestCase):
    def setUp(self):
        self.student = make_user("rpevalstudent")
        self.scenario = make_scenario()
        self.session, _ = start_session(self.student, self.scenario)
        self._hold_conversation(turns=2)

    def _hold_conversation(self, turns):
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = provider_returning(TURN_PAYLOAD)
            for index in range(turns):
                submit_turn(self.session, f"No — reply {index}.")
                self.session.refresh_from_db()

    def _evaluate(self, payload=None):
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = provider_returning(
                payload or EVALUATION_PAYLOAD
            )
            return evaluate_session(self.session)

    def test_writes_the_report_card_and_averages_the_three_criteria_server_side(self):
        session = self._evaluate()

        self.assertEqual(session.status, RolePlaySession.SessionStatus.COMPLETED)
        self.assertEqual(session.time_to_boundary_score, 80)
        self.assertEqual(session.tone_control_score, 70)
        self.assertEqual(session.deflection_to_policy_score, 90)
        self.assertEqual(session.overall_score, 80)
        self.assertTrue(session.passed)
        self.assertEqual(session.verdict, "Held the line")
        self.assertEqual(session.criteria_notes["tone_control"], "Steady, slightly apologetic at the end.")

    def test_the_headline_score_ignores_an_overall_the_model_tries_to_supply(self):
        session = self._evaluate(payload={**EVALUATION_PAYLOAD, "overall_score": 5})
        self.assertEqual(session.overall_score, 80)

    def test_boundary_seconds_come_from_the_stored_turn_not_the_payload(self):
        session = self._evaluate()
        first_athlete_turn = session.turns.filter(speaker=RolePlayTurn.Speaker.ATHLETE).first()
        self.assertEqual(session.boundary_seconds, first_athlete_turn.seconds_from_start)

    def test_an_out_of_range_boundary_turn_is_dropped_rather_than_rendered(self):
        session = self._evaluate(payload={**EVALUATION_PAYLOAD, "boundary_turn": 9})
        self.assertIsNone(session.boundary_turn)
        self.assertIsNone(session.boundary_seconds)

    def test_scores_outside_0_100_are_clamped(self):
        session = self._evaluate(
            payload={**EVALUATION_PAYLOAD, "tone_control_score": 180, "time_to_boundary_score": -40}
        )
        self.assertEqual(session.tone_control_score, 100)
        self.assertEqual(session.time_to_boundary_score, 0)

    def test_a_pass_pays_the_scenarios_points_into_the_shared_ledger(self):
        session = self._evaluate()

        self.assertEqual(session.points_awarded, 50)
        transaction = PointsTransaction.objects.get(roleplay_session=session)
        self.assertEqual(transaction.amount, 50)
        self.assertEqual(
            transaction.transaction_type, PointsTransaction.TransactionType.ROLEPLAY_REWARD
        )
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 50)

    def test_a_fail_pays_nothing(self):
        session = self._evaluate(
            payload={
                **EVALUATION_PAYLOAD,
                "time_to_boundary_score": 20,
                "tone_control_score": 30,
                "deflection_to_policy_score": 10,
            }
        )

        self.assertFalse(session.passed)
        self.assertEqual(session.points_awarded, 0)
        self.assertFalse(PointsTransaction.objects.filter(roleplay_session=session).exists())

    def test_re_evaluating_a_scored_run_never_pays_twice(self):
        self._evaluate()
        again = self._evaluate()

        self.assertEqual(again.overall_score, 80)
        self.assertEqual(PointsTransaction.objects.filter(roleplay_session=again).count(), 1)
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 50)

    def test_too_short_a_conversation_is_not_graded(self):
        short_student = make_user("rpshort")
        session, _ = start_session(short_student, self.scenario)
        with self.assertRaises(NotEnoughTurnsError):
            evaluate_session(session)

    def test_a_scoring_failure_leaves_a_retryable_session(self):
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = ProviderError("nope")
            with self.assertRaises(SimulatorUnavailableError):
                evaluate_session(self.session)

        self.session.refresh_from_db()
        self.assertEqual(self.session.status, RolePlaySession.SessionStatus.EVALUATING)
        self.assertTrue(self.session.error_message)
        # The transcript is intact, so asking again just works.
        session = self._evaluate()
        self.assertEqual(session.status, RolePlaySession.SessionStatus.COMPLETED)
        self.assertEqual(session.error_message, "")

    def test_a_fast_transport_failure_is_retried_once(self):
        with patch("wargamer.services.get_provider") as get_provider:
            get_provider.return_value.generate_course.side_effect = [
                ProviderTransportError("blip"),
                ProviderResult(text=json.dumps(EVALUATION_PAYLOAD)),
            ]
            session = evaluate_session(self.session)

        self.assertEqual(session.status, RolePlaySession.SessionStatus.COMPLETED)

    def test_a_fabricated_excuse_is_flagged_without_a_second_deduction(self):
        session = self._evaluate(
            payload={
                **EVALUATION_PAYLOAD,
                "used_fabricated_excuse": True,
                "fabrication_note": "You invented an agent. Use your own training schedule instead.",
            }
        )

        self.assertTrue(session.used_fabricated_excuse)
        self.assertIn("training schedule", session.fabrication_note)
        # The rubric scores are untouched by the flag.
        self.assertEqual(session.overall_score, 80)

    def test_an_abandoned_run_cannot_be_scored(self):
        abandon_session(self.session)
        with self.assertRaises(SessionClosedError):
            evaluate_session(self.session)


class ModuleStatsTests(TestCase):
    def setUp(self):
        self.student = make_user("rpstatsstudent")
        self.scenario = make_scenario()
        make_scenario(code="LS-302-S2", title="VIP Access")

    def test_counts_only_published_scenarios_and_reports_the_best_run(self):
        stats = get_module_stats(self.student)
        self.assertEqual(stats["scenarios_total"], 2)
        self.assertEqual(stats["scenarios_passed"], 0)
        self.assertFalse(stats["module_complete"])

        RolePlaySession.objects.create(
            student=self.student,
            scenario=self.scenario,
            persona=RolePlayScenario.Persona.GUILT_TRIP,
            status=RolePlaySession.SessionStatus.COMPLETED,
            started_at="2026-01-01T10:00:00Z",
            overall_score=55,
            passed=False,
        )
        RolePlaySession.objects.create(
            student=self.student,
            scenario=self.scenario,
            persona=RolePlayScenario.Persona.GUILT_TRIP,
            status=RolePlaySession.SessionStatus.COMPLETED,
            started_at="2026-01-02T10:00:00Z",
            overall_score=88,
            passed=True,
            points_awarded=50,
        )

        stats = get_module_stats(self.student)
        self.assertEqual(stats["scenarios_passed"], 1)
        self.assertEqual(stats["best_overall_score"], 88)
        self.assertEqual(stats["runs_completed"], 2)
        self.assertEqual(stats["points_earned"], 50)

    def test_a_weaker_rerun_never_downgrades_a_passed_scenario(self):
        RolePlaySession.objects.create(
            student=self.student,
            scenario=self.scenario,
            persona=RolePlayScenario.Persona.GUILT_TRIP,
            status=RolePlaySession.SessionStatus.COMPLETED,
            started_at="2026-01-01T10:00:00Z",
            overall_score=95,
            passed=True,
        )
        RolePlaySession.objects.create(
            student=self.student,
            scenario=self.scenario,
            persona=RolePlayScenario.Persona.GUILT_TRIP,
            status=RolePlaySession.SessionStatus.COMPLETED,
            started_at="2026-01-03T10:00:00Z",
            overall_score=40,
            passed=False,
        )

        stats = get_module_stats(self.student)
        self.assertEqual(stats["scenarios_passed"], 1)
