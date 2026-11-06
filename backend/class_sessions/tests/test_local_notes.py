"""AI meeting notes written from the classroom's own audio — the default source.

The other half of `test_notes_services.py`. Same feature, same prompt, same
document, same notifications — but no transcription service, no RESTful key
and, the point of it, **no bucket anywhere in the path**. The teacher's
browser records the class and posts it here in segments; the model reads them;
the notes come out the other end.

Five things this must never do, and they are what most of the file is about:

* **It must never need a bucket.** A deployment with an AI key and nothing
  else has to be able to write a class up. If `is_notes_configured` ever
  starts consulting storage again, notes go dark on every server that has no
  S3, which is the exact situation this source exists for.
* **It must never record a class twice.** One browser captures, nominated by
  the run; a co-instructor's classroom in the same room posts nothing.
* **It must never lose or reorder a class.** Segment order is the server's
  decision, not the client's, and an upload retried after a timeout is one
  segment rather than two.
* **It must never hang.** A browser that closes mid-class, or whose last
  upload never lands, has to end up as notes or as a stated failure — never
  as a run that is forever about to finish.
* **It must never pay twice.** A write-up adopted after a restart resumes at
  the first segment nobody has read, not at the start of the class.
"""

import json
import shutil
import tempfile
import uuid
from datetime import timedelta
from unittest import mock

from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ai_courses.providers.base import ProviderError, ProviderResult, ProviderTransportError
from notifications.models import Notification

from .. import services
from ..exceptions import (
    NotesNotConfiguredError,
    NotesUnavailableError,
    SessionAccessDeniedError,
)
from ..models import ClassSession, ClassSessionNotes, ClassSessionNotesAudio
from .factories import assign_teacher, enrol, make_course, make_session, make_user
from .test_notes_services import MODEL_ANSWER

APP_ID = "a" * 32
APP_CERTIFICATE = "b" * 32

# Everything the local source needs, which is the headline: an AI key. No
# bucket, no RESTful key, no transcription product — and the Agora keys below
# are only here because the *class* needs them to run at all.
_MEDIA_ROOT = tempfile.mkdtemp(prefix="class-notes-tests-")


def tearDownModule():
    shutil.rmtree(_MEDIA_ROOT, ignore_errors=True)


LOCAL_SETTINGS = dict(
    # Everything this module renders or uploads lands here and is
    # thrown away with it. Without this a suite run leaves hundreds of
    # orphaned .webm segments and .pdf write-ups in the real media
    # folder, which is both litter and a confusing thing to find there
    # when debugging a class that genuinely produced nothing.
    MEDIA_ROOT=_MEDIA_ROOT,
    AGORA_APP_ID=APP_ID,
    AGORA_APP_CERTIFICATE=APP_CERTIFICATE,
    CLASS_NOTES_ENABLED=True,
    CLASS_NOTES_SOURCE="local",
    CLASS_NOTES_EMAIL_ENABLED=False,
    CLASS_NOTES_AUDIO_SEGMENT_SECONDS=600,
    CLASS_NOTES_AUDIO_BITRATE=16000,
    CLASS_NOTES_AUDIO_MAX_MB=40,
    AGORA_CUSTOMER_ID="",
    AGORA_CUSTOMER_SECRET="",
    AGORA_STT_CUSTOMER_ID="",
    AGORA_STT_CUSTOMER_SECRET="",
    AGORA_RECORDING_BUCKET="",
    AGORA_RECORDING_ACCESS_KEY="",
    AGORA_RECORDING_SECRET_KEY="",
    AI_PROVIDER="gemini",
    GEMINI_API_KEY="key",
)


def audio_upload(name="part.webm", content=b"\x1a\x45\xdf\xa3" + b"0" * 4096):
    return SimpleUploadedFile(name, content, content_type="audio/webm;codecs=opus")


def secrets_key():
    """A fresh client key per upload — two segments posted under one key are
    deliberately the same segment."""
    return uuid.uuid4().hex


def transcript_answer(text, has_speech=True):
    return ProviderResult(
        text=json.dumps({"has_speech": has_speech, "transcript": text})
    )


class LocalNotesTestCase(TestCase):
    """A live class with a teacher, a co-instructor and an enrolled student."""

    def setUp(self):
        self.teacher = make_user("coach", "TEACHER")
        self.cohost = make_user("assistant", "TEACHER")
        self.student = make_user("athlete", "STUDENT")
        # Nobody on this course's roster — the uid a speaker timeline must
        # never turn into a name.
        self.outsider = make_user("passerby", "STUDENT")

        self.course = make_course()
        assign_teacher(self.course, self.teacher)
        assign_teacher(self.course, self.cohost)
        enrol(self.course, self.student)

        # Running right now: started 10 minutes ago, 60 minutes long.
        self.session = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-10
        )

    def tearDown(self):
        # `_begin_local_summary` claims a run before spawning, and these tests
        # mostly stub the spawn — so the claim would otherwise outlive the
        # test. Primary keys are not rolled back with the transaction, so a
        # stale claim is only ever a near miss; clearing it makes it none.
        services._notes_monitored_ids.clear()

    def start(self, user=None):
        return services.start_notes(session=self.session, user=user or self.teacher)

    def send(
        self, notes_user=None, *, end=False, upload=None, client_key="", speakers=None
    ):
        return services.store_notes_audio(
            session=self.session,
            user=notes_user or self.teacher,
            upload=upload or audio_upload(),
            client_key=client_key,
            duration_seconds=600,
            end=end,
            speakers=speakers,
        )


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


