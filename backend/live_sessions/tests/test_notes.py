"""AI meeting notes for a War Room Live session.

The session's own audio, recorded by the host's browser, posted here in
segments, read by the model, and handed back to the room as a write-up.
There is no transcription service and **no bucket anywhere in the path** —
which is the point of it: a deployment with an AI key and nothing else can
write a session up.

Five things this must never do, and they are what most of this file is about:

* **It must never record a session twice.** One browser captures, nominated
  by the run; a second admin in the same room posts nothing.
* **It must never lose or reorder a session.** Segment order is the server's
  decision, not the client's, and an upload retried after a timeout is one
  segment rather than two.
* **It must never turn a pause into an ending.** Stopping mid-session is a
  bookmark: a session taken in two stretches comes out as one set of notes
  covering both, not a second write-up that replaces the first.
* **It must never hang.** A browser that closes mid-session, or whose last
  upload never lands, has to end up as notes or as a stated failure — never
  as a run that is forever about to finish.
* **It must never hand the verbatim transcript to the room.** That is a
  record of who said what in a room that may be full of minors; the room gets
  the write-up.
"""

import json
import shutil
import tempfile
import uuid
from datetime import timedelta
from unittest import mock

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ai_courses.providers.base import (
    ProviderError,
    ProviderResult,
    ProviderTransportError,
)
from notifications.models import Notification

from .. import notes as notes_services
from .. import services
from ..exceptions import (
    NotesNotConfiguredError,
    NotesUnavailableError,
    SessionAccessDeniedError,
)
from ..models import LiveSessionNotes, LiveSessionNotesAudio, SessionRSVP
from .factories import make_session, make_speaker, make_user

UserModel = get_user_model()

APP_ID = "a" * 32
APP_CERTIFICATE = "b" * 32

# Everything this module renders or uploads lands here and is thrown away with
# it. Without this a suite run leaves orphaned .webm segments and .pdf
# write-ups in the real media folder.
_MEDIA_ROOT = tempfile.mkdtemp(prefix="live-session-notes-tests-")


def tearDownModule():
    shutil.rmtree(_MEDIA_ROOT, ignore_errors=True)


NOTES_SETTINGS = dict(
    MEDIA_ROOT=_MEDIA_ROOT,
    AGORA_APP_ID=APP_ID,
    AGORA_APP_CERTIFICATE=APP_CERTIFICATE,
    LIVE_SESSION_NOTES_ENABLED=True,
    LIVE_SESSION_NOTES_EMAIL_ENABLED=False,
    CLASS_NOTES_AUDIO_SEGMENT_SECONDS=240,
    CLASS_NOTES_AUDIO_BITRATE=24000,
    CLASS_NOTES_AUDIO_MAX_MB=40,
    AI_PROVIDER="gemini",
    GEMINI_API_KEY="key",
)

MODEL_ANSWER = {
    "has_content": True,
    "title": "Landing Your First Local Sponsor",
    "summary": "Maya walked through how she approached three local businesses.",
    "key_topics": ["Who to approach first", "What to put in front of them"],
    "important_points": [
        {"point": "Lead with the audience, not the sport", "detail": "They buy reach."}
    ],
    "action_items": [
        {"task": "List five local businesses", "owner": "Everyone", "due": "This week"}
    ],
    "next_class": "Following up after a no.",
}


def audio_upload(name="part.webm", content=b"\x1a\x45\xdf\xa3" + b"0" * 4096):
    return SimpleUploadedFile(name, content, content_type="audio/webm;codecs=opus")


def fresh_key():
    """A fresh client key per upload — two segments posted under one key are
    deliberately the same segment."""
    return uuid.uuid4().hex


def transcript_answer(text, has_speech=True):
    return ProviderResult(
        text=json.dumps({"has_speech": has_speech, "transcript": text})
    )


def notes_answer(**overrides):
    return ProviderResult(text=json.dumps({**MODEL_ANSWER, **overrides}))


