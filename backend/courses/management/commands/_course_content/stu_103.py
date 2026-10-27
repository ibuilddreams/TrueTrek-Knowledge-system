"""STU-103: Being a Nerd is Cool. Cool Nerds Pathway, Level 1. Student-facing.

Three modules of three Markdown lessons, an assignment and a quiz per module,
no handout.
"""

MODULES = [
    {
        "title": "The Too-Cool Trap",
        "description": "Why pretending not to care is the most expensive habit available.",
        "lessons": [
            {
                "title": "Effortless Is a Performance",
                "description": "The pose, and what it costs the people who adopt it.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The pose

Somewhere around thirteen, a rule appears: caring openly about schoolwork is
embarrassing. The acceptable position is doing well **without appearing to
try**.

So people hide revision, claim they did nothing, and act surprised by good
marks.

## Why it is a performance

Because the people at the top of most subjects are working, and most of them
are quietly pretending they are not. The appearance of effortlessness is
manufactured, almost universally, and believing it is real is what makes
other people stop trying.

## What it costs

- **You cannot ask for help**, because asking admits you care.
- **You cannot be a beginner**, which is where all learning happens.
- **You cap yourself** at whatever you can do without visible effort.
- **You cannot be enthusiastic**, which is the main thing that makes anybody
  good at anything.

That last one is the real cost. Enthusiasm is the engine, and the pose
requires switching it off in public.

## Who it stops being an issue for

Almost everybody, eventually. By about twenty the people who were openly
interested in things are visibly ahead, and the pose has quietly been
abandoned by the people who held it.

Which means the whole thing is a temporary social rule that you are being
asked to pay for permanently.

## The move

Be openly interested in one thing, early. Not loudly — just without
apologising for it.

It is uncomfortable for a term and then it is simply who you are, and people
adjust faster than you expect.
""",
            },
            {
                "title": "Intelligence Is Not Fixed",
                "description": "What actually makes somebody good at a subject.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The belief that does the damage

That people are either "good at maths" or not, and you find out which early.

The evidence runs against it. Ability in almost every subject responds
substantially to deliberate work — not infinitely, and far more than people
assume at fifteen.

## Why it feels fixed

Because early differences are visible and the reasons are invisible:

- Somebody was taught it at home.
- Somebody had a better teacher two years ago.
- Somebody is a year older in the same class.
- Somebody practises and does not mention it.

You see the gap and conclude it is permanent. It usually is not.

## What actually produces ability

- **Deliberate practice** at the edge of what you can do, which means mostly
  failing (STU-114).
- **Feedback**, acted on.
- **Time**, in volume.
- **Interest**, which is what makes the time bearable.

None of those is talent, and all of them are available.

## The trap of being told you are clever

Being praised for ability rather than effort makes people **more** afraid of
failing and more likely to avoid hard things, because a failure now threatens
the label.

If you were the clever one at eleven and are struggling now, that is the
mechanism rather than a sign you have run out.

## The practical version

When you are bad at something, the accurate sentence is:

> *"I can't do this yet."*

Not "I'm not a maths person". The first points at work; the second ends the
conversation.
""",
            },
            {
                "title": "Finding Your Thing",
                "description": "Niche interest, which is the real asset.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Breadth is for school; depth is for you

School makes you do ten subjects at a moderate level. That is reasonable and
it is not where anything interesting happens.

Depth in one thing — chosen by you, pursued beyond what anybody set — is what
changes your options, and almost nobody does it.

## How to find it

Not by thinking. By noticing:

- What do you read about when nobody made you?
- What do people ask you about?
- What would you do with a free Saturday?
- What do you still think about afterwards?
- What did you like before you started worrying what people thought?

## Go deeper than the course

Pick one and go past the syllabus:

- Read a real book on it, not a textbook.
- Follow somebody who actually works in it.
- Make something.
- Enter something.
- Find other people doing it, online or locally.
- Ask a teacher what to read next — they will be delighted and they will
  remember it.

## Why depth pays

- It is **distinguishing.** Everybody has grades; almost nobody has a thing.
- It produces evidence — something you made, built, wrote, won (STU-206).
- It teaches you what being genuinely good at something feels like, which
  transfers.
- It is the thing universities and employers actually ask about.

## It does not have to be academic

Code, music, cooking, repair, languages, a game, building things, writing,
a sport you are not expected to be good at. The subject matters far less than
the depth.

## And it can change

Most people's first serious interest is not their last. That is the test
working, not a wasted year.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Pick a Thing and Go Deeper",
            "description": (
                "Submit:\n"
                "1. An honest account of whether you hide effort, and where.\n"
                "2. The four costs of the pose, with which apply to you.\n"
                "3. Something you believe you are 'not a person for', rewritten as a "
                "yet-sentence with the work it would need.\n"
                "4. Your noticing answers to the five questions in Lesson 3.\n"
                "5. The one thing you are going deeper on, named.\n"
                "6. Four weeks of going past the syllabus on it: what you read, made, "
                "entered or found, with dates.\n"
                "7. One teacher asked what to read next, with their answer and whether you "
                "read it.\n"
                "8. What you have to show for it — something made, written or built.\n\n"
                "Graded on whether part 6 is a real four weeks and part 8 exists."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: The Too-Cool Trap",
            "description": "Four questions on effort, ability and depth.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the course say about effortlessness at the top of a subject?",
                    "choices": [
                        "It is manufactured — the people at the top are working and pretending not to",
                        "It is real for a small number of people",
                        "It develops once a subject is mastered",
                        "It is a sign of a well-taught course",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does being praised for ability rather than effort do?",
                    "choices": [
                        "Builds durable confidence",
                        "Makes people more afraid of failing and more likely to avoid hard things",
                        "Has no measurable effect",
                        "Improves performance in familiar subjects only",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the accurate sentence when you are bad at something?",
                    "choices": [
                        "I'm not a maths person",
                        "This isn't my strength",
                        "I can't do this yet",
                        "I'll need a different teacher",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does depth in one thing pay?",
                    "choices": [
                        "It raises your average across subjects",
                        "It is required for most applications",
                        "It is easier than breadth",
                        "Everybody has grades; almost nobody has a thing",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Your Own Standard",
        "description": "Deciding what you care about, independently of the room.",
        "lessons": [
            {
                "title": "Audience of One",
                "description": "Whose opinion you are actually working to.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The question

When you decide how hard to work on something, whose reaction are you
imagining?

For most people at school it is a small group of peers whose opinion will be
irrelevant within four years — and whose actual views are usually far less
harsh than the imagined version.

## The imagined audience

People consistently overestimate how much others notice and judge them. The
room is mostly thinking about itself.

Which means a large amount of self-editing is done for an audience that is
not paying attention.

## Choosing a better one

Pick, deliberately, whose opinion you are working to:

- Somebody who is good at the thing.
- A teacher who tells you the truth.
- Your future self in four years.
- Nobody — your own standard, which is the strongest version.

That choice is available and almost nobody makes it consciously.

## Setting your own standard

- What is good enough **for you**, on this?
- Is it actually finished, or just handed in?
- Would you be happy to show it to somebody who is good at it?

Those three questions produce better work than any amount of marking
criteria, because they are yours.

## The useful side effect

Once your standard is internal, other people's opinions stop being the
mechanism. You can take criticism better, ignore mockery more easily, and
work on something nobody has asked for.

That is most of what people mean by confidence (STU-113).
""",
            },
            {
                "title": "Dealing With the Reaction",
                "description": "What actually happens when you visibly care.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## What you expect

Mockery, exclusion, being called a swot.

## What usually happens

Far less than that. Mostly:

- Nothing.
- Occasional comments, which fade.
- Some people quietly respect it.
- One or two who mind, usually because it reflects on them.

The anticipated version is almost always worse than the real one, which is
worth knowing before you decide not to try.

## When there are comments

- **Do not argue.** It gives it weight.
- **Do not apologise for it** or minimise what you did.
- **Agree lightly**, which ends it. "Yeah, I'm a nerd about it" is almost
  impossible to continue mocking.
- **Change the subject.**

Mockery runs on a reaction. A flat, unbothered response removes the fuel
within a few attempts.

## When it is more than comments

Sustained exclusion, humiliation or anything targeting who you are is
bullying rather than teasing.

- Tell an adult — a parent, a teacher, a pastoral lead.
- Keep a record: dates, what was said, who was there.
- It is not something to absorb, and schools have a duty.

## Find the others

Everywhere has people who are into things. They are frequently not visible in
your immediate group:

- A club, in or out of school.
- An older year.
- Online communities, with the usual safety rules — nothing personal,
  nothing involving money or meeting, and an adult knows.
- A teacher who runs something.

One person who is interested in the same thing changes the experience
entirely, and it is usually available.
""",
            },
            {
                "title": "What It Looks Like Later",
                "description": "The payoff, honestly described.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## It inverts

The social rules of a school are specific to a school. They do not survive
contact with anywhere else.

At university, in a workplace, in anything you choose to do, being obviously
interested in something is an advantage rather than a liability — it is how
you find people, get given things, and become good.

## What carries forward

- **Depth in a thing**, which becomes your subject, your work, or the reason
  somebody hires you.
- **The habit of being a beginner**, which is the only way to keep learning
  after school stops teaching you.
- **Enthusiasm**, which is genuinely rare and is noticed by every adult.
- **Evidence**: things you made, entered, built or won (STU-206).

## What does not

Almost everything the pose was protecting. Nobody at twenty-five is
impressed that somebody did not revise.

## The uncomfortable version

Some of the people who are most committed to the pose now will be behind
later, and they will not be able to point at the moment it happened.

That is not a satisfying thing to feel superior about — it is a reason to
start now rather than wait for the room to permit it.

## Start before it is safe

The point of the course: the social permission arrives later than the useful
time to begin.

Pick your thing, work at it openly, find other people doing it, and accept a
term of mild awkwardness in exchange for a decade of being good at
something.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Your Standard",
            "description": (
                "Submit:\n"
                "1. Whose reaction you currently imagine when deciding how hard to work.\n"
                "2. Who you are choosing instead, and why.\n"
                "3. The three standard questions applied to one real piece of work, with "
                "what you changed.\n"
                "4. What you expected to happen when you visibly cared, and what actually "
                "happened.\n"
                "5. Your flat response to a comment, in your own words, and one time you "
                "used it.\n"
                "6. Where the line to bullying is, and who you would tell.\n"
                "7. Other people doing your thing: a club, an older year, a community, a "
                "teacher — named, with what you did about it.\n"
                "8. One paragraph on what you want to be good at by twenty.\n\n"
                "Graded on the honesty of part 4 and whether part 7 names something real."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Your Own Standard",
            "description": "Four questions on audience, reactions and the long view.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is true of the audience people self-edit for?",
                    "choices": [
                        "It is mostly thinking about itself, and notices far less than people assume",
                        "It judges more harshly than people expect",
                        "It is consistent across year groups",
                        "It becomes more important after school",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the strongest version of choosing an audience?",
                    "choices": [
                        "Somebody who is good at the thing",
                        "Nobody — your own standard",
                        "A teacher who tells you the truth",
                        "Your future self",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What removes the fuel from mockery?",
                    "choices": [
                        "Arguing back once",
                        "Explaining why the subject matters",
                        "A flat, unbothered response — or agreeing lightly",
                        "Avoiding the people involved",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say about social permission to be interested?",
                    "choices": [
                        "It arrives at university for everybody",
                        "It depends on the school",
                        "It is never granted",
                        "It arrives later than the useful time to begin",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Curiosity as a System",
        "description": "Turning interest into something that accumulates.",
        "lessons": [
            {
                "title": "Learning Things Nobody Set",
                "description": "Self-directed study, which is the actual skill.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The difference

School learning: somebody chooses the topic, the order, the pace and the
test.

Real learning: you choose all four, and nobody checks. Every useful thing you
learn after eighteen works this way, and most people have never practised it.

## How to actually learn something alone

**Pick something specific.** Not "learn programming" but "build a small
program that does X".

**Find one good source**, not twelve. A book, a course, a person. Switching
sources constantly is procrastination.

**Do it, badly, early.** Make the thing before you feel ready. Reading about
something is not learning it.

**Get feedback.** From a person, a test, or reality — does the program run,
does the sauce taste right, is the essay any good?

**Repeat the hard part**, rather than re-doing the part you can already do.

**Keep going past the interesting beginning**, which is where almost everybody
stops.

## The plateau

Every subject has a point, usually a few weeks in, where progress stops being
visible and it stops being fun.

That is normal, it is where most people quit, and getting through two or
three of them is what separates people who are good at things from people who
have started many.

## Track it

A short log: date, what you did, what you found hard. It takes a minute and
it makes progress visible during the plateau, which is exactly when you need
it.

## Teach it

The fastest way to find out whether you understand something is to explain it
to somebody. Gaps become obvious immediately.
""",
            },
            {
                "title": "Asking Questions",
                "description": "The cheapest learning tool, and the most under-used.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Why people stop asking

Around eleven, asking questions in class starts to feel risky — it reveals
that you did not know.

So people stop, and spend years not understanding things they could have
fixed in thirty seconds.

## The reframe

A question reveals that you are paying attention and that you care enough to
want it right. Teachers are, almost universally, pleased to be asked.

The person who looks worst is not the one who asks; it is the one who nodded
and understood nothing.

## How to ask well

- **Be specific.** Not "I don't get it" but "I don't see why step three
  follows from step two".
- **Say what you do understand** first. It narrows the answer.
- **Ask afterwards** if asking in front of the class is too much — that is a
  legitimate route and it still works.
- **Write it down** during the lesson so you do not lose it.

## Questions worth asking adults

Beyond the subject:

- What should I read next?
- What do most people get wrong about this?
- How did you get into this?
- What would you do if you were me?

Those four get genuine answers from almost anybody, and most students never
ask them.

## Asking the internet

Fine, with judgement:

- Prefer a primary source to a summary.
- Check who wrote it and what they gain.
- Be careful with AI answers: useful for explanation, unreliable for facts,
  and worthless for anything you have to be certain about. Check it against
  something real.

## The habit

One question a day, out loud, to somebody. It is a small thing and it
compounds into knowing substantially more than people who did not.
""",
            },
            {
                "title": "Building Something",
                "description": "The output that turns interest into evidence.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Consuming is not enough

Reading, watching and listening feel productive and produce nothing you can
point at.

The people who get somewhere with an interest **make things** — badly at
first, and consistently.

## What counts

- Writing something.
- Building or coding something.
- Making or repairing something.
- Running an event, a club, a group.
- Recording, performing, or competing.
- Teaching somebody else.
- A project with a beginning and an end.

## Why it matters

**It forces real understanding.** You cannot fake your way through making a
thing work.

**It produces evidence.** STU-206's point: an application is far stronger
with something concrete in it than with a list of interests.

**It is finishable**, which is a skill in itself.

**It attracts people.** Somebody who has made something gets talked to by
people who do that thing.

## Make it small and finish it

The commonest failure is starting something enormous and abandoning it.

- Something you could finish in a month.
- Finished badly beats unfinished well.
- Then do another, better one.

Three finished small things in a year beats one ambitious unfinished one,
every time.

## Show it

- Put it somewhere — a page, a profile, a folder you can send.
- Tell a teacher.
- Enter it into something.
- Keep a record of what you made and when (STU-206).

## And keep the old ones

A year of visible improvement is itself worth having, and you will not be
able to reconstruct it later.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Learn and Build",
            "description": (
                "Submit:\n"
                "1. One thing you are learning that nobody set, stated specifically.\n"
                "2. Your single source, and why you chose it.\n"
                "3. A four-week log: date, what you did, what was hard.\n"
                "4. The plateau: where it stopped being fun, and what you did.\n"
                "5. An explanation of something you learned, written for somebody who does "
                "not know it.\n"
                "6. Ten questions you asked this month, with who you asked and what you "
                "learned.\n"
                "7. The four adult questions, asked of at least one person, with their "
                "answers.\n"
                "8. One finished thing, made this term. Submit it.\n"
                "9. Where it lives, and who you showed it to.\n\n"
                "Graded on whether part 8 is finished rather than planned."
            ),
            "total_marks": 175,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Curiosity as a System",
            "description": "Four questions on self-directed learning, questions and output.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What separates people who are good at things from people who have started many?",
                    "choices": [
                        "Getting through two or three plateaus",
                        "Choosing the right subject early",
                        "Using better sources",
                        "Studying more hours",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Who looks worst in a lesson?",
                    "choices": [
                        "The person who asks a basic question",
                        "The person who nodded and understood nothing",
                        "The person who asks afterwards rather than in class",
                        "The person who asks too many questions",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course say about AI answers?",
                    "choices": [
                        "Avoid them entirely for schoolwork",
                        "They are reliable for facts but weak on explanation",
                        "Useful for explanation, unreliable for facts — check against something real",
                        "They are equivalent to a primary source",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What beats one ambitious unfinished project?",
                    "choices": [
                        "A detailed plan for it",
                        "Collaborating with somebody on it",
                        "Studying the subject more deeply first",
                        "Three finished small things in a year",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
