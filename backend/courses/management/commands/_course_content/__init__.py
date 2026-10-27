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

The catalog is being written a pathway at a time. One hundred and eighty
courses are done. The Athlete CEO Pathway (CEO-101…CEO-304), The Recruiting
Pathway (REC-101…REC-303) and The Mental Toughness Pathway (MT-101…MT-303) are
written in the full shape; The Branding & Marketing Pathway (BM-101…BM-303), the
whole Athlete Life Skills & Transition Pathway (LS-101…LS-404), the whole Parent
Pathway (PAR-101…PAR-308), the whole Cool Nerds Pathway (STU-101…STU-405, all
four levels, 36 courses), the **whole Entrepreneur Pathway** (ENT-101…ENT-412,
all four levels, 55 courses) and the first ten of the Coaching Pathway
(COH-101…COH-110) are written in the short one.
Every other course still seeds the generated shell. Adding a course is adding a
module here and a line in COURSE_CONTENT below.

The catalog has three audiences. Most files address the **athlete**. The PAR
files address a **parent or guardian** directly as "you" and the young person
as "your athlete". The STU files (The Cool Nerds Pathway) address a **student**
who is not assumed to play a sport at all — academic and creative work rather
than training load — which is why STU-101 and LS-101 cover time management
separately and must not be collapsed into each other, and why STU-115 is the
accountability *system* around the single move STU-102's Module 3 teaches.
Level 2 (STU-201…STU-206) is the practical block — household and healthcare
admin, soft skills, entrance exams, studying abroad, self-directed upskilling
and resumes — and three of its files route every changeable fact to an official
source rather than stating one: STU-203 to the test-maker, STU-204 to the
destination government for the student's own nationality (it states no
immigration rule as fact, by design), and STU-206 to the local convention for
photographs, length and naming. STU-205 teaches choosing and proving a skill
where STU-101 teaches studying material somebody else set; the two are
complementary and must not be merged. Level 3 (STU-301…STU-307) is reputation,
brand, a first business, relationships, planning, leadership and keeping your
word; STU-307 is the one most easily written badly, because "loyalty" and
"honour" are the words used to pressure young people into silence, so it is
built around the distinction between loyalty and complicity and states plainly
that harm, danger and anybody at risk go to an adult. Level 4 (STU-401…STU-405)
is money, tax, long-term investing, property and travel, and the first four
carry the same financial-education disclaimer as LS-201/202/203: no product,
provider, rate or figure is named or quoted as current, and every real answer
routes to the country's regulator or revenue authority, a guardian and a
regulated professional. STU-403 is the strictest of them, because this age
group is the primary target for trading apps, "mentors" and signal groups, and
its Module 3 exists to teach the shapes of what is being sold.

The ENT files open a **fourth register**: an aspiring founder, which the
client's own sheet frames as "transitioning from athlete/student to CEO", so
they address a reader who may be an athlete, a student or both and who has no
capital, no team and no track record. ENT-103's risk material deliberately
argues for *small, survivable* risk rather than boldness, and its Module 3
handover on founder mental health after a business closes is load-bearing.
STU-303 and ENT-102/105 cover the same ground for a minor and for an adult
respectively; each file's docstring states the boundary and they must not be
collapsed. Where a file's ground is already covered for the other audience it
points at that course rather than repeating it. Keep that voice if they are
edited.