@override_settings(**NOTES_SETTINGS)
class NotesTestCase(TestCase):
    """A session running right now, hosted by one admin, with a second admin
    who could take it over and two students in the room."""

    def setUp(self):
        self.admin = make_user("notesadmin", UserModel.Roles.ADMIN)
        self.cohost = make_user("notesadmin2", UserModel.Roles.ADMIN)
        self.student = make_user("notesathlete", UserModel.Roles.STUDENT)
        self.other_student = make_user("notesathlete2", UserModel.Roles.STUDENT)

        self.session = make_session(created_by=self.admin)
        self.session.speakers.add(make_speaker())

    def tearDown(self):
        # `_begin_summary` claims a run before spawning, and these tests
        # mostly stub the spawn — so the claim would otherwise outlive the
        # test. Primary keys are not rolled back with the transaction, so a
        # stale claim is only ever a near miss; clearing it makes it none.
        notes_services._monitored_ids.clear()

    def start(self, user=None):
        return notes_services.start_notes(
            session=self.session, user=user or self.admin
        )

    def send(self, user=None, *, end=False, upload=None, client_key="", speakers=None):
        return notes_services.store_notes_audio(
            session=self.session,
            user=user or self.admin,
            upload=upload or audio_upload(),
            client_key=client_key,
            duration_seconds=240,
            end=end,
            speakers=speakers,
        )

    def provider(self, *answers):
        provider = mock.Mock()
        provider.generate_course.side_effect = list(answers)
        return provider


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


class ConfigurationTests(NotesTestCase):
    def test_a_server_with_no_bucket_at_all_can_still_take_notes(self):
        """The whole reason this source exists. Nothing but the AI key."""
        self.assertTrue(notes_services.is_notes_configured())

    @override_settings(**{**NOTES_SETTINGS, "GEMINI_API_KEY": ""})
    def test_without_an_ai_key_there_is_nothing_to_write_the_notes(self):
        self.assertFalse(notes_services.is_notes_configured())
        with self.assertRaises(NotesNotConfiguredError):
            notes_services._assert_configured()

    @override_settings(**{**NOTES_SETTINGS, "LIVE_SESSION_NOTES_ENABLED": False})
    def test_the_deployment_wide_switch_turns_it_off(self):
        self.assertFalse(notes_services.is_notes_configured())
        with self.assertRaises(NotesNotConfiguredError):
            self.start()


# ---------------------------------------------------------------------------
# Starting, pausing and resuming
# ---------------------------------------------------------------------------


