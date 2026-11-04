"""Agora Cloud Recording's four calls, and every way they can go wrong.

This module is the only place a live class depends on Agora's recording
service, so what matters here is not the happy path but that each failure
becomes a sentence somebody can read, a log line an operator can act on, and
— crucially — never a reason a class stops working.

Two behaviours carry the most weight. A **404 is the ordinary end of a
recording**, not a fault: Agora removes the recorder once the channel empties,
so `query` and `stop` both answer 404 on a class that finished by itself, and
telling that apart from a broken service is what `RecordingGoneError` is for.
And **`fileList` arrives in two different shapes** depending on how many
output formats were asked for, which is normalised here so nothing upstream
has to branch on it.
"""

from unittest import mock

import requests
from django.test import SimpleTestCase

from ..exceptions import RecordingGoneError, RecordingUnavailableError
from .. import recording_api

APP_ID = "a" * 32
AUTH = "Basic Y3VzdG9tZXI6c2VjcmV0"
CHANNEL = "cls-0123456789abcdef"
RECORDER_UID = 2_500_000_000


def fake_response(status_code=200, payload=None, text=""):
    response = mock.Mock()
    response.status_code = status_code
    response.text = text
    if payload is None:
        response.json.side_effect = ValueError("no json")
    else:
        response.json.return_value = payload
    return response


def http_returning(*responses):
    http = mock.Mock()
    http.request.side_effect = list(responses)
    return http


class BasicAuthTests(SimpleTestCase):
    def test_the_restful_key_is_sent_as_http_basic(self):
        """Cloud Recording is authenticated by the console's RESTful key, not
        by the RTC App Certificate and not by the whiteboard's Access Key —
        getting the family wrong is a 401 with nothing else to go on."""
        header = recording_api.basic_auth_header("customer", "secret")
        self.assertEqual(header, "Basic Y3VzdG9tZXI6c2VjcmV0")


class AcquireTests(SimpleTestCase):
    def test_a_reserved_recorder_returns_its_resource_id(self):
        http = http_returning(fake_response(payload={"resourceId": "res-1"}))

        handle = recording_api.acquire(
            app_id=APP_ID,
            auth_header=AUTH,
            channel_name=CHANNEL,
            recorder_uid=RECORDER_UID,
            session=http,
        )

        self.assertEqual(handle.resource_id, "res-1")
        self.assertEqual(handle.sid, "")

    def test_the_recorder_uid_travels_as_a_string(self):
        """Agora's REST API takes uids as strings even though the RTC token
        signs an integer — sending a number here is rejected."""
        http = http_returning(fake_response(payload={"resourceId": "res-1"}))

        recording_api.acquire(
            app_id=APP_ID,
            auth_header=AUTH,
            channel_name=CHANNEL,
            recorder_uid=RECORDER_UID,
            session=http,
        )

        payload = http.request.call_args[1]["json"]
        self.assertEqual(payload["uid"], str(RECORDER_UID))
        self.assertEqual(payload["cname"], CHANNEL)

    def test_a_reply_with_no_resource_id_is_a_failure(self):
        http = http_returning(fake_response(payload={"cname": CHANNEL}))
        with self.assertRaises(RecordingUnavailableError):
            recording_api.acquire(
                app_id=APP_ID,
                auth_header=AUTH,
                channel_name=CHANNEL,
                recorder_uid=RECORDER_UID,
                session=http,
            )

    def test_a_network_failure_becomes_a_sentence_without_the_internals(self):
        http = mock.Mock()
        http.request.side_effect = requests.ConnectionError("no route to host")

        with self.assertRaises(RecordingUnavailableError) as caught:
            recording_api.acquire(
                app_id=APP_ID,
                auth_header=AUTH,
                channel_name=CHANNEL,
                recorder_uid=RECORDER_UID,
                session=http,
            )

        self.assertNotIn("no route to host", str(caught.exception))
        self.assertIn("class itself is unaffected", str(caught.exception))

    def test_bad_credentials_say_which_settings_to_look_at(self):
        """Three Agora credential families live in this app and a 401 from any
        of them looks identical — so this one names its own."""
        http = http_returning(fake_response(status_code=401, text="unauthorized"))

        with self.assertRaises(RecordingUnavailableError) as caught:
            recording_api.acquire(
                app_id=APP_ID,
                auth_header=AUTH,
                channel_name=CHANNEL,
                recorder_uid=RECORDER_UID,
                session=http,
            )

        self.assertIn("AGORA_CUSTOMER_ID", str(caught.exception))


