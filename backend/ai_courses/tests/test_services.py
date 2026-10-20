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
    ProviderJobFailedError,
    ProviderQuotaError,
    ProviderTransportError,
)
from ai_courses.providers import custom_llm
from ai_courses.providers.custom_llm import JobEvent
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


def _job_body(modules=None, status="completed", **extra):
    """A finished job as the AI service returns it from GET /api/v1/jobs/<id>.

    Nested under `result` on purpose: the real contract is the service's, not
    ours, so every service-shaped fixture here goes through the same envelope
    search custom_llm_mapping does rather than being handed the plan directly."""

    body = {
        "job_id": "svc-job-1",
        "status": status,
        "result": {
            "summary": "s",
            "objectives": [],
            "learning_outcomes": ["Build a working plan"],
            "modules": modules if modules is not None else [
                {
                    "title": "M1",
                    "description": "",
                    "lessons": [{"title": "L1", "content": "content", "duration_minutes": 10}],
                }
            ],
        },
    }
    body.update(extra)
    return body


class StubCourseProvider:
    """Stands in for providers.custom_llm.CustomLLMProvider — only the two calls
    services makes on it (submit, then follow) are implemented."""

    def __init__(self, job_body=None, submit_errors=None, await_error=None, events=()):
        self.job_body = _job_body() if job_body is None else job_body
        self.submit_errors = list(submit_errors or [])
        self.await_error = await_error
        self.events = list(events)
        self.submit_calls = 0
        self.await_calls = 0
        self.payloads = []

    def submit_course_job(self, payload):
        self.submit_calls += 1
        self.payloads.append(payload)
        if self.submit_errors:
            raise self.submit_errors.pop(0)
        return "svc-job-1"

    def await_course_job(self, job_id, on_event=None):
        self.await_calls += 1
        for event in self.events:
            if on_event is not None:
                on_event(event)
        if self.await_error:
            raise self.await_error
        return self.job_body


def _transport_errors(count, message="simulated transient network error"):
    return [ProviderTransportError(message) for _ in range(count)]


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

    def test_job_records_the_course_provider_not_the_chat_provider(self):
        # settings.AI_PROVIDER/AI_MODEL still describe the Gemini calls the rest
        # of the backend makes; a course job must not be labelled with them.
        with patch("ai_courses.services.threading.Thread"):
            job = services.start_generation(self.admin, self._validated_data(n=1))

        self.assertEqual(job.provider, services.COURSE_PROVIDER_NAME)
        self.assertEqual(job.model_name, "")

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


