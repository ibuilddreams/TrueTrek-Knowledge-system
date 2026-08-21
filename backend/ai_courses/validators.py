"""Validation and repair layer for AI-generated course plans (plan §8.4).

The provider's response is never trusted or written to the DB as-is. Every
intervention this layer makes — truncation, clamping, dropping a malformed
question, rotating a correct answer — is recorded in `warnings` so the admin
reviewing the resulting DRAFT course knows exactly what the server changed or
threw away.

This module is pure — no DB access, no ORM imports — so it is testable with
hand-written provider payloads and no network (see tests/test_validators.py).
"""

import json

from quizzes.models import Question

MAX_TITLE_LENGTH = 255
MAX_CHOICE_TEXT_LENGTH = 255
QUESTION_TYPES = {choice for choice, _ in Question.QuestionType.choices}


class PlanValidationError(Exception):
    """Raised when the plan cannot produce a usable course at all — malformed JSON,
    or nothing survives repair. Callers must not write a course in this case."""


def _truncate(value, max_length, warnings, field_label):
    value = (value or "").strip()
    if len(value) > max_length:
        warnings.append(f"{field_label} was truncated to {max_length} characters.")
        return value[:max_length]
    return value


def _clamp_minutes(value):
    if not isinstance(value, (int, float)) or value <= 0:
        return None
    return int(value)


def _repair_choices(choices_data, question_label, warnings):
    """Enforces the pedagogical rules the platform's own publish_quiz does not:
    every MCQ needs >=2 choices and exactly one correct; Choice.text has no
    max_length in the nested serializer (Postgres 500s past 255), so it is
    enforced here instead."""
    repaired = []
    for entry in choices_data or []:
        if not isinstance(entry, dict):
            continue
        text = _truncate(entry.get("text"), MAX_CHOICE_TEXT_LENGTH, warnings, f"{question_label} choice")
        if not text:
            continue
        repaired.append({"text": text, "is_correct": bool(entry.get("is_correct"))})
    return repaired


def _repair_question(entry, order, warnings):
    if not isinstance(entry, dict):
        return None

    text = (entry.get("text") or "").strip()
    if not text:
        warnings.append("A question with blank text was dropped.")
        return None

    question_type = entry.get("question_type")
    if question_type not in QUESTION_TYPES:
        warnings.append(
            f"Question '{text[:50]}' had an unrecognized type — defaulted to MCQ."
        )
        question_type = Question.QuestionType.MCQ

    marks = entry.get("marks")
    if not isinstance(marks, (int, float)) or marks < 1:
        marks = 1
    marks = int(marks)

    question_label = f"Question '{text[:50]}'"

    if question_type == Question.QuestionType.SHORT_ANSWER:
        if entry.get("choices"):
            warnings.append(f"{question_label} is short-answer — provided choices were discarded.")
        return {"text": text, "question_type": question_type, "marks": marks, "choices": []}

    choices = _repair_choices(entry.get("choices"), question_label, warnings)

    if question_type == Question.QuestionType.TRUE_FALSE and len(choices) != 2:
        warnings.append(f"{question_label} did not have exactly 2 choices and was dropped.")
        return None
    if question_type == Question.QuestionType.MCQ and len(choices) < 2:
        warnings.append(f"{question_label} had fewer than 2 choices and was dropped.")
        return None

    correct_count = sum(1 for choice in choices if choice["is_correct"])
    if correct_count == 0:
        choices[0]["is_correct"] = True
        warnings.append(f"{question_label} had no correct choice — the first choice was marked correct.")
    elif correct_count > 1:
        seen_correct = False
        for choice in choices:
            if choice["is_correct"] and seen_correct:
                choice["is_correct"] = False
            elif choice["is_correct"]:
                seen_correct = True
        warnings.append(f"{question_label} had multiple correct choices — only the first was kept.")

    # Choice has no `order` field and no Meta ordering, so writing the correct
    # answer's choice first every time would make every quiz answerable without
    # reading it. Rotate by the question's order, same fix as seeddata.py.
    rotation = order % len(choices)
    choices = choices[rotation:] + choices[:rotation]

    return {"text": text, "question_type": question_type, "marks": marks, "choices": choices}


def _repair_quiz_items(quiz_items, module_label, questions_per_quiz, warnings):
    if len(quiz_items) > 1:
        warnings.append(f"{module_label} had more than one quiz item — they were merged into one.")

    raw_questions = []
    for item in quiz_items:
        raw_questions.extend(item.get("questions") or [])

    if len(raw_questions) > questions_per_quiz:
        warnings.append(
            f"{module_label} quiz had more questions than requested — extra questions were dropped."
        )
        raw_questions = raw_questions[:questions_per_quiz]

    questions = []
    for entry in raw_questions:
        repaired = _repair_question(entry, order=len(questions) + 1, warnings=warnings)
        if repaired is not None:
            questions.append(repaired)

    if not questions:
        warnings.append(f"{module_label} quiz had no valid questions and was dropped.")
        return None

    return {"questions": questions}


