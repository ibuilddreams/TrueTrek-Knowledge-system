"""AI-regenerated question sets for quiz retries.

A student's first attempt on a quiz always gets the quiz's original,
authored (or AI-course-generated) template questions — see
`Question.attempt` on the model and `services.get_attempt_questions`. Every
attempt after that generates a brand-new set of `quiz.number_of_questions`
questions via AI instead of repeating the same bank, scoped to the course's
modules/lessons so the new questions stay relevant to what the student is
actually being taught.

Same synchronous, single-call pattern as `quizzes/ai_grading.py` and
`daily_drill/ai_generation.py` — this is a small, fast structured-JSON call,
not a whole-course job, so it runs inline in the request rather than through
the backgrounded/polled `ai_courses` job pipeline. Reuses
`ai_courses.providers.get_provider()` (no second AI client) and
`quizzes.question_repair` for the base text/choice repair rules shared with
`ai_courses`' full-course generation. On top of that, retries are
deliberately narrower than manual/AI-course authoring: MCQ-only, exactly 4
choices per question (see `_enforce_mcq_four_choices`) — a retry has no
teacher in the loop to fall back on for TRUE_FALSE/SHORT_ANSWER edge cases.
"""

import json
import logging
import time

from django.conf import settings

from ai_courses.providers import get_provider
from ai_courses.providers.base import ProviderError, ProviderTransportError
from lessons.models import Lesson
from modules.models import Module

from .models import Choice, Question
from .question_repair import repair_question

logger = logging.getLogger("quizzes.ai_generation")

PROMPT_VERSION = "v2"

# AI-regenerated retries are deliberately MCQ-only, four choices each — unlike manual/AI
# course authoring, which supports TRUE_FALSE and SHORT_ANSWER too. A retry has to be
# gradable and comparable to the original attempt with zero teacher involvement (no
# manual-grading queue to fall back to), so the schema itself only allows "MCQ" and this
# module enforces exactly 4 choices below rather than trusting the model's choice count.
RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "questions": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "text": {"type": "STRING"},
                    "question_type": {
                        "type": "STRING",
                        "enum": ["MCQ"],
                    },
                    "marks": {"type": "INTEGER"},
                    "choices": {
                        "type": "ARRAY",
                        "minItems": 4,
                        "maxItems": 4,
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "text": {"type": "STRING"},
                                "is_correct": {"type": "BOOLEAN"},
                            },
                            "required": ["text", "is_correct"],
                        },
                    },
                },
                "required": ["text", "question_type", "marks", "choices"],
            },
        },
    },
    "required": ["questions"],
}

# Same "don't retry a slow failure" heuristic as daily_drill/ai_generation.py
# (not ai_grading.py's "always retry once" — see the comment on
# AI_QUIZ_REGENERATION_TIMEOUT_SECONDS in settings.py for why).
SLOW_FAILURE_THRESHOLD_SECONDS = settings.AI_QUIZ_REGENERATION_TIMEOUT_SECONDS * 0.75
TRANSPORT_RETRY_BACKOFF_SECONDS = 1

MAX_LESSON_CONTENT_CHARS = 1500
MAX_CONTEXT_LESSONS = 30


class QuizRegenerationError(Exception):
    """Raised when a fresh question set could not be generated — provider
    failure, bad/empty response, or nothing survived repair. Callers must not
    create a QuizAttempt or persist any questions in this case."""


def _enforce_mcq_four_choices(questions, warnings):
    """`repair_question` (shared with ai_courses' full-course generation) only
    enforces ">=2 choices, exactly one correct" for MCQ — it has no opinion on
    exact choice count, and still allows TRUE_FALSE/SHORT_ANSWER through,
    since those types are legitimate for manually-authored and AI-course
    quizzes. Retries are MCQ-only with exactly 4 choices (schema + prompt
    already ask for this — this is the "never trust the raw output" backstop,
    same principle as every other repair step): anything not MCQ, or with
    fewer than 1 correct + 3 incorrect choices to draw from, is dropped
    rather than padded with invented distractors."""
    normalized = []
    for order, question in enumerate(questions, start=1):
        if question["question_type"] != Question.QuestionType.MCQ:
            warnings.append(
                f"Question '{question['text'][:50]}' was not MCQ — dropped (retries are MCQ-only)."
            )
            continue

        correct = [choice for choice in question["choices"] if choice["is_correct"]]
        incorrect = [choice for choice in question["choices"] if not choice["is_correct"]]
        if not correct or len(incorrect) < 3:
            warnings.append(
                f"Question '{question['text'][:50]}' didn't have enough choices for "
                "exactly 4 options — dropped."
            )
            continue

        selected = correct[:1] + incorrect[:3]
        rotation = order % len(selected)
        selected = selected[rotation:] + selected[:rotation]
        normalized.append({**question, "choices": selected})

    return normalized


def build_quiz_regeneration_context(quiz):
    """Course/module/lesson content this quiz's retries should stay relevant
    to. Course-level quizzes (module=None) use every module in the course,
    per the requirement that a course-level quiz's retries draw on "the
    modules associated with that course"; a module-linked quiz uses just its
    own module."""

    course = quiz.course
    if quiz.module_id:
        modules = [quiz.module]
    else:
        modules = list(Module.objects.filter(course=course).order_by("order"))

    module_contexts = []
    lessons_used = 0
    for module in modules:
        lessons = []
        for lesson in Lesson.objects.filter(module=module).order_by("order"):
            if lessons_used >= MAX_CONTEXT_LESSONS:
                break
            body = ""
            if lesson.content_type == Lesson.ContentType.TEXT and lesson.content_data:
                body = lesson.content_data[:MAX_LESSON_CONTENT_CHARS]
            lessons.append({"title": lesson.title, "description": lesson.description, "body": body})
            lessons_used += 1
        module_contexts.append(
            {"title": module.title, "description": module.description, "lessons": lessons}
        )
        if lessons_used >= MAX_CONTEXT_LESSONS:
            break

    return {
        "course_title": course.title,
        "course_description": course.description,
        "course_difficulty": course.difficulty,
        "modules": module_contexts,
        "quiz_title": quiz.title,
        "quiz_description": quiz.description,
        "passing_score": quiz.passing_score,
        "time_limit_minutes": quiz.time_limit_minutes,
        "number_of_questions": quiz.number_of_questions,
    }


