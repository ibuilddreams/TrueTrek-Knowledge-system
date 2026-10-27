"""ENT-315: Tech Stack Automation Capstone. Entrepreneur Pathway, Level 3.
Closes Level 3. Building a low-cost operational backend: front-end frameworks,
cloud databases, telephony and workflow services.

Founder audience, as ENT-101, and the one course in the pathway that names
technologies, because the client's brief does — React, Tailwind CSS, cloud
databases and call/IVR services. It names them as *categories with examples*
rather than as a prescribed stack, and states that specific tools and prices
change; the cost discipline is taught as a method rather than as a figure,
because a monthly budget quoted here would be wrong within a year.

Boundary: ENT-307 is the decision layer — what to automate and what not to;
this is the build. ENT-312 is the storefront. The course assumes a founder who
can learn to build rather than one who already can, and it repeatedly says that
buying an existing tool usually beats building one.
"""

MODULES = [
    {
        "title": "Deciding What to Build",
        "description": "Before writing anything.",
        "lessons": [
            {
                "title": "Buy Before You Build",
                "description": "The default, and when to depart from it.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The default

**Use an existing tool.** For almost everything a small business
needs, something exists that is cheaper than your time and better
maintained than anything you would build (ENT-307).

Building is comfortable, legible and produces no customers. For a
technically inclined founder it is the most seductive form of
avoidance in this pathway (ENT-101, ENT-104).

## The honest cost of building

Founders count the build and forget the rest:

- **Building it**, which takes longer than estimated. Always.
- **Fixing it** when it breaks.
- **Updating** dependencies and platforms.
- **Security** — patching, access, data protection
  (ENT-303).
- **Hosting and services.**
- **Documenting it** so anybody else could maintain it
  (ENT-308).
- **Your attention**, permanently.

A tool you built is a liability with a benefit, and the liability is
ongoing.

## When building is justified

- **Nothing exists** that does the thing.
- **Existing tools are genuinely unaffordable** at your scale, after
  checking.
- **The thing is core** to what makes your business different
  (ENT-111).
- **It is small and stable** — a page, a form, a simple
  integration.
- **You can maintain it**, indefinitely, or you have documented it so
  somebody else could.
- **You have already done it manually** and the process is settled
  (ENT-105).

## When it is not

- To save a modest monthly fee. Your time costs more
  (ENT-109).
- Because existing tools are "not quite right". Adapt your process.
- Because building is more interesting than selling.
- Before you have customers (ENT-102).
- For anything involving payments, authentication or sensitive data,
  unless you genuinely know what that requires (Module 3).

That last one is important: payment handling and authentication are
areas where building badly creates serious risk, and mature services
exist precisely so you do not have to (ENT-312).

## The middle option

Frequently the right answer: **assemble rather than build.**

- Existing services connected together.
- A no-code or low-code workflow tool (ENT-307).
- A spreadsheet doing more than people expect.
- A simple page in front of existing services.

This gets most of the benefit at a fraction of the cost and the
maintenance.

## The test

Before building anything:

1. Does something exist? Have you actually looked?
2. What would it cost, annually, against your time at a realistic
   rate?
3. Is the process settled (ENT-307)?
4. Could I maintain this in two years?
5. What breaks if I am unavailable?
6. Is this the best use of this week (ENT-104)?

Fail any and buy, assemble, or do it manually.
""",
            },
            {
                "title": "What a Small Business Actually Needs",
                "description": "The operational backend, defined.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The components

A complete operational backend for a small business is a short list
(ENT-307):

1. **A way to be found and to present the offer** — a site
   (ENT-312).
2. **A way to take money** — payments.
3. **A record of customers and what has happened** — a database or
   CRM (ENT-307).
4. **A record of money in and out** — accounting
   (ENT-304).
5. **A way to communicate** — email, and possibly phone (Module 2).
6. **A way to schedule**, if relevant.
7. **A way to store files.**
8. **Connections between them**, so things do not have to be typed
   twice.
9. **Backups.**

Nine things. Most businesses need no more, and several of these are
covered by one service.

## What usually exists already

Before building anything, check whether:

- Your site platform includes scheduling, forms and basic records
  (ENT-312).
- Your accounting package handles invoicing and payment chasing
  (ENT-304).
- Your email provider handles sequences (ENT-209).
- A workflow service connects the things you already have
  (ENT-307).

Founders frequently build something their existing tools already do.

## The spreadsheet question

A spreadsheet is a legitimate database for a small business:

- Free.
- You understand it.
- Portable.
- Adequate to a surprising scale.

It stops being adequate when several people need it simultaneously,
when volume makes it slow, when errors become frequent, or when it
needs to connect to other things reliably.

Move when it binds, not before (ENT-307).

## Where custom work earns its place

For a small business, usually one of:

- **A simple front end** collecting information into an existing
  service — a form, an intake, a booking page.
- **A small internal tool** replacing a manual process you have
  already proven (ENT-307).
- **A connection** between two services nothing else connects.
- **A customer-facing page** doing something specific to your
  business.

All small, all stable, all maintainable.

## What to avoid building

- Payments (ENT-312).
- Authentication and user accounts.
- Anything storing sensitive personal data, unless you know what that
  requires (Module 3, ENT-303).
- Anything you could not explain to somebody else.
- Anything mission-critical with no fallback (ENT-307).

## Sequencing

If you are building anything:

1. Get customers first (ENT-102).
2. Do it manually (ENT-105).
3. Assemble from existing tools.
4. Build only what remains.

Most founders who follow that order find step four is empty.
""",
            },
            {
                "title": "Budgeting the Stack",
                "description": "Keeping the cost genuinely low.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Prices change

The client's brief frames this as building a backend for a low monthly
figure. **The specific figure is not stated here**, because service
prices and free tiers change constantly and a number printed in a
course goes stale.

What does not change is the **method** for keeping it low.

## The method

1. **List every component you genuinely need** (lesson 2).
2. **For each, find the cheapest adequate option**, including free
   tiers.
3. **Total it annually**, not monthly — the annual figure is the one
   that is honest.
4. **Compare each line against what it saves.**
5. **Cut anything you cannot justify** (ENT-109).
6. **Review quarterly.**

## Where free tiers work

Many services have genuinely useful free tiers at small scale:

- Hosting for simple sites.
- Databases below a size threshold.
- Workflow services below a volume.
- Email below a list size (ENT-209).
- Version control and code hosting.

**Understand the limits** before depending on one:

- What happens when you exceed it?
- Can you export your data (ENT-307)?
- Will the free tier still exist next year?
- Is it suitable for business and for the data you hold
  (ENT-303)?

Free is a reasonable way to start and a poor thing to depend on for
anything critical.

## Where to spend

Some things are worth paying for even at a small scale:

- **Your own domain**, owned by you (ENT-312).
- **Anything touching payments**, where a reputable provider reduces
  your obligations substantially.
- **Backups**, which must be reliable.
- **Anything holding personal data**, where the provider's terms and
  security matter (ENT-303).
- **Accounting** (ENT-304).

## Where costs accumulate

The quarterly audit usually finds (ENT-307):

- Services signed up for and never used.
- Duplicate tools doing the same thing.
- Plans upgraded for one feature.
- Add-ons on a platform (ENT-312).
- Services tied to a personal card nobody reviews.

## The real cost

Beyond subscriptions (ENT-110):

- Your time building and maintaining, at a realistic rate.
- Time learning tools.
- The cost of something breaking.

A stack that is cheap in subscriptions and expensive in your hours is
not cheap.

## Keeping it simple

The strongest cost control is **fewer components**:

- Each one is a cost, a login, a dependency and a thing to maintain.
- One tool doing three things adequately usually beats three doing one
  thing well, at this scale (ENT-307).
- Every connection between services is a thing that can break.

## The annual review

- Total annual cost of the stack.
- Each line: what breaks if cancelled?
- Anything duplicated?
- Anything outgrown, or no longer needed?
- Your time spent maintaining it.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Decide the Stack",
            "description": (
                "Submit:\n"
                "1. The six-question test applied to something you were going to "
                "build, with the outcome.\n"
                "2. The full honest cost of building it, including maintenance and "
                "your time.\n"
                "3. Your nine components, with what currently covers each.\n"
                "4. Anything your existing tools already do that you were going to "
                "build.\n"
                "5. Where a spreadsheet is still adequate, and what would make it "
                "stop being.\n"
                "6. What you will build, if anything, and why it qualifies.\n"
                "7. What you will not build, specifically including payments and "
                "authentication.\n"
                "8. Your full stack costed annually, line by line.\n"
                "9. Every free tier's limits, export position and suitability for your "
                "data.\n"
                "10. Your quarterly review, with what you cancelled.\n\n"
                "Graded on part 2 including your time, part 8 being annual, and part "
                "10 being real cancellations."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: What to Build",
            "description": "Four questions on buying versus building, components and cost.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is a tool you built?",
                    "choices": [
                        "A liability with a benefit, where the liability is ongoing",
                        "An asset that appreciates",
                        "A cost saving against subscriptions",
                        "A competitive advantage by default",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What should almost never be built by a small business?",
                    "choices": [
                        "A booking form",
                        "An internal reporting page",
                        "Payments and authentication",
                        "A connection between two services",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the strongest cost control for a stack?",
                    "choices": [
                        "Negotiating annual plans",
                        "Using free tiers wherever possible",
                        "Fewer components",
                        "Building rather than subscribing",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What do most founders find if they follow the sequence properly?",
                    "choices": [
                        "That assembling is more expensive than building",
                        "That manual processes do not scale",
                        "That existing tools are inadequate",
                        "That the build step is empty",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Components",
        "description": "What each layer does, with examples.",
        "lessons": [
            {
                "title": "Front End",
                "description": "What people see and interact with.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## What you actually need

For most small businesses, the front end is:

- A site explaining the offer (ENT-312).
- Some forms that collect information.
- Possibly a small internal interface.

That is substantially less than founders assume.

## The simplest adequate options

In ascending complexity:

1. **A hosted site builder.** No code, works immediately, adequate for
   most businesses (ENT-312).
2. **A static site**, written in plain markup and styles. Fast,
   cheap or free to host, nothing to maintain, no security surface.
3. **A site framework**, generating pages at build time. More
   capability, still largely static.
4. **A JavaScript application**, such as one built with **React**.
   Necessary only when you genuinely need an interactive interface.

**Most small businesses do not need the fourth**, and founders choose
it because it is the interesting option.

## When an application is justified

- A genuinely interactive internal tool.
- A customer-facing interface with real state — a dashboard, a
  configurator, a booking flow with complex rules.
- Something existing tools cannot do (Module 1).

## React and the ecosystem

Where it is justified, **React** is a reasonable default choice:

- Widely used, so help and people are available
  (ENT-308).
- Large ecosystem.
- Frameworks built on it handle routing, rendering and deployment, so
  you write less infrastructure.

Alternatives exist and are fine. The choice matters far less than
whether you needed an application at all.

## Styling

**Tailwind CSS** is a reasonable default for a small team:

- Consistent spacing and sizing without inventing a system.
- No separate stylesheet to maintain in parallel.
- Fast to build with once learnt.

Again: plain CSS is fine, and a component library is fine. Pick one,
be consistent, and do not spend a week deciding (ENT-201).

## What matters more than the framework

- **It works on a phone** (ENT-312).
- **It is fast.**
- **It is accessible** — contrast, labels, keyboard navigation,
  alternative text. This is a legal requirement in a growing number of
  places; check what applies (ENT-312).
- **It is consistent** with your identity (ENT-201).
- **It can be maintained** by somebody other than you
  (ENT-308).

## Hosting

- Static sites can be hosted free or very cheaply on several
  platforms.
- Applications need a host that supports them; several have usable
  free tiers.
- **Your own domain**, owned by you, pointed at it
  (ENT-312).
- Automatic deployment from version control, which removes a class of
  mistakes.

## Version control

Even alone, even for a small site:

- Use it from the first file.
- It is your history, your backup and your way back from a mistake.
- It makes bringing somebody in possible (ENT-308).
- Free hosting for repositories is widely available.

Not using version control is the single most common avoidable mistake
by a non-professional building something.
""",
            },
            {
                "title": "Data and Back End",
                "description": "Where information lives.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## What you need

Somewhere to store:

- Customers and contacts (ENT-307).
- Orders, bookings or jobs.
- Whatever your business specifically tracks.

## The options, in ascending complexity

1. **A spreadsheet.** Genuinely adequate at small scale
   (Module 1).
2. **A spreadsheet-like database service**, with forms, views and an
   interface. Frequently the right answer for a small business — no
   code, usable by non-technical people, connects to other services.
3. **A hosted cloud database**, with an interface and an access
   layer. More capability, more to understand.
4. **A database you manage yourself.** Rarely justified at this
   scale.

Most small businesses are well served by the second, and a meaningful
number by the first.

## Cloud database services

Where option three is right, hosted services typically provide:

- A managed database, so you are not maintaining a server.
- An automatically generated access layer, so simple applications need
  little back-end code.
- Authentication, which you should use rather than building
  (Module 1).
- File storage.
- Usable free tiers at small scale (Module 1).

That combination is why a single person can now build something that
previously needed a team — and it is also why the honest answer is
frequently that you do not need to build it at all.

## Modelling the data

Before building anything, write down:

- What things exist — customers, orders, jobs, appointments.
- What information each holds.
- How they relate.
- What must be unique.
- What must never be lost.

Ten minutes on paper prevents substantial rework.

## Access and security

Non-negotiable, and where amateur builds most commonly fail
(ENT-303):

- **Never put credentials in code** that is stored or deployed
  publicly.
- Use the platform's secret management.
- Configure access rules so one user cannot read another's data —
  this is the single most common serious flaw in applications built by
  non-specialists.
- Use the platform's authentication; do not write your own.
- Principle of least privilege for every key and account
  (ENT-307).

**If you are storing personal data, understand your obligations
before you store it** (Module 3).

## Backups

Separately from the provider's own:

- Export regularly, automatically where possible.
- Store the export somewhere else.
- **Test that an export can actually be restored or read**
  (ENT-307).

A provider's backup is their continuity, not yours. A backup nobody
has tested is a hope.

## Portability

Check before committing (ENT-307):

- Can you export everything, in a usable format?
- Is the data in a standard form, or proprietary?
- What happens if you stop paying?

Portability matters more than features. A service you cannot leave is
a dependency, not a tool (ENT-110).

## Keeping it simple

- One source of truth for each kind of information.
- Not three systems holding customer records (ENT-307).
- Fewer fields, consistently used.
- Document what each field means, because you will forget.
""",
            },
            {
                "title": "Communications and Telephony",
                "description": "Email, messaging and calls.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Email

Covered in ENT-209 and the technical points here:

- Send from **your own domain**, not a free address.
- **Configure the authentication records** your provider specifies, or
  your mail will be filtered (ENT-209).
- Separate **transactional** email — confirmations, receipts — from
  **marketing** email, which has consent rules.
- Use a provider for transactional sending rather than your own
  server.

## Phone and IVR

Services such as **Aircall** and similar cloud telephony providers let
a small business have:

- A business number separate from your mobile.
- Call routing by time, by person or by choice.
- An interactive menu — "press one for…" — which is what IVR means.
- Voicemail to email or to text.
- Call recording, where lawful.
- Numbers in several places.
- Connection to your customer records (ENT-307).

## When a phone system is worth it

- Customers expect to phone you.
- More than one person answers.
- You need calls routed outside working hours (ENT-112).
- You want calls logged against customer records.
- You do not want your personal number public.

For a solo business with few calls, voicemail and a business number
may be enough. Do not build a menu system for eight calls a week.

## Designing a menu badly

The common failure, and customers hate it (ENT-309):

- Too many options.
- Too many levels.
- No way to reach a person.
- Long recorded messages.
- No indication of wait.

For a small business, the advantage is being **easy to reach**
(ENT-111). A menu system that makes you harder to reach removes
the advantage. Keep it to one level, with an obvious route to a
person.

## Recording calls

**Regulated in most countries**, frequently requiring notification or
consent, and sometimes both parties' consent
(ENT-303):

- **Check the rules where both parties are** before recording
  anything.
- Tell callers clearly.
- Know how long you keep recordings and why.
- Recordings of customers are personal data (Module 3).

Do not record because the platform offers it. Record because you have
a reason and have checked.

## Messaging

- Business messaging accounts rather than personal.
- Response time expectations stated (ENT-309).
- Records kept where the conversation matters
  (ENT-304).
- Be aware that messaging platforms' business terms differ from
  personal use.

## Connecting it together

The value is in the connections (ENT-307):

- A call logged against the customer record.
- A form submission creating a record and notifying you.
- A purchase triggering a confirmation and an onboarding sequence
  (ENT-309).

A workflow service connects most things without code, which is
frequently the right answer (Module 1).

## Keeping it reliable

- Know what happens if a service is down.
- Have a fallback — a number that still rings, an inbox still
  monitored.
- Test the whole path periodically by using it yourself
  (ENT-307).
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Assemble It",
            "description": (
                "Submit:\n"
                "1. Your front-end choice, with why a simpler option was not "
                "sufficient.\n"
                "2. Your site checked on a phone, for speed and for accessibility, "
                "with what you fixed and what accessibility rules apply where you "
                "operate.\n"
                "3. Version control in use from the first file, with the repository.\n"
                "4. Your data model written down before building: things, fields, "
                "relationships, what must never be lost.\n"
                "5. Your data store choice, with why a spreadsheet or a no-code "
                "database was not sufficient.\n"
                "6. Your access rules, demonstrating one user cannot read another's "
                "data, and confirmation no credentials are in stored code.\n"
                "7. Your backup export, automated, stored elsewhere, and tested by "
                "restoring or reading it.\n"
                "8. Your data portability position for every service.\n"
                "9. Your email authentication configured per your provider, with "
                "transactional and marketing separated.\n"
                "10. If using telephony: your menu design at one level with a route to "
                "a person, and the call recording rules where both parties are.\n\n"
                "Graded on part 6 being demonstrated, part 7 being tested, and part 10 "
                "citing the recording rules."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Components",
            "description": "Four questions on front end, data and communications.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the single most common avoidable mistake by a non-professional building something?",
                    "choices": [
                        "Not using version control from the first file",
                        "Choosing the wrong framework",
                        "Over-styling the interface",
                        "Hosting on a free tier",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the most common serious flaw in applications built by non-specialists?",
                    "choices": [
                        "Poor performance under load",
                        "Access rules that let one user read another's data",
                        "Inconsistent styling",
                        "Missing error handling",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What matters more than features when choosing a data service?",
                    "choices": [
                        "The free tier limits",
                        "The interface quality",
                        "Portability — a service you cannot leave is a dependency, not a tool",
                        "The integration ecosystem",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does a badly designed phone menu remove?",
                    "choices": [
                        "The cost saving of cloud telephony",
                        "The ability to route out of hours",
                        "The call logging benefit",
                        "The small business advantage of being easy to reach",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Building and Running It",
        "description": "Security, maintenance and the capstone.",
        "lessons": [
            {
                "title": "Security and Data Obligations",
                "description": "What you take on by holding data.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Building something means holding data

And holding personal data brings legal obligations regardless of how
small you are (ENT-303).

**Find out what applies from your data protection authority before
you store anything**, and take advice if you hold anything sensitive
(ENT-314).

## The questions

1. What personal data will this hold, and why?
2. What is my lawful basis?
3. Where is it stored, and does that matter
   (ENT-308)?
4. Who can access it?
5. How long do I keep it?
6. How do I respond to a request for access or deletion?
7. What do I do if there is a breach, and within what deadline?
8. Do I need written terms with the provider?

## The security basics

Non-negotiable for anything you build:

- **Credentials in environment variables or secret management**, never
  in code or in version control.
- **Two-factor authentication** on every account
  (ENT-307).
- **Access rules enforced server-side**, not only in the interface. A
  check in the browser is not security.
- **Least privilege** for every key.
- **Dependencies updated**, which is a recurring job.
- **HTTPS everywhere.**
- **Input validated** before it reaches a database.
- **Use the platform's authentication** rather than writing your own
  (Module 1).

## What to avoid entirely

Unless you genuinely know what you are doing:

- Storing card details (ENT-312).
- Writing your own authentication or password handling.
- Handling health data without understanding the regime
  (ENT-314).
- Rolling your own encryption.

Mature services exist for all of these, and the gap between an
amateur implementation and a professional one is the difference
between a minor incident and a serious one.

## Access control

When somebody else works on it (ENT-308):

- Individual accounts, never shared logins.
- Minimum access required.
- Removed promptly when the engagement ends.
- A record of who has access to what.

A contractor with live database access two years later is a real and
common problem.

## Secrets and keys

- Rotate them when anybody leaves.
- Never send them by message or email.
- Use a secret manager or the platform's facility.
- If one is ever exposed publicly, assume it is compromised and rotate
  immediately.

## Backups, again

Because it is the thing that saves you (Module 2):

- Automated.
- Stored separately from the live system.
- Tested by actually restoring.
- Retained for a sensible period.

## If something goes wrong

- Contain it immediately.
- Assess what data was affected.
- **Report within the mandatory deadline** where required — these are
  frequently very short (ENT-303).
- Notify affected individuals where required.
- Take advice the same day (ENT-212).
- Record what happened and what you changed.

## The proportionate view

None of this is optional because the business is small. It is also not
enormous work: strong authentication, secrets handled properly,
server-side access rules, updates, backups and a known breach
procedure.

A day to set up properly, and then periodic maintenance
(ENT-307).
""",
            },
            {
                "title": "Maintaining What You Built",
                "description": "The ongoing cost.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## It is never finished

Anything you build requires:

- **Dependency updates**, including security patches.
- **Platform changes** that break things.
- **Fixes** when something stops working.
- **Changes** as the business changes.
- **Monitoring**, so you know when it fails.

Budget the time. A small application is perhaps a few hours a month
on average, and occasionally a bad week (ENT-104).

## Monitoring

Know when it breaks, rather than hearing from a customer
(ENT-307):

- Uptime monitoring, which is cheap or free.
- Error reporting.
- A notification when a scheduled job does not run.
- Periodic manual checks of the whole path.

**Silent failure is the worst kind.** Build in positive confirmation.

## Documentation

For anything you build (ENT-308):

- What it does.
- How it is deployed.
- Where the configuration and secrets live.
- How to run it locally.
- What breaks it.
- The manual fallback.

Write it as you build. Future you will not remember, and neither will
anybody you hand it to.

## The manual fallback

Never build anything you could not fall back from
(ENT-307):

- Know how to do the thing by hand.
- Keep the manual process documented.
- Make sure a failure degrades to manual rather than to nothing.

## Handing it over

If somebody else will maintain it (ENT-308):

- Documented.
- In version control (Module 2).
- Accounts in the business's name, not yours or theirs
  (ENT-307).
- No undocumented local configuration.
- Standard tools rather than unusual choices.

A system only you can run is a continuity risk
(ENT-109).

## Knowing when to retire it

Built things outlive their usefulness:

- The process changed and the tool did not.
- An existing product now does it better (Module 1).
- Maintenance exceeds the benefit.
- Nobody uses it.

Retiring something is a legitimate decision. Keep the data, remove the
system, and document what replaced it.

## Reviewing

Quarterly (ENT-307):

- Is each thing still used?
- Is each still maintained and updated?
- What broke, and why?
- What is the total time spent maintaining?
- Would buying something now be cheaper (Module 1)?

That last question is worth asking honestly every year. Products
improve, and something you built two years ago because nothing existed
may now be available for a modest fee.

## The honest accounting

Add up, annually:

- Subscription cost of the stack (Module 1).
- Hours spent building, at a realistic rate.
- Hours spent maintaining.
- Cost of anything that broke.

Against the value. Founders consistently underestimate the second and
third (ENT-110).
""",
            },
            {
                "title": "The Capstone",
                "description": "Putting it together, and closing Level 3.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The exercise

Build the operational backend for your actual business, as cheaply as
it can sensibly be done, and document it.

Not a demonstration project. The real thing, running your real
business.

## The steps

1. **Map the processes** you actually run (ENT-307).
2. **Simplify** them before anything else.
3. **List the components** you need (Module 1).
4. **For each, find the cheapest adequate option** — buy, assemble or
   build (Module 1).
5. **Connect them** so nothing is typed twice (Module 2).
6. **Secure it** (Module 3, lesson 1).
7. **Back it up and test the restore.**
8. **Document it** (Module 3, lesson 2).
9. **Cost it annually**, including your time.
10. **Use it for a month**, then review.

## What good looks like

- The whole thing costs little per month and you can state the figure.
- Nothing is typed twice.
- Customer information lives in one place.
- Money is recorded automatically (ENT-304).
- Standard communications happen without you.
- You are notified when something fails.
- Everything is backed up and the restore has been tested.
- Somebody else could run it from your documentation.
- You could fall back to manual for anything.

## What it should not be

- A project that took three months (ENT-104).
- Something only you understand.
- Dependent on a single provider you cannot leave
  (ENT-110).
- Holding personal data without the obligations addressed
  (Module 3, lesson 1).
- More impressive than the business it serves.

That last one is the real test. A sophisticated stack running a
business with four customers is a hobby (ENT-101).

## Closing Level 3

Across these fifteen courses: structure, intellectual property,
contracts, accounts, tax, supply chain, automation, remote teams,
customer success, inventory, risk, e-commerce, converting income into
assets, regulated services, and the technical backend.

One theme recurs in almost every one:

> **Establish what applies to you from the official source, take
> professional advice on the things that matter, write it down, put
> the dates in a calendar, and then stop thinking about it and go and
> find customers.**

The operational and legal layer is a foundation, not the work. Built
properly once, it should take a few hours a month and otherwise be
invisible (ENT-104).

## The summary

1. Buy before you build; a tool you built is an ongoing liability.
2. Assemble from existing services before writing anything.
3. Never build payments or authentication yourself.
4. Nine components cover most small businesses.
5. Cost the stack annually, including your own time.
6. Use version control from the first file.
7. Enforce access rules server-side; a browser check is not security.
8. Never put credentials in code; test your backups by restoring.
9. Build in positive confirmation — silent failure is the worst kind.
10. Never build anything you could not fall back from.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Build and Document It",
            "description": (
                "Submit, citing sources where relevant:\n"
                "1. All eight data questions answered for what you hold, from your "
                "data protection authority.\n"
                "2. Your security checklist, with evidence for each: secrets handling, "
                "two-factor, server-side access rules, least privilege, updates, "
                "HTTPS, input validation.\n"
                "3. Confirmation you are not storing card details or writing your own "
                "authentication.\n"
                "4. Your access register, with anybody who should no longer have "
                "access removed.\n"
                "5. Your breach procedure and the mandatory deadline that applies to "
                "you.\n"
                "6. Your monitoring, with positive confirmation that scheduled jobs "
                "ran.\n"
                "7. Your documentation: purpose, deployment, configuration, local "
                "setup, failure modes, manual fallback.\n"
                "8. Your complete stack, built and running your real business, with "
                "the annual cost including your time.\n"
                "9. Evidence nothing is typed twice and customer information lives in "
                "one place.\n"
                "10. A month of real use, with what broke, what you changed, and an "
                "honest answer on whether the stack is more impressive than the "
                "business it serves.\n\n"
                "Graded on part 2 being evidenced, part 8 being the real business, and "
                "part 10's honesty."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Building and Running",
            "description": "Four questions on security, maintenance and the capstone.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Where must access rules be enforced?",
                    "choices": [
                        "Server-side — a check in the browser is not security",
                        "In the interface, for responsiveness",
                        "At the network level only",
                        "Wherever the framework defaults to",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What should you never build yourself unless you genuinely know what it requires?",
                    "choices": [
                        "A booking interface",
                        "Authentication and password handling",
                        "A reporting dashboard",
                        "An integration between two services",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What question is worth asking honestly every year about something you built?",
                    "choices": [
                        "Can it handle more volume?",
                        "Should it be rewritten with newer tools?",
                        "Would buying something now be cheaper?",
                        "Could it be sold to others?",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is a sophisticated stack running a business with four customers?",
                    "choices": [
                        "A sound investment in scalability",
                        "An advantage over competitors",
                        "Evidence of technical capability",
                        "A hobby",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
