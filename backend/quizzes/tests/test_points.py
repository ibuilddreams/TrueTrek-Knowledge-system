"""Tests for quiz score reward points.

The rule has two halves and the second is what keeps the first from being
farmed: a score band pays, and only the first two attempts can earn it. Both
are pinned here, along with the property that makes the whole thing safe to
hang off `_recompute_quiz_result` — it is re-entered every time an attempt is
re-scored, and must pay exactly once.
"""

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course
from enrollments.models import Enrollment
from modules.models import Module
from rewards.models import PointsTransaction, StudentPointsAccount

from ..models import Choice, Question, Quiz, QuizAnswer, QuizAttempt
from ..points import (
    MAX_REWARDED_ATTEMPT_NUMBER,
    SCORE_REWARD_BANDS,
    describe_reward_bands,
    points_for_percentage,
)
from ..services import (
    auto_finalize_attempt,
    grade_quiz_answer,
    start_quiz_attempt,
    submit_quiz_attempt,
)

UserModel = get_user_model()

TOP_BAND = max(SCORE_REWARD_BANDS, key=lambda band: band["points"])


def _make_student(username):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.STUDENT,
    )


def _make_teacher(username):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.TEACHER,
    )


def _make_quiz(course, module=None, question_count=25):
    """`question_count` one-mark MCQs, so a score lands on an exact
    percentage: 25 questions makes 24 right worth exactly 96%, the bottom
    edge of the band."""
    quiz = Quiz.objects.create(
        course=course,
        module=module,
        title="Scored Quiz",
        status=Status.PUBLISHED,
        passing_score=40,
        number_of_questions=question_count,
    )
    for order in range(1, question_count + 1):
        question = Question.objects.create(quiz=quiz, text=f"Q{order}", marks=1, order=order)
        Choice.objects.create(question=question, text="Right", is_correct=True)
        Choice.objects.create(question=question, text="Wrong", is_correct=False)
    return quiz


def _answers(attempt, *, correct_count):
    """An answer payload picking the right choice for the first
    `correct_count` questions and the wrong one for the rest."""
    questions = (
        Question.objects.filter(quiz_id=attempt.quiz_id, attempt__isnull=True)
        if attempt.attempt_number == 1
        else Question.objects.filter(attempt=attempt)
    )
    payload = []
    for index, question in enumerate(questions.order_by("order")):
        wanted = index < correct_count
        choice = question.choices.filter(is_correct=wanted).first()
        payload.append({"question": question.id, "selected_choice": choice.id})
    return payload


def _make_later_attempt(student, quiz, attempt_number):
    """A retry, with its own attempt-scoped copy of the questions — what
    `ai_generation` would have written, without the provider call."""
    attempt = QuizAttempt.objects.create(
        student=student, quiz=quiz, attempt_number=attempt_number
    )
    for template in Question.objects.filter(quiz=quiz, attempt__isnull=True).order_by("order"):
        question = Question.objects.create(
            quiz=quiz,
            attempt=attempt,
            text=f"{template.text} (retry {attempt_number})",
            marks=template.marks,
            order=template.order,
        )
        for choice in template.choices.all():
            Choice.objects.create(
                question=question, text=choice.text, is_correct=choice.is_correct
            )
    return attempt


def _quiz_points(student):
    return list(
        PointsTransaction.objects.filter(
            student=student, transaction_type=PointsTransaction.TransactionType.QUIZ_REWARD
        )
    )


class PointsForPercentageTests(TestCase):
    """The band table on its own — no database."""

    def test_the_bands_are_well_formed(self):
        for band in SCORE_REWARD_BANDS:
            self.assertLessEqual(band["minimum"], band["maximum"], band)
            self.assertGreater(band["points"], 0, band)

    def test_a_score_inside_the_top_band_pays_it(self):
        self.assertEqual(points_for_percentage(TOP_BAND["minimum"]), TOP_BAND["points"])
        self.assertEqual(points_for_percentage(TOP_BAND["maximum"]), TOP_BAND["points"])

    def test_the_band_is_inclusive_at_both_ends(self):
        just_under = TOP_BAND["minimum"] - Decimal("0.01")

        self.assertEqual(points_for_percentage(Decimal(TOP_BAND["minimum"])), TOP_BAND["points"])
        self.assertEqual(points_for_percentage(just_under), 0)

    def test_a_score_in_no_band_pays_nothing(self):
        self.assertEqual(points_for_percentage(0), 0)
        self.assertEqual(points_for_percentage(50), 0)

    def test_junk_pays_nothing_rather_than_raising(self):
        for value in (None, "", "abc", object()):
            self.assertEqual(points_for_percentage(value), 0, value)

    def test_decimal_percentages_are_handled(self):
        """QuizResult.percentage is a Decimal, not a float."""
        self.assertEqual(
            points_for_percentage(Decimal("96.00")), TOP_BAND["points"]
        )

    def test_described_bands_match_the_table_that_pays(self):
        described = describe_reward_bands()

        self.assertEqual(described["max_rewarded_attempt_number"], MAX_REWARDED_ATTEMPT_NUMBER)
        self.assertEqual(
            [(band["min_percentage"], band["max_percentage"], band["points"]) for band in described["bands"]],
            [(band["minimum"], band["maximum"], band["points"]) for band in SCORE_REWARD_BANDS],
        )


class QuizScorePointsTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module = Module.objects.create(course=self.course, title="Basics", order=1)
        self.quiz = _make_quiz(self.course, module=self.module)
        self.student = _make_student("pointsstudent")
        Enrollment.objects.create(student=self.student, course=self.course)

    def test_a_top_score_on_the_first_attempt_pays_the_band(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        result = submit_quiz_attempt(attempt, _answers(attempt, correct_count=25))

        self.assertEqual(float(result.percentage), 100.0)
        transactions = _quiz_points(self.student)
        self.assertEqual(len(transactions), 1)
        self.assertEqual(transactions[0].amount, TOP_BAND["points"])
        self.assertEqual(transactions[0].quiz_attempt_id, attempt.id)
        self.assertEqual(
            StudentPointsAccount.objects.get(student=self.student).balance, TOP_BAND["points"]
        )

    def test_the_bottom_of_the_band_still_pays(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        result = submit_quiz_attempt(attempt, _answers(attempt, correct_count=24))

        self.assertEqual(float(result.percentage), 96.0)
        self.assertEqual(len(_quiz_points(self.student)), 1)

    def test_just_under_the_band_pays_nothing(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        result = submit_quiz_attempt(attempt, _answers(attempt, correct_count=23))

        self.assertEqual(float(result.percentage), 92.0)
        self.assertEqual(_quiz_points(self.student), [])
        self.assertFalse(StudentPointsAccount.objects.filter(student=self.student).exists())

    def test_the_second_attempt_can_still_earn(self):
        first, _ = start_quiz_attempt(self.student, self.quiz)
        submit_quiz_attempt(first, _answers(first, correct_count=10))

        second = _make_later_attempt(self.student, self.quiz, 2)
        submit_quiz_attempt(second, _answers(second, correct_count=25))

        transactions = _quiz_points(self.student)
        self.assertEqual(len(transactions), 1)
        self.assertEqual(transactions[0].quiz_attempt_id, second.id)

    def test_a_third_attempt_earns_nothing_however_well_it_scores(self):
        """Retries are unlimited and every one is a freshly generated
        question set, so without this cap a student could simply re-sit until
        they happened to ace one."""
        first, _ = start_quiz_attempt(self.student, self.quiz)
        submit_quiz_attempt(first, _answers(first, correct_count=0))
        second = _make_later_attempt(self.student, self.quiz, 2)
        submit_quiz_attempt(second, _answers(second, correct_count=0))

        third = _make_later_attempt(self.student, self.quiz, 3)
        result = submit_quiz_attempt(third, _answers(third, correct_count=25))

        self.assertEqual(float(result.percentage), 100.0)
        self.assertEqual(_quiz_points(self.student), [])

    def test_two_students_each_earn_their_own(self):
        other = _make_student("pointsstudent2")
        Enrollment.objects.create(student=other, course=self.course)

        mine, _ = start_quiz_attempt(self.student, self.quiz)
        submit_quiz_attempt(mine, _answers(mine, correct_count=25))
        theirs, _ = start_quiz_attempt(other, self.quiz)
        submit_quiz_attempt(theirs, _answers(theirs, correct_count=25))

        self.assertEqual(len(_quiz_points(self.student)), 1)
        self.assertEqual(len(_quiz_points(other)), 1)

    def test_an_expired_attempt_never_pays(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        auto_finalize_attempt(attempt, QuizAttempt.AttemptStatus.EXPIRED)

        self.assertEqual(_quiz_points(self.student), [])

    def test_resubmitting_the_same_attempt_cannot_pay_twice(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        submit_quiz_attempt(attempt, _answers(attempt, correct_count=25))
        submit_quiz_attempt(attempt, _answers(attempt, correct_count=25))

        self.assertEqual(len(_quiz_points(self.student)), 1)
        self.assertEqual(
            StudentPointsAccount.objects.get(student=self.student).balance, TOP_BAND["points"]
        )


class PendingGradingPointsTests(TestCase):
    """A quiz with a short-answer question has no final score at the moment it
    is handed in — which is the whole reason the award hangs off
    `_recompute_quiz_result` rather than off submit."""

    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module = Module.objects.create(course=self.course, title="Basics", order=1)
        self.quiz = Quiz.objects.create(
            course=self.course,
            module=self.module,
            title="Mixed Quiz",
            status=Status.PUBLISHED,
            passing_score=40,
            number_of_questions=2,
        )
        self.mcq = Question.objects.create(quiz=self.quiz, text="Pick one", marks=1, order=1)
        Choice.objects.create(question=self.mcq, text="Right", is_correct=True)
        Choice.objects.create(question=self.mcq, text="Wrong", is_correct=False)
        self.written = Question.objects.create(
            quiz=self.quiz,
            text="Explain",
            question_type=Question.QuestionType.SHORT_ANSWER,
            marks=1,
            order=2,
        )
        self.student = _make_student("pendingstudent")
        self.teacher = _make_teacher("pendingteacher")
        Enrollment.objects.create(student=self.student, course=self.course)

    def _submit_full(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        correct = self.mcq.choices.get(is_correct=True)
        submit_quiz_attempt(
            attempt,
            [
                {"question": self.mcq.id, "selected_choice": correct.id},
                {"question": self.written.id, "text_answer": "Because of X."},
            ],
        )
        return QuizAttempt.objects.get(pk=attempt.pk)

    def test_nothing_is_paid_while_an_answer_is_still_pending(self):
        attempt = self._submit_full()

        self.assertEqual(attempt.status, QuizAttempt.AttemptStatus.SUBMITTED)
        self.assertEqual(_quiz_points(self.student), [])

    def test_the_band_is_paid_once_the_last_answer_is_graded(self):
        attempt = self._submit_full()
        answer = QuizAnswer.objects.get(attempt=attempt, question=self.written)

        grade_quiz_answer(answer, 1, feedback="Good")

        attempt.refresh_from_db()
        self.assertEqual(attempt.status, QuizAttempt.AttemptStatus.GRADED)
        self.assertEqual(len(_quiz_points(self.student)), 1)

    def test_a_later_regrade_does_not_pay_again(self):
        """`_recompute_quiz_result` runs on every grading change, so the award
        path is re-entered by design."""
        attempt = self._submit_full()
        answer = QuizAnswer.objects.get(attempt=attempt, question=self.written)

        grade_quiz_answer(answer, 1)
        grade_quiz_answer(answer, 1, feedback="Still right")
        grade_quiz_answer(answer, 0, feedback="Actually wrong")

        transactions = _quiz_points(self.student)
        self.assertEqual(len(transactions), 1)
        self.assertEqual(transactions[0].amount, TOP_BAND["points"])
        # The ledger is append-only: a re-grade downwards never claws a payout
        # back (undoing one is a manual adjustment in `rewards`).
        self.assertEqual(
            StudentPointsAccount.objects.get(student=self.student).balance, TOP_BAND["points"]
        )

    def test_a_short_answer_graded_low_never_earns(self):
        attempt = self._submit_full()
        answer = QuizAnswer.objects.get(attempt=attempt, question=self.written)

        grade_quiz_answer(answer, 0)

        attempt.refresh_from_db()
        self.assertEqual(attempt.status, QuizAttempt.AttemptStatus.GRADED)
        self.assertEqual(_quiz_points(self.student), [])


class QuizPointsApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module = Module.objects.create(course=self.course, title="Basics", order=1)
        self.quiz = _make_quiz(self.course, module=self.module)
        self.student = _make_student("apipointsstudent")
        Enrollment.objects.create(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.student)

    def test_the_submit_response_reports_the_points_earned(self):
        start = self.client.post(reverse("quiz-attempt-start", kwargs={"quiz_id": self.quiz.id}))
        attempt_id = start.data["data"]["attempt_id"]
        attempt = QuizAttempt.objects.get(pk=attempt_id)

        response = self.client.post(
            reverse("quiz-attempt-submit", kwargs={"attempt_id": attempt_id}),
            {"answers": _answers(attempt, correct_count=25)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["points_awarded"], TOP_BAND["points"])

    def test_the_submit_response_reports_zero_when_nothing_was_earned(self):
        start = self.client.post(reverse("quiz-attempt-start", kwargs={"quiz_id": self.quiz.id}))
        attempt_id = start.data["data"]["attempt_id"]
        attempt = QuizAttempt.objects.get(pk=attempt_id)

        response = self.client.post(
            reverse("quiz-attempt-submit", kwargs={"attempt_id": attempt_id}),
            {"answers": _answers(attempt, correct_count=1)},
            format="json",
        )

        self.assertEqual(response.data["data"]["points_awarded"], 0)

    def test_the_quiz_list_states_the_rule_and_whether_it_still_applies(self):
        response = self.client.get(reverse("quiz-student-list"))
        quiz = next(row for row in response.data["data"] if row["id"] == self.quiz.id)

        self.assertEqual(
            quiz["score_reward"]["max_rewarded_attempt_number"], MAX_REWARDED_ATTEMPT_NUMBER
        )
        self.assertTrue(quiz["score_reward"]["can_earn_on_next_attempt"])
        self.assertEqual(
            quiz["score_reward"]["bands"], describe_reward_bands()["bands"]
        )

    def test_the_rule_stops_applying_once_the_attempts_are_spent(self):
        first, _ = start_quiz_attempt(self.student, self.quiz)
        submit_quiz_attempt(first, [])
        second = _make_later_attempt(self.student, self.quiz, 2)
        submit_quiz_attempt(second, [])

        response = self.client.get(reverse("quiz-student-list"))
        quiz = next(row for row in response.data["data"] if row["id"] == self.quiz.id)

        self.assertFalse(quiz["score_reward"]["can_earn_on_next_attempt"])
