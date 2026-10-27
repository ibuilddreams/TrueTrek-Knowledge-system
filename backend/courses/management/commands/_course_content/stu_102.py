"""STU-102: Being Independent and Responsible. Cool Nerds Pathway, Level 1.

Short shape: three modules of three Markdown lessons, an assignment and a quiz
per module, no handout. Reader is the **student**.
"""

MODULES = [
    {
        "title": "Owning Your Own Week",
        "description": "Taking over the things somebody else currently does for you.",
        "lessons": [
            {
                "title": "The Handover List",
                "description": "What you should already be running yourself.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The test

If you left home next month, what would stop working?

Most people's honest answer is a long list: waking up, washing clothes,
remembering appointments, buying food, replying to adults, knowing when
things are due.

That list is your syllabus.

## The handover

Take these over, one at a time, with a date:

- **Waking yourself up.** Your own alarm, across the room, no second call.
- **Your own laundry.** All of it.
- **Your own schedule.** You know what is due without being told.
- **Your own messages** to teachers, coaches and adults (STU-202).
- **Your own appointments** — booking them, attending them.
- **Your own food**, at least three things you can cook.
- **Your own money**, at whatever scale you have.
- **Your own kit, bag and equipment.**

## Do it properly

- **Name the thing** out loud to whoever currently does it.
- **Learn it once**, carefully.
- **Then own it**, including the week you do it badly.
- **Do not hand it back** the first time it goes wrong.

## Let it fail

A forgotten deadline at fifteen costs a bad mark. The same habit at
twenty-two costs a job.

Failures now are cheap, and they are the only way the lesson lands. A parent
who rescues you every time is not helping, and it is worth telling them so.

## The point

Not independence for its own sake. The point is that in a few years nobody
will be checking, and the people who struggle most are not the least able —
they are the ones who never ran anything themselves.
""",
            },
            {
                "title": "Following Through",
                "description": "Doing what you said, which is rarer than it sounds.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The rarest thing

Reliability is rarer than talent. Adults say this constantly and teenagers
assume it is a lecture; it is an observation about how few people actually do
what they said they would.

## What it means in practice

- You arrive when you said.
- You reply within a day.
- You finish things.
- If you cannot, you say so **early**, not afterwards.

That is the whole of it, and most people fail at the fourth.

## Saying so early

The single most useful habit here. If something will be late or undone:

> *"I'm not going to have this finished by Thursday — that's on me, I
> underestimated it. I can get it to you Monday, or a shorter version
> Thursday. Which helps more?"*

Early, direct, owned, with a fix. People forgive that. They do not forgive
silence followed by a missed deadline.

## Stop over-committing

Most unreliability is not laziness. It is saying yes to too much because
saying no is uncomfortable.

- Check the week before agreeing.
- "Let me check and come back to you" is a complete answer.
- A fast no is a kindness; it lets somebody ask another person.

## Small promises count

Returning something borrowed. Sending the thing you said you would. Being
where you said at the time you said.

Nobody tracks these consciously and everybody notices the pattern, and your
reputation is built out of them long before anything important is at stake.
""",
            },
            {
                "title": "Solving It Yourself First",
                "description": "The attempt that comes before asking.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The habit adults notice

Not never asking for help. Having tried first.

> *"I can't open this file. I've tried a different browser and restarting,
> and it still fails — do you know another way?"*

versus

> *"It's not working."*

Same problem, completely different impression, and the first usually gets a
better answer.

## The five-minute rule

Before asking anybody anything:

1. Read it again.
2. Search for it.
3. Try the obvious thing.
4. Try one other thing.
5. Write down exactly what you tried and what happened.

Five minutes. You will solve roughly half of them, and the half you do not
you can now describe properly.

## When to ask immediately

Do not apply this to everything. Ask straight away when:

- It is urgent and somebody is waiting.
- It is unsafe.
- You genuinely do not know where to start.
- It concerns your health, your safety or money.
- Somebody has explicitly told you to ask.

Wasting an hour on something a thirty-second question would fix is not
independence; it is stubbornness.

## How to ask well

- Say what you are trying to do.
- Say what you tried.
- Say what happened.
- Ask one specific question.

## Proactive, not reactive

The advanced version: notice the problem before it becomes one. The deadline
in two weeks, the form nobody has filled in, the thing that will clash.

Flagging something early is the most adult thing on this list, and almost
nobody your age does it.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Take Three Things Over",
            "description": (
                "Submit:\n"
                "1. Your honest answer to what would stop working if you left home next "
                "month.\n"
                "2. The handover list, with each item marked as yours, shared, or somebody "
                "else's.\n"
                "3. Three things you are taking over this month, with dates and who you told.\n"
                "4. Two weeks of running them, logged, including the week something went "
                "wrong.\n"
                "5. One failure you did not hand back, and what you learned.\n"
                "6. A message you sent saying something would be late — early, direct, "
                "owned, with a fix. Paste it.\n"
                "7. Three things you said yes to that you should have declined, with the "
                "sentence you will use instead.\n"
                "8. The five-minute rule applied to three real problems, with what you "
                "tried and whether you solved it.\n"
                "9. One problem you flagged before it became one.\n\n"
                "Graded on whether the two-week log is real and whether part 6 is an actual "
                "message."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Owning Your Week",
            "description": "Four questions on handover, reliability and problem-solving.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Where do most people fail at reliability?",
                    "choices": [
                        "Saying so early when something will be late or undone",
                        "Arriving on time",
                        "Replying to messages",
                        "Finishing tasks they started",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What causes most unreliability?",
                    "choices": [
                        "Poor memory",
                        "Over-committing, because saying no is uncomfortable",
                        "Lack of a calendar",
                        "Too many deadlines at once",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the five-minute rule produce?",
                    "choices": [
                        "A faster answer from an adult",
                        "A written record of the problem",
                        "You solve roughly half of them, and can describe the rest properly",
                        "Fewer interruptions for other people",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course call the most adult habit on the list?",
                    "choices": [
                        "Doing your own laundry",
                        "Replying within a day",
                        "Asking a specific question",
                        "Flagging a problem before it becomes one",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Discipline Without Motivation",
        "description": "Doing things when you do not feel like it.",
        "lessons": [
            {
                "title": "Motivation Is Not the Input",
                "description": "Why waiting to feel like it fails.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The wrong model

Most people believe: feel motivated → do the thing.

In practice it runs the other way. **Action produces motivation far more
reliably than motivation produces action.** You start reluctantly, five
minutes in you are engaged, and the feeling arrives after the work rather
than before it.

Which means waiting to feel like it is waiting for something that mostly
comes afterwards.

## What replaces it

**Systems.** A thing that happens at a time, whether or not you feel like
it.

- A fixed time, not "later".
- A fixed place.
- A specific first action.
- No decision required in the moment.

A decision made every day is a decision you will eventually lose. A decision
made once, and then scheduled, is not.

## Lower the bar to start

STU-101's technique: make the next action absurdly small.

Not "revise chemistry" but "open the book at page 40". Not "go for a run" but
"put the trainers on". You will almost always continue, and if you do not,
you still started.

## Remove friction

Everything you have to decide or find before starting is a reason not to.

- Set it up the night before.
- Phone in another room.
- One tab, one book, one task.

## Expect to not want to

The feeling of not wanting to do something is not information about whether
to do it. It is just a feeling, and it is present for almost everybody
almost every time.

People who are disciplined are not people who feel like it more often. They
are people who stopped treating the feeling as the deciding factor.
""",
            },
            {
                "title": "Habits That Hold",
                "description": "Building something that survives a bad week.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## Start smaller than feels serious

The commonest failure: deciding to study two hours a day from Monday, doing
it for four days, and stopping.

Start at a size you could do on your worst day. Fifteen minutes. One page.
One set. Then add.

A habit that survives a bad week is worth more than an impressive one that
does not.

## Anchor it

Attach the new thing to something that already happens:

- After I get home, I do twenty minutes before anything else.
- After dinner, I pack my bag for tomorrow.
- Before I open my phone in the morning, I make the bed.

The existing habit is the trigger, which removes the remembering.

## Track it simply

A row of ticks on a page or a note on a phone. Not an elaborate system —
elaborate tracking is itself procrastination (STU-101).

What tracking does is make the streak visible, and a visible streak is
genuinely motivating in a way intentions are not.

## Never miss twice

The single most useful rule.

Missing once is an accident. Missing twice is the start of stopping. So the
rule is not perfection — it is that the day after a miss is non-negotiable.

That removes the all-or-nothing collapse where one bad day ends a month of
work.

## Make it obvious and easy

- Put the book on the desk, open.
- Put the kit by the door.
- Delete the app that eats the time.
- Charge your phone outside your bedroom.

Environment beats willpower, reliably. People with good habits mostly have
arrangements that make the good thing easy and the bad thing annoying.

## Give it eight weeks

Habits take longer to set than people expect — commonly a couple of months,
not three weeks. The first fortnight is the hardest and it is not
representative.
""",
            },
            {
                "title": "Delayed Gratification",
                "description": "Trading now for later, deliberately.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The actual skill

Not never enjoying anything. Being able to choose the thing that pays later
over the thing that pays now, **when you have decided it matters.**

Almost everything worth having — a grade, a skill, fitness, money, a craft —
is paid for in advance and collected much later.

## Why it is hard

The reward now is certain, immediate and vivid. The reward later is
uncertain, distant and abstract. Your brain weights the first far more
heavily, and that is normal rather than a character flaw.

## What helps

**Make the later thing concrete.** Not "do well in exams" but a specific
result, a specific place, a specific thing you want.

**Make the now-cost smaller.** Twenty minutes is easier to trade than three
hours.

**Remove the temptation rather than resisting it.** Willpower is unreliable;
a phone in another room is not.

**Pay yourself something now.** A small, honest reward after the work —
after, not instead.

**Notice the trade out loud.** "I'm choosing this over that" is a different
mental act from drifting into the easier thing.

## The cost of always choosing now

It compounds, quietly. A year of choosing the comfortable option does not
feel like anything on any given day, and at the end of it you are a year
behind people who were not obviously working harder.

## And the opposite failure

Some people over-correct: never resting, never enjoying anything, treating
every hour as owed to the future.

That does not last and it is not the goal. The goal is choosing
deliberately, which sometimes means choosing the thing you want now and
knowing that you did.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Build One Habit",
            "description": (
                "Submit:\n"
                "1. The wrong model and the right one, in your own words.\n"
                "2. One habit you are building: the time, the place, the specific first "
                "action, and the existing habit it is anchored to.\n"
                "3. The size you started at, and why it is small enough for your worst day.\n"
                "4. Four weeks of tracking, submitted as the actual record.\n"
                "5. Every miss, and whether you applied never-miss-twice.\n"
                "6. Three friction changes you made to your environment.\n"
                "7. A habit you tried before and lost, with an honest diagnosis of why.\n"
                "8. One concrete later-reward you are working toward, described "
                "specifically.\n"
                "9. Three trades you made deliberately this month, with what you chose and "
                "what you gave up.\n\n"
                "Graded on whether the four-week record is real, including the misses."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Discipline",
            "description": "Four questions on motivation, habits and delayed gratification.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which way round does it actually work?",
                    "choices": [
                        "Action produces motivation more reliably than motivation produces action",
                        "Motivation must come first for the work to be any good",
                        "Both arrive together once a habit is set",
                        "Neither matters if the system is strong enough",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the never-miss-twice rule for?",
                    "choices": [
                        "Keeping a perfect streak",
                        "Removing the all-or-nothing collapse where one bad day ends a month of work",
                        "Tracking progress accurately",
                        "Building up to a larger habit faster",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What beats willpower reliably?",
                    "choices": [
                        "A stronger reason",
                        "A tracking system",
                        "Environment — making the good thing easy and the bad thing annoying",
                        "Accountability to a friend",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the over-correction the course warns about?",
                    "choices": [
                        "Starting a habit too small",
                        "Tracking too elaborately",
                        "Choosing the immediate reward too often",
                        "Never resting, and treating every hour as owed to the future",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Accountability",
        "description": "Owning what is yours, which changes how adults treat you.",
        "lessons": [
            {
                "title": "The Two Seconds After",
                "description": "What you do when something is your fault.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The moment

Something has gone wrong and it was partly or wholly you. There is a gap of
about two seconds, and what you do in it tells everybody watching who you
are.

## The three bad options

**Deny.** "That wasn't me." Occasionally works, permanently costs your
credibility when it does not.

**Deflect.** "Yes, but she didn't…" The word **but** deletes everything
before it.

**Minimise.** "It's not a big deal." It might not be, and it is not your call
to make about somebody else's problem.

## What to do instead

Four parts, about ten seconds:

1. **Say it plainly.** "That was me. I got it wrong."
2. **No 'but'.** Context can come later if anybody asks.
3. **Say what you will do.** "I'll redo it tonight."
4. **Then do it.** The only part anybody remembers.

## Why it works

Almost nobody does it, and it removes the thing people actually dislike —
not the mistake, but the twenty minutes of arguing afterwards.

An adult who hears "that was my fault, I'll fix it" has nothing left to say
and no reason to distrust the next thing you tell them.

## Not self-flagellation

The other failure: apologising enormously and repeatedly until everybody has
to manage your distress.

That is not accountability; it turns your mistake into an event about your
feelings. Say it, fix it, move on.

## When it is not yours

Accountability does not mean accepting blame for everything. Taking
responsibility for things you did not do is an unreliable signal and it stops
the real cause being examined.

> *"I don't think that one was mine, but I'll check and come back to you."*

Calm, not defensive, and it leaves room to be wrong.
""",
            },
            {
                "title": "Excuses",
                "description": "The difference between a reason and an excuse.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## The distinction

A **reason** explains what happened and does not transfer responsibility.

An **excuse** uses what happened to move the responsibility somewhere else.

> *"I didn't start early enough and then I was ill, so it is late. That is on
> me."* — a reason.
>
> *"I was ill, so it is late."* — an excuse, if the illness was two days and
> you had three weeks.

Same facts, different handling.

## The common ones

- I was busy.
- Nobody told me.
- The teacher explained it badly.
- My internet was down.
- I didn't have time.
- Everybody else did too.

Some of those are occasionally true. All of them are mostly used to avoid
saying "I did not get it done".

## Why they cost you

- Everybody can tell.
- They stop you fixing the actual cause.
- They make you a person other people route around.
- And they are habit-forming: a person who explains every failure soon
  believes the explanations.

## The honest version

Separate it explicitly:

> *"What happened was X. What I could have controlled was Y. Next time I'll
> do Z."*

Three sentences. It is accurate, it does not pretend bad luck does not exist,
and it keeps your own part visible.

## Things that genuinely are not your fault

They exist: illness, family circumstances, a teacher who did explain it
badly, things outside your control entirely.

Say so plainly, once, without a tone of grievance — and then focus on what
you are going to do, because that is the only part available to you.

## The test

Before explaining anything, ask: **am I describing what happened, or am I
trying to get out of something?**

You will know, and so will whoever is listening.
""",
            },
            {
                "title": "Being Told Things You Do Not Want to Hear",
                "description": "Taking criticism, which is a skill.",
                "type": "TEXT",
                "minutes": 10,
                "body": """## Why it matters

The people who improve fastest are not the most able. They are the ones who
can be told something unwelcome and act on it without defending.

That is rare at every age, and it is visible immediately.

## In the moment

- **Listen to the end.** Do not interrupt.
- **Do not defend.** Even if you have a good answer.
- **Ask for specifics.** "Can you give me an example?" — useful, and it
  signals you intend to do something.
- **Say thank you.** Genuinely. Most people avoid giving criticism, and the
  ones who bother are usually trying to help.
- **Try it immediately** where you can. Visible attempt is what people are
  watching for.

## Afterwards

- Write it down, which stops it blurring into a general bad feeling.
- Decide later whether it was right. You do not have to resolve that in the
  room.
- If it was right, change something specific.
- If it was wrong, you can say so calmly another day.

## Separating the person from the action

STU-107's language, and it matters here: "that essay was unclear" is
information. "I'm stupid" is a claim about a person, and it cannot be acted
on.

When criticism lands, translate it into an action before you let it become a
verdict about you.

## Asking for it

The advanced move, and it is unusual enough to be remembered:

> *"What's the one thing I should work on?"*

Ask a teacher, a coach, somebody whose opinion you respect. Most people will
tell you honestly if asked directly, and almost nobody asks.

## When it is not useful criticism

Some of it is unkind, inaccurate, or about the person rather than the work.

- You can decline it internally.
- You do not have to argue.
- If it is abusive or about who you are rather than what you did, that is
  worth telling an adult about.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Own Three Things",
            "description": (
                "Submit:\n"
                "1. The three bad options, with the one you default to.\n"
                "2. Three occasions this month where something was your fault, with the "
                "exact words you used — as you said them, not as you wish you had.\n"
                "3. One of them rewritten using the four parts.\n"
                "4. One occasion where something was not yours, and how you said so.\n"
                "5. Five excuses you have used, each rewritten as the honest three-sentence "
                "version.\n"
                "6. A piece of criticism you received, what you said in the moment, and what "
                "you did about it afterwards.\n"
                "7. The one-thing question asked of a teacher, coach or mentor, with their "
                "answer recorded.\n"
                "8. What you changed as a result.\n\n"
                "Graded on the honesty of part 2 and on whether part 7 actually happened."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Accountability",
            "description": "Four questions on ownership, excuses and criticism.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does 'but' ruin an admission?",
                    "choices": [
                        "It deletes everything before it",
                        "It makes the sentence too long",
                        "It invites disagreement about facts",
                        "It shifts attention to the outcome",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What distinguishes a reason from an excuse?",
                    "choices": [
                        "Whether it is true",
                        "Whether it transfers responsibility somewhere else",
                        "Whether it is given before or after the deadline",
                        "Whether anybody asked for it",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What should you do first when criticised?",
                    "choices": [
                        "Explain the context",
                        "Ask whether others agree",
                        "Listen to the end without defending",
                        "Decide whether it is fair",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the unusual move almost nobody makes?",
                    "choices": [
                        "Writing feedback down",
                        "Thanking the person",
                        "Trying the correction immediately",
                        "Asking directly: what is the one thing I should work on?",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
