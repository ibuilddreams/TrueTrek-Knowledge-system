from django.utils import timezone

from .models import Choice, Question, QuizAnswer, QuizAttempt, QuizResult

MAX_ATTEMPTS_PER_QUIZ = 3


def get_attempts_used(student, quiz):
    return QuizAttempt.objects.filter(student=student, quiz=quiz).count()


def start_quiz_attempt(student, quiz):
    attempts_used = get_attempts_used(student, quiz)
    if attempts_used >= MAX_ATTEMPTS_PER_QUIZ:
        return None

    return QuizAttempt.objects.create(
        student=student, quiz=quiz, attempt_number=attempts_used + 1
    )


class InvalidAnswerError(Exception):
    pass


def submit_quiz_attempt(attempt, answers_data):
    scored_questions = 0
    correct_answers = 0

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

        QuizAnswer.objects.create(
            attempt=attempt,
            question=question,
            selected_choice=selected_choice,
            text_answer=entry.get("text_answer", ""),
        )

        if question.question_type in (
            Question.QuestionType.MCQ,
            Question.QuestionType.TRUE_FALSE,
        ):
            scored_questions += 1
            if selected_choice is not None and selected_choice.is_correct:
                correct_answers += 1

    attempt.ended_at = timezone.now()
    attempt.save(update_fields=["ended_at"])

    percentage = (correct_answers / scored_questions * 100) if scored_questions else 0
    is_passed = percentage >= attempt.quiz.passing_score

    return QuizResult.objects.create(
        attempt=attempt,
        score=correct_answers,
        percentage=percentage,
        is_passed=is_passed,
    )
