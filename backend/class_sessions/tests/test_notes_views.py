"""The notes endpoints — who may read a class's notes, and who may run them.

One URL carries the state, the notes and the teacher's start/stop; a second
serves the PDF. The asserts here are mostly about the doors, because the
notes of a class are a record of a room that may be full of children, and
this view is the only thing between them and anyone with the class's id.

The transcript is the sharper edge of the same question: a student gets the
write-up, and only a teacher gets the words.
"""

from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .. import services
from ..models import ClassSession, ClassSessionNotes
from .factories import assign_teacher, enrol, make_course, make_session, make_user

UserModel = get_user_model()

APP_ID = "2f0e20ac920f4bcdb342451a6653358e"
APP_CERTIFICATE = "9b86a609600d427cbe3cd2f7dd6e4a93"

NOTES_SETTINGS = dict(
    AGORA_APP_ID=APP_ID,
    AGORA_APP_CERTIFICATE=APP_CERTIFICATE,
    CLASS_NOTES_ENABLED=True,
    CLASS_NOTES_LANGUAGES="en-US",
    AGORA_CUSTOMER_ID="",
    AGORA_CUSTOMER_SECRET="",
    AGORA_STT_CUSTOMER_ID="",
    AGORA_STT_CUSTOMER_SECRET="",
    AGORA_RECORDING_CUSTOMER_ID="customer",
    AGORA_RECORDING_CUSTOMER_SECRET="secret",
    AGORA_RECORDING_BUCKET="truetrek-recordings",
    AGORA_RECORDING_ACCESS_KEY="AKIAIOSFODNN7EXAMPLE",
    AGORA_RECORDING_SECRET_KEY="wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
    AI_PROVIDER="gemini",
    GEMINI_API_KEY="key",
)


@override_settings(**NOTES_SETTINGS)
class NotesViewTestCase(APITestCase):
    def setUp(self):
        self.teacher = make_user("notesteacher", UserModel.Roles.TEACHER)
        self.other_teacher = make_user("notesotherteacher", UserModel.Roles.TEACHER)
        self.student = make_user("notesstudent", UserModel.Roles.STUDENT)
        self.outsider = make_user("notesoutsider", UserModel.Roles.STUDENT)

        self.course = make_course()
        assign_teacher(self.course, self.teacher)
        enrol(self.course, self.student)

        self.session = make_session(
            course=self.course, teacher=self.teacher, starts_in_minutes=-10
        )
        self.url = reverse("class-sessions-notes", args=[self.session.pk])
        self.document_url = reverse(
            "class-sessions-notes-document", args=[self.session.pk]
        )

    def available_notes(self, **kwargs):
        kwargs.setdefault("title", "Database Normalization")
        kwargs.setdefault("summary", "The class covered first and second normal form.")
        kwargs.setdefault("key_topics", ["First normal form"])
        kwargs.setdefault("transcript", "Mr Smith: Open your books.")
        return ClassSessionNotes.objects.create(
            session=self.session,
            status=ClassSessionNotes.NotesStatus.AVAILABLE,
            bot_uid=3_500_000_000,
            notified_at=timezone.now(),
            **kwargs,
        )


