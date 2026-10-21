"""CEO-203: Financial Literacy, Wealth Preservation & Tax Management.

Level 2: Business Operations, Branding & Compliance. Written against the
course's focus (managing 1099 independent contractor income and long-term
financial health) and its core competencies: basic tax forecasting, 1099 versus
W-2 earnings, setting up business accounts, liquid reserve management, and
evaluating financial advisers and fiduciaries.

Thresholds, rates and deadlines change by tax year, so the lessons teach the
mechanism and tell the student to confirm the current figures with the IRS and a
tax preparer rather than trusting a number in a course.
"""

MODULES = [
    {
        "title": "Money Mechanics",
        "description": (
            "The foundations: where money comes from, where it goes, and the three-account "
            "structure that keeps those two questions answerable."
        ),
        "lessons": [
            {
                "title": "Income Is Not the Same as Money You Can Spend",
                "description": "Gross, net, set-aside and spendable — the four numbers behind every payment.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Four numbers, not one

A business pays you $1,000. How much of it is yours?

**Gross.** $1,000. The number everyone quotes and the only one most athletes
track.

**Costs.** What it took to earn it — equipment, travel, editing, a portion of
your phone bill. Real money that left your hands.

**Tax set-aside.** Money you are holding on behalf of a tax bill that has not
arrived yet. It was never yours; it is just sitting in your account temporarily.

**Spendable.** What remains. For self-employed income with any costs attached,
spendable is routinely half of gross or less.

## Why this is the first lesson

The most common financial failure for young earners is not overspending in the
ordinary sense. It is spending the tax set-aside, which does not feel like
overspending at all — the money was genuinely in the account — and then facing a
bill with nothing behind it.

The discipline that prevents it is structural, not moral. You do not need to be
good with money. You need the set-aside to be somewhere you do not look.

## Cash flow, not profit

A second trap: being owed money is not the same as having it. "Net 60" payment
terms from CEO-202 mean an agreement signed in March may pay in June. Plan on
what has arrived, never on what is promised.

## The habit that starts today

Every payment gets logged on arrival: date, who from, gross amount, what it was
for, and whether tax has been withheld. Five lines. Module 3 turns that log into
a tax forecast, and CEO-202's paid-item register is the same record seen from
the compliance side.
""",
            },
            {
                "title": "The Three Accounts",
                "description": "Operating, tax and reserve — the simplest structure that survives real income.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Three accounts, one rule each

**1. The operating account.** All income arrives here, and all business costs
are paid from here. Nothing is spent personally from this account, which is what
makes your records readable at tax time.

**2. The tax account.** A separate account, ideally at a different institution so
it is a few steps away. On the day money arrives, a fixed percentage moves here
immediately and never moves back except to pay tax. Module 3 sets the
percentage.

**3. The reserve.** Your liquid savings — the buffer that absorbs a lost deal, a
broken laptop or an injury. Module 5 covers how big it should be.

Everything left after those three is transferred to your personal account and is
genuinely yours to spend.

## Why separation works

It converts a decision you would have to make under temptation into a transfer
you make once, on the day money arrives, while you are calm. The same mechanism
as the governance rules in CEO-101: decide in advance, apply later.

It also makes the records trivial. One account's statement is your business
income and expenses, ready for the preparer. Mixed accounts are where young
earners lose both deductions and hours.

## What you need to open them

Rules differ by bank and by state, and most minors will need a parent or
guardian as joint account holder. Some banks offer accounts designed for
under-eighteens with a guardian attached. Ask two institutions before choosing;
the answers vary more than people expect.

## Before an entity

Separate accounts are not the same as forming a company. You do not need an LLC
to be organised, and Module 4 covers when an entity is worth the cost and when
it is simply an expense someone sold you.
""",
            },
            {
                "title": "Income and Cash Flow Log (Template)",
                "description": "Payment log, cost log and the three-account transfer sheet.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable log for Module 1. The income sheet records every payment on arrival:
date, payer, gross, what it was for, whether anything was withheld, and the date
the tax transfer was made.

The cost sheet records money spent to earn it — equipment, travel, software,
fees — with the receipt reference. The transfer sheet tracks the three accounts:
what arrived, the percentage moved to tax, the amount moved to reserve, and what
was released as spendable.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Set Up the Three Accounts and Start the Log",
            "description": (
                "Build the structure before the money arrives.\n\n"
                "Submit:\n"
                "1. Your three-account plan: which institution each account is at, who the joint "
                "account holder is, and the status of each (open, being opened, researched). "
                "Include what two institutions told you about accounts for someone your age.\n"
                "2. Your transfer rule, written as a sentence: what percentage moves to tax, "
                "what moves to reserve, and when the transfer happens.\n"
                "3. Your income and cost log, set up and populated with anything you have "
                "already earned or spent in the last six months. If that is nothing, populate it "
                "with a realistic worked example of a $500 deal including costs.\n"
                "4. A four-number breakdown of one real or example payment: gross, costs, tax "
                "set-aside, spendable.\n"
                "5. One paragraph on where your money currently goes and what, if anything, you "
                "could not account for last month.\n\n"
                "Graded on whether the structure is real and specific, and on the honesty of the "
                "final paragraph."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Money Mechanics",
            "description": "Four questions on the four numbers and the three-account structure.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does the course describe the tax set-aside as money that was never yours?",
                    "choices": [
                        "It is held on behalf of a tax bill that has not arrived yet",
                        "It belongs to the business that paid you until the year ends",
                        "It is withheld automatically by the payer",
                        "It is a deposit that is refunded after filing",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the rule for the operating account?",
                    "choices": [
                        "It holds only the tax set-aside",
                        "All income arrives there and all business costs are paid from there, with no personal spending",
                        "It is used for personal spending so the other accounts stay untouched",
                        "It is opened only once annual income passes a threshold",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course recommend keeping the tax account at a different institution?",
                    "choices": [
                        "Interest rates are higher at a second bank",
                        "Tax authorities require a dedicated institution",
                        "It puts the money a few steps away, so spending it is a deliberate act",
                        "It prevents the payer from reversing a transfer",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the lesson say about planning around money you are owed?",
                    "choices": [
                        "Count it once the contract is signed",
                        "Count half of it, since most deals pay partially",
                        "Count it from the invoice date",
                        "Plan on what has arrived, never on what is promised",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "1099 Income and How It Is Taxed",
        "description": (
            "The difference between being an employee and being paid as an independent "
            "contractor, and what that difference costs."
        ),
        "lessons": [
            {
                "title": "W-2 and 1099: Two Completely Different Experiences",
                "description": "Who withholds, who pays which taxes, and why a 1099 dollar is worth less than a W-2 dollar.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The summer job version

A summer job hands you a **W-2**. Your employer withholds income tax and your
share of Social Security and Medicare from each paycheque, pays the employer's
matching half of those payroll taxes itself, and sends the money in on your
behalf. You receive the remainder. At tax time you may owe a little or get a
refund, but the heavy lifting already happened.

## The NIL version

A brand deal usually produces a **Form 1099-NEC** — nonemployee compensation.
You are an independent contractor, which means:

- **Nothing is withheld.** The full amount arrives and the full tax liability
  arrives with it, later.
- **You owe self-employment tax.** As a contractor you pay both halves of Social
  Security and Medicare — the share an employer would normally cover as well as
  your own. The combined rate is substantially higher than the payroll deduction
  on a W-2.
- **You may owe tax during the year**, not just at filing. Module 3 covers
  estimated payments.
- **You can deduct genuine business expenses**, which a W-2 employee generally
  cannot. This is the one real advantage, and it only works if the records exist.

## Thresholds you need to confirm, not memorise

A payer generally issues a 1099-NEC once payments to you reach a set threshold
in a year, and there is a separate, much lower net-earnings figure above which
self-employment income must be reported at all. Both are set in the tax code and
both can change.

**A 1099 arriving is not what creates the obligation.** Income is reportable
whether or not a form was issued. An athlete paid $300 by three different
businesses may receive no 1099 at all and still have income to report.

## Non-cash compensation counts

Free product, gear, travel and event access are generally income at fair market
value. The sports drink company that sends a year of product has given you
something with a value, and CEO-202's paid-item register is where that value was
already recorded.

## This is education, not tax advice

Everything here is the mechanism. The numbers, your particular situation and the
filing itself belong to a tax preparer, and Module 6 covers how to find one.
""",
            },
            {
                "title": "What Counts as a Deduction, and What Does Not",
                "description": "Ordinary and necessary business expenses, record-keeping, and the claims that get athletes in trouble.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The standard

A deductible business expense is generally one that is **ordinary** (normal in
your line of work) and **necessary** (helpful and appropriate for it). Both
words matter.

## Commonly legitimate for an athlete earning NIL income

- Camera, lighting, microphone, editing software used to produce content.
- The business-use share of your phone and internet.
- Travel undertaken for a paid engagement.
- Fees paid to an editor, designer, lawyer or accountant.
- Shipping, product samples bought for a review, business banking fees.

## Commonly not

- Ordinary training, gym membership and equipment used to play your sport.
  Athletes assume these are deductible against NIL income and they generally are
  not, because the income is earned from endorsement activity rather than from
  competing.
- Clothing that is wearable in ordinary life, even if bought for a shoot.
- Meals with friends recategorised afterwards as business meetings.
- Anything with no record.

## Mixed-use items

A phone used for everything is deductible only in the business-use proportion,
and you need a basis for the number you use. A guess written down in April is
not a basis.

## Records, or it did not happen

For every expense: date, amount, vendor, business purpose, and the receipt.
Photograph receipts on the day; thermal paper fades to blank within a year.
Keep them for at least seven years alongside the compliance records from
CEO-202.

## The honesty point

Aggressive deductions are a bad trade for someone at the start of a public
career. The amounts involved for a high school athlete are small and the
downside is not. Claim what is genuinely yours, document it properly, and spend
the energy on earning more rather than on under-reporting.
""",
            },
            {
                "title": "1099 and Deduction Reference Sheet",
                "description": "Side-by-side W-2 and 1099 comparison plus a deduction categories worksheet.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable reference for Module 2. Page one compares W-2 and 1099-NEC income
across withholding, payroll and self-employment tax, filing obligations, timing
and deductibility, with a blank column for the current-year figures you confirm
yourself.

Page two is the deduction worksheet: category rows for equipment, software,
business-use phone and internet, travel, professional fees and shipping, each
with columns for the business-use percentage, the basis for that percentage, and
the receipt reference. A shaded panel lists the claims athletes most often get
wrong.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Income Classification and Deduction Audit",
            "description": (
                "Work out how your income would actually be treated.\n\n"
                "Submit:\n"
                "1. A classification of every source of income you have had in the last twelve "
                "months — job, NIL payment, gift, prize, non-cash product — and whether each is "
                "W-2, 1099/self-employment, or something else. Explain your reasoning for any "
                "you are unsure about.\n"
                "2. Current-year figures, looked up and cited with the date: the 1099-NEC "
                "issuance threshold, and the net self-employment earnings figure above which "
                "self-employment income must be reported. Do not copy these from the lesson — "
                "the lesson deliberately does not give them.\n"
                "3. A deduction audit of your own spending over six months: every expense you "
                "believe is a legitimate business expense, with amount, business purpose, "
                "business-use percentage and whether you hold the receipt.\n"
                "4. A disallowed list: three things you might have assumed were deductible but "
                "are not, with the reason.\n"
                "5. A worked example: for a $2,000 year of NIL income with $400 of genuine "
                "costs, describe in plain language which taxes would be in play. You are not "
                "calculating a final figure — you are showing that you understand the mechanism.\n\n"
                "Graded on the accuracy of the classifications, whether the current figures were "
                "actually looked up and cited, and on the realism of the deduction audit."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: 1099 Income",
            "description": "Four questions on contractor income, self-employment tax and deductions.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What is the main practical difference between W-2 and 1099-NEC income?",
                    "choices": [
                        "1099 income is not taxable until it exceeds an annual limit",
                        "Nothing is withheld from 1099 income, and the contractor owes both halves of Social Security and Medicare",
                        "W-2 income cannot be earned by anyone under eighteen",
                        "1099 income is taxed at a lower rate than employment income",
                    ],
                    "answer": 1,
                },
                {
                    "text": "If no business sends you a 1099 form, what is your reporting obligation?",
                    "choices": [
                        "Income is reportable whether or not a form was issued",
                        "Nothing is reportable without a form",
                        "Only income above $10,000 must be reported",
                        "The obligation moves to the business that failed to issue it",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which of these is most likely to be a legitimate deduction against NIL income?",
                    "choices": [
                        "Your gym membership and training equipment",
                        "Clothing bought for a shoot that you also wear normally",
                        "Editing software used to produce sponsored content",
                        "Meals with teammates after practice",
                    ],
                    "answer": 2,
                },
                {
                    "text": "How is free product received from a brand generally treated?",
                    "choices": [
                        "As a gift, outside the tax system",
                        "As income only if it is later sold",
                        "As a marketing expense of the brand with no effect on you",
                        "As income at fair market value",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Tax Forecasting and the Set-Aside",
        "description": (
            "Estimating what will be owed before it is owed, and the quarterly rhythm that "
            "keeps a tax bill from becoming an emergency."
        ),
        "lessons": [
            {
                "title": "Forecasting Without Doing Your Own Return",
                "description": "A conservative set-aside method that does not require you to be an accountant.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## You are not calculating a return

Forecasting has one job: make sure the money is there when the bill arrives.
Being approximately right and over-reserved is a complete success. Being exactly
right and under-reserved is a failure.

## The conservative method

1. **Start from net, not gross.** Income minus genuine business costs.
2. **Apply a single set-aside percentage** to every payment on the day it
   arrives. Ask your tax preparer for the right figure for your situation, and
   in the absence of one, choose a percentage high enough to cover both
   self-employment tax and any income tax — erring upward.
3. **Add state and local tax** if your state has an income tax. Several do not;
   confirm yours.
4. **Never reduce the percentage during the year** because a bill looks smaller
   than expected. Over-reserving produces a refund, which is a pleasant problem.

## Why a flat percentage

A flat percentage applied on arrival is the only method that reliably survives a
teenager's year. Methods that require a recalculation after each payment do not
get done.

## The quarterly rhythm

Self-employed earners are generally expected to pay tax during the year through
**estimated payments**, on a schedule of four dates. Missing them can produce a
penalty even if the full amount is paid at filing.

Whether you need to make them, how much, and whether withholding from a parent's
return or a part-time job covers it, is a question for a preparer. What belongs
to you is the calendar: find this year's four dates, put them in your calendar
with a two-week warning, and review your set-aside against your log at each one.

## The three-question quarterly review

1. What did I actually earn since the last review?
2. Is the set-aside percentage still enough?
3. Has anything changed — a bigger deal, a new state, a new category of income?
""",
            },
            {
                "title": "The Year-End File and the First Filing",
                "description": "What to collect, when to collect it, and how to arrive at a preparer organised.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Build the file all year

By January you should be assembling a folder, not reconstructing a year. It
contains:

- Every 1099 received, and your own log of income where no 1099 arrived.
- Your expense log with receipts, organised by category.
- Records of non-cash compensation at fair market value.
- Bank statements for the operating and tax accounts.
- Any W-2 from ordinary employment.
- Last year's return, once there is one.

## Dependents and whose return this touches

Most high school athletes are claimed as dependents on a parent's or guardian's
return. That does not remove your own filing obligation if you have
self-employment income, and the two returns interact in ways worth getting
right. Bring your guardian into the first filing conversation. It is their
return that is affected too.

## What a preparer is worth

A competent preparer for a simple self-employment return typically costs less
than a single brand deal and will usually find more than they cost. The purpose
is not only the filing — it is getting the set-aside percentage and the
estimated-payment question answered by someone qualified, early, instead of in
the week of a deadline.

## Earned income opens a door

Self-employment income is **earned** income, and earned income is what makes
retirement accounts available to a minor. A custodial retirement account funded
from NIL earnings at sixteen has an extraordinarily long runway, and the
contribution limit is tied to earned income. It is worth asking a preparer about
in the first conversation rather than the tenth — the current limits, rules and
account types are theirs to confirm.

## The filing habit

File on time, every year, even in a year with almost nothing in it. The habit is
what matters. An athlete whose first serious income year is also their first
filing year is learning two things at once under a deadline.
""",
            },
            {
                "title": "Tax Forecast and Year-End File Checklist",
                "description": "Quarterly forecast sheet and the year-end document checklist.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable pack for Module 3. The forecast sheet runs four quarterly rows: income
since the last review, costs, net, the set-aside percentage applied, the balance
in the tax account, and the three review questions with space for answers.

The year-end checklist lists every document to collect — 1099s, your own income
log, categorised expenses with receipts, non-cash records, statements, any W-2,
prior-year return — with a received column and a note of who is preparing the
return and when the appointment is.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Build a Twelve-Month Tax Forecast",
            "description": (
                "Forecast a realistic year and set the calendar that supports it.\n\n"
                "Submit:\n"
                "1. A twelve-month income forecast for your own situation. If you have no income "
                "yet, forecast a plausible first year and say so.\n"
                "2. Your set-aside percentage and the reasoning behind it, including whether "
                "your state has an income tax. State who you will confirm the percentage with.\n"
                "3. This year's four estimated-payment dates, looked up and cited, each entered "
                "in your calendar with a two-week warning. Include a screenshot or description "
                "of the calendar entries.\n"
                "4. A quarterly review plan: the four dates you will review, and the three "
                "questions you will answer at each.\n"
                "5. Your year-end file checklist, with what you already hold marked off.\n"
                "6. One paragraph on who will prepare your return, how you will find them if you "
                "do not have one, and when you will make contact.\n\n"
                "Graded on whether the forecast is realistic, whether the dates were genuinely "
                "looked up for the current year, and whether the set-aside is conservative."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Forecasting and Filing",
            "description": "Four questions on set-asides, estimated payments and the year-end file.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the stated job of a tax forecast?",
                    "choices": [
                        "To calculate the exact amount owed before filing",
                        "To make sure the money is there when the bill arrives",
                        "To reduce the amount of tax payable",
                        "To replace the need for a tax preparer",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course recommend a flat set-aside percentage applied on arrival?",
                    "choices": [
                        "It is required by the IRS for contractors",
                        "It produces the lowest possible tax bill",
                        "It is the only method that reliably gets done across a real year",
                        "It removes the need to track expenses",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What can happen if required estimated payments are missed, even when the full amount is paid at filing?",
                    "choices": [
                        "The income becomes non-reportable",
                        "The return is automatically rejected",
                        "The set-aside percentage must be doubled",
                        "A penalty can still apply",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Why does the lesson say self-employment income being “earned” income matters for a minor?",
                    "choices": [
                        "Earned income is what makes retirement account contributions possible",
                        "Earned income is exempt from self-employment tax",
                        "Earned income does not have to be reported until eighteen",
                        "Earned income removes the dependent status on a guardian's return",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Banking, Entities and Records",
        "description": (
            "Choosing accounts, understanding when a business entity is worth it, and keeping "
            "records that survive scrutiny."
        ),
        "lessons": [
            {
                "title": "Do You Need an LLC?",
                "description": "What an entity does and does not do, and the honest answer for most high school athletes.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## What an entity actually provides

A limited liability company is a legal person separate from you. Its main
practical benefits:

- **Liability separation.** Claims against the business reach the business's
  assets rather than your personal ones — as long as the separation is
  maintained in practice.
- **A business name** that is not your personal name.
- **A structure** that can hold contracts, accounts and, later, partners.

## What it does not provide

- **It is not a tax shelter.** A single-member LLC is ordinarily taxed as a
  disregarded entity: the income lands on the owner's return exactly as it would
  have anyway. People sell this benefit; it does not exist in the simple case.
- **It is not protection against your own conduct**, and not against a contract
  you personally signed or guaranteed.
- **It is not free.** Formation fees, annual state fees, possible registered
  agent costs, a separate bank account and a more complicated return.

## The honest answer for most high school athletes

Not yet. With a few thousand dollars of income and simple deals, the cost and
administration outweigh the benefit. Separate accounts and clean records — which
you built in Module 1 — deliver most of the organisational value at no cost.

## When it starts to make sense

- Income reaches a level where a preparer actively recommends it.
- You are selling a physical product, running events, or employing anyone.
- A counterparty requires it.
- There is genuine liability exposure — people at a camp you run, for example.

## The rule for any adviser who suggests one

Ask what it changes for them financially if you say yes. The conflict test from
CEO-101 applies in full. Entity formation services are a product being sold, and
the person recommending it is frequently the person providing it.
""",
            },
            {
                "title": "Records That Survive Scrutiny",
                "description": "What to keep, how to organise it, and the monthly reconciliation habit.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## One folder structure, used forever

Set it up once:

```
Finance/
  2026/
    income/        (1099s, invoices, payment confirmations)
    expenses/      (receipts by month)
    statements/    (operating, tax, reserve)
    contracts/     (countersigned agreements)
    tax/           (return, estimated payment confirmations)
```

Duplicate it each year. Keep it in cloud storage **and** one other place, as
CEO-202 required for compliance records — the same files serve both purposes.

## Monthly reconciliation

Thirty minutes, once a month, with the bank statement open:

1. Does every deposit on the statement appear in your income log?
2. Does every business expense in your log appear on the statement?
3. Did the tax transfer happen for each payment received?
4. What is the current balance of each of the three accounts?

Anything that does not reconcile gets investigated **now**, while you still
remember what it was.

## Invoicing

Even for small deals, send an invoice: your name and contact, the date, a
description of what was delivered, the amount, payment terms and how to pay. It
gets you paid faster, it creates a record, and it signals that you are running a
business rather than doing a favour.

## Protecting the money itself

- Separate, strong passwords on every financial account, with two-factor
  authentication.
- Never share account credentials with an agent, manager or anyone else. If
  somebody needs to pay you, they need an invoice, not access.
- Be alert to the common scam shapes: an urgent payment request, a change of
  bank details by email, an "advance" on a deal that requires a fee from you
  first. Urgency plus a request for money or access is the pattern.
""",
            },
            {
                "title": "Banking, Entity and Records Pack",
                "description": "Account comparison worksheet, entity decision checklist and the records index.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable pack for Module 4. The account comparison worksheet holds three
candidate institutions against the questions that matter for a minor: joint
holder requirements, fees, transfer limits, two-factor options and how a tax
account can be kept separate.

The entity decision checklist walks the four triggers for considering an LLC and
the conflict test for whoever is recommending it. The records index gives the
folder structure, the retention period and the monthly reconciliation steps with
a twelve-month sign-off grid.""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Banking Decision, Entity Analysis and First Reconciliation",
            "description": (
                "Make the decisions and run the process once.\n\n"
                "Submit:\n"
                "1. Your account comparison across at least two institutions, covering joint "
                "holder requirements, fees, transfer limits and two-factor authentication, with "
                "your choice and your reasoning.\n"
                "2. An entity analysis: should you form an LLC right now? Argue the actual "
                "answer for your situation, including the costs you looked up for your state and "
                "the triggers that would change your answer.\n"
                "3. Your folder structure, set up, with a screenshot of it and a note of the two "
                "places it is stored.\n"
                "4. One completed monthly reconciliation using a real month, or a worked example "
                "with realistic figures if you have no activity yet. Show all four checks.\n"
                "5. A sample invoice you would send for a $250 deal, complete with every field "
                "from the lesson.\n"
                "6. Your account security audit: password strength, two-factor status, and who "
                "currently has access to any of your financial accounts.\n\n"
                "Graded on whether the entity analysis reaches a defensible conclusion rather "
                "than a default one, and on the completeness of the reconciliation."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: Banking and Entities",
            "description": "Four questions on entities, records and financial security.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does a single-member LLC ordinarily do to how the income is taxed?",
                    "choices": [
                        "It eliminates self-employment tax",
                        "Nothing in the simple case — income lands on the owner's return as it would anyway",
                        "It defers all tax until the company distributes profits",
                        "It converts business income into W-2 wages",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the course's honest answer for most high school athletes considering an LLC?",
                    "choices": [
                        "Form one before the first deal, always",
                        "Form one only after turning eighteen",
                        "Not yet — separate accounts and clean records deliver most of the value at no cost",
                        "Never, under any circumstances",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should happen when somebody — an agent or manager — needs to be able to collect money on your behalf?",
                    "choices": [
                        "Share your banking credentials with them",
                        "Add them as a joint holder on your operating account",
                        "Give them your two-factor codes when requested",
                        "They receive an invoice, never access to your accounts",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Which pattern does the lesson give as the signature of a financial scam?",
                    "choices": [
                        "Urgency combined with a request for money or access",
                        "A request for an invoice before payment",
                        "A contract that requires a guardian's signature",
                        "A payment arriving later than agreed",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Reserves and Risk",
        "description": (
            "Building the liquid buffer that makes everything else survivable, and the first "
            "real conversations about investing and insurance."
        ),
        "lessons": [
            {
                "title": "The Reserve Comes First",
                "description": "Why liquidity beats returns at this stage, and how to size the buffer.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Liquidity is the first financial goal

Before investing, before a brokerage app, before anything anyone is marketing to
young athletes: a reserve. Cash, in a plain savings account, available the same
day, doing nothing exciting.

Its job is to make a bad month survivable without borrowing, selling something
at the wrong time or accepting a deal you would otherwise refuse. That last one
is the part athletes underestimate — **a reserve is what gives you the ability
to say no**, which is the single most valuable commercial position in this
entire pathway.

## Sizing it

A conventional adult target is three to six months of expenses. A high school
athlete living at home has a different shape of risk, so size it against what
could actually go wrong:

- Replacing the equipment your content depends on.
- Travel costs for a recruiting opportunity that appears on short notice.
- A deal that pays sixty days late while costs are already spent.

For most students in this course, a first target of a few hundred to a few
thousand dollars covers all three. Hit the target before anything else is
funded.

## Where it lives

A plain savings account, separate from the account you spend from, ideally
earning interest but chosen for accessibility rather than yield. Not invested.
Not in anything whose value can fall in the month you need it.

## Refill it

When the reserve is used, the next payments go to refilling it before spendable
money is released again. That rule is what stops a one-off setback from becoming
a permanent reduction.
""",
            },
            {
                "title": "Investing, Insurance and the Pressure to Do Something Clever",
                "description": "First principles for long-horizon investing, and the schemes aimed specifically at young athletes.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Boring is correct

Once the reserve is full and tax is set aside, a long time horizon is an
enormous advantage. The principles that survive scrutiny are unexciting:

- **Diversification.** Many holdings rather than one bet.
- **Low costs.** Fees compound against you exactly as returns compound for you.
  A percentage point of annual fee is a very large number across forty years.
- **Time in the market**, through regular contributions rather than timing.
- **Only money you will not need soon.** Investment money is not reserve money.

Specific products, accounts and allocations belong with a qualified adviser and
your guardian — Module 6 covers how to choose one.

## What gets sold to young athletes

Be conscious that you are a target. Common shapes:

- **"Guaranteed" returns.** Guaranteed and high-return cannot coexist. Treat the
  word as a warning.
- **Pressure and scarcity.** A limited window on an investment is a sales
  technique, not an opportunity.
- **Crypto, forex and trading programmes** promoted by someone who makes their
  money from your sign-up rather than from their own trading.
- **Complex insurance sold as investment.** Products combining the two are
  expensive, hard to exit, and occasionally marketed hard at athletes.
- **Friends and family deals.** The hardest ones to refuse, which is exactly why
  CEO-303 exists.

## The two questions

1. *What does this person earn if I say yes?*
2. *Can I explain this product, in my own words, to someone else?*

If the answer to the second is no, you are not ready to buy it. That is not a
failure of intelligence — it is the correct response to complexity, and it is
the same standard you applied to a contract in CEO-202.

## Insurance, briefly

For an athlete the relevant protections are usually health coverage, coverage
for equipment that earns money, and — much later, at elite level — disability
cover. Review what your family already has before buying anything new; most
families are already covered for more than they realise.
""",
            },
            {
                "title": "Reserve and Risk Worksheet",
                "description": "Reserve sizing calculator, refill rule and the offer-screening questions.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable worksheet for Module 5. The reserve section sizes your target against
three concrete risks — equipment replacement, short-notice travel, a late
payment — and tracks the balance monthly with the refill rule written out.

The risk section is a screening sheet for any investment or insurance offer:
what it is in your own words, what the person offering it earns, the fees, how
you would exit, and whether it passes the two questions. A shaded panel lists
the schemes most often aimed at young athletes.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Reserve Plan and Offer Screening",
            "description": (
                "Set the target, then practise refusing something.\n\n"
                "Submit:\n"
                "1. Your reserve target with the reasoning: the three concrete risks you sized "
                "it against and the cost of each.\n"
                "2. Your funding plan: how much goes to the reserve from each payment, where it "
                "is held, and the date you expect to hit the target.\n"
                "3. Your refill rule, written as a sentence.\n"
                "4. A screening exercise. Find a real investment or financial product currently "
                "being marketed to young people or athletes — a trading programme, a crypto "
                "offering, an insurance-as-investment product. Run the screening sheet on it: "
                "what it is in your own words, what the promoter earns, the fees, the exit, and "
                "whether it passes the two questions.\n"
                "5. Explain one financial product you already use or might use — a savings "
                "account, a custodial account, an index fund — in your own words, as if to a "
                "teammate.\n\n"
                "Graded on whether the reserve is sized against real risks, and on whether the "
                "screening exercise identifies how the promoter actually makes money."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: Reserves and Risk",
            "description": "Four questions on liquidity, investing principles and recognising schemes.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does the course say is the most valuable thing a reserve buys you?",
                    "choices": [
                        "A higher rate of return than a current account",
                        "Eligibility for better contract terms",
                        "The ability to say no to a deal you would otherwise accept",
                        "A lower tax set-aside percentage",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Where should the reserve be held?",
                    "choices": [
                        "In a plain, accessible savings account, not invested",
                        "In a diversified portfolio for better growth",
                        "In the operating account so it is easy to use",
                        "In the tax account until the bill is due",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does the lesson treat the word “guaranteed” as a warning?",
                    "choices": [
                        "Guarantees are illegal in financial products",
                        "Guaranteed and high-return cannot coexist",
                        "Guarantees always carry hidden tax consequences",
                        "Only insurance products may use the term",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the second screening question for any financial product?",
                    "choices": [
                        "Has it performed well over the past year?",
                        "Does a professional athlete endorse it?",
                        "Is the minimum investment affordable?",
                        "Can I explain this product in my own words to someone else?",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Evaluating Advisers and Fiduciaries",
        "description": (
            "The capstone: how financial professionals are paid, what fiduciary duty means, "
            "and the interview that decides who gets near your money."
        ),
        "lessons": [
            {
                "title": "Fiduciary Duty, Fees and Conflicts",
                "description": "How advisers are compensated and why that determines the advice you receive.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Not all advisers owe you the same duty

A **fiduciary** is obliged to act in your best interest. Other financial
professionals may operate under a lower standard, where a recommendation needs
only to be appropriate rather than the best available option for you. The
difference is invisible in conversation and significant in outcome.

**Ask directly: "Are you a fiduciary, at all times, in writing?"** The
qualifications matter. Some professionals act as a fiduciary for part of their
work and as a salesperson for the rest.

## How they are paid

- **Fee-only.** Paid by you — hourly, a flat project fee, or a percentage of
  assets managed. No commission from products. Fewest conflicts.
- **Fee-based.** Fees *and* commissions. The similar name is unhelpful; ask
  which parts are which.
- **Commission.** Paid by the products they sell you. The advice and the sale
  are the same event.

None of these is automatically disqualifying, and an hourly fee-only planner is
often the right answer for a young athlete with simple needs. What matters is
knowing which one is across the table.

## Fees compound

A percentage of assets charged annually is a very large number over decades.
Ask for total cost in dollars per year, including the costs inside any product
recommended. "About one percent" is not an answer.

## Check the record

Financial professionals are registrable and searchable. Public databases run by
regulators let you look up registration, qualifications and any disciplinary
history, and a professional's disclosure document sets out their services, fees
and conflicts. Ask for the document and look up the record before a second
meeting.

## Who else is in this category

Agents, managers and marketing representatives. The same questions apply:
how are you paid, what is your percentage, what happens if I leave, and are you
registered where your state requires it? CEO-301 goes further into selecting and
managing them.
""",
            },
            {
                "title": "The Interview, and Your Own Financial Plan",
                "description": "The questions to ask any adviser, the answers that end a meeting, and the one-page plan you keep.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Interview at least three

Never engage the first professional you meet, particularly one introduced by
somebody with a stake in the outcome. Interview three. The comparison is what
teaches you the questions.

## The ten questions

1. Are you a fiduciary at all times, and will you confirm that in writing?
2. How exactly are you paid, and by whom?
3. What is the total annual cost to me, in dollars, including product costs?
4. What are your qualifications, and where are you registered?
5. Have you ever been disciplined by a regulator?
6. Who else do you work with that looks like me?
7. What would you tell me to do first?
8. What do you not do?
9. How do we communicate, how often, and who else may be included?
10. If I want to leave, what happens to my money and what does it cost?

## Answers that end the meeting

- Pressure to decide today.
- Reluctance to put the fiduciary answer in writing.
- A cost answer that stays vague after two attempts.
- Anything "guaranteed".
- Dismissiveness toward your guardian, or a suggestion that they need not be
  involved.

## Bring your guardian

Always, at this age. An adviser who treats that as an obstacle has answered one
of the ten questions without being asked.

## Your own one-page financial plan

The deliverable of CEO-203 is not an adviser. It is a plan you own:

- The three accounts and the transfer rule.
- The set-aside percentage and the four quarterly dates.
- The reserve target and the refill rule.
- The records structure and the monthly reconciliation date.
- Who prepares the return and when you meet them.
- The rules you will not break, carried over from the CEO-101 charter: nothing
  signed the same day, no credentials shared, no product you cannot explain.

One page, reviewed each season. An adviser, when you have one, should be able to
read it in two minutes and tell you what they would change.
""",
            },
            {
                "title": "Adviser Interview and Financial Plan Pack",
                "description": "Interview scorecard for three advisers plus the one-page financial plan template.",
                "type": "PDF",
                "minutes": 18,
                "body": """Printable pack for the CEO-203 capstone. The interview scorecard runs the ten
questions down the page with three adviser columns, a row for the registration
and disciplinary check, and a notes panel for anything that triggered a
meeting-ending answer.

The financial plan template is one page: the three accounts and transfer rule,
set-aside percentage and quarterly dates, reserve target and refill rule,
records structure and reconciliation date, tax preparer and appointment, and the
financial rules carried over from the governance charter.""",
            },
        ],
        "assignment": {
            "title": "Capstone — Adviser Evaluation and Your One-Page Financial Plan",
            "description": (
                "Two deliverables: the evaluation work and the plan it feeds.\n\n"
                "Part A — Adviser research. Identify three real financial professionals or firms "
                "who could serve someone in your situation. For each, record what you can "
                "establish before any meeting: how they are compensated, whether they state a "
                "fiduciary commitment, their qualifications, their registration, and anything in "
                "the public record. Cite your sources.\n\n"
                "Part B — The interview. Conduct at least one real interview — in person, by "
                "phone or by email — using the ten questions, with your guardian included. "
                "Submit your notes and your scorecard. If no professional will meet a student, "
                "interview an adult who already uses one and record what they know about how "
                "their adviser is paid; note the substitution.\n\n"
                "Part C — Your one-page financial plan. All six sections from the lesson, with "
                "real numbers and real dates.\n\n"
                "Part D — 200-300 words: what surprised you about how financial advice is paid "
                "for, and what you would do differently if a large sum arrived tomorrow.\n\n"
                "Graded on the quality of the research, on whether the interview actually "
                "happened, and on whether the financial plan is specific enough to follow "
                "without you explaining it."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: Advisers and Fiduciaries",
            "description": "Four questions on fiduciary duty, compensation models and the interview.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What does it mean for an adviser to be a fiduciary?",
                    "choices": [
                        "They are obliged to act in your best interest",
                        "They are licensed to sell insurance products",
                        "They are employed by a bank rather than independently",
                        "They charge commission rather than fees",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which compensation model carries the fewest conflicts of interest?",
                    "choices": ["Commission", "Fee-only", "Fee-based", "Revenue sharing"],
                    "answer": 1,
                },
                {
                    "text": "What does the course say about the answer “about one percent” when you ask about fees?",
                    "choices": [
                        "It is a complete and acceptable answer",
                        "It is the industry-standard disclosure",
                        "It is not an answer — ask for total annual cost in dollars, including product costs",
                        "It only applies to fee-only advisers",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which response from an adviser does the lesson say should end the meeting?",
                    "choices": [
                        "A recommendation to build a reserve before investing",
                        "A suggestion that you interview other advisers too",
                        "A request to meet your guardian as well",
                        "Reluctance to confirm a fiduciary commitment in writing",
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
            "Module 1's logs. Every payment gets written down on arrival — five lines — because "
            "the transfer to the tax account has to happen the same day, while you are calm and "
            "the money still feels like someone else's."
        ),
        "sections": [
            {
                "heading": "1. Income, Logged on Arrival",
                "paragraphs": [
                    "Being owed money is not the same as having it. Log the date it arrived, not "
                    "the date it was agreed."
                ],
                "table": {
                    "columns": ["Date received", "From", "Gross", "What it was for", "Anything withheld?", "Tax transfer made"],
                    "rows": [["", "", "", "", "", ""] for _ in range(6)],
                },
            },
            {
                "heading": "2. Costs",
                "table": {
                    "columns": ["Date", "What", "Amount", "Business purpose", "Receipt held?"],
                    "rows": [["", "", "", "", ""] for _ in range(5)],
                },
            },
            {
                "heading": "3. The Three Accounts",
                "bullets": [
                    "Operating: all income arrives here, all business costs are paid from here, nothing personal.",
                    "Tax: a different institution, so spending it is a deliberate act. A fixed percentage moves here on the day money arrives.",
                    "Reserve: the buffer. Module 5 sizes it.",
                    "What is left after those three is transferred out and is genuinely yours to spend.",
                ],
                "fields": [
                    "Operating account — institution",
                    "Tax account — institution",
                    "Reserve account — institution",
                    "My transfer rule, as a sentence",
                    "Joint account holder",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 2's reference. Learn the mechanism here; confirm the current-year figures with "
            "the IRS and a tax preparer. This is education, not tax advice — the blank column is "
            "deliberate."
        ),
        "sections": [
            {
                "heading": "1. W-2 Beside 1099-NEC",
                "table": {
                    "columns": ["", "W-2 (employee)", "1099-NEC (contractor)", "Current-year figure I confirmed"],
                    "rows": [
                        ["Tax withheld from each payment?", "Yes", "No", ""],
                        ["Who pays both halves of Social Security and Medicare?", "Split with employer", "You — self-employment tax", ""],
                        ["Payments due during the year?", "Through withholding", "Estimated payments", ""],
                        ["Business expenses deductible?", "Generally no", "Yes, with records", ""],
                        ["Form issued at what threshold?", "Any wages", "", ""],
                        ["Reportable from what net earnings?", "—", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Deduction Worksheet",
                "paragraphs": [
                    "Ordinary and necessary for your line of work. A mixed-use item is deductible "
                    "only in its business-use proportion, and you need a basis for the number — a "
                    "guess written down in April is not a basis."
                ],
                "table": {
                    "columns": ["Category", "Amount", "Business-use %", "Basis for that %", "Receipt held?"],
                    "rows": [
                        ["Camera / lighting / microphone", "", "", "", ""],
                        ["Editing software", "", "", "", ""],
                        ["Phone and internet", "", "", "", ""],
                        ["Travel for a paid engagement", "", "", "", ""],
                        ["Professional fees (editor, lawyer, accountant)", "", "", "", ""],
                        ["Shipping, samples, bank fees", "", "", "", ""],
                    ],
                },
            },
            {
                "heading": "3. The Claims Athletes Get Wrong",
                "bullets": [
                    "Ordinary training, gym membership and sport equipment — generally not deductible against endorsement income.",
                    "Clothing wearable in ordinary life, even if bought for a shoot.",
                    "Meals with friends recategorised afterwards as business meetings.",
                    "Anything with no record. Photograph receipts on the day; thermal paper fades to blank within a year.",
                    "Free product, gear, travel and event access are generally income at fair market value.",
                ],
                "fields": ["Three things I assumed were deductible but are not"],
            },
        ],
    },
    {
        "intro": (
            "Module 3's forecast. Its job is not an exact figure — it is making sure the money is "
            "there when the bill arrives. Being approximately right and over-reserved is a complete "
            "success."
        ),
        "sections": [
            {
                "heading": "1. Quarterly Forecast",
                "paragraphs": [
                    "Start from net, apply one flat percentage on arrival, and never reduce it "
                    "during the year because a bill looks smaller than expected."
                ],
                "table": {
                    "columns": ["Quarter", "Income since last review", "Costs", "Net", "Set-aside %", "Tax account balance"],
                    "rows": [["Q1", "", "", "", "", ""], ["Q2", "", "", "", "", ""], ["Q3", "", "", "", "", ""], ["Q4", "", "", "", "", ""]],
                },
                "fields": ["My set-aside percentage, and who confirmed it", "Does my state have an income tax?"],
            },
            {
                "heading": "2. The Four Dates",
                "paragraphs": [
                    "Look this year's estimated-payment dates up yourself and put each in your "
                    "calendar with a two-week warning. Missing them can produce a penalty even if "
                    "the full amount is paid at filing."
                ],
                "table": {
                    "columns": ["Payment", "Date this year", "Calendar reminder set", "Reviewed set-aside"],
                    "rows": [["1", "", "", ""], ["2", "", "", ""], ["3", "", "", ""], ["4", "", "", ""]],
                },
            },
            {
                "heading": "3. Year-End File",
                "bullets": [
                    "Every 1099 received, plus your own log of income where no 1099 arrived.",
                    "Expense log with receipts, organised by category.",
                    "Records of non-cash compensation at fair market value.",
                    "Statements for the operating and tax accounts.",
                    "Any W-2 from ordinary employment, and last year's return once there is one.",
                ],
                "fields": ["Who prepares my return", "Appointment date", "Guardian included?", "Question to ask about earned income and a retirement account"],
            },
        ],
    },
    {
        "intro": (
            "Module 4's pack. Separate accounts are not the same as forming a company — you do not "
            "need an LLC to be organised. Decide the banking, argue the entity question honestly, "
            "then reconcile monthly."
        ),
        "sections": [
            {
                "heading": "1. Comparing Institutions",
                "table": {
                    "columns": ["Question", "Institution A", "Institution B"],
                    "rows": [
                        ["Joint holder required for my age?", "", ""],
                        ["Monthly fees / minimums", "", ""],
                        ["Transfer limits", "", ""],
                        ["Two-factor authentication", "", ""],
                        ["Can I hold a separate tax account?", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Entity Decision",
                "paragraphs": [
                    "A single-member LLC is ordinarily taxed as a disregarded entity — the income "
                    "lands on the owner's return exactly as it would have anyway. It is not a tax "
                    "shelter, and it is not free."
                ],
                "table": {
                    "columns": ["Trigger for considering one", "True for me today?", "Note"],
                    "rows": [
                        ["A preparer actively recommends it", "", ""],
                        ["Selling a physical product, running events, or employing anyone", "", ""],
                        ["A counterparty requires it", "", ""],
                        ["Genuine liability exposure (e.g. people at a camp I run)", "", ""],
                    ],
                },
                "fields": ["Formation and annual fees in my state", "My decision, and what would change it", "What the person recommending it earns if I say yes"],
            },
            {
                "heading": "3. Monthly Reconciliation",
                "paragraphs": [
                    "Thirty minutes with the bank statement open. Anything that does not reconcile "
                    "is investigated now, while you still remember what it was."
                ],
                "table": {
                    "columns": ["Month", "Every deposit in my log?", "Every expense on the statement?", "Tax transfer made each time?", "Balances (op / tax / reserve)"],
                    "rows": [["", "", "", "", ""] for _ in range(4)],
                },
                "bullets": [
                    "Send an invoice even for small deals: name, date, what was delivered, amount, terms, how to pay.",
                    "Never share account credentials. If somebody needs to pay you, they need an invoice, not access.",
                    "Urgency plus a request for money or access is the shape of every scam.",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 5's worksheet. Liquidity before returns: a reserve is what gives you the "
            "ability to say no, which is the most valuable commercial position in this pathway."
        ),
        "sections": [
            {
                "heading": "1. Sizing the Reserve",
                "paragraphs": [
                    "Size it against what could actually go wrong for you, not against a generic "
                    "months-of-expenses rule."
                ],
                "table": {
                    "columns": ["Risk", "What it would cost", "Covered?"],
                    "rows": [
                        ["Replacing the equipment my content depends on", "", ""],
                        ["Short-notice travel for a recruiting opportunity", "", ""],
                        ["A deal that pays sixty days late", "", ""],
                    ],
                },
                "fields": ["My reserve target", "Where it is held", "Amount from each payment", "Expected date I hit the target", "My refill rule, as a sentence"],
            },
            {
                "heading": "2. Screening an Investment or Insurance Offer",
                "table": {
                    "columns": ["Question", "Answer"],
                    "rows": [
                        ["What is it, in my own words?", ""],
                        ["What does the person offering it earn if I say yes?", ""],
                        ["What are the total fees, in dollars per year?", ""],
                        ["How would I exit, and what would that cost?", ""],
                        ["Could I explain this to a teammate?", ""],
                    ],
                },
            },
            {
                "heading": "3. What Gets Sold to Young Athletes",
                "bullets": [
                    "“Guaranteed” returns — guaranteed and high-return cannot coexist.",
                    "Pressure and scarcity: a limited window is a sales technique, not an opportunity.",
                    "Crypto, forex and trading programmes promoted by someone who earns from your sign-up.",
                    "Complex insurance sold as investment — expensive and hard to exit.",
                    "Friends and family deals, which are the hardest to refuse.",
                ],
                "fields": ["An offer I have screened, and my decision"],
            },
        ],
    },
    {
        "intro": (
            "The CEO-203 capstone. Interview at least three professionals — the comparison is what "
            "teaches you the questions — and never engage the first one you meet, particularly one "
            "introduced by somebody with a stake in the outcome."
        ),
        "sections": [
            {
                "heading": "1. The Ten Questions",
                "table": {
                    "columns": ["Question", "Adviser A", "Adviser B", "Adviser C"],
                    "rows": [
                        ["Fiduciary at all times, in writing?", "", "", ""],
                        ["How exactly are you paid, and by whom?", "", "", ""],
                        ["Total annual cost to me, in dollars?", "", "", ""],
                        ["Qualifications and where registered?", "", "", ""],
                        ["Ever disciplined by a regulator?", "", "", ""],
                        ["Who else do you work with that looks like me?", "", "", ""],
                        ["What would you tell me to do first?", "", "", ""],
                        ["What do you not do?", "", "", ""],
                        ["How do we communicate, and who else is included?", "", "", ""],
                        ["If I leave, what happens and what does it cost?", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Answers That End the Meeting",
                "bullets": [
                    "Pressure to decide today.",
                    "Reluctance to put the fiduciary answer in writing.",
                    "A cost answer that stays vague after two attempts.",
                    "Anything “guaranteed”.",
                    "Dismissiveness toward your guardian, or a suggestion they need not be involved.",
                ],
                "fields": ["Registration / disciplinary check — where I looked", "Anything that triggered a meeting-ending answer"],
            },
            {
                "heading": "3. My One-Page Financial Plan",
                "paragraphs": [
                    "The deliverable of this course is not an adviser. It is a plan you own, that "
                    "an adviser could read in two minutes and tell you what they would change."
                ],
                "fields": [
                    "Three accounts and the transfer rule",
                    "Set-aside percentage and the four quarterly dates",
                    "Reserve target and refill rule",
                    "Records structure and monthly reconciliation date",
                    "Who prepares the return, and when we meet",
                    "Financial rules I will not break",
                ],
            },
        ],
    },
]