class ConfigurationTests(LocalNotesTestCase):
    @override_settings(**LOCAL_SETTINGS)
    def test_a_server_with_no_bucket_at_all_can_still_take_notes(self):
        """The whole reason this source exists. Nothing but the AI key."""
        self.assertTrue(services.is_local_notes())
        self.assertTrue(services.is_notes_configured())

    @override_settings(**{**LOCAL_SETTINGS, "GEMINI_API_KEY": ""})
    def test_without_an_ai_key_there_is_nothing_to_write_the_notes(self):
        self.assertFalse(services.is_notes_configured())
        with self.assertRaises(NotesNotConfiguredError):
            services._notes_credentials()

    @override_settings(**{**LOCAL_SETTINGS, "CLASS_NOTES_ENABLED": False})
    def test_the_deployment_wide_switch_still_turns_it_off(self):
        self.assertFalse(services.is_notes_configured())

    @override_settings(**{**LOCAL_SETTINGS, "CLASS_NOTES_SOURCE": "LOCAL"})
    def test_the_setting_is_read_case_insensitively(self):
        self.assertTrue(services.is_local_notes())

    @override_settings(**{**LOCAL_SETTINGS, "CLASS_NOTES_SOURCE": "lcoal"})
    def test_a_typo_falls_back_to_the_source_that_needs_nothing(self):
        """Anything that is not an explicit 'agora' is local — a mistyped
        setting must not silently demand four more values be filled in."""
        self.assertTrue(services.is_local_notes())
        self.assertTrue(services.is_notes_configured())

    @override_settings(**{**LOCAL_SETTINGS, "CLASS_NOTES_SOURCE": "agora"})
    def test_the_agora_source_is_still_reachable_and_still_needs_a_bucket(self):
        self.assertFalse(services.is_local_notes())
        self.assertFalse(services.is_notes_configured())


# ---------------------------------------------------------------------------
# Starting and stopping
# ---------------------------------------------------------------------------