class StartStopTests(NotesTestCase):
    def test_starting_needs_no_thread_and_no_third_party(self):
        with mock.patch.object(notes_services, "_spawn") as spawn:
            run = self.start()
        spawn.assert_not_called()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.TRANSCRIBING)
        self.assertTrue(run.is_listening)
        self.assertEqual(run.started_by, self.admin)
        self.assertIsNotNone(run.started_at)

    def test_two_admins_arriving_together_still_make_one_run(self):
        first = self.start()
        second = self.start(self.cohost)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(self.session.notes_runs.count(), 1)

    def test_the_stop_button_is_a_pause_not_an_ending(self):
        run = self.start()
        self.send(client_key=fresh_key())

        paused = notes_services.stop_notes(session=self.session, user=self.admin)

        self.assertEqual(paused.pk, run.pk)
        self.assertTrue(paused.is_paused)
        self.assertFalse(paused.is_working)
        # Nothing has been thrown away and nothing has been written up.
        self.assertEqual(paused.audio_segments.count(), 1)
        self.assertEqual(paused.summary, "")

    def test_starting_again_resumes_the_same_run(self):
        """A session taken in two stretches is one session. Two runs would
        write up the second and replace the first on the card."""
        run = self.start()
        self.send(client_key=fresh_key())
        notes_services.stop_notes(session=self.session, user=self.admin)

        resumed = self.start()
        self.send(client_key=fresh_key())

        self.assertEqual(resumed.pk, run.pk)
        self.assertTrue(resumed.is_listening)
        self.assertEqual(self.session.notes_runs.count(), 1)
        self.assertEqual(resumed.audio_segments.count(), 2)

    def test_resuming_nominates_the_browser_that_asked(self):
        """A host who reloaded — or a colleague taking over a room the first
        admin walked out of — has to become the capturer, or nothing records
        the rest of the session."""
        self.start()
        notes_services.stop_notes(session=self.session, user=self.admin)

        resumed = self.start(self.cohost)

        self.assertEqual(resumed.started_by, self.cohost)
        self.assertEqual(
            notes_services.notes_capture_config(self.session, resumed)["capturer_id"],
            self.cohost.pk,
        )

    def test_a_paused_run_says_nothing_is_happening(self):
        """Announcing "notes are being taken" over a parked run would be a
        lie, and the button has to be free to press again."""
        self.start()
        notes_services.stop_notes(session=self.session, user=self.admin)

        state = notes_services.notes_state(session=self.session, user=self.admin)

        self.assertTrue(state["is_paused"])
        self.assertFalse(state["is_transcribing"])
        self.assertFalse(state["is_writing"])
        self.assertIsNone(state["capture"]["capturer_id"])

    def test_a_cancelled_session_is_not_written_up(self):
        self.session.status = self.session.SessionStatus.CANCELLED
        self.session.save(update_fields=["status"])
        with self.assertRaises(NotesNotConfiguredError):
            self.start()

    def test_the_scheduling_switch_is_not_a_permission(self):
        """`takes_notes` decides whether a session writes itself up by itself.
        An admin who left the box unticked must still be able to press the
        button during it."""
        self.session.takes_notes = False
        self.session.save(update_fields=["takes_notes"])

        run = self.start()

        self.assertTrue(run.is_listening)

    def test_a_session_only_writes_itself_up_for_its_host(self):
        self.assertIsNone(notes_services.maybe_start_notes(self.session, self.student))
        self.assertIsNotNone(notes_services.maybe_start_notes(self.session, self.admin))

    def test_the_scheduling_switch_stops_it_starting_by_itself(self):
        self.session.takes_notes = False
        self.session.save(update_fields=["takes_notes"])
        self.assertIsNone(notes_services.maybe_start_notes(self.session, self.admin))


# ---------------------------------------------------------------------------
# The audio arriving
# ---------------------------------------------------------------------------


