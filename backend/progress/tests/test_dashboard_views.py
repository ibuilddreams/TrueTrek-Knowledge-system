from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment
from lessons.models import Lesson
from modules.models import Module

from ..models import LessonProgress

UserModel = get_user_model()


def _make_user(username, role, **extra):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
        **extra,
    )


class CourseLessonProgressListViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module = Module.objects.create(course=self.course, title="Module 1")
        self.lesson_1 = Lesson.objects.create(
            module=self.module, title="Lesson 1", content_type="TEXT"
        )
        self.lesson_2 = Lesson.objects.create(
            module=self.module, title="Lesson 2", content_type="TEXT"
        )

        self.admin = _make_user("dashboardadmin", UserModel.Roles.ADMIN)
        self.instructor = _make_user("dashboardinstructor", UserModel.Roles.TEACHER)
        self.other_teacher = _make_user("dashboardotherteacher", UserModel.Roles.TEACHER)
        CourseInstructor.objects.create(course=self.course, instructor=self.instructor)

        self.student_1 = _make_user("dashboardstudent1", UserModel.Roles.STUDENT)
        self.student_2 = _make_user("dashboardstudent2", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student_1, course=self.course)
        Enrollment.objects.create(student=self.student_2, course=self.course)

        LessonProgress.objects.create(
            student=self.student_1,
            lesson=self.lesson_1,
            is_completed=True,
            completed_at=timezone.now(),
        )

        self.url = reverse("course-lesson-progress-list", kwargs={"course_id": self.course.id})

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbidden_for_non_instructor_teacher(self):
        self.client.force_authenticate(user=self.other_teacher)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_forbidden_for_student(self):
        self.client.force_authenticate(user=self.student_1)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_instructor_sees_stats_and_rows(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["stats"]["total_students"], 2)
        self.assertEqual(data["stats"]["completed_lessons"], 1)
        self.assertEqual(data["stats"]["pending_lessons"], 3)

        rows = {row["student_id"]: row for row in data["results"]}
        self.assertEqual(rows[self.student_1.id]["lessons_completed"], 1)
        self.assertEqual(rows[self.student_1.id]["completion_percentage"], 50.0)
        self.assertEqual(rows[self.student_2.id]["lessons_completed"], 0)

    def test_admin_can_view_any_course(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_search_filters_by_student_name(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url, {"search": self.student_1.email})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["student_id"], self.student_1.id)


class StudentLessonProgressDetailViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module = Module.objects.create(course=self.course, title="Module 1")
        self.lesson = Lesson.objects.create(
            module=self.module, title="Lesson 1", content_type="TEXT"
        )

        self.instructor = _make_user("detaildashinstructor", UserModel.Roles.TEACHER)
        CourseInstructor.objects.create(course=self.course, instructor=self.instructor)

        self.student = _make_user("detaildashstudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

        LessonProgress.objects.create(
            student=self.student, lesson=self.lesson, is_completed=True, completed_at=timezone.now()
        )

        self.url = reverse(
            "student-lesson-progress-detail",
            kwargs={"course_id": self.course.id, "student_id": self.student.id},
        )

    def test_returns_module_lesson_breakdown(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data["modules"]), 1)
        self.assertEqual(data["modules"][0]["lessons"][0]["is_completed"], True)

    def test_returns_404_when_student_not_enrolled(self):
        other_student = _make_user("notenrolledstudent", UserModel.Roles.STUDENT)
        url = reverse(
            "student-lesson-progress-detail",
            kwargs={"course_id": self.course.id, "student_id": other_student.id},
        )
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
