"""CEO-302: High-Performance Operations & Kinetic Recovery Protocols.

Level 3: Advanced Executive Operations & Lifetime Legacy. Written against the
course's focus (treating physical and mental health as non-negotiable
operational assets) and its core competencies: sleep hygiene science,
nutrition and supplement auditing, injury recovery frameworks, and burnout
detection mechanisms.

Every module states that it is education rather than medical advice, and sends
the student to their physician, athletic trainer, registered dietitian or a
mental health professional for anything individual — particularly head injury,
disordered eating and mental health, where the lessons deliberately stop and
hand over.
"""

MODULES = [
    {
        "title": "Health as Infrastructure",
        "description": (
            "Reframing sleep, food and recovery as the plant and equipment the whole "
            "enterprise runs on, rather than optional extras."
        ),
        "lessons": [
            {
                "title": "The Asset Everyone Treats as a Cost",
                "description": "Why recovery is capital expenditure, and what the balance sheet looks like when it is skipped.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The operating frame

CEO-101 listed five assets on the Me, Inc. balance sheet and noted that health
is the one most often treated as a cost. In most athletic cultures, recovery is
what you do if there is time left over.

Invert it. **Sleep, food and recovery are the plant and equipment.** They are
what produces the training adaptation, the classroom performance and the
judgement that every other course in this pathway depends on. Training is the
withdrawal; recovery is the deposit. Only one of them makes you better, and it
is not the one that feels like work.

## What skipping it actually costs

Under-recovered athletes are not simply tired. Across the research literature,
insufficient sleep and inadequate fuelling are associated with slower reaction
time, reduced accuracy, impaired learning and memory consolidation, worse mood
regulation, weakened immune response and — consistently — **higher injury
rates**.

That last one is the executive point. The primary risk to this entire enterprise
is an injury that removes you from the field. Recovery is the cheapest insurance
available against the single largest risk you carry.

## Judgement is downstream too

Every governance rule in CEO-101, every contract read in CEO-202, every
interview in CEO-204 is performed by a brain. Decision quality falls measurably
with insufficient sleep, and the person making poor decisions is characteristically
unaware of it. The boundary-setting of CEO-303 is far harder at five hours of
sleep than at nine.

## A note on what this course is

This is education, not medical advice. It will make you a better-informed
operator and a more useful partner to the professionals around you. It does not
replace your physician, your athletic trainer, a registered dietitian or a
mental health professional, and in several places it will stop and tell you to
go to one.
""",
            },
            {
                "title": "Load: What Your Week Is Actually Asking of You",
                "description": "Counting total load across sport, school and life, and the principle behind sensible progression.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Your body does not have separate accounts

An athlete playing two sports, lifting three times a week, taking advanced
coursework and working weekends is carrying a **single** load. The body does not
distinguish the sources. Yet almost every adult in that athlete's life is
managing only their own slice of it, and nobody is adding it up.

Adding it up is your job as chief executive, and it is the second half of the
CEO-101 time and energy matrix.

## Count everything

For a representative week:

- Sport: practices, games, skills sessions, strength work, travel hours.
- Life: paid work, caregiving, long commutes.
- Academic: class, homework, exam preparation.
- Enterprise: filming, editing, meetings.

Then record, each session, a simple effort rating — how hard it felt, one to ten
— and multiply by the minutes. Total it for the week. The number itself means
nothing in isolation; **the trend means everything.**

## The progression principle

The broad principle supported across sports science is that sharp spikes in load
relative to what you have recently been accustomed to are associated with
elevated injury risk. Steady, gradual progression is better tolerated than a
sudden jump.

The practical rules that follow:

- Avoid large week-on-week increases in total load.
- The highest-risk weeks are the first week back after a break, the start of a
  season, and the week after an unusually light period.
- An athlete returning from illness or time off restarts below where they
  stopped, not at it.

## The hidden spikes

Showcase weekends, multi-game tournaments, a second sport starting while the
first finishes, and exam weeks stacked onto a competitive block. These are
planned months in advance and almost never load-managed. Put them in the
calendar now, and plan a reduced week either side.
""",
            },
            {
                "title": "Load Audit and Readiness Tracker",
                "description": "Weekly load calculator with session ratings, plus a simple daily readiness check.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable tracker for Module 1. The load sheet records every session across sport,
school, work and enterprise with its duration and an effort rating, calculating
a weekly total and plotting the trend across twelve weeks so spikes are visible
before they are felt.

The readiness check is five daily questions — sleep hours, sleep quality, muscle
soreness, mood and energy — each scored one to five, with a rolling average and
a flag when the score falls meaningfully below your own baseline. A calendar
panel marks known high-load weeks so the reduced weeks either side can be
planned in advance.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Two-Week Load Audit",
            "description": (
                "Measure what you are actually carrying.\n\n"
                "Submit:\n"
                "1. A two-week load audit covering every session across sport, school, work and "
                "enterprise, with duration and effort rating for each, and a weekly total.\n"
                "2. Fourteen days of the readiness check, completed daily. Partial data honestly "
                "reported scores higher than complete data invented afterwards.\n"
                "3. Your load trend: which week was heavier, by how much, and what drove the "
                "difference.\n"
                "4. Your spike calendar for the next six months: every known high-load period — "
                "tournaments, showcases, season starts, exam weeks, a second sport beginning — "
                "with the reduced weeks you plan either side.\n"
                "5. A hidden-load paragraph: what did the audit reveal that you were not "
                "counting as load at all?\n"
                "6. One sentence naming the adult — coach, trainer, parent — you will show this "
                "audit to, and when.\n\n"
                "Graded on the completeness of the daily data, the honesty of the readiness "
                "scores, and whether the spike calendar is genuinely forward-looking."
            ),
            "total_marks": 100,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Health as Infrastructure",
            "description": "Four questions on the operating frame and load management.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does the course call recovery the cheapest insurance available?",
                    "choices": [
                        "It costs nothing to schedule",
                        "It protects against the largest risk the enterprise carries: an injury that removes you from the field",
                        "It is covered by most school athletic programmes",
                        "It reduces the need for strength training",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course mean by saying the body does not have separate accounts?",
                    "choices": [
                        "Training and competition produce identical adaptations",
                        "Nutrition and sleep are interchangeable",
                        "Sport, school, work and enterprise load are carried as one total, though each adult manages only their slice",
                        "Injury risk is unrelated to total weekly activity",
                    ],
                    "answer": 2,
                },
                {
                    "text": "According to the lesson, which weeks carry the highest risk?",
                    "choices": [
                        "The middle of a long, stable season",
                        "Weeks containing a single competitive fixture",
                        "Weeks with heavy academic load only",
                        "The first week back after a break, the start of a season, and the week after an unusually light period",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What does the course say about the weekly load number itself?",
                    "choices": [
                        "It means nothing in isolation — the trend is what matters",
                        "It should be compared against teammates' totals",
                        "It should be maximised during pre-season",
                        "It determines how many sessions to add next week",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Sleep",
        "description": (
            "The highest-leverage intervention available to a young athlete, and the habits "
            "that protect it."
        ),
        "lessons": [
            {
                "title": "What Sleep Does, and How Much Teenagers Need",
                "description": "The physiology that matters for performance, and the adolescent clock working against you.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## What is actually happening

Sleep is not downtime. During it your body consolidates motor learning — the
skill work you did today is filed overnight — releases growth hormone in its
largest pulses, repairs tissue, restores immune function and clears metabolic
waste from the brain.

Practical translation: **the session you did this afternoon becomes a skill
tonight, or it does not.**

## The number

Sleep medicine guidance for teenagers aged roughly 13 to 18 is **eight to ten
hours per night, regularly**. Athletes in heavy training frequently need the
upper end of that range or beyond.

Studies in which athletes extended their sleep toward ten hours have reported
improvements in sprint times, shooting accuracy, reaction time and mood. There
are few interventions in sport with that profile: free, legal, and with effects
visible within weeks.

## The adolescent clock

Adolescent circadian rhythm shifts later — falling asleep at 10pm is genuinely
harder at sixteen than at ten, and this is biology rather than indiscipline.
Combined with early school start times, the predictable result is chronic
under-sleep across an entire age group.

You cannot change the school timetable. You can change what happens in the
ninety minutes before bed, and you can stop treating the deficit as a character
flaw.

## Sleep debt is real but not fully repayable

A long weekend lie-in recovers some of what was lost, not all. Consistency
outperforms compensation. The target is a **regular** schedule — the same wake
time most days, including weekends, within about an hour.

## Napping

A short nap of around 20-30 minutes in the early afternoon can restore alertness
without creating grogginess or disrupting that night's sleep. Longer or later
naps often do both. Treat naps as a supplement to the night, never a substitute.
""",
            },
            {
                "title": "Building a Sleep Protocol That Survives a Season",
                "description": "The environment, the wind-down, travel nights and the things that quietly destroy sleep.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Protect the schedule first

Work backwards from your wake time. If you must be up at 6:15am and you need
nine hours, lights out is 9:15pm. That is the decision; everything else is
implementation.

This is why sleep belongs in the CEO-101 governance charter as a written rule —
it is the one commitment most likely to be sacrificed to someone else's request.

## The environment

- **Dark.** Cover or remove light sources; use curtains or a mask.
- **Cool.** A slightly cool room supports the temperature drop sleep onset
  depends on.
- **Quiet**, or consistently masked with steady sound.
- **Phone out of the room.** Charge it elsewhere and use a separate alarm. This
  is the single highest-impact change most athletes can make, and the one most
  resisted.

## The wind-down

Sixty to ninety minutes, same sequence nightly: training and hard study finish,
screens down, lights dim, something low-stimulation, then bed. The ritual itself
does the work — the body learns the sequence and begins preparing.

## What quietly destroys sleep

- **Caffeine late in the day.** It has a long half-life; an afternoon energy
  drink is still active at bedtime for many people. Energy drinks are also a
  category worth avoiding generally at this age.
- **Late heavy meals**, and going to bed genuinely hungry. Both disrupt.
- **Evening screens**, for the stimulation as much as the light.
- **Scrolling in bed**, which teaches the brain that bed is where alerting
  happens.
- **Alcohol and cannabis.** Both fragment sleep architecture badly, regardless of
  how sedating they feel.

## Travel and competition nights

Pre-competition sleep is frequently poor and this is normal; the research
suggests the night **two nights before** competition is the one that matters
most, which is the one nobody protects. On travel: bring your own pillowcase and
mask, keep the wind-down sequence even in a hotel, and hold your usual wake
time where you can.

## When to escalate

Persistent difficulty falling or staying asleep, loud snoring or gasping,
daytime sleepiness despite adequate hours — these are clinical matters. Tell
your physician. Sleep disorders are common, treatable, and routinely missed in
athletes who assume exhaustion is simply the price.
""",
            },
            {
                "title": "Sleep Protocol and Log",
                "description": "Two-week sleep log with the environment checklist and wind-down sequence builder.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable pack for Module 2. The log records, each night: lights-out time, wake
time, total hours, awakenings, how rested you felt on waking, plus caffeine
timing, last screen use and last meal — so patterns become visible rather than
theoretical.

The protocol page holds the environment checklist (dark, cool, quiet, phone out
of the room), a wind-down sequence builder with timings worked back from your
required wake time, and a travel and competition-night section including the
two-nights-before principle.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Sleep Audit and Protocol",
            "description": (
                "Measure your sleep for two weeks, then change one thing.\n\n"
                "Submit:\n"
                "1. A fourteen-night sleep log: lights out, wake time, total hours, awakenings, "
                "rested rating, plus caffeine timing, last screen use and last meal each day.\n"
                "2. Your averages: mean hours, the range, and how many nights reached eight "
                "hours.\n"
                "3. Pattern analysis: what correlates with your worst nights in your own data? "
                "Be specific, and distinguish correlation from a conclusion.\n"
                "4. Your written sleep protocol: required wake time, target hours, lights-out "
                "time, environment changes, and your wind-down sequence with timings.\n"
                "5. The one change. Name a single change you made during the second week and "
                "report what happened to your numbers. One change, so you can tell whether it "
                "worked.\n"
                "6. Your competition and travel plan, including the two-nights-before "
                "principle.\n"
                "7. One sentence on whether anything in your log is worth raising with a "
                "physician.\n\n"
                "Graded on the completeness of the fourteen nights, the quality of the pattern "
                "analysis, and whether the protocol is specific enough to follow tonight."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Sleep",
            "description": "Four questions on sleep physiology, requirements and protocol.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the general sleep guidance for teenagers aged roughly 13 to 18?",
                    "choices": [
                        "Six to seven hours, with weekend catch-up",
                        "Eight to ten hours per night, regularly",
                        "As much as possible only during competition weeks",
                        "Seven hours, with a daily two-hour nap",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the lesson say skill work “becomes a skill tonight, or it does not”?",
                    "choices": [
                        "Muscle growth only occurs during competition",
                        "Skills decay unless repeated within 24 hours",
                        "Motor learning is consolidated during sleep",
                        "Technique must be reviewed on film the same evening",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which night does the lesson identify as the one that matters most around competition?",
                    "choices": [
                        "The night immediately before competition",
                        "The night after competition",
                        "Any night during the preceding week equally",
                        "The night two nights before competition",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What does the course describe as the highest-impact and most-resisted change?",
                    "choices": [
                        "Charging the phone outside the bedroom and using a separate alarm",
                        "Lowering the room temperature",
                        "Eliminating all caffeine permanently",
                        "Taking a daily afternoon nap",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Fuel and the Supplement Audit",
        "description": (
            "Eating to support training and growth, and a rigorous, sceptical approach to "
            "anything sold in a tub."
        ),
        "lessons": [
            {
                "title": "Fuelling a Body That Is Still Growing",
                "description": "Energy availability, the three macronutrients, hydration and timing around training.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The under-fuelling problem

The most common nutritional problem in youth sport is not a bad diet. It is
**not eating enough**, because a growing body plus a heavy training load needs
more energy than most teenagers consume — particularly on long days with early
starts and late practices.

Persistently taking in less energy than training and growth require is described
in sports medicine as **low energy availability**, and the associated syndrome —
Relative Energy Deficiency in Sport — is linked to impaired bone health,
disrupted hormones and menstrual function, weakened immunity, poor recovery,
stress fractures and reduced performance. It affects athletes of every gender.

The plain version: if you are training hard and not eating enough, you are not
getting leaner and sharper. You are disassembling the asset.

## The three macronutrients, briefly

- **Carbohydrate** is the primary fuel for high-intensity work. Low-carbohydrate
  approaches marketed to adults are a poor fit for a growing athlete in heavy
  training.
- **Protein** supports repair and adaptation, spread across the day rather than
  concentrated in one meal.
- **Fat** supports hormone production and is not the enemy of anything.

Specific amounts depend on your body, sport and training load and belong with a
**registered dietitian**, ideally one with sports experience. Many schools and
university programmes can refer you.

## Timing, simply

- Something before training rather than nothing.
- Carbohydrate and protein reasonably soon after hard sessions.
- Breakfast, which athletes with early starts skip most often and need most.
- Do not come into a competitive day in deficit from the day before.

## Hydration

Drink across the day rather than in one large volume before training. Urine
colour is a serviceable rough indicator. In heavy sweating or long sessions,
sodium matters as well as water. Thirst lags behind need during intense
exercise.

## When to stop reading and get help

Any of the following are matters for a physician or a qualified professional
without delay, not a course: food rules that feel impossible to break, eating
driven by guilt or compensation, hiding eating, a missed or absent menstrual
cycle, repeated stress injuries, or rapid unintended weight change in either
direction. Disordered eating is serious, common in athletics, and treatable.
Telling an adult is the entire first step.
""",
            },
            {
                "title": "The Supplement Audit",
                "description": "How supplements are regulated, the contamination risk, and a decision process for any product.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The regulatory reality

In the United States, dietary supplements are **not reviewed or approved for
safety and effectiveness before they are sold**. Responsibility for what is in
the tub sits with the manufacturer. Enforcement is largely after the fact.

Consequences that matter to an athlete:

- A product may not contain what the label claims.
- It may contain something the label does not claim — including substances
  banned in sport, which have been found repeatedly in products marketed as
  ordinary supplements.
- Claims about performance are frequently unsupported.

## Strict liability

In drug-tested sport, the athlete is generally responsible for what is in their
body, **regardless of how it got there**. "It was in my pre-workout and the
label didn't say" has not historically been a successful defence. A supplement
you did not need can end a season you worked years for.

## The decision process

Run every product through this, in order:

1. **Is this food's job?** Most supplement purposes are better served by eating
   and sleeping properly. Start there, always.
2. **Is there a genuine identified need?** A documented deficiency diagnosed by
   a clinician, a dietary restriction, a specific recommendation from your
   physician or dietitian. "A teammate uses it" is not a need.
3. **Is it third-party certified?** Independent certification programmes such as
   NSF Certified for Sport and Informed Sport test products for banned
   substances. Certification is not a guarantee of effectiveness, but an
   uncertified product is an unquantified risk.
4. **What do the rules say?** Your state association, your college association
   and your sport's anti-doping rules. Check the current banned list, not last
   year's.
5. **Who told me to take it, and what do they earn if I say yes?** The CEO-101
   conflict test. Supplement recommendations from someone who sells supplements
   are advertising.

## The categories to be most careful with

Pre-workouts and energy products, anything marketed for muscle gain, weight
loss or "testosterone support", imported products, anything sold through a
personal distributor network, and anything promising a result that sounds
better than training.

## Who decides

You do not take a supplement your parent or guardian and your physician do not
know about. Full stop. That is a rule for the governance charter, not a
preference.
""",
            },
            {
                "title": "Fuelling Plan and Supplement Audit Sheet",
                "description": "Day-in-the-life fuelling planner plus a decision sheet for every product you take.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable pack for Module 3. The fuelling planner maps a heavy training day hour
by hour — wake, breakfast, school meals, pre-training, post-training, evening
meal — with space to record what you actually ate for three days and compare it
against the plan.

The supplement audit sheet takes one row per product you currently take or are
considering: what it claims, the identified need and who identified it,
third-party certification status, the rule check against your association's
current banned list, who recommended it and what they earn, and the final
decision with the date your guardian and physician were told.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Fuelling Review and Supplement Audit",
            "description": (
                "Look honestly at what goes in, and audit anything in a tub.\n\n"
                "Submit:\n"
                "1. A three-day food and fluid record covering at least one heavy training day. "
                "Record what you actually ate, not what you intended to.\n"
                "2. A gap analysis against the lesson: are you eating before training, after "
                "hard sessions, and at breakfast? Where are the gaps, and what causes each one — "
                "time, access, appetite, cost, or habit?\n"
                "3. A completed supplement audit for every product you currently take, including "
                "anything routine such as a protein powder or a multivitamin. If you take none, "
                "audit one product currently marketed to athletes your age instead.\n"
                "4. Certification research: for one product, establish whether it carries "
                "third-party certification and show how you checked.\n"
                "5. Your written supplement rule, for the governance charter.\n"
                "6. One sentence naming a qualified professional — dietitian, physician, "
                "athletic trainer — you could ask about your fuelling, and how you would reach "
                "them.\n\n"
                "No submission should include a self-diagnosis or a self-prescribed plan. The "
                "assignment is auditing and identifying who to ask.\n\n"
                "Graded on the honesty of the food record, the quality of the gap analysis, and "
                "the rigour of the supplement audit."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Fuel and Supplements",
            "description": "Four questions on energy availability and supplement risk.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What does the course identify as the most common nutritional problem in youth sport?",
                    "choices": [
                        "Excessive protein intake",
                        "Not eating enough for the training load and growth",
                        "Over-reliance on supplements",
                        "Excessive hydration before competition",
                    ],
                    "answer": 1,
                },
                {
                    "text": "How are dietary supplements regulated in the United States?",
                    "choices": [
                        "They must be approved for safety and effectiveness before sale",
                        "They are tested by the relevant sports governing body before sale",
                        "They are not reviewed or approved for safety and effectiveness before being sold",
                        "They are exempt from all labelling requirements",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does strict liability mean for an athlete in drug-tested sport?",
                    "choices": [
                        "Only intentional use results in sanction",
                        "The manufacturer is responsible for contamination",
                        "A certified product removes all responsibility",
                        "The athlete is generally responsible for what is in their body, regardless of how it got there",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What is the first question in the supplement decision process?",
                    "choices": [
                        "Is this food's job, better served by eating and sleeping properly?",
                        "Is it third-party certified?",
                        "Can I afford it consistently?",
                        "Do my teammates use it?",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Injury and the Recovery Framework",
        "description": (
            "Prevention, honest reporting, the stages of rehabilitation, and the decisions "
            "that belong to clinicians rather than to you."
        ),
        "lessons": [
            {
                "title": "Reporting, Not Hiding",
                "description": "The culture problem behind most aggravated injuries, and how to report accurately.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The expensive habit

Athletes hide injuries. The reasons are understandable — losing a place, letting
the team down, a scholarship conversation, being labelled fragile. The outcome
is consistent: a manageable problem becomes a long one.

The executive framing: **concealing information from your own operations team is
the worst decision available.** You would not hide a failing component from an
engineer and then ask them to certify the machine.

## Report accurately

Vague reports produce vague treatment. Give the people helping you something to
work with:

- **Where**, precisely. Point to it.
- **When** it started, and what you were doing.
- **What it feels like** — sharp, dull, burning, catching, unstable.
- **What makes it worse and better.**
- **Whether it is changing** over days.
- **Whether it affects sleep**, which usually indicates a more significant
  problem.

Keep a short injury log. Six weeks of notes is extremely useful to a clinician
and impossible to reconstruct from memory.

## Pain is information, not an opponent

Some discomfort is a normal training signal. Signals that warrant stopping and
being assessed include: sharp pain, pain that changes how you move, swelling,
giving way or instability, numbness or tingling, night pain, and anything that
worsens session after session.

Training through pain by altering your mechanics is how one injury becomes two,
in a different place.

## Head injuries are categorically different

Any suspected concussion is removed from play immediately and assessed by a
qualified professional. This is not a judgement call for an athlete, a coach, a
parent or this course, and in most states it is governed by law and by your
association's protocol. Symptoms can appear hours later. Returning too early
carries serious risk.

There is no version of this where toughness is the relevant consideration.
Report it, including when it happened to a teammate and they do not want to say.
""",
            },
            {
                "title": "The Stages of Return",
                "description": "How rehabilitation progresses, who makes each decision, and the psychology of coming back.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## A framework, not a timetable

Rehabilitation generally moves through recognisable stages, each gated by
criteria rather than by the calendar:

1. **Protect and settle.** Manage the acute phase under guidance, maintain what
   can safely be maintained elsewhere.
2. **Restore range and basic function.** Movement before strength.
3. **Rebuild strength and control**, progressively loaded.
4. **Reintroduce sport-specific movement**, then speed, then change of
   direction, then contact or volume.
5. **Return to training**, fully, before returning to competition.
6. **Return to competition**, with the load progression from Module 1 respected.

**Who decides each gate: your physician and athletic trainer.** Not you, not
your coach, and not how you feel on a good morning. Your job is to be the most
compliant, most accurate-reporting patient they have.

## What you can control while injured

- Doing the rehabilitation exactly as prescribed, including on the days it feels
  pointless.
- Maintaining fitness in whatever way is cleared.
- Protecting sleep and fuel, which matter more during healing, not less.
- Staying present with the team.
- Keeping your academic and enterprise work moving — the injury does not pause
  CEO-102 or CEO-201, and the athletes who use the time well come back ahead in
  two of the three lanes.

## The psychological side is not optional

Injury commonly brings low mood, anxiety about returning, loss of identity and
isolation — well documented and rarely discussed in the training room. Fear of
re-injury is one of the strongest predictors of a poor return.

Say it out loud to someone. A physician, a counsellor, your athletic trainer,
your family. An athlete who says "I'm scared this goes again" and gets support
returns better than one who does not, and the second athlete is far more common.

## The hardest conversation

Sometimes the correct answer is that this season is over, or that this sport is
over. Those conversations happen with clinicians and family, and the CEO-102
optionality work exists precisely so that the answer does not take everything
with it.
""",
            },
            {
                "title": "Injury Log and Return Framework",
                "description": "Structured injury log plus the staged return framework with gate criteria.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable pack for Module 4. The injury log gives a structured daily entry:
location, description, severity, what made it better or worse, effect on sleep,
what you did and who you told — in a form a clinician can read in thirty
seconds.

The return framework lays out the six stages with space for the criteria your
clinician sets for each gate, who signs it off, and the date. A side panel lists
the signals that mean stop and be assessed, the concussion protocol reminder, and
a prompt for the psychological check-in at each stage.""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Injury Protocol and Reporting Practice",
            "description": (
                "Build the protocol before you need it.\n\n"
                "Submit:\n"
                "1. Your injury reporting protocol: who you tell, in what order, within what "
                "timeframe, with real names and contact details for your athletic trainer, "
                "physician and the responsible adult at your school.\n"
                "2. A written report of a current or past injury using the six-point structure "
                "from the lesson — where, when, what it feels like, what changes it, whether it "
                "is changing, whether it affects sleep. If you have never been injured, "
                "interview a teammate and write their report with permission.\n"
                "3. The stop-and-assess list in your own words, and one paragraph on an occasion "
                "you or someone you know trained through something that should have been "
                "assessed.\n"
                "4. Your school's or association's concussion protocol, found, cited and "
                "summarised in plain language.\n"
                "5. An injured-athlete plan: if you were ruled out for eight weeks tomorrow, "
                "what would your week look like? Include rehabilitation, maintained fitness, "
                "academics, enterprise work and team presence.\n"
                "6. One paragraph on the psychological side — what you would find hardest, and "
                "who you would tell.\n\n"
                "Graded on whether the protocol has real names in it, on the precision of the "
                "injury report, and on the realism of the injured-athlete plan."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: Injury and Recovery",
            "description": "Four questions on reporting, rehabilitation stages and concussion.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the course's framing of hiding an injury?",
                    "choices": [
                        "An understandable short-term trade-off during an important season",
                        "Concealing information from your own operations team — the worst decision available",
                        "Acceptable if the pain is manageable",
                        "A decision for the coaching staff rather than the athlete",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Who decides whether an athlete passes each gate in the return framework?",
                    "choices": [
                        "The athlete, based on how they feel",
                        "The head coach, based on team need",
                        "The physician and athletic trainer, against criteria",
                        "The athlete's family, after consulting the schedule",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say about a suspected concussion?",
                    "choices": [
                        "Monitor for an hour before deciding whether to remove the athlete",
                        "Remove only if the athlete lost consciousness",
                        "Allow the athlete to decide if symptoms are mild",
                        "Remove from play immediately and have it assessed by a qualified professional",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Which is named as one of the strongest predictors of a poor return from injury?",
                    "choices": [
                        "Fear of re-injury",
                        "The athlete's age at the time of injury",
                        "The length of the rehabilitation programme",
                        "The sport played",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Mental Load and Burnout Detection",
        "description": (
            "Recognising overtraining and burnout early, building a monitoring system, and "
            "knowing when to involve a professional."
        ),
        "lessons": [
            {
                "title": "What Burnout Actually Looks Like",
                "description": "The difference between fatigue, overreaching and burnout, and the early signals.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Three different states

**Fatigue.** Normal, expected, resolves with a few days of reduced load.

**Overreaching.** Accumulated fatigue with performance decline, needing one to
several weeks of genuine reduction. Recoverable, and common in a hard block.

**Burnout.** A longer-term state combining emotional and physical exhaustion, a
reduced sense of accomplishment and **devaluation of the sport** — the thing you
loved now feels like an obligation. This one does not resolve with a long
weekend.

Telling them apart early is the skill. By the time it is obvious to everyone, it
has usually been developing for months.

## Early signals

Physical: persistent heaviness, performance plateau or decline despite training,
elevated resting heart rate, frequent minor illness, niggling injuries that
accumulate, disturbed sleep despite exhaustion.

Psychological: dread before training, irritability, apathy toward results,
withdrawal from teammates, difficulty concentrating in class, loss of enjoyment
in things outside sport too.

The one athletes notice last: **"I don't care how this goes."** From a
competitive person, that is a significant signal rather than a mood.

## What drives it in young athletes

- Year-round single-sport participation without an off-season.
- Identity entirely fused with performance — the CEO-101 third pillar exists
  partly for this reason.
- Pressure from adults, including well-meaning pressure.
- No autonomy: everything scheduled, nothing chosen.
- Under-recovery compounding over months.

## Monitoring beats intuition

Use the readiness check from Module 1 plus three weekly questions:

1. Did I look forward to training this week?
2. Is my performance trending with my effort?
3. What am I doing that is not sport, and did I do it this week?

Scored weekly, the trend shows a decline you would not notice day to day — which
is exactly what this is for.
""",
            },
            {
                "title": "Intervening Early, and Getting Help",
                "description": "What to do when the signals appear, and the line where this stops being a self-management question.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The early intervention

Caught early, the response is unglamorous and effective:

- **Reduce load deliberately** for one to three weeks. Reduce, not stop.
- **Restore sleep and fuel** first, before anything is added back.
- **Reinstate something non-sport** that you choose, with nobody evaluating you.
- **Have the conversation with your coach.** Most respond far better than
  athletes expect, particularly when you arrive with data rather than feelings:
  "here is my readiness trend over six weeks" is a different conversation from
  "I'm tired".
- **Schedule an actual off-season.** Sports medicine guidance commonly
  recommends time away from organised sport each year and avoiding year-round
  single-sport specialisation in young athletes.

## Saying it out loud

Telling an adult that you are struggling is a professional act, not a
confession. Executives escalate problems; it is the main thing they do. The
athletes who come apart are rarely the ones who spoke early.

## Where this course stops

Burnout and clinical mental health conditions overlap and are not the same
thing. The following are matters for a mental health professional, your
physician or a crisis service — not a self-management plan and not this course:

- Persistent low mood, hopelessness or loss of interest lasting more than two
  weeks.
- Anxiety that interferes with ordinary functioning.
- Panic episodes.
- Disordered eating.
- Substance use as coping.
- Any thoughts of self-harm or suicide.

**Any thought of self-harm is an immediate conversation with a trusted adult or
a crisis line, today.** Not after the season, not after this module. Help is
available, these conditions are treatable, and telling someone is the whole
first step.

## The executive conclusion

CEO-101 said health was the asset most treated as a cost. The courses that
follow — relationships in CEO-303, the capstone in CEO-304 — assume an operator
who is sleeping, eating, recovering and able to notice their own state. That is
not the soft part of the pathway. It is the part everything else stands on.
""",
            },
            {
                "title": "Burnout Monitoring and Response Plan",
                "description": "Weekly monitoring sheet, trend chart and a staged response plan with escalation points.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable pack for Module 5. The monitoring sheet combines the daily readiness
check with the three weekly questions and plots a twelve-week trend, with a
threshold line you set from your own baseline rather than a generic number.

The response plan is staged: what you do at a mild decline (load reduction,
sleep and fuel first), at a sustained decline (the coach conversation, with the
data), and the escalation list — the specific signals that mean contacting a
physician or mental health professional, with names, numbers and a crisis line
filled in before they are needed.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Monitoring System and Response Plan",
            "description": (
                "Build the early-warning system and decide the responses in advance.\n\n"
                "Submit:\n"
                "1. Four weeks of monitoring: the daily readiness check plus the three weekly "
                "questions, with your trend plotted.\n"
                "2. Your personal baseline and the threshold below which you will act, with "
                "reasoning.\n"
                "3. Your staged response plan: what you do at a mild decline, at a sustained "
                "decline, and the escalation list with real names and numbers including a crisis "
                "line.\n"
                "4. Your off-season plan: when is your genuine time away from organised sport "
                "this year, how long, and what you will do instead?\n"
                "5. The coach conversation: write out, as you would say it, how you would raise "
                "a sustained decline with your coach using your data.\n"
                "6. A self-assessment against the drivers listed in the lesson — year-round "
                "specialisation, fused identity, adult pressure, lack of autonomy, "
                "under-recovery. Which apply to you, honestly?\n\n"
                "Nothing in this assignment asks you to diagnose yourself. If completing it "
                "surfaces something that concerns you, the correct next step is the conversation "
                "in part 3, not a better submission.\n\n"
                "Graded on the consistency of the four weeks of data, on whether the escalation "
                "list is filled in with real contacts, and on the honesty of the "
                "self-assessment."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: Burnout Detection",
            "description": "Four questions on distinguishing states and responding early.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What distinguishes burnout from overreaching?",
                    "choices": [
                        "Burnout only affects athletes in individual sports",
                        "Burnout resolves with a long weekend; overreaching does not",
                        "Burnout includes devaluation of the sport and does not resolve with a short rest",
                        "Overreaching is psychological while burnout is purely physical",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which signal does the lesson say athletes notice last?",
                    "choices": [
                        "Elevated resting heart rate",
                        "“I don't care how this goes”, from a competitive person",
                        "Frequent minor illness",
                        "Disturbed sleep",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What makes the conversation with a coach go better, according to the lesson?",
                    "choices": [
                        "Raising it immediately after a poor performance",
                        "Asking a parent to raise it instead",
                        "Waiting until the end of the season",
                        "Arriving with data — a readiness trend — rather than only feelings",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Where does the course say self-management stops?",
                    "choices": [
                        "At persistent low mood, anxiety that interferes with functioning, disordered eating, or any thought of self-harm — all matters for a professional",
                        "At any performance decline lasting more than one week",
                        "At the point a coach disagrees with the athlete",
                        "Only when a physician raises it first",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Performance Operating System",
        "description": (
            "The capstone: assembling load, sleep, fuel, injury and monitoring into one "
            "written system with a support team attached."
        ),
        "lessons": [
            {
                "title": "One System, Four Protocols",
                "description": "Assembling the course into a document that holds under a real season.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The document

Your performance operating system is one page per protocol, four protocols:

**1. Load.** Your weekly load ceiling, the spike calendar for the next six
months, the reduced weeks planned around each spike, and the readiness check you
run daily.

**2. Sleep.** Required wake time, target hours, lights-out time, environment
rules, wind-down sequence, competition and travel protocol.

**3. Fuel.** Your eating plan on a heavy day, your non-negotiables (breakfast,
post-session, pre-competition), your hydration habit, your supplement rule, and
the professional you ask.

**4. Recovery and monitoring.** Injury reporting protocol with names, the
stop-and-assess list, the return framework, the burnout monitoring thresholds
and the staged response with escalation contacts.

## The non-negotiables go to the charter

Three or four of these belong in the CEO-101 governance charter, written as
rules rather than intentions:

- A sleep floor that nothing moves.
- Eating before and after training, regardless of schedule.
- Reporting every injury within 24 hours.
- No supplement unknown to your guardian and physician.

Rules, because the moment they matter is the moment you are least able to decide
well.

## Build the support team

Name them, with contact details, in the document: physician, athletic trainer,
dietitian if you have access, mental health professional or counsellor, and the
adult you tell first. Several slots may be empty. An empty slot is a task for
this year, exactly as in CEO-101.

## Review it on the cadence you already have

The CEO-101 operating cadence already exists: weekly review, monthly close,
season retrospective. Health metrics simply join them — sleep average and
readiness trend weekly, load trend monthly, the whole system each season.
""",
            },
            {
                "title": "Running It Through a Real Season",
                "description": "What breaks first, how to adapt without abandoning, and the honest audit afterwards.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## What breaks first

Predictably:

- **Sleep**, in the first fortnight of competition, to travel and late finishes.
- **Breakfast**, to early starts.
- **The monitoring**, around week five, when the novelty is gone.
- **The off-season**, to one more opportunity that seemed too good to refuse.

Knowing the order is useful: it tells you which one to defend hardest and which
to design around rather than rely on willpower for.

## Adapt without abandoning

A system that cannot bend gets dropped. Build in the reduced version now:

- *Minimum viable monitoring:* the five-question readiness check only, sixty
  seconds.
- *Minimum viable sleep protocol:* phone out of the room and a fixed lights-out,
  even if the wind-down goes.
- *Minimum viable fuel:* something before training and something within an hour
  after, even if it is not the plan.

Running the minimum version for three weeks is a success. Abandoning the full
version in week two is how most athletes end up with nothing.

## The post-season audit

At the season retrospective, four questions with your own data:

1. What was my average sleep, and how did it track against my performance and
   injuries?
2. Where did load spike, and what happened in the following two weeks?
3. Which protocol held and which collapsed, and why?
4. What one structural change would make next season better? One — the CEO-101
   retrospective rule.

## The closing argument

Health is not the part of this pathway you get to once the business is working.
It is the part that decides whether there is a business, a season, or a career
to manage at all. Protect it like infrastructure, because that is what it is.
""",
            },
            {
                "title": "Performance Operating System Template",
                "description": "Four-page system template with the support team register and seasonal audit.",
                "type": "PDF",
                "minutes": 20,
                "body": """Printable template for the CEO-302 capstone. One page per protocol — load,
sleep, fuel, recovery and monitoring — each laid out with the fields from the
lesson and a minimum-viable version printed alongside the full one.

The support team register names your physician, athletic trainer, dietitian,
mental health contact and the adult you tell first, with contact details and
empty slots left visible. A final page holds the seasonal audit with the four
questions and space for the single structural change.""",
            },
        ],
        "assignment": {
            "title": "Capstone — Your Performance Operating System",
            "description": (
                "Assemble the course into a system, attach a team to it, and have it reviewed by "
                "someone qualified.\n\n"
                "Part A — The system. Four pages: load, sleep, fuel, and recovery and "
                "monitoring. Each with real numbers, real dates and your minimum-viable version "
                "beside the full one.\n\n"
                "Part B — The non-negotiables. Three or four health rules written for your "
                "CEO-101 governance charter, in the format: in this situation, I do this, and "
                "here is why.\n\n"
                "Part C — The support team. Named contacts for physician, athletic trainer, "
                "dietitian, mental health professional or counsellor, and the adult you tell "
                "first. Where a slot is empty, state the specific step you will take this term "
                "to fill it.\n\n"
                "Part D — The professional review, 200-300 words. Take your system to a "
                "qualified adult — athletic trainer, coach, school nurse, physician or "
                "counsellor. Ask two questions: what in here is wrong or risky, and what have I "
                "left out? Report what they said and what you changed.\n\n"
                "Part E — Baseline data. Attach your sleep averages, load trend and readiness "
                "baseline from Modules 1, 2 and 5, so next season's audit has something to "
                "compare against.\n\n"
                "Graded on whether the system is specific enough to follow without you "
                "explaining it, on whether the minimum-viable versions are genuinely "
                "sustainable, and on evidence that the professional review happened."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: The Performance Operating System",
            "description": "Four questions on assembling and sustaining the system.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which four protocols make up the performance operating system?",
                    "choices": [
                        "Load, sleep, fuel, and recovery and monitoring",
                        "Strength, speed, skill and strategy",
                        "Training, competition, travel and rest",
                        "Diet, hydration, stretching and sleep",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does the course say some health protocols belong in the governance charter as rules?",
                    "choices": [
                        "Coaches require written health commitments",
                        "The moment they matter is the moment you are least able to decide well",
                        "Rules are easier to share with sponsors",
                        "A charter rule cannot be changed later",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course identify as the first thing to break during a season?",
                    "choices": [
                        "The fuelling plan",
                        "The injury reporting protocol",
                        "Sleep, in the first fortnight of competition",
                        "The load ceiling",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the purpose of the minimum-viable version of each protocol?",
                    "choices": [
                        "To use during the off-season only",
                        "To provide a simplified version for younger athletes",
                        "To satisfy a coach who objects to the full system",
                        "So the system can bend in a hard week instead of being abandoned entirely",
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
            "Module 1's tracker. Your body does not have separate accounts — sport, school, work "
            "and enterprise are one load, and nobody else is adding them up. The weekly number "
            "means nothing on its own; the trend means everything."
        ),
        "sections": [
            {
                "heading": "1. Weekly Load",
                "paragraphs": [
                    "Every session, from every source. Effort is how hard it felt, one to ten; "
                    "load is effort multiplied by minutes."
                ],
                "table": {
                    "columns": ["Session", "Source (sport / school / work / enterprise)", "Minutes", "Effort 1-10", "Load"],
                    "rows": [["", "", "", "", ""] for _ in range(8)],
                },
                "fields": ["Week total", "Last week's total", "Change"],
            },
            {
                "heading": "2. Daily Readiness",
                "paragraphs": [
                    "Five questions, scored one to five, same time each day. The flag is a fall "
                    "below your own baseline — not below a generic number."
                ],
                "table": {
                    "columns": ["Day", "Sleep hours", "Sleep quality", "Soreness", "Mood", "Energy", "Total"],
                    "rows": [["Mon", "", "", "", "", "", ""], ["Tue", "", "", "", "", "", ""], ["Wed", "", "", "", "", "", ""], ["Thu", "", "", "", "", "", ""], ["Fri", "", "", "", "", "", ""], ["Sat", "", "", "", "", "", ""], ["Sun", "", "", "", "", "", ""]],
                },
            },
            {
                "heading": "3. Spike Calendar",
                "paragraphs": [
                    "Showcase weekends, tournaments, a second sport starting, exam weeks stacked "
                    "on a competitive block. These are planned months ahead and almost never "
                    "load-managed. Plan a reduced week either side."
                ],
                "table": {
                    "columns": ["Known high-load period", "Dates", "Reduced week before", "Reduced week after"],
                    "rows": [["", "", "", ""] for _ in range(4)],
                },
                "fields": ["Who I am showing this audit to, and when"],
            },
        ],
    },
    {
        "intro": (
            "Module 2's log and protocol. Sleep is the highest-leverage intervention available to "
            "a young athlete: free, legal, and visible within weeks. Measure for two weeks before "
            "changing anything, then change one thing."
        ),
        "sections": [
            {
                "heading": "1. Fourteen-Night Log",
                "table": {
                    "columns": ["Night", "Lights out", "Wake", "Total hours", "Awakenings", "Rested 1-5", "Last caffeine", "Last screen"],
                    "rows": [["", "", "", "", "", "", "", ""] for _ in range(7)],
                },
            },
            {
                "heading": "2. The Protocol",
                "paragraphs": [
                    "Work backwards from your wake time. Guidance for teenagers is eight to ten "
                    "hours regularly, and athletes in heavy training often need the upper end."
                ],
                "fields": [
                    "Required wake time",
                    "Target hours",
                    "Therefore lights out at",
                    "Wind-down sequence (60-90 min, same order nightly)",
                    "The one change I am making this week",
                ],
                "bullets": [
                    "Dark, cool, quiet. Phone charged outside the room, separate alarm — the highest-impact change and the most resisted.",
                    "Caffeine has a long half-life; an afternoon energy drink is still active at bedtime for many people.",
                    "Alcohol and cannabis fragment sleep architecture badly, however sedating they feel.",
                    "Naps of 20-30 minutes in the early afternoon supplement the night; they never substitute for it.",
                ],
            },
            {
                "heading": "3. Competition, Travel and When to Escalate",
                "paragraphs": [
                    "Pre-competition sleep is often poor and that is normal — the night that "
                    "matters most is two nights before, which is the one nobody protects."
                ],
                "fields": [
                    "My travel kit (pillowcase, mask, earplugs)",
                    "Wake time I hold on the road",
                    "Two-nights-before plan",
                    "Anything worth raising with a physician (snoring, gasping, daytime sleepiness despite hours)",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 3's planner and audit. The most common nutritional problem in youth sport is "
            "not a bad diet — it is not eating enough. Specific amounts belong with a registered "
            "dietitian; this page is for seeing the gaps and knowing who to ask."
        ),
        "sections": [
            {
                "heading": "1. A Heavy Training Day",
                "table": {
                    "columns": ["Time", "Planned", "What I actually ate", "Fluid"],
                    "rows": [
                        ["Wake", "", "", ""],
                        ["Breakfast", "", "", ""],
                        ["Mid-morning", "", "", ""],
                        ["Lunch", "", "", ""],
                        ["Pre-training", "", "", ""],
                        ["Post-training", "", "", ""],
                        ["Evening meal", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Gap Analysis",
                "bullets": [
                    "Something before training rather than nothing.",
                    "Carbohydrate and protein reasonably soon after hard sessions.",
                    "Breakfast — skipped most often by athletes with early starts, and needed most.",
                    "Never arrive at a competitive day in deficit from the day before.",
                ],
                "fields": ["My biggest gap", "What causes it — time, access, appetite, cost or habit", "The dietitian / physician / trainer I can ask"],
            },
            {
                "heading": "3. Supplement Audit",
                "paragraphs": [
                    "Supplements are not reviewed or approved for safety and effectiveness before "
                    "sale. In drug-tested sport you are generally responsible for what is in your "
                    "body regardless of how it got there — so an uncertified product is an "
                    "unquantified risk."
                ],
                "table": {
                    "columns": ["Product", "What it claims", "Identified need, and who identified it", "Third-party certified?", "On a current banned list?", "Who recommended it / what they earn", "Decision"],
                    "rows": [["", "", "", "", "", "", ""] for _ in range(3)],
                },
                "fields": ["My supplement rule, for the governance charter", "Date guardian and physician were told"],
            },
        ],
    },
    {
        "intro": (
            "Module 4's log and framework. Athletes hide injuries and a manageable problem becomes "
            "a long one. Concealing information from your own operations team is the worst "
            "decision available."
        ),
        "sections": [
            {
                "heading": "1. Injury Log",
                "paragraphs": [
                    "Written so a clinician can read it in thirty seconds. Six weeks of this is "
                    "extremely useful and impossible to reconstruct from memory."
                ],
                "table": {
                    "columns": ["Date", "Where exactly", "What it feels like", "Severity 1-10", "Better / worse with", "Affects sleep?", "Who I told"],
                    "rows": [["", "", "", "", "", "", ""] for _ in range(5)],
                },
            },
            {
                "heading": "2. Stop and Be Assessed",
                "bullets": [
                    "Sharp pain, or pain that changes how you move.",
                    "Swelling, giving way, or instability.",
                    "Numbness or tingling.",
                    "Night pain, or anything worsening session after session.",
                    "Any suspected concussion: removed from play immediately and assessed by a qualified professional. Symptoms can appear hours later. This is never a judgement call for an athlete, a coach or a parent.",
                ],
                "fields": ["Athletic trainer", "Physician", "Responsible adult at school", "My school's concussion protocol — where it is"],
            },
            {
                "heading": "3. The Staged Return",
                "paragraphs": [
                    "Each gate is opened by your physician and athletic trainer against criteria — "
                    "not by you, not by your coach, and not by how you feel on a good morning."
                ],
                "table": {
                    "columns": ["Stage", "Criteria set by my clinician", "Signed off by", "Date"],
                    "rows": [
                        ["1. Protect and settle", "", "", ""],
                        ["2. Restore range and function", "", "", ""],
                        ["3. Rebuild strength and control", "", "", ""],
                        ["4. Sport-specific movement, speed, change of direction", "", "", ""],
                        ["5. Return to full training", "", "", ""],
                        ["6. Return to competition", "", "", ""],
                    ],
                },
                "fields": ["Psychological check-in: what I am afraid of, and who I told"],
            },
        ],
    },
    {
        "intro": (
            "Module 5's monitoring sheet. Caught early, the response is unglamorous and effective. "
            "By the time a decline is obvious to everyone it has usually been developing for "
            "months — which is what the trend line is for."
        ),
        "sections": [
            {
                "heading": "1. Weekly Monitoring",
                "table": {
                    "columns": ["Week", "Readiness average", "Looked forward to training?", "Performance tracking effort?", "Did something non-sport?"],
                    "rows": [["", "", "", "", ""] for _ in range(6)],
                },
                "fields": ["My baseline readiness average", "The threshold below which I act"],
            },
            {
                "heading": "2. Fatigue, Overreaching, Burnout",
                "table": {
                    "columns": ["State", "What it looks like", "What it needs"],
                    "rows": [
                        ["Fatigue", "Normal, expected", "A few days of reduced load"],
                        ["Overreaching", "Accumulated fatigue, performance decline", "One to several weeks of genuine reduction"],
                        ["Burnout", "Exhaustion, reduced accomplishment, devaluation of the sport", "Does not resolve with a long weekend"],
                    ],
                },
                "bullets": [
                    "The signal athletes notice last: “I don't care how this goes”, from a competitive person.",
                    "Drivers: year-round single-sport play, identity fused with performance, adult pressure, no autonomy, under-recovery.",
                ],
            },
            {
                "heading": "3. Staged Response and Escalation",
                "paragraphs": [
                    "Fill the escalation contacts in before they are needed. Telling an adult you "
                    "are struggling is a professional act — executives escalate problems; it is "
                    "the main thing they do."
                ],
                "table": {
                    "columns": ["Stage", "What I do"],
                    "rows": [
                        ["Mild decline", "Reduce load 1-3 weeks; restore sleep and fuel first"],
                        ["Sustained decline", "The coach conversation, with the data; reinstate something non-sport; schedule a real off-season"],
                        ["Escalate", "Contact a physician or mental health professional"],
                    ],
                },
                "fields": [
                    "Physician",
                    "Counsellor or mental health professional",
                    "Adult I tell first",
                    "Crisis line",
                    "My off-season: when, how long, what I do instead",
                ],
            },
        ],
    },
    {
        "intro": (
            "The CEO-302 capstone. Four protocols on four pages, each with a minimum-viable "
            "version beside it — a system that cannot bend gets dropped, and running the minimum "
            "for three weeks beats abandoning the full version in week two."
        ),
        "sections": [
            {
                "heading": "1. The Four Protocols",
                "table": {
                    "columns": ["Protocol", "Full version", "Minimum viable version"],
                    "rows": [
                        ["Load", "Weekly ceiling, spike calendar, reduced weeks, daily readiness", "The five-question readiness check only"],
                        ["Sleep", "Wake time, target, lights out, environment, wind-down, travel plan", "Phone out of the room and a fixed lights-out"],
                        ["Fuel", "Heavy-day plan, non-negotiables, hydration, supplement rule", "Something before training, something within an hour after"],
                        ["Recovery and monitoring", "Reporting protocol, stop list, return framework, burnout thresholds", "Report anything new within 24 hours"],
                    ],
                },
            },
            {
                "heading": "2. Health Rules for the Governance Charter",
                "paragraphs": [
                    "Written as rules, because the moment they matter is the moment you are least "
                    "able to decide well."
                ],
                "fields": [
                    "Sleep floor that nothing moves",
                    "Eating before and after training, regardless of schedule",
                    "Reporting every injury within 24 hours",
                    "No supplement unknown to my guardian and physician",
                ],
            },
            {
                "heading": "3. Support Team and Seasonal Audit",
                "paragraphs": [
                    "Empty slots stay visible — an empty slot is a task for this year, exactly as "
                    "in CEO-101."
                ],
                "table": {
                    "columns": ["Role", "Name", "Contact", "Step to fill it if empty"],
                    "rows": [
                        ["Physician", "", "", ""],
                        ["Athletic trainer", "", "", ""],
                        ["Dietitian", "", "", ""],
                        ["Mental health professional / counsellor", "", "", ""],
                        ["The adult I tell first", "", "", ""],
                    ],
                },
                "bullets": [
                    "What was my average sleep, and how did it track against performance and injuries?",
                    "Where did load spike, and what happened in the following two weeks?",
                    "Which protocol held and which collapsed, and why?",
                    "What ONE structural change would make next season better?",
                ],
            },
        ],
    },
]