@override_settings(AI_COURSE_SERVICE_URL="https://llm.example.test")
class RunGenerationTests(TestCase):
    def setUp(self):
        self.admin = _admin()
        self.category = Category.objects.create(name="Cat")
        self.teacher = _teacher()

    def _create_job(self, **payload_overrides):
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
        validated_data.update(payload_overrides)
        return AICourseGeneration.objects.create(
            requested_by=self.admin,
            status=GenerationStatus.PENDING,
            input_payload=services._serialize_input(validated_data),
        )

    # -- submitting ---------------------------------------------------------

    def test_transport_error_on_submit_retries_and_refreshes_heartbeat(self):
        # Regression test: a failed attempt that times out must not leave
        # heartbeat_at stale through the entire next attempt too — otherwise a
        # legitimately-still-retrying job can look "stale" to the reaper before
        # it's actually had AI_STALE_JOB_THRESHOLD_SECONDS to finish.
        job = self._create_job()
        provider = StubCourseProvider(submit_errors=_transport_errors(1))
        recorded_steps = []
        original_touch = services._touch

        def recording_touch(job_arg, **fields):
            if "step" in fields:
                recorded_steps.append(fields["step"])
            return original_touch(job_arg, **fields)

        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep"):
                with patch("ai_courses.services._touch", side_effect=recording_touch):
                    services._run_generation(job.id)

        self.assertEqual(provider.submit_calls, 2)
        # The fix under test: a heartbeat touch happens between the failed first
        # attempt and the retry, not just once before the whole retry loop.
        self.assertTrue(any(step.startswith("Retrying the AI service") for step in recorded_steps))
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.SUCCEEDED)
        self.assertIsNotNone(job.course)

    def test_survives_two_consecutive_transport_errors(self):
        job = self._create_job()
        provider = StubCourseProvider(submit_errors=_transport_errors(2))
        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep"):
                services._run_generation(job.id)

        self.assertEqual(provider.submit_calls, 3)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.SUCCEEDED)

    def test_retry_delay_backs_off_exponentially_within_bounds(self):
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
        # One backoff plus one full-length submit must still leave the stale-job
        # reaper unable to mistake a retrying job for an orphaned one.
        self.assertLess(
            services.TRANSPORT_RETRY_MAX_BACKOFF_SECONDS * 1.25
            + custom_llm.REQUEST_TIMEOUT_SECONDS,
            settings.AI_STALE_JOB_THRESHOLD_SECONDS,
        )

    def test_a_silent_progress_stream_cannot_outlive_the_stale_job_reaper(self):
        # The wait after submitting is unbounded in principle (a course can take
        # minutes), so the only thing keeping the reaper off a healthy job is that
        # the stream is abandoned for polling before the heartbeat goes stale.
        self.assertLess(
            custom_llm.STREAM_READ_TIMEOUT_SECONDS, settings.AI_STALE_JOB_THRESHOLD_SECONDS
        )

    def test_every_retry_waits_longer_than_the_last(self):
        job = self._create_job()
        provider = StubCourseProvider(submit_errors=_transport_errors(99))
        slept = []
        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep", side_effect=slept.append):
                services._run_generation(job.id)

        self.assertEqual(len(slept), services.MAX_TRANSPORT_ATTEMPTS - 1)
        self.assertEqual(slept, sorted(slept))

    def test_cancelling_during_the_retry_window_stops_further_provider_calls(self):
        job = self._create_job()
        provider = StubCourseProvider(submit_errors=_transport_errors(99))

        def cancel_instead_of_sleeping(_seconds):
            AICourseGeneration.objects.filter(pk=job.id).update(
                status=GenerationStatus.CANCELLED
            )

        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep", side_effect=cancel_instead_of_sleeping):
                services._run_generation(job.id)

        # The first attempt failed, the admin cancelled during the backoff, and no
        # second request was sent.
        self.assertEqual(provider.submit_calls, 1)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.CANCELLED)

    def test_transport_error_fails_cleanly_after_exhausting_all_retries(self):
        job = self._create_job()
        provider = StubCourseProvider(submit_errors=_transport_errors(99))
        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep"):
                services._run_generation(job.id)

        self.assertEqual(provider.submit_calls, services.MAX_TRANSPORT_ATTEMPTS)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIsNone(job.course)
        self.assertIn("simulated transient network error", job.error_message)

    def test_a_rejected_request_is_not_retried(self):
        # A rejected payload is rejected identically the second time — retrying it
        # only delays the admin seeing why.
        job = self._create_job()
        provider = StubCourseProvider(submit_errors=[ProviderError("unknown field 'wat'")])
        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep"):
                services._run_generation(job.id)

        self.assertEqual(provider.submit_calls, 1)
        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("unknown field 'wat'", job.error_message)

    def test_the_request_payload_matches_the_service_contract(self):
        tier = None
        job = self._create_job(
            title="NIL Basics",
            description="A short course",
            target_audience="Student athletes",
            objectives=["Read a term sheet"],
            tier=tier,
            amount=Decimal("49.99"),
            modules_count=4,
            lessons_per_module=3,
            include_quizzes=True,
            questions_per_quiz=6,
            include_assignments=True,
            ai_grading=True,
            weeks_between_modules=3,
            additional_instructions="Use real examples",
            difficulty=Course.Difficulty.INTERMEDIATE,
        )
        provider = StubCourseProvider()
        with patch("ai_courses.services.get_course_provider", return_value=provider):
            services._run_generation(job.id)

        payload = provider.payloads[0]
        self.assertEqual(payload["title"], "NIL Basics")
        self.assertEqual(payload["difficulty"], "intermediate")
        self.assertEqual(payload["num_modules"], 4)
        self.assertEqual(payload["lessons_per_module"], 3)
        self.assertEqual(payload["questions_per_quiz"], 6)
        self.assertEqual(payload["weeks_between_modules"], 3)
        self.assertEqual(payload["learning_objectives"], ["Read a term sheet"])
        self.assertEqual(payload["price"], 49.99)
        self.assertEqual(payload["instructor_ids"], [str(self.teacher.id)])
        self.assertEqual(payload["category_id"], str(self.category.id))
        self.assertTrue(payload["ai_grading_enabled"])
        self.assertIsNone(payload["callback_url"])
        self.assertFalse(payload["rag_enabled"])

    def test_rag_is_sent_as_the_integrations_constant_says(self):
        # Off by default, and flipping the constant is the whole switch — the
        # value is not silently hardcoded at the call site.
        job = self._create_job()
        provider = StubCourseProvider()
        with patch("ai_courses.services.RAG_ENABLED", True):
            with patch("ai_courses.services.get_course_provider", return_value=provider):
                services._run_generation(job.id)

        self.assertTrue(provider.payloads[0]["rag_enabled"])

    # -- following the job --------------------------------------------------

    def test_progress_events_move_the_step_and_the_bar(self):
        job = self._create_job()
        provider = StubCourseProvider(
            events=[
                JobEvent(status="running", progress=0, stage="Planning modules"),
                JobEvent(status="running", progress=50, stage="Writing lessons"),
            ]
        )
        seen = []
        original_touch = services._touch

        def recording_touch(job_arg, **fields):
            seen.append(fields)
            return original_touch(job_arg, **fields)

        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services._touch", side_effect=recording_touch):
                services._run_generation(job.id)

        steps = [fields.get("step") for fields in seen]
        self.assertIn("Planning modules", steps)
        self.assertIn("Writing lessons", steps)
        # Halfway through the service's own work is halfway through our slice of
        # the bar, not halfway through the whole bar — validation and the ORM
        # write still have to happen.
        self.assertIn(
            services._map_progress(50), [fields.get("progress_percent") for fields in seen]
        )
        self.assertEqual(services._map_progress(0), services.GENERATION_PROGRESS_FLOOR)
        self.assertEqual(services._map_progress(100), services.GENERATION_PROGRESS_CEILING)

    def test_the_bar_never_slides_backwards(self):
        # A real run reported 5% -> 10% -> 5% -> 0% as the service's pipeline moved
        # between nodes. The stage label must keep updating, but a bar that goes
        # backwards reads as something breaking.
        job = self._create_job()
        provider = StubCourseProvider(
            events=[
                JobEvent(status="running", progress=5, stage="starting"),
                JobEvent(status="running", progress=10, stage="rag_retrieval"),
                JobEvent(status="running", progress=5, stage="in_progress"),
                JobEvent(status="running", progress=0, stage="drafting"),
            ]
        )
        seen = []
        original_touch = services._touch

        def recording_touch(job_arg, **fields):
            seen.append(fields)
            return original_touch(job_arg, **fields)

        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services._touch", side_effect=recording_touch):
                services._run_generation(job.id)

        percents = [
            fields["progress_percent"] for fields in seen if "progress_percent" in fields
        ]
        self.assertEqual(percents, sorted(percents))
        # The later stages are still reported even though their progress was
        # lower — tidied, because the service's stage vocabulary is machine
        # spelling and this is the line the admin reads as the current step.
        steps = [fields.get("step") for fields in seen]
        self.assertIn("In progress", steps)
        self.assertIn("Drafting", steps)
        self.assertNotIn("in_progress", steps)

    def test_the_services_fuller_detail_is_kept_beside_the_step(self):
        # The live service sends both for the same moment: stage "starting" and
        # detail "Pipeline starting". The wizard shows the stage as the step and
        # the sentence under it, so neither is thrown away.
        job = self._create_job()
        provider = StubCourseProvider(
            events=[
                JobEvent(
                    status="running",
                    progress=20,
                    stage="drafting",
                    detail="Writing module 2 of 3",
                )
            ]
        )
        with patch("ai_courses.services.get_course_provider", return_value=provider):
            services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.course.ai_generations.first().id, job.id)
        history = AICourseGeneration.objects.get(pk=job.id)
        self.assertIn("Writing module 2 of 3", history.step_detail)

    def test_detail_that_only_repeats_the_step_is_not_stored_twice(self):
        job = self._create_job()
        provider = StubCourseProvider(
            events=[
                JobEvent(
                    status="running", progress=20, stage="starting", detail="Starting"
                )
            ]
        )
        seen = []
        original_touch = services._touch

        def recording_touch(job_arg, **fields):
            seen.append(fields)
            return original_touch(job_arg, **fields)

        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services._touch", side_effect=recording_touch):
                services._run_generation(job.id)

        details = [fields.get("step_detail") for fields in seen if "step_detail" in fields]
        self.assertNotIn("Starting", details)

    def test_step_changed_at_only_moves_when_something_actually_moved(self):
        # heartbeat_at is written on every pass, including the ones reporting
        # nothing new, so it cannot tell "working" from "stuck on one stage".
        job = self._create_job()
        services._touch(job, step="Generating course", progress_percent=15)
        job.refresh_from_db()
        moved_at = job.step_changed_at
        self.assertIsNotNone(moved_at)

        services._touch(job)
        job.refresh_from_db()
        self.assertEqual(job.step_changed_at, moved_at)
        self.assertGreater(job.heartbeat_at, moved_at)

    def test_every_progress_event_is_logged_so_a_run_can_be_followed(self):
        job = self._create_job()
        provider = StubCourseProvider(
            events=[
                JobEvent(status="running", progress=5, stage="starting", detail="Pipeline starting"),
                JobEvent(
                    status="running",
                    progress=40,
                    stage="drafting",
                    detail="Writing module 2 of 3",
                    raw={"data": {"modules_completed": 2, "modules_total": 3}},
                ),
            ]
        )
        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with self.assertLogs("ai_courses", level="INFO") as captured:
                services._run_generation(job.id)

        logged = "\n".join(captured.output)
        self.assertIn("stage='starting'", logged)
        self.assertIn("detail='Writing module 2 of 3'", logged)
        # The service's own per-event payload is where anything richer would
        # arrive, so it is logged rather than discarded with the event.
        self.assertIn("modules_completed", logged)

    def test_usage_and_model_are_read_from_the_services_metrics_block(self):
        job = self._create_job()
        body = _job_body(
            metrics={
                "prompt_tokens": 1200,
                "completion_tokens": 8400,
                "generation_model": "qwen3:8b",
                "latency_ms": 90000,
            }
        )
        self._run_provider(job, StubCourseProvider(job_body=body))

        job.refresh_from_db()
        self.assertEqual(job.input_tokens, 1200)
        self.assertEqual(job.output_tokens, 8400)
        self.assertEqual(job.model_name, "qwen3:8b")

    def test_null_metrics_do_not_break_the_write(self):
        # Every metric comes back null on a job that failed early, and the model
        # is reported as null rather than omitted.
        job = self._create_job()
        body = _job_body(
            metrics={"prompt_tokens": None, "completion_tokens": None, "generation_model": None}
        )
        self._run_provider(job, StubCourseProvider(job_body=body))

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.SUCCEEDED)
        self.assertIsNone(job.input_tokens)
        self.assertEqual(job.model_name, "")

    def test_cancelling_mid_generation_stops_following_the_job(self):
        job = self._create_job()

        def cancel(_event):
            AICourseGeneration.objects.filter(pk=job.id).update(
                status=GenerationStatus.CANCELLED
            )

        class CancellingProvider(StubCourseProvider):
            def await_course_job(self, job_id, on_event=None):
                self.await_calls += 1
                cancel(None)
                # The real provider calls this for every event; the handler is
                # what notices the cancellation and aborts the wait.
                on_event(JobEvent(status="running", progress=20, stage="Writing lessons"))
                raise AssertionError("the wait should have been aborted")

        provider = CancellingProvider()
        with patch("ai_courses.services.get_course_provider", return_value=provider):
            services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.CANCELLED)
        self.assertIsNone(job.course)

    def test_the_services_job_id_is_recorded_on_the_row(self):
        job = self._create_job()
        self._run_provider(job, StubCourseProvider())

        job.refresh_from_db()
        self.assertEqual(job.external_job_id, "svc-job-1")

    def test_the_model_the_service_used_is_recorded_when_it_reports_one(self):
        job = self._create_job()
        self._run_provider(job, StubCourseProvider(job_body=_job_body(model="truetrek-course-v2")))

        job.refresh_from_db()
        self.assertEqual(job.model_name, "truetrek-course-v2")

    # -- results ------------------------------------------------------------

    def _run_provider(self, job, provider):
        with patch("ai_courses.services.get_course_provider", return_value=provider):
            with patch("ai_courses.services.time.sleep"):
                services._run_generation(job.id)

    def test_successful_generation_links_course_and_sets_succeeded(self):
        job = self._create_job()
        self._run_provider(job, StubCourseProvider())

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.SUCCEEDED)
        self.assertIsNotNone(job.course)
        self.assertEqual(job.warnings, [])
        self.assertEqual(job.progress_percent, 100)
        self.assertEqual(job.course.modules.count(), 1)
        self.assertEqual(job.course.modules.first().lessons.count(), 1)

    def test_the_raw_job_body_is_kept_for_debugging(self):
        job = self._create_job()
        self._run_provider(job, StubCourseProvider())

        job.refresh_from_db()
        self.assertEqual(json.loads(job.raw_response)["job_id"], "svc-job-1")

    def test_generation_with_dropped_content_sets_partial(self):
        job = self._create_job(include_quizzes=True)
        body = _job_body(
            modules=[
                {
                    "title": "M1",
                    "lessons": [{"title": "L1", "content": "content"}],
                    "quiz": {"questions": [{"question": "Q", "type": "mcq", "options": []}]},
                }
            ]
        )
        self._run_provider(job, StubCourseProvider(job_body=body))

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.PARTIAL)
        self.assertTrue(job.warnings)

    def test_a_result_with_no_course_structure_fails_with_no_course(self):
        job = self._create_job()
        self._run_provider(job, StubCourseProvider(job_body={"job_id": "x", "status": "completed"}))

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIsNone(job.course)
        # Reached validation (progress=70) before failing there — progress_percent
        # must reflect how far it actually got, not silently stay at 0.
        self.assertEqual(job.progress_percent, 70)

    def test_provider_error_while_waiting_fails_with_honest_message(self):
        job = self._create_job()
        self._run_provider(
            job,
            StubCourseProvider(await_error=ProviderError("the service ran out of context")),
        )

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("the service ran out of context", job.error_message)
        self.assertIsNone(job.course)

    def test_an_unreachable_service_while_waiting_fails_cleanly(self):
        # Reaching here no longer means "the generation was slow" — the wait has
        # no deadline — so the message must not tell the admin it timed out.
        job = self._create_job()
        self._run_provider(
            job,
            StubCourseProvider(
                await_error=ProviderTransportError("connection reset by peer")
            ),
        )

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("could not be reached", job.error_message)
        self.assertIn("connection reset by peer", job.error_message)
        self.assertNotIn("did not finish", job.error_message)
        self.assertIsNone(job.course)

    def test_get_course_provider_raising_directly_is_caught_cleanly(self):
        # get_course_provider() runs outside the try/except around the actual
        # service calls — a ProviderError raised at that point (an unconfigured
        # empty AI_COURSE_SERVICE_URL, say) must still produce a clean FAILED job with no
        # course, not bubble up uncaught.
        job = self._create_job()
        with patch(
            "ai_courses.services.get_course_provider",
            side_effect=ProviderError("AI_COURSE_SERVICE_URL is not configured."),
        ):
            services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("AI_COURSE_SERVICE_URL", job.error_message)
        self.assertIsNone(job.course)

    @override_settings(AI_COURSE_SERVICE_URL="")
    def test_an_empty_service_url_fails_the_job_rather_than_the_thread(self):
        # The real wiring, not a patched provider: an empty URL must surface as
        # an admin-readable failure on the row, not an opaque thread crash.
        job = self._create_job()
        services._run_generation(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("AI_COURSE_SERVICE_URL", job.error_message)

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
        with patch("ai_courses.services.get_course_provider", side_effect=RuntimeError("kaboom")):
            with patch.object(services.connection, "close"):
                services._run_generation_safe(job.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationStatus.FAILED)
        self.assertIn("RuntimeError", job.error_message)
        self.assertIn("kaboom", job.error_message)
        self.assertIsNone(job.course)


class FailureMessageTests(TestCase):
    def test_humanize_seconds_formats_quota_reset_hints(self):
        self.assertEqual(services._humanize_seconds(45), "45s")
        self.assertEqual(services._humanize_seconds(90), "1m")
        self.assertEqual(services._humanize_seconds(49225), "13h 40m")
        self.assertIsNone(services._humanize_seconds(0))
        self.assertIsNone(services._humanize_seconds(None))

    def test_quota_failure_message_is_readable_and_names_the_reset_time(self):
        message = services._failure_message(
            ProviderQuotaError("quota exceeded", retry_after_seconds=49225)
        )
        self.assertIn("quota is used up", message)
        self.assertIn("13h 40m", message)

    def test_transport_failure_message_blames_the_service_not_the_form(self):
        message = services._failure_message(ProviderTransportError("read timed out"))
        self.assertIn("not with your course settings", message)
        self.assertIn("read timed out", message)

    def test_a_job_that_broke_mid_generation_does_not_blame_the_form(self):
        # The real failure seen against the live service: it accepted the course,
        # then its planner crashed. Telling the admin their request was "rejected"
        # would send them editing a form that was never the problem.
        message = services._failure_message(
            ProviderJobFailedError('PlannerAgent: time: missing unit in duration "-1"')
        )
        self.assertIn("accepted this course but failed while generating it", message)
        self.assertIn("PlannerAgent", message)
        self.assertNotIn("rejected", message)

    def test_rejection_message_points_at_the_service_not_the_form(self):
        message = services._failure_message(ProviderError("404 not found"))
        self.assertIn("the service", message)
        self.assertIn("404 not found", message)
