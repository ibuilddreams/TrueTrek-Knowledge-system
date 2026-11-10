"""The War Room Live room — the door, the token, and who may speak.

A session used to be an advert for somebody else's Zoom link. It can now run
here instead, on the same Agora project the live classes use, which moves
three things into this server that were never its problem before:

* **A channel name is a secret.** Anybody holding a token for a channel can
  walk into it, so the channel is in no payload anywhere and the only thing
  that hands one out is the call that mints a token for one person at the
  same moment.
* **The door is the server's.** Not the card, not the button — a room that is
  shut, cancelled, over or full refuses, and there is exactly one function
  every surface goes through to find that out.
* **Who may speak is in the token.** A listener is minted a subscriber token,
  so a page that merely behaved as though it could not publish would be one
  console command away from talking over the guest.
"""

from datetime import timedelta
from unittest import mock

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from class_sessions.agora import (
    PRIVILEGE_JOIN_CHANNEL,
    PRIVILEGE_PUBLISH_AUDIO_STREAM,
    decode_rtc_token,
)

from .. import notes as notes_services
from .. import services
from ..exceptions import (
    AgoraNotConfiguredError,
    SessionAccessDeniedError,
    SessionFullError,
    SessionNotJoinableError,
)
from ..models import LiveSession, SessionRSVP
from .factories import make_session, make_speaker, make_user

UserModel = get_user_model()

APP_ID = "a" * 32
APP_CERTIFICATE = "b" * 32

AGORA_SETTINGS = dict(
    AGORA_APP_ID=APP_ID,
    AGORA_APP_CERTIFICATE=APP_CERTIFICATE,
    # The notes are a separate feature with a separate switch; every test in
    # this file is about the room, and a session that quietly started writing
    # itself up would be testing two things at once.
    LIVE_SESSION_NOTES_ENABLED=False,
)


class RoomTestCase(TestCase):
    def setUp(self):
        self.admin = make_user("wrladmin", UserModel.Roles.ADMIN)
        self.student = make_user("wrlathlete", UserModel.Roles.STUDENT)
        self.other_student = make_user("wrlathlete2", UserModel.Roles.STUDENT)
        self.session = make_session(created_by=self.admin)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


class ConfigurationTests(RoomTestCase):
    @override_settings(**AGORA_SETTINGS)
    def test_a_room_needs_nothing_but_the_project_keys(self):
        self.assertTrue(services.is_agora_configured())
        self.assertTrue(services.can_join(self.session))

    @override_settings(**{**AGORA_SETTINGS, "AGORA_APP_CERTIFICATE": ""})
    def test_half_a_credential_is_no_credential(self):
        """A room that cannot be entered must not offer a button that could
        only fail, so `can_join` folds the configuration in."""
        self.assertFalse(services.is_agora_configured())
        self.assertFalse(services.can_join(self.session))
        with self.assertRaises(AgoraNotConfiguredError):
            services._agora_credentials()

    @override_settings(**AGORA_SETTINGS)
    def test_an_external_session_still_needs_its_link(self):
        external = make_session(
            meeting_method=LiveSession.MeetingMethod.ZOOM, meeting_url=""
        )
        self.assertFalse(services.can_join(external))
        external.meeting_url = "https://zoom.us/j/1"
        self.assertTrue(services.can_join(external))


# ---------------------------------------------------------------------------
# The door
# ---------------------------------------------------------------------------


