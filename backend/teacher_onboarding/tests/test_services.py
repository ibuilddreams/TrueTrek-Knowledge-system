from django.contrib.auth import get_user_model
from django.test import TestCase

from courses.models import Category, Course
from instructors.models import InstructorProfile
from notifications.models import Notification
from teacher_onboarding.models import TeacherOnboarding
from teacher_onboarding.permissions import IsApprovedTeacher
from teacher_onboarding.services import (
    access_state,
    apply_to_profiles,
    can_teach,
    missing_requirements,
    review_onboarding,
    start_onboarding_for_signup,
    submit_onboarding,
)
from users.models import UserProfile

from .factories import fill_profile, make_admin, make_student, make_teacher

UserModel = get_user_model()


class FakeRequest:
    def __init__(self, user):
        self.user = user


class CanTeachTests(TestCase):
    """The rule the whole feature hangs on: an application exists only for an
    account nobody vouched for, so its absence has to keep meaning 'cleared'."""

    def test_teacher_without_an_application_may_teach(self):
        teacher = make_teacher()
        self.assertTrue(can_teach(teacher))
        self.assertEqual(
            access_state(teacher),
            {
                "requires_onboarding": False,
                "status": None,
                "needs_action": False,
                "can_access_portal": True,
                "is_approved": True,
            },
        )

    def test_teacher_with_a_draft_application_may_not_teach(self):
        teacher = make_teacher()
        start_onboarding_for_signup(teacher)

        self.assertFalse(can_teach(teacher))
        state = access_state(teacher)
        self.assertTrue(state["requires_onboarding"])
        self.assertFalse(state["can_access_portal"])
        self.assertEqual(state["status"], TeacherOnboarding.ApplicationStatus.DRAFT)

    def test_approval_clears_the_account(self):
        teacher = make_teacher()
        onboarding = start_onboarding_for_signup(teacher)
        review_onboarding(
            onboarding,
            admin=make_admin(),
            status=TeacherOnboarding.ApplicationStatus.APPROVED,
        )

        self.assertTrue(can_teach(teacher))
        self.assertTrue(access_state(teacher)["can_access_portal"])

    def test_a_submitted_application_opens_the_portal_but_not_teaching(self):
        # Seeing the portal and being allowed to author are different
        # questions: a teacher waiting on a review gets the first, never the
        # second.
        teacher = make_teacher()
        onboarding = fill_profile(start_onboarding_for_signup(teacher))
        submit_onboarding(onboarding)

        state = access_state(teacher)
        self.assertTrue(state["can_access_portal"])
        self.assertFalse(state["needs_action"])
        self.assertFalse(state["is_approved"])
        self.assertFalse(can_teach(teacher))

    def test_changes_requested_sends_them_back_to_the_wizard(self):
        teacher = make_teacher()
        onboarding = fill_profile(start_onboarding_for_signup(teacher))
        submit_onboarding(onboarding)
        review_onboarding(
            onboarding,
            admin=make_admin(),
            status=TeacherOnboarding.ApplicationStatus.CHANGES_REQUESTED,
            notes="Please attach the certificate.",
        )

        state = access_state(teacher)
        self.assertTrue(state["needs_action"])
        self.assertFalse(state["can_access_portal"])

    def test_a_rejected_application_still_leaves_the_portal_reachable(self):
        # Nothing is left for them to do, so there is nothing to park them on;
        # the portal's banner is what tells them the outcome.
        teacher = make_teacher()
        onboarding = fill_profile(start_onboarding_for_signup(teacher))
        submit_onboarding(onboarding)
        review_onboarding(
            onboarding,
            admin=make_admin(),
            status=TeacherOnboarding.ApplicationStatus.REJECTED,
            notes="Credentials could not be verified.",
        )

        state = access_state(teacher)
        self.assertTrue(state["can_access_portal"])
        self.assertFalse(state["is_approved"])
        self.assertFalse(can_teach(teacher))

    def test_admins_are_never_gated_and_students_never_pass(self):
        self.assertTrue(can_teach(make_admin()))
        self.assertFalse(can_teach(make_student()))

    def test_permission_class_accepts_only_cleared_teachers(self):
        permission = IsApprovedTeacher()
        cleared = make_teacher("cleared@example.com")
        pending = make_teacher("pending@example.com")
        start_onboarding_for_signup(pending)

        self.assertTrue(permission.has_permission(FakeRequest(cleared), None))
        self.assertFalse(permission.has_permission(FakeRequest(pending), None))
        # Admins go through IsAdmin in the composed permission, not this one.
        self.assertFalse(permission.has_permission(FakeRequest(make_admin()), None))


