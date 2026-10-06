import json
from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone

from ai_courses import services
from ai_courses.models import AICourseGeneration
from ai_courses.providers.base import (
    ProviderError,
    ProviderQuotaError,
    ProviderResult,
)
from courses.models import Category, Course

UserModel = get_user_model()
GenerationStatus = AICourseGeneration.GenerationStatus


def _admin(email="admin@example.com"):
    return UserModel.objects.create_user(
        username=email, email=email, password="StrongPass123!",
        role=UserModel.Roles.ADMIN, gender=UserModel.Gender.OTHER,
    )


def _teacher(email="teacher@example.com"):
    return UserModel.objects.create_user(
        username=email, email=email, password="StrongPass123!",
        role=UserModel.Roles.TEACHER, gender=UserModel.Gender.OTHER,
    )


class StubProvider:
    def __init__(self, text, raises=None):
        self.text = text
        self.raises = raises

    def generate_course(self, prompt, response_schema, timeout):
        if self.raises:
            raise self.raises
        return ProviderResult(text=self.text, input_tokens=100, output_tokens=200)


class FlakyProvider:
    """Raises a transport error on its first call, succeeds on the second —
    simulates the exact retry-once path in _run_generation."""

    def __init__(self, text, fail_times=1):
        self.text = text
        self.fail_times = fail_times
        self.calls = 0

    def generate_course(self, prompt, response_schema, timeout):
        self.calls += 1
        if self.calls <= self.fail_times:
            from ai_courses.providers.base import ProviderTransportError

            raise ProviderTransportError("simulated transient network error")
        return ProviderResult(text=self.text, input_tokens=100, output_tokens=200)


class RaisingProvider:
    """Raises the same error on every call — for the permanent-failure paths."""

    def __init__(self, exc):
        self.exc = exc
        self.calls = 0

    def generate_course(self, prompt, response_schema, timeout):
        self.calls += 1
        raise self.exc


class ConcurrencyAndQuotaTests(TestCase):
    def setUp(self):
        self.admin = _admin()
        self.category = Category.objects.create(name="Cat")

    def _validated_data(self, **overrides):
        data = {
            "title": "Course",
            "description": "",
            "category": self.category,
            "difficulty": Course.Difficulty.BEGINNER,
            "instructors": [_teacher(f"t{overrides.get('n', 0)}@example.com")],
            "amount": Decimal("0"),
            "target_audience": "",
            "objectives": [],
            "tier": None,
            "modules_count": 3,
            "lessons_per_module": 2,
            "include_quizzes": True,
            "questions_per_quiz": 3,
            "include_assignments": True,
            "weeks_between_modules": 2,
            "additional_instructions": "",
        }
        data.update({k: v for k, v in overrides.items() if k != "n"})
        return data

    def test_second_inflight_job_for_same_user_is_blocked(self):
        with patch("ai_courses.services.threading.Thread"):
            services.start_generation(self.admin, self._validated_data(n=1))
            with self.assertRaises(services.GenerationConcurrencyError):
                services.start_generation(self.admin, self._validated_data(n=2))

    def test_global_concurrency_cap_blocks_a_different_user(self):
        with self.settings(AI_MAX_CONCURRENT_GENERATIONS=1):
            with patch("ai_courses.services.threading.Thread"):
                services.start_generation(self.admin, self._validated_data(n=1))
                other_admin = _admin("admin2@example.com")
                with self.assertRaises(services.GenerationConcurrencyError):
                    services.start_generation(other_admin, self._validated_data(n=2))

    def test_monthly_quota_exceeded_raises(self):
        with self.settings(AI_MONTHLY_LIMIT=1):
            with patch("ai_courses.services.threading.Thread"):
                services.start_generation(self.admin, self._validated_data(n=1))
                # Move the first job to a terminal, non-cancelled state so it still
                # counts against the monthly counter (get_monthly_usage excludes only
                # CANCELLED) while freeing the per-user concurrency guard.
                AICourseGeneration.objects.filter(requested_by=self.admin).update(
                    status=GenerationStatus.FAILED
                )
                with self.assertRaises(services.GenerationQuotaError):
                    services.start_generation(self.admin, self._validated_data(n=2))

    def test_reap_stale_jobs_marks_stale_running_as_failed(self):
        job = AICourseGeneration.objects.create(
            requested_by=self.admin,
            status=GenerationStatus.RUNNING,
            input_payload={},
            heartbeat_at=timezone.now() - timedelta(seconds=999),
        )
        with self.settings(AI_STALE_JOB_THRESHOLD_SECONDS=180):
            services.reap_stale_jobs()

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)

    def test_reap_stale_jobs_leaves_fresh_running_jobs_alone(self):
        job = AICourseGeneration.objects.create(
            requested_by=self.admin,
            status=GenerationStatus.RUNNING,
            input_payload={},
            heartbeat_at=timezone.now(),
        )
        services.reap_stale_jobs()

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.RUNNING)

    def test_cancel_generation_transitions_pending_to_cancelled(self):
        job = AICourseGeneration.objects.create(
            requested_by=self.admin, status=GenerationStatus.PENDING, input_payload={}
        )
        services.cancel_generation(job)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.CANCELLED)

    def test_cancel_generation_is_a_no_op_on_a_terminal_job(self):
        job = AICourseGeneration.objects.create(
            requested_by=self.admin, status=GenerationStatus.SUCCEEDED, input_payload={}
        )
        services.cancel_generation(job)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.SUCCEEDED)