@override_settings(**AGORA_SETTINGS)
class DoorTests(RoomTestCase):
    def test_a_student_is_let_in_while_the_session_is_live(self):
        credentials = services.issue_join_credentials(
            session=self.session, user=self.student
        )
        self.assertEqual(credentials["uid"], self.student.pk)
        self.assertEqual(credentials["channel_name"], self.session.channel_name)

    def test_the_room_is_shut_before_it_opens(self):
        early = make_session(starts_in_minutes=120)
        with self.assertRaises(SessionNotJoinableError):
            services.issue_join_credentials(session=early, user=self.student)

    def test_the_too_early_message_quotes_no_time(self):
        """The server only knows UTC and every time the frontend renders is in
        the viewer's own timezone, so a timestamp here would contradict the
        clock beside it."""
        early = make_session(starts_in_minutes=120)
        with self.assertRaises(SessionNotJoinableError) as caught:
            services.issue_join_credentials(session=early, user=self.student)
        message = str(caught.exception)
        self.assertIn("15 minutes before", message)
        self.assertNotIn("UTC", message)
        self.assertNotIn(":", message)

    def test_the_room_is_shut_once_the_session_is_over(self):
        over = make_session(starts_in_minutes=-300)
        with self.assertRaises(SessionNotJoinableError):
            services.issue_join_credentials(session=over, user=self.student)

    def test_a_cancelled_session_says_why(self):
        self.session.status = LiveSession.SessionStatus.CANCELLED
        self.session.cancellation_reason = "Our guest is unwell."
        self.session.save()
        with self.assertRaises(SessionNotJoinableError) as caught:
            services.issue_join_credentials(session=self.session, user=self.student)
        self.assertIn("unwell", str(caught.exception))

    def test_a_session_on_somebody_elses_platform_has_no_room_here(self):
        external = make_session(
            meeting_method=LiveSession.MeetingMethod.ZOOM,
            meeting_url="https://zoom.us/j/1",
        )
        with self.assertRaises(SessionNotJoinableError):
            services.issue_join_credentials(session=external, user=self.student)

    def test_the_link_door_says_so_rather_than_hunting_for_a_url(self):
        """An admin told "no link has been published" would go looking for a
        Zoom URL that is never going to exist."""
        with self.assertRaises(SessionNotJoinableError) as caught:
            services.get_join_url(session=self.session, student=self.student)
        self.assertIn("in the portal", str(caught.exception))

    def test_a_signed_out_visitor_is_not_let_in(self):
        with self.assertRaises(SessionAccessDeniedError):
            services.issue_join_credentials(
                session=self.session, user=AnonymousUser()
            )


@override_settings(**AGORA_SETTINGS)
class CapacityTests(RoomTestCase):
    def setUp(self):
        super().setUp()
        self.session.capacity = 1
        self.session.save(update_fields=["capacity"])

    def test_a_walk_in_is_turned_away_once_the_seats_are_gone(self):
        services.rsvp_to_session(session=self.session, student=self.student)
        with self.assertRaises(SessionFullError):
            services.issue_join_credentials(
                session=self.session, user=self.other_student
            )

    def test_somebody_who_reserved_a_seat_keeps_it(self):
        services.rsvp_to_session(session=self.session, student=self.student)
        credentials = services.issue_join_credentials(
            session=self.session, user=self.student
        )
        self.assertEqual(credentials["uid"], self.student.pk)

    def test_the_host_is_never_counted_out_of_their_own_room(self):
        services.rsvp_to_session(session=self.session, student=self.student)
        credentials = services.issue_join_credentials(
            session=self.session, user=self.admin
        )
        self.assertTrue(credentials["is_host"])


# ---------------------------------------------------------------------------
# The token
# ---------------------------------------------------------------------------


@override_settings(**AGORA_SETTINGS)
class TokenTests(RoomTestCase):
    def _decode(self, user):
        credentials = services.issue_join_credentials(session=self.session, user=user)
        return credentials, decode_rtc_token(credentials["token"], APP_CERTIFICATE)

    def test_the_token_is_signed_for_this_channel_and_this_person(self):
        credentials, decoded = self._decode(self.student)
        self.assertTrue(decoded["signature_valid"])
        self.assertEqual(decoded["app_id"], APP_ID)
        self.assertEqual(decoded["channel_name"], self.session.channel_name)
        self.assertEqual(decoded["uid"], self.student.pk)
        self.assertEqual(credentials["expires_in"], decoded["expire_seconds"])

    def test_a_listener_may_join_but_not_publish(self):
        """The enforcement point for who may speak is the token, never the
        page: a subscriber token simply has no publish privilege in it."""
        credentials, decoded = self._decode(self.student)
        self.assertFalse(credentials["can_speak"])
        self.assertIn(PRIVILEGE_JOIN_CHANNEL, decoded["privileges"])
        self.assertNotIn(PRIVILEGE_PUBLISH_AUDIO_STREAM, decoded["privileges"])

    def test_the_host_always_publishes(self):
        credentials, decoded = self._decode(self.admin)
        self.assertTrue(credentials["can_speak"])
        self.assertIn(PRIVILEGE_PUBLISH_AUDIO_STREAM, decoded["privileges"])

    def test_opening_the_floor_changes_what_the_next_token_may_do(self):
        self.session.audience_access = LiveSession.AudienceAccess.EVERYONE
        self.session.save(update_fields=["audience_access"])
        credentials, decoded = self._decode(self.student)
        self.assertTrue(credentials["can_speak"])
        self.assertIn(PRIVILEGE_PUBLISH_AUDIO_STREAM, decoded["privileges"])

    def test_a_token_outlives_the_session_it_was_minted_for(self):
        _, decoded = self._decode(self.student)
        _, _, ends_at = services.session_window(self.session)
        remaining = (ends_at - timezone.now()).total_seconds()
        self.assertGreater(decoded["expire_seconds"], remaining)

    def test_joining_in_the_last_minute_still_yields_a_usable_token(self):
        ending = make_session(starts_in_minutes=-59)
        credentials = services.issue_join_credentials(
            session=ending, user=self.student
        )
        self.assertGreaterEqual(credentials["expires_in"], services.MIN_TOKEN_SECONDS)


