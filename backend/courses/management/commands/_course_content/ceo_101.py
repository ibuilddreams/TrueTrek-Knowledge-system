"""CEO-101: The Athlete CEO Mindset & Enterprise Foundations.

Level 1: Foundational Executive Readiness — the first course of The Athlete CEO
Pathway. Written against the course's own focus (the move from athlete to Chief
Executive Officer of "Me, Inc.") and its three core competencies: time/energy
management matrixes, personal governance models, and multi-year athletic,
academic and professional OKRs.
"""

MODULES = [
    {
        "title": "Me, Inc.: The Enterprise Behind the Jersey",
        "description": (
            "Reframes the athlete as the chief executive of a small enterprise, and names the "
            "assets that enterprise already owns."
        ),
        "lessons": [
            {
                "title": "You Are Already Running a Business",
                "description": "Why the athlete-as-enterprise frame is a description, not a metaphor.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The business you did not know you started

The day a coach outside your school first asked about you, a business opened. It
has revenue potential, a reputation, a customer list, and a founder who has never
been handed the job description. That founder is you.

Most athletes are trained to be the product: show up, perform, be evaluated. A
chief executive does something different. A CEO decides **what the enterprise is
for**, what it will and will not do, and how its limited resources get spent this
week. Nobody appoints you to that chair. You either sit in it or you leave it
empty, and an empty chair gets filled by whoever is loudest — an agent, a group
chat, a relative with an idea.

## What changes when you take the chair

- **Requests become decisions.** "Can you post this?" stops being a favour and
  starts being a business question with a yes, a no, or a price.
- **Your calendar becomes a budget.** Hours are the one asset you cannot borrow
  more of.
- **Your name becomes an asset with a balance.** Every post, interview and group
  chat either deposits into it or withdraws from it.

## The standard for this course

By the end of CEO-101 you will have written the founding documents of Me, Inc.:
an operating calendar, a short set of governance rules, and a four-year set of
objectives covering sport, school and career. None of it is theory. Each one is a
document you will actually use next week.
""",
            },
            {
                "title": "The Five Assets on Your Balance Sheet",
                "description": "Skill, platform, reputation, time and health — and why only one of them is replaceable.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Five assets, one of them renewable

A balance sheet lists what an enterprise owns. Yours has five entries, and
ranking them honestly is the first executive act of this course.

**1. Athletic skill.** The asset everyone sees. It is also the most fragile: it
depends on a body, a position, and a depth chart you do not control.

**2. Platform.** Followers, email lists, a local newspaper that quotes you, a
coach who answers calls on your behalf. Reach is worth nothing on its own and a
great deal when it is pointed somewhere.

**3. Reputation.** What a stranger believes about you before you walk in. It
compounds slowly and collapses quickly, which makes it the asset most worth
protecting with rules rather than with judgement in the moment.

**4. Time.** Finite, non-transferable and the one asset every other asset is
built out of. A season has roughly 1,100 waking hours in it.

**5. Health.** Physical and mental. Treated as a cost in most athletic cultures;
treated as plant and equipment by every serious operator.

## The honest ranking

Write the five in the order you have actually been investing in them over the
last month — not the order you believe in. For most athletes the real order
starts with skill and ends with health, while the sustainable order rarely does.
The gap between those two lists is the work of this course.
""",
            },
            {
                "title": "Me, Inc. Starter Workbook",
                "description": "Printable balance-sheet and asset-audit worksheet for this module.",
                "type": "PDF",
                "minutes": 20,
                "body": """Downloadable workbook for Module 1. Inside: the five-asset balance sheet laid
out as a fill-in table, an honest-ranking exercise comparing where your hours
went last month against where you believe they should go, and a one-page
"Founder's Snapshot" you will carry into every later module of CEO-101.

Print it or annotate it digitally, then keep it — Module 7 asks you to compare
your closing Enterprise Brief against the snapshot you take today.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Your Me, Inc. Founding Snapshot",
            "description": (
                "Write a one-page founding snapshot of your enterprise.\n\n"
                "Include all four sections:\n"
                "1. The one-liner. In a single sentence, what is Me, Inc. for? Name the person "
                "you are becoming, not the sport you play.\n"
                "2. The balance sheet. List your five assets (skill, platform, reputation, time, "
                "health) and give each a one-line honest assessment of its current state.\n"
                "3. The ranking gap. Rank the five by where your hours actually went last month, "
                "then by where they should go. Explain the biggest gap in two or three sentences.\n"
                "4. The empty chair. Name one decision in the last six months that someone else "
                "effectively made for you, and what you would decide now.\n\n"
                "Format: 400-600 words, submitted as a document or typed directly into the "
                "submission box.\n\n"
                "Graded on honesty and specificity, not polish. A vague snapshot that sounds "
                "impressive scores lower than a blunt one with real numbers in it."
            ),
            "total_marks": 100,
            "due_in_days": 7,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: The Enterprise Behind the Jersey",
            "description": "Four questions on the Me, Inc. frame and the five-asset balance sheet.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "In the Me, Inc. model, what is the chief executive's actual job?",
                    "choices": [
                        "Performing at the highest possible level every single day",
                        "Deciding what the enterprise is for and how its limited resources get spent",
                        "Replying to every brand and recruiter who makes contact",
                        "Keeping the follower count growing month over month",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which of the five assets is described as the one every other asset is built out of?",
                    "choices": ["Platform", "Reputation", "Time", "Athletic skill"],
                    "answer": 2,
                },
                {
                    "text": "According to the lesson, what happens when an athlete leaves the executive chair empty?",
                    "choices": [
                        "Nothing — decisions simply wait until the athlete is ready",
                        "The coaching staff is legally obliged to decide on the athlete's behalf",
                        "Whoever is loudest ends up making the decisions instead",
                        "The enterprise pauses until a parent signs for it",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does the course call reputation the asset most worth protecting with rules rather than in-the-moment judgement?",
                    "choices": [
                        "It compounds slowly but collapses quickly",
                        "It is the only asset that can be insured",
                        "It is the easiest asset to rebuild after damage",
                        "It has no effect on athletic skill or health",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Org Chart of One",
        "description": (
            "Separates the three hats every athlete wears — player, manager, owner — and sets "
            "who holds which decision."
        ),
        "lessons": [
            {
                "title": "Player, Manager, Owner: Three Hats, One Person",
                "description": "The three roles you switch between daily, and what goes wrong when they blur.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Three jobs, one body

Every enterprise of one runs three jobs at once, and confusing them is the most
common operating failure in this course.

**The player** executes. In practice, in the classroom, in the weight room. The
player's only question is "am I doing this rep properly?" The player does not
negotiate, does not read contracts and does not check analytics mid-set.

**The manager** schedules and coordinates. The manager owns the calendar,
replies to the email, books the trainer, tracks the GPA and chases the
paperwork. Managers think in weeks.

**The owner** decides direction and takes the risk. Which schools are on the
list? Is this partnership worth the eligibility question it raises? Do we take
the summer off from the travel circuit? Owners think in years.

## Why the blur costs you

An athlete who answers DMs between sets is managing while trying to play — and
doing both badly. An athlete who signs a deal in the car park because it feels
rude to wait is playing owner with no preparation. The tell is always the same:
a decision gets made in the wrong state of mind, on somebody else's clock.

## The fix is scheduling, not willpower

Each hat gets its own time. Player time is protected and phone-free. Manager
time is a fixed block — many athletes use thirty minutes after dinner. Owner
time is rarer and deliberate: one hour a week, plus any decision that will still
matter in a year. Nothing with a real cost gets decided outside owner time.
""",
            },
            {
                "title": "Your Advisory Bench: Who Gets a Vote and Who Gets a Voice",
                "description": "Mapping the people around you into advisers, stakeholders and spectators.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Voice is not the same as vote

Everybody around an athlete has an opinion. The executive question is narrower:
whose opinion changes the decision? Sort the people in your life into three
groups and the noise drops immediately.

**Advisers** have expertise and no conflict of interest. A counsellor who knows
eligibility rules. A coach who has moved athletes through this before. A family
member who is good with money. Advisers get a voice and, on their subject, close
to a vote.

**Stakeholders** carry real consequences from your decisions — parents or
guardians, siblings, a team that depends on you, sometimes a school. They are
owed honesty, early notice and a hearing. They do not automatically get a vote,
and pretending otherwise is how athletes end up resenting the people closest to
them.

**Spectators** have opinions and no stake: group chats, comment sections, a
cousin's friend who "knows a guy". They get neither.

## Build the bench before you need it

The worst time to find an adviser is the week an offer lands. Name one person
for each of these now: eligibility and academics, money, health, and media. Some
slots will be empty, and an empty slot is useful information — it is the first
item on your Module 7 brief.

## The conflict-of-interest test

Ask one question of anyone offering advice: **what changes for them if I say
yes?** An answer of "nothing" is the strongest adviser credential there is.
""",
            },
            {
                "title": "Decision Rights Map (Worksheet)",
                "description": "Editable table for assigning every recurring decision to a hat and a reviewer.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable worksheet for Module 2. The first table lists the recurring decisions
an athlete faces — training changes, posting, travel, spending, interviews,
school choices — with a column for which hat owns it (player, manager, owner)
and which adviser is consulted before it is made.

The second table is your advisory bench: four named slots (eligibility and
academics, money, health, media), the person in each, what changes for them if
you say yes, and the date you last spoke. Empty slots are meant to stay visible.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Decision Rights and Advisory Bench",
            "description": (
                "Complete and submit both halves of your decision rights map.\n\n"
                "Part A — Decision rights. List at least eight recurring decisions in your "
                "current life. For each one, name the hat that owns it (player, manager or "
                "owner) and the adviser, if any, who is consulted first. At least two decisions "
                "must be ones you have historically made in the wrong state of mind.\n\n"
                "Part B — Advisory bench. Fill the four slots: eligibility and academics, money, "
                "health, media. For each named person, answer the conflict test in one line: "
                "what changes for them if you say yes? Leave a slot empty if it is genuinely "
                "empty and write one sentence on how you plan to fill it.\n\n"
                "Part C — One paragraph. Describe a decision from the past year that a "
                "spectator influenced more than they should have.\n\n"
                "Graded on completeness, the honesty of the conflict test, and whether the "
                "ownership assignments match how decisions actually get made in your week."
            ),
            "total_marks": 100,
            "due_in_days": 10,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Roles, Advisers and Decision Rights",
            "description": "Four questions on the three hats and the adviser/stakeholder/spectator split.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which hat owns the question “is this partnership worth the eligibility risk?”",
                    "choices": ["The player", "The manager", "The owner", "The team captain"],
                    "answer": 2,
                },
                {
                    "text": "What single question does the course use as a conflict-of-interest test for anyone giving advice?",
                    "choices": [
                        "How long have you worked in sport?",
                        "What changes for you if I say yes?",
                        "Have you ever played at this level?",
                        "Can you put that in writing?",
                    ],
                    "answer": 1,
                },
                {
                    "text": "A parent who will drive you to every out-of-state tournament is best classified as which of the following?",
                    "choices": [
                        "A spectator, because they are not a professional adviser",
                        "An adviser, because family always has your interests at heart",
                        "A stakeholder, because they carry real consequences from your decisions",
                        "None of the above — family sits outside the model",
                    ],
                    "answer": 2,
                },
                {
                    "text": "According to the lesson, the fix for blurred roles is primarily a matter of:",
                    "choices": [
                        "Scheduling each hat its own protected time",
                        "Willpower and discipline in the moment",
                        "Hiring a professional manager as early as possible",
                        "Reducing the number of decisions you make each year",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Time and Energy Matrix",
        "description": (
            "Builds the course's central operating tool: a weekly matrix that budgets hours "
            "against the energy each one actually costs."
        ),
        "lessons": [
            {
                "title": "Hours Are the Budget, Energy Is the Currency",
                "description": "Why a calendar that balances on paper still fails in practice.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Two different shortages

Most athlete calendars fail twice. The first failure is arithmetic: more
commitments than hours. That one is obvious and gets fixed by subtraction.

The second is invisible. Two hours of film study and two hours of a difficult
family conversation occupy the same space on a calendar and cost completely
different amounts. **Hours are the budget; energy is the currency.** A week can
balance perfectly on paper and still be unsurvivable.

## Classify every block twice

For every recurring block in your week, record two things:

- **Cost** — does this block *drain*, *sustain* or *restore* you? Be empirical.
  Judge it by how you feel ninety minutes afterwards, not by whether you enjoy
  it.
- **Return** — does it build an asset (skill, platform, reputation, health) or
  merely maintain the status quo?

## The four quadrants

Plot cost against return and four groups appear:

1. **High return, restorative** — training you love, sleep, time with people who
  settle you. Protect first.
2. **High return, draining** — hard conditioning, difficult coursework,
  negotiation. Necessary. Must be *surrounded* by restoration, not stacked.
3. **Low return, restorative** — genuine rest. Keep enough; it is cheap.
4. **Low return, draining** — group chats, obligation events, commutes that
  could be avoided. Everything you cut comes from here first.

## The rule that follows

Never schedule two quadrant-2 blocks back to back. That single rule fixes more
broken weeks than any productivity system.
""",
            },
            {
                "title": "Running a Seven-Day Audit",
                "description": "The measurement step: counting where the hours really went before changing anything.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Measure first, cut second

Athletes reorganise their week from memory, and memory is generous. Before any
block moves, run a seven-day audit. It takes about four minutes a day.

## The method

Every evening, write down the day in thirty-minute blocks. Not what you intended
— what happened. Tag each block with one of six labels: **sport**, **school**,
**body** (sleep, food, recovery, treatment), **enterprise** (posting, email,
meetings about you), **people**, **drift**.

Drift is the honest one. It is time that went somewhere you cannot name. Most
athletes find between eight and fourteen hours of it in a week, and finding it is
usually the single biggest win of this course.

## Reading the result

At the end of the week, total each label and answer three questions:

1. Which label got more hours than you would have guessed?
2. Which of your five assets got the least investment?
3. What was the longest unbroken stretch of restorative time you had? If the
   answer is under four hours in seven days, the week was not survivable; it was
   merely survived.

## What to change

Change one thing. Move or delete a single recurring block and re-run the audit
the following week. Changing five things at once teaches you nothing, because
you will never know which change worked.
""",
            },
            {
                "title": "Weekly Time and Energy Matrix (Template)",
                "description": "Printable seven-day grid with the audit labels and the four-quadrant plot.",
                "type": "PDF",
                "minutes": 15,
                "body": """Downloadable template for Module 3. Page one is the seven-day audit grid in
thirty-minute rows with the six labels (sport, school, body, enterprise, people,
drift) ready to tick.

Page two is the four-quadrant matrix — cost against return — with space to plot
every recurring block from your audit and a checklist for the back-to-back rule:
no two draining, high-return blocks scheduled against each other.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Seven-Day Audit and Matrix",
            "description": (
                "Run the audit for seven consecutive days, then submit the analysis.\n\n"
                "Submit three things:\n"
                "1. Your completed seven-day grid (photo or scan of the template is fine), with "
                "every block labelled sport, school, body, enterprise, people or drift.\n"
                "2. Your totals per label, plus your drift total in hours and minutes.\n"
                "3. A 250-350 word analysis answering: which label surprised you, which of your "
                "five assets was under-invested, what your longest unbroken restorative stretch "
                "was, and the ONE recurring block you are moving or deleting next week.\n\n"
                "Do not change your week while you are measuring it. An audit of an unusually "
                "well-behaved week is worthless.\n\n"
                "Graded on completeness of the seven days, the honesty of the drift number, and "
                "whether the single change you chose follows from your own data."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Time, Energy and the Audit",
            "description": "Four questions on budgeting hours against energy and reading a seven-day audit.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the course mean by “hours are the budget, energy is the currency”?",
                    "choices": [
                        "Energy can be bought with enough money, but hours cannot",
                        "Two blocks of equal length can cost wildly different amounts to get through",
                        "Hours should always be scheduled before energy is considered",
                        "Only paid work should be counted in a weekly budget",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which quadrant does the course say every cut should come from first?",
                    "choices": [
                        "High return, draining",
                        "High return, restorative",
                        "Low return, restorative",
                        "Low return, draining",
                    ],
                    "answer": 3,
                },
                {
                    "text": "In the seven-day audit, what is the “drift” label for?",
                    "choices": [
                        "Time spent travelling between commitments",
                        "Time that went somewhere you cannot name",
                        "Unscheduled extra training",
                        "Time lost to injury or illness",
                    ],
                    "answer": 1,
                },
                {
                    "text": "After the first audit, how many recurring blocks does the course tell you to change?",
                    "choices": [
                        "One, so you can tell whether the change worked",
                        "All of the low-return ones at once",
                        "Half of them, then reassess in a month",
                        "None until you have audited for a full season",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Personal Governance: The Rules You Set Before You Need Them",
        "description": (
            "Turns values into written rules and decision filters that hold up under pressure, "
            "money and short notice."
        ),
        "lessons": [
            {
                "title": "Why Rules Beat Judgement Under Pressure",
                "description": "The case for deciding in advance, and the three pressures that break in-the-moment judgement.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Judgement is a resource, and it runs out

Every governance model exists for one reason: the quality of a decision drops
when it is made under pressure. For an athlete, three pressures do most of the
damage.

**Time pressure.** "We need an answer tonight." Urgency is the oldest sales
technique in existence, and it works because a rushed brain defaults to pleasing
whoever is in the room.

**Money pressure.** The first offer with a real number attached is disorienting,
particularly when a family's situation makes that number mean something.

**Relationship pressure.** The request comes from someone you cannot easily
refuse — a cousin, an old coach, a teammate's father.

## A rule is a decision you have already made

Personal governance is simply writing decisions down while you are calm, so that
the version of you under pressure only has to *apply* them. "I do not sign
anything the same day I am shown it" is not a personality trait. It is a rule,
and it survives a room that a preference would not.

## What a good rule looks like

- **Specific.** "I will be careful with money" is a wish. "Nothing over $200 is
  spent without 24 hours and one adviser" is a rule.
- **Observable.** Someone else could tell whether you followed it.
- **Pre-committed out loud.** A rule your parents, coach and closest friends
  know about costs other people less to respect and costs you less to invoke.
""",
            },
            {
                "title": "Writing Your Five Non-Negotiables",
                "description": "A workable format for personal rules, plus the amendment process that keeps them honest.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Five is the right number

Fewer than five and you have slogans. More than ten and you have a document
nobody — including you — can recall in the moment that matters. Five
non-negotiables, memorised, is the working standard for this course.

Most athletes end up with one rule in each of these areas:

1. **Time.** What is protected no matter who asks. ("Sleep before 10:30pm on a
   school night, and nothing moves it.")
2. **Money.** A threshold, a waiting period and a named adviser.
3. **Voice.** What you will not post, say or lend your name to, written as a
   category rather than a list of examples.
4. **Access.** Who can reach you directly and how. Everyone else goes through a
   channel you check on your own schedule.
5. **Body.** The health line you will not cross for a result.

## The format

Write each rule as: **In this situation, I do this, and here is why.** The "why"
is not decoration. It is what lets you decline without arguing, because you are
reporting a standard, not negotiating a preference.

## Amendment, not abandonment

A rule you break twice is either the wrong rule or the right rule with no
support behind it. Review the five at the end of each season. Change them
deliberately, in writing, when you are calm — never in the room where the
pressure is. Quietly abandoning a rule under pressure is the one failure mode
governance exists to prevent.
""",
            },
            {
                "title": "Personal Governance Charter (Template)",
                "description": "Fill-in charter with the five rule slots, the decision filter and the amendment log.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable charter for Module 4. Section one holds your five non-negotiables in
the required format — situation, action, reason — one per area: time, money,
voice, access, body.

Section two is the four-question decision filter to run before any yes: does it
cross a rule, who is pressuring the timeline, which asset does it build or
spend, and what does a no cost me? Section three is the amendment log: every
change dated, with the reason and the adviser consulted, so a rule can never be
quietly dropped.""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Your Personal Governance Charter",
            "description": (
                "Write and submit your charter.\n\n"
                "Required sections:\n"
                "1. Five non-negotiables, one each for time, money, voice, access and body. Use "
                "the format: in this situation, I do this, and here is why. Each rule must be "
                "specific enough that someone else could tell whether you followed it.\n"
                "2. Your decision filter — the four questions you will run before saying yes to "
                "anything with a real cost.\n"
                "3. A pressure test. Describe one real situation from the past year, then walk "
                "through what your charter would have told you to do. Be specific about whether "
                "the outcome would have changed.\n"
                "4. Pre-commitment. Name the three people you will tell about these rules this "
                "week, and why each of them needs to know.\n\n"
                "Graded on specificity and observability of the rules, and on whether the "
                "pressure test is a genuine situation rather than a comfortable one."
            ),
            "total_marks": 100,
            "due_in_days": 10,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: Personal Governance",
            "description": "Four questions on pre-committed rules, their format and amendment.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the core argument for writing rules in advance rather than deciding case by case?",
                    "choices": [
                        "Written rules are legally enforceable against the other party",
                        "Decision quality drops under time, money and relationship pressure",
                        "Rules remove the need to consult advisers",
                        "Coaches require athletes to document their decisions",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which of the following meets the course's standard for a usable rule?",
                    "choices": [
                        "I will always put my family first",
                        "I will try to be careful about what I post",
                        "Nothing over $200 is spent without 24 hours and one adviser",
                        "I will stay focused on my goals this season",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does the course cap the charter at five non-negotiables?",
                    "choices": [
                        "Five is the maximum a compliance office will review",
                        "Fewer leaves gaps, and more cannot be recalled in the moment that matters",
                        "Each rule must map to one member of the advisory bench",
                        "Five rules are required before signing any NIL agreement",
                    ],
                    "answer": 1,
                },
                {
                    "text": "According to the lesson, when should a rule be changed?",
                    "choices": [
                        "Deliberately and in writing, when you are calm — never in the pressured room",
                        "Immediately, whenever following it becomes inconvenient",
                        "Only after it has been broken at least three times",
                        "Never; a non-negotiable is permanent by definition",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Multi-Year OKRs: Athletic, Academic, Professional",
        "description": (
            "Writes objectives and key results across a four-year window so sport, school and "
            "career goals stop competing by accident."
        ),
        "lessons": [
            {
                "title": "Objectives and Key Results, Translated for Athletes",
                "description": "What an OKR is, how it differs from a goal, and the three-lane structure this course uses.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Goals versus OKRs

"Get a scholarship" is a goal. It is also useless on a Tuesday in February,
because it tells you nothing about what to do today and you cannot tell whether
you are on track.

An **OKR** splits that into two parts:

- The **Objective** — qualitative, directional, memorable. *Become a recruitable
  two-way player with no academic question marks.*
- The **Key Results** — three to five measurable outcomes that, if all true,
  mean the objective happened. *Cumulative GPA at or above 3.4. Verified film
  from eight games. Contact made with 20 target programmes.*

The discipline is in the second half. A key result must be a number or a
yes/no fact that someone else could verify. "Work harder on film" is not a key
result. "Twelve film sessions logged, one per week" is.

## Three lanes, one enterprise

Athletes who write goals in only one lane end up sabotaged by another. CEO-101
uses three:

1. **Athletic** — performance, availability, exposure.
2. **Academic** — eligibility, GPA, coursework that leaves future doors open.
3. **Professional** — the enterprise itself: brand, money, network, skills that
   outlast your playing career.

Each lane gets one objective per year. Three objectives a year, four years,
twelve in total. That is the whole plan.

## Yearly, not vague

A four-year plan written as one block becomes a wish. Written as four years of
three objectives, it becomes something you can review every quarter and correct
while there is still time to correct it.
""",
            },
            {
                "title": "Sequencing Four Years Without Collisions",
                "description": "Finding the conflicts between lanes and sequencing around the fixed dates you do not control.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The calendar you do not control

Before sequencing anything, write down the fixed dates: season windows, exam
periods, eligibility deadlines, registration dates, the recruiting calendar for
your sport. These are not negotiable and most athletic plans fail because they
were written as if they were.

## Finding the collisions

Lay your twelve objectives against those fixed dates and look for three
collision types:

- **Lane collisions.** An athletic objective requiring a summer of travel sits
  on top of an academic objective requiring summer coursework.
- **Energy collisions.** Two objectives that both demand quadrant-2 effort in
  the same months (Module 3's matrix is the tool here).
- **Dependency collisions.** A professional objective that assumes a platform
  you have not built yet, or a recruiting objective that assumes film you have
  not shot.

## Sequencing rules

1. **Eligibility first, always.** An academic key result that gates everything
   else goes earliest. There is no version of this plan that survives an
   eligibility problem.
2. **Build dependencies before the things that need them.** Film before contact.
   Audience before monetisation. Reputation before ask.
3. **Leave one lane quiet each season.** If every lane is at maximum in the same
   six months, the plan is a wish.

## Review on a schedule

Score each key result quarterly: on track, at risk, or missed. The purpose is
not grading yourself. It is catching an at-risk result while four months of
runway remain.
""",
            },
            {
                "title": "Four-Year OKR Planner (Worksheet)",
                "description": "Twelve-objective planner with key-result slots, the fixed-date calendar and the quarterly scoring sheet.",
                "type": "DOCUMENT",
                "minutes": 20,
                "body": """Editable planner for Module 5. The first page is the fixed-date calendar: season
windows, exam periods, eligibility and registration deadlines for all four
years.

The second is the OKR grid — four years down, three lanes across (athletic,
academic, professional), each cell holding one objective and three to five
measurable key results. The third is the quarterly scoring sheet with on
track / at risk / missed columns and a note field for the correction you made.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Your Four-Year OKR Plan",
            "description": (
                "Build and submit the full plan.\n\n"
                "Required:\n"
                "1. Fixed-date calendar. List the dates you do not control across the next four "
                "years: season windows, exam periods, eligibility and registration deadlines.\n"
                "2. Twelve objectives. One athletic, one academic and one professional objective "
                "for each of the next four years.\n"
                "3. Key results. Three to five per objective for YEAR ONE only. Every key result "
                "must be a number or a verifiable yes/no fact. Later years may stay at objective "
                "level.\n"
                "4. Collision analysis. Identify at least two collisions (lane, energy or "
                "dependency) in your plan and state how you resequenced to resolve them.\n"
                "5. Review date. The specific date of your first quarterly scoring session.\n\n"
                "Graded on measurability of the year-one key results, on whether eligibility is "
                "sequenced first, and on the quality of the collision analysis."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: Multi-Year OKRs",
            "description": "Four questions on objectives, key results and four-year sequencing.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Which of these is a properly written key result?",
                    "choices": [
                        "Get noticed by more college coaches",
                        "Verified film from eight games uploaded by 1 December",
                        "Improve my attitude in team settings",
                        "Be the hardest worker in the gym this season",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What are the three lanes the course requires an objective in, every year?",
                    "choices": [
                        "Athletic, academic, professional",
                        "Training, nutrition, recovery",
                        "Social, financial, spiritual",
                        "Offence, defence, special teams",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which sequencing rule does the course put first and treat as non-negotiable?",
                    "choices": [
                        "Monetise the platform as early as possible",
                        "Leave one lane quiet each season",
                        "Eligibility first — an academic result that gates everything goes earliest",
                        "Contact every target programme before shooting film",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the stated purpose of scoring key results quarterly?",
                    "choices": [
                        "To grade your own performance for your advisers",
                        "To catch an at-risk result while there is still runway to correct it",
                        "To satisfy an eligibility reporting requirement",
                        "To decide which lane to abandon for the year",
                    ],
                    "answer": 1,
                },
            ],
        },
    },
    {
        "title": "The Operating Cadence",
        "description": (
            "Installs the review rhythm — weekly, monthly and end-of-season — that keeps the "
            "plan alive after the enthusiasm fades."
        ),
        "lessons": [
            {
                "title": "The Weekly Executive Review",
                "description": "A twenty-minute standing meeting with yourself, and the five questions it answers.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## A standing appointment, not a mood

Every plan in this course dies the same way: it is written in a burst of
enthusiasm and never opened again. The fix is a standing appointment — same day,
same time, twenty minutes, no exceptions. Most athletes run it Sunday evening,
after the week is over and before the next one starts.

## The five questions

1. **What moved?** Name one key result from your OKR plan that advanced, with
   the evidence. If nothing moved, say so plainly; a week with no movement is
   information, not a failure.
2. **What is at risk?** Which key result is now behind, and what is the smallest
   correction?
3. **Where did the week leak?** Your drift number from the Module 3 audit. One
   figure, honestly reported.
4. **What decision is waiting?** Anything sitting in your inbox or your head
   that needs owner time. Decide it here, in a calm chair, not on the way out of
   practice.
5. **What does next week protect?** Name the one block that is immovable.

## Writing it down matters

Keep the answers in one running document. Twenty weeks of answers is the most
accurate picture of an enterprise that exists — more honest than memory, and
more useful than any highlight reel when you later need to explain to an adviser
or a coach what you have actually been doing.
""",
            },
            {
                "title": "Monthly Close and the Season Retrospective",
                "description": "The two longer reviews: a monthly scorecard and an end-of-season retrospective that changes the rules.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Monthly close: the numbers

Once a month, spend forty-five minutes on the figures rather than the feelings.
Four of them:

- **Hours by label** from your audit — sport, school, body, enterprise, people,
  drift.
- **OKR scoring** — each key result marked on track, at risk or missed.
- **Asset movement** — did skill, platform, reputation, time and health go up,
  flat or down this month, with one line of evidence each.
- **Money in and out**, if there is any. Even twenty dollars of NIL income
  starts a habit you will want before the numbers get serious.

A monthly close you dread is usually a monthly close you are doing in too much
detail. Four figures and a sentence each is enough.

## Season retrospective: the rules

At the end of each season, run a longer session with three questions:

1. **What did the season prove?** A belief you held in September that the season
   confirmed or destroyed.
2. **Which rule failed?** Go through the five non-negotiables from Module 4. Any
   rule broken more than once gets amended in writing or supported properly —
   it does not get quietly dropped.
3. **What is the one structural change?** Not five resolutions. One change to
   how the enterprise is run.

The retrospective is the only session allowed to change the governance charter,
which is exactly the point: rules change on a schedule, in the calm, not in the
room where someone is waiting for an answer.
""",
            },
            {
                "title": "Operating Cadence Pack (Printable)",
                "description": "Weekly review sheet, monthly close scorecard and the season retrospective prompts.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable pack for Module 6. Sheet one is the weekly executive review — the five
questions with space for twelve weeks, so a term fits on a single document.

Sheet two is the monthly close scorecard: hours by label, OKR scoring columns,
the five-asset movement row and a simple money in/out line. Sheet three holds the
season retrospective prompts, including the rule-by-rule charter review and the
single structural change.""",
            },
        ],
        "assignment": {
            "title": "Module 6 — Run One Real Weekly Review",
            "description": (
                "This assignment cannot be completed from memory. Run the review for real, then "
                "submit it.\n\n"
                "Submit:\n"
                "1. The date, time and duration of the review you actually ran, plus the standing "
                "slot you have chosen for it going forward.\n"
                "2. Your written answers to all five questions: what moved, what is at risk, "
                "where the week leaked (with your drift number), what decision was waiting, and "
                "what next week protects.\n"
                "3. The decision you made during owner time, and the one you deferred and why.\n"
                "4. A short note, three to five sentences, on what the review surfaced that you "
                "would not have noticed otherwise.\n\n"
                "A review reporting that nothing moved is a valid submission and will be marked "
                "on its honesty. An invented one reads as invented.\n\n"
                "Graded on evidence that the session happened, the specificity of the at-risk "
                "item, and whether a real decision was made rather than postponed."
            ),
            "total_marks": 100,
            "due_in_days": 7,
        },
        "quiz": {
            "title": "Module 6 — Knowledge Check: The Operating Cadence",
            "description": "Four questions on the weekly review, the monthly close and the season retrospective.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "How long is the weekly executive review meant to take, and when is it run?",
                    "choices": [
                        "About twenty minutes, in a fixed standing slot each week",
                        "Two hours, whenever the week has felt difficult",
                        "Five minutes, immediately after every practice",
                        "As long as it takes, once a month",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which of these is NOT one of the four figures reported at the monthly close?",
                    "choices": [
                        "Hours by label from the audit",
                        "OKR scoring for each key result",
                        "Follower growth across every social platform",
                        "Money in and out",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which session is the only one allowed to amend the personal governance charter?",
                    "choices": [
                        "The weekly executive review",
                        "The monthly close",
                        "The end-of-season retrospective",
                        "Any session, provided an adviser is present",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say a weekly review with nothing to report actually is?",
                    "choices": [
                        "A failure that should be hidden from advisers",
                        "Information, and a valid outcome to record honestly",
                        "A sign the OKR plan should be rewritten immediately",
                        "A reason to extend the review to an hour next week",
                    ],
                    "answer": 1,
                },
            ],
        },
    },
    {
        "title": "The Enterprise Brief: Founding Document",
        "description": (
            "The capstone: assembling every tool from the course into one brief an adviser, a "
            "coach or a parent can read in ten minutes."
        ),
        "lessons": [
            {
                "title": "What Goes in the Brief, and What Stays Out",
                "description": "The six sections of an enterprise brief and the discipline of keeping it short.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## One document, ten minutes

By now you have a snapshot, a decision map, an audit, a matrix, a charter, an
OKR plan and a review cadence. The capstone is not more work. It is the single
document that makes all of it usable by someone else — a new coach, an adviser
you are vetting, a parent who wants to help but cannot see the whole picture.

## The six sections

1. **The one-liner.** What Me, Inc. is for, in a sentence.
2. **Position today.** Your five assets with one honest line each, plus your
   current hours-by-label split.
3. **The rules.** Your five non-negotiables, written out. This is the section
   other people need most, because it tells them how to work with you.
4. **The plan.** Twelve objectives, with year-one key results spelled out.
5. **The bench.** Named advisers, open slots, and the conflict test answered.
6. **The cadence.** When you review, and the date of the next session.

## What stays out

No highlight reel. No statistics beyond what a key result needs. No apology for
the gaps. A brief that hides its empty adviser slots is less useful than one
that names them, because the whole purpose of handing it to somebody is for them
to see where they could help.

## Length

Two pages. The constraint is deliberate: anything that cannot survive the cut to
two pages was not load-bearing, and a document nobody reads governs nothing.
""",
            },
            {
                "title": "Presenting and Maintaining the Brief",
                "description": "Who to show it to, what to ask them for, and how the brief stays current.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The ask makes the meeting

Handing someone a document without a request produces a polite nod. Go in with a
specific ask instead, and make it one of three:

- **Fill a slot.** "My money adviser slot is empty. Who should I be talking to?"
- **Stress a rule.** "Here are my five rules. Which one will break first, and
  where?"
- **Challenge a key result.** "Is this number realistic for someone in my
  position this year?"

A good adviser will do more with one of those than with twenty minutes of
general conversation.

## Choose three readers

One inside your sport, one inside your school, and one outside both. The outside
reader matters most. People inside your world share your assumptions, and
assumptions are what a brief exists to expose.

## Keeping it alive

The brief is versioned, not rewritten. Date every version. Update it:

- After each season retrospective, always.
- When a rule is amended.
- When an adviser slot is filled or emptied.
- When an objective is achieved, abandoned or replaced.

An eighteen-month-old brief is a historical document and will quietly mislead
whoever reads it. Thirty minutes after each retrospective keeps it true, which is
the only thing that makes it worth handing to anybody.
""",
            },
            {
                "title": "Enterprise Brief Template",
                "description": "Two-page brief template with all six sections and the version log.",
                "type": "DOCUMENT",
                "minutes": 20,
                "body": """Editable two-page template for the CEO-101 capstone. Page one carries the
one-liner, position today (five assets plus hours by label) and the five rules.
Page two carries the plan, the advisory bench with its conflict-test column, and
the cadence with the next review date.

A version log runs along the foot of page two: date, what changed and which
session changed it, so a reader can always tell how current the document in their
hands is.""",
            },
        ],
        "assignment": {
            "title": "Capstone — The Me, Inc. Enterprise Brief",
            "description": (
                "Assemble and present your founding document. This assignment carries the "
                "heaviest weight in CEO-101.\n\n"
                "Part A — The brief. Two pages, all six sections: the one-liner, position today, "
                "your five rules, the plan with year-one key results, the advisory bench "
                "including open slots, and your review cadence with the next date on it. Version "
                "it and date it.\n\n"
                "Part B — The presentation. Share the brief with three readers: one inside your "
                "sport, one inside your school, one outside both. Go in with one of the three "
                "specific asks from the lesson.\n\n"
                "Part C — The response, 300-400 words. For each reader: who they were (role, not "
                "name, if you prefer), what you asked for, what they said, and what you changed "
                "in the brief as a result. If you changed nothing after a conversation, defend "
                "that decision.\n\n"
                "Part D — Compare your brief against the founding snapshot you submitted in "
                "Module 1 and write one paragraph on what moved.\n\n"
                "Graded on completeness of the brief, the discipline of the two-page limit, "
                "evidence that three real conversations happened, and the quality of the changes "
                "that followed."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: The Enterprise Brief",
            "description": "Four questions on assembling, presenting and maintaining the founding document.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does the course cap the enterprise brief at two pages?",
                    "choices": [
                        "Advisers are not permitted to read longer documents",
                        "Anything that cannot survive the cut was not load-bearing, and an unread document governs nothing",
                        "Two pages is the standard length for an NIL disclosure filing",
                        "It matches the length limit of the Module 1 snapshot",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which section does the lesson say other people need most, because it tells them how to work with you?",
                    "choices": [
                        "The plan",
                        "Position today",
                        "The five non-negotiable rules",
                        "The cadence",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does the course insist one of your three readers comes from outside both your sport and your school?",
                    "choices": [
                        "Outside readers are more likely to invest money",
                        "People inside your world share your assumptions, and the brief exists to expose them",
                        "It is required before an adviser slot can be filled",
                        "Outside readers respond faster than coaches do",
                    ],
                    "answer": 1,
                },
                {
                    "text": "When does the brief get updated?",
                    "choices": [
                        "Only when an adviser requests a copy",
                        "Once a year, at the start of the school year",
                        "After every season retrospective, rule amendment, bench change or objective change",
                        "Never — a founding document is fixed once signed",
                    ],
                    "answer": 2,
                },
            ],
        },
    },
]


# One handout spec per module, in module order, rendered to the PDF or DOCX the
# module's third lesson carries (see `_handouts.py` for the shape and
# `__init__.py` for how it is attached).
HANDOUTS = [
    {
        "intro": (
            "Module 1's workbook. Fill the balance sheet in pencil — the point is the honest "
            "ranking at the end, not a tidy page. Keep it: Module 7 asks you to compare your "
            "closing Enterprise Brief against the snapshot you take today."
        ),
        "sections": [
            {
                "heading": "1. The Five-Asset Balance Sheet",
                "paragraphs": [
                    "One line per asset. Describe its state today in plain terms, then note the "
                    "single piece of evidence you are judging it on."
                ],
                "table": {
                    "columns": ["Asset", "State today", "Evidence", "Up / flat / down"],
                    "rows": [
                        ["Athletic skill", "", "", ""],
                        ["Platform", "", "", ""],
                        ["Reputation", "", "", ""],
                        ["Time", "", "", ""],
                        ["Health", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. The Honest Ranking",
                "paragraphs": [
                    "Rank all five twice. Column one is where your hours actually went over the "
                    "last month; column two is where you believe they should go. The gap between "
                    "the two lists is the work of this course."
                ],
                "table": {
                    "columns": ["Rank", "Where my hours went", "Where they should go"],
                    "rows": [["1", "", ""], ["2", "", ""], ["3", "", ""], ["4", "", ""], ["5", "", ""]],
                },
                "fields": ["The biggest gap, and why it exists"],
            },
            {
                "heading": "3. Founder's Snapshot",
                "bullets": [
                    "Write the one-liner as a sentence about the person you are becoming, not the sport you play.",
                    "Name a decision from the last six months that someone else effectively made for you.",
                    "Date it. You are comparing against this page in Module 7.",
                ],
                "fields": [
                    "Me, Inc. exists to…",
                    "The decision someone else made for me",
                    "What I would decide now",
                    "Date of this snapshot",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 2's worksheet. The first table assigns every recurring decision to a hat and "
            "a reviewer; the second builds the advisory bench. Empty bench slots are meant to stay "
            "visible — an empty slot is the first item on your Module 7 brief."
        ),
        "sections": [
            {
                "heading": "1. Decision Rights",
                "paragraphs": [
                    "List the decisions that actually recur in your week. Mark the hat that owns "
                    "each one — player, manager or owner — and the adviser consulted before it is "
                    "made. At least two should be decisions you have historically made in the "
                    "wrong state of mind."
                ],
                "table": {
                    "columns": ["Recurring decision", "Hat that owns it", "Adviser consulted first"],
                    "rows": [["", "", ""] for _ in range(8)],
                },
            },
            {
                "heading": "2. The Advisory Bench",
                "paragraphs": [
                    "Four named slots. The conflict column is the whole test: what changes for "
                    "this person if you say yes? An answer of “nothing” is the strongest "
                    "adviser credential there is."
                ],
                "table": {
                    "columns": ["Slot", "Who", "What changes for them if I say yes", "Last spoke"],
                    "rows": [
                        ["Eligibility & academics", "", "", ""],
                        ["Money", "", "", ""],
                        ["Health", "", "", ""],
                        ["Media", "", "", ""],
                    ],
                },
            },
            {
                "heading": "3. Voice, Vote and Neither",
                "bullets": [
                    "Advisers: expertise, no conflict of interest. Voice, and close to a vote on their subject.",
                    "Stakeholders: carry real consequences. Owed honesty, early notice and a hearing — not a vote.",
                    "Spectators: opinions, no stake. Neither.",
                ],
                "fields": [
                    "A decision a spectator influenced more than they should have",
                    "The empty bench slot I am filling this term, and how",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 3's template. Page one measures the week you actually had; page two sorts it. "
            "Do not change your week while you are measuring it — an audit of an unusually "
            "well-behaved week is worthless."
        ),
        "sections": [
            {
                "heading": "1. Seven-Day Audit",
                "paragraphs": [
                    "Each evening, write the day down in thirty-minute blocks and tag each block "
                    "with one label. Total the columns at the end of the week."
                ],
                "table": {
                    "columns": ["Day", "Sport", "School", "Body", "Enterprise", "People", "Drift"],
                    "rows": [
                        ["Mon", "", "", "", "", "", ""],
                        ["Tue", "", "", "", "", "", ""],
                        ["Wed", "", "", "", "", "", ""],
                        ["Thu", "", "", "", "", "", ""],
                        ["Fri", "", "", "", "", "", ""],
                        ["Sat", "", "", "", "", "", ""],
                        ["Sun", "", "", "", "", "", ""],
                        ["TOTAL", "", "", "", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. The Four-Quadrant Matrix",
                "paragraphs": [
                    "Plot every recurring block by what it costs you and what it returns. Judge "
                    "cost by how you feel ninety minutes afterwards, not by whether you enjoyed it."
                ],
                "table": {
                    "columns": ["Block", "Cost: drains / sustains / restores", "Return: builds / maintains", "Quadrant"],
                    "rows": [["", "", "", ""] for _ in range(6)],
                },
            },
            {
                "heading": "3. Reading It Back",
                "bullets": [
                    "Everything you cut comes out of quadrant 4 — low return, draining — first.",
                    "Never schedule two quadrant-2 blocks back to back. Check the week ahead against this rule.",
                    "Under four hours of unbroken restorative time in seven days means the week was survived, not survivable.",
                ],
                "fields": [
                    "Total drift this week",
                    "Longest unbroken restorative stretch",
                    "The ONE recurring block I am moving or deleting",
                    "Date I re-run the audit",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 4's charter. Five rules, one per area, each written as: in this situation, I do "
            "this, and here is why. Written while you are calm, so the version of you under "
            "pressure only has to apply them."
        ),
        "sections": [
            {
                "heading": "1. The Five Non-Negotiables",
                "paragraphs": [
                    "A rule is specific, observable by someone else, and pre-committed out loud. "
                    "“I will be careful with money” is a wish; “nothing over $200 is "
                    "spent without 24 hours and one adviser” is a rule."
                ],
                "table": {
                    "columns": ["Area", "In this situation…", "…I do this", "…because"],
                    "rows": [
                        ["Time", "", "", ""],
                        ["Money", "", "", ""],
                        ["Voice", "", "", ""],
                        ["Access", "", "", ""],
                        ["Body", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. The Decision Filter",
                "paragraphs": ["Run these four before any yes that carries a real cost."],
                "bullets": [
                    "Does it cross one of my five rules?",
                    "Who is pressuring the timeline, and why does it have to be today?",
                    "Which asset does this build, and which does it spend?",
                    "What does a no actually cost me?",
                ],
                "fields": ["The three people I am telling about these rules this week"],
            },
            {
                "heading": "3. Amendment Log",
                "paragraphs": [
                    "A rule broken twice is either the wrong rule or the right rule with no support "
                    "behind it. Changes are made deliberately, in writing, when you are calm — never "
                    "in the room where the pressure is."
                ],
                "table": {
                    "columns": ["Date", "Rule changed", "Why", "Adviser consulted"],
                    "rows": [["", "", "", ""] for _ in range(4)],
                },
            },
        ],
    },
    {
        "intro": (
            "Module 5's planner. Three objectives a year, four years, twelve in total. Year one "
            "gets measurable key results; later years may stay at objective level until they "
            "arrive."
        ),
        "sections": [
            {
                "heading": "1. The Dates You Do Not Control",
                "paragraphs": [
                    "Season windows, exam periods, eligibility and registration deadlines. Most "
                    "athletic plans fail because they were written as if these were negotiable."
                ],
                "table": {
                    "columns": ["Year", "Season window", "Exam periods", "Eligibility / registration deadlines"],
                    "rows": [["Year 1", "", "", ""], ["Year 2", "", "", ""], ["Year 3", "", "", ""], ["Year 4", "", "", ""]],
                },
            },
            {
                "heading": "2. The Four-Year OKR Grid",
                "paragraphs": [
                    "One objective per lane per year. Objectives are qualitative and memorable; "
                    "the key results underneath them are numbers or verifiable facts."
                ],
                "table": {
                    "columns": ["Year", "Athletic objective", "Academic objective", "Professional objective"],
                    "rows": [["Year 1", "", "", ""], ["Year 2", "", "", ""], ["Year 3", "", "", ""], ["Year 4", "", "", ""]],
                },
            },
            {
                "heading": "3. Year One Key Results and Quarterly Scoring",
                "paragraphs": [
                    "Three to five per objective, each a number or a yes/no fact someone else could "
                    "verify. Score each quarter to catch an at-risk result while there is still "
                    "runway to correct it."
                ],
                "table": {
                    "columns": ["Key result (year 1)", "Lane", "Q1", "Q2", "Q3", "Q4"],
                    "rows": [["", "", "", "", "", ""] for _ in range(6)],
                },
                "fields": ["Eligibility result sequenced earliest", "Date of my first quarterly scoring session"],
            },
        ],
    },
    {
        "intro": (
            "Module 6's pack. Three sheets, three rhythms: the weekly review that keeps the plan "
            "alive, the monthly close that counts, and the season retrospective — the only session "
            "allowed to change your governance charter."
        ),
        "sections": [
            {
                "heading": "1. Weekly Executive Review",
                "paragraphs": [
                    "Twenty minutes, same day and time every week. A week with nothing to report is "
                    "information, not a failure — record it honestly."
                ],
                "table": {
                    "columns": ["Week", "What moved", "What is at risk", "Drift hours", "Decision made", "Next week protects"],
                    "rows": [["", "", "", "", "", ""] for _ in range(6)],
                },
            },
            {
                "heading": "2. Monthly Close",
                "paragraphs": [
                    "Forty-five minutes on the figures rather than the feelings. Four numbers and a "
                    "sentence each is enough; a close you dread is a close done in too much detail."
                ],
                "table": {
                    "columns": ["Month", "Hours by label", "OKRs on track / at risk / missed", "Asset movement", "Money in / out"],
                    "rows": [["", "", "", "", ""] for _ in range(4)],
                },
            },
            {
                "heading": "3. Season Retrospective",
                "bullets": [
                    "What did the season prove — a belief it confirmed or destroyed?",
                    "Which rule failed? Any rule broken more than once is amended in writing or supported properly.",
                    "What is the ONE structural change for next season? One, not five resolutions.",
                ],
                "fields": ["Belief the season tested", "Rule amended", "The one structural change", "Date of this retrospective"],
            },
        ],
    },
    {
        "intro": (
            "The CEO-101 capstone template. Two pages, six sections, versioned. The two-page limit "
            "is deliberate: anything that cannot survive the cut was not load-bearing, and a "
            "document nobody reads governs nothing."
        ),
        "sections": [
            {
                "heading": "1. One-Liner and Position Today",
                "fields": [
                    "Me, Inc. exists to…",
                    "Athletic skill — one honest line",
                    "Platform — one honest line",
                    "Reputation — one honest line",
                    "Time — current hours by label",
                    "Health — one honest line",
                ],
            },
            {
                "heading": "2. The Rules, The Plan, The Bench",
                "paragraphs": [
                    "The rules section is the one other people need most: it tells them how to work "
                    "with you. List the bench with its empty slots visible — the point of handing "
                    "this to somebody is for them to see where they could help."
                ],
                "table": {
                    "columns": ["Section", "Entry", "Status"],
                    "rows": [
                        ["Rule 1 — Time", "", ""],
                        ["Rule 2 — Money", "", ""],
                        ["Rule 3 — Voice", "", ""],
                        ["Rule 4 — Access", "", ""],
                        ["Rule 5 — Body", "", ""],
                        ["This year's three objectives", "", ""],
                        ["Bench: adviser / open slot", "", ""],
                    ],
                },
            },
            {
                "heading": "3. Cadence and Version Log",
                "paragraphs": [
                    "Update after every season retrospective, every rule amendment, every bench "
                    "change and every objective achieved or abandoned. An eighteen-month-old brief "
                    "quietly misleads whoever reads it."
                ],
                "table": {
                    "columns": ["Version", "Date", "What changed", "Which session changed it"],
                    "rows": [["v1", "", "", ""], ["", "", "", ""], ["", "", "", ""]],
                },
                "fields": ["Weekly review slot", "Monthly close date", "Next retrospective"],
            },
        ],
    },
]
