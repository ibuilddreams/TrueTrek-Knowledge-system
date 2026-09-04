from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from assignments.models import AssignmentSubmission
from common.models import Status
from enrollments.models import Enrollment

from .models import Choice, Question, Quiz, QuizAnswer, QuizAttempt, QuizResult

# Grace window after a timed quiz's deadline before an untouched IN_PROGRESS attempt is
# auto-finalized as EXPIRED — covers the last autosave/submit round-trip landing late.
ATTEMPT_EXPIRY_GRACE_MINUTES = 3
# For quizzes with no time limit, an IN_PROGRESS attempt with no activity for this long
# is treated as ABANDONED rather than left "in progress" forever.
ATTEMPT_ABANDON_AFTER_HOURS = 24


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


class QuestionReorderError(Exception):
    pass


def get_student_quizzes(student):
    course_ids = list(
        Enrollment.objects.filter(student=student).values_list("course_id", flat=True)
    )
    quizzes = list(
        Quiz.objects.filter(course_id__in=course_ids, status=Status.PUBLISHED)
        .select_related("course", "module")
        .order_by("order", "title")
    )
    quiz_ids = [quiz.id for quiz in quizzes]
    quiz_by_id = {quiz.id: quiz for quiz in quizzes}
    attempts = list(
        QuizAttempt.objects.filter(student=student, quiz_id__in=quiz_ids)
        .select_related("result")
        .order_by("-started_at")
    )
    for attempt in attempts:
        attempt.quiz = quiz_by_id[attempt.quiz_id]
    finalize_stale_attempts(attempts)

    latest_attempt_map = {}
    attempt_count_map = {}
    for attempt in attempts:
        attempt_count_map[attempt.quiz_id] = attempt_count_map.get(attempt.quiz_id, 0) + 1
        if attempt.quiz_id not in latest_attempt_map:
            latest_attempt_map[attempt.quiz_id] = attempt

    now = timezone.now()
    results = []
    for quiz in quizzes:
        latest = latest_attempt_map.get(quiz.id)
        result = getattr(latest, "result", None) if latest else None
        available = True
        if quiz.available_from and now < quiz.available_from:
            available = False
        if quiz.available_until and now > quiz.available_until:
            available = False

        results.append(
            {
                "id": quiz.id,
                "title": quiz.title,
                "description": quiz.description,
                "passing_score": quiz.passing_score,
                "time_limit_minutes": quiz.time_limit_minutes,
                "attempts_allowed": quiz.attempts_allowed,
                "attempts_used": attempt_count_map.get(quiz.id, 0),
                "short_answer_grading_mode": quiz.short_answer_grading_mode,
                "available_from": quiz.available_from,
                "available_until": quiz.available_until,
                "is_available": available,
                "course": {
                    "id": quiz.course_id,
                    "title": quiz.course.title if quiz.course_id else None,
                },
                "module": {
                    "id": quiz.module_id,
                    "title": quiz.module.title if quiz.module_id else None,
                }
                if quiz.module_id
                else None,
                "latest_attempt": {
                    "id": latest.id,
                    "status": latest.status,
                    "attempt_number": latest.attempt_number,
                    "percentage": float(result.percentage) if result else None,
                    "is_passed": result.is_passed if result else None,
                    "score": float(result.score) if result else None,
                }
                if latest
                else None,
            }
        )
    return results


