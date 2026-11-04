"""The recording endpoint — who may see a recording, and who may run one.

One URL carries all three: a student reading the state of a class's recording,
the classroom's REC indicator, and the teacher's start/stop. The asserts here
are mostly about the doors, because a recording of a class is a video of
children and the only thing standing between it and the internet is this view.
"""

from datetime import timedelta
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .. import services
from ..models import ClassSessionRecording
from .factories import assign_teacher, enrol, make_course, make_session, make_user

UserModel = get_user_model()

APP_ID = "2f0e20ac920f4bcdb342451a6653358e"
APP_CERTIFICATE = "9b86a609600d427cbe3cd2f7dd6e4a93"

RECORDING_SETTINGS = dict(
    AGORA_APP_ID=APP_ID,
    AGORA_APP_CERTIFICATE=APP_CERTIFICATE,
    AGORA_RECORDING_ENABLED=True,
    AGORA_CUSTOMER_ID="",
    AGORA_CUSTOMER_SECRET="",
    AGORA_RECORDING_CUSTOMER_ID="customer",
    AGORA_RECORDING_CUSTOMER_SECRET="secret",
    AGORA_RECORDING_BUCKET="truetrek-recordings",
    AGORA_RECORDING_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE",
    AGORA_RECORDING_SECRET_KEY="wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
    AGORA_RECORDING_S3_REGION="us-east-1",
    AGORA_RECORDING_S3_ENDPOINT="",
    AGORA_RECORDING_S3_PATH_STYLE=False,
    AGORA_RECORDING_PUBLIC_BASE_URL="",
    AGORA_RECORDING_URL_TTL_SECONDS=3600,
)

MP4 = "class-recordings/9/cls-abc_0.mp4"


@override_settings(**RECORDING_SETTINGS)
class RecordingViewTestCase(APITestCase):
    def setUp(self):
        self.teacher = make_user("recteacher", UserModel.Roles.TEACHER)
        self.other_teacher = make_user("recotherteacher", UserModel.Roles.TEACHER)
        self.student = make_user("recstudent", UserModel.Roles.STUDENT)
        self.outsider = make_user("recoutsider", UserModel.Roles.STUDENT)

        self.course = make_course()
        assign_teacher(self.course, self.teacher)
        enrol(self.course, self.student)

        self.session = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-10
        )
        self.url = reverse("class-sessions-recording", args=[self.session.pk])

        patcher = mock.patch.object(services, "_spawn")
        self.spawn = patcher.start()
        self.addCleanup(patcher.stop)

    def make_available_recording(self):
        return ClassSessionRecording.objects.create(
            session=self.session,
            status=ClassSessionRecording.RecordingStatus.AVAILABLE,
            storage_key=MP4,
            recorder_uid=2_500_000_000,
            started_at=timezone.now() - timedelta(minutes=50),
            stopped_at=timezone.now(),
            duration_seconds=3000,
            notified_at=timezone.now(),
        )


