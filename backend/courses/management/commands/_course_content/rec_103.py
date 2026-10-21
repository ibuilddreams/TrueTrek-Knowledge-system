"""REC-103: Building the Target "Fit" Matrix.

Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year). Written
against the course's focus (a realistic, data-driven list of target schools) and
its core competencies: analysing college roster depth, evaluating degree
programmes, geographic preference, and separating the "dream school" from the
"right school".
"""

MODULES = [
    {
        "title": "Why Target Lists Fail",
        "description": (
            "The four ways an athlete's school list goes wrong, and the evidence standard that "
            "fixes all of them."
        ),
        "lessons": [
            {
                "title": "The Dream School Problem",
                "description": "Where lists come from when nobody builds one deliberately.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Where most lists come from

Ask an athlete for their list and you usually get some combination of: the
programme they watched on television, the one a relative attended, the one a
teammate is going to, and whichever two sent a generic letter.

None of those is research. They are the schools that happened to be nearby in
your attention, and a list built from them fails in four predictable ways.

## The four failures

**1. All at one level.** Nine programmes at the hardest level to reach and
nothing beneath them. A list with no realistic entries is a list of zero.

**2. No position logic.** The programme is a good fit for the school and a
terrible fit for you — four athletes already there at your position, three of
them underclassmen.

**3. Academics ignored.** Either the institution would not admit you, or it does
not teach the thing you want to study, or the degree you want cannot be
completed around the athletic schedule.

**4. Nobody at the programme knows you exist.** The list is a wish rather than a
campaign.

## The evidence standard

Every programme on your list has to survive one question: **what evidence do I
have that this is a realistic fit, athletically, academically and financially?**

Not "I would love to go there" — that is a preference, and preferences are
allowed. Evidence. Roster data, published signing information, admission
profiles, cost figures, and ideally something a human being at the programme has
said.

## The size of the list

Most athletes end up working a list of **twenty to thirty** programmes, spread
across levels. Too few and one position change ends your recruitment. Too many
and the outreach in REC-201 becomes generic, which is the same as sending
nothing.
""",
            },
            {
                "title": "Dream School, Right School",
                "description": "Separating the two honestly, and what to do when they are not the same place.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Both are legitimate

A dream school is a programme you want because of what it represents. That
feeling is real and it is allowed on your list — in its place, as one or two
entries, with the honest label attached.

A right school is one where the evidence says you would play, graduate in the
subject you want, be affordable, and be somewhere you could live for four years.

## The test

For each programme, answer four questions in writing:

1. **Would I play here?** Evidence from the roster, not from hope.
2. **Could I study what I want here?** Is the degree offered, and is it
   compatible with the schedule?
3. **Could my family afford it?** Approximately, using the institution's own
   published figures and its net price estimator.
4. **Would I want to be here if I stopped playing tomorrow?**

That fourth question is the one that separates the two kinds of school, and it
is the one most worth taking seriously. Athletes get injured, lose positions,
transfer and stop. The ones who are fine afterwards chose somewhere they wanted
to be anyway.

## When they are not the same place

Keep the dream school on the list and work it properly — send the film, do the
camp if it is genuinely evaluated, and be clear-eyed. Simultaneously, build the
rest of the list on evidence. Both can be true at once, and an athlete who does
only the first is the one who finds themselves in April with nothing.

## Write the labels down

Mark each entry: dream, reach, target, likely. Module 5 formalises it. The point
is simply that **you** know which is which, because an athlete who believes their
whole list is realistic cannot plan.
""",
            },
            {
                "title": "List Diagnostic Worksheet",
                "description": "Diagnose the list you already have against the four failures and the evidence standard.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable worksheet for Module 1. Page one takes the list you already have — in
your head or on paper — and runs it against the four failures: level spread,
position logic, academic fit, and whether anybody at the programme knows you
exist.

Page two applies the evidence standard, one row per programme, with the four
questions including the hard one — would I want to be here if I stopped playing
tomorrow? — and a label column for dream, reach, target or likely.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Diagnose Your Current List",
            "description": (
                "Start from the list you actually have, however informal.\n\n"
                "Submit:\n"
                "1. Your current list, written out, including the schools you have only "
                "thought about. State where each one came from — television, a relative, a "
                "teammate, a letter, research.\n"
                "2. The four failures, applied to it: level spread, position logic, academic "
                "fit, and whether anyone at the programme knows you exist. Be specific.\n"
                "3. The evidence standard. For three programmes on your list, state what "
                "evidence you have that it is a realistic fit athletically, academically and "
                "financially. Where you have none, write 'none'.\n"
                "4. Labels: mark every entry dream, reach, target or likely, and count them. If "
                "the list is all dream and reach, say so.\n"
                "5. The fourth question, answered honestly for your top three: would you want to "
                "be there if you stopped playing tomorrow?\n\n"
                "Graded on honesty rather than on the quality of the existing list. A list "
                "diagnosed as four dream schools with no evidence is a full-credit submission; "
                "a list defended without evidence is not."
            ),
            "total_marks": 100,
            "due_in_days": 10,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Why Lists Fail",
            "description": "Four questions on list failures and the evidence standard.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the course say about a list made entirely of programmes at the hardest level to reach?",
                    "choices": [
                        "It is a list of zero",
                        "It is appropriately ambitious",
                        "It is correct if the athlete is talented",
                        "It should be expanded with more programmes at that level",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What question does the course call the one that separates a dream school from a right school?",
                    "choices": [
                        "Would I play here?",
                        "Would I want to be here if I stopped playing tomorrow?",
                        "Could my family afford it?",
                        "Does the coach know my name?",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Roughly how many programmes does the course say most athletes end up working?",
                    "choices": ["Five to ten", "Ten to fifteen", "Twenty to thirty", "Fifty or more"],
                    "answer": 2,
                },
                {
                    "text": "Why does the course say a list that is too large fails?",
                    "choices": [
                        "Coaches share lists with each other",
                        "Recruiting rules limit how many programmes may be contacted",
                        "Travel costs make it impractical",
                        "The outreach becomes generic, which is the same as sending nothing",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Reading a Roster",
        "description": (
            "The arithmetic of position depth and graduation that decides whether a programme "
            "actually needs you."
        ),
        "lessons": [
            {
                "title": "Position Depth and Graduation Math",
                "description": "Counting who is ahead of you and when they leave.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The roster is published

Nearly every programme publishes its roster with names, positions and class
years. That page answers the most important question about fit, and almost no
recruiting family reads it properly.

## The count

For your position, write down:

- How many athletes are currently on the roster at it.
- What class year each is in.
- How many will have graduated by the year you arrive.
- How many were signed in each of the last two recruiting classes.

Then the arithmetic. If four athletes play your position and three are
freshmen or sophomores, the programme has that position covered for years. If
two of three are seniors and nobody was signed last year, there is a need
arriving at exactly the time you would.

**Need is as important as quality.** Athletes are passed over by programmes that
rated them well and had nowhere to put them, and signed by programmes with a hole
to fill.

## Signing patterns tell you the standard

Published signing or commitment information shows what a programme actually
takes at your position: where they came from, what level they played, and in
some sports their measurements and times. That is a far better benchmark than
any ranking, and it answers the REC-101 baseline question with real data.

## Watch for the cycle

Some positions turn over every year by nature; others hold the same athlete for
four. Learn which yours is in your sport, because it changes how many years of
roster data you need to read.

## Recheck it

Rosters change. Re-run the count once a year on your active list, and
immediately after a transfer window if your sport has a busy one. A programme
that had no need in March may have one in June, and the athlete who notices
first is the one who writes.
""",
            },
            {
                "title": "Style, Staff and Stability",
                "description": "Whether you fit how they play, and what a coaching change would do to your place.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Do you fit how they play?

Two programmes at the same level can want completely different athletes. Watch a
full match or two of each programme on your list and answer:

- What do they ask of someone in my position?
- Is that what I am good at, or what I would have to become?
- Does their style suit my physical profile, or work against it?

An athlete who fits the system is recruited ahead of a better athlete who does
not. This is also a real reason a programme may stop communicating — it is
frequently fit, not quality.

## Who is on the staff

Note the head coach's tenure, the assistant who recruits your position or
region, and how long the staff have been together. Coaching changes are the
single biggest source of instability in recruiting: a new staff arrives with
their own evaluations, their own system and sometimes their own commitments.

You cannot prevent it. You can:

- Prefer stability where other things are equal.
- Build a relationship with **more than one** member of staff, so your file is
  not held by one person.
- Choose a school you would attend even if the staff changed — which is the
  fourth question from Module 1, arriving again.

## Programme trajectory

Is the programme rising, steady or struggling? A programme on the way up is
recruiting athletes it could not have reached two years ago. A struggling one may
have more opportunity for playing time and more risk of a staff change.

Neither is wrong. What is wrong is not knowing which one you are looking at when
you put it on the list.
""",
            },
            {
                "title": "Roster Analysis Template",
                "description": "Depth chart, graduation math, signing patterns and staff stability per programme.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable template for Module 2. The depth section records every athlete at your
position with class year, how many graduate before you would arrive, and how
many were signed in each of the last two classes — producing a plain
need-or-no-need answer per programme.

A signing-pattern panel captures what that programme actually takes at your
position, and the staff section records head coach tenure, the assistant who
recruits your position or region, how long the staff have been together, and the
programme's trajectory.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Roster Analysis of Eight Programmes",
            "description": (
                "Do the arithmetic on real rosters.\n\n"
                "Submit:\n"
                "1. A completed roster analysis for eight programmes on your list, across at "
                "least three different levels. For each: athletes at your position by class "
                "year, how many graduate before you arrive, and how many were signed in each of "
                "the last two classes.\n"
                "2. A need verdict per programme: real need, possible need, or covered — with "
                "the arithmetic that supports it.\n"
                "3. Signing patterns: for three programmes, what do they actually take at your "
                "position? Where do those athletes come from and what level did they play? "
                "Compare honestly against your own REC-101 baseline.\n"
                "4. Style fit: watch at least one full match of two programmes on your list. "
                "What do they ask of someone in your position, and is that what you are good "
                "at?\n"
                "5. Staff stability: head coach tenure and the recruiting assistant for your "
                "position or region, for five programmes.\n"
                "6. One paragraph: which programme moved up your list because of this analysis, "
                "and which moved down?\n\n"
                "Graded on whether real roster data was used, on the arithmetic, and on whether "
                "the style-fit analysis comes from actually watching."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Reading a Roster",
            "description": "Four questions on depth, need and staff.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "A programme has four athletes at your position and three are freshmen or sophomores. What does that suggest?",
                    "choices": [
                        "They will need to sign several more at that position",
                        "The position is covered for years, so need is low",
                        "They are likely to move someone to a different position",
                        "Roster data cannot support any conclusion",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course say need matters as much as quality?",
                    "choices": [
                        "Programmes must fill every roster spot each year",
                        "Need determines the size of the scholarship",
                        "Athletes are passed over by programmes that rated them well and had nowhere to put them",
                        "Coaches recruit only for positions losing seniors",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course give as a frequent, non-obvious reason a programme stops communicating?",
                    "choices": [
                        "The athlete's grades",
                        "A recruiting rule change",
                        "The athlete's social media",
                        "Fit with how the programme plays, rather than quality",
                    ],
                    "answer": 3,
                },
                {
                    "text": "How does the course suggest protecting yourself against a coaching change?",
                    "choices": [
                        "Build a relationship with more than one member of staff, and choose a school you would attend anyway",
                        "Commit as early as possible",
                        "Avoid programmes whose head coach has been there under five years",
                        "Ask for a written guarantee from the head coach",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Academic Fit",
        "description": (
            "Whether the institution would admit you, teaches what you want, and lets you "
            "actually study it around the schedule."
        ),
        "lessons": [
            {
                "title": "Admission, Degree and Schedule Compatibility",
                "description": "Three separate academic questions, each of which can remove a school from your list.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Three questions, not one

**1. Would they admit me?** Institutions publish admitted-student profiles — GPA
ranges, and test score ranges where they are used. Compare your own record
honestly. Athletic support can move the needle at many institutions, but at
academically selective ones the floor for a recruited athlete is still high, and
a coach who goes quiet after seeing a transcript has usually made an admissions
judgement.

**2. Do they teach what I want?** Check the actual degree, not the subject area.
Many institutions teach something adjacent rather than the thing you named. If
you do not know what you want to study — which is entirely normal at fifteen —
prefer institutions with breadth, so changing your mind is cheap.

**3. Can I study it around the schedule?** This is the question nobody asks. Some
degrees have compulsory afternoon laboratories, placements, studio blocks or
clinical hours that collide with training and travel. It is a known problem in
several fields, and the honest answer varies by institution.

**Ask it directly on a visit**: *"Has anyone on this team completed this degree,
and how did the timetable work?"* The answer — including a pause before it — is
extremely informative.

## Academic support is real and differs

Ask what exists: tutoring, academic advisers assigned to athletes, study hall,
priority registration for athletes, and what happens when travel collides with
an assessment. REC-203 puts these in the visit questions.

## The exit question

What is the graduation rate for athletes in your sport at that institution?
Published data exists. A programme that recruits well and graduates few is
telling you something about how it treats people once they are on campus.
""",
            },
            {
                "title": "Cost, Aid and the Real Number",
                "description": "Getting from sticker price to the figure your family would actually pay.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The sticker price is not the price

Published cost of attendance includes tuition, fees, housing, food, books,
travel and personal expenses. Almost nobody pays it in full, and the gap between
two institutions' sticker prices tells you very little about the gap in what
your family would pay.

## Four things that close the gap

1. **Athletic aid**, where the division allows it — full in a few sports, partial
   in most.
2. **Academic aid**, based on your record and awarded by the institution.
3. **Need-based aid**, assessed from your family's financial circumstances
   through the applications each institution requires.
4. **Outside scholarships**, from community organisations, employers and
   foundations.

## The net price estimator

Nearly every institution in the United States publishes a **net price
calculator** on its own site. It takes family financial information and returns
an estimate of what you would actually pay.

Run it for every school on your list, with a parent or guardian, and record the
figure. It takes about fifteen minutes per school and it reorders lists
dramatically — the expensive private institution frequently comes out cheaper
than the public one.

## What to ask a coach, and when

Not in the first email. Once a programme is genuinely recruiting you, ask
plainly: *"If this moves forward, what would aid realistically look like, and "
what would my family's cost be?"* Coaches have that conversation constantly and
respect a family who asks early rather than one that discovers the number in
April.

REC-301 does the full arithmetic on offers. This module is only about not
putting a school on your list that your family could never afford — and about
not removing one because of a price nobody will actually pay.
""",
            },
            {
                "title": "Academic and Cost Fit Sheet",
                "description": "Admission profile, degree availability, schedule compatibility and net price per school.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable sheet for Module 3. The academic section records each institution's
published admitted-student profile against your own record, whether the specific
degree you want is offered, and the schedule-compatibility answer you were given
on a visit or by email, with who gave it.

The cost section carries the published cost of attendance, the net price
calculator result run with a parent or guardian, the date it was run, and the
athlete graduation rate for your sport where it is published.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Academic and Cost Fit for Ten Schools",
            "description": (
                "Do this one with a parent or guardian. Part of it requires their financial "
                "information.\n\n"
                "Submit:\n"
                "1. For ten schools on your list: the published admitted-student profile and an "
                "honest comparison with your own record. Mark each as comfortably within, "
                "borderline, or outside.\n"
                "2. Degree check: for each, is the specific degree you are interested in "
                "offered? Name it. If you do not yet know what you want to study, say so and "
                "assess breadth instead.\n"
                "3. Schedule compatibility: for your top three, find out whether that degree has "
                "been completed by an athlete in your sport there. Record how you found out.\n"
                "4. Net price: run the net price calculator for all ten with a parent or "
                "guardian and record the figures and dates. Compare them against the sticker "
                "prices and comment on what surprised you.\n"
                "5. Athlete graduation rate for your sport at five of them, with source.\n"
                "6. Two paragraphs: which schools came off the list after this work, and which "
                "went on it?\n\n"
                "Graded on whether the net price calculators were actually run, on the honesty "
                "of the admission comparison, and on the quality of the conclusions."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Academic Fit",
            "description": "Four questions on admission, degrees and cost.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which academic question does the course say almost nobody asks?",
                    "choices": [
                        "Would they admit me?",
                        "Do they teach what I want?",
                        "Can I actually study it around the training and travel schedule?",
                        "What is the tuition?",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is a net price calculator?",
                    "choices": [
                        "A tool that ranks schools by cost of attendance",
                        "A tool on an institution's own site that estimates what your family would actually pay",
                        "A calculation of the athletic aid a programme can offer",
                        "An estimate produced by the recruiting coach",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What usually explains a coach going quiet after seeing a transcript?",
                    "choices": [
                        "The recruiting calendar",
                        "A change in position need",
                        "A recruiting service error",
                        "An admissions judgement rather than an athletic one",
                    ],
                    "answer": 3,
                },
                {
                    "text": "When does the course say to ask a coach about aid and family cost?",
                    "choices": [
                        "Once a programme is genuinely recruiting you — early rather than in April",
                        "In the first introduction email",
                        "Only after an offer is made in writing",
                        "Never — a coach cannot discuss money with a recruit",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Life Fit",
        "description": (
            "Distance, size, culture and the four years you would actually live — the factors "
            "that decide whether an athlete stays."
        ),
        "lessons": [
            {
                "title": "The Factors That Make People Transfer",
                "description": "Distance, environment, size and fit with the group — and how to assess them before you commit.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Why athletes leave

Transfers happen for athletic reasons — playing time, a coaching change — and
for reasons nobody put on a list: too far from home, the wrong size of place, a
culture they did not fit, a winter they had not imagined, a team they never felt
part of.

Those are all predictable, and all assessable before you commit.

## Distance, honestly

The question is not how far it looks. It is:

- Can my family realistically watch me compete? How often, at what cost?
- Could I get home for a weekend if something happened?
- How long is the journey door to door, and how much does it cost in the week
  everyone travels?

Some athletes thrive a long way from home and some do not, and most
sixteen-year-olds genuinely do not know which they are. Talk to people who have
done both.

## Size and setting

A large university in a city, a small college in a town, and a mid-sized campus
an hour from anywhere are three completely different lives. Think about where
you have been happiest: with many people and much choice, or with a smaller group
you know well.

## The group you would join

The clearest signal available: **how do the current athletes talk to each
other?** On a visit, watch rather than listen. Do players include each other? Do
they speak well of the staff when the staff are not there? Does anyone look
miserable?

Ask a current athlete the two questions in REC-203: what would you change, and
what surprised you?

## The honest self-assessment

Write down what you need to be happy. Weather, distance, size, whether your
friends are athletes, whether you want a city. There are no right answers — only
the version where you know yours and the version where you find out in November
of your freshman year.
""",
            },
            {
                "title": "Playing Time, Patience and the Four-Year View",
                "description": "Projecting realistically where you would be in years one to four, and what you are prepared to accept.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Ask the question properly

"Would I play?" is too vague. The useful version is a four-year projection:

- **Year one:** realistically, what is my role? Many athletes redshirt,
  develop, or play sparingly, and that is normal rather than failure.
- **Year two:** who is ahead of me, and will they still be there?
- **Years three and four:** is there a path to a significant role?

Use the Module 2 roster math, and ask the coaching staff directly. A staff who
will not answer it, or answers with nothing but encouragement, has given you
information.

## Know what you are prepared to accept

Decide this before you commit, honestly:

- Would I be content developing for two years at a stronger programme?
- Or do I want to compete immediately, even at a level with less prestige?

Neither answer is better. But an athlete who wanted the second and chose the
first is the one in the transfer portal in eighteen months, and the decision was
made the day they confused the two.

## What coaches cannot promise

No coach can promise playing time, and one who does is either being careless or
telling you what you want to hear. REC-203 lists this among the empty promises.
What they can honestly describe is the depth chart, the plan for your
development and how they have used athletes like you before.

## The four-year test

Picture graduating from this place having played less than you hoped. Was it
still a good four years — the degree, the people, the city, who you became?

If yes, it belongs on the list. If no, it was a dream school, and Module 1
already told you what to do with those: keep one or two, labelled honestly, and
build the rest on evidence.
""",
            },
            {
                "title": "Life Fit Scorecard",
                "description": "Weighted scorecard for distance, setting, culture and the four-year projection.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable scorecard for Module 4. The first section captures your own needs —
distance, climate, size of place, city or town, who your friends would be —
weighted by how much each actually matters to you, before any school is scored
against them.

The second scores each programme on those factors plus the culture signals you
observed, and the third holds the four-year projection: your likely role in each
year, what the staff said about it, and your honest answer to the four-year test
— would this still have been a good four years if you played less than you
hoped?""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Life Fit and the Four-Year Projection",
            "description": (
                "Assess the four years you would actually live.\n\n"
                "Submit:\n"
                "1. Your own needs, written before scoring any school: distance, climate, size "
                "of place, city or town, and what kind of social life you want. Weight each by "
                "how much it genuinely matters.\n"
                "2. A life-fit score for eight programmes against those weighted factors, with "
                "the distance figures (door-to-door travel time and approximate cost) filled in "
                "for real.\n"
                "3. Two conversations: speak to one athlete who went far from home and one who "
                "stayed close. Record what each said about the choice.\n"
                "4. A four-year projection for your top three: realistic role in each year, "
                "based on the Module 2 roster math.\n"
                "5. Your acceptance statement: are you prepared to develop for two years at a "
                "stronger programme, or do you want to compete immediately at a level with less "
                "prestige? Answer honestly and explain.\n"
                "6. The four-year test applied to your top three, in a paragraph each.\n\n"
                "Graded on whether your needs were written before the scoring, on whether the "
                "two conversations happened, and on the honesty of the acceptance statement."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: Life Fit",
            "description": "Four questions on environment, culture and playing-time projection.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the course describe as the clearest culture signal on a visit?",
                    "choices": [
                        "The quality of the facilities",
                        "How the current athletes talk to each other",
                        "The head coach's presentation",
                        "The size of the crowd at a fixture",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the useful version of the question “would I play?”",
                    "choices": [
                        "Will I start as a freshman?",
                        "How many athletes are on the roster?",
                        "A four-year projection of my realistic role in each year",
                        "What did the coach promise?",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say about a coach who promises playing time?",
                    "choices": [
                        "They are being careless or telling you what you want to hear",
                        "They are demonstrating genuine commitment",
                        "They are permitted to do so after an official visit",
                        "It is binding once a letter is signed",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the four-year test?",
                    "choices": [
                        "Whether you could graduate in four years while competing",
                        "Whether the staff will still be there in four years",
                        "Whether the programme has improved over four seasons",
                        "Whether it would still have been a good four years if you played less than you hoped",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Tiering the List",
        "description": (
            "Sorting the list into reach, target and likely, and sizing each tier so the "
            "campaign in REC-201 is workable."
        ),
        "lessons": [
            {
                "title": "Reach, Target, Likely",
                "description": "What each tier means, how to assign them honestly, and how many of each you need.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The three tiers

**Reach.** The evidence says you are below what they typically take, athletically
or academically, but it is not impossible. Something would have to go well — a
position need, a growth spurt, a strong season, a good camp.

**Target.** The evidence says you are inside the range they take. Not a
certainty, because need and timing matter, but a realistic conversation.

**Likely.** The evidence says you are at or above what they typically take, and
they have a plausible need. Not a guarantee, and not a lesser outcome.

## Assigning them honestly

Use real data, not feel: the Module 2 signing patterns, the Module 3 admitted
profile, your REC-101 baseline, and the second opinions you collected there.

The common error is **one tier too optimistic across the whole list** — every
reach marked target, every target marked likely. The fix is to ask one of your
honest second-opinion people to re-tier your list without seeing your labels,
then compare. Where you disagree, they are usually right.

## How many of each

A workable spread for most athletes:

- **Reach: 5-8.** Including your one or two dream schools.
- **Target: 10-15.** The bulk of your campaign, and where offers usually come
  from.
- **Likely: 5-8.** Programmes you would genuinely attend. A likely school you
  would not accept is not a likely school; it is padding.

Deliberately spread across levels and across distance.

## The uncomfortable rule

If you have no likely schools you would actually accept, your list is not
finished, however strong the rest of it looks. The athletes who end up with
nothing in April are almost never the ones who lacked ability. They are the ones
whose list had no floor.
""",
            },
            {
                "title": "Working the List, and Changing It",
                "description": "Priority, effort allocation and the discipline of adding and removing programmes.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Effort is not spread evenly

A twenty-five-school list does not mean equal attention to twenty-five
programmes. A sensible allocation:

- **Top 8-10:** personalised, researched outreach and genuine relationship
  building. These get the real work from REC-201.
- **Next 10:** a solid, slightly less tailored campaign, updated when there is
  news.
- **The rest:** on the list, contacted, monitored.

Rank them inside the tiers. When a window opens — a camp, a visit, an evaluation
period — you then know instantly where your limited time and money go.

## Adding and removing

The list is alive. Review it quarterly and after every significant event.

**Remove** a programme when: they have signed two athletes at your position, the
staff has changed and the new staff is not engaging, they have told you plainly
they are not recruiting your position, or you have learned something about the
place you cannot accept.

**Add** when: a new need appears on a roster, a coach makes contact, a programme
you had not considered turns out to fit, or your own level changes.

Removing is harder than adding. Athletes keep a programme on the list long after
the evidence says it is over, because removing it feels like a loss. It is
actually how you free up attention for programmes that are still live.

## Record the reason

Every addition and removal gets a dated line with the reason. Six months later,
that record tells you something no single decision can: whether your list is
getting more realistic or just longer.
""",
            },
            {
                "title": "Tiering and Priority Sheet",
                "description": "Tier assignment with evidence, effort allocation and the add/remove log.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable sheet for Module 5. The tier section assigns every programme to reach,
target or likely with the evidence that justifies it, and counts each tier
against the recommended spread so a missing floor is visible.

The priority section ranks programmes inside their tiers and allocates them to
the top group, the second group or monitoring. The add/remove log records every
change with its date and reason, so the list's direction over time is
visible.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Tier and Prioritise the List",
            "description": (
                "Sort it honestly, then have someone else check your honesty.\n\n"
                "Submit:\n"
                "1. Your full list of twenty to thirty programmes, each assigned to reach, "
                "target or likely, with one line of evidence per assignment.\n"
                "2. Tier counts against the recommended spread. If you have no likely schools "
                "you would genuinely accept, say so explicitly.\n"
                "3. The blind re-tier. Give the list without your labels to one of your honest "
                "second-opinion people and ask them to tier it. Submit their version beside "
                "yours and explain every disagreement.\n"
                "4. Priority ranking: your top eight to ten for personalised outreach, your next "
                "ten, and the rest.\n"
                "5. Your add/remove criteria, written as rules, and the first entries in the log "
                "— including at least one programme you are removing today and why.\n\n"
                "Graded on whether the tiers are evidenced, on whether the blind re-tier "
                "happened, and on whether you were willing to remove something."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: Tiering the List",
            "description": "Four questions on tiers, priority and list discipline.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the course call the common error when athletes tier their own list?",
                    "choices": [
                        "Too many likely schools",
                        "One tier too optimistic across the whole list",
                        "Including schools from several levels",
                        "Ranking programmes inside each tier",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is a “likely” school that you would not actually accept?",
                    "choices": [
                        "A sensible safety net",
                        "A reach school in disguise",
                        "Padding — it is not a likely school",
                        "A programme to contact last",
                    ],
                    "answer": 2,
                },
                {
                    "text": "According to the lesson, what do athletes who end up with nothing in April usually have in common?",
                    "choices": [
                        "They lacked ability",
                        "They contacted too many programmes",
                        "They started too late in junior year",
                        "Their list had no floor",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Why does the course say removing a programme from the list is valuable?",
                    "choices": [
                        "It frees up attention for programmes that are still live",
                        "It reduces the cost of camps and visits",
                        "It signals seriousness to other programmes",
                        "Recruiting rules limit active list size",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Fit Matrix",
        "description": (
            "The capstone: one matrix scoring every programme across athletic, academic, "
            "financial and life fit, reviewed with the people who will drive you there."
        ),
        "lessons": [
            {
                "title": "Building the Matrix",
                "description": "Combining four dimensions into one comparable view without pretending it is science.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Four dimensions, one page

Programmes down the side, four dimensions across:

1. **Athletic fit** — roster need, style fit, where you sit against their signing
   pattern.
2. **Academic fit** — admission likelihood, degree availability, schedule
   compatibility.
3. **Financial fit** — net price estimate, likely aid.
4. **Life fit** — distance, setting, culture, four-year test.

Score each out of five, with the evidence recorded beside it. Then weight the
dimensions according to what actually matters to your family, and total them.

## Weighting is the honest part

The weights are where a family's real priorities become visible, and they are
frequently not what everyone assumed. Do this conversation deliberately with
your parents or guardians: if cost is the binding constraint, say so and weight
it accordingly, rather than discovering it in April.

## What the matrix is for

Not to produce a winner. It is to:

- make comparison possible between places that feel incomparable;
- expose where you have no evidence, which is usually more useful than the
  scores themselves;
- give everyone around you the same picture — the point REC-204 makes about
  families;
- and let you re-run it when something changes, instead of starting the argument
  again.

## Its limits

A matrix cannot capture how a place felt when you walked around it, or a coach
you trusted, or a team you clicked with. Those matter, and REC-203 is about
reading them properly.

So the rule is: **the matrix narrows; it does not decide.** Use it to get from
twenty-five to a serious eight, and use people and visits for everything after
that.
""",
            },
            {
                "title": "Reviewing It With the People Who Pay",
                "description": "The family conversation the matrix is built for, and the quarterly review that keeps it honest.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The conversation

Sit down with whoever will pay, drive and worry — parents, guardians, sometimes
a grandparent — and go through the matrix properly. One hour, with the figures
on the table.

Three things to agree:

1. **The financial constraint.** What is genuinely affordable, with and without
   aid? This is better said plainly now than implied for two years.
2. **The distance constraint.** How far is acceptable to everybody, and what
   does travel cost?
3. **The non-negotiables.** The things that would remove a school whatever else
   is good about it.

Families who have this conversation early argue far less later, and the athlete
stops guessing at limits nobody has stated.

## The quarterly review

Four times a year, with the matrix open:

- Has any roster changed? Re-run the Module 2 math on your top ten.
- Has my own level changed — a season, a testing number, a growth spurt?
- Has anybody been added or removed, and why?
- Is each tier still the right size, and does the list still have a floor?

Thirty minutes. The list that results is accurate, and an accurate list is what
makes the outreach in REC-201 land.

## Who else sees it

Your high school coach, and your club coach if you have one. They talk to
college staff, they get asked about athletes, and they can only advocate
usefully if they know where you are actually aiming.

An athlete whose coach can say "she's looking at these eight, and here's why
she'd fit you" has an advocate. One whose coach has no idea has a reference.
""",
            },
            {
                "title": "The Fit Matrix",
                "description": "Full matrix template with weighting, the family agreement and the quarterly review.",
                "type": "DOCUMENT",
                "minutes": 20,
                "body": """Editable matrix for the REC-103 capstone. Programmes run down the page against
the four dimensions — athletic, academic, financial, life — each scored out of
five with an evidence column, plus the weights your family agreed and a weighted
total.

The family agreement section records the financial constraint, the distance
constraint and the non-negotiables, with space for everyone present to sign off.
A quarterly review page carries the four questions and a dated line per review,
and a distribution panel records who else holds a copy.""",
            },
        ],
        "assignment": {
            "title": "Capstone — The Fit Matrix and the Family Conversation",
            "description": (
                "Build the matrix, then hold the conversation it exists for.\n\n"
                "Part A — The matrix. Every programme on your list scored out of five across "
                "athletic, academic, financial and life fit, with the evidence recorded beside "
                "each score. Mark every cell where you have no evidence — those gaps are part of "
                "the deliverable.\n\n"
                "Part B — The weights. Agreed with your family, with a sentence on why each "
                "dimension carries the weight it does.\n\n"
                "Part C — The family conversation, 300-400 words. Hold the hour-long "
                "conversation with whoever will pay, drive and worry. Write up what was agreed "
                "on the financial constraint, the distance constraint and the non-negotiables, "
                "and what surprised you about what they said.\n\n"
                "Part D — The shortlist. Your serious eight, in priority order, with one "
                "paragraph on why each survived.\n\n"
                "Part E — Distribution and review. Who else has a copy — including your high "
                "school coach — and your four quarterly review dates.\n\n"
                "Graded on whether the scores are evidenced, on whether the evidence gaps are "
                "marked honestly, and on whether the family conversation genuinely happened and "
                "produced stated constraints."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: The Fit Matrix",
            "description": "Four questions on building and using the matrix.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What are the four dimensions of the fit matrix?",
                    "choices": [
                        "Athletic, academic, financial and life fit",
                        "Reach, target, likely and dream",
                        "Roster, staff, facilities and record",
                        "Distance, cost, prestige and playing time",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does the course say the matrix is for?",
                    "choices": [
                        "Producing the single correct school",
                        "Narrowing the list and exposing where you have no evidence — not deciding",
                        "Replacing campus visits",
                        "Demonstrating effort to college coaches",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course say weighting the dimensions is the honest part?",
                    "choices": [
                        "The weights determine the final ranking mathematically",
                        "Coaches ask to see the weighting",
                        "It makes a family's real priorities, especially cost, explicit rather than implied",
                        "Weights are required for the quarterly review",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the difference between a coach who knows your list and one who does not?",
                    "choices": [
                        "They can contact programmes on your behalf during dead periods",
                        "They can guarantee a programme will evaluate you",
                        "They can fill in the financial constraint",
                        "You have an advocate rather than a reference",
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
            "Module 1's diagnostic. Start from the list you actually have — including the "
            "schools that only live in your head — and find out which of the four failures it "
            "has. Honesty here is the whole exercise."
        ),
        "sections": [
            {
                "heading": "1. Where My List Came From",
                "table": {
                    "columns": ["School", "Where it came from", "Evidence I have that it fits"],
                    "rows": [["", "", ""] for _ in range(8)],
                },
            },
            {
                "heading": "2. The Four Failures",
                "table": {
                    "columns": ["Failure", "Does my list have it?", "Evidence"],
                    "rows": [
                        ["All at one level", "", ""],
                        ["No position logic", "", ""],
                        ["Academics ignored", "", ""],
                        ["Nobody there knows I exist", "", ""],
                    ],
                },
            },
            {
                "heading": "3. Dream, Reach, Target, Likely",
                "paragraphs": [
                    "A preference is allowed — mislabelling it is not. The fourth question is "
                    "the one that separates the two kinds of school."
                ],
                "table": {
                    "columns": ["School", "Would I play?", "Could I study what I want?", "Could we afford it?", "Would I want to be here if I stopped playing?", "Label"],
                    "rows": [["", "", "", "", "", ""] for _ in range(6)],
                },
            },
        ],
    },
    {
        "intro": (
            "Module 2's template. The roster page is published and almost nobody reads it "
            "properly. Need is as important as quality — athletes are passed over by "
            "programmes that rated them well and had nowhere to put them."
        ),
        "sections": [
            {
                "heading": "1. Depth and Graduation Math",
                "table": {
                    "columns": ["Programme", "At my position now", "By class year", "Graduating before I arrive", "Signed in last two classes", "Need verdict"],
                    "rows": [["", "", "", "", "", ""] for _ in range(8)],
                },
            },
            {
                "heading": "2. What They Actually Take",
                "paragraphs": [
                    "Published signing and commitment information is a better benchmark than any "
                    "ranking, and it answers the REC-101 baseline question with real data."
                ],
                "table": {
                    "columns": ["Programme", "Where their signings came from", "Level they played", "Measurements / times if published", "How I compare"],
                    "rows": [["", "", "", "", ""] for _ in range(3)],
                },
            },
            {
                "heading": "3. Style and Staff",
                "table": {
                    "columns": ["Programme", "What they ask of my position", "Is that what I am good at?", "Head coach tenure", "Who recruits my position / region", "Trajectory"],
                    "rows": [["", "", "", "", "", ""] for _ in range(5)],
                },
                "bullets": [
                    "An athlete who fits the system is recruited ahead of a better athlete who does not.",
                    "Build a relationship with more than one member of staff, so your file is not held by one person.",
                    "Re-run the depth count once a year, and after a busy transfer window.",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 3's sheet. Three separate academic questions, each of which can remove a "
            "school — and a cost figure that is almost never the sticker price. Run the net "
            "price calculator with a parent or guardian."
        ),
        "sections": [
            {
                "heading": "1. Admission and Degree",
                "table": {
                    "columns": ["School", "Their admitted-student profile", "My record", "Within / borderline / outside", "Is my degree offered?"],
                    "rows": [["", "", "", "", ""] for _ in range(10)],
                },
            },
            {
                "heading": "2. Schedule Compatibility",
                "paragraphs": [
                    "The question nobody asks. Ask it directly on a visit: has anyone on this "
                    "team completed this degree, and how did the timetable work? The pause "
                    "before the answer is informative."
                ],
                "table": {
                    "columns": ["School", "Degree", "Has an athlete completed it here?", "How I found out", "Academic support available"],
                    "rows": [["", "", "", "", ""] for _ in range(3)],
                },
            },
            {
                "heading": "3. The Real Number",
                "table": {
                    "columns": ["School", "Published cost of attendance", "Net price calculator result", "Date run", "Athlete graduation rate"],
                    "rows": [["", "", "", "", ""] for _ in range(10)],
                },
                "fields": ["What surprised me when I compared sticker price with net price", "The question I will ask a coach about aid, written out"],
            },
        ],
    },
    {
        "intro": (
            "Module 4's scorecard. Write down what you need to be happy before you score a "
            "single school — otherwise the scores simply agree with whatever you already "
            "wanted."
        ),
        "sections": [
            {
                "heading": "1. What I Need (Before Scoring Anything)",
                "table": {
                    "columns": ["Factor", "What I need", "How much it really matters (1-5)"],
                    "rows": [
                        ["Distance from home", "", ""],
                        ["Climate", "", ""],
                        ["Size of institution", "", ""],
                        ["City, town or rural", "", ""],
                        ["Who my friends would be", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Scoring the Programmes",
                "table": {
                    "columns": ["Programme", "Door-to-door travel", "Approx travel cost", "Setting", "Culture signals I observed", "Life fit /5"],
                    "rows": [["", "", "", "", "", ""] for _ in range(8)],
                },
                "bullets": [
                    "On a visit, watch rather than listen: do players include each other, and do they speak well of the staff when the staff are not there?",
                    "Ask a current athlete: what would you change, and what surprised you?",
                ],
            },
            {
                "heading": "3. The Four-Year Projection",
                "table": {
                    "columns": ["Programme", "Year 1 role", "Year 2", "Years 3-4", "What the staff said"],
                    "rows": [["", "", "", "", ""] for _ in range(3)],
                },
                "fields": [
                    "Am I prepared to develop for two years at a stronger programme, or do I want to compete immediately?",
                    "The four-year test: would this still have been a good four years if I played less than I hoped?",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 5's sheet. Tier the list honestly, then have somebody re-tier it without "
            "seeing your labels. Where you disagree, they are usually right."
        ),
        "sections": [
            {
                "heading": "1. Tier Assignment",
                "table": {
                    "columns": ["Programme", "My tier", "Evidence", "Blind re-tier by someone else", "Agreed?"],
                    "rows": [["", "", "", "", ""] for _ in range(12)],
                },
            },
            {
                "heading": "2. Counts Against the Spread",
                "table": {
                    "columns": ["Tier", "Recommended", "Mine", "Gap"],
                    "rows": [
                        ["Reach (incl. 1-2 dream)", "5-8", "", ""],
                        ["Target", "10-15", "", ""],
                        ["Likely — ones I would genuinely accept", "5-8", "", ""],
                    ],
                },
                "fields": ["If I have no likely schools I would accept, say so here"],
            },
            {
                "heading": "3. Priority and the Add/Remove Log",
                "paragraphs": [
                    "Effort is not spread evenly. Removing is harder than adding and is how you "
                    "free attention for programmes that are still live."
                ],
                "table": {
                    "columns": ["Date", "Added or removed", "Programme", "Reason"],
                    "rows": [["", "", "", ""] for _ in range(5)],
                },
                "fields": ["Top 8-10 for personalised outreach", "Next 10", "Monitoring only"],
            },
        ],
    },
    {
        "intro": (
            "The REC-103 capstone. One page that makes incomparable places comparable — and, "
            "more usefully, shows exactly where you have no evidence. The matrix narrows; it "
            "does not decide."
        ),
        "sections": [
            {
                "heading": "1. The Matrix",
                "paragraphs": [
                    "Score each dimension out of five and record the evidence beside it. Mark "
                    "every cell where you have none — those gaps are part of the deliverable."
                ],
                "table": {
                    "columns": ["Programme", "Athletic /5", "Academic /5", "Financial /5", "Life /5", "Weighted total", "Evidence gaps"],
                    "rows": [["", "", "", "", "", "", ""] for _ in range(10)],
                },
            },
            {
                "heading": "2. The Family Agreement",
                "paragraphs": [
                    "One hour, with the figures on the table. Families who have this "
                    "conversation early argue far less later."
                ],
                "fields": [
                    "The financial constraint — with and without aid",
                    "The distance constraint, and what travel costs",
                    "Non-negotiables that remove a school whatever else is good",
                    "Weights we agreed, and why",
                    "Who was present, and the date",
                ],
            },
            {
                "heading": "3. Shortlist, Distribution and Review",
                "table": {
                    "columns": ["Rank", "Programme", "Why it survived"],
                    "rows": [["", "", ""] for _ in range(8)],
                },
                "fields": ["Who else holds a copy (including my high school coach)", "Quarterly review dates"],
            },
        ],
    },
]
