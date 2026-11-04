"""AI meeting notes: the lifecycle, and the five things it must never do.

Notes are the second feature here that spends money, runs on somebody else's
infrastructure, outlives the request that started it and ends by telling a
roomful of students to go and read something. They are also the first that is
*adjacent* to one that already does all of that, which is where most of the
risk lives:

* **It must never break a class** — nor a recording. Starting is wired into
  the host's join and stopping into their leave, beside the recorder's, so a
  transcription service that is down, unconfigured or switched off has to be
  invisible from inside the classroom and from the recording.
* **It must never be entangled with recording.** Different Agora product,
  different switch, different row: a class can be written up and not filmed,
  or filmed and not written up, and one failing must not touch the other.
* **It must never bill twice.** Two co-instructors arriving in the same second
  must not put two bots in one channel, and an adopted run must not pay for a
  second model call over a transcript it already has.
* **It must never notify twice.** Notes reach "ready" from four directions and
  thirty students must hear about it once.
* **It must never hand the transcript to a student.** The write-up is for the
  class; the verbatim record of who said what is for the teacher.
"""

import json
from datetime import timedelta
from unittest import mock

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone

from ai_courses.providers.base import ProviderResult, ProviderTransportError
from notifications.models import Notification

from .. import services
from ..exceptions import NotesNotConfiguredError, NotesUnavailableError
from ..models import ClassSession, ClassSessionNotes, ClassSessionRecording
from ..transcription_api import TranscriptionAgent
from .factories import assign_teacher, enrol, make_course, make_session, make_user

APP_ID = "a" * 32
APP_CERTIFICATE = "b" * 32

NOTES_SETTINGS = dict(
    AGORA_APP_ID=APP_ID,
    AGORA_APP_CERTIFICATE=APP_CERTIFICATE,
    CLASS_NOTES_ENABLED=True,
    CLASS_NOTES_LANGUAGES="en-US",
    CLASS_NOTES_EMAIL_ENABLED=True,
    AGORA_CUSTOMER_ID="",
    AGORA_CUSTOMER_SECRET="",
    AGORA_STT_CUSTOMER_ID="",
    AGORA_STT_CUSTOMER_SECRET="",
    AGORA_RECORDING_CUSTOMER_ID="customer",
    AGORA_RECORDING_CUSTOMER_SECRET="secret",
    AGORA_RECORDING_BUCKET="truetrek-recordings",
    AGORA_RECORDING_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE",
    AGORA_RECORDING_SECRET_KEY="wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
    AGORA_RECORDING_S3_REGION="us-east-1",
    AGORA_RECORDING_S3_ENDPOINT="",
    AGORA_RECORDING_VENDOR=1,
    AGORA_RECORDING_STORAGE_REGION=0,
    AI_PROVIDER="gemini",
    GEMINI_API_KEY="key",
)

MODEL_ANSWER = {
    "has_content": True,
    "title": "Database Normalization",
    "summary": "The class covered first and second normal form.",
    "key_topics": ["First normal form", "Second normal form"],
    "important_points": [
        {"point": "1NF removes repeating groups", "detail": "One value per cell."}
    ],
    "action_items": [
        {"task": "Complete the exercises", "owner": "All students", "due": "Friday"}
    ],
    "next_class": "Third normal form.",
}


class NotesTestCase(TestCase):
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

    def make_notes(self, **kwargs):
        kwargs.setdefault("status", ClassSessionNotes.NotesStatus.TRANSCRIBING)
        kwargs.setdefault("bot_uid", 3_500_000_000)
        kwargs.setdefault("agent_id", "ag-1")
        kwargs.setdefault("agent_name", "cls1n1abc")
        kwargs.setdefault("storage_prefix", "classnotes/1/1/")
        kwargs.setdefault("started_at", timezone.now() - timedelta(minutes=10))
        return ClassSessionNotes.objects.create(session=self.session, **kwargs)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