@override_settings(**LOCAL_SETTINGS)
class StartStopTests(LocalNotesTestCase):
    def test_starting_needs_no_thread_and_no_third_party(self):
        with mock.patch.object(services, "_spawn") as spawn:
            notes = self.start()
        spawn.assert_not_called()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.TRANSCRIBING)
        self.assertTrue(notes.is_listening)
        self.assertIsNotNone(notes.started_at)
        self.assertEqual(notes.started_by, self.teacher)

    def test_starting_twice_returns_the_same_run(self):
        first = self.start()
        second = self.start(user=self.cohost)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(ClassSessionNotes.objects.count(), 1)

    def test_a_class_scheduled_not_to_take_notes_can_still_be_written_up(self):
        """`takes_notes` is whether a class starts by itself, not whether it
        is allowed to — a teacher who left the box unticked must still be able
        to press the button during the class."""
        self.session.takes_notes = False
        self.session.save(update_fields=["takes_notes"])
        notes = self.start()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.TRANSCRIBING)

    def test_a_cancelled_class_still_refuses(self):
        self.session.status = ClassSession.SessionStatus.CANCELLED
        self.session.save(update_fields=["status"])
        with self.assertRaises(NotesNotConfiguredError):
            self.start()

    def test_the_teacher_opening_the_room_starts_the_notes(self):
        services.issue_join_credentials(session=self.session, user=self.teacher)
        self.assertIsNotNone(services.active_notes(self.session))

    def test_a_student_joining_never_starts_anything(self):
        services.issue_join_credentials(session=self.session, user=self.student)
        self.assertIsNone(services.active_notes(self.session))

    def test_a_class_scheduled_not_to_take_notes_does_not_start_by_itself(self):
        self.session.takes_notes = False
        self.session.save(update_fields=["takes_notes"])
        services.issue_join_credentials(session=self.session, user=self.teacher)
        self.assertIsNone(services.active_notes(self.session))

    def test_the_stop_button_pauses_rather_than_writing_the_class_up(self):
        """The class is still going. A teacher who stops for an exercise is
        bookmarking, not finishing — writing up here would hand them a
        spinner for the rest of the lesson and a set of notes covering ten
        minutes of an hour."""
        notes = self.start()
        with mock.patch.object(services, "_spawn") as spawn:
            paused = services.stop_notes(session=self.session, user=self.teacher)
        spawn.assert_not_called()
        self.assertEqual(paused.pk, notes.pk)
        self.assertEqual(paused.status, ClassSessionNotes.NotesStatus.PAUSED)
        # Not stopped: a duration measured from a pause would be wrong for
        # the rest of the class that followed it.
        self.assertIsNone(paused.stopped_at)
        self.assertTrue(paused.is_in_flight)
        self.assertFalse(paused.is_working)

    def test_starting_again_resumes_the_same_run(self):
        """The whole point of pausing. Two runs would write up the second
        stretch and replace the first on the card."""
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            self.send()
        services.stop_notes(session=self.session, user=self.teacher)

        resumed = self.start()

        self.assertEqual(resumed.pk, notes.pk)
        self.assertEqual(resumed.status, ClassSessionNotes.NotesStatus.TRANSCRIBING)
        self.assertEqual(self.session.notes_runs.count(), 1)
        # And the first stretch is still there to be written up with the rest.
        self.assertEqual(
            ClassSessionNotesAudio.objects.filter(notes=resumed).count(), 1
        )

    def test_a_class_taken_in_two_stretches_is_one_set_of_notes(self):
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            self.send()
            services.stop_notes(session=self.session, user=self.teacher)
            self.start()
            self.send()
            services.finish_notes(session=self.session, user=self.teacher)

        notes.refresh_from_db()
        self.assertEqual(self.session.notes_runs.count(), 1)
        self.assertEqual(
            list(
                ClassSessionNotesAudio.objects.filter(notes=notes)
                .order_by("index")
                .values_list("index", flat=True)
            ),
            [0, 1],
        )

    def test_a_paused_class_is_not_shown_as_having_notes_taken(self):
        self.start()
        services.stop_notes(session=self.session, user=self.teacher)

        state = services.notes_state(session=self.session, user=self.student)
        self.assertTrue(state["is_paused"])
        self.assertFalse(state["is_transcribing"])
        self.assertFalse(state["is_writing"])
        # And nothing nominates a browser to record while it is parked.
        self.assertIsNone(state["capture"]["capturer_id"])

    def test_the_teacher_leaving_for_good_finishes_the_notes(self):
        """Not a pause: the host walking out is the end of the class, and a
        run left parked would never become notes."""
        self.start()
        services.record_leave(session=self.session, user=self.teacher, ended=True)
        self.assertEqual(
            services.active_notes(self.session).status,
            ClassSessionNotes.NotesStatus.COLLECTING,
        )

    def test_the_teacher_leaving_for_good_finishes_a_paused_run_too(self):
        self.start()
        services.stop_notes(session=self.session, user=self.teacher)
        services.record_leave(session=self.session, user=self.teacher, ended=True)
        self.assertEqual(
            services.active_notes(self.session).status,
            ClassSessionNotes.NotesStatus.COLLECTING,
        )

    def test_a_reload_parks_the_notes_rather_than_writing_them_up(self):
        """The bug this exists to stop: a reload, a navigation and React's
        development double-mount all send the same "left" ping as the red
        button, and treating them alike wrote a class up two seconds into it
        — before its teacher's browser had recorded a word — then left the
        classroom claiming to be writing notes for the rest of the hour."""
        notes = self.start()
        services.record_leave(session=self.session, user=self.teacher)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.PAUSED)
        # And the class's own switch is untouched, so the rejoin a moment
        # later resumes by itself.
        self.session.refresh_from_db()
        self.assertTrue(self.session.takes_notes)

    def test_the_rejoin_after_a_reload_carries_on_the_same_notes(self):
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            self.send()
        services.record_leave(session=self.session, user=self.teacher)

        services.issue_join_credentials(session=self.session, user=self.teacher)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.TRANSCRIBING)
        self.assertEqual(self.session.notes_runs.count(), 1)
        self.assertEqual(
            ClassSessionNotesAudio.objects.filter(notes=notes).count(), 1
        )

    def test_a_student_leaving_changes_nothing(self):
        self.start()
        services.record_leave(session=self.session, user=self.student, ended=True)
        self.assertEqual(
            services.active_notes(self.session).status,
            ClassSessionNotes.NotesStatus.TRANSCRIBING,
        )

    def test_the_join_payload_can_start_the_recorder_on_its_own(self):
        """The notes query is a second request racing the same page load, and
        the seconds between them are the first thing the teacher says."""
        credentials = services.issue_join_credentials(
            session=self.session, user=self.teacher
        )
        self.assertTrue(credentials["is_taking_notes"])
        self.assertEqual(credentials["notes_capture"]["mode"], "local")
        self.assertEqual(
            credentials["notes_capture"]["capturer_id"], self.teacher.pk
        )

    def test_the_capture_config_names_the_one_browser_that_records(self):
        notes = self.start()
        state = services.notes_state(session=self.session, user=self.cohost)
        self.assertEqual(state["capture"]["mode"], "local")
        self.assertEqual(state["capture"]["run_id"], notes.pk)
        self.assertEqual(state["capture"]["capturer_id"], self.teacher.pk)
        self.assertEqual(state["capture"]["segment_seconds"], 600)
        self.assertEqual(state["capture"]["audio_bitrate"], 16000)

    def test_nothing_is_nominated_while_no_class_is_being_recorded(self):
        state = services.notes_state(session=self.session, user=self.teacher)
        self.assertIsNone(state["capture"]["capturer_id"])
        self.assertIsNone(state["capture"]["run_id"])


# ---------------------------------------------------------------------------
# The audio arriving
# ---------------------------------------------------------------------------


