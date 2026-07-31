from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course, CourseInstructor
from enrollments.models import Enrollment

from .models import Choice, Question, Quiz, QuizAnswer, QuizAttempt, QuizResult

UserModel = get_user_model()


def _make_user(username, role):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
    )


class QuizCourseProgressListViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = Quiz.objects.create(
            course=self.course, title="Quiz 1", passing_score=40, status=Status.PUBLISHED
        )

        self.instructor = _make_user("quizinstructor", UserModel.Roles.TEACHER)
        self.other_teacher = _make_user("quizotherteacher", UserModel.Roles.TEACHER)
        CourseInstructor.objects.create(course=self.course, instructor=self.instructor)

        self.student_1 = _make_user("quizstudent1", UserModel.Roles.STUDENT)
        self.student_2 = _make_user("quizstudent2", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student_1, course=self.course)
        Enrollment.objects.create(student=self.student_2, course=self.course)

        attempt = QuizAttempt.objects.create(
            quiz=self.quiz,
            student=self.student_1,
            attempt_number=1,
            status=QuizAttempt.AttemptStatus.GRADED,
            ended_at=timezone.now(),
        )
        QuizResult.objects.create(
            attempt=attempt, score=Decimal("80"), percentage=Decimal("80.00"), is_passed=True
        )

        self.url = reverse("quiz-course-progress", kwargs={"course_id": self.course.id})

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbidden_for_non_instructor_teacher(self):
        self.client.force_authenticate(user=self.other_teacher)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_instructor_sees_attempted_and_not_attempted_rows(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["stats"]["completed_quizzes"], 1)
        self.assertEqual(data["stats"]["average_score"], 80.0)
        self.assertEqual(data["stats"]["pass_rate"], 100.0)

        rows = {row["student"]["id"]: row for row in data["results"]}
        self.assertEqual(rows[self.student_1.id]["status"], "PASSED")
        self.assertEqual(rows[self.student_2.id]["status"], "NOT_ATTEMPTED")

    def test_status_filter_narrows_rows(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url, {"status": "NOT_ATTEMPTED"})

        results = response.data["data"]["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["student"]["id"], self.student_2.id)


class QuizStudentAttemptListViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = Quiz.objects.create(
            course=self.course, title="Quiz 1", passing_score=40, status=Status.PUBLISHED
        )

        self.instructor = _make_user("attemptinstructor", UserModel.Roles.TEACHER)
        CourseInstructor.objects.create(course=self.course, instructor=self.instructor)

        self.student = _make_user("attemptstudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

        attempt_1 = QuizAttempt.objects.create(
            quiz=self.quiz, student=self.student, attempt_number=1, ended_at=timezone.now()
        )
        QuizResult.objects.create(
            attempt=attempt_1, score=Decimal("20"), percentage=Decimal("20.00"), is_passed=False
        )
        attempt_2 = QuizAttempt.objects.create(
            quiz=self.quiz, student=self.student, attempt_number=2, ended_at=timezone.now()
        )
        QuizResult.objects.create(
            attempt=attempt_2, score=Decimal("50"), percentage=Decimal("50.00"), is_passed=True
        )

        self.url = reverse(
            "quiz-student-attempts", kwargs={"quiz_id": self.quiz.id, "student_id": self.student.id}
        )

    def test_returns_full_attempt_history_ordered_by_attempt_number(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        attempts = response.data["data"]
        self.assertEqual(len(attempts), 2)
        self.assertEqual(attempts[0]["attempt_number"], 2)
        self.assertEqual(attempts[0]["is_passed"], True)
        self.assertEqual(attempts[1]["attempt_number"], 1)


class QuizAttemptDetailViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = Quiz.objects.create(
            course=self.course, title="Quiz 1", passing_score=40, status=Status.PUBLISHED
        )
        self.mcq_question = Question.objects.create(
            quiz=self.quiz, text="What is 2+2?", question_type=Question.QuestionType.MCQ, marks=5
        )
        self.correct_choice = Choice.objects.create(
            question=self.mcq_question, text="4", is_correct=True
        )
        self.wrong_choice = Choice.objects.create(
            question=self.mcq_question, text="5", is_correct=False
        )
        self.short_answer_question = Question.objects.create(
            quiz=self.quiz,
            text="Explain recursion.",
            question_type=Question.QuestionType.SHORT_ANSWER,
            marks=10,
        )

        self.instructor = _make_user("detailinstructor", UserModel.Roles.TEACHER)
        self.other_teacher = _make_user("detailotherteacher", UserModel.Roles.TEACHER)
        CourseInstructor.objects.create(course=self.course, instructor=self.instructor)

        self.student = _make_user("detailattemptstudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

        self.attempt = QuizAttempt.objects.create(
            quiz=self.quiz, student=self.student, attempt_number=1, ended_at=timezone.now()
        )
        QuizAnswer.objects.create(
            attempt=self.attempt,
            question=self.mcq_question,
            selected_choice=self.wrong_choice,
            marks_awarded=0,
            grading_status=QuizAnswer.GradingStatus.AUTO_GRADED,
        )
        QuizAnswer.objects.create(
            attempt=self.attempt,
            question=self.short_answer_question,
            text_answer="Recursion is when a function calls itself.",
            grading_status=QuizAnswer.GradingStatus.PENDING_GRADING,
        )
        QuizResult.objects.create(
            attempt=self.attempt, score=Decimal("0"), percentage=Decimal("0.00"), is_passed=False
        )

        self.url = reverse("quiz-attempt-detail", kwargs={"attempt_id": self.attempt.id})

    def test_requires_authentication(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbidden_for_non_instructor_teacher(self):
        self.client.force_authenticate(user=self.other_teacher)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_full_question_breakdown_with_correct_and_selected_choices(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["student"]["id"], self.student.id)
        self.assertEqual(len(data["questions"]), 2)

        mcq_data = next(q for q in data["questions"] if q["id"] == self.mcq_question.id)
        choices_by_text = {c["text"]: c for c in mcq_data["choices"]}
        self.assertTrue(choices_by_text["4"]["is_correct"])
        self.assertFalse(choices_by_text["4"]["is_selected"])
        self.assertFalse(choices_by_text["5"]["is_correct"])
        self.assertTrue(choices_by_text["5"]["is_selected"])
        self.assertEqual(mcq_data["marks_awarded"], 0.0)

        short_answer_data = next(
            q for q in data["questions"] if q["id"] == self.short_answer_question.id
        )
        self.assertEqual(
            short_answer_data["text_answer"], "Recursion is when a function calls itself."
        )
        self.assertEqual(short_answer_data["grading_status"], "PENDING_GRADING")
        self.assertIsNone(short_answer_data["marks_awarded"])

    def test_returns_404_for_missing_attempt(self):
        self.client.force_authenticate(user=self.instructor)
        url = reverse("quiz-attempt-detail", kwargs={"attempt_id": 999999})

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