def get_student_quiz_attempts(student):
    course_ids = list(
        Enrollment.objects.filter(student=student).values_list("course_id", flat=True)
    )
    attempts = list(
        QuizAttempt.objects.filter(student=student, quiz__course_id__in=course_ids)
        .select_related("quiz__course", "quiz__module", "result")
        .prefetch_related("quiz__questions")
        .order_by("-started_at")
    )
    finalize_stale_attempts(attempts)

    results = []
    for attempt in attempts:
        quiz = attempt.quiz
        result = getattr(attempt, "result", None)
        time_taken_seconds = (
            int((attempt.ended_at - attempt.started_at).total_seconds())
            if attempt.ended_at
            else None
        )
        results.append(
            {
                "attempt_id": attempt.id,
                "quiz": {
                    "id": quiz.id,
                    "title": quiz.title,
                    "passing_score": quiz.passing_score,
                },
                "course": {
                    "id": quiz.course_id,
                    "title": quiz.course.title if quiz.course_id else None,
                },
                "module": {
                    "id": quiz.module_id,
                    "title": quiz.module.title if quiz.module_id else None,
                }
                if quiz.module_id
                else None,
                "attempt_number": attempt.attempt_number,
                "attempts_allowed": quiz.attempts_allowed,
                "status": attempt.status,
                "started_at": attempt.started_at,
                "ended_at": attempt.ended_at,
                "time_taken_seconds": time_taken_seconds,
                "score": float(result.score) if result else None,
                "total_marks": _quiz_total_marks(quiz),
                "percentage": float(result.percentage) if result else None,
                "is_passed": result.is_passed if result else None,
            }
        )
    return results


def get_quiz_attempt_detail(attempt):
    questions = attempt.quiz.questions.prefetch_related("choices").order_by("order")
    answers_map = {
        answer.question_id: answer
        for answer in attempt.answers.select_related("selected_choice", "question")
    }

    questions_data = []
    for question in questions:
        answer = answers_map.get(question.id)
        choices_data = [
            {
                "id": choice.id,
                "text": choice.text,
                "is_correct": choice.is_correct,
                "is_selected": bool(answer and answer.selected_choice_id == choice.id),
            }
            for choice in question.choices.all()
        ]
        questions_data.append(
            {
                "id": question.id,
                "text": question.text,
                "question_type": question.question_type,
                "marks": question.marks,
                "choices": choices_data,
                "text_answer": answer.text_answer if answer else "",
                "marks_awarded": (
                    float(answer.marks_awarded)
                    if answer and answer.marks_awarded is not None
                    else None
                ),
                "grading_status": answer.grading_status if answer else None,
                "feedback": answer.feedback if answer else "",
                "answer_id": answer.id if answer else None,
            }
        )

    result = getattr(attempt, "result", None)
    return {
        "attempt_id": attempt.id,
        "attempt_number": attempt.attempt_number,
        "status": attempt.status,
        "student": {
            "id": attempt.student_id,
            "name": attempt.student.name,
            "email": attempt.student.email,
        },
        "quiz": {
            "id": attempt.quiz_id,
            "title": attempt.quiz.title,
            "passing_score": attempt.quiz.passing_score,
            "short_answer_grading_mode": attempt.quiz.short_answer_grading_mode,
        },
        "started_at": attempt.started_at,
        "ended_at": attempt.ended_at,
        "time_taken_seconds": (
            int((attempt.ended_at - attempt.started_at).total_seconds())
            if attempt.ended_at
            else None
        ),
        "score": float(result.score) if result else None,
        "total_marks": _quiz_total_marks(attempt.quiz),
        "percentage": float(result.percentage) if result else None,
        "is_passed": result.is_passed if result else None,
        "questions": questions_data,
    }


