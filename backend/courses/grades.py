"""Grade-level helpers for courses.

Grades are stored as small integers so a course covering a range can be
matched against a single grade with a plain range query: Pre-K = -1,
Kindergarten = 0, then 1-12.
"""
import re

PRE_K = -1
KINDERGARTEN = 0
MIN_GRADE = PRE_K
MAX_GRADE = 12

_TOKEN = r"(?:pre-?k|k|\d{1,2})"
_RANGE = rf"({_TOKEN})(?:\s*[–—-]\s*({_TOKEN}))?(?![\w])"
# Imported course descriptions carry a structured "· Grades 3–5 ·" segment;
# prefer it over incidental mentions such as "Grade 8 math ...".
_STRUCTURED = re.compile(rf"·\s*Grades?\s+{_RANGE}", re.IGNORECASE)
_PLURAL = re.compile(rf"\bGrades\s+{_RANGE}", re.IGNORECASE)


def _to_int(token):
    token = token.lower()
    if token.startswith("pre"):
        return PRE_K
    if token == "k":
        return KINDERGARTEN
    value = int(token)
    return value if MIN_GRADE <= value <= MAX_GRADE else None


def parse_grade_range(text):
    """Return (grade_min, grade_max) found in `text`, or None."""
    for pattern in (_STRUCTURED, _PLURAL):
        match = pattern.search(text or "")
        if not match:
            continue
        low = _to_int(match.group(1))
        high = _to_int(match.group(2)) if match.group(2) else low
        if low is None or high is None:
            continue
        return (min(low, high), max(low, high))
    return None


def _short(grade):
    if grade == PRE_K:
        return "Pre-K"
    if grade == KINDERGARTEN:
        return "K"
    return str(grade)


def grade_name(grade):
    """Single-grade label used by the filter dropdown."""
    if grade == PRE_K:
        return "Pre-K"
    if grade == KINDERGARTEN:
        return "Kindergarten"
    return f"Grade {grade}"


def grade_range_label(grade_min, grade_max):
    if grade_min is None or grade_max is None:
        return None
    if grade_min == grade_max:
        return grade_name(grade_min)
    return f"Grades {_short(grade_min)}–{_short(grade_max)}"
