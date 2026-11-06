"""Recording a class: the lifecycle, and the four things it must never do.

A recording is the one feature here that spends money, runs on somebody
else's infrastructure, outlives the request that started it and ends by
telling a roomful of students to go and look at something. The tests below are
organised around the four ways that goes wrong:

* **It must never break a class.** Starting is wired into the host's join and
  stopping into their leave, so a recording service that is down, out of quota
  or simply unconfigured has to be invisible from inside the classroom.
* **It must never bill twice.** Two co-instructors arriving in the same second
  must not put two recorders in one channel.
* **It must never notify twice.** A recording reaches "ready" from four
  different directions, and thirty students must hear about it once.
* **It must never hand the file to the wrong person.** A playback link is as
  private as the class it is of, and is minted per viewer behind the same
  roster check as the classroom door.
"""

from datetime import timedelta
from unittest import mock

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone

from notifications.models import Notification

from .. import services, storage
from ..agora import decode_rtc_token
from ..exceptions import RecordingNotConfiguredError, RecordingUnavailableError
from ..models import ClassSession, ClassSessionRecording
from ..recording_api import RecordingSession
from .factories import assign_teacher, enrol, make_course, make_session, make_user

APP_ID = "a" * 32
APP_CERTIFICATE = "b" * 32

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

MP4 = "class-recordings/1/cls-abc_0.mp4"
M3U8 = "class-recordings/1/cls-abc_0.m3u8"


class RecordingTestCase(TestCase):
    """A live class with a teacher and two enrolled students."""

    def setUp(self):
        self.teacher = make_user("coach", "TEACHER")
        self.student = make_user("athlete", "STUDENT")
        self.other_student = make_user("athlete2", "STUDENT")
        self.outsider = make_user("stranger", "STUDENT")

        self.course = make_course()
        assign_teacher(self.course, self.teacher)
        enrol(self.course, self.student)
        enrol(self.course, self.other_student)

        # Running right now: started 10 minutes ago, 60 minutes long.
        self.session = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-10
        )

    def make_recording(self, **kwargs):
        kwargs.setdefault("status", ClassSessionRecording.RecordingStatus.RECORDING)
        kwargs.setdefault("recorder_uid", 2_500_000_000)
        kwargs.setdefault("resource_id", "res-1")
        kwargs.setdefault("sid", "sid-1")
        kwargs.setdefault("started_at", timezone.now() - timedelta(minutes=10))
        return ClassSessionRecording.objects.create(session=self.session, **kwargs)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


class ConfigurationTests(RecordingTestCase):
    @override_settings(**RECORDING_SETTINGS)
    def test_a_fully_configured_server_can_record(self):
        self.assertTrue(services.is_recording_configured())

    @override_settings(**{**RECORDING_SETTINGS, "AGORA_RECORDING_CUSTOMER_ID": ""})
    def test_missing_restful_credentials_means_no_recording(self):
        self.assertFalse(services.is_recording_configured())

    @override_settings(**{**RECORDING_SETTINGS, "AGORA_RECORDING_BUCKET": ""})
    def test_no_bucket_means_no_recording(self):
        """Agora uploads to storage we own, so a server with perfect Agora
        credentials and nowhere to put a file still cannot record."""
        self.assertFalse(services.is_recording_configured())

    @override_settings(**{**RECORDING_SETTINGS, "AGORA_RECORDING_ENABLED": False})
    def test_the_deployment_wide_switch_turns_it_off(self):
        self.assertFalse(services.is_recording_configured())

    @override_settings(**{**RECORDING_SETTINGS, "AGORA_APP_CERTIFICATE": ""})
    def test_recording_needs_the_rtc_credentials_too(self):
        """The recorder joins the channel like anybody else and so needs a
        token signed by the App Certificate — all three credential families
        have to be present at once, which no other feature here requires."""
        self.assertFalse(services.is_recording_configured())

    @override_settings(**{**RECORDING_SETTINGS, "AGORA_RECORDING_CUSTOMER_SECRET": ""})
    def test_the_missing_setting_is_named_in_the_log_not_the_message(self):
        with self.assertRaises(RecordingNotConfiguredError) as caught:
            services._recording_credentials()
        self.assertNotIn("CUSTOMER_SECRET", str(caught.exception))


class RecorderUidTests(RecordingTestCase):
    def test_a_recorder_uid_can_never_collide_with_a_real_user(self):
        """Uids in a class channel *are* `user.pk`. The recorder needs one of
        its own, drawn from a range no row in this database can reach."""
        for _ in range(50):
            uid = services._new_recorder_uid()
            self.assertGreaterEqual(uid, services.RECORDER_UID_MIN)
            self.assertLessEqual(uid, services.RECORDER_UID_MAX)
            self.assertTrue(services.is_recorder_uid(uid))

        self.assertFalse(services.is_recorder_uid(self.student.pk))
        self.assertFalse(services.is_recorder_uid(None))
        self.assertFalse(services.is_recorder_uid("not a uid"))

    def test_the_uid_fits_in_the_32_bits_an_agora_token_allows(self):
        self.assertLess(services.RECORDER_UID_MAX, 2**32)


