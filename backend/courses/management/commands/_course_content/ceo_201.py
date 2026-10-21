"""CEO-201: Personal Branding & Digital Asset Architecture.

Level 2: Business Operations, Branding & Compliance. Written against the
course's focus (turning a social media presence into high-value digital
property) and its core competencies: audience demographic auditing, content
monetization strategies, digital footprint cleanup, and personal brand
guidelines and style sheets.
"""

MODULES = [
    {
        "title": "Presence as Property",
        "description": (
            "Reframes accounts and follower counts as owned assets with a value that can be "
            "built, spent or destroyed."
        ),
        "lessons": [
            {
                "title": "What a Brand Is, and What It Is Not",
                "description": "Separating brand from image, logo and follower count.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The working definition

A brand is **the expectation other people hold about you before you arrive**.
Not your logo. Not your aesthetic. Not your follower count. The expectation.

That definition is useful because it tells you where a brand actually lives —
in somebody else's head — and therefore what changes it: repetition, evidence
and consistency over time.

## What it is not

- **Not a logo.** A logo is a label on a jar. It tells you nothing about what is
  inside.
- **Not reach.** A hundred thousand people who expect nothing from you are worth
  less than four thousand who expect something specific.
- **Not a persona.** A character you cannot hold for three years is a liability,
  because it will slip in public at the worst moment.

## The property frame

Your accounts, audience, archive and name are **digital property**. Property has
three features worth keeping in mind:

1. **It can appreciate.** Deliberate work raises its value.
2. **It can be spent.** Every promotion, endorsement or opinion draws down trust
   as well as attention.
3. **It can be destroyed faster than it was built.** Which is why Module 3 is
   about cleanup and why CEO-204 exists at all.

## The test for this course

By the end of CEO-201 you will hold a brand book and a media kit that a local
business could read and a parent could be comfortable with. If the two documents
contradict each other, the brand is not finished.
""",
            },
            {
                "title": "Owned, Earned and Rented Attention",
                "description": "The three kinds of reach, and why building only on rented land is a strategic error.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Three kinds of reach

**Rented.** Social platform followers. You do not own the relationship, the
distribution or the rules. An algorithm change, a suspended account or a
platform's decline takes the audience with it. Everything most athletes build is
here.

**Owned.** An email list, a phone list, a website, a saved contact list of
coaches and businesses. Smaller, duller, and yours. It survives a platform
collapse and goes with you to the next one.

**Earned.** Coverage you did not pay for: local press, a podcast appearance, a
coach's recommendation, a teacher's reference. The most credible and the least
controllable.

## The strategic error

Spending four years on rented land and converting none of it. An athlete with
40,000 followers and no owned list has, in practice, a loan rather than an
asset.

## The conversion habit

One sentence, repeated, is enough: *"If you want the next one, there's a list."*
Then give the list somewhere to live — a simple signup, a group, a newsletter
you send monthly and actually send.

Fifty people on an owned list who open what you send are a real asset, and a
local sponsor understands them immediately. They are a bigger negotiating
position in CEO-301 than a follower count a brand cannot verify.

## How this shapes the rest of the course

Every later module answers one question: **is this building property, or just
filling the feed?**
""",
            },
            {
                "title": "Digital Asset Inventory (Worksheet)",
                "description": "Inventory sheet for every account, list and archive you control.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable inventory for Module 1. One row per asset: the platform or channel,
the handle, whether it is owned, earned or rented, who has the password, whether
recovery details are current, the audience size, and the date you last posted.

A second table captures what you do not control: accounts in your name run by
someone else, team or school accounts that post about you, and old accounts you
can no longer access. Module 3 turns that second table into a cleanup plan.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Your Digital Asset Inventory",
            "description": (
                "Inventory everything that carries your name online.\n\n"
                "Submit:\n"
                "1. A complete inventory of accounts, lists and channels you control: platform, "
                "handle, owned/earned/rented, audience size, last post, and whether you still "
                "have working login and recovery access.\n"
                "2. A second list of anything in your name you do NOT control — old accounts, "
                "accounts run by others, team or school pages that post about you.\n"
                "3. Your owned-audience number today. For most students this is zero or close "
                "to it; report it honestly.\n"
                "4. One paragraph defining the expectation you currently create in other people "
                "— the brand you actually have, not the one you want. Ask two people who are "
                "not your friends and include what they said.\n\n"
                "Graded on completeness of the inventory and on whether the expectation "
                "paragraph reports what others said rather than what you hoped they would say."
            ),
            "total_marks": 100,
            "due_in_days": 10,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Presence as Property",
            "description": "Four questions on the brand definition and the three kinds of reach.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "How does the course define a brand?",
                    "choices": [
                        "The logo, colours and visual identity you use consistently",
                        "The expectation other people hold about you before you arrive",
                        "The total number of followers across all platforms",
                        "The persona you adopt when the camera is on",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Social media followers are described as which kind of reach?",
                    "choices": ["Owned", "Earned", "Rented", "Guaranteed"],
                    "answer": 2,
                },
                {
                    "text": "What does the lesson call the strategic error most athletes make?",
                    "choices": [
                        "Posting too often and exhausting the audience",
                        "Spending years building on rented land and converting none of it to owned",
                        "Refusing every brand partnership that comes in early",
                        "Using the same handle across every platform",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course describe a brand as property that can be spent?",
                    "choices": [
                        "Because accounts can be sold to other creators",
                        "Because platforms charge for reach once an account grows",
                        "Because every promotion or endorsement draws down trust as well as attention",
                        "Because advertising revenue is taxed as income",
                    ],
                    "answer": 2,
                },
            ],
        },
    },
    {
        "title": "The Audience Audit",
        "description": (
            "Reading your own analytics the way a sponsor reads them: demographics, real "
            "engagement and who is actually watching."
        ),
        "lessons": [
            {
                "title": "The Numbers a Sponsor Actually Asks For",
                "description": "Reach, impressions, engagement rate, saves and shares — and which ones survive scrutiny.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Follower count is the least interesting number

A business deciding whether to work with you is asking one question: *will this
reach people who might buy from me?* Follower count answers almost none of it.
These do:

- **Audience location.** A local restaurant cares about one thing above all
  else: how many of your followers live within driving distance.
- **Audience age and who they are.** An audience of teammates is a different
  product from an audience of parents.
- **Engagement rate.** Interactions divided by reach, expressed as a percentage.
  Comparable across account sizes, which is why it is quoted.
- **Saves and shares.** The strongest signals available. A share is a viewer
  spending their own reputation on your content.
- **Story or short-form completion.** Whether people stay to the end.

## Where to find them

Every major platform exposes these in its own creator or professional dashboard.
The skill is not finding them; it is recording them on a schedule so you have a
trend rather than a snapshot.

## Honesty rules

1. **Never quote a number you cannot screenshot.** CEO-202 covers why
   misrepresenting audience data to a sponsor is a legal problem, not just an
   embarrassing one.
2. **Quote the median, not the best post.** A sponsor who signs on your best
   week and gets your median week will not renew.
3. **Report the trend, including down months.** A seasonal athlete has a
   seasonal audience. Explained, it is normal. Hidden, it looks like a problem.
""",
            },
            {
                "title": "From Numbers to a Picture of a Person",
                "description": "Turning demographic data into the single audience description your content decisions run on.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Data is not insight

A spreadsheet saying 64% aged 13-24, 71% within 50 miles, peak engagement on
Sunday evening is data. The insight is the sentence you write from it:

> *"Mostly local high-school students and the parents who drive them, watching on
> Sunday night while the week is being planned."*

That sentence decides your posting time, your language, what you explain and
what you can assume. It is worth more than the spreadsheet because you can
actually hold it in your head on a Tuesday.

## Write three of them

- **Your core audience.** The largest coherent group.
- **Your valuable audience.** The group a sponsor would pay for, which is often
  not the largest. Parents are a frequent example: fewer in number, closer to
  the money.
- **Your unintended audience.** Who else is reading? Coaches, admissions
  officers, future employers, younger athletes copying you. Module 3 is built on
  this one.

## The audit cadence

Monthly, on the same day, into the same sheet: followers, reach, median
engagement rate, top three posts and why they worked, and any demographic shift.
Fifteen minutes.

Six months of that is a document no competitor for the same sponsorship will
have, and it changes the conversation in CEO-301 from a request into a proposal.
""",
            },
            {
                "title": "Audience Audit Sheet",
                "description": "Monthly tracking sheet for platform metrics plus the three audience descriptions.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable audit sheet for Module 2. The monthly tracker holds one row per month
per platform: followers, reach, impressions, median engagement rate, saves,
shares and completion, with a notes column for anything unusual.

The second page is the demographic snapshot — age bands, location, gender split,
active hours — and the three audience descriptions written as single sentences:
core, valuable and unintended.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Audience Audit and Three Descriptions",
            "description": (
                "Pull your real analytics and interpret them.\n\n"
                "Submit:\n"
                "1. A completed audit sheet for your main platform covering the last three "
                "months: followers, reach, median engagement rate, saves and shares. Include "
                "screenshots of the dashboards you took the numbers from.\n"
                "2. Your demographic snapshot: age bands, location, and active hours.\n"
                "3. Three audience descriptions, each a single sentence: core, valuable and "
                "unintended.\n"
                "4. Median versus best. State your median engagement rate and your best post's "
                "engagement rate side by side, and explain the gap.\n"
                "5. One decision you are changing as a result — posting time, format, subject or "
                "platform — and why the data supports it.\n\n"
                "If your account is new or small, report the real numbers anyway. A small "
                "audience understood precisely scores higher here than a large one described "
                "vaguely.\n\n"
                "Graded on whether the numbers are evidenced, whether the median is reported "
                "honestly, and whether the three descriptions are genuinely different from each "
                "other."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Audience Audit",
            "description": "Four questions on analytics, honesty rules and audience descriptions.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why is engagement rate quoted to sponsors more often than follower count?",
                    "choices": [
                        "It is comparable across accounts of very different sizes",
                        "It is the only metric platforms allow to be shared",
                        "It cannot be affected by the content itself",
                        "It always rises as an account grows",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which signal does the lesson describe as a viewer spending their own reputation on your content?",
                    "choices": ["A like", "A follow", "A share", "An impression"],
                    "answer": 2,
                },
                {
                    "text": "What does the course mean by your “valuable audience”?",
                    "choices": [
                        "The largest coherent group following you",
                        "The group a sponsor would pay to reach, which is often not the largest",
                        "The followers who comment most often",
                        "Anyone who has bought something from you before",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which number does the course tell you to quote to a sponsor?",
                    "choices": [
                        "Your best-performing post, since it shows your ceiling",
                        "A projection of next season's growth",
                        "The platform's reported maximum reach",
                        "Your median, because a sponsor who signs on your best week will not renew",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Digital Footprint Cleanup",
        "description": (
            "A systematic archaeology of everything already published under your name, and "
            "what to do about each piece."
        ),
        "lessons": [
            {
                "title": "The Archaeology Pass",
                "description": "How to search yourself the way a recruiter does, and what to look for.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Search yourself properly

Coaches, admissions officers, sponsors and journalists will all do this. Do it
first, and do it better than they will.

The pass, in order:

1. **Your name in quotes**, plus your school, your sport and your town.
2. **Every handle you have ever used**, including ones you abandoned.
3. **Image search** on your name and handles.
4. **Each platform's own search**, logged out, so you see what a stranger sees.
5. **Tagged content** — the things other people posted and attached you to.
6. **Old accounts** you cannot log into any more. List them; recovery is a task,
   not a dead end.

Keep a single list of everything you find. One row per item, with a link.

## The three-column judgement

Sort every item into one of three columns:

- **Asset.** It supports the expectation you want to create. Keep it, and
  consider resurfacing it.
- **Neutral.** It does nothing either way. Leave it.
- **Liability.** It contradicts the brand, embarrasses a future reader, or puts
  someone else at risk.

## Judge it against the unintended audience

The test is not "did my friends find this funny in 2023". The test is: **how
does this read to the Module 2 unintended audience — a coach, an admissions
officer, a sponsor's compliance team, a younger athlete copying you?** Content
does not age in the room it was made for.
""",
            },
            {
                "title": "Delete, Archive, Contextualise — and What Cannot Be Undone",
                "description": "Choosing the right response to each liability, and the limits of deletion.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Four responses

**Delete.** For anything that is simply wrong to have published. Fast, free and
the right answer more often than people think.

**Archive.** Platforms let you hide posts without destroying them. Useful for
content that is fine but no longer representative.

**Contextualise.** For something public, documented and already known. A
straightforward acknowledgement ages far better than a silent deletion that
somebody has already screenshotted.

**Leave it.** Not everything imperfect is a liability. An over-sanitised
presence reads as managed and is its own kind of warning sign.

## What deletion does not do

Deletion removes the copy *you* control. It does not remove screenshots, reposts,
archive services, press coverage or other people's copies. Plan on the
assumption that anything published may still exist.

The practical consequence: **deletion is a cleanup tool, not a crisis tool.**
CEO-204 covers what to do when something is already in circulation, and the
answer is never "delete it and hope".

## Stop producing new liabilities

Cleanup is one-off; the standard is permanent. Write yours as a short list of
categories you do not post, publish or forward, and apply it to private messages
as well. The distinction between private and public is not technical. It is a
single screenshot wide.

## Who else needs this

Your cleanup is incomplete if the people who tag you most have no idea what your
standard is. One conversation prevents more problems than any amount of
retrospective deleting.
""",
            },
            {
                "title": "Footprint Cleanup Log",
                "description": "Tracking sheet for the archaeology pass and the action taken on each item.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable log for Module 3. One row per item found: where it lives, the link,
the date it was published, the column it was sorted into (asset, neutral,
liability), the action taken (delete, archive, contextualise, leave) and the date
of that action.

A second section holds your posting standard — the categories you do not
publish or forward, written as categories rather than examples — plus the list
of inaccessible old accounts with their recovery status, and a note of who you
have told about the standard.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Footprint Cleanup and Posting Standard",
            "description": (
                "Run the archaeology pass on yourself and act on what you find.\n\n"
                "Submit:\n"
                "1. Your cleanup log covering all six search steps, with at least fifteen items "
                "reviewed. Each row needs the source, date, column and action.\n"
                "2. Counts: how many items you classified as asset, neutral and liability, and "
                "what you did with each liability.\n"
                "3. Your inaccessible-account list and the recovery step you have taken for each.\n"
                "4. Your written posting standard: the categories you will not post, publish or "
                "forward, written as categories rather than a list of examples. Include private "
                "messages explicitly.\n"
                "5. One paragraph on the conversation you had with the person who tags you most, "
                "and how it went.\n\n"
                "If you find nothing that qualifies as a liability, say so and show the search "
                "you ran — a clean result with evidence is a full-credit answer.\n\n"
                "Graded on the thoroughness of the search, the judgement shown in sorting, and "
                "whether the posting standard is written as usable categories."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Footprint Cleanup",
            "description": "Four questions on auditing and cleaning a digital footprint.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Against which audience does the course tell you to judge old content?",
                    "choices": [
                        "The friends it was originally made for",
                        "The unintended audience — coaches, admissions officers, sponsors, younger athletes",
                        "The platform's community guidelines alone",
                        "Your current follower base only",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does deletion actually remove?",
                    "choices": [
                        "Every copy of the content, everywhere",
                        "The content and any screenshots taken of it",
                        "Only the copy you control",
                        "Nothing — deletion has no practical effect",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which response does the course recommend for something public, documented and already known?",
                    "choices": [
                        "Silent deletion",
                        "Archiving it where nobody can see it",
                        "Deleting the entire account",
                        "Contextualising it with a straightforward acknowledgement",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Why does the course say an over-sanitised presence is its own kind of warning sign?",
                    "choices": [
                        "It reads as managed rather than genuine",
                        "Platforms penalise accounts that delete frequently",
                        "Sponsors require a minimum posting history",
                        "It violates disclosure rules",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Brand Guidelines and Style Sheet",
        "description": (
            "Writing the document that makes your brand repeatable: pillars, voice, visual "
            "rules and the lines you do not cross."
        ),
        "lessons": [
            {
                "title": "Three Pillars and a Voice",
                "description": "Choosing the few subjects you are known for, and describing how you sound.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Pillars: the three things you are about

A brand that is about everything is about nothing. Choose three subjects you
will return to for at least a year. For an athlete they commonly look like:

1. **The craft.** The work itself — training, technique, film, the unglamorous
   parts.
2. **The journey.** Where you are going and the honest state of the climb.
3. **A third thing that is genuinely yours.** Faith, family, a hometown, music,
   coding, cooking for teammates, a cause you actually serve.

The third pillar is where most athlete brands separate from each other, because
the first two are shared by everyone in your sport.

## Testing a pillar

- Can you produce something about it every week without inventing it?
- Would you still care about it if nobody watched?
- Does it survive a bad season?

Any pillar that fails those is a phase, not a pillar.

## Voice: how you sound

Write it as three adjectives plus a sentence of anti-description:

> *Direct, warm, unimpressed by hype. Never sarcastic about teammates, never
> performing a toughness I don't have.*

The anti-description does more work than the adjectives. It tells a future
version of you — and anyone drafting a caption on your behalf — what to avoid
when the easy option is available.

## Why this gets written down

A style sheet is what makes a brand survive other people. A teammate filming
you, a parent posting a highlight, an agency writing a caption in CEO-301: all
of them need a document, because none of them can read your intentions.
""",
            },
            {
                "title": "The Visual and Verbal Style Sheet",
                "description": "The practical specifics — typography, colour, image rules, caption patterns and the hard lines.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Keep it small enough to follow

A style sheet nobody can apply in thirty seconds will not be applied. One page.

**Visual.**

- Two or three colours, with exact values. Pick from something you already wear
  or play in; invented palettes drift.
- One typeface for titles, one for body. Free and widely available beats
  distinctive and unavailable.
- Photo rules: what a cover image always has, what it never has.
- Logo or wordmark, if any, with the one rule that it is never stretched,
  recoloured or placed on a busy background.

**Verbal.**

- Your three pillars, named.
- Caption pattern: the shape you use most, such as a concrete observation, then
  the lesson, then a question.
- Words you use and words you do not.
- The disclosure line you attach to any paid content, written out in full, ready
  to copy. CEO-202 explains why this is not optional.

**Hard lines.**

Three to five things you will not do regardless of the fee. Other people's
injuries. Teammate criticism. Categories you will not endorse. Write them here
so the decision is already made when CEO-301 puts money on the table.

## Version it

Date it. Review it once a season. A style sheet that has not changed in two
years is either very good or ignored, and only the review tells you which.
""",
            },
            {
                "title": "Brand Style Sheet (Template)",
                "description": "One-page style sheet template covering pillars, voice, visuals and hard lines.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable one-page template for Module 4. The top half carries the brand basics:
three pillars with a one-line description each, voice as three adjectives plus
the anti-description, and the audience sentences from Module 2.

The lower half holds the practical rules — colour values, typefaces, photo and
logo rules, the caption pattern, words used and avoided, the full disclosure
line, and three to five hard lines. A version box sits in the footer with the
date and the season of the next review.""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Your Brand Style Sheet",
            "description": (
                "Write the document that makes your brand repeatable by someone who is not you.\n\n"
                "Submit:\n"
                "1. A one-page style sheet containing: three pillars with a line each, your "
                "voice as three adjectives plus an anti-description, colour values, typefaces, "
                "photo and logo rules, your caption pattern, and your full paid-content "
                "disclosure line.\n"
                "2. Three to five hard lines — things you will not do regardless of fee.\n"
                "3. Pillar justification. For each pillar, answer the three tests: can you "
                "produce weekly without inventing it, would you care if nobody watched, does it "
                "survive a bad season?\n"
                "4. The handover test. Give the style sheet to someone else and ask them to "
                "draft one caption and choose one image for a post about you. Include what they "
                "produced and what it revealed was missing from your sheet.\n\n"
                "Graded on whether the sheet is short enough to use, whether the hard lines are "
                "real decisions, and on what the handover test exposed."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: Brand Guidelines",
            "description": "Four questions on pillars, voice and the style sheet.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which test does the course apply to a candidate brand pillar?",
                    "choices": [
                        "Does it attract the largest possible audience?",
                        "Can you produce about it weekly, would you care if nobody watched, does it survive a bad season?",
                        "Has it performed well for another athlete in your sport?",
                        "Does it match the colours in your style sheet?",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course say the third pillar matters most?",
                    "choices": [
                        "It is the one sponsors pay for directly",
                        "It is the easiest to produce content about",
                        "The first two are shared by everyone in your sport, so the third is where brands separate",
                        "Platforms reward accounts that post in three categories",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the anti-description in a voice definition?",
                    "choices": [
                        "A statement of what you will never sound like",
                        "A list of competitors you want to be distinguished from",
                        "The disclaimer attached to sponsored posts",
                        "A summary of negative feedback you have received",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the stated purpose of writing the style sheet down at all?",
                    "choices": [
                        "Platforms require a brand document for verification",
                        "It is needed to open a business bank account",
                        "It proves originality if someone copies your content",
                        "A brand has to survive other people — teammates, parents and agencies cannot read your intentions",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Content Systems",
        "description": (
            "Replacing inspiration with a production system: pillars into formats, a realistic "
            "cadence, and batching around a season."
        ),
        "lessons": [
            {
                "title": "Cadence You Can Keep in Week Nine",
                "description": "Choosing a publishing rhythm that survives a competitive season.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Set the floor, not the ceiling

Athletes set content schedules in the off-season, when the body is fresh and the
week is open, and abandon them by week nine. Then the gap itself becomes
discouraging and the account goes quiet for a season.

Set a **floor**: the minimum you will publish in your hardest week of the year.
For most high school athletes that is one or two posts a week, not daily. Hit the
floor every week and post more when you have more. Consistency at a low number
beats volume with gaps, because the audience is learning what to expect — which
is the brand definition from Module 1.

## Build from the pillars

Each pillar gets at least one repeatable **format**:

- *Craft* → a short technical breakdown, same structure every time.
- *Journey* → a monthly honest update, good month or bad.
- *Third pillar* → whatever it naturally produces.

A format is a template, not an idea. Ideas run out in week three; templates do
not.

## Batch around the season

Film several pieces at once, on a light day, and schedule them. Two hours of
batching covers a fortnight. An athlete who films on a Sunday is never choosing
between posting and recovering on a Wednesday.

## The one rule about in-season posting

Nothing gets published between the warm-up and the post-match handshake. That is
player time — the hat from CEO-101 — and the content will still be there
afterwards.
""",
            },
            {
                "title": "The Content Engine: Capture, Edit, Publish, Review",
                "description": "A four-stage pipeline and where athlete content systems usually break.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Four stages, separated deliberately

**Capture.** Collect raw material constantly and judge none of it. Phone
footage, a photo from a parent, a note after practice, a screenshot of a result.
Everything goes to one folder.

**Edit.** In batches, on a schedule. This is where the style sheet is applied.

**Publish.** Scheduled in advance. A human being does not need to be awake at
the optimal posting time.

**Review.** Monthly, with the Module 2 audit sheet open. Which formats earned
their time? Kill the ones that did not.

## Where it breaks

Almost always at capture. People try to create at edit time from nothing, which
is slow and produces thin material. If the folder is full, editing is
assembly. If it is empty, editing is invention.

**The fix:** one capture habit, every single day of the season. Ten seconds of
video or one photo. Not for publishing — for the folder.

## What review is for

Killing things. Most athletes add formats and never remove them, and the
schedule grows until it collapses. A format that has not earned its production
time in two months gets cut, and the hours go back to the matrix in CEO-101.

## Delegation, carefully

Someone else can edit and schedule. Nobody else writes in your voice without the
style sheet, and nobody else posts opinions as you. That boundary is worth
writing into the style sheet now, before an agency asks for passwords in
CEO-301.
""",
            },
            {
                "title": "Content System Planner",
                "description": "Format library, weekly cadence grid and the monthly format review.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable planner for Module 5. Page one is the format library: one card per
repeatable format, showing which pillar it serves, its structure, how long it
takes to produce and the equipment it needs.

Page two is the cadence grid — your floor for the hardest week of the year
alongside your normal week — plus a batching calendar. Page three is the monthly
review: each format scored on time spent against the engagement it earned, with
a keep-or-kill decision column.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Build and Run Your Content System for Two Weeks",
            "description": (
                "Design the system, then prove it runs.\n\n"
                "Submit:\n"
                "1. Your format library: at least three repeatable formats, one per pillar, each "
                "with its structure, production time and equipment.\n"
                "2. Your floor — the minimum you will publish in your hardest week — and the "
                "reasoning behind that number.\n"
                "3. Evidence of one batching session: when it happened, how long it took, how "
                "many pieces it produced.\n"
                "4. Two weeks of published output against the plan, with what you actually "
                "posted and what you missed.\n"
                "5. A daily capture log for the same fourteen days — one line per day, even if "
                "the entry is 'nothing captured'.\n"
                "6. A short review: which format is earning its production time and which is on "
                "notice.\n\n"
                "Graded on whether the floor is realistic, whether the capture habit was "
                "genuinely daily, and on the honesty of the two-week record."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: Content Systems",
            "description": "Four questions on cadence, formats and the content pipeline.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the course mean by setting a “floor” for your posting cadence?",
                    "choices": [
                        "The minimum you will publish in your hardest week of the year",
                        "The lowest engagement rate you will accept before changing format",
                        "The smallest audience worth posting for",
                        "The minimum fee you will accept for sponsored content",
                    ],
                    "answer": 0,
                },
                {
                    "text": "At which stage does the course say most athlete content systems break?",
                    "choices": ["Edit", "Publish", "Capture", "Review"],
                    "answer": 2,
                },
                {
                    "text": "What is the stated purpose of the monthly format review?",
                    "choices": [
                        "Adding new formats to keep the feed fresh",
                        "Killing formats that have not earned their production time",
                        "Reporting results to sponsors",
                        "Rewriting the style sheet",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which part of content production does the course say must never be delegated?",
                    "choices": [
                        "Editing video",
                        "Scheduling posts in advance",
                        "Capturing raw footage at training",
                        "Writing in your voice and posting opinions as you",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Monetization Architecture",
        "description": (
            "The business models available to an athlete audience, how a rate is built, and "
            "what should never be for sale."
        ),
        "lessons": [
            {
                "title": "Five Ways an Audience Becomes Income",
                "description": "Sponsorship, affiliate, product, service and licensing — with the trade-off each carries.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The five models

**1. Sponsorship.** A business pays for access to your audience and association
with your name. Highest headline value, lowest control, and the one that spends
the most trust per dollar.

**2. Affiliate.** You earn a share of sales you drive. Low barrier, honest when
disclosed, and it fails quietly if you promote things your audience does not
actually buy.

**3. Product.** Something you make and sell: merchandise, a training guide, a
camp. Highest margin and the most operational work, which athletes consistently
underestimate.

**4. Service.** Your time: lessons, clinics, speaking, training younger players.
Unscalable and frequently the most reliable early income for a high school
athlete.

**5. Licensing.** Someone pays to use your name, likeness or footage. Rare at
this level, and the category where the contract terms in CEO-202 matter most.

## The two questions before any of them

**Does my audience actually want this?** The Module 2 descriptions answer it. A
local audience of parents and students buys lessons and local products. It does
not buy a supplement subscription.

**What does it cost me in trust?** Every paid message draws down the asset from
Module 1. A sponsorship that fits your pillars costs little; one that does not
costs a great deal, and the fee rarely covers the difference.

## Eligibility runs underneath all five

Before any model is used, the state association and college association rules of
CEO-102 and CEO-202 apply. This module is about the business. The next course is
about what you are permitted to do with it.
""",
            },
            {
                "title": "Building a Rate You Can Defend",
                "description": "Pricing from deliverables and audience value instead of guessing, and what to do with the first offer.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Price the work, not the feeling

A defensible rate is built from four inputs, each of which you can show:

1. **Deliverables.** Exactly what the business receives: formats, quantity,
   where it is published, how long it stays up.
2. **Usage.** Can they reuse it in their own advertising? For how long, and
   where? Usage is routinely worth more than the post itself, and routinely
   given away free by athletes who were not asked about it.
3. **Exclusivity.** Are you agreeing not to work with their competitors? For how
   long, and in what category? Exclusivity is a cost to you and should be a line
   item.
4. **Your audience evidence.** The median figures from Module 2.

## Build a rate card

Three tiers, written down before anyone asks: a single post, a package, and a
season-long partnership. Having a number ready converts a nervous conversation
into a quote.

Price in time as well as money: a shoot that takes four hours is four hours out
of the CEO-101 matrix, and should be priced accordingly.

## Non-cash is still payment

Product, gear, meals, training access and exposure are compensation. They may
carry eligibility consequences and disclosure obligations exactly as cash does
— CEO-202 covers this. "They only sent me free product" is not a defence.

## The first offer

Say: *"Thank you — send me the details in writing and I'll come back to you
within two days."* That sentence costs nothing, breaks the urgency technique
from CEO-101's governance module, and gives your advisory bench time to look at
it.

## What is not for sale

The hard lines from your style sheet. Write them where money cannot find them,
because the fee will always sound like a good reason.
""",
            },
            {
                "title": "Rate Card and Deal Evaluation Sheet",
                "description": "Three-tier rate card template with a deliverables, usage and exclusivity checklist.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable sheet for Module 6. The rate card holds three tiers — single post,
package and season partnership — each listing deliverables, usage window,
exclusivity terms, production time and the fee.

The evaluation half is a checklist run against any incoming offer: what is being
asked for, what usage is implied, what exclusivity is hidden in the wording,
which pillar it fits, which hard line it approaches, the eligibility question it
raises, and the trust cost in one line.""",
            },
        ],
        "assignment": {
            "title": "Module 6 — Rate Card and a Real Offer Evaluation",
            "description": (
                "Price your work, then test the pricing against something concrete.\n\n"
                "Submit:\n"
                "1. A three-tier rate card: single post, package, season partnership. Each tier "
                "must specify deliverables, usage window, exclusivity terms, production time and "
                "fee.\n"
                "2. Your pricing reasoning, with the audience evidence from Module 2 that "
                "supports it.\n"
                "3. Which of the five monetization models fits your audience best and why, using "
                "your three audience descriptions.\n"
                "4. An offer evaluation. Use a real offer if you have one; otherwise take a "
                "realistic scenario — a local business offering free product plus $150 for three "
                "posts and the right to use your photo in their window for a year. Run the full "
                "checklist: deliverables, usage, exclusivity, pillar fit, hard lines, "
                "eligibility question, trust cost, and your decision.\n"
                "5. Your written first-response sentence, the one you will use when an offer "
                "arrives in person.\n\n"
                "Graded on whether the rate is built from inputs rather than guessed, and on "
                "whether the evaluation catches the usage and exclusivity terms."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 6 — Knowledge Check: Monetization",
            "description": "Four questions on business models, rate-building and non-cash compensation.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Which input does the lesson say athletes most often give away free without being asked about it?",
                    "choices": [
                        "The number of posts delivered",
                        "Usage rights to reuse the content in the business's own advertising",
                        "The platform the content is published on",
                        "The deadline for delivery",
                    ],
                    "answer": 1,
                },
                {
                    "text": "How should exclusivity be treated in a deal?",
                    "choices": [
                        "As a courtesy that costs the athlete nothing",
                        "As something to agree to verbally and settle later",
                        "As a cost to you, priced as its own line item",
                        "As a requirement of every sponsorship agreement",
                    ],
                    "answer": 2,
                },
                {
                    "text": "How does the course classify free product, gear, meals and training access?",
                    "choices": [
                        "As gifts, outside any disclosure or eligibility rules",
                        "As exposure, which carries no obligations",
                        "As a courtesy that does not need to be recorded",
                        "As compensation, with the same potential eligibility and disclosure consequences as cash",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What is the recommended first response to an in-person offer?",
                    "choices": [
                        "Thank you — send me the details in writing and I'll come back within two days",
                        "Give a price immediately so the business knows you are serious",
                        "Accept if the fee is above your lowest tier",
                        "Refer them straight to your coach",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Brand Book and Media Kit",
        "description": (
            "The capstone: two documents — the internal brand book and the external one-page "
            "media kit a business receives."
        ),
        "lessons": [
            {
                "title": "Two Documents, Two Readers",
                "description": "What belongs in the internal brand book and what belongs on the page a sponsor sees.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The brand book is for you

Internal. It holds everything: inventory, audience audits, style sheet, format
library, posting standard, rate card, hard lines, cleanup log. Nobody outside
your advisory bench reads it. Its job is to make your decisions consistent when
you are tired.

## The media kit is for them

External, one page, and ruthlessly short. A business owner gives it under two
minutes. It contains:

1. **Who you are** — name, sport, school, one line of positioning.
2. **Who your audience is** — the Module 2 descriptions, with the numbers that
   support them: size, location, age, median engagement.
3. **What you make** — your formats, with one or two examples.
4. **What is available** — your rate card tiers, or "packages from $X".
5. **Proof** — a previous partnership, a testimonial, local coverage. If you
   have none yet, say what you are looking for instead of padding.
6. **How to reach you** — one email address that you check.

## The design rule

Readable beats impressive. One page, your two colours, your typefaces, and
numbers large enough to find at a glance. Export it as a PDF so it looks the
same on every screen it lands on, and name the file with your name in it.

## The honesty rule

Every number must be screenshot-backed, dated and median rather than best. The
brand validator in this platform critiques a media kit in the voice of a local
business owner being pitched, and the first thing a business owner notices is a
number that does not look like it came from a real dashboard.
""",
            },
            {
                "title": "Maintaining Digital Property Over Four Years",
                "description": "The review calendar, the handover rules and what to do when a platform dies.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The maintenance calendar

- **Monthly:** audience audit, format review.
- **Each season:** style sheet review, cleanup pass, media kit numbers
  refreshed.
- **Annually:** rate card revision, pillar review, account security check —
  passwords, recovery emails and phone numbers that still exist.

Property that is not maintained depreciates quietly. An out-of-date media kit
circulating with two-year-old numbers is worse than none, because it is checkable.

## Handover rules

As you work with editors, agencies or a manager in CEO-301:

- **They get the style sheet.** Always, in writing.
- **They do not get your passwords.** Platforms support delegated access; use
  it. Password sharing is how athletes lose accounts they built.
- **You approve anything published as you.** No exceptions for speed.

## When a platform dies

Rented land eventually gets repossessed — platforms decline, change rules or
disappear, and audiences move. The athletes who survive each transition are the
ones with an owned list and a defined audience, because they can tell the people
who care where they went. Everyone else starts from zero.

Which closes the loop on Module 1: the point of all of this was never the
follower count. It was the property.
""",
            },
            {
                "title": "Media Kit and Brand Book Templates",
                "description": "One-page media kit layout plus the brand book table of contents.",
                "type": "DOCUMENT",
                "minutes": 20,
                "body": """Editable pair for the CEO-201 capstone. The media kit is a one-page layout with
placed sections for positioning, audience with evidence, formats with examples,
packages, proof and contact, sized for export as a PDF.

The brand book is a table of contents with a page stub for each section —
inventory, audience audits, style sheet, format library, posting standard, rate
card, hard lines, cleanup log — plus the maintenance calendar and a handover
page recording who has access to what and who approves what.""",
            },
        ],
        "assignment": {
            "title": "Capstone — Brand Book and Media Kit",
            "description": (
                "Produce both documents and put the external one in front of a real reader.\n\n"
                "Part A — The brand book. Assemble the work from Modules 1-6 into one internal "
                "document with a contents page: inventory, audience audit, cleanup log and "
                "posting standard, style sheet, format library, rate card and hard lines. Add "
                "the maintenance calendar with real dates.\n\n"
                "Part B — The media kit. One page, exported as a PDF named with your name. "
                "Positioning, audience with evidence, formats with examples, packages, proof, "
                "contact. Every number must be median and screenshot-backed.\n\n"
                "Part C — The pitch test. Show the media kit to one adult who runs or manages a "
                "local business and ask two questions: what would stop you working with this "
                "person, and what is missing? Write up their answers in 200-300 words and list "
                "the three changes you made afterwards.\n\n"
                "Part D — Upload your media kit to the Brand Validator on this platform and "
                "include one paragraph on where its critique agreed with your human reader and "
                "where it did not.\n\n"
                "Graded on the completeness of the brand book, the discipline and honesty of the "
                "media kit, and evidence that both reviews happened and changed the document."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: Brand Book and Media Kit",
            "description": "Four questions on the two documents and maintaining digital property.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the difference between the brand book and the media kit?",
                    "choices": [
                        "The brand book is internal and complete; the media kit is external and one page",
                        "The brand book is for sponsors; the media kit is for coaches",
                        "They are the same document with different covers",
                        "The brand book is published; the media kit is private",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What should a media kit do if you have no previous partnerships to show as proof?",
                    "choices": [
                        "Leave the section out entirely and hope it is not noticed",
                        "Use projected figures instead of past results",
                        "Say what you are looking for instead of padding the section",
                        "List unpaid posts as if they were partnerships",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why is an out-of-date media kit described as worse than having none?",
                    "choices": [
                        "Platforms penalise outdated promotional material",
                        "It circulates with old numbers that are checkable",
                        "It cannot be exported as a PDF",
                        "Sponsors are required to verify the date of issue",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which handover rule does the course state about working with an editor or agency?",
                    "choices": [
                        "They get full account passwords so they can work quickly",
                        "They may publish opinions as you if the style sheet allows it",
                        "They choose which content to approve during competition weeks",
                        "They get the style sheet, never the passwords, and you approve anything published as you",
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
            "Module 1's inventory. Everything that carries your name online, in one place — "
            "including the accounts you no longer control. The second table becomes your Module 3 "
            "cleanup plan."
        ),
        "sections": [
            {
                "heading": "1. What You Control",
                "paragraphs": [
                    "One row per asset. Owned survives a platform collapse; rented does not. If "
                    "you cannot log in and recover an account today, it belongs in section 2."
                ],
                "table": {
                    "columns": ["Platform / channel", "Handle", "Owned / earned / rented", "Audience size", "Last post", "Recovery current?"],
                    "rows": [["", "", "", "", "", ""] for _ in range(6)],
                },
            },
            {
                "heading": "2. What You Do Not Control",
                "table": {
                    "columns": ["Account or page", "Who runs it", "What it says about me", "Action"],
                    "rows": [["", "", "", ""] for _ in range(4)],
                },
            },
            {
                "heading": "3. Owned Audience Today",
                "bullets": [
                    "Fifty people on a list who open what you send are a real asset; a follower count a brand cannot verify is not.",
                    "The conversion habit is one sentence, repeated: “If you want the next one, there's a list.”",
                    "Ask two people who are not your friends what they expect from you before you arrive. Write down what they said, not what you hoped.",
                ],
                "fields": [
                    "Owned-audience number today",
                    "Where the list lives",
                    "The expectation I actually create (in their words)",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 2's audit sheet. Fifteen minutes a month, same day, same sheet. Six months of "
            "this is a document no competitor for the same sponsorship will have."
        ),
        "sections": [
            {
                "heading": "1. Monthly Tracker",
                "paragraphs": [
                    "Record the median, not the best post. A sponsor who signs on your best week "
                    "and gets your median week will not renew."
                ],
                "table": {
                    "columns": ["Month", "Followers", "Reach", "Median engagement %", "Saves", "Shares"],
                    "rows": [["", "", "", "", "", ""] for _ in range(6)],
                },
            },
            {
                "heading": "2. Demographic Snapshot",
                "paragraphs": [
                    "A local business cares about one thing above all else: how many of your "
                    "followers live within driving distance."
                ],
                "table": {
                    "columns": ["Dimension", "Figure", "Where I took it from", "Date"],
                    "rows": [
                        ["Age bands", "", "", ""],
                        ["Location — within 50 miles", "", "", ""],
                        ["Gender split", "", "", ""],
                        ["Most active hours", "", "", ""],
                    ],
                },
            },
            {
                "heading": "3. Three Audiences, One Sentence Each",
                "bullets": [
                    "Core: the largest coherent group.",
                    "Valuable: the group a sponsor would pay for — often not the largest. Parents are a frequent example.",
                    "Unintended: coaches, admissions officers, future employers, younger athletes copying you.",
                ],
                "fields": [
                    "Core audience",
                    "Valuable audience",
                    "Unintended audience",
                    "The one decision this data changes",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 3's cleanup log. Search yourself the way a recruiter will, then judge every "
            "item against the unintended audience — not against the friends it was made for. "
            "Content does not age in the room it was made in."
        ),
        "sections": [
            {
                "heading": "1. The Archaeology Pass",
                "bullets": [
                    "Your name in quotes, plus school, sport and town.",
                    "Every handle you have ever used, including abandoned ones.",
                    "Image search on name and handles.",
                    "Each platform's own search, logged out, so you see what a stranger sees.",
                    "Tagged content — what other people attached you to.",
                    "Old accounts you cannot log into. List them; recovery is a task, not a dead end.",
                ],
            },
            {
                "heading": "2. Item Log",
                "paragraphs": [
                    "Asset, neutral or liability — then delete, archive, contextualise or leave. "
                    "Deletion removes only the copy you control, so it is a cleanup tool, never a "
                    "crisis tool."
                ],
                "table": {
                    "columns": ["Where it lives", "Published", "Asset / neutral / liability", "Action", "Done"],
                    "rows": [["", "", "", "", ""] for _ in range(8)],
                },
            },
            {
                "heading": "3. Posting Standard, From Here On",
                "paragraphs": [
                    "Cleanup is one-off; the standard is permanent. Write categories, not examples, "
                    "and apply it to private messages too — the distinction between private and "
                    "public is a single screenshot wide."
                ],
                "fields": [
                    "Categories I do not post, publish or forward",
                    "Inaccessible accounts and their recovery status",
                    "Who tags me most, and when I spoke to them about this",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 4's style sheet. One page, because a style sheet nobody can apply in thirty "
            "seconds will not be applied. This is what makes a brand survive other people — a "
            "teammate filming you, a parent posting a highlight, an agency writing a caption."
        ),
        "sections": [
            {
                "heading": "1. Pillars and Voice",
                "paragraphs": [
                    "Three subjects you will return to for at least a year. The third is where "
                    "athlete brands separate from each other, because the first two are shared by "
                    "everyone in your sport."
                ],
                "table": {
                    "columns": ["Pillar", "One-line description", "Weekly without inventing it?", "Survives a bad season?"],
                    "rows": [["1 — The craft", "", "", ""], ["2 — The journey", "", "", ""], ["3 — Mine", "", "", ""]],
                },
                "fields": ["Voice — three adjectives", "Anti-description — what I never sound like"],
            },
            {
                "heading": "2. Visual and Verbal Rules",
                "table": {
                    "columns": ["Element", "The rule"],
                    "rows": [
                        ["Colours (exact values)", ""],
                        ["Typeface — titles / body", ""],
                        ["Cover image always has / never has", ""],
                        ["Logo or wordmark rule", ""],
                        ["Caption pattern", ""],
                        ["Words I use / words I don't", ""],
                        ["Disclosure line, written out in full", ""],
                    ],
                },
            },
            {
                "heading": "3. Hard Lines and Version",
                "paragraphs": [
                    "Three to five things you will not do regardless of the fee. Write them here "
                    "so the decision is already made when CEO-301 puts money on the table."
                ],
                "fields": ["Hard line 1", "Hard line 2", "Hard line 3", "Version / date", "Next seasonal review"],
            },
        ],
    },
    {
        "intro": (
            "Module 5's planner. Ideas run out in week three; templates do not. Set a floor you "
            "can hit in your hardest week, build formats from your pillars, and batch."
        ),
        "sections": [
            {
                "heading": "1. Format Library",
                "paragraphs": [
                    "A format is a template, not an idea. One card per repeatable format, at least "
                    "one per pillar."
                ],
                "table": {
                    "columns": ["Format", "Pillar", "Structure", "Production time", "Equipment"],
                    "rows": [["", "", "", "", ""] for _ in range(4)],
                },
            },
            {
                "heading": "2. Cadence and Batching",
                "bullets": [
                    "Set the floor, not the ceiling: the minimum you will publish in your hardest week of the year.",
                    "Capture daily — ten seconds of video or one photo, for the folder, not for publishing.",
                    "Batch on a light day. Two hours covers a fortnight.",
                    "Nothing is published between the warm-up and the post-match handshake.",
                ],
                "fields": ["My floor (posts per week)", "Normal week", "Batching day and time", "Daily capture habit"],
            },
            {
                "heading": "3. Monthly Format Review",
                "paragraphs": [
                    "Review exists to kill things. A format that has not earned its production "
                    "time in two months gets cut, and the hours go back to the CEO-101 matrix."
                ],
                "table": {
                    "columns": ["Format", "Hours spent", "Engagement earned", "Keep / kill"],
                    "rows": [["", "", "", ""] for _ in range(4)],
                },
            },
        ],
    },
    {
        "intro": (
            "Module 6's rate card and evaluation sheet. Price the work, not the feeling — a "
            "defensible rate is built from deliverables, usage, exclusivity and audience evidence, "
            "each of which you can show."
        ),
        "sections": [
            {
                "heading": "1. Three-Tier Rate Card",
                "paragraphs": [
                    "Three tiers written down before anyone asks turns a nervous conversation into "
                    "a quote. Price in time as well as money: a four-hour shoot is four hours out "
                    "of the matrix."
                ],
                "table": {
                    "columns": ["Tier", "Deliverables", "Usage window", "Exclusivity", "Production time", "Fee"],
                    "rows": [
                        ["Single post", "", "", "", "", ""],
                        ["Package", "", "", "", "", ""],
                        ["Season partnership", "", "", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Offer Evaluation Checklist",
                "paragraphs": [
                    "Run every incoming offer through this before replying. Usage is routinely "
                    "worth more than the post itself and routinely given away free."
                ],
                "table": {
                    "columns": ["Question", "Answer"],
                    "rows": [
                        ["What exactly is being asked for?", ""],
                        ["What usage is implied or stated?", ""],
                        ["What exclusivity is hidden in the wording?", ""],
                        ["Which pillar does it fit?", ""],
                        ["Which hard line does it approach?", ""],
                        ["What eligibility question does it raise?", ""],
                        ["What does it cost me in trust?", ""],
                    ],
                },
            },
            {
                "heading": "3. The First Response",
                "bullets": [
                    "Non-cash is still payment: product, gear, meals, training access and exposure are compensation.",
                    "Eligibility rules run underneath all five models — check before the first email, not after an offer.",
                    "Say the sentence, then stop. Two days is enough for your bench to look at it.",
                ],
                "fields": ["My first-response sentence, written out", "Who I send every offer to before replying"],
            },
        ],
    },
    {
        "intro": (
            "The CEO-201 capstone pair. The brand book is internal and complete; the media kit is "
            "external, one page, and gets under two minutes of a business owner's attention. Every "
            "number on the kit must be median, dated and screenshot-backed."
        ),
        "sections": [
            {
                "heading": "1. Media Kit — One Page",
                "table": {
                    "columns": ["Section", "What goes here", "Done"],
                    "rows": [
                        ["Who you are", "Name, sport, school, one line of positioning", ""],
                        ["Who your audience is", "Size, location, age, median engagement", ""],
                        ["What you make", "Your formats, with one or two examples", ""],
                        ["What is available", "Rate card tiers, or “packages from $X”", ""],
                        ["Proof", "A partnership, a testimonial, local coverage — or what you are looking for", ""],
                        ["How to reach you", "One email address you check", ""],
                    ],
                },
            },
            {
                "heading": "2. Brand Book Contents",
                "paragraphs": [
                    "Internal. Its job is to make your decisions consistent when you are tired."
                ],
                "bullets": [
                    "Digital asset inventory and what you do not control",
                    "Audience audits, month by month",
                    "Cleanup log and posting standard",
                    "Style sheet and format library",
                    "Rate card and hard lines",
                    "Maintenance calendar and handover page",
                ],
            },
            {
                "heading": "3. Maintenance and Handover",
                "paragraphs": [
                    "An out-of-date media kit circulating with two-year-old numbers is worse than "
                    "none, because it is checkable."
                ],
                "table": {
                    "columns": ["Rhythm", "What gets refreshed", "Next date"],
                    "rows": [
                        ["Monthly", "Audience audit, format review", ""],
                        ["Each season", "Style sheet, cleanup pass, media kit numbers", ""],
                        ["Annually", "Rate card, pillars, account security check", ""],
                    ],
                },
                "fields": ["Who has delegated access to what", "Who approves anything published as me"],
            },
        ],
    },
]
