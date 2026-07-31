from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Category, Course
from progress.models import CourseProgress

from ..models import Enrollment

UserModel = get_user_model()


class StudentEnrollmentListViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("enrollment-student-list-create")
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(
            title="Intro to Python", code="PY-101", category=self.category
        )
        self.other_course = Course.objects.create(
            title="Advanced Django", code="DJ-201", category=self.category
        )

        self.student = UserModel.objects.create_user(
            username="enrollstudent",
            email="enrollstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.other_student = UserModel.objects.create_user(
            username="otherenrollstudent",
            email="otherenrollstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )

        Enrollment.objects.create(student=self.student, course=self.course)
        Enrollment.objects.create(student=self.other_student, course=self.other_course)
        CourseProgress.objects.create(
            student=self.student,
            course=self.course,
            completion_percentage=Decimal("42.50"),
            is_completed=False,
        )

    def test_list_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_student_sees_only_own_enrollments(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        course_ids = [item["course"]["id"] for item in results]
        self.assertEqual(course_ids, [self.course.id])
        self.assertEqual(results[0]["completion_percentage"], 42.5)
        self.assertFalse(results[0]["is_completed"])

    def test_post_is_disabled(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.url, {"course": self.other_course.id})

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