@override_settings(**LOCAL_SETTINGS)
class AudioUploadTests(LocalNotesTestCase):
    def test_a_segment_is_stored_against_the_running_notes(self):
        notes = self.start()
        self.send()
        segment = ClassSessionNotesAudio.objects.get(notes=notes)
        self.assertEqual(segment.index, 0)
        self.assertEqual(segment.content_type, "audio/webm")
        self.assertTrue(segment.file.name.endswith(".webm"))
        self.assertGreater(segment.size_bytes, 0)

    def test_the_server_numbers_the_segments_not_the_client(self):
        """A capturer that crashed and came back restarts its own numbering;
        if that were trusted it would overwrite the first half of the class."""
        notes = self.start()
        for _ in range(3):
            self.send()
        self.assertEqual(
            list(
                ClassSessionNotesAudio.objects.filter(notes=notes)
                .order_by("index")
                .values_list("index", flat=True)
            ),
            [0, 1, 2],
        )

    def test_the_same_upload_sent_twice_is_one_segment(self):
        notes = self.start()
        self.send(client_key="abc123")
        self.send(client_key="abc123")
        self.assertEqual(ClassSessionNotesAudio.objects.filter(notes=notes).count(), 1)

    def test_only_the_nominated_browser_may_send_audio(self):
        self.start()
        with self.assertRaises(NotesUnavailableError):
            self.send(self.cohost)

    def test_a_student_may_never_send_audio(self):
        self.start()
        with self.assertRaises(SessionAccessDeniedError):
            self.send(self.student)

    def test_audio_for_a_class_that_is_not_taking_notes_is_refused(self):
        with self.assertRaises(NotesUnavailableError):
            self.send()

    def test_a_format_no_model_can_read_is_refused_at_the_door(self):
        self.start()
        from ..notes_audio import UnsupportedAudioError

        with self.assertRaises(UnsupportedAudioError):
            self.send(
                upload=SimpleUploadedFile("part.txt", b"0" * 4096, content_type="text/plain")
            )

    @override_settings(**{**LOCAL_SETTINGS, "CLASS_NOTES_AUDIO_MAX_MB": 1})
    def test_an_oversized_segment_is_refused(self):
        self.start()
        with self.assertRaises(NotesUnavailableError):
            self.send(upload=audio_upload(content=b"0" * (2 * 1024 * 1024)))

    def test_an_empty_blob_is_ignored_rather_than_stored(self):
        notes = self.start()
        self.send(upload=audio_upload(content=b"0" * 10))
        self.assertEqual(ClassSessionNotesAudio.objects.filter(notes=notes).count(), 0)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.TRANSCRIBING)

    def test_the_closing_segment_is_what_starts_the_write_up(self):
        notes = self.start()
        with mock.patch.object(services, "_spawn") as spawn:
            self.send()
            spawn.assert_not_called()
            self.send(end=True)
        spawn.assert_called_once()
        self.assertEqual(spawn.call_args[0][0], services._run_local_notes_safe)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.SUMMARIZING)

    def test_the_stop_buttons_last_segment_does_not_start_a_write_up(self):
        """It is a pause: the class is still going and the rest of it belongs
        to the same notes."""
        notes = self.start()
        with mock.patch.object(services, "_spawn") as spawn:
            self.send()
            services.stop_notes(session=self.session, user=self.teacher)
        spawn.assert_not_called()
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.PAUSED)

    def test_audio_is_still_accepted_after_the_stop_button(self):
        """The segment in flight when the teacher pressed stop is the end of
        what they were just saying — refusing it would lose exactly the
        minutes nobody wants to lose."""
        notes = self.start()
        services.stop_notes(session=self.session, user=self.teacher)
        with mock.patch.object(services, "_spawn"):
            self.send()
        self.assertEqual(ClassSessionNotesAudio.objects.filter(notes=notes).count(), 1)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.PAUSED)

    def test_audio_is_still_accepted_while_the_class_is_finishing(self):
        notes = self.start()
        services.finish_notes(session=self.session, user=self.teacher)
        with mock.patch.object(services, "_spawn"):
            self.send(end=True)
        self.assertEqual(ClassSessionNotesAudio.objects.filter(notes=notes).count(), 1)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.SUMMARIZING)

    @override_settings(**{**LOCAL_SETTINGS, "CLASS_NOTES_SOURCE": "agora"})
    def test_a_server_on_the_agora_source_takes_no_audio_from_a_browser(self):
        notes = ClassSessionNotes.objects.create(
            session=self.session,
            status=ClassSessionNotes.NotesStatus.TRANSCRIBING,
            started_by=self.teacher,
        )
        self.assertTrue(notes.is_listening)
        with self.assertRaises(NotesNotConfiguredError):
            self.send()


# ---------------------------------------------------------------------------
# The backstop — a browser that never comes back
# ---------------------------------------------------------------------------