class MissingRequirementsTests(TestCase):
    def setUp(self):
        self.teacher = make_teacher()
        self.onboarding = start_onboarding_for_signup(self.teacher)

    def test_empty_application_lists_every_requirement(self):
        missing = missing_requirements(self.onboarding)
        self.assertEqual(len(missing), 8)

    def test_only_uploads_remain_once_the_text_is_filled_in(self):
        fill_profile(self.onboarding)
        missing = missing_requirements(self.onboarding)

        self.assertEqual(len(missing), 2)
        self.assertTrue(any("qualification document" in item for item in missing))
        self.assertTrue(any("intro video" in item for item in missing))

    def test_a_video_link_counts_as_an_intro_video(self):
        fill_profile(self.onboarding, intro_video_url="https://youtu.be/abc123")
        self.assertFalse(
            any("intro video" in item for item in missing_requirements(self.onboarding))
        )

    def test_blank_only_expertise_entries_do_not_count(self):
        fill_profile(self.onboarding, expertise=["  "])
        self.assertTrue(
            any("subject you can teach" in item for item in missing_requirements(self.onboarding))
        )


class SubmissionTests(TestCase):
    def setUp(self):
        self.teacher = make_teacher()
        self.onboarding = fill_profile(start_onboarding_for_signup(self.teacher))

    def test_submitting_queues_the_application_and_tells_every_admin(self):
        admin = make_admin()
        make_admin("second-admin@example.com")
        make_admin("inactive-admin@example.com", account_status=UserModel.AccountStatus.SUSPENDED)

        submit_onboarding(self.onboarding)
        self.onboarding.refresh_from_db()

        self.assertEqual(self.onboarding.status, TeacherOnboarding.ApplicationStatus.SUBMITTED)
        self.assertIsNotNone(self.onboarding.submitted_at)
        self.assertEqual(self.onboarding.step, TeacherOnboarding.Step.REVIEW)
        self.assertFalse(self.onboarding.is_editable)

        notifications = Notification.objects.filter(verb="TEACHER_ONBOARDING_SUBMITTED")
        self.assertEqual(notifications.count(), 2)
        self.assertIn(admin.id, [row.recipient_id for row in notifications])

    def test_resubmitting_drops_the_previous_decision(self):
        submit_onboarding(self.onboarding)
        review_onboarding(
            self.onboarding,
            admin=make_admin(),
            status=TeacherOnboarding.ApplicationStatus.CHANGES_REQUESTED,
            notes="Please add a degree certificate.",
        )
        self.onboarding.refresh_from_db()
        self.assertTrue(self.onboarding.is_editable)
        self.assertEqual(self.onboarding.step, TeacherOnboarding.Step.PROFILE)

        submit_onboarding(self.onboarding)
        self.onboarding.refresh_from_db()

        self.assertEqual(self.onboarding.review_notes, "")
        self.assertIsNone(self.onboarding.reviewed_at)
        self.assertIsNone(self.onboarding.reviewed_by)


class ReviewTests(TestCase):
    def setUp(self):
        self.admin = make_admin()
        self.teacher = make_teacher()
        self.onboarding = fill_profile(start_onboarding_for_signup(self.teacher))
        submit_onboarding(self.onboarding)

    def test_approval_fills_the_public_profiles_it_finds_empty(self):
        review_onboarding(
            self.onboarding,
            admin=self.admin,
            status=TeacherOnboarding.ApplicationStatus.APPROVED,
        )

        instructor_profile = InstructorProfile.objects.get(user=self.teacher)
        user_profile = UserProfile.objects.get(user=self.teacher)

        self.assertEqual(instructor_profile.headline, self.onboarding.headline)
        self.assertEqual(instructor_profile.skills, ["Algebra", "Calculus"])
        self.assertEqual(user_profile.bio, self.onboarding.bio)

    def test_approval_never_overwrites_a_profile_the_teacher_already_wrote(self):
        InstructorProfile.objects.create(user=self.teacher, headline="My own headline")
        UserProfile.objects.create(user=self.teacher, bio="My own bio")

        apply_to_profiles(self.onboarding)

        self.assertEqual(
            InstructorProfile.objects.get(user=self.teacher).headline, "My own headline"
        )
        self.assertEqual(UserProfile.objects.get(user=self.teacher).bio, "My own bio")

    def test_an_uploaded_video_does_not_travel_to_the_url_field(self):
        self.onboarding.intro_video.name = "teacher_onboarding/videos/2026/11/intro.mp4"
        self.onboarding.save(update_fields=["intro_video"])

        apply_to_profiles(self.onboarding)

        self.assertEqual(InstructorProfile.objects.get(user=self.teacher).intro_video_url, "")

    def test_a_video_link_does_travel(self):
        self.onboarding.intro_video_url = "https://youtu.be/abc123"
        self.onboarding.save(update_fields=["intro_video_url"])

        apply_to_profiles(self.onboarding)

        self.assertEqual(
            InstructorProfile.objects.get(user=self.teacher).intro_video_url,
            "https://youtu.be/abc123",
        )

    def test_the_teacher_is_told_about_a_decision_but_not_about_a_pick_up(self):
        review_onboarding(
            self.onboarding,
            admin=self.admin,
            status=TeacherOnboarding.ApplicationStatus.UNDER_REVIEW,
        )
        self.assertFalse(
            Notification.objects.filter(recipient=self.teacher).exists()
        )

        review_onboarding(
            self.onboarding,
            admin=self.admin,
            status=TeacherOnboarding.ApplicationStatus.REJECTED,
            notes="Credentials could not be verified.",
        )
        self.assertTrue(
            Notification.objects.filter(
                recipient=self.teacher, verb="TEACHER_ONBOARDING_REJECTED"
            ).exists()
        )


