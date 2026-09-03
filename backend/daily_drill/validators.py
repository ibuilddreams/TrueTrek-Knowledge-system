"""Validation and repair layer for AI-generated Daily Drill questions.

Mirrors `ai_courses/validators.py`'s shape and philosophy, scaled down to a
single question: the provider's response is never trusted or persisted as-is.
Every repair is recorded in `warnings` (logged, not shown to the student).
This module is pure — no DB/ORM access — so it's testable with hand-written
provider payloads and no network.
"""

import json

MAX_TITLE_LENGTH = 255
MAX_QUESTION_LENGTH = 2000
MAX_CONTEXT_LENGTH = 500
MAX_OPTION_TEXT_LENGTH = 200
MAX_EXPLANATION_LENGTH = 500
MAX_TOPIC_LENGTH = 255
MIN_OPTIONS = 3
MAX_OPTIONS = 4
VALID_DIFFICULTIES = {"EASY", "MEDIUM", "HARD"}


class DrillValidationError(Exception):
    """Raised when the generated drill cannot be repaired into anything
    usable at all — malformed JSON, no question text, or no valid options.
    Callers must not persist/serve a drill in this case; they fall back to
    the legacy question bank instead."""


def _truncate(value, max_length, warnings, field_label):
    value = (value or "").strip()
    if len(value) > max_length:
        warnings.append(f"{field_label} was truncated to {max_length} characters.")
        return value[:max_length]
    return value


def _repair_options(options_data, warnings):
    repaired = []
    seen_keys = set()
    for entry in options_data or []:
        if not isinstance(entry, dict):
            continue
        key = (entry.get("key") or "").strip().upper()[:1]
        text = _truncate(entry.get("text"), MAX_OPTION_TEXT_LENGTH, warnings, "An option's text")
        if not key or not text:
            continue
        if key in seen_keys:
            warnings.append(f"Duplicate option key '{key}' was dropped.")
            continue
        seen_keys.add(key)
        repaired.append({"key": key, "text": text})
    return repaired


def validate_and_repair_drill(raw_text):
    """Returns (normalized_drill, warnings). Raises DrillValidationError if
    nothing usable survives — the caller must fall back rather than persist
    or serve anything in that case."""

    warnings = []

    try:
        data = json.loads(raw_text)
    except (ValueError, TypeError) as exc:
        raise DrillValidationError(f"AI response was not valid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise DrillValidationError("AI response was not a JSON object.")

    title = _truncate(data.get("title"), MAX_TITLE_LENGTH, warnings, "Title")
    question = _truncate(data.get("question"), MAX_QUESTION_LENGTH, warnings, "Question")
    if not question:
        raise DrillValidationError("AI response had no usable question text.")
    if not title:
        title = question[:80]
        warnings.append("Title was missing — derived from the question text.")

    context = _truncate(data.get("context"), MAX_CONTEXT_LENGTH, warnings, "Context")
    explanation = _truncate(data.get("explanation"), MAX_EXPLANATION_LENGTH, warnings, "Explanation")
    topic = _truncate(data.get("topic"), MAX_TOPIC_LENGTH, warnings, "Topic") or "General"

    difficulty = str(data.get("difficulty") or "").strip().upper()
    if difficulty not in VALID_DIFFICULTIES:
        warnings.append(f"Unrecognized difficulty '{difficulty}' — defaulted to MEDIUM.")
        difficulty = "MEDIUM"

    options = _repair_options(data.get("options"), warnings)
    if len(options) < MIN_OPTIONS:
        raise DrillValidationError(
            f"AI response had fewer than {MIN_OPTIONS} usable options after repair."
        )
    if len(options) > MAX_OPTIONS:
        warnings.append(f"AI response had more than {MAX_OPTIONS} options — extras were dropped.")
        options = options[:MAX_OPTIONS]

    correct_answer = (data.get("correct_answer") or "").strip().upper()[:1]
    option_keys = [option["key"] for option in options]
    if correct_answer not in option_keys:
        warnings.append(
            f"correct_answer '{correct_answer}' did not match any option — defaulted to the first option."
        )
        correct_answer = option_keys[0]

    return (
        {
            "title": title,
            "question": question,
            "context": context,
            "options": options,
            "correct_answer": correct_answer,
            "explanation": explanation,
            "difficulty": difficulty,
            "topic": topic,
        },
        warnings,
    )
