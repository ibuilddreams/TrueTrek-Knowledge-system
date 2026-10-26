"""Hand-authored curriculum for the courses that have it, keyed by course code.

`seeddata` generates a two-module placeholder shell for a course it knows
nothing about (`Command._create_modules`): titles built from a template, lessons
that are the same shared demo PDF every time, and a quiz whose questions are
about the course's own metadata rather than its subject. That is honest filler
for a 220-course catalog nobody has written lessons for yet, but it reads as
half-built wherever a real course is on screen.

A course listed here is seeded from this file instead, in one of two shapes.
The **full** shape is six or seven modules written against the course's
description, focus and core competencies, three lessons in each (two written in
Markdown, one a downloadable handout), and an assignment and a quiz per module.
The **short** shape is two or three modules of two or three Markdown lessons,
still with an assignment and a quiz per module but no handout at all, for
courses whose curriculum is being written at a lighter weight; those files set
`HANDOUTS = []`. `Command._create_authored_content` replaces
the generated shell the first time it runs and upserts everything afterwards, so
correcting a line here lands on the next reseed without orphaning a student's
progress — see its docstring for what is deliberately create-only.

The catalog is being written a pathway at a time. Eighty courses are done. The
Athlete CEO Pathway (CEO-101…CEO-304), The Recruiting Pathway (REC-101…REC-303)
and The Mental Toughness Pathway (MT-101…MT-303) are written in the full shape;
The Branding & Marketing Pathway (BM-101…BM-303), the whole Athlete Life Skills
& Transition Pathway (LS-101…LS-404), the whole Parent Pathway (PAR-101…PAR-308)
and the first of The Cool Nerds Pathway (STU-101) are written in the short one.
Every other course still seeds the generated shell. Adding a course is adding a
module here and a line in COURSE_CONTENT below.

The catalog has three audiences. Most files address the **athlete**. The PAR
files address a **parent or guardian** directly as "you" and the young person
as "your athlete". The STU files (The Cool Nerds Pathway) address a **student**
who is not assumed to play a sport at all — academic and creative work rather
than training load — which is why STU-101 and LS-101 cover time management
separately and must not be collapsed into each other. The parent files
they point at the athlete-facing course that covers the same ground from the
other side rather than repeating it. Keep that voice if they are edited.

Several PAR courses overlap each other by design, and each file's docstring
states the angle that makes it distinct — PAR-102 is the parent's behaviour as
*modelling* while PAR-205 is the same behaviour as *representation*; PAR-102's
Module 3 raises a concern with a coach while PAR-106 is the ongoing
relationship; PAR-104 is the noise a family consumes while PAR-204 is the
attention it receives; PAR-107 is the parent's own conduct at home while
PAR-108 is the child's processing; PAR-205 is how a parent presents generally
while PAR-307 is a parent on the record or addressing a group. Keep those
boundaries when editing, or a level becomes five versions of the same course.

Two files carry safety framing that must survive any edit. **PAR-206** (the
parent's mental health course) states in every module that it teaches
recognition and routing rather than treatment, gives the crisis instruction in
plain language, and requires that a disclosure of self-harm or suicidal
thinking is acted on the same day rather than monitored. **PAR-301** teaches a
parent to *find and verify* their own NIL rules rather than stating rules that
differ by state and association and change constantly — quoting a specific
bylaw as settled fact is the one change that would make it dangerous.

The Mental Toughness courses teach performance psychology, not therapy. Each one
states that boundary and hands over to a professional where the material touches
genuine distress; that framing is deliberate and should be kept if those files
are edited. The same handover appears wherever else the material reaches real
distress — BM-103 (harassment and sextortion), BM-303 (a public mistake),
LS-102 (identity and stress) and LS-301 (family conflict, isolation and guilt) —
and for the same reason. The money courses carry the parallel disclaimer:
LS-201, LS-202 and LS-203 are financial *education*, name no product, quote no
rate as current, and route every real decision through a guardian and a
regulated professional.

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
from .bm_101 import HANDOUTS as BM_101_HANDOUTS
from .bm_101 import MODULES as BM_101
from .bm_102 import HANDOUTS as BM_102_HANDOUTS
from .bm_102 import MODULES as BM_102
from .bm_103 import HANDOUTS as BM_103_HANDOUTS
from .bm_103 import MODULES as BM_103
from .bm_201 import HANDOUTS as BM_201_HANDOUTS
from .bm_201 import MODULES as BM_201
from .bm_202 import HANDOUTS as BM_202_HANDOUTS
from .bm_202 import MODULES as BM_202
from .bm_203 import HANDOUTS as BM_203_HANDOUTS
from .bm_203 import MODULES as BM_203
from .bm_204 import HANDOUTS as BM_204_HANDOUTS
from .bm_204 import MODULES as BM_204
from .bm_301 import HANDOUTS as BM_301_HANDOUTS
from .bm_301 import MODULES as BM_301
from .bm_302 import HANDOUTS as BM_302_HANDOUTS
from .bm_302 import MODULES as BM_302
from .bm_303 import HANDOUTS as BM_303_HANDOUTS
from .bm_303 import MODULES as BM_303
from .ls_101 import HANDOUTS as LS_101_HANDOUTS
from .ls_101 import MODULES as LS_101
from .ls_102 import HANDOUTS as LS_102_HANDOUTS
from .ls_102 import MODULES as LS_102
from .ls_103 import HANDOUTS as LS_103_HANDOUTS
from .ls_103 import MODULES as LS_103
from .ls_104 import HANDOUTS as LS_104_HANDOUTS
from .ls_104 import MODULES as LS_104
from .ls_201 import HANDOUTS as LS_201_HANDOUTS
from .ls_201 import MODULES as LS_201
from .ls_202 import HANDOUTS as LS_202_HANDOUTS
from .ls_202 import MODULES as LS_202
from .ls_203 import HANDOUTS as LS_203_HANDOUTS
from .ls_203 import MODULES as LS_203
from .ls_204 import HANDOUTS as LS_204_HANDOUTS
from .ls_204 import MODULES as LS_204
from .ls_205 import HANDOUTS as LS_205_HANDOUTS
from .ls_205 import MODULES as LS_205
from .ls_301 import HANDOUTS as LS_301_HANDOUTS
from .ls_301 import MODULES as LS_301
from .ls_302 import HANDOUTS as LS_302_HANDOUTS
from .ls_302 import MODULES as LS_302
from .ls_303 import HANDOUTS as LS_303_HANDOUTS
from .ls_303 import MODULES as LS_303
from .ls_401 import HANDOUTS as LS_401_HANDOUTS
from .ls_401 import MODULES as LS_401
from .ls_402 import HANDOUTS as LS_402_HANDOUTS
from .ls_402 import MODULES as LS_402
from .ls_403 import HANDOUTS as LS_403_HANDOUTS
from .ls_403 import MODULES as LS_403
from .ls_404 import HANDOUTS as LS_404_HANDOUTS
from .ls_404 import MODULES as LS_404
from .par_101 import HANDOUTS as PAR_101_HANDOUTS
from .par_101 import MODULES as PAR_101
from .par_102 import HANDOUTS as PAR_102_HANDOUTS
from .par_102 import MODULES as PAR_102
from .par_103 import HANDOUTS as PAR_103_HANDOUTS
from .par_103 import MODULES as PAR_103
from .par_104 import HANDOUTS as PAR_104_HANDOUTS
from .par_104 import MODULES as PAR_104
from .par_105 import HANDOUTS as PAR_105_HANDOUTS
from .par_105 import MODULES as PAR_105
from .par_106 import HANDOUTS as PAR_106_HANDOUTS
from .par_106 import MODULES as PAR_106
from .par_107 import HANDOUTS as PAR_107_HANDOUTS
from .par_107 import MODULES as PAR_107
from .par_108 import HANDOUTS as PAR_108_HANDOUTS
from .par_108 import MODULES as PAR_108
from .par_109 import HANDOUTS as PAR_109_HANDOUTS
from .par_109 import MODULES as PAR_109
from .par_201 import HANDOUTS as PAR_201_HANDOUTS
from .par_201 import MODULES as PAR_201
from .par_202 import HANDOUTS as PAR_202_HANDOUTS
from .par_202 import MODULES as PAR_202
from .par_203 import HANDOUTS as PAR_203_HANDOUTS
from .par_203 import MODULES as PAR_203
from .par_204 import HANDOUTS as PAR_204_HANDOUTS
from .par_204 import MODULES as PAR_204
from .par_205 import HANDOUTS as PAR_205_HANDOUTS
from .par_205 import MODULES as PAR_205
from .par_206 import HANDOUTS as PAR_206_HANDOUTS
from .par_206 import MODULES as PAR_206
from .par_301 import HANDOUTS as PAR_301_HANDOUTS
from .par_301 import MODULES as PAR_301
from .par_302 import HANDOUTS as PAR_302_HANDOUTS
from .par_302 import MODULES as PAR_302
from .par_303 import HANDOUTS as PAR_303_HANDOUTS
from .par_303 import MODULES as PAR_303
from .par_304 import HANDOUTS as PAR_304_HANDOUTS
from .par_304 import MODULES as PAR_304
from .par_305 import HANDOUTS as PAR_305_HANDOUTS
from .par_305 import MODULES as PAR_305
from .par_306 import HANDOUTS as PAR_306_HANDOUTS
from .par_306 import MODULES as PAR_306
from .par_307 import HANDOUTS as PAR_307_HANDOUTS
from .par_307 import MODULES as PAR_307
from .par_308 import HANDOUTS as PAR_308_HANDOUTS
from .par_308 import MODULES as PAR_308
from .stu_101 import HANDOUTS as STU_101_HANDOUTS
from .stu_101 import MODULES as STU_101

# Lesson content types whose file is the module's generated handout rather than
# prose in `content_data`.
HANDOUT_LESSON_TYPES = ("PDF", "DOCUMENT")


def _with_handouts(code, modules, handouts):
    """Attaches each handout spec to the lesson that carries the file.

    A course file keeps its handouts in a list parallel to MODULES rather than
    inline, so the prose of a module and the worksheet that goes with it can be
    edited without scrolling past each other. They are paired here, at import,
    and a mismatch is an ImportError rather than a module that seeds a lesson
    with nothing behind its download button.

    A module may carry **no** handout — the shorter, text-only courses are built
    that way, and those files set `HANDOUTS = []`. The pairing is therefore
    against the modules that *do* have a PDF or DOCUMENT lesson, in order, and
    what is rejected is a module with two of them or a count that does not line
    up.
    """
    carriers = []
    for module in modules:
        documents = [
            lesson for lesson in module["lessons"] if lesson["type"] in HANDOUT_LESSON_TYPES
        ]
        if len(documents) > 1:
            raise ValueError(
                f"{code} / {module['title']}: a module may carry at most one PDF or DOCUMENT "
                f"lesson, found {len(documents)}"
            )
        if documents:
            carriers.append((module, documents[0]))

    if len(carriers) != len(handouts):
        raise ValueError(
            f"{code}: {len(carriers)} module(s) carry a handout lesson but HANDOUTS holds "
            f"{len(handouts)} spec(s) — they must line up, in module order"
        )

    for (_module, lesson), handout in zip(carriers, handouts):
        lesson["handout"] = handout

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
    "BM-101": _with_handouts("BM-101", BM_101, BM_101_HANDOUTS),
    "BM-102": _with_handouts("BM-102", BM_102, BM_102_HANDOUTS),
    "BM-103": _with_handouts("BM-103", BM_103, BM_103_HANDOUTS),
    "BM-201": _with_handouts("BM-201", BM_201, BM_201_HANDOUTS),
    "BM-202": _with_handouts("BM-202", BM_202, BM_202_HANDOUTS),
    "BM-203": _with_handouts("BM-203", BM_203, BM_203_HANDOUTS),
    "BM-204": _with_handouts("BM-204", BM_204, BM_204_HANDOUTS),
    "BM-301": _with_handouts("BM-301", BM_301, BM_301_HANDOUTS),
    "BM-302": _with_handouts("BM-302", BM_302, BM_302_HANDOUTS),
    "BM-303": _with_handouts("BM-303", BM_303, BM_303_HANDOUTS),
    "LS-101": _with_handouts("LS-101", LS_101, LS_101_HANDOUTS),
    "LS-102": _with_handouts("LS-102", LS_102, LS_102_HANDOUTS),
    "LS-103": _with_handouts("LS-103", LS_103, LS_103_HANDOUTS),
    "LS-104": _with_handouts("LS-104", LS_104, LS_104_HANDOUTS),
    "LS-201": _with_handouts("LS-201", LS_201, LS_201_HANDOUTS),
    "LS-202": _with_handouts("LS-202", LS_202, LS_202_HANDOUTS),
    "LS-203": _with_handouts("LS-203", LS_203, LS_203_HANDOUTS),
    "LS-204": _with_handouts("LS-204", LS_204, LS_204_HANDOUTS),
    "LS-205": _with_handouts("LS-205", LS_205, LS_205_HANDOUTS),
    "LS-301": _with_handouts("LS-301", LS_301, LS_301_HANDOUTS),
    "LS-302": _with_handouts("LS-302", LS_302, LS_302_HANDOUTS),
    "LS-303": _with_handouts("LS-303", LS_303, LS_303_HANDOUTS),
    "LS-401": _with_handouts("LS-401", LS_401, LS_401_HANDOUTS),
    "LS-402": _with_handouts("LS-402", LS_402, LS_402_HANDOUTS),
    "LS-403": _with_handouts("LS-403", LS_403, LS_403_HANDOUTS),
    "LS-404": _with_handouts("LS-404", LS_404, LS_404_HANDOUTS),
    "PAR-101": _with_handouts("PAR-101", PAR_101, PAR_101_HANDOUTS),
    "PAR-102": _with_handouts("PAR-102", PAR_102, PAR_102_HANDOUTS),
    "PAR-103": _with_handouts("PAR-103", PAR_103, PAR_103_HANDOUTS),
    "PAR-104": _with_handouts("PAR-104", PAR_104, PAR_104_HANDOUTS),
    "PAR-105": _with_handouts("PAR-105", PAR_105, PAR_105_HANDOUTS),
    "PAR-106": _with_handouts("PAR-106", PAR_106, PAR_106_HANDOUTS),
    "PAR-107": _with_handouts("PAR-107", PAR_107, PAR_107_HANDOUTS),
    "PAR-108": _with_handouts("PAR-108", PAR_108, PAR_108_HANDOUTS),
    "PAR-109": _with_handouts("PAR-109", PAR_109, PAR_109_HANDOUTS),
    "PAR-201": _with_handouts("PAR-201", PAR_201, PAR_201_HANDOUTS),
    "PAR-202": _with_handouts("PAR-202", PAR_202, PAR_202_HANDOUTS),
    "PAR-203": _with_handouts("PAR-203", PAR_203, PAR_203_HANDOUTS),
    "PAR-204": _with_handouts("PAR-204", PAR_204, PAR_204_HANDOUTS),
    "PAR-205": _with_handouts("PAR-205", PAR_205, PAR_205_HANDOUTS),
    "PAR-206": _with_handouts("PAR-206", PAR_206, PAR_206_HANDOUTS),
    "PAR-301": _with_handouts("PAR-301", PAR_301, PAR_301_HANDOUTS),
    "PAR-302": _with_handouts("PAR-302", PAR_302, PAR_302_HANDOUTS),
    "PAR-303": _with_handouts("PAR-303", PAR_303, PAR_303_HANDOUTS),
    "PAR-304": _with_handouts("PAR-304", PAR_304, PAR_304_HANDOUTS),
    "PAR-305": _with_handouts("PAR-305", PAR_305, PAR_305_HANDOUTS),
    "PAR-306": _with_handouts("PAR-306", PAR_306, PAR_306_HANDOUTS),
    "PAR-307": _with_handouts("PAR-307", PAR_307, PAR_307_HANDOUTS),
    "PAR-308": _with_handouts("PAR-308", PAR_308, PAR_308_HANDOUTS),
    "STU-101": _with_handouts("STU-101", STU_101, STU_101_HANDOUTS),
}
