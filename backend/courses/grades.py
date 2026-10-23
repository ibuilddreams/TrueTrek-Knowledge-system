"""Grade-level helpers for courses.

Grades are stored as small integers so a course covering a range can be
matched against a single grade with a plain range query: Pre-K = -1,
Kindergarten = 0, then 1-12.

Above school come the stages the client's "Grade Level" column also uses --
Undergraduate = 13, Graduate School = 14 and Adult = 15. They are not school
grades, but they are grade *levels* as the catalog means the word, and keeping
them on the same axis is what lets one range query, one filter dropdown and one
label helper serve the whole catalog instead of the post-school courses dropping
out of every grade-based surface. Numeric tokens are still only read up to
`MAX_SCHOOL_GRADE`: "Grades 13" is a typo, not an undergraduate course. The
stages are written by name instead, in their own structured segment.

They are ordered as a life runs rather than by how much schooling they imply:
Adult sits last because the courses behind it are the ones that come after a
career has started -- career pivots, divorce, bereavement, retirement, Medicare
-- not because an adult course is harder than a graduate one.
"""
import re

PRE_K = -1
KINDERGARTEN = 0
UNDERGRADUATE = 13
GRADUATE_SCHOOL = 14
ADULT = 15

# The highest grade a numeric "Grades N" token may name.
MAX_SCHOOL_GRADE = 12
# The bounds of the whole axis, used by the model validators and the filter.
MIN_GRADE = PRE_K
MAX_GRADE = ADULT

# The post-school stages, by the name they are written and read as, and by the
# name they call their reader. Both directions live here so the seed command
# and the course page cannot drift apart on spelling.
STAGE_NAMES = {
    UNDERGRADUATE: "Undergraduate",
    GRADUATE_SCHOOL: "Graduate School",
    ADULT: "Adult",
}
STAGE_AUDIENCES = {
    UNDERGRADUATE: "undergraduate students",
    GRADUATE_SCHOOL: "graduate students",
    ADULT: "adults",
}

_TOKEN = r"(?:pre-?k|k|\d{1,2})"
_RANGE = rf"({_TOKEN})(?:\s*[–—-]\s*({_TOKEN}))?(?![\w])"
# Imported course descriptions carry a structured "· Grades 3–5 ·" segment;
# prefer it over incidental mentions such as "Grade 8 math ...".
_STRUCTURED = re.compile(rf"·\s*Grades?\s+{_RANGE}", re.IGNORECASE)
_PLURAL = re.compile(rf"\bGrades\s+{_RANGE}", re.IGNORECASE)
# A post-school course writes its stage by name in the same place, under the
# sheet's own column heading: "· Grade Level: Undergraduate ·". It needs its own
# segment because "Grades Undergraduate" is not a sentence, and it is matched
# first because it is the most specific of the three.
_STAGE_NAMES_PATTERN = "|".join(re.escape(name) for name in STAGE_NAMES.values())
_STRUCTURED_STAGE = re.compile(
    rf"·\s*Grade\s+Level:\s*({_STAGE_NAMES_PATTERN})(?![\w])", re.IGNORECASE
)
_STAGES_BY_NAME = {name.lower(): grade for grade, name in STAGE_NAMES.items()}


def _to_int(token):
    token = token.lower()
    if token.startswith("pre"):
        return PRE_K
    if token == "k":
        return KINDERGARTEN
    value = int(token)
    return value if MIN_GRADE <= value <= MAX_SCHOOL_GRADE else None


def parse_grade_range(text):
    """Return (grade_min, grade_max) found in `text`, or None."""
    stage = _STRUCTURED_STAGE.search(text or "")
    if stage:
        value = _STAGES_BY_NAME[stage.group(1).lower()]
        return (value, value)

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
    return STAGE_NAMES.get(grade) or str(grade)


def grade_name(grade):
    """Single-grade label used by the filter dropdown."""
    if grade == PRE_K:
        return "Pre-K"
    if grade == KINDERGARTEN:
        return "Kindergarten"
    if grade in STAGE_NAMES:
        return STAGE_NAMES[grade]
    return f"Grade {grade}"


def grade_audience(grade):
    """How a single grade names its reader, for prose that says who a course is
    written for: "Grades 9–12" is a range of years, "graduate students" is not."""
    return STAGE_AUDIENCES.get(grade) or grade_name(grade)


def grade_range_label(grade_min, grade_max):
    if grade_min is None or grade_max is None:
        return None
    if grade_min == grade_max:
        return grade_name(grade_min)
    # "Grades 11–Undergraduate" is not a range anyone writes, so a span that
    # reaches into the post-school stages names both of its ends in full.
    if grade_min in STAGE_NAMES or grade_max in STAGE_NAMES:
        return f"{grade_name(grade_min)} to {grade_name(grade_max)}"
    return f"Grades {_short(grade_min)}–{_short(grade_max)}"


# Grade levels offered by the public curriculum filter. The dropdown lists the
# whole range rather than only the levels some published course happens to
# cover: an option set that silently gains and loses entries as the catalog is
# edited is harder to use than a fixed one, and a grade with nothing behind it
# yet answers with an empty result, which is the truth. Pre-K and K are left
# out because this catalog starts at grade 1; `parse_grade_range` still stores
# them, so a Pre-K course is matched by the range query and only misses a
# dropdown entry. The post-school stages are in, because the Cool Nerds academy
# catalog really does publish courses for every one of them.
FILTER_MIN_GRADE = 1
FILTER_GRADES = list(range(FILTER_MIN_GRADE, MAX_GRADE + 1))
