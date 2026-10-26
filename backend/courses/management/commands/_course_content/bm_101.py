"""BM-101: The Digital Footprint & Reputation Audit.

Level 1: Digital Architecture — the first course of The Branding & Marketing
Pathway. Written against the course's focus (cleaning up the past to prepare
for the future) and its core competencies: a deep clean of existing social
media, the permanence of digital actions, and what college coaches look for and
flag during recruiting sweeps.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).
"""

MODULES = [
    {
        "title": "What a Recruiting Sweep Looks For",
        "description": (
            "Who actually searches an athlete online, what they are looking for, and the "
            "categories that end a recruitment."
        ),
        "lessons": [
            {
                "title": "Who Is Searching, and When",
                "description": "The people who run a search on you, and the point in the process at which they do it.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## It is routine, not exceptional

Searching a recruit online is standard practice. It is quick, free, and most
staff have had one bad experience that made it policy.

Who does it, and when:

- **A college coach**, usually before the first real contact and again before
  an offer.
- **A recruiting coordinator**, as part of building a board.
- **An admissions office**, at some institutions.
- **A local business**, before a sponsorship — BM-301's subject.
- **A journalist**, the first time you do anything notable.
- **Future employers**, long after the sport ends.

## What they are actually doing

Not admiring your highlights. They are **looking for a reason to stop**.

That sounds harsh and it is simply the economics: a coach has more candidates
than places, and the cheapest way to shorten a list is to remove anyone who
looks like a risk. A search takes ninety seconds and can save them a problem
that costs a season.

## The five categories that get flagged

1. **Abuse or discrimination** — racist, sexist, homophobic or otherwise
   targeted content, including a reply or a like from four years ago.
2. **Violence and criminality** — including things posted as jokes.
3. **Substances** — alcohol, vaping, drugs, in photos or captions.
4. **Disrespect** — toward coaches, teammates, officials, opponents or your own
   school.
5. **Poor judgement about recruitment** — complaining publicly about playing
   time, selection or a programme that stopped calling.

That last one is the most common among athletes who are otherwise careful, and
it is entirely self-inflicted.

## What they are hoping to find

Something ordinary. A person who trains, thanks people, supports teammates and
posts about something other than themselves. The bar is not impressive — it is
*unremarkable*, and most athletes clear it easily once they have looked.
""",
            },
            {
                "title": "Searching Yourself Properly",
                "description": "Running the same sweep a coach would, and finding what they would find.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Do it better than they will

You have one advantage: you know every handle you have ever used. Work through
all of them.

## The sweep, in order

1. **Your name in quotes**, plus your school, your sport and your town.
2. **Every handle you have used**, including abandoned ones and ones you think
   are deleted.
3. **Image search** on your name and on your handles.
4. **Each platform's own search**, logged out, in a private window — because a
   stranger does not see what you see when signed in.
5. **Tagged content.** What other people posted and attached you to, which you
   did not write and which still has your face on it.
6. **Comments and replies**, which athletes forget entirely and which are
   public.
7. **Old accounts** you cannot log into. List them; recovery is a task, not a
   dead end.

## Record everything in one place

One row per item: where it lives, a link, roughly when it was posted, and who
could see it.

The list is the deliverable. Judging it comes next, and judging while searching
produces a sweep that quietly skips the uncomfortable parts.

## The things athletes miss

- **Replies and comments** on other people's posts.
- **Group chats that were screenshotted** and posted somewhere public.
- **Old accounts** from a different sport, a different school, a gaming handle.
- **Tagged photos** from parties, holidays and nights out.
- **A friend's public account** full of pictures of you.
- **Anything in a different name** — a nickname you used at thirteen.

## Ask one other person

Give an adult your name and your handles and ask them to search independently.
They find different things, because search results differ by account, device
and location — and they will tell you how it reads to somebody who does not
know you.
""",
            },
            {
                "title": "Judging What You Found",
                "description": "Sorting the list into keep, neutral and problem, against the right reader.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Three columns

**Asset.** It supports the kind of person you want to appear to be: your work,
your team, your school, your interests, somebody else being congratulated.

**Neutral.** It does nothing either way. Most of what you find is here, and it
should stay.

**Problem.** It falls into one of Module 1's five categories, it embarrasses a
future reader, or it puts somebody else at risk.

## Judge it against the right reader

Not the friends it was made for. Against **a coach who has never met you, a
teacher, an admissions officer, your grandmother, and a younger athlete who
copies what you do.**

That panel is not imaginary — all five of those people will see some of it.
Content does not stay in the room it was made in, and something funny at
fourteen among friends reads very differently in a staff office at nine in the
morning.

## The honest grey area

Some things are not clearly either. A caption that is a bit much, a photo that
is fine but unflattering, a joke that has aged badly without being offensive.

Two useful questions:

- *Would I be comfortable explaining this to a coach, in one sentence, without
  getting defensive?*
- *If this were the only thing somebody saw, what would they conclude?*

## Do not over-sanitise

An account with nothing on it reads as managed, which is its own kind of
warning sign. The target is an ordinary presence belonging to a real person —
not a brochure.

Module 2 is what you actually do with the problem column, and the answer is
not always deletion.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Run the Sweep on Yourself",
            "description": (
                "Search yourself the way a coach would, and record what you find.\n\n"
                "Submit:\n"
                "1. Your handle list: every username you have used, including abandoned ones "
                "and any you believe are deleted.\n"
                "2. The sweep, all seven steps, with a log of at least fifteen items: where it "
                "lives, a link, roughly when it was posted, and who can see it.\n"
                "3. Evidence you searched logged out, in a private window.\n"
                "4. The three-column sort: asset, neutral or problem, with the reason for "
                "anything marked a problem.\n"
                "5. Your inaccessible accounts, and the recovery step you have taken for each.\n"
                "6. The second searcher: give an adult your name and handles and ask them to "
                "search independently. Record what they found that you did not, and how they "
                "said it reads.\n"
                "7. One paragraph on the grey area — something that is not clearly fine or "
                "clearly a problem — and how you decided.\n\n"
                "If you find nothing in the problem column, say so and show the search. A clean "
                "result with evidence is a full-credit answer.\n\n"
                "Graded on the thoroughness of the sweep, on whether the second searcher was "
                "actually used, and on the judgement shown in the sort."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: The Recruiting Sweep",
            "description": "Four questions on who searches, what they look for, and how to audit yourself.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is a coach actually doing when they search a recruit online?",
                    "choices": [
                        "Looking for a reason to stop — the cheapest way to shorten a list",
                        "Assessing athletic ability from posted footage",
                        "Checking follower counts for marketing value",
                        "Confirming contact details",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which flagged category does the course say is most common among otherwise careful athletes?",
                    "choices": [
                        "Substances in photographs",
                        "Public complaints about playing time, selection or a programme that stopped calling",
                        "Violent content posted as a joke",
                        "Disrespect toward officials",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why must the platform searches be run logged out, in a private window?",
                    "choices": [
                        "Platforms hide results from signed-in users",
                        "It prevents the search being recorded",
                        "A stranger does not see what you see when signed in",
                        "It is required to search old accounts",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say about an account with nothing on it?",
                    "choices": [
                        "It is the safest possible position",
                        "It is what coaches prefer to see",
                        "It is neutral and carries no signal",
                        "It reads as managed, which is its own kind of warning sign",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Deep Clean",
        "description": (
            "What to do with each problem item — delete, archive, untag, contextualise or "
            "leave — and the limits of deletion."
        ),
        "lessons": [
            {
                "title": "Five Responses, Not One",
                "description": "Choosing the right action for each item instead of deleting everything.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Deletion is one option of five

**Delete.** For anything that is simply wrong to have published — the five
categories from Module 1. Fast, free, and the right answer more often than
athletes expect.

**Archive.** Most platforms let you hide a post without destroying it. Useful
for content that is not a problem but is no longer representative — the version
of you from three years ago.

**Untag or request removal.** For things other people posted. You can usually
remove the tag yourself; for the post itself you have to ask, and asking
politely works more often than athletes think.

**Contextualise.** For something public, documented and already known, where a
silent deletion would look worse than an acknowledgement. Rare at this stage
and occasionally the right call.

**Leave it.** Not everything imperfect is a problem. An ordinary presence
includes ordinary posts.

## Work in order of risk

Start with anything in the five flagged categories, then anything involving
somebody else, then the merely unrepresentative. An afternoon handles most
accounts.

## Asking somebody to take something down

> *"Hey — could you take down the photo from [event]? Nothing against it, I'm
> just cleaning up my accounts for recruiting. Appreciate it."*

Short, no accusation, gives a reason. Almost always works, and the few times it
does not, you have at least untagged yourself.

## Private accounts are not a cleanup

Making an account private hides it from a casual search. It does not remove
anything, it does not stop screenshots, and a follower who turns out to know a
coach is one forward away.

Privacy settings are a boundary, which BM-103 covers properly. They are not an
alternative to deleting something that should not exist.

## Do it before the outreach, not after

An athlete who starts a recruiting campaign and cleans up afterwards has
already been searched. The cleanup goes first — which is why this is the first
course in the pathway.
""",
            },
            {
                "title": "What Deletion Cannot Do",
                "description": "Screenshots, archives and the realistic limits of taking something down.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## It removes your copy

Deletion removes the copy **you control**. It does not remove:

- Screenshots, which people take constantly and for no reason.
- Reposts and shares on accounts you have never heard of.
- Web archive services, which capture public pages automatically.
- Anything already saved, downloaded or sent in a message.
- Press coverage and anything written about it elsewhere.

## Plan on the assumption that anything published may still exist

That is not a reason to skip the cleanup — removing your copy is worth doing
and it removes the easiest route to finding it. It is a reason to understand
what cleanup is: it lowers the probability, it does not create certainty.

## The consequence for how you post now

If deletion is imperfect, the only reliable control is **what you publish in
the first place**. That shifts most of the work from cleanup to the standard
in Module 3.

The useful version of that realisation is not fear. It is simply that the
decision point is before posting, where it costs nothing, rather than after,
where it may cost everything.

## The screenshot test

Before posting, ask: *if somebody screenshotted this and showed it to a coach,
a teacher and my grandmother in three years, is it fine?*

Three seconds, and it removes almost everything you would later want to
delete.

## When something is already circulating

If something is out of your hands and spreading, that is a different problem
from a cleanup — it is a crisis, and BM-303 handles it. The short version:
tell an adult, do not respond publicly in the first hour, and preserve rather
than delete, because you may need the record.
""",
            },
            {
                "title": "Cleaning Up Around Other People",
                "description": "Tags, group content, and the friends whose accounts are part of your footprint.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Your footprint includes other people's accounts

A large share of what a search finds was posted by somebody else: teammates,
friends, family, a club account, a school page, a local newspaper.

You cannot delete those, and you can change them more than you think.

## The three moves

**1. Untag yourself.** Immediate, within your control, and it breaks the
easiest link between your name and the content.

**2. Ask.** Politely, individually, with a reason. Most people agree.

**3. Tell people your standard.** The highest-leverage move and the one almost
nobody makes:

> *"I'm trying to keep my accounts clean for recruiting — can you check with me
> before posting photos of me?"*

One conversation with the two or three people who tag you most prevents more
future problems than any amount of retrospective deleting.

## Group chats

Treat a group chat as public. Not because it is, but because the distinction
between private and public is **one screenshot wide**, and screenshots of group
chats are the single most common source of athlete embarrassment.

Nothing in a group chat about a teammate, a coach, an opponent or an official
that you would not say with them in the room.

## Protect other people too

Some of what you post is about somebody else — a teammate having a bad game, a
friend in a photo they would not choose, a younger sibling.

They did not sign up for your recruitment and they have not run this audit.
Asking before posting is the same courtesy you are asking for, and it is the
thing that makes the request reasonable when you make it.

## The cleanup is finished when

Every flagged item is handled, the inaccessible accounts have a recovery plan,
the tags are managed, and the two or three people who post about you most know
your standard.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Execute the Clean",
            "description": (
                "Act on the list from Module 1.\n\n"
                "Submit:\n"
                "1. Your action log: every problem item with the response chosen — delete, "
                "archive, untag, ask, contextualise or leave — and the date it was done.\n"
                "2. Counts: how many you deleted, archived, untagged and asked about.\n"
                "3. The asks: the message you sent to at least one person requesting a "
                "takedown, and what happened.\n"
                "4. Your inaccessible accounts: the recovery steps taken and the current "
                "status of each.\n"
                "5. The limits of deletion, in your own words, and what that changes about how "
                "you post.\n"
                "6. The conversation: tell the two or three people who tag you most what your "
                "standard is. Record what you said and how it was received.\n"
                "7. The screenshot test, written out as you would actually ask it before "
                "posting.\n\n"
                "Graded on whether the actions were genuinely taken with dates, on whether the "
                "takedown request was really sent, and on whether the standard conversation "
                "happened."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Deep Clean",
            "description": "Four questions on cleanup responses and the limits of deletion.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does making an account private actually achieve?",
                    "choices": [
                        "It removes the content permanently",
                        "It hides it from a casual search but removes nothing and does not stop screenshots",
                        "It prevents coaches from finding the account at all",
                        "It is equivalent to deleting the problem posts",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does deletion remove?",
                    "choices": [
                        "Every copy, everywhere",
                        "The content and any screenshots of it",
                        "The copy you control — not screenshots, reposts, archives or saved copies",
                        "Nothing of any practical value",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course call the highest-leverage move around other people's posts?",
                    "choices": [
                        "Untagging yourself from everything",
                        "Asking for individual takedowns",
                        "Blocking accounts that post about you",
                        "Telling the people who tag you most what your standard is",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Why should a group chat be treated as public?",
                    "choices": [
                        "The distinction between private and public is one screenshot wide",
                        "Platforms publish group content by default",
                        "Coaches request access to team group chats",
                        "Group chats are legally public records",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Permanence and the Standard",
        "description": (
            "Writing the rule that prevents the next cleanup, and keeping the footprint clean "
            "from here on."
        ),
        "lessons": [
            {
                "title": "Why the Standard Beats the Cleanup",
                "description": "Moving the decision from after posting to before it.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## A cleanup is a one-off; a standard is permanent

Module 2 dealt with the past. Everything from here is a choice made before
posting, where it is free.

A standard is a short written rule about what you publish. It works because it
converts a judgement made in the moment — frequently late at night, frequently
while annoyed — into a decision already taken.

## Write categories, not examples

> *"I don't post about teammates' mistakes, officials, or anything I would not
> say with the person in the room. I don't post about recruitment while I'm
> frustrated. Nothing with alcohol in it."*

Categories cover the thing you have not thought of yet. A list of examples does
not.

## The rules that matter most for an athlete

- **Nothing about teammates, coaches, officials or opponents** that is
  critical.
- **Nothing about recruitment while frustrated.** Wait a day; you will not want
  to post it.
- **Nothing about another person without their agreement.**
- **No substances, no violence, no targeted content** — the Module 1 list.
- **Private messages count.** Same standard, because of the screenshot.

## The waiting rule

The single most useful line in this course:

> *Nothing goes up within an hour of feeling strongly about it.*

Almost everything an athlete regrets posting was posted inside that hour. An
hour's delay removes most of it and costs nothing — the post is still available
tomorrow if it was a good idea.

## Tell somebody your standard

A rule other people know about is easier to keep and easier to invoke. It also
means somebody will say something if you drift, which is what you want.
""",
            },
            {
                "title": "Keeping It Clean",
                "description": "The review habit, the accounts to re-check, and what to do when something slips.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Re-run the sweep each season

Twenty minutes, twice a year. Your own handles, tags, comments and anything new
in your name.

Things accumulate quietly: a tag from a party, a comment you forgot, a reply on
somebody else's thread, a new account somebody made about your team.

## Keep the account list current

New platforms, new handles, deleted accounts, accounts somebody else runs about
you. Maintain one list, because you cannot sweep what you cannot name.

## Security is part of the footprint

An account you lose control of becomes somebody else's post under your name.
BM-103 covers this properly; at minimum:

- Strong, different passwords.
- Two-factor authentication on every account.
- Recovery email and phone kept current.
- Nobody else holds your credentials.

A hacked athlete account posting something appalling is a real and recurring
event, and the cleanup afterwards is far harder than the prevention.

## When something slips

It will. A post you regret, a reply that reads badly, a tag you did not catch.

1. **Take it down**, if it is yours.
2. **Do not argue** with anyone who noticed.
3. **If it has spread**, stop and go to BM-303 — a crisis is a different
   process from a cleanup.
4. **Tell an adult** if it involves anybody else, or if you are being
   threatened with it.

One mistake handled calmly is survivable. The damage usually comes from the
response, not the post.

## What this buys you

By the end of this course you have a clean, ordinary, searchable presence and a
rule that keeps it that way. That is the foundation the rest of the pathway
builds a brand on — BM-102 defines what the brand stands for, and nothing in it
works if a search turns up something from four years ago.
""",
            },
            {
                "title": "What Good Looks Like",
                "description": "The standard a finished audit meets, and the reader test.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## The finished state

- Every account you own is listed, and you can log into each one.
- Two-factor authentication is on everywhere.
- A logged-out search of your name and handles turns up nothing from the five
  flagged categories.
- Tagged content is reviewed and the worst of it untagged.
- The two or three people who post about you know your standard.
- You have a written standard with categories, including a waiting rule.
- A seasonal re-sweep is in your calendar.

## The reader test

Give your handles to an adult who does not know you well — a teacher, a family
friend, a coach from another club — and ask two questions:

1. *What kind of person does this look like?*
2. *Is there anything here you would not want a college coach to see?*

Their answers are the real result of this course. An athlete who hears "you
look like someone who works hard and likes their team" has achieved the
objective.

## What you are not trying to be

Not impressive. Not polished. Not a brand yet — BM-102 starts that.

**Unremarkable, in the good sense.** Nothing that stops a conversation. That
is the whole job of this course, and clearing it puts you ahead of a
surprising share of athletes who have never looked.

## And the long view

The search that matters most may not be a coach's. Employers search, graduate
programmes search, and people you have not met yet search before deciding
whether to work with you.

Everything you have done here keeps working long after the sport does — which
is the argument the whole Branding & Marketing Pathway is built on.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Write the Standard and Pass the Reader Test",
            "description": (
                "Finish the audit and put something in place that prevents the next one.\n\n"
                "Submit:\n"
                "1. Your written posting standard: categories rather than examples, including "
                "teammates and officials, recruitment while frustrated, other people, the five "
                "flagged categories, and private messages.\n"
                "2. Your waiting rule, written as a sentence.\n"
                "3. Your account list, complete, with login status and whether two-factor "
                "authentication is on for each.\n"
                "4. Evidence of the security work: what you changed and when.\n"
                "5. Your seasonal re-sweep dates, in a real calendar.\n"
                "6. The reader test: give your handles to an adult who does not know you well "
                "and ask the two questions. Record their answers in their words.\n"
                "7. What you changed after the reader test.\n"
                "8. One paragraph on the finished state: which of the seven items on the "
                "checklist are true for you today, and what is outstanding?\n\n"
                "Graded on whether the standard uses categories, on evidence of the security "
                "work, and on whether the reader test actually happened with a real person."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Permanence and the Standard",
            "description": "Four questions on the posting standard and keeping the footprint clean.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does the course say to write a standard as categories rather than examples?",
                    "choices": [
                        "Categories are shorter to write",
                        "Categories cover the thing you have not thought of yet",
                        "Examples are harder to remember",
                        "Coaches ask to see the categories",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the waiting rule?",
                    "choices": [
                        "Wait a week before posting anything about recruitment",
                        "Post only at scheduled times each day",
                        "Nothing goes up within an hour of feeling strongly about it",
                        "Wait until a parent has approved the post",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why is account security part of the footprint?",
                    "choices": [
                        "An account you lose control of becomes somebody else's post under your name",
                        "Platforms rank secure accounts higher",
                        "Coaches check whether two-factor authentication is enabled",
                        "It is required before a recruiting profile can be created",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is this course trying to make your presence?",
                    "choices": [
                        "Impressive and highly produced",
                        "Entirely empty of personal content",
                        "A polished personal brand",
                        "Unremarkable in the good sense — nothing that stops a conversation",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
