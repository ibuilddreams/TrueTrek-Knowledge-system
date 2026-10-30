"""The one Netless REST call, and every way it can go wrong.

`whiteboard_api.create_room` is the single point where a live class depends on
somebody else's uptime, so what matters here is not the happy path but that
each failure becomes a sentence a teacher can read and a log line an operator
can act on — never a stack trace in a classroom.
"""

from unittest import mock

import requests
from django.test import SimpleTestCase

from ..exceptions import WhiteboardUnavailableError
from ..whiteboard_api import API_BASE_URL, REQUEST_TIMEOUT_SECONDS, create_room

SDK_TOKEN = "NETLESSSDK_pretend-token"


def fake_response(status_code=201, payload=None, text=""):
    response = mock.Mock()
    response.status_code = status_code
    response.text = text
    if payload is None:
        response.json.side_effect = ValueError("no json")
    else:
        response.json.return_value = payload
    return response


class CreateRoomTests(SimpleTestCase):
    def test_a_created_room_returns_its_uuid(self):
        http = mock.Mock()
        http.post.return_value = fake_response(payload={"uuid": "abc123", "isBan": False})

        self.assertEqual(
            create_room(sdk_token=SDK_TOKEN, region="us-sv", session=http), "abc123"
        )

    def test_the_credential_and_the_region_travel_as_headers(self):
        """Netless takes both in bare headers, not in `Authorization` or the body.

        The region is routing: a room created under the wrong one is invisible
        to every browser pointed at the right one, so getting this request
        shape wrong fails as "the board is empty" rather than as an error.
        """
        http = mock.Mock()
        http.post.return_value = fake_response(payload={"uuid": "abc123"})

        create_room(sdk_token=SDK_TOKEN, region="eu", session=http)

        url, kwargs = http.post.call_args[0][0], http.post.call_args[1]
        self.assertEqual(url, f"{API_BASE_URL}/rooms")
        self.assertEqual(kwargs["headers"]["token"], SDK_TOKEN)
        self.assertEqual(kwargs["headers"]["region"], "eu")
        self.assertEqual(kwargs["timeout"], REQUEST_TIMEOUT_SECONDS)
        self.assertEqual(kwargs["json"]["limit"], 0)

    def test_a_network_failure_becomes_a_sentence_a_teacher_can_read(self):
        http = mock.Mock()
        http.post.side_effect = requests.ConnectionError("no route to host")

        with self.assertRaises(WhiteboardUnavailableError) as caught:
            create_room(sdk_token=SDK_TOKEN, region="us-sv", session=http)

        self.assertNotIn("no route to host", str(caught.exception))

    def test_a_timeout_is_not_retried(self):
        """Fails fast rather than making a watched spinner wait twice.

        The same judgement `advisor` makes and the opposite of the background
        work in `ai_courses` — a teacher is standing in front of a class.
        """
        http = mock.Mock()
        http.post.side_effect = requests.Timeout("timed out")

        with self.assertRaises(WhiteboardUnavailableError):
            create_room(sdk_token=SDK_TOKEN, region="us-sv", session=http)

        self.assertEqual(http.post.call_count, 1)

    def test_rejected_credentials_point_at_the_credentials(self):
        http = mock.Mock()
        http.post.return_value = fake_response(
            status_code=401, payload={"message": "invalid token"}, text='{"message":"invalid token"}'
        )

        with self.assertRaises(WhiteboardUnavailableError) as caught:
            create_room(sdk_token=SDK_TOKEN, region="us-sv", session=http)

        self.assertIn("credentials", str(caught.exception))

    def test_an_unreadable_body_is_not_mistaken_for_a_room(self):
        http = mock.Mock()
        http.post.return_value = fake_response(status_code=201, payload=None, text="<html>502</html>")

        with self.assertRaises(WhiteboardUnavailableError):
            create_room(sdk_token=SDK_TOKEN, region="us-sv", session=http)

    def test_a_success_without_a_uuid_is_a_failure(self):
        """A 201 is not the same as a room.

        Reading the status code alone would store an empty uuid on the class
        and quietly make its board unopenable forever.
        """
        http = mock.Mock()
        http.post.return_value = fake_response(payload={"teamUUID": "t1"})

        with self.assertRaises(WhiteboardUnavailableError):
            create_room(sdk_token=SDK_TOKEN, region="us-sv", session=http)
