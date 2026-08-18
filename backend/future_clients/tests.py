from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from .models import ApplicationStatus, FutureClientApplication

UserModel = get_user_model()


class FutureClientApplicationTests(APITestCase):
    def setUp(self):
        self.apply_url = reverse("future-client-apply")
        self.admin_list_url = reverse("future-client-admin-list")

        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(
            title="Intro to Python",
            code="FC-101",
            category=self.category,
            status=Status.PUBLISHED,
            amount="49.99",
        )
        self.draft_course = Course.objects.create(
            title="Unpublished Course",
            code="FC-DRAFT",
            category=self.category,
            status=Status.DRAFT,
        )
        self.unstaffed_course = Course.objects.create(
            title="Course Without An Instructor",
            code="FC-NOINST",
            category=self.category,
            status=Status.PUBLISHED,
        )

        self.teacher = UserModel.objects.create_user(
            username="fcteacher",
            email="fcteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )
        CourseInstructor.objects.create(course=self.course, instructor=self.teacher)

        self.admin = UserModel.objects.create_user(
            username="fcadmin",
            email="fcadmin@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.ADMIN,
            gender=UserModel.Gender.MALE,
        )

        self.valid_payload = {
            "first_name": "Jordan",
            "last_name": "Prospect",
            "email": "jordan.prospect@example.com",
            "password": "SuperSecret123!",
            "courses": [self.course.id],
        }

    def _detail_url(self, name, pk):
        return reverse(name, kwargs={"pk": pk})

    def test_public_can_submit_application(self):
        response = self.client.post(self.apply_url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        application = FutureClientApplication.objects.get(email="jordan.prospect@example.com")
        self.assertEqual(application.status, ApplicationStatus.PENDING)
        self.assertNotEqual(application.password_hash, "SuperSecret123!")
        self.assertEqual(list(application.courses.all()), [self.course])

    def test_cannot_submit_with_empty_courses(self):
        payload = {**self.valid_payload, "courses": []}

        response = self.client.post(self.apply_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_submit_with_existing_user_email(self):
        UserModel.objects.create_user(
            username="existingstudent",
            email="jordan.prospect@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )

        response = self.client.post(self.apply_url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_submit_duplicate_pending_application(self):
        self.client.post(self.apply_url, self.valid_payload)

        response = self.client.post(self.apply_url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_can_reapply_after_rejection(self):
        self.client.post(self.apply_url, self.valid_payload)
        application = FutureClientApplication.objects.get(email="jordan.prospect@example.com")
        self.client.force_authenticate(user=self.admin)
        self.client.post(
            self._detail_url("future-client-admin-reject", application.id),
            {"rejection_reason": "Not a fit right now."},
        )
        self.client.force_authenticate(user=None)

        response = self.client.post(self.apply_url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_non_admin_cannot_list_applications(self):
        response = self.client.get(self.admin_list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_approve_creates_student_and_enrollment(self):
        self.client.post(self.apply_url, self.valid_payload)
        application = FutureClientApplication.objects.get(email="jordan.prospect@example.com")
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self._detail_url("future-client-admin-approve", application.id)
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        application.refresh_from_db()
        self.assertEqual(application.status, ApplicationStatus.APPROVED)
        self.assertIsNotNone(application.created_student)
        self.assertEqual(application.reviewed_by, self.admin)

        student = application.created_student
        self.assertEqual(student.role, UserModel.Roles.STUDENT)
        self.assertTrue(
            Enrollment.objects.filter(student=student, course=self.course).exists()
        )
        # The applicant's originally chosen password logs them in.
        self.assertTrue(student.check_password("SuperSecret123!"))

    def test_approve_is_idempotent_under_double_call(self):
        self.client.post(self.apply_url, self.valid_payload)
        application = FutureClientApplication.objects.get(email="jordan.prospect@example.com")
        self.client.force_authenticate(user=self.admin)
        approve_url = self._detail_url("future-client-admin-approve", application.id)

        first_response = self.client.post(approve_url)
        second_response = self.client.post(approve_url)

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            UserModel.objects.filter(email="jordan.prospect@example.com").count(), 1
        )

    def test_approve_skips_course_without_instructor(self):
        payload = {**self.valid_payload, "courses": [self.course.id, self.unstaffed_course.id]}
        self.client.post(self.apply_url, payload)
        application = FutureClientApplication.objects.get(email="jordan.prospect@example.com")
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self._detail_url("future-client-admin-approve", application.id)
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.data["data"]["enrollment_result"]
        self.assertEqual(len(result["enrolled"]), 1)
        self.assertEqual(len(result["failed"]), 1)

    def test_reject_sets_status_and_reason(self):
        self.client.post(self.apply_url, self.valid_payload)
        application = FutureClientApplication.objects.get(email="jordan.prospect@example.com")
        self.client.force_authenticate(user=self.admin)

        response = self.client.post(
            self._detail_url("future-client-admin-reject", application.id),
            {"rejection_reason": "Course capacity full."},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        application.refresh_from_db()
        self.assertEqual(application.status, ApplicationStatus.REJECTED)
        self.assertEqual(application.rejection_reason, "Course capacity full.")
        self.assertIsNone(application.created_student)
