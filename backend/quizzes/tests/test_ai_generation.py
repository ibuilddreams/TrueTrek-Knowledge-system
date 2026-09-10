"""Tests for AI-regenerated quiz question sets on retries.

Mocking pattern mirrors quizzes/tests/test_ai_grading.py and
daily_drill/tests/test_ai_generation.py: patch
`quizzes.ai_generation.get_provider` with a stub implementing
`generate_course(prompt, response_schema, timeout, files=None)` — no real
network/Gemini call is ever made.
"""

import json
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from ai_courses.providers.base import ProviderError, ProviderResult
from common.models import Status
from courses.models import Category, Course
from enrollments.models import Enrollment
from modules.models import Module

from ..ai_generation import QuizRegenerationError, generate_quiz_questions
from ..models import Choice, Question, Quiz, QuizAttempt, QuizResult
from ..services import (
    InvalidAnswerError,
    get_attempt_questions,
    get_quiz_attempt_detail,
    publish_quiz,
    reorder_questions,
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


def _questions_payload(count=3, prefix="Regenerated"):
    return json.dumps(
        {
            "questions": [
                {
                    "text": f"{prefix} question {i}?",
                    "question_type": "MCQ",
                    "marks": 1,
                    "choices": [
                        {"text": "Right", "is_correct": True},
                        {"text": "Wrong A", "is_correct": False},
                        {"text": "Wrong B", "is_correct": False},
                        {"text": "Wrong C", "is_correct": False},
                    ],
                }
                for i in range(1, count + 1)
            ]
        }
    )


class StubProvider:
    def __init__(self, outcomes):
        self.outcomes = list(outcomes)
        self.call_count = 0
        self.last_prompt = None

    def generate_course(self, prompt, response_schema, timeout, files=None):
        self.call_count += 1
        self.last_prompt = prompt
        outcome = self.outcomes.pop(0) if self.outcomes else self.outcomes[-1]
        if isinstance(outcome, Exception):
            raise outcome
        return ProviderResult(text=outcome, input_tokens=5, output_tokens=10)


def _make_quiz(course, module=None, number_of_questions=3):
    quiz = Quiz.objects.create(
        course=course,
        module=module,
        title="Regen Quiz",
        status=Status.PUBLISHED,
        passing_score=40,
        number_of_questions=number_of_questions,
    )
    for order in range(1, number_of_questions + 1):
        question = Question.objects.create(
            quiz=quiz, text=f"Original Q{order}", marks=1, order=order
        )
        Choice.objects.create(question=question, text="Right", is_correct=True)
        Choice.objects.create(question=question, text="Wrong", is_correct=False)
    return quiz


def _fail_attempt(student, quiz, attempt_number):
    """Directly mirrors what start_quiz_attempt/submit_quiz_attempt would do,
    without going through the AI call — used to seed a prior failed attempt
    so the next start_quiz_attempt() call is attempt_number > 1."""
    if attempt_number == 1:
        attempt, _ = start_quiz_attempt(student, quiz)
    else:
        attempt = QuizAttempt.objects.create(student=student, quiz=quiz, attempt_number=attempt_number)
    attempt.status = QuizAttempt.AttemptStatus.GRADED
    attempt.ended_at = timezone.now()
    attempt.save(update_fields=["status", "ended_at"])
    QuizResult.objects.create(
        attempt=attempt, score=Decimal("0"), percentage=Decimal("0.00"), is_passed=False
    )
    return attempt


class GenerateQuizQuestionsTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(
            title="Intro to Python", category=self.category, difficulty=Course.Difficulty.BEGINNER
        )
        self.module = Module.objects.create(course=self.course, title="Basics", order=1)
        self.quiz = _make_quiz(self.course, module=self.module, number_of_questions=3)

    def test_generates_and_repairs_requested_count(self):
        provider = StubProvider([_questions_payload(3)])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            questions = generate_quiz_questions(self.quiz)

        self.assertEqual(provider.call_count, 1)
        self.assertEqual(len(questions), 3)
        for question in questions:
            self.assertEqual(question["question_type"], "MCQ")
            self.assertEqual(len(question["choices"]), 4)
            self.assertEqual(sum(1 for c in question["choices"] if c["is_correct"]), 1)

    def test_non_mcq_questions_are_dropped(self):
        # number_of_questions is generous here since the raw response is capped to it
        # *before* repair/enforcement — needs enough headroom that truncation doesn't
        # itself remove the valid MCQ questions this test is asserting survive.
        quiz = _make_quiz(self.course, number_of_questions=4)
        payload = json.dumps(
            {
                "questions": [
                    {"text": "True/False sneaking in?", "question_type": "TRUE_FALSE", "marks": 1,
                     "choices": [{"text": "True", "is_correct": True}, {"text": "False", "is_correct": False}]},
                    {"text": "Short answer sneaking in?", "question_type": "SHORT_ANSWER", "marks": 1},
                ]
                + json.loads(_questions_payload(2))["questions"]
            }
        )
        provider = StubProvider([payload])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            questions = generate_quiz_questions(quiz)

        self.assertEqual(len(questions), 2)
        self.assertTrue(all(q["question_type"] == "MCQ" for q in questions))

    def test_questions_with_too_few_choices_are_dropped(self):
        quiz = _make_quiz(self.course, number_of_questions=2)
        payload = json.dumps(
            {
                "questions": [
                    {
                        "text": "Only two choices?",
                        "question_type": "MCQ",
                        "marks": 1,
                        "choices": [
                            {"text": "Right", "is_correct": True},
                            {"text": "Wrong", "is_correct": False},
                        ],
                    }
                ]
                + json.loads(_questions_payload(1))["questions"]
            }
        )
        provider = StubProvider([payload])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            questions = generate_quiz_questions(quiz)

        self.assertEqual(len(questions), 1)
        self.assertEqual(len(questions[0]["choices"]), 4)

    def test_extra_choices_are_trimmed_to_four_keeping_the_correct_one(self):
        payload = json.dumps(
            {
                "questions": [
                    {
                        "text": "Six choices?",
                        "question_type": "MCQ",
                        "marks": 1,
                        "choices": [
                            {"text": "Wrong A", "is_correct": False},
                            {"text": "Wrong B", "is_correct": False},
                            {"text": "Right", "is_correct": True},
                            {"text": "Wrong C", "is_correct": False},
                            {"text": "Wrong D", "is_correct": False},
                            {"text": "Wrong E", "is_correct": False},
                        ],
                    }
                ]
            }
        )
        provider = StubProvider([payload])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            questions = generate_quiz_questions(self.quiz)

        self.assertEqual(len(questions), 1)
        self.assertEqual(len(questions[0]["choices"]), 4)
        self.assertEqual(sum(1 for c in questions[0]["choices"] if c["is_correct"]), 1)

    def test_provider_error_raises_regeneration_error(self):
        provider = StubProvider([ProviderError("bad key")])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            with self.assertRaises(QuizRegenerationError):
                generate_quiz_questions(self.quiz)

    def test_malformed_response_raises_regeneration_error(self):
        provider = StubProvider(["not json"])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            with self.assertRaises(QuizRegenerationError):
                generate_quiz_questions(self.quiz)

    def test_empty_questions_list_raises_regeneration_error(self):
        provider = StubProvider([json.dumps({"questions": []})])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            with self.assertRaises(QuizRegenerationError):
                generate_quiz_questions(self.quiz)

    def test_course_level_quiz_uses_every_module(self):
        course_quiz = Quiz.objects.create(
            course=self.course,
            module=None,
            title="Final Exam",
            status=Status.PUBLISHED,
            passing_score=40,
            number_of_questions=2,
        )
        Module.objects.create(course=self.course, title="Advanced", order=2)
        provider = StubProvider([_questions_payload(2)])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            generate_quiz_questions(course_quiz)

        self.assertIn("Basics", provider.last_prompt)
        self.assertIn("Advanced", provider.last_prompt)


class StartQuizAttemptRegenerationServiceTests(TestCase):
    """Covers the core behaviors from the implementation plan: attempt #1
    always serves the template, attempt #2+ always regenerates, a failed
    generation leaves zero residue, and past attempts' review data survives
    later regenerations untouched."""

    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = _make_quiz(self.course, number_of_questions=3)
        self.student = _make_user("regenservicestudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

    def test_attempt_one_uses_template_questions_no_provider_call(self):
        provider = StubProvider([RuntimeError("must not be called")])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            attempt, is_new = start_quiz_attempt(self.student, self.quiz)

        self.assertTrue(is_new)
        self.assertEqual(attempt.attempt_number, 1)
        self.assertEqual(provider.call_count, 0)
        questions = list(get_attempt_questions(attempt))
        self.assertEqual(len(questions), 3)
        self.assertTrue(all(q.attempt_id is None for q in questions))

    def test_attempt_two_triggers_exactly_one_regeneration(self):
        _fail_attempt(self.student, self.quiz, 1)

        provider = StubProvider([_questions_payload(3, prefix="Retry")])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            attempt, is_new = start_quiz_attempt(self.student, self.quiz)

        self.assertTrue(is_new)
        self.assertEqual(attempt.attempt_number, 2)
        self.assertEqual(provider.call_count, 1)
        questions = list(get_attempt_questions(attempt))
        self.assertEqual(len(questions), 3)
        self.assertTrue(all(q.attempt_id == attempt.id for q in questions))
        self.assertTrue(all(q.text.startswith("Retry") for q in questions))

    def test_ai_failure_leaves_no_residue(self):
        _fail_attempt(self.student, self.quiz, 1)
        attempts_before = QuizAttempt.objects.filter(student=self.student, quiz=self.quiz).count()
        questions_before = Question.objects.filter(quiz=self.quiz).count()

        provider = StubProvider([ProviderError("down")])
        with patch("quizzes.ai_generation.get_provider", return_value=provider):
            with self.assertRaises(QuizRegenerationError):
                start_quiz_attempt(self.student, self.quiz)

        self.assertEqual(
            QuizAttempt.objects.filter(student=self.student, quiz=self.quiz).count(), attempts_before
        )
        self.assertEqual(Question.objects.filter(quiz=self.quiz).count(), questions_before)

    def test_earlier_attempts_review_data_survives_later_regenerations(self):
        attempt_1, _ = start_quiz_attempt(self.student, self.quiz)
        question_1 = list(get_attempt_questions(attempt_1))[0]
        submit_quiz_attempt(attempt_1, [])

        with patch("quizzes.ai_generation.get_provider", return_value=StubProvider([_questions_payload(3, "R2")])):
            attempt_2, _ = start_quiz_attempt(self.student, self.quiz)
        submit_quiz_attempt(attempt_2, [])

        with patch("quizzes.ai_generation.get_provider", return_value=StubProvider([_questions_payload(3, "R3")])):
            attempt_3, _ = start_quiz_attempt(self.student, self.quiz)
        submit_quiz_attempt(attempt_3, [])

        detail_1 = get_quiz_attempt_detail(attempt_1)
        detail_2 = get_quiz_attempt_detail(attempt_2)
        self.assertEqual(detail_1["questions"][0]["text"], question_1.text)
        self.assertTrue(all(q["text"].startswith("R2") for q in detail_2["questions"]))
        self.assertNotEqual(
            {q["text"] for q in detail_2["questions"]}, {q["text"] for q in get_quiz_attempt_detail(attempt_3)["questions"]}
        )


class TemplateQuerysetIsolationTests(TestCase):
    """After students accumulate regenerated attempts, every
    authoring/aggregate view of a quiz's questions must still reflect only
    the template set — never the accumulated per-student ephemeral rows."""

    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = _make_quiz(self.course, number_of_questions=2)
        self.student_a = _make_user("isolationstudenta", UserModel.Roles.STUDENT)
        self.student_b = _make_user("isolationstudentb", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student_a, course=self.course)
        Enrollment.objects.create(student=self.student_b, course=self.course)

    def _regenerate_for(self, student):
        _fail_attempt(student, self.quiz, 1)
        with patch("quizzes.ai_generation.get_provider", return_value=StubProvider([_questions_payload(2)])):
            attempt, _ = start_quiz_attempt(student, self.quiz)
        return attempt

    def test_reorder_and_publish_only_see_template_questions(self):
        self._regenerate_for(self.student_a)
        self._regenerate_for(self.student_b)

        template_ids = list(
            Question.objects.filter(quiz=self.quiz, attempt__isnull=True).values_list("id", flat=True)
        )
        self.assertEqual(len(template_ids), 2)

        reordered = list(
            reorder_questions(
                self.quiz.id,
                [{"question_id": qid, "order": idx + 1} for idx, qid in enumerate(reversed(template_ids))],
            )
        )
        self.assertEqual({q.id for q in reordered}, set(template_ids))

        published = publish_quiz(self.quiz)
        self.assertEqual(published.status, Status.PUBLISHED)

        total_question_rows = Question.objects.filter(quiz=self.quiz).count()
        self.assertGreater(total_question_rows, 2)  # ephemeral rows exist...
        self.assertEqual(len(template_ids), 2)  # ...but never leak into the template view


class CrossAttemptAnswerGuardTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = _make_quiz(self.course, number_of_questions=1)
        self.student = _make_user("guardstudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)

    def test_cannot_submit_a_different_attempts_ephemeral_question(self):
        _fail_attempt(self.student, self.quiz, 1)
        with patch("quizzes.ai_generation.get_provider", return_value=StubProvider([_questions_payload(1)])):
            attempt_2, _ = start_quiz_attempt(self.student, self.quiz)
        submit_quiz_attempt(attempt_2, [])

        with patch("quizzes.ai_generation.get_provider", return_value=StubProvider([_questions_payload(1)])):
            attempt_3, _ = start_quiz_attempt(self.student, self.quiz)

        foreign_question = list(get_attempt_questions(attempt_2))[0]

        with self.assertRaises(InvalidAnswerError):
            submit_quiz_attempt(attempt_3, [{"question": foreign_question.id}])


class StartQuizAttemptThrottleTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.quiz = _make_quiz(self.course, number_of_questions=1)
        self.student = _make_user("throttlestudent", UserModel.Roles.STUDENT)
        Enrollment.objects.create(student=self.student, course=self.course)
        self.url = reverse("quiz-attempt-start", kwargs={"quiz_id": self.quiz.id})
        self.client.force_authenticate(user=self.student)

    def test_attempt_one_requests_are_never_throttled_by_regeneration_scope(self):
        cache.clear()
        try:
            from django.conf import settings as django_settings

            limit = int(
                django_settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["ai-quiz-regeneration"].split("/")[0]
            )
            # More than `limit` calls, but every one is attempt #1 for a fresh quiz —
            # none of them should ever consult the ai-quiz-regeneration throttle scope.
            for _ in range(limit + 2):
                quiz = _make_quiz(self.course, number_of_questions=1)
                url = reverse("quiz-attempt-start", kwargs={"quiz_id": quiz.id})
                response = self.client.post(url)
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        finally:
            cache.clear()

    def test_regenerating_requests_are_throttled_past_the_configured_rate(self):
        cache.clear()
        try:
            from django.conf import settings as django_settings

            limit = int(
                django_settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]["ai-quiz-regeneration"].split("/")[0]
            )
            _fail_attempt(self.student, self.quiz, 1)

            with patch(
                "quizzes.ai_generation.get_provider",
                return_value=StubProvider([_questions_payload(1)] * (limit + 2)),
            ):
                for attempt_number in range(2, limit + 2):
                    response = self.client.post(self.url)
                    self.assertEqual(response.status_code, status.HTTP_201_CREATED)
                    QuizAttempt.objects.filter(
                        student=self.student, quiz=self.quiz, attempt_number=attempt_number
                    ).update(status=QuizAttempt.AttemptStatus.GRADED, ended_at=timezone.now())
                    QuizResult.objects.create(
                        attempt=QuizAttempt.objects.get(
                            student=self.student, quiz=self.quiz, attempt_number=attempt_number
                        ),
                        score=Decimal("0"),
                        percentage=Decimal("0.00"),
                        is_passed=False,
                    )

                response = self.client.post(self.url)
                self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        finally:
            cache.clear()
