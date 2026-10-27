"""STU-105: Peer Pressure for Success. Cool Nerds Pathway, Level 1.
Student-facing. Three modules of three Markdown lessons, an assignment and a
quiz per module, no handout.
"""

MODULES = [
    {
        "title": "Comparison",
        "description": "The habit that makes high-achieving environments miserable.",
        "lessons": [
            {
                "title": "Why It Misleads",
                "description": "What you are actually comparing.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## It is automatic

In any group of people doing the same thing, you rank yourself continuously.
Nobody decides to; it happens.

The problem is not that it happens. It is that the comparison is almost
always between things that are not comparable.

## What you are comparing

**Your inside against their outside.** You know your doubts, your effort and
your near-misses. You see their results.

**One dimension out of many.** Somebody is ahead in maths. You have no
information about the rest of their life, and neither do they about yours.

**Different starting points.** Earlier teaching, a parent in the subject, a
year's head start, more time, fewer problems at home.

**Different rates.** People develop at wildly different speeds, and
seventeen-year-old rankings are a poor predictor of twenty-five-year-old
outcomes.

**A curated version.** Especially online, where you are comparing your
ordinary Tuesday to somebody's edited highlights.

## The cost

- It makes you miserable without producing improvement.
- It pushes you toward things you can already do, because being behind is
  uncomfortable.
- It damages friendships with people who should be allies.
- It is unending — there is always somebody ahead.

## The replacement

Compare yourself to yourself:

- What could I do in September that I cannot do now?
- What can I do now that I could not then?
- Am I getting better at the thing I chose to get better at?

Those questions are answerable, under your control, and they actually
correlate with progress.

## Using it well

A small amount of comparison is useful: somebody slightly ahead shows you
what is possible and how they did it.

The useful version is **"how did you do that?"** rather than "why am I not
that?" — the first is a conversation and the second is a wound.
""",
            },
            {
                "title": "Imposter Syndrome",
                "description": "Feeling like a fraud, which is near-universal.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## What it is

The feeling that you do not belong where you are, that you got there by luck
or error, and that at some point somebody will notice.

It is extremely common, it is more common in high-achieving environments, and
it is almost entirely uncorrelated with actual ability.

## Why it happens here

- Everybody around you is also selected, so the average is high.
- You moved from being top of a smaller group to average in a bigger one.
- You see everybody's output and nobody's struggle.
- Nobody admits to finding it hard, so you assume you are alone.

That last one is the engine. Almost everybody in the room feels some version
of it, and almost nobody says so.

## What does not help

- Being told you are good. It does not land; you discount it.
- Waiting to feel confident before doing things.
- Avoiding anything you might be visibly bad at, which confirms the belief.

## What does

**Evidence.** Keep a record of what you have actually done — marks, things
made, problems solved, feedback. Feelings argue; a list does not.

**Saying it out loud.** To one person. The reliable response is "oh, me
too", and that alone reduces it substantially.

**Reframing the discomfort.** If you feel out of your depth, you are
probably in the right room. Comfort means the level is too low.

**Acting anyway.** Confidence follows competence, which follows doing things
badly first (STU-113).

**Noticing the standard.** Feeling average among selected people is not the
same as being bad.

## When it is more than that

If it stops you working, keeps you awake, or comes with persistent low mood,
that is worth talking to somebody about — a teacher, a counsellor, a parent
(STU-106).
""",
            },
            {
                "title": "Healthy Rivalry",
                "description": "Competition that makes people better rather than smaller.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Two kinds

**Toxic:** you want them to do worse. Information is hoarded, help is
withheld, a friend's good result feels like a loss.

**Healthy:** you want to beat them at their best. You share what you know,
you are genuinely pleased when they do well, and you work harder because they
exist.

The second produces far better outcomes for everybody, including you.

## How to tell which you are in

Ask what you feel when somebody close to you does well.

Relief that they did worse than you is the signal. Pleasure that is clearly
genuine is the other.

Everybody feels both sometimes; the question is the default.

## Why the toxic version loses

- You learn nothing from people you are hiding from.
- You get a reputation quickly, and it lasts.
- You spend energy on other people's outcomes, which you cannot control.
- You end up with no allies, in a world that runs on them.

## Building the healthy version

- **Share what you find.** Notes, a good resource, a technique. It costs
  nothing and it comes back.
- **Say well done, and mean it**, especially when you wanted it.
- **Ask how they did it.**
- **Work alongside them.** Studying with somebody who is better is the
  cheapest improvement available.
- **Do not discuss marks competitively**, which is where most of this starts.

## The people ahead of you

The single most useful group, and the one people avoid out of
embarrassment.

Somebody a year ahead has just done exactly what you are about to do. Ask
them. Almost all of them will tell you, and almost nobody asks.

## The people behind you

Help them. It costs little, it is the fastest way to find out whether you
actually understand something, and it is how you become somebody people want
around.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Comparison Audit",
            "description": (
                "Submit:\n"
                "1. Who you compare yourself to, honestly, and on what.\n"
                "2. The five reasons comparison misleads, applied to one real comparison "
                "you make.\n"
                "3. The three self-comparison questions, answered for the last six months.\n"
                "4. One 'how did you do that?' conversation, with what you learned.\n"
                "5. Whether you experience imposter feelings, and where.\n"
                "6. Your evidence list: ten things you have actually done.\n"
                "7. Saying it out loud to one person, with their response.\n"
                "8. Your honest answer to what you feel when somebody close does well.\n"
                "9. Three things you shared this month that cost you nothing.\n"
                "10. One person a year ahead, asked about something you are about to do.\n\n"
                "Graded on the honesty of parts 1 and 8, and whether parts 7 and 10 "
                "happened."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Comparison",
            "description": "Four questions on comparison, imposter feelings and rivalry.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What are you usually comparing?",
                    "choices": [
                        "Your inside against their outside",
                        "Two equivalent sets of results",
                        "Effort against outcome",
                        "Current ability against future potential",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the engine of imposter syndrome in a selected group?",
                    "choices": [
                        "Genuinely being less able than others",
                        "Nobody admits to finding it hard, so you assume you are alone",
                        "Teachers setting unrealistic expectations",
                        "Moving schools or year groups",
                    ],
                    "answer": 1,
                },
                {
                    "text": "How do you tell which kind of rivalry you are in?",
                    "choices": [
                        "Whether you share your notes",
                        "Whether you study together",
                        "What you feel when somebody close to you does well",
                        "Whether you discuss marks",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which group is most useful and most avoided?",
                    "choices": [
                        "Teachers",
                        "People behind you",
                        "People at exactly your level",
                        "People a year ahead, who have just done what you are about to",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Choosing Your Room",
        "description": "Who you spend time with decides more than motivation does.",
        "lessons": [
            {
                "title": "You Become the Average",
                "description": "The effect of the people around you.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The effect is real

Behaviour, standards and ambition are substantially social. People in a group
converge — on how much work is normal, on what is funny, on what is worth
caring about, on what is embarrassing.

That is not weakness. It is how humans work, and the useful response is to
choose the group deliberately rather than pretending to be immune.

## What a group sets

- How much effort is normal.
- Whether caring is acceptable (STU-103).
- What you talk about.
- What you do with free time.
- Whether problems get mentioned or hidden.
- What you think is possible.

That last one is the biggest. People in ambitious groups attempt things that
genuinely do not occur to people in other groups.

## The honest audit

- Do I work more or less around these people?
- Can I say I am interested in something?
- Do they do things, or only talk?
- Would I tell them if something was wrong?
- Do I like who I am around them?

Those five questions answered honestly tell you most of what you need.

## You do not have to leave your friends

The usual misreading. This is not about abandoning people.

- You can have several groups.
- You can keep friends and add others.
- You can be close to somebody whose standards differ from yours.

What you cannot do is spend all your time in one room and expect to be
unaffected by it.

## Adding a room

- A club, in or out of school.
- An older year group.
- Something online, with the usual safety rules.
- A team, a society, a class you chose.
- One person who is good at your thing.

One additional group changes the average substantially, and it is far easier
than changing the one you have.
""",
            },
            {
                "title": "Pressure in Both Directions",
                "description": "Resisting the downward kind, using the upward kind.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## It is not only about substances

Peer pressure is usually taught as refusing drink and drugs (STU-109). The
daily version is quieter:

- Not answering a question you knew.
- Pretending not to have revised.
- Laughing at something you did not find funny.
- Not sitting with somebody.
- Dropping a subject because of who takes it.
- Agreeing with a view you do not hold.

Each is small. Collectively they are how people end up somewhere they did not
choose.

## Resisting it

- **Decide in advance.** A position decided calmly is executable under
  pressure; a judgement call is not.
- **A short answer, repeated.** "Nah, I'm alright." It does not need a
  reason, and a reason gives them something to argue with.
- **Do not explain at length.**
- **Change the subject.**
- **Be boring about it.** The least interesting response ends it fastest.

## The one friend effect

The most useful finding here: it is dramatically easier to hold a position if
one other person holds it with you.

Find the one person who also does not want to, and you have both stopped
being the only one.

## Using upward pressure

The same mechanism, pointed the other way:

- Tell somebody what you intend to do. The expectation does real work.
- Work in the same room as somebody who is working.
- Join the group where the standard is high.
- Let somebody ahead of you set your sense of normal.

## Being the pressure

You are part of somebody's environment too:

- Do not mock somebody for trying.
- Say well done.
- Share what you know.
- Include the person who is on their own.
- Be the one person who holds a position, so somebody else can.

That last one costs little and occasionally matters enormously.
""",
            },
            {
                "title": "Collaboration",
                "description": "Working with people, which beats working against them.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Why it works

- You learn faster by explaining things.
- Other people have the bits you are missing.
- It makes work happen that would not have happened alone.
- It is how almost all real work is done after school.

## How to study with people well

- **Agree what the session is for** before it starts.
- **Work silently in parallel**, then discuss. Most "group study" is
  conversation with books open.
- **Teach each other.** Explaining a topic is the fastest way to find the
  holes in your understanding.
- **Test each other**, which is substantially more effective than
  re-reading.
- **Keep it to people who will actually work.**
- **Set a finish time.**

## Group projects

Where most people learn to hate collaboration.

- **Agree who does what, in writing**, at the start.
- **Agree deadlines before the final one.**
- **Do your part early**, which gives you standing.
- **Raise a problem early**, with the person, before escalating.
- **Do not silently do everybody's work** — it feels noble and it teaches
  everybody the wrong thing, including you.

If somebody genuinely will not contribute, tell the teacher **early and
factually**, not as a complaint at the end.

## Asking for help from peers

- Be specific.
- Have tried first (STU-102).
- Offer something back.
- Say thank you.

## Sharing

The question people worry about: does helping somebody cost me?

Almost never. Marks are rarely zero-sum in a way that matters, the reputation
is worth more than the marginal advantage, and the person you helped at
fifteen is in your network at thirty (STU-202).

The exception is obvious: sharing work to be copied is cheating, it helps
nobody learn anything, and it carries real consequences for both of you.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Audit the Room",
            "description": (
                "Submit:\n"
                "1. The five audit questions answered honestly for your main group.\n"
                "2. Six things your environment currently sets for you.\n"
                "3. One room you are adding, named, with what you did about it.\n"
                "4. Five examples of quiet downward pressure you have felt.\n"
                "5. Your short refusal line, and two occasions you used it.\n"
                "6. The one-friend effect: who holds a position with you, or who you could "
                "ask.\n"
                "7. Three ways you are using upward pressure deliberately.\n"
                "8. Three things you did this month that made you good pressure for "
                "somebody else.\n"
                "9. One study session run properly, with what you agreed and what you did.\n"
                "10. One group project handled with the five rules, or how you would.\n\n"
                "Graded on the honesty of part 1 and whether part 3 names something real."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Choosing Your Room",
            "description": "Four questions on environment, pressure and collaboration.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does a group set that the course calls the biggest?",
                    "choices": [
                        "What you think is possible",
                        "How much effort is normal",
                        "What you talk about",
                        "Whether problems get mentioned",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What makes holding a position dramatically easier?",
                    "choices": [
                        "Having a good reason prepared",
                        "One other person holding it with you",
                        "Deciding in advance",
                        "Changing the subject quickly",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is wrong with silently doing everybody's work in a group project?",
                    "choices": [
                        "It takes too long",
                        "The teacher will notice",
                        "It teaches everybody the wrong thing, including you",
                        "It lowers the overall mark",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the exception to sharing freely?",
                    "choices": [
                        "Sharing with people in a different class",
                        "Sharing notes before an assessment",
                        "Sharing resources you paid for",
                        "Sharing work to be copied, which is cheating",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Ambition Without Burning Out",
        "description": "Sustaining it, which is where high achievers fail.",
        "lessons": [
            {
                "title": "The Cost of Running Hot",
                "description": "What happens to people who never stop.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The pattern

Capable student, high expectations, every opportunity taken, no spare time,
and a growing sense that stopping is not allowed.

It works for a while. Then sleep goes, enjoyment goes, performance drops
despite more hours, and everybody assumes the answer is to try harder.

## The signs

- Exhausted regardless of rest.
- Nothing is enjoyable, including things that used to be.
- Ordinary work feels unusually hard.
- Irritable, withdrawn.
- Getting ill repeatedly.
- Dreading things you chose.
- Working more and producing less.

Several of those together for more than two weeks is a signal, not a phase.

## Why high achievers are vulnerable

- Saying no feels like failing.
- Every opportunity looks necessary.
- Identity is attached to achievement, so slowing down feels like becoming
  less.
- The environment rewards visible overcommitment.

## What actually helps

- **Sleep.** Eight to ten hours. The largest single input and the first
  thing sacrificed (STU-101).
- **Take something out.** One commitment, for a month.
- **One genuinely empty block a week.**
- **Something you do that is not evaluated.**
- **Friends who do not care about any of it.**
- **Telling somebody.**

## The thing to understand

Capacity is not infinite and it is not a character test. Nobody is impressed
by somebody who ran themselves into the ground, and the people who do well
over ten years are the ones who worked sustainably rather than maximally.

## When it is more than tiredness

If low mood, loss of interest, or sleep problems persist beyond a couple of
weeks — or if you have thoughts of harming yourself — talk to somebody
**today**: a parent, a teacher, a school counsellor, a physician, or a crisis
line. These things are common and treatable, and waiting is the only part
that is genuinely costly.
""",
            },
            {
                "title": "Choosing What Not to Do",
                "description": "The decision that makes everything else possible.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## You cannot do everything

The maths is simple and people ignore it: there are a fixed number of hours,
and every yes is a no to something else that is usually invisible.

## The cost of saying yes to everything

- Everything done to a mediocre standard.
- Nothing done to a high one.
- No depth anywhere (STU-103).
- No recovery.
- A reputation for being unreliable, because you cannot deliver it all.

## How to choose

- **What am I actually trying to be good at?** Two or three things, not
  nine.
- **What does this cost**, in hours, including travel and preparation?
- **What comes out** if this goes in?
- **Would I still want this in six months**, or do I want to have been
  asked?
- **Am I doing this because it looks good on an application?** Sometimes a
  legitimate reason and frequently a bad one — admissions readers prefer
  depth in a few things to a list of nine.

## Saying no

- **Quickly.** A fast no is a kindness.
- **Clearly.** A vague no is heard as a maybe.
- **Briefly.** One sentence of reason, not a paragraph.
- **Without excessive apology.**

> *"I can't take that on this term — I'd do it badly. Ask me again in
> April?"*

## Quitting something

Harder, and sometimes right.

- Finish the commitment you made where you reasonably can.
- Tell the person directly, early, not by disappearing.
- Say it plainly: *"I've taken on too much and I'm going to stop at the end
  of term."*
- Do not quit everything in the same week, which is usually exhaustion
  talking rather than a decision.

## The permission

You are allowed to do fewer things. Nobody good is impressed by a list of
nine commitments, and depth in two beats presence in nine for essentially
every purpose you care about.
""",
            },
            {
                "title": "Keeping It Going",
                "description": "Ambition that lasts, which is the only kind that matters.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The timescale

Almost nothing worth having is achieved in a term. The things that
distinguish people at twenty-five were built over years, by people who were
not obviously working harder on any given day.

Which makes sustainability the actual skill, not intensity.

## What sustains

**A rhythm rather than sprints.** Three hard weeks and a lighter fourth,
repeatedly, beats continuous maximum effort.

**Sleep, protected** (STU-101).

**Something that is not achievement** — a friendship, a hobby, a thing you
are bad at and enjoy.

**Progress you can see.** Keep a record; the middle of anything long feels
like standing still.

**People.** Working alone for years is much harder than working alongside
somebody.

**Interest.** The strongest predictor of still being at something in three
years is whether you enjoy it (STU-103).

## The low period

Every long project has one — usually a few months in, where it is no longer
new and not yet good.

- It is normal and it is not a signal to stop.
- Reduce rather than quit.
- Change the task, not the subject.
- Talk to somebody doing the same thing.
- Look at where you were six months ago.

## Reviewing it

Once a term, twenty minutes:

- What am I actually trying to be good at?
- Is this term's effort going there?
- What should come out?
- Am I enjoying any of it?
- How am I sleeping?

## The summary

1. Compare yourself to yourself; the rest misleads.
2. Imposter feelings are near-universal and not evidence.
3. Want to beat people at their best — and share what you know.
4. Choose your rooms; you become the average.
5. Decide refusals in advance, and keep them short.
6. Depth in two things beats presence in nine.
7. Sustainable beats maximal, over every timescale that matters.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Cut Something",
            "description": (
                "Submit:\n"
                "1. The seven burnout signs, with an honest assessment of yourself and how "
                "long anything has been present.\n"
                "2. Your current commitments, listed, with the real weekly hours of each "
                "including travel.\n"
                "3. Your sleep average over two weeks against the eight-to-ten target.\n"
                "4. The two or three things you are actually trying to be good at.\n"
                "5. Which commitments do not serve those, and what you are cutting.\n"
                "6. One thing declined this term, with the exact words you used.\n"
                "7. One thing quit or wound down properly, with how you told them.\n"
                "8. Your rhythm: where the lighter weeks are in the next term.\n"
                "9. Your not-achievement thing, named.\n"
                "10. The five review questions, answered, with your next review date.\n"
                "11. Who you would tell if several burnout signs persisted, named.\n\n"
                "Graded on the honesty of parts 1 and 3, and on whether part 5 cuts "
                "something real."
            ),
            "total_marks": 175,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Ambition Without Burning Out",
            "description": "Four questions on overload, choosing and sustaining.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why are high achievers particularly vulnerable to burning out?",
                    "choices": [
                        "Saying no feels like failing, and identity is attached to achievement",
                        "They are given more work by teachers",
                        "They sleep less by nature",
                        "They choose harder subjects",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What do admissions readers prefer?",
                    "choices": [
                        "A long list of commitments",
                        "Depth in a few things over a list of nine",
                        "Leadership roles above all else",
                        "Breadth across unrelated areas",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the actual skill over long timescales?",
                    "choices": [
                        "Intensity",
                        "Choosing the right goal early",
                        "Sustainability",
                        "Working alone without distraction",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should you do in the low period of a long project?",
                    "choices": [
                        "Increase the hours temporarily",
                        "Switch to a different subject",
                        "Wait for motivation to return",
                        "Reduce rather than quit, and change the task rather than the subject",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
