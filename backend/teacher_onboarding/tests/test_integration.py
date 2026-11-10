from django.contrib.auth import get_user_model
from django.core import mail
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Category, Course
from teacher_onboarding.models import TeacherOnboarding

from .factories import BIO, TEACHING_STATEMENT, TempMediaMixin, make_admin
from .test_views import a_document, a_video

UserModel = get_user_model()


class TeacherJourneyTests(TempMediaMixin, APITestCase):
    """The whole journey in one pass, through the HTTP API only.

    The unit tests above each pin one rule; this one is here to catch the
    thing they can't — a step that works alone but not in sequence, such as
    the application being complete yet the gate still refusing, or approval
    landing without the portal opening.
    """

    def setUp(self):
        super().setUp()
        self.admin = make_admin()
        self.category = Category.objects.create(name="Mathematics")

    def _course_payload(self):
        return {
            "title": "Intro to Algebra",
            "code": "ALG-101",
            "description": "An introduction.",
            "category": self.category.id,
        }

    def test_signup_to_approved_and_teaching(self):
        # 1. A teacher signs themselves up and is logged straight in.
        signup = self.client.post(
            "/api/auth/signup/",
            {
                "username": "newteacher",
                "first_name": "Riley",
                "last_name": "Novak",
                "email": "riley@example.com",
                "password": "StrongPass123!",
                "gender": UserModel.Gender.OTHER,
                "role": UserModel.Roles.TEACHER,
            },
            format="json",
        )
        self.assertEqual(signup.status_code, status.HTTP_201_CREATED)
        teacher = UserModel.objects.get(email="riley@example.com")
        self.client.force_authenticate(teacher)

        # 2. The portal is closed and nothing can be authored yet.
        state = self.client.get("/api/teacher-onboarding/status/").data["data"]
        self.assertTrue(state["requires_onboarding"])
        self.assertFalse(state["can_access_portal"])
        self.assertEqual(
            self.client.post("/api/courses/", self._course_payload(), format="json").status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # 3. They work through the wizard, a step at a time.
        profile = self.client.patch(
            "/api/teacher-onboarding/me/",
            {
                "step": TeacherOnboarding.Step.EXPERTISE,
                "headline": "Secondary mathematics teacher",
                "bio": BIO,
                "highest_qualification": TeacherOnboarding.Qualification.MASTERS,
                "years_of_experience": 10,
                "linkedin_url": "https://linkedin.com/in/riley",
            },
            format="json",
        )
        self.assertEqual(profile.status_code, status.HTTP_200_OK)

        self.client.patch(
            "/api/teacher-onboarding/me/",
            {
                "step": TeacherOnboarding.Step.CREDENTIALS,
                "expertise": ["Algebra", "Calculus"],
                "teaching_statement": TEACHING_STATEMENT,
            },
            format="json",
        )
        self.client.post(
            "/api/teacher-onboarding/me/credentials/",
            {
                "credential_type": "DEGREE",
                "title": "MSc Mathematics",
                "institution": "State University",
                "year_awarded": 2016,
                "document": a_document(),
            },
            format="multipart",
        )
        self.client.patch(
            "/api/teacher-onboarding/me/",
            {"step": TeacherOnboarding.Step.REVIEW, "intro_video": a_video()},
            format="multipart",
        )

        # 4. The review step says there is nothing left to do.
        application = self.client.get("/api/teacher-onboarding/me/").data["data"]
        self.assertEqual(application["missing_requirements"], [])
        self.assertTrue(application["is_complete"])
        self.assertEqual(len(application["credentials"]), 1)

        submitted = self.client.post("/api/teacher-onboarding/me/submit/")
        self.assertEqual(submitted.status_code, status.HTTP_200_OK)
        application_id = submitted.data["data"]["id"]

        # 5. The admin finds it in the queue and reads it in full.
        self.client.force_authenticate(self.admin)
        queue = self.client.get("/api/teacher-onboarding/admin/", {"status": "SUBMITTED"})
        self.assertEqual(queue.data["data"]["count"], 1)
        self.assertEqual(self.client.get("/api/teacher-onboarding/admin/summary/").data["data"]["AWAITING_REVIEW"], 1)

        detail = self.client.get(f"/api/teacher-onboarding/admin/{application_id}/").data["data"]
        self.assertEqual(detail["teacher"]["email"], "riley@example.com")
        self.assertIsNotNone(detail["intro_video_display_url"])

        # 6. First they send it back, and the teacher can edit again.
        mail.outbox.clear()
        # The decision email is queued on transaction commit, which a TestCase's
        # own wrapping transaction never reaches on its own.
        with self.captureOnCommitCallbacks(execute=True):
            self.client.patch(
                f"/api/teacher-onboarding/admin/{application_id}/",
                {
                    "status": TeacherOnboarding.ApplicationStatus.CHANGES_REQUESTED,
                    "review_notes": "Please add the year your licence was issued.",
                },
                format="json",
            )
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("riley@example.com", mail.outbox[0].to)

        self.client.force_authenticate(teacher)
        reopened = self.client.get("/api/teacher-onboarding/me/").data["data"]
        self.assertTrue(reopened["can_edit"])
        self.assertIn("licence", reopened["review_notes"])
        self.client.patch(
            "/api/teacher-onboarding/me/", {"headline": "Mathematics teacher, 10 years"}, format="json"
        )
        self.client.post("/api/teacher-onboarding/me/submit/")

        # 7. Approved — and the portal and course creation open together.
        self.client.force_authenticate(self.admin)
        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            approval = self.client.patch(
                f"/api/teacher-onboarding/admin/{application_id}/",
                {"status": TeacherOnboarding.ApplicationStatus.APPROVED},
                format="json",
            )
        self.assertEqual(approval.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("approved", mail.outbox[0].subject.lower())

        self.client.force_authenticate(teacher)
        state = self.client.get("/api/teacher-onboarding/status/").data["data"]
        self.assertTrue(state["can_access_portal"])

        created = self.client.post("/api/courses/", self._course_payload(), format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Course.objects.filter(code="ALG-101").exists())

        # 8. The approved application pre-filled the public instructor profile.
        profile = self.client.get("/api/instructors/me/profile/").data["data"]
        self.assertEqual(profile["headline"], "Mathematics teacher, 10 years")
        self.assertEqual(profile["skills"], ["Algebra", "Calculus"])
