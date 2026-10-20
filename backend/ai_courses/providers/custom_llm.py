"""Transport for the self-hosted course-generation LLM service.

Unlike Gemini, this service is not a single blocking call: it is a job API.

    POST /api/v1/generate/admin/course   -> {"job_id": ...}
    GET  /api/v1/jobs/<job_id>/events    -> SSE progress stream
    GET  /api/v1/jobs/<job_id>           -> the finished course structure

So it cannot implement AIProvider.generate_course(prompt, response_schema, ...):
there is no prompt and no response schema to send, and the call does not return
content. It implements the three steps above instead, and ai_courses/services.py
drives them — submit, follow, read — while keeping its own AICourseGeneration row
as the thing the admin wizard polls. The service's job id is stored on that row
(`external_job_id`) purely for debugging; it never reaches the browser.

This module is transport only. Nothing here knows what a module or a lesson is —
request/response field mapping lives in ai_courses/custom_llm_mapping.py, so this
file can be tested with a fake session and no network.

Progress is read from SSE because the stream carries stage labels worth showing
the admin. The stream is an optimisation, never a requirement: any stream failure
(unreachable, 404, a mid-generation disconnect, a silence longer than
`stream_read_timeout`) falls back to polling the job endpoint, because dropping a
connection must not fail a generation the service is still happily running.
"""

import json
import logging
import time
from dataclasses import dataclass, field

import requests
from django.conf import settings

from .base import AIProvider, ProviderError, ProviderJobFailedError, ProviderTransportError

logger = logging.getLogger("ai_courses")

GENERATE_PATH = "/api/v1/generate/admin/course"
JOB_PATH = "/api/v1/jobs/{job_id}"
JOB_EVENTS_PATH = "/api/v1/jobs/{job_id}/events"

# Status vocabularies. The service reports `status` on both the SSE payloads and
# the job body, and `event_type` on the SSE envelope; all of them are matched
# against these so a rename on one of the two surfaces alone can't strand a job
# in RUNNING forever.
SUCCESS_STATUSES = {
    "completed", "complete", "succeeded", "success", "successful", "done", "finished", "ready",
}
FAILURE_STATUSES = {"failed", "failure", "error", "errored", "fatal"}
CANCELLED_STATUSES = {"cancelled", "canceled", "aborted", "stopped", "terminated"}

# A poll that keeps failing is a real outage, not a blip. This is the *only*
# thing that ends the wait without a verdict from the service, so it is sized
# generously: MAX_CONSECUTIVE_POLL_ERRORS tries POLL_ERROR_RETRY_SECONDS apart
# is roughly five minutes of the job endpoint being unreachable before we accept
# that the generation is gone. A reverse-proxy restart or a brief network blip
# must never fail a generation the service is still happily running.
MAX_CONSECUTIVE_POLL_ERRORS = 20
POLL_ERROR_RETRY_SECONDS = 15

# Tuning. These are constants rather than settings because the service is ours:
# there is nothing an operator has to decide per environment, and a value that
# ever needs changing should change for everyone, here, with its reason beside it.
#
# CONNECT/REQUEST bound the two short calls (submit, read the result). They are
# NOT a budget for the generation itself — it has none; see await_course_job.
CONNECT_TIMEOUT_SECONDS = 15
REQUEST_TIMEOUT_SECONDS = 60
# How long the SSE stream may go silent before we stop trusting it and switch to
# polling. Kept well under settings.AI_STALE_JOB_THRESHOLD_SECONDS so a quiet
# stream can never let a job's heartbeat go stale enough for reap_stale_jobs()
# to kill a generation that is still running.
STREAM_READ_TIMEOUT_SECONDS = 60
POLL_INTERVAL_SECONDS = 3
# There is deliberately no whole-generation budget. A full course is a far longer
# job than a single chat completion and the service is free to take as long as it
# needs; abandoning a job that is still running loses work nobody can get back —
# the admin is told it failed while the service goes on to finish a course they
# will never see. See await_course_job.
#
# What that costs is poll volume, so a job that is clearly a long one is polled
# less often: POLL_INTERVAL_SECONDS for the first POLL_BACKOFF_AFTER_SECONDS,
# then POLL_MAX_INTERVAL_SECONDS. Both stay an order of magnitude below
# settings.AI_STALE_JOB_THRESHOLD_SECONDS, because a poll is also what refreshes
# the job row's heartbeat (see services._progress_handler).
POLL_BACKOFF_AFTER_SECONDS = 120
POLL_MAX_INTERVAL_SECONDS = 15
# Raw transport logging. Every request, every response body and every line of the
# progress stream goes to the `ai_courses` logger at INFO, verbatim, so a
# generation can be followed in the terminal while it runs (`tail -f` the Django
# output). This is not debug scaffolding to remove later: the SSE stream is
# consumed and discarded as it is parsed, and the job row keeps only the latest
# step, so without this there is no record anywhere of what the service actually
# said — which is exactly what you need when a generation stalls or fails.
#
# The caps exist only to stop one pathological body (a finished course is tens of
# KB of JSON) from flooding the log; everything shorter is logged whole.
STREAM_LOG_LINE_MAX_CHARS = 2000
BODY_LOG_MAX_CHARS = 4000