class ConfigurationTests(NotesTestCase):
    @override_settings(**NOTES_SETTINGS)
    def test_a_fully_configured_server_can_take_notes(self):
        self.assertTrue(services.is_notes_configured())

    @override_settings(
        **{
            **NOTES_SETTINGS,
            "AGORA_CUSTOMER_ID": "account",
            "AGORA_CUSTOMER_SECRET": "account-secret",
            "AGORA_RECORDING_CUSTOMER_ID": "",
            "AGORA_RECORDING_CUSTOMER_SECRET": "",
        }
    )
    def test_the_account_key_is_all_that_normally_needs_setting(self):
        """There is one RESTful key per Agora account and every REST product
        uses it, so `AGORA_CUSTOMER_ID` / `_SECRET` alone has to be enough for
        both recording and notes."""
        self.assertEqual(services._stt_customer_key(), ("account", "account-secret"))
        self.assertEqual(
            services._recording_customer_key(), ("account", "account-secret")
        )

    @override_settings(**NOTES_SETTINGS)
    def test_an_older_env_that_only_named_recordings_key_still_works(self):
        """The pair was named after recording before transcription existed."""
        self.assertEqual(services._stt_customer_key(), ("customer", "secret"))

    @override_settings(
        **{
            **NOTES_SETTINGS,
            "AGORA_CUSTOMER_ID": "account",
            "AGORA_CUSTOMER_SECRET": "account-secret",
            "AGORA_RECORDING_CUSTOMER_ID": "",
            "AGORA_RECORDING_CUSTOMER_SECRET": "",
            "AGORA_STT_CUSTOMER_ID": "stt",
            "AGORA_STT_CUSTOMER_SECRET": "stt-secret",
        }
    )
    def test_a_transcription_only_key_wins_without_touching_recordings(self):
        """The reason the per-product names exist at all: revoking one
        product's access must not switch the other off."""
        self.assertEqual(services._stt_customer_key(), ("stt", "stt-secret"))
        self.assertEqual(
            services._recording_customer_key(), ("account", "account-secret")
        )

    @override_settings(
        **{
            **NOTES_SETTINGS,
            "AGORA_CUSTOMER_ID": "account",
            "AGORA_CUSTOMER_SECRET": "account-secret",
            "AGORA_STT_CUSTOMER_ID": "stt",
            "AGORA_STT_CUSTOMER_SECRET": "",
        }
    )
    def test_a_half_filled_override_never_shadows_a_working_key(self):
        """Taking the id without the secret would fail as "the service
        rejected these credentials" and send somebody looking at Agora
        rather than at their own .env."""
        self.assertEqual(services._stt_customer_key(), ("account", "account-secret"))

    @override_settings(**{**NOTES_SETTINGS, "GEMINI_API_KEY": ""})
    def test_no_ai_provider_means_no_notes(self):
        """A class transcribed with nothing to summarise it is a bill for
        nothing, so this is refused before the transcription starts rather
        than after it finishes."""
        self.assertFalse(services.is_notes_configured())
        with self.assertRaises(NotesNotConfiguredError):
            services._notes_credentials()

    @override_settings(**{**NOTES_SETTINGS, "AGORA_RECORDING_BUCKET": ""})
    def test_no_bucket_means_no_notes(self):
        """Agora writes the captions into storage we own."""
        self.assertFalse(services.is_notes_configured())

    @override_settings(**{**NOTES_SETTINGS, "CLASS_NOTES_ENABLED": False})
    def test_the_deployment_wide_switch_turns_it_off(self):
        self.assertFalse(services.is_notes_configured())

    @override_settings(**{**NOTES_SETTINGS, "AGORA_RECORDING_ENABLED": False})
    def test_switching_recording_off_does_not_switch_notes_off(self):
        """The whole point of the separation: a deployment that will not pay
        for video still gets its classes written up."""
        self.assertTrue(services.is_notes_configured())
        self.assertFalse(services.is_recording_configured())

    @override_settings(**{**NOTES_SETTINGS, "AGORA_APP_CERTIFICATE": ""})
    def test_notes_need_the_rtc_credentials_too(self):
        """The bot joins the channel like anybody else and so needs a token
        signed by the App Certificate."""
        self.assertFalse(services.is_notes_configured())

    @override_settings(**{**NOTES_SETTINGS, "AGORA_RECORDING_CUSTOMER_SECRET": ""})
    def test_the_missing_setting_is_named_in_the_log_not_the_message(self):
        with self.assertRaises(NotesNotConfiguredError) as caught:
            services._notes_credentials()
        self.assertNotIn("CUSTOMER_SECRET", str(caught.exception))

    @override_settings(**{**NOTES_SETTINGS, "CLASS_NOTES_LANGUAGES": ""})
    def test_an_empty_language_list_falls_back_rather_than_sending_none(self):
        self.assertEqual(services.notes_languages(), ["en-US"])

    @override_settings(
        **{**NOTES_SETTINGS, "CLASS_NOTES_LANGUAGES": "en-US, es-ES ,fr-FR,de-DE,ja-JP"}
    )
    def test_more_than_four_languages_are_clamped_not_passed_through(self):
        """Agora refuses the whole request when given more than four, which
        would read as "transcription is broken" rather than as a typo."""
        self.assertEqual(
            services.notes_languages(), ["en-US", "es-ES", "fr-FR", "de-DE"]
        )


class BotUidTests(NotesTestCase):
    def test_a_bot_uid_can_never_collide_with_a_user_or_with_the_recorder(self):
        """Uids in a class channel *are* `user.pk`, and two Agora bots can be
        in one channel at once — a collision is a bot Agora refuses to admit,
        and the only symptom is a class with no notes."""
        for _ in range(50):
            uid = services._new_notes_bot_uid()
            self.assertTrue(services.is_notes_bot_uid(uid))
            self.assertFalse(services.is_recorder_uid(uid))
            self.assertTrue(services.is_service_uid(uid))

        for _ in range(50):
            uid = services._new_recorder_uid()
            self.assertFalse(services.is_notes_bot_uid(uid))
            self.assertTrue(services.is_service_uid(uid))

    def test_a_real_user_is_never_a_bot(self):
        self.assertFalse(services.is_service_uid(self.student.pk))
        self.assertFalse(services.is_notes_bot_uid(None))
        self.assertFalse(services.is_notes_bot_uid("not a uid"))

    def test_the_uid_fits_in_the_32_bits_an_agora_token_allows(self):
        self.assertLess(services.NOTES_BOT_UID_MAX, 2**32)


