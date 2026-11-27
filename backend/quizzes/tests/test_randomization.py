"""Tests for per-attempt question/choice randomization.

The feature's whole value is a pair of opposing properties, so both are
pinned here: an attempt's order never moves *within* that attempt (a refresh,
a resume and the review screen all agree), and it does move *between*
attempts and between students.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from common.models import Status
from courses.models import Category, Course
from enrollments.models import Enrollment
from modules.models import Module

from ..models import Choice, Question, Quiz, QuizAttempt
from ..randomization import NO_SHUFFLE_SEED, MAX_SEED, new_attempt_seed, shuffled
from ..services import (
    get_attempt_question_set,
    get_quiz_attempt_detail,
    start_quiz_attempt,
    submit_quiz_attempt,
)

UserModel = get_user_model()


class ShuffledTests(TestCase):
    """The pure ordering primitive — no database, no Django."""

    items = [{"id": index} for index in range(1, 21)]
    key = staticmethod(lambda item: item["id"])

    def test_is_stable_for_one_seed(self):
        first = shuffled(1234, self.items, key=self.key)
        second = shuffled(1234, self.items, key=self.key)

        self.assertEqual(first, second)

    def test_differs_between_seeds(self):
        self.assertNotEqual(
            shuffled(1234, self.items, key=self.key),
            shuffled(5678, self.items, key=self.key),
        )

    def test_namespaces_separate_shuffles_sharing_a_seed(self):
        self.assertNotEqual(
            shuffled(1234, self.items, key=self.key, namespace="questions"),
            shuffled(1234, self.items, key=self.key, namespace="choices:7"),
        )

    def test_keeps_every_item_exactly_once(self):
        result = shuffled(1234, self.items, key=self.key)

        self.assertEqual(sorted(item["id"] for item in result), [item["id"] for item in self.items])

    def test_actually_reorders(self):
        self.assertNotEqual(shuffled(1234, self.items, key=self.key), list(self.items))

    def test_seed_zero_serves_the_authored_order(self):
        self.assertEqual(shuffled(NO_SHUFFLE_SEED, self.items, key=self.key), list(self.items))

    def test_removing_an_item_leaves_the_rest_in_place(self):
        """The reason this hashes per row instead of shuffling the list: a
        question deleted from a quiz while an attempt is open must not
        reshuffle every other question underneath the student."""
        before = shuffled(1234, self.items, key=self.key)
        dropped = before[3]
        after = shuffled(
            1234, [item for item in self.items if item is not dropped], key=self.key
        )

        self.assertEqual(after, [item for item in before if item is not dropped])

    def test_new_seed_is_usable_and_never_means_no_shuffle(self):
        seeds = {new_attempt_seed() for _ in range(200)}

        self.assertNotIn(NO_SHUFFLE_SEED, seeds)
        self.assertTrue(all(0 < seed <= MAX_SEED for seed in seeds))
        # Not a randomness test — just that it is not a constant.
        self.assertGreater(len(seeds), 1)


def _make_quiz(course, module=None, question_count=10, choices_per_question=4):
    quiz = Quiz.objects.create(
        course=course,
        module=module,
        title="Randomized Quiz",
        status=Status.PUBLISHED,
        passing_score=40,
        number_of_questions=question_count,
    )
    for order in range(1, question_count + 1):
        question = Question.objects.create(
            quiz=quiz, text=f"Q{order}", marks=1, order=order
        )
        for index in range(choices_per_question):
            Choice.objects.create(
                question=question, text=f"Q{order} choice {index}", is_correct=index == 0
            )
    return quiz


class AttemptQuestionSetTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module = Module.objects.create(course=self.course, title="Basics", order=1)
        self.quiz = _make_quiz(self.course, module=self.module)
        self.student = _make_student("randomstudent")
        Enrollment.objects.create(student=self.student, course=self.course)

    def test_attempt_gets_its_own_seed(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)

        self.assertNotEqual(attempt.question_seed, NO_SHUFFLE_SEED)

    def test_order_is_identical_on_every_read_of_one_attempt(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)

        first = [question.id for question in get_attempt_question_set(attempt)]
        second = [
            question.id
            for question in get_attempt_question_set(QuizAttempt.objects.get(pk=attempt.pk))
        ]

        self.assertEqual(first, second)

    def test_two_students_sit_the_same_quiz_in_different_orders(self):
        other = _make_student("randomstudent2")
        Enrollment.objects.create(student=other, course=self.course)

        mine, _ = start_quiz_attempt(self.student, self.quiz)
        theirs, _ = start_quiz_attempt(other, self.quiz)

        self.assertNotEqual(
            [question.id for question in get_attempt_question_set(mine)],
            [question.id for question in get_attempt_question_set(theirs)],
        )

    def test_a_retry_meets_the_template_questions_in_a_different_order(self):
        """Attempt 2+ normally gets an AI-written set; this pins the ordering
        half on its own, by pointing both attempts at the same questions."""
        first, _ = start_quiz_attempt(self.student, self.quiz)
        second = QuizAttempt.objects.create(
            student=self.student,
            quiz=self.quiz,
            attempt_number=1,
            question_seed=new_attempt_seed(),
        )

        self.assertNotEqual(
            [question.id for question in get_attempt_question_set(first)],
            [question.id for question in get_attempt_question_set(second)],
        )

    def test_serves_every_question_exactly_once(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)

        served = [question.id for question in get_attempt_question_set(attempt)]
        authored = set(
            Question.objects.filter(quiz=self.quiz, attempt__isnull=True).values_list(
                "id", flat=True
            )
        )

        self.assertEqual(sorted(served), sorted(authored))

    def test_mcq_choices_are_shuffled_per_question(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)

        questions = get_attempt_question_set(attempt)
        authored = {
            question.id: sorted(choice.id for choice in question.choices.all())
            for question in questions
        }

        # Each question keeps all of its own choices...
        for question in questions:
            self.assertEqual(
                sorted(choice.id for choice in question.attempt_choices), authored[question.id]
            )

        # ...and at least one question's choices are not in authored order, or the
        # correct answer would sit in the same slot on every paper.
        self.assertTrue(
            any(
                [choice.id for choice in question.attempt_choices] != authored[question.id]
                for question in questions
            )
        )

    def test_the_correct_answer_does_not_sit_in_one_slot_down_the_paper(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)

        positions = {
            next(
                index
                for index, choice in enumerate(question.attempt_choices)
                if choice.is_correct
            )
            for question in get_attempt_question_set(attempt)
        }

        self.assertGreater(len(positions), 1)

    def test_true_false_choices_keep_their_authored_order(self):
        question = Question.objects.create(
            quiz=self.quiz,
            text="True or false?",
            question_type=Question.QuestionType.TRUE_FALSE,
            marks=1,
            order=99,
        )
        true_choice = Choice.objects.create(question=question, text="True", is_correct=True)
        false_choice = Choice.objects.create(question=question, text="False", is_correct=False)

        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        served = next(
            served
            for served in get_attempt_question_set(attempt)
            if served.id == question.id
        )

        self.assertEqual(
            [choice.id for choice in served.attempt_choices], [true_choice.id, false_choice.id]
        )

    def test_display_order_counts_the_attempts_own_positions(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)

        questions = get_attempt_question_set(attempt)

        self.assertEqual(
            [question.display_order for question in questions],
            list(range(1, len(questions) + 1)),
        )

    def test_a_legacy_attempt_still_reviews_in_authored_order(self):
        """Attempts taken before this field existed carry seed 0 and must keep
        rendering exactly as their student sat them."""
        attempt = QuizAttempt.objects.create(
            student=self.student,
            quiz=self.quiz,
            attempt_number=1,
            question_seed=NO_SHUFFLE_SEED,
        )

        self.assertEqual(
            [question.id for question in get_attempt_question_set(attempt)],
            list(
                Question.objects.filter(quiz=self.quiz, attempt__isnull=True)
                .order_by("order")
                .values_list("id", flat=True)
            ),
        )

    def test_review_replays_the_order_the_student_sat(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        served = [question.id for question in get_attempt_question_set(attempt)]
        submit_quiz_attempt(attempt, [])

        detail = get_quiz_attempt_detail(QuizAttempt.objects.get(pk=attempt.pk))

        self.assertEqual([question["id"] for question in detail["questions"]], served)

    def test_review_replays_the_choice_order_the_student_saw(self):
        attempt, _ = start_quiz_attempt(self.student, self.quiz)
        served = {
            question.id: [choice.id for choice in question.attempt_choices]
            for question in get_attempt_question_set(attempt)
        }
        submit_quiz_attempt(attempt, [])

        detail = get_quiz_attempt_detail(QuizAttempt.objects.get(pk=attempt.pk))

        self.assertEqual(
            {
                question["id"]: [choice["id"] for choice in question["choices"]]
                for question in detail["questions"]
            },
            served,
        )


def _make_student(username):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.STUDENT,
    )


class StartAttemptRandomizationApiTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module = Module.objects.create(course=self.course, title="Basics", order=1)
        self.quiz = _make_quiz(self.course, module=self.module)
        self.student = _make_student("apirandomstudent")
        Enrollment.objects.create(student=self.student, course=self.course)
        self.client.force_authenticate(user=self.student)
        self.url = reverse("quiz-attempt-start", kwargs={"quiz_id": self.quiz.id})

    def test_resuming_an_attempt_serves_the_same_paper(self):
        """The student refreshed mid-quiz. Same questions, same positions, same
        choice order — or the answers they have already given now sit against
        different questions on screen."""
        started = self.client.post(self.url)
        self.assertEqual(started.status_code, status.HTTP_201_CREATED)

        resumed = self.client.post(self.url)
        self.assertEqual(resumed.status_code, status.HTTP_200_OK)
        self.assertTrue(resumed.data["data"]["resumed"])

        self.assertEqual(
            _paper(started.data["data"]["questions"]),
            _paper(resumed.data["data"]["questions"]),
        )

    def test_the_payload_order_field_is_the_position_on_this_paper(self):
        response = self.client.post(self.url)
        questions = response.data["data"]["questions"]

        self.assertEqual(
            [question["order"] for question in questions], list(range(1, len(questions) + 1))
        )
        # ...and is genuinely not the authored Question.order, which is what a
        # client sorting by `order` would otherwise use to undo the shuffle.
        authored = dict(
            Question.objects.filter(quiz=self.quiz, attempt__isnull=True).values_list(
                "id", "order"
            )
        )
        self.assertNotEqual(
            [question["order"] for question in questions],
            [authored[question["id"]] for question in questions],
        )

    def test_a_student_is_not_told_which_choice_is_correct(self):
        response = self.client.post(self.url)

        for question in response.data["data"]["questions"]:
            for choice in question["choices"]:
                self.assertEqual(set(choice), {"id", "text"})


def _paper(questions):
    return [
        (question["id"], [choice["id"] for choice in question["choices"]])
        for question in questions
    ]
