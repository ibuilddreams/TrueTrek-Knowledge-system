"""BM-102: Brand Identity & Core Values.

Level 1: Digital Architecture. Written against the course's focus (discovering
what the athlete represents beyond their sport) and its core competencies:
defining personal pillars such as family, academics, community service or
faith, creating a personal mission statement, and ensuring digital content
aligns with those values.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).
"""

MODULES = [
    {
        "title": "Finding Your Pillars",
        "description": (
            "Identifying the three or four things you actually stand for, with evidence, "
            "rather than the ones that sound good."
        ),
        "lessons": [
            {
                "title": "Why Everyone's Brand Looks the Same",
                "description": "The problem with an athlete brand built only on the sport.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The identical feed

Open the accounts of twenty athletes in the same sport and age group. You will
see highlights, gym photos, a quote about hard work, a game-day post, and
nothing to distinguish any of them from the others.

That is not a criticism of the athletes. It is what happens when a presence is
built from the only thing everybody shares — the sport.

## Why it matters commercially

A business deciding whether to work with you is looking for something to
attach itself to. "Athlete who trains hard" is not something; every athlete
trains hard. BM-301 makes this concrete: the pitch works when there is a reason
beyond reach.

## Why it matters personally

The CEO-201 and MT-101 argument, from a branding angle: a presence built only
on performance moves with performance. A bad season empties it.

A presence built on two or three things that are true about you regardless of
results keeps working through a bad season, an injury, and the end of your
career.

## What a pillar is

A subject you return to, that is genuinely yours, and that you could keep
producing about for a year.

Common ones for athletes:

- **The craft** — the work itself, the unglamorous parts, technique, learning.
- **Family** — including the people who drive you at six in the morning.
- **Academics** — what you study and why.
- **Faith**, where it is real.
- **Community** — your town, a cause you actually serve, younger athletes you
  coach.
- **Something specific to you** — music, cooking, coding, making things,
  languages, a job.

## Three or four, not eight

Enough to be distinctive, few enough to be consistent. An athlete with eight
pillars has none, because nothing repeats often enough to be noticed.
""",
            },
            {
                "title": "Testing a Candidate Pillar",
                "description": "Four tests that separate a real pillar from something that sounds good.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The four tests

**1. Is it true?** Not aspirational. Could somebody who knows you well confirm
it without hesitating? A pillar you have to grow into is a project, not a
pillar — and audiences detect the difference quickly.

**2. Could I produce about it weekly for a year?** Without inventing anything.
A subject with nothing happening in it produces three posts and then silence.

**3. Would I care if nobody watched?** The test for whether it is a value or a
performance. The pillars that survive are the ones you would be doing anyway.

**4. Does it survive a bad season?** If the pillar depends on results, it is
not a pillar — it is a scoreboard.

## Evidence, not adjectives

Every pillar needs something you can point at.

- *"Community"* → what did you actually do, when, and for whom?
- *"Academics"* → what are you studying, and what is interesting about it?
- *"Family"* → what does that look like in a normal week?

If you cannot produce evidence from the last three months, the pillar is a word
rather than a thing. Either find the evidence or choose a different pillar.

## The uncomfortable one

For most athletes, one candidate pillar fails test three. It is on the list
because it sounds impressive, or because somebody suggested it, or because
other athletes have it.

Remove it. A presence built partly on something you do not care about is
exhausting to maintain and transparently thin to anyone paying attention.

## Ask other people

Ask three people who know you — not all friends — what they would say you are
about, besides your sport. The answers are frequently more accurate than your
own, and occasionally they name something you had not counted because it did
not seem notable.
""",
            },
            {
                "title": "The Pillar Set",
                "description": "Choosing the final three or four and writing them so they can be used.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Write each one properly

A pillar is not a word. It is a short, specific line you could hand to somebody
else:

> *"The craft — I show the parts of training nobody films: the rehab, the
> repetition, the days it goes badly."*
>
> *"My town — I grew up in a place people leave, and I post about the people
> who stayed and built something."*
>
> *"Cooking for the team — I cook, badly and improving, and I feed people."*

Specific enough that two different athletes could not both use it.

## Include one that is not about sport at all

The one that makes you distinguishable. For most athletes it is also the one
they are most reluctant to include, because it feels irrelevant or
unimpressive.

It is neither. It is the only part of the set that nobody else in your position
group has.

## Check the set as a whole

Read your three or four together and ask:

- Do they describe a recognisable person?
- Is there anything here a stranger would remember?
- Could somebody who knows me read this and agree?
- Is there a gap — something important about me that none of them covers?

## Write what you are not

Equally useful and rarely done. Three things you will not be known for:

> *"Not the loudest. Not a highlight account. Not somebody who talks about
> other people's performances."*

An anti-description does more work than a description, because it decides
things. Module 3 turns the whole set into decisions about what gets posted.

## Expect it to change

Pillars at fifteen are not pillars at eighteen. Review them once a season.
What should not change often is the person underneath — if the set is being
rewritten every few months, it was built from what sounded good rather than
from what is true.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Define Your Pillars",
            "description": (
                "Find the three or four things you actually stand for, with evidence.\n\n"
                "Submit:\n"
                "1. Eight candidate pillars, written quickly and without editing.\n"
                "2. All four tests applied to each: is it true, could I produce weekly for a "
                "year, would I care if nobody watched, does it survive a bad season?\n"
                "3. Evidence from the last three months for every candidate that survived. A "
                "pillar with no evidence is a word — say so where that is the case.\n"
                "4. The uncomfortable one: name a candidate that failed test three and explain "
                "why it was on the list.\n"
                "5. The outside view: ask three people who know you — not all friends — what "
                "they would say you are about besides your sport. Record their answers in "
                "their words.\n"
                "6. Your final three or four, each written as a specific line rather than a "
                "word, including at least one that is not about sport.\n"
                "7. Your anti-description: three things you will not be known for.\n\n"
                "Graded on whether the pillars are evidenced, on whether the outside view was "
                "genuinely sought, and on the honesty of part 4."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Finding Your Pillars",
            "description": "Four questions on pillars and the tests that validate them.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why do most athlete accounts look identical?",
                    "choices": [
                        "They are built from the only thing everybody shares — the sport",
                        "Platforms promote the same content formats",
                        "Athletes copy each other deliberately",
                        "Coaches require approved content",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which test asks whether a pillar is a value rather than a performance?",
                    "choices": [
                        "Is it true?",
                        "Would I care if nobody watched?",
                        "Could I produce about it weekly for a year?",
                        "Does it survive a bad season?",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course say about a pillar with no evidence from the last three months?",
                    "choices": [
                        "It is a long-term goal worth keeping",
                        "It should be given a season to develop",
                        "It is a word rather than a thing — find evidence or choose differently",
                        "It is acceptable if somebody else suggested it",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why include a pillar that is not about sport at all?",
                    "choices": [
                        "Platforms reward varied content",
                        "It fills gaps in the posting schedule",
                        "Coaches look for well-rounded athletes",
                        "It is the only part of the set nobody else in your position group has",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Personal Mission Statement",
        "description": (
            "Turning the pillars into one sentence that decides things, and testing it on "
            "real people."
        ),
        "lessons": [
            {
                "title": "What a Mission Statement Is For",
                "description": "A decision tool, not a slogan — and the difference matters.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Most are useless

> *"Dedicated student-athlete committed to excellence on and off the field."*

Every word is true of almost everybody, it decides nothing, and nobody reading
it learns anything. That is the standard athlete bio and it is doing no work.

## What a working statement does

It **decides things**. When you are unsure whether to post something, accept a
partnership, or say yes to an opportunity, the statement answers.

So the test is not whether it sounds good. It is whether it rules anything
out. A statement that approves everything is a decoration.

## The shape

One or two sentences containing:

- **Who you are**, concretely — sport, position, place, stage.
- **What you are building toward** — beyond the next result.
- **What you stand for** — the pillars, compressed.

> *"I'm a goalkeeper from a small town that produces very few of them. I'm
> building a career in sport and engineering, and I'd rather show the work than
> the highlights."*

Specific, recognisable, and it rules things out — no highlight-only content, no
pretending the town is bigger, nothing that conflicts with the study.

## Write it for a person, not a panel

Imagine explaining yourself to one adult who has never met you and has two
minutes. You would not say "committed to excellence". You would say something
true.

## It is not permanent

Expect to rewrite it twice in two years. The pillars underneath should be
stable; the sentence that expresses them gets sharper with use.

What matters is that you have one that currently decides things — which is
what Module 3 uses it for.
""",
            },
            {
                "title": "Drafting and Cutting",
                "description": "Getting from a page of attempts to one sentence that works.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Write ten, keep one

The first three attempts will be clichés. That is expected and it is why you
write ten — the useful one usually arrives around the seventh, after you have
exhausted the obvious phrasings.

Write them quickly, without editing, then cut.

## The cutting tests

**1. Could another athlete in my position use this unchanged?** If yes, it is
not yours. Add the specific thing.

**2. Does it rule anything out?** Name one post or one opportunity this
statement would reject. If you cannot, it is decoration.

**3. Would somebody who knows me recognise me in it?** Ask them.

**4. Can I say it out loud without wincing?** You will have to, in BM-302's
interviews and BM-301's pitches.

## Words to remove

- *Passionate, dedicated, committed, driven, hungry* — true of everybody, and
  therefore empty.
- *Excellence, greatness, elite* — unless attached to something measurable.
- *Journey*, unless you mean something specific by it.
- Anything in the third person.

Removing those usually cuts a draft in half and forces the specific thing to
the front.

## Keep the evidence beside it

A statement makes a claim. Keep the two or three facts that support it in the
same place:

> *"...I'd rather show the work than the highlights."*
> *Evidence: 40 weeks of training posts, the rehab series, the film breakdowns.*

That pairing is what stops a statement drifting into something you say rather
than something you do — and it is what BM-301's media kit needs.

## Test it on three people

One who knows you well, one who knows you a little, one who does not know you
at all. Ask each the same question: *what would you expect from this person?*

Their answers tell you whether the statement transmits. If all three describe
somebody different, rewrite it.
""",
            },
            {
                "title": "Using It",
                "description": "Where the statement actually appears, and how it earns its place.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Where it goes

- **Your bio**, compressed to a line.
- **The top of your media kit** (BM-301).
- **The first line of a recruiting email** (REC-201), adapted.
- **Your answer** when somebody asks what you are about — including in an
  interview (BM-302).
- **Your own decision-making**, which is the main use and the invisible one.

## The bio version

Platform bios are short, so compress rather than replacing:

> *Keeper · 2028 · [Town] · engineering + saves · showing the work*

Four or five fragments, each carrying something. Most athlete bios are a
position, a school and three emoji, which transmits nothing.

## Using it as a filter

The practical version. For any decision:

- *Does this fit the statement?* → yes, do it.
- *Does it conflict?* → no, and you now have a reason you can say out loud.
- *Neither?* → it is noise, and noise is what makes a feed forgettable.

That third case is the useful one. Most content athletes post is neither on-
brand nor off-brand; it is simply nothing, and a statement is what lets you
notice that.

## What it does not do

It does not stop you being a person. You are allowed to post something funny
that fits nowhere, and a presence that only ever produces on-pillar content
reads as a campaign.

The rough balance most athletes land on: the large majority of deliberate
content inside the pillars, and the rest ordinary life.

## Review it

Once a season, with the pillars. Ask the three readers again every year or so —
the useful question is not whether they like it but whether it still describes
the person they see.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Write and Test the Statement",
            "description": (
                "Ten drafts, one statement, three readers.\n\n"
                "Submit:\n"
                "1. Ten drafts, written quickly, including the clichéd early ones.\n"
                "2. The four cutting tests applied to your best three.\n"
                "3. Your final statement, one or two sentences, containing who you are, what "
                "you are building toward and what you stand for.\n"
                "4. The rule-out test: name one specific post and one specific opportunity "
                "this statement would reject.\n"
                "5. The evidence: two or three facts that support the claim your statement "
                "makes.\n"
                "6. Your bio version, compressed to a single line of fragments.\n"
                "7. The three readers: one who knows you well, one a little, one not at all. "
                "Ask each what they would expect from this person and record their answers. If "
                "all three describe somebody different, rewrite and say what you changed.\n\n"
                "Graded on whether the statement rules something out, on whether the clichéd "
                "words were removed, and on whether all three readers were genuinely asked."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Mission Statement",
            "description": "Four questions on writing and using the statement.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the test of a working mission statement?",
                    "choices": [
                        "Whether it rules anything out",
                        "Whether it sounds professional",
                        "Whether it mentions the sport",
                        "Whether a coach approves it",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does the course tell you to write ten drafts?",
                    "choices": [
                        "To compare different audiences",
                        "The first three will be clichés; the useful one usually arrives around the seventh",
                        "Platforms require several bio versions",
                        "So a coach can choose between them",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which words does the course say to remove?",
                    "choices": [
                        "Any mention of a hometown or school",
                        "References to academics",
                        "Passionate, dedicated, committed, driven — true of everybody and therefore empty",
                        "Anything about the sport itself",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the most useful case the statement helps with as a filter?",
                    "choices": [
                        "Content that clearly fits",
                        "Content that clearly conflicts",
                        "Content a coach has requested",
                        "Content that is neither — noise, which is what makes a feed forgettable",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Making the Feed Match",
        "description": (
            "Auditing what you actually publish against what you say you stand for, and "
            "closing the gap."
        ),
        "lessons": [
            {
                "title": "The Alignment Audit",
                "description": "Scoring your last thirty posts against your own pillars.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The gap is always bigger than expected

Take your last thirty posts and tag each one with the pillar it serves, or mark
it *none*.

Most athletes find:

- One pillar accounts for nearly everything, usually the sport.
- One or two pillars have **zero** posts, despite being on the list.
- A third of the posts serve nothing — the noise from Module 2.
- The pillar they say matters most is the least represented.

That gap is not hypocrisy. It is what happens when posting is reactive: you
post what happened today rather than what you decided to be about.

## Do the counting honestly

Thirty posts, one tag each. No post serves two pillars for counting purposes —
pick the dominant one, or mark it none.

Write the percentages. The numbers are the finding, and an impression of your
own feed is reliably wrong.

## Reading the result

- **A pillar with no posts** is either not a real pillar — go back to Module 1
  — or is simply not being served. Decide which.
- **A high "none" count** is the easiest thing to fix and the biggest
  immediate improvement.
- **A dominant sport pillar** is normal and not a problem until it is
  everything.

## What a balanced feed is not

Not equal thirds. If the craft is your main pillar, it should dominate.

What should be true is that **each pillar appears often enough to be
recognised** — roughly, somebody scrolling your last twenty posts should be
able to name your pillars without being told.

That is the real test, and Module 3's assignment runs it on a real person.
""",
            },
            {
                "title": "Closing the Gap",
                "description": "Producing for the pillars that are empty, without inventing anything.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Do not manufacture

The wrong fix is inventing content for an empty pillar — staging a community
photo, posting about a subject you do not study, performing a faith you do not
hold.

Audiences detect it, and a business reading it in BM-301 detects it faster,
because manufactured content has no detail.

## The right fix: capture what is already happening

For almost every empty pillar, the thing is already occurring and is not being
recorded.

- *Academics* — you are in class five days a week. One photo of what you are
  actually working on, and a line about why it is interesting.
- *Family* — the drive, the cooking, the person at every fixture.
- *Community* — the coaching you already do, the thing your club runs.
- *Your own subject* — the thing you make, play, fix or read.

The habit is **capture**, not creation: take something from the week that
already happened. CEO-201 made the same argument about content systems, and it
applies at a smaller scale here.

## One format per pillar

A repeatable format is what keeps a pillar alive after the enthusiasm fades:

- *Craft* → a weekly training detail, same structure each time.
- *Academics* → one thing I learned this month.
- *Community* → who I spent time with and what they do.

A format is a template. Ideas run out; templates do not.

## Start with the one that is easiest

Not the most important — the easiest. One pillar going from zero to a post a
fortnight changes the feed noticeably, and the success makes the second one
likelier.

## Cut the noise

The fastest improvement available: stop posting the third of your content that
serves nothing. It costs nothing, takes no production, and makes everything
else more visible.
""",
            },
            {
                "title": "Living With It",
                "description": "The review habit, and what to do when the pillars and the feed drift apart again.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## Review quarterly

Four times a year, re-run the audit on your last thirty posts. Ten minutes.

Three questions:

1. Which pillar is being neglected?
2. What is the "none" percentage, and is it rising?
3. Has a new pillar appeared in the content that is not on my list?

That third one is the interesting question. Feeds drift toward what is actually
true about a person, and a subject that keeps appearing unplanned is often a
real pillar you had not named.

## Updating the set

Add a pillar when it has survived a season in the content and passes the
Module 1 tests. Remove one when it has produced nothing for two quarters and
you no longer care — which is information, not failure.

Do not rewrite the whole set. If you are replacing three pillars a year, the
original set was aspiration rather than description.

## Consistency beats volume

An athlete posting twice a week, inside their pillars, for two years, builds
something recognisable. One posting daily across eight unrelated subjects
builds noise.

That is the entire argument of this course, and it is also why BM-202's
platform mechanics are less important than they appear: distribution helps a
clear thing travel and cannot make an unclear thing clear.

## What you now have

A set of pillars with evidence, a statement that decides things, and a feed
that matches them. That is a brand in the only sense that matters: somebody
scrolling for thirty seconds could tell another person what you are about.

BM-103 protects it, BM-201 turns it into a narrative, and BM-301 is where it
becomes worth something to a business.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Audit and Realign the Feed",
            "description": (
                "Count what you actually post, then close the gap.\n\n"
                "Submit:\n"
                "1. The alignment audit: your last thirty posts, each tagged with one pillar "
                "or marked none, with the percentages.\n"
                "2. The findings: which pillar dominates, which has zero posts, and what the "
                "'none' percentage is.\n"
                "3. Your reading: for each empty pillar, is it not a real pillar or simply not "
                "being served? Decide, with reasoning.\n"
                "4. One format per pillar, written as a repeatable template rather than an "
                "idea.\n"
                "5. Four weeks of closing the gap: what you actually posted for the easiest "
                "empty pillar, and what you stopped posting from the noise.\n"
                "6. The recognition test: show your last twenty posts to someone who does not "
                "know you and ask them to name what you are about. Record their answer.\n"
                "7. Your quarterly review dates, and one paragraph on anything appearing in "
                "your content that is not on your pillar list.\n\n"
                "Graded on whether the audit counts real posts with real percentages, on "
                "whether the four weeks actually happened, and on the recognition test."
            ),
            "total_marks": 150,
            "due_in_days": 35,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Making the Feed Match",
            "description": "Four questions on the alignment audit and closing the gap.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the course say the alignment audit usually reveals?",
                    "choices": [
                        "One pillar dominates, one or two have zero posts, and a third of the content serves nothing",
                        "An even spread across all pillars",
                        "That the pillar list was too short",
                        "That posting frequency is too low",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the wrong way to fill an empty pillar?",
                    "choices": [
                        "Capturing something that already happened that week",
                        "Manufacturing content — staging a photo or performing something you do not do",
                        "Building a repeatable format for it",
                        "Starting with the easiest pillar",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course call the fastest improvement available?",
                    "choices": [
                        "Posting more often",
                        "Improving production quality",
                        "Cutting the third of content that serves nothing",
                        "Adding a new pillar",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does a subject that keeps appearing in your content unplanned usually indicate?",
                    "choices": [
                        "A distraction to remove",
                        "A platform algorithm effect",
                        "A sign the statement needs rewriting",
                        "A real pillar you had not named",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
