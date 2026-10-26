"""BM-202: Platform Mechanics & The Algorithm.

Level 2: Content Strategy & Community. Written against the course's focus
(understanding how different platforms distribute content) and its core
competencies: the distinct purposes of Instagram (visual portfolio), TikTok
(reach and personality), X/Twitter (recruiting and networking) and LinkedIn
(B2B and the post-sports career).

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).

Platform specifics date quickly; the lessons teach the mechanics that have held
across every feed change rather than this season's settings, and say so.
"""

MODULES = [
    {
        "title": "How Distribution Actually Works",
        "description": (
            "What a recommendation feed is optimising for, and why that explains almost "
            "everything athletes find confusing about reach."
        ),
        "lessons": [
            {
                "title": "The Feed Is a Prediction Machine",
                "description": "What the system is actually doing when it decides who sees a post.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## One sentence

Every modern feed is trying to predict which piece of content will keep a
specific person on the app the longest, and show them that.

That is it. Not quality, not fairness, not follower count. A prediction about
one viewer's next few seconds.

Almost everything athletes misunderstand about reach follows from not
believing that sentence.

## What it predicts from

The signals vary by platform and change constantly, but the categories have
not changed in years:

- **Watch time and completion.** Did the viewer watch it, and to the end? The
  dominant signal on every video platform.
- **Re-watches.** Watching twice is a very strong signal.
- **Deliberate actions**, roughly in order of weight: share > save > comment >
  like. A share is one person predicting another person will like it, which is
  exactly what the system is trying to do.
- **Negative signals.** Scrolled past instantly, hidden, "not interested",
  unfollowed. These matter more than athletes expect.
- **Relationship.** Do these two accounts interact? This is why your friends
  see you and strangers do not.
- **Topic match.** What this viewer usually watches.

## How a post is tested

A post is shown to a small group first — some followers, some similar
accounts. How that group behaves decides whether it goes to a larger one, and
so on.

Three consequences:

- **The first hour matters** because it is the test, not because of magic.
- **A post can arrive late.** Something can sit flat for a day and then move.
- **Every post is tested on its own.** A good post last week does not carry
  this week's.

## Followers are not distribution

The single most important idea for an athlete. On a recommendation-driven
platform, most of a post's views come from people who do not follow you.

Which means:

- A small account can reach a lot of people.
- A large account can post to near silence.
- **Chasing follower count is chasing the wrong number** — BM-301 makes this
  commercial, where engagement rate beats raw followers in every pitch.

## What this does not tell you to do

It does not tell you to make content you are embarrassed by. It tells you that
the system rewards content that holds attention, and that holding attention
has craft to it — which is BM-203 — rather than being luck.

## Why specifics are not in this lesson

Every number, setting and feature in this area changes within months. The
mechanics above have been stable for years because they follow from what the
business is. Learn the mechanics; check the specifics yourself each season.
""",
            },
            {
                "title": "The Metrics Worth Reading",
                "description": "Which numbers mean something, and which ones athletes waste their time on.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The ones that matter

**Watch time / average view duration.** On video, the number. Low completion
on a short clip means the opening did not hold, and nothing else you change
will fix that.

**Engagement rate**, not raw engagement. Interactions divided by reach (or by
followers, stated consistently). This is the number BM-301 puts in a media kit,
because it is the one a business can compare fairly between a 2,000-follower
account and a 50,000-follower one.

**Shares and saves.** The strongest signals and the most honest feedback. A
post with few likes and many saves did something useful.

**Follower conversion.** How many people followed because of this post. Tells
you which content actually recruits an audience.

**Profile visits.** Somebody was interested enough to look at who you are.

## The ones that mislead

**Follower count.** A vanity number. Buyable, inheritable from one viral post,
and uncorrelated with influence. A business that only asks for it is a
business BM-301 teaches you to educate.

**Likes.** The cheapest action available and the weakest signal.

**Views**, alone. A three-second view and a full watch count the same in that
number.

## Reading them honestly

- **Compare like with like.** A fixture highlight will out-perform a gym clip
  every time; comparing them teaches you nothing.
- **Use a rolling window.** One post is noise. Ten posts is a signal.
- **Look at the drop-off**, where the platform gives it. The second it falls
  is the second your opening stopped working.
- **Check who, not just how many.** Twelve views including two from coaches at
  programmes on your REC-201 list is a better week than four thousand from
  strangers.

That last point is the one this course most wants an athlete to hold onto.

## The weekly ten minutes

Once a week: top three posts, bottom three posts, and one sentence on what the
top three had in common. That is the whole analysis, and it is more than
almost anyone does.

## What not to do with the numbers

- **Do not check hourly.** BM-103's attention habits exist for this.
- **Do not let a flat post change the plan.** The plan is the spine from
  BM-201.
- **Do not delete an under-performing post** that was on-brand and true. The
  feed is not a leaderboard.
""",
            },
            {
                "title": "Consistency, Timing and the Myths",
                "description": "What actually moves reach over a season, and the folklore that does not.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## What actually works over a season

**Consistency.** Posting regularly at a rate you can sustain. Not because the
system rewards loyalty — it does not — but because more attempts means more
chances to be tested, and because an account that goes quiet loses the
relationship signal with its own audience.

**A recognisable subject.** Accounts that are about something get recommended
to people interested in that thing. An account that is about five unrelated
things is hard to place. Your three threads from BM-201 are this.

**Strong openings.** The first second of a video and the first line of a
caption do most of the work. BM-203 teaches the craft.

**Replying.** Comments are a signal, and replying produces more of them.
BM-204 is built on this.

**Not deleting and reposting.** Starting over throws away a test in progress.

## Timing

Post when your audience is awake and on their phones — generally after school,
in the evening, and at weekends for a school-age audience. Check your own
analytics rather than trusting an article.

But keep it in proportion: timing is a small effect. A good post at a mediocre
hour beats a weak post at the perfect one, every time.

## The myths

**"The algorithm is suppressing me."** Almost always it is a weaker post, or a
normal fluctuation. Suppression exists for rule violations, and those come
with a notification.

**"Engagement pods / follow-for-follow."** Produces interactions from people
with no interest in you, which teaches the system to show your content to
people like them. Actively harmful, and worthless to a business in BM-301.

**"Buying followers."** Visible in the ratios to anybody who looks, destroys
your engagement rate — the number that actually matters — and ends a
sponsorship conversation on the spot.

**"Hashtags are the growth lever."** They are a weak topic hint. A few
relevant ones are fine; thirty is noise.

**"You have to post daily."** Sustainable beats intense. Three good posts a
week for three years beats daily for a month.

**"Deleting a flat post helps."** It does nothing.

## The honest summary

You control the content, the consistency and the craft. You do not control
distribution. Athletes who understand that make better content and are less
miserable; athletes who do not spend a season trying to reverse-engineer a
system that changes every quarter.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Read Your Own Numbers",
            "description": (
                "Find out what is actually happening on your accounts.\n\n"
                "Submit:\n"
                "1. The one-sentence explanation of what a feed is optimising for, in your "
                "own words.\n"
                "2. For your main platform, your last fifteen posts in a table: date, type, "
                "reach, followers versus non-followers where available, watch time or "
                "completion, likes, comments, shares, saves.\n"
                "3. Your engagement rate for each, calculated the same way throughout, with "
                "the formula you used written out.\n"
                "4. Your top three and bottom three by engagement rate, and one sentence on "
                "what the top three had in common.\n"
                "5. Your follower-versus-non-follower split: what proportion of your reach "
                "comes from people who do not follow you?\n"
                "6. The 'who, not how many' check: name any post that reached somebody who "
                "actually matters — a coach, a local business, a programme on your list.\n"
                "7. Your posting times, from your own analytics rather than an article.\n"
                "8. Two myths from Lesson 3 that you or somebody you know has believed, and "
                "what is actually true.\n\n"
                "Graded on whether the numbers are real and consistently calculated, and on "
                "whether part 4 draws a conclusion rather than listing."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: How Distribution Works",
            "description": "Four questions on feed mechanics, metrics and myths.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is a recommendation feed actually optimising for?",
                    "choices": [
                        "Predicting which content keeps a specific viewer on the app longest",
                        "Showing the highest-quality content first",
                        "Distributing reach fairly across accounts",
                        "Prioritising accounts with the most followers",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which deliberate action carries the most weight?",
                    "choices": [
                        "A like",
                        "A share — one person predicting another will like it",
                        "A comment",
                        "A follow",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why is engagement rate the number BM-301 puts in a media kit?",
                    "choices": [
                        "It is the only number platforms verify",
                        "It cannot be affected by a single viral post",
                        "It compares fairly between a small account and a large one",
                        "Businesses are required to report it",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say is wrong with engagement pods and follow-for-follow?",
                    "choices": [
                        "They violate most platforms' terms of service",
                        "They are too slow to be worth the effort",
                        "They only work on one platform",
                        "They produce interactions from uninterested people, teaching the system to show your content to more like them",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Four Platforms, Four Jobs",
        "description": (
            "Instagram, TikTok, X and LinkedIn do different work for an athlete — what each "
            "one is actually for."
        ),
        "lessons": [
            {
                "title": "Instagram and TikTok",
                "description": "The visual portfolio and the reach engine.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Instagram: the portfolio

Instagram is the account people check **after** they have heard of you. A
coach given your name, a business considering a partnership, a teammate's
parent — they look here, and the grid is what they see.

So treat it as a portfolio:

- **The profile is the pitch.** Name, sport, position, graduation year, school
  or club, and one link. A coach should know what you are in two seconds.
  REC-201 wrote the same line for an email.
- **The grid is a first impression.** Somebody judges it in one scroll. A
  coherent grid is why BM-102's pillars existed.
- **Highlights are a menu.** Pinned collections — film, academics, community,
  a season — mean a visitor finds what they came for.
- **Reels are the reach.** The recommendation surface; the grid is the
  destination it feeds.
- **Stories are the relationship.** Daily, disposable, and where the people
  who already follow you stay close.

## TikTok: reach and personality

TikTok will show a seventeen-year-old's clip to a hundred thousand strangers
if it holds attention. No other platform does that for an unknown account.

What it rewards:

- **Personality over polish.** Over-produced content under-performs here.
- **A strong first second.** The scroll decision is immediate.
- **Teaching and showing.** A drill explained, a mistake corrected, a day
  walked through.
- **Series.** Recurring formats train an audience to look for the next one.

What it is not: a recruiting channel. Coaches are not scouting TikTok, and
REC-104 is clear that film goes to a programme's own route. TikTok builds an
audience; the audience is what BM-301 sells.

## Using them together

The usual, workable pattern: make it for TikTok's reach, keep the good ones on
Instagram as portfolio pieces. Same footage, different cut, different caption.

Do not auto-cross-post with the other platform's watermark on it. Every feed
down-ranks it and it looks lazy.

## The risk on both

These are the two platforms where BM-101's flagged categories do most damage,
because they are visual, fast and casual. The rule from BM-103 stands: the
private account is a boundary, not a protection.
""",
            },
            {
                "title": "X and LinkedIn",
                "description": "The networking channel and the one that outlives your playing career.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## X/Twitter: recruiting and networking

In several sports this is where the recruiting conversation actually happens
in public: coaches, reporters, programme accounts, camp organisers and other
athletes, in one place, reachable.

Used well:

- **The bio is a recruiting profile.** Graduation year, position, height and
  weight where relevant, school, club, GPA if it is a strength, contact or
  film link. It is read far more often than you think.
- **The pinned post is your film.** One pinned post, current, with the
  highlight package REC-104 taught you to build.
- **Follow and read** the programmes, coaches and reporters that matter in
  your sport. You learn how the process actually works by watching it.
- **Reply like a professional.** Short, useful, respectful. REC-202's rules
  apply — a public reply to a coach is an introduction.
- **Post the real news**: a commitment, an offer, a result, a camp, a thank
  you.

What ends it: arguing in public, commenting on a selection, posting after a
loss, replying to a troll. REC-302 explains how quickly that gets back to a
coach.

## LinkedIn: the thirty-year account

Almost no high-school athlete has one, and they should, for one reason: **your
playing career will end and this account will not.**

CEO-304 made the same argument about the transition. Practically:

- **A real headline.** "Student athlete | Class of 2027 | Aspiring sports
  management" rather than a joke.
- **It is where adults are.** Local business owners — the ones BM-301 sends
  you to pitch — are on LinkedIn and are not on TikTok.
- **It is where sponsorship looks professional.** A brand partnership posted
  here reads as business experience, which is what it is.
- **It holds the non-sport record.** Volunteering, a part-time job, a course,
  a certification, an award. The things CEO-301 says make you employable.
- **Connections last.** A coach, a sponsor or a mentor you connect with at
  seventeen is still there at twenty-seven.

Post rarely — once a month is plenty. The account is an asset, not a feed.

## Choosing your tone across four

Your voice from BM-201 stays the same. The register changes: more formal on
LinkedIn, loosest on TikTok, concise on X. Same person throughout, which is
the only consistency that matters.
""",
            },
            {
                "title": "The Profile Everybody Actually Reads",
                "description": "Bios, links and the first ten seconds of a visit.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## Ten seconds

Somebody arrives from a shared clip, a coach's note, or a business's search.
They give you about ten seconds before deciding whether to follow, contact you
or leave.

Almost every athlete wastes them on a quote and three emoji.

## What the bio must contain

For an athlete who wants to be recruited or sponsored:

- **Sport and position.**
- **Graduation year.** The single most-wanted fact, and the most commonly
  missing.
- **School or club.**
- **One differentiator** — a pillar from BM-102, a measurable, an academic
  strength.
- **A route to contact or film.**

Five short lines. Anything else is decoration.

## The link

One link, and it should go somewhere useful: your film, a simple page with
film and contact details, or your media kit from BM-301.

What it should not be: a dead link, a page that has not changed in two years,
or nothing at all, which is the most common case.

## The profile picture and the name

- **A clear photo of your face**, recent, not a team crest or a logo. People
  recruit people.
- **A handle somebody can find and spell.** If yours was chosen at twelve and
  is a joke, change it now — early, while it costs nothing.
- **The same handle everywhere** if you can get it, so one search finds all
  four.

## The pinned post

Every platform that allows it: pin the thing you want a stranger to see first.
For most athletes that is current film. Update it each season; a pinned
highlight from two years ago is worse than none.

## The audit

Open all four of your accounts in a browser you are not logged into, on a
phone. That is what a coach sees.

Ask: in ten seconds, do I know what sport this person plays, when they
graduate, and how to contact them?

If not, that is the first job in this course, and it takes an afternoon.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Four Accounts, Four Jobs",
            "description": (
                "Set each platform up for the job it actually does.\n\n"
                "Submit:\n"
                "1. The job of each platform in one sentence each — Instagram, TikTok, X, "
                "LinkedIn — and which of the four you will actually run. Justify any you are "
                "skipping.\n"
                "2. The logged-out audit: screenshots of all your accounts as a stranger sees "
                "them on a phone, and your answer to the ten-second test for each.\n"
                "3. Your rewritten bio for each platform you run, containing sport, position, "
                "graduation year, school or club, differentiator and a contact or film route.\n"
                "4. Your link: where it goes now and where it will go.\n"
                "5. Your pinned post on each platform that allows one, and why that is the "
                "right thing for a stranger to see first.\n"
                "6. Your Instagram highlights plan: the collections a visitor should find.\n"
                "7. A LinkedIn profile, created, with a real headline and at least three "
                "non-sport entries — a job, volunteering, a course, an award.\n"
                "8. Your register for each platform: how the same voice changes tone across "
                "the four, with one example line each.\n\n"
                "Graded on whether the bios actually contain the five facts and on whether the "
                "LinkedIn profile exists rather than being described."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Four Platforms",
            "description": "Four questions on platform jobs, profiles and tone.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is Instagram's job for an athlete?",
                    "choices": [
                        "The portfolio — the account people check after they have heard of you",
                        "The main source of new reach",
                        "The channel coaches scout through",
                        "The record of non-sport achievements",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does the course say TikTok is not?",
                    "choices": [
                        "A place where personality beats polish",
                        "A recruiting channel — coaches are not scouting there",
                        "A platform where a small account can reach strangers",
                        "A place where series formats work",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the one reason a high-school athlete should have LinkedIn?",
                    "choices": [
                        "It reaches more people than other platforms",
                        "Recruiters require it",
                        "Your playing career will end and this account will not",
                        "It is the only platform that verifies accounts",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which fact does the course call the most-wanted and most commonly missing from an athlete's bio?",
                    "choices": [
                        "Height and weight",
                        "Club team name",
                        "GPA",
                        "Graduation year",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Choosing Where to Spend Your Effort",
        "description": (
            "Deciding how much of a limited week goes to this, and building a schedule that "
            "survives school, training and a bad run."
        ),
        "lessons": [
            {
                "title": "The Budget",
                "description": "Treating attention and time as the limited resources they are.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## You do not have time for four platforms

A student athlete has school, training, competition, recovery, sleep and a
family. Social media is somewhere after all of those, and CEO-302 was explicit
that sleep is a performance input, not a flexible one.

So this is a budgeting problem, not an ambition problem.

## A realistic budget

**Two to three hours a week, total**, split roughly:

- **Capture:** almost free, because it happens inside sessions you were
  already doing — BM-201, Module 2.
- **Editing and writing:** one hour, batched into a single sitting.
- **Replying:** twenty minutes, in two sittings. BM-204 explains why this is
  the highest-value slot.
- **Reading the numbers:** ten minutes, once a week.

Anything beyond three hours is coming out of study, training or sleep, and all
three are worth more.

## Pick two platforms, properly

Two accounts run well beat four run badly, every time. For most athletes:

- **One reach platform** — TikTok, or Reels.
- **One portfolio platform** — Instagram.
- **X** if your sport's recruiting happens there.
- **LinkedIn** as a maintained profile, not a feed. Once a month.

That is a defensible answer, and it is better than a silent presence on six.

## The honest cost nobody budgets

The scrolling. Twenty minutes of creating is not the problem; two hours of
consuming is. BM-103's attention habits are the control: a set checking time,
nothing in the hour before sleep, and nothing around competition.

## In season and out

- **In season:** reduce. Two posts a week from a backlog. Nobody is
  penalising you.
- **Out of season:** build. More capture, more editing, the bigger pieces.
- **Exam block:** stop, and say so. "Back in three weeks — exams." An audience
  respects that, and it demonstrates the priorities a coach is looking for.

## The thing that is never worth it

Posting to meet a quota when you have nothing to say. It is visible, it dilutes
the account, and it spends the one resource you cannot restock mid-season.
""",
            },
            {
                "title": "A Weekly System",
                "description": "The small, repeatable routine that produces a season of content.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Four slots

Not a plan — four appointments in a week, each short.

**Slot 1: Capture (ongoing, zero scheduled minutes).** One clip per session, a
photo a day, a voice note after a hard session. BM-201 already set this.

**Slot 2: The build (one hour, one fixed day).** Sit down once a week and:
pick three or four items from the backlog, edit them, write the captions
(BM-201, Module 3), and schedule or queue them.

Sunday evening works for most athletes. The day matters less than it being the
same day.

**Slot 3: Replies (twenty minutes, twice a week).** Comments, worthwhile
direct messages, and the engagement BM-204 teaches.

**Slot 4: Review (ten minutes, weekly).** Top three, bottom three, one
sentence on the pattern.

Total: under two hours, and the account runs.

## Why batching is the whole trick

Editing four clips in one sitting takes barely longer than editing one,
because the cost is in opening the app, remembering the workflow and finding
the footage. Doing that four separate times is where athletes lose an evening
a week.

It also means a bad week is survivable: if you are two weeks ahead, the week
you are ill, travelling or sitting an exam looks exactly like any other from
the outside.

## Stay two weeks ahead

The single most useful habit in this module. A backlog is what makes
consistency possible without discipline, and it is why BM-201 separated
capture from publish.

## When the system breaks

It will — a hard block of fixtures, an injury, exams. Two rules:

- **Say something.** One post: back in a few weeks, here is why. Silence
  reads as abandonment; a sentence reads as priorities.
- **Restart small.** One post. Not a relaunch, not an apology essay. The gap
  matters far less to everybody else than it does to you.
""",
            },
            {
                "title": "Keeping Up Without Chasing",
                "description": "Platforms change; what to re-check each season and what to ignore.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## What changes and what does not

**Changes:** features, formats, recommended lengths, what the feed is
currently favouring, which platform teenagers are on, what a particular
platform is even called.

**Does not change:** that the feed predicts attention, that strong openings
win, that shares and saves are the honest signals, that consistency beats
intensity, that followers are not distribution, and that content which gives
somebody something travels.

Everything in Module 1 is in the second list. That is deliberate.

## The seasonal check

Twice a year, thirty minutes:

- Has anything changed about where my audience is?
- Is there a new format my sport's content has moved into?
- Are my bios, links and pinned posts current? (Module 2.)
- Which platform am I maintaining out of habit rather than usefulness?

Twice a year. Not weekly, and not from a video telling you the algorithm
changed.

## Where to learn it

- **The platform's own creator resources.** Unglamorous and more accurate than
  anything else.
- **Your own analytics.** The only source that is actually about you.
- **One or two accounts in your sport doing it well.** Watch what they do, not
  what anybody says about it.

## Where not to

Accounts selling algorithm secrets, services promising growth, anybody
offering followers, and "the algorithm changed, do this" content. The first
three are BM-103's scam patterns with a marketing budget.

## Trying a new platform

Fine, with two conditions: it does not come out of the two you already run
well, and you give it a defined trial — eight weeks, then decide using the
numbers from Module 1 rather than a feeling.

## The last word

The platforms are distribution. They are not the asset.

The asset is the story from BM-201, the standard from BM-101, the values from
BM-102, and the relationships from BM-204 — all of which move with you when a
platform dies, which they do. Athletes who built on one platform's mechanics
lost everything when it changed; athletes who built an actual presence simply
moved.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Your Budget and Weekly System",
            "description": (
                "Decide the cost, then build the routine that fits inside it.\n\n"
                "Submit:\n"
                "1. Your weekly budget in hours and minutes, split across capture, building, "
                "replying and reviewing, with what it is coming out of.\n"
                "2. Your platform decision: which two you will run properly, which you will "
                "maintain, which you are dropping — each with a reason from Module 2's jobs.\n"
                "3. Your four slots, with the actual day and time of each written into your "
                "calendar. Include a screenshot or a photo of the calendar.\n"
                "4. Your consumption audit: your phone's screen-time figure for social apps "
                "this week, and the three BM-103 habits you are applying to it.\n"
                "5. Your in-season, out-of-season and exam-block plans, with the dates from "
                "your actual calendar.\n"
                "6. Evidence you are two weeks ahead: list the queued content.\n"
                "7. Your break plan: the sentence you would post, and what restarting small "
                "looks like.\n"
                "8. Your seasonal check: the two dates in the next twelve months, and the four "
                "questions you will ask.\n\n"
                "Graded on whether the budget is realistic against your actual week and on "
                "whether part 6 shows real queued content rather than intentions."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Spending Your Effort",
            "description": "Four questions on budgeting, the weekly system and keeping current.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What total weekly budget does the course give for running an athlete's accounts?",
                    "choices": [
                        "Two to three hours, with anything beyond that coming out of study, training or sleep",
                        "Thirty minutes a day, every day",
                        "Eight to ten hours in season",
                        "Whatever time is left after training",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why is batching the whole trick?",
                    "choices": [
                        "Platforms favour posts uploaded together",
                        "The cost is in opening the app and finding the footage, so four clips take barely longer than one",
                        "Scheduled posts reach more people",
                        "It reduces the number of notifications you receive",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What should you do when the system breaks for exams or injury?",
                    "choices": [
                        "Post from the backlog regardless",
                        "Delete the account temporarily",
                        "Say something in one post, then restart small",
                        "Write a full explanation when you return",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say the platforms are not?",
                    "choices": [
                        "A route to local sponsorship",
                        "A place to publish film",
                        "Worth checking seasonally",
                        "The asset — the story, standard, values and relationships are",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