# ---------------------------------------------------------------------------
# Starting
# ---------------------------------------------------------------------------


@override_settings(**RECORDING_SETTINGS)
class StartRecordingTests(RecordingTestCase):
    def setUp(self):
        super().setUp()
        patcher = mock.patch.object(services, "_spawn")
        self.spawn = patcher.start()
        self.addCleanup(patcher.stop)

    def test_starting_creates_a_row_and_hands_the_work_to_a_thread(self):
        """Shaped like `ai_courses` and `brand_validator`: the row exists
        before anything slow happens, because this runs inside a teacher's
        join and acquiring a recorder is two round trips to Agora."""
        recording = services.start_recording(session=self.session, user=self.teacher)

        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.STARTING)
        self.assertEqual(recording.started_by, self.teacher)
        self.assertIsNotNone(recording.recorder_uid)
        self.spawn.assert_called_once()

    def test_starting_twice_returns_the_same_recording(self):
        """Two co-instructors opening the room in the same second must not put
        two recorders in one channel — that bills twice and writes two
        half-files."""
        first = services.start_recording(session=self.session, user=self.teacher)
        second = services.start_recording(session=self.session, user=self.teacher)

        self.assertEqual(first.pk, second.pk)
        self.assertEqual(self.session.recordings.count(), 1)

    def test_the_database_refuses_a_second_live_recording(self):
        from django.db import IntegrityError

        self.make_recording()
        with self.assertRaises(IntegrityError):
            ClassSessionRecording.objects.create(
                session=self.session,
                status=ClassSessionRecording.RecordingStatus.RECORDING,
            )

    def test_a_finished_recording_does_not_block_a_second_take(self):
        """The constraint is on *in-flight* recordings only: a class that was
        stopped and started again legitimately has two rows."""
        self.make_recording(
            status=ClassSessionRecording.RecordingStatus.AVAILABLE, storage_key=MP4
        )
        recording = services.start_recording(session=self.session, user=self.teacher)
        self.assertEqual(self.session.recordings.count(), 2)
        self.assertTrue(recording.is_in_flight)

    def test_a_class_marked_not_to_be_recorded_can_still_be_recorded(self):
        """`is_recorded` says whether a class starts recording the moment its
        teacher opens the room — not whether it is allowed to.

        A teacher who left the box unticked has to be able to press record
        during the class. The automatic half is pinned separately, by the
        `maybe_start_recording` tests, which is where that flag really does
        decide.
        """
        self.session.is_recorded = False
        self.session.save(update_fields=["is_recorded"])

        recording = services.start_recording(session=self.session, user=self.teacher)

        self.assertTrue(recording.is_in_flight)
        self.assertEqual(self.session.recordings.count(), 1)

    def test_a_cancelled_class_is_not_recorded(self):
        self.session.status = ClassSession.SessionStatus.CANCELLED
        self.session.save(update_fields=["status"])

        with self.assertRaises(RecordingNotConfiguredError):
            services.start_recording(session=self.session, user=self.teacher)

    @override_settings(**{**RECORDING_SETTINGS, "AGORA_RECORDING_BUCKET": ""})
    def test_an_unconfigured_server_leaves_no_failed_rows_behind(self):
        """Checked before the row is written, so a server that was never set
        up doesn't accumulate a FAILED recording on every single join."""
        with self.assertRaises(RecordingNotConfiguredError):
            services.start_recording(session=self.session, user=self.teacher)
        self.assertEqual(self.session.recordings.count(), 0)


@override_settings(**RECORDING_SETTINGS)
class AutoStartTests(RecordingTestCase):
    def setUp(self):
        super().setUp()
        patcher = mock.patch.object(services, "_spawn")
        self.spawn = patcher.start()
        self.addCleanup(patcher.stop)

    def test_the_class_records_when_its_teacher_opens_the_room(self):
        services.maybe_start_recording(self.session, self.teacher)
        self.assertEqual(self.session.recordings.count(), 1)

    def test_a_student_joining_never_starts_a_recording(self):
        """A class records because its teacher is in it. A student arriving
        early in an empty room must not start one."""
        services.maybe_start_recording(self.session, self.student)
        self.assertEqual(self.session.recordings.count(), 0)

    @override_settings(**{**RECORDING_SETTINGS, "AGORA_RECORDING_CUSTOMER_ID": ""})
    def test_an_unconfigured_server_is_silent_rather_than_loud(self):
        self.assertIsNone(services.maybe_start_recording(self.session, self.teacher))

    def test_a_broken_recording_service_never_reaches_the_caller(self):
        """This runs inside `issue_join_credentials`. A third party being down
        must never be the reason a class cannot open."""
        with mock.patch.object(
            services, "start_recording", side_effect=RecordingUnavailableError("down")
        ):
            self.assertIsNone(services.maybe_start_recording(self.session, self.teacher))

    def test_even_an_unexpected_crash_never_reaches_the_caller(self):
        with mock.patch.object(services, "start_recording", side_effect=ValueError("boom")):
            self.assertIsNone(services.maybe_start_recording(self.session, self.teacher))

    def test_joining_a_class_starts_its_recording_and_says_so(self):
        credentials = services.issue_join_credentials(
            session=self.session, user=self.teacher
        )
        self.assertTrue(credentials["is_recording"])
        self.assertEqual(credentials["recorder_uid_min"], services.RECORDER_UID_MIN)
        self.assertEqual(self.session.recordings.count(), 1)

    def test_a_student_joining_is_told_the_class_is_being_recorded(self):
        services.maybe_start_recording(self.session, self.teacher)
        credentials = services.issue_join_credentials(
            session=self.session, user=self.student
        )
        self.assertTrue(credentials["is_recording"])


