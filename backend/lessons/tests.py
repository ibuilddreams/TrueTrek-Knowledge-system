from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Category, Course
from enrollments.models import Enrollment
from modules.models import Module
from progress.models import CourseProgress, LessonProgress, ModuleProgress

from .models import Lesson

UserModel = get_user_model()


def _make_user(username, role):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
    )


class LessonCompleteViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module = Module.objects.create(course=self.course, title="Module 1")
        self.lesson = Lesson.objects.create(
            module=self.module, title="Lesson 1", content_type="TEXT"
        )

        self.student = _make_user("completionstudent", UserModel.Roles.STUDENT)
        self.teacher = _make_user("completionteacher", UserModel.Roles.TEACHER)

        self.url = reverse("lesson-complete", kwargs={"pk": self.lesson.id})

    def test_requires_authentication(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbidden_for_non_student(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_forbidden_when_not_enrolled(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_marks_lesson_complete_and_rolls_up_progress(self):
        Enrollment.objects.create(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["data"]["is_completed"])

        lesson_progress = LessonProgress.objects.get(student=self.student, lesson=self.lesson)
        self.assertTrue(lesson_progress.is_completed)
        self.assertIsNotNone(lesson_progress.completed_at)

        module_progress = ModuleProgress.objects.get(student=self.student, module=self.module)
        self.assertEqual(module_progress.completion_percentage, 100)
        self.assertTrue(module_progress.is_completed)

        course_progress = CourseProgress.objects.get(student=self.student, course=self.course)
        self.assertEqual(course_progress.completion_percentage, 100)
        self.assertTrue(course_progress.is_completed)

    def test_returns_404_for_missing_lesson(self):
        Enrollment.objects.create(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.student)
        url = reverse("lesson-complete", kwargs={"pk": 999999})

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
