from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from common.models import Status
from courses.models import Category, Course
from modules.models import Module
from quizzes.models import Quiz, QuizAttempt, QuizResult

from ..services import get_module_lock_map, get_module_lock_info, is_module_locked

UserModel = get_user_model()


def _make_student(username):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.STUDENT,
        gender=UserModel.Gender.MALE,
    )


def _record_attempt(student, quiz, is_passed, attempt_number):
    attempt = QuizAttempt.objects.create(
        quiz=quiz,
        student=student,
        attempt_number=attempt_number,
        status=QuizAttempt.AttemptStatus.GRADED,
        ended_at=timezone.now(),
    )
    QuizResult.objects.create(
        attempt=attempt,
        score=Decimal("0") if not is_passed else Decimal("100"),
        percentage=Decimal("0.00") if not is_passed else Decimal("100.00"),
        is_passed=is_passed,
    )
    return attempt


class ModuleLockMapTests(TestCase):
    """Task 18 (Phase 5) — failing a module-linked quiz twice with no later
    pass locks every module ordered after it, but never the blocking module
    itself."""

    def setUp(self):
        self.category = Category.objects.create(name="Programming")
        self.course = Course.objects.create(title="Intro to Python", category=self.category)
        self.module_1 = Module.objects.create(course=self.course, title="Module 1", order=1)
        self.module_2 = Module.objects.create(course=self.course, title="Module 2", order=2)
        self.module_3 = Module.objects.create(course=self.course, title="Module 3", order=3)
        self.quiz = Quiz.objects.create(
            course=self.course,
            module=self.module_1,
            title="Quiz 1",
            passing_score=40,
            status=Status.PUBLISHED,
        )
        self.student = _make_student("lockstudent")

    def test_no_lock_with_no_attempts(self):
        self.assertEqual(get_module_lock_map(self.student, self.course), {})
        self.assertFalse(is_module_locked(self.student, self.module_2))

    def test_no_lock_after_a_single_failure(self):
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=1)

        self.assertEqual(get_module_lock_map(self.student, self.course), {})

    def test_locks_later_modules_after_two_failures(self):
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=1)
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=2)

        lock_map = get_module_lock_map(self.student, self.course)

        self.assertNotIn(self.module_1.id, lock_map, "the blocking module itself must stay unlocked")
        self.assertIn(self.module_2.id, lock_map)
        self.assertIn(self.module_3.id, lock_map)

        lock_info = get_module_lock_info(self.student, self.module_2)
        self.assertEqual(lock_info["blocking_module_id"], self.module_1.id)
        self.assertEqual(lock_info["blocking_quiz_id"], self.quiz.id)
        self.assertEqual(lock_info["attempts_used"], 2)

    def test_lock_clears_once_the_quiz_is_later_passed(self):
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=1)
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=2)
        self.assertTrue(is_module_locked(self.student, self.module_2))

        _record_attempt(self.student, self.quiz, is_passed=True, attempt_number=3)

        self.assertEqual(get_module_lock_map(self.student, self.course), {})
        self.assertFalse(is_module_locked(self.student, self.module_2))

    def test_draft_quiz_does_not_lock_anything(self):
        self.quiz.status = Status.DRAFT
        self.quiz.save(update_fields=["status"])
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=1)
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=2)

        self.assertEqual(get_module_lock_map(self.student, self.course), {})

    def test_course_level_quiz_does_not_lock_any_module(self):
        course_quiz = Quiz.objects.create(
            course=self.course,
            module=None,
            title="Final Exam",
            passing_score=40,
            status=Status.PUBLISHED,
        )
        _record_attempt(self.student, course_quiz, is_passed=False, attempt_number=1)
        _record_attempt(self.student, course_quiz, is_passed=False, attempt_number=2)

        self.assertEqual(get_module_lock_map(self.student, self.course), {})

    def test_earliest_blocker_wins_when_multiple_modules_are_failed(self):
        quiz_2 = Quiz.objects.create(
            course=self.course,
            module=self.module_2,
            title="Quiz 2",
            passing_score=40,
            status=Status.PUBLISHED,
        )
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=1)
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=2)
        _record_attempt(self.student, quiz_2, is_passed=False, attempt_number=1)
        _record_attempt(self.student, quiz_2, is_passed=False, attempt_number=2)

        lock_map = get_module_lock_map(self.student, self.course)

        self.assertNotIn(self.module_1.id, lock_map)
        self.assertIn(self.module_2.id, lock_map)
        self.assertEqual(lock_map[self.module_2.id]["blocking_module_id"], self.module_1.id)
        self.assertIn(self.module_3.id, lock_map)
        self.assertEqual(lock_map[self.module_3.id]["blocking_module_id"], self.module_1.id)

    def test_different_students_are_locked_independently(self):
        other_student = _make_student("otherlockstudent")
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=1)
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=2)

        self.assertTrue(is_module_locked(self.student, self.module_2))
        self.assertFalse(is_module_locked(other_student, self.module_2))

    def test_lock_persists_across_further_failed_attempts_until_a_pass(self):
        """Attempts are unlimited — there's no "exhausted" state to grant
        extra attempts against anymore. A module stays locked no matter how
        many more times the student fails the blocking quiz; only an actual
        pass clears it (see test_lock_clears_once_the_quiz_is_later_passed)."""
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=1)
        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=2)

        lock_info = get_module_lock_info(self.student, self.module_2)
        self.assertEqual(lock_info["blocking_quiz_id"], self.quiz.id)
        self.assertEqual(lock_info["attempts_used"], 2)

        _record_attempt(self.student, self.quiz, is_passed=False, attempt_number=3)

        still_locked_info = get_module_lock_info(self.student, self.module_2)
        self.assertEqual(still_locked_info["attempts_used"], 3)
        self.assertTrue(is_module_locked(self.student, self.module_2))
