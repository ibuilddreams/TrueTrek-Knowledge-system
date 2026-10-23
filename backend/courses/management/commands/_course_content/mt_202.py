"""MT-202: Processing Pressure & The Anxiety Protocol.

Level 2: The Tactical Arsenal (Performance Under Fire). Written against the
course's focus (converting nervous energy into competitive fuel) and its core
competencies: box breathing and physiological resets, the "What's Important
Now" (W.I.N.) framework for staying present, and managing the weight of
parental or scout expectations.

Performance psychology, not therapy. Module 5 is entirely about the boundary
between competitive anxiety and a clinical anxiety problem, and what to do at
it.
"""

MODULES = [
    {
        "title": "What Pressure Actually Is",
        "description": (
            "Where pressure comes from, why the same situation crushes one athlete and lifts "
            "another, and the appraisal that decides which."
        ),
        "lessons": [
            {
                "title": "Pressure Is a Judgement, Not a Situation",
                "description": "Challenge and threat, and why the appraisal matters more than the stakes.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The same final, two different athletes

One is sharp, clear and quick. The other is tight, narrow and slow. Same crowd,
same stakes, same opponent.

The difference is not the situation. It is the **appraisal** — the rapid,
largely automatic judgement about whether you have the resources to meet what
is being asked.

- **Challenge state:** demands are high, and I have what is needed. Associated
  with better decision-making, more efficient movement and a different
  physiological profile.
- **Threat state:** demands exceed what I have. Associated with narrowed
  attention, tighter movement and worse decisions.

## The appraisal has three inputs

1. **How demanding is this?** Including how much it matters, how uncertain it
   is, and whether I am being judged.
2. **What resources do I have?** Skill, preparation, experience, support — and
   whether I believe I have them.
3. **How much control do I have?** Perceived control is the input athletes most
   underestimate, and the one a routine (MT-201) directly addresses.

Change any of the three and the appraisal changes. Which is why pressure is
workable rather than fixed.

## Why "just relax" fails

It targets the symptom — arousal — and ignores the appraisal. An athlete told
to relax in a threat state is being asked to turn down a smoke alarm while the
pan is still on.

Worse, high arousal is often *useful*. The problem is rarely the activation; it
is the interpretation of the activation.

## Reinterpreting the feeling

The physical signatures of excitement and anxiety overlap almost completely:
fast heart, shallow breathing, energy, hyper-alertness. What differs is the
label.

Research on **arousal reappraisal** has found that telling yourself *"I'm
excited"* — or more precisely, interpreting the feeling as readiness rather than
as a warning — produces better performance than attempting to calm down.

The practical version for an athlete: *"this feeling is my body getting ready.
This is what ready feels like."*

That is not a trick, and it is not positive thinking. It is a more accurate
description than "something is wrong with me", which is what most athletes
conclude when their heart rate rises before a final.
""",
            },
            {
                "title": "Where Your Pressure Comes From",
                "description": "Identifying the actual sources, which are rarely the ones athletes name first.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The named source is often not the real one

Ask an athlete what the pressure is and they say "the game". Ask what would be
bad about playing poorly and the real sources appear.

Common ones:

- **Judgement by a specific person.** A parent, a coach, a selector, a
  recruiter. Frequently one named individual, which is useful because it is
  addressable.
- **Identity.** What a bad performance would mean about you — MT-101's whole
  subject, and the deepest source of pressure in sport.
- **Consequence.** Selection, a scholarship, a place in a squad. Real stakes,
  and the only source on this list that is genuinely about the future.
- **Comparison.** A teammate in the same position, a rival, a sibling.
- **Letting people down.** Teammates, a coach who invested in you, a family who
  paid for it.
- **Repeating a past failure.** A specific memory, often from one occasion
  years ago.

## Separate the real from the imagined

Some of these are genuine: a trial with a scholarship attached has real
consequences. Others are constructed: *everyone will think I'm finished* is
almost never true and almost always believed.

For each source, ask: **what is the actual, concrete consequence of the worst
realistic outcome?** Write it down. Most lose a great deal of their power when
they are written as a specific sentence instead of a feeling.

## The worst-case exercise

For your biggest source:

1. What is the worst realistic outcome? Not the catastrophic one — the
   realistic one.
2. What actually happens then? Concretely, in the following week.
3. What would I do about it?
4. Would I survive it?

The answer to the fourth is almost always yes, and knowing that is one of the
most reliable pressure reducers available. Athletes who have faced the worst
case on paper carry less of it into competition.

## Then use the right tool

Pressure from identity needs MT-101's work. Pressure from one person needs
Module 4's conversation. Pressure from genuine consequence needs preparation and
the W.I.N. framework in Module 3.

Applying a breathing exercise to all three is why athletes conclude the tools do
not work.
""",
            },
            {
                "title": "Pressure Source Map",
                "description": "Challenge-and-threat inputs, the source inventory and the worst-case exercise.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable map for Module 1. Page one sets out the challenge and threat
appraisals with the three inputs — demands, resources, control — and space to
describe a recent competition in which each state occurred, plus the arousal
reappraisal line in your own words.

Page two inventories the six common pressure sources, ranked for you, with the
concrete-consequence question applied to each, and the four-step worst-case
exercise for your largest source.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Map Your Pressure",
            "description": (
                "Find the real sources, not the ones you name first.\n\n"
                "Submit:\n"
                "1. Two competitions described: one where you were in a challenge state and one "
                "where you were in a threat state. What differed in the three inputs — demands, "
                "resources, control?\n"
                "2. Your pressure source inventory, ranked, with the six sources assessed for "
                "yourself and at least one added if it is missing.\n"
                "3. Real or constructed: for each of your top three sources, write the actual "
                "concrete consequence of the worst realistic outcome, as a specific sentence.\n"
                "4. The worst-case exercise completed for your largest source, all four steps.\n"
                "5. Arousal reappraisal: write, in your own words, the line you would use when "
                "your heart rate rises before a competition.\n"
                "6. One paragraph on which source is largest for you, and which tool in this "
                "pathway it actually needs.\n\n"
                "Graded on whether the sources are specific rather than general, and on whether "
                "the worst-case exercise is worked through honestly."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: What Pressure Is",
            "description": "Four questions on appraisal, reappraisal and sources.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What determines whether a situation produces a challenge or a threat state?",
                    "choices": [
                        "The appraisal — whether you judge your resources sufficient for the demands",
                        "The objective size of the occasion",
                        "The athlete's baseline personality",
                        "The level of crowd noise",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does “just relax” usually fail?",
                    "choices": [
                        "Relaxation techniques take too long to learn",
                        "It targets the arousal and ignores the appraisal — and the arousal is often useful",
                        "It only works for experienced competitors",
                        "It requires a quiet environment",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does research on arousal reappraisal suggest?",
                    "choices": [
                        "Suppressing the physical signs improves performance",
                        "Arousal should be reduced to baseline before competing",
                        "Interpreting the feeling as readiness outperforms trying to calm down",
                        "Reappraisal works only for low-stakes events",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the fourth step of the worst-case exercise?",
                    "choices": [
                        "What is the worst realistic outcome?",
                        "What actually happens then?",
                        "What would I do about it?",
                        "Would I survive it?",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Physiological Reset",
        "description": (
            "Trained breathing and physical tools that change your state in seconds, and how "
            "to make them available under load."
        ),
        "lessons": [
            {
                "title": "Breathing That Actually Works",
                "description": "Box breathing, the long exhale, and why the exhale is the active ingredient.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Why breathing is the tool

It is the one part of your physiology you can control directly and immediately,
it requires nothing, it can be done in front of an opponent without anybody
noticing, and it works within seconds.

The mechanism, simply: breathing rate and pattern influence the balance of your
autonomic nervous system. **Lengthening the exhale relative to the inhale shifts
it toward the calming side.** Short, sharp, forceful breathing does the
opposite, which is why Module 1's arousal tools include both directions.

## Box breathing

Equal counts, four phases:

> In for 4 — hold for 4 — out for 4 — hold for 4.

Four to six cycles. Useful before competition, during a long break, overnight
when you cannot sleep, and in the minutes before anything that frightens you.

Its strength is structure: counting occupies the attention that would otherwise
be running a loop, which is half of why it works.

## The long exhale

For in-competition use, where four cycles is unavailable:

> In for 3 — out for 6.

One or two cycles. Lower profile, quicker, and the exhale is doing the work.
This is the tool paired with your MT-102 tells.

## The physiological sigh

Two inhales through the nose — a full one, then a short top-up — followed by a
long exhale through the mouth. Frequently the fastest single-breath way to
reduce arousal, and useful in the seconds after something goes wrong.

## The rules that make them work

1. **Practise them when calm.** A breathing technique first attempted in a final
   is an experiment.
2. **Through the nose where possible**, on the inhale.
3. **Slow rather than deep.** Trying to breathe enormously creates tension,
   which is the opposite of the aim.
4. **Three or four cycles maximum in competition.** Longer is for breaks.
5. **Attach them to something.** A tell, a stoppage, a between-point routine —
   an untriggered tool is not used.

## When breathing is the wrong tool

If you are **under**-aroused, slow breathing will make it worse. Check first —
MT-201 Module 5. And if the problem is a thought rather than a state, the
MT-103 interrupt is the right tool, with the breath only as the physical half of
it.
""",
            },
            {
                "title": "The Full Reset Sequence",
                "description": "Combining breath, body and attention into a sequence usable in ten seconds.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Breath alone is not enough

A reset that only addresses breathing leaves the tension and the attention
where they were. The full sequence has three parts and takes about ten seconds.

**1. Breath.** One long exhale, or a physiological sigh.

**2. Body.** Release the specific places you hold tension — your MT-102 tells.
Shoulders down, jaw loose, hands open. A deliberate physical action, not a
thought about relaxing.

**3. Attention.** Move it somewhere external and specific. The ball, the line,
the next task, a point in the distance. Internal attention under pressure goes
to the body and the consequence, both unhelpful.

Breath, body, attention. Ten seconds, and shorter with practice.

## Where it goes in competition

Build it into the natural pauses your sport already provides: between points,
at a stoppage, walking back, before a restart, on the way to a set piece.

An athlete who has to create a pause to use it will not use it. An athlete whose
sport provides pauses and who has attached the sequence to them will use it
dozens of times a match.

## Long breaks

Half time, between events, a rain delay, a long wait as a substitute. Different
problem: here the risk is drifting out of your zone in either direction.

A longer version — four to six box breaths, a physical movement to keep
activation up, one imagery rehearsal from MT-201, and an anchor phrase — takes
two minutes and prevents the flat restart that costs athletes the first ten
minutes of a second half.

## The night before

If sleep is the problem, box breathing in bed is one of the few genuinely
useful things available, and it pairs with the CEO-302 sleep protocol.

A caution worth stating: if you are regularly unable to sleep before
competition, that is worth raising with someone — Module 5's boundary.

## Train it like a skill

Ten sequences a day for two weeks, in ordinary moments — a queue, before a
class, at a red light. You are building an automatic association between a
physical trigger and a state change, and ordinary moments are free repetitions.
""",
            },
            {
                "title": "Reset Protocol Card",
                "description": "The three breathing patterns, the ten-second sequence and the long-break version.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable card for Module 2. The breathing section sets out box breathing, the
long exhale and the physiological sigh with their counts, uses and the five
rules that make them work, plus a note on when breathing is the wrong tool.

The sequence section builds breath, body and attention into a ten-second reset
with space for your own tension points and your external attention target, and
places it against the natural pauses in your sport. A long-break version and a
two-week practice tracker complete the card.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Build and Train the Reset",
            "description": (
                "Train it in ordinary moments so it is available in difficult ones.\n\n"
                "Submit:\n"
                "1. The three breathing patterns practised, with a note on which suits you in "
                "which situation.\n"
                "2. Your ten-second sequence: the breath, the specific body release points from "
                "your MT-102 tells, and your external attention target.\n"
                "3. Your pause map: the natural pauses your sport provides, and which one you "
                "have attached the sequence to.\n"
                "4. Your long-break version, with timings, for half time or a delay.\n"
                "5. A two-week practice log: ten sequences a day in ordinary moments, with the "
                "count per day and a note on when it started feeling automatic.\n"
                "6. Competition use: across at least three competitions, how many times you ran "
                "the sequence and what happened.\n"
                "7. One paragraph on a time breathing was the wrong tool, and what you should "
                "have used instead.\n\n"
                "Graded on the practice log, on whether the sequence is attached to a real pause "
                "in your sport, and on the honesty of part 7."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Physiological Reset",
            "description": "Four questions on breathing tools and the reset sequence.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which part of the breath is the active ingredient for lowering arousal?",
                    "choices": [
                        "The exhale, lengthened relative to the inhale",
                        "The inhale, made as deep as possible",
                        "The hold between breaths",
                        "The number of cycles completed",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What are the three parts of the full reset sequence?",
                    "choices": [
                        "Breath, anchor phrase, restart",
                        "Breath, body, attention",
                        "Pause, review, continue",
                        "Exhale, imagery, movement",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course say to attach the sequence to a natural pause in your sport?",
                    "choices": [
                        "Officials require a visible routine",
                        "It reduces the number of repetitions needed",
                        "An athlete who has to create a pause to use it will not use it",
                        "Pauses are the only legal moment to use it",
                    ],
                    "answer": 2,
                },
                {
                    "text": "When is slow breathing the wrong tool?",
                    "choices": [
                        "During a long break",
                        "Before sleep the night before",
                        "After a mistake",
                        "When you are under-aroused — it will make flatness worse",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "What's Important Now",
        "description": (
            "The W.I.N. framework: returning attention to the controllable present whenever "
            "it drifts to outcomes."
        ),
        "lessons": [
            {
                "title": "Where Attention Goes Under Pressure",
                "description": "Why anxiety steals the attention you need, and what W.I.N. does about it.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Anxiety is expensive

Under pressure, attention goes to three places, none of them useful:

- **The future.** The result, the consequence, what happens if.
- **The past.** The error two minutes ago.
- **Inward.** Your own body, your own mechanics, how you are feeling.

Research on attention and anxiety finds that worry consumes the same limited
capacity you need for the task. The athlete has not become less skilled; they
have less attention available to deploy the skill.

That also explains a familiar pattern: anxious athletes become **more conscious
of technique**, which disrupts movements that normally run automatically. A
skill you have performed ten thousand times runs worse when you start
supervising it — MT-302 returns to this.

## W.I.N. — What's Important Now

A single question, asked whenever attention drifts:

> **What's important now?**

The answer must be:

1. **Present.** This moment, not the result.
2. **Controllable.** Your action, not the outcome.
3. **Specific.** One thing, not "play well".

*"Win the next header."* *"Feet set before the ball arrives."* *"Breathe, then
serve."*

## Why it works

It redirects attention from the uncontrollable future to the controllable
present, which is where performance actually happens. It also gives the mind a
task, which — as MT-103 found — is more effective than attempting to stop
thinking.

## Use it at the natural triggers

- After an error, with the MT-203 reset.
- During a stoppage.
- When you notice a tell from MT-102.
- When you catch yourself scoreboard-watching.
- When a thought about the consequence arrives.

## Make the answers small

The commonest mistake is answering W.I.N. with something large: *"stay
focused"*, *"compete"*, *"win this game"*. None of those is a present,
controllable, specific action.

Smaller is better. The next ball, the next step, the next breath. An athlete who
can reliably return to the next controllable action has the most useful skill
in this entire course, and it is why the framework is three words long.
""",
            },
            {
                "title": "Process Goals and the Scoreboard Problem",
                "description": "Giving attention something to hold onto for a whole competition.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## W.I.N. is for moments; process goals are for the match

A **process goal** is something you control, measurable during the competition,
and independent of the result.

- Outcome goal: *win the match.* Not controllable.
- Performance goal: *score twice.* Partly controllable.
- Process goal: *first to every second ball; feet set before receiving.* Fully
  controllable.

Two or three process goals, decided before you start, give attention a job for
the whole competition — and they give you something true to judge the day on
that is not the score.

## They also protect you afterwards

An athlete whose only measure is the result has nothing to hold onto after a
defeat. One with process goals can say *"we lost, and I was first to the second
ball all afternoon"* — which is both accurate and the thing that will make the
next result more likely.

MT-204 builds this into the post-game review.

## The scoreboard problem

Scoreboard-watching is the most common attention leak in competition: checking
the score, the clock, the standings, doing arithmetic about what is needed.

None of it changes what you do next, and all of it costs attention. The fix:

- **Decide in advance** when you will look. Some sports require awareness of
  the situation; most athletes look ten times more often than the game needs.
- **Attach a W.I.N. to every look.** If you check the clock, the next thought
  is a present, controllable, specific action.

## When the situation genuinely matters

Late in a close contest the score legitimately changes the correct decision.
That is tactical awareness, not scoreboard-watching, and the difference is
whether the information **changes what you do** or only how you feel.

Ask that question: *does knowing this change my next action?* If yes, use it. If
no, it is a leak.
""",
            },
            {
                "title": "W.I.N. and Process Goals Sheet",
                "description": "Trigger list, answer bank, process goal selection and the scoreboard rule.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable sheet for Module 3. The W.I.N. section lists the triggers at which the
question is asked and holds an answer bank of present, controllable, specific
actions for the main situations in your sport — written small, because the
commonest mistake is answering too large.

The process goal section selects two or three fully controllable goals with how
each will be measured during competition, and the scoreboard rule records when
you will look, the W.I.N. attached to every look, and the test for whether
information changes your next action.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Run W.I.N. Across Three Competitions",
            "description": (
                "Use it for real and report what happened.\n\n"
                "Submit:\n"
                "1. Your W.I.N. triggers: the specific moments at which you will ask the "
                "question.\n"
                "2. An answer bank: at least eight present, controllable, specific answers for "
                "situations in your sport. Anything as large as 'stay focused' does not count.\n"
                "3. Your two or three process goals for a competition, with how each is "
                "measured during play.\n"
                "4. Three competitions run with the process goals: what you scored yourself on "
                "each, independent of the result.\n"
                "5. The scoreboard audit: in one competition, count how often you checked the "
                "score or clock, and how many of those checks changed your next action.\n"
                "6. Your scoreboard rule, written as a sentence.\n"
                "7. One paragraph on a competition where the process goals gave you something "
                "true to hold onto after a bad result — or, if that has not happened yet, how "
                "you expect them to.\n\n"
                "Graded on whether the answers are genuinely small and specific, on three real "
                "competitions, and on the scoreboard count."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: What's Important Now",
            "description": "Four questions on attention, W.I.N. and process goals.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does anxiety reduce performance even when skill is unchanged?",
                    "choices": [
                        "It reduces physical strength directly",
                        "Worry consumes the limited attention needed to deploy the skill",
                        "It prevents warm-up from taking effect",
                        "It slows reaction time permanently",
                    ],
                    "answer": 1,
                },
                {
                    "text": "A W.I.N. answer must be:",
                    "choices": [
                        "Ambitious, outcome-focused and memorable",
                        "Agreed with a coach in advance",
                        "Present, controllable and specific",
                        "Related to the scoreline",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which of these is a process goal?",
                    "choices": [
                        "Win the match",
                        "Score twice",
                        "Finish in the top three",
                        "Feet set before receiving, every time",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What is the test for whether checking the score is tactical awareness or a leak?",
                    "choices": [
                        "Does knowing this change my next action?",
                        "Is the contest in its final quarter?",
                        "Did a coach ask me to check?",
                        "Am I ahead or behind?",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Weight of Expectation",
        "description": (
            "Parents, coaches, scouts and crowds — handling the pressure that comes from "
            "other people's hopes."
        ),
        "lessons": [
            {
                "title": "Whose Expectation Is It?",
                "description": "Separating the expectations you have absorbed from the ones actually being held.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Much of it is imagined

Athletes carry an enormous amount of assumed expectation. Ask what a parent
actually expects and most athletes have never asked — they are performing
against a figure they constructed, usually harsher than the real one.

That is not universal. Some athletes face genuinely heavy expectation, and this
lesson is not a claim that it is all in your head. It is a claim that you do not
currently know which parts are real, and that finding out is cheap.

## The audit

List the people whose expectations you feel. For each, write:

- **What I think they expect.**
- **What they have actually said**, in their words.
- **The evidence** that the first is true.

Most athletes find a large gap between column one and column two, and almost no
evidence in column three.

## The conversation

For the person whose expectation weighs most — usually a parent — a direct
conversation is extraordinarily effective and almost never had.

> *"Can I ask you something? What do you actually expect from me with my sport?
> I think I've been assuming, and I'd rather know."*

Common answers, in this order: *that you enjoy it*, *that you work hard*, *that
you are a good teammate*, *that you do your best*. Athletes are frequently
astonished.

Occasionally the answer is heavier than hoped. That is also useful information,
and it makes the conversation in the next lesson possible.

## When the expectation is real

Some athletes genuinely face a parent whose mood depends on results, a coach who
makes it conditional, or a family whose finances rest on it.

That is a real pressure and not something to reframe away. The responses:

- Name it to yourself, accurately.
- Find an adult outside the situation who knows — a coach, a counsellor, a
  teacher.
- Protect the separation MT-101 built: their expectation is not your worth.
- If a relationship around your sport is making you miserable or unsafe, that
  is a conversation with a trusted adult, not something to manage alone.

## Scouts and selectors

A specific case. An athlete who knows someone is watching frequently plays
differently — usually worse, because they try to produce highlights instead of
their game.

The fix is a decision made in advance: *I play my process goals whether or not
anyone is watching.* And in practice, you are frequently wrong about who is
there.
""",
            },
            {
                "title": "The Conversation, and the Crowd",
                "description": "Asking for what you need, and handling noise from outside the line.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Asking a parent for something different

Most parents want to help and are guessing. Told specifically what helps, the
large majority change immediately — REC-204 made this argument to parents; this
is the athlete's side.

Ask for something concrete:

> *"Two things that would really help me. Before a game, I'd rather talk about
> anything except the game. And after, could you ask me whether I want to talk
> about it, and believe the answer?"*

Specific, small, and easy to agree to. Asking for them to "stop putting pressure
on me" is neither, and it usually produces a defensive conversation instead of a
change.

## The ride home

The most commonly cited difficult moment in youth sport, and the subject of
MT-204. Agree the rule in advance rather than negotiating it in a car after a
defeat.

## Sideline noise

Instructions shouted from the line, criticism, an argument with an official, or
simply a parent you can hear. Three responses:

1. **Decide in advance that you will not look.** Attention given to the line is
   attention off the game.
2. **Have a W.I.N. ready** for the moment it happens, because it will.
3. **Address it afterwards, calmly, away from the venue.** A conversation on the
   day is a conversation two upset people have.

## Crowds and hostility

Opposition crowds, noise, individuals targeting you. What helps:

- **Expect it** and rehearse it — the coping imagery from MT-201.
- **Narrow attention deliberately** to the task and your teammates.
- **Treat it as evidence you matter.** Nobody targets an irrelevant opponent.
- **Never respond.** It is the only thing they are asking for, and it costs you
  attention and sometimes a sanction.

## What is not acceptable

Abuse — racist, discriminatory, sexual or threatening — is not pressure to
manage. It is something to report, to an official, a coach and your school, and
you are entitled to support in doing so. Tell an adult the same day.
""",
            },
            {
                "title": "Expectation Audit and Conversation Scripts",
                "description": "The three-column audit, scripts for the parent conversation, and the sideline plan.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable sheet for Module 4. The audit lists the people whose expectations you
feel, with three columns — what I think they expect, what they have actually
said, and the evidence — so the gap becomes visible.

The scripts section holds the direct question for the person whose expectation
weighs most and two concrete asks to make, phrased small and specific. A
sideline plan covers not looking, the ready W.I.N., and the calm
afterwards-conversation, closing with the line on abuse being reported rather
than managed.""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Audit Expectations and Have One Conversation",
            "description": (
                "Find out what people actually expect, rather than assuming.\n\n"
                "Submit:\n"
                "1. Your three-column audit for at least four people whose expectations you "
                "feel, with the evidence column completed honestly.\n"
                "2. The gap: where is the difference largest between what you assume and what "
                "has actually been said?\n"
                "3. The conversation. Ask the person whose expectation weighs most what they "
                "actually expect. Record the question you asked and their answer in their "
                "words. This is the core of the assignment.\n"
                "4. Two concrete asks you made or will make, phrased small and specific.\n"
                "5. Your sideline plan: what you do when you can hear someone from the line.\n"
                "6. Your scouts-and-selectors decision, written as a sentence.\n"
                "7. One paragraph: was the real expectation heavier or lighter than the one you "
                "had been carrying?\n\n"
                "If the real expectation turns out to be genuinely heavy, or if a relationship "
                "around your sport is making you miserable, part 7 should say so and name the "
                "adult you will talk to.\n\n"
                "Graded on whether the conversation actually happened and on the honesty of the "
                "audit's evidence column."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: The Weight of Expectation",
            "description": "Four questions on expectation, conversations and crowds.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the three-column audit usually reveal?",
                    "choices": [
                        "A large gap between what athletes assume is expected and what has actually been said, with little evidence for the assumption",
                        "That expectations are always heavier than assumed",
                        "That coaches expect more than parents",
                        "That expectations cannot be measured",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why is “stop putting pressure on me” a poor request?",
                    "choices": [
                        "It is disrespectful to a parent",
                        "It is neither concrete nor small, so it produces a defensive conversation rather than a change",
                        "It should come from a coach instead",
                        "It only works after a good performance",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course recommend when a crowd or an individual targets you?",
                    "choices": [
                        "Respond once, firmly, to establish a boundary",
                        "Ask an official to intervene immediately in all cases",
                        "Expect it, rehearse it, narrow attention, and never respond",
                        "Leave the field until it stops",
                    ],
                    "answer": 2,
                },
                {
                    "text": "How does the course treat abuse that is racist, discriminatory, sexual or threatening?",
                    "choices": [
                        "As pressure to be managed with the same tools",
                        "As something to address after the season",
                        "As a matter for the athlete to handle privately",
                        "As something to report the same day — to an official, a coach and your school",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "When It Is More Than Nerves",
        "description": (
            "The boundary between competitive anxiety and an anxiety problem, and exactly "
            "what to do at it."
        ),
        "lessons": [
            {
                "title": "Telling Them Apart",
                "description": "What ordinary competitive anxiety looks like, and what suggests something more.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Competitive anxiety is normal

Nerves before competition are close to universal and frequently useful. An
athlete who feels nothing before a final is unusual, not healthy.

Ordinary competitive anxiety:

- Appears before or early in competition.
- Is **tied to the event** — it arrives with it and leaves with it.
- Settles once the contest starts, or within minutes.
- Does not stop you doing other things.
- Responds, at least partly, to the tools in this course.

## What suggests more than nerves

- **It is not tied to the event.** Anxiety on ordinary days, on rest days, about
  things unconnected to sport.
- **It does not settle** once competition starts.
- **It is interfering** with sleep, eating, school, friendships.
- **Avoidance.** Finding reasons not to compete, not to train, not to be
  selected. This is the most important signal in this lesson, and the one most
  often explained away.
- **Panic episodes** — sudden intense fear with strong physical symptoms, which
  can feel like a medical emergency.
- **Physical symptoms** persisting away from competition: nausea, headaches,
  chest tightness.
- **It has lasted weeks** and is not improving.

## This is not a diagnosis

Nothing here lets you diagnose yourself, and you should not try. The list is
for one purpose: knowing when to stop using performance tools and start talking
to someone qualified.

Using a breathing exercise on an anxiety disorder is like using strapping on a
fracture. The strapping is not wrong; it is not the treatment.

## The most important thing in this course

Anxiety problems are **common** — among the most common things people
experience — and they are **treatable**. The usual barrier is not availability;
it is that athletes wait, because they have been taught that needing help means
not being tough.

That belief has cost people seasons and more. Getting help early is both
ordinary and effective.

## What to do

Tell one adult this week: a parent or guardian, a school counsellor, your
physician, your athletic trainer. You do not need the right words, a diagnosis
or a plan. *"I think my anxiety might be more than normal nerves, and I'd like
to talk to someone"* is enough.

**Any thought of self-harm is an immediate conversation with a trusted adult or
a crisis line, today.**
""",
            },
            {
                "title": "Asking For Help Well",
                "description": "Who to tell, what to say, and what actually happens next.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Who to tell

More than one person, because availability varies:

- **At home:** a parent, guardian or another adult relative.
- **At school:** a counsellor, a trusted teacher, the school nurse.
- **Medically:** your physician.
- **In sport:** an athletic trainer, or a coach you trust — though a coach who
  selects you is a harder first choice, and that is a legitimate reason to
  start elsewhere.
- **A crisis line**, saved in your phone before it is needed.

## What to say

You do not need to explain it well. All of these work:

- *"I'm struggling with anxiety and I want to talk to someone about it."*
- *"Something's not right and I don't really know how to describe it."*
- *"I need help and I didn't know who to tell."*

If saying it out loud is too hard, write it down and hand it over. That counts.

## What usually happens

People often imagine something dramatic. In practice:

- A conversation.
- Possibly an appointment with a physician or a counsellor.
- Questions about sleep, mood, appetite, how long it has been going on.
- Frequently some practical strategies, sometimes a referral, sometimes
  talking therapy.
- You are not removed from your sport as a matter of course. For many people,
  continuing is part of what helps.

## Bring your data

The MT-102 audit log, if you keep one. A month of dated entries is genuinely
useful clinical information and saves time in a first appointment.

## If the first person does not help

It happens — somebody dismisses it, or tells you to toughen up. That is a
failure of that person, not evidence that you were wrong.

**Tell someone else.** Keep going until somebody listens properly. That
persistence is the single most important thing in this module.

## And carry on using the tools

The skills in this course remain useful alongside professional support — they
are frequently part of what a professional would teach. The boundary is not
"tools or help". It is that tools alone are not enough when this is what you are
dealing with.
""",
            },
            {
                "title": "Escalation Card",
                "description": "The distinguishing signals, the contacts, and the words to use.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable card for Module 5. One side sets ordinary competitive anxiety beside
the signals that suggest more — not tied to the event, not settling, interfering
with sleep or school, avoidance, panic episodes, persistent physical symptoms,
lasting weeks — with avoidance marked as the most often explained away.

The other side holds four named contacts with real numbers, three sentences you
can use if you cannot find your own words, a note that writing it down and
handing it over counts, what usually happens next, and the instruction to tell
somebody else if the first person does not help.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Know the Boundary and Fill In the Card",
            "description": (
                "This assignment is about preparation, not disclosure. You are not asked to "
                "share anything personal you do not want to.\n\n"
                "Submit:\n"
                "1. In your own words, the difference between ordinary competitive anxiety and "
                "something that needs professional help. Use the signals, not a diagnosis.\n"
                "2. Your completed escalation card: four real contacts with names and numbers — "
                "an adult at home, an adult at school, a physician and a crisis line.\n"
                "3. The words: write the sentence you would actually use. Not the one from the "
                "lesson — yours.\n"
                "4. The avoidance check: has there been a time you looked for a reason not to "
                "compete, train or be selected? Describe it generally if you prefer.\n"
                "5. What you would do if the first person you told dismissed it.\n"
                "6. Research: find out what support actually exists at your school and in your "
                "area. Name the service, how to access it, and whether it costs anything.\n"
                "7. One paragraph on what you have been taught, directly or indirectly, about "
                "athletes asking for help — and whether you agree with it.\n\n"
                "If completing this makes you think you should talk to someone, that is the "
                "assignment working. Do it this week.\n\n"
                "Graded on whether the card is genuinely filled in with real contacts and on "
                "whether the support research was actually done."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: More Than Nerves",
            "description": "Four questions on the boundary and asking for help.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which signal does the course call the most important and the most often explained away?",
                    "choices": [
                        "Nerves that persist into the first ten minutes",
                        "Avoidance — finding reasons not to compete, train or be selected",
                        "Physical symptoms on competition day",
                        "Difficulty sleeping the night before a final",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What distinguishes ordinary competitive anxiety?",
                    "choices": [
                        "It is absent in experienced athletes",
                        "It can be eliminated entirely with breathing tools",
                        "It is tied to the event, settles once competition starts, and does not stop you doing other things",
                        "It never affects sleep",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say if the first person you tell dismisses it?",
                    "choices": [
                        "Accept their judgement and continue with the tools",
                        "Wait until the end of the season and try again",
                        "Raise it with your coach instead of a counsellor",
                        "Tell someone else — keep going until somebody listens properly",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What does the course say about using these performance tools alongside professional support?",
                    "choices": [
                        "They remain useful and are frequently part of what a professional would teach",
                        "They should be stopped during treatment",
                        "They replace the need for support once learned",
                        "They are only appropriate for athletes without anxiety",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Pressure Protocol",
        "description": (
            "The capstone: a single protocol for before, during and after a high-pressure "
            "competition, tested on a real one."
        ),
        "lessons": [
            {
                "title": "Assembling the Protocol",
                "description": "Five parts, mapped to the moments they are used in.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Five parts

**1. The appraisal.** Your reappraisal line and your worst-case answer, used in
the days before and in the hour before. *This feeling is readiness. The worst
realistic outcome is X, and I would survive it.*

**2. The reset.** Breath, body, attention — ten seconds, attached to the natural
pauses in your sport.

**3. W.I.N.** The question, your trigger list, and an answer bank of small,
controllable actions.

**4. The process goals.** Two or three, decided before the competition and
scored afterwards independently of the result.

**5. The boundary.** Your escalation card, with real contacts, and the signals
that mean this stops being a performance question.

## Where each sits

- **Week before:** appraisal work, coping imagery from MT-201.
- **Hour before:** the pre-game protocol, arousal check, reappraisal line.
- **During:** reset at every natural pause, W.I.N. at every trigger, process
  goals held throughout.
- **After:** score the process goals, then MT-204's decompression.
- **Always available:** the boundary.

## Test it on something real

A protocol tested only in training has not been tested. Choose one genuinely
high-pressure competition — a trial, a final, a game somebody important is
watching — and run all five parts.

Then write up what happened, including the parts that did not work. A protocol
that performed imperfectly in a real final has taught you more than one that
worked in a practice match.

## Expect partial results

Realistically, in a first high-pressure test: you will remember the reset
sometimes, forget W.I.N. in the moments you needed it most, and discover that
one process goal was not measurable.

That is the normal first attempt, and the fix is the four-stage progression from
MT-103: it moves from afterwards, to during, to automatic over weeks.
""",
            },
            {
                "title": "Pressure as a Skill",
                "description": "Why exposure matters, and how this course connects to the rest of the pathway.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## You get better at it by doing it

The tools help. But the largest factor in handling pressure is having been under
it before and survived.

Which has a practical implication athletes rarely act on: **seek pressured
situations deliberately**, at a scale you can handle.

- Play up an age group or a level.
- Enter the competition you might not win.
- Volunteer for the role nobody wants — the penalty, the anchor leg, the serve
  at a deciding point.
- Ask for conditioned training with consequences.
- Put yourself in front of people: speak in team meetings, present something,
  compete when watched.

Each time, run the protocol. You are accumulating evidence that you can function
in that state, and evidence is what shifts the appraisal from threat to
challenge — Module 1's whole mechanism.

## The thing nobody says

Some of the best competitors feel exactly as nervous as everybody else. They
have not eliminated the feeling; they have had it a hundred times and know what
happens next.

That is why this gets better with age and exposure more reliably than with any
technique, and why a seventeen-year-old who has been deliberately seeking
pressure is ahead of one who has avoided it.

## How it connects

- **MT-101** is the deepest layer: pressure from identity is the one tools
  cannot reach.
- **MT-102** supplies the tells that trigger the reset.
- **MT-103** handles catastrophic self-talk, which is this course's subject in
  words.
- **MT-201** gets you to the start line in the right state.
- **MT-203** is the in-competition recovery that W.I.N. feeds.
- **MT-204** processes it afterwards, which is where unmanaged pressure does
  most of its damage.
- **MT-302** is the far end: flow is what becomes available when the threat
  appraisal stops consuming attention.

## The honest summary

You will not stop feeling pressure, and the tools will not work every time. What
is achievable within a season is noticing earlier, recovering faster, being
less often in a threat state, and knowing — with certainty — the line at which
you stop managing it alone.

That last one is the most valuable thing in this course.
""",
            },
            {
                "title": "The Pressure Protocol Card",
                "description": "Five-part card with the moment map, the real-test write-up and the exposure plan.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable card for the MT-202 capstone. The five parts — appraisal, reset,
W.I.N., process goals and the boundary — each with your own wording, mapped
against the moments they are used in from the week before to afterwards.

A real-test page structures the write-up of one genuinely high-pressure
competition, including what did not work. An exposure plan lists deliberately
pressured situations to seek over the coming months, with a column for running
the protocol in each and the evidence accumulated.""",
            },
        ],
        "assignment": {
            "title": "Capstone — The Pressure Protocol, Tested for Real",
            "description": (
                "Build it, then use it somewhere that actually matters.\n\n"
                "Part A — The protocol. All five parts in your own words: the appraisal line "
                "and worst-case answer, the ten-second reset, W.I.N. with triggers and an answer "
                "bank, two or three process goals, and the boundary with real contacts.\n\n"
                "Part B — The moment map. Where each part is used, from the week before to "
                "afterwards.\n\n"
                "Part C — The real test. One genuinely high-pressure competition with all five "
                "parts run. Write up what happened in 300-400 words, including specifically what "
                "did not work and what you forgot.\n\n"
                "Part D — The process goal scores from that competition, independent of the "
                "result, and what they told you.\n\n"
                "Part E — Your exposure plan: four deliberately pressured situations you will "
                "seek over the next three months, with dates where possible.\n\n"
                "Part F — 200-300 words on the boundary: how would you know this had stopped "
                "being a performance question, and what exactly would you do?\n\n"
                "Graded on whether a genuinely high-pressure competition was used, on the "
                "honesty of Part C about failures, and on whether Part F is specific."
            ),
            "total_marks": 200,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: The Pressure Protocol",
            "description": "Four questions on the protocol, exposure and realistic expectations.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the course say is the largest factor in handling pressure?",
                    "choices": [
                        "The quality of the breathing technique",
                        "Having been under it before and survived",
                        "The length of the pre-game routine",
                        "Natural temperament",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does deliberately seeking pressured situations work?",
                    "choices": [
                        "It raises physical conditioning",
                        "It reduces the importance of each individual event",
                        "It accumulates evidence that you can function in that state, which shifts the appraisal from threat to challenge",
                        "It makes the crowd familiar",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should a first high-pressure test of the protocol realistically produce?",
                    "choices": [
                        "Complete execution of all five parts",
                        "Elimination of nerves",
                        "A better result than usual",
                        "Partial results — remembering the reset sometimes, forgetting W.I.N. when it was most needed",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What does the course call the most valuable thing in it?",
                    "choices": [
                        "Knowing with certainty the line at which you stop managing it alone",
                        "The ten-second reset sequence",
                        "The W.I.N. answer bank",
                        "The worst-case exercise",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
]


# One handout spec per module, in module order (see `_handouts.py` for the shape).
HANDOUTS = [
    {
        "intro": (
            "Module 1's map. Pressure is an appraisal rather than a situation — which is why "
            "the same final lifts one athlete and crushes another, and why it is workable "
            "rather than fixed."
        ),
        "sections": [
            {
                "heading": "1. Challenge and Threat",
                "table": {
                    "columns": ["Input", "In a competition where I was sharp", "In one where I was tight"],
                    "rows": [
                        ["How demanding was it?", "", ""],
                        ["What resources did I believe I had?", "", ""],
                        ["How much control did I feel?", "", ""],
                    ],
                },
                "fields": ["My arousal reappraisal line, in my own words"],
            },
            {
                "heading": "2. Where My Pressure Actually Comes From",
                "table": {
                    "columns": ["Source", "Rank for me", "The concrete consequence of the worst realistic outcome"],
                    "rows": [
                        ["Judgement by a specific person", "", ""],
                        ["Identity — what it would mean about me", "", ""],
                        ["Consequence — selection, scholarship, place", "", ""],
                        ["Comparison with a teammate or rival", "", ""],
                        ["Letting people down", "", ""],
                        ["Repeating a past failure", "", ""],
                    ],
                },
            },
            {
                "heading": "3. The Worst-Case Exercise",
                "paragraphs": [
                    "For your largest source. Not the catastrophic outcome — the realistic "
                    "one. Athletes who have faced it on paper carry less of it into "
                    "competition."
                ],
                "fields": [
                    "What is the worst realistic outcome?",
                    "What actually happens then, in the following week?",
                    "What would I do about it?",
                    "Would I survive it?",
                    "Which tool in this pathway does my largest source actually need?",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 2's card. Breathing is the one part of your physiology you can control "
            "immediately, in front of an opponent, with nothing. The exhale is the active "
            "ingredient."
        ),
        "sections": [
            {
                "heading": "1. Three Patterns",
                "table": {
                    "columns": ["Pattern", "Counts", "When I use it"],
                    "rows": [
                        ["Box breathing", "In 4 — hold 4 — out 4 — hold 4, x4-6", ""],
                        ["Long exhale", "In 3 — out 6, x1-2", ""],
                        ["Physiological sigh", "Two nose inhales, long mouth exhale", ""],
                    ],
                },
                "bullets": [
                    "Practise when calm — a technique first attempted in a final is an experiment.",
                    "Slow rather than deep. Trying to breathe enormously creates tension.",
                    "Three or four cycles maximum in competition; longer is for breaks.",
                    "Attach them to something — an untriggered tool is not used.",
                    "If you are under-aroused, slow breathing makes it worse. Check first.",
                ],
            },
            {
                "heading": "2. The Ten-Second Sequence",
                "table": {
                    "columns": ["Part", "Mine"],
                    "rows": [
                        ["Breath", ""],
                        ["Body — the specific places I hold tension", ""],
                        ["Attention — somewhere external and specific", ""],
                    ],
                },
                "fields": ["The natural pauses my sport provides", "Which one I have attached the sequence to"],
            },
            {
                "heading": "3. Long Breaks and Practice",
                "paragraphs": [
                    "Half time, a delay, waiting as a substitute. Four to six box breaths, "
                    "movement to keep activation up, one imagery rehearsal, an anchor phrase — "
                    "two minutes, and it prevents the flat restart."
                ],
                "table": {
                    "columns": ["Week", "Sequences per day", "When it started feeling automatic"],
                    "rows": [["1", "", ""], ["2", "", ""]],
                },
            },
        ],
    },
    {
        "intro": (
            "Module 3's sheet. Worry consumes the attention you need for the task — so the "
            "answer is not to stop thinking but to give attention a specific, controllable, "
            "present job."
        ),
        "sections": [
            {
                "heading": "1. W.I.N. Triggers",
                "bullets": [
                    "After an error, with the MT-203 reset.",
                    "During a stoppage.",
                    "When I notice an MT-102 tell.",
                    "When I catch myself scoreboard-watching.",
                    "When a thought about the consequence arrives.",
                ],
                "fields": ["Any trigger specific to my sport"],
            },
            {
                "heading": "2. My Answer Bank",
                "paragraphs": [
                    "Present, controllable, specific. “Stay focused” and "
                    "“compete” do not qualify — smaller is better."
                ],
                "table": {
                    "columns": ["Situation", "What's important now"],
                    "rows": [["", ""] for _ in range(8)],
                },
            },
            {
                "heading": "3. Process Goals and the Scoreboard",
                "table": {
                    "columns": ["Process goal", "How it is measured during play", "Score: match 1", "Match 2", "Match 3"],
                    "rows": [["", "", "", "", ""] for _ in range(3)],
                },
                "fields": [
                    "Scoreboard audit: times I checked / times it changed my next action",
                    "My scoreboard rule, as a sentence",
                    "The test: does knowing this change my next action?",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 4's audit. Most athletes are performing against a figure they constructed "
            "— usually harsher than the real one. Finding out which parts are real is cheap."
        ),
        "sections": [
            {
                "heading": "1. The Three Columns",
                "table": {
                    "columns": ["Person", "What I think they expect", "What they have actually said", "Evidence"],
                    "rows": [["", "", "", ""] for _ in range(5)],
                },
                "fields": ["Where the gap is largest"],
            },
            {
                "heading": "2. The Conversation",
                "paragraphs": [
                    "Extraordinarily effective and almost never had. The common answers, in "
                    "order: that you enjoy it, that you work hard, that you are a good "
                    "teammate, that you do your best."
                ],
                "fields": [
                    "Who I am asking",
                    "The question, in my own words",
                    "What they said",
                    "Concrete ask 1 (small and specific)",
                    "Concrete ask 2",
                ],
            },
            {
                "heading": "3. Sidelines, Scouts and the Line That Is Not Pressure",
                "bullets": [
                    "Decide in advance that you will not look at the line.",
                    "Have a W.I.N. ready for the moment you hear something.",
                    "Address it afterwards, calmly, away from the venue.",
                    "Scouts: I play my process goals whether or not anyone is watching.",
                    "Crowd hostility: expect it, rehearse it, narrow attention, never respond.",
                    "Abuse — racist, discriminatory, sexual or threatening — is reported the same day, not managed.",
                ],
                "fields": ["My sideline plan", "My scouts-and-selectors sentence"],
            },
        ],
    },
    {
        "intro": (
            "Module 5's card. Nerves before competition are close to universal and often "
            "useful. These signals are not a diagnosis — they are how you know when to stop "
            "using performance tools and talk to someone qualified."
        ),
        "sections": [
            {
                "heading": "1. Ordinary Nerves, and Something More",
                "table": {
                    "columns": ["Ordinary competitive anxiety", "Suggests more than nerves"],
                    "rows": [
                        ["Appears before or early in competition", "Not tied to the event — ordinary days, rest days"],
                        ["Settles once the contest starts", "Does not settle"],
                        ["Does not stop you doing other things", "Interfering with sleep, eating, school, friendships"],
                        ["Responds at least partly to these tools", "Avoidance — reasons not to compete, train or be selected"],
                        ["Leaves with the event", "Panic episodes; persistent physical symptoms; lasting weeks"],
                    ],
                },
            },
            {
                "heading": "2. My Contacts",
                "table": {
                    "columns": ["Who", "Name", "Number"],
                    "rows": [
                        ["Adult at home", "", ""],
                        ["Adult at school (counsellor, teacher, nurse)", "", ""],
                        ["Physician", "", ""],
                        ["Crisis line", "", ""],
                    ],
                },
                "fields": ["Support available at my school or in my area — service, how to access, cost"],
            },
            {
                "heading": "3. The Words",
                "bullets": [
                    "“I'm struggling with anxiety and I want to talk to someone about it.”",
                    "“Something's not right and I don't really know how to describe it.”",
                    "“I need help and I didn't know who to tell.”",
                    "If saying it out loud is too hard, write it down and hand it over. That counts.",
                    "If the first person dismisses it, tell someone else. Keep going until somebody listens.",
                ],
                "fields": ["The sentence I would actually use", "What I would do if the first person dismissed it"],
            },
        ],
    },
    {
        "intro": (
            "The MT-202 capstone. Five parts, tested on something that genuinely matters — "
            "because a protocol tested only in training has not been tested."
        ),
        "sections": [
            {
                "heading": "1. The Five Parts",
                "table": {
                    "columns": ["Part", "Mine", "Used when"],
                    "rows": [
                        ["Appraisal — reappraisal line and worst-case answer", "", "Week before, hour before"],
                        ["The reset — breath, body, attention", "", "Every natural pause"],
                        ["W.I.N. — triggers and answer bank", "", "Every trigger"],
                        ["Process goals — two or three", "", "Throughout, scored after"],
                        ["The boundary — escalation card", "", "Always available"],
                    ],
                },
            },
            {
                "heading": "2. The Real Test",
                "fields": [
                    "The competition, and why it was genuinely high pressure",
                    "What worked",
                    "What did not work, and what I forgot",
                    "Process goal scores, independent of the result",
                    "What the scores told me",
                ],
            },
            {
                "heading": "3. Exposure Plan",
                "paragraphs": [
                    "The largest factor in handling pressure is having been under it and "
                    "survived. Seek it deliberately, at a scale you can handle, and run the "
                    "protocol each time."
                ],
                "table": {
                    "columns": ["Pressured situation I will seek", "Date", "Protocol run?", "Evidence it added"],
                    "rows": [["", "", "", ""] for _ in range(4)],
                },
                "fields": ["How I would know this had stopped being a performance question", "Exactly what I would do"],
            },
        ],
    },
]
