"""Transport tests for the self-hosted course-generation service.

No network and no DB: a fake session stands in for `requests`, so these pin the
submit/follow/read contract itself — including the behaviour that matters most
in production, which is that losing the SSE stream falls back to polling instead
of failing a generation the service is still running.
"""

from unittest.mock import patch

import requests
from django.test import SimpleTestCase, override_settings

from ai_courses.providers.base import (
    ProviderError,
    ProviderJobFailedError,
    ProviderTransportError,
)
from ai_courses.providers.custom_llm import (
    BODY_LOG_MAX_CHARS,
    MAX_CONSECUTIVE_POLL_ERRORS,
    POLL_BACKOFF_AFTER_SECONDS,
    CustomLLMProvider,
    classify_status,
    iter_sse_events,
    job_event_from_payload,
    unwrap_job,
)

BASE_URL = "https://llm.example.test"


class FakeResponse:
    def __init__(
        self, status_code=200, json_body=None, text="", lines=None, raise_on_iter=None, headers=None
    ):
        self.status_code = status_code
        self._json_body = json_body
        self.text = text
        # A real requests.Response always has these; the transport logs read them.
        self.headers = headers or {}
        self._lines = lines or []
        self._raise_on_iter = raise_on_iter

    def json(self):
        if self._json_body is None:
            raise ValueError("no json")
        return self._json_body

    def iter_lines(self, decode_unicode=False):
        for line in self._lines:
            yield line
        if self._raise_on_iter:
            raise self._raise_on_iter

    def __enter__(self):
        return self

    def __exit__(self, *exc_info):
        return False


class FakeSession:
    """Returns queued responses in order; a queued exception is raised instead."""

    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append((method, url, kwargs))
        if not self.responses:
            raise AssertionError(f"unexpected extra request: {method} {url}")
        nxt = self.responses.pop(0)
        if isinstance(nxt, Exception):
            raise nxt
        return nxt


def _provider(responses, **overrides):
    options = {
        "base_url": BASE_URL,
        "poll_interval": 0,
        "max_poll_interval": 0,
        "session": FakeSession(responses),
    }
    options.update(overrides)
    return CustomLLMProvider(**options)


def _sse(*payloads):
    """Renders payload dicts as an event stream body, split into lines the way
    requests' iter_lines would hand them over (bytes, no trailing newline)."""
    lines = []
    for event_name, data in payloads:
        lines.append(f"event: {event_name}".encode())
        lines.append(f"data: {data}".encode())
        lines.append(b"")
    return lines


class ConfigurationTests(SimpleTestCase):
    def test_an_empty_service_url_is_a_clear_configuration_error(self):
        with self.assertRaises(ProviderError) as ctx:
            CustomLLMProvider(base_url="")
        self.assertIn("AI_COURSE_SERVICE_URL", str(ctx.exception))

    @override_settings(AI_COURSE_SERVICE_URL="https://configured.example.test")
    def test_it_defaults_to_the_configured_service_with_no_arguments(self):
        # Call sites construct this with no arguments — nothing to pass, nothing
        # to configure.
        self.assertEqual(CustomLLMProvider().base_url, "https://configured.example.test")

    def test_no_credentials_are_ever_sent(self):
        # The service is unauthenticated; there is no key to leak and no header
        # to get wrong.
        self.assertEqual(_provider([])._headers(), {"Accept": "application/json"})
        self.assertEqual(
            _provider([])._headers(accept="text/event-stream"),
            {"Accept": "text/event-stream"},
        )

    def test_the_prompt_api_methods_are_refused_rather_than_silently_wrong(self):
        provider = _provider([])
        with self.assertRaises(ProviderError):
            provider.generate_course("prompt", {}, 10)
        with self.assertRaises(ProviderError):
            provider.generate_text("prompt", "system", 10)