def get_student_grades(student):
    quiz_results = list(
        QuizResult.objects.filter(attempt__student=student)
        .select_related("attempt__quiz__course", "attempt__quiz__module")
        .order_by("-attempt__ended_at", "-attempt__started_at")
    )
    graded_assignments = list(
        AssignmentSubmission.objects.filter(
            student=student,
            status=AssignmentSubmission.SubmissionStatus.GRADED,
            marks__isnull=False,
        )
        .select_related("assignment__course", "assignment__module")
        .order_by("-graded_at")
    )

    quiz_entries = [
        {
            "id": f"quiz-{result.id}",
            "type": "QUIZ",
            "title": result.attempt.quiz.title,
            "course": {
                "id": result.attempt.quiz.course_id,
                "title": result.attempt.quiz.course.title,
            },
            "module": {
                "id": result.attempt.quiz.module_id,
                "title": result.attempt.quiz.module.title,
            }
            if result.attempt.quiz.module_id
            else None,
            "score": float(result.score),
            "percentage": float(result.percentage),
            "is_passed": result.is_passed,
            "total_marks": None,
            "graded_at": result.attempt.ended_at or result.attempt.started_at,
        }
        for result in quiz_results
    ]

    assignment_entries = [
        {
            "id": f"assignment-{submission.id}",
            "type": "ASSIGNMENT",
            "title": submission.assignment.title,
            "course": {
                "id": submission.assignment.course_id,
                "title": submission.assignment.course.title,
            },
            "module": {
                "id": submission.assignment.module_id,
                "title": submission.assignment.module.title,
            }
            if submission.assignment.module_id
            else None,
            "score": submission.marks,
            "percentage": round(
                (submission.marks / submission.assignment.total_marks) * 100, 2
            )
            if submission.assignment.total_marks
            else 0,
            "is_passed": None,
            "total_marks": submission.assignment.total_marks,
            "graded_at": submission.graded_at,
        }
        for submission in graded_assignments
    ]

    entries = quiz_entries + assignment_entries
    entries.sort(key=lambda item: item["graded_at"] or timezone.now(), reverse=True)

    quiz_avg = quiz_results and (
        sum(float(r.percentage) for r in quiz_results) / len(quiz_results)
    ) or 0
    assignment_avg = assignment_entries and (
        sum(item["percentage"] for item in assignment_entries) / len(assignment_entries)
    ) or 0
    all_percentages = [float(r.percentage) for r in quiz_results] + [
        item["percentage"] for item in assignment_entries
    ]
    overall_avg = sum(all_percentages) / len(all_percentages) if all_percentages else 0

    return {
        "summary": {
            "overall_average": round(overall_avg, 2),
            "quiz_average": round(quiz_avg, 2),
            "assignment_average": round(assignment_avg, 2),
            "total_graded": len(entries),
        },
        "entries": entries,
    }


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


def _stale_attempt_new_status(attempt, now):
    """Return the terminal status an IN_PROGRESS attempt should move to if it has run out
    its time budget (timed quiz) or gone quiet for too long (untimed quiz), else None."""
    if attempt.status != QuizAttempt.AttemptStatus.IN_PROGRESS:
        return None

    quiz = attempt.quiz
    if quiz.time_limit_minutes:
        deadline = attempt.started_at + timedelta(
            minutes=quiz.time_limit_minutes + ATTEMPT_EXPIRY_GRACE_MINUTES
        )
        return QuizAttempt.AttemptStatus.EXPIRED if now > deadline else None

    deadline = attempt.last_activity_at + timedelta(hours=ATTEMPT_ABANDON_AFTER_HOURS)
    return QuizAttempt.AttemptStatus.ABANDONED if now > deadline else None


def auto_finalize_attempt(attempt, new_status):
    """Close out an attempt the student never submitted: fill in a QuizAnswer row for
    every question (auto-grading blanks as 0, same as a real submission would), then
    freeze the attempt at `new_status` instead of the SUBMITTED/GRADED that
    `_recompute_quiz_result` would otherwise assign."""
    attempt.status = new_status
    attempt.ended_at = attempt.ended_at or timezone.now()
    attempt.save(update_fields=["status", "ended_at"])

    _fill_missing_answers(attempt)
    result = _recompute_quiz_result(attempt)
    # `attempt.result` may already be cached as "does not exist" (e.g. via an earlier
    # select_related("result")) — refresh the cache so callers reading it right after
    # finalizing see the result we just created instead of a stale None.
    attempt.result = result


def finalize_stale_attempts(attempts):
    """Lazily transition any stale IN_PROGRESS attempts to EXPIRED/ABANDONED. Call this
    before serializing attempts for any read path (progress dashboards, attempt history,
    detail views) so status is never stuck at IN_PROGRESS after the student is gone.
    `attempts` must have `.quiz` already loaded (select_related) to avoid N+1 queries."""
    now = timezone.now()
    finalized = []
    for attempt in attempts:
        new_status = _stale_attempt_new_status(attempt, now)
        if new_status:
            auto_finalize_attempt(attempt, new_status)
            finalized.append(attempt)
    return finalized


