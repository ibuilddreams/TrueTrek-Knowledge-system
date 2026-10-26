"""BM-201: Storytelling & The Athlete Narrative.

Level 2: Content Strategy & Community. Written against the course's focus
(moving from random posts to a cohesive storyline) and its core competencies:
the "Hero's Journey" applied to sport, documenting the process rather than only
the highlights, and writing compelling captions.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).
"""

MODULES = [
    {
        "title": "The Story Underneath the Highlights",
        "description": (
            "Why a feed of good plays says nothing, and the narrative structure that makes "
            "the same material mean something."
        ),
        "lessons": [
            {
                "title": "A Highlight Reel Is Not a Story",
                "description": "What a feed of best moments actually communicates, and what it leaves out.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The problem with a highlight-only feed

Scroll an average athlete's account and you find the same thing: twenty clips
of successful plays, a few team photos, and a graphic after each result.

Every one of those posts is fine. Together they communicate almost nothing,
because every athlete at your level posts exactly the same thing. A stranger
who watches all twenty learns that you are competent and nothing else.

## What a story adds

A story is a sequence with a direction. It has a person, something they want,
something in the way, and change over time. Highlights have none of that —
they are twenty copies of the same moment.

The practical consequence: a coach, a business or a follower who sees only
highlights has no reason to follow you rather than any of the other four
hundred athletes they could watch. Somebody who understands where you are
going has a reason to come back and see whether you got there.

## The four things a story needs

**A person.** Specific, with the pillars BM-102 made you write down. Not
"athlete".

**A want.** Where you are trying to get. A level, a programme, a standard, a
return from injury, a skill you cannot do yet.

**An obstacle.** The thing making it hard. This is the part athletes delete,
and it is the part that makes the rest mean something.

**Change.** Evidence that time is passing and something is moving. The same
drill in September and in March is a story; the same drill posted twice is
not.

## The thing being measured

Nobody follows a result. They follow a direction. A post that shows a result
is consumed and forgotten; a post that shows somebody mid-way toward something
creates a reason to look again.

## What this does not mean

It does not mean oversharing, manufacturing hardship, or turning your account
into a diary. BM-101's standard and BM-103's boundaries both still apply.

It means that of the material you were already going to post, the ordinary
parts carry more weight than the spectacular ones — and most athletes post
only the spectacular ones.
""",
            },
            {
                "title": "The Hero's Journey, Applied to Sport",
                "description": "A narrative structure every audience already knows, mapped onto an athlete's season.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The structure

The story shape audiences have recognised for several thousand years is
roughly: an ordinary world, a call to something harder, a refusal or a fear, a
threshold crossed, trials, a low point, a change, and a return.

You do not need to use the vocabulary. You need the shape, because an audience
reads it without being told.

## Mapped onto a season

- **Ordinary world** — where you are now, honestly. The level, the team, the
  gap between you and where you want to be.
- **The call** — the goal you have named. A programme, a position, a time, a
  selection.
- **The refusal** — the doubt. The reason it might not work, admitted once
  rather than hidden.
- **The threshold** — the commitment that makes it real: the early mornings,
  the move, the extra session, the decision to try.
- **Trials** — training, the losses, the setbacks, the slow weeks. This is
  most of the season and most of the content.
- **The low point** — the injury, the bench, the rejection letter. The part
  almost every athlete hides.
- **The change** — what you did differently afterwards.
- **The return** — the result, when it comes, which now means something
  because of everything above it.

## The low point is the whole thing

A highlight after a low point is a story. A highlight on its own is a clip.
Identical footage, completely different weight, decided entirely by whether
the audience knows what preceded it.

This is the single most actionable idea in the course: **post during the hard
part, not only after it resolves.** Athletes who post only once things are
going well never build the context that makes the good news land.

## Honesty, and its limit

Sharing the hard part is not performing hardship. Two rules:

- **It has to be true.** A manufactured struggle is detectable and it costs
  you everything the real one would have earned.
- **Share the healed part, not the open wound.** MT-204 drew the same line:
  you can post a setback you have a handle on; something you are currently
  underwater in belongs with a coach, a parent or a professional, not with
  an audience.

A good test before posting something difficult: *would I be comfortable with
this being on the record in two years?*
""",
            },
            {
                "title": "Your Season, Mapped",
                "description": "Turning the structure into a plan for a specific season.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## From structure to a plan

The structure is useless until it is attached to your actual year. This lesson
turns it into something you can post from.

## Write the spine

Four sentences, in plain language:

1. **Where I am.** Honest. Current level, current place in the squad, current
   standard.
2. **Where I am going.** One destination, specific and dated. "A scholarship
   offer by the end of next season" rather than "to get better".
3. **What is in the way.** The real constraint — a skill, a size, a time, an
   injury, a school, a position ahead of you.
4. **What I am doing about it.** The thing you can show, repeatedly, all
   season.

Four sentences. That is the spine of every post for the next twelve months,
and most athletes have never written them.

## Map the arcs

A season has smaller arcs inside the big one: a pre-season, a run of fixtures,
a rehabilitation, a trial period, an exam block. Each has its own beginning,
middle and end.

List yours with rough dates. That tells you what each month's content is about
before the month starts, which is what stops a feed being random.

## The three recurring threads

Pick three and run them all year:

- **The thing you are building** — the skill, the weight, the time.
- **The thing nobody sees** — the recovery, the study, the early starts.
- **The people** — teammates, coaches, family, the community from BM-204.

Three threads mean a post is never "what shall I put up today". It is "which
thread is due".

## What to do with the result

When something good finally happens, do two things:

- **Point backwards.** Reference the work the audience watched. That is the
  payoff for everyone who followed the middle.
- **Reset the arc.** Name the next thing. A story that ends stops being
  followed.

## The honesty check

Read the spine back and ask whether somebody who knows you well would
recognise it. If they would not, it is a brand somebody else would have
written, and BM-102 already dealt with that.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Your Season Spine",
            "description": (
                "Write the story before you post any of it.\n\n"
                "Submit:\n"
                "1. An audit of your last twenty posts: how many are highlights or results, "
                "how many show process, how many show difficulty. Give the counts.\n"
                "2. Your four-sentence spine: where I am, where I am going, what is in the "
                "way, what I am doing about it. Specific and dated.\n"
                "3. Your season mapped onto the journey structure: name the ordinary world, "
                "the call, the threshold, the trials, the likely low point and what the return "
                "would look like.\n"
                "4. Your smaller arcs for the next twelve months, with rough dates.\n"
                "5. Your three recurring threads, each with three example posts you could "
                "actually make this month.\n"
                "6. One paragraph on the low point: what is the hard part of your current "
                "season, and what could you honestly share about it now? Apply both rules — "
                "it has to be true, and it has to be the healed part.\n"
                "7. The honesty check: ask somebody who knows you well to read the spine, and "
                "record what they said.\n\n"
                "Graded on whether the spine is specific rather than generic, and on whether "
                "part 6 shows the two rules being applied rather than quoted."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: The Story Underneath",
            "description": "Four questions on narrative structure and the season spine.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does a feed of only highlights communicate to a stranger?",
                    "choices": [
                        "That you are competent — which every athlete at your level also posts",
                        "That you are improving over time",
                        "That you take your sport seriously",
                        "That you have a coherent brand",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does the course call the single most actionable idea in it?",
                    "choices": [
                        "Posting at consistent times",
                        "Post during the hard part, not only after it resolves",
                        "Using the same caption structure every time",
                        "Tagging programmes you are interested in",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the limit on sharing a setback?",
                    "choices": [
                        "Only share setbacks that ended well",
                        "Only share setbacks a coach has approved",
                        "Share the healed part, not the open wound — and it has to be true",
                        "Share nothing that could affect recruiting",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say people actually follow?",
                    "choices": [
                        "Results, posted consistently",
                        "The highest level of performance available",
                        "Whoever posts most often",
                        "A direction — not a result",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Documenting the Process",
        "description": (
            "Capturing the ordinary work that makes the story, and building a habit that "
            "survives a busy season."
        ),
        "lessons": [
            {
                "title": "What the Process Actually Looks Like",
                "description": "The material that is already in front of you, unposted.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## You already have the content

Athletes say they have nothing to post. They mean they have no highlights this
week. The process is happening every day and almost none of it is captured.

## The list

- **Training.** Not the finished skill — the thirtieth attempt, the correction,
  the drill you are bad at.
- **The gym.** A specific lift, a number you are chasing, the session at six
  in the morning.
- **Recovery.** Ice, physio, sleep, the boring discipline nobody sees.
- **Study.** Film, a notebook, homework at eleven at night. Academics are part
  of the story, and REC-102 explains why coaches care.
- **Food, travel, routine.** The logistics of being an athlete.
- **The people.** Coaches correcting you, teammates, the parent driving.
- **The setbacks.** The rehabilitation, the session you cut short.
- **The learning.** Something you did not know a month ago.

That is eight categories, available every week, before anything good happens
in a fixture.

## Why process outperforms highlights

Three reasons:

- **It is rarer.** Everyone posts results; few post the Tuesday session.
- **It is relatable.** An audience cannot do what you do on Saturday. They
  recognise getting up early.
- **It is evidence.** A coach reading REC-103's checklist is looking for work
  rate and coachability. A highlight does not show either; a season of
  documented training does.

## The standard still applies

Process content is not an excuse for low effort. BM-203 covers the production
side, but the short version: steady camera, clean audio, decent light, and a
reason for the post to exist.

## The one-in-three rule

A workable ratio for most athletes:

- One in three posts is a result or a highlight.
- One in three is process.
- One in three is people, community or something that is not about you.

Most athletes are at three in three on the first category.
""",
            },
            {
                "title": "The Capture Habit",
                "description": "How to end a season with material instead of regret.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Capture and publish are different jobs

The mistake is treating them as one. An athlete who only films when they
intend to post films almost nothing, because the moment you would want is
always in the middle of something you are concentrating on.

Separate them:

- **Capture** constantly and cheaply. Fifteen seconds. No judgement about
  whether it is good.
- **Publish** weekly, deliberately, from what you captured.

## The capture habit

- **One clip a session.** The entire habit. Hand the phone to somebody for
  thirty seconds, or prop it up, and get one angle of one thing.
- **A photo a day.** No standard required.
- **A voice note after a hard session.** Twenty seconds on what happened.
  These become captions later, and they are honest in a way a reconstruction
  never is.
- **Keep the failures.** The missed attempt is better content than the
  successful one, and it is the only footage nobody else keeps.

## Organise it or lose it

A camera roll with four thousand items is the same as having nothing. Once a
week, five minutes:

- A folder or album per month, or per arc.
- Delete the genuinely unusable.
- Star the three best things.

That five minutes is the difference between a highlight package at the end of
the season and scrolling for two hours to find a clip.

## Who films

- **Prop it up.** A phone against a bag works for most training.
- **Trade with a teammate.** You film theirs, they film yours. The cheapest
  arrangement available and nobody does it.
- **Ask a parent** for the fixtures, with the REC-104 framing: one wide angle
  that includes you before and after the play.
- **Ask permission** in a gym or a private facility before filming, and avoid
  filming other people's children without their parents' consent. BM-103's
  boundaries run in both directions.

## The batching move

Film three or four process clips in one session and publish them across two
weeks. Capturing takes five minutes once; posting daily from a backlog takes
none.

This is what makes consistency survive exam weeks, travel and a bad run of
results — the weeks when an athlete's feed usually goes silent, which is
exactly when the story is most interesting.
""",
            },
            {
                "title": "Choosing What to Publish",
                "description": "Deciding, each week, which of the captured material actually goes up.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## The weekly pass

Once a week, fifteen minutes, look at what you captured and decide what goes
up. Three questions per item.

**1. Which thread is this?** If it does not belong to one of the three
recurring threads from Module 1, it probably should not go up.

**2. What does somebody get from it?** They learn something, they see
progress, they feel something, or they are reminded of a person. If the answer
is "nothing, but it looks good", it is a highlight — which is fine one time in
three.

**3. Would I stand behind this in two years?** BM-101's permanence test, every
time.

## Ordering matters

Three posts in a week should not be three of the same thing. Rotate the
threads: the build, the unseen, the people.

And sequence across weeks: a post that references last month's post is doing
the narrative work. "Four weeks ago this was impossible" is a story. The same
clip without that line is not.

## What not to publish

- Anything in BM-101's five flagged categories.
- Anything revealing location or routine in real time — BM-103, Lesson 3.
- Other people, especially minors, without permission.
- A coach's tactical material, a team's film, or anything the programme
  considers internal. Ask first; this costs athletes places.
- A complaint about a teammate, a referee, a coach or an opponent. It never
  reads the way it felt.
- A setback you are currently inside rather than through.

## Quantity

Three or four posts a week is sustainable for a student athlete with school
and training, and sustainable beats intense. An account that posts twice a day
for a month and then stops for three months is worse than one that posts twice
a week for three years.

## The season review

At the end of each arc, look back:

- Which posts actually got a response — and from whom? A reply from a coach
  matters more than a thousand views, and BM-202 covers why.
- Which thread did you neglect?
- Does the feed, read from the bottom, tell the story in your spine?

That last question is the only metric this module cares about.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Capture, Organise, Publish",
            "description": (
                "Build the habit, then run it for two weeks.\n\n"
                "Submit:\n"
                "1. Your capture plan: who films, what gets propped where, and the one clip "
                "per session you commit to.\n"
                "2. Two weeks of actual capture logged — date, what you captured, which thread "
                "it belongs to. The log is the evidence; a plan with nothing behind it scores "
                "nothing.\n"
                "3. Your organisation system: where things go and when you do the weekly "
                "five-minute pass.\n"
                "4. Your weekly pass applied once, in writing: everything you captured in one "
                "week, each run through the three questions, with your publish or discard "
                "decision and the reason.\n"
                "5. Three posts you actually published from it, with the thread each belongs "
                "to.\n"
                "6. Your ratio: of your last fifteen posts, how many are highlight, process "
                "and people? How does that compare with one-in-three?\n"
                "7. One post that references an earlier one — the sequencing move — with both "
                "linked or described.\n"
                "8. Your permission rules for filming other people, including minors.\n\n"
                "Graded on whether the two-week log is real and on the quality of the "
                "publish-or-discard reasoning in part 4."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Documenting the Process",
            "description": "Four questions on process content, capture habits and publishing.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does the course say capture and publish must be separate jobs?",
                    "choices": [
                        "An athlete who only films when they intend to post films almost nothing",
                        "Platforms penalise same-day uploads",
                        "Editing takes longer than filming",
                        "Publishing in real time reveals your location",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the one-in-three rule?",
                    "choices": [
                        "Post on three platforms, one piece of content each",
                        "One in three posts is a highlight, one process, one people or community",
                        "Publish one of every three clips you capture",
                        "Reply to one in three comments",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which footage does the course say nobody else keeps?",
                    "choices": [
                        "Full-length fixture recordings",
                        "Early-morning gym sessions",
                        "The failures — the missed attempt",
                        "Coaches giving corrections",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the only metric the season review cares about?",
                    "choices": [
                        "Total follower growth across the arc",
                        "Average engagement rate per post",
                        "Number of posts published versus planned",
                        "Whether the feed, read from the bottom, tells the story in your spine",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Writing the Caption",
        "description": (
            "The words under the content — what they are for, how they are built, and the "
            "habits that make them worth reading."
        ),
        "lessons": [
            {
                "title": "What a Caption Is For",
                "description": "The job the words do that the footage cannot.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The footage cannot do this

A clip shows what happened. It cannot show what it cost, what you were
thinking, what it is part of, or why it mattered. The caption is the only
place that exists.

Which is why "🔥" under a clip of a difficult thing throws away the entire
story. The footage was the easy half.

## The four jobs

A caption does at least one of these. A good one does two.

**Context.** Where this sits. "Fourth attempt. First three were on the floor."
One line turns a clip into a chapter.

**Voice.** BM-102's pillars, in how you write. The caption is where an audience
decides whether they like you, because it is the only part in your own words.

**Something given.** A detail, a correction, a thing you learned. Content that
teaches something is the most shared content there is, and an athlete has
things to teach a younger athlete every week.

**An invitation.** A genuine question. Not "thoughts? 👇" — a real one that a
person could answer, which is what BM-204 builds a community out of.

## Length

Match the job, not a rule.

- **One line** when the footage carries it.
- **Three to five lines** for most process posts — context, the detail, the
  forward pointer.
- **Long** occasionally, when there is a real story. Those are the posts people
  screenshot. Once a month at most, or they stop being an event.

## The first line is the whole thing

Platforms truncate. Everything after the first line or two is behind a "more".
So the first line is not a warm-up — it is the post.

Weak: "So this week has been pretty crazy and I wanted to share..."
Strong: "Fourth attempt. The first three were on the floor."

Start at the interesting part. There is no introduction.

## The things to stop doing

- **Motivational-poster language.** "Grind never stops. Blessed. Locked in."
  Zero information and indistinguishable from everyone else.
- **Third person.** "He put in the work today." You are seventeen.
- **Twenty hashtags.** BM-202 covers what they actually do.
- **Tagging programmes that have not contacted you**, which reads the way it
  sounds.
- **Vaguebooking.** "Some people know what they did." Never once helped.
""",
            },
            {
                "title": "Building One",
                "description": "A structure for writing a caption in two minutes instead of twenty.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The structure

Four parts. Not every caption uses all four, and they are always in this
order.

**1. The hook.** One line, concrete, starting at the interesting part. A
number, a fact, a contradiction. "Six months ago I could not do this." "Lost
by one."

**2. The substance.** Two or three lines of what actually happened — the
detail somebody else would not know. This is where the value is and it is
where most athletes write nothing.

**3. The meaning.** One line tying it to the spine. Not a moral; a direction.
"Two more of these and it is automatic."

**4. The invitation.** Optional, and only when real. A question you would
answer yourself.

## Worked example

*Weak:*

> Great session today! Grind never stops 💪 #blessed #workhard

*Built:*

> Fourth attempt. The first three ended on the floor.
>
> Coach changed one thing — plant the foot earlier, before the turn, not
> during it. Felt completely wrong for twenty minutes and then it stopped
> feeling like anything at all.
>
> That's the whole week: one correction, repeated until it is boring.

Same clip. One gives a stranger nothing; the other gives them a coaching
point, a personality and a direction.

## Writing from the voice note

Module 2 told you to record twenty seconds after a hard session. Transcribe
one and you will find the caption is already in it — in your own words,
specific, and honest in a way nothing written three days later is.

That is the single fastest route to a good caption.

## Make it readable

- **Line breaks.** A block of text on a phone does not get read.
- **Short sentences.** Then a longer one, for rhythm.
- **Plain words.** "Started" rather than "commenced".
- **Spell-check.** A coach reading your account is also reading how you write.

## The two-minute habit

Write the caption **when you capture the clip**, not three days later while
staring at the publish screen. It takes two minutes then and twenty minutes
later, and the later version is always worse because the specifics are gone.
""",
            },
            {
                "title": "Voice, Consistency and the Line",
                "description": "Sounding like yourself, repeatedly, without crossing into content you cannot stand behind.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Voice is a choice you only make once

Your voice is how you would explain something to a teammate you like. It is
not a persona, and the test is simple: **read the caption aloud.** If it does
not sound like you talking, rewrite it.

Three things to decide and then keep:

- **How formal.** Somewhere between a text message and an email. Pick a point
  and stay there.
- **How funny.** If you are funny, be funny. If you are not, do not start.
- **How much feeling.** Some athletes write plainly, some write openly. Both
  work; alternating does not.

## Consistency is what makes it a brand

A feed where every caption sounds like a different person has no voice, which
means it has no brand, which undoes BM-102.

The quickest fix: read your last ten captions in a row. If three of them could
have been written by anybody, rewrite them in your voice as practice.

## Captions and the permanent record

A caption is text. It is searchable, quotable, screenshot-able, and it lasts
longer than the clip. BM-101's audit found more problems in captions and
replies than in photographs.

So the standard applies hardest here:

- Nothing about an opponent, an official or a teammate that you would not say
  in front of them.
- No comment on a coach's decision, a selection, or a programme that passed on
  you. REC-302 covers why that one in particular closes doors.
- No posting in the hour after a bad result. BM-303 makes this a rule; it
  belongs here too.
- Nothing from the five flagged categories, including in a reply.

## The one-sentence test

Before publishing: *if a coach recruiting me read only this caption, what
would they conclude?*

Not "would it offend them" — "what would they conclude". Most captions answer
"nothing", which is the real waste. A season of captions that each give a
coach one true, specific thing about how you work is worth more than any
highlight reel, and it is the thing almost nobody does.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Ten Captions",
            "description": (
                "Write them properly, then test them.\n\n"
                "Submit:\n"
                "1. Your voice, defined: how formal, how funny, how much feeling — three "
                "sentences, with an example line for each.\n"
                "2. An audit of your last ten captions: for each, which of the four jobs it "
                "did, and whether it sounds like you. Count how many did none of the four.\n"
                "3. Five of those rewritten using the four-part structure, with the original "
                "and the rewrite side by side.\n"
                "4. Five new captions for content you captured in Module 2, built the same "
                "way, each labelled with its hook, substance, meaning and invitation.\n"
                "5. One caption written from a transcribed voice note, with the transcript "
                "included so the difference is visible.\n"
                "6. The read-aloud test applied to all ten: which ones failed, and what you "
                "changed.\n"
                "7. The one-sentence test applied to all ten: for each, what would a "
                "recruiting coach conclude? Mark any where the honest answer is 'nothing'.\n"
                "8. Your caption rules — the list of things you will not write, in your own "
                "words.\n\n"
                "Graded on whether the rewrites in part 3 actually gain substance rather than "
                "length, and on honesty in part 7."
            ),
            "total_marks": 175,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Writing the Caption",
            "description": "Four questions on caption jobs, structure and voice.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why is the first line of a caption the whole thing?",
                    "choices": [
                        "Platforms truncate — everything after it is behind a 'more'",
                        "Search indexes only the first line",
                        "Longer captions reduce reach",
                        "Comments reply to the first line by default",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What are the four parts of the caption structure, in order?",
                    "choices": [
                        "Greeting, story, thanks, hashtags",
                        "Hook, substance, meaning, invitation",
                        "Context, credit, call to action, tags",
                        "Question, answer, lesson, sign-off",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the read-aloud test for?",
                    "choices": [
                        "Checking length against the platform limit",
                        "Finding spelling errors",
                        "Voice — if it does not sound like you talking, rewrite it",
                        "Timing a caption against the clip",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What did BM-101's audit find more problems in than photographs?",
                    "choices": [
                        "Tagged locations",
                        "Shared stories",
                        "Follower lists",
                        "Captions and replies",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