# Sent as `rag_enabled` on every request. Off by default: turning it on changes
# what the service retrieves, so it is a deliberate switch rather than something
# this integration decides on the service's behalf.
RAG_ENABLED = False


def classify_status(value):
    """Maps one of the service's status/event_type strings onto a terminal
    outcome, or None when the job is still running.

    Tolerates the common envelope spellings for the same thing — "job.completed",
    "JOB_FAILED", "generation-complete" all classify the same way — because this
    is the single decision that ends the wait loop."""

    key = str(value or "").strip().lower().replace("-", "_")
    if not key:
        return None
    # "job.completed" / "generation.failed" -> "completed" / "failed"
    key = key.rsplit(".", 1)[-1]
    for prefix in ("job_", "generation_", "course_"):
        if key.startswith(prefix):
            key = key[len(prefix):]
    if key in SUCCESS_STATUSES:
        return "succeeded"
    if key in FAILURE_STATUSES:
        return "failed"
    if key in CANCELLED_STATUSES:
        return "cancelled"
    return None


def _truncate(text, limit=BODY_LOG_MAX_CHARS):
    """The body as it came back, with a visible marker when it was too long to
    log whole — never a silent cut, which would read as a malformed response."""
    text = "" if text is None else str(text)
    if len(text) <= limit:
        return text
    return f"{text[:limit]}... [+{len(text) - limit} more chars]"


def _log_stream_lines(lines, job_id):
    """Passes the stream through untouched, logging each line exactly as it
    arrived on the way past — including the SSE comment keep-alives (`: ping`),
    because those are the proof that a silent job is still connected rather than
    hung."""
    for raw_line in lines:
        if isinstance(raw_line, bytes):
            text = raw_line.decode("utf-8", errors="replace")
        else:
            text = "" if raw_line is None else str(raw_line)
        logger.info("SSE %s | %s", job_id, _truncate(text, STREAM_LOG_LINE_MAX_CHARS))
        yield raw_line


def _first_present(payload, keys):
    """First key that is actually present with a non-None value — not `or`
    chaining, which would skip a legitimate 0 progress or an empty-string stage."""
    for key in keys:
        if isinstance(payload, dict) and payload.get(key) is not None:
            return payload[key]
    return None


def _as_progress(value):
    """Returns a 0-100 float, or None when the service sent nothing usable.
    Accepts a 0-1 fraction as well, since both conventions are common."""
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number < 0:
        return None
    if number <= 1:
        # Ambiguous only at exactly 1.0, where "1%" and "100%" differ by a label
        # the admin sees for a moment — never by whether the job completes.
        number *= 100
    return min(number, 100.0)


def _as_text(value):
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def _humanize_label(value):
    """"in_progress" -> "In progress", "starting" -> "Starting".

    The service's stage and status vocabularies are machine-readable — matched
    that way everywhere else in this module — but the stage is also the line the
    admin reads as the current step, so it is tidied on the way out. Verified
    against the live service, which sends stage "starting" alongside detail
    "Pipeline starting"."""
    text = _as_text(value).replace("_", " ").replace("-", " ").strip()
    return text[:1].upper() + text[1:] if text else ""


