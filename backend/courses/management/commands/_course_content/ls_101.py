"""LS-101: Time Management & Energy Optimization.

Level 1: Core Fundamentals, and the opening course of The Athlete Life Skills &
Transition Pathway. Written against the course's focus (schedule control across
academic, athletic and personal demands without burnout) and its core
competencies: calendar blocking, urgent versus important, travel-time
optimisation, and sleep scheduling.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).
"""

MODULES = [
    {
        "title": "Where the Time Actually Goes",
        "description": (
            "An honest audit before any system — most athletes are solving the wrong "
            "problem."
        ),
        "lessons": [
            {
                "title": "You Are Not Short of Time",
                "description": "What an audit usually reveals, and why it is not what athletes expect.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The complaint

"I don't have time." Almost every student athlete says it, and almost every
one of them is wrong in a specific way.

There are 168 hours in a week. A heavy week is roughly: 56 sleeping, 35 at
school, 15 training, 5 competing, 10 travelling, 15 eating and washing. That
is 136, leaving around 30 unaccounted for.

Thirty hours. The problem is almost never the total; it is that those thirty
hours are in fragments nobody planned, and they disappear without anybody
noticing where.

## Do the audit before the system

Buying a planner before you know where the time goes is like changing your
technique before you have watched the film. You will optimise something that
was not the problem.

For one ordinary week, record what you actually do in thirty-minute blocks. Not
what you intended — what happened. A notes app, a paper grid, anything.

It is tedious for three days and then it stops being, and almost everyone who
does it finds the same three things.

## What people find

**1. The phone.** Most phones report screen time. The number is usually between
three and six hours a day, and almost nobody's estimate is within two hours of
it. That is the thirty hours, found.

**2. Dead transitions.** The twenty minutes after training before you leave,
the forty-five between getting home and starting homework, the hour between
finishing one thing and beginning another. Individually tiny, collectively most
of a day each week.

**3. Low-value time that feels busy.** Rewatching film you already know,
reorganising notes, scrolling other athletes' training, "getting ready to
start". It feels like work and produces nothing.

## What the audit is for

Not guilt. Three decisions:

- What am I going to stop doing?
- Which fragments can be joined into usable blocks?
- What am I protecting no matter what?

Everything else in this course is those three questions, answered with a
calendar.

## Be honest about the floor

Some weeks genuinely have no slack: a fixture block, exams, an illness in the
family. The point of auditing a normal week is to know what normal is, so you
can tell the difference between a hard week and a badly run one.

Athletes who cannot tell the difference assume every week is a hard week, and
that is where burnout starts.
""",
            },
            {
                "title": "Urgent Is Not Important",
                "description": "The distinction that decides what actually gets done.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Two different things

**Urgent** means it is demanding attention now. A message, a deadline today, a
ringing phone, somebody waiting.

**Important** means it affects the outcomes you care about. Training properly,
the long assignment due in three weeks, sleep, the conversation with a coach,
the application.

They are unrelated, and confusing them is the single most common time problem
there is.

## The four boxes

**Urgent and important.** The crisis. The assignment due tomorrow, the injury,
the thing that has gone wrong. Do it — but notice that most things in this box
arrived here because they were ignored while they were in the next box.

**Important, not urgent.** Training, sleep, revision, recovery, the long
project, the relationships. **This is where everything that matters lives**, and
it is the box that gets squeezed, because nothing in it is shouting.

**Urgent, not important.** Most messages, most notifications, most of what
other people want from you today. It feels like work. It is the box that eats
the thirty hours.

**Neither.** Scrolling. Fine in small, chosen amounts; a problem when it is
what happens to the gaps.

## The practical rule

**Schedule the important, respond to the urgent.**

Anything in box two goes in the calendar as an appointment with a time. If it
is not scheduled it will not happen, because something urgent will always be
available to do instead.

## Applied to an athlete's week

Box two for most athletes: sleep at a consistent time, a revision block that is
not the night before, mobility and recovery, eating properly, the university or
programme research, and the conversation with a coach about what to work on.

Every one of those is skippable on any given day, and skipping each of them
daily is exactly what a wasted season looks like.

## The test

At the end of a week, ask: *what did I do this week that will still matter in
six months?*

If the honest answer is "training, and nothing else", the week was run by
whatever shouted loudest. That is a planning problem, not a character problem,
and the next module fixes it.
""",
            },
            {
                "title": "Energy, Not Just Hours",
                "description": "Why the same hour is worth different amounts at different times.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Hours are not interchangeable

An hour of revision at seven in the morning and an hour at eleven at night
after a session are not the same hour. The second one produces almost nothing
and costs you sleep, which then costs tomorrow.

Managing time without managing energy is why athletes with good schedules still
underperform: everything is scheduled, and the hard things are scheduled into
the hours where nothing hard is possible.

## Your own pattern

Over the audit week, note alongside each block how sharp you felt — high,
medium or low. A pattern appears within days, and it is personal: some people
are genuinely better early, some genuinely later, and most athletes have a
trough in the early afternoon and a second one straight after training.

## Match the task to the state

**High-energy hours:** the things that need thinking. Difficult study, writing,
a hard conversation, planning, anything new.

**Medium:** routine schoolwork, admin, messages, organisation.

**Low:** the things that need almost nothing. Tidying kit, laundry, packing a
bag, listening to something, light mobility.

The mistake is universal: low-value admin gets the best hours because it is
easy to start, and the hard thing gets the worst ones because it was avoided
all day.

## Training is a withdrawal

A hard session costs mental energy as well as physical. Most athletes plan
their day as if the two hours after training are normal hours. They are not.

So: do not schedule anything cognitively demanding immediately after a hard
session. Put food, recovery or low-energy admin there, and put the study
earlier.

## Recovery is scheduled, not left over

Recovery that happens only when there is time left never happens. It goes in
the calendar like a session:

- Food, actually sitting down, not in a car.
- A gap after training before the next demand.
- One genuinely empty block a week, protected.

## The burnout signal

Burnout is not caused by a hard week. It is caused by months with no low weeks
in them.

The signals: nothing feels enjoyable, ordinary sessions feel unusually hard,
sleep is poor despite tiredness, small things produce disproportionate
irritation, motivation has gone rather than dipped.

If several of those are true for more than two weeks, say so — to a coach, a
parent, a school welfare lead or a physician. Overtraining and burnout are
recognised, common and treatable, and the usual mistake is waiting until a
season is lost. That conversation belongs with a professional, not with a
planner.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — One Honest Week",
            "description": (
                "Audit before you optimise.\n\n"
                "Submit:\n"
                "1. A complete time audit of one ordinary week, in thirty-minute blocks, "
                "recording what actually happened rather than what you planned.\n"
                "2. Your totals by category: sleep, school, training, competing, travel, "
                "eating and washing, everything else.\n"
                "3. Your phone's own screen-time figure for the week, with a screenshot, and "
                "how far off your estimate was before you looked.\n"
                "4. Your dead transitions: the three recurring gaps where time disappears, "
                "with how long each one is.\n"
                "5. Three activities that felt like work and produced nothing.\n"
                "6. Every block in the audit sorted into the four boxes, with the percentage "
                "of your waking hours in each.\n"
                "7. Your box-two list: the five important-but-not-urgent things that are "
                "currently being squeezed.\n"
                "8. Your energy pattern, marked across the week — where your high, medium and "
                "low hours actually are.\n"
                "9. Three tasks you are currently doing in the wrong energy band, and where "
                "they will move.\n"
                "10. The six-month test applied to your week: what did you do that will still "
                "matter?\n\n"
                "Graded on whether the audit covers a full seven days in real detail, and on "
                "whether parts 5 and 10 are honest rather than flattering."
            ),
            "total_marks": 175,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Where the Time Goes",
            "description": "Four questions on auditing, priorities and energy.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why audit before building a system?",
                    "choices": [
                        "Otherwise you optimise something that was not the problem",
                        "Systems require a baseline to measure progress",
                        "A planner cannot be set up without historical data",
                        "Coaches usually require an audit first",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which of the four boxes holds everything that actually matters?",
                    "choices": [
                        "Urgent and important — the crises",
                        "Important but not urgent — and it is the box that gets squeezed",
                        "Urgent but not important",
                        "Neither urgent nor important",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the universal mistake in matching tasks to energy?",
                    "choices": [
                        "Training too early in the day",
                        "Scheduling recovery before study",
                        "Low-value admin gets the best hours because it is easy to start",
                        "Leaving the calendar unplanned after competition",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What causes burnout, according to the course?",
                    "choices": [
                        "A single week of excessive training load",
                        "Poor calendar discipline",
                        "Competing too frequently",
                        "Months with no low weeks in them",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Calendar Blocking",
        "description": (
            "Turning the audit into a week that runs itself — and the rules that keep it "
            "standing when the week goes wrong."
        ),
        "lessons": [
            {
                "title": "Blocking, Properly",
                "description": "Putting everything in one calendar, in the right order.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## One calendar

Everything in one place: training, school, fixtures, travel, study, work,
family, recovery, the social things. If it is in three places it is in none.

Digital is easier for a student athlete because it repeats, it reminds, and it
can be shared with a parent who is driving you places.

## The order you fill it in

This order matters more than any other detail in the course.

**1. Fixed commitments.** School, training, fixtures, work shifts. The things
you cannot move.

**2. Sleep.** Before anything else discretionary. Module 3 argues why; for now
treat it as a fixed commitment, because it is.

**3. Travel.** Not as an afterthought — as blocks with real durations.

**4. Food.** Actual meals, at times, including the ones around training.

**5. The box-two blocks.** Study, recovery, the long project, the application.
Scheduled as appointments, in your high-energy hours.

**6. Admin and messages.** One or two short blocks, not continuous.

**7. Free time.** Deliberately, by name. A calendar with no free time in it
gets abandoned within a fortnight.

Most athletes fill it in roughly the opposite order and then wonder why sleep
and study are what gets cut.

## Blocks, not lists

A to-do list says *what*. A calendar says *when*, which is the part that makes
it happen. "Revise chemistry" sits on a list for a week; "Chemistry, Tuesday
17:00–18:00" either happens or visibly did not.

So: every task that matters gets a time and a duration.

## Sizing them

- **Fifty to ninety minutes** for anything demanding, then a real break.
- **Twenty-five minutes** for something you are avoiding. Starting is the hard
  part and a short block is easier to start.
- **Never more than two hours** on one thing without a break; the last half of
  a three-hour block is usually wasted.

## Leave gaps

A calendar with no space is a calendar that breaks on its first delay. Leave
fifteen minutes between blocks, and leave one genuinely empty block each day.

That gap is what absorbs the session that overran, the lift that was late and
the thing that took longer than you thought. Without it, one delay destroys the
whole day and the calendar gets abandoned.

## Theme the days

Where you can, give a day a shape: heavy study on the lighter training days,
admin on a fixed afternoon, the long project on the same morning each week.
Repetition removes the decision, and the decision is most of the cost.
""",
            },
            {
                "title": "Travel Time",
                "description": "The hours an athlete loses more of than anybody else.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## It is a lot of hours

Training across town, fixtures an hour away, a weekend tournament, the school
run. Many athletes spend eight to fifteen hours a week in a car, a bus or a
train.

Over a season that is several hundred hours, and for most athletes it is
entirely unplanned.

## Block it honestly

Put travel in the calendar at its real duration, including getting ready,
parking, walking and waiting. A "forty-minute" trip is usually seventy door to
door, and the forty-minute version is why athletes are late.

Then add buffer. Being early is free; being late costs a warm-up, a place in a
team and a reputation that LS-104 says follows you.

## Decide what travel is for

Pick one per journey, in advance, and the decision is the whole lesson:

- **Recovery.** Sleep, eyes shut, nothing. The right choice before a fixture
  and after a hard session.
- **Study.** Reading, listening to recorded notes, flashcards, an audiobook.
  The right choice on a long regular journey where you are not wrecked.
- **Admin.** Messages, planning, booking, the things that clutter the week.
- **Preparation.** Film, the plan, the mental rehearsal.
- **Nothing in particular.** Legitimate, when chosen rather than defaulted to.

Without a decision, every journey defaults to the phone, which is the option
that produces nothing and costs the most.

## What travels well

- Audio: recorded notes, a lecture, a podcast in a subject you are studying.
- Flashcards on a phone, which work in five-minute pieces.
- Reading, if you do not get motion sick.
- Sleep, which is the most undervalued option on this list.

## What does not

- Anything needing a desk, a screen and concentration.
- Writing.
- Anything you will have to redo.

Trying to do real work in the back of a bus and failing is worse than
deliberately resting, because you arrive both unrested and behind.

## Reduce it where you can

- **Combine trips.** Stack the appointment, the shop and the training run.
- **Share lifts**, which also returns an hour to a parent.
- **Train nearer** where there is an equivalent option.
- **Question a journey** that produces little. Some weekly trips survive
  because nobody has ever asked whether they still make sense.

## Overnight and tournaments

A weekend away is a planning problem of its own: pack the night before,
schedule the schoolwork you will realistically do (less than you think),
protect sleep in a shared room, and accept that the week after is a lighter
week. Planning the recovery after a tournament is as much a part of it as
planning the tournament.
""",
            },
            {
                "title": "When the Week Goes Wrong",
                "description": "Triage, saying no, and rebuilding without abandoning the system.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## It will go wrong

An injury, an illness, a family thing, a fixture moved, an exam brought
forward. The test of a system is not a good week; it is what happens in a bad
one.

The usual failure is abandonment: one day collapses, the calendar stops
matching reality, and it is ignored for a month.

## Triage

When a week breaks, do not replan the whole thing. Answer three questions:

**1. What genuinely cannot move?** Usually fewer things than it feels.

**2. What can be smaller?** Most things can be done at half size. Thirty
minutes of revision is not nothing; a shorter session is not a missed one.

**3. What is dropped, on purpose?** Choose it, write it down, and tell whoever
is affected. Something dropped deliberately is a decision; something dropped
silently is a problem later.

## Protect two things

In every bad week, two things hold:

- **Sleep.** It is what makes the rest of the week recoverable.
- **The one genuinely important thing** — the exam, the fixture, the
  application deadline.

Everything else is negotiable. Athletes who protect nothing lose the whole week;
athletes who try to protect everything also lose the whole week.

## Saying no

Most overloaded weeks are a series of small yeses. The useful sentence:

> *"I can't do that this week — can we do it on the 14th?"*

A no with an alternative is not a rejection. LS-302 teaches the full version
of this; here, the rule is that a yes that destroys your week has already cost
somebody else a bad job done late.

Things worth declining: an extra commitment in an exam block, a social thing
the night before a fixture, a favour that only you have been asked for because
you always say yes.

## The weekly reset

Twenty minutes, same time each week — Sunday evening works:

- Look at the week coming: fixtures, deadlines, travel, anything unusual.
- Block the important things first.
- Check what slipped from last week and either reschedule it or kill it.
- Spot the pinch point and plan around it before it arrives.

Twenty minutes buys the whole week, and it is the single habit most likely to
survive from this course.

## Restarting

When the system has lapsed — and it will, twice a year at least — do not
rebuild it elaborately. Open the calendar, block tomorrow, and run the weekly
reset on Sunday.

A system you restart four times a year is working. A perfect system you
abandoned in October is not.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Build the Week",
            "description": (
                "A real calendar, run for two weeks.\n\n"
                "Submit:\n"
                "1. Your single calendar, built in the stated order, with a screenshot of a "
                "full week: fixed commitments, sleep, travel, food, box-two blocks, admin, "
                "free time.\n"
                "2. Five box-two blocks placed in your high-energy hours, named specifically "
                "rather than 'study'.\n"
                "3. Your gaps: the fifteen-minute buffers and the one empty block a day, "
                "visible on the screenshot.\n"
                "4. Your themed days: what each day of the week is shaped around.\n"
                "5. Your travel audit: every recurring journey, its real door-to-door "
                "duration, and your weekly total.\n"
                "6. A purpose assigned to each recurring journey, with what you will actually "
                "do on it.\n"
                "7. One journey you can reduce, combine or question, and what you did about "
                "it.\n"
                "8. Two weeks run: a short note each week on what held, what slipped and what "
                "you changed.\n"
                "9. A triage you actually performed in a week that went wrong: what could not "
                "move, what you shrank, and what you dropped on purpose.\n"
                "10. Your weekly reset: the day, the time, and a screenshot of it in the "
                "calendar as a repeating appointment.\n\n"
                "Graded on whether the calendar is real and was actually run for two weeks, "
                "and on whether part 9 describes a decision rather than a collapse."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Calendar Blocking",
            "description": "Four questions on blocking, travel and recovery from a bad week.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What goes into the calendar immediately after fixed commitments?",
                    "choices": [
                        "Sleep — treated as a fixed commitment, before anything discretionary",
                        "Study blocks",
                        "Travel",
                        "Free time",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does a calendar beat a to-do list?",
                    "choices": [
                        "It can be shared with a coach",
                        "A list says what; a calendar says when, which is the part that makes it happen",
                        "It holds more items",
                        "It sorts tasks by priority automatically",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What happens to a journey with no purpose decided in advance?",
                    "choices": [
                        "It becomes recovery time by default",
                        "It is usually shorter than planned",
                        "It defaults to the phone — the option that produces nothing and costs the most",
                        "It gets used for admin",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which two things hold in every bad week?",
                    "choices": [
                        "Training and school attendance",
                        "The weekly reset and the admin block",
                        "Travel buffers and food",
                        "Sleep, and the one genuinely important thing",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Sleep and Sustainable Load",
        "description": (
            "The input that decides whether everything else works, and how to schedule it "
            "like a session."
        ),
        "lessons": [
            {
                "title": "Sleep Is Training",
                "description": "What it does, how much is needed, and what losing it costs.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Not a luxury

Sleep is when adaptation happens. Training is the stimulus; sleep is where the
body acts on it. An athlete training hard and sleeping badly is doing the
expensive half and skipping the free half.

It is also where memory consolidates, which makes it an academic input as much
as an athletic one.

## How much

Most adolescents need **eight to ten hours**. Athletes in heavy training are at
the upper end, and growth periods push it higher still.

Most student athletes get six to seven, mostly because of late finishes, early
starts and a phone.

The gap between seven and nine hours is not a small optimisation. In study
after study it shows up as slower reaction time, worse decision-making, more
injuries, lower mood and reduced ability to learn.

## What losing it costs

- **Reaction and accuracy** drop measurably after even one short night.
- **Injury risk rises** substantially in chronically under-slept young
  athletes, which is one of the better-established findings in the field.
- **Illness.** Immune function falls, and a missed fortnight costs more than
  the sleep saved.
- **Mood and irritability**, which affects everything in LS-102.
- **Learning.** Revision on four hours' sleep is mostly wasted effort — the
  consolidation did not happen.

## The thing athletes get wrong

Trading sleep for study, the night before. It is a bad trade twice: the revision
is poor because you are tired, and the exam is worse because you are tired.

Nine hours and an honest hour of revision beats five hours and four hours of
exhausted rereading, reliably.

## It is schedulable

Sleep is the clearest case of an important-not-urgent item. Nothing demands it,
so it is what gets taken.

Treat it as a fixed block:

- A **wake time** that is the same every day, including weekends. This matters
  more than the bedtime — it is what sets the whole rhythm.
- A **bedtime** that works backwards from it, plus the time it takes you to
  fall asleep.
- Both in the calendar, as appointments.

## Catching up

Partially possible and not fully. A long weekend lie-in helps a deficit and
does not erase it, and it pushes your body clock later, which makes Monday
worse.

Better: a consistent wake time, and a twenty-minute nap in the early afternoon
when needed. Long or late naps cost that night's sleep.
""",
            },
            {
                "title": "Building the Routine",
                "description": "The practical changes that actually move sleep.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The hour before

What you do in the final hour decides most of it.

- **Phone out of the room.** The single highest-value change here, and the one
  most resisted. Buy a clock; the phone-as-alarm argument is how the phone
  stays.
- **Dim the lights** in the last hour. Light is the main signal your body uses
  to time sleep.
- **No hard conversation, no email, no results.** Nothing that spikes you.
- **Same sequence every night.** Shower, lay kit out, read, lights off. The
  sequence itself becomes the signal.

## The room

- **Dark.** Darker than you think.
- **Cool.** Most people sleep badly warm.
- **Quiet**, or consistently noisy — a fan or white noise beats intermittent
  sound.
- **The bed is for sleeping.** Studying in bed teaches your body that bed is
  where you concentrate.

## The day

- **Daylight early.** Ten minutes outside in the morning anchors the clock
  better than anything you can do at night.
- **Caffeine has a long tail.** It takes many hours to clear; an afternoon
  energy drink is a late-night problem. Energy drinks in particular are a bad
  trade for an adolescent athlete.
- **Train earlier where you can.** A hard session finishing at nine leaves you
  wired at eleven.
- **Eat enough, and not enormously late.**

## The late-finish problem

Many athletes genuinely cannot train earlier. Then:

- Shower and eat promptly rather than drifting.
- Dim everything immediately afterwards.
- Accept a later bedtime and protect the wake time within reason.
- Nap in the afternoon on those days.
- And say plainly: a 9pm finish five nights a week with a 6:30am start is not
  sustainable, and that is a conversation with a coach and a parent, not a
  problem to solve with discipline.

## Competition nights

Sleep after a late fixture is often poor and that is normal — adrenaline takes
hours to clear. Plan for it: a lighter morning after where possible, and no
judgement about a bad night you could not control.

The night *two* nights before competition is the one that matters most, which
is useful because it is the one you can control.

## If sleep is genuinely broken

Lying awake for an hour most nights, waking repeatedly, exhausted despite the
hours, or dreading bed — these are not discipline problems.

Talk to a physician. Sleep disorders are common in adolescents, frequently
treatable, and frequently mistaken for laziness by everybody including the
athlete.
""",
            },
            {
                "title": "Load Over a Season",
                "description": "Planning a year so the hard parts are survivable.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Zoom out

The week is the wrong unit for the real question, which is whether this is
sustainable until June. Athletes plan weeks well and years not at all.

## Map the year

On one page, mark:

- The competitive season and its heaviest blocks.
- Exams and major deadlines.
- Travel and tournaments.
- School holidays.
- Anything personal that is fixed.

Two or three collisions appear immediately: the fixture block that lands on
mock exams, the tournament the week before a deadline.

Those collisions are entirely predictable in September and entirely
unmanageable in March. Seeing them early is most of the value of this lesson.

## Plan around the collisions

- **Move what can move.** Ask early; a deadline can sometimes shift in
  September and never in the final week.
- **Front-load.** Do the work before the collision, not during it.
- **Plan the light week after**, deliberately.
- **Tell people in advance.** A teacher told in September is an ally; told the
  day before, an obstacle.

## Hard weeks need low weeks

The rule that prevents burnout: you can do almost anything for three weeks if
the fourth is lighter.

So build the low weeks in. After a tournament, after exams, at the end of a
block. A planned light week is recovery; an unplanned collapse is not.

## The signals to watch

Across a season, track honestly: sleep quality, mood, motivation, how ordinary
sessions feel, whether you are getting ill repeatedly.

Several of those trending wrong together for more than two weeks is a signal to
act — reduce load, talk to a coach, see a physician. Overtraining and burnout
are far easier to prevent than to recover from, and nobody has ever regretted
raising it early.

## Who to tell

Most athletes carry an overloaded year alone because each part of it is
negotiated with a different person — a coach who does not know the exam
timetable, a teacher who does not know the fixture list, a parent who sees only
the exhaustion.

Nobody has the whole picture except you. So show it to them: the one-page year,
to your coach, your parents and your school. The conversation that follows is
usually far more productive than the athlete expects, and it is the most
valuable thing in this course.

## The point

Time management is not about doing more. For a student athlete it is about
making a very full few years survivable, so that you arrive at the end of them
healthy, with results, having slept, and still wanting to play.

Everything else in this pathway assumes you got through it in one piece.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Sleep and the Year on One Page",
            "description": (
                "Fix the input, then plan the season.\n\n"
                "Submit:\n"
                "1. Two weeks of a sleep log: time to bed, time asleep, time awake, total "
                "hours, and a one-to-five quality rating.\n"
                "2. Your average, against the eight-to-ten target, and your biggest single "
                "cause of lost sleep.\n"
                "3. Your fixed wake time, set and held for all fourteen days including "
                "weekends, shown in the log.\n"
                "4. Your pre-sleep sequence: the four things you do in the last hour, and "
                "where the phone goes.\n"
                "5. Three environmental changes made to your room, with what changed.\n"
                "6. Your caffeine audit: what you drink and when, and the change you made.\n"
                "7. Your late-finish plan, if you train late, including whether this is a "
                "conversation you need to have with a coach.\n"
                "8. A one-page map of your year: season, exams, travel, holidays, fixed "
                "personal commitments.\n"
                "9. The collisions it reveals, and your plan for each — moved, front-loaded, "
                "or followed by a planned light week.\n"
                "10. Your planned light weeks, marked on the map.\n"
                "11. Evidence that you showed the one-page year to a coach, a parent and "
                "somebody at school, and what each of them said.\n\n"
                "Graded on whether the sleep log is complete and honest, and on whether part "
                "11 actually happened."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Sleep and Load",
            "description": "Four questions on sleep, routine and season planning.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why is sleep described as the free half of training?",
                    "choices": [
                        "Training is the stimulus and sleep is where the body acts on it",
                        "It costs nothing to schedule",
                        "It replaces the need for recovery sessions",
                        "It is the only time muscles are used less",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which is more important to keep consistent?",
                    "choices": [
                        "Bedtime, because it determines total hours",
                        "Wake time — including weekends, because it sets the whole rhythm",
                        "Nap timing",
                        "Training time",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the rule that prevents burnout across a season?",
                    "choices": [
                        "Never train more than five days a week",
                        "Take a full week off every month",
                        "You can do almost anything for three weeks if the fourth is lighter",
                        "Reduce load whenever motivation dips",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does the course say to show the one-page year to a coach, a parent and the school?",
                    "choices": [
                        "They need to approve the plan",
                        "It is required for exam accommodations",
                        "It demonstrates professionalism",
                        "Nobody has the whole picture except you — each of them sees only part of the load",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
