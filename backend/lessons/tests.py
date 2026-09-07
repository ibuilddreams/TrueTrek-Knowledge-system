from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course
from enrollments.models import Enrollment
from modules.models import Module
from progress.models import CourseProgress, LessonProgress, ModuleProgress
from quizzes.models import Quiz, QuizAttempt, QuizResult

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


class ModuleLockLessonAccessTests(APITestCase):
    """Task 18 (Phase 5) — a locked module (2 failures on a prior module's
    quiz) blocks both viewing lesson detail and marking it complete."""

    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module_1 = Module.objects.create(course=self.course, title="Module 1", order=1)
        self.module_2 = Module.objects.create(course=self.course, title="Module 2", order=2)
        self.blocking_quiz = Quiz.objects.create(
            course=self.course,
            module=self.module_1,
            title="Quiz 1",
            passing_score=40,
            status=Status.PUBLISHED,
        )
        self.lesson = Lesson.objects.create(
            module=self.module_2, title="Lesson in module 2", content_type="TEXT"
        )
        self.student = _make_user("lockedlessonstudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

        for attempt_number in (1, 2):
            attempt = QuizAttempt.objects.create(
                quiz=self.blocking_quiz,
                student=self.student,
                attempt_number=attempt_number,
                status=QuizAttempt.AttemptStatus.GRADED,
                ended_at=timezone.now(),
            )
            QuizResult.objects.create(
                attempt=attempt, score=Decimal("0"), percentage=Decimal("0.00"), is_passed=False
            )

        self.client.force_authenticate(user=self.student)

    def test_lesson_detail_is_blocked_when_module_is_locked(self):
        response = self.client.get(reverse("lesson-detail", kwargs={"pk": self.lesson.id}))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("blocking_quiz_id", response.data["data"])

    def test_lesson_complete_is_blocked_when_module_is_locked(self):
        response = self.client.post(reverse("lesson-complete", kwargs={"pk": self.lesson.id}))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(
            LessonProgress.objects.filter(student=self.student, lesson=self.lesson).exists()
        )


class TextLessonHtmlSanitizationTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module = Module.objects.create(course=self.course, title="Module 1")
        self.admin = _make_user("sanitizationadmin", UserModel.Roles.ADMIN)
        self.url = reverse("lesson-list-create")
        self.client.force_authenticate(user=self.admin)

    def _create_html_lesson(self, content_data, order=1):
        return self.client.post(
            self.url,
            {
                "module": self.module.id,
                "title": "Rich text lesson",
                "description": "",
                "content_type": "TEXT",
                "content_format": "HTML",
                "content_data": content_data,
                "order": order,
            },
            format="multipart",
        )

    def test_script_tag_is_stripped(self):
        response = self._create_html_lesson("<p>Hello</p><script>alert(1)</script>")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("<script", response.data["data"]["content_data"])
        self.assertNotIn("alert(1)", response.data["data"]["content_data"])

    def test_javascript_href_is_neutralized(self):
        response = self._create_html_lesson('<p><a href="javascript:alert(1)">click</a></p>')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("javascript:", response.data["data"]["content_data"])

    def test_blank_paragraph_is_rejected_as_empty(self):
        response = self._create_html_lesson("<p></p>")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("content_data", response.data["data"])