class StoragePrefixTests(NotesTestCase):
    def test_every_prefix_segment_is_letters_and_digits_only(self):
        """Agora's transcription API rejects a prefix segment containing
        anything else — a rule Cloud Recording does not share, so copying its
        "class-recordings" hyphen here is a 400 with nothing in it that says
        why."""
        notes = self.make_notes()
        parts, prefix = services._notes_storage_prefix(self.session, notes)

        for part in parts:
            self.assertTrue(part.isalnum(), part)
        self.assertEqual(prefix, "/".join(parts) + "/")

    def test_each_run_gets_a_folder_of_its_own(self):
        """A class transcribed twice must never read the other run's words."""
        first = self.make_notes(status=ClassSessionNotes.NotesStatus.FAILED)
        second = self.make_notes()
        self.assertNotEqual(
            services._notes_storage_prefix(self.session, first)[1],
            services._notes_storage_prefix(self.session, second)[1],
        )

    def test_an_agent_name_is_unique_across_runs_and_environments(self):
        """Agora refuses a `name` it has seen before, forever — including one
        a staging server used first."""
        notes = self.make_notes()
        names = {services._new_agent_name(self.session, notes) for _ in range(20)}
        self.assertEqual(len(names), 20)
        for name in names:
            self.assertTrue(name.isalnum())
            self.assertLessEqual(len(name), 64)


# ---------------------------------------------------------------------------
# Starting and stopping
# ---------------------------------------------------------------------------


@override_settings(**NOTES_SETTINGS)
class StartNotesTests(NotesTestCase):
    def setUp(self):
        super().setUp()
        patcher = mock.patch.object(services, "_spawn")
        self.spawn = patcher.start()
        self.addCleanup(patcher.stop)

    def test_starting_creates_one_row_and_hands_it_to_a_thread(self):
        notes = services.start_notes(session=self.session, user=self.teacher)

        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.STARTING)
        self.assertEqual(notes.started_by, self.teacher)
        self.assertTrue(services.is_notes_bot_uid(notes.bot_uid))
        self.spawn.assert_called_once_with(services._run_notes_safe, notes.pk)

    def test_starting_twice_returns_the_same_run(self):
        """Two co-instructors arriving in the same second must not put two
        bots in one channel."""
        first = services.start_notes(session=self.session, user=self.teacher)
        second = services.start_notes(session=self.session, user=self.teacher)

        self.assertEqual(first.pk, second.pk)
        self.assertEqual(self.session.notes_runs.count(), 1)

    def test_a_class_set_not_to_take_notes_refuses(self):
        self.session.takes_notes = False
        self.session.save(update_fields=["takes_notes"])

        with self.assertRaises(NotesNotConfiguredError):
            services.start_notes(session=self.session, user=self.teacher)
        self.assertEqual(self.session.notes_runs.count(), 0)

    def test_a_cancelled_class_refuses(self):
        self.session.status = ClassSession.SessionStatus.CANCELLED
        self.session.save(update_fields=["status"])

        with self.assertRaises(NotesNotConfiguredError):
            services.start_notes(session=self.session, user=self.teacher)

    @override_settings(**{**NOTES_SETTINGS, "CLASS_NOTES_ENABLED": False})
    def test_a_misconfigured_server_leaves_no_failed_rows_behind(self):
        """Checked before the row is written, so a server with no
        transcription credentials does not accumulate a FAILED run on every
        teacher join."""
        with self.assertRaises(NotesNotConfiguredError):
            services.start_notes(session=self.session, user=self.teacher)
        self.assertEqual(self.session.notes_runs.count(), 0)


@override_settings(**NOTES_SETTINGS)
class StopNotesTests(NotesTestCase):
    def setUp(self):
        super().setUp()
        patcher = mock.patch.object(services, "_spawn")
        self.spawn = patcher.start()
        self.addCleanup(patcher.stop)

    def test_stopping_asks_rather_than_acting(self):
        """The thread owns the call to Agora, so there is one path that
        finishes a run however it was ended."""
        notes = self.make_notes()
        stopped = services.stop_notes(session=self.session, user=self.teacher)

        self.assertEqual(stopped.status, ClassSessionNotes.NotesStatus.COLLECTING)
        self.assertIsNotNone(stopped.stopped_at)

    def test_stopping_a_class_that_is_not_taking_notes_is_not_an_error(self):
        self.assertIsNone(services.stop_notes(session=self.session, user=self.teacher))

    def test_stopping_twice_does_not_move_the_row_backwards(self):
        notes = self.make_notes()
        first = services.stop_notes(session=self.session, user=self.teacher)
        second = services.stop_notes(session=self.session, user=self.teacher)
        self.assertEqual(first.stopped_at, second.stopped_at)


