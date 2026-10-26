"""LS-303: The "Highest Earner" Dynamic.

Level 3: Relationship Governance & Dynamics, and the last course of that level.
Written against the course's focus (the psychological and practical realities
of becoming a family's primary breadwinner) and its core competencies:
financial boundary setting, avoiding "ATM syndrome", establishing family trusts
or managed allowances, and communicating financial limits.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).

Two disclaimers run through the file and should be kept. The structures named
in Module 2 (trusts, LLCs, donor-advised funds, formal allowances) are United
States ones, matching the client's brief; they are described so a student can
have an informed conversation with a qualified attorney and accountant, and
the course states repeatedly that it is **education, not legal or financial
advice**. And the emotional material — guilt, obligation, family conflict —
hands over to a professional in the same terms the Mental Toughness pathway
uses.
"""

MODULES = [
    {
        "title": "Becoming the One With Money",
        "description": (
            "What happens to a family when a young person becomes its largest earner, and "
            "why it is harder than it sounds."
        ),
        "lessons": [
            {
                "title": "The Reversal",
                "description": "A child supporting adults, which nothing prepares anybody for.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## What this course is

Education, not legal or financial advice. The structures in Module 2 are
described so you can have a competent conversation with a qualified attorney
and accountant. Nothing here is set up without both, and without a guardian
while you are a minor.

It also deals with family conflict and guilt, and where that goes beyond
boundaries and conversations — which it can — the right step is a counsellor
or a physician.

## The situation

An athlete signs, is paid, and becomes the highest earner in their family,
often at nineteen or twenty, sometimes younger.

The family structure inverts. The person who was driven to training is now the
one being asked for help. Parents who made every decision are now dependent on
one. Older relatives ask a younger one for money.

**Nobody involved has done this before**, and almost nobody talks about it
honestly, which is why athletes conclude they are handling it uniquely badly.

## What makes it hard

**It is not only money.** It is authority. The person with the income
acquires a kind of power in a family, and that is uncomfortable for everybody
including the person who has it.

**The need is often real.** This is the part that makes advice about
boundaries feel cold. A parent with debt, a sibling who needs a car to work, a
grandparent's medical bill — these are not frivolous.

**You feel you owe them**, and in a sense you do. LS-301's guilt lesson is the
foundation of this course.

**The income may be short.** LS-201 made the point: sporting money arrives in
a few years and may need to cover forty. Family spending plans rarely account
for that.

**Everybody's expectations rose faster than the money.** Usually within
months.

## The specific pressures

- Being asked to buy a house.
- Being asked to pay off debt.
- Relatives who have not been in contact reappearing.
- A parent leaving a job to "manage" your career.
- Being expected to fund a sibling's education, wedding, business.
- Being the default payer for every family event.
- People planning around money you have not been paid yet.

## The two failures

**Give everything.** The common one. The athlete becomes the family's income,
spending rises across the household, nothing is saved, and when the career
ends — early, as most do — there is nothing left and a dozen people
dependent on an income that has stopped.

The documented cases almost all have this shape.

**Give nothing.** Rarer, and it produces estrangement, lasting conflict and
genuine guilt — and it is usually an overcorrection after being taken
advantage of.

## The middle

Decide what you will do, structure it so it does not depend on willpower in
the moment, and say it out loud early.

That is the whole course. It is not about generosity versus selfishness; it is
about whether support is **designed or extracted**, and the difference
determines whether anybody still has anything in ten years.
""",
            },
            {
                "title": "ATM Syndrome",
                "description": "What happens when money becomes the relationship.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The pattern

It starts reasonably. A bill, a loan, a car, a holiday, a deposit.

Each one is a yes. Each yes raises the baseline. Within a year or two the
athlete is not a son or a cousin or a friend — they are the source of money,
and every conversation routes toward it.

## The signals

- **Contact correlates with need.** You hear from people when there is
  something.
- **Conversations arrive at money**, however they start.
- **Gratitude has faded.** The first gift was received as a gift; the fifth is
  received as an entitlement.
- **Requests have grown**, in size and frequency.
- **Anger when you decline**, disproportionate to the request.
- **Your own financial position is unknown to anybody.** They assume it is
  limitless because nobody has told them otherwise.
- **You dread the phone.** The clearest signal there is.
- **Nobody asks how you are**, except as a preamble.

## Why it happens

Not usually malice.

- Once something is given twice, it is a pattern; three times and it is an
  expectation. This is how humans work and it is not personal.
- People have no idea what you actually have. A headline figure is not
  take-home — LS-201's gross-versus-net gap, multiplied by tax, agents, costs
  and a short career.
- Generosity with no structure reads as unlimited supply.
- And nobody told them otherwise, which is the part you control.

## The cost

**To the money.** Obvious, and documented in every account of athletes who
lost everything.

**To the relationships.** The real cost. The relationships stop being about
anything else, and you lose the people as people — which is exactly what
LS-301 warned about.

**To the recipients.** The uncomfortable part: open-ended support frequently
makes people worse off. A relative who stops working because money arrives, a
sibling who never has to solve a problem — that is harm, done kindly.

**To you.** Resentment, isolation, and the feeling of being valued for an
output rather than as a person.

## The reversal is hard

Withdrawing support is far harder than never starting it, because it is
experienced as a punishment rather than as a return to normal.

Which is the argument for structure now, before the pattern sets: it is
enormously easier to set a limit at the start than to impose one after two
years.

## Saying it early

The most useful sentence in this lesson, said before anything has gone wrong:

> *"I want to help, and I want to do it in a way that lasts. So I'm going to
> set this up properly rather than doing it one request at a time."*

Nobody argues with that, said at the beginning. Everybody argues with it said
in year three.
""",
            },
            {
                "title": "What You Actually Have",
                "description": "The arithmetic that has to come before any decision about helping.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Know the number before you give

You cannot set a sustainable limit without knowing what is sustainable, and
most young earners do not.

## Gross is not yours

From a headline figure, subtract:

- **Tax.** LS-201: substantial, and for contractor income nothing is withheld.
- **Agent and management fees**, where they apply.
- **Professional costs**: accountant, attorney, adviser.
- **Your own costs**: training, travel, equipment, insurance, housing.
- **Retirement and long-term saving**, which is not optional (LS-202).
- **An emergency buffer**, which is also not optional.

What remains is what exists. It is routinely half or less of the number people
outside assume.

## The career-length arithmetic

The question that makes this concrete:

> **If this income stops in three years, how long does what I have last?**

Run it. Current spending, plus whatever family support you provide, divided
into what you would have saved.

Most athletes have never done this calculation, and it changes decisions
immediately — in particular, it converts "can I afford this?" from a monthly
question into a lifetime one.

## Three buckets

LS-201's structure, with a fourth element:

- **Mine.** Living costs.
- **Future.** Long-term saving and tax. Untouchable.
- **Family.** A defined amount for support. Module 2 structures it.
- **Buffer.** Separate, and never the source of a gift.

The family bucket is a budget line, not a residual. If it is whatever is left
over, it will be everything.

## Set the number

What proportion goes to family support? Only you and your advisers can
answer, and two principles hold:

1. **It is a fixed amount or a fixed percentage**, decided annually, not per
   request.
2. **It survives the income stopping.** If your support obligations only work
   while you are earning, you have built something that fails exactly when
   people need it most.

## Nobody else sees the figures

Not relatives, not friends, not a partner, not a group chat.

"I'm not really talking about numbers" is a complete answer. The less people
know about the total, the more reasonable your limit sounds — because a limit
sounds like a limit rather than like a refusal from somebody with plenty.

LS-302's privacy rule, and it matters more here than anywhere.

## Get the professionals first

Before structuring anything: an accountant and an attorney, chosen using
LS-202's register checks, separate from each other, with nobody in the family
holding all three roles.

That last point is not about trust. It is the configuration that fails, and
it fails most often when the person is a relative.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — The Arithmetic and the Pattern",
            "description": (
                "Work out what exists before deciding what to give.\n\n"
                "Submit:\n"
                "1. The reversal in your own words, and whether any version of it has "
                "started in your family already.\n"
                "2. The seven specific pressures, with which you have seen or expect, and "
                "from whom in general terms.\n"
                "3. The two failures, with a real example of each from sport — researched, "
                "with a source.\n"
                "4. The eight signals of ATM syndrome, with an honest assessment of any "
                "already present in your life.\n"
                "5. Why open-ended support can harm the recipient, in your own words.\n"
                "6. A gross-to-actual calculation, using either your real figures or a "
                "realistic hypothetical for your sport: every deduction listed, with what "
                "remains as a percentage of the headline number.\n"
                "7. The career-length arithmetic: if that income stopped in three years, how "
                "long does what remains last at your planned spending? Show the working.\n"
                "8. Your four buckets with proportions, including the family bucket as a "
                "defined figure rather than a residual.\n"
                "9. Your two principles for the family number, and whether your figure "
                "survives the income stopping.\n"
                "10. Your privacy rule on figures, and who currently knows more than they "
                "should.\n"
                "11. The professionals you would use, with the separation between them and "
                "how you would check each one.\n\n"
                "Graded on whether parts 6 and 7 show real arithmetic, and on the honesty of "
                "parts 4 and 10."
            ),
            "total_marks": 225,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Becoming the Highest Earner",
            "description": "Four questions on the reversal, ATM syndrome and the arithmetic.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What is the course's framing of the middle path?",
                    "choices": [
                        "Whether support is designed or extracted",
                        "Whether the amounts are large or small",
                        "Whether family or friends are asking",
                        "Whether the need is genuine",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does ATM syndrome usually happen?",
                    "choices": [
                        "People are taking advantage deliberately",
                        "Given twice is a pattern, three times an expectation — and nobody was told what you actually have",
                        "Athletes are poor at managing money",
                        "Families underestimate tax",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course call the real cost of ATM syndrome?",
                    "choices": [
                        "The money lost over a career",
                        "The tax consequences of informal gifts",
                        "The relationships stop being about anything else",
                        "The precedent it sets for future requests",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What must the family support figure be able to survive?",
                    "choices": [
                        "A tax rate increase",
                        "An additional dependant",
                        "A fall in the value of investments",
                        "The income stopping",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Structures Instead of Requests",
        "description": (
            "Replacing one-at-a-time decisions with something designed — allowances, "
            "entities and professional distance."
        ),
        "lessons": [
            {
                "title": "The Managed Allowance",
                "description": "The simplest structure, and the one most people need.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Why a structure at all

Because a per-request system means:

- Every request is a negotiation.
- Every no is personal.
- The total is unknown until it has been spent.
- The most persistent person gets the most.
- You are making financial decisions while somebody is upset in front of you,
  which LS-103 identified as the worst possible condition.

A structure converts all of that into one decision, made calmly, once a year.

## The managed allowance

The simplest and most widely used arrangement: a fixed amount, paid on a fixed
date, by standing transfer, to a named person.

> *"Mum and Dad get $X on the first of each month. That's the arrangement."*

What it does:

- **Removes the asking.** Nobody has to request anything, which removes the
  humiliation on their side as much as the pressure on yours.
- **Caps the total**, so you know your annual exposure.
- **Makes extra requests visible as extra**, which is exactly the
  conversation you want to be having.
- **Is a rule**, which LS-302 showed is the easiest thing to point at.

## Setting it up

- **Decide the amount** with your accountant, against the arithmetic from
  Module 1.
- **Name the recipients**, specifically. An allowance to "the family" is
  unbounded.
- **Automate it.** A standing transfer, not a manual payment you have to think
  about monthly.
- **Set a review date**, annually, and say so when you start.
- **Write it down**, even informally. What, to whom, how much, how often, when
  reviewed.

## What it is for

Say this explicitly, because it prevents the main failure: an allowance is
usually for **ongoing living costs**, not for one-off purchases, not for
other people's debts, and not a fund the recipients can lend from.

If the amount is also meant to absorb emergencies, say so, and set it
accordingly.

## The conversation

> *"I've worked this out with the accountant. From January I'm going to
> transfer $X on the first of every month — that's yours to use however you
> need and you don't have to ask. I've set it at a level I can keep up even if
> things change. We'll look at it again every January. What I can't do is extra
> on top, because then I can't keep the rest of it going."*

That paragraph does everything: it gives, it caps, it explains, it schedules a
review, and it states the limit before anybody tests it.

## The extra request

There will be one. The answer is prepared:

> *"That's not something I can do on top. The transfer is what I've set aside
> and I've got to hold that line or the whole thing stops working. If it's an
> emergency, let's talk about it properly with the accountant."*

Acknowledge, boundary attached to the structure, pivot. LS-302's A.B.P.,
applied to the hardest case there is.

## One-offs, deliberately

You can still choose to do something larger — a car, a deposit, a medical
cost. The rules:

- **Decided calmly**, never in the conversation (LS-302's week).
- **With your accountant**, because there may be tax consequences to a large
  gift.
- **Stated as one-off**, explicitly, out loud, at the time.
- **Not from the buffer or the long-term money.**
- **Not promised in advance**, because a promise becomes an expectation the
  moment it is made.
""",
            },
            {
                "title": "Entities, Trusts and Why They Help",
                "description": "Formal structures, described so you can talk to an attorney about them.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Education, not advice

What follows describes United States structures in outline. Each has real
costs, real rules and real tax consequences, and they differ by state and
change. **None of this is set up without a qualified attorney and an
accountant**, and none without a guardian while you are a minor.

Other countries have different equivalents.

## Why a structure helps beyond the money

Three things, and the second is the one athletes underestimate:

**1. Protection.** Assets held properly are harder to lose to a bad decision,
a dispute or a claim.

**2. Distance.** A structure puts a process between a request and a person. "I
can't just move money out of the trust" is true, impersonal and unarguable —
and it removes the thing that makes every refusal feel like a personal
judgement.

**3. Durability.** It keeps working when you are distracted, injured, or
twenty-four and tired of being the one who decides.

## The main ones

**A trust.** Assets held by a trustee for named beneficiaries under written
rules you set. Can pay a regular amount to a relative, can hold money for a
sibling's education, can continue after you. It is the usual vehicle where
there is real money, and the choice of trustee is the most consequential
decision in it.

**A professional trustee or a co-trustee** — a bank or a professional firm.
More expensive, and it means no family member can be pressured into releasing
money, which is frequently the entire point.

**An LLC or corporation**, for business and partnership income. Separates
business from personal, and is an accountant's question rather than a default.

**A donor-advised fund**, for charitable giving — LS-403 covers this.

**A will and beneficiary designations.** Unglamorous and the most commonly
neglected. Accounts pass by beneficiary designation regardless of what a will
says, so both need to be correct.

**A prenuptial agreement**, later, which is an attorney's conversation and
worth knowing exists.

## Who controls what

The most important question in this lesson.

- **You should control your own money.** LS-202: nobody else moves it.
- A trustee has defined powers, written down, with a replacement mechanism.
- Nobody in the family holds unchecked authority over any of it, however much
  you trust them.
- **Separate roles**: the person who advises, the person who holds, the person
  who does the taxes, and the person who checks. Four different parties.
- **You read the statements**, monthly.

That configuration is boring and it is what prevents the single most common
catastrophic case, which is one trusted person with complete control and
nobody reading anything.

## Cost and proportion

These structures cost money to create and to maintain. For a student athlete
with no income they are premature — Module 1's arithmetic comes first.

Sequence:

1. Buffer, budget, and no expensive debt (LS-201, LS-203).
2. A managed allowance if support is already happening.
3. An accountant, once there is income.
4. An attorney and a formal structure, once there are real assets.

**Build the thing before protecting it**, which is the same argument BM-303
made about trademarks.

## Say what exists, not what is in it

Useful: telling the family that money is held in a structure and that there is
a process.

Not useful: telling anybody the amounts. Module 1's privacy rule.
""",
            },
            {
                "title": "The Family Conversation",
                "description": "Saying it once, properly, with everybody in the room.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Have it once, deliberately

The alternative is twenty small conversations, each with a different person,
each with slightly different terms, and a family in which everybody believes
something different about what is available.

One conversation, with everybody who is materially involved, is far less
painful than it sounds.

## When

- **Before the money arrives**, if possible. Easiest by a distance.
- **Early**, if it has already started.
- **Not in a crisis**, and not in response to a request.
- **At a calm time**, scheduled, so nobody is ambushed.

## Who

The people actually affected — usually parents and any dependent siblings.
Not every relative, because a family-wide meeting invites a family-wide
negotiation.

Your accountant can be present where the figures matter, and often should be:
a professional in the room changes the register of the conversation
completely, and it moves the limits from being your decision to being the
plan.

## What to say

Five parts:

**1. The gratitude, genuinely.** What they did to get you here, named
specifically. LS-301's point: this is a gift you are acknowledging rather than
a debt you are settling.

**2. The reality.** That the income is not what the headline says, that
careers are short, and that whatever you set up has to survive the end of it.

**3. What you are doing.** The allowance, the amount, the date, the recipients,
the review.

**4. What you are not doing.** Said plainly, once: no lending, no extra on
top, no investing in ventures, no guarantees, no funding for people outside
the named group. LS-302's policies, stated to the people they apply to.

**5. Why.** Not as an apology — as the reason it will last. *"I want to be
helping you in twenty years, and the only way that happens is if I don't spend
it all in three."*

## What to expect

- **Relief**, frequently, which surprises athletes. Many parents hate asking
  and are glad of a structure.
- **Hurt**, sometimes, particularly from anybody who expected more.
- **An argument**, occasionally.
- **A test**, within weeks. Somebody will ask for something outside the
  structure, and your answer to that first request is what sets whether the
  structure is real.

## Holding it afterwards

- The first exception becomes the new rule. There is no small exception.
- Repeat the same answer in the same tone (LS-302).
- Do not renegotiate individually with people who were in the room.
- Review it annually, as promised, and actually do it.

## When it goes badly

Some families do not accept it. Then:

- **Keep the structure anyway.** It is yours.
- **Reduce the argument**, not the boundary.
- **Involve a professional** — an accountant or a mediator can carry a
  message that a son or daughter cannot.
- **Get support for yourself.** Family conflict about money is genuinely
  distressing, and a counsellor is the right place for that rather than a
  course.

And the line that does not move: if anybody is pressuring, threatening or
attempting to control your money or your accounts, that is not a family
disagreement. Talk to your attorney and a trusted adult outside the family,
and where there is any threat, the police.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Design the Structure",
            "description": (
                "Build the arrangement and script the conversation.\n\n"
                "Submit:\n"
                "1. The five problems with a per-request system, in your own words.\n"
                "2. Your managed allowance design: amount or percentage, named recipients, "
                "frequency, payment date, automation method, review date, and what it is for.\n"
                "3. Your written allowance statement, as you would record it.\n"
                "4. Your allowance conversation script, covering all of: the gift, the cap, "
                "the reason, the review and the limit.\n"
                "5. Your prepared answer to the first extra request, labelled A, B and P.\n"
                "6. Your one-off rules: the five conditions under which you would make a "
                "larger gift.\n"
                "7. The structures from Lesson 2 defined in one sentence each, with which "
                "might apply to you and at what point.\n"
                "8. Your who-controls-what map: the four separated roles, and your rule about "
                "family members holding authority.\n"
                "9. Your sequence: where you currently are in the four-step order, and what "
                "the next step is.\n"
                "10. Your family conversation plan: when, who is in the room, whether a "
                "professional attends, and the five parts written out in full.\n"
                "11. Your prediction of how each person in that room will react, and your "
                "response to the hardest one.\n\n"
                "Graded on whether the allowance design is specific and survivable, and on "
                "whether part 10's script includes the 'what I am not doing' section plainly."
            ),
            "total_marks": 250,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Structures",
            "description": "Four questions on allowances, entities and the family conversation.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What does a managed allowance remove, on the recipient's side?",
                    "choices": [
                        "The asking — and the humiliation that goes with it",
                        "Any tax liability on the transfer",
                        "The need for a written agreement",
                        "The possibility of further requests",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which benefit of a formal structure does the course say athletes underestimate?",
                    "choices": [
                        "Protection of assets from claims",
                        "Distance — a process between a request and a person",
                        "Tax efficiency",
                        "Continuity after death",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the sequence before setting up a formal structure?",
                    "choices": [
                        "Attorney first, then accountant, then budget",
                        "Trust first, so assets are protected from the start",
                        "Buffer, budget and no expensive debt; then an allowance; then an accountant; then an attorney",
                        "Whatever order the family agrees",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What happens to the structure after the first exception?",
                    "choices": [
                        "It holds, as long as the exception is documented",
                        "It needs a formal amendment",
                        "It is strengthened by showing flexibility",
                        "The exception becomes the new rule — there is no small exception",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Living With It",
        "description": (
            "Guilt, the people who are genuinely in need, and keeping the relationships "
            "while keeping the limits."
        ),
        "lessons": [
            {
                "title": "When the Need Is Real",
                "description": "The hardest cases, where a boundary feels indefensible.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The honest difficulty

Everything so far is straightforward when the request is a holiday or a car.

It is not straightforward when it is a parent's medical bill, an eviction, a
sibling's tuition, or somebody who genuinely has nowhere else to go. Advice
about structures can sound callous against a real crisis, and it is worth
saying plainly that it is not.

## The principle that still holds

**You cannot help anybody from a position you have destroyed.**

An athlete who gives everything in year two helps nobody in year six, and the
people depending on them are worse off than if the support had been smaller
and lasted.

That is not a justification for meanness. It is the reason to design something
sustainable, which helps more over a lifetime than a generous collapse.

## For a genuine emergency

A category worth planning for in advance, with four rules:

**1. Decide it out of the moment.** Twenty-four hours minimum, even here.
LS-103: decisions made while somebody is distressed in front of you are the
worst decisions anybody makes.

**2. Involve your accountant.** Large gifts can have tax consequences, and a
professional can also tell you what it actually costs you over ten years.

**3. Look for the non-money help first.** This is the one athletes skip, and
it is frequently better:

- Is there a payment plan, a charity, a benefit, a hardship fund?
- Is there a legal route — a dispute, an appeal, an entitlement nobody
  claimed?
- Would going with them to the appointment, the bank or the office help more
  than money?
- Is the real problem something money postpones rather than solves?

**4. If you do give, state what it is.** A one-off, said plainly, at the time.
Not a precedent, not an ongoing arrangement, and not something to be repeated
quietly.

## The recurring emergency

Pay attention to pattern. A genuine crisis happens occasionally. A monthly
crisis is a structural problem — insufficient income, debt, addiction,
mismanagement — and money is not the intervention.

What helps:

- Naming it honestly, with the person.
- Getting a professional involved: debt advice (LS-203), a counsellor, a
  social worker.
- Moving to a structure rather than responding to each event.
- Accepting that you cannot fix some problems, which is not a failure of
  generosity.

## Addiction and coercion

Two cases that are different in kind.

**Where money is funding an addiction**, giving it causes direct harm. That is
a conversation with a professional, with other family members, and it is one
of the few situations where refusing is unambiguously the caring act.

**Where somebody is pressuring, threatening or deceiving you** to get money,
including a family member, that is not a family disagreement. Talk to your
attorney and an adult outside the situation. Where there is any threat, the
police. Financial abuse of a young person by family is a real and documented
category.

## And for yourself

Carrying a family's problems at twenty is heavy, and it does not become light
because you can afford it.

If it is affecting your sleep, your mood or your performance for more than a
couple of weeks, talk to a counsellor or a physician. That is not weakness and
it is not disloyalty — the course teaches structures, not treatment, and this
is past where a structure helps.
""",
            },
            {
                "title": "Keeping the Relationship",
                "description": "Being more than an income to the people you support.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The risk

Once money is part of a relationship, it can become all of it. LS-301 called
this the real cost, and it is the one athletes regret most.

## What keeps it a relationship

**Talk about something else.** If every conversation with your parents
includes the transfer, the relationship has become an account. Ask about their
week.

**Be present in ordinary ways.** Turn up, call, remember things. Money is a
poor substitute for attention and everybody involved knows it.

**Let them give you things.** Important and overlooked. A parent who can only
receive feels diminished. Let them cook, help, advise, look after something.
Accepting is a gift too.

**Keep their authority intact.** Paying for something does not make you the
head of the household at nineteen. Do not use money to win arguments; it is
the quickest way to permanently change a relationship into something worse.

**Do not keep score.** Not out loud, and ideally not privately. Totalling up
what you have given turns a gift into a ledger, and resentment grows there.

**Say thank you**, still, for what they did and do.

## Siblings

LS-301 named them as the most overlooked people in an athlete's life. Money
sharpens it:

- Unequal support between siblings is remembered for decades. Be able to
  explain it.
- A sibling who receives help can feel diminished by it.
- A sibling who does not can feel judged.
- Both can feel that their own achievements are measured against your income.

What helps: treating them as a person rather than a recipient, being
transparent about why any arrangement is what it is, turning up to their
things, and never using what you provide in an argument.

## Friends

Simpler and still real:

- Do not always pay. It converts a friendship into an arrangement.
- Suggest things people can afford.
- Do not discuss what you have (Module 1's privacy rule).
- If somebody only appears when there is money, LS-301's hanger-on test
  answers it.

## The thing worth protecting

At least a few relationships in which money has never been discussed.

Somebody who does not know what you earn, has never asked for anything and
would be exactly the same if you had nothing. LS-301 said those people are
irreplaceable, and in this course they are the ones that keep you a person
rather than a resource.

Protect them deliberately: do not lend to them, do not employ them, do not
invest with them, and do not let money into it at all.
""",
            },
            {
                "title": "The Long View",
                "description": "Reviewing, adjusting, and what this looks like in twenty years.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Review it annually

Same month each year, with your accountant:

- Has the income changed?
- Has anybody's situation genuinely changed?
- Is the allowance still affordable if the income stopped tomorrow?
- Has anything crept in outside the structure?
- Is anybody worse off because of the support rather than better?

That last question is the uncomfortable one and the most important. Support
that was right at twenty-two may be harming somebody at twenty-eight.

## Adjusting down

Sometimes necessary — an injury, a release, a career ending. Handle it exactly
like the original conversation:

- **Early**, as soon as you know. Not when the money has run out.
- **Honestly**: *"My contract ends in June and I don't have another one. From
  July I can do $X instead of $Y."*
- **With a date**, so people can plan.
- **Without guilt.** You did not promise forever, and if you did, LS-302's
  renegotiation rules apply.

The reason to say it early is that people can adapt to a reduction with
notice, and cannot to one without.

## Teaching rather than funding

The most durable form of help, and the one families rarely think of.

- Pay for a course or a qualification rather than ongoing costs.
- Pay for professional debt advice (LS-203) rather than paying a debt that
  will reform.
- Fund a deposit on something that reduces costs rather than subsidising the
  costs.
- Share what you have learned — LS-201's budget, LS-203's credit arithmetic.

A relative who stops needing support is a better outcome than one who is
supported well, for both of you, and it is the outcome nobody plans for.

## In twenty years

The athletes who come through this well tend to have:

- Given generously and within a structure.
- Kept their own position intact, so they could keep giving.
- Families who are independent rather than dependent.
- Relationships that are still about something other than money.
- No single person with unchecked control of anything.
- Reviewed it annually, out loud.

The ones who do not tend to have said yes to everything, kindly, for three
years.

## The summary

1. **Know the real number** before deciding anything.
2. **Design the support**; do not respond to requests.
3. **Say it once, early, with everybody in the room.**
4. **Hold the first test**, because it sets whether the structure is real.
5. **Keep the relationship**, by talking about something else.
6. **Review annually**, and adjust early when it has to change.

## Where this goes

Level 4 is the transition — LS-401 on the psychology of the end, LS-402 on
translating what you have into work, LS-403 on structured giving, LS-404 on
launching what comes next.

This course is what makes those possible. An athlete who arrives at the end of
a career with their position intact has options. One who arrives supporting
eight people on an income that has stopped does not, and that is the single
most common version of the story.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — The Hard Cases and the Review",
            "description": (
                "Plan for the situations where the boundary is hardest.\n\n"
                "Submit:\n"
                "1. The principle about helping from a destroyed position, in your own "
                "words, and your honest reaction to it.\n"
                "2. Your emergency protocol: the four rules, written as steps, with who you "
                "would call.\n"
                "3. The non-money alternatives: for one realistic emergency in your family's "
                "situation, research what actually exists — a payment plan, a charity, a "
                "hardship fund, a benefit, a legal route. Name at least three real ones.\n"
                "4. Your position on a recurring emergency, and the professional you would "
                "involve.\n"
                "5. Your position on money funding an addiction, written before you are in "
                "it.\n"
                "6. Your line on coercion: what you would do, and who you would contact.\n"
                "7. Your relationship rules: six things you will do to stay more than an "
                "income to the people you support.\n"
                "8. Your sibling plan, specifically, including how you would explain any "
                "unequal arrangement.\n"
                "9. The relationships you are protecting from money entirely — named — and "
                "the four things you will not do with them.\n"
                "10. Your annual review: the month, who is present, and the five questions, "
                "including the uncomfortable one.\n"
                "11. Your adjusting-down script, written now for an income that stops.\n"
                "12. Three examples of teaching rather than funding that would apply to your "
                "own family.\n\n"
                "Graded on whether part 3 names real, researched services, and on whether "
                "part 11 was written before it was needed."
            ),
            "total_marks": 250,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Living With It",
            "description": "Four questions on genuine need, relationships and the long view.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What is the principle that still holds when the need is real?",
                    "choices": [
                        "You cannot help anybody from a position you have destroyed",
                        "Family obligations outrank financial planning",
                        "Emergencies justify suspending the structure",
                        "Any gift should be matched by a loan agreement",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What step do athletes most often skip in an emergency?",
                    "choices": [
                        "Involving their accountant",
                        "Looking for the non-money help first — a payment plan, a charity, a legal route",
                        "Waiting twenty-four hours",
                        "Stating that the gift is a one-off",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course say to let family give you things?",
                    "choices": [
                        "It reduces the total support required",
                        "It demonstrates that the relationship is equal",
                        "A parent who can only receive feels diminished — accepting is a gift too",
                        "It creates a record of reciprocity",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course call the most durable form of help?",
                    "choices": [
                        "A larger allowance set early",
                        "A trust with a professional trustee",
                        "Paying off debt in full",
                        "Teaching rather than funding — a relative who stops needing support",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
