from datetime import timedelta
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
from .services import (
    autosave_quiz_attempt,
    finalize_stale_attempts,
    grade_quiz_answer,
    start_quiz_attempt,
    submit_quiz_attempt,
)

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


class QuizMyAttemptDetailViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = Quiz.objects.create(
            course=self.course, title="Quiz 1", passing_score=40, status=Status.PUBLISHED
        )
        self.question = Question.objects.create(
            quiz=self.quiz, text="What is 2+2?", question_type=Question.QuestionType.MCQ, marks=5
        )
        self.correct_choice = Choice.objects.create(question=self.question, text="4", is_correct=True)
        Choice.objects.create(question=self.question, text="5", is_correct=False)

        self.student = _make_user("myattemptstudent", UserModel.Roles.STUDENT)
        self.other_student = _make_user("otherattemptstudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

        self.attempt = QuizAttempt.objects.create(
            quiz=self.quiz, student=self.student, attempt_number=1, ended_at=timezone.now()
        )
        QuizAnswer.objects.create(
            attempt=self.attempt,
            question=self.question,
            selected_choice=self.correct_choice,
            marks_awarded=5,
            grading_status=QuizAnswer.GradingStatus.AUTO_GRADED,
        )
        QuizResult.objects.create(
            attempt=self.attempt, score=Decimal("5"), percentage=Decimal("100.00"), is_passed=True
        )

        self.url = reverse("quiz-attempt-my-detail", kwargs={"attempt_id": self.attempt.id})

    def test_requires_student_role(self):
        instructor = _make_user("myattemptinstructor", UserModel.Roles.TEACHER)
        self.client.force_authenticate(user=instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_404_for_another_students_attempt(self):
        self.client.force_authenticate(user=self.other_student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_returns_own_attempt_with_correct_answers(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(data["percentage"], 100.0)
        self.assertEqual(len(data["questions"]), 1)
        choices_by_text = {c["text"]: c for c in data["questions"][0]["choices"]}
        self.assertTrue(choices_by_text["4"]["is_selected"])
        self.assertTrue(choices_by_text["4"]["is_correct"])


class StudentQuizAttemptsListViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = Quiz.objects.create(
            course=self.course, title="Quiz 1", passing_score=40, status=Status.PUBLISHED
        )
        Question.objects.create(quiz=self.quiz, text="Q1", marks=10)

        self.student = _make_user("historyquizstudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

        attempt_1 = QuizAttempt.objects.create(
            quiz=self.quiz, student=self.student, attempt_number=1, ended_at=timezone.now()
        )
        QuizResult.objects.create(
            attempt=attempt_1, score=Decimal("4"), percentage=Decimal("40.00"), is_passed=True
        )
        attempt_2 = QuizAttempt.objects.create(
            quiz=self.quiz, student=self.student, attempt_number=2, ended_at=timezone.now()
        )
        QuizResult.objects.create(
            attempt=attempt_2, score=Decimal("2"), percentage=Decimal("20.00"), is_passed=False
        )

        self.url = reverse("quiz-student-attempts-list")

    def test_requires_student_role(self):
        instructor = _make_user("historyquizinstructor", UserModel.Roles.TEACHER)
        self.client.force_authenticate(user=instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_returns_all_attempts_across_enrolled_courses(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["attempt_number"], 2)
        self.assertEqual(data[0]["total_marks"], 10)
        self.assertEqual(data[0]["course"]["id"], self.course.id)
        self.assertEqual(data[1]["attempt_number"], 1)


def _age_attempt(attempt, *, started_at=None, last_activity_at=None):
    """Backdate an attempt's timestamps to simulate one that's been sitting IN_PROGRESS
    for a while — started_at is auto_now_add, so a queryset .update() is required."""
    fields = {}
    if started_at is not None:
        fields["started_at"] = started_at
    if last_activity_at is not None:
        fields["last_activity_at"] = last_activity_at
    QuizAttempt.objects.filter(pk=attempt.pk).update(**fields)
    attempt.refresh_from_db()
    return attempt


class QuizAttemptLifecycleServiceTests(APITestCase):
    """Covers the abandoned/expired-attempt lifecycle: staleness detection, resuming an
    in-progress attempt instead of creating a duplicate, and the answer-merging behavior
    that keeps grading consistent (blank answers auto-graded instead of stuck pending)."""

    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.timed_quiz = Quiz.objects.create(
            course=self.course,
            title="Timed Quiz",
            passing_score=40,
            status=Status.PUBLISHED,
            time_limit_minutes=10,
            attempts_allowed=3,
        )
        self.untimed_quiz = Quiz.objects.create(
            course=self.course,
            title="Untimed Quiz",
            passing_score=40,
            status=Status.PUBLISHED,
            attempts_allowed=3,
        )
        for quiz in (self.timed_quiz, self.untimed_quiz):
            mcq = Question.objects.create(
                quiz=quiz, text="2+2?", question_type=Question.QuestionType.MCQ, marks=5
            )
            Choice.objects.create(question=mcq, text="4", is_correct=True)
            Choice.objects.create(question=mcq, text="5", is_correct=False)
            Question.objects.create(
                quiz=quiz,
                text="Explain recursion.",
                question_type=Question.QuestionType.SHORT_ANSWER,
                marks=5,
            )

        self.student = _make_user("lifecyclestudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

    def test_start_quiz_attempt_creates_new_attempt(self):
        attempt, is_new = start_quiz_attempt(self.student, self.timed_quiz)

        self.assertTrue(is_new)
        self.assertEqual(attempt.attempt_number, 1)
        self.assertEqual(attempt.status, QuizAttempt.AttemptStatus.IN_PROGRESS)

    def test_start_quiz_attempt_resumes_active_in_progress_attempt(self):
        first, _ = start_quiz_attempt(self.student, self.timed_quiz)

        second, is_new = start_quiz_attempt(self.student, self.timed_quiz)

        self.assertFalse(is_new)
        self.assertEqual(second.id, first.id)
        self.assertEqual(QuizAttempt.objects.filter(student=self.student).count(), 1)

    def test_start_quiz_attempt_finalizes_expired_attempt_then_creates_new_one(self):
        stale, _ = start_quiz_attempt(self.student, self.timed_quiz)
        _age_attempt(stale, started_at=timezone.now() - timedelta(minutes=20))

        fresh, is_new = start_quiz_attempt(self.student, self.timed_quiz)

        self.assertTrue(is_new)
        self.assertNotEqual(fresh.id, stale.id)
        self.assertEqual(fresh.attempt_number, 2)

        stale.refresh_from_db()
        self.assertEqual(stale.status, QuizAttempt.AttemptStatus.EXPIRED)
        self.assertIsNotNone(stale.ended_at)
        self.assertTrue(QuizResult.objects.filter(attempt=stale).exists())

    def test_finalize_stale_attempts_leaves_active_attempt_untouched(self):
        attempt, _ = start_quiz_attempt(self.student, self.untimed_quiz)
        attempt.quiz = self.untimed_quiz

        finalized = finalize_stale_attempts([attempt])

        self.assertEqual(finalized, [])
        attempt.refresh_from_db()
        self.assertEqual(attempt.status, QuizAttempt.AttemptStatus.IN_PROGRESS)

    def test_finalize_stale_attempts_marks_untimed_quiz_abandoned_after_inactivity(self):
        attempt, _ = start_quiz_attempt(self.student, self.untimed_quiz)
        _age_attempt(
            attempt,
            started_at=timezone.now() - timedelta(hours=30),
            last_activity_at=timezone.now() - timedelta(hours=25),
        )
        attempt.quiz = self.untimed_quiz

        finalized = finalize_stale_attempts([attempt])

        self.assertEqual(len(finalized), 1)
        self.assertEqual(attempt.status, QuizAttempt.AttemptStatus.ABANDONED)
        self.assertIsNotNone(attempt.ended_at)

    def test_submit_creates_auto_graded_blank_answer_for_untouched_question(self):
        attempt, _ = start_quiz_attempt(self.student, self.untimed_quiz)
        mcq = self.untimed_quiz.questions.get(question_type=Question.QuestionType.MCQ)
        correct_choice = mcq.choices.get(is_correct=True)

        submit_quiz_attempt(
            attempt, [{"question": mcq.id, "selected_choice": correct_choice.id}]
        )

        short_answer = self.untimed_quiz.questions.get(
            question_type=Question.QuestionType.SHORT_ANSWER
        )
        answer = QuizAnswer.objects.get(attempt=attempt, question=short_answer)
        self.assertIsNotNone(answer.id)
        self.assertEqual(answer.marks_awarded, 0)
        self.assertEqual(answer.grading_status, QuizAnswer.GradingStatus.AUTO_GRADED)

    def test_submit_merges_autosaved_answers_not_included_in_final_payload(self):
        attempt, _ = start_quiz_attempt(self.student, self.untimed_quiz)
        short_answer = self.untimed_quiz.questions.get(
            question_type=Question.QuestionType.SHORT_ANSWER
        )
        autosave_quiz_attempt(
            attempt, [{"question": short_answer.id, "text_answer": "Recursion is self-calling."}]
        )

        mcq = self.untimed_quiz.questions.get(question_type=Question.QuestionType.MCQ)
        correct_choice = mcq.choices.get(is_correct=True)
        # Final submit omits the short-answer question entirely (e.g. client only sent
        # what changed since the last autosave) — the autosaved text must still count.
        result = submit_quiz_attempt(
            attempt, [{"question": mcq.id, "selected_choice": correct_choice.id}]
        )

        saved_answer = QuizAnswer.objects.get(attempt=attempt, question=short_answer)
        self.assertEqual(saved_answer.text_answer, "Recursion is self-calling.")
        self.assertEqual(saved_answer.grading_status, QuizAnswer.GradingStatus.PENDING_GRADING)
        self.assertEqual(attempt.status, QuizAttempt.AttemptStatus.SUBMITTED)
        self.assertEqual(result.score, Decimal("5"))

    def test_grading_pending_answer_does_not_resurrect_expired_status(self):
        stale, _ = start_quiz_attempt(self.student, self.untimed_quiz)
        short_answer = self.untimed_quiz.questions.get(
            question_type=Question.QuestionType.SHORT_ANSWER
        )
        autosave_quiz_attempt(
            stale, [{"question": short_answer.id, "text_answer": "Some partial answer."}]
        )
        _age_attempt(
            stale,
            started_at=timezone.now() - timedelta(hours=30),
            last_activity_at=timezone.now() - timedelta(hours=25),
        )
        stale.quiz = self.untimed_quiz
        finalize_stale_attempts([stale])
        self.assertEqual(stale.status, QuizAttempt.AttemptStatus.ABANDONED)

        answer = QuizAnswer.objects.get(attempt=stale, question=short_answer)
        result = grade_quiz_answer(answer, Decimal("4"), feedback="Partial credit")

        stale.refresh_from_db()
        self.assertEqual(stale.status, QuizAttempt.AttemptStatus.ABANDONED)
        self.assertEqual(result.score, Decimal("4"))


class QuizAttemptAutosaveViewTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = Quiz.objects.create(
            course=self.course, title="Quiz 1", passing_score=40, status=Status.PUBLISHED
        )
        self.question = Question.objects.create(
            quiz=self.quiz, text="2+2?", question_type=Question.QuestionType.MCQ, marks=5
        )
        self.correct_choice = Choice.objects.create(question=self.question, text="4", is_correct=True)

        self.student = _make_user("autosavestudent", UserModel.Roles.STUDENT)
        self.other_student = _make_user("otherautosavestudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

        self.attempt, _ = start_quiz_attempt(self.student, self.quiz)
        self.url = reverse("quiz-attempt-autosave", kwargs={"attempt_id": self.attempt.id})

    def test_requires_authentication(self):
        response = self.client.post(self.url, {"answers": []}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_404_for_another_students_attempt(self):
        self.client.force_authenticate(user=self.other_student)

        response = self.client.post(self.url, {"answers": []}, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_persists_answer_without_ending_attempt(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(
            self.url,
            {
                "answers": [
                    {"question": self.question.id, "selected_choice": self.correct_choice.id}
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.attempt.refresh_from_db()
        self.assertIsNone(self.attempt.ended_at)
        self.assertEqual(self.attempt.status, QuizAttempt.AttemptStatus.IN_PROGRESS)
        answer = QuizAnswer.objects.get(attempt=self.attempt, question=self.question)
        self.assertEqual(answer.selected_choice_id, self.correct_choice.id)
        # Autosave only records the response — grading happens at submit time.
        self.assertIsNone(answer.marks_awarded)

    def test_rejects_autosave_once_attempt_is_no_longer_in_progress(self):
        submit_quiz_attempt(
            self.attempt, [{"question": self.question.id, "selected_choice": self.correct_choice.id}]
        )
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.url, {"answers": []}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class StartQuizAttemptViewResumeTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = Quiz.objects.create(
            course=self.course, title="Quiz 1", passing_score=40, status=Status.PUBLISHED
        )
        Question.objects.create(quiz=self.quiz, text="Q1", marks=5)

        self.student = _make_user("resumestudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.student)
        self.url = reverse("quiz-attempt-start", kwargs={"quiz_id": self.quiz.id})

    def test_first_start_creates_new_attempt(self):
        response = self.client.post(self.url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertFalse(response.data["data"]["resumed"])

    def test_second_start_resumes_same_attempt(self):
        first_response = self.client.post(self.url)
        second_response = self.client.post(self.url)

        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertTrue(second_response.data["data"]["resumed"])
        self.assertEqual(
            second_response.data["data"]["attempt_id"], first_response.data["data"]["attempt_id"]
        )
        self.assertEqual(QuizAttempt.objects.filter(student=self.student).count(), 1)


class QuizCourseProgressAbandonedAttemptTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = Quiz.objects.create(
            course=self.course,
            title="Quiz 1",
            passing_score=40,
            status=Status.PUBLISHED,
            time_limit_minutes=10,
        )
        Question.objects.create(quiz=self.quiz, text="Q1", marks=5)

        self.instructor = _make_user("progressabandoninstructor", UserModel.Roles.TEACHER)
        CourseInstructor.objects.create(course=self.course, instructor=self.instructor)

        self.student = _make_user("progressabandonstudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        _age_attempt(attempt, started_at=timezone.now() - timedelta(minutes=20))

        self.url = reverse("quiz-course-progress", kwargs={"course_id": self.course.id})

    def test_stale_in_progress_attempt_surfaces_as_expired(self):
        self.client.force_authenticate(user=self.instructor)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        row = data["results"][0]
        self.assertEqual(row["status"], "EXPIRED")
        self.assertEqual(data["stats"]["completed_quizzes"], 0)
        self.assertEqual(data["stats"]["abandoned_attempts"], 1)