def get_attempt_seconds_remaining(attempt):
    quiz = attempt.quiz
    if not quiz.time_limit_minutes:
        return None
    deadline = attempt.started_at + timedelta(minutes=quiz.time_limit_minutes)
    return max(0, int((deadline - timezone.now()).total_seconds()))


def get_attempt_saved_answers(attempt):
    return [
        {
            "question": answer.question_id,
            "selected_choice": answer.selected_choice_id,
            "text_answer": answer.text_answer,
        }
        for answer in attempt.answers.all()
    ]


def start_quiz_attempt(student, quiz):
    if quiz.status != Status.PUBLISHED:
        raise QuizAttemptError("This quiz is not currently published.")

    now = timezone.now()
    if quiz.available_from and now < quiz.available_from:
        raise QuizAttemptError("This quiz is not yet available.")
    if quiz.available_until and now > quiz.available_until:
        raise QuizAttemptError("This quiz is no longer available.")

    existing_attempts = list(QuizAttempt.objects.filter(student=student, quiz=quiz))
    for attempt in existing_attempts:
        attempt.quiz = quiz
    finalize_stale_attempts(existing_attempts)

    in_progress = next(
        (a for a in existing_attempts if a.status == QuizAttempt.AttemptStatus.IN_PROGRESS),
        None,
    )
    if in_progress is not None:
        return in_progress, False

    attempts_used = len(existing_attempts)
    if attempts_used >= quiz.attempts_allowed:
        raise QuizAttemptError(
            f"You have used all {quiz.attempts_allowed} allowed attempts for this quiz."
        )

    attempt = QuizAttempt.objects.create(
        student=student, quiz=quiz, attempt_number=attempts_used + 1
    )
    return attempt, True


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
    # EXPIRED/ABANDONED is a terminal label describing how the attempt ended — grading an
    # individual pending answer afterwards should still update the score, but must not
    # resurrect the attempt into a normal SUBMITTED/GRADED state.
    if attempt.status not in (
        QuizAttempt.AttemptStatus.EXPIRED,
        QuizAttempt.AttemptStatus.ABANDONED,
    ):
        attempt.status = (
            QuizAttempt.AttemptStatus.SUBMITTED
            if has_pending
            else QuizAttempt.AttemptStatus.GRADED
        )
        attempt.save(update_fields=["status"])

    return result


def _resolve_answer_entry(entry):
    try:
        question = Question.objects.get(pk=entry["question"], quiz=entry["quiz"])
    except Question.DoesNotExist:
        raise InvalidAnswerError("One of the questions does not belong to this quiz.")

    selected_choice = None
    choice_id = entry.get("selected_choice")
    if choice_id is not None:
        try:
            selected_choice = Choice.objects.get(pk=choice_id, question=question)
        except Choice.DoesNotExist:
            raise InvalidAnswerError("One of the selected choices does not belong to its question.")

    return question, selected_choice, entry.get("text_answer", "")


def autosave_quiz_attempt(attempt, answers_data):
    """Persist in-progress answers without grading or ending the attempt, so a refreshed
    page, a dropped connection, or a lazily-detected expiry can all recover the student's
    actual work instead of losing it."""
    for entry in answers_data:
        question, selected_choice, text_answer = _resolve_answer_entry(
            {**entry, "quiz": attempt.quiz}
        )
        QuizAnswer.objects.update_or_create(
            attempt=attempt,
            question=question,
            defaults={"selected_choice": selected_choice, "text_answer": text_answer},
        )

    attempt.last_activity_at = timezone.now()
    attempt.save(update_fields=["last_activity_at"])


def _grade_answer_fields(question, selected_choice, text_answer):
    if question.question_type == Question.QuestionType.SHORT_ANSWER:
        if text_answer.strip():
            return None, QuizAnswer.GradingStatus.PENDING_GRADING
        return 0, QuizAnswer.GradingStatus.AUTO_GRADED

    marks_awarded = question.marks if (selected_choice and selected_choice.is_correct) else 0
    return marks_awarded, QuizAnswer.GradingStatus.AUTO_GRADED