@override_settings(**LOCAL_SETTINGS)
class ProgressTests(LocalNotesTestCase):
    def _age(self, notes, seconds):
        ClassSessionNotes.objects.filter(pk=notes.pk).update(
            updated_at=timezone.now() - timedelta(seconds=seconds)
        )
        notes.refresh_from_db()

    def test_a_listening_run_is_left_alone_while_its_class_is_still_on(self):
        notes = self.start()
        self._age(notes, 3600)
        self.assertFalse(services._ensure_notes_monitored(notes))
        notes.refresh_from_db()
        self.assertTrue(notes.is_listening)

    def test_a_run_that_outlived_its_class_stops_listening(self):
        self.session.scheduled_at = timezone.now() - timedelta(hours=4)
        self.session.save(update_fields=["scheduled_at"])
        notes = self.start()
        services._ensure_notes_monitored(notes)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.COLLECTING)

    def test_a_last_segment_still_in_flight_gets_its_grace(self):
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            services.finish_notes(session=self.session, user=self.teacher)
        notes.refresh_from_db()
        with mock.patch.object(services, "_spawn") as spawn:
            self.assertFalse(services._ensure_notes_monitored(notes))
        spawn.assert_not_called()

    def test_a_last_segment_that_never_lands_writes_up_what_did(self):
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            self.send()
            services.finish_notes(session=self.session, user=self.teacher)
        notes.refresh_from_db()
        # Finishing a run that already has audio hands it straight to a
        # thread, so there is nothing left for the backstop to do.
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.SUMMARIZING)
        services._release_notes_monitored(notes.pk)

    def test_a_class_whose_audio_never_arrived_fails_with_a_reason(self):
        notes = self.start()
        services.finish_notes(session=self.session, user=self.teacher)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.COLLECTING)
        self._age(notes, services.LOCAL_NOTES_UPLOAD_GRACE_SECONDS + 60)

        services._ensure_notes_monitored(notes)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.FAILED)
        self.assertIn("audio", notes.error_message.lower())

    def test_a_paused_run_that_outlived_its_class_is_finished_anyway(self):
        """The teacher stopped mid-class and then nobody said the class was
        over. The twenty minutes already recorded are still a class."""
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            self.send()
        services.stop_notes(session=self.session, user=self.teacher)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.PAUSED)

        self.session.scheduled_at = timezone.now() - timedelta(hours=4)
        self.session.save(update_fields=["scheduled_at"])
        notes.refresh_from_db()

        with mock.patch.object(services, "_spawn") as spawn:
            services._ensure_notes_monitored(notes)
        spawn.assert_called_once()
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.SUMMARIZING)
        services._release_notes_monitored(notes.pk)

    def test_the_orphan_window_outlasts_the_work_it_is_watching(self):
        """A local run heartbeats between segments, not during them. If the
        window were shorter than one stalled segment, a healthy 60-minute
        class — fifteen segments, fifteen chances to sit on a slow response —
        would have a second thread started beside it, transcribing the same
        audio and billing the model twice."""
        worst_case_segment = (
            services.LOCAL_NOTES_TRANSCRIBE_TIMEOUT_SECONDS
            * services.NOTES_MAX_TRANSPORT_ATTEMPTS
            + sum(services.NOTES_TRANSPORT_BACKOFF_SECONDS)
        )
        self.assertGreater(
            services.LOCAL_NOTES_ORPHAN_AFTER_SECONDS, worst_case_segment
        )

    def test_a_run_still_working_through_a_long_class_is_left_alone(self):
        notes = self.start()
        ClassSessionNotes.objects.filter(pk=notes.pk).update(
            status=ClassSessionNotes.NotesStatus.SUMMARIZING
        )
        notes.refresh_from_db()
        # Quiet for longer than the Agora path's window, but less than one
        # segment's worth of patience.
        self._age(notes, services.NOTES_SUMMARIZING_ORPHAN_AFTER_SECONDS + 60)

        with mock.patch.object(services, "_spawn") as spawn:
            self.assertFalse(services._ensure_notes_monitored(notes))
        spawn.assert_not_called()

    def test_a_write_up_orphaned_by_a_restart_is_adopted(self):
        notes = self.start()
        ClassSessionNotes.objects.filter(pk=notes.pk).update(
            status=ClassSessionNotes.NotesStatus.SUMMARIZING
        )
        notes.refresh_from_db()
        self._age(notes, services.LOCAL_NOTES_ORPHAN_AFTER_SECONDS + 60)

        with mock.patch.object(services, "_spawn") as spawn:
            self.assertTrue(services._ensure_notes_monitored(notes))
        spawn.assert_called_once_with(services._run_local_notes_safe, notes.pk)
        services._release_notes_monitored(notes.pk)

    def test_the_write_up_is_only_handed_to_one_thread(self):
        notes = self.start()
        with mock.patch.object(services, "_spawn") as spawn:
            services._begin_local_summary(notes)
            services._begin_local_summary(notes)
        spawn.assert_called_once()
        services._release_notes_monitored(notes.pk)


# ---------------------------------------------------------------------------
# Transcribing and writing up
# ---------------------------------------------------------------------------