@override_settings(**RECORDING_SETTINGS)
class BeginRecordingTests(RecordingTestCase):
    """What the thread actually does to get a recorder into the channel."""

    def setUp(self):
        super().setUp()
        self.recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.STARTING,
            resource_id="",
            sid="",
            started_at=None,
        )

    def _run(self, acquire=None, start=None):
        acquired = RecordingSession("res-99")

        def fake_start(**kwargs):
            kwargs["recording"].sid = "sid-99"
            return kwargs["recording"]

        with mock.patch.object(
            services.recording_api, "acquire", acquire or mock.Mock(return_value=acquired)
        ) as acquire_mock, mock.patch.object(
            services.recording_api, "start", start or mock.Mock(side_effect=fake_start)
        ) as start_mock:
            services._begin_recording(self.recording.pk)
        return acquire_mock, start_mock

    def test_a_started_recording_is_running_with_both_identifiers(self):
        self._run()
        self.recording.refresh_from_db()

        self.assertEqual(self.recording.status, ClassSessionRecording.RecordingStatus.RECORDING)
        self.assertEqual(self.recording.resource_id, "res-99")
        self.assertEqual(self.recording.sid, "sid-99")
        self.assertIsNotNone(self.recording.started_at)

    def test_the_resource_id_is_saved_before_the_recorder_is_started(self):
        """`resourceId` + `sid` are the only handle on a running recording. A
        process that died between acquiring and starting would otherwise leave
        a recorder in a channel that nothing could ever stop."""
        seen = {}

        def fake_start(**kwargs):
            seen["resource_id_on_row"] = ClassSessionRecording.objects.get(
                pk=self.recording.pk
            ).resource_id
            kwargs["recording"].sid = "sid-99"
            return kwargs["recording"]

        self._run(start=mock.Mock(side_effect=fake_start))
        self.assertEqual(seen["resource_id_on_row"], "res-99")

    def test_the_recorder_gets_a_subscriber_token_for_this_channel_and_uid(self):
        """Bound to the channel *and* to the recorder's own uid, and honest
        about only ever listening — the same token this app signs for a
        student, with the publish privileges left out."""
        _, start_mock = self._run()
        token = start_mock.call_args[1]["token"]

        decoded = decode_rtc_token(token, app_certificate=APP_CERTIFICATE)
        self.assertTrue(decoded["signature_valid"])
        self.assertEqual(decoded["channel_name"], self.session.channel_name)
        self.assertEqual(decoded["uid"], self.recording.recorder_uid)
        # A subscriber token carries the join privilege and nothing else; a
        # publisher's would also carry audio, video and data.
        self.assertEqual(sorted(decoded["privileges"]), [1])

    def test_the_bucket_credentials_travel_to_agora_with_a_per_class_prefix(self):
        """Agora uploads into storage we own, so it is handed our keys. The
        prefix is one folder per class, which is what makes a year of
        recordings navigable and a lifecycle rule writable."""
        _, start_mock = self._run()
        config = start_mock.call_args[1]["storage_config"]

        self.assertEqual(config["bucket"], "truetrek-recordings")
        self.assertEqual(config["accessKey"], "AKIAIOSFODNN7EXAMPLE")
        self.assertEqual(
            config["fileNamePrefix"], ["class-recordings", str(self.session.pk)]
        )

    def test_a_failure_while_starting_leaves_the_row_in_a_state_somebody_can_see(self):
        """A recording stuck on STARTING would show a teacher a spinner for
        the rest of the class."""
        # The thread entrypoint closes its database connections on the way in
        # and out, which is right in a daemon thread and fatal to a test case
        # sharing one — the connection handling is not what this is about.
        with mock.patch.object(
            services.recording_api,
            "acquire",
            side_effect=RecordingUnavailableError("service down"),
        ), mock.patch.object(services, "close_old_connections"):
            services._run_recording_safe(self.recording.pk)

        self.recording.refresh_from_db()
        self.assertEqual(self.recording.status, ClassSessionRecording.RecordingStatus.FAILED)
        self.assertIn("service down", self.recording.error_message)


