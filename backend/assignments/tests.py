from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from .models import Assignment, AssignmentSubmission

UserModel = get_user_model()


def _make_user(username, role):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
    )


class AssignmentCourseProgressListViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.assignment = Assignment.objects.create(
            course=self.course,
            title="Assignment 1",
            due_date=timezone.now() + timezone.timedelta(days=7),
            total_marks=100,
            status=Status.PUBLISHED,
        )

        self.instructor = _make_user("assignmentinstructor", UserModel.Roles.TEACHER)
        self.other_teacher = _make_user("assignmentotherteacher", UserModel.Roles.TEACHER)
        CourseInstructor.objects.create(course=self.course, instructor=self.instructor)

        self.student_1 = _make_user("assignmentstudent1", UserModel.Roles.STUDENT)
        self.student_2 = _make_user("assignmentstudent2", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student_1, course=self.course)
        Enrollment.objects.create(student=self.student_2, course=self.course)

        AssignmentSubmission.objects.create(
            assignment=self.assignment,
            student=self.student_1,
            submission_text="My submission",
            submitted_at=timezone.now(),
            status=AssignmentSubmission.SubmissionStatus.SUBMITTED,
        )

        self.url = reverse(
            "assignment-course-progress", kwargs={"course_id": self.course.id}
        )

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbidden_for_non_instructor_teacher(self):
        self.client.force_authenticate(user=self.other_teacher)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_instructor_sees_pending_and_submitted_rows(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["stats"]["total_assignments"], 1)
        self.assertEqual(data["stats"]["total_submissions"], 1)
        self.assertEqual(data["stats"]["pending_reviews"], 1)
        self.assertEqual(data["stats"]["graded"], 0)

        rows = {row["student"]["id"]: row for row in data["results"]}
        self.assertEqual(rows[self.student_1.id]["status"], "SUBMITTED")
        self.assertEqual(rows[self.student_1.id]["submission_text"], "My submission")
        self.assertEqual(rows[self.student_2.id]["status"], "PENDING")
        self.assertEqual(rows[self.student_2.id]["submission_text"], "")

    def test_status_filter_narrows_rows(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url, {"status": "PENDING"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["student"]["id"], self.student_2.id)

    def test_grading_updates_reflected_in_progress_view(self):
        submission = AssignmentSubmission.objects.get(assignment=self.assignment, student=self.student_1)
        grade_url = reverse("assignment-submission-grade", kwargs={"pk": submission.id})
        self.client.force_authenticate(user=self.instructor)
        self.client.post(grade_url, {"marks": 90, "feedback": "Great work"})

        response = self.client.get(self.url)

        rows = {row["student"]["id"]: row for row in response.data["data"]["results"]}
        self.assertEqual(rows[self.student_1.id]["status"], "GRADED")
        self.assertEqual(rows[self.student_1.id]["marks"], 90)
        self.assertEqual(response.data["data"]["stats"]["graded"], 1)
        self.assertEqual(response.data["data"]["stats"]["pending_reviews"], 0)
