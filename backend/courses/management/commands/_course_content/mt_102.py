"""MT-102: Emotional Literacy & Baseline Auditing.

Level 1: Psychological Foundations (Awareness & Identity). Written against the
course's focus (recognising emotional states before they hijack performance) and
its core competencies: naming emotions precisely — frustration versus anger
versus anxiety — identifying the physical tells of an emotional spike, and
establishing a neutral emotional baseline.

Performance psychology, not therapy. The escalation boundary from MT-101 applies
throughout and is restated in Module 5.
"""

MODULES = [
    {
        "title": "Why Naming It Changes It",
        "description": (
            "The mechanism behind emotional literacy, and why precision about what you feel "
            "is a performance skill rather than a soft one."
        ),
        "lessons": [
            {
                "title": "Label It to Lower It",
                "description": "What happens when a feeling is named precisely, and why vagueness keeps it loud.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The finding

Putting a feeling into words reduces its intensity. Research on **affect
labelling** has shown repeatedly that naming an emotional state — rather than
suppressing it or being swept along by it — reduces the physiological response
to it.

This is not a trick to feel better. It is the difference between an athlete who
can say *"I'm frustrated because I keep losing the same duel"* and one who just
plays worse for ten minutes without knowing why.

## Vague feelings stay loud

"I feel bad" is unactionable. It gives you nothing to do, so it sits there and
grows.

Researchers call the ability to distinguish between closely related feelings
**emotional granularity**, and people with higher granularity regulate
themselves better. They are not calmer by temperament — they are more precise,
and precision gives them something to work with.

## What this gets you in competition

- **Earlier detection.** You notice the state when it is a 3, not when it is an
  8 and the decision has already been made for you.
- **The right response.** Frustration, anxiety and anger need different
  responses. Treat them all as "nerves" and you will apply the wrong one.
- **Shorter spikes.** A named state is one you can act on; MT-203 measures how
  long it takes you to recover.
- **Better conversations.** With coaches, teammates and family. "I'm anxious
  about the trial" is a sentence somebody can help with.

## What this is not

Not sitting with your feelings instead of competing. Not an excuse. Not
dwelling.

The whole point is speed: name it in two seconds, so that you can get back to
the thing you were doing. An athlete who can do that is spending less of their
attention on their own internal weather than one who cannot.

## The three skills in this course

1. A **vocabulary** precise enough to name states apart (Module 2).
2. A set of **physical tells** so you catch states early (Module 3).
3. A **baseline** so you know what normal is for you (Module 4).

All three are trainable and none of them require you to be a particular kind of
person.
""",
            },
            {
                "title": "The Myth of the Unemotional Competitor",
                "description": "What 'controlling emotions' actually means, and why suppression is the wrong model.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The model most athletes are taught

Show nothing. Feel nothing. Emotion is weakness, and the composed competitor is
one who has none.

The first part is sometimes tactically useful. The second is not how people
work, and the third is wrong.

## What suppression actually does

Pushing a feeling down does not remove it. The research on **expressive
suppression** consistently finds that it:

- Keeps the physiological arousal going, and sometimes increases it.
- Costs attention — the effort of suppressing uses the same resources you need
  for decisions.
- Tends to leak out later, usually at a teammate, an official or a family
  member.
- Does not reliably reduce how bad the feeling is.

An athlete suppressing frustration through a half is competing with a portion
of their attention already spent.

## The better model

Elite competitors are not unemotional. They:

- **Notice** the state early.
- **Name** it accurately.
- **Decide** what the situation requires.
- **Return** attention to the task.

That sequence takes a few seconds with practice, and it is what people are
describing when they say someone is composed.

## Emotion is also fuel

Some states improve performance. Controlled aggression, the right kind of
arousal before a contest, the sharpness that comes from caring about an
outcome. MT-201 and MT-202 are about getting the level right rather than getting
it to zero.

The goal is not a flat athlete. It is an athlete whose emotional state is
information they can use rather than weather that happens to them.

## What to stop saying

"Don't get emotional." It is unachievable advice, and an athlete who believes
they should feel nothing concludes something is wrong with them when they
inevitably do.

Replace it with: *notice it, name it, choose what to do.*
""",
            },
            {
                "title": "Emotional Literacy Primer",
                "description": "The mechanism, the four-step sequence, and what suppression costs.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable primer for Module 1. Page one sets out affect labelling and emotional
granularity in plain language, with the four benefits in competition — earlier
detection, the right response, shorter spikes and better conversations — and the
three skills this course builds.

Page two compares the suppression model with the notice-name-decide-return
sequence, lists what suppression costs in attention and leakage, and provides
space to record the advice you have been given about emotion in sport and what
you will use instead.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — What You Were Taught About Emotion",
            "description": (
                "Start from what you currently believe, because that is what you will be "
                "working against.\n\n"
                "Submit:\n"
                "1. The advice you have been given about emotion in sport — by coaches, family "
                "or teammates. Quote it as closely as you can, and say who said it.\n"
                "2. Your own current model: what do you actually do when a strong feeling "
                "arrives mid-competition? Be honest, including if the answer is 'push it down "
                "and hope'.\n"
                "3. A suppression example: describe one occasion when you held something down "
                "during competition. What did it cost in attention, and did it leak out "
                "afterwards?\n"
                "4. The four-step sequence written in your own words.\n"
                "5. One state that improves your performance, and one that damages it. Name "
                "both precisely.\n"
                "6. One paragraph on which part of this lesson you disagree with or find hard to "
                "accept. Disagreement thoughtfully argued scores full marks.\n\n"
                "Graded on honesty and specificity, not on agreeing with the lesson."
            ),
            "total_marks": 100,
            "due_in_days": 10,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Why Naming It Changes It",
            "description": "Four questions on affect labelling and suppression.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does research on affect labelling find?",
                    "choices": [
                        "Naming an emotional state reduces the physiological response to it",
                        "Describing feelings makes them more intense",
                        "Labelling works only for positive states",
                        "Emotions must be suppressed before they can be named",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is emotional granularity?",
                    "choices": [
                        "The number of emotions felt in a single day",
                        "The ability to distinguish between closely related feelings",
                        "The speed at which a feeling fades",
                        "The physical intensity of an emotional spike",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does expressive suppression typically cost an athlete?",
                    "choices": [
                        "Nothing measurable",
                        "Only a short-term loss of motivation",
                        "Attention, with the arousal continuing and often leaking out later",
                        "Reduced physical output but better decisions",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the four-step sequence composed competitors use?",
                    "choices": [
                        "Suppress, refocus, perform, review",
                        "Vent, reset, re-engage, repeat",
                        "Breathe, ignore, continue, analyse",
                        "Notice, name, decide, return attention to the task",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Vocabulary",
        "description": (
            "Telling frustration from anger from anxiety, and why each one needs a different "
            "response."
        ),
        "lessons": [
            {
                "title": "Three States Athletes Confuse",
                "description": "Frustration, anger and anxiety — what each one is, and what each one needs.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## They are not the same thing

Athletes routinely describe all three as "being wound up", and then apply one
response to all of them. The responses are different.

**Frustration.** A blocked goal. You are trying to do something and it is not
working — the same duel lost three times, a referee's interpretation, your own
execution.

*What it needs:* a change of approach or a change of target. Frustration is
information that what you are doing is not working, which is useful. More effort
at the same thing usually increases it.

**Anger.** A perceived injustice or a threat to status. Someone did something to
you or to a teammate, or you feel disrespected.

*What it needs:* a delay and a physical outlet inside the rules. Anger narrows
attention onto its target, which is why angry athletes stop seeing the rest of
the field. The response is a deliberate widening — MT-203's reset triggers.

**Anxiety.** A future-focused state about something that might happen. The
trial, the selection, the score, what a parent will say.

*What it needs:* a return to the present and to something controllable. The
W.I.N. framework in MT-202 exists for precisely this. Reassurance usually does
not work, because the fear is not about the facts.

## The others worth naming

- **Nervousness / activation** — normal pre-competition arousal, frequently
  useful. Not the same as anxiety.
- **Disappointment** — a past-focused state about something that has already
  happened. Needs processing, not managing. MT-204.
- **Embarrassment** — about how you appeared to others. Extremely common after
  a visible mistake and rarely named, which is why it lingers.
- **Overwhelm** — too many demands at once. Needs subtraction, not effort.
- **Flatness** — under-aroused, disengaged. Needs activation rather than
  calming, and is frequently misread as nerves.

## Why precision matters in the moment

An athlete who calls everything "nerves" and breathes slowly to calm down will
make flatness worse, do nothing for frustration, and apply the wrong tool to
anger.

Naming it correctly selects the tool. That is the whole purpose of a
vocabulary.
""",
            },
            {
                "title": "Building Your Own Vocabulary",
                "description": "A personal list, in your own words, with the situations that produce each state.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Standard words may not fit you

The useful vocabulary is the one you actually use. Some athletes never say
"anxious" but know exactly what "tight" means in their body. Others distinguish
three different kinds of frustration that matter to them.

Build a personal list of **eight to twelve states**, each with:

- **Your word for it** — whatever you actually say.
- **What it feels like**, in one line.
- **What usually causes it**, specifically.
- **What it does to your performance** — does it sharpen or degrade you?
- **What it needs** — the response, from Module 1's four-step sequence.

## Rate the intensity

Add a 1-10 scale to each. The difference between frustration at 3 and
frustration at 8 is the difference between information and a problem, and
catching states at 3 is the entire argument of Module 3.

## The ones to be most precise about

Whichever states cost you most. For most athletes that is a small set — often
frustration with their own execution, anxiety about judgement, and
embarrassment after a visible error.

Spend your precision there rather than spreading it thinly.

## Where the vocabulary gets used

- **In the moment**, silently: *"this is frustration at 6."*
- **In the post-game review** from MT-204.
- **In conversation with a coach**: far more useful than "I was off today".
- **In the daily audit** from Module 5.

## Do it with someone who sees you compete

A teammate, a coach or a parent who watches you regularly can often name a state
you cannot see from inside it — "you go quiet and your passing gets safe". That
outside view is one of the fastest ways to build an accurate list, and MT-103
uses the same trick for self-talk.
""",
            },
            {
                "title": "Personal Emotion Vocabulary",
                "description": "Reference table of the common states plus a build-your-own sheet with intensity scales.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable vocabulary for Module 2. The reference table defines frustration,
anger, anxiety, nervousness, disappointment, embarrassment, overwhelm and
flatness — what each one is, what it does to performance, and what it needs,
side by side so the differences are visible.

The build-your-own sheet holds eight to twelve rows for your own words, with
columns for what it feels like, what causes it, its effect on performance, the
response it needs and a 1-10 intensity scale. A closing panel records the two or
three states that cost you most and the outside view from someone who watches
you compete.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Build Your Emotion Vocabulary",
            "description": (
                "Build a list you would actually use in the middle of a match.\n\n"
                "Submit:\n"
                "1. Your personal vocabulary of eight to twelve states, each with your own word, "
                "what it feels like, what causes it, what it does to your performance, and what "
                "it needs.\n"
                "2. Intensity: for your three most costly states, describe what each one looks "
                "like at 3, at 6 and at 9.\n"
                "3. The three-way distinction: describe, from your own season, one clear example "
                "each of frustration, anger and anxiety. Explain how you can tell them apart in "
                "yourself.\n"
                "4. The misapplied tool: describe an occasion when you used the wrong response — "
                "calming yourself when you were flat, or trying harder when you were frustrated.\n"
                "5. The outside view: ask someone who watches you compete what they see when you "
                "are struggling emotionally. Record their words exactly.\n"
                "6. One paragraph on which state costs you the most, and why.\n\n"
                "Graded on whether the vocabulary is in your own language, on the quality of the "
                "three-way distinction, and on whether the outside view was genuinely sought."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Vocabulary",
            "description": "Four questions on distinguishing emotional states.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is frustration, and what does it need?",
                    "choices": [
                        "A blocked goal — it needs a change of approach or target, not more effort at the same thing",
                        "A future-focused fear — it needs reassurance",
                        "A perceived injustice — it needs a delay and an outlet",
                        "Under-arousal — it needs activation",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does anger do to attention?",
                    "choices": [
                        "Widens it across the whole field",
                        "Narrows it onto its target, which is why angry athletes stop seeing the rest of the field",
                        "Has no measurable effect on attention",
                        "Improves peripheral awareness",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which state is frequently misread as nerves but needs activation rather than calming?",
                    "choices": ["Anxiety", "Embarrassment", "Flatness", "Overwhelm"],
                    "answer": 2,
                },
                {
                    "text": "Why does the course say to build the vocabulary in your own words?",
                    "choices": [
                        "Standard psychological terms are inaccurate",
                        "Coaches prefer athlete-generated language",
                        "It makes the list shorter",
                        "The useful vocabulary is the one you actually use in the moment",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Physical Tells",
        "description": (
            "Catching a state at a 3 instead of an 8 by learning what your body does first."
        ),
        "lessons": [
            {
                "title": "The Body Moves First",
                "description": "Interoception, the common tells, and why they arrive before the thought does.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## You feel it before you know it

An emotional state produces physical changes before you consciously identify it
— breathing, muscle tension, heart rate, posture. The ability to notice internal
bodily signals is called **interoception**, and it is trainable.

That matters because the physical change is your earliest warning. An athlete
who learns their tells catches a state at a 3, when a ten-second response is
enough. An athlete who waits for the thought catches it at an 8, by which point
the decision has already been made badly.

## The common tells

**Breathing.** The most reliable and the most useful. Shallow, high in the
chest, fast, or held entirely. Almost everybody has a breathing tell.

**Jaw and shoulders.** Clenched teeth, shoulders creeping toward the ears,
tension in the neck.

**Hands.** Gripping too tight, fidgeting, clenched fists, fingers checking
equipment repeatedly.

**Eyes and head.** Dropping the head, narrowing focus to the ground, stopping
scanning.

**Gut and chest.** Tightness, a dropping sensation, nausea before competition.

**Pace.** Rushing — walking faster, playing faster than the situation needs,
speaking faster. Rushing is one of the most common and most costly tells.

**Voice.** Going silent, or getting louder. Both are information.

## Yours are personal

The general list is where you start. Your own might be a foot that starts
tapping, a habit of re-tying a lace, or picking at the kit. The value is in the
specificity: *"when my shoulders come up and I start rushing between points,
that is frustration at about a 5."*

## Learn them in three places

1. **In training**, where the stakes are low and you can pay attention.
2. **On film**, which is the fastest route — tells are visible from outside long
   before they are noticed from inside.
3. **From other people**, who have been watching them for years.

MT-203 uses the same film habit for a different purpose, and the two work well
together.
""",
            },
            {
                "title": "From Tell to Response",
                "description": "Linking each tell to one action, so noticing produces something.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Noticing is only half of it

An athlete who notices their shoulders rising and does nothing has added a
distraction. Each tell needs a paired response, decided in advance and small
enough to do mid-competition.

## Build the pairs

| Tell | Immediate response |
| --- | --- |
| Shallow, high breathing | One slow exhale, longer than the inhale |
| Shoulders up, jaw tight | Drop the shoulders, unclench, roll once |
| Gripping too tight | Open the hands fully for two seconds |
| Rushing | Deliberately slow one action — walk, set, breathe |
| Head dropping, narrow focus | Lift the head, look at the furthest point you can see |
| Gone silent | Say one thing to a teammate |

Keep them **physical and tiny**. A response that requires thinking will not
survive a competitive moment.

## Why the exhale, specifically

Lengthening the exhale relative to the inhale is one of the few reliable,
immediate ways to reduce physiological arousal, and it is available anywhere
without equipment or anyone noticing. MT-202 builds it into a full protocol; at
this stage one long exhale attached to one tell is enough.

## Practise it in training

A response practised only in competition will not be there in competition. For
two weeks, attach the response to the tell every time you notice it in
training, even when it does not matter. You are building an automatic link, not
a decision.

## Measure it

Count how many times you noticed a tell and how many times you responded. The
ratio is the skill, and it improves quickly — most athletes go from noticing
afterwards to noticing during within a few weeks.

## If a tell is constant

A tell that is present all the time is not a tell — it is your baseline, which
is Module 4. And a tell that keeps appearing at the same moment every session
is pointing at something worth examining in MT-103 or MT-202 rather than
something to manage with a breath.
""",
            },
            {
                "title": "Tell-and-Response Map",
                "description": "Personal tells by body region, the paired response for each, and the film-review prompt.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable map for Module 3. The tell section lists the common tells by region —
breathing, jaw and shoulders, hands, eyes and head, gut, pace, voice — with
space to record your own version of each, the state it signals and the intensity
at which it appears.

The response column pairs each tell with one small physical action that can be
done mid-competition, and a practice tracker counts noticed-versus-responded
across two weeks. A film panel prompts the review of a recorded session
specifically for visible tells.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Identify Your Tells and Pair Them",
            "description": (
                "Find them on film and in training, not from memory.\n\n"
                "Submit:\n"
                "1. Your personal tells: at least five, by body region, each with the state it "
                "signals and the intensity at which it appears.\n"
                "2. Film evidence: watch a recorded training session or match and identify at "
                "least two tells visible from outside. Give timestamps and describe what you "
                "saw.\n"
                "3. The outside view: ask someone who watches you what they notice when you are "
                "struggling. Record their words.\n"
                "4. Your tell-and-response pairs: one small, physical, mid-competition response "
                "for each tell.\n"
                "5. Two weeks of practice: a tracker showing how many times you noticed a tell "
                "and how many times you responded, with the ratio for each week.\n"
                "6. One paragraph on your earliest tell — the one that arrives first — and "
                "whether you can now catch it at a 3.\n\n"
                "Graded on whether the tells were found on film rather than recalled, on whether "
                "the responses are small enough to survive competition, and on the honesty of "
                "the practice tracker."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Physical Tells",
            "description": "Four questions on tells and paired responses.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why are physical tells useful as an early warning?",
                    "choices": [
                        "They are easier to hide from opponents",
                        "The physical change arrives before you consciously identify the state, so you can catch it at a 3 rather than an 8",
                        "They only appear in high-stakes competition",
                        "They replace the need for an emotional vocabulary",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course call the most reliable and useful tell?",
                    "choices": ["Jaw tension", "Grip pressure", "Breathing", "Voice volume"],
                    "answer": 2,
                },
                {
                    "text": "What makes a paired response usable mid-competition?",
                    "choices": [
                        "It is physical and tiny, requiring no thinking",
                        "It involves a full reset routine",
                        "It is invisible to teammates",
                        "It is only used during stoppages",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does the course say about a tell that is present all the time?",
                    "choices": [
                        "It is the most important one to manage",
                        "It should be eliminated through training",
                        "It indicates an unusually high arousal athlete",
                        "It is not a tell — it is your baseline",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Your Neutral Baseline",
        "description": (
            "Establishing what normal actually is for you, so a deviation is visible before "
            "it becomes a problem."
        ),
        "lessons": [
            {
                "title": "What Baseline Means",
                "description": "Why a personal normal is the reference point for every other skill in this pathway.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## You cannot notice a change without a normal

Every skill in this pathway depends on comparison. A tell only means something
against the absence of that tell. A readiness score only means something against
your usual score. "I feel off today" is only useful if you know what "on" is.

A **baseline** is a written description of your ordinary state — physical,
emotional and attentional — when nothing in particular is happening.

## It is personal, not standard

Some athletes are naturally high-arousal and perform best there. Some are calm
and need activating. The research on optimal arousal has moved steadily toward
the view that the useful zone is **individual** — it differs by person and by
task, and borrowing somebody else's is a mistake.

So the point is not to reach a prescribed calm. It is to know yours.

## What goes in it

- **Physical:** resting breathing, typical tension, how your body usually feels
  in the hour before training.
- **Emotional:** your ordinary mood range, how quickly you usually move between
  states.
- **Attentional:** how easily you usually concentrate, what your mind does when
  it wanders.
- **Social:** how talkative you usually are, how you usually interact before
  competition.
- **Your competition zone:** the state in which you actually perform best, which
  is frequently *not* your resting baseline.

That last one matters. Many athletes perform best slightly activated, and for
them "calm" is a performance problem rather than a solution.

## Find your zone from evidence

Think back over your best performances and your worst, and describe your state
before each. Most athletes discover a clear pattern within six examples: *my
best games came when I was quiet but loose and slightly nervous; my worst came
when I was either flat or over-hyped.*

That description is your target zone, and MT-201's pre-game routine exists to
get you into it deliberately rather than by accident.

## Rebuild it each season

Baselines change — with growth, with load, with life. Re-describe yours each
season, and expect the competition zone to be stable while the resting baseline
moves.
""",
            },
            {
                "title": "Finding the Pattern in Your Own Performances",
                "description": "A structured retrospective across best and worst performances.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The method

Take six performances: your three best this year and your three worst. For each,
reconstruct honestly:

1. **The day before:** sleep, load, anything unusual.
2. **The morning:** how you felt, what you ate, what you did.
3. **The hour before:** your physical state, your emotional state, who you
   spoke to, what you were thinking about.
4. **The first ten minutes:** how it started.
5. **The state you were in while it was going well, or badly.**

Write it before looking for the pattern, so you are not fitting the evidence to
a conclusion.

## What people find

Common patterns, and almost every athlete finds one or two:

- Best performances share a **level of arousal**, not a level of confidence.
- Worst performances cluster at **one end** — either flat or over-activated —
  and most athletes have a characteristic failure direction.
- **Sleep two nights before** shows up more often than the night before, which
  CEO-302 also found.
- A **specific routine element** is present in the good ones and absent in the
  bad ones, frequently something small and apparently unimportant.
- **Who you spoke to beforehand** matters more than athletes expect.

## Write the zone as a sentence

> *"I play best when I'm quiet, physically loose, slightly nervous, and I've
> had ten minutes alone before warm-up."*

Specific enough to aim at, short enough to remember. MT-201 turns it into a
routine.

## And the failure direction

> *"I'm more likely to fail flat than over-hyped."*

Knowing your direction tells you which tool to reach for, and it is why MT-202
is not only about calming down.

## Honesty about the sample

Six performances is a small sample and memory is unreliable. Treat the pattern
as a hypothesis, then test it prospectively with the daily audit in Module 5 —
which is how you find out whether it is real.
""",
            },
            {
                "title": "Baseline and Performance Pattern Sheet",
                "description": "Baseline description, six-performance retrospective and the competition zone sentence.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable sheet for Module 4. The baseline section describes your ordinary state
across physical, emotional, attentional and social dimensions, with a note that
this is personal rather than a standard to reach.

The retrospective runs six performances — three best, three worst — across the
day before, the morning, the hour before, the first ten minutes and the state
during, with a pattern panel underneath. The sheet closes with your competition
zone written as one sentence, your characteristic failure direction, and the
date you will rebuild the baseline.""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Establish Your Baseline and Zone",
            "description": (
                "Reconstruct six real performances before looking for the pattern.\n\n"
                "Submit:\n"
                "1. Your written baseline across all four dimensions: physical, emotional, "
                "attentional and social.\n"
                "2. The six-performance retrospective: three best, three worst, each "
                "reconstructed across all five points. Write all six before analysing any of "
                "them.\n"
                "3. The pattern: what do your best performances share, and what do your worst "
                "share? Be specific.\n"
                "4. Your competition zone, written as one sentence, specific enough to aim at.\n"
                "5. Your characteristic failure direction — flat or over-activated — with the "
                "evidence.\n"
                "6. Anything surprising: a routine element, a person, a sleep pattern that "
                "turned out to matter more than you expected.\n"
                "7. One paragraph on how you will test whether the pattern is real rather than "
                "a story fitted to six memories.\n\n"
                "Graded on whether all six were written before the analysis, on the specificity "
                "of the zone sentence, and on the honesty of part 7."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: Your Baseline",
            "description": "Four questions on baselines and competition zones.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is a baseline?",
                    "choices": [
                        "A written description of your ordinary physical, emotional and attentional state",
                        "The calmest state an athlete can reach",
                        "The average of your performance scores",
                        "A target arousal level recommended for your sport",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does the research on optimal arousal suggest?",
                    "choices": [
                        "All athletes perform best when calm",
                        "The useful zone is individual, differing by person and task",
                        "Higher arousal always improves performance",
                        "Arousal is unrelated to performance quality",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course say to write all six performance reconstructions before analysing them?",
                    "choices": [
                        "To save time during the review",
                        "Because coaches review them separately",
                        "So you are not fitting the evidence to a conclusion",
                        "Because memory improves with repetition",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does knowing your characteristic failure direction matter?",
                    "choices": [
                        "It predicts which opponents trouble you",
                        "It determines your training load",
                        "It identifies which emotions to suppress",
                        "It tells you which tool to reach for — calming down is not always the answer",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Daily Audit",
        "description": (
            "A sixty-second daily habit that turns the vocabulary, the tells and the baseline "
            "into data you can act on."
        ),
        "lessons": [
            {
                "title": "Sixty Seconds, Every Day",
                "description": "What to record, when, and why brevity is what makes it survive.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The habit

Once a day, at the same time, sixty seconds:

1. **State now**, named from your vocabulary, with an intensity 1-10.
2. **The strongest state today**, with what caused it.
3. **Any tell you noticed**, and whether you responded.
4. **Sleep**, in hours.
5. **One line** on anything unusual.

That is it. Written somewhere consistent — a notes app, the back of a training
diary, the CEO-302 readiness tracker if you are using it.

## Why it must be short

Every athlete who designs a twenty-minute reflective journal abandons it in
three weeks. Sixty seconds survives a season, and a season of brief entries is
worth infinitely more than three weeks of detailed ones.

If you miss a day, write the next day. A gap is not a failure of the system.

## What it gives you after a month

- **Patterns you cannot see day to day.** The state that always appears on
  Thursdays. The week when sleep dropped and frustration rose together.
- **Early warning.** A run of low days is visible in a log and invisible in
  memory.
- **Accurate conversations.** With a coach, a parent or a professional: *"here
  are twenty-eight days"* is a different conversation from *"I've been feeling
  off"*.
- **Evidence about your own hypotheses** from Module 4.

## Reviewing it

Weekly, two minutes: what was the most common state, what caused the strongest
one, how many tells did I catch?

Monthly, ten minutes: trends, anything correlating with sleep or load, and
whether the Module 4 pattern is holding up.

That cadence is the same one CEO-101 built for the rest of the enterprise, and
it works here for the same reason.

## Keep it private

Nobody has to read it, and an audit written for a coach becomes a performance.
If you choose to share a summary with someone, share the trend rather than the
entries.
""",
            },
            {
                "title": "Reading the Log, and When to Escalate",
                "description": "What patterns mean, and the boundary where a log becomes a reason to talk to someone.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Ordinary patterns

Most of what you will see is normal and useful:

- Spikes around selection, examinations, or a specific opponent.
- Frustration clustering in a technical phase you are working on.
- Flatness in the fourth week of a block, which is a load signal and belongs in
  CEO-302's monitoring.
- Better states on days with more sleep, which is the most common finding of
  all.

Act on these with the tools in this pathway: the response pairs from Module 3,
the routines in MT-201, the pressure protocol in MT-202.

## Patterns that need a conversation

A log is good at making one thing visible that memory hides: a **trend** rather
than a bad day.

Talk to an adult you trust if your log shows:

- Low mood on most days for more than two weeks.
- Anxiety appearing on most days, not only around competition.
- Sleep persistently poor when training load does not explain it.
- Loss of interest in things you normally enjoy, including sport.
- States you are managing with substances.
- Any entry about harming yourself.

**Any thought of self-harm is an immediate conversation with a trusted adult or
a crisis line, today.** Not after the season. Help exists, these conditions are
treatable, and telling someone is the whole first step.

## Taking the log to a professional

If you do speak to a counsellor, physician or psychologist, bring it. A month of
dated entries is genuinely useful clinical information and it saves a great deal
of time in a first appointment.

## What a log is not

Not a diagnosis, not a score, and not evidence that you are doing badly. A log
full of difficult states is a log kept honestly by somebody in a demanding
situation.

The purpose is to notice sooner — in competition, at a 3 instead of an 8, and
in life, in week two instead of week ten.
""",
            },
            {
                "title": "Daily Audit Log",
                "description": "Thirty-day log sheet with the weekly and monthly review prompts and the escalation list.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable log for Module 5. Thirty dated rows record state now with intensity,
the strongest state and its cause, any tell noticed and whether you responded,
sleep hours, and one line on anything unusual — deliberately narrow so it takes
sixty seconds.

A review page holds the weekly two-minute questions and the monthly ten-minute
trend check against the Module 4 pattern. The escalation panel lists the
patterns that need a conversation rather than a tool, with space for real
contacts, and a note that a month of dated entries is useful to bring to a
professional.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Thirty Days of Audit",
            "description": (
                "Keep it for thirty days. Partial honest data beats complete invented data.\n\n"
                "Submit:\n"
                "1. Thirty days of the daily audit. If you missed days, show the gaps rather "
                "than filling them in afterwards.\n"
                "2. Your weekly reviews: four entries, each answering the three questions.\n"
                "3. Your monthly review: the most common state, the strongest states and their "
                "causes, your noticed-to-responded ratio, and anything correlating with sleep or "
                "load.\n"
                "4. The hypothesis test: did the pattern you identified in Module 4 hold up "
                "against thirty days of data? Say so honestly, including if it did not.\n"
                "5. One thing you changed as a result of the log, and what happened.\n"
                "6. The escalation list, completed with real contacts, and a statement that you "
                "know what in a log would mean talking to someone.\n\n"
                "Nothing here asks you to diagnose yourself. If the log surfaces something that "
                "concerns you, the right next step is the conversation, not a better "
                "submission.\n\n"
                "Graded on the consistency of the thirty days, on the honesty of the hypothesis "
                "test, and on whether the escalation list is filled in."
            ),
            "total_marks": 150,
            "due_in_days": 35,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: The Daily Audit",
            "description": "Four questions on the audit habit and reading the log.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does the course insist the daily audit takes sixty seconds?",
                    "choices": [
                        "Longer entries are less accurate",
                        "Sixty seconds survives a season, while a twenty-minute journal is abandoned in three weeks",
                        "Coaches review them daily",
                        "It matches the length of a readiness check",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does a log make visible that memory hides?",
                    "choices": [
                        "The exact cause of each emotional state",
                        "Which opponents trouble you most",
                        "A trend, rather than a bad day",
                        "Your competition zone",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which pattern means a conversation rather than a tool?",
                    "choices": [
                        "Frustration clustering in a technical phase you are working on",
                        "Spikes around selection or examinations",
                        "Flatness in the fourth week of a training block",
                        "Low mood on most days for more than two weeks",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What does the course say about bringing the log to a professional?",
                    "choices": [
                        "A month of dated entries is useful clinical information and saves time in a first appointment",
                        "Logs should be kept private from clinicians",
                        "Only a coach should see it",
                        "It should be summarised rather than shown",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Baseline Document",
        "description": (
            "The capstone: one page holding your vocabulary, tells, baseline, zone and audit "
            "habit, ready for the rest of the pathway."
        ),
        "lessons": [
            {
                "title": "Assembling the Page",
                "description": "What goes on it, and why it is one page rather than five.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## One page, five blocks

**1. My vocabulary.** Eight to twelve states in my own words, with what each one
needs.

**2. My tells.** Five or more, by region, each paired with one small physical
response.

**3. My baseline.** Ordinary physical, emotional, attentional and social state.

**4. My competition zone.** One sentence, plus my characteristic failure
direction.

**5. My audit habit.** When I do it, where it lives, and my weekly and monthly
review slots.

## Why one page

Because you will use it before a session, after a bad performance, and in a
conversation with a coach — and a five-page document does not get opened in any
of those moments.

Everything underneath it — the thirty-day log, the six-performance
retrospective, the film notes — lives behind it as working papers.

## Where it is used in the rest of the pathway

- **MT-103** takes your vocabulary and works on the voice that comments on it.
- **MT-201** turns the competition zone into a pre-game routine.
- **MT-202** uses the tells as the trigger for the pressure protocol.
- **MT-203** measures how fast you return to baseline after a mistake.
- **MT-204** uses the audit as the post-game processing habit.
- **MT-301** relies on all of it, because injury is where self-monitoring
  matters most and is hardest.

Which is why this course is second: nothing after it works well without a
vocabulary, a set of tells and a known normal.

## Update it each season

Baselines move. Tells change as you mature physically. Your vocabulary gets
more precise with use — most athletes find their list gets shorter and more
accurate after a year, not longer.

Date every version.
""",
            },
            {
                "title": "Using It With Other People",
                "description": "Sharing the right parts with coaches, family and professionals.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## It is yours, and some of it is worth sharing

The page is private by default. But three audiences get real value from parts of
it, and sharing the right part is a skill.

## With a coach

Share the **competition zone** and the **failure direction**, not the log.

> *"I play best quiet and slightly nervous. When I'm struggling I go flat rather
> than over-hyped, so if you see me quiet and slow between points, pushing me
> harder usually works better than calming me down."*

Most coaches find that genuinely useful and very few athletes ever say it. It
tells them which lever to pull, which is what they are guessing at anyway.

## With family

Share **what you need around competition**, not your internal states.

> *"The hour before, I need to be left alone. The ride home, ask me if I want to
> talk and believe the answer."*

That second sentence is MT-204's subject and solves one of the most common
sources of friction in athletic families — REC-204 made the same point from the
parent's side.

## With a professional

Share **everything**, including the log. They are the one audience for whom the
raw data is the useful part.

## What not to share, and with whom

- Not the log with a coach who selects you. Not because they would misuse it,
  but because an audit written knowing a selector reads it stops being honest.
- Not your states, in detail, with teammates who are competing with you.
- Not a difficult period on social media. CEO-201's rules apply.

## The one sentence worth saying out loud

To one trusted adult, once:

> *"I keep track of how I'm doing, and if it ever looks like more than ordinary
> sport stress, I'll tell you."*

That sentence makes the later conversation possible, and the later conversation
is the entire reason the escalation list exists.
""",
            },
            {
                "title": "The Baseline Document",
                "description": "One-page template with the five blocks, the sharing guide and the version log.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable one-page template for the MT-102 capstone. Five blocks — vocabulary,
tells with paired responses, baseline, competition zone with failure direction,
and the audit habit with its review slots — sized to be opened before a session
or after a poor performance.

A sharing guide sets out what goes to a coach, to family and to a professional,
and what is not shared with whom and why. A version log dates each revision, and
a closing line records the one sentence said out loud to a trusted adult.""",
            },
        ],
        "assignment": {
            "title": "Capstone — The Baseline Document",
            "description": (
                "Assemble the course into one page, and have two real conversations.\n\n"
                "Part A — The page. All five blocks: vocabulary, tells with paired responses, "
                "baseline, competition zone with failure direction, and the audit habit with "
                "review slots. One page, dated.\n\n"
                "Part B — The working papers. The thirty-day log, the six-performance "
                "retrospective and your film notes, attached behind it.\n\n"
                "Part C — The coach conversation. Tell a coach your competition zone and failure "
                "direction, in the format from the lesson. Submit what you said and what they "
                "said back.\n\n"
                "Part D — The family conversation. Tell whoever takes you to competition what "
                "you need before and after. Submit what you said and how it was received.\n\n"
                "Part E — The sentence. Say the one sentence to a trusted adult, and record who "
                "and when.\n\n"
                "Part F — 200-300 words: which of the three skills — vocabulary, tells, baseline "
                "— has changed your competing most, and what evidence do you have?\n\n"
                "Graded on whether the page is genuinely one page and usable, on evidence that "
                "the two conversations happened, and on whether Part F cites evidence rather "
                "than impressions."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: The Baseline Document",
            "description": "Four questions on assembling and sharing the document.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why is the baseline document one page?",
                    "choices": [
                        "Because it is used before a session, after a bad performance and in a conversation — moments when a long document is not opened",
                        "Because coaches will not read more",
                        "Because the log replaces the detail",
                        "Because a longer version would be shared accidentally",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What should be shared with a coach?",
                    "choices": [
                        "The full daily log",
                        "The competition zone and the failure direction",
                        "The six-performance retrospective",
                        "The escalation list",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course advise against sharing the log with a coach who selects you?",
                    "choices": [
                        "Coaches are not trained to interpret it",
                        "It breaches confidentiality rules",
                        "An audit written knowing a selector reads it stops being honest",
                        "It would duplicate the readiness tracker",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the one sentence the course asks you to say to a trusted adult?",
                    "choices": [
                        "That you are managing your emotions well",
                        "That you would prefer not to discuss performance",
                        "That you are keeping a log for a course",
                        "That you keep track of how you are doing, and will tell them if it ever looks like more than ordinary sport stress",
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
            "Module 1's primer. Naming a feeling precisely lowers its intensity; “I feel "
            "bad” is unactionable and therefore stays loud. The whole point is speed — "
            "name it in two seconds and get back to the task."
        ),
        "sections": [
            {
                "heading": "1. Two Models of Emotion in Sport",
                "table": {
                    "columns": ["The suppression model", "The notice-name-decide-return model"],
                    "rows": [
                        ["Show nothing, feel nothing", "Notice the state early"],
                        ["Push it down and keep going", "Name it accurately"],
                        ["Arousal continues, attention is spent", "Decide what the situation requires"],
                        ["It leaks out later, usually at someone", "Return attention to the task"],
                    ],
                },
                "fields": ["The advice about emotion I have actually been given, and by whom"],
            },
            {
                "heading": "2. What Naming Buys You",
                "bullets": [
                    "Earlier detection — catching a state at a 3 rather than an 8.",
                    "The right response: frustration, anxiety and anger need different tools.",
                    "Shorter spikes, which MT-203 measures directly.",
                    "Conversations somebody can actually help with.",
                ],
            },
            {
                "heading": "3. My Current Model",
                "fields": [
                    "What I actually do when a strong feeling arrives mid-competition",
                    "A time I suppressed something — what it cost, and whether it leaked",
                    "One state that improves my performance",
                    "One state that damages it",
                    "What I disagree with in this lesson",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 2's vocabulary. Athletes call all of these “being wound up” and "
            "then apply one response to all of them. Naming it correctly is what selects the "
            "tool."
        ),
        "sections": [
            {
                "heading": "1. Reference: The States Athletes Confuse",
                "table": {
                    "columns": ["State", "What it is", "What it needs"],
                    "rows": [
                        ["Frustration", "A blocked goal", "A change of approach or target — not more of the same"],
                        ["Anger", "Perceived injustice or threat to status", "A delay, an outlet inside the rules, a deliberate widening of attention"],
                        ["Anxiety", "Future-focused, about what might happen", "Return to the present and to something controllable (W.I.N.)"],
                        ["Nervousness / activation", "Normal pre-competition arousal", "Often nothing — it is frequently useful"],
                        ["Disappointment", "Past-focused, already happened", "Processing, not managing (MT-204)"],
                        ["Embarrassment", "About how you appeared to others", "Naming it — it lingers because it is rarely named"],
                        ["Overwhelm", "Too many demands at once", "Subtraction, not effort"],
                        ["Flatness", "Under-aroused, disengaged", "Activation, not calming"],
                    ],
                },
            },
            {
                "heading": "2. My Own Vocabulary",
                "table": {
                    "columns": ["My word", "What it feels like", "What causes it", "Effect on my performance", "What it needs"],
                    "rows": [["", "", "", "", ""] for _ in range(8)],
                },
            },
            {
                "heading": "3. Intensity and the Outside View",
                "table": {
                    "columns": ["My three costliest states", "At a 3", "At a 6", "At a 9"],
                    "rows": [["", "", "", ""] for _ in range(3)],
                },
                "fields": [
                    "A time I used the wrong tool (calming when flat, trying harder when frustrated)",
                    "What someone who watches me compete says they see",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 3's map. The body changes before you consciously identify the state, "
            "which makes your tells the earliest warning you have. Find them on film — they "
            "are visible from outside long before they are noticed from inside."
        ),
        "sections": [
            {
                "heading": "1. My Tells",
                "table": {
                    "columns": ["Region", "My tell", "Which state it signals", "At what intensity"],
                    "rows": [
                        ["Breathing", "", "", ""],
                        ["Jaw / shoulders", "", "", ""],
                        ["Hands", "", "", ""],
                        ["Eyes / head", "", "", ""],
                        ["Gut / chest", "", "", ""],
                        ["Pace", "", "", ""],
                        ["Voice", "", "", ""],
                    ],
                },
                "fields": ["Film review — timestamps where a tell is visible"],
            },
            {
                "heading": "2. Tell and Response Pairs",
                "paragraphs": [
                    "Physical and tiny. A response that requires thinking will not survive a "
                    "competitive moment."
                ],
                "table": {
                    "columns": ["Tell", "Immediate response"],
                    "rows": [
                        ["Shallow, high breathing", "One slow exhale, longer than the inhale"],
                        ["Shoulders up, jaw tight", "Drop the shoulders, unclench, roll once"],
                        ["Gripping too tight", "Open the hands fully for two seconds"],
                        ["Rushing", "Deliberately slow one action"],
                        ["Head dropping, narrow focus", "Lift the head, look at the furthest point"],
                        ["Gone silent", "Say one thing to a teammate"],
                    ],
                },
            },
            {
                "heading": "3. Practice Tracker",
                "table": {
                    "columns": ["Week", "Tells noticed", "Times I responded", "Ratio"],
                    "rows": [["1", "", "", ""], ["2", "", "", ""]],
                },
                "fields": ["My earliest tell — the one that arrives first", "Can I now catch it at a 3?"],
            },
        ],
    },
    {
        "intro": (
            "Module 4's sheet. You cannot notice a change without a normal — and the useful "
            "arousal zone is individual, so borrowing somebody else's is a mistake. Write all "
            "six performances before looking for the pattern."
        ),
        "sections": [
            {
                "heading": "1. My Baseline",
                "table": {
                    "columns": ["Dimension", "My ordinary state"],
                    "rows": [
                        ["Physical — breathing, tension, how my body feels", ""],
                        ["Emotional — ordinary mood range, how fast I move between states", ""],
                        ["Attentional — how easily I concentrate, where my mind goes", ""],
                        ["Social — how talkative I usually am before competition", ""],
                    ],
                },
            },
            {
                "heading": "2. Six Performances",
                "table": {
                    "columns": ["Performance", "Day before", "Morning", "Hour before", "First ten minutes", "State during"],
                    "rows": [
                        ["Best 1", "", "", "", "", ""],
                        ["Best 2", "", "", "", "", ""],
                        ["Best 3", "", "", "", "", ""],
                        ["Worst 1", "", "", "", "", ""],
                        ["Worst 2", "", "", "", "", ""],
                        ["Worst 3", "", "", "", "", ""],
                    ],
                },
            },
            {
                "heading": "3. The Pattern",
                "fields": [
                    "What my best performances share",
                    "What my worst performances share",
                    "My competition zone, as one sentence",
                    "My characteristic failure direction: flat or over-activated",
                    "Anything surprising — a routine element, a person, a sleep pattern",
                    "How I will test whether this pattern is real",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 5's log. Sixty seconds a day survives a season; a twenty-minute journal "
            "does not. If you miss a day, write the next day — a gap is not a failure of the "
            "system."
        ),
        "sections": [
            {
                "heading": "1. The Daily Log",
                "table": {
                    "columns": ["Date", "State now (1-10)", "Strongest state today + cause", "Tell noticed / responded?", "Sleep", "Anything unusual"],
                    "rows": [["", "", "", "", "", ""] for _ in range(10)],
                },
            },
            {
                "heading": "2. Reviews",
                "table": {
                    "columns": ["Review", "Questions", "My answers"],
                    "rows": [
                        ["Weekly (2 min)", "Most common state? Cause of the strongest? Tells caught?", ""],
                        ["Monthly (10 min)", "Trends? Correlation with sleep or load? Is my Module 4 pattern holding?", ""],
                    ],
                },
                "fields": ["One thing I changed because of the log, and what happened"],
            },
            {
                "heading": "3. When a Log Means a Conversation",
                "bullets": [
                    "Low mood on most days for more than two weeks.",
                    "Anxiety on most days, not only around competition.",
                    "Sleep persistently poor when load does not explain it.",
                    "Loss of interest in things I normally enjoy, including sport.",
                    "States I am managing with substances.",
                    "Any entry about harming myself — an immediate conversation today.",
                ],
                "fields": ["Adult at home", "Adult at school", "Physician", "Crisis line"],
            },
        ],
    },
    {
        "intro": (
            "The MT-102 capstone. One page you will actually open before a session and after "
            "a bad performance — with the thirty-day log and the retrospective behind it as "
            "working papers."
        ),
        "sections": [
            {
                "heading": "1. The Five Blocks",
                "table": {
                    "columns": ["Block", "Mine"],
                    "rows": [
                        ["Vocabulary — my words, and what each needs", ""],
                        ["Tells — by region, each with a paired response", ""],
                        ["Baseline — physical, emotional, attentional, social", ""],
                        ["Competition zone — one sentence, plus failure direction", ""],
                        ["Audit habit — when, where, review slots", ""],
                    ],
                },
                "fields": ["Version date"],
            },
            {
                "heading": "2. What I Share, and With Whom",
                "table": {
                    "columns": ["Audience", "What they get", "What they do not"],
                    "rows": [
                        ["Coach", "Competition zone and failure direction", "The log"],
                        ["Family", "What I need before and after competition", "My internal states in detail"],
                        ["A professional", "Everything, including the log", "—"],
                        ["Teammates competing with me", "Nothing detailed", "My states"],
                    ],
                },
                "fields": ["What I said to my coach, and what they said back", "What I said to my family, and how it was received"],
            },
            {
                "heading": "3. The Sentence, and What Comes Next",
                "paragraphs": [
                    "“I keep track of how I'm doing, and if it ever looks like more than "
                    "ordinary sport stress, I'll tell you.” That sentence is what makes "
                    "the later conversation possible."
                ],
                "fields": [
                    "Who I said it to, and when",
                    "Which of the three skills has changed my competing most, and the evidence",
                    "Date I rebuild this document",
                ],
            },
        ],
    },
]