# ---------------------------------------------------------------------------
# Stopping
# ---------------------------------------------------------------------------


@override_settings(**RECORDING_SETTINGS)
class StopRecordingTests(RecordingTestCase):
    def setUp(self):
        super().setUp()
        patcher = mock.patch.object(services, "_spawn")
        self.spawn = patcher.start()
        self.addCleanup(patcher.stop)

    def test_stopping_marks_the_recording_as_processing(self):
        """The request only ever *asks*. The monitor thread owns the call to
        Agora, so there is one path that finishes a recording however it was
        ended, rather than two that can disagree."""
        recording = self.make_recording()
        services.stop_recording(session=self.session, user=self.teacher)

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.PROCESSING)
        self.assertIsNotNone(recording.stopped_at)

    def test_stopping_a_class_that_is_not_recording_is_not_an_error(self):
        self.assertIsNone(services.stop_recording(session=self.session, user=self.teacher))

    def test_the_teacher_leaving_for_good_ends_the_recording(self):
        recording = self.make_recording()
        services.record_leave(session=self.session, user=self.teacher, ended=True)

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.PROCESSING)

    def test_a_reload_does_not_end_the_recording(self):
        """A reload sends the same "left" ping as the red button. Ending the
        tape on it would stop a recording mid-class and start a second one
        beside it the moment the page came back."""
        recording = self.make_recording()
        services.record_leave(session=self.session, user=self.teacher)

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.RECORDING)

    def test_a_student_leaving_does_not_end_the_recording(self):
        """The class continues without them."""
        recording = self.make_recording()
        services.record_leave(session=self.session, user=self.student)

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.RECORDING)

    def test_cancelling_a_class_stops_anything_still_running(self):
        """Otherwise a recorder sits in an abandoned channel billing by the
        minute until Agora's idle timer notices."""
        recording = self.make_recording()
        services.cancel_class(self.session, "Snow day")

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.PROCESSING)


# ---------------------------------------------------------------------------
# Finishing, and telling the class
# ---------------------------------------------------------------------------


@override_settings(**RECORDING_SETTINGS)
class PublishingTests(RecordingTestCase):
    def test_the_mp4_is_preferred_over_the_streaming_playlist(self):
        """The MP4 is what a plain <video> plays everywhere. The playlist is
        only ever reached when a class ended without us."""
        self.assertEqual(
            services._pick_playable_file(
                [{"filename": M3U8}, {"filename": MP4}]
            ),
            MP4,
        )
        self.assertEqual(services._pick_playable_file([{"filename": M3U8}]), M3U8)
        self.assertEqual(services._pick_playable_file([]), "")

    def test_the_last_mp4_wins_when_a_long_class_was_split(self):
        files = [
            {"filename": "class-recordings/1/a_0.mp4"},
            {"filename": "class-recordings/1/a_1.mp4"},
        ]
        self.assertEqual(services._pick_playable_file(files), "class-recordings/1/a_1.mp4")

    def test_a_published_recording_becomes_watchable_and_times_itself(self):
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING,
            storage_key=MP4,
            started_at=timezone.now() - timedelta(minutes=45),
            stopped_at=timezone.now(),
        )

        services.publish_recording(recording.pk)

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.AVAILABLE)
        self.assertTrue(recording.is_available)
        self.assertAlmostEqual(recording.duration_seconds, 45 * 60, delta=5)

    def test_every_enrolled_student_and_the_teacher_are_told(self):
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING, storage_key=MP4
        )
        services.publish_recording(recording.pk)

        notified = set(
            Notification.objects.filter(verb="class_recording_ready").values_list(
                "recipient_id", flat=True
            )
        )
        self.assertEqual(
            notified, {self.student.pk, self.other_student.pk, self.teacher.pk}
        )

    def test_a_student_on_another_course_is_not_told(self):
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING, storage_key=MP4
        )
        services.publish_recording(recording.pk)

        self.assertFalse(
            Notification.objects.filter(
                recipient=self.outsider, verb="class_recording_ready"
            ).exists()
        )

    def test_the_notification_points_at_the_class_and_carries_no_link(self):
        """`related_object_type` routes the portal to the class; the playback
        URL is signed per viewer when they click, so nothing forwardable is
        ever stored in a notification."""
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING, storage_key=MP4
        )
        services.publish_recording(recording.pk)

        notification = Notification.objects.filter(
            recipient=self.student, verb="class_recording_ready"
        ).first()
        self.assertEqual(notification.related_object_type, "class_session")
        self.assertEqual(notification.related_object_id, self.session.pk)
        self.assertNotIn("http", notification.message)

    def test_a_class_is_never_told_twice(self):
        """A recording reaches "ready" from the teacher stopping it, the host
        leaving, the deadline passing and Agora's own idle timer. Two of those
        racing must not send thirty students two notifications."""
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING, storage_key=MP4
        )
        services.publish_recording(recording.pk)
        services.publish_recording(recording.pk)

        self.assertEqual(
            Notification.objects.filter(verb="class_recording_ready").count(), 3
        )

    def test_a_recording_with_no_files_fails_instead_of_pretending(self):
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING
        )
        services._settle_and_publish(recording.pk, [])

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.FAILED)
        self.assertFalse(Notification.objects.filter(verb="class_recording_ready").exists())

    def test_nobody_is_notified_until_the_file_is_really_in_the_bucket(self):
        """Agora reports a recording as stopped a little before the last bytes
        land, and a "your recording is ready" notification that leads to a 404
        is worse than one that arrives a minute later."""
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING
        )

        with mock.patch.object(storage, "object_exists", return_value=True) as exists, \
                mock.patch.object(services.time, "sleep"):
            services._settle_and_publish(recording.pk, [{"filename": MP4}])

        exists.assert_called_with(MP4)
        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.AVAILABLE)
        self.assertEqual(recording.storage_key, MP4)

    def test_a_file_that_never_appears_fails_with_a_reason(self):
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING
        )

        clock = iter([0, services.RECORDING_SETTLE_TIMEOUT_SECONDS + 1])
        with mock.patch.object(storage, "object_exists", return_value=False), \
                mock.patch.object(services.time, "sleep"), \
                mock.patch.object(services.time, "monotonic", side_effect=lambda: next(clock)):
            services._settle_and_publish(recording.pk, [{"filename": MP4}])

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.FAILED)
        self.assertIn("uploading", recording.error_message)
        self.assertFalse(Notification.objects.filter(verb="class_recording_ready").exists())