class StartTests(SimpleTestCase):
    def _start(self, http):
        handle = recording_api.RecordingSession("res-1")
        return recording_api.start(
            app_id=APP_ID,
            auth_header=AUTH,
            recording=handle,
            channel_name=CHANNEL,
            recorder_uid=RECORDER_UID,
            token="007token",
            storage_config={"vendor": 1, "bucket": "b"},
            max_idle_seconds=300,
            transcoding_config={"width": 1280},
            session=http,
        )

    def test_a_started_recording_carries_its_sid_home(self):
        http = http_returning(fake_response(payload={"sid": "sid-1", "resourceId": "res-1"}))
        handle = self._start(http)
        self.assertEqual(handle.sid, "sid-1")

    def test_the_request_describes_a_communication_channel_recording_both_media(self):
        """`channelType` has to match the browser's `mode: "rtc"` client, and
        `streamTypes` has to ask for audio *and* video — a mismatch on either
        records something nobody wants and reports no error at all."""
        http = http_returning(fake_response(payload={"sid": "sid-1"}))
        self._start(http)

        config = http.request.call_args[1]["json"]["clientRequest"]["recordingConfig"]
        self.assertEqual(config["channelType"], 0)
        self.assertEqual(config["streamTypes"], 2)
        self.assertEqual(config["maxIdleTime"], 300)

    def test_both_output_formats_are_asked_for(self):
        """HLS is written as the class runs and the MP4 is what a browser can
        actually play; asking for only one loses either the fallback or the
        playable file."""
        http = http_returning(fake_response(payload={"sid": "sid-1"}))
        self._start(http)

        file_config = http.request.call_args[1]["json"]["clientRequest"]["recordingFileConfig"]
        self.assertEqual(file_config["avFileType"], ["hls", "mp4"])

    def test_the_recorders_own_join_token_is_sent(self):
        """The recorder is a channel participant like any other and is refused
        without a token — which is exactly what stops anyone else's recorder
        joining our classes."""
        http = http_returning(fake_response(payload={"sid": "sid-1"}))
        self._start(http)
        self.assertEqual(
            http.request.call_args[1]["json"]["clientRequest"]["token"], "007token"
        )

    def test_a_reply_with_no_sid_is_a_failure(self):
        http = http_returning(fake_response(payload={"resourceId": "res-1"}))
        with self.assertRaises(RecordingUnavailableError):
            self._start(http)


class QueryAndStopTests(SimpleTestCase):
    def _handle(self):
        return recording_api.RecordingSession("res-1", "sid-1")

    def test_query_is_a_get_on_the_mix_mode_path(self):
        http = http_returning(fake_response(payload={"serverResponse": {}}))
        recording_api.query(
            app_id=APP_ID, auth_header=AUTH, recording=self._handle(), session=http
        )

        method, url = http.request.call_args[0]
        self.assertEqual(method, "GET")
        self.assertIn("/resourceid/res-1/sid/sid-1/mode/mix/query", url)

    def test_a_recorder_that_has_already_gone_is_not_an_error(self):
        """The ordinary end of a class: Agora removes the recorder once the
        channel empties, and from then on both query and stop answer 404."""
        http = http_returning(fake_response(status_code=404, text="not found"))

        with self.assertRaises(RecordingGoneError):
            recording_api.query(
                app_id=APP_ID, auth_header=AUTH, recording=self._handle(), session=http
            )

    def test_stop_waits_for_the_file_list_rather_than_returning_immediately(self):
        """`async_stop: false` is what makes the stop call answer with the
        finished files — the alternative returns at once and leaves nothing to
        tell students about."""
        http = http_returning(fake_response(payload={"serverResponse": {"fileList": []}}))
        recording_api.stop(
            app_id=APP_ID,
            auth_header=AUTH,
            recording=self._handle(),
            channel_name=CHANNEL,
            recorder_uid=RECORDER_UID,
            session=http,
        )
        self.assertIs(
            http.request.call_args[1]["json"]["clientRequest"]["async_stop"], False
        )

    def test_stopping_something_already_stopped_is_gone_not_broken(self):
        http = http_returning(fake_response(status_code=404))
        with self.assertRaises(RecordingGoneError):
            recording_api.stop(
                app_id=APP_ID,
                auth_header=AUTH,
                recording=self._handle(),
                channel_name=CHANNEL,
                recorder_uid=RECORDER_UID,
                session=http,
            )


class FileListTests(SimpleTestCase):
    def test_a_list_of_objects_comes_back_unchanged(self):
        response = {
            "serverResponse": {
                "fileList": [
                    {"filename": "class-recordings/1/a.m3u8", "isPlayable": True},
                    {"filename": "class-recordings/1/a.mp4", "isPlayable": True},
                ]
            }
        }
        files = recording_api.file_list_from(response)
        self.assertEqual(len(files), 2)
        self.assertEqual(files[1]["filename"], "class-recordings/1/a.mp4")

    def test_a_bare_filename_string_becomes_a_list_of_one(self):
        """Agora sends a plain string when only one output format was asked
        for. Normalising it here is what keeps the branch out of `services`."""
        response = {"serverResponse": {"fileList": "class-recordings/1/a.m3u8"}}
        self.assertEqual(
            recording_api.file_list_from(response),
            [{"filename": "class-recordings/1/a.m3u8"}],
        )

    def test_a_recorder_that_has_written_nothing_yet_has_no_files(self):
        self.assertEqual(recording_api.file_list_from({"serverResponse": {}}), [])
        self.assertEqual(recording_api.file_list_from({}), [])
        self.assertEqual(recording_api.file_list_from(None), [])

    def test_entries_without_a_filename_are_dropped(self):
        response = {"serverResponse": {"fileList": [{"isPlayable": True}, "", None]}}
        self.assertEqual(recording_api.file_list_from(response), [])

    def test_upload_finished_reads_agoras_own_verdict(self):
        self.assertTrue(
            recording_api.upload_finished({"serverResponse": {"uploadingStatus": "uploaded"}})
        )
        self.assertFalse(
            recording_api.upload_finished({"serverResponse": {"uploadingStatus": "backuped"}})
        )
        self.assertFalse(recording_api.upload_finished({}))