class AudioUploadTests(NotesTestCase):
    def test_the_server_numbers_the_segments(self):
        """A capturer that crashed and came back would restart its own
        numbering and silently overwrite the first half of the session."""
        self.start()
        self.send(client_key=fresh_key())
        self.send(client_key=fresh_key())
        self.send(client_key=fresh_key())

        self.assertEqual(
            list(
                LiveSessionNotesAudio.objects.order_by("index").values_list(
                    "index", flat=True
                )
            ),
            [0, 1, 2],
        )

    def test_the_same_segment_sent_twice_is_one_segment(self):
        self.start()
        key = fresh_key()
        self.send(client_key=key)
        self.send(client_key=key)
        self.assertEqual(LiveSessionNotesAudio.objects.count(), 1)

    def test_only_the_nominated_browser_is_accepted(self):
        """A second admin's room must not post an overlapping copy of the
        same hour."""
        self.start(self.admin)
        with self.assertRaises(NotesUnavailableError):
            self.send(self.cohost, client_key=fresh_key())

    def test_a_student_cannot_post_audio_at_all(self):
        self.start()
        with self.assertRaises(SessionAccessDeniedError):
            self.send(self.student, client_key=fresh_key())

    def test_a_format_no_model_can_read_is_refused_at_the_door(self):
        from class_sessions.notes_audio import UnsupportedAudioError

        self.start()
        with self.assertRaises(UnsupportedAudioError):
            self.send(
                upload=SimpleUploadedFile(
                    "part.txt", b"0" * 4096, content_type="text/plain"
                ),
                client_key=fresh_key(),
            )

    def test_an_empty_container_is_ignored_rather_than_stored(self):
        self.start()
        self.send(
            upload=SimpleUploadedFile("tiny.webm", b"\x1a\x45", content_type="audio/webm"),
            client_key=fresh_key(),
        )
        self.assertEqual(LiveSessionNotesAudio.objects.count(), 0)

    def test_an_oversized_segment_is_refused_with_the_limit_in_the_message(self):
        self.start()
        with override_settings(CLASS_NOTES_AUDIO_MAX_MB=1):
            with self.assertRaises(NotesUnavailableError) as caught:
                self.send(
                    upload=SimpleUploadedFile(
                        "big.webm",
                        b"\x1a\x45\xdf\xa3" + b"0" * (2 * 1024 * 1024),
                        content_type="audio/webm",
                    ),
                    client_key=fresh_key(),
                )
        self.assertIn("1 MB", str(caught.exception))

    def test_the_segment_in_flight_when_the_host_pressed_stop_is_still_taken(self):
        """It is the end of what they were just saying — refusing it would
        lose precisely the minutes nobody wants to lose."""
        self.start()
        notes_services.stop_notes(session=self.session, user=self.admin)
        self.send(client_key=fresh_key())
        self.assertEqual(LiveSessionNotesAudio.objects.count(), 1)

    def test_the_closing_upload_is_what_starts_the_write_up(self):
        self.start()
        with mock.patch.object(notes_services, "_spawn") as spawn:
            self.send(client_key=fresh_key())
            spawn.assert_not_called()
            self.send(client_key=fresh_key(), end=True)
            spawn.assert_called_once()

        run = self.session.notes_runs.get()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.SUMMARIZING)

    def test_a_closing_upload_with_no_audio_behind_it_does_not_fail_yet(self):
        """The segment that was in flight may still be on its way; the
        deadline decides it never arrived, not this."""
        self.start()
        self.send(
            upload=SimpleUploadedFile("tiny.webm", b"\x1a\x45", content_type="audio/webm"),
            client_key=fresh_key(),
            end=True,
        )
        run = self.session.notes_runs.get()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.COLLECTING)


# ---------------------------------------------------------------------------
# Nothing ever hangs
# ---------------------------------------------------------------------------


