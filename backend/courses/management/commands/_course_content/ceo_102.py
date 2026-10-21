"""CEO-102: Academic Leverage & Collegiate Eligibility Architecture.

Level 1: Foundational Executive Readiness. Written against the course's focus
(aligning academic progress with long-term career optionality) and its core
competencies: NCAA Clearinghouse rules, high school state association
regulations, credit-to-GPA optimization, and leveraging school and university
academic resources for professional advantage.

Eligibility rules change between academic years, and every lesson here says so
and points at the NCAA Eligibility Center and the student's own state
association rather than presenting a requirement as permanent.
"""

MODULES = [
    {
        "title": "Eligibility as Architecture",
        "description": (
            "Frames eligibility as a structure built over four years rather than paperwork "
            "filed in senior year."
        ),
        "lessons": [
            {
                "title": "The Most Expensive Mistake in High School Sport",
                "description": "Why eligibility problems are almost always discovered too late to fix.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Nobody loses eligibility in a day

An athlete does not become ineligible in senior year. They become ineligible in
a quiet decision made two years earlier — a course swapped for an easier one, a
semester repeated in a way that did not count, a credit taken from a provider
that was never approved.

The damage shows up at the worst possible moment, after film is out and coaches
are calling, when the only remaining options are expensive and slow.

## Architecture, not paperwork

Treat eligibility the way an engineer treats a building: as a structure with
load-bearing elements that must be placed in the right order and cannot be
added at the end.

- **Load-bearing**: the specific courses that count, taken in the right years.
- **Finishing work**: registration forms, transcript requests, final
  verification. Important, quick, and useless if the structure underneath is
  wrong.

Most athletic families invert this. They worry about the forms, which take an
afternoon, and improvise the courses, which take four years.

## Three authorities, not one

Your eligibility answers to at least three separate rulebooks, and they do not
match each other:

1. Your **high school's** graduation requirements.
2. Your **state association's** athletic eligibility rules.
3. The **college association** you are aiming at — NCAA, NAIA or NJCAA.

Satisfying one does not satisfy the others. Module 2 and Module 3 take the two
you are least likely to have read.
""",
            },
            {
                "title": "Building the Four-Year Map",
                "description": "Laying every requirement onto one grid of eight semesters.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## One grid, eight semesters

The tool for this course is a single grid: eight semesters across, your courses
down, and three requirement columns beside them — graduation, state association,
college association.

Every course you take goes in one cell. Every requirement gets ticked by a
specific course in a specific semester. A requirement with no course against it
is visible immediately, which is the entire point.

## Build it backwards

Start from the end and work back:

1. **The college association's core-course list.** The longest lead time and
   the least flexibility.
2. **Graduation requirements** your school will not waive.
3. **Everything else** — electives, advanced courses, anything that serves
   optionality rather than compliance.

## Three rules for the grid

- **Front-load the core.** College associations commonly require a large share
  of core courses finished before senior year begins. A plan that leaves core
  coursework to the last two semesters is fragile even when it is legal.
- **No credit lands without approval.** Online courses, summer credit and
  credit recovery all have to come from an approved provider and be recorded by
  your school. Confirm *before* enrolling, never after.
- **Date every verification.** Write down who told you and when. Rules change
  between academic years, and an answer from two years ago is not an answer.

## Who checks it with you

The grid is reviewed twice a year with your school counsellor, and once a year
with somebody who has moved an athlete through this process before.
""",
            },
            {
                "title": "Four-Year Eligibility Grid (Template)",
                "description": "Eight-semester planning grid with graduation, state and college requirement columns.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable grid for Module 1. Eight semester columns run across the top; your
courses run down the side, each with credit value and grade. Three requirement
columns sit beside them — high school graduation, state association, college
association — so a requirement with nothing against it is obvious at a glance.

A verification log runs underneath: every rule you confirmed, who confirmed it,
the date and the source, because an answer from a previous academic year is not
an answer.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Your Four-Year Eligibility Grid, Version One",
            "description": (
                "Build the first version of your grid. It will be wrong in places; that is what "
                "later modules are for.\n\n"
                "Submit:\n"
                "1. The grid itself, with every course you have already completed placed in the "
                "semester you took it, including grades and credit values.\n"
                "2. Your remaining semesters, planned as far as you can today.\n"
                "3. Three requirement columns: your school's graduation requirements, your state "
                "association's athletic eligibility rules, and the core-course list of the "
                "college association you are most likely to target.\n"
                "4. A gaps list. Every requirement with no course against it yet, and every "
                "requirement you could not find an answer for.\n"
                "5. A verification log with at least two entries — a rule you confirmed, who "
                "told you, and the date.\n\n"
                "Graded on completeness of the history, honesty of the gaps list, and whether "
                "the verification log cites real sources with dates."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Eligibility as Architecture",
            "description": "Four questions on the architecture frame and the four-year grid.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which three rulebooks does the lesson say a high school athlete answers to?",
                    "choices": [
                        "The school's graduation requirements, the state association, and the college association",
                        "The NCAA, the FTC, and the school district",
                        "The team's coaching staff, the league office, and the NCAA",
                        "The state association, the school board, and the athlete's future university",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does the lesson call the “load-bearing” part of eligibility?",
                    "choices": [
                        "Registration forms and transcript requests",
                        "Final-year verification with the eligibility centre",
                        "The specific courses that count, taken in the right years",
                        "The athlete's standardized test scores",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Before enrolling in an online or credit-recovery course, what does the course tell you to do?",
                    "choices": [
                        "Enrol first and ask the school to record it afterwards",
                        "Confirm in advance that the provider is approved and the credit will be recorded",
                        "Avoid them entirely — no online credit ever counts",
                        "Ask a teammate who has taken the same course",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course insist every verification is dated in a log?",
                    "choices": [
                        "The eligibility centre requires a dated log at registration",
                        "Coaches ask to see it during official visits",
                        "Rules change between academic years, so an old answer is not an answer",
                        "It is needed to appeal a failed course",
                    ],
                    "answer": 2,
                },
            ],
        },
    },
    {
        "title": "The NCAA Eligibility Center",
        "description": (
            "How registration, approved core courses and the academic standards actually work, "
            "and how to check the current version of each."
        ),
        "lessons": [
            {
                "title": "Registration, Accounts and the Core-Course List",
                "description": "What the Eligibility Center is, when to open an account, and where your school's approved list lives.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## What the Eligibility Center actually does

The NCAA Eligibility Center certifies two things about a prospective college
athlete: academic qualification and amateurism status. It is not a recruiting
service and it has no view on how good you are. It reads your transcript against
a list and returns a status.

## The account

There are two account types — a **Certification Account** for athletes
expecting to compete in Division I or II, and a **Profile Page** for athletes
whose destination is less certain or who are heading to Division III. The
profile can be upgraded later.

Open it early. Sophomore year is normal; the cost of opening it too soon is a
few minutes, and the cost of opening it too late is discovering a problem with
no time left.

## Your school's approved core-course list

This is the document most athletes have never seen. Every high school has a list
of its own courses that the NCAA has approved as core courses, published under
the school's own code. A course with a serious-sounding name is not a core
course because it sounds academic. It is a core course because it is on that
list.

Two things follow:

- Check the list **before** choosing next year's courses, not after.
- A course taken outside your school — summer, online, another district — is
  only core if it appears on **that provider's** approved list and is recorded
  properly on your transcript.

Everything in this lesson is verifiable at the Eligibility Center's own site,
and verifying it yourself for the current academic year is part of this
module's assignment.
""",
            },
            {
                "title": "Core Courses, GPA and Standards That Change",
                "description": "The shape of the Division I and II academic standards, and why the current numbers must be checked each year.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The shape of the standard

Across recent years the Division I and Division II academic standards have
shared the same three-part shape. Learn the shape; verify the numbers.

**1. A number of core courses.** Sixteen, distributed across English,
mathematics (Algebra I or higher), natural or physical science, social science
and additional academic subjects.

**2. A timing requirement in Division I.** A share of those core courses — ten,
including seven in English, maths and science — must be completed before the
start of the seventh semester, which is the beginning of senior year. Once that
semester starts, those grades are locked: a core course cannot be repeated to
raise the mark it contributed.

**3. A minimum core-course GPA.** Calculated only from approved core courses,
using the NCAA's own scale — not your school's weighted GPA, and not your
overall GPA.

## Why the numbers move

Standards are revised by vote. The standardized-test requirement, for instance,
was a fixture of the model for decades and was then removed. An athlete
operating from a coach's memory of their own recruitment is working from a
rulebook that may no longer exist.

## The only safe habit

Check the current requirements on the Eligibility Center's site at the start of
each academic year, write the date on your grid, and ask your counsellor to
confirm the same figures. Two independent sources, both dated. That habit is
worth more than memorising any single number in this lesson.
""",
            },
            {
                "title": "Eligibility Center Checklist (Printable)",
                "description": "Step-by-step registration checklist and a core-course audit sheet.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable checklist for Module 2. Page one walks the registration sequence:
account type, the information to have on hand, transcript submission points, and
the year-by-year moments to log back in.

Page two is the core-course audit: your school's approved list copied into
subject rows, each with the courses you have completed, the courses planned, the
semester each falls in, and a running count against the sixteen-course structure
described in the lesson. Both pages carry a dated verification line, because the
current requirements must be confirmed each academic year.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Core-Course Audit and Registration Status",
            "description": (
                "This assignment requires using real sources, not the lesson text.\n\n"
                "Submit:\n"
                "1. Your school's approved core-course list for the current year, with the "
                "source and the date you retrieved it.\n"
                "2. A core-course audit: every core course you have completed by subject, with "
                "grades, and every core course planned for each remaining semester.\n"
                "3. The current Division I and Division II academic requirements as published "
                "today, with the date you checked and the source. Do not copy the numbers from "
                "the lesson.\n"
                "4. Your registration status: which account type you hold or will open, and the "
                "date you opened it or will open it.\n"
                "5. A risk paragraph. Name the single biggest eligibility risk in your plan "
                "right now and the specific action that reduces it.\n\n"
                "Graded on the use of current, dated sources, the completeness of the audit, and "
                "whether the risk you name is the real one."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Eligibility Center",
            "description": "Four questions on registration, core courses and verifying current standards.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What makes a high school class a “core course” for NCAA purposes?",
                    "choices": [
                        "It appears on that school's NCAA-approved core-course list",
                        "It is an honours or advanced-placement class",
                        "It carries at least one full credit",
                        "A counsellor describes it as academically rigorous",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which two things does the Eligibility Center certify?",
                    "choices": [
                        "Athletic ability and academic qualification",
                        "Academic qualification and amateurism status",
                        "Amateurism status and financial need",
                        "Graduation progress and state association compliance",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the lesson say to learn the shape of the standards but verify the numbers every year?",
                    "choices": [
                        "The numbers differ between individual universities",
                        "Counsellors are not permitted to quote figures",
                        "Standards are revised by vote and requirements have been changed or removed before",
                        "The figures only apply to athletes in revenue sports",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the Division I timing requirement mean for a core course once senior year has begun?",
                    "choices": [
                        "It can be repeated at any point before graduation to raise the grade",
                        "Grades from courses that had to be completed beforehand are locked",
                        "All core courses must be retaken in the final semester",
                        "Summer credit automatically replaces the lowest grade",
                    ],
                    "answer": 1,
                },
            ],
        },
    },
    {
        "title": "State Association Rules",
        "description": (
            "The rulebook closest to home: transfer, residency, age, academic and participation "
            "rules set by your state association."
        ),
        "lessons": [
            {
                "title": "The Rulebook Nobody Reads",
                "description": "What state associations govern, and the five areas where athletes most often get caught.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Closer to home, and stricter

Every state has an association governing high school athletics. It decides
whether you are eligible to play *this Friday* — a far more immediate question
than college certification, and governed by an entirely different rulebook.

Associations differ from each other substantially. A rule that is routine in one
state is a forfeited season in the next, which is why advice from an athlete in
another state is worth very little here.

## The five areas that catch people

**1. Academic standing.** Most associations require passing a minimum number of
courses in the previous grading period. The period matters: an athlete can be
academically fine on the year and ineligible on the quarter.

**2. Transfer and residency.** Changing schools without a corresponding change
of residence is the single most common eligibility problem in high school sport,
and it often carries a sit-out period.

**3. Age and semesters of participation.** Associations cap both an athlete's
age in a given school year and the number of semesters or seasons they may
compete.

**4. Amateurism and outside competition.** Playing for a non-school team during
the school season, or accepting payment or prizes, can affect standing — and the
state rule here is often tighter than the college one.

**5. Recruiting and undue influence.** Contact rules that bind coaches and,
indirectly, families.

## The habit

Find your association's handbook, locate these five sections, and read them
once a year. It takes an hour, it is free, and it is the single highest-return
hour in this course.
""",
            },
            {
                "title": "When Two Rulebooks Disagree",
                "description": "Resolving conflicts between state, school and college rules — and who actually answers the question.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Conflicts are normal

State rules, school policy and college association rules overlap without
matching. A few familiar collisions:

- A summer league your college association has no issue with, but your state
  association treats as outside competition during a restricted period.
- A credit-recovery course your school accepts for graduation but that is not on
  the approved core list.
- A name, image and likeness arrangement permitted by one body and restricted
  for high school athletes by another.

## The resolution rule

**You must satisfy every rulebook that applies to you, not the most generous
one.** Permission in one place is never a defence in another. If your state
association prohibits something, a college coach saying it is fine changes
nothing about Friday's game.

## Who actually answers

Direct the question to the body whose rule it is, through the person whose job
it is:

- *Can I play on this club team in season?* → your athletic director, who asks
  the state association.
- *Does this course count as core?* → your counsellor, against the approved list.
- *Does this payment affect my standing?* → your athletic director **and** the
  college association, separately.

## Get it in writing

Email beats conversation, every time. Not because people lie, but because
memories fade and staff change. A dated reply in writing from the person
responsible is the only form of answer worth relying on, and it belongs in the
verification log from Module 1.
""",
            },
            {
                "title": "State Rules Briefing Sheet",
                "description": "Worksheet for recording your own association's rules in the five high-risk areas.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable briefing sheet for Module 3. Five sections mirror the high-risk areas —
academic standing, transfer and residency, age and semesters, amateurism and
outside competition, recruiting contact — each with space for the rule in your
own words, the handbook section number, and the date you read it.

A conflicts table follows: the rule, the two bodies that disagree, which
interpretation is stricter, and the dated written answer from the person
responsible.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Your State Association Briefing",
            "description": (
                "Research your own state association and brief it back in plain language.\n\n"
                "Submit:\n"
                "1. The name of your state association and a link to the handbook or bylaws you "
                "used, with the date you accessed it.\n"
                "2. A summary of its rules in each of the five high-risk areas: academic "
                "standing, transfer and residency, age and semesters of participation, "
                "amateurism and outside competition, recruiting contact. Cite the section number "
                "for each.\n"
                "3. One conflict. Identify a rule where your state association is stricter than "
                "your college association of interest, or where your school's policy and the "
                "state rule do not line up. Explain which one binds you and why.\n"
                "4. One written question. Email a real question to your athletic director this "
                "week and include the question you sent. The reply, when it arrives, goes in "
                "your verification log.\n\n"
                "Graded on the accuracy of the citations, the plain-language quality of the "
                "summaries, and whether the conflict you identified is genuine."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: State Association Rules",
            "description": "Four questions on state rules and resolving conflicts between rulebooks.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "When two rulebooks that apply to you disagree, what does the course say you must do?",
                    "choices": [
                        "Follow the more generous rule, since permission exists somewhere",
                        "Ask a college coach to decide which applies",
                        "Follow whichever rulebook was published most recently",
                        "Satisfy every rulebook that applies to you",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Which of the following is named as the most common eligibility problem in high school sport?",
                    "choices": [
                        "Transferring schools without a corresponding change of residence",
                        "Failing a standardized test",
                        "Competing in two sports in the same season",
                        "Missing the Eligibility Center registration deadline",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does the course say advice from an athlete in another state is worth very little?",
                    "choices": [
                        "Out-of-state athletes rarely understand the NCAA rules",
                        "State associations differ substantially, so a routine rule in one state can cost a season in another",
                        "State rules only apply to athletes in their senior year",
                        "Other states publish their handbooks in a different format",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What form of answer does the lesson say is the only one worth relying on?",
                    "choices": [
                        "A verbal confirmation from a head coach",
                        "A screenshot of the handbook page",
                        "A dated written reply from the person responsible for that rule",
                        "A group chat consensus among teammates",
                    ],
                    "answer": 2,
                },
            ],
        },
    },
    {
        "title": "Credit-to-GPA Optimization",
        "description": (
            "Reading a transcript the way an admissions office and an eligibility centre read "
            "it, and planning courses so one transcript serves both."
        ),
        "lessons": [
            {
                "title": "The Three GPAs You Actually Have",
                "description": "Weighted, unweighted and core-course GPA — and who reads which.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## One transcript, three different numbers

Athletes talk about "my GPA" as if it were a single figure. It is at least
three, and the one that matters depends entirely on who is reading.

**Weighted GPA.** Your school's internal number, inflated by honours and
advanced courses according to your school's own scale. Useful for class rank.
Carries limited weight outside your district.

**Unweighted GPA.** The flat four-point version. Admissions offices often
recalculate to this so that applicants from different schools can be compared.

**Core-course GPA.** The eligibility centre's number, calculated only from
approved core courses on its own scale. An A in a course that is not core does
not appear in it at all.

## The consequence

A transcript can be excellent on one number and thin on another. The familiar
version: a strong weighted GPA built partly on electives, with a core GPA sitting
noticeably lower, discovered in the term when there is no room left to move it.

## Track all three from year one

Keep the three figures side by side on your eligibility grid and update them
every report card. Five minutes a term. It converts the most common eligibility
shock in high school sport into something you watch coming two years out.
""",
            },
            {
                "title": "Where Grade Points Are Actually Won",
                "description": "Course selection, timing and recovery — the three levers, in order of usefulness.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Three levers, very unequal

**Lever one: selection, used early.** Which courses you take, and when, is worth
more than anything else and costs nothing to change in the spring before the
year starts. A balanced schedule that spreads demanding core courses across
semesters beats a heroic one that stacks three of them against your competitive
season.

**Lever two: timing.** Pair a demanding core course with your lightest athletic
block where your school allows it. Module 3 of CEO-101 called this an energy
collision; on a transcript it shows up as a grade.

**Lever three: recovery, used late and sparingly.** Repeating a course,
credit recovery, summer school. These work, with three conditions: the provider
must be approved, the credit must be recorded correctly by your school, and the
repeat must happen before any applicable timing deadline. Recovery used as a
plan rather than a repair is a warning sign.

## The optionality test

For each course you are considering, ask: **if sport stopped tomorrow, would
this course still be worth having taken?** The honest answer sorts your schedule
quickly. Courses that pass build a transcript that works twice — once for
eligibility and once for the career that follows.

## What not to optimise

Do not build a schedule you cannot survive. A plan that produces a 3.9 and a
burnt-out athlete in March has optimised the wrong variable, and the next course
in this pathway spends a whole module on why.
""",
            },
            {
                "title": "Transcript and GPA Tracker",
                "description": "Spreadsheet-style tracker for the three GPAs, course selection scoring and recovery decisions.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable tracker for Module 4. The first sheet lists every completed course with
credit value, grade, whether it is core, and the three running GPA calculations
— weighted, unweighted and core — updated each report card.

The second sheet scores next year's candidate courses: core or not, demand
level, which semester it lands in, the athletic block it collides with, and the
optionality test. The third is a short recovery decision log for any repeated or
summer credit, recording the provider, its approval status, and the date the
school confirmed the credit would be recorded.""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Transcript Analysis and Next-Year Schedule",
            "description": (
                "Analyse the transcript you have, then plan the schedule you need.\n\n"
                "Submit:\n"
                "1. All three of your current GPAs — weighted, unweighted and core — each with "
                "the calculation you used. Show your work for the core GPA; it is the one most "
                "students get wrong.\n"
                "2. The gap analysis. If your three numbers differ meaningfully, explain why in "
                "terms of specific courses.\n"
                "3. Next year's proposed schedule, course by course, marking each as core or "
                "not, noting the semester, and giving each course a one-line answer to the "
                "optionality test: if sport stopped tomorrow, would this still be worth having "
                "taken?\n"
                "4. Collision check. Identify any demanding core course that lands on top of "
                "your competitive season and state what you are doing about it.\n"
                "5. If you are planning any repeated, summer or online credit, name the provider "
                "and state whether you have confirmed it is approved and will be recorded.\n\n"
                "Graded on the correctness of the core GPA calculation, the realism of the "
                "schedule, and the quality of the optionality answers."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: Credit and GPA",
            "description": "Four questions on the three GPAs and the three levers of course planning.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Which GPA does an eligibility centre calculate from approved core courses only, on its own scale?",
                    "choices": ["Weighted GPA", "Unweighted GPA", "Class-rank GPA", "Core-course GPA"],
                    "answer": 3,
                },
                {
                    "text": "Which lever does the lesson say is worth the most and costs the least to use?",
                    "choices": [
                        "Course selection, used early",
                        "Credit recovery, used late",
                        "Repeating courses over the summer",
                        "Appealing grades at the end of a term",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the “optionality test” applied to a course under consideration?",
                    "choices": [
                        "Does it raise my weighted GPA more than my unweighted GPA?",
                        "If sport stopped tomorrow, would this course still be worth having taken?",
                        "Will a college coach recognise the course name?",
                        "Can it be completed online if the season runs long?",
                    ],
                    "answer": 1,
                },
                {
                    "text": "The lesson describes credit recovery as acceptable under three conditions. Which of the following is NOT one of them?",
                    "choices": [
                        "The provider is approved",
                        "The credit is recorded correctly by your school",
                        "The repeat happens before any applicable timing deadline",
                        "The original grade is removed from the transcript entirely",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Working the Resource Room",
        "description": (
            "Turning counsellors, tutoring, teachers and campus academic support into a system "
            "you use deliberately rather than in a crisis."
        ),
        "lessons": [
            {
                "title": "The Resources Already Paid For",
                "description": "What exists inside most schools, and why athletes use it last.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Already yours

Almost every school and university carries academic support that costs the
student nothing: counselling, subject tutoring, writing centres, study hall,
office hours, testing accommodation, library research help, and in universities
a dedicated academic support unit for athletes.

Athletes use these last, for three predictable reasons: the schedule collides
with practice, asking feels like admitting weakness, and nobody ever explained
how to ask.

## Reframe the ask

A chief executive does not apologise for using the staff. **"I need help" is a
weak opening; "here is what I am trying to achieve and where I am stuck" is a
brief.** The second gets better help because it is answerable.

Compare:

- *"I'm struggling in chemistry."*
- *"I have a 68 in chemistry, the stoichiometry unit is where I lost it, there's
  a test on the 14th, and I'm free Tuesday and Thursday after 4. Can we work
  through that unit?"*

The second takes thirty seconds longer to say and changes what comes back.

## Office hours are the undervalued asset

The teacher who writes your test is available, free, and usually unbooked. One
visit before a unit test is worth more than several hours of unguided revision,
and it has a second effect: the person deciding borderline marks and writing
recommendation letters now knows who you are and what you are carrying.
""",
            },
            {
                "title": "Building a Support Schedule That Survives the Season",
                "description": "Scheduling help in advance, and the three conversations to have before the season starts.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Book support before you need it

Help scheduled in a crisis is rationed, rushed and late. Help scheduled in
advance is routine. Put a standing academic block in your week — the same way
Module 3 of CEO-101 protects a training block — and keep it even in the weeks
you feel fine. The weeks you feel fine are what pay for the weeks you do not.

## Three conversations before each season

**1. With each teacher, in the first fortnight.** Hand them your competition
schedule. Ask one question: *what is the best way to stay current with your
class when I travel?* You are not asking for leniency. You are asking for a
procedure, and most teachers have one.

**2. With your counsellor, twice a year.** Bring the eligibility grid. Ask them
to find the gap you have missed, and date the answer in your log.

**3. With your coach, once.** Name the academic block you are protecting and
when it falls. A coach who learns about it from a conflict will treat it as an
excuse; a coach who learns about it in August usually works around it.

## Travel protocol

Agree it in writing in advance: what you submit before leaving, what is due on
return, how a missed assessment is made up. An athlete with a written travel
protocol and a plane delay has an administrative inconvenience. An athlete
without one has a zero.
""",
            },
            {
                "title": "Academic Support Plan (Worksheet)",
                "description": "Planner for standing support blocks, teacher conversations and the travel protocol.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable planner for Module 5. Page one maps the support available to you —
tutoring, writing centre, office hours, study hall, counselling — with times,
locations and the standing weekly block you have chosen to protect.

Page two holds the three pre-season conversations with space to record what each
teacher, your counsellor and your coach agreed, and a written travel protocol
template: what is submitted before departure, what is due on return, and how a
missed assessment is made up.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Academic Support Plan and Two Real Conversations",
            "description": (
                "Part of this assignment happens in person. Plan it, then do it.\n\n"
                "Submit:\n"
                "1. A map of the academic support available to you, with times and locations. "
                "Include at least four resources and note which you have used in the last year.\n"
                "2. Your standing academic block: day, time, length, and what it is protected "
                "against.\n"
                "3. Evidence of two real conversations held this fortnight — one with a teacher "
                "and one with a counsellor or academic adviser. For each: what you asked, in the "
                "brief format from the lesson, and what was agreed.\n"
                "4. Your written travel protocol for the coming season.\n"
                "5. One paragraph on a time you did not ask for help and what it cost.\n\n"
                "Graded on whether the conversations happened and were framed as briefs rather "
                "than apologies, and on whether the travel protocol is specific enough to be "
                "followed by someone else."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: Academic Support",
            "description": "Four questions on using academic resources deliberately.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "How does the lesson tell you to frame a request for academic help?",
                    "choices": [
                        "As an apology for falling behind",
                        "As a brief: what you are trying to achieve and exactly where you are stuck",
                        "Through a parent, so the teacher takes it seriously",
                        "Only after a failing grade is recorded",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What single question does the course tell you to ask each teacher in the first fortnight of a season?",
                    "choices": [
                        "Can I have extra time on assignments during the season?",
                        "Will you tell my coach if I fall behind?",
                        "What is the best way to stay current with your class when I travel?",
                        "Can this class be moved out of my season?",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does the course say to keep the standing academic block even in weeks when you feel fine?",
                    "choices": [
                        "Attendance is tracked by the state association",
                        "The weeks you feel fine pay for the weeks you do not",
                        "Tutors will not accept irregular bookings",
                        "It is required to maintain eligibility",
                    ],
                    "answer": 1,
                },
                {
                    "text": "According to the lesson, what is the difference a written travel protocol makes when a flight is delayed?",
                    "choices": [
                        "It converts a zero into an administrative inconvenience",
                        "It transfers responsibility to the coaching staff",
                        "It guarantees an extension under state rules",
                        "It removes the assessment from the grade book",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Optionality: The Transcript That Works Twice",
        "description": (
            "The capstone: choosing coursework that keeps professional doors open whether or "
            "not the athletic path continues."
        ),
        "lessons": [
            {
                "title": "Planning for the Version of You Who Stops Playing",
                "description": "Why optionality is the correct objective, and the three doors a transcript can hold open.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The honest arithmetic

Of the athletes competing in high school, only a small minority compete in
college, and a far smaller minority are paid to compete afterwards. That is not
discouragement — somebody is in that minority, and the work in this pathway is
how you make it likelier. It is a planning fact. Every plan has to work in both
outcomes, because you cannot know in advance which one you are in.

**Optionality** is the objective: arranging your academic record so that more
futures remain available at every decision point, at the lowest possible cost to
the athletic plan.

## Three doors worth holding open

**1. The quantitative door.** Mathematics through the highest level you can
handle well, and at least one lab science. These are the prerequisites that
cannot be added quickly later; nearly every technical, medical, financial and
engineering path runs through them.

**2. The communication door.** Writing, argument, a second language, anything
that requires you to produce and defend an idea. Every career in CEO-301 and
CEO-304 — agency, business, media, foundation work — is bought with this.

**3. The credential door.** Certifications, dual-enrolment credit, portfolio
work. Things that are worth something on their own, independent of any
institution admitting you.

## The cost question

Optionality is not "take everything hard". It is deliberate purchase: each door
costs hours, and you are budgeting against the matrix from CEO-101. A door you
cannot afford to hold open properly is a door you drop on purpose, in writing —
not one you lose by accident.
""",
            },
            {
                "title": "The Academic Leverage Brief",
                "description": "Assembling the whole course into one document, and the annual review that keeps it true.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## One page, four sections

The deliverable of CEO-102 is a single page that any adviser can act on.

**Section 1 — Position.** Three GPAs, core-course count by subject, and credits
completed against requirement.

**Section 2 — Compliance.** Your eligibility status across all three rulebooks,
each line dated and attributed to the person or source that confirmed it.

**Section 3 — Risks.** The two or three things most likely to go wrong, each
with the specific action that reduces it and the date that action is due.

**Section 4 — Optionality.** Which of the three doors you are holding open,
which you are deliberately closing, and the courses that do the work.

## The review that keeps it honest

Twice a year, every year, with the grid open: once after first-semester grades
and once in the spring when next year's courses are chosen. Thirty minutes. The
spring session is the one that matters, because it is the only moment when
course selection is still a decision rather than a history.

## What this buys you

Athletes who do this arrive at the recruiting conversations of REC-101 with
something unusual: no open academic questions. That is worth more in a coach's
office than any single grade on the transcript, because it removes a risk they
would otherwise have to price in.
""",
            },
            {
                "title": "Academic Leverage Brief Template",
                "description": "One-page brief template with the four sections and the twice-yearly review log.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable one-page template for the CEO-102 capstone. The four sections —
position, compliance, risks, optionality — are laid out with field prompts, each
compliance line carrying its own source and date column.

Underneath sits the review log: two rows per academic year, one for the
post-semester review and one for the spring course-selection review, each
recording what changed and who was in the room.""",
            },
        ],
        "assignment": {
            "title": "Capstone — The Academic Leverage Brief",
            "description": (
                "Assemble everything from CEO-102 into one page an adviser can act on.\n\n"
                "Part A — The brief. One page, four sections:\n"
                "- Position: three GPAs, core-course count by subject, credits against "
                "requirement.\n"
                "- Compliance: your status against all three rulebooks, every line dated and "
                "attributed.\n"
                "- Risks: your two or three biggest academic risks, each with a dated action.\n"
                "- Optionality: which of the three doors you are holding open, which you are "
                "deliberately closing, and the courses that do the work.\n\n"
                "Part B — The review, 300-400 words. Take the brief to your counsellor or "
                "academic adviser. Write up what they confirmed, what they corrected, and the "
                "changes you made to the brief afterwards. Include the date of the meeting and "
                "the date of your next scheduled review.\n\n"
                "Part C — Compare this brief against the version-one grid you submitted in "
                "Module 1 and write one paragraph on what you got wrong the first time.\n\n"
                "Graded on accuracy, on whether every compliance line is sourced and dated, on "
                "evidence the review meeting happened, and on whether the optionality section "
                "makes real choices rather than listing every possible course."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: Academic Leverage",
            "description": "Four questions on optionality and the academic leverage brief.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "How does the course define optionality?",
                    "choices": [
                        "Taking the hardest available course in every subject",
                        "Keeping more futures available at each decision point, at the lowest cost to the athletic plan",
                        "Delaying all course decisions until senior year",
                        "Choosing courses purely on how they affect weighted GPA",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the lesson single out mathematics and lab science as the quantitative door?",
                    "choices": [
                        "They carry the highest weighting in most GPA scales",
                        "They are the only courses the Eligibility Center counts twice",
                        "They are prerequisites that cannot be added quickly later",
                        "They are the easiest courses to complete online",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which of the twice-yearly reviews does the course say matters most, and why?",
                    "choices": [
                        "The spring review, because course selection is still a decision rather than a history",
                        "The post-semester review, because grades are final",
                        "Neither — the review is a formality once the brief is written",
                        "The spring review, because eligibility deadlines fall in spring",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does a door you cannot afford to hold open properly become, under this course's approach?",
                    "choices": [
                        "A door you lose quietly by accident",
                        "A door someone else decides about for you",
                        "A door you keep open anyway at any cost",
                        "A door you close on purpose, in writing",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# One handout spec per module, in module order (see `_handouts.py` for the shape).
HANDOUTS = [
    {
        "intro": (
            "Module 1's grid. Every course you take goes in one cell; every requirement gets "
            "ticked by a specific course in a specific semester. A requirement with no course "
            "against it is visible immediately, which is the entire point."
        ),
        "sections": [
            {
                "heading": "1. Eight Semesters",
                "paragraphs": [
                    "Place every course you have already completed in the semester you took it, "
                    "with its grade and credit value, then plan forward as far as you can today."
                ],
                "table": {
                    "columns": ["Semester", "Courses taken / planned", "Credits", "Grades", "Core?"],
                    "rows": [
                        ["9 — Fall", "", "", "", ""],
                        ["9 — Spring", "", "", "", ""],
                        ["10 — Fall", "", "", "", ""],
                        ["10 — Spring", "", "", "", ""],
                        ["11 — Fall", "", "", "", ""],
                        ["11 — Spring", "", "", "", ""],
                        ["12 — Fall", "", "", "", ""],
                        ["12 — Spring", "", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Three Requirement Columns",
                "paragraphs": [
                    "Satisfying one rulebook does not satisfy the others. Tick each requirement "
                    "against the specific course that meets it, and leave the gaps blank and "
                    "visible."
                ],
                "table": {
                    "columns": ["Requirement", "Rulebook", "Met by which course", "Semester", "Gap?"],
                    "rows": [["", "", "", "", ""] for _ in range(8)],
                },
            },
            {
                "heading": "3. Verification Log",
                "paragraphs": [
                    "Rules change between academic years, so an answer from two years ago is not "
                    "an answer. Record who told you and when, every time."
                ],
                "table": {
                    "columns": ["Rule confirmed", "Who confirmed it", "Source", "Date"],
                    "rows": [["", "", "", ""] for _ in range(5)],
                },
                "bullets": [
                    "Front-load the core — a plan that leaves core coursework to the last two semesters is fragile even when legal.",
                    "No credit lands without approval: confirm the provider before enrolling, never after.",
                    "Review this grid twice a year with your counsellor, and once a year with someone who has moved an athlete through it.",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 2's checklist. Page one is the registration sequence; page two audits your "
            "core courses against your school's approved list. Confirm the current requirements "
            "yourself each academic year — the figures are set by vote and have changed before."
        ),
        "sections": [
            {
                "heading": "1. Registration Sequence",
                "bullets": [
                    "Choose the account type: a Certification Account for Division I or II, a Profile Page otherwise — it can be upgraded later.",
                    "Open it early. Sophomore year is normal; opening it late costs you the time to fix a problem.",
                    "Know who sends your transcript, and when.",
                    "Diarise a login at the end of each academic year to check the current requirements.",
                ],
                "fields": ["Account type", "Date opened", "Who sends my transcript", "Annual check-in date"],
            },
            {
                "heading": "2. Core-Course Audit",
                "paragraphs": [
                    "A class is a core course because it appears on your school's approved list — "
                    "not because it sounds academic. Copy the list in by subject and count against "
                    "the sixteen-course structure."
                ],
                "table": {
                    "columns": ["Subject area", "Courses completed", "Courses planned", "Count so far"],
                    "rows": [
                        ["English", "", "", ""],
                        ["Mathematics (Algebra I or higher)", "", "", ""],
                        ["Natural / physical science", "", "", ""],
                        ["Additional English, maths or science", "", "", ""],
                        ["Social science", "", "", ""],
                        ["Additional academic", "", "", ""],
                    ],
                },
            },
            {
                "heading": "3. Standards, Verified Today",
                "paragraphs": [
                    "Learn the shape; verify the numbers. Fill this in from the Eligibility "
                    "Center's own site at the start of each academic year, and have your "
                    "counsellor confirm the same figures independently."
                ],
                "table": {
                    "columns": ["Requirement", "Division I", "Division II", "Date checked", "Source"],
                    "rows": [
                        ["Core courses required", "", "", "", ""],
                        ["Timing requirement before senior year", "", "", "", ""],
                        ["Minimum core-course GPA", "", "", "", ""],
                        ["Test score requirement", "", "", "", ""],
                    ],
                },
            },
        ],
    },
    {
        "intro": (
            "Module 3's briefing sheet. Your state association decides whether you are eligible to "
            "play this Friday — a more immediate question than college certification, governed by "
            "an entirely different rulebook. Find your handbook and read these five sections once "
            "a year."
        ),
        "sections": [
            {
                "heading": "1. The Five High-Risk Areas",
                "paragraphs": [
                    "Summarise each rule in your own words and cite the handbook section. If you "
                    "cannot write it plainly, you have not understood it yet."
                ],
                "table": {
                    "columns": ["Area", "The rule, in my own words", "Section", "Date read"],
                    "rows": [
                        ["Academic standing", "", "", ""],
                        ["Transfer and residency", "", "", ""],
                        ["Age and semesters of participation", "", "", ""],
                        ["Amateurism and outside competition", "", "", ""],
                        ["Recruiting contact and undue influence", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Conflicts Between Rulebooks",
                "paragraphs": [
                    "You must satisfy every rulebook that applies to you, not the most generous "
                    "one. Record which interpretation is stricter and who gave you the answer."
                ],
                "table": {
                    "columns": ["The question", "Bodies that disagree", "Stricter reading", "Written answer from / date"],
                    "rows": [["", "", "", ""] for _ in range(4)],
                },
            },
            {
                "heading": "3. Asking Properly",
                "bullets": [
                    "Can I play on this club team in season? Ask your athletic director, who asks the state association.",
                    "Does this course count as core? Ask your counsellor, against the approved list.",
                    "Does this payment affect my standing? Ask your athletic director and the college association separately.",
                    "Email beats conversation every time — people's memories fade and staff change.",
                ],
                "fields": ["My association", "Handbook link", "Athletic director", "Question I sent this week"],
            },
        ],
    },
    {
        "intro": (
            "Module 4's tracker. One transcript produces at least three different numbers, and the "
            "one that matters depends entirely on who is reading. Update all three every report "
            "card — five minutes a term."
        ),
        "sections": [
            {
                "heading": "1. Completed Courses and the Three GPAs",
                "table": {
                    "columns": ["Course", "Credits", "Grade", "Core?", "Term"],
                    "rows": [["", "", "", "", ""] for _ in range(8)],
                },
                "fields": [
                    "Weighted GPA (school scale)",
                    "Unweighted GPA (flat 4.0)",
                    "Core-course GPA (approved core only)",
                    "Why the three differ — in one line",
                ],
            },
            {
                "heading": "2. Scoring Next Year's Courses",
                "paragraphs": [
                    "Selection used early is worth more than any other lever and costs nothing to "
                    "change in the spring. The optionality test: if sport stopped tomorrow, would "
                    "this course still be worth having taken?"
                ],
                "table": {
                    "columns": ["Candidate course", "Core?", "Demand", "Semester", "Collides with season?", "Passes optionality?"],
                    "rows": [["", "", "", "", "", ""] for _ in range(6)],
                },
            },
            {
                "heading": "3. Recovery Decision Log",
                "paragraphs": [
                    "Repeating a course, credit recovery and summer school all work, under three "
                    "conditions: an approved provider, correct recording by your school, and "
                    "before any applicable timing deadline. Recovery used as a plan rather than a "
                    "repair is a warning sign."
                ],
                "table": {
                    "columns": ["Course repeated / taken", "Provider", "Approved?", "School confirmed recording / date"],
                    "rows": [["", "", "", ""] for _ in range(3)],
                },
            },
        ],
    },
    {
        "intro": (
            "Module 5's planner. Help scheduled in a crisis is rationed, rushed and late; help "
            "scheduled in advance is routine. Map what exists, protect one block, and have the "
            "three conversations before the season starts."
        ),
        "sections": [
            {
                "heading": "1. What Is Available To You",
                "table": {
                    "columns": ["Resource", "Where / when", "Used in the last year?"],
                    "rows": [
                        ["Subject tutoring", "", ""],
                        ["Writing centre", "", ""],
                        ["Teacher office hours", "", ""],
                        ["Study hall", "", ""],
                        ["Counselling", "", ""],
                    ],
                },
                "fields": ["My standing academic block (day, time, length)", "What it is protected against"],
            },
            {
                "heading": "2. Three Pre-Season Conversations",
                "paragraphs": [
                    "Ask for a procedure, not for leniency. “I need help” is a weak "
                    "opening; “here is what I am trying to achieve and where I am stuck” "
                    "is a brief."
                ],
                "table": {
                    "columns": ["Who", "What I asked", "What was agreed", "Date"],
                    "rows": [
                        ["Each teacher", "", "", ""],
                        ["Counsellor", "", "", ""],
                        ["Coach", "", "", ""],
                    ],
                },
            },
            {
                "heading": "3. Travel Protocol",
                "paragraphs": [
                    "Agreed in writing, in advance. An athlete with a written protocol and a plane "
                    "delay has an administrative inconvenience; an athlete without one has a zero."
                ],
                "fields": [
                    "Submitted before departure",
                    "Due on return",
                    "How a missed assessment is made up",
                    "Who signs off on this",
                ],
            },
        ],
    },
    {
        "intro": (
            "The CEO-102 capstone. One page any adviser can act on, reviewed twice a year — once "
            "after first-semester grades and once in the spring, when course selection is still a "
            "decision rather than a history."
        ),
        "sections": [
            {
                "heading": "1. Position and Compliance",
                "paragraphs": [
                    "Every compliance line carries its own source and date. An undated line is an "
                    "assumption wearing a fact's clothes."
                ],
                "table": {
                    "columns": ["Line", "Status", "Source", "Date"],
                    "rows": [
                        ["Weighted / unweighted / core GPA", "", "", ""],
                        ["Core courses by subject", "", "", ""],
                        ["Credits against graduation requirement", "", "", ""],
                        ["State association standing", "", "", ""],
                        ["College association certification", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Risks",
                "paragraphs": [
                    "Two or three things most likely to go wrong, each with the specific action "
                    "that reduces it and the date that action is due."
                ],
                "table": {
                    "columns": ["Risk", "Action that reduces it", "Due", "Owner"],
                    "rows": [["", "", "", ""] for _ in range(3)],
                },
            },
            {
                "heading": "3. Optionality and Review",
                "bullets": [
                    "Quantitative door: mathematics as high as you can handle well, plus a lab science.",
                    "Communication door: writing, argument, a second language — anything that makes you produce and defend an idea.",
                    "Credential door: certifications, dual-enrolment credit, portfolio work worth something on its own.",
                ],
                "fields": [
                    "Doors I am holding open",
                    "The door I am closing on purpose, and why",
                    "Post-semester review date",
                    "Spring course-selection review date",
                ],
            },
        ],
    },
]