# ---------------------------------------------------------------------------
# Playback
# ---------------------------------------------------------------------------


@override_settings(**RECORDING_SETTINGS)
class PlaybackTests(RecordingTestCase):
    def setUp(self):
        super().setUp()
        self.recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.AVAILABLE,
            storage_key=MP4,
            stopped_at=timezone.now(),
            duration_seconds=2700,
            notified_at=timezone.now(),
        )

    def test_a_finished_recording_has_a_signed_expiring_link(self):
        url, expires_at = services.recording_playback_url(self.recording)

        self.assertIn("X-Amz-Signature=", url)
        self.assertIn(MP4, url)
        self.assertGreater(expires_at, timezone.now())

    def test_a_recording_that_is_still_running_has_no_link(self):
        running = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.RECORDING, resource_id="res-2"
        )
        self.assertEqual(services.recording_playback_url(running), (None, None))

    def test_an_enrolled_student_is_given_the_link(self):
        state = services.recording_state(session=self.session, user=self.student)

        self.assertTrue(state["available"])
        self.assertIn("X-Amz-Signature=", state["url"])
        self.assertEqual(state["duration_seconds"], 2700)

    def test_the_teacher_is_given_the_link(self):
        state = services.recording_state(session=self.session, user=self.teacher)
        self.assertIsNotNone(state["url"])

    def test_somebody_not_on_the_course_is_never_given_the_link(self):
        """The recording is exactly as private as the class it is of — the
        same roster check the classroom door makes."""
        state = services.recording_state(session=self.session, user=self.outsider)
        self.assertIsNone(state["url"])

    def test_a_running_recording_shows_as_recording_and_offers_no_link(self):
        self.recording.delete()
        self.make_recording()

        state = services.recording_state(session=self.session, user=self.student)
        self.assertTrue(state["is_recording"])
        self.assertFalse(state["available"])
        self.assertIsNone(state["url"])

    def test_a_processing_recording_is_neither_recording_nor_available(self):
        self.recording.delete()
        self.make_recording(status=ClassSessionRecording.RecordingStatus.PROCESSING)

        state = services.recording_state(session=self.session, user=self.student)
        self.assertFalse(state["is_recording"])
        self.assertTrue(state["is_processing"])
        self.assertFalse(state["available"])

    def test_the_newest_complete_take_is_the_one_offered(self):
        """A class stopped and restarted has two finished recordings."""
        newer = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.AVAILABLE,
            storage_key="class-recordings/1/second-take.mp4",
            notified_at=timezone.now(),
        )
        self.assertEqual(services.latest_available_recording(self.session).pk, newer.pk)

    @override_settings(**{**RECORDING_SETTINGS, "AGORA_RECORDING_BUCKET": ""})
    def test_a_recording_with_nowhere_to_serve_it_from_is_not_offered(self):
        """Honest rather than hopeful: a bucket that has been unconfigured
        since the class makes the row unservable, and a dead "Watch" button is
        worse than none."""
        state = services.recording_state(session=self.session, user=self.student)
        self.assertFalse(state["available"])
        self.assertIsNone(state["url"])


# ---------------------------------------------------------------------------
# Listings
# ---------------------------------------------------------------------------