class ProgressTests(NotesTestCase):
    def _age(self, run, seconds):
        LiveSessionNotes.objects.filter(pk=run.pk).update(
            updated_at=timezone.now() - timedelta(seconds=seconds)
        )
        run.refresh_from_db()
        return run

    def test_a_listening_run_is_left_alone_until_its_session_is_over(self):
        run = self.start()
        self.assertFalse(notes_services._ensure_notes_progress(run))
        run.refresh_from_db()
        self.assertTrue(run.is_listening)

    def test_a_run_that_outlived_its_session_is_finished_off(self):
        """A host who simply closed their laptop. There is no scheduler here,
        so the next request that asks about the session is what moves it —
        and it does so in two steps, because the segment that was in flight
        when the laptop shut is still worth waiting for."""
        self.session.scheduled_at = timezone.now() - timedelta(hours=3)
        self.session.save(update_fields=["scheduled_at"])
        run = self.start()
        self.send(client_key=fresh_key())

        with mock.patch.object(notes_services, "_spawn") as spawn:
            # First pass: the run is closed and the grace for its last
            # segment starts here, so nothing is written up yet.
            self.assertFalse(notes_services._ensure_notes_progress(run))
            spawn.assert_not_called()
        run.refresh_from_db()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.COLLECTING)

        self._age(run, notes_services.UPLOAD_GRACE_SECONDS + 60)
        with mock.patch.object(notes_services, "_spawn") as spawn:
            self.assertTrue(notes_services._ensure_notes_progress(run))
            spawn.assert_called_once()

        run.refresh_from_db()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.SUMMARIZING)

    def test_a_paused_run_is_finished_by_the_same_deadline(self):
        """Twenty minutes already recorded are still a session; leaving them
        parked forever would mean notes that never arrive.

        And it is finished in one pass rather than two: the browser stopped
        and flushed when the host pressed the button, so there is nothing in
        flight and the grace would only hold back notes already complete.
        """
        self.session.scheduled_at = timezone.now() - timedelta(hours=3)
        self.session.save(update_fields=["scheduled_at"])
        run = self.start()
        self.send(client_key=fresh_key())
        notes_services.stop_notes(session=self.session, user=self.admin)
        run.refresh_from_db()

        with mock.patch.object(notes_services, "_spawn") as spawn:
            self.assertTrue(notes_services._ensure_notes_progress(run))
            spawn.assert_called_once()

        run.refresh_from_db()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.SUMMARIZING)

    def test_a_run_whose_audio_never_arrived_fails_with_a_reason(self):
        self.session.scheduled_at = timezone.now() - timedelta(hours=3)
        self.session.save(update_fields=["scheduled_at"])
        run = self.start()

        # Closed by the deadline, then given its grace, then given up on.
        notes_services._ensure_notes_progress(run)
        self._age(run, notes_services.UPLOAD_GRACE_SECONDS + 60)
        notes_services._ensure_notes_progress(run)

        run.refresh_from_db()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.FAILED)
        self.assertIn("ever reached the server", run.error_message)

    def test_a_failure_is_told_to_the_host_and_to_nobody_else(self):
        run = self.start()
        notes_services._fail_notes(run.pk, "The provider refused.")

        self.assertTrue(
            Notification.objects.filter(
                recipient=self.admin, verb="live_session_notes_failed"
            ).exists()
        )
        self.assertFalse(
            Notification.objects.filter(recipient=self.student).exists()
        )

    def test_a_write_up_is_only_adopted_once_it_has_been_quiet_a_long_time(self):
        """A window shorter than the work it is watching does not recover an
        orphan — it starts a second thread transcribing the same session and
        bills the model twice."""
        run = self.start()
        LiveSessionNotes.objects.filter(pk=run.pk).update(
            status=LiveSessionNotes.NotesStatus.SUMMARIZING
        )
        run.refresh_from_db()

        self._age(run, 60)
        with mock.patch.object(notes_services, "_spawn") as spawn:
            self.assertFalse(notes_services._ensure_notes_progress(run))
            spawn.assert_not_called()

        self._age(run, notes_services.ORPHAN_AFTER_SECONDS + 60)
        with mock.patch.object(notes_services, "_spawn") as spawn:
            self.assertTrue(notes_services._ensure_notes_progress(run))
            spawn.assert_called_once()

    def test_two_endings_arriving_together_start_one_write_up(self):
        run = self.start()
        self.send(client_key=fresh_key())
        with mock.patch.object(notes_services, "_spawn") as spawn:
            notes_services.finish_notes(session=self.session, user=self.admin)
            notes_services.finish_notes(session=self.session, user=self.admin)
            self.assertEqual(spawn.call_count, 1)


# ---------------------------------------------------------------------------
# Transcribing and writing up
# ---------------------------------------------------------------------------


