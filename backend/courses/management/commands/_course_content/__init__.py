"""Hand-authored curriculum for the courses that have it, keyed by course code.

`seeddata` generates a two-module placeholder shell for a course it knows
nothing about (`Command._create_modules`): titles built from a template, lessons
that are the same shared demo PDF every time, and a quiz whose questions are
about the course's own metadata rather than its subject. That is honest filler
for a 220-course catalog nobody has written lessons for yet, but it reads as
half-built wherever a real course is on screen.

A course listed here is seeded from this file instead. It gets six or seven
modules written against its own description, focus and core competencies, three
lessons in each (two written in Markdown, one a downloadable handout), and an
assignment and a quiz per module. `Command._create_authored_content` replaces
the generated shell the first time it runs and upserts everything afterwards, so
correcting a line here lands on the next reseed without orphaning a student's
progress — see its docstring for what is deliberately create-only.

The catalog is being written a pathway at a time. The Athlete CEO Pathway
(CEO-101…CEO-304), The Recruiting Pathway (REC-101…REC-303) and The Mental
Toughness Pathway (MT-101…MT-303) are done — thirty courses — and every other
course still seeds the generated shell. Adding a course is adding a module here
and a line in COURSE_CONTENT below.

The Mental Toughness courses teach performance psychology, not therapy. Each one
states that boundary and hands over to a professional where the material touches
genuine distress; that framing is deliberate and should be kept if those files
are edited.

Shape of one module, all keys required:

    {
        "title": str,            # unique within the course, and never one of
                                 # seeddata.GENERATED_MODULE_TITLES
        "description": str,      # one or two sentences — the student's course
                                 # page clamps it to two lines
        "lessons": [
            {
                "title": str,    # unique within the module
                "description": str,
                "type": str,     # "TEXT" | "PDF" | "DOCUMENT" — a
                                 # lessons.Lesson.ContentType value. TEXT
                                 # renders `body` as Markdown; the other two
                                 # attach the module's generated handout and
                                 # show `body` as its summary.
                "minutes": int,
                "body": str,
            },
            ...
        ],
        "assignment": {
            "title": str,
            "description": str,  # plain text — the student's assignment modal
                                 # renders it with whitespace-pre-line, not
                                 # Markdown, so asterisks and hashes show up
                                 # literally
            "total_marks": int,
            "due_in_days": int,
        },
        "quiz": {
            "title": str,
            "description": str,
            "passing_score": int,
            "minutes": int,
            "questions": [
                {
                    "text": str,
                    "choices": [str, str, str, str],  # exactly
                                 # seeddata.CHOICES_PER_QUESTION, all distinct
                    "answer": int,                    # index into `choices`
                },
                ...
            ],
        },
    }

`Command._validate_course_content` checks all of that before the seed writes a
row, so a malformed entry is a one-line error rather than a broken course.
"""

from .ceo_101 import HANDOUTS as CEO_101_HANDOUTS
from .ceo_101 import MODULES as CEO_101
from .ceo_102 import HANDOUTS as CEO_102_HANDOUTS
from .ceo_102 import MODULES as CEO_102
from .ceo_201 import HANDOUTS as CEO_201_HANDOUTS
from .ceo_201 import MODULES as CEO_201
from .ceo_202 import HANDOUTS as CEO_202_HANDOUTS
from .ceo_202 import MODULES as CEO_202
from .ceo_203 import HANDOUTS as CEO_203_HANDOUTS
from .ceo_203 import MODULES as CEO_203
from .ceo_204 import HANDOUTS as CEO_204_HANDOUTS
from .ceo_204 import MODULES as CEO_204
from .ceo_301 import HANDOUTS as CEO_301_HANDOUTS
from .ceo_301 import MODULES as CEO_301
from .ceo_302 import HANDOUTS as CEO_302_HANDOUTS
from .ceo_302 import MODULES as CEO_302
from .ceo_303 import HANDOUTS as CEO_303_HANDOUTS
from .ceo_303 import MODULES as CEO_303
from .ceo_304 import HANDOUTS as CEO_304_HANDOUTS
from .ceo_304 import MODULES as CEO_304
from .rec_101 import HANDOUTS as REC_101_HANDOUTS
from .rec_101 import MODULES as REC_101
from .rec_102 import HANDOUTS as REC_102_HANDOUTS
from .rec_102 import MODULES as REC_102
from .rec_103 import HANDOUTS as REC_103_HANDOUTS
from .rec_103 import MODULES as REC_103
from .rec_201 import HANDOUTS as REC_201_HANDOUTS
from .rec_201 import MODULES as REC_201
from .rec_202 import HANDOUTS as REC_202_HANDOUTS
from .rec_202 import MODULES as REC_202
from .rec_203 import HANDOUTS as REC_203_HANDOUTS
from .rec_203 import MODULES as REC_203
from .rec_204 import HANDOUTS as REC_204_HANDOUTS
from .rec_204 import MODULES as REC_204
from .rec_301 import HANDOUTS as REC_301_HANDOUTS
from .rec_301 import MODULES as REC_301
from .rec_302 import HANDOUTS as REC_302_HANDOUTS
from .rec_302 import MODULES as REC_302
from .rec_303 import HANDOUTS as REC_303_HANDOUTS
from .rec_303 import MODULES as REC_303
from .mt_101 import HANDOUTS as MT_101_HANDOUTS
from .mt_101 import MODULES as MT_101
from .mt_102 import HANDOUTS as MT_102_HANDOUTS
from .mt_102 import MODULES as MT_102
from .mt_103 import HANDOUTS as MT_103_HANDOUTS
from .mt_103 import MODULES as MT_103
from .mt_201 import HANDOUTS as MT_201_HANDOUTS
from .mt_201 import MODULES as MT_201
from .mt_202 import HANDOUTS as MT_202_HANDOUTS
from .mt_202 import MODULES as MT_202
from .mt_203 import HANDOUTS as MT_203_HANDOUTS
from .mt_203 import MODULES as MT_203
from .mt_204 import HANDOUTS as MT_204_HANDOUTS
from .mt_204 import MODULES as MT_204
from .mt_301 import HANDOUTS as MT_301_HANDOUTS
from .mt_301 import MODULES as MT_301
from .mt_302 import HANDOUTS as MT_302_HANDOUTS
from .mt_302 import MODULES as MT_302
from .mt_303 import HANDOUTS as MT_303_HANDOUTS
from .mt_303 import MODULES as MT_303