@dataclass
class JobEvent:
    """One progress update, from either an SSE payload or a polled job body —
    the two carry the same fields, so services.py handles only this one shape."""

    outcome: str | None = None  # "succeeded" | "failed" | "cancelled" | None
    status: str = ""
    progress: float | None = None
    stage: str = ""
    detail: str = ""
    event_type: str = ""
    raw: dict = field(default_factory=dict)

    @property
    def label(self):
        """What the admin reads as the current step. Prefers the coarse stage over
        the chattier detail, and falls back to the status so the step line is
        never blank. Both are tidied: raw, these put "starting" or "in_progress"
        in front of the admin as the name of a step.

        `detail` is not folded in here — it is the service's fuller sentence for
        the same moment ("Pipeline starting" against stage "starting") and is
        carried separately on this event so the UI can show it as a second line
        rather than lose one of the two."""
        return _humanize_label(self.stage) or self.detail or _humanize_label(self.status)


def job_event_from_payload(payload, event_name=""):
    if not isinstance(payload, dict):
        return JobEvent(event_type=event_name, raw={})

    status = _as_text(_first_present(payload, ("status", "state", "job_status")))
    event_type = _as_text(_first_present(payload, ("event_type", "event", "type"))) or event_name
    return JobEvent(
        outcome=classify_status(status) or classify_status(event_type),
        status=status,
        progress=_as_progress(
            _first_present(payload, ("progress", "progress_percent", "percent", "percentage"))
        ),
        stage=_as_text(_first_present(payload, ("stage", "step", "phase"))),
        detail=_as_text(_first_present(payload, ("detail", "message", "description"))),
        event_type=event_type,
        raw=payload,
    )


def iter_sse_events(lines):
    """Parses a text/event-stream body into (event_name, data_text) pairs.

    Implements only what the spec needs here: `event:`/`data:` fields, multi-line
    data joined with newlines, a blank line as the dispatch boundary, and `:`
    comment lines (the usual keepalive) ignored. `id:`/`retry:` are accepted and
    discarded — this integration never reconnects mid-stream, it falls back to
    polling instead, so there is nothing for a Last-Event-ID to resume."""

    event_name = ""
    data_lines = []

    for raw_line in lines:
        if raw_line is None:
            continue
        if isinstance(raw_line, bytes):
            line = raw_line.decode("utf-8", errors="replace")
        else:
            line = raw_line
        line = line.rstrip("\r")

        if line == "":
            if data_lines:
                yield event_name, "\n".join(data_lines)
            event_name, data_lines = "", []
            continue

        if line.startswith(":"):
            continue

        field_name, _, value = line.partition(":")
        if value.startswith(" "):
            value = value[1:]

        if field_name == "event":
            event_name = value
        elif field_name == "data":
            data_lines.append(value)

    if data_lines:
        yield event_name, "\n".join(data_lines)


# The job endpoint wraps its record in the same {status, message, data} envelope
# this LMS uses for its own API. These are the keys that identify the inner
# record as the job itself rather than some other payload that happens to sit
# under "data".
_JOB_RECORD_KEYS = ("job_id", "stage", "result", "events", "progress")


def unwrap_job(body):
    """Returns the job record itself, unwrapping the service's response envelope.

    This matters far more than it looks. The envelope's own "status" is
    "success" — meaning "the record was retrieved" — while the job's status
    sits inside at data.status and may well be "failed". Reading the outer one
    classifies every fetched job as succeeded, which turns a failed generation
    into a confusing "no modules" error instead of the service's actual reason.
    """

    if not isinstance(body, dict):
        return body

    inner = body.get("data")
    if not isinstance(inner, dict):
        return body

    # Only unwrap when the outer layer really is an envelope and the inner layer
    # really is a job, so a service that one day returns the record unwrapped
    # keeps working.
    looks_like_envelope = "status" in body or "message" in body
    looks_like_job = any(key in inner for key in _JOB_RECORD_KEYS)
    return inner if looks_like_envelope and looks_like_job else body


