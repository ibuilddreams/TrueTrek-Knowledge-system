from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from teacher_onboarding.models import TeacherCredential, TeacherOnboarding
from teacher_onboarding.services import (
    MAX_CREDENTIALS,
    start_onboarding_for_signup,
)
from teacher_onboarding.validators import MAX_DOCUMENT_SIZE_MB

from .factories import (
    BIO,
    TempMediaMixin,
    fill_profile,
    make_admin,
    make_student,
    make_teacher,
)

UserModel = get_user_model()

ME_URL = "/api/teacher-onboarding/me/"
SUBMIT_URL = "/api/teacher-onboarding/me/submit/"
CREDENTIALS_URL = "/api/teacher-onboarding/me/credentials/"
STATUS_URL = "/api/teacher-onboarding/status/"
ADMIN_URL = "/api/teacher-onboarding/admin/"
SUMMARY_URL = "/api/teacher-onboarding/admin/summary/"


def a_document(name="degree.pdf"):
    return SimpleUploadedFile(name, b"%PDF-1.4 fake", content_type="application/pdf")


def a_video(name="intro.mp4"):
    return SimpleUploadedFile(name, b"\x00\x00\x00\x18ftypmp42", content_type="video/mp4")


class SignupCreatesApplicationTests(TempMediaMixin, APITestCase):
    """Signing up as a teacher is what puts an account into the queue."""

    def _signup(self, role, email):
        return self.client.post(
            "/api/auth/signup/",
            {
                "username": email.split("@")[0],
                "first_name": "New",
                "last_name": "Person",
                "email": email,
                "password": "StrongPass123!",
                "role": role,
            },
            format="json",
        )

    def test_a_teacher_signup_opens_a_draft_application(self):
        response = self._signup(UserModel.Roles.TEACHER, "newteacher@example.com")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        onboarding = TeacherOnboarding.objects.get(user__email="newteacher@example.com")
        self.assertEqual(onboarding.status, TeacherOnboarding.ApplicationStatus.DRAFT)
        self.assertEqual(onboarding.step, TeacherOnboarding.Step.PROFILE)

    def test_a_student_signup_opens_nothing(self):
        self._signup(UserModel.Roles.STUDENT, "newstudent@example.com")

        self.assertEqual(TeacherOnboarding.objects.count(), 0)


class AccessStatusViewTests(TempMediaMixin, APITestCase):
    def test_a_submitted_teacher_is_let_into_the_portal_unapproved(self):
        teacher = make_teacher("submitted@example.com")
        onboarding = fill_profile(
            start_onboarding_for_signup(teacher), intro_video_url="https://youtu.be/abc123"
        )
        TeacherCredential.objects.create(
            onboarding=onboarding, title="BSc", document=a_document()
        )
        self.client.force_authenticate(teacher)
        self.client.post(SUBMIT_URL)

        data = self.client.get(STATUS_URL).data["data"]

        self.assertTrue(data["requires_onboarding"])
        self.assertTrue(data["can_access_portal"])
        self.assertFalse(data["needs_action"])
        self.assertFalse(data["is_approved"])

    def test_a_pending_teacher_is_told_the_portal_is_closed(self):
        teacher = make_teacher()
        start_onboarding_for_signup(teacher)
        self.client.force_authenticate(teacher)

        data = self.client.get(STATUS_URL).data["data"]

        self.assertTrue(data["requires_onboarding"])
        self.assertFalse(data["can_access_portal"])
        self.assertEqual(data["status"], TeacherOnboarding.ApplicationStatus.DRAFT)

    def test_everyone_else_is_told_nothing_is_required(self):
        for user in (make_teacher(), make_student(), make_admin()):
            with self.subTest(role=user.role):
                self.client.force_authenticate(user)
                data = self.client.get(STATUS_URL).data["data"]
                self.assertFalse(data["requires_onboarding"])
                self.assertTrue(data["can_access_portal"])

    def test_a_guest_is_refused(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(STATUS_URL).status_code, status.HTTP_401_UNAUTHORIZED)


