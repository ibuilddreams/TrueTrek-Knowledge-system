"""Validation and repair layer for AI assignment-grading responses.

Same never-trust-the-raw-response philosophy as `ai_courses/validators.py`
and `daily_drill/validators.py`. Grade-determining data — which items exist,
their marks — is never guessed: every returned item is matched against the
REAL, trusted `AssignmentRubricCriterion` rows (by name), and `awarded_marks`
is clamped to that criterion's own `max_marks` rather than trusted from the
AI. An item the AI never addresses defaults to `awarded_marks=0` (worst case
for the student, never silently dropped from the total) with a logged
warning. There is no AI-provided status/score/total to validate at all — the
caller (`services.py`) computes the percentage and PASS/REVISION_REQUIRED
verdict itself from these validated per-item marks.
"""

import json
import math

from .exceptions import AIReviewValidationError

MAX_FEEDBACK_LENGTH = 4000
MAX_ITEM_FEEDBACK_LENGTH = 1000
MAX_LIST_ITEM_LENGTH = 300
MAX_LIST_ITEMS = 15


def _truncate(value, max_length, warnings, label):
    value = (value or "").strip() if isinstance(value, str) else ""
    if len(value) > max_length:
        warnings.append(f"{label} was truncated to {max_length} characters.")
        return value[:max_length]
    return value


def _to_float(value):
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    # json.loads accepts the bare NaN/Infinity/-Infinity tokens, and a NaN
    # awarded_marks silently defeats the `awarded < 0 or awarded > max_marks`
    # clamp below (every NaN comparison is False) — treat both as "not a
    # usable mark" so they fall into the same missing/non-numeric handling
    # as an actually-missing value, rather than reaching an unclamped NaN/inf
    # that later blows up the Decimal percentage comparison in services.py.
    if not math.isfinite(result):
        return None
    return result


def _repair_string_list(raw, warnings, label):
    if not isinstance(raw, list):
        return []
    items = []
    for entry in raw:
        if not isinstance(entry, str):
            continue
        text = _truncate(entry, MAX_LIST_ITEM_LENGTH, warnings, label)
        if text:
            items.append(text)
    if len(items) > MAX_LIST_ITEMS:
        warnings.append(f"{label} list was truncated to {MAX_LIST_ITEMS} items.")
        items = items[:MAX_LIST_ITEMS]
    return items


def _normalize_name(name):
    return (name or "").strip().casefold()


def validate_and_repair_review(raw_text, criteria):
    """`criteria` is the assignment's real, trusted list of
    AssignmentRubricCriterion rows (name + max_marks) — the source of truth
    this response is matched and clamped against.

    Returns (normalized, warnings). Raises AIReviewValidationError when the
    response is fundamentally unusable (not JSON, no matchable items at
    all) — callers must mark the review FAILED in that case.

    normalized = {
        "criteria_results": [{"name", "max_marks", "awarded_marks", "feedback"}, ...],
        "feedback": str,
        "strengths": [str], "improvements": [str],
    }
    """

    warnings = []

    try:
        data = json.loads(raw_text)
    except (ValueError, TypeError) as exc:
        raise AIReviewValidationError(f"AI response was not valid JSON: {exc}") from exc

    if not isinstance(data, dict):
        raise AIReviewValidationError("AI response was not a JSON object.")

    feedback = _truncate(data.get("overall_feedback"), MAX_FEEDBACK_LENGTH, warnings, "Overall feedback")
    if not feedback:
        raise AIReviewValidationError("AI response had blank overall feedback.")

    raw_items = data.get("items")
    if not isinstance(raw_items, list):
        raw_items = []

    awarded_by_name = {}
    item_feedback_by_name = {}
    for entry in raw_items:
        if not isinstance(entry, dict):
            continue
        name = _normalize_name(entry.get("name"))
        if not name:
            continue
        marks = _to_float(entry.get("awarded_marks"))
        if marks is None:
            warnings.append(f"An item ('{entry.get('name')!r}') had a missing or non-numeric awarded_marks — skipped.")
            continue
        awarded_by_name[name] = marks
        item_feedback_by_name[name] = _truncate(
            entry.get("feedback"), MAX_ITEM_FEEDBACK_LENGTH, warnings, "An item's feedback"
        )

    if not awarded_by_name:
        # Distinguish "the AI addressed some items but skipped one or two"
        # (safe to repair — see the per-criterion defaulting below) from
        # "the AI gave us nothing usable at all" (a broken/malformed
        # response, not a legitimate 0% grade) — the latter is rejected
        # outright rather than silently becoming an all-zeros REVISION_REQUIRED.
        raise AIReviewValidationError("AI response had no usable graded items at all.")

    criteria_results = []
    for criterion in criteria:
        key = _normalize_name(criterion.name)
        raw_marks = awarded_by_name.get(key)
        if raw_marks is None:
            warnings.append(
                f"Criterion '{criterion.name}' was not addressed in the AI's response — scored 0."
            )
            awarded = 0.0
        else:
            awarded = raw_marks
            if awarded < 0 or awarded > criterion.max_marks:
                warnings.append(
                    f"Criterion '{criterion.name}' awarded_marks {awarded} was outside "
                    f"0-{criterion.max_marks} — clamped."
                )
                awarded = max(0.0, min(float(criterion.max_marks), awarded))

        criteria_results.append(
            {
                "name": criterion.name,
                "max_marks": criterion.max_marks,
                "awarded_marks": awarded,
                "feedback": item_feedback_by_name.get(key, ""),
            }
        )

    if not criteria_results:
        raise AIReviewValidationError(
            "No configured grading criteria/questions were found to evaluate against."
        )

    strengths = _repair_string_list(data.get("strengths"), warnings, "A strength")
    improvements = _repair_string_list(data.get("improvements"), warnings, "An improvement")

    return (
        {
            "criteria_results": criteria_results,
            "feedback": feedback,
            "strengths": strengths,
            "improvements": improvements,
        },
        warnings,
    )
