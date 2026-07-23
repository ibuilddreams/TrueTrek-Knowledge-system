from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Category, Course
from enrollments.models import Enrollment

from ..models import CourseProgress

UserModel = get_user_model()


class CourseProgressListViewTests(APITestCase):
    def setUp(self):
        self.url = reverse("progress-list")
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)

        self.student = UserModel.objects.create_user(
            username="progressstudent",
            email="progressstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.other_student = UserModel.objects.create_user(
            username="otherprogressstudent",
            email="otherprogressstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.teacher = UserModel.objects.create_user(
            username="progressteacher",
            email="progressteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )

        CourseProgress.objects.create(
            student=self.student, course=self.course, completion_percentage=Decimal("40.00")
        )
        CourseProgress.objects.create(
            student=self.other_student, course=self.course, completion_percentage=Decimal("10.00")
        )

    def test_list_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_forbidden_for_non_student(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_sees_only_own_progress(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["completion_percentage"], "40.00")


class CourseProgressDetailViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.url = reverse("progress-detail", kwargs={"course_id": self.course.id})

        self.student = UserModel.objects.create_user(
            username="detailstudent",
            email="detailstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
            gender=UserModel.Gender.MALE,
        )
        self.teacher = UserModel.objects.create_user(
            username="detailteacher",
            email="detailteacher@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.TEACHER,
            gender=UserModel.Gender.MALE,
        )

    def test_detail_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_detail_forbidden_for_non_student(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_detail_returns_403_when_not_enrolled(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["message"], "You are not enrolled in this course.")

    def test_detail_returns_403_when_enrollment_is_cancelled(self):
        Enrollment.objects.create(
            student=self.student,
            course=self.course,
            status=Enrollment.EnrollmentStatus.CANCELLED,
        )
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_detail_returns_progress_when_actively_enrolled(self):
        Enrollment.objects.create(student=self.student, course=self.course)
        CourseProgress.objects.create(
            student=self.student, course=self.course, completion_percentage=Decimal("25.00")
        )
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["course_progress"]["completion_percentage"], "25.00")
        self.assertEqual(data["modules"], [])
        self.assertEqual(data["lessons"], [])