def build_prompt(context):
    modules_text = "\n\n".join(
        (
            f"Module: {module['title']}\n{module['description']}\n"
            + "\n".join(
                f"- Lesson: {lesson['title']} — {lesson['description']}"
                + (f"\n  {lesson['body']}" if lesson["body"] else "")
                for lesson in module["lessons"]
            )
        )
        for module in context["modules"]
    ) or "(no lesson content available — write questions from the course/quiz description alone)"

    return f"""You are a curriculum assessment writer generating a fresh quiz question set for a
retry attempt on a Life-Education learning management system. The student already
attempted this quiz and did not pass — you must NOT invent identifiers, ordering
numbers, dates, or statuses; those are all supplied by the platform.

Course: {context['course_title']}
Course description: {context['course_description'] or '(none provided)'}
Difficulty level: {context['course_difficulty']}

Course content this quiz covers:
{modules_text}

Quiz: {context['quiz_title']}
Quiz description: {context['quiz_description'] or '(none provided)'}
Passing score: {context['passing_score']}%
Time limit: {context['time_limit_minutes'] or 'none'} minutes

Requirements:
- Produce exactly {context['number_of_questions']} questions, testing the same material
  covered above.
- This must be a materially different set of questions from a typical first pass on
  this material — vary the wording, the specific facts/scenarios tested, and the
  choice ordering. Do not simply reword a small, predictable set of questions.
- Every question must be multiple-choice (MCQ) — do not generate True/False or
  Short Answer questions. Every question must have EXACTLY 4 answer choices, with
  exactly one choice marked is_correct: true and the other three plausible but
  incorrect.
- Each question's "marks" should be a positive integer (1 unless the material clearly
  warrants more).

Respond with JSON matching the provided response schema exactly. Do not include any
text outside the JSON object."""


def _call_provider(prompt):
    provider = get_provider(model=settings.AI_CHAT_MODEL)
    timeout = settings.AI_QUIZ_REGENERATION_TIMEOUT_SECONDS

    start = time.monotonic()
    try:
        return provider.generate_course(prompt, RESPONSE_SCHEMA, timeout)
    except ProviderTransportError as exc:
        elapsed = time.monotonic() - start
        if elapsed >= SLOW_FAILURE_THRESHOLD_SECONDS:
            logger.warning("Quiz regeneration timed out after %.1fs — not retrying.", elapsed)
            raise
        logger.warning("Quiz regeneration transport error after %.1fs — retrying once.", elapsed)
        time.sleep(TRANSPORT_RETRY_BACKOFF_SECONDS)
        return provider.generate_course(prompt, RESPONSE_SCHEMA, timeout)


def generate_quiz_questions(quiz):
    """Makes one AI call and returns a validated, repaired list of question
    dicts (same shape ai_courses.writer expects: text/question_type/marks/
    choices). No DB writes. Raises QuizRegenerationError on any failure."""

    context = build_quiz_regeneration_context(quiz)
    prompt = build_prompt(context)

    try:
        result = _call_provider(prompt)
    except (ProviderTransportError, ProviderError) as exc:
        raise QuizRegenerationError(f"AI provider call failed: {exc}") from exc

    try:
        data = json.loads(result.text)
    except (TypeError, ValueError) as exc:
        raise QuizRegenerationError(f"AI response was not valid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise QuizRegenerationError("AI response was not a JSON object.")

    raw_questions = data.get("questions")
    if not isinstance(raw_questions, list) or not raw_questions:
        raise QuizRegenerationError("AI response contained no questions.")

    raw_questions = raw_questions[: quiz.number_of_questions]

    warnings = []
    questions = []
    for entry in raw_questions:
        repaired = repair_question(entry, order=len(questions) + 1, warnings=warnings)
        if repaired is not None:
            questions.append(repaired)

    questions = _enforce_mcq_four_choices(questions, warnings)

    for warning in warnings:
        logger.warning("Quiz regeneration repair (quiz %s): %s", quiz.pk, warning)

    if not questions:
        raise QuizRegenerationError("No question in the AI response survived validation.")

    return questions


def persist_attempt_questions(attempt, question_dicts):
    """Bulk-creates Question/Choice rows scoped to this one attempt —
    mirrors ai_courses/writer.py's quiz-writing block, but targets an
    existing Quiz+QuizAttempt rather than writing a whole new Quiz. Must be
    called inside a transaction alongside the QuizAttempt's own creation."""

    for order, question_plan in enumerate(question_dicts, start=1):
        question = Question.objects.create(
            quiz_id=attempt.quiz_id,
            attempt=attempt,
            text=question_plan["text"],
            question_type=question_plan["question_type"],
            marks=question_plan["marks"],
            order=order,
        )
        for choice_plan in question_plan["choices"]:
            Choice.objects.create(
                question=question,
                text=choice_plan["text"],
                is_correct=choice_plan["is_correct"],
            )