@override_settings(**LOCAL_SETTINGS)
class WriteUpTests(LocalNotesTestCase):
    def _run_with_segments(self, count=2):
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            for _ in range(count):
                self.send()
        notes.refresh_from_db()
        return notes

    def test_a_class_is_transcribed_segment_by_segment_and_written_up(self):
        notes = self._run_with_segments(2)
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer("Teacher: First normal form."),
            transcript_answer("Teacher: Second normal form."),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._write_up_local_notes(notes.pk)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.AVAILABLE)
        self.assertIn("First normal form", notes.transcript)
        self.assertIn("Second normal form", notes.transcript)
        self.assertEqual(notes.title, MODEL_ANSWER["title"])

    def test_the_audio_is_sent_as_a_file_the_model_can_actually_read(self):
        notes = self._run_with_segments(1)
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer("Teacher: Hello."),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._write_up_local_notes(notes.pk)

        files = provider.generate_course.call_args_list[0].kwargs["files"]
        # The codec parameter the browser puts on the type is stripped: a
        # model reading `webm;codecs=opus` as the subtype rejects the request.
        self.assertEqual(files[0]["mime_type"], "audio/webm")
        self.assertTrue(files[0]["data_base64"])

    def test_each_segment_is_given_the_end_of_the_one_before_it(self):
        """A class is cut on a timer, so a sentence straddles two files."""
        notes = self._run_with_segments(2)
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer("Teacher: the first normal"),
            transcript_answer("Teacher: form removes repeating groups."),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._write_up_local_notes(notes.pk)

        second_prompt = provider.generate_course.call_args_list[1].args[0]
        self.assertIn("the first normal", second_prompt)
        self.assertIn("do NOT repeat them", second_prompt)

    def test_a_silent_segment_is_not_read_again_on_a_second_pass(self):
        notes = self._run_with_segments(1)
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer("", has_speech=False),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider):
            text, _ = services._transcribe_local_audio(notes)
        self.assertEqual(text, "")

        segment = ClassSessionNotesAudio.objects.get(notes=notes)
        self.assertIsNotNone(segment.transcribed_at)

        provider.generate_course.side_effect = [transcript_answer("never called")]
        with mock.patch.object(services, "get_provider", return_value=provider):
            text, _ = services._transcribe_local_audio(notes)
        self.assertEqual(text, "")

    def test_a_write_up_adopted_halfway_never_pays_for_the_same_audio_twice(self):
        notes = self._run_with_segments(2)
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer("Teacher: part one."),
            ProviderError("the model fell over"),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider):
            text, problem = services._transcribe_local_audio(notes)
        self.assertEqual(text, "Teacher: part one.")
        # Something came back, so there is nothing to report: a reason is only
        # carried out of here when the whole class came back empty.
        self.assertEqual(problem, "")

        # The segment that worked is kept; the one that was refused is left
        # unread, so a later pass retries only it.
        provider.generate_course.side_effect = [transcript_answer("Teacher: part two.")]
        with mock.patch.object(services, "get_provider", return_value=provider):
            text, _ = services._transcribe_local_audio(notes)
        self.assertEqual(text, "Teacher: part one.\nTeacher: part two.")
        self.assertEqual(provider.generate_course.call_count, 3)

    def test_one_bad_segment_never_loses_the_rest_of_the_class(self):
        notes = self._run_with_segments(3)
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer("Teacher: one."),
            ProviderError("quota spent"),
            transcript_answer("Teacher: three."),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._write_up_local_notes(notes.pk)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.AVAILABLE)
        self.assertEqual(notes.transcript, "Teacher: one.\nTeacher: three.")

    def test_a_class_where_every_segment_failed_says_why(self):
        notes = self._run_with_segments(1)
        provider = mock.Mock()
        provider.generate_course.side_effect = [ProviderError("quota spent")]
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._write_up_local_notes(notes.pk)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.FAILED)
        self.assertIn("quota spent", notes.error_message)

    def test_a_class_nobody_spoke_in_fails_rather_than_inventing_notes(self):
        notes = self._run_with_segments(1)
        provider = mock.Mock()
        provider.generate_course.side_effect = [transcript_answer("", has_speech=False)]
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._write_up_local_notes(notes.pk)

        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.FAILED)
        self.assertIn("no one was heard", notes.error_message.lower())

    def test_a_transport_blip_is_retried_but_a_refusal_is_not(self):
        notes = self._run_with_segments(1)
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            ProviderTransportError("connection reset"),
            transcript_answer("Teacher: hello."),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider), \
            mock.patch.object(services.time, "sleep"):
            services._write_up_local_notes(notes.pk)

        notes.refresh_from_db()
        self.assertEqual(notes.transcript, "Teacher: hello.")

    def test_a_thread_that_crashes_leaves_a_row_somebody_can_act_on(self):
        notes = self._run_with_segments(1)
        with mock.patch.object(
            services, "_write_up_local_notes", side_effect=RuntimeError("boom")
        ), mock.patch.object(services, "close_old_connections"):
            # Patched for the same reason the Agora path's crash test patches
            # it: this is a thread entrypoint, and tidying up a worker's
            # connection would close the one the test itself is running in.
            services._run_local_notes_safe(notes.pk)
        notes.refresh_from_db()
        self.assertEqual(notes.status, ClassSessionNotes.NotesStatus.FAILED)
        self.assertIn("boom", notes.error_message)

    @override_settings(**{**LOCAL_SETTINGS, "CLASS_NOTES_EMAIL_ENABLED": True})
    def test_the_finished_notes_are_emailed_to_the_class_as_a_pdf(self):
        """The document is the thing a class is actually given afterwards —
        read offline, revised from, kept. A link that only works while you
        are signed into the portal is not that."""
        notes = self._run_with_segments(1)
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer("Teacher: First normal form."),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        ]
        # The email goes out on commit, which a TestCase never reaches on its
        # own — the same wrapper the Agora path's email tests use.
        with mock.patch.object(services, "get_provider", return_value=provider), \
            self.captureOnCommitCallbacks(execute=True):
            services._write_up_local_notes(notes.pk)

        notes.refresh_from_db()
        self.addCleanup(notes.document.delete, save=False)

        # The teacher and the one enrolled student — nobody in anybody else's
        # To: header.
        self.assertEqual(len(mail.outbox), 2)
        for message in mail.outbox:
            self.assertEqual(len(message.to), 1)
            self.assertEqual(len(message.attachments), 1)
            filename, content, mimetype = message.attachments[0]
            self.assertTrue(filename.endswith("-notes.pdf"))
            self.assertEqual(mimetype, "application/pdf")
            self.assertTrue(content)
            # The write-up travels; the verbatim record of who said what in a
            # room full of minors does not.
            self.assertNotIn("First normal form", message.body)

    @override_settings(**{**LOCAL_SETTINGS, "CLASS_NOTES_EMAIL_ENABLED": True})
    def test_a_missing_document_still_sends_the_email(self):
        """A media volume that lost the file costs an attachment, not the
        only message telling a class their notes exist."""
        notes = self._run_with_segments(1)
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer("Teacher: First normal form."),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider), \
            mock.patch.object(
                services.notes_document, "build_notes_pdf", side_effect=OSError("no disk")
            ), self.captureOnCommitCallbacks(execute=True):
            services._write_up_local_notes(notes.pk)

        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(mail.outbox[0].attachments, [])
        self.assertIn("portal", mail.outbox[0].body)

    def test_a_failed_write_up_tells_the_teacher_and_nobody_else(self):
        """A failed run is neither running nor available, so it leaves no
        trace anywhere a teacher looks — no card button, no reader, nothing
        on the class at all. Without this they are left wondering whether the
        notes are still coming, and take notes on the next class the same
        way."""
        notes = self._run_with_segments(1)
        provider = mock.Mock()
        provider.generate_course.side_effect = [ProviderError("quota spent")]
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._write_up_local_notes(notes.pk)

        told = Notification.objects.filter(verb="class_notes_failed")
        self.assertEqual(told.count(), 1)
        self.assertEqual(told.first().recipient_id, self.teacher.pk)
        self.assertIn("quota spent", told.first().message)

    def test_a_run_that_unwinds_twice_tells_the_teacher_once(self):
        notes = self._run_with_segments(1)
        services._fail_notes(notes.pk, "the first and real reason")
        services._fail_notes(notes.pk, "the generic unwinding behind it")

        told = Notification.objects.filter(verb="class_notes_failed")
        self.assertEqual(told.count(), 1)
        notes.refresh_from_db()
        self.assertEqual(notes.error_message, "the first and real reason")

    def test_the_model_is_told_who_was_speaking_rather_than_asked_to_guess(self):
        """One mixed track carries no answer to "whose voice is this". The
        browser measured it from the separate tracks before mixing; this is
        where that measurement becomes names."""
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            self.send(
                speakers=[
                    {"at": 0, "uid": self.teacher.pk},
                    {"at": 6.5, "uid": self.student.pk},
                ]
            )
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer(f"{self.teacher.name}: open your books."),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._write_up_local_notes(notes.pk)

        prompt = provider.generate_course.call_args_list[0].args[0]
        self.assertIn("WHO WAS SPEAKING", prompt)
        self.assertIn(f"0:00 — {self.teacher.name}", prompt)
        self.assertIn(f"0:06 — {self.student.name}", prompt)
        self.assertIn("Never invent a name", prompt)

    def test_a_uid_the_roster_does_not_know_never_becomes_a_name(self):
        """The roster is the authority on who was in the room. An unknown
        uid is dropped rather than printed as a number the model would put in
        front of a sentence."""
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            self.send(speakers=[{"at": 0, "uid": self.outsider.pk}])

        segment = ClassSessionNotesAudio.objects.get(notes=notes)
        self.assertEqual(segment.speakers, [{"at": 0.0, "uid": self.outsider.pk}])
        self.assertEqual(services._speaker_names(self.session, segment.speakers), [])

    def test_a_recording_with_no_timeline_names_nobody(self):
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            self.send()
        provider = mock.Mock()
        provider.generate_course.side_effect = [
            transcript_answer("Speaker: open your books."),
            ProviderResult(text=json.dumps(MODEL_ANSWER)),
        ]
        with mock.patch.object(services, "get_provider", return_value=provider):
            services._write_up_local_notes(notes.pk)

        prompt = provider.generate_course.call_args_list[0].args[0]
        self.assertIn("not known for this recording", prompt)

    def test_a_malformed_timeline_costs_the_names_and_not_the_audio(self):
        notes = self.start()
        with mock.patch.object(services, "_spawn"):
            self.send(speakers=[{"at": "soon", "uid": "nobody"}, "junk", None])

        segment = ClassSessionNotesAudio.objects.get(notes=notes)
        self.assertEqual(segment.speakers, [])
        self.assertGreater(segment.size_bytes, 0)

    def test_the_teacher_is_told_why_the_last_attempt_came_to_nothing(self):
        notes = self._run_with_segments(1)
        services._fail_notes(notes.pk, "quota spent")

        teacher_state = services.notes_state(session=self.session, user=self.teacher)
        self.assertEqual(teacher_state["status"], ClassSessionNotes.NotesStatus.FAILED)
        self.assertIn("quota spent", teacher_state["error"])

        # Never the students: the reason names providers, quotas and files.
        student_state = services.notes_state(session=self.session, user=self.student)
        self.assertEqual(student_state["error"], "")


