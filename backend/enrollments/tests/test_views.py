from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Category, Course
from lessons.models import Lesson
from modules.models import Module
from progress.models import CourseProgress, LessonProgress

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
        )
        self.other_student = UserModel.objects.create_user(
            username="otherenrollstudent",
            email="otherenrollstudent@example.com",
            password="StrongPass123!",
            role=UserModel.Roles.STUDENT,
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

    def test_card_stats_and_next_lesson_come_from_the_course(self):
        """The library card's counts and its "Next:" line.

        Both are built once for the whole page rather than per row, so this
        pins what a card is handed: how many modules and lessons the course
        holds, how many of those lessons the student has finished, and the
        first unfinished one in module-then-lesson order.
        """
        first = Module.objects.create(course=self.course, title="One", order=1)
        second = Module.objects.create(course=self.course, title="Two", order=2)
        done = Lesson.objects.create(module=first, title="Opening", order=1)
        Lesson.objects.create(module=first, title="Middle", order=2)
        Lesson.objects.create(module=second, title="Closing", order=1)
        LessonProgress.objects.create(student=self.student, lesson=done, is_completed=True)

        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.url)

        row = response.data["data"]["results"][0]
        self.assertEqual(
            row["stats"],
            {"total_modules": 2, "total_lessons": 3, "completed_lessons": 1},
        )
        self.assertEqual(row["next_lesson"]["title"], "Middle")

    def test_card_next_lesson_is_absent_once_everything_is_finished(self):
        module = Module.objects.create(course=self.course, title="Only", order=1)
        lesson = Lesson.objects.create(module=module, title="Only lesson", order=1)
        LessonProgress.objects.create(student=self.student, lesson=lesson, is_completed=True)

        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.url)

        row = response.data["data"]["results"][0]
        self.assertIsNone(row["next_lesson"])
        self.assertEqual(row["stats"]["completed_lessons"], 1)

    def test_post_is_disabled(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.url, {"course": self.other_course.id})

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_enrolled_course_detail_returns_course_for_student(self):
        self.client.force_authenticate(user=self.student)
        url = reverse(
            "enrollment-student-course-detail", kwargs={"course_id": self.course.id}
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["course"]["id"], self.course.id)
        self.assertEqual(data["enrollment"]["status"], Enrollment.EnrollmentStatus.ACTIVE)
        self.assertEqual(data["stats"]["completion_percentage"], 42.5)

    def test_enrolled_course_detail_returns_404_for_other_course(self):
        self.client.force_authenticate(user=self.student)
        url = reverse(
            "enrollment-student-course-detail",
            kwargs={"course_id": self.other_course.id},
        )

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
