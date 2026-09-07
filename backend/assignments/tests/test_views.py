from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment
from modules.models import Module
from quizzes.models import Quiz, QuizAttempt, QuizResult

from ..models import Assignment, AssignmentSubmission, AssignmentSubmissionFile

UserModel = get_user_model()


def _make_user(username, role):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
    )


class AssignmentSubmitViewModuleLockTests(APITestCase):
    """Task 18 (Phase 5) — submitting an assignment that belongs to a locked
    module (2 failures on a prior module's quiz) is blocked."""

    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module_1 = Module.objects.create(course=self.course, title="Module 1", order=1)
        self.module_2 = Module.objects.create(course=self.course, title="Module 2", order=2)
        self.blocking_quiz = Quiz.objects.create(
            course=self.course,
            module=self.module_1,
            title="Blocking Quiz",
            passing_score=40,
            status=Status.PUBLISHED,
        )
        self.assignment = Assignment.objects.create(
            course=self.course,
            module=self.module_2,
            title="Assignment in module 2",
            due_date=timezone.now() + timezone.timedelta(days=7),
        )
        self.student = _make_user("lockedassignmentstudent", UserModel.Roles.STUDENT)
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
        self.url = reverse("assignment-submit", kwargs={"assignment_id": self.assignment.id})

    def test_submit_is_blocked_when_module_is_locked(self):
        upload = SimpleUploadedFile("work.pdf", b"content", content_type="application/pdf")

        response = self.client.post(self.url, {"files": [upload]}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("blocking_quiz_id", response.data["data"])
        self.assertFalse(AssignmentSubmission.objects.filter(assignment=self.assignment).exists())


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
        Enrollment.objects.create(student=self.student_1, course=self.course, teacher=self.instructor)
        Enrollment.objects.create(student=self.student_2, course=self.course, teacher=self.instructor)

        AssignmentSubmission.objects.create(
            assignment=self.assignment,
            student=self.student_1,
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
        self.assertEqual(rows[self.student_2.id]["status"], "PENDING")

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


class StudentAssignmentListViewTests(APITestCase):
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
        self.student = _make_user("historystudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

        submission = AssignmentSubmission.objects.create(
            assignment=self.assignment,
            student=self.student,
            submitted_at=timezone.now(),
            status=AssignmentSubmission.SubmissionStatus.GRADED,
            marks=75,
            feedback="Well done",
        )
        AssignmentSubmissionFile.objects.create(
            submission=submission,
            file=SimpleUploadedFile("answer.pdf", b"file-content"),
            original_name="answer.pdf",
            file_type="pdf",
        )

        self.url = reverse("assignment-student-list")

    def test_requires_student_role(self):
        instructor = _make_user("historyinstructor", UserModel.Roles.TEACHER)
        self.client.force_authenticate(user=instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_submission_percentage_and_files(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data), 1)
        submission = data[0]["submission"]
        self.assertEqual(submission["marks"], 75)
        self.assertEqual(submission["percentage"], 75.0)
        self.assertEqual(len(submission["files"]), 1)
        self.assertEqual(submission["files"][0]["original_name"], "answer.pdf")


class StudentAssignmentListViewModuleLockTests(APITestCase):
    """Task 18 (Phase 5) — the dedicated student Assignments tab is fed by
    StudentAssignmentListView, a separate data source from the course-detail
    screens, and needs the same is_locked/lock_info annotation or a locked
    assignment looks fully open there (the exact gap found live for quizzes)."""

    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module_1 = Module.objects.create(course=self.course, title="Module 1", order=1)
        self.module_2 = Module.objects.create(course=self.course, title="Module 2", order=2)
        self.blocking_quiz = Quiz.objects.create(
            course=self.course,
            module=self.module_1,
            title="Blocking Quiz",
            passing_score=40,
            status=Status.PUBLISHED,
        )
        self.assignment = Assignment.objects.create(
            course=self.course,
            module=self.module_2,
            title="Assignment in module 2",
            due_date=timezone.now() + timezone.timedelta(days=7),
            total_marks=100,
            status=Status.PUBLISHED,
        )

        self.student = _make_user("lockedassignmentliststudent", UserModel.Roles.STUDENT)
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
        self.url = reverse("assignment-student-list")

    def test_locked_assignment_is_flagged_in_student_assignment_list(self):
        response = self.client.get(self.url)

        row = next(row for row in response.data["data"] if row["id"] == self.assignment.id)
        self.assertTrue(row["is_locked"])
        self.assertEqual(row["lock_info"]["blocking_quiz_id"], self.blocking_quiz.id)