# ---------------------------------------------------------------------------
# The roster and who is counted as going
# ---------------------------------------------------------------------------


@override_settings(**AGORA_SETTINGS)
class RosterTests(RoomTestCase):
    def test_everybody_who_opens_the_door_is_named_for_everybody_else(self):
        services.issue_join_credentials(session=self.session, user=self.admin)
        credentials = services.issue_join_credentials(
            session=self.session, user=self.student
        )
        by_uid = {person["uid"]: person for person in credentials["roster"]}
        self.assertEqual(by_uid[self.admin.pk]["role"], "HOST")
        self.assertEqual(by_uid[self.student.pk]["role"], "AUDIENCE")
        self.assertEqual(by_uid[self.student.pk]["name"], self.student.name)

    def test_a_roster_carries_no_email_address(self):
        services.issue_join_credentials(session=self.session, user=self.student)
        for person in services.get_roster(self.session):
            self.assertEqual(set(person), {"uid", "name", "role"})

    def test_arriving_is_recorded_once_however_often_the_browser_reconnects(self):
        first = services.issue_join_credentials(
            session=self.session, user=self.student
        )
        joined_at = SessionRSVP.objects.get(
            session=self.session, student=self.student
        ).joined_at
        services.issue_join_credentials(session=self.session, user=self.student)

        rsvp = SessionRSVP.objects.get(session=self.session, student=self.student)
        self.assertEqual(
            SessionRSVP.objects.filter(session=self.session).count(), 1
        )
        self.assertTrue(rsvp.attended)
        self.assertEqual(rsvp.joined_at, joined_at)
        self.assertEqual(first["uid"], self.student.pk)

    def test_an_admin_who_rsvped_becomes_the_host_when_they_open_the_room(self):
        services.rsvp_to_session(session=self.session, student=self.admin)
        services.issue_join_credentials(session=self.session, user=self.admin)
        rsvp = SessionRSVP.objects.get(session=self.session, student=self.admin)
        self.assertEqual(rsvp.role, SessionRSVP.ParticipantRole.HOST)

    def test_hosting_a_session_is_not_attending_it(self):
        """A host has a row so the roster can name their voice. Counting it
        would take a seat off every session an admin opened, and would tell
        students that one more person is coming than actually is."""
        services.issue_join_credentials(session=self.session, user=self.admin)
        services.rsvp_to_session(session=self.session, student=self.student)

        self.assertEqual(services.seats_taken(self.session), 1)
        row = services.upcoming_sessions().get(pk=self.session.pk)
        self.assertEqual(row.rsvp_count, 1)

    def test_a_full_session_is_not_made_full_by_its_own_host(self):
        self.session.capacity = 1
        self.session.save(update_fields=["capacity"])
        services.issue_join_credentials(session=self.session, user=self.admin)
        # Still a free seat: the host took none.
        services.rsvp_to_session(session=self.session, student=self.student)
        self.assertEqual(services.seats_taken(self.session), 1)


# ---------------------------------------------------------------------------
# Opening and closing the floor
# ---------------------------------------------------------------------------


@override_settings(**AGORA_SETTINGS)
class AudienceAccessTests(RoomTestCase):
    def test_a_student_cannot_open_the_floor_to_themselves(self):
        with self.assertRaises(SessionAccessDeniedError):
            services.set_audience_access(
                session=self.session,
                user=self.student,
                access=LiveSession.AudienceAccess.EVERYONE,
            )
        self.session.refresh_from_db()
        self.assertFalse(services.audience_can_speak(self.session))

    def test_a_host_opens_and_closes_it(self):
        services.set_audience_access(
            session=self.session,
            user=self.admin,
            access=LiveSession.AudienceAccess.EVERYONE,
        )
        self.session.refresh_from_db()
        self.assertTrue(services.audience_can_speak(self.session))

        services.set_audience_access(
            session=self.session,
            user=self.admin,
            access=LiveSession.AudienceAccess.LISTEN_ONLY,
        )
        self.session.refresh_from_db()
        self.assertFalse(services.audience_can_speak(self.session))

    def test_an_unknown_access_value_is_refused(self):
        with self.assertRaises(SessionNotJoinableError):
            services.set_audience_access(
                session=self.session, user=self.admin, access="SHOUTING"
            )