@override_settings(**NOTES_SETTINGS)
class ClassroomIntegrationTests(NotesTestCase):
    """The part that must never break a class."""

    def setUp(self):
        super().setUp()
        patcher = mock.patch.object(services, "_spawn")
        self.spawn = patcher.start()
        self.addCleanup(patcher.stop)

    def test_the_teacher_opening_the_room_starts_the_notes(self):
        credentials = services.issue_join_credentials(
            session=self.session, user=self.teacher
        )
        self.assertTrue(credentials["is_taking_notes"])
        self.assertEqual(self.session.notes_runs.count(), 1)

    def test_a_student_joining_never_starts_anything(self):
        """But they are told the class is being written up, which is exactly
        the person who most needs to know."""
        services.issue_join_credentials(session=self.session, user=self.teacher)
        credentials = services.issue_join_credentials(
            session=self.session, user=self.student
        )

        self.assertEqual(self.session.notes_runs.count(), 1)
        self.assertTrue(credentials["is_taking_notes"])

    def test_a_student_alone_in_the_room_starts_nothing(self):
        credentials = services.issue_join_credentials(
            session=self.session, user=self.student
        )
        self.assertFalse(credentials["is_taking_notes"])
        self.assertEqual(self.session.notes_runs.count(), 0)

    def test_a_class_opens_even_when_transcription_is_broken(self):
        with mock.patch.object(
            services, "start_notes", side_effect=ValueError("boom")
        ):
            credentials = services.issue_join_credentials(
                session=self.session, user=self.teacher
            )
        self.assertIn("token", credentials)
        self.assertFalse(credentials["is_taking_notes"])

    def test_a_broken_recorder_does_not_stop_the_notes(self):
        """The two features fail independently — that is the whole point of
        keeping them apart."""
        with mock.patch.object(
            services, "start_recording", side_effect=ValueError("boom")
        ):
            credentials = services.issue_join_credentials(
                session=self.session, user=self.teacher
            )
        self.assertTrue(credentials["is_taking_notes"])
        self.assertFalse(credentials["is_recording"])

    def test_a_class_set_not_to_be_recorded_is_still_written_up(self):
        self.session.is_recorded = False
        self.session.save(update_fields=["is_recorded"])

        credentials = services.issue_join_credentials(
            session=self.session, user=self.teacher
        )
        self.assertTrue(credentials["is_taking_notes"])
        self.assertFalse(credentials["is_recording"])
        self.assertEqual(self.session.recordings.count(), 0)

    def test_a_class_set_not_to_take_notes_is_still_recorded(self):
        self.session.takes_notes = False
        self.session.save(update_fields=["takes_notes"])

        credentials = services.issue_join_credentials(
            session=self.session, user=self.teacher
        )
        self.assertFalse(credentials["is_taking_notes"])
        self.assertTrue(credentials["is_recording"])

    def test_the_teacher_leaving_stops_the_notes(self):
        services.issue_join_credentials(session=self.session, user=self.teacher)
        services.record_leave(session=self.session, user=self.teacher)

        notes = self.session.notes_runs.first()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.COLLECTING)

    def test_a_student_leaving_changes_nothing(self):
        services.issue_join_credentials(session=self.session, user=self.teacher)
        services.issue_join_credentials(session=self.session, user=self.student)
        services.record_leave(session=self.session, user=self.student)

        notes = self.session.notes_runs.first()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.STARTING)

    def test_leaving_succeeds_even_when_stopping_the_notes_throws(self):
        services.issue_join_credentials(session=self.session, user=self.teacher)
        with mock.patch.object(services, "stop_notes", side_effect=ValueError("boom")):
            services.record_leave(session=self.session, user=self.teacher)
        self.assertTrue(
            self.session.attendances.filter(user=self.teacher).exists()
        )

    def test_the_service_uid_floor_travels_with_the_credentials(self):
        """One floor for both bots: the only question a browser asks before
        drawing a tile is whether a uid is a person."""
        credentials = services.issue_join_credentials(
            session=self.session, user=self.student
        )
        self.assertEqual(credentials["recorder_uid_min"], services.SERVICE_UID_MIN)


# ---------------------------------------------------------------------------
# The bot's own lifecycle
# ---------------------------------------------------------------------------


@override_settings(**NOTES_SETTINGS)
class BeginNotesTests(NotesTestCase):
    def test_the_agent_id_is_saved_the_instant_agora_hands_it_over(self):
        notes = self.make_notes(
            status=ClassSessionNotes.NotesStatus.STARTING, agent_id="", agent_name=""
        )
        with mock.patch.object(
            services.transcription_api, "join", return_value=TranscriptionAgent("ag-9")
        ):
            services._begin_notes(notes.pk)

        notes.refresh_from_db()
        self.assertEqual(notes.agent_id, "ag-9")
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.TRANSCRIBING)
        self.assertTrue(notes.storage_prefix)
        self.assertTrue(notes.agent_name)

    def test_a_stop_during_startup_is_not_overwritten(self):
        """A teacher who opened the room and left again inside the second this
        takes must not have their stop lost — and the agent id still has to be
        recorded, or the bot can never be pulled out at all."""
        notes = self.make_notes(
            status=ClassSessionNotes.NotesStatus.STARTING, agent_id="", agent_name=""
        )

        def stop_then_answer(**kwargs):
            ClassSessionNotes.objects.filter(pk=notes.pk).update(
                status=ClassSessionNotes.NotesStatus.COLLECTING
            )
            return TranscriptionAgent("ag-9")

        with mock.patch.object(
            services.transcription_api, "join", side_effect=stop_then_answer
        ):
            services._begin_notes(notes.pk)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.COLLECTING)
        self.assertEqual(notes.agent_id, "ag-9")

    def test_the_bot_is_sent_a_token_for_its_own_uid_on_this_channel(self):
        notes = self.make_notes(
            status=ClassSessionNotes.NotesStatus.STARTING, agent_id=""
        )
        with mock.patch.object(
            services.transcription_api, "join", return_value=TranscriptionAgent("ag-9")
        ) as join:
            services._begin_notes(notes.pk)

        kwargs = join.call_args.kwargs
        self.assertEqual(kwargs["channel_name"], self.session.channel_name)
        self.assertEqual(kwargs["bot_uid"], notes.bot_uid)
        self.assertTrue(kwargs["bot_token"])
        self.assertEqual(
            kwargs["caption_config"]["storage"]["fileNamePrefix"],
            ["classnotes", str(self.session.pk), str(notes.pk)],
        )

    def test_a_custom_s3_endpoint_travels_as_a_full_url(self):
        """Transcription documents `extensionParams.endpoint` as a full URL
        while Cloud Recording documents the same field as a bare domain — and
        `extensionParams` sits beside `storage`, not inside it."""
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.STARTING)
        with override_settings(
            AGORA_RECORDING_S3_ENDPOINT="https://abc.r2.cloudflarestorage.com"
        ):
            config = services._caption_config(["classnotes", "1", "1"])

        self.assertEqual(
            config["extensionParams"]["endpoint"],
            "https://abc.r2.cloudflarestorage.com",
        )
        self.assertNotIn("extensionParams", config["storage"])

    def test_a_thread_that_crashes_leaves_a_row_somebody_can_act_on(self):
        """A run stuck on STARTING would show a teacher a spinner for the
        rest of the class."""
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.STARTING)
        with mock.patch.object(
            services, "_begin_notes", side_effect=ValueError("boom")
        ), mock.patch.object(services, "close_old_connections"):
            services._run_notes_safe(notes.pk)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.FAILED)
        self.assertIn("boom", notes.error_message)