class SubmitTests(SimpleTestCase):
    def test_submit_posts_the_payload_and_returns_the_job_id(self):
        provider = _provider([FakeResponse(json_body={"job_id": "abc123"})])
        job_id = provider.submit_course_job({"title": "T"})

        self.assertEqual(job_id, "abc123")
        method, url, kwargs = provider.session.calls[0]
        self.assertEqual(method, "POST")
        self.assertEqual(url, f"{BASE_URL}/api/v1/generate/admin/course")
        self.assertEqual(kwargs["json"], {"title": "T"})

    def test_a_job_id_nested_in_an_envelope_is_still_found(self):
        provider = _provider([FakeResponse(json_body={"data": {"id": 42}})])
        self.assertEqual(provider.submit_course_job({}), "42")

    def test_a_response_without_a_job_id_is_a_permanent_error(self):
        provider = _provider([FakeResponse(json_body={"ok": True})])
        with self.assertRaises(ProviderError):
            provider.submit_course_job({})

    def test_a_5xx_is_a_transport_error_so_the_caller_retries(self):
        provider = _provider([FakeResponse(status_code=503, text="overloaded")])
        with self.assertRaises(ProviderTransportError):
            provider.submit_course_job({})

    def test_a_4xx_is_a_permanent_error_carrying_the_services_reason(self):
        provider = _provider(
            [FakeResponse(status_code=422, json_body={"detail": "num_modules must be >= 1"})]
        )
        with self.assertRaises(ProviderError) as ctx:
            provider.submit_course_job({})
        self.assertIn("num_modules must be >= 1", str(ctx.exception))

    def test_a_fastapi_validation_error_names_the_offending_field(self):
        # The real 422 body the service returns. Rendered raw this is a wall of
        # JSON in the admin's error panel; it has to say which field to fix.
        provider = _provider(
            [
                FakeResponse(
                    status_code=422,
                    json_body={
                        "detail": [
                            {
                                "type": "string_too_short",
                                "loc": ["body", "title"],
                                "msg": "String should have at least 3 characters",
                                "input": "X",
                                "ctx": {"min_length": 3},
                            }
                        ]
                    },
                )
            ]
        )

        with self.assertRaises(ProviderError) as ctx:
            provider.submit_course_job({})
        message = str(ctx.exception)
        self.assertIn("title: String should have at least 3 characters", message)
        self.assertNotIn("string_too_short", message)

    def test_several_validation_errors_are_joined(self):
        provider = _provider(
            [
                FakeResponse(
                    status_code=422,
                    json_body={
                        "detail": [
                            {"loc": ["body", "title"], "msg": "too short"},
                            {"loc": ["body", "num_modules"], "msg": "must be >= 1"},
                        ]
                    },
                )
            ]
        )

        with self.assertRaises(ProviderError) as ctx:
            provider.submit_course_job({})
        self.assertIn("title: too short; num_modules: must be >= 1", str(ctx.exception))

    def test_a_connection_failure_is_a_transport_error(self):
        provider = _provider([requests.ConnectionError("refused")])
        with self.assertRaises(ProviderTransportError):
            provider.submit_course_job({})


class SseParsingTests(SimpleTestCase):
    def test_events_are_split_on_blank_lines(self):
        lines = [b"event: progress", b'data: {"a": 1}', b"", b"event: done", b'data: {"b": 2}', b""]
        self.assertEqual(
            list(iter_sse_events(lines)),
            [("progress", '{"a": 1}'), ("done", '{"b": 2}')],
        )

    def test_comments_are_ignored_and_multiline_data_is_joined(self):
        lines = [b": keepalive", b"data: one", b"data: two", b""]
        self.assertEqual(list(iter_sse_events(lines)), [("", "one\ntwo")])

    def test_a_trailing_event_without_a_blank_line_is_still_yielded(self):
        self.assertEqual(list(iter_sse_events([b"data: last"])), [("", "last")])

    def test_carriage_returns_and_unnamed_events_are_handled(self):
        self.assertEqual(list(iter_sse_events([b"data: x\r", b"\r"])), [("", "x")])

    def test_status_vocabulary_covers_the_usual_spellings(self):
        # job_started/job_failed/progress are the event_type values the live
        # service actually emits.
        self.assertIsNone(classify_status("job_started"))
        self.assertIsNone(classify_status("progress"))
        self.assertEqual(classify_status("job_failed"), "failed")
        self.assertEqual(classify_status("job_completed"), "succeeded")

        for value in ("completed", "SUCCESS", "job.completed", "generation_done", "finished"):
            self.assertEqual(classify_status(value), "succeeded", value)
        for value in ("failed", "ERROR", "job.failed"):
            self.assertEqual(classify_status(value), "failed", value)
        for value in ("cancelled", "canceled", "aborted"):
            self.assertEqual(classify_status(value), "cancelled", value)
        for value in ("running", "queued", "", None):
            self.assertIsNone(classify_status(value), value)

    def test_progress_accepts_both_percentages_and_fractions(self):
        self.assertEqual(job_event_from_payload({"progress": 42}).progress, 42)
        self.assertEqual(job_event_from_payload({"progress": 0.5}).progress, 50)
        self.assertEqual(job_event_from_payload({"progress": 0}).progress, 0)
        self.assertIsNone(job_event_from_payload({"progress": None}).progress)

    def test_the_step_label_prefers_stage_then_detail_then_status(self):
        self.assertEqual(job_event_from_payload({"stage": "S", "detail": "D"}).label, "S")
        self.assertEqual(job_event_from_payload({"detail": "D"}).label, "D")
        # The status fallback is the one machine-readable value an admin sees,
        # so it is tidied into a step label rather than shown as "in_progress".
        self.assertEqual(job_event_from_payload({"status": "running"}).label, "Running")
        self.assertEqual(job_event_from_payload({"status": "in_progress"}).label, "In progress")
        self.assertEqual(job_event_from_payload({}).label, "")