Five things in the ENT levels have to survive an edit. **ENT-114** teaches a
founder to study other people's businesses and deliberately states no revenue,
valuation or funding figure about a named real company as fact — the sources
it routes to are the company's own filings and statements, because a number
repeated from a profile is a rumour. **ENT-205, ENT-206 and ENT-207** (pricing,
selling and negotiating) are written so that nothing in them reads as a licence
to mislead a buyer; each states where persuasion stops and misrepresentation
begins, and that line is the lesson rather than a caveat on it.
**ENT-301…ENT-305** (entity choice, contracts, intellectual property, tax and
data) name no jurisdiction's rule as universal: each routes the reader to the
authority for the jurisdiction where their customer or their counterparty
actually is, and to a qualified professional before signing or filing, because
these rules differ by country and state and change. **ENT-311** (insurance and
risk transfer) and **ENT-313** (NIL and athlete-founder deals) follow PAR-301's
pattern — find and verify your own rules, quote no policy or bylaw as settled —
and **ENT-314** says plainly that a healthcare, financial or childcare idea is
regulated before it is a business, and that the regulator is the first call
rather than the last. **ENT-401 and ENT-402** (hiring and managing) route every
employment question to the law where the employee works, teach procedural
fairness before any dismissal, and keep the founder's duty of care in the frame
rather than treating people as a resourcing problem. Level 4's remaining courses
add four more. **ENT-403** (venture capital) states plainly that most businesses
should not raise equity, quotes no valuation, multiple or term as current, and
carries the advance-fee warning — a real investor never charges you to receive
their money. **ENT-406** (crisis) routes insolvency to a qualified professional
and says that continuing to trade while knowing the business cannot pay is what
turns a business failure into a personal one; its last lesson on the founder's
own state, including the crisis-line instruction, is load-bearing.
**ENT-409 and ENT-410** carry the catalog's financial disclaimer in its
strictest form — no product, rate or multiple named, tax routed to a qualified
adviser *early* because reliefs frequently need conditions met years in advance,
and post-exit depression signposted exactly as LS-401 signposts the end of a
career. **ENT-411** routes charity and social-enterprise law to the country's
regulator, says what being a trustee actually involves, and carries BM-204's
rule that people receiving help are never photographed or identified — that is
the course's ethical spine, not a presentation note.