class ReadNotesTests(NotesViewTestCase):
    def test_a_student_on_the_course_gets_the_notes(self):
        self.available_notes()
        self.client.force_authenticate(self.student)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["data"]["notes"]["title"], "Database Normalization"
        )

    def test_a_student_never_gets_the_transcript(self):
        """The write-up is for the class; the verbatim record of who said
        what is for the person who taught it."""
        self.available_notes()
        self.client.force_authenticate(self.student)

        response = self.client.get(self.url)
        self.assertIsNone(response.data["data"]["transcript"])

    def test_a_teacher_gets_the_transcript_too(self):
        self.available_notes()
        self.client.force_authenticate(self.teacher)

        response = self.client.get(self.url)
        self.assertEqual(
            response.data["data"]["transcript"], "Mr Smith: Open your books."
        )

    def test_somebody_outside_the_class_is_told_it_does_not_exist(self):
        """404 rather than 403: they aren't entitled to learn the class
        exists, let alone what was said in it."""
        self.available_notes()
        self.client.force_authenticate(self.outsider)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_another_teacher_cannot_read_a_class_they_do_not_teach(self):
        self.available_notes()
        self.client.force_authenticate(self.other_teacher)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_an_anonymous_request_is_refused(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_a_class_with_no_notes_answers_rather_than_erroring(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["data"]["available"])
        self.assertIsNone(response.data["data"]["notes"])


class StartAndStopTests(NotesViewTestCase):
    def test_the_teacher_can_start_taking_notes(self):
        self.client.force_authenticate(self.teacher)
        with mock.patch.object(services, "_spawn"):
            response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.session.notes_runs.count(), 1)

    def test_a_student_cannot_start_a_bot_listening_to_a_class(self):
        self.client.force_authenticate(self.student)
        with mock.patch.object(services, "_spawn"):
            response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.session.notes_runs.count(), 0)

    def test_a_student_cannot_switch_the_notes_off_either(self):
        ClassSessionNotes.objects.create(
            session=self.session,
            status=ClassSessionNotes.NotesStatus.TRANSCRIBING,
            bot_uid=3_500_000_000,
        )
        self.client.force_authenticate(self.student)

        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_the_teacher_can_stop_them(self):
        ClassSessionNotes.objects.create(
            session=self.session,
            status=ClassSessionNotes.NotesStatus.TRANSCRIBING,
            bot_uid=3_500_000_000,
            agent_id="ag-1",
        )
        self.client.force_authenticate(self.teacher)
        with mock.patch.object(services, "_spawn"):
            response = self.client.delete(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.session.notes_runs.first().status,
            ClassSessionNotes.NotesStatus.COLLECTING,
        )

    @override_settings(**{**NOTES_SETTINGS, "CLASS_NOTES_ENABLED": False})
    def test_an_unconfigured_server_answers_503_rather_than_pretending(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_a_class_set_not_to_take_notes_refuses_with_a_reason(self):
        self.session.takes_notes = False
        self.session.save(update_fields=["takes_notes"])
        self.client.force_authenticate(self.teacher)

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("not to take notes", response.data["message"])

    def test_stopping_a_class_that_is_not_taking_notes_is_not_an_error(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("isn't taking notes", response.data["message"])


class NotesDocumentTests(NotesViewTestCase):
    def _with_document(self):
        notes = self.available_notes()
        notes.document.save(
            "class-1-notes-deadbeef.pdf", ContentFile(b"%PDF-1.4 fake"), save=True
        )
        self.addCleanup(notes.document.delete, save=False)
        return notes

    def test_a_student_on_the_course_can_download_it(self):
        self._with_document()
        self.client.force_authenticate(self.student)

        response = self.client.get(self.document_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("attachment", response["Content-Disposition"])

    def test_somebody_outside_the_class_cannot(self):
        """The file sits in MEDIA_ROOT, so this check is the only thing that
        makes it as private as the class it is of."""
        self._with_document()
        self.client.force_authenticate(self.outsider)

        response = self.client.get(self.document_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_an_anonymous_request_is_refused(self):
        self._with_document()
        response = self.client.get(self.document_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_notes_with_no_document_answer_404_rather_than_500(self):
        self.available_notes()
        self.client.force_authenticate(self.student)

        response = self.client.get(self.document_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_a_row_whose_file_has_vanished_is_a_missing_download_not_a_crash(self):
        """A restored database against a fresh media volume. The notes
        themselves are still on screen."""
        notes = self._with_document()
        notes.document.storage.delete(notes.document.name)
        self.client.force_authenticate(self.student)

        response = self.client.get(self.document_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ClassListingTests(NotesViewTestCase):
    """The flags a card renders, which must not disagree with the endpoint."""

    def test_a_class_with_notes_says_so_on_its_card(self):
        self.available_notes()
        self.client.force_authenticate(self.student)

        response = self.client.get(reverse("class-sessions-my-upcoming"))
        row = response.data["data"]["results"][0]
        self.assertTrue(row["notes_available"])
        self.assertFalse(row["notes_in_progress"])
        self.assertTrue(row["takes_notes"])
        self.assertTrue(row["notes_configured"])

    def test_a_class_being_written_up_says_that_instead(self):
        ClassSessionNotes.objects.create(
            session=self.session,
            status=ClassSessionNotes.NotesStatus.SUMMARIZING,
            bot_uid=3_500_000_000,
        )
        self.client.force_authenticate(self.student)

        response = self.client.get(reverse("class-sessions-my-upcoming"))
        row = response.data["data"]["results"][0]
        self.assertFalse(row["notes_available"])
        self.assertTrue(row["notes_in_progress"])

    def test_a_teacher_schedules_recording_and_notes_independently(self):
        self.client.force_authenticate(self.teacher)
        response = self.client.post(
            reverse("class-sessions-teacher-list"),
            {
                "course": self.course.pk,
                "title": "Notes but no tape",
                "scheduled_at": (timezone.now() + timezone.timedelta(days=1)).isoformat(),
                "duration_minutes": 60,
                "is_recorded": False,
                "takes_notes": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = ClassSession.objects.get(title="Notes but no tape")
        self.assertFalse(created.is_recorded)
        self.assertTrue(created.takes_notes)