class WriteUpTests(NotesTestCase):
    def _recorded(self, segments=2):
        run = self.start()
        for _ in range(segments):
            self.send(client_key=fresh_key())
        LiveSessionNotes.objects.filter(pk=run.pk).update(
            status=LiveSessionNotes.NotesStatus.SUMMARIZING
        )
        run.refresh_from_db()
        return run

    def test_a_session_is_read_in_order_and_written_up(self):
        run = self._recorded()
        provider = self.provider(
            transcript_answer("Maya: Start with the gym you already train at."),
            transcript_answer("Maya: Then ask for a meeting, not for money."),
            notes_answer(),
        )

        with mock.patch.object(notes_services, "get_provider", return_value=provider):
            notes_services._write_up(run.pk)

        run.refresh_from_db()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.AVAILABLE)
        self.assertIn("gym you already train at", run.transcript)
        self.assertIn("not for money", run.transcript)
        self.assertEqual(run.title, MODEL_ANSWER["title"])
        self.assertEqual(run.key_topics, MODEL_ANSWER["key_topics"])

    def test_one_unreadable_segment_does_not_cost_the_session(self):
        """Losing ten minutes out of an hour is worth far more than losing
        the hour."""
        run = self._recorded(segments=3)
        provider = self.provider(
            transcript_answer("First part."),
            ProviderError("refused"),
            transcript_answer("Third part."),
            notes_answer(),
        )

        with mock.patch.object(notes_services, "get_provider", return_value=provider):
            notes_services._write_up(run.pk)

        run.refresh_from_db()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.AVAILABLE)
        self.assertIn("First part.", run.transcript)
        self.assertIn("Third part.", run.transcript)

    def test_every_segment_failing_is_reported_as_what_broke(self):
        run = self._recorded(segments=1)
        provider = self.provider(ProviderError("quota spent"))

        with mock.patch.object(notes_services, "get_provider", return_value=provider):
            notes_services._write_up(run.pk)

        run.refresh_from_db()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.FAILED)
        self.assertIn("quota spent", run.error_message)

    def test_a_resumed_write_up_never_pays_to_read_the_same_audio_twice(self):
        run = self._recorded(segments=2)
        provider = self.provider(
            transcript_answer("First."), ProviderError("refused")
        )
        with mock.patch.object(notes_services, "get_provider", return_value=provider):
            notes_services._transcribe_audio(run)

        second = self.provider(transcript_answer("Second."), notes_answer())
        with mock.patch.object(notes_services, "get_provider", return_value=second):
            notes_services._write_up(run.pk)

        # Two calls on the resumed pass: the one segment nobody had read, and
        # the write-up itself. The first segment's transcript came off the row.
        self.assertEqual(second.generate_course.call_count, 2)
        run.refresh_from_db()
        self.assertIn("First.", run.transcript)
        self.assertIn("Second.", run.transcript)

    def test_a_name_is_used_only_where_it_was_measured(self):
        """The model is handed the browser's measurement rather than asked to
        guess: a sentence filed under the wrong person's name is worse than
        one filed under nobody's."""
        services.issue_join_credentials(session=self.session, user=self.student)
        run = self.start()
        outsider_uid = self.other_student.pk
        self.send(
            client_key=fresh_key(),
            speakers=[
                {"at": 0, "uid": self.student.pk},
                {"at": 12, "uid": outsider_uid},
            ],
        )
        LiveSessionNotes.objects.filter(pk=run.pk).update(
            status=LiveSessionNotes.NotesStatus.SUMMARIZING
        )
        run.refresh_from_db()

        provider = self.provider(transcript_answer("..."), notes_answer())
        with mock.patch.object(notes_services, "get_provider", return_value=provider):
            notes_services._write_up(run.pk)

        prompt = provider.generate_course.call_args_list[0][0][0]
        self.assertIn(self.student.name, prompt)
        # Nobody the server can name — so no name, rather than a number the
        # model would print as one.
        self.assertNotIn(self.other_student.name, prompt)

    def test_the_session_and_its_guests_are_given_as_context(self):
        run = self._recorded(segments=1)
        provider = self.provider(transcript_answer("..."), notes_answer())
        with mock.patch.object(notes_services, "get_provider", return_value=provider):
            notes_services._write_up(run.pk)

        write_up_prompt = provider.generate_course.call_args_list[1][0][0]
        self.assertIn("War Room Live", write_up_prompt)
        self.assertIn("Maya Torres", write_up_prompt)
        self.assertIn(self.session.title, write_up_prompt)

    def test_the_middle_is_dropped_from_an_over_long_transcript_never_the_end(self):
        """The last minutes carry the closing advice and whatever the guest
        was asked last, which is half of what notes are for."""
        text = "START" + ("x" * notes_services.MAX_TRANSCRIPT_CHARS) + "END"
        trimmed = notes_services._trim_transcript(text)
        self.assertLessEqual(len(trimmed), notes_services.MAX_TRANSCRIPT_CHARS)
        self.assertTrue(trimmed.startswith("START"))
        self.assertTrue(trimmed.endswith("END"))

    def test_only_a_transport_failure_is_retried(self):
        run = self._recorded(segments=1)
        provider = self.provider(
            transcript_answer("..."),
            ProviderTransportError("blip"),
            notes_answer(),
        )
        with mock.patch.object(
            notes_services, "get_provider", return_value=provider
        ), mock.patch.object(notes_services.time, "sleep"):
            notes_services._write_up(run.pk)

        run.refresh_from_db()
        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.AVAILABLE)


