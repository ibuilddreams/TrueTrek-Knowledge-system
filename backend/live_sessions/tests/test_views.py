from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import LiveSession, SessionRSVP, SessionSpeaker

UserModel = get_user_model()


def make_user(username, role):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
    )


class LiveSessionsTestCase(APITestCase):
    def setUp(self):
        self.student = make_user("sessionstudent", UserModel.Roles.STUDENT)
        self.admin = make_user("sessionadmin", UserModel.Roles.ADMIN)

        self.speaker = SessionSpeaker.objects.create(
            name="Jordan Reyes", headline="D1 Wide Receiver — Oregon"
        )
        self.session = LiveSession.objects.create(
            title="Building Your Brand in High School",
            scheduled_at=timezone.now() + timedelta(hours=2),
            duration_minutes=60,
            meeting_url="https://zoom.us/j/123456",
        )
        self.session.speakers.add(self.speaker)


class SessionListingTests(LiveSessionsTestCase):
    def test_requires_authentication(self):
        response = self.client.get(reverse("live-sessions-upcoming"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_upcoming_list_never_leaks_the_meeting_url(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(reverse("live-sessions-upcoming"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = response.json()["data"]["results"][0]
        self.assertNotIn("meeting_url", row)
        self.assertEqual(row["live_state"], "UPCOMING")
        self.assertFalse(row["can_join"])
        self.assertEqual(row["speakers"][0]["name"], "Jordan Reyes")

    def test_detail_reports_rsvp_state(self):
        SessionRSVP.objects.create(session=self.session, student=self.student)
        self.client.force_authenticate(user=self.student)

        response = self.client.get(reverse("live-sessions-detail", args=[self.session.id]))

        self.assertTrue(response.json()["data"]["is_rsvped"])

    def test_stats_endpoint_returns_counts(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("live-sessions-stats"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["upcoming_count"], 1)


class RSVPViewTests(LiveSessionsTestCase):
    def test_student_can_rsvp_and_cancel(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("live-sessions-rsvp", args=[self.session.id])

        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["data"]["is_rsvped"])
        self.assertEqual(response.json()["data"]["rsvp_count"], 1)

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.json()["data"]["is_rsvped"])
        self.assertFalse(SessionRSVP.objects.filter(session=self.session).exists())

    def test_rsvp_is_rejected_when_the_session_is_full(self):
        self.session.capacity = 1
        self.session.save(update_fields=["capacity"])
        SessionRSVP.objects.create(
            session=self.session, student=make_user("filler", UserModel.Roles.STUDENT)
        )

        self.client.force_authenticate(user=self.student)
        response = self.client.post(reverse("live-sessions-rsvp", args=[self.session.id]))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class JoinViewTests(LiveSessionsTestCase):
    def test_join_is_forbidden_before_the_room_opens(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(reverse("live-sessions-join", args=[self.session.id]))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("zoom.us", response.content.decode())

    def test_join_releases_the_link_once_live(self):
        self.session.scheduled_at = timezone.now() - timedelta(minutes=5)
        self.session.save(update_fields=["scheduled_at"])
        self.client.force_authenticate(user=self.student)

        response = self.client.get(reverse("live-sessions-join", args=[self.session.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["data"]["meeting_url"], "https://zoom.us/j/123456")
        self.assertTrue(SessionRSVP.objects.get(session=self.session, student=self.student).attended)


class AdminSessionTests(LiveSessionsTestCase):
    def test_student_cannot_reach_the_admin_list(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(reverse("live-sessions-admin-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_list_does_include_the_meeting_url(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse("live-sessions-admin-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.json()["data"]["results"][0]["meeting_url"], "https://zoom.us/j/123456"
        )

    def test_admin_can_schedule_a_session_with_speakers(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse("live-sessions-admin-list"),
            {
                "title": "NIL Deals: What I Got Wrong",
                "scheduled_at": (timezone.now() + timedelta(days=7)).isoformat(),
                "duration_minutes": 45,
                "meeting_method": "ZOOM",
                "meeting_url": "https://zoom.us/j/999",
                "speaker_ids": [self.speaker.id],
                "talking_points": ["What worked", "What I regret"],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()["data"]
        self.assertEqual(body["speakers"][0]["id"], self.speaker.id)
        self.assertEqual(body["talking_points"], ["What worked", "What I regret"])

    def test_a_too_short_session_is_rejected(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse("live-sessions-admin-list"),
            {
                "title": "Blink",
                "scheduled_at": (timezone.now() + timedelta(days=1)).isoformat(),
                "duration_minutes": 1,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deleting_a_session_with_rsvps_cancels_it_instead(self):
        SessionRSVP.objects.create(session=self.session, student=self.student)
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(
            reverse("live-sessions-admin-detail", args=[self.session.id]),
            {"cancellation_reason": "Speaker unavailable."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, LiveSession.SessionStatus.CANCELLED)
        self.assertEqual(self.session.cancellation_reason, "Speaker unavailable.")

    def test_deleting_a_session_with_no_rsvps_really_deletes_it(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(
            reverse("live-sessions-admin-detail", args=[self.session.id])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(LiveSession.objects.filter(pk=self.session.pk).exists())

    def test_attendee_list_is_admin_only(self):
        SessionRSVP.objects.create(session=self.session, student=self.student)

        self.client.force_authenticate(user=self.student)
        self.assertEqual(
            self.client.get(
                reverse("live-sessions-admin-attendees", args=[self.session.id])
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(
            reverse("live-sessions-admin-attendees", args=[self.session.id])
        )
        self.assertEqual(response.json()["data"]["count"], 1)


class SpeakerViewTests(LiveSessionsTestCase):
    def test_students_can_read_speakers_but_not_create_them(self):
        self.client.force_authenticate(user=self.student)
        self.assertEqual(
            self.client.get(reverse("live-sessions-speakers")).status_code, status.HTTP_200_OK
        )
        self.assertEqual(
            self.client.post(
                reverse("live-sessions-speakers"), {"name": "Nope"}, format="json"
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_admin_can_add_a_speaker(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            reverse("live-sessions-speakers"),
            {"name": "Maya Torres", "headline": "D1 Track — LSU", "sport": "Track"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SessionSpeaker.objects.filter(name="Maya Torres").exists())

    def test_deleting_a_speaker_on_a_session_deactivates_them_instead(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(
            reverse("live-sessions-speaker-detail", args=[self.speaker.id])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.speaker.refresh_from_db()
        self.assertFalse(self.speaker.is_active)