# ---------------------------------------------------------------------------
# It must never break a class, or the recording beside it
# ---------------------------------------------------------------------------


@override_settings(**LOCAL_SETTINGS)
class ClassroomIntegrationTests(LocalNotesTestCase):
    def test_a_class_opens_even_when_starting_the_notes_throws(self):
        with mock.patch.object(services, "start_notes", side_effect=RuntimeError("boom")):
            credentials = services.issue_join_credentials(
                session=self.session, user=self.teacher
            )
        self.assertTrue(credentials["token"])
        self.assertFalse(credentials["is_taking_notes"])

    def test_leaving_succeeds_even_when_stopping_the_notes_throws(self):
        services.issue_join_credentials(session=self.session, user=self.teacher)
        with mock.patch.object(services, "finish_notes", side_effect=RuntimeError("boom")):
            services.record_leave(session=self.session, user=self.teacher, ended=True)
        self.assertIsNotNone(
            self.session.attendances.filter(user=self.teacher).first().left_at
        )

    def test_leaving_succeeds_even_when_parking_the_notes_throws(self):
        services.issue_join_credentials(session=self.session, user=self.teacher)
        with mock.patch.object(
            services, "_pause_local_notes", side_effect=RuntimeError("boom")
        ):
            services.record_leave(session=self.session, user=self.teacher)
        self.assertIsNotNone(
            self.session.attendances.filter(user=self.teacher).first().left_at
        )

    def test_the_classroom_is_told_on_arrival_that_notes_are_being_taken(self):
        self.start()
        credentials = services.issue_join_credentials(
            session=self.session, user=self.student
        )
        self.assertTrue(credentials["is_taking_notes"])

    def test_a_class_with_no_recording_configured_is_still_written_up(self):
        """Different features, different bills, different failures — this
        server has an AI key and no bucket, which is exactly the shape of
        deployment the local source is for."""
        self.assertFalse(services.is_recording_configured())
        self.assertTrue(services.is_notes_configured())
        services.issue_join_credentials(session=self.session, user=self.teacher)
        self.assertIsNotNone(services.active_notes(self.session))