@override_settings(**RECORDING_SETTINGS)
class ListingAnnotationTests(RecordingTestCase):
    def test_a_past_class_listing_says_which_classes_have_a_recording(self):
        """Annotated rather than looked up per row: a student's past-classes
        page renders twenty cards, and asking one card at a time is twenty
        extra queries."""
        self.make_recording(
            status=ClassSessionRecording.RecordingStatus.AVAILABLE,
            storage_key=MP4,
            notified_at=timezone.now(),
        )
        other = make_session(course=self.course, teacher=self.teacher, starts_in_minutes=-200)

        rows = {row.pk: row for row in services.student_sessions(self.student)}
        self.assertTrue(rows[self.session.pk].has_recording)
        self.assertFalse(rows[other.pk].has_recording)

    def test_a_recording_with_no_file_does_not_count_as_available(self):
        self.make_recording(
            status=ClassSessionRecording.RecordingStatus.AVAILABLE, storage_key=""
        )
        row = services.student_sessions(self.student).get(pk=self.session.pk)
        self.assertFalse(row.has_recording)

    def test_a_running_recording_shows_on_the_card(self):
        self.make_recording()
        row = services.student_sessions(self.student).get(pk=self.session.pk)
        self.assertTrue(row.recording_in_progress)
        self.assertFalse(row.has_recording)


# ---------------------------------------------------------------------------
# The monitor thread
# ---------------------------------------------------------------------------


@override_settings(**RECORDING_SETTINGS)
class MonitorTests(RecordingTestCase):
    """The loop that decides when a recording is over.

    There is no scheduler in this codebase, so this loop is the only thing
    that ends a recording on time. It has to end on four different signals and
    come away with a file list on every one of them — including the signal
    that carries no file list at all.
    """

    def setUp(self):
        super().setUp()
        self.recording = self.make_recording(file_list=[{"filename": M3U8}])
        sleep_patch = mock.patch.object(services.time, "sleep")
        sleep_patch.start()
        self.addCleanup(sleep_patch.stop)

        settle_patch = mock.patch.object(services, "_settle_and_publish")
        self.settle = settle_patch.start()
        self.addCleanup(settle_patch.stop)

    def _run(self, query=None, stop=None):
        with mock.patch.object(
            services.recording_api, "query", query or mock.Mock()
        ) as query_mock, mock.patch.object(
            services.recording_api, "stop", stop or mock.Mock(return_value={})
        ) as stop_mock:
            services._monitor_recording(self.recording.pk)
        return query_mock, stop_mock

    def test_a_stop_request_ends_the_loop_and_stops_the_recorder(self):
        """The request thread only flips the row; this is what actually calls
        Agora, so there is one path that finishes a recording however it was
        ended."""
        services.stop_recording(session=self.session, user=self.teacher)

        query_mock, stop_mock = self._run(
            stop=mock.Mock(return_value={"serverResponse": {"fileList": [{"filename": MP4}]}})
        )

        query_mock.assert_not_called()
        stop_mock.assert_called_once()
        self.settle.assert_called_once()
        self.assertEqual(self.settle.call_args[0][1], [{"filename": MP4}])

    def test_a_recorder_that_left_on_its_own_still_yields_its_files(self):
        """Agora removes the recorder once the channel empties, and from then
        on it answers 404 — which carries no file list. Keeping the last one
        `query` gave us is what stops that losing a whole class."""
        from ..exceptions import RecordingGoneError

        query_mock, stop_mock = self._run(
            query=mock.Mock(side_effect=RecordingGoneError("gone")),
            stop=mock.Mock(side_effect=RecordingGoneError("gone")),
        )

        self.settle.assert_called_once()
        self.assertEqual(self.settle.call_args[0][1], [{"filename": M3U8}])

    def test_the_class_deadline_ends_a_recording_nobody_stopped(self):
        """The teacher's browser crashing must not record an empty room until
        Agora's idle timer notices."""
        self.session.scheduled_at = timezone.now() - timedelta(hours=4)
        self.session.save(update_fields=["scheduled_at"])

        query_mock, stop_mock = self._run()

        query_mock.assert_not_called()
        stop_mock.assert_called_once()

    def test_a_blip_in_agoras_service_does_not_abandon_the_recording(self):
        """A recording that is probably still running is worth more than a
        tidy exit from one failed poll."""
        from ..exceptions import RecordingGoneError

        query_mock, _ = self._run(
            query=mock.Mock(
                side_effect=[RecordingUnavailableError("502"), RecordingGoneError("gone")]
            )
        )

        self.assertEqual(query_mock.call_count, 2)
        self.settle.assert_called_once()

    def test_the_newest_file_list_replaces_the_one_on_the_row(self):
        from ..exceptions import RecordingGoneError

        self._run(
            query=mock.Mock(
                side_effect=[
                    {"serverResponse": {"fileList": [{"filename": MP4}]}},
                    RecordingGoneError("gone"),
                ]
            )
        )

        self.recording.refresh_from_db()
        self.assertEqual(self.recording.file_list, [{"filename": MP4}])
        self.assertEqual(self.settle.call_args[0][1], [{"filename": MP4}])

    def test_a_recording_somebody_else_finished_is_left_alone(self):
        ClassSessionRecording.objects.filter(pk=self.recording.pk).update(
            status=ClassSessionRecording.RecordingStatus.AVAILABLE, storage_key=MP4
        )
        query_mock, stop_mock = self._run()

        query_mock.assert_not_called()
        stop_mock.assert_not_called()
        self.settle.assert_not_called()