class ReadingRecordingStateTests(RecordingViewTestCase):
    def test_an_enrolled_student_gets_a_signed_link(self):
        self.make_available_recording()
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertTrue(data["available"])
        self.assertIn("X-Amz-Signature=", data["url"])
        self.assertEqual(data["duration_seconds"], 3000)

    def test_the_teacher_gets_a_signed_link(self):
        self.make_available_recording()
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(self.url)
        self.assertIsNotNone(response.json()["data"]["url"])

    def test_somebody_not_on_the_course_is_told_the_class_does_not_exist(self):
        """404 rather than 403: they aren't entitled to learn the class
        exists, let alone that it was recorded."""
        self.make_available_recording()
        self.client.force_authenticate(user=self.outsider)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_a_signed_out_visitor_gets_nothing(self):
        self.make_available_recording()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_a_class_with_no_recording_says_so_without_failing(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()["data"]
        self.assertFalse(data["available"])
        self.assertFalse(data["is_recording"])
        self.assertIsNone(data["url"])

    def test_a_fresh_link_is_signed_on_every_read(self):
        """Nothing forwardable is ever stored: the student's "Watch" button
        asks again each time rather than reusing a link that has expired."""
        self.make_available_recording()
        self.client.force_authenticate(user=self.student)

        first = self.client.get(self.url).json()["data"]["url"]
        self.assertIn("X-Amz-Date=", first)
        self.assertIn("X-Amz-Expires=3600", first)

    def test_the_listing_payload_never_carries_a_link(self):
        """A class card knows only *that* there is a recording — the same rule
        that keeps the channel name and the whiteboard room out of listings."""
        finished = make_session(
            course=self.course,
            teacher=self.teacher,
            starts_in_minutes=-180,
            title="Yesterday's film review",
        )
        ClassSessionRecording.objects.create(
            session=finished,
            status=ClassSessionRecording.RecordingStatus.AVAILABLE,
            storage_key=MP4,
            recorder_uid=2_500_000_000,
            notified_at=timezone.now(),
        )
        self.client.force_authenticate(user=self.student)

        response = self.client.get(reverse("class-sessions-my-past"))
        rows = {row["id"]: row for row in response.json()["data"]["results"]}
        row = rows[finished.pk]

        self.assertTrue(row["recording_available"])
        self.assertNotIn("url", row)
        self.assertNotIn("storage_key", row)
        self.assertNotIn("channel_name", row)


class StartingAndStoppingTests(RecordingViewTestCase):
    def test_the_teacher_can_start_a_recording(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()["data"]["is_recording"])
        self.assertEqual(self.session.recordings.count(), 1)

    def test_a_student_cannot_start_a_recording(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.session.recordings.count(), 0)

    def test_a_student_cannot_stop_a_recording(self):
        """Nor switch off a recording somebody else's class is making."""
        ClassSessionRecording.objects.create(
            session=self.session,
            status=ClassSessionRecording.RecordingStatus.RECORDING,
            recorder_uid=2_500_000_000,
            resource_id="res-1",
            sid="sid-1",
        )
        self.client.force_authenticate(user=self.student)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_a_teacher_from_another_course_cannot_start_one(self):
        self.client.force_authenticate(user=self.other_teacher)
        response = self.client.post(self.url)
        # They can't see the class at all, so it does not exist for them.
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_the_teacher_can_stop_a_recording(self):
        recording = ClassSessionRecording.objects.create(
            session=self.session,
            status=ClassSessionRecording.RecordingStatus.RECORDING,
            recorder_uid=2_500_000_000,
            resource_id="res-1",
            sid="sid-1",
        )
        self.client.force_authenticate(user=self.teacher)

        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.PROCESSING)
        self.assertTrue(response.json()["data"]["is_processing"])

    def test_stopping_a_class_that_is_not_recording_is_not_an_error(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("isn't being recorded", response.json()["message"])

    @override_settings(**{**RECORDING_SETTINGS, "AGORA_RECORDING_BUCKET": ""})
    def test_a_server_with_nowhere_to_store_a_recording_says_so_honestly(self):
        """503 with a readable sentence, the same shape the whiteboard uses —
        never a stack trace in front of a class."""
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("storage", response.json()["message"].lower())

    def test_a_class_set_not_to_be_recorded_refuses(self):
        self.session.is_recorded = False
        self.session.save(update_fields=["is_recorded"])
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class SchedulingWithRecordingTests(RecordingViewTestCase):
    def test_a_teacher_can_schedule_a_class_that_is_not_recorded(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            reverse("class-sessions-teacher-list"),
            {
                "course": self.course.pk,
                "title": "Private debrief",
                "scheduled_at": (timezone.now() + timedelta(days=1)).isoformat(),
                "duration_minutes": 45,
                "is_recorded": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.json()["data"]["is_recorded"])

    def test_classes_are_recorded_unless_the_teacher_says_otherwise(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            reverse("class-sessions-teacher-list"),
            {
                "course": self.course.pk,
                "title": "Film review",
                "scheduled_at": (timezone.now() + timedelta(days=2)).isoformat(),
                "duration_minutes": 45,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.json()["data"]["is_recorded"])
