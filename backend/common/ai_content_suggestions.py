"""AI title/description suggestions for a new assignment or quiz.

Two independent, small synchronous suggestion calls fire while a teacher/admin fills out the
"Add Assignment"/"Add Quiz" modal — title suggestions as they type the title, description
suggestions as they type the description (informed by whatever title exists so far). Neither is a
background job. Shared by `assignments` and `quizzes` because the context they draw on (course +
module + lesson content) and the call/retry shape are identical for both; only the resource-facing
label in the prompt differs. Modeled directly on `quizzes/ai_generation.py`'s build-context/
build-prompt/call-provider trio and `advisor/services.py`'s "retry once only if the failure was
fast" heuristic.
"""

import json
import logging
import time

from django.conf import settings

from ai_courses.providers import get_provider
from ai_courses.providers.base import ProviderError, ProviderTransportError
from lessons.models import Lesson

logger = logging.getLogger("common.ai_content_suggestions")

# Single-module context (this fires before the assignment/quiz exists, so there's no course-level
# quiz case to handle like quizzes/ai_generation.py's regeneration context) — kept smaller than
# that file's MAX_CONTEXT_LESSONS=30 since only one module's lessons are ever in scope here.
MAX_LESSON_CONTENT_CHARS = 1500
MAX_CONTEXT_LESSONS = 15

RESOURCE_LABELS = {
    "assignment": "a student assignment",
    "quiz": "a quiz",
}

# Both title and description suggestions return the same shape — a flat list of 3 strings — so
# they share one schema; only the prompt differs.
SUGGESTIONS_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "suggestions": {
            "type": "ARRAY",
            "minItems": 3,
            "maxItems": 3,
            "items": {"type": "STRING"},
        },
    },
    "required": ["suggestions"],
}

# Same "don't retry a slow failure" heuristic as advisor/services.py and quizzes/ai_generation.py —
# see the comment on AI_QUIZ_REGENERATION_TIMEOUT_SECONDS in settings.py for why.
SLOW_FAILURE_THRESHOLD_SECONDS = settings.AI_CONTENT_SUGGESTION_TIMEOUT_SECONDS * 0.75
TRANSPORT_RETRY_BACKOFF_SECONDS = 1


class SuggestionGenerationError(Exception):
    """Raised when suggestions could not be generated. The message is safe to show directly to
    the caller."""


def build_module_context(module):
    course = module.course

    lessons = []
    for lesson in Lesson.objects.filter(module=module).order_by("order")[:MAX_CONTEXT_LESSONS]:
        body = ""
        if lesson.content_type == Lesson.ContentType.TEXT and lesson.content_data:
            body = lesson.content_data[:MAX_LESSON_CONTENT_CHARS]
        lessons.append({"title": lesson.title, "description": lesson.description, "body": body})

    return {
        "course_title": course.title,
        "course_description": course.description,
        "course_difficulty": course.difficulty,
        "module_title": module.title,
        "module_description": module.description,
        "lessons": lessons,
    }


def _module_content_text(context):
    return "\n".join(
        f"- Lesson: {lesson['title']} — {lesson['description']}"
        + (f"\n  {lesson['body']}" if lesson["body"] else "")
        for lesson in context["lessons"]
    ) or "(no lesson content available — base suggestions on the course/module description alone)"


def _draft_instruction(label, draft_text):
    """Guards against the model literally echoing a half-typed, possibly-meaningless fragment
    (e.g. "some mo") into a suggestion — only build on the draft when it already reads as a real
    phrase, otherwise ignore it and suggest from the module content alone."""
    if not draft_text.strip():
        return f"The teacher has not typed a {label} yet — propose ideas from the module content alone."
    return (
        f'The teacher has typed this much of the {label} so far: "{draft_text}". Only build on it '
        "if it already reads as a meaningful, natural phrase — if it looks like an incomplete "
        "fragment, a placeholder, or a few disconnected words being typed mid-thought, ignore it "
        "entirely and propose fresh, polished suggestions from the module content instead. Never "
        "echo the raw fragment verbatim into a suggestion unless it already reads naturally on its "
        "own as a complete phrase."
    )