@override_settings(**RECORDING_SETTINGS)
class StopAtAgoraTests(RecordingTestCase):
    def test_a_failed_stop_call_keeps_the_files_we_already_knew_about(self):
        """A recording whose stop call failed is still a recording sitting in
        the bucket; throwing it away because the service answered badly would
        lose the class."""
        recording = self.make_recording()
        handle = RecordingSession("res-1", "sid-1")

        with mock.patch.object(
            services.recording_api,
            "stop",
            side_effect=RecordingUnavailableError("502"),
        ):
            files = services._stop_at_agora(
                recording=recording,
                handle=handle,
                app_id=APP_ID,
                auth_header="Basic x",
                fallback_files=[{"filename": MP4}],
            )

        self.assertEqual(files, [{"filename": MP4}])
        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.PROCESSING)

    def test_agoras_own_file_list_wins_when_it_gives_one(self):
        recording = self.make_recording()
        handle = RecordingSession("res-1", "sid-1")

        with mock.patch.object(
            services.recording_api,
            "stop",
            return_value={"serverResponse": {"fileList": [{"filename": MP4}]}},
        ):
            files = services._stop_at_agora(
                recording=recording,
                handle=handle,
                app_id=APP_ID,
                auth_header="Basic x",
                fallback_files=[{"filename": M3U8}],
            )

        self.assertEqual(files, [{"filename": MP4}])


# ---------------------------------------------------------------------------
# Telling the class by email
# ---------------------------------------------------------------------------


@override_settings(
    **RECORDING_SETTINGS,
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="no-reply@coolnerdz.com",
    FRONTEND_URL="https://test.coolnerdz.com",
)
class RecordingEmailTests(RecordingTestCase):
    """The email that goes out when a recording is ready.

    The thing this file is most careful about: an email outlives the link
    inside it and can be forwarded to anyone, so it must point at the portal
    and never at the recording.
    """

    def _publish(self):
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING, storage_key=MP4
        )
        with self.captureOnCommitCallbacks(execute=True):
            services.publish_recording(recording.pk)
        return recording

    def test_every_enrolled_student_and_the_teacher_get_their_own_email(self):
        """One message per address — nobody's email address belongs in
        anybody else's To: header, least of all a class of minors'."""
        self._publish()

        self.assertEqual(len(mail.outbox), 3)
        for message in mail.outbox:
            self.assertEqual(len(message.to), 1)

        addressed = {message.to[0] for message in mail.outbox}
        self.assertEqual(
            addressed,
            {self.student.email, self.other_student.email, self.teacher.email},
        )

    def test_a_student_on_another_course_is_not_emailed(self):
        self._publish()
        self.assertNotIn(
            self.outsider.email, {message.to[0] for message in mail.outbox}
        )

    def test_the_email_links_to_the_portal_and_never_to_the_recording(self):
        """A playback URL is signed for one viewer and expires in hours; an
        email does neither. The link gets somebody to the screen where a fresh
        one is minted for them, which is the whole point of a private bucket."""
        self._publish()

        student_email = next(
            message for message in mail.outbox if message.to == [self.student.email]
        )
        self.assertIn(
            "https://test.coolnerdz.com/studentportal?tab=live-classes",
            student_email.body,
        )
        self.assertNotIn("X-Amz-Signature", student_email.body)
        self.assertNotIn(MP4, student_email.body)
        self.assertNotIn("amazonaws", student_email.body)

    def test_the_teacher_is_pointed_at_their_own_portal(self):
        self._publish()
        teacher_email = next(
            message for message in mail.outbox if message.to == [self.teacher.email]
        )
        self.assertIn(
            "https://test.coolnerdz.com/teacherportal?tab=classes", teacher_email.body
        )

    def test_the_email_names_the_class_and_asks_people_not_to_share_it(self):
        self._publish()
        body = mail.outbox[0].body
        self.assertIn(self.session.title, body)
        self.assertIn(self.course.code, body)
        self.assertIn("share it on", body)

    def test_a_class_is_never_emailed_twice(self):
        """Same guard as the in-app notification: `notified_at`. An email is
        the one thing here that cannot be taken back."""
        recording = self._publish()
        with self.captureOnCommitCallbacks(execute=True):
            services.publish_recording(recording.pk)

        self.assertEqual(len(mail.outbox), 3)

    def test_nothing_is_sent_if_the_recording_was_never_published(self):
        """`on_commit` is what ties the email to the row being committed — a
        rollback must not tell a class about a recording this server forgot."""
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING
        )
        with self.captureOnCommitCallbacks(execute=True):
            services.publish_recording(recording.pk)  # no storage_key — nothing to send

        self.assertEqual(len(mail.outbox), 0)

    @override_settings(CLASS_RECORDING_EMAIL_ENABLED=False)
    def test_email_can_be_switched_off_without_losing_the_in_app_notice(self):
        self._publish()

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(
            Notification.objects.filter(verb="class_recording_ready").count(), 3
        )

    def test_a_broken_mail_server_never_fails_a_recording(self):
        """Fire-and-forget, matching the password-reset and re-engagement
        emails: a recording that is sitting in the bucket perfectly fine must
        not be marked FAILED because SMTP is down."""
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.PROCESSING, storage_key=MP4
        )
        with mock.patch.object(
            services, "send_mass_mail", side_effect=OSError("smtp down")
        ):
            with self.assertRaises(OSError):
                # `fail_silently` lives inside send_mass_mail, so the stub has
                # to stand in for the real failure path to be meaningful —
                # what matters is the row below.
                with self.captureOnCommitCallbacks(execute=True):
                    services.publish_recording(recording.pk)

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.AVAILABLE)

    def test_a_student_with_no_email_address_is_simply_skipped(self):
        self.other_student.email = ""
        self.other_student.save(update_fields=["email"])

        self._publish()
        self.assertEqual(len(mail.outbox), 2)