@override_settings(**NOTES_SETTINGS)
class MonitorTests(NotesTestCase):
    def _run_monitor(self, notes, query_results):
        agent = TranscriptionAgent(notes.agent_id)
        with mock.patch.object(services.time, "sleep"), mock.patch.object(
            services.transcription_api, "query", side_effect=query_results
        ), mock.patch.object(
            services.transcription_api, "leave"
        ) as leave, mock.patch.object(
            services, "_collect_and_summarize"
        ) as collect, mock.patch.object(
            services.transcription_api, "TranscriptionAgent", return_value=agent
        ):
            services._monitor_notes(notes.pk)
        return leave, collect

    def test_an_agent_that_reports_itself_stopped_ends_the_run(self):
        """A bot can stop itself for reasons we never hear about. A monitor
        watching only for 404s would poll a dead agent until the class's
        deadline while the students waited for notes."""
        notes = self.make_notes()
        leave, collect = self._run_monitor(notes, [{"status": "STOPPED"}])

        leave.assert_called_once()
        collect.assert_called_once_with(notes.pk)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.COLLECTING)

    def test_an_agent_that_has_already_gone_still_gets_its_captions_collected(self):
        """The ordinary end of a class: the bot leaves when the channel
        empties, and what it wrote is sitting in the bucket regardless."""
        notes = self.make_notes()
        _, collect = self._run_monitor(notes, [services.NotesGoneError("gone")])
        collect.assert_called_once_with(notes.pk)

    def test_a_service_blip_does_not_abandon_a_running_transcription(self):
        notes = self.make_notes()
        _, collect = self._run_monitor(
            notes,
            [
                NotesUnavailableError("blip"),
                {"status": "RUNNING"},
                {"status": "STOPPED"},
            ],
        )
        collect.assert_called_once_with(notes.pk)

    def test_the_classs_own_deadline_ends_a_run_nobody_stopped(self):
        """A teacher whose browser never says goodbye."""
        self.session.scheduled_at = timezone.now() - timedelta(hours=4)
        self.session.save(update_fields=["scheduled_at"])
        notes = self.make_notes()

        _, collect = self._run_monitor(notes, [])
        collect.assert_called_once_with(notes.pk)

    def test_a_stop_request_ends_the_poll(self):
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        leave, collect = self._run_monitor(notes, [])
        leave.assert_called_once()
        collect.assert_called_once_with(notes.pk)

    def test_a_stop_that_landed_during_startup_still_pulls_the_bot_out(self):
        """The bot can be admitted a fraction of a second after somebody
        pressed stop. Skipping straight to the transcript would leave it
        listening — and billing — until Agora's idle timer noticed."""
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        leave, collect = self._run_monitor(notes, [])

        leave.assert_called_once()
        self.assertEqual(leave.call_args.kwargs["agent"].agent_id, "ag-1")
        collect.assert_called_once_with(notes.pk)


# ---------------------------------------------------------------------------
# Collecting the captions
# ---------------------------------------------------------------------------


VTT_ONE = "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\n<v {uid}>Open your books.\n"
VTT_TWO = "WEBVTT\n\n00:00:04.000 --> 00:00:06.000\n<v {uid}>We are on chapter four.\n"