def build_title_prompt(context, resource_type, draft_title):
    resource_label = RESOURCE_LABELS[resource_type]

    return f"""You are helping a teacher create {resource_label} for a Life-Education learning
management system. Suggest exactly 3 distinct, complete, well-formed titles that fit naturally
into this module's content — do not invent facts not implied by the material below.

Course: {context['course_title']}
Course description: {context['course_description'] or '(none provided)'}
Difficulty level: {context['course_difficulty']}

Module: {context['module_title']}
Module description: {context['module_description'] or '(none provided)'}

Module content:
{_module_content_text(context)}

{_draft_instruction("title", draft_title)}

Requirements:
- Each title must be under 255 characters, plain text, no numbering/quotes/markdown.
- The 3 titles must be meaningfully different from each other in angle or focus, not just reworded
  restatements of the same idea.

Respond with JSON matching the provided response schema exactly — a "suggestions" array of exactly
3 plain title strings. Do not include any text outside the JSON object."""


def build_description_prompt(context, resource_type, title, draft_description):
    resource_label = RESOURCE_LABELS[resource_type]
    title_line = f'Working title: "{title}"' if title.strip() else "No title has been chosen yet."

    return f"""You are helping a teacher write the description/instructions for {resource_label} on
a Life-Education learning management system. Suggest exactly 3 distinct descriptions — do not
invent facts not implied by the material below.

Course: {context['course_title']}
Course description: {context['course_description'] or '(none provided)'}
Difficulty level: {context['course_difficulty']}

Module: {context['module_title']}
Module description: {context['module_description'] or '(none provided)'}

Module content:
{_module_content_text(context)}

{title_line}

{_draft_instruction("description", draft_description)}

Requirements:
- Each description should be 1-3 concise sentences of instructions/context for students, plain
  text (no Markdown).
- The 3 descriptions must be meaningfully different from each other in angle or focus, not just
  reworded restatements of the same idea.

Respond with JSON matching the provided response schema exactly — a "suggestions" array of exactly
3 plain description strings. Do not include any text outside the JSON object."""


def _call_provider(prompt):
    provider = get_provider(model=settings.AI_CHAT_MODEL)
    timeout = settings.AI_CONTENT_SUGGESTION_TIMEOUT_SECONDS

    start = time.monotonic()
    try:
        return provider.generate_course(prompt, SUGGESTIONS_RESPONSE_SCHEMA, timeout)
    except ProviderTransportError:
        elapsed = time.monotonic() - start
        if elapsed >= SLOW_FAILURE_THRESHOLD_SECONDS:
            logger.warning("Content suggestion call timed out after %.1fs — not retrying.", elapsed)
            raise
        logger.warning("Content suggestion transport error after %.1fs — retrying once.", elapsed)
        time.sleep(TRANSPORT_RETRY_BACKOFF_SECONDS)
        return provider.generate_course(prompt, SUGGESTIONS_RESPONSE_SCHEMA, timeout)


def _run(prompt):
    """Calls the provider with `prompt` and returns a validated list of non-empty suggestion
    strings (always 3 when it succeeds). Raises SuggestionGenerationError on any failure —
    callers must treat that as "no suggestions available right now", not a hard error for the
    surrounding create flow."""

    try:
        result = _call_provider(prompt)
    except (ProviderTransportError, ProviderError) as exc:
        logger.error("Content suggestion provider call failed: %s", exc)
        raise SuggestionGenerationError(
            "Could not generate suggestions right now. Please try again in a moment."
        ) from exc

    try:
        data = json.loads(result.text)
    except (TypeError, ValueError) as exc:
        raise SuggestionGenerationError("AI response was not valid JSON.") from exc

    if not isinstance(data, dict):
        raise SuggestionGenerationError("AI response was not a JSON object.")

    raw_suggestions = data.get("suggestions")
    if not isinstance(raw_suggestions, list) or not raw_suggestions:
        raise SuggestionGenerationError("AI response contained no suggestions.")

    suggestions = [str(item).strip() for item in raw_suggestions if str(item or "").strip()]
    if not suggestions:
        raise SuggestionGenerationError("No suggestion in the AI response survived validation.")

    return suggestions


def generate_title_suggestions(module, resource_type, draft_title=""):
    context = build_module_context(module)
    prompt = build_title_prompt(context, resource_type, draft_title)
    return [title[:255] for title in _run(prompt)]


def generate_description_suggestions(module, resource_type, title="", draft_description=""):
    context = build_module_context(module)
    prompt = build_description_prompt(context, resource_type, title, draft_description)
    return _run(prompt)