# ---------------------------------------------------------------------------
# Through the API
# ---------------------------------------------------------------------------


@override_settings(**AGORA_SETTINGS)
class RoomViewTests(APITestCase):
    def setUp(self):
        self.admin = make_user("apiadmin", UserModel.Roles.ADMIN)
        self.student = make_user("apiathlete", UserModel.Roles.STUDENT)
        self.session = make_session(created_by=self.admin)
        self.session.speakers.add(make_speaker())
        self.url = reverse("live-sessions-room", args=[self.session.id])

    def test_the_channel_name_is_in_no_listing_anywhere(self):
        """A channel is joinable by anybody holding a token for it, so it
        travels only with the token that was minted for one person."""
        self.client.force_authenticate(user=self.student)

        listing = self.client.get(reverse("live-sessions-upcoming"))
        detail = self.client.get(
            reverse("live-sessions-detail", args=[self.session.id])
        )
        self.client.force_authenticate(user=self.admin)
        admin_listing = self.client.get(reverse("live-sessions-admin-list"))

        for response in (listing, detail, admin_listing):
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertNotIn(self.session.channel_name, response.content.decode())
            self.assertNotIn("channel_name", response.content.decode())

    def test_joining_returns_a_token_and_never_the_app_certificate(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()["data"]
        self.assertEqual(body["channel_name"], self.session.channel_name)
        self.assertEqual(body["uid"], self.student.pk)
        self.assertFalse(body["can_speak"])
        self.assertFalse(body["is_host"])
        self.assertNotIn(APP_CERTIFICATE, response.content.decode())
        self.assertNotIn(APP_ID, response.content.decode())

    def test_a_shut_room_is_a_403_rather_than_a_404(self):
        """The student is allowed to know the session exists — they just
        can't get in yet."""
        early = make_session(starts_in_minutes=120)
        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("live-sessions-room", args=[early.id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(AGORA_APP_ID="", AGORA_APP_CERTIFICATE="")
    def test_an_unconfigured_server_says_so_as_a_server_fault(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_only_an_admin_may_open_the_floor(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(self.url, {"audience_access": "EVERYONE"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(self.url, {"audience_access": "EVERYONE"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["audience_access"], "EVERYONE")
        self.assertTrue(response.json()["data"]["audience_can_speak"])

    def test_leaving_is_best_effort_and_always_succeeds(self):
        self.client.force_authenticate(user=self.student)
        self.client.post(self.url)
        response = self.client.post(
            reverse("live-sessions-leave", args=[self.session.id]), {"ended": True}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_a_card_says_whether_the_room_is_ours_and_who_is_hosting(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            reverse("live-sessions-detail", args=[self.session.id])
        )
        body = response.json()["data"]
        self.assertTrue(body["is_hosted_here"])
        self.assertTrue(body["is_host"])
        self.assertFalse(body["audience_can_speak"])

        self.client.force_authenticate(user=self.student)
        body = self.client.get(
            reverse("live-sessions-detail", args=[self.session.id])
        ).json()["data"]
        self.assertFalse(body["is_host"])

    def test_switching_a_session_to_our_own_room_drops_the_stale_link(self):
        """Otherwise `get_join_url` would happily hand out a Zoom URL for a
        session that no longer uses it, and send half the room elsewhere."""
        external = make_session(
            meeting_method=LiveSession.MeetingMethod.ZOOM,
            meeting_url="https://zoom.us/j/1",
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.patch(
            reverse("live-sessions-admin-detail", args=[external.id]),
            {"meeting_method": "AGORA"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        external.refresh_from_db()
        self.assertIsNone(external.meeting_url)

    def test_notes_never_stop_a_room_opening(self):
        """Every failure in the notes path is swallowed into a log line: a
        session must open even when the AI provider is unreachable."""
        self.client.force_authenticate(user=self.admin)
        with override_settings(LIVE_SESSION_NOTES_ENABLED=True), mock.patch.object(
            notes_services, "start_notes", side_effect=RuntimeError("provider down")
        ):
            response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json()["data"]["is_taking_notes"])