class MyApplicationViewTests(TempMediaMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.teacher = make_teacher()
        self.onboarding = start_onboarding_for_signup(self.teacher)
        self.client.force_authenticate(self.teacher)

    def test_fetching_returns_the_checklist_of_what_is_missing(self):
        response = self.client.get(ME_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertFalse(data["is_complete"])
        self.assertTrue(data["can_edit"])
        self.assertEqual(len(data["missing_requirements"]), 8)

    def test_saving_a_step_persists_it(self):
        response = self.client.patch(
            ME_URL,
            {
                "step": TeacherOnboarding.Step.EXPERTISE,
                "headline": "Secondary mathematics teacher",
                "bio": BIO,
                "highest_qualification": TeacherOnboarding.Qualification.MASTERS,
                "years_of_experience": 10,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.onboarding.refresh_from_db()
        self.assertEqual(self.onboarding.headline, "Secondary mathematics teacher")
        self.assertEqual(self.onboarding.step, TeacherOnboarding.Step.EXPERTISE)

    def test_expertise_is_trimmed_deduplicated_and_capped(self):
        response = self.client.patch(
            ME_URL,
            {"expertise": ["  Algebra  ", "algebra", "Calculus", "   "]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.onboarding.refresh_from_db()
        self.assertEqual(self.onboarding.expertise, ["Algebra", "Calculus"])

    def test_too_many_subjects_are_refused(self):
        response = self.client.patch(
            ME_URL,
            {"expertise": [f"Subject {index}" for index in range(20)]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_an_unrealistic_experience_figure_is_refused(self):
        response = self.client.patch(ME_URL, {"years_of_experience": 300}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_uploading_an_intro_video_records_its_name_and_size(self):
        response = self.client.patch(
            ME_URL, {"intro_video": a_video()}, format="multipart"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.onboarding.refresh_from_db()
        self.assertTrue(self.onboarding.intro_video)
        self.assertEqual(self.onboarding.intro_video_name, "intro.mp4")
        self.assertEqual(self.onboarding.intro_video_size, len(b"\x00\x00\x00\x18ftypmp42"))
        self.assertIsNotNone(response.data["data"]["intro_video_display_url"])

    def test_an_unplayable_video_format_is_refused(self):
        response = self.client.patch(
            ME_URL,
            {"intro_video": SimpleUploadedFile("intro.avi", b"junk", content_type="video/avi")},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.onboarding.refresh_from_db()
        self.assertFalse(self.onboarding.intro_video)

    def test_removing_an_uploaded_video_clears_the_row(self):
        self.client.patch(ME_URL, {"intro_video": a_video()}, format="multipart")

        response = self.client.patch(ME_URL, {"remove_intro_video": True}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.onboarding.refresh_from_db()
        self.assertFalse(self.onboarding.intro_video)
        self.assertEqual(self.onboarding.intro_video_name, "")
        self.assertIsNone(self.onboarding.intro_video_size)

    def test_a_submitted_application_cannot_be_edited(self):
        fill_profile(self.onboarding)
        TeacherCredential.objects.create(
            onboarding=self.onboarding, title="BSc", document=a_document()
        )
        self.onboarding.intro_video_url = "https://youtu.be/abc123"
        self.onboarding.save()
        self.client.post(SUBMIT_URL)

        response = self.client.patch(ME_URL, {"headline": "Changed"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.onboarding.refresh_from_db()
        self.assertNotEqual(self.onboarding.headline, "Changed")

    def test_a_student_is_refused(self):
        self.client.force_authenticate(make_student())

        self.assertEqual(self.client.get(ME_URL).status_code, status.HTTP_403_FORBIDDEN)


class SubmitViewTests(TempMediaMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.teacher = make_teacher()
        self.onboarding = start_onboarding_for_signup(self.teacher)
        self.client.force_authenticate(self.teacher)

    def _complete(self):
        fill_profile(self.onboarding, intro_video_url="https://youtu.be/abc123")
        TeacherCredential.objects.create(
            onboarding=self.onboarding, title="BSc Mathematics", document=a_document()
        )

    def test_an_incomplete_application_is_refused_and_says_why(self):
        response = self.client.post(SUBMIT_URL)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("headline", response.data["message"])
        self.onboarding.refresh_from_db()
        self.assertEqual(self.onboarding.status, TeacherOnboarding.ApplicationStatus.DRAFT)

    def test_a_complete_application_is_queued(self):
        self._complete()

        response = self.client.post(SUBMIT_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["data"]["status"], TeacherOnboarding.ApplicationStatus.SUBMITTED
        )
        self.assertFalse(response.data["data"]["can_edit"])

    def test_submitting_twice_is_refused(self):
        self._complete()
        self.client.post(SUBMIT_URL)

        response = self.client.post(SUBMIT_URL)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CredentialViewTests(TempMediaMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.teacher = make_teacher()
        self.onboarding = start_onboarding_for_signup(self.teacher)
        self.client.force_authenticate(self.teacher)

    def _upload(self, **overrides):
        payload = {
            "credential_type": TeacherCredential.CredentialType.DEGREE,
            "title": "BSc Mathematics",
            "institution": "State University",
            "year_awarded": 2016,
            "document": a_document(),
        }
        payload.update(overrides)
        return self.client.post(CREDENTIALS_URL, payload, format="multipart")

    def test_uploading_attaches_the_document(self):
        response = self._upload()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        credential = TeacherCredential.objects.get()
        self.assertEqual(credential.onboarding, self.onboarding)
        self.assertEqual(credential.original_name, "degree.pdf")
        self.assertIsNotNone(response.data["data"]["document_url"])

    def test_an_unreadable_file_type_is_refused(self):
        response = self._upload(
            document=SimpleUploadedFile("degree.docx", b"junk", content_type="application/msword")
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(TeacherCredential.objects.count(), 0)

    def test_an_oversized_file_is_refused(self):
        oversized = SimpleUploadedFile(
            "degree.pdf", b"0" * ((MAX_DOCUMENT_SIZE_MB * 1024 * 1024) + 1), "application/pdf"
        )

        response = self._upload(document=oversized)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_an_impossible_year_is_refused(self):
        response = self._upload(year_awarded=1600)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_the_document_limit_is_enforced(self):
        for index in range(MAX_CREDENTIALS):
            TeacherCredential.objects.create(
                onboarding=self.onboarding, title=f"Cert {index}", document=a_document()
            )

        response = self._upload()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_deleting_removes_the_row(self):
        self._upload()
        credential = TeacherCredential.objects.get()

        response = self.client.delete(f"{CREDENTIALS_URL}{credential.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(TeacherCredential.objects.count(), 0)

    def test_another_teachers_document_is_a_404_not_a_403(self):
        other = make_teacher("other@example.com")
        other_credential = TeacherCredential.objects.create(
            onboarding=start_onboarding_for_signup(other), title="Theirs", document=a_document()
        )

        response = self.client.delete(f"{CREDENTIALS_URL}{other_credential.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(TeacherCredential.objects.filter(pk=other_credential.pk).exists())


class AdminQueueViewTests(TempMediaMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_admin()
        self.pending_teacher = make_teacher("pending@example.com", first_name="Pat")
        self.pending = fill_profile(
            start_onboarding_for_signup(self.pending_teacher),
            intro_video_url="https://youtu.be/abc123",
        )
        TeacherCredential.objects.create(
            onboarding=self.pending, title="BSc", document=a_document()
        )
        self.pending.status = TeacherOnboarding.ApplicationStatus.SUBMITTED
        self.pending.save()

        self.draft_teacher = make_teacher("draft@example.com", first_name="Dana")
        self.draft = start_onboarding_for_signup(self.draft_teacher)

        self.client.force_authenticate(self.admin)

    def test_the_queue_lists_every_application_with_its_counts(self):
        response = self.client.get(ADMIN_URL)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 2)
        submitted = next(row for row in results if row["status"] == "SUBMITTED")
        self.assertEqual(submitted["credentials_count"], 1)
        self.assertTrue(submitted["has_intro_video"])
        self.assertEqual(submitted["teacher_email"], "pending@example.com")

    def test_the_queue_filters_by_status(self):
        response = self.client.get(ADMIN_URL, {"status": "submitted"})

        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["teacher_email"], "pending@example.com")

    def test_the_queue_searches_by_name_and_email(self):
        response = self.client.get(ADMIN_URL, {"search": "dana"})

        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["teacher_email"], "draft@example.com")

    def test_the_summary_counts_what_is_waiting(self):
        response = self.client.get(SUMMARY_URL)

        data = response.data["data"]
        self.assertEqual(data["SUBMITTED"], 1)
        self.assertEqual(data["DRAFT"], 1)
        self.assertEqual(data["AWAITING_REVIEW"], 1)
        self.assertEqual(data["TOTAL"], 2)

    def test_a_teacher_cannot_read_the_queue(self):
        self.client.force_authenticate(self.pending_teacher)

        self.assertEqual(self.client.get(ADMIN_URL).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get(SUMMARY_URL).status_code, status.HTTP_403_FORBIDDEN)


class AdminReviewViewTests(TempMediaMixin, APITestCase):
    def setUp(self):
        super().setUp()
        self.admin = make_admin()
        self.teacher = make_teacher()
        self.onboarding = fill_profile(
            start_onboarding_for_signup(self.teacher),
            intro_video_url="https://youtu.be/abc123",
        )
        TeacherCredential.objects.create(
            onboarding=self.onboarding, title="BSc", document=a_document()
        )
        self.onboarding.status = TeacherOnboarding.ApplicationStatus.SUBMITTED
        self.onboarding.save()
        self.url = f"{ADMIN_URL}{self.onboarding.id}/"
        self.client.force_authenticate(self.admin)

    def test_the_detail_carries_the_documents_and_the_video(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data["credentials"]), 1)
        self.assertEqual(data["intro_video_display_url"], "https://youtu.be/abc123")
        self.assertEqual(data["teacher"]["email"], self.teacher.email)

    def test_a_missing_application_is_a_404(self):
        self.assertEqual(
            self.client.get(f"{ADMIN_URL}999999/").status_code, status.HTTP_404_NOT_FOUND
        )

    def test_approving_records_the_reviewer(self):
        response = self.client.patch(
            self.url, {"status": TeacherOnboarding.ApplicationStatus.APPROVED}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.onboarding.refresh_from_db()
        self.assertTrue(self.onboarding.is_approved)
        self.assertEqual(self.onboarding.reviewed_by, self.admin)
        self.assertIsNotNone(self.onboarding.reviewed_at)

    def test_rejecting_without_a_note_is_refused(self):
        response = self.client.patch(
            self.url, {"status": TeacherOnboarding.ApplicationStatus.REJECTED}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.onboarding.refresh_from_db()
        self.assertEqual(self.onboarding.status, TeacherOnboarding.ApplicationStatus.SUBMITTED)

    def test_requesting_changes_reopens_the_application_for_the_teacher(self):
        response = self.client.patch(
            self.url,
            {
                "status": TeacherOnboarding.ApplicationStatus.CHANGES_REQUESTED,
                "review_notes": "Please upload the certificate itself, not a transcript.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.onboarding.refresh_from_db()
        self.assertTrue(self.onboarding.is_editable)
        self.assertEqual(self.onboarding.step, TeacherOnboarding.Step.PROFILE)

        self.client.force_authenticate(self.teacher)
        data = self.client.get(ME_URL).data["data"]
        self.assertTrue(data["can_edit"])
        self.assertIn("transcript", data["review_notes"])

    def test_a_rejected_application_can_still_be_reopened(self):
        self.client.patch(
            self.url,
            {
                "status": TeacherOnboarding.ApplicationStatus.REJECTED,
                "review_notes": "Credentials could not be verified.",
            },
            format="json",
        )

        response = self.client.patch(
            self.url,
            {
                "status": TeacherOnboarding.ApplicationStatus.CHANGES_REQUESTED,
                "review_notes": "On a second look, please resubmit with the licence.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_an_approved_application_is_final(self):
        self.client.patch(
            self.url, {"status": TeacherOnboarding.ApplicationStatus.APPROVED}, format="json"
        )

        response = self.client.patch(
            self.url,
            {
                "status": TeacherOnboarding.ApplicationStatus.REJECTED,
                "review_notes": "Changed my mind.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.onboarding.refresh_from_db()
        self.assertTrue(self.onboarding.is_approved)

    def test_a_draft_cannot_be_reviewed(self):
        draft = start_onboarding_for_signup(make_teacher("draft@example.com"))

        response = self.client.patch(
            f"{ADMIN_URL}{draft.id}/",
            {"status": TeacherOnboarding.ApplicationStatus.APPROVED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_a_teacher_cannot_approve_themselves(self):
        self.client.force_authenticate(self.teacher)

        response = self.client.patch(
            self.url, {"status": TeacherOnboarding.ApplicationStatus.APPROVED}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