def _repair_lessons(lesson_items, module_label, max_lessons, warnings):
    lessons = []
    seen_titles = set()

    if len(lesson_items) > max_lessons:
        warnings.append(f"{module_label} had more lessons than allowed — extra lessons were dropped.")
        lesson_items = lesson_items[:max_lessons]

    for item in lesson_items:
        title = _truncate(item.get("title"), MAX_TITLE_LENGTH, warnings, f"{module_label} lesson title")
        body = (item.get("body") or "").strip()
        if not title or not body:
            warnings.append(f"{module_label} had a lesson with a blank title or body — it was dropped.")
            continue

        normalized_title = title.lower()
        if normalized_title in seen_titles:
            warnings.append(f"{module_label} has duplicate lesson titles ('{title}').")
        seen_titles.add(normalized_title)

        lessons.append(
            {
                "title": title,
                "body": body,
                "estimated_minutes": _clamp_minutes(item.get("estimated_minutes")),
            }
        )

    return lessons


def _repair_assignment_items(assignment_items, module_label, warnings):
    if not assignment_items:
        return None
    if len(assignment_items) > 1:
        warnings.append(f"{module_label} had more than one assignment item — only the first was kept.")

    item = assignment_items[0]
    instructions = (item.get("instructions") or item.get("body") or "").strip()
    if not instructions:
        warnings.append(f"{module_label} assignment had no instructions.")

    return {"instructions": instructions}


def _repair_module(entry, index, form_payload, warnings):
    module_label = f"Module {index}"

    title = _truncate(entry.get("title") or f"Module {index}", MAX_TITLE_LENGTH, warnings, module_label)
    description = (entry.get("description") or "").strip()

    items = entry.get("items")
    if not isinstance(items, list) or not items:
        warnings.append(f"{module_label} ('{title}') had no content and was dropped.")
        return None

    lesson_items = [item for item in items if isinstance(item, dict) and item.get("kind") == "lesson"]
    quiz_items = [item for item in items if isinstance(item, dict) and item.get("kind") == "quiz"]
    assignment_items = [
        item for item in items if isinstance(item, dict) and item.get("kind") == "assignment"
    ]

    lessons = _repair_lessons(
        lesson_items, module_label, form_payload["lessons_per_module"], warnings
    )
    if not lessons:
        warnings.append(
            f"{module_label} ('{title}') ended up with zero usable lessons and was dropped — every "
            "module must have at least one lesson for progress tracking to work."
        )
        return None

    quiz = None
    if form_payload["include_quizzes"] and quiz_items:
        quiz = _repair_quiz_items(
            quiz_items, module_label, form_payload["questions_per_quiz"], warnings
        )
    elif form_payload["include_quizzes"] and not quiz_items:
        warnings.append(f"{module_label} ('{title}') did not include a quiz as requested.")

    assignment = None
    if form_payload["include_assignments"]:
        assignment = _repair_assignment_items(assignment_items, module_label, warnings)
        if assignment is None:
            warnings.append(f"{module_label} ('{title}') did not include an assignment as requested.")

    return {
        "title": title,
        "description": description,
        "lessons": lessons,
        "quiz": quiz,
        "assignment": assignment,
    }


def _check_objectives_coverage(objectives, modules, warnings):
    haystack = " ".join(
        f"{module['title']} {module['description']}" for module in modules
    ).lower()
    for objective in objectives:
        keywords = [word.lower() for word in objective.split() if len(word) > 4]
        if keywords and not any(keyword in haystack for keyword in keywords):
            warnings.append(f"Objective '{objective}' does not appear to be covered by any module.")


def validate_and_repair(raw_text, form_payload, max_modules):
    """Returns (normalized_plan, warnings). Raises PlanValidationError if nothing
    usable survives — callers must leave no course row behind in that case."""

    warnings = []

    try:
        data = json.loads(raw_text)
    except (TypeError, ValueError) as exc:
        raise PlanValidationError(f"Provider response was not valid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise PlanValidationError("Provider response was not a JSON object.")

    summary = (data.get("summary") or "").strip()
    objectives = [
        str(objective).strip()
        for objective in (data.get("objectives") or [])
        if str(objective).strip()
    ] or (form_payload.get("objectives") or [])

    raw_modules = data.get("modules")
    if not isinstance(raw_modules, list) or not raw_modules:
        raise PlanValidationError("Provider response contained no modules.")

    requested_modules = form_payload["modules_count"]
    module_cap = min(max_modules, requested_modules)
    if len(raw_modules) > module_cap:
        warnings.append(
            f"Provider returned {len(raw_modules)} modules — extra modules beyond {module_cap} were dropped."
        )
        raw_modules = raw_modules[:module_cap]

    modules = []
    for index, entry in enumerate(raw_modules, start=1):
        if not isinstance(entry, dict):
            warnings.append(f"Module {index} was malformed and was dropped.")
            continue
        repaired = _repair_module(entry, index, form_payload, warnings)
        if repaired is not None:
            modules.append(repaired)

    if not modules:
        raise PlanValidationError("No module in the provider response survived validation.")

    if len(modules) < requested_modules:
        warnings.append(
            f"Only {len(modules)} of the requested {requested_modules} modules were usable."
        )

    _check_objectives_coverage(objectives, modules, warnings)

    normalized_plan = {
        "summary": summary,
        "objectives": objectives,
        "modules": modules,
    }
    return normalized_plan, warnings