@override_settings(**NOTES_SETTINGS)
class CollectTranscriptTests(NotesTestCase):
    def _collect(self, notes, listings, objects):
        with mock.patch.object(services.time, "sleep"), mock.patch.object(
            services.storage, "list_objects", side_effect=listings
        ), mock.patch.object(
            services.storage, "get_object", side_effect=lambda key, **kw: objects.get(key)
        ):
            return services._collect_transcript(notes)

    def test_the_captions_are_stitched_back_into_a_transcript(self):
        notes = self.make_notes()
        prefix = notes.storage_prefix
        keys = [f"{prefix}0.vtt", f"{prefix}1.vtt", f"{prefix}subtitle.m3u8"]
        objects = {
            keys[0]: VTT_ONE.format(uid=self.teacher.pk).encode(),
            keys[1]: VTT_TWO.format(uid=self.teacher.pk).encode(),
            keys[2]: b"#EXTM3U\n0.vtt\n1.vtt\n",
        }

        text = self._collect(notes, [keys, keys, keys], objects)

        # The uid is mapped back to a person from the class's own roster.
        self.assertEqual(
            text, f"{self.teacher.name}: Open your books. We are on chapter four."
        )
        notes.refresh_from_db()
        self.assertEqual(notes.transcript_keys, [keys[0], keys[1]])

    def test_it_waits_for_the_last_slice_rather_than_taking_the_first_look(self):
        """Agora flushes a slice on a timer, so the last one lands after the
        bot has gone — "no new file yet" and "no new file ever" look the same
        in a single glance."""
        notes = self.make_notes()
        prefix = notes.storage_prefix
        one = [f"{prefix}0.vtt"]
        two = [f"{prefix}0.vtt", f"{prefix}1.vtt"]
        objects = {
            one[0]: VTT_ONE.format(uid=self.teacher.pk).encode(),
            two[1]: VTT_TWO.format(uid=self.teacher.pk).encode(),
        }

        text = self._collect(notes, [one, two, two, two], objects)
        self.assertIn("chapter four", text)

    def test_a_folder_that_never_fills_is_an_empty_transcript(self):
        notes = self.make_notes()
        clock = iter([0, 0, 10_000, 10_000, 20_000, 20_000])
        with mock.patch.object(services.time, "sleep"), mock.patch.object(
            services.time, "monotonic", side_effect=lambda: next(clock)
        ), mock.patch.object(services.storage, "list_objects", return_value=[]):
            self.assertEqual(services._collect_transcript(notes), "")

    def test_one_unreadable_slice_does_not_lose_the_class(self):
        notes = self.make_notes()
        prefix = notes.storage_prefix
        keys = [f"{prefix}0.vtt", f"{prefix}1.vtt"]
        objects = {keys[0]: VTT_ONE.format(uid=self.teacher.pk).encode(), keys[1]: None}

        text = self._collect(notes, [keys, keys, keys], objects)
        self.assertIn("Open your books", text)

    def test_a_run_with_no_prefix_collects_nothing_rather_than_the_whole_bucket(self):
        notes = self.make_notes(storage_prefix="")
        with mock.patch.object(services.storage, "list_objects") as listing:
            self.assertEqual(services._collect_transcript(notes), "")
        listing.assert_not_called()


# ---------------------------------------------------------------------------
# Writing the notes up
# ---------------------------------------------------------------------------


@override_settings(**NOTES_SETTINGS)
class SummarizeTests(NotesTestCase):
    def _provider(self, *results):
        provider = mock.Mock()
        provider.generate_course.side_effect = results
        return provider

    def test_the_transcript_and_the_schema_are_what_the_model_is_given(self):
        notes = self.make_notes()
        provider = self._provider(ProviderResult(text=json.dumps(MODEL_ANSWER)))

        with mock.patch.object(services, "get_provider", return_value=provider):
            payload = services._summarize(notes, "Mr Smith: Open your books.")

        prompt, schema, timeout = provider.generate_course.call_args[0]
        self.assertIn("Open your books", prompt)
        self.assertIn("has_content", schema["required"])
        self.assertEqual(timeout, services.NOTES_SUMMARY_TIMEOUT_SECONDS)
        self.assertEqual(payload["title"], "Database Normalization")

    def test_the_scheduled_title_is_context_rather_than_source_material(self):
        """A teacher who spent the hour on something else must get notes
        about what they taught."""
        notes = self.make_notes()
        provider = self._provider(ProviderResult(text=json.dumps(MODEL_ANSWER)))
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._summarize(notes, "transcript")

        prompt = provider.generate_course.call_args[0][0]
        self.assertIn(self.session.title, prompt)
        self.assertIn("Do NOT write it up", prompt)

    def test_a_transport_failure_is_retried(self):
        """Nobody is watching a spinner, so being patient costs nothing."""
        notes = self.make_notes()
        provider = self._provider(
            ProviderTransportError("blip"),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        )
        with mock.patch.object(services, "get_provider", return_value=provider), \
                mock.patch.object(services.time, "sleep"):
            payload = services._summarize(notes, "transcript")

        self.assertEqual(provider.generate_course.call_count, 2)
        self.assertTrue(payload["has_content"])

    def test_a_long_transcript_keeps_its_end(self):
        """The last minutes of a class carry the recap and the homework,
        which is half of what notes are for."""
        text = ("a" * services.NOTES_MAX_TRANSCRIPT_CHARS * 2) + "THE HOMEWORK IS CHAPTER 4"
        trimmed = services._trim_transcript(text)

        self.assertLess(len(trimmed), len(text))
        # And never comes back longer than the budget it was trimmed to.
        self.assertLessEqual(len(trimmed), services.NOTES_MAX_TRANSCRIPT_CHARS)
        self.assertIn("THE HOMEWORK IS CHAPTER 4", trimmed)
        self.assertIn("the middle of this class is not shown", trimmed)

    def test_a_short_transcript_is_untouched(self):
        self.assertEqual(services._trim_transcript("short"), "short")

    def test_a_transcript_barely_over_the_cap_does_not_come_back_longer(self):
        """The marker counts against the budget rather than being added on
        top of it — otherwise trimming makes the bill worse, not better."""
        text = "a" * (services.NOTES_MAX_TRANSCRIPT_CHARS + 10)
        trimmed = services._trim_transcript(text)
        self.assertLessEqual(len(trimmed), services.NOTES_MAX_TRANSCRIPT_CHARS)


