"""AI-regenerated question sets for quiz retries.

A student's first attempt on a quiz always gets the quiz's original,
authored (or AI-course-generated) template questions — see
`Question.attempt` on the model and `services.get_attempt_questions`. Every
attempt after that generates a brand-new set of `quiz.number_of_questions`
questions via AI instead of repeating the same bank, scoped to the course's
modules/lessons so the new questions stay relevant to what the student is
actually being taught.

Synchronous, like `quizzes/ai_grading.py` and `daily_drill/ai_generation.py`
— this is structured JSON on the fast model, not a whole-course job, so it
runs inline in the request rather than through the backgrounded/polled
`ai_courses` job pipeline. Unlike those two it is not always a *single*
call: a quiz may ask for up to `constants.MAX_QUESTIONS_PER_QUIZ` (70)
questions, so the set is asked for in parallel batches of at most
`REGENERATION_BATCH_SIZE` and reassembled here, which keeps the wall clock
that of one call while the question count scales. Reuses
`ai_courses.providers.get_provider()` (no second AI client) and
`quizzes.question_repair` for the base text/choice repair rules shared with
`ai_courses`' full-course generation. On top of that, retries are
deliberately narrower than manual/AI-course authoring: MCQ-only, exactly 4
choices per question (see `_enforce_mcq_four_choices`) — a retry has no
teacher in the loop to fall back on for TRUE_FALSE/SHORT_ANSWER edge cases.
"""

import json
import logging
import re
import time
from concurrent.futures import ThreadPoolExecutor

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

# The most questions asked for in a single provider call. A quiz may ask for up to
# MAX_QUESTIONS_PER_QUIZ (70), and one structured-JSON call for seventy four-option
# questions does not come back inside AI_QUIZ_REGENERATION_TIMEOUT_SECONDS (40s) —
# which is itself held under nginx's 60s proxy_read_timeout, because a student is
# sitting in front of this request waiting to start. So a large set is asked for in
# several smaller calls issued *in parallel*: the wall clock stays that of one call
# while the question count scales. Twenty is the size the single-call path was
# already sized and timed for.
REGENERATION_BATCH_SIZE = 20

# Parallel calls cannot see each other's output, so left identical they would return
# the same obvious questions three times over. Each batch is pointed at a different
# kind of question instead; _dedupe_questions below is the backstop for the overlap
# that remains. Cycled if there are ever more batches than entries.
BATCH_FOCUSES = (
    "definitions, terminology and the core facts of the material",
    "applying the material to concrete, realistic situations a learner would meet",
    "comparing and contrasting ideas, and the misconceptions learners commonly hold",
    "consequences and trade-offs — what follows from a choice, and what goes wrong without it",
)


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