def _enveloped(job_record):
    """The live service's actual response shape for GET /api/v1/jobs/<id>."""
    return {
        "status": "success",
        "message": f"Job '{job_record.get('job_id', 'j1')}' record retrieved successfully.",
        "data": job_record,
    }


class EnvelopeTests(SimpleTestCase):
    """The job endpoint returns {status, message, data} — the same envelope this
    LMS uses. The outer "status" means "the record was retrieved", NOT how the
    generation went, and confusing the two silently turns every failed job into
    a succeeded one."""

    def test_the_envelope_is_unwrapped_to_the_job_record(self):
        record = {"job_id": "j1", "status": "failed", "result": None, "error": "boom"}
        self.assertEqual(unwrap_job(_enveloped(record)), record)

    def test_an_already_unwrapped_record_is_left_alone(self):
        record = {"job_id": "j1", "status": "completed", "result": {"modules": []}}
        self.assertEqual(unwrap_job(record), record)

    def test_a_payload_whose_data_is_not_a_job_is_left_alone(self):
        body = {"status": "success", "data": {"something": "else"}}
        self.assertEqual(unwrap_job(body), body)

    def test_a_failed_job_inside_a_success_envelope_is_reported_as_failed(self):
        # The exact body a real failed generation returned. Without unwrapping,
        # the envelope's "success" wins and the admin is told the response had
        # no modules instead of why the service actually gave up.
        record = {
            "job_id": "j1",
            "status": "failed",
            "progress": 0,
            "stage": "in_progress",
            "detail": 'PlannerAgent: time: missing unit in duration "-1" (status code: 400)',
            "result": None,
            "error": 'PlannerAgent: time: missing unit in duration "-1" (status code: 400)',
        }
        provider = _provider(
            [
                FakeResponse(lines=_sse(("job_failed", '{"status":"failed","stage":"in_progress"}'))),
                FakeResponse(json_body=_enveloped(record)),
            ]
        )

        with self.assertRaises(ProviderJobFailedError) as ctx:
            provider.await_course_job("j1")
        self.assertIn("missing unit in duration", str(ctx.exception))

    def test_a_completed_job_inside_the_envelope_returns_the_record(self):
        record = {"job_id": "j1", "status": "completed", "result": {"modules": [{"title": "M1"}]}}
        provider = _provider(
            [
                FakeResponse(lines=_sse(("job_completed", '{"status":"completed"}'))),
                FakeResponse(json_body=_enveloped(record)),
            ]
        )

        job = provider.await_course_job("j1")
        self.assertEqual(job["status"], "completed")
        self.assertEqual(job["result"]["modules"], [{"title": "M1"}])