# Lesson content types whose file is the module's generated handout rather than
# prose in `content_data`.
HANDOUT_LESSON_TYPES = ("PDF", "DOCUMENT")


def _with_handouts(code, modules, handouts):
    """Attaches each module's handout spec to the lesson that carries the file.

    A course file keeps its handouts in a list parallel to MODULES rather than
    inline, so the prose of a module and the worksheet that goes with it can be
    edited without scrolling past each other. They are paired here, at import,
    and a mismatch is an ImportError rather than a module that seeds a lesson
    with nothing behind its download button.
    """
    if len(modules) != len(handouts):
        raise ValueError(
            f"{code}: {len(modules)} module(s) but {len(handouts)} handout(s) — "
            "HANDOUTS must hold exactly one spec per module, in module order"
        )

    for module, handout in zip(modules, handouts):
        documents = [
            lesson for lesson in module["lessons"] if lesson["type"] in HANDOUT_LESSON_TYPES
        ]
        if len(documents) != 1:
            raise ValueError(
                f"{code} / {module['title']}: expected exactly one PDF or DOCUMENT lesson to "
                f"carry the module's handout, found {len(documents)}"
            )
        documents[0]["handout"] = handout

    return modules


COURSE_CONTENT = {
    "CEO-101": _with_handouts("CEO-101", CEO_101, CEO_101_HANDOUTS),
    "CEO-102": _with_handouts("CEO-102", CEO_102, CEO_102_HANDOUTS),
    "CEO-201": _with_handouts("CEO-201", CEO_201, CEO_201_HANDOUTS),
    "CEO-202": _with_handouts("CEO-202", CEO_202, CEO_202_HANDOUTS),
    "CEO-203": _with_handouts("CEO-203", CEO_203, CEO_203_HANDOUTS),
    "CEO-204": _with_handouts("CEO-204", CEO_204, CEO_204_HANDOUTS),
    "CEO-301": _with_handouts("CEO-301", CEO_301, CEO_301_HANDOUTS),
    "CEO-302": _with_handouts("CEO-302", CEO_302, CEO_302_HANDOUTS),
    "CEO-303": _with_handouts("CEO-303", CEO_303, CEO_303_HANDOUTS),
    "CEO-304": _with_handouts("CEO-304", CEO_304, CEO_304_HANDOUTS),
    "REC-101": _with_handouts("REC-101", REC_101, REC_101_HANDOUTS),
    "REC-102": _with_handouts("REC-102", REC_102, REC_102_HANDOUTS),
    "REC-103": _with_handouts("REC-103", REC_103, REC_103_HANDOUTS),
    "REC-201": _with_handouts("REC-201", REC_201, REC_201_HANDOUTS),
    "REC-202": _with_handouts("REC-202", REC_202, REC_202_HANDOUTS),
    "REC-203": _with_handouts("REC-203", REC_203, REC_203_HANDOUTS),
    "REC-204": _with_handouts("REC-204", REC_204, REC_204_HANDOUTS),
    "REC-301": _with_handouts("REC-301", REC_301, REC_301_HANDOUTS),
    "REC-302": _with_handouts("REC-302", REC_302, REC_302_HANDOUTS),
    "REC-303": _with_handouts("REC-303", REC_303, REC_303_HANDOUTS),
    "MT-101": _with_handouts("MT-101", MT_101, MT_101_HANDOUTS),
    "MT-102": _with_handouts("MT-102", MT_102, MT_102_HANDOUTS),
    "MT-103": _with_handouts("MT-103", MT_103, MT_103_HANDOUTS),
    "MT-201": _with_handouts("MT-201", MT_201, MT_201_HANDOUTS),
    "MT-202": _with_handouts("MT-202", MT_202, MT_202_HANDOUTS),
    "MT-203": _with_handouts("MT-203", MT_203, MT_203_HANDOUTS),
    "MT-204": _with_handouts("MT-204", MT_204, MT_204_HANDOUTS),
    "MT-301": _with_handouts("MT-301", MT_301, MT_301_HANDOUTS),
    "MT-302": _with_handouts("MT-302", MT_302, MT_302_HANDOUTS),
    "MT-303": _with_handouts("MT-303", MT_303, MT_303_HANDOUTS),
}
