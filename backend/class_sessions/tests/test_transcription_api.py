"""The Agora Real-Time Transcription REST client.

What is pinned here is the shape of the three calls — the v7 paths, the
payload Agora's own reference documents, and the four ways a reply can go
wrong — because every one of them fails invisibly: a transcription that was
never started looks exactly like a class where nobody spoke.
"""

from unittest import mock

import requests
from django.test import SimpleTestCase

from .. import transcription_api
from ..exceptions import NotesGoneError, NotesUnavailableError

APP_ID = "app-123"
AUTH = "Basic Y3VzdG9tZXI6c2VjcmV0"


def _response(status_code=200, json_body=None, text=""):
    response = mock.Mock(status_code=status_code, text=text)
    if json_body is None:
        response.json.side_effect = ValueError("not json")
    else:
        response.json.return_value = json_body
    return response


def _session(response):
    http = mock.Mock()
    http.request.return_value = response
    return http


class JoinTests(SimpleTestCase):
    def _join(self, http):
        return transcription_api.join(
            app_id=APP_ID,
            auth_header=AUTH,
            name="cls1n1abc",
            channel_name="cls-abc",
            bot_uid=3_500_000_000,
            bot_token="007eJx...",
            languages=["en-US"],
            caption_config={"sliceDuration": 60, "storage": {"bucket": "b"}},
            max_idle_seconds=300,
            session=http,
        )

    def test_it_posts_the_v7_join_path(self):
        """The v5/v6 shape — a builderToken and a taskId under
        `/v1/projects/<app>/rtsc/speech-to-text/` — reached end of life in
        June 2026 and is still what most sample code on the internet uses."""
        http = _session(_response(json_body={"agent_id": "ag-1", "status": "RUNNING"}))
        self._join(http)

        method, url = http.request.call_args[0]
        self.assertEqual(method, "POST")
        self.assertEqual(
            url, "https://api.agora.io/api/speech-to-text/v1/projects/app-123/join"
        )

    def test_the_payload_is_the_shape_agoras_reference_documents(self):
        http = _session(_response(json_body={"agent_id": "ag-1"}))
        self._join(http)

        payload = http.request.call_args.kwargs["json"]
        self.assertEqual(payload["name"], "cls1n1abc")
        self.assertEqual(payload["languages"], ["en-US"])
        self.assertEqual(payload["maxIdleTime"], 300)
        self.assertEqual(payload["rtcConfig"]["channelName"], "cls-abc")
        self.assertEqual(payload["captionConfig"]["sliceDuration"], 60)

    def test_the_bot_uid_travels_as_a_string(self):
        """Agora's v7 reference types both bot uids as strings and quotes
        them in every example, even where older prose called them ints."""
        http = _session(_response(json_body={"agent_id": "ag-1"}))
        self._join(http)

        payload = http.request.call_args.kwargs["json"]
        self.assertEqual(payload["rtcConfig"]["pubBotUid"], "3500000000")

    def test_the_bot_carries_a_token_because_this_project_has_a_certificate(self):
        """Agora calls the token optional — "only when your project has App
        Certificate enabled". Nothing in this app can mint a token without
        one, so it is always sent; omitting it is a bot Agora refuses at the
        door, and the only symptom is a silent class."""
        http = _session(_response(json_body={"agent_id": "ag-1"}))
        self._join(http)

        self.assertEqual(
            http.request.call_args.kwargs["json"]["rtcConfig"]["pubBotToken"],
            "007eJx...",
        )

    def test_an_agent_id_under_either_spelling_is_accepted(self):
        http = _session(_response(json_body={"agentId": "ag-2"}))
        self.assertEqual(self._join(http).agent_id, "ag-2")

    def test_a_reply_with_no_agent_id_is_a_failure_not_a_silent_success(self):
        """Without an agent id there is no way left to stop or ask about the
        bot — a run that believed this was fine would leave one listening in
        a channel until Agora's idle timer noticed."""
        http = _session(_response(json_body={"status": "RUNNING"}))
        with self.assertRaises(NotesUnavailableError):
            self._join(http)

    def test_rejected_credentials_say_which_settings_to_check(self):
        """And name the pair an operator actually sets.

        There is one RESTful key per Agora account, so the message points at
        `AGORA_CUSTOMER_ID` rather than at the per-product override almost
        nobody has — and says the product may simply not be enabled, which on
        a fresh Agora project is the likelier of the two causes.
        """
        http = _session(_response(status_code=401, json_body={"reason": "bad key"}))
        with self.assertRaises(NotesUnavailableError) as caught:
            self._join(http)

        message = str(caught.exception)
        self.assertIn("AGORA_CUSTOMER_ID", message)
        self.assertIn("Real-Time Transcription is enabled", message)

    def test_an_unreachable_service_is_not_a_broken_class(self):
        http = mock.Mock()
        http.request.side_effect = requests.ConnectionError("no route")
        with self.assertRaises(NotesUnavailableError) as caught:
            self._join(http)
        self.assertIn("class itself is unaffected", str(caught.exception))

    def test_a_non_json_reply_is_reported_rather_than_crashing(self):
        http = _session(_response(status_code=200, text="<html>502</html>"))
        with self.assertRaises(NotesUnavailableError):
            self._join(http)


