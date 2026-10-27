"""ENT-307: Automation & AI Tools. Entrepreneur Pathway, Level 3.
CRM automation, workflow triggers, using AI in a business.

Founder audience, as ENT-101. Boundary: ENT-104 argues for documenting
processes and ENT-308 covers delegating them to people; this course covers
delegating them to software. ENT-315 is the technical capstone that builds a
stack; this is the decision layer above it — what to automate, what not to, and
the obligations that attach. Deliberately vendor-neutral, consistent with the
rest of the catalog: no product is named, because tools change faster than the
course can. The AI material states plainly that the business remains
responsible for every output, because that is the point founders get wrong.
"""

MODULES = [
    {
        "title": "What to Automate",
        "description": "The decision, before any tool.",
        "lessons": [
            {
                "title": "Automate the Right Things",
                "description": "And not the wrong ones.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The failure mode

A founder discovers automation, spends three weeks building workflows,
and ends with a fragile system that saves twenty minutes a week and
breaks when anything changes (ENT-104).

Tool-building is comfortable, visible and feels productive. It is a
common form of avoiding selling (ENT-101).

## The test

Before automating anything:

1. **Am I doing this repeatedly?** At least weekly.
2. **Is the process stable?** If it changes monthly, automating locks
   in a moving target.
3. **Does it take meaningful time**, or just feel annoying?
4. **Would automating it save more than it costs to build and
   maintain?**
5. **Does it need judgement?** If so, automate the parts around the
   judgement, not the judgement.

Fail any of those and leave it alone.

## Manual first

The rule from ENT-105 applies directly:

**Do it manually until the process is settled.** You will learn what
actually matters, which is never what you assumed, and you will
automate the right version rather than the first version.

Automating an unsettled process produces a system you immediately have
to rebuild.

## What is usually worth automating

- **Repetitive data entry** between systems.
- **Scheduling** — booking, reminders, confirmations.
- **Invoicing and payment chasing** (ENT-304).
- **Standard email sequences** (ENT-209).
- **Record keeping** — transactions flowing into your books.
- **Backups.**
- **Reporting** that you actually look at (ENT-208).
- **Handovers** — somebody buys, and the next steps happen.

## What is usually not

- **Anything requiring judgement** about a specific customer.
- **The first contact with a new customer** (ENT-309).
- **Anything with few occurrences.**
- **Anything changing frequently.**
- **Difficult conversations**, ever.
- **Anything where an error is expensive and hard to detect.**

## The maintenance cost

Every automation needs maintaining:

- Tools change and break integrations.
- Processes change and the automation does not.
- Silent failures — the worst kind, because nothing tells you.

Build in a check: something that tells you when it has not run.

A founder with twenty automations has a system to maintain
(ENT-109).

## Start with one

- Pick the single most repetitive thing.
- Automate it simply.
- Use it for a month.
- Then consider another.

Ten automations built in a week are a liability. One built and proven
each month is capability.
""",
            },
            {
                "title": "Mapping the Process First",
                "description": "Writing it down before building anything.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Write it down

Before any tool, write the process as it currently happens
(ENT-104):

- Every step, in order.
- Who does it.
- What triggers it.
- What information is needed.
- What the output is.
- What happens when it goes wrong.

Most founders cannot do this for their own processes, which is itself
the finding.

## Simplify before automating

The most valuable step, and the one that gets skipped:

- **Which steps are unnecessary?** Usually several.
- **Which exist because of a problem that no longer exists?**
- **Which could be combined?**
- **Which could be removed by changing something upstream?**

**Automating a bad process makes it bad faster.** Simplify first; you
will frequently find the automation is no longer needed.

## Find the actual bottleneck

Where does work actually wait?

- Waiting for you to do something.
- Waiting for a customer to respond.
- Waiting for information from elsewhere.
- Waiting for a payment (ENT-206).

Automating a step that was not the bottleneck changes nothing. Founders
routinely automate the part that is interesting rather than the part
that is slow (ENT-104).

## Measure before

So you can tell whether it helped:

- How long does this take now, in total?
- How often does it happen?
- How often does it go wrong?

Without a baseline, every automation feels successful.

## Design the automation

- **The trigger** — what starts it.
- **The steps**, in order.
- **The conditions** — when it should not run.
- **The failure case** — what happens when something is missing.
- **The notification** — how you know it ran, or did not.

That last one is the most neglected. Silent automation is how a
business discovers in month three that nothing has been sent.

## Keep a human checkpoint

For anything that reaches a customer or involves money:

- A review step, at least initially.
- A limit — above a value, a person checks.
- A log you can review.

Remove the checkpoint only once it has proven itself over time, and
keep the log either way.

## Document it

- What it does.
- What triggers it.
- Where it is configured.
- What to do if it breaks.

Future you will not remember, and neither will anybody you hand it to
(ENT-308).
""",
            },
            {
                "title": "Customer Records and CRM",
                "description": "Knowing who everybody is.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## What it is for

A customer relationship system is a record of who your prospects and
customers are, what has happened, and what should happen next.

For a small business it replaces the memory, the notebook and the
inbox, none of which scale past about thirty relationships.

## Start simple

A spreadsheet is a CRM:

- Name, organisation, contact details.
- Where they came from (ENT-208).
- Stage.
- Next action and date.
- Notes from each conversation.
- What they bought and when.

That is sufficient for a long time, and founders who buy software
before they have a process usually end up with an empty system
(ENT-205).

## When software helps

- Volume beyond what a sheet handles comfortably.
- More than one person needs it (ENT-402).
- You need automated follow-up (Module 2).
- You need it connected to email, invoicing or your site.
- Reporting is taking real time (ENT-208).

## What it must do

Resist complexity:

- Record who somebody is.
- Record what happened.
- Record what happens next, and when.
- Remind you.
- Let you find anybody quickly.

Everything else is optional. Most CRM failures are a system too
elaborate to maintain, so it is not maintained, so it is useless
(ENT-104).

## The discipline

A CRM is only as good as the habit:

- Record after every meaningful contact, immediately.
- Always set a next action and a date.
- Review weekly (ENT-205).
- Keep it clean.

Ten minutes a week. A CRM nobody updates is worse than a notebook,
because it creates false confidence.

## Data protection

Holding information about people brings obligations
(ENT-303):

- A lawful basis for holding it.
- Telling people what you hold and why.
- Keeping it secure.
- Deleting what you no longer need.
- Responding to requests for access or deletion.
- Checking that any provider storing it on your behalf is
  appropriate, with written terms.

**Find out what applies where the individuals are**, and do not store
more than you need. Notes recorded about a person may be disclosable
to them, so write them professionally.

## What to record

- Factual, useful, professional.
- What was discussed, agreed and promised.
- Context that helps the next conversation (STU-202).

**Not:** personal opinions about somebody, anything you would be
uncomfortable with them reading, or sensitive personal information
without a clear basis and strong protection.

## Keeping it useful

- Review quarterly; archive the dormant.
- Standardise how things are entered.
- One place, not three.
- Export it periodically; you should own your data
  (ENT-110).
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Decide and Map",
            "description": (
                "Submit:\n"
                "1. The five-question test applied to five candidate processes, with "
                "which pass.\n"
                "2. One process you are doing manually and deliberately not automating "
                "yet, with why.\n"
                "3. Your most repetitive process, written out step by step with "
                "triggers, inputs, outputs and failure cases.\n"
                "4. The steps you removed by simplifying, before automating anything.\n"
                "5. Your actual bottleneck, identified by where work waits.\n"
                "6. Your baseline measurements: time taken, frequency, error rate.\n"
                "7. Your automation design, including the failure case and the "
                "notification.\n"
                "8. Your human checkpoint for anything touching customers or money.\n"
                "9. Your customer record system, with the five things it must do.\n"
                "10. Your data protection position for customer records, with the "
                "source, and what you do not record.\n\n"
                "Graded on part 4 showing real simplification, part 6 being a real "
                "baseline, and part 10 citing a source."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: What to Automate",
            "description": "Four questions on the decision, mapping and records.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What should you do before automating a process?",
                    "choices": [
                        "Do it manually until it is settled, then automate the right version",
                        "Choose the tool that integrates most widely",
                        "Automate a small part as a test",
                        "Document the ideal version rather than the current one",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does automating a bad process achieve?",
                    "choices": [
                        "Gradual improvement through iteration",
                        "It makes it bad faster",
                        "Consistency, at least",
                        "Reduced error rates",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the most neglected part of an automation design?",
                    "choices": [
                        "The trigger condition",
                        "The order of steps",
                        "The notification that tells you it ran, or did not",
                        "The data mapping",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why do most CRM implementations fail in small businesses?",
                    "choices": [
                        "The software is too expensive",
                        "The data does not import cleanly",
                        "Integrations break",
                        "The system is too elaborate to maintain, so it is not maintained",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Building Workflows",
        "description": "Connecting things without creating fragility.",
        "lessons": [
            {
                "title": "Triggers and Chains",
                "description": "How automation is actually structured.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The shape

Almost all business automation is the same shape:

> **When [trigger], if [condition], do [action].**

- **A form is submitted** → create a record, send a confirmation,
  notify you.
- **An invoice becomes overdue** → send a reminder, flag it
  (ENT-206).
- **A customer buys** → send onboarding, add to a list, create a task
  (ENT-309).
- **A date arrives** → send a renewal notice (ENT-207).

## Chaining

Several actions from one trigger, or one automation triggering
another.

Powerful and the main source of fragility:

- A change early in a chain affects everything downstream.
- A failure midway leaves things half-done.
- Debugging a long chain is difficult.

**Keep chains short.** Two or three steps is usually enough, and each
should be independently checkable.

## Conditions

The part founders omit, producing embarrassing outcomes:

- Do not send a payment reminder to somebody who has paid.
- Do not send onboarding to an existing customer.
- Do not send a marketing message to somebody who unsubscribed
  (ENT-209).
- Do not send anything to a test record.

Every automation that reaches a person needs explicit conditions for
when it should **not** run.

## Timing

- Immediate is not always right; an instant automated reply to a
  thoughtful message reads badly.
- Build in delays where a human response would have taken time.
- Respect working hours for anything that notifies somebody.
- Consider time zones.

## Failure handling

Decide what happens when a step fails:

- Retry, and how many times.
- Notify you.
- Log it.
- Stop the chain rather than continuing with bad data.

An automation that fails silently and continues is worse than one
that stops.

## Testing

Properly, before anything goes live:

- Run it with test data.
- Run every condition, including the ones that should prevent it.
- Check what the recipient actually receives.
- Check it on a phone.
- Have somebody else run through it.

Automations reaching customers should be tested end to end by you
receiving them (ENT-209).

## Monitoring

- A notification when something runs, at least initially.
- A log you can review.
- A periodic check that things still work.
- A quarterly review of every automation: does it still do the right
  thing?

Processes change and automations do not notice (Module 1).

## Keeping it simple

The best automation for a small business is:

- Few.
- Short.
- Well-documented.
- Monitored.
- Replaceable by a human doing it manually if it breaks.

That last point matters: never build something you could not fall
back from (ENT-103).
""",
            },
            {
                "title": "Choosing Tools",
                "description": "Without accumulating a stack.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The accumulation problem

Tools accumulate: each solves a problem, each costs monthly, and
within two years a small business is paying a meaningful sum for
things nobody uses (ENT-109).

## Before adding one

- **What specific problem does this solve?**
- **Am I experiencing that problem now**, or anticipating it?
- **Can an existing tool do it?**
- **Can a spreadsheet do it?**
- **What does it cost annually, including time to set up and learn?**
- **What happens if it disappears?**

## Prefer fewer

- One tool doing three things adequately usually beats three doing one
  thing well, for a small business.
- Fewer integrations means fewer things to break.
- Fewer logins, fewer subscriptions, less to maintain.

## What to look for

- **Does it do the core thing well?**
- **Can you get your data out?** Non-negotiable.
- **Does it connect** to the two or three things it must?
- **Is it affordable at your scale, and at ten times your scale?**
- **Is the company likely to still exist?**
- **Is support adequate?**

## Data portability

The most important and least checked:

- Can you export everything, in a usable format?
- Do you actually own the data?
- What happens to it if you stop paying?

**Export your data periodically**, from every tool. Businesses lose
years of records when a provider closes or an account lapses
(ENT-110).

## Free tiers

Useful and worth understanding:

- Limits that bite exactly when you grow.
- Data you cannot export without paying.
- Features removed from free plans later.

Free is a reasonable way to start and a poor thing to depend on for
something critical.

## Security

Every tool is a place your data lives (ENT-303):

- Strong unique passwords and two-factor authentication on
  everything.
- Know who has access, and remove it when people leave
  (ENT-308).
- Check what the provider does with your data and where it is stored.
- Have written terms where personal data is processed on your behalf.
- Prefer providers with a credible security posture for anything
  sensitive.

## The quarterly audit

- List every tool and its annual cost.
- For each: what breaks if I cancel it?
- Cancel anything you cannot answer that for.
- Check who still has access.
- Export the data.

Half an hour, quarterly. Most businesses find something to cancel
every time (ENT-304).

## Avoid tool-shopping as avoidance

Researching tools is pleasant, legible and produces no customers.

If you have spent more time choosing tools this month than talking to
customers, that is the finding (ENT-101, ENT-104).
""",
            },
            {
                "title": "Using AI in a Business",
                "description": "Usefully, and with the responsibility it carries.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## What it is genuinely useful for

For a small business, in rough order of reliability:

- **Drafting**, which you then edit — emails, descriptions, first
  passes (ENT-204).
- **Summarising** long material.
- **Restructuring** things you wrote.
- **Brainstorming** options you then evaluate (ENT-102).
- **Answering routine questions**, with human review
  (ENT-309).
- **Translation**, with checking for anything important.
- **Analysis** of text or data you provide, treated as a starting
  point.

## What it is not reliable for

- **Facts.** It can be confidently wrong, and plausibly so.
- **Numbers**, calculations and anything where precision matters.
- **Legal, tax, medical or regulated advice** (ENT-303,
  ENT-305).
- **Anything you cannot check.**
- **Judgement about a specific customer** (Module 1).
- **Final output that goes out unreviewed.**

## The rule

**You are responsible for everything your business publishes, sends or
relies on, regardless of what produced it.**

Not the tool. You.

That means: check every factual claim, every number, every name, and
anything with legal or commercial consequence. "The tool wrote it" is
not a defence to a customer, a regulator or a court.

## Where it goes wrong for businesses

- Published content containing invented facts (ENT-202).
- Customer-facing replies that are confidently incorrect.
- Confidential or personal data entered into a tool without checking
  what happens to it.
- Generated material that infringes somebody's rights
  (ENT-302).
- Automated responses to situations requiring a human
  (ENT-309).
- Over-reliance producing generic output indistinguishable from
  everybody else's (ENT-107).

## Data and confidentiality

Before putting anything into any tool:

- **What does the provider do with the input?** Read the terms.
- **Does this contain personal data?** If so, data protection
  obligations apply and you need a basis and appropriate terms
  (ENT-303).
- **Does this contain customer confidential information?** You may
  have contractual obligations preventing it (ENT-214).
- **Is this our own confidential material** — pricing, plans, code?

Many businesses have entered confidential material into tools without
considering this. Decide a policy and follow it.

## Being honest about it

- Do not present generated material as something it is not where that
  matters.
- Disclosure expectations differ by context and some sectors have
  specific rules — **check what applies to you**.
- Do not use it to fabricate reviews, testimonials or evidence. That
  is a separate and serious problem (ENT-205).

## Keeping the human part

The things that differentiate a small business are judgement,
relationships and genuine expertise (ENT-107). Those are what you
sell.

Use these tools to remove drudgery so you can do more of that — not to
replace the part customers are paying for.

## A practical policy

Three lines, written down:

1. What we use it for, and what we do not.
2. What may never be entered into it.
3. Everything that goes out is checked by a person.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Build Carefully",
            "description": (
                "Submit:\n"
                "1. Three automations in the trigger-condition-action form, with "
                "chains no longer than three steps.\n"
                "2. The explicit conditions preventing each from running when it "
                "should not.\n"
                "3. Your failure handling and notification for each.\n"
                "4. Evidence each was tested end to end, with you receiving what a "
                "customer receives.\n"
                "5. Your human checkpoint for anything touching customers or money.\n"
                "6. Every tool you use, its annual cost, and what breaks if cancelled.\n"
                "7. What you cancelled after the audit.\n"
                "8. Your data export from every tool, with where the exports are "
                "kept.\n"
                "9. Your written AI policy: what you use it for, what may never be "
                "entered, and the human check.\n"
                "10. What your tool providers do with input data, from their terms, "
                "and whether that is compatible with your confidentiality "
                "obligations.\n\n"
                "Graded on part 4 being real testing, part 7 being real "
                "cancellations, and part 10 citing the terms."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Building Workflows",
            "description": "Four questions on triggers, tools and AI.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does every automation reaching a person need?",
                    "choices": [
                        "Explicit conditions for when it should not run",
                        "An immediate trigger",
                        "A personalisation field",
                        "A delay before sending",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the most important and least checked thing about a tool?",
                    "choices": [
                        "Its integration options",
                        "Whether you can get your data out",
                        "Its pricing at scale",
                        "Its support hours",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Who is responsible for what a business publishes using AI tools?",
                    "choices": [
                        "The tool provider, under their terms",
                        "Shared, depending on the use",
                        "You — regardless of what produced it",
                        "Nobody, if it is clearly labelled",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should automation be used to free you up for?",
                    "choices": [
                        "Building more automations",
                        "Expanding the product range",
                        "Reducing costs further",
                        "Judgement, relationships and expertise — the part customers pay for",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Keeping It Working",
        "description": "Maintenance, security and knowing when to stop.",
        "lessons": [
            {
                "title": "Maintenance",
                "description": "The cost nobody budgets for.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Automation is not finished

Every automation you build is a thing to maintain:

- Tools update and break integrations.
- Processes change and automations do not.
- Accounts lapse.
- Permissions change.
- Something silently stops.

A founder with twenty automations has an operations job
(ENT-109).

## Silent failure

The worst kind, because nothing tells you:

- Reminders that stopped sending three weeks ago.
- A record that is no longer created.
- A backup that has not run.

**Build in positive confirmation.** A weekly summary of what ran is
better than relying on noticing an absence.

## The quarterly review

Thirty minutes:

- List every automation.
- Does each still do the right thing?
- Has the underlying process changed?
- Is anything failing?
- Is anything no longer needed?

Turn off what is not needed. An automation nobody relies on is a
liability without a benefit.

## Documentation

For each (ENT-104):

- What it does.
- What triggers it.
- Where it is configured.
- What to do if it breaks.
- The manual fallback.

Without this you cannot hand it over, and you will not remember
(ENT-308).

## The manual fallback

Never build something you could not fall back from:

- Know how to do each automated thing by hand.
- Keep the manual process documented.
- Make sure a failure degrades to manual rather than to nothing.

Businesses have been stopped by a tool outage with no fallback
(ENT-103).

## Access and continuity

- Who has access to each tool?
- What happens if that person is unavailable?
- Are credentials stored securely and accessibly to the right people?
- Is anything tied to a personal account rather than a business one?

That last is a common and serious problem: tools registered to a
founder's personal email, inaccessible to anybody else
(ENT-402).

## Security hygiene

Quarterly (ENT-303):

- Review who has access to what.
- Remove access for anybody who has left (ENT-308).
- Check two-factor authentication is on everywhere.
- Rotate anything shared.
- Check backup and export routines have actually run.

## Backups

- Export data from every tool periodically (Module 2).
- Store the exports somewhere separate.
- Check periodically that an export can actually be restored or read.

A backup nobody has tested is a hope.
""",
            },
            {
                "title": "When Not to Automate",
                "description": "The things that should stay human.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The limit

Automation makes a business efficient. Over-applied, it removes the
thing that made a small business worth choosing (ENT-107).

## Keep human

- **The first contact** with a new customer (ENT-309).
- **Anything after a complaint.** An automated response to an unhappy
  customer makes it worse, reliably.
- **Bad news**, always (ENT-202).
- **Anything requiring judgement** about a specific situation.
- **Relationships** — partners, suppliers, key customers
  (ENT-211).
- **Anything where being wrong is expensive.**

## The small business advantage

A small business can do what a large one cannot:

- Reply personally.
- Make an exception.
- Remember a customer.
- Solve something unusual.

Automating those away produces a small business with a large one's
service and none of its resources — the worst of both (ENT-111).

## The signals you have gone too far

- Customers mention not being able to reach a person.
- Complaints about automated responses (ENT-309).
- You no longer know what is happening with individual customers.
- Something went wrong for weeks before anybody noticed.
- Your communication sounds like everybody else's (ENT-201).

## Personalisation is not personal

An automated message with somebody's name in it is not a personal
message, and people can tell (ENT-209).

Use automation for the mechanical and keep genuine human contact
genuinely human. One real message a quarter to a customer is worth
more than twelve automated ones.

## Where the balance usually sits

For a small business:

- **Automate:** records, scheduling, invoicing, chasing, backups,
  standard confirmations, internal handovers.
- **Human:** first contact, problems, bad news, judgement, anything
  with a relationship attached.
- **Hybrid:** an automated draft that a person reviews and sends.

The hybrid is frequently the right answer and is under-used.

## Reviewing it from the customer's side

Once a quarter, go through your own process as a customer:

- Sign up.
- Buy something.
- Ask a question.
- Raise a complaint.

See what actually arrives and how it feels. Founders are frequently
surprised, and it is the only reliable way to find out
(ENT-309).

## The principle

Automate the process; keep the relationship.
""",
            },
            {
                "title": "Building Capability Sensibly",
                "description": "Over time, proportionately.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The progression

A sensible sequence for a small business:

1. **Do it manually** and understand it (Module 1).
2. **Document it** (ENT-104).
3. **Simplify it.**
4. **Automate the mechanical parts.**
5. **Delegate what remains**, if volume justifies (ENT-308).

Most founders jump to four, which is why their automations do not
survive.

## What to build first

In rough order of return for a typical small business:

1. **Financial records flowing automatically** (ENT-304).
2. **Invoicing and payment chasing** (ENT-206).
3. **Backups and exports.**
4. **Customer records with next actions** (Module 1).
5. **Scheduling and reminders.**
6. **Standard customer communications** (ENT-209).
7. **Reporting you actually use** (ENT-208).

Seven things. That is a complete operational system for a small
business and it can be built over a year, one at a time.

## Budgeting for it

- Tool costs, annually (Module 2).
- Setup time, at a realistic rate for your own hours
  (ENT-109).
- Maintenance, which is ongoing.

Against the time saved, at the same rate. Several automations founders
build do not pass this test and are built anyway (ENT-104).

## Getting help

- A freelancer who builds workflows can set up in hours what takes you
  days (ENT-308).
- Make sure you understand what they built and can maintain it.
- Get documentation as a deliverable.
- Make sure accounts are in the business's name, not theirs
  (ENT-302).

## Knowing when to stop

You have enough automation when:

- The repetitive work is handled.
- Nothing important depends on you remembering.
- You can take a week off without things breaking.
- Adding more would save minutes rather than hours.

Past that, you are building systems rather than a business.

## The annual review

- Which automations earned their keep?
- Which cost more in maintenance than they saved?
- What is still manual that should not be?
- What is automated that should not be (Module 3, lesson 2)?
- What is the total tool cost, and is it justified?

## The summary

1. Do it manually until the process is settled.
2. Simplify before automating; automating a bad process makes it bad
   faster.
3. Automate the bottleneck, not the interesting part.
4. Every automation reaching a person needs conditions for not
   running.
5. Build positive confirmation; silent failure is the worst kind.
6. Check you can export your data from every tool, and do it.
7. You are responsible for everything your business publishes,
   whatever produced it.
8. Never put confidential or personal data into a tool without
   checking the terms.
9. Automate the process; keep the relationship.
10. Never build something you could not fall back from.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Maintain and Balance",
            "description": (
                "Submit:\n"
                "1. Every automation you have, documented with purpose, trigger, "
                "configuration location, failure procedure and manual fallback.\n"
                "2. Your positive confirmation mechanism, and anything you found had "
                "silently failed.\n"
                "3. A quarterly review completed, with what you turned off.\n"
                "4. Your access audit: who has access to what, anything tied to a "
                "personal account, and what you changed.\n"
                "5. A tested restore or read of one data export.\n"
                "6. The six things you keep human, with evidence they are.\n"
                "7. Your own process experienced as a customer — sign up, buy, ask, "
                "complain — with what surprised you.\n"
                "8. Your position in the five-step progression for one process.\n"
                "9. The seven operational systems, with which you have and which are "
                "next.\n"
                "10. Your annual review: which automations earned their keep and "
                "which cost more than they saved.\n\n"
                "Graded on part 5 being a real test, part 7 having happened, and part "
                "10 being honest."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Keeping It Working",
            "description": "Four questions on maintenance, limits and progression.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why build positive confirmation into an automation?",
                    "choices": [
                        "Silent failure is the worst kind — nothing tells you it stopped",
                        "It satisfies audit requirements",
                        "It speeds up debugging",
                        "It reduces running costs",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does over-automating produce for a small business?",
                    "choices": [
                        "Lower costs with acceptable service",
                        "A large business's service with none of its resources",
                        "Faster growth with higher churn",
                        "Consistency at the expense of speed",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is a common and serious continuity problem?",
                    "choices": [
                        "Using free tiers for critical tools",
                        "Too many integrations",
                        "Tools registered to a founder's personal account",
                        "Infrequent data exports",
                    ],
                    "answer": 2,
                },
                {
                    "text": "When do you have enough automation?",
                    "choices": [
                        "When every repeated task is covered",
                        "When tool costs stop rising",
                        "When nothing requires manual input",
                        "When you can take a week off without things breaking, and more would save minutes rather than hours",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