class CourseCreationGateTests(TestCase):
    """The gate exists so an unreviewed account cannot author anything; every
    other content write already requires being a course's instructor."""

    def setUp(self):
        self.category = Category.objects.create(name="Mathematics")

    def _payload(self, code):
        return {
            "title": "Intro to Algebra",
            "code": code,
            "description": "An introduction.",
            "category": self.category.id,
        }

    def _post_as(self, user, code):
        self.client.force_login(user)
        return self.client.post("/api/courses/", self._payload(code), content_type="application/json")

    def test_a_pending_teacher_is_refused(self):
        teacher = make_teacher()
        start_onboarding_for_signup(teacher)

        response = self._post_as(teacher, "ALG-1")

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Course.objects.filter(code="ALG-1").exists())

    def test_an_approved_teacher_may_create_a_course(self):
        teacher = make_teacher()
        onboarding = start_onboarding_for_signup(teacher)
        review_onboarding(
            onboarding, admin=make_admin(), status=TeacherOnboarding.ApplicationStatus.APPROVED
        )

        response = self._post_as(teacher, "ALG-2")

        self.assertEqual(response.status_code, 201)

    def test_a_teacher_an_admin_created_is_untouched_by_the_gate(self):
        response = self._post_as(make_teacher(), "ALG-3")

        self.assertEqual(response.status_code, 201)


class NoLazyApplicationTests(TestCase):
    """An application row is only ever created at signup. Reading the teacher
    endpoints must never bring one into existence, because the row's existence
    is what takes course creation away."""

    def test_opening_the_screen_as_a_cleared_teacher_creates_nothing(self):
        teacher = make_teacher()
        self.client.force_login(teacher)

        response = self.client.get("/api/teacher-onboarding/me/")

        self.assertEqual(response.status_code, 404)
        self.assertFalse(TeacherOnboarding.objects.filter(user=teacher).exists())
        self.assertTrue(can_teach(teacher))

    def test_submitting_as_a_cleared_teacher_creates_nothing(self):
        teacher = make_teacher()
        self.client.force_login(teacher)

        response = self.client.post("/api/teacher-onboarding/me/submit/")

        self.assertEqual(response.status_code, 404)
        self.assertFalse(TeacherOnboarding.objects.filter(user=teacher).exists())
        self.assertTrue(can_teach(teacher))


class RefusalMessageTests(TestCase):
    """A teacher who hits the gate must be told why, not just refused."""

    def test_the_403_explains_that_the_application_is_under_review(self):
        category = Category.objects.create(name="Mathematics")
        teacher = make_teacher()
        start_onboarding_for_signup(teacher)
        self.client.force_login(teacher)

        response = self.client.post(
            "/api/courses/",
            {
                "title": "Intro to Algebra",
                "code": "ALG-9",
                "description": "An introduction.",
                "category": category.id,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        message = response.json()["message"]
        self.assertIn("approved teachers", message)
        self.assertIn("under review", message)

    def test_a_student_is_not_told_to_wait_for_a_review_they_never_started(self):
        # Same refusal, same wording — so it has to be wording that is true
        # for somebody who holds no application at all.
        category = Category.objects.create(name="Science")
        self.client.force_login(make_student())

        response = self.client.post(
            "/api/courses/",
            {
                "title": "Intro to Physics",
                "code": "PHY-9",
                "description": "An introduction.",
                "category": category.id,
            },
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 403)
        self.assertIn("Only admins and approved teachers", response.json()["message"])