def _fill_missing_answers(attempt):
    """Ensure every question in the quiz has a graded QuizAnswer row, even ones the
    student never touched (abandoned attempt, or omitted from a submit payload). Without
    this, unanswered questions have no answer_id at all, which breaks the grading UI."""
    answered_question_ids = set(attempt.answers.values_list("question_id", flat=True))
    for question in attempt.quiz.questions.all():
        if question.id in answered_question_ids:
            continue
        marks_awarded, grading_status = _grade_answer_fields(question, None, "")
        QuizAnswer.objects.create(
            attempt=attempt,
            question=question,
            marks_awarded=marks_awarded,
            grading_status=grading_status,
        )


def submit_quiz_attempt(attempt, answers_data):
    provided = {}
    for entry in answers_data:
        question, selected_choice, text_answer = _resolve_answer_entry(
            {**entry, "quiz": attempt.quiz}
        )
        provided[question.id] = (question, selected_choice, text_answer)

    autosaved = {answer.question_id: answer for answer in attempt.answers.all()}

    for question in attempt.quiz.questions.all():
        if question.id in provided:
            _, selected_choice, text_answer = provided[question.id]
        elif question.id in autosaved:
            existing = autosaved[question.id]
            selected_choice, text_answer = existing.selected_choice, existing.text_answer
        else:
            selected_choice, text_answer = None, ""

        marks_awarded, grading_status = _grade_answer_fields(question, selected_choice, text_answer)
        QuizAnswer.objects.update_or_create(
            attempt=attempt,
            question=question,
            defaults={
                "selected_choice": selected_choice,
                "text_answer": text_answer,
                "marks_awarded": marks_awarded,
                "grading_status": grading_status,
            },
        )

    attempt.ended_at = timezone.now()
    attempt.save(update_fields=["ended_at"])

    return _recompute_quiz_result(attempt)


def get_pending_grading_answers(quiz, teacher=None):
    answers = (
        QuizAnswer.objects.filter(
            question__quiz=quiz, grading_status=QuizAnswer.GradingStatus.PENDING_GRADING
        )
        .select_related("attempt", "attempt__student", "question")
        .order_by("attempt", "question__order")
    )
    if teacher is not None:
        visible_student_ids = Enrollment.objects.filter(
            course=quiz.course, teacher=teacher, status=Enrollment.EnrollmentStatus.ACTIVE
        ).values_list("student_id", flat=True)
        answers = answers.filter(attempt__student_id__in=visible_student_ids)
    return answers


def grade_quiz_answer(answer, marks_awarded, feedback="", grading_status=QuizAnswer.GradingStatus.MANUALLY_GRADED):
    if marks_awarded < 0 or marks_awarded > answer.question.marks:
        raise QuizGradingError(
            f"Marks awarded must be between 0 and {answer.question.marks}."
        )

    answer.marks_awarded = marks_awarded
    answer.feedback = feedback
    answer.grading_status = grading_status
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


def reorder_questions(quiz_id, questions_data):
    question_ids = [entry["question_id"] for entry in questions_data]

    if len(question_ids) != len(set(question_ids)):
        raise QuestionReorderError("Duplicate question ids are not allowed.")

    orders = [entry["order"] for entry in questions_data]
    if len(orders) != len(set(orders)):
        raise QuestionReorderError("Duplicate order values are not allowed.")

    existing_ids = set(Question.objects.filter(quiz_id=quiz_id).values_list("id", flat=True))
    if set(question_ids) != existing_ids:
        raise QuestionReorderError(
            "Submitted question ids must exactly match the questions belonging to this quiz."
        )

    # Question.order has no DB uniqueness constraint (unlike Quiz/Assignment order), so
    # final values can be written directly in one pass without a temp-offset staging step.
    with transaction.atomic():
        for entry in questions_data:
            Question.objects.filter(pk=entry["question_id"], quiz_id=quiz_id).update(
                order=entry["order"]
            )

    return (
        Question.objects.filter(quiz_id=quiz_id).prefetch_related("choices").order_by("order")
    )