def _format_validation_errors(entries):
    """FastAPI reports a 422 as a *list* under `detail`:

        [{"loc": ["body", "title"], "msg": "String should have at least 3 characters", ...}]

    Rendered raw that is a wall of JSON in the admin's error panel. This turns it
    into "title: String should have at least 3 characters", which actually tells
    them which field to fix."""

    messages = []
    for entry in entries:
        if isinstance(entry, str):
            messages.append(entry.strip())
            continue
        if not isinstance(entry, dict):
            continue
        message = str(entry.get("msg") or entry.get("message") or "").strip()
        if not message:
            continue
        # Drop the leading "body"/"query" segment — the admin filled in a form,
        # not an HTTP body.
        location = [
            str(part) for part in (entry.get("loc") or []) if str(part) not in ("body", "query", "path")
        ]
        messages.append(f"{'.'.join(location)}: {message}" if location else message)
    return "; ".join(filter(None, messages))[:300]


def _describe_error(response):
    """The service's own reason for a 4xx, in one short line fit to put in front
    of an admin — never a raw HTML error page or a whole JSON dump."""
    try:
        body = response.json()
    except ValueError:
        body = None

    if isinstance(body, dict):
        for key in ("detail", "message", "error", "reason", "error_message"):
            value = body.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()[:300]
            if isinstance(value, list):
                formatted = _format_validation_errors(value)
                if formatted:
                    return formatted
            if isinstance(value, dict):
                nested = value.get("message") or value.get("detail")
                if isinstance(nested, str) and nested.strip():
                    return nested.strip()[:300]

    text = (response.text or "").strip()
    return text[:200] if text else "no details given"