# ---------------------------------------------------------------------------
# Over HTTP — the contract the classroom actually speaks
# ---------------------------------------------------------------------------


@override_settings(**LOCAL_SETTINGS)
class NotesAudioViewTests(APITestCase):
    """The three requests a classroom makes, in the order it makes them.

    The service tests above say what each one does; these say that the wire
    carries it — which verb pauses, which flag ends, and who is turned away.
    """

    def setUp(self):
        self.teacher = make_user("viewcoach", "TEACHER")
        self.student = make_user("viewathlete", "STUDENT")
        self.outsider = make_user("viewstranger", "STUDENT")

        self.course = make_course(code="VW-101", title="Viewed course")
        assign_teacher(self.course, self.teacher)
        enrol(self.course, self.student)

        self.session = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-10
        )
        self.notes_url = reverse("class-sessions-notes", args=[self.session.pk])
        self.audio_url = reverse("class-sessions-notes-audio", args=[self.session.pk])
        self.document_url = reverse(
            "class-sessions-notes-document", args=[self.session.pk]
        )

    def tearDown(self):
        services._notes_monitored_ids.clear()

    def _post_audio(self, **extra):
        return self.client.post(
            self.audio_url,
            {"audio": audio_upload(), "client_key": secrets_key(), **extra},
            format="multipart",
        )

    def test_the_round_trip_a_classroom_makes(self):
        self.client.force_authenticate(self.teacher)

        started = self.client.post(self.notes_url)
        self.assertEqual(started.status_code, status.HTTP_200_OK)
        self.assertTrue(started.json()["data"]["is_transcribing"])
        self.assertEqual(
            started.json()["data"]["capture"]["capturer_id"], self.teacher.pk
        )

        self.assertEqual(self._post_audio().status_code, status.HTTP_200_OK)

        paused = self.client.delete(self.notes_url)
        self.assertEqual(paused.status_code, status.HTTP_200_OK)
        self.assertTrue(paused.json()["data"]["is_paused"])
        self.assertFalse(paused.json()["data"]["is_writing"])
        self.assertIn("paused", paused.json()["message"].lower())

        resumed = self.client.post(self.notes_url)
        self.assertTrue(resumed.json()["data"]["is_transcribing"])
        self.assertEqual(self.session.notes_runs.count(), 1)

        with mock.patch.object(services, "_spawn"):
            ended = self._post_audio(end="true")
        self.assertEqual(ended.status_code, status.HTTP_200_OK)
        self.assertTrue(ended.json()["data"]["is_writing"])
        self.assertEqual(
            ClassSessionNotesAudio.objects.filter(
                notes=self.session.notes_runs.first()
            ).count(),
            2,
        )

    def test_the_teachers_pdf_carries_the_transcript_and_the_students_does_not(self):
        """The write-up is for the class; the words are for the course's
        teachers. One stored file, shareable by construction, and a fuller
        copy rendered for whoever has already been checked."""
        notes = ClassSessionNotes.objects.create(
            session=self.session,
            status=ClassSessionNotes.NotesStatus.AVAILABLE,
            title="Normal forms",
            summary="We covered first normal form.",
            transcript="Coach: open your books.\nAthlete: which page?",
            notified_at=timezone.now(),
        )
        services._render_notes_document(notes)
        notes.refresh_from_db()
        self.addCleanup(notes.document.delete, save=False)

        self.client.force_authenticate(self.teacher)
        teacher_copy = self.client.get(self.document_url)
        self.assertEqual(teacher_copy.status_code, status.HTTP_200_OK)
        teacher_bytes = b"".join(teacher_copy.streaming_content)

        self.client.force_authenticate(self.student)
        student_copy = self.client.get(self.document_url)
        self.assertEqual(student_copy.status_code, status.HTTP_200_OK)
        student_bytes = b"".join(student_copy.streaming_content)

        # The stored file is what students get and what the email attaches.
        self.assertEqual(student_bytes, notes.document.read())
        self.assertGreater(len(teacher_bytes), len(student_bytes))

    def test_a_student_cannot_send_audio_for_a_class(self):
        self.client.force_authenticate(self.teacher)
        self.client.post(self.notes_url)

        self.client.force_authenticate(self.student)
        self.assertEqual(self._post_audio().status_code, status.HTTP_403_FORBIDDEN)

    def test_somebody_outside_the_course_is_not_told_the_class_exists(self):
        self.client.force_authenticate(self.outsider)
        self.assertEqual(self._post_audio().status_code, status.HTTP_404_NOT_FOUND)

    def test_audio_for_a_class_that_is_not_taking_notes_is_a_conflict(self):
        """409, not 500 and not 400: the request is fine and the teacher may
        post to this class — there is simply nowhere for it to go, which is a
        state the browser recovers from by stopping."""
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self._post_audio().status_code, status.HTTP_409_CONFLICT)

    def test_a_format_no_model_can_read_is_refused_as_unsupported(self):
        self.client.force_authenticate(self.teacher)
        self.client.post(self.notes_url)

        response = self.client.post(
            self.audio_url,
            {
                "audio": SimpleUploadedFile(
                    "part.txt", b"0" * 4096, content_type="text/plain"
                ),
                "client_key": secrets_key(),
            },
            format="multipart",
        )
        self.assertEqual(
            response.status_code, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        )