def plan_batches(total):
    """Split a requested question count into the per-call counts that will be
    asked for in parallel — as few calls as possible, each no larger than
    REGENERATION_BATCH_SIZE, and balanced rather than "full, full, remainder"
    (70 becomes 18/18/17/17, not 20/20/20/10). Balanced because the calls run
    concurrently and the slowest one is the whole wait: a lone 20 alongside
    three 10s costs the student the 20."""
    total = max(1, total)
    batch_count = -(-total // REGENERATION_BATCH_SIZE)  # ceil
    base, remainder = divmod(total, batch_count)
    return [base + 1] * remainder + [base] * (batch_count - remainder)


def build_prompt(context, *, batch_size=None, batch_index=0, batch_count=1):
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

    if batch_size is None:
        batch_size = context["number_of_questions"]

    # One call asked for on its own says nothing about batches; the student's paper
    # is the batches combined, so each call is told which share of it it is writing
    # and what to aim at, or the parallel calls all reach for the same obvious
    # questions (see BATCH_FOCUSES).
    batch_block = ""
    if batch_count > 1:
        focus = BATCH_FOCUSES[batch_index % len(BATCH_FOCUSES)]
        batch_block = (
            f"\nYou are writing part {batch_index + 1} of {batch_count} of this quiz. "
            f"Other writers are independently writing the other parts from the same "
            f"material at the same time and cannot see your questions, so stay in your "
            f"lane: your part must test {focus}. Questions outside that emphasis are "
            f"another part's job and will be discarded as duplicates.\n"
        )

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

{batch_block}
Requirements:
- Produce exactly {batch_size} questions, testing the same material covered above.
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


def _normalized_question_text(text):
    return re.sub(r"\s+", " ", text or "").strip().casefold().rstrip("?.!:;, ")


def _dedupe_questions(questions, warnings):
    """Drops questions whose text repeats one already kept, comparing on
    whitespace/case/trailing-punctuation-insensitive text.

    Needed because batches are generated in parallel from the same material
    by calls that cannot see each other (see BATCH_FOCUSES) — the same
    question arriving twice is the expected cost of that, not a provider
    fault. Also catches a single call repeating itself, which a long
    structured-JSON generation does occasionally."""
    seen = set()
    kept = []
    for question in questions:
        fingerprint = _normalized_question_text(question["text"])
        if fingerprint in seen:
            warnings.append(f"Question '{question['text'][:50]}' repeated an earlier one — dropped.")
            continue
        seen.add(fingerprint)
        kept.append(question)
    return kept


def _run_batch(context, batch_size, batch_index, batch_count):
    """One provider call — returns its raw (unrepaired) question entries, or
    raises QuizRegenerationError. Deliberately touches no database: this runs
    on a pool thread when there is more than one batch, and a pool thread
    opening its own connection is a connection nobody closes."""
    prompt = build_prompt(
        context, batch_size=batch_size, batch_index=batch_index, batch_count=batch_count
    )

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

    return raw_questions[:batch_size]


def _collect_raw_questions(context, batch_sizes, quiz_pk):
    """Runs every batch and returns (raw entries, failures). Batches run
    concurrently and their results are read back in submission order, so the
    assembled paper does not depend on which call happened to finish first.

    A batch that fails is a shortfall, not a failure: the student gets the
    questions the other batches wrote rather than being refused the attempt
    altogether. Only every batch failing is fatal, and the caller raises the
    first failure then — which, for a single-batch quiz, is exactly the
    single-call behaviour this replaced."""
    batch_count = len(batch_sizes)

    if batch_count == 1:
        try:
            return _run_batch(context, batch_sizes[0], 0, 1), []
        except QuizRegenerationError as exc:
            return [], [exc]

    collected = []
    failures = []
    with ThreadPoolExecutor(max_workers=batch_count) as pool:
        futures = [
            pool.submit(_run_batch, context, batch_size, index, batch_count)
            for index, batch_size in enumerate(batch_sizes)
        ]
        for index, future in enumerate(futures):
            try:
                collected.extend(future.result())
            except QuizRegenerationError as exc:
                logger.warning(
                    "Quiz regeneration batch %s/%s failed (quiz %s): %s",
                    index + 1,
                    batch_count,
                    quiz_pk,
                    exc,
                )
                failures.append(exc)

    return collected, failures


def generate_quiz_questions(quiz):
    """Returns a validated, repaired list of question dicts (same shape
    ai_courses.writer expects: text/question_type/marks/choices) for one
    retry attempt. No DB writes. Raises QuizRegenerationError if nothing
    usable came back at all.

    Asks for the set in one provider call per REGENERATION_BATCH_SIZE
    questions, run in parallel — see that constant for why a 70-question quiz
    cannot be a single call."""

    context = build_quiz_regeneration_context(quiz)
    requested = max(1, quiz.number_of_questions)
    batch_sizes = plan_batches(requested)

    raw_questions, failures = _collect_raw_questions(context, batch_sizes, quiz.pk)
    if not raw_questions:
        raise failures[0] if failures else QuizRegenerationError(
            "AI response contained no questions."
        )

    warnings = []
    questions = []
    for entry in raw_questions:
        repaired = repair_question(entry, order=len(questions) + 1, warnings=warnings)
        if repaired is not None:
            questions.append(repaired)

    questions = _enforce_mcq_four_choices(questions, warnings)
    questions = _dedupe_questions(questions, warnings)
    questions = questions[:requested]

    for warning in warnings:
        logger.warning("Quiz regeneration repair (quiz %s): %s", quiz.pk, warning)

    if not questions:
        raise QuizRegenerationError("No question in the AI response survived validation.")

    if len(questions) < requested:
        # Not fatal — the attempt is graded out of the questions it was actually
        # served (services._quiz_total_marks reads the attempt's own set), so a
        # short paper still scores correctly. Worth a line, because a persistent
        # shortfall means the prompt or the batch focuses need looking at.
        logger.warning(
            "Quiz regeneration produced %s of %s requested questions (quiz %s).",
            len(questions),
            requested,
            quiz.pk,
        )

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
