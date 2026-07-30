from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from common.models import Status

from .models import Choice, Question, Quiz, QuizAnswer, QuizAttempt, QuizResult


class QuizPublishError(Exception):
    pass


class QuizAttemptError(Exception):
    pass


class InvalidAnswerError(Exception):
    pass


class QuizGradingError(Exception):
    pass


class QuizReorderError(Exception):
    pass


def publish_quiz(quiz):
    if quiz.status == Status.ARCHIVED:
        raise QuizPublishError("An archived quiz cannot be published.")
    if quiz.status == Status.PUBLISHED:
        return quiz

    questions = list(quiz.questions.prefetch_related("choices"))
    if not questions:
        raise QuizPublishError("A quiz must have at least one question before it can be published.")

    for question in questions:
        if question.question_type == Question.QuestionType.SHORT_ANSWER:
            continue

        choices = list(question.choices.all())
        if question.question_type == Question.QuestionType.TRUE_FALSE and len(choices) != 2:
            raise QuizPublishError(
                f"True/False question '{question.text[:50]}' must have exactly 2 options."
            )
        if not any(choice.is_correct for choice in choices):
            raise QuizPublishError(
                f"Question '{question.text[:50]}' must have a correct option before publishing."
            )

    quiz.status = Status.PUBLISHED
    quiz.save(update_fields=["status"])
    return quiz


def get_attempts_used(student, quiz):
    return QuizAttempt.objects.filter(student=student, quiz=quiz).count()


def start_quiz_attempt(student, quiz):
    if quiz.status != Status.PUBLISHED:
        raise QuizAttemptError("This quiz is not currently published.")

    now = timezone.now()
    if quiz.available_from and now < quiz.available_from:
        raise QuizAttemptError("This quiz is not yet available.")
    if quiz.available_until and now > quiz.available_until:
        raise QuizAttemptError("This quiz is no longer available.")

    attempts_used = get_attempts_used(student, quiz)
    if attempts_used >= quiz.attempts_allowed:
        raise QuizAttemptError(
            f"You have used all {quiz.attempts_allowed} allowed attempts for this quiz."
        )

    return QuizAttempt.objects.create(
        student=student, quiz=quiz, attempt_number=attempts_used + 1
    )


def _quiz_total_marks(quiz):
    total = 0
    for question in quiz.questions.all():
        total += question.marks
    return total


def _recompute_quiz_result(attempt):
    answers = attempt.answers.select_related("question")
    total_marks = _quiz_total_marks(attempt.quiz)
    obtained_marks = sum(
        (answer.marks_awarded for answer in answers if answer.marks_awarded is not None),
        Decimal("0"),
    )

    percentage = (obtained_marks / total_marks * 100) if total_marks else Decimal("0")
    is_passed = percentage >= attempt.quiz.passing_score

    result, _ = QuizResult.objects.update_or_create(
        attempt=attempt,
        defaults={
            "score": obtained_marks,
            "percentage": percentage,
            "is_passed": is_passed,
        },
    )

    has_pending = answers.filter(grading_status=QuizAnswer.GradingStatus.PENDING_GRADING).exists()
    attempt.status = (
        QuizAttempt.AttemptStatus.SUBMITTED if has_pending else QuizAttempt.AttemptStatus.GRADED
    )
    attempt.save(update_fields=["status"])

    return result


def submit_quiz_attempt(attempt, answers_data):
    for entry in answers_data:
        try:
            question = Question.objects.get(pk=entry["question"], quiz=attempt.quiz)
        except Question.DoesNotExist:
            raise InvalidAnswerError("One of the questions does not belong to this quiz.")

        selected_choice = None
        choice_id = entry.get("selected_choice")
        if choice_id is not None:
            try:
                selected_choice = Choice.objects.get(pk=choice_id, question=question)
            except Choice.DoesNotExist:
                raise InvalidAnswerError("One of the selected choices does not belong to its question.")

        if question.question_type == Question.QuestionType.SHORT_ANSWER:
            grading_status = QuizAnswer.GradingStatus.PENDING_GRADING
            marks_awarded = None
        else:
            grading_status = QuizAnswer.GradingStatus.AUTO_GRADED
            marks_awarded = question.marks if (selected_choice and selected_choice.is_correct) else 0

        QuizAnswer.objects.create(
            attempt=attempt,
            question=question,
            selected_choice=selected_choice,
            text_answer=entry.get("text_answer", ""),
            marks_awarded=marks_awarded,
            grading_status=grading_status,
        )

    attempt.ended_at = timezone.now()
    attempt.save(update_fields=["ended_at"])

    return _recompute_quiz_result(attempt)


def get_pending_grading_answers(quiz):
    return (
        QuizAnswer.objects.filter(
            question__quiz=quiz, grading_status=QuizAnswer.GradingStatus.PENDING_GRADING
        )
        .select_related("attempt", "attempt__student", "question")
        .order_by("attempt", "question__order")
    )


def grade_quiz_answer(answer, marks_awarded, feedback=""):
    if marks_awarded < 0 or marks_awarded > answer.question.marks:
        raise QuizGradingError(
            f"Marks awarded must be between 0 and {answer.question.marks}."
        )

    answer.marks_awarded = marks_awarded
    answer.feedback = feedback
    answer.grading_status = QuizAnswer.GradingStatus.MANUALLY_GRADED
    answer.save(update_fields=["marks_awarded", "feedback", "grading_status"])

    return _recompute_quiz_result(answer.attempt)


def reorder_quizzes(module_id, quizzes_data):
    quiz_ids = [entry["quiz_id"] for entry in quizzes_data]

    if len(quiz_ids) != len(set(quiz_ids)):
        raise QuizReorderError("Duplicate quiz ids are not allowed.")

    orders = [entry["order"] for entry in quizzes_data]
    if len(orders) != len(set(orders)):
        raise QuizReorderError("Duplicate order values are not allowed.")

    existing_ids = set(Quiz.objects.filter(module_id=module_id).values_list("id", flat=True))
    if set(quiz_ids) != existing_ids:
        raise QuizReorderError(
            "Submitted quiz ids must exactly match the quizzes belonging to this module."
        )

    # The (module, order) uniqueness is a non-deferrable partial unique index (Postgres
    # forbids combining `condition` with `deferrable` on the same constraint), so writing
    # the final order values directly can collide with another row's current value mid-loop.
    # Stage everything through a temporary, guaranteed-unused range first.
    temp_offset = max(orders) + 1
    with transaction.atomic():
        for index, entry in enumerate(quizzes_data):
            Quiz.objects.filter(pk=entry["quiz_id"], module_id=module_id).update(
                order=temp_offset + index
            )
        for entry in quizzes_data:
            Quiz.objects.filter(pk=entry["quiz_id"], module_id=module_id).update(order=entry["order"])

    return (
        Quiz.objects.select_related("course", "module").filter(module_id=module_id).order_by("order")
    )