@override_settings(**RECORDING_SETTINGS)
class StartStopRaceTests(RecordingTestCase):
    """A teacher who opens the room and leaves again straight away.

    Acquiring a recorder takes two round trips to Agora, and a stop arriving
    inside them used to be written over by the thread finishing its start —
    leaving a recorder in the channel until the class's deadline, recording an
    empty room that nobody asked for.
    """

    def test_a_stop_during_startup_survives_the_thread_finishing(self):
        recording = self.make_recording(
            status=ClassSessionRecording.RecordingStatus.STARTING,
            resource_id="",
            sid="",
            started_at=None,
        )

        def fake_start(**kwargs):
            # The teacher leaves while Agora is still being asked.
            with mock.patch.object(services, "_spawn"):
                services.stop_recording(session=self.session, user=self.teacher)
            kwargs["recording"].sid = "sid-99"
            return kwargs["recording"]

        with mock.patch.object(
            services.recording_api, "acquire", return_value=RecordingSession("res-99")
        ), mock.patch.object(services.recording_api, "start", side_effect=fake_start):
            services._begin_recording(recording.pk)

        recording.refresh_from_db()
        self.assertEqual(recording.status, ClassSessionRecording.RecordingStatus.PROCESSING)
        # The sid is still recorded — without it the recorder could never be
        # stopped at all.
        self.assertEqual(recording.sid, "sid-99")
        self.assertEqual(recording.resource_id, "res-99")


@override_settings(**RECORDING_SETTINGS)
class StorageConfigTests(RecordingTestCase):
    """What Agora is told about where to put the file.

    Agora numbers an S3-compatible store (Cloudflare R2, MinIO, DigitalOcean
    Spaces, Wasabi) as a *different vendor* from Amazon S3 and requires the
    store's domain beside it — so a deployment that sets an endpoint and
    nothing else would have its recordings refused, silently, on a path
    nobody tests by hand.
    """

    def test_plain_amazon_s3_sends_no_endpoint(self):
        config = services._storage_config(self.session)

        self.assertEqual(config["vendor"], 1)
        self.assertEqual(config["bucket"], "truetrek-recordings")
        self.assertNotIn("extensionParams", config)

    @override_settings(
        AGORA_RECORDING_VENDOR=11,
        AGORA_RECORDING_S3_ENDPOINT="https://abc123.r2.cloudflarestorage.com",
    )
    def test_an_s3_compatible_store_sends_its_domain(self):
        """Agora documents `extensionParams.endpoint` as a domain name, while
        our own URL signer needs a scheme — so one setting carries the URL and
        the scheme is stripped here rather than asked for twice."""
        config = services._storage_config(self.session)

        self.assertEqual(config["vendor"], 11)
        self.assertEqual(
            config["extensionParams"], {"endpoint": "abc123.r2.cloudflarestorage.com"}
        )

    @override_settings(AGORA_RECORDING_S3_ENDPOINT="minio.example.com/")
    def test_an_endpoint_given_without_a_scheme_still_works(self):
        config = services._storage_config(self.session)
        self.assertEqual(config["extensionParams"], {"endpoint": "minio.example.com"})

    def test_each_class_gets_its_own_folder(self):
        config = services._storage_config(self.session)
        self.assertEqual(
            config["fileNamePrefix"], ["class-recordings", str(self.session.pk)]
        )