@override_settings(**NOTES_SETTINGS)
class PublishNotesTests(NotesTestCase):
    def _collect(self, notes, answer=None):
        provider = mock.Mock()
        provider.generate_course.return_value = ProviderResult(
            text=json.dumps(answer or MODEL_ANSWER)
        )
        with mock.patch.object(
            services, "_collect_transcript", return_value="Mr Smith: Open your books."
        ), mock.patch.object(services, "get_provider", return_value=provider):
            # The email goes out on `transaction.on_commit`, which never fires
            # inside a TestCase's own transaction.
            with self.captureOnCommitCallbacks(execute=True):
                return services._collect_and_summarize(notes.pk)

    def test_a_finished_run_carries_the_notes_and_tells_the_class(self):
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        self._collect(notes)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.AVAILABLE)
        self.assertEqual(notes.title, "Database Normalization")
        self.assertEqual(notes.key_topics, MODEL_ANSWER["key_topics"])
        self.assertTrue(notes.transcript)
        self.assertIsNotNone(notes.notified_at)

        told = Notification.objects.filter(verb="class_notes_ready")
        self.assertEqual(told.count(), 3)  # two students and the teacher
        self.assertEqual(len(mail.outbox), 3)

    def test_the_notes_are_rendered_into_a_document(self):
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        self._collect(notes)

        notes.refresh_from_db()
        self.assertTrue(notes.document)
        self.assertTrue(notes.document.name.endswith(".pdf"))
        # A random tail, so the MEDIA path is not a second way in that checks
        # nothing.
        self.assertNotIn(f"class-{self.session.pk}-notes.pdf", notes.document.name)
        self.addCleanup(notes.document.delete, save=False)

    def test_publishing_twice_tells_nobody_twice(self):
        """Notes reach "ready" from four directions — the teacher stopping
        them, the host leaving, the deadline passing and Agora's idle timer."""
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        self._collect(notes)
        with self.captureOnCommitCallbacks(execute=True):
            services._publish_notes(notes.pk, announce_to_students=True)

        self.assertEqual(
            Notification.objects.filter(verb="class_notes_ready").count(), 3
        )
        self.assertEqual(len(mail.outbox), 3)
        notes.refresh_from_db()
        self.addCleanup(notes.document.delete, save=False)

    def test_a_class_where_nothing_was_taught_tells_only_the_teacher(self):
        """Thirty people pulled back to a page that says "nothing was taught"
        is noise they did not ask for."""
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        self._collect(notes, {**MODEL_ANSWER, "has_content": False})

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.AVAILABLE)
        told = Notification.objects.filter(verb="class_notes_ready")
        self.assertEqual(told.count(), 1)
        self.assertEqual(told.first().recipient, self.teacher)
        self.assertEqual(len(mail.outbox), 0)

    def test_a_class_nobody_spoke_in_fails_with_a_reason(self):
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        with mock.patch.object(services, "_collect_transcript", return_value=""):
            services._collect_and_summarize(notes.pk)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.FAILED)
        self.assertIn("Nothing was transcribed", notes.error_message)
        self.assertEqual(Notification.objects.count(), 0)

    def test_an_adopted_run_never_pays_for_the_transcript_twice(self):
        """The transcript is kept on the row the moment it is assembled, so a
        process that died halfway through summarising resumes at the model
        call rather than re-listing and re-fetching a class's captions."""
        notes = self.make_notes(
            status=ClassSessionNotes.NotesStatus.SUMMARIZING,
            transcript="Mr Smith: Open your books.",
        )
        provider = mock.Mock()
        provider.generate_course.return_value = ProviderResult(
            text=json.dumps(MODEL_ANSWER)
        )
        with mock.patch.object(services, "_collect_transcript") as collect, \
                mock.patch.object(services, "get_provider", return_value=provider):
            services._collect_and_summarize(notes.pk)

        collect.assert_not_called()
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.AVAILABLE)
        self.addCleanup(notes.document.delete, save=False)

    @override_settings(**{**NOTES_SETTINGS, "CLASS_NOTES_EMAIL_ENABLED": False})
    def test_the_email_can_be_switched_off_without_the_in_app_notice(self):
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        self._collect(notes)

        self.assertEqual(len(mail.outbox), 0)
        self.assertEqual(
            Notification.objects.filter(verb="class_notes_ready").count(), 3
        )
        notes.refresh_from_db()
        self.addCleanup(notes.document.delete, save=False)

    def test_the_email_links_to_the_portal_and_never_to_the_document(self):
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        self._collect(notes)

        body = mail.outbox[0].body
        self.assertIn("portal", body)
        self.assertNotIn("/notes/document/", body)
        notes.refresh_from_db()
        self.addCleanup(notes.document.delete, save=False)

    def test_notes_that_fail_to_render_a_pdf_are_still_published(self):
        """A missing renderer costs a download, not a lesson."""
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        with mock.patch.object(
            services.notes_document, "build_notes_pdf", side_effect=OSError("no disk")
        ):
            self._collect(notes)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.AVAILABLE)
        self.assertFalse(notes.document)


# ---------------------------------------------------------------------------
# Reading the notes back
# ---------------------------------------------------------------------------