# ---------------------------------------------------------------------------
# Telling the room
# ---------------------------------------------------------------------------


class PublishTests(NotesTestCase):
    def _written(self, **overrides):
        run = self.start()
        self.send(client_key=fresh_key())
        LiveSessionNotes.objects.filter(pk=run.pk).update(
            status=LiveSessionNotes.NotesStatus.SUMMARIZING
        )
        run.refresh_from_db()
        provider = self.provider(
            transcript_answer("Maya: lead with the audience."),
            notes_answer(**overrides),
        )
        # The email is deliberately sent on commit, so a rollback cannot tell
        # a room about notes this server then forgot. Nothing commits inside
        # a TestCase, so the callbacks are run explicitly.
        with mock.patch.object(
            notes_services, "get_provider", return_value=provider
        ), self.captureOnCommitCallbacks(execute=True):
            notes_services._write_up(run.pk)
        run.refresh_from_db()
        return run

    def test_the_room_is_told_exactly_once(self):
        services.rsvp_to_session(session=self.session, student=self.student)
        services.rsvp_to_session(session=self.session, student=self.other_student)
        run = self._written()

        # A second publish — the deadline racing the host's leave ping.
        notes_services._publish_notes(run.pk, announce_to_room=True)

        told = Notification.objects.filter(verb="live_session_notes_ready")
        self.assertEqual(told.filter(recipient=self.student).count(), 1)
        self.assertEqual(told.filter(recipient=self.other_student).count(), 1)
        self.assertEqual(told.filter(recipient=self.admin).count(), 1)

    def test_a_session_where_nothing_was_said_is_published_but_not_announced(self):
        services.rsvp_to_session(session=self.session, student=self.student)
        run = self._written(has_content=False)

        self.assertEqual(run.status, LiveSessionNotes.NotesStatus.AVAILABLE)
        self.assertFalse(
            Notification.objects.filter(recipient=self.student).exists()
        )
        host_note = Notification.objects.get(recipient=self.admin)
        self.assertIn("nothing much was said", host_note.message)

    @override_settings(**{**NOTES_SETTINGS, "LIVE_SESSION_NOTES_EMAIL_ENABLED": True})
    def test_the_write_up_is_emailed_with_the_pdf_attached(self):
        services.rsvp_to_session(session=self.session, student=self.student)
        run = self._written()

        self.assertEqual(len(mail.outbox), 2)
        recipients = {address for message in mail.outbox for address in message.to}
        self.assertEqual(recipients, {self.student.email, self.admin.email})
        # Nobody's address is in anybody else's To: header.
        for message in mail.outbox:
            self.assertEqual(len(message.to), 1)
        self.assertTrue(run.document)
        self.assertTrue(all(message.attachments for message in mail.outbox))
        self.assertEqual(
            mail.outbox[0].attachments[0][0],
            self.session.notes_context()["document_name"],
        )
        # The verbatim transcript is the opposite of the write-up and is
        # never sent.
        for message in mail.outbox:
            self.assertNotIn("lead with the audience", message.body)

    @override_settings(**{**NOTES_SETTINGS, "LIVE_SESSION_NOTES_EMAIL_ENABLED": False})
    def test_the_email_can_be_switched_off_without_touching_the_notification(self):
        services.rsvp_to_session(session=self.session, student=self.student)
        self._written()
        self.assertEqual(len(mail.outbox), 0)
        self.assertTrue(
            Notification.objects.filter(recipient=self.student).exists()
        )