class RunGenerationTests(TestCase):
    def setUp(self):
        self.admin = _admin()
        self.category = Category.objects.create(name="Cat")
        self.teacher = _teacher()

    def _create_job(self):
        validated_data = {
            "title": "Run Gen Course",
            "description": "",
            "category": self.category,
            "difficulty": Course.Difficulty.BEGINNER,
            "instructors": [self.teacher],
            "amount": Decimal("0"),
            "target_audience": "",
            "objectives": [],
            "tier": None,
            "modules_count": 1,
            "lessons_per_module": 1,
            "include_quizzes": False,
            "questions_per_quiz": 3,
            "include_assignments": False,
            "weeks_between_modules": 2,
            "additional_instructions": "",
        }
        return AICourseGeneration.objects.create(
            requested_by=self.admin,
            status=GenerationStatus.PENDING,
            input_payload=services._serialize_input(validated_data),
        )

    def test_transport_error_retries_and_refreshes_heartbeat(self):
        # Regression test: a failed attempt that times out must not leave
        # heartbeat_at stale through the entire next attempt too — otherwise a
        # legitimately-still-retrying job can look "stale" to the reaper before
        # it's actually had AI_STALE_JOB_THRESHOLD_SECONDS to finish.
        plan_json = json.dumps(
            {
                "summary": "s",
                "objectives": [],
                "learning_outcomes": ["Build a working plan"],
                "modules": [
                    {
                        "title": "M1",
                        "description": "",
                        "items": [{"kind": "lesson", "title": "L1", "body": "content", "estimated_minutes": 10}],
                    }
                ],
            }
        )
        job = self._create_job()
        provider = FlakyProvider(plan_json, fail_times=1)
        recorded_steps = []
        original_touch = services._touch

        def recording_touch(job_arg, **fields):
            if "step" in fields:
                recorded_steps.append(fields["step"])
            return original_touch(job_arg, **fields)

        with patch("ai_courses.services.get_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep"):
                with patch("ai_courses.services._touch", side_effect=recording_touch):
                    services._run_generation(job.id)

        self.assertEqual(provider.calls, 2)
        # The fix under test: a heartbeat touch happens between the failed first
        # attempt and the retry, not just once before the whole retry loop.
        self.assertTrue(any(step.startswith("Calling AI provider (retry") for step in recorded_steps))
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.SUCCEEDED)
        self.assertIsNotNone(job.course)

    def test_survives_two_consecutive_transport_errors(self):
        # Real-world testing against the live Gemini API showed two consecutive
        # 503s before a third attempt succeeded on this prompt/schema — the whole
        # reason MAX_TRANSPORT_ATTEMPTS was raised from 2 to 3. This is that case.
        plan_json = json.dumps(
            {
                "summary": "s",
                "objectives": [],
                "learning_outcomes": ["Build a working plan"],
                "modules": [
                    {
                        "title": "M1",
                        "description": "",
                        "items": [{"kind": "lesson", "title": "L1", "body": "content", "estimated_minutes": 10}],
                    }
                ],
            }
        )
        job = self._create_job()
        provider = FlakyProvider(plan_json, fail_times=2)
        with patch("ai_courses.services.get_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep"):
                services._run_generation(job.id)

        self.assertEqual(provider.calls, 3)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.SUCCEEDED)

    def test_retry_delay_backs_off_exponentially_within_bounds(self):
        # The 503s that motivated this: three flat 2s retries gave the overloaded
        # model only ~4s to recover, so every attempt burned inside ~14s.
        delays = [services._retry_delay(attempt) for attempt in range(1, 6)]

        for attempt, delay in enumerate(delays, start=1):
            base = min(
                services.TRANSPORT_RETRY_BACKOFF_SECONDS * (2 ** (attempt - 1)),
                services.TRANSPORT_RETRY_MAX_BACKOFF_SECONDS,
            )
            # Jitter only ever adds, and never more than a quarter of the base.
            self.assertGreaterEqual(delay, base)
            self.assertLessEqual(delay, base * 1.25)

        self.assertGreater(delays[3], delays[0])
        # One backoff plus one full-length attempt must still leave the stale-job
        # reaper unable to mistake a retrying job for an orphaned one.
        self.assertLess(
            services.TRANSPORT_RETRY_MAX_BACKOFF_SECONDS * 1.25 + settings.AI_REQUEST_TIMEOUT,
            settings.AI_STALE_JOB_THRESHOLD_SECONDS,
        )

    @override_settings(AI_FALLBACK_MODEL="")
    def test_every_retry_waits_longer_than_the_last(self):
        job = self._create_job()
        provider = FlakyProvider("unused", fail_times=99)
        slept = []
        with patch("ai_courses.services.get_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep", side_effect=slept.append):
                services._run_generation(job.id)

        self.assertEqual(len(slept), services.MAX_TRANSPORT_ATTEMPTS - 1)
        self.assertEqual(slept, sorted(slept))

    def test_cancelling_during_the_retry_window_stops_further_provider_calls(self):
        job = self._create_job()
        provider = FlakyProvider("unused", fail_times=99)

        def cancel_instead_of_sleeping(_seconds):
            AICourseGeneration.objects.filter(pk=job.id).update(
                status=GenerationStatus.CANCELLED
            )

        with patch("ai_courses.services.get_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep", side_effect=cancel_instead_of_sleeping):
                services._run_generation(job.id)

        # The first attempt failed, the admin cancelled during the backoff, and no
        # second call was billed.
        self.assertEqual(provider.calls, 1)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.CANCELLED)

    @override_settings(AI_FALLBACK_MODEL="")
    def test_transport_error_fails_cleanly_after_exhausting_all_retries(self):
        job = self._create_job()
        provider = FlakyProvider("unused", fail_times=99)
        with patch("ai_courses.services.get_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep"):
                services._run_generation(job.id)

        self.assertEqual(provider.calls, services.MAX_TRANSPORT_ATTEMPTS)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIsNone(job.course)
        self.assertIn("simulated transient network error", job.error_message)

    @override_settings(AI_MODEL="primary-model", AI_FALLBACK_MODEL="backup-model")
    def test_falls_back_to_the_backup_model_when_the_primary_is_overloaded(self):
        # The real failure this exists for: Gemini answers 503 "this model is
        # currently experiencing high demand" per model, so the primary can be
        # refusing every call while another model serves the same request fine.
        plan_json = json.dumps(
            {
                "summary": "s",
                "objectives": [],
                "learning_outcomes": ["Build a working plan"],
                "modules": [
                    {
                        "title": "M1",
                        "description": "",
                        "items": [{"kind": "lesson", "title": "L1", "body": "content", "estimated_minutes": 10}],
                    }
                ],
            }
        )
        primary = FlakyProvider("unused", fail_times=99)
        backup = StubProvider(plan_json)
        providers = {"primary-model": primary, "backup-model": backup}
        job = self._create_job()

        with patch(
            "ai_courses.services.get_provider",
            side_effect=lambda model=None: providers[model or "primary-model"],
        ):
            with patch("ai_courses.services.time.sleep"):
                services._run_generation(job.id)

        self.assertEqual(primary.calls, services.MAX_TRANSPORT_ATTEMPTS)
        job.refresh_from_db()
        self.assertIsNotNone(job.course)
        # Usable, but the admin is told a different model wrote it.
        self.assertEqual(job.status, GenerationStatus.PARTIAL)
        self.assertIn("backup-model", job.warnings[0])

    @override_settings(AI_MODEL="primary-model", AI_FALLBACK_MODEL="backup-model")
    def test_failure_message_names_both_models_when_neither_is_available(self):
        primary = FlakyProvider("unused", fail_times=99)
        backup = FlakyProvider("unused", fail_times=99)
        providers = {"primary-model": primary, "backup-model": backup}
        job = self._create_job()

        with patch(
            "ai_courses.services.get_provider",
            side_effect=lambda model=None: providers[model or "primary-model"],
        ):
            with patch("ai_courses.services.time.sleep"):
                services._run_generation(job.id)

        self.assertEqual(primary.calls, services.MAX_TRANSPORT_ATTEMPTS)
        self.assertEqual(backup.calls, services.MAX_TRANSPORT_ATTEMPTS)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("primary-model", job.error_message)
        self.assertIn("backup-model", job.error_message)

    @override_settings(AI_MODEL="primary-model", AI_FALLBACK_MODEL="backup-model")
    def test_quota_error_skips_retries_and_goes_straight_to_the_backup_model(self):
        # A 429 is per model and Google's own hint can be "retry in 13h" — retrying
        # the same model is a guaranteed second rejection, but the backup model has
        # its own quota.
        plan_json = json.dumps(
            {
                "summary": "s",
                "objectives": [],
                "learning_outcomes": ["Build a working plan"],
                "modules": [
                    {
                        "title": "M1",
                        "description": "",
                        "items": [{"kind": "lesson", "title": "L1", "body": "content", "estimated_minutes": 10}],
                    }
                ],
            }
        )
        primary = RaisingProvider(ProviderQuotaError("quota spent", retry_after_seconds=49225))
        backup = StubProvider(plan_json)
        providers = {"primary-model": primary, "backup-model": backup}
        job = self._create_job()

        with patch(
            "ai_courses.services.get_provider",
            side_effect=lambda model=None: providers[model or "primary-model"],
        ):
            with patch("ai_courses.services.time.sleep") as sleep:
                services._run_generation(job.id)

        self.assertEqual(primary.calls, 1)
        sleep.assert_not_called()
        job.refresh_from_db()
        self.assertIsNotNone(job.course)
        self.assertEqual(job.status, GenerationStatus.PARTIAL)

    @override_settings(AI_MODEL="primary-model", AI_FALLBACK_MODEL="backup-model")
    def test_quota_failure_message_is_readable_and_names_the_reset_time(self):
        exc = ProviderQuotaError("You exceeded your current quota.", retry_after_seconds=49225)
        providers = {
            "primary-model": RaisingProvider(exc),
            "backup-model": RaisingProvider(exc),
        }
        job = self._create_job()

        with patch(
            "ai_courses.services.get_provider",
            side_effect=lambda model=None: providers[model or "primary-model"],
        ):
            services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("quota is used up", job.error_message)
        self.assertIn("13h 40m", job.error_message)
        self.assertIn("primary-model", job.error_message)
        self.assertIn("backup-model", job.error_message)

    @override_settings(AI_MODEL="primary-model", AI_FALLBACK_MODEL="backup-model")
    def test_a_rejected_request_does_not_waste_a_call_on_the_backup_model(self):
        # A bad key or bad request is rejected identically by every model.
        primary = RaisingProvider(ProviderError("Gemini rejected the request (400): API key not valid."))
        backup = RaisingProvider(ProviderError("should never be called"))
        providers = {"primary-model": primary, "backup-model": backup}
        job = self._create_job()

        with patch(
            "ai_courses.services.get_provider",
            side_effect=lambda model=None: providers[model or "primary-model"],
        ):
            services._run_generation(job.id)

        self.assertEqual(primary.calls, 1)
        self.assertEqual(backup.calls, 0)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("API key not valid", job.error_message)

    def test_humanize_seconds_formats_quota_reset_hints(self):
        self.assertEqual(services._humanize_seconds(49225), "13h 40m")
        self.assertEqual(services._humanize_seconds(42), "42s")
        self.assertEqual(services._humanize_seconds(600), "10m")
        self.assertIsNone(services._humanize_seconds(0))
        self.assertIsNone(services._humanize_seconds(None))

    @override_settings(AI_MODEL="same-model", AI_FALLBACK_MODEL="same-model")
    def test_fallback_is_skipped_when_it_is_the_same_model(self):
        provider = FlakyProvider("unused", fail_times=99)
        job = self._create_job()

        with patch("ai_courses.services.get_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep"):
                services._run_generation(job.id)

        self.assertEqual(provider.calls, services.MAX_TRANSPORT_ATTEMPTS)

    def test_successful_generation_links_course_and_sets_succeeded(self):
        plan_json = json.dumps(
            {
                "summary": "s",
                "objectives": [],
                "learning_outcomes": ["Build a working plan"],
                "modules": [
                    {
                        "title": "M1",
                        "description": "",
                        "items": [{"kind": "lesson", "title": "L1", "body": "content", "estimated_minutes": 10}],
                    }
                ],
            }
        )
        job = self._create_job()
        with patch("ai_courses.services.get_provider", return_value=StubProvider(plan_json)):
            services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.SUCCEEDED)
        self.assertIsNotNone(job.course)
        self.assertEqual(job.warnings, [])
        self.assertEqual(job.progress_percent, 100)

    def test_generation_with_dropped_content_sets_partial(self):
        plan_json = json.dumps(
            {
                "summary": "s",
                "objectives": [],
                "learning_outcomes": ["Build a working plan"],
                "modules": [
                    {
                        "title": "M1",
                        "description": "",
                        "items": [
                            {"kind": "lesson", "title": "L1", "body": "content", "estimated_minutes": 10},
                            {
                                "kind": "quiz",
                                "questions": [
                                    {"text": "Q", "question_type": "MCQ", "marks": 1, "choices": []}
                                ],
                            },
                        ],
                    }
                ],
            }
        )
        job = self._create_job()
        job.input_payload["include_quizzes"] = True
        job.save(update_fields=["input_payload"])
        with patch("ai_courses.services.get_provider", return_value=StubProvider(plan_json)):
            services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.PARTIAL)
        self.assertTrue(job.warnings)

    def test_malformed_json_response_fails_with_no_course(self):
        job = self._create_job()
        with patch("ai_courses.services.get_provider", return_value=StubProvider("not json")):
            services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIsNone(job.course)
        # Reached validation (progress=70) before failing there — progress_percent
        # must reflect how far it actually got, not silently stay at 0.
        self.assertEqual(job.progress_percent, 70)

    def test_provider_error_fails_with_honest_message(self):
        from ai_courses.providers.base import ProviderError

        job = self._create_job()
        with patch(
            "ai_courses.services.get_provider",
            return_value=StubProvider(None, raises=ProviderError("GEMINI_API_KEY is not configured.")),
        ):
            services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("GEMINI_API_KEY", job.error_message)
        self.assertIsNone(job.course)

    def test_get_provider_raising_directly_is_caught_cleanly(self):
        # get_provider()/build_prompt() run outside the try/except around the
        # actual generate_course() call — a ProviderError raised at that point
        # (e.g. provider construction itself, not the network call) must still
        # produce a clean FAILED job with no course, not bubble up uncaught.
        from ai_courses.providers.base import ProviderError

        job = self._create_job()
        with patch("ai_courses.services.get_provider", side_effect=ProviderError("bad provider config")):
            services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("bad provider config", job.error_message)
        self.assertIsNone(job.course)

    def test_unexpected_exception_is_reported_with_real_detail(self):
        # Anything not explicitly anticipated (ProviderError/ProviderTransportError/
        # PlanValidationError) must still land as FAILED with the real exception
        # type/message in error_message — never the bare generic string alone —
        # so an opaque crash is actually debuggable from the admin-visible job row.
        #
        # Goes through _run_generation_safe (not _run_generation) since that's
        # where the catch-all lives — its `finally: connection.close()` is a
        # real background-thread cleanup step that would otherwise sever this
        # TestCase's own transaction-backed connection, so it's stubbed out for
        # just this call.
        job = self._create_job()
        with patch("ai_courses.services.get_provider", side_effect=RuntimeError("kaboom")):
            with patch.object(services.connection, "close"):
                services._run_generation_safe(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("RuntimeError", job.error_message)
        self.assertIn("kaboom", job.error_message)
        self.assertIsNone(job.course)
