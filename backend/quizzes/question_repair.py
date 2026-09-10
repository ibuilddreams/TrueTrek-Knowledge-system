"""Pure, DB-free validation/repair for AI-generated question+choice payloads.

Originally lived in `ai_courses/validators.py` (full-course-generation's repair
layer) — promoted here since it's genuinely quiz-domain logic, not
course-domain logic, and is now also used by `quizzes/ai_generation.py` for
single-quiz regeneration on a retry attempt. `ai_courses/validators.py`
re-imports these under their old private names so its own behavior is
unchanged.
"""

from .models import Question

MAX_CHOICE_TEXT_LENGTH = 255
QUESTION_TYPES = {choice for choice, _ in Question.QuestionType.choices}


def _truncate(value, max_length, warnings, field_label):
    value = (value or "").strip()
    if len(value) > max_length:
        warnings.append(f"{field_label} was truncated to {max_length} characters.")
        return value[:max_length]
    return value


def repair_choices(choices_data, question_label, warnings):
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


def repair_question(entry, order, warnings):
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

    choices = repair_choices(entry.get("choices"), question_label, warnings)

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
