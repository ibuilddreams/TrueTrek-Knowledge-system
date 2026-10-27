"""STU-203: Preparing for College Entrance Exams. Cool Nerds Pathway, Level 2.
Student-facing. Test endurance, logic and deduction, study scheduling.

Deliberately generic about which exam: the course teaches the method that
transfers (diagnostic, error log, timed practice, endurance), and routes every
question of dates, fees, scores and policy to the official test-maker's own
site, because those change yearly and a figure printed here would go stale.
"""

MODULES = [
    {
        "title": "How the Exams Work",
        "description": "What is actually being tested, and the plan.",
        "lessons": [
            {
                "title": "What They Measure",
                "description": "Why these exams are learnable.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## They are not IQ tests

The most useful thing to understand: entrance exams test a **narrow,
predictable, repeating** set of skills under time pressure. They are not a
measure of how clever you are, and scores move substantially with
preparation — which is the entire reason this course exists.

## What they actually test

- A **limited syllabus**, recycled year after year.
- **Working accurately at speed.**
- **Reading carefully** when you want to skim.
- **Concentration for several hours.**
- **Knowing the format**, which is worth points on its own.

That is a list of trainable things.

## Before anything else: check the official source

Rules, dates, fees, sections, scoring, how many times you may sit it, what
your target universities require, fee waivers — all of that changes, and
varies by exam and country.

Get it from the **test-maker's own website**, not from a forum, a tutoring
company's blog, an older sibling or this course. Anything in this lesson
about a specific exam would be out of date by the time you read it; the
method below would not.

Write down, from the official source:

- Which exam(s) you need.
- The registration deadline, which is weeks before the exam.
- The fee, and whether you qualify for a waiver.
- Sections, timing and what is allowed in the room.

Ask your school's counsellor to check your list. That is what they are for
(STU-104).

## The plan

**1. Diagnostic.** One full official practice test, timed, before studying
anything. It is unpleasant and it is the only way to know where you
actually are.

**2. Target.** The score range of the universities you are interested in,
from their own published data.

**3. The gap, by section.** Not "I need to improve" — which section, which
question types.

**4. A schedule** (Module 3), starting earlier than you think.

**5. Practice tests at intervals**, under real conditions.

**6. An error log** (Module 2), which is where the actual improvement
happens.

## How early

Three to six months of steady work beats six weeks of panic, consistently.

The students who do well started earlier, not harder.
""",
            },
            {
                "title": "The Test-Taking Skills",
                "description": "Points available regardless of what you know.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Separate from the content

Two students with identical knowledge can score very differently. The
difference is a set of mechanical habits.

## Time

- **Know your per-question budget.** Section time divided by question
  count. Check the official format.
- **Never sit on one question.** If it is not moving after your budget,
  mark it and go. The hardest question is worth the same as the easiest.
- **Do the easy ones first** where the format allows, then come back.
- **Checkpoints.** Know where you should be at the quarter marks.
- **Leave time to transfer answers** if the exam uses a separate sheet.

The most common avoidable loss is unanswered easy questions at the end
because of one hard question in the middle.

## Guessing

Check the official rules: most modern exams do not penalise wrong answers,
some historically did.

**If there is no penalty, never leave a blank.** Ever. Even a random guess
has positive expected value.

**Eliminate first.** Removing two wrong options takes a one-in-four guess
to a one-in-two, and elimination is frequently easier than solving.

**Have a default letter** for pure guesses when time runs out — it is
marginally better than varying them.

## Reading the question

Where most careless marks are lost:

- Underline what is actually being asked. "Which is **not**…", "**least**
  likely", "EXCEPT".
- Check what unit the answer wants.
- In reading sections, the answer is **in the passage** — not what you
  think is true.
- Answer the question asked, not the one you expected.

## Elimination as a method

On a multiple-choice question you cannot solve:

- Two options that say the same thing are usually both wrong.
- An extreme option ("always", "never") is frequently wrong.
- An answer that is true but does not answer the question is a common trap.
- If one option is much longer or more detailed, note it — but do not rely
  on it.

## Showing up

- Know the route and the start time.
- Sleep the night before matters more than the last hour of revision.
- Eat something.
- Bring what the official instructions say: ID, admission ticket, permitted
  calculator, pencils, water.
- Arrive early.

Losing points because you were late or had the wrong ID is entirely
preventable and it happens every year.
""",
            },
            {
                "title": "Logic and Deduction",
                "description": "The reasoning patterns the exams reuse.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The repeating patterns

Reasoning questions are not infinite. A handful of structures recur, and
recognising the structure is most of the work.

## Conditionals

**"If A, then B."**

What follows: if A, then B. If not B, then not A (the contrapositive —
this is the one exams test).

What does **not** follow: if B, then A. If not A, then not B. Both are
extremely common wrong answers.

> *If it rained, the ground is wet.*
> The ground is wet — it may not have rained. Somebody washed a car.

## Necessary and sufficient

**Sufficient:** enough on its own. **Necessary:** required, but maybe not
enough.

A passport is necessary for the flight; it is not sufficient — you also
need a ticket.

Exams build whole questions on students mixing these up.

## Correlation and cause

Two things moving together does not mean one caused the other. There may
be a third thing causing both, or the causation may run the other way.

An answer option asserting cause from a passage that only shows correlation
is a standard trap.

## Assumptions

Many arguments depend on an unstated step:

> *This school's students score well, so it is a good school.*

Assumes the school caused the scores, rather than selecting students who
would have scored well anyway. "Which assumption does the argument depend
on?" is asking for exactly this.

## Weakening and strengthening

- **Weaken:** supply an alternative explanation, or break the assumption.
- **Strengthen:** rule an alternative explanation out.
- An answer that is merely *related to the topic* is not an answer.

## Quantifiers

**All, some, none, most.**

"Some A are B" does **not** imply "some A are not B". "Not all" is not
"none". Exams test these edges deliberately.

## Data and graphs

- Read the axes and the units first.
- Check whether it is a total or a rate — the commonest trick.
- Percentage change of a percentage is not percentage points.
- Note where the axis starts; a truncated axis exaggerates.

## Practising this

When a reasoning question is wrong, do not just read the right answer. Name
the pattern — contrapositive, correlation-cause, unstated assumption. Patterns
transfer; individual questions do not.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Diagnose and Plan",
            "description": (
                "Submit:\n"
                "1. Which exam(s) you need, taken from the official website, with the "
                "link, the registration deadline, the fee and whether a waiver applies.\n"
                "2. The sections, their timing and what is permitted in the room.\n"
                "3. One full official practice test, timed, with your section scores.\n"
                "4. Your target range, from three universities' own published data.\n"
                "5. The gap by section and by question type.\n"
                "6. Your per-question time budget for each section.\n"
                "7. Ten questions you got wrong, each labelled: content gap, misread, "
                "time, or careless.\n"
                "8. Five reasoning questions, each with the pattern named — contrapositive, "
                "necessary/sufficient, correlation/cause, assumption, quantifier.\n"
                "9. A conditional statement with its valid and invalid inferences written "
                "out.\n\n"
                "Graded on part 3 being a real timed test and part 8 naming patterns rather "
                "than restating answers."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: How the Exams Work",
            "description": "Four questions on format, technique and reasoning.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Where should exam dates, fees, sections and scoring rules come from?",
                    "choices": [
                        "The test-maker's own official website",
                        "A tutoring company's preparation blog",
                        "Students who sat it last year",
                        "This course's materials",
                    ],
                    "answer": 0,
                },
                {
                    "text": "From 'if it rained, the ground is wet', what validly follows?",
                    "choices": [
                        "If the ground is wet, it rained",
                        "If the ground is not wet, it did not rain",
                        "If it did not rain, the ground is not wet",
                        "The ground is wet only when it rains",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the most common avoidable loss of marks on a timed section?",
                    "choices": [
                        "Changing correct answers",
                        "Guessing too early",
                        "Unanswered easy questions at the end, because of one hard question in the middle",
                        "Running out of space for working",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should you do after getting a reasoning question wrong?",
                    "choices": [
                        "Read the explanation and move on",
                        "Redo the question from scratch",
                        "Find three more of the same question",
                        "Name the pattern behind it, because patterns transfer and individual questions do not",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Studying For It",
        "description": "The practice that produces score movement.",
        "lessons": [
            {
                "title": "The Error Log",
                "description": "The single highest-return habit in exam preparation.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## What most people do

Practice test, check the score, feel something about it, do another
practice test.

That produces almost no improvement. The score tells you where you are and
nothing about what to change.

## The error log

One document. Every question you get wrong — and every question you got
right by guessing — gets a row:

| Field | What goes in it |
| --- | --- |
| Question | Topic and type |
| What I did | The reasoning that led to the wrong answer |
| Why it was wrong | The actual error |
| Category | Content, misread, time, careless |
| The rule | One sentence to remember |

The third and fifth columns are the ones that matter, and the ones people
skip.

## The four categories

**Content gap.** You did not know the topic. Fix: learn it, then do ten of
that type.

**Misread.** You knew it and answered a different question. Fix: the
underlining habit from Module 1.

**Time.** You rushed or ran out. Fix: pacing, not knowledge.

**Careless.** Arithmetic slip, wrong box. Fix: a checking routine.

Most students assume everything is a content gap and spend their
preparation relearning things they already knew. Categorising your errors for
one week usually corrects that assumption.

## Reviewing it

- Read the whole log before each practice test.
- Weekly, count the categories — the biggest one is next week's priority.
- A rule that keeps reappearing has not been learnt. Do twenty of that
  type.

## Redo them

Three days later, redo the questions you got wrong, without looking. Getting
them right from reading the explanation is not the same as being able to do
them.

## Why it works

It converts practice from measurement into diagnosis. Twenty questions
properly logged beats two hundred done and marked, and it is the difference
between students whose scores move and students whose scores do not.
""",
            },
            {
                "title": "Practising Properly",
                "description": "Which practice counts.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Official material first

Practice questions written by the people who write the exam are the only
ones guaranteed to match the real thing in style and difficulty.

Most test-makers publish free official practice material. Use that first,
and treat third-party questions as additional volume rather than as the
standard.

## Timed from early

Untimed practice teaches you to work at a pace you will not have. Use the
real per-question budget from the start, even when it hurts.

## Full tests under real conditions

Every two or three weeks:

- Same start time as the real exam, where you can.
- Full length, all sections, real break lengths.
- No phone, no interruptions, no pausing.
- At a desk, not on a bed.

Anything less tells you less than you think.

## Endurance

These exams are long, and the score loss in the final section is real and
large.

It is a trainable thing:

- Build up full-length sits across your schedule.
- Practise the back half when you are already tired, deliberately.
- Have a break routine: stand, water, something to eat, no screen, no
  discussing the section just finished.
- Learn what your concentration dip feels like so you can push through it
  rather than being surprised by it.

## Interleaving and spacing

Two findings from cognitive research that are worth more than extra hours:

**Spacing.** Revisit a topic after a gap rather than massing it in one
session. Same total time, substantially more retained.

**Interleaving.** Mix question types in a session rather than doing thirty
of one kind. It feels worse and performs better, because the exam does not
arrive sorted by topic.

## Active over passive

- **Does not work well:** rereading notes, highlighting, watching videos.
- **Works:** doing questions, retrieving from memory, explaining a method
  out loud, redoing errors.

If an hour of revision involved no recall, it was mostly reassurance.

## How much

Steady beats heroic. Five or six focused hours a week over four months
beats thirty hours a week for three weeks, and the second one burns people
out before the exam.
""",
            },
            {
                "title": "Nerves",
                "description": "Managing the pressure without pretending it is absent.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Normal

Nearly everybody is nervous before a major exam. Nerves are not a sign that
something has gone wrong, and a moderate amount reliably improves
performance (STU-106).

What hurts is the second layer: being anxious about being anxious.

## What helps, in the room

- **Slow breathing.** Four counts in, six out, for a minute. Longer out
  than in. It is physiological, not a trick.
- **Start with something you can do**, where the format allows. Momentum is
  real.
- **One question at a time.** The next section does not exist yet.
- **A blank is information, not a verdict.** Mark it, move, come back.
- **Do not calculate your score mid-exam.** It is always wrong and always
  expensive.

## Between sections

Do not discuss the section just finished with anybody. It achieves nothing
except convincing you that you got things wrong, before a section you can
still do well in.

## Before the day

- Sleep properly the whole week, not just the night before.
- Stop new material two days out; revise what you know.
- Pack the night before, against the official list.
- Plan the journey with a margin.
- Do something unrelated the evening before.

## The perspective that is actually true

- **Most exams can be retaken.** Check the official rules for yours.
- **Universities look at more than the score** — grades, essays, activities,
  references.
- **There are many good routes**, and a disappointing score closes fewer of
  them than it feels like it does on the day.
- Plenty of people whose lives went well sat a bad exam at seventeen.

That is not a reason to prepare less. It is the thing to hold on to so that
fear does not do your preparation for you.

## If it is more than nerves

If anxiety is stopping you sleeping for weeks, making you ill, making you
avoid the exam entirely, or if you are having thoughts of harming yourself —
that is beyond what an exam course should be handling.

**Tell a parent, a teacher or your school counsellor, and ask your family
doctor.** This is common, it is treatable, and support and access
arrangements exist for exactly this. Asking is not an admission that you
cannot cope; it is the fastest route to being able to.

If you are in immediate danger, contact your local emergency number or a
crisis line in your country now.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Practise and Log",
            "description": (
                "Submit:\n"
                "1. An error log with at least thirty entries, all five columns filled.\n"
                "2. The weekly category counts, and the priority they pointed to.\n"
                "3. One rule that reappeared, and the twenty questions you did about it.\n"
                "4. Errors redone three days later, with how many you got right second "
                "time.\n"
                "5. Two full-length tests under real conditions, with the conditions "
                "described honestly.\n"
                "6. Your section-by-section scores across those tests, and whether the "
                "final section dropped.\n"
                "7. Your endurance plan and your break routine.\n"
                "8. One interleaved session and one spaced revisit, with what each felt "
                "like compared with massed practice.\n"
                "9. Your exam-day nerves plan, including the breathing and the "
                "no-discussing-it rule.\n"
                "10. Who you would tell if anxiety became more than nerves.\n\n"
                "Graded on the error log being real and part 5 being genuinely timed."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Studying",
            "description": "Four questions on error logs, practice and nerves.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does an error log convert practice into?",
                    "choices": [
                        "Diagnosis, rather than measurement",
                        "A record for your teacher",
                        "A revision timetable",
                        "A score projection",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What do most students wrongly assume about their errors?",
                    "choices": [
                        "That they are random",
                        "That they are all content gaps, so they relearn things they already knew",
                        "That they will disappear with volume",
                        "That carelessness cannot be fixed",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why interleave question types rather than doing thirty of one kind?",
                    "choices": [
                        "It is faster to mark",
                        "It covers more syllabus per hour",
                        "It feels worse and performs better, because the exam does not arrive sorted by topic",
                        "It keeps motivation higher",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should you do between sections on exam day?",
                    "choices": [
                        "Check answers you were unsure about",
                        "Review notes for the next section",
                        "Estimate your score so far",
                        "Not discuss the section just finished with anybody",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Schedule",
        "description": "Fitting preparation around everything else.",
        "lessons": [
            {
                "title": "Building It",
                "description": "A plan that survives contact with a normal week.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Work backwards

From the exam date:

1. **Exam day.**
2. **Two days before:** stop new material.
3. **Final two weeks:** practice tests and error-log review only.
4. **Middle period:** section work driven by the log.
5. **First month:** diagnostic, content gaps, learning the format.
6. **Now.**

That gives you the number of weeks you actually have, which is usually
fewer than it felt.

## Be honest about the hours

Write out a real week — school, travel, sport, job, family, sleep. What is
left is what you have. Plan for seventy per cent of it, because weeks go
wrong.

Five to six good hours a week for four months is a serious preparation.

## Put it in a calendar

Not a list of intentions. Specific blocks with a specific task:

> *Tuesday 19:00–20:00 — 20 reading questions, timed, then log.*

A block saying "study" does not get done.

## Mix the sessions

- **Short sessions (45–60 min):** question sets, error review, one topic.
- **Medium (90 min):** a full section plus logging.
- **Long (3–4 hours):** full practice test, every two or three weeks,
  weekend.

## Protect sleep

Do not schedule preparation into sleep. Tired practice is bad practice, it
makes the error log noisy, and sleep is when the learning consolidates.

## The weekly review

Fifteen minutes, same time each week:

- Did the blocks happen? Which did not, and why?
- What do the error categories say?
- What is next week's priority?
- Does the schedule need changing?

A plan you review weekly is a plan. One you write once is a wish.

## When you fall behind

You will. Do not restart the whole plan, and do not try to make up every
missed hour.

Skip the backlog, resume at today, and if you are consistently missing
blocks, the schedule is wrong rather than you — make it smaller.
""",
            },
            {
                "title": "Around Everything Else",
                "description": "Preparation is not the only thing happening.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Grades still matter

In most admissions systems, your school grades carry at least as much weight
as the entrance exam, frequently more.

Sacrificing coursework for test preparation is usually a bad trade. The
exam is one number; your transcript is three or four years.

## So are activities

Universities that look beyond scores look at what you actually did —
sustained involvement in something, responsibility taken, work done
(STU-206).

Dropping everything for six months of preparation can cost you the part of
the application the score cannot replace.

## The practical balance

- Treat exam preparation as **one** commitment among several, with a fixed
  weekly budget.
- Protect schoolwork deadlines first; they are time-bound and the exam
  block is movable.
- Keep one thing you do for its own sake (STU-106) — exercise, music,
  friends. Removing all of it reliably makes the preparation worse.
- Keep sleep and food ordinary (STU-201).

## Money and access

- Check official **fee waivers**; most major test-makers have them, and
  they are underused because students do not ask.
- Free official practice material exists for every major exam. Paid courses
  are optional, not required.
- **Access arrangements** — extra time, a separate room, a reader — exist
  for documented needs and must be applied for well in advance. Ask your
  school counsellor early; the deadline is usually months before the exam.
- Your school counsellor is free, knows the system, and is underused
  (STU-104).

## Asking for help

- Teachers will explain a topic you are stuck on if you ask specifically.
- Study with somebody only if you both actually work.
- Explaining a method to somebody else is one of the strongest forms of
  revision there is.

## Not getting the score

It happens to good students.

- Check the official retake rules and dates.
- Look at whether the issue was content, pacing or the day itself — the
  error log tells you.
- Check which of your universities are test-optional or weight it lightly;
  many now do.
- Talk to your counsellor before concluding anything.

A single exam result is a smaller fact about your life than it is capable of
feeling.
""",
            },
            {
                "title": "Pulling It Together",
                "description": "The method, and where it transfers.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The whole method

1. Get the facts from the **official source**, not from anybody else.
2. Sit a **timed diagnostic** before studying.
3. Find your target from **universities' own published data**.
4. Work the gap **by section and question type**.
5. Keep an **error log** and categorise every mistake.
6. Practise **timed, official, interleaved**.
7. **Full tests under real conditions**, every two or three weeks.
8. Train **endurance** deliberately.
9. **Review weekly** and adjust.
10. Protect **sleep, grades and one thing you enjoy**.

## What actually separates people

Not ability. Three things:

- **Starting earlier.**
- **Logging errors** rather than only scoring tests.
- **Practising under real conditions.**

All three are decisions rather than talents.

## It transfers

This method is not about one exam:

- Professional qualifications later work identically.
- Driving theory, language certificates, licensing exams — same shape.
- Any skill where you need to find the gap, practise the gap and measure
  under real conditions (STU-205).

The error log in particular is a general-purpose tool for getting better at
anything that can be scored.

## Keeping it in proportion

Prepare seriously, because the score matters and it moves with work.

Then hold two things at once: it is worth real effort, and it is one of
many inputs into one of many routes. Students who hold only the first burn
out; students who hold only the second do not prepare.

Both, together.

## If you take one thing

Start three months earlier than you were going to, and write down why you
got every wrong answer wrong.

That is most of the difference.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Build the Schedule",
            "description": (
                "Submit:\n"
                "1. A backwards-planned schedule from your exam date, with all six stages "
                "dated.\n"
                "2. A real week audited, with the hours genuinely available, planned at "
                "seventy per cent.\n"
                "3. Four weeks of calendar blocks, each with a specific task rather than "
                "'study'.\n"
                "4. Your mix of short, medium and long sessions.\n"
                "5. Four weekly reviews, with what you changed each time.\n"
                "6. One week you fell behind, and how you resumed without restarting.\n"
                "7. What you are protecting: grades, one activity, sleep — and how.\n"
                "8. Whether a fee waiver or access arrangement applies to you, checked "
                "against the official source, with the deadline.\n"
                "9. One conversation with your school counsellor, with what you learnt.\n"
                "10. The ten-step method in your own words, and one other thing in your "
                "life you could apply the error log to.\n\n"
                "Graded on part 5 being four real reviews and part 9 having actually "
                "happened."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: The Schedule",
            "description": "Four questions on scheduling, balance and transfer.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "How much of your genuinely free time should the schedule plan for?",
                    "choices": [
                        "About seventy per cent, because weeks go wrong",
                        "All of it, with catch-up blocks",
                        "Half, with the rest as reserve",
                        "As much as motivation allows that week",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What should you do after a week of missed blocks?",
                    "choices": [
                        "Restart the plan from the beginning",
                        "Skip the backlog, resume at today, and shrink the schedule if it keeps happening",
                        "Double next week's hours",
                        "Move the exam date",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why is sacrificing coursework for test preparation usually a bad trade?",
                    "choices": [
                        "Coursework is easier to improve",
                        "Entrance exams can always be retaken",
                        "The exam is one number; your transcript is three or four years, and usually weighs at least as much",
                        "Teachers notice the drop",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What three things separate students whose scores move?",
                    "choices": [
                        "Tutoring, volume of questions and natural ability",
                        "Memory, reading speed and confidence",
                        "Paid courses, extra time and early nights",
                        "Starting earlier, logging errors, and practising under real conditions",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