**The Coaching Pathway (COH) opens a fifth audience: the coach**, usually
part-time, usually with no formal coach education, usually coaching the way they
were coached. COH-101 establishes the register and every other COH file refers
back to it. Three things run through all ten and must survive an edit.
**Safeguarding is named in the first module of the first course, not deferred** —
a coach holds power over minors, the duty of care comes before the sport, and no
philosophy justifies how somebody is treated. **Nothing is stated as a universal
rule**: required checks and training, safeguarding duties, codes of conduct,
concussion protocols, eligibility rules and crisis services all differ by
country, sport and governing body, so each is routed to the coach's own
governing body, club and national authority. And the pathway **refuses
intensity, fear and humiliation as coaching methods** throughout, because that
is what many readers were coached with and will otherwise reproduce.
Five files carry framings that a careless edit would invert. **COH-102** removes
welfare decisions from the pressure frame entirely — a suspected head injury,
pain, illness, heat and any safeguarding concern are settled in advance and
never weighed against the score. **COH-103**'s professional-boundaries lesson is
the most load-bearing in the pathway: communication in the open and never
privately with an individual child, no one-to-one situations, and the rules on
transport, changing rooms, contact, photography and social media are what make
closeness safe rather than bureaucracy weighed against it. **COH-104** forbids
stopping a clip to demonstrate an individual's error in front of their peers,
and begins every review with the coach's own mistakes. **COH-107**'s "absolute"
means *consistent, not severe* — the title invites the opposite reading — and it
rejects exercise as punishment and collective punishment explicitly.
**COH-108** is the pathway's most safety-critical file: recognition and routing
rather than treatment, with the crisis instruction repeated in every module, and
"trauma-informed" taught as a way of responding rather than a licence to ask a
child about their trauma. **COH-109** carries the duty to report another adult's
conduct, which is never weighed against the season, the club's reputation, a
friendship or the possibility of being wrong, and is never handled by speaking
to the person. **COH-110** treats the coach's own sustainability as a risk to
the athletes rather than self-care advice, because an exhausted coach reverts to
the default model.

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
from .stu_102 import HANDOUTS as STU_102_HANDOUTS
from .stu_102 import MODULES as STU_102
from .stu_103 import HANDOUTS as STU_103_HANDOUTS
from .stu_103 import MODULES as STU_103
from .stu_104 import HANDOUTS as STU_104_HANDOUTS
from .stu_104 import MODULES as STU_104
from .stu_105 import HANDOUTS as STU_105_HANDOUTS
from .stu_105 import MODULES as STU_105
from .stu_106 import HANDOUTS as STU_106_HANDOUTS
from .stu_106 import MODULES as STU_106
from .stu_107 import HANDOUTS as STU_107_HANDOUTS
from .stu_107 import MODULES as STU_107
from .stu_108 import HANDOUTS as STU_108_HANDOUTS
from .stu_108 import MODULES as STU_108
from .stu_109 import HANDOUTS as STU_109_HANDOUTS
from .stu_109 import MODULES as STU_109
from .stu_110 import HANDOUTS as STU_110_HANDOUTS
from .stu_110 import MODULES as STU_110
from .stu_111 import HANDOUTS as STU_111_HANDOUTS
from .stu_111 import MODULES as STU_111
from .stu_112 import HANDOUTS as STU_112_HANDOUTS
from .stu_112 import MODULES as STU_112
from .stu_113 import HANDOUTS as STU_113_HANDOUTS
from .stu_113 import MODULES as STU_113
from .stu_114 import HANDOUTS as STU_114_HANDOUTS
from .stu_114 import MODULES as STU_114
from .stu_115 import HANDOUTS as STU_115_HANDOUTS
from .stu_115 import MODULES as STU_115
from .stu_201 import HANDOUTS as STU_201_HANDOUTS
from .stu_201 import MODULES as STU_201
from .stu_202 import HANDOUTS as STU_202_HANDOUTS
from .stu_202 import MODULES as STU_202
from .stu_203 import HANDOUTS as STU_203_HANDOUTS
from .stu_203 import MODULES as STU_203
from .stu_204 import HANDOUTS as STU_204_HANDOUTS
from .stu_204 import MODULES as STU_204
from .stu_205 import HANDOUTS as STU_205_HANDOUTS
from .stu_205 import MODULES as STU_205
from .stu_206 import HANDOUTS as STU_206_HANDOUTS
from .stu_206 import MODULES as STU_206
from .stu_207 import HANDOUTS as STU_207_HANDOUTS
from .stu_207 import MODULES as STU_207
from .stu_208 import HANDOUTS as STU_208_HANDOUTS
from .stu_208 import MODULES as STU_208
from .stu_209 import HANDOUTS as STU_209_HANDOUTS
from .stu_209 import MODULES as STU_209
from .stu_301 import HANDOUTS as STU_301_HANDOUTS
from .stu_301 import MODULES as STU_301
from .stu_302 import HANDOUTS as STU_302_HANDOUTS
from .stu_302 import MODULES as STU_302
from .stu_303 import HANDOUTS as STU_303_HANDOUTS
from .stu_303 import MODULES as STU_303
from .stu_304 import HANDOUTS as STU_304_HANDOUTS
from .stu_304 import MODULES as STU_304
from .stu_305 import HANDOUTS as STU_305_HANDOUTS
from .stu_305 import MODULES as STU_305
from .stu_306 import HANDOUTS as STU_306_HANDOUTS
from .stu_306 import MODULES as STU_306
from .stu_307 import HANDOUTS as STU_307_HANDOUTS
from .stu_307 import MODULES as STU_307
from .stu_401 import HANDOUTS as STU_401_HANDOUTS
from .stu_401 import MODULES as STU_401
from .stu_402 import HANDOUTS as STU_402_HANDOUTS
from .stu_402 import MODULES as STU_402
from .stu_403 import HANDOUTS as STU_403_HANDOUTS
from .stu_403 import MODULES as STU_403
from .stu_404 import HANDOUTS as STU_404_HANDOUTS
from .stu_404 import MODULES as STU_404
from .stu_405 import HANDOUTS as STU_405_HANDOUTS
from .stu_405 import MODULES as STU_405
from .ent_101 import HANDOUTS as ENT_101_HANDOUTS
from .ent_101 import MODULES as ENT_101
from .ent_102 import HANDOUTS as ENT_102_HANDOUTS
from .ent_102 import MODULES as ENT_102
from .ent_103 import HANDOUTS as ENT_103_HANDOUTS
from .ent_103 import MODULES as ENT_103
from .ent_104 import HANDOUTS as ENT_104_HANDOUTS
from .ent_104 import MODULES as ENT_104
from .ent_105 import HANDOUTS as ENT_105_HANDOUTS
from .ent_105 import MODULES as ENT_105
from .ent_106 import HANDOUTS as ENT_106_HANDOUTS
from .ent_106 import MODULES as ENT_106
from .ent_107 import HANDOUTS as ENT_107_HANDOUTS
from .ent_107 import MODULES as ENT_107
from .ent_108 import HANDOUTS as ENT_108_HANDOUTS
from .ent_108 import MODULES as ENT_108
from .ent_109 import HANDOUTS as ENT_109_HANDOUTS
from .ent_109 import MODULES as ENT_109
from .ent_110 import HANDOUTS as ENT_110_HANDOUTS
from .ent_110 import MODULES as ENT_110
from .ent_111 import HANDOUTS as ENT_111_HANDOUTS
from .ent_111 import MODULES as ENT_111
from .ent_112 import HANDOUTS as ENT_112_HANDOUTS
from .ent_112 import MODULES as ENT_112
from .ent_113 import HANDOUTS as ENT_113_HANDOUTS
from .ent_113 import MODULES as ENT_113
from .ent_114 import HANDOUTS as ENT_114_HANDOUTS
from .ent_114 import MODULES as ENT_114
from .ent_201 import HANDOUTS as ENT_201_HANDOUTS
from .ent_201 import MODULES as ENT_201
from .ent_202 import HANDOUTS as ENT_202_HANDOUTS
from .ent_202 import MODULES as ENT_202
from .ent_203 import HANDOUTS as ENT_203_HANDOUTS
from .ent_203 import MODULES as ENT_203
from .ent_204 import HANDOUTS as ENT_204_HANDOUTS
from .ent_204 import MODULES as ENT_204
from .ent_205 import HANDOUTS as ENT_205_HANDOUTS
from .ent_205 import MODULES as ENT_205
from .ent_206 import HANDOUTS as ENT_206_HANDOUTS
from .ent_206 import MODULES as ENT_206
from .ent_207 import HANDOUTS as ENT_207_HANDOUTS
from .ent_207 import MODULES as ENT_207
from .ent_208 import HANDOUTS as ENT_208_HANDOUTS
from .ent_208 import MODULES as ENT_208
from .ent_209 import HANDOUTS as ENT_209_HANDOUTS
from .ent_209 import MODULES as ENT_209
from .ent_210 import HANDOUTS as ENT_210_HANDOUTS
from .ent_210 import MODULES as ENT_210
from .ent_211 import HANDOUTS as ENT_211_HANDOUTS
from .ent_211 import MODULES as ENT_211
from .ent_212 import HANDOUTS as ENT_212_HANDOUTS
from .ent_212 import MODULES as ENT_212
from .ent_213 import HANDOUTS as ENT_213_HANDOUTS
from .ent_213 import MODULES as ENT_213
from .ent_214 import HANDOUTS as ENT_214_HANDOUTS
from .ent_214 import MODULES as ENT_214
from .ent_301 import HANDOUTS as ENT_301_HANDOUTS
from .ent_301 import MODULES as ENT_301
from .ent_302 import HANDOUTS as ENT_302_HANDOUTS
from .ent_302 import MODULES as ENT_302
from .ent_303 import HANDOUTS as ENT_303_HANDOUTS
from .ent_303 import MODULES as ENT_303
from .ent_304 import HANDOUTS as ENT_304_HANDOUTS
from .ent_304 import MODULES as ENT_304
from .ent_305 import HANDOUTS as ENT_305_HANDOUTS
from .ent_305 import MODULES as ENT_305
from .ent_306 import HANDOUTS as ENT_306_HANDOUTS
from .ent_306 import MODULES as ENT_306
from .ent_307 import HANDOUTS as ENT_307_HANDOUTS
from .ent_307 import MODULES as ENT_307
from .ent_308 import HANDOUTS as ENT_308_HANDOUTS
from .ent_308 import MODULES as ENT_308
from .ent_309 import HANDOUTS as ENT_309_HANDOUTS
from .ent_309 import MODULES as ENT_309
from .ent_310 import HANDOUTS as ENT_310_HANDOUTS
from .ent_310 import MODULES as ENT_310
from .ent_311 import HANDOUTS as ENT_311_HANDOUTS
from .ent_311 import MODULES as ENT_311
from .ent_312 import HANDOUTS as ENT_312_HANDOUTS
from .ent_312 import MODULES as ENT_312
from .ent_313 import HANDOUTS as ENT_313_HANDOUTS
from .ent_313 import MODULES as ENT_313
from .ent_314 import HANDOUTS as ENT_314_HANDOUTS
from .ent_314 import MODULES as ENT_314
from .ent_315 import HANDOUTS as ENT_315_HANDOUTS
from .ent_315 import MODULES as ENT_315
from .ent_401 import HANDOUTS as ENT_401_HANDOUTS
from .ent_401 import MODULES as ENT_401
from .ent_402 import HANDOUTS as ENT_402_HANDOUTS
from .ent_402 import MODULES as ENT_402
from .ent_403 import HANDOUTS as ENT_403_HANDOUTS
from .ent_403 import MODULES as ENT_403
from .ent_404 import HANDOUTS as ENT_404_HANDOUTS
from .ent_404 import MODULES as ENT_404
from .ent_405 import HANDOUTS as ENT_405_HANDOUTS
from .ent_405 import MODULES as ENT_405
from .ent_406 import HANDOUTS as ENT_406_HANDOUTS
from .ent_406 import MODULES as ENT_406
from .ent_407 import HANDOUTS as ENT_407_HANDOUTS
from .ent_407 import MODULES as ENT_407
from .ent_408 import HANDOUTS as ENT_408_HANDOUTS
from .ent_408 import MODULES as ENT_408
from .ent_409 import HANDOUTS as ENT_409_HANDOUTS
from .ent_409 import MODULES as ENT_409
from .ent_410 import HANDOUTS as ENT_410_HANDOUTS
from .ent_410 import MODULES as ENT_410
from .ent_411 import HANDOUTS as ENT_411_HANDOUTS
from .ent_411 import MODULES as ENT_411
from .ent_412 import HANDOUTS as ENT_412_HANDOUTS
from .ent_412 import MODULES as ENT_412
from .coh_101 import HANDOUTS as COH_101_HANDOUTS
from .coh_101 import MODULES as COH_101
from .coh_102 import HANDOUTS as COH_102_HANDOUTS
from .coh_102 import MODULES as COH_102
from .coh_103 import HANDOUTS as COH_103_HANDOUTS
from .coh_103 import MODULES as COH_103
from .coh_104 import HANDOUTS as COH_104_HANDOUTS
from .coh_104 import MODULES as COH_104
from .coh_105 import HANDOUTS as COH_105_HANDOUTS
from .coh_105 import MODULES as COH_105
from .coh_106 import HANDOUTS as COH_106_HANDOUTS
from .coh_106 import MODULES as COH_106
from .coh_107 import HANDOUTS as COH_107_HANDOUTS
from .coh_107 import MODULES as COH_107
from .coh_108 import HANDOUTS as COH_108_HANDOUTS
from .coh_108 import MODULES as COH_108
from .coh_109 import HANDOUTS as COH_109_HANDOUTS
from .coh_109 import MODULES as COH_109
from .coh_110 import HANDOUTS as COH_110_HANDOUTS
from .coh_110 import MODULES as COH_110

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
    "STU-102": _with_handouts("STU-102", STU_102, STU_102_HANDOUTS),
    "STU-103": _with_handouts("STU-103", STU_103, STU_103_HANDOUTS),
    "STU-104": _with_handouts("STU-104", STU_104, STU_104_HANDOUTS),
    "STU-105": _with_handouts("STU-105", STU_105, STU_105_HANDOUTS),
    "STU-106": _with_handouts("STU-106", STU_106, STU_106_HANDOUTS),
    "STU-107": _with_handouts("STU-107", STU_107, STU_107_HANDOUTS),
    "STU-108": _with_handouts("STU-108", STU_108, STU_108_HANDOUTS),
    "STU-109": _with_handouts("STU-109", STU_109, STU_109_HANDOUTS),
    "STU-110": _with_handouts("STU-110", STU_110, STU_110_HANDOUTS),
    "STU-111": _with_handouts("STU-111", STU_111, STU_111_HANDOUTS),
    "STU-112": _with_handouts("STU-112", STU_112, STU_112_HANDOUTS),
    "STU-113": _with_handouts("STU-113", STU_113, STU_113_HANDOUTS),
    "STU-114": _with_handouts("STU-114", STU_114, STU_114_HANDOUTS),
    "STU-115": _with_handouts("STU-115", STU_115, STU_115_HANDOUTS),
    "STU-201": _with_handouts("STU-201", STU_201, STU_201_HANDOUTS),
    "STU-202": _with_handouts("STU-202", STU_202, STU_202_HANDOUTS),
    "STU-203": _with_handouts("STU-203", STU_203, STU_203_HANDOUTS),
    "STU-204": _with_handouts("STU-204", STU_204, STU_204_HANDOUTS),
    "STU-205": _with_handouts("STU-205", STU_205, STU_205_HANDOUTS),
    "STU-206": _with_handouts("STU-206", STU_206, STU_206_HANDOUTS),
    "STU-207": _with_handouts("STU-207", STU_207, STU_207_HANDOUTS),
    "STU-208": _with_handouts("STU-208", STU_208, STU_208_HANDOUTS),
    "STU-209": _with_handouts("STU-209", STU_209, STU_209_HANDOUTS),
    "STU-301": _with_handouts("STU-301", STU_301, STU_301_HANDOUTS),
    "STU-302": _with_handouts("STU-302", STU_302, STU_302_HANDOUTS),
    "STU-303": _with_handouts("STU-303", STU_303, STU_303_HANDOUTS),
    "STU-304": _with_handouts("STU-304", STU_304, STU_304_HANDOUTS),
    "STU-305": _with_handouts("STU-305", STU_305, STU_305_HANDOUTS),
    "STU-306": _with_handouts("STU-306", STU_306, STU_306_HANDOUTS),
    "STU-307": _with_handouts("STU-307", STU_307, STU_307_HANDOUTS),
    "STU-401": _with_handouts("STU-401", STU_401, STU_401_HANDOUTS),
    "STU-402": _with_handouts("STU-402", STU_402, STU_402_HANDOUTS),
    "STU-403": _with_handouts("STU-403", STU_403, STU_403_HANDOUTS),
    "STU-404": _with_handouts("STU-404", STU_404, STU_404_HANDOUTS),
    "STU-405": _with_handouts("STU-405", STU_405, STU_405_HANDOUTS),
    "ENT-101": _with_handouts("ENT-101", ENT_101, ENT_101_HANDOUTS),
    "ENT-102": _with_handouts("ENT-102", ENT_102, ENT_102_HANDOUTS),
    "ENT-103": _with_handouts("ENT-103", ENT_103, ENT_103_HANDOUTS),
    "ENT-104": _with_handouts("ENT-104", ENT_104, ENT_104_HANDOUTS),
    "ENT-105": _with_handouts("ENT-105", ENT_105, ENT_105_HANDOUTS),
    "ENT-106": _with_handouts("ENT-106", ENT_106, ENT_106_HANDOUTS),
    "ENT-107": _with_handouts("ENT-107", ENT_107, ENT_107_HANDOUTS),
    "ENT-108": _with_handouts("ENT-108", ENT_108, ENT_108_HANDOUTS),
    "ENT-109": _with_handouts("ENT-109", ENT_109, ENT_109_HANDOUTS),
    "ENT-110": _with_handouts("ENT-110", ENT_110, ENT_110_HANDOUTS),
    "ENT-111": _with_handouts("ENT-111", ENT_111, ENT_111_HANDOUTS),
    "ENT-112": _with_handouts("ENT-112", ENT_112, ENT_112_HANDOUTS),
    "ENT-113": _with_handouts("ENT-113", ENT_113, ENT_113_HANDOUTS),
    "ENT-114": _with_handouts("ENT-114", ENT_114, ENT_114_HANDOUTS),
    "ENT-201": _with_handouts("ENT-201", ENT_201, ENT_201_HANDOUTS),
    "ENT-202": _with_handouts("ENT-202", ENT_202, ENT_202_HANDOUTS),
    "ENT-203": _with_handouts("ENT-203", ENT_203, ENT_203_HANDOUTS),
    "ENT-204": _with_handouts("ENT-204", ENT_204, ENT_204_HANDOUTS),
    "ENT-205": _with_handouts("ENT-205", ENT_205, ENT_205_HANDOUTS),
    "ENT-206": _with_handouts("ENT-206", ENT_206, ENT_206_HANDOUTS),
    "ENT-207": _with_handouts("ENT-207", ENT_207, ENT_207_HANDOUTS),
    "ENT-208": _with_handouts("ENT-208", ENT_208, ENT_208_HANDOUTS),
    "ENT-209": _with_handouts("ENT-209", ENT_209, ENT_209_HANDOUTS),
    "ENT-210": _with_handouts("ENT-210", ENT_210, ENT_210_HANDOUTS),
    "ENT-211": _with_handouts("ENT-211", ENT_211, ENT_211_HANDOUTS),
    "ENT-212": _with_handouts("ENT-212", ENT_212, ENT_212_HANDOUTS),
    "ENT-213": _with_handouts("ENT-213", ENT_213, ENT_213_HANDOUTS),
    "ENT-214": _with_handouts("ENT-214", ENT_214, ENT_214_HANDOUTS),
    "ENT-301": _with_handouts("ENT-301", ENT_301, ENT_301_HANDOUTS),
    "ENT-302": _with_handouts("ENT-302", ENT_302, ENT_302_HANDOUTS),
    "ENT-303": _with_handouts("ENT-303", ENT_303, ENT_303_HANDOUTS),
    "ENT-304": _with_handouts("ENT-304", ENT_304, ENT_304_HANDOUTS),
    "ENT-305": _with_handouts("ENT-305", ENT_305, ENT_305_HANDOUTS),
    "ENT-306": _with_handouts("ENT-306", ENT_306, ENT_306_HANDOUTS),
    "ENT-307": _with_handouts("ENT-307", ENT_307, ENT_307_HANDOUTS),
    "ENT-308": _with_handouts("ENT-308", ENT_308, ENT_308_HANDOUTS),
    "ENT-309": _with_handouts("ENT-309", ENT_309, ENT_309_HANDOUTS),
    "ENT-310": _with_handouts("ENT-310", ENT_310, ENT_310_HANDOUTS),
    "ENT-311": _with_handouts("ENT-311", ENT_311, ENT_311_HANDOUTS),
    "ENT-312": _with_handouts("ENT-312", ENT_312, ENT_312_HANDOUTS),
    "ENT-313": _with_handouts("ENT-313", ENT_313, ENT_313_HANDOUTS),
    "ENT-314": _with_handouts("ENT-314", ENT_314, ENT_314_HANDOUTS),
    "ENT-315": _with_handouts("ENT-315", ENT_315, ENT_315_HANDOUTS),
    "ENT-401": _with_handouts("ENT-401", ENT_401, ENT_401_HANDOUTS),
    "ENT-402": _with_handouts("ENT-402", ENT_402, ENT_402_HANDOUTS),
    "ENT-403": _with_handouts("ENT-403", ENT_403, ENT_403_HANDOUTS),
    "ENT-404": _with_handouts("ENT-404", ENT_404, ENT_404_HANDOUTS),
    "ENT-405": _with_handouts("ENT-405", ENT_405, ENT_405_HANDOUTS),
    "ENT-406": _with_handouts("ENT-406", ENT_406, ENT_406_HANDOUTS),
    "ENT-407": _with_handouts("ENT-407", ENT_407, ENT_407_HANDOUTS),
    "ENT-408": _with_handouts("ENT-408", ENT_408, ENT_408_HANDOUTS),
    "ENT-409": _with_handouts("ENT-409", ENT_409, ENT_409_HANDOUTS),
    "ENT-410": _with_handouts("ENT-410", ENT_410, ENT_410_HANDOUTS),
    "ENT-411": _with_handouts("ENT-411", ENT_411, ENT_411_HANDOUTS),
    "ENT-412": _with_handouts("ENT-412", ENT_412, ENT_412_HANDOUTS),
    "COH-101": _with_handouts("COH-101", COH_101, COH_101_HANDOUTS),
    "COH-102": _with_handouts("COH-102", COH_102, COH_102_HANDOUTS),
    "COH-103": _with_handouts("COH-103", COH_103, COH_103_HANDOUTS),
    "COH-104": _with_handouts("COH-104", COH_104, COH_104_HANDOUTS),
    "COH-105": _with_handouts("COH-105", COH_105, COH_105_HANDOUTS),
    "COH-106": _with_handouts("COH-106", COH_106, COH_106_HANDOUTS),
    "COH-107": _with_handouts("COH-107", COH_107, COH_107_HANDOUTS),
    "COH-108": _with_handouts("COH-108", COH_108, COH_108_HANDOUTS),
    "COH-109": _with_handouts("COH-109", COH_109, COH_109_HANDOUTS),
    "COH-110": _with_handouts("COH-110", COH_110, COH_110_HANDOUTS),
}