@override_settings(**NOTES_SETTINGS)
class NotesStateTests(NotesTestCase):
    def _available(self):
        return self.make_notes(
            status=ClassSessionNotes.NotesStatus.AVAILABLE,
            title="Database Normalization",
            summary="The class covered first and second normal form.",
            key_topics=["1NF"],
            transcript="Mr Smith: Open your books.",
            notified_at=timezone.now(),
        )

    def test_a_student_gets_the_notes_and_never_the_transcript(self):
        """The write-up is for the class; the verbatim record of who said
        what in a room that may be full of minors is for the teacher."""
        self._available()
        state = services.notes_state(session=self.session, user=self.student)

        self.assertTrue(state["available"])
        self.assertEqual(state["notes"]["title"], "Database Normalization")
        self.assertIsNone(state["transcript"])

    def test_the_teacher_gets_the_transcript_too(self):
        self._available()
        state = services.notes_state(session=self.session, user=self.teacher)
        self.assertEqual(state["transcript"], "Mr Smith: Open your books.")

    def test_somebody_outside_the_class_gets_nothing(self):
        self._available()
        state = services.notes_state(session=self.session, user=self.outsider)
        self.assertIsNone(state["notes"])
        self.assertIsNone(state["transcript"])

    def test_a_run_in_flight_reports_which_half_it_is_in(self):
        """"The bot is listening" and "the model is writing" mean different
        things to the person reading: one is happening to the room they are
        sitting in."""
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.TRANSCRIBING)
        state = services.notes_state(session=self.session, user=self.student)
        self.assertTrue(state["is_transcribing"])
        self.assertFalse(state["is_writing"])

        notes.status = ClassSessionNotes.NotesStatus.SUMMARIZING
        notes.save(update_fields=["status"])
        state = services.notes_state(session=self.session, user=self.student)
        self.assertFalse(state["is_transcribing"])
        self.assertTrue(state["is_writing"])

    def test_the_newest_complete_write_up_wins(self):
        older = self._available()
        older.title = "An earlier take"
        older.save(update_fields=["title"])
        newer = self._available()
        newer.title = "The last take"
        newer.save(update_fields=["title"])

        state = services.notes_state(session=self.session, user=self.student)
        self.assertEqual(state["notes"]["title"], "The last take")

    def test_a_server_with_no_credentials_says_so_rather_than_looking_broken(self):
        with override_settings(CLASS_NOTES_ENABLED=False):
            state = services.notes_state(session=self.session, user=self.teacher)
        self.assertFalse(state["configured"])


@override_settings(**NOTES_SETTINGS)
class OrphanAdoptionTests(NotesTestCase):
    def test_a_run_abandoned_by_a_restart_is_picked_back_up(self):
        """There is no scheduler here, so the next request that asks about
        the class is what adopts it."""
        notes = self.make_notes()
        ClassSessionNotes.objects.filter(pk=notes.pk).update(
            updated_at=timezone.now() - timedelta(hours=1)
        )
        notes.refresh_from_db()

        with mock.patch.object(services, "_spawn") as spawn:
            adopted = services._ensure_notes_monitored(notes)

        self.assertTrue(adopted)
        spawn.assert_called_once_with(services._monitor_notes_safe, notes.pk)
        services._release_notes_monitored(notes.pk)

    def test_a_run_past_the_bots_lifetime_resumes_at_the_collector(self):
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.COLLECTING)
        ClassSessionNotes.objects.filter(pk=notes.pk).update(
            updated_at=timezone.now() - timedelta(hours=1)
        )
        notes.refresh_from_db()

        with mock.patch.object(services, "_spawn") as spawn:
            services._ensure_notes_monitored(notes)

        spawn.assert_called_once_with(services._collect_notes_safe, notes.pk)
        services._release_notes_monitored(notes.pk)

    def test_a_live_thread_is_never_mistaken_for_a_dead_one(self):
        notes = self.make_notes()
        with mock.patch.object(services, "_spawn") as spawn:
            self.assertFalse(services._ensure_notes_monitored(notes))
        spawn.assert_not_called()

    def test_a_summarizing_run_is_given_longer_before_anyone_adopts_it(self):
        """The model call is slower than any poll, and adopting it early is a
        second bill for the same class."""
        notes = self.make_notes(status=ClassSessionNotes.NotesStatus.SUMMARIZING)
        ClassSessionNotes.objects.filter(pk=notes.pk).update(
            updated_at=timezone.now() - timedelta(seconds=services.NOTES_ORPHAN_AFTER_SECONDS + 60)
        )
        notes.refresh_from_db()

        with mock.patch.object(services, "_spawn") as spawn:
            self.assertFalse(services._ensure_notes_monitored(notes))
        spawn.assert_not_called()

    def test_a_run_still_being_admitted_is_left_alone(self):
        notes = self.make_notes(
            status=ClassSessionNotes.NotesStatus.STARTING, agent_id=""
        )
        ClassSessionNotes.objects.filter(pk=notes.pk).update(
            updated_at=timezone.now() - timedelta(hours=1)
        )
        notes.refresh_from_db()

        with mock.patch.object(services, "_spawn") as spawn:
            self.assertFalse(services._ensure_notes_monitored(notes))
        spawn.assert_not_called()


@override_settings(**NOTES_SETTINGS)
class IndependenceTests(NotesTestCase):
    """Notes and recording are two features, and the database says so."""

    def test_a_class_can_carry_a_recording_and_notes_at_once(self):
        self.make_notes()
        ClassSessionRecording.objects.create(
            session=self.session,
            status=ClassSessionRecording.RecordingStatus.RECORDING,
            recorder_uid=2_500_000_000,
        )
        self.assertIsNotNone(services.active_notes(self.session))
        self.assertIsNotNone(services.active_recording(self.session))

    def test_only_one_run_of_each_can_be_in_flight(self):
        from django.db import IntegrityError, transaction

        self.make_notes()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.make_notes()

    def test_a_listing_reports_both_independently(self):
        notes = self.make_notes(
            status=ClassSessionNotes.NotesStatus.AVAILABLE,
            summary="Something was taught.",
            notified_at=timezone.now(),
        )
        row = services.teacher_sessions(self.teacher).get(pk=self.session.pk)
        self.assertTrue(row.has_notes)
        self.assertFalse(row.has_recording)
        self.assertFalse(row.notes_in_progress)