class QueryAndLeaveTests(SimpleTestCase):
    def setUp(self):
        self.agent = transcription_api.TranscriptionAgent("ag-1")

    def test_query_reads_the_agent_by_id(self):
        http = _session(_response(json_body={"status": "RUNNING"}))
        transcription_api.query(
            app_id=APP_ID, auth_header=AUTH, agent=self.agent, session=http
        )
        method, url = http.request.call_args[0]
        self.assertEqual(method, "GET")
        self.assertEqual(
            url,
            "https://api.agora.io/api/speech-to-text/v1/projects/app-123/agents/ag-1",
        )
        self.assertEqual(self.agent.status, "RUNNING")

    def test_leave_posts_to_the_agents_leave_path(self):
        http = _session(_response(json_body={}))
        transcription_api.leave(
            app_id=APP_ID, auth_header=AUTH, agent=self.agent, session=http
        )
        method, url = http.request.call_args[0]
        self.assertEqual(method, "POST")
        self.assertTrue(url.endswith("/agents/ag-1/leave"))

    def test_a_404_is_the_ordinary_end_of_a_class(self):
        """The bot leaves on its own once the channel empties. The captions
        it wrote are in the bucket either way, which is why this is a
        distinct type rather than a failure."""
        http = _session(_response(status_code=404, json_body={"reason": "gone"}))
        with self.assertRaises(NotesGoneError):
            transcription_api.query(
                app_id=APP_ID, auth_header=AUTH, agent=self.agent, session=http
            )

    def test_a_gone_error_is_still_an_unavailable_error(self):
        """So that every `except NotesUnavailableError` keeps working."""
        self.assertTrue(issubclass(NotesGoneError, NotesUnavailableError))


class StatusTests(SimpleTestCase):
    def test_stopped_and_failed_are_the_only_terminal_states(self):
        for status in ("STOPPED", "FAILED"):
            self.assertTrue(transcription_api.has_finished({"status": status}))

    def test_everything_else_is_treated_as_still_going(self):
        """A bot we wrongly believe is dead is a transcript that stops in the
        middle of a class — so an unrecognised status, and no status at all,
        both mean "carry on"."""
        for status in ("IDLE", "STARTING", "RUNNING", "STOPPING", "RECOVERING", ""):
            self.assertFalse(transcription_api.has_finished({"status": status}))
        self.assertFalse(transcription_api.has_finished({}))
        self.assertFalse(transcription_api.has_finished(None))

    def test_the_status_is_read_case_insensitively(self):
        self.assertTrue(transcription_api.has_finished({"status": "stopped"}))