class CustomLLMProvider(AIProvider):
    """Our own course-generation service. Constructed by
    ai_courses.providers.get_course_provider() with no arguments."""

    def __init__(
        self,
        base_url=None,
        connect_timeout=CONNECT_TIMEOUT_SECONDS,
        request_timeout=REQUEST_TIMEOUT_SECONDS,
        stream_read_timeout=STREAM_READ_TIMEOUT_SECONDS,
        poll_interval=POLL_INTERVAL_SECONDS,
        max_poll_interval=POLL_MAX_INTERVAL_SECONDS,
        session=None,
    ):
        # Defaults to the configured service, so callers construct this with no
        # arguments; the parameters exist for tests and for pointing a one-off
        # script at a different instance.
        base_url = base_url if base_url is not None else settings.AI_COURSE_SERVICE_URL
        if not base_url:
            raise ProviderError(
                "The course-generation service URL is empty. Set "
                "AI_COURSE_SERVICE_DEFAULT_URL in lms_be/settings.py (or the "
                "AI_COURSE_SERVICE_URL env var) — there is no offline/placeholder mode."
            )
        self.base_url = str(base_url).rstrip("/")
        self.connect_timeout = connect_timeout
        self.request_timeout = request_timeout
        self.stream_read_timeout = stream_read_timeout
        self.poll_interval = poll_interval
        self.max_poll_interval = max_poll_interval
        self.session = session or requests

    # -- Not applicable ------------------------------------------------------
    # This service generates a whole course from a structured request; it has no
    # free-prompt endpoint. Anything needing those (advisor chat, AI grading,
    # content suggestions, daily drill) keeps using get_provider() -> Gemini.

    def generate_course(self, prompt, response_schema, timeout, files=None):
        raise ProviderError(
            "The custom course LLM is a job API, not a prompt API — use "
            "submit_course_job()/await_course_job() instead of generate_course()."
        )

    def generate_text(self, prompt, system_instruction, timeout, temperature=0.7):
        raise ProviderError(
            "The custom course LLM does not expose a free-text endpoint. Use "
            "ai_courses.providers.get_provider() for chat/grading/suggestions."
        )

    # -- HTTP plumbing -------------------------------------------------------

    def _url(self, path):
        return f"{self.base_url}{path}"

    def _headers(self, accept="application/json"):
        # The service is unauthenticated — no credentials are sent, and none are
        # configured anywhere. If it ever grows auth, this is the one place that
        # has to learn about it.
        return {"Accept": accept}

    def _request(self, method, url, **kwargs):
        body = kwargs.get("json")
        if body is None:
            logger.info("AI service -> %s %s", method, url)
        else:
            logger.info(
                "AI service -> %s %s body=%s",
                method, url, _truncate(json.dumps(body, default=str)),
            )

        try:
            response = self.session.request(method, url, **kwargs)
        except requests.RequestException as exc:
            logger.warning("AI service <- %s %s unreachable: %s", method, url, exc)
            raise ProviderTransportError(f"Could not reach the AI service at {url}: {exc}") from exc

        logger.info(
            "AI service <- %s %s %s body=%s",
            method, url, response.status_code, _truncate(response.text),
        )

        if response.status_code >= 500:
            raise ProviderTransportError(
                f"The AI service returned a server error ({response.status_code})."
            )
        if response.status_code >= 400:
            raise ProviderError(
                f"The AI service rejected the request ({response.status_code}): "
                f"{_describe_error(response)}"
            )
        return response

    @staticmethod
    def _json(response, what):
        try:
            return response.json()
        except ValueError as exc:
            raise ProviderError(f"The AI service's {what} was not valid JSON: {exc}") from exc

    # -- The three steps -----------------------------------------------------

    def submit_course_job(self, payload):
        """POST the generation request. Returns the service's job id.

        Safe for the caller to retry: a transport failure here means the request
        may never have been accepted, and the service hands back a fresh job id
        for every accepted request."""

        response = self._request(
            "POST",
            self._url(GENERATE_PATH),
            json=payload,
            headers={**self._headers(), "Content-Type": "application/json"},
            timeout=(self.connect_timeout, self.request_timeout),
        )
        body = self._json(response, "generation response")
        job_id = _extract_job_id(body)
        if not job_id:
            raise ProviderError(
                "The AI service accepted the request but did not return a job id "
                f"(got: {json.dumps(body)[:300]})."
            )
        return job_id

    def fetch_job(self, job_id):
        """GET the job — its status while running, the full course structure once
        it is finished."""
        response = self._request(
            "GET",
            self._url(JOB_PATH.format(job_id=job_id)),
            headers=self._headers(),
            timeout=(self.connect_timeout, self.request_timeout),
        )
        body = self._json(response, "job response")
        if not isinstance(body, dict):
            raise ProviderError("The AI service's job response was not a JSON object.")
        return unwrap_job(body)

    def stream_job_events(self, job_id, on_event):
        """Follows the SSE stream until the job reaches a terminal state.

        Returns the outcome ("succeeded"/"failed"/"cancelled"), or None if the
        stream ended without one — which is the caller's cue to poll instead.
        Raises ProviderTransportError/ProviderError only for stream-level
        problems; the caller treats both as "fall back to polling".

        A stream that simply goes quiet is not a failed generation: the read
        timeout fires, which lands here as a transport error and sends the
        caller to polling. There is nothing in this loop that gives up on a job
        for taking too long."""

        url = self._url(JOB_EVENTS_PATH.format(job_id=job_id))
        try:
            response = self.session.request(
                "GET",
                url,
                headers={**self._headers(accept="text/event-stream"), "Cache-Control": "no-cache"},
                stream=True,
                timeout=(self.connect_timeout, self.stream_read_timeout),
            )
        except requests.RequestException as exc:
            raise ProviderTransportError(f"Could not open the progress stream: {exc}") from exc

        with response:
            logger.info(
                "AI service <- stream %s %s (content-type %s)",
                response.status_code, url, response.headers.get("Content-Type", "?"),
            )
            if response.status_code >= 400:
                raise ProviderTransportError(
                    f"The progress stream is unavailable ({response.status_code})."
                )

            try:
                lines = _log_stream_lines(response.iter_lines(decode_unicode=False), job_id)
                for event_name, data_text in iter_sse_events(lines):
                    try:
                        payload = json.loads(data_text)
                    except ValueError:
                        # A heartbeat or a non-JSON notice — nothing to report,
                        # but it still proves the job is alive.
                        payload = None

                    event = job_event_from_payload(payload, event_name=event_name)
                    if on_event is not None:
                        on_event(event)
                    if event.outcome:
                        return event.outcome
            except requests.RequestException as exc:
                # Includes the read timeout that fires when the stream goes quiet.
                raise ProviderTransportError(f"The progress stream dropped: {exc}") from exc

        logger.info("SSE %s | stream ended without a verdict — falling back to polling.", job_id)
        return None

    def _poll_interval_for(self, waited_seconds):
        """Eases off once the job is clearly a long one — see
        POLL_BACKOFF_AFTER_SECONDS."""
        if waited_seconds < POLL_BACKOFF_AFTER_SECONDS:
            return self.poll_interval
        return max(self.poll_interval, self.max_poll_interval)

    def poll_until_terminal(self, job_id, on_event):
        """Fallback for when the SSE stream is unusable. Same outcome contract as
        stream_job_events, but it cannot return None — it either reaches a
        terminal state or raises.

        This loop has no deadline. The only thing that ends it without a verdict
        is the job endpoint staying unreachable for MAX_CONSECUTIVE_POLL_ERRORS
        tries in a row, which is an outage rather than a slow job."""

        started = time.monotonic()
        consecutive_errors = 0

        while True:
            try:
                job = self.fetch_job(job_id)
            except ProviderTransportError as exc:
                consecutive_errors += 1
                if consecutive_errors >= MAX_CONSECUTIVE_POLL_ERRORS:
                    raise
                logger.warning(
                    "Polling job %s failed (%s) — attempt %d/%d.",
                    job_id, exc, consecutive_errors, MAX_CONSECUTIVE_POLL_ERRORS,
                )
                # An empty event says exactly what is true: nothing new, still
                # waiting. It matters because on_event is also what refreshes the
                # job row's heartbeat — an outage that wrote nothing for minutes
                # would let the stale-job reaper fail a generation this loop is
                # still waiting on — and it is what lets an admin's Cancel be
                # noticed while the service is unreachable.
                if on_event is not None:
                    on_event(JobEvent())
                time.sleep(POLL_ERROR_RETRY_SECONDS)
                continue

            consecutive_errors = 0
            event = job_event_from_payload(job)
            if on_event is not None:
                on_event(event)
            if event.outcome:
                return event.outcome

            time.sleep(self._poll_interval_for(time.monotonic() - started))

    def await_course_job(self, job_id, on_event=None):
        """Follows `job_id` to completion and returns the finished job body.

        This waits for as long as the service takes — there is no timeout, by
        design. A generation we abandon is work nobody can get back: the service
        carries on and finishes a course the admin is simultaneously being told
        failed, and the retry they are offered starts the whole thing again. The
        wait ends on the service's own verdict, on cancellation (`on_event`
        raises), or on the job endpoint going unreachable for long enough to be a
        real outage (see poll_until_terminal) — never on the clock.

        `on_event(JobEvent)` is called for every progress update, from the stream
        or from a poll; it may raise to abort the wait (that is how an admin's
        Cancel stops this) and anything it raises is left alone."""

        outcome = None

        try:
            outcome = self.stream_job_events(job_id, on_event)
        except (ProviderTransportError, ProviderError) as exc:
            # The stream is only a nicer way to watch; losing it is not losing
            # the generation. Polling picks the same job up where it is.
            logger.warning(
                "Progress stream for job %s unusable (%s) — falling back to polling.",
                job_id, exc,
            )

        if outcome is None:
            outcome = self.poll_until_terminal(job_id, on_event)

        job = self.fetch_job(job_id)

        # Trust the job body over the event that got us here: an event can
        # arrive before the service has finished writing the result.
        final_outcome = classify_status(_first_present(job, ("status", "state", "job_status"))) or outcome

        if final_outcome == "failed":
            raise ProviderJobFailedError(_job_error(job))
        if final_outcome == "cancelled":
            raise ProviderJobFailedError("the service reported the generation was cancelled")

        return job


def _extract_job_id(body):
    """The job id, wherever the service puts it. Checked at the top level first,
    then one level into the usual envelope keys."""
    candidates = ("job_id", "jobId", "id", "task_id", "taskId", "generation_id")

    def _read(node):
        if not isinstance(node, dict):
            return None
        for key in candidates:
            value = node.get(key)
            if isinstance(value, (str, int)) and str(value).strip():
                return str(value).strip()
        return None

    found = _read(body)
    if found:
        return found

    if isinstance(body, dict):
        for key in ("data", "job", "result", "payload"):
            found = _read(body.get(key))
            if found:
                return found
    return None


def _job_error(job):
    """The service's reason for a failed job, in one line."""
    for key in ("error", "error_message", "detail", "message", "reason"):
        value = job.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()[:500]
        if isinstance(value, dict):
            nested = value.get("message") or value.get("detail")
            if isinstance(nested, str) and nested.strip():
                return nested.strip()[:500]
    return "the service did not say why"