class FollowJobTests(SimpleTestCase):
    def test_the_stream_is_followed_to_completion_then_the_result_is_read(self):
        stream = FakeResponse(
            lines=_sse(
                ("progress", '{"job_id":"j1","status":"running","progress":10,"stage":"Planning"}'),
                ("progress", '{"job_id":"j1","status":"running","progress":80,"stage":"Writing"}'),
                ("complete", '{"job_id":"j1","status":"completed","progress":100}'),
            )
        )
        result = FakeResponse(json_body={"job_id": "j1", "status": "completed", "result": {"modules": []}})
        provider = _provider([stream, result])

        seen = []
        job = provider.await_course_job("j1", on_event=seen.append)

        self.assertEqual(job["result"], {"modules": []})
        self.assertEqual([event.stage for event in seen if event.stage], ["Planning", "Writing"])
        # The stream, then exactly one read of the job — no polling needed.
        self.assertEqual(len(provider.session.calls), 2)
        self.assertEqual(provider.session.calls[0][1], f"{BASE_URL}/api/v1/jobs/j1/events")
        self.assertEqual(provider.session.calls[1][1], f"{BASE_URL}/api/v1/jobs/j1")

    def test_an_unavailable_stream_falls_back_to_polling(self):
        # The case this fallback exists for: the stream is gone, but the job is
        # perfectly healthy and must not be failed because of it.
        provider = _provider(
            [
                FakeResponse(status_code=404, text="no such stream"),
                FakeResponse(json_body={"status": "running", "progress": 30}),
                FakeResponse(json_body={"status": "completed", "progress": 100}),
                FakeResponse(json_body={"status": "completed", "result": {"modules": []}}),
            ]
        )

        seen = []
        job = provider.await_course_job("j1", on_event=seen.append)

        self.assertEqual(job["result"], {"modules": []})
        self.assertEqual([event.progress for event in seen], [30, 100])

    def test_a_stream_that_drops_midway_falls_back_to_polling(self):
        stream = FakeResponse(
            lines=_sse(("progress", '{"status":"running","progress":20}')),
            raise_on_iter=requests.ConnectionError("stream reset"),
        )
        provider = _provider(
            [
                stream,
                FakeResponse(json_body={"status": "completed", "progress": 100}),
                FakeResponse(json_body={"status": "completed", "result": {"modules": []}}),
            ]
        )

        job = provider.await_course_job("j1")
        self.assertEqual(job["result"], {"modules": []})

    def test_a_stream_that_ends_without_a_verdict_falls_back_to_polling(self):
        provider = _provider(
            [
                FakeResponse(lines=_sse(("progress", '{"status":"running","progress":90}'))),
                FakeResponse(json_body={"status": "completed"}),
                FakeResponse(json_body={"status": "completed", "result": {"modules": []}}),
            ]
        )

        job = provider.await_course_job("j1")
        self.assertEqual(job["result"], {"modules": []})

    def test_a_failed_job_raises_with_the_services_own_reason(self):
        provider = _provider(
            [
                FakeResponse(lines=_sse(("error", '{"status":"failed","detail":"out of context"}'))),
                FakeResponse(json_body={"status": "failed", "error": "out of context"}),
            ]
        )

        with self.assertRaises(ProviderError) as ctx:
            provider.await_course_job("j1")
        self.assertIn("out of context", str(ctx.exception))

    def test_the_job_body_outranks_an_optimistic_completion_event(self):
        # An event can arrive before the service has finished writing its result,
        # so the job body is the authority on the outcome.
        provider = _provider(
            [
                FakeResponse(lines=_sse(("complete", '{"status":"completed"}'))),
                FakeResponse(json_body={"status": "failed", "message": "writer crashed"}),
            ]
        )

        with self.assertRaises(ProviderError) as ctx:
            provider.await_course_job("j1")
        self.assertIn("writer crashed", str(ctx.exception))

    def test_a_cancellation_raised_by_the_handler_is_not_swallowed(self):
        # This is how an admin's Cancel aborts the wait — services' progress
        # handler raises, and nothing in the provider may catch it.
        class Cancelled(Exception):
            pass

        def handler(_event):
            raise Cancelled

        provider = _provider([FakeResponse(lines=_sse(("progress", '{"status":"running"}')))])

        with self.assertRaises(Cancelled):
            provider.await_course_job("j1", on_event=handler)

    def test_polling_gives_up_only_after_a_sustained_outage(self):
        # The one thing that still ends the wait without a verdict. It takes
        # MAX_CONSECUTIVE_POLL_ERRORS tries — a couple of failed polls must not
        # kill a generation the service is still running.
        provider = _provider(
            [FakeResponse(status_code=404)]
            + [requests.ConnectionError("down")] * MAX_CONSECUTIVE_POLL_ERRORS
        )

        with patch("ai_courses.providers.custom_llm.time.sleep"):
            with self.assertRaises(ProviderTransportError):
                provider.await_course_job("j1")

    def test_a_poll_outage_that_recovers_does_not_fail_the_generation(self):
        provider = _provider(
            [FakeResponse(status_code=404)]
            + [requests.ConnectionError("down")] * (MAX_CONSECUTIVE_POLL_ERRORS - 1)
            + [
                FakeResponse(json_body={"status": "completed"}),
                FakeResponse(json_body={"status": "completed", "result": {"modules": []}}),
            ]
        )

        with patch("ai_courses.providers.custom_llm.time.sleep"):
            job = provider.await_course_job("j1")
        self.assertEqual(job["result"], {"modules": []})

    def test_a_slow_job_is_never_abandoned_for_taking_too_long(self):
        # There is no whole-job deadline: a generation the service is still
        # working on is waited on, however many polls that takes. The old
        # behaviour failed it at 900s and told the admin the service "did not
        # finish in time" while the service went on to finish the course.
        running = [FakeResponse(json_body={"status": "running", "progress": 40})] * 200
        provider = _provider(
            [FakeResponse(status_code=404)]
            + running
            + [
                FakeResponse(json_body={"status": "completed"}),
                FakeResponse(json_body={"status": "completed", "result": {"modules": []}}),
            ]
        )

        with patch("ai_courses.providers.custom_llm.time.sleep"):
            job = provider.await_course_job("j1")
        self.assertEqual(job["result"], {"modules": []})

    def test_a_poll_outage_still_reports_to_the_handler(self):
        # on_event is what keeps the job row's heartbeat fresh and what notices a
        # cancellation, so it has to be called while the service is unreachable
        # too — otherwise the stale-job reaper fails a job this loop is still
        # waiting on, and Cancel does nothing until the service comes back.
        events = []
        provider = _provider(
            [FakeResponse(status_code=404)]
            + [requests.ConnectionError("down")] * 3
            + [
                FakeResponse(json_body={"status": "completed"}),
                FakeResponse(json_body={"status": "completed", "result": {"modules": []}}),
            ]
        )

        with patch("ai_courses.providers.custom_llm.time.sleep"):
            provider.await_course_job("j1", on_event=events.append)

        self.assertEqual(len(events), 4)
        self.assertTrue(all(event.label == "" for event in events[:3]))
        self.assertIsNone(events[0].outcome)

    def test_the_raw_stream_is_logged_verbatim(self):
        # The stream is parsed and thrown away, so this log is the only record of
        # what the service actually sent. It has to be the raw line, not our
        # interpretation of it — that is the whole point when a job goes wrong.
        payload = '{"status":"running","progress":5,"stage":"starting","detail":"Pipeline starting"}'
        provider = _provider(
            [
                FakeResponse(lines=_sse(("job_started", payload), ("complete", '{"status":"completed"}'))),
                FakeResponse(json_body={"status": "completed", "result": {"modules": []}}),
            ]
        )

        with self.assertLogs("ai_courses", level="INFO") as captured:
            provider.await_course_job("j1")

        logged = "\n".join(captured.output)
        self.assertIn("SSE j1 | event: job_started", logged)
        self.assertIn(f"SSE j1 | data: {payload}", logged)
        # The keep-alive comment lines too: a silent job that is still connected
        # looks exactly like a hung one without them.
        self.assertIn("AI service <- stream 200", logged)

    def test_requests_and_response_bodies_are_logged(self):
        provider = _provider([FakeResponse(json_body={"job_id": "j9"}, text='{"job_id": "j9"}')])

        with self.assertLogs("ai_courses", level="INFO") as captured:
            provider.submit_course_job({"title": "Probe"})

        logged = "\n".join(captured.output)
        self.assertIn("AI service -> POST", logged)
        self.assertIn('"title": "Probe"', logged)
        self.assertIn('AI service <- POST', logged)
        self.assertIn('{"job_id": "j9"}', logged)

    def test_an_oversized_body_is_marked_as_truncated_not_silently_cut(self):
        huge = "x" * (BODY_LOG_MAX_CHARS + 500)
        provider = _provider([FakeResponse(json_body={"job_id": "j9"}, text=huge)])

        with self.assertLogs("ai_courses", level="INFO") as captured:
            provider.submit_course_job({"title": "Probe"})

        self.assertIn("[+500 more chars]", "\n".join(captured.output))

    def test_polling_eases_off_once_a_job_is_clearly_a_long_one(self):
        provider = _provider([], poll_interval=3, max_poll_interval=15)
        self.assertEqual(provider._poll_interval_for(0), 3)
        self.assertEqual(provider._poll_interval_for(POLL_BACKOFF_AFTER_SECONDS - 1), 3)
        self.assertEqual(provider._poll_interval_for(POLL_BACKOFF_AFTER_SECONDS), 15)