# ---------------------------------------------------------------------------
# Through the API
# ---------------------------------------------------------------------------


@override_settings(**NOTES_SETTINGS)
class NotesViewTests(APITestCase):
    def setUp(self):
        self.admin = make_user("apinotesadmin", UserModel.Roles.ADMIN)
        self.student = make_user("apinotesathlete", UserModel.Roles.STUDENT)
        self.session = make_session(created_by=self.admin)
        self.url = reverse("live-sessions-notes", args=[self.session.id])

    def tearDown(self):
        notes_services._monitored_ids.clear()

    def test_a_student_can_neither_start_nor_stop_the_notes(self):
        self.client.force_authenticate(user=self.student)
        self.assertEqual(
            self.client.post(self.url).status_code, status.HTTP_403_FORBIDDEN
        )
        self.assertEqual(
            self.client.delete(self.url).status_code, status.HTTP_403_FORBIDDEN
        )

    def test_a_host_starts_and_pauses_them(self):
        self.client.force_authenticate(user=self.admin)

        started = self.client.post(self.url)
        self.assertEqual(started.status_code, status.HTTP_200_OK)
        self.assertTrue(started.json()["data"]["is_transcribing"])

        paused = self.client.delete(self.url)
        self.assertEqual(paused.status_code, status.HTTP_200_OK)
        self.assertTrue(paused.json()["data"]["is_paused"])
        # Said in the words of what actually happened — "stopped" would have a
        # host watching for a document that is not coming yet.
        self.assertIn("paused", paused.json()["message"].lower())

    def test_pressing_the_button_is_remembered_as_a_change_of_mind(self):
        """`maybe_start_notes` runs inside every host join and a room re-joins
        on its own whenever Agora renews a token — so a switch left on would
        restart the thing the host had just switched off."""
        self.client.force_authenticate(user=self.admin)
        self.client.post(self.url)
        self.client.delete(self.url)

        self.session.refresh_from_db()
        self.assertFalse(self.session.takes_notes)

    def test_the_transcript_reaches_a_host_and_nobody_else(self):
        run = LiveSessionNotes.objects.create(
            session=self.session,
            status=LiveSessionNotes.NotesStatus.AVAILABLE,
            summary="A summary.",
            title="Notes",
            transcript="Maya: this is exactly what I said.",
            notified_at=timezone.now(),
        )

        self.client.force_authenticate(user=self.student)
        student_body = self.client.get(self.url).json()["data"]
        self.assertIsNotNone(student_body["notes"])
        self.assertIsNone(student_body["transcript"])

        self.client.force_authenticate(user=self.admin)
        host_body = self.client.get(self.url).json()["data"]
        self.assertEqual(host_body["transcript"], run.transcript)

    def test_the_failure_reason_is_the_hosts_alone(self):
        LiveSessionNotes.objects.create(
            session=self.session,
            status=LiveSessionNotes.NotesStatus.FAILED,
            error_message="The provider refused the request.",
        )

        self.client.force_authenticate(user=self.student)
        self.assertEqual(self.client.get(self.url).json()["data"]["error"], "")

        self.client.force_authenticate(user=self.admin)
        self.assertIn(
            "refused", self.client.get(self.url).json()["data"]["error"]
        )

    def test_an_upload_with_nowhere_to_go_is_a_409_rather_than_an_error(self):
        """A state the browser recovers from by stopping, not something to
        put in front of the host."""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            reverse("live-sessions-notes-audio", args=[self.session.id]),
            {"audio": audio_upload(), "client_key": fresh_key()},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_a_student_cannot_post_the_rooms_audio(self):
        self.client.force_authenticate(user=self.admin)
        self.client.post(self.url)

        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            reverse("live-sessions-notes-audio", args=[self.session.id]),
            {"audio": audio_upload(), "client_key": fresh_key()},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_there_is_no_document_until_there_are_notes(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(
            reverse("live-sessions-notes-document", args=[self.session.id])
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
