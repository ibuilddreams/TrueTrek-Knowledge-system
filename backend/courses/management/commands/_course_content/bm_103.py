"""BM-103: Privacy, Security & Digital Boundaries.

Level 1: Digital Architecture. Written against the course's focus (protecting
the athlete's peace of mind and physical safety) and its core competencies:
managing direct messages, recognising digital extortion and scams, establishing
private versus public accounts, and dealing with online harassment or fan
toxicity.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).

Module 2 covers sextortion and Module 3 covers harassment and abuse. Both say
plainly that these are matters to report to a trusted adult the same day, not
problems for an athlete to manage alone.
"""

MODULES = [
    {
        "title": "Accounts, Access and the Public Line",
        "description": (
            "Locking down the accounts themselves, and deciding deliberately what is public "
            "and what is not."
        ),
        "lessons": [
            {
                "title": "Security Basics That Actually Matter",
                "description": "The small number of settings that prevent most account loss.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Why an athlete account is worth taking

A visible athlete's account has value to somebody else: an audience to scam, a
name to impersonate, and in some cases leverage. Accounts get taken regularly
and the recovery is slow, public and humiliating.

Almost all of it is prevented by four things.

## The four

**1. A different password on every account.** Reused passwords are the single
most common route in: one leaked site and everything else opens. A password
manager handles this; so does a written-down system kept somewhere safe.

**2. Two-factor authentication, everywhere.** An authenticator app is stronger
than a text message, because a phone number can be taken over. Turn it on for
email first — whoever controls your email controls every account that can reset
to it.

**3. Recovery details that are current.** An old phone number or a dead email
address is the reason an account becomes unrecoverable. Check them once a
season.

**4. Nobody else has your credentials.** Not a teammate, not a club account
manager, not somebody offering to "help grow it". If someone needs to post for
you, platforms have delegated access for exactly that — CEO-201 made the same
rule from the brand side.

## The warning signs of an account being taken

Logins from places you have not been, a changed recovery email, posts or
messages you did not send, friends asking why you messaged them.

Act immediately: change the password from a different device, revoke active
sessions, check the recovery details, and tell people the account was
compromised so they do not act on messages from it.

## Public devices and shared logins

Log out of anything on a school or shared machine. "Stay signed in" on a
library computer has ended more accounts than any sophisticated attack.
""",
            },
            {
                "title": "Public, Private, and the Second Account",
                "description": "Deciding what each account is for, rather than defaulting into it.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Decide, do not drift

Most athletes have accounts whose purpose nobody decided: one that was private
at twelve and became semi-public, one for friends that recruiters now follow,
and one nobody remembers.

Assign each a purpose, in writing:

- **Public** — the one in your recruiting emails and your media kit. Anyone can
  see it. Everything on it is on the record.
- **Private** — friends and people you actually know. Approved followers only.
- **Closed** — deleted or genuinely dormant, with no content on it.

Three categories. An account that does not fit one of them is a liability
because nobody is applying a standard to it.

## The private account is not a free space

The most important point in this lesson. A private account is a boundary, not
a protection:

- Followers screenshot.
- Followers change — somebody you approved at thirteen is a stranger at
  seventeen.
- Accounts get taken (Lesson 1).
- Platforms change defaults.

So the BM-101 standard applies to the private account too. What private
genuinely buys you is **audience**, not immunity: it is where you are ordinary
with people who know you, not where the rules stop.

## Prune the follower list

Once a season, on the private account: remove people you do not actually know.
Most athletes find a surprising number of accounts they approved years ago and
cannot identify.

That is not unfriendly. It is the only thing that makes "private" mean
anything.

## What belongs where

- **Public:** the pillars from BM-102, your work, your team, anything you would
  stand behind in an interview.
- **Private:** ordinary life, with the standard still applied.
- **Neither:** anything from BM-101's five flagged categories. There is no
  account where that is fine.

## Tell people which is which

Coaches, businesses and recruiters should be given the public one. Put it in
your email signature and your media kit so nobody has to guess, and so nobody
goes looking for the other one.
""",
            },
            {
                "title": "Location, Routine and Physical Safety",
                "description": "What posts reveal about where you are, and the habits that reduce the risk.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Content reveals patterns

Individually, posts are harmless. Together, they frequently publish a routine:
the gym you use and when, the route you run, the school, the car, the house in
the background, the fixture schedule anybody can look up.

For most athletes that is fine. For a visible one it is the information
somebody would need to find you, and athletes who become locally recognisable
sometimes discover this the hard way.

## The habits that reduce it

- **Turn off location tagging** by default. Add it deliberately when you want
  it, rather than having it on.
- **Post after, not during.** The single most effective habit: a photo of
  this morning's session posted this evening tells nobody where you are now.
- **Check backgrounds** for a house number, a street sign, a school crest, a
  number plate, a timetable on a wall.
- **Be careful with repetition.** The same location at the same time, posted
  weekly, is a schedule.
- **Do not publish travel in advance**, especially when it means the house is
  empty.

## Other people's safety

The same applies to teammates, siblings and friends in your posts — and they
did not choose a public presence. Ask before posting somebody else's location
or routine, particularly a younger child's.

## When somebody turns up

Occasionally a stranger appears at a venue, a school or a home. Most of the
time it is somebody enthusiastic and harmless, and occasionally it is not.

What to do, without exception:

- **Tell an adult the same day** — a parent, a coach, your school.
- **Do not engage privately** and do not agree to meet.
- **Keep the evidence**: messages, screenshots, times, descriptions.
- **If you feel unsafe, contact the police.** That is not an overreaction and
  it is what they are for.

An athlete who handles this alone because it feels like making a fuss is
taking a risk nobody is asking them to take.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Secure the Accounts and Draw the Line",
            "description": (
                "Lock them down, then decide what each one is for.\n\n"
                "Submit:\n"
                "1. Your account inventory: every account, with its purpose assigned — public, "
                "private or closed.\n"
                "2. Security status per account: unique password, two-factor authentication "
                "on, recovery email and phone current, and who else has access. Fix anything "
                "that is not in order and record what you changed and when.\n"
                "3. Email first: confirm two-factor is on for the email address your accounts "
                "recover to.\n"
                "4. The follower prune on your private account: how many you removed, and how "
                "many you could not identify.\n"
                "5. Your location habits: current settings, and the three changes you made.\n"
                "6. A background check: look at your last ten posts and list anything "
                "identifying visible in them — a street sign, a crest, a number plate, a "
                "timetable.\n"
                "7. Your plan if a stranger turns up at a venue or outside your home: who you "
                "tell, the same day, with a name.\n\n"
                "Graded on whether the security changes were actually made with dates, and on "
                "whether the background check found real detail in real posts."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Accounts and the Public Line",
            "description": "Four questions on security, account purposes and location.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which account should have two-factor authentication enabled first?",
                    "choices": [
                        "Your email — whoever controls it controls every account that resets to it",
                        "Your most-followed social account",
                        "Your recruiting profile",
                        "Any account with a payment method attached",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does a private account actually buy you?",
                    "choices": [
                        "Immunity from screenshots",
                        "Audience, not immunity — the posting standard still applies",
                        "Permanent deletion of old content",
                        "Protection from account takeover",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course call the single most effective location habit?",
                    "choices": [
                        "Removing all photos taken outdoors",
                        "Turning off the camera's GPS metadata",
                        "Posting after, not during",
                        "Using a private account for anything location-related",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should happen if a stranger turns up at a venue or outside your home?",
                    "choices": [
                        "Handle it quietly to avoid making a fuss",
                        "Respond privately to find out what they want",
                        "Wait to see whether it happens again",
                        "Tell an adult the same day, keep the evidence, do not engage, and contact the police if you feel unsafe",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Direct Messages, Scams and Extortion",
        "description": (
            "What arrives in an athlete's inbox, how the common scams work, and the one rule "
            "that defeats the worst of them."
        ),
        "lessons": [
            {
                "title": "Managing the Inbox",
                "description": "Sorting what arrives, and the settings that reduce it.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## What arrives

As visibility grows, the inbox fills with: genuine contact from coaches and
businesses, mass marketing from camps and services, people who want something,
strangers being friendly, strangers being unpleasant, and scams.

Sorting them is a skill, and the first move is reducing the volume.

## The settings

- **Restrict who can message you** to followers or people you follow, on the
  platforms that allow it.
- **Turn off message requests** from accounts with no mutual connection, where
  the option exists.
- **Filter or mute** rather than engaging. Muting is invisible to the other
  person and costs you nothing.
- **Do not reply to open an unknown request.** Reading it does not require
  replying, and a reply marks you as responsive.

## The three-way sort

**Real.** A named person at a named organisation, with specifics about you.
Reply, properly — REC-201's standards apply if it is recruiting.

**Mass.** A template with your name inserted. Reply briefly if it is from a
programme you care about; otherwise ignore.

**Suspicious.** Anything in Lesson 2's patterns. Do not reply; screenshot and
tell an adult if it escalates.

## Verify before you believe

A message claiming to be from a coach, a brand or an agency can be anybody.
Before acting on it:

- Check the account: age, followers, history, whether it is verified where that
  exists.
- **Contact the organisation through its own published channel** — the
  institution's directory, the business's website — rather than through the
  message.
- Ask an adult to look at it.

A genuine coach will not mind being verified. Anybody who objects to it has
told you what you needed to know.

## The one rule that covers most of it

**Nothing involving money, personal documents, passwords, or meeting in person
happens without an adult you trust knowing about it first.**

That single rule defeats most of what follows in the next lesson.
""",
            },
            {
                "title": "The Scams, and Sextortion",
                "description": "The common patterns aimed at young athletes, and exactly what to do about the worst one.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The common patterns

**The fake recruiter or agent.** Offers representation, exposure or a trial,
then requires a fee, a registration, or your personal details. Real
opportunities do not ask a seventeen-year-old for money up front, and REC-301
covers how actual representation works.

**The brand deal that needs a payment.** You are offered a sponsorship, then
asked to pay shipping, a deposit or a "verification" fee. No legitimate
sponsorship requires the athlete to pay anything.

**The fake payment.** You are overpaid with a fraudulent transfer and asked to
return the difference. The original payment is reversed later and the money you
sent is gone.

**The account verification message.** A link that looks like the platform,
asking you to log in. It captures your password. Platforms do not ask for your
password by message.

**The friendly stranger.** Weeks of ordinary conversation, then a request —
money, photos, or a meeting. The time invested is the technique.

## Sextortion

This one is named separately because it is the most serious and it targets
young athletes specifically.

The pattern: someone builds contact, moves the conversation to a private app,
encourages an intimate image, and then threatens to send it to your followers,
your team or your family unless you pay or send more.

**What to do, immediately:**

1. **Stop replying.** Do not pay. Paying never ends it and marks you as
   someone who pays.
2. **Do not delete anything.** Screenshot the account, the messages and the
   username — that evidence is what an investigation needs.
3. **Tell a trusted adult today.** A parent, a teacher, a coach, the police.
4. **Report and block** the account on the platform.
5. **Know this:** you are not the person in trouble. These are organised
   criminal operations that target thousands of people, they are extremely
   good at it, and being caught by one is not a failure of character.

The thing they rely on entirely is your silence. Telling somebody in the first
hour collapses it.

## The prevention

Creating or sharing sexual images of anyone under eighteen is a serious
criminal matter — including images of yourself, including between people the
same age, and including when it was consensual at the time. CEO-303 makes the
same point from the relationships side.

So the rule is simple, absolute and worth writing into your standard: **no
intimate images, to anybody, ever.** There is no version of it that is safe,
and no relationship in which it becomes safe.
""",
            },
            {
                "title": "Money, Documents and Meeting People",
                "description": "The three categories that need an adult, every time.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Money

Nothing financial happens through a direct message. Not a payment, not banking
details, not a gift card, not a crypto transfer, not an "investment".

If a genuine sponsorship arises, it runs through the process in CEO-202 and
BM-301: a written agreement, a guardian's signature, an invoice, a bank account
in your name. Nothing in that sequence begins in an inbox.

**Never send money to receive money.** That sentence alone defeats most
financial scams aimed at young people.

## Documents and identity

Do not send: a passport, a birth certificate, a student ID, a social security
number, a school timetable, a home address, or a photograph of a bank card.

Legitimate organisations collect those through secure, verifiable processes —
an official portal, a compliance office — and an adult is involved. The first
request for identity documents is a reason to stop and verify, not to comply
quickly in case the opportunity disappears.

## Meeting in person

Somebody you met online wants to meet. Three rules:

1. **An adult knows** — who, when, where, and how long.
2. **A public place**, in daylight, with somebody with you.
3. **You can leave at any point**, and you have a way home that does not
   depend on them.

That applies to a "scout", a "photographer", an "agent" and anybody else. The
people for whom this is inconvenient are precisely the people it protects you
from.

## The pressure tell

Every one of these scams uses urgency: a deadline, a limited place, an offer
that expires, a threat. CEO-101's governance module named urgency as the oldest
sales technique there is, and it is the clearest single signal in this course.

**Urgency plus a request for money, documents or secrecy is a scam until
proven otherwise.**

## Secrecy is the biggest signal of all

Anyone who tells you not to tell your parents, your coach or your school is
telling you something important about themselves. There is no legitimate
opportunity in sport that requires a minor to keep it secret from the adults
responsible for them.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Inbox Rules and the Scam Audit",
            "description": (
                "Set the rules before something arrives that tests them.\n\n"
                "Submit:\n"
                "1. Your message settings on each platform, before and after, with what you "
                "changed.\n"
                "2. The three-way sort applied to your actual inbox: take ten recent messages "
                "or requests and classify each as real, mass or suspicious, with the reason.\n"
                "3. Your verification process: the exact steps you would take before acting on "
                "a message claiming to be from a coach or a brand, including the published "
                "channel you would use instead of the message.\n"
                "4. The one rule, written out in your own words.\n"
                "5. The five scam patterns, each described in one line, plus one real example "
                "you or somebody you know has received.\n"
                "6. The sextortion response, written as five numbered steps you could follow "
                "while frightened, with the adult you would tell named.\n"
                "7. Your rules for money, documents and meeting in person.\n"
                "8. One paragraph on the secrecy signal: why does anybody asking you to keep "
                "something from your parents or coach tell you what you need to know?\n\n"
                "Graded on whether the settings were actually changed, on the quality of the "
                "classification, and on whether the sextortion steps name a real adult."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Messages, Scams and Extortion",
            "description": "Four questions on inbox management, scams and sextortion.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What is the single rule that defeats most of these scams?",
                    "choices": [
                        "Nothing involving money, documents, passwords or meeting happens without a trusted adult knowing first",
                        "Never reply to anyone you have not met",
                        "Keep all accounts private",
                        "Report every message request",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the first thing to do if someone threatens to share an intimate image?",
                    "choices": [
                        "Pay to make it stop and deal with it afterwards",
                        "Stop replying, do not pay, keep the evidence, and tell a trusted adult today",
                        "Delete the conversation and block the account",
                        "Negotiate privately for its deletion",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course say sextortion operations rely on entirely?",
                    "choices": [
                        "The victim's lack of technical knowledge",
                        "Access to the victim's followers",
                        "Your silence — telling somebody in the first hour collapses it",
                        "Payment in untraceable currency",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does it mean when somebody tells you not to tell your parents or coach?",
                    "choices": [
                        "The opportunity is genuinely confidential",
                        "They are protecting a competitive advantage",
                        "It is standard in professional recruitment",
                        "There is no legitimate opportunity in sport that requires a minor to keep it secret from responsible adults",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Harassment and Toxicity",
        "description": (
            "Handling criticism, pile-ons and abuse — what to ignore, what to report, and "
            "where the line is."
        ),
        "lessons": [
            {
                "title": "Criticism, Toxicity and Abuse Are Different",
                "description": "Three categories with three different responses.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Telling them apart matters

**Criticism.** Somebody thinks you played badly, or disagrees with you. Often
rude, occasionally useful, not a safety matter.

*Response:* ignore it. Engaging with criticism online has never once improved
an athlete's situation, and the audience for your reply is not on your side.

**Toxicity.** Pile-ons, mockery, repeated unpleasantness, people enjoying a bad
performance. Unpleasant and generally not dangerous.

*Response:* mute, block, restrict, and reduce exposure. Do not reply, do not
screenshot it to your own followers, and do not let somebody else's entertainment
set your week.

**Abuse.** Racist, sexist, homophobic, religious or disability-based abuse;
sexual content directed at you; threats of violence; targeting your family;
anything involving a minor.

*Response:* **this is not something to manage.** Screenshot it, report it to the
platform, and tell an adult — your coach, your school, your parents, and the
police where there is a threat. Many governing bodies and leagues have reporting
routes specifically for this.

## Why the distinction is the whole lesson

Athletes routinely treat all three the same way — usually by absorbing it —
and the cost is that the third category goes unreported because the first two
taught them that online unpleasantness is simply part of it.

It is not. Criticism is part of it. Abuse is a separate thing with its own
route, and you are entitled to use it.

## Nothing is owed to the comments

You do not have to read them, reply to them, or treat strangers' opinions as
feedback. The people whose views should affect you are the ones in the building
— a coach, a teammate, somebody who has watched you all season.

## Turn the volume down

Comment filters, keyword blocks, limiting comments to followers, turning
comments off after a difficult result: all legitimate, all reversible, none an
admission of anything.

Elite athletes do this routinely. It is not thin skin; it is removing a
distraction that has no upside — the same argument MT-302 made about attention.
""",
            },
            {
                "title": "When It Escalates",
                "description": "Pile-ons, sustained harassment and the reporting routes that exist.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## A pile-on

A post or a clip spreads and hundreds of strangers arrive at once. It is
frightening, it is usually short, and almost everything about it is outside
your control.

What helps:

- **Stop reading.** Hand your phone to somebody else for the evening if you
  need to — athletes do this and it works.
- **Post nothing.** Anything you say becomes fuel, and BM-303's first-hour rule
  applies.
- **Tell an adult** so you are not the only person who knows.
- **Lock the account temporarily** if it is overwhelming. You can reopen it in
  a week.
- **Expect it to pass.** Attention moves on quickly, far more quickly than it
  feels in the first evening.

## Sustained harassment

One person or a small group, repeatedly, over time. Different from a pile-on
and more serious, because it has an author.

- **Keep a record.** Dates, screenshots, usernames, what was said. A log is
  what makes a report actionable.
- **Report every instance** to the platform.
- **Tell your school and your club.** Both usually have policies and neither
  can help with something they do not know about.
- **Escalate to the police** where there are threats, where it involves
  stalking, or where it continues after reporting.
- **Do not engage**, including to tell them to stop, which is what sustained
  harassment is seeking.

## The routes that exist

- **Platform reporting**, which is the weakest but creates a record.
- **Your school's safeguarding or pastoral lead.**
- **Your club or governing body**, many of which now have discrimination
  reporting systems.
- **The police**, for threats, stalking, or abuse that is criminal.
- **An adult who will stay involved** — the most important one, because the
  others all work better with an adult pushing.

## Say it out loud

Athletes under-report because it feels like weakness, because they assume
nothing will happen, or because they do not want to be a distraction.

None of those is a good reason, and all three are what makes it continue. A
report that changes nothing immediately still creates a record, and records are
what make the second report work.
""",
            },
            {
                "title": "Protecting Your Head",
                "description": "The habits that keep online noise from affecting performance and mood.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The cost is attention and mood

Online noise is not merely unpleasant. It costs the attention MT-202 described
and it affects sleep, which CEO-302 made a performance issue.

So managing it is not sensitivity. It is the same category as managing load.

## The habits that work

**Post and leave.** Publish, then close the app. Checking the response every
ten minutes is where most of the damage happens.

**Nothing in the hour before sleep.** The worst possible time to read a comment
section, and the one most athletes do it in.

**No phone around competition.** MT-201 removed it from the final hour before;
the hour afterwards matters just as much, because that is when judgement is
poorest.

**A set time to check.** Once or twice a day, deliberately, rather than
continuously.

**Somebody else reads them**, in a difficult week. A parent or a teammate can
tell you if there is anything you actually need to see, which there rarely is.

## Comparison

Underrated and corrosive: scrolling teammates' and rivals' highlight reels
after a bad performance. It is not harassment and it does more damage to more
athletes than harassment does.

Mute accounts that make you feel worse, including people you like. Muting is
invisible, reversible, and nobody finds out.

## When it is affecting you

If online abuse or pressure is affecting sleep, mood, appetite or your
willingness to compete — that is past the point of settings and habits.

Tell an adult, and if it persists beyond two weeks talk to a counsellor, a
physician or a school welfare lead. MT-202's boundary applies here unchanged:
these conditions are common, treatable, and the usual barrier is waiting.

**Any thought of self-harm is an immediate conversation with a trusted adult or
a crisis line, today.**

## The thing to hold onto

A presence is worth having. BM-102 built one deliberately, and BM-301 turns it
into something valuable. None of that requires you to absorb abuse, read every
comment, or treat strangers as an audience you owe something to.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Boundaries, Reporting Routes and Habits",
            "description": (
                "Decide the responses and find the routes before you need them.\n\n"
                "Submit:\n"
                "1. The three categories in your own words — criticism, toxicity, abuse — with "
                "a real example of each from your own experience or from something you have "
                "seen.\n"
                "2. Your decided response to each, written as a sentence.\n"
                "3. Your platform settings: comment filters, keyword blocks, who can comment, "
                "message restrictions — what you have enabled.\n"
                "4. The reporting routes, researched and named for real: your school's "
                "safeguarding or pastoral lead, your club or governing body's reporting system, "
                "the platform's route, and the police non-emergency contact. Names and "
                "contacts, not categories.\n"
                "5. Your record-keeping plan for sustained harassment: what you would log and "
                "where.\n"
                "6. Your pile-on plan: the four things you would do in the first evening.\n"
                "7. Your attention habits: post-and-leave, the hour before sleep, around "
                "competition, and your set checking time.\n"
                "8. One paragraph on comparison: whose content makes you feel worse, and what "
                "will you do about it?\n\n"
                "Graded on whether the reporting routes are real named contacts, and on the "
                "honesty of part 8."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Harassment and Toxicity",
            "description": "Four questions on the three categories, escalation and attention.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the response to abuse — racist, sexist, homophobic, sexual or threatening content?",
                    "choices": [
                        "Screenshot, report to the platform, and tell an adult — it is not something to manage",
                        "Mute and move on, as with toxicity",
                        "Reply once to make the boundary clear",
                        "Ignore it unless it repeats",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does the course say the distinction between the three categories is the whole lesson?",
                    "choices": [
                        "Because platforms treat them differently",
                        "Because athletes absorb all three the same way, so abuse goes unreported",
                        "Because criticism is the most damaging",
                        "Because only abuse can be blocked",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What makes a sustained-harassment report actionable?",
                    "choices": [
                        "Replying to establish a record of the exchange",
                        "Reporting only the most serious instance",
                        "A log — dates, screenshots, usernames, what was said",
                        "A statement from a teammate",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say does more damage to more athletes than harassment?",
                    "choices": [
                        "Platform algorithm changes",
                        "Negative press coverage",
                        "Losing followers after a poor season",
                        "Comparison — scrolling teammates' and rivals' highlights after a bad performance",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
