"""LS-201: Financial Literacy Basics.

Level 2: Wealth & Network Architecture. Written against the course's focus
(cash flow, budgeting and the true cost of lifestyle inflation) and its core
competencies: reading a paystub or 1099, budgeting, understanding tax brackets,
and basic bank account management.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).

The tax and payroll documents named here (W-2, 1099-NEC, withholding) are the
United States forms the client's brief specifies. Rules differ by country and
by state and they change, so the course teaches what the documents are *for*,
names the official source rather than a rate, and routes every real filing
question through a guardian and a qualified preparer. It is financial
education, **not financial advice**, and says so.
"""

MODULES = [
    {
        "title": "Cash Flow",
        "description": (
            "What comes in, what goes out, and why almost nobody knows their own numbers."
        ),
        "lessons": [
            {
                "title": "Money In, Money Out",
                "description": "The only equation, and the reason it is hard to follow.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## A note on what this course is

This is financial **education**, not financial advice. It explains what things
are so you can have a competent conversation with a guardian, an accountant or
a qualified adviser. Tax rules differ by country and by state, they change
every year, and nothing here is a substitute for a professional or for the
official source.

Every real filing or signing decision in this course goes through a guardian.

## The equation

> Money in − money out = what is left.

That is the whole subject. Everything else is detail about where the numbers
come from and why people are consistently wrong about both.

## Why people are wrong about money in

- **Gross is not net.** The number on an offer is not the number that arrives.
  Module 2 is about the gap.
- **Irregular income looks bigger than it is.** An athlete paid occasionally —
  a camp, a job, a partnership from BM-301 — feels like the good month is
  normal. It is not; the annual total is what is normal.
- **One-off money feels like income.** A gift, a prize, a single payment. It is
  a one-off, and spending it as if it recurs is the oldest error there is.

## Why people are wrong about money out

- **Small and regular beats large and rare.** A daily drink and a sandwich is
  a bigger annual number than the trainers everybody agonises over.
- **Subscriptions are invisible.** Several small monthly charges, mostly
  unused, most people cannot list them.
- **Cash disappears without a trace** unless written down.
- **Estimates are always low.** Ask somebody what they spend and compare it
  with their statement; the gap is routinely a third.

## Fixed, variable, and the ones that are really optional

**Fixed:** the same every month — a phone plan, a subscription, club fees.
Easy to forget and easy to cut permanently with one decision.

**Variable:** food, travel, going out, kit. Where attention actually pays.

**Pretend-fixed:** the ones you treat as unavoidable that are not. A larger
phone plan, a subscription you kept, the habit you have never questioned.

Most people's savings come from the third category, because nobody looks at
it.

## The statement exercise

Download three months of your actual bank statement and read every line.

It is uncomfortable, it takes forty minutes, and nearly everybody finds:

- Two or three subscriptions they forgot.
- A spending category far larger than they would have guessed.
- Several purchases they do not remember making.

That exercise is worth more than every budgeting app in existence, and it is
the assignment for this module.

## Why this matters now rather than later

Because the habits are formed now and the amounts are small. Learning to track
£40 a week is the same skill as tracking a salary, and it is enormously easier
to learn on £40. LS-202 and LS-303 both assume you built it here.
""",
            },
            {
                "title": "Budgeting That Survives Contact",
                "description": "A simple structure, and what makes budgets fail.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Why budgets fail

- **Too detailed.** Fourteen categories tracked daily lasts eleven days.
- **No slack.** A budget with no room for the unexpected breaks the first time
  something is unexpected.
- **No fun in it.** A budget with no enjoyment is a diet with no food.
- **Written once, never looked at.**

A budget that survives is simple, has slack, and is checked briefly and
regularly.

## A structure that works

Three buckets, as percentages of what actually arrives:

**Needs.** The things you genuinely must pay: phone, transport, club fees,
food you have to buy, anything you are responsible for.

**Wants.** Everything else you spend on: going out, clothes, games, food you
chose to buy.

**Future.** Saving, and anything being set aside for something specific.

A commonly taught split is **50 / 30 / 20**, and for a student athlete with few
obligations the "future" share can often be higher. The exact numbers matter
far less than having three buckets with deliberate shares.

## Pay the future first

The single most effective habit in personal finance: move the saving on the
day money arrives, not from what is left at the end.

What is left at the end is reliably nothing, for everybody, at every income
level.

Automate it where your bank allows — a standing transfer the day after payday
into a separate account. Out of sight, and the rest is genuinely spendable.

## An emergency buffer first

Before anything else: a small cushion. For a student, a few hundred; for
anybody with real obligations, three to six months of essential costs.

This is what stops an unexpected cost becoming debt, which is LS-203's whole
subject. It sits in a plain, instantly accessible account and it is not
invested in anything.

## Sinking funds

The trick that removes most financial surprises. A known, irregular cost —
kit, a tournament, travel, a birthday — divided by the number of months until
it arrives, set aside monthly.

A tournament costing £600 in six months is £100 a month, not an emergency in
May. Almost every "unexpected" cost an athlete has is actually a known cost
that nobody divided.

## Checking in

- **Weekly, two minutes.** Look at the balance and the week's spending.
- **Monthly, fifteen minutes.** Compare plan with reality, and change the plan
  rather than your memory of it.

A budget is a prediction, and predictions are supposed to be corrected.

## What a budget is for

Not restriction. It is for being able to say yes to the thing you actually
want without anxiety, because you know the number.

People with a budget worry less about money than people without one, at the
same income. That is the actual return.
""",
            },
            {
                "title": "Lifestyle Inflation",
                "description": "The thing that catches earning athletes, and why it is hard to reverse.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The mechanism

Income rises. Spending rises to match, almost immediately and usually without
a decision. Six months later, the larger income feels exactly as tight as the
smaller one did.

This is the single most common reason people who earn well end up with
nothing, and it is disproportionately a problem in sport, where income can
jump sharply and briefly.

## Why it happens faster to athletes

- **The jump is sudden**, not gradual.
- **The peak is short.** Most sporting income arrives in a few years, not
  forty, and has to cover more than those years.
- **There is an audience.** BM-101 made your spending visible; the pressure to
  look successful is real and it is expensive.
- **There are people around you** whose expectations rise with your income.
  LS-301 and LS-303 deal with that directly.
- **Everybody around you is doing it**, which makes it feel normal.

## The ratchet

Spending goes up easily and comes down painfully. A larger flat, a better car,
a standard of travel, a group of friends who expect a certain kind of evening
— each is easy to start and socially costly to stop.

That is why the rule is about the increase rather than the level.

## The rule

**When income rises, bank a fixed share of the increase before adjusting
anything.**

A common version: of any pay rise or new income, **save half and let lifestyle
take the other half.** Your life improves, measurably, and the gap between
earning and spending widens instead of staying flat.

It only works if it happens immediately. A month of spending the whole
increase sets a new normal that is hard to undo.

## The specific traps

- **The car.** The classic. Depreciating, expensive to insure for a young
  driver, and the most visible possible signal.
- **Recurring commitments** — a lease, a subscription, a contract. A one-off
  purchase is survivable; a monthly obligation that assumes income continues
  is not.
- **Paying for everybody.** It starts as generosity and becomes an
  expectation. LS-303 is entirely about this.
- **Upgrading everything at once.** Phone, clothes, car, travel, in one
  quarter.
- **Assuming it continues.** The deepest error. Sporting income can stop with
  one injury, one season, one decision by somebody else.

## The honest frame

None of this says do not enjoy money you earned. Buy the thing, take the trip,
treat your family.

What it says is: **decide it, rather than drifting into it**, and keep the
decision proportionate to income that may not recur. An athlete who banks half
of every increase is not depriving themselves; they are buying the thing most
athletes never get, which is the ability to stop when they want to rather than
when they are forced to.

LS-202 is what the banked half is actually for.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Your Real Numbers",
            "description": (
                "No estimates. Statements.\n\n"
                "Submit:\n"
                "1. Three months of your actual money in: every source, every amount, every "
                "date. If you have no income, use what you are given and say so.\n"
                "2. Three months of money out, read line by line from a real statement, "
                "sorted into fixed, variable and pretend-fixed.\n"
                "3. The three things the statement exercise found: a forgotten subscription, "
                "a category larger than you guessed, and a purchase you do not remember.\n"
                "4. Your estimate of weekly spending, written before you looked, against the "
                "real figure — and the size of the gap.\n"
                "5. Your three-bucket budget with your own percentages, justified.\n"
                "6. Your pay-the-future-first setup: the account, the amount, the date, and a "
                "screenshot of the automatic transfer if your bank allows one.\n"
                "7. Your emergency buffer: the target, where it is held, and what you have so "
                "far.\n"
                "8. Your sinking funds: every known irregular cost in the next twelve months, "
                "divided by the months until it arrives.\n"
                "9. Your lifestyle-inflation rule, written as a number, plus the three traps "
                "most likely to catch you specifically.\n"
                "10. Your check-in schedule, in your calendar, with a screenshot.\n\n"
                "Graded on whether parts 1 and 2 come from real statements rather than "
                "memory, and on whether part 8 covers costs you would otherwise have called "
                "unexpected."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Cash Flow",
            "description": "Four questions on tracking, budgeting and lifestyle inflation.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which spending category does the course say most savings come from?",
                    "choices": [
                        "Pretend-fixed — costs treated as unavoidable that are not",
                        "Genuinely fixed costs",
                        "Large one-off purchases",
                        "Variable food spending",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the single most effective habit in personal finance?",
                    "choices": [
                        "Tracking every transaction daily",
                        "Moving the saving on the day money arrives, not from what is left at the end",
                        "Using cash rather than a card",
                        "Reviewing the budget weekly",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is a sinking fund for?",
                    "choices": [
                        "Covering an unexpected emergency",
                        "Investing small amounts regularly",
                        "A known, irregular cost, divided by the months until it arrives",
                        "Paying down a debt faster than scheduled",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why is the lifestyle-inflation rule about the increase rather than the level?",
                    "choices": [
                        "Higher earners have more fixed costs",
                        "Tax rises with income",
                        "Spending at a high level is easier to justify",
                        "Spending goes up easily and comes down painfully — the ratchet",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Reading What You Are Paid",
        "description": (
            "Paystubs, 1099s, withholding and brackets — the documents that explain the gap "
            "between the offer and the deposit."
        ),
        "lessons": [
            {
                "title": "Employee or Contractor",
                "description": "Two completely different ways of being paid, with different paperwork.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The distinction that decides everything else

In the United States, how you are paid falls broadly into two categories, and
almost every difference in this module follows from which one you are in.

**An employee.** You have a job with an employer. They take tax out of each
payment before it reaches you (**withholding**), and at the end of the year
they give you a **W-2** summarising what you were paid and what was withheld.
You filled in a **W-4** when you started, which tells them how much to
withhold.

**An independent contractor.** You are paid for work as your own small
business — which is what most athlete sponsorship, camp work and content work
is. **Nothing is withheld.** You receive the full amount, and at the end of
the year the payer may send you a **1099-NEC** reporting what they paid you.

## Why the second one catches people

Because the money looks bigger and some of it is not yours.

An athlete paid $2,000 for a partnership has not earned $2,000 of spendable
money. Tax is owed on it, nobody has taken it out, and the bill arrives later
— often much later, by which time the money is gone.

**This is the single most common financial mistake young earners make**, and
it is entirely avoidable with one habit:

> **When a contractor payment arrives, immediately move a share of it into a
> separate tax account and do not touch it.**

The right percentage depends on your total income, your state and your
situation, so get the number from a qualified preparer rather than from a
rule of thumb — and until you have it, setting aside a generous share and
getting money back later is far better than the reverse.

## Self-employment tax

The other surprise. An employee and their employer each pay a share of Social
Security and Medicare. A contractor pays **both halves**, which is why the
effective rate on contractor income is higher than people expect.

It is also why "I'll be paid the same either way" is usually wrong.

## Which one are you

It is determined by the nature of the work, not by what either side prefers to
call it. If somebody asks you to be "self-employed" for work that looks like a
job, that is a question for an adult.

For a school-age athlete, most paid work is one of:

- A part-time job → employee, W-2.
- A camp, coaching, or content work → usually contractor, 1099.
- A brand partnership → almost always contractor.

## Before any of it

Three things, every time, and all three are LS-104's professionalism applied
to money:

1. **A guardian is involved.** A minor cannot sign a contract (CEO-202).
2. **Eligibility is checked** with your school, club and governing body
   before accepting payment. BM-301, Module 1.
3. **It is in writing** — amount, what for, when paid.
""",
            },
            {
                "title": "Reading a Paystub",
                "description": "Line by line, because nobody is ever taught this.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The gap

You agreed $15 an hour and worked 20 hours. $300. The deposit is $250-something
and nobody explained why.

A paystub explains it, and reading one takes five minutes once somebody has
shown you.

## The lines

**Gross pay.** What you earned before anything is taken out. The number in the
conversation.

**Net pay** (or "take-home"). What actually arrives. The only number that
matters for LS-201's budget.

**Federal income tax withheld.** An estimate of what you will owe, taken in
advance based on your W-4.

**State and local income tax**, where your state has one. Some do not, and
this varies enormously.

**Social Security and Medicare** (often shown as FICA). Fixed-rate
contributions, not income tax.

**Pre-tax deductions**, if any — a retirement contribution, health insurance.
These reduce your taxable income.

**Year to date (YTD).** The running total for the year. The most useful column
and the most ignored.

## Check it

Every time, briefly:

- Are the **hours** right?
- Is the **rate** right?
- Does **gross minus the deductions equal net**?
- Does the **YTD** look plausible?

Payroll errors are common and almost always in the employer's favour by
accident. Nobody else is checking yours.

## Withholding is an estimate

It is not the tax. It is a guess at the tax, made in advance.

- Too much withheld → a refund after filing. You lent money, interest-free,
  for a year.
- Too little → a bill.

If your W-4 was filled in badly — and a first job is usually filled in with a
guess — one or the other happens. A qualified preparer or your employer's
payroll contact can check it.

**A refund is not a bonus.** It is your own money being returned, and a large
one means a form needs adjusting.

## Keep everything

A folder, digital or physical:

- Every paystub, or at least the final YTD one.
- Every W-2 and 1099.
- Receipts for anything that might be a legitimate business expense if you are
  a contractor.
- Any contract.

Keep it for several years. The year you need it is the year you did not keep
it.

## When something is wrong

Ask payroll, politely and in writing, with the specific line and the figure
you expected. LS-104's email rules apply.

If you are paid in cash with no paperwork at all, that is a conversation to
have with a guardian — there are reasons it happens that are fine and reasons
that are not, and a seventeen-year-old is not the right person to work out
which.
""",
            },
            {
                "title": "Brackets, and the Myth About Them",
                "description": "How a progressive tax system actually works.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The myth

"I don't want a raise, it'll push me into a higher bracket and I'll take home
less."

This is wrong, it is extremely widespread, and understanding why is the point
of this lesson.

## How brackets actually work

A progressive system taxes income in **slices**. Each slice has its own rate,
and a higher rate applies **only to the portion of income inside that slice** —
not to all of it.

An illustration with made-up numbers, purely to show the shape:

- The first $10,000 is taxed at 0%.
- The next $30,000 at 10%.
- Anything above $40,000 at 20%.

Someone earning $45,000 pays nothing on the first $10,000, 10% on the next
$30,000, and 20% on the last $5,000 only.

**Earning one more dollar never reduces your take-home.** More income always
means more money, just not all of it.

Those numbers are invented for the illustration. The real brackets change every
year and differ by filing status and state — get them from the tax authority's
own site, not from a video.

## Marginal and effective

**Marginal rate:** the rate on your next dollar. The one people quote.

**Effective rate:** total tax divided by total income. Always lower than the
marginal rate, and it is the honest description of what you pay.

Confusing the two makes the system sound far more punishing than it is.

## Deductions and credits

**A deduction** reduces the income being taxed. **A credit** reduces the tax
itself, so it is worth more per dollar.

There is usually a **standard deduction** — an amount of income taxed at
nothing — which is why many students with small earnings owe no federal income
tax at all. That does not necessarily mean no filing is required, and it does
not cover self-employment tax on contractor income.

## When you must file

It depends on how much you earned, what kind of income it was, and your
circumstances. Contractor income triggers a filing requirement at a much
lower amount than employment income.

Do not guess this. Check the tax authority's own guidance, with a guardian,
and use a qualified preparer in any year where you had contractor income,
income from more than one state, or anything unusual.

## The practical version for a young athlete

1. Know whether each payment is employment or contractor income.
2. For contractor income, set money aside the day it arrives.
3. Keep every document in one folder.
4. Get a qualified preparer for any year with contractor income.
5. Never sign a return you have not read, including one a preparer filled in.
6. Ask before you accept — eligibility first, always.

That is six habits. They will serve you from your first $200 to whatever
follows, and LS-202 picks up where this leaves off.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — The Documents",
            "description": (
                "Learn to read the paperwork before there is a lot of it.\n\n"
                "Submit:\n"
                "1. Employee and independent contractor explained in your own words, with "
                "the documents each produces and the single biggest risk of the second.\n"
                "2. Every way you currently receive money, classified as one or the other, "
                "with your reasoning.\n"
                "3. A real paystub — yours, or a parent's with their permission and the "
                "amounts redacted — annotated line by line.\n"
                "4. The arithmetic check: does gross minus deductions equal net?\n"
                "5. Your tax account for contractor income: whether you have one, where it "
                "is, and the habit you are committing to when a payment arrives.\n"
                "6. Your document folder, set up, with a screenshot of its structure and what "
                "goes in it.\n"
                "7. The bracket myth explained in your own words, with a worked example using "
                "the current real brackets — and the official source you got them from, "
                "linked.\n"
                "8. Your marginal and effective rate, calculated for a plausible income, with "
                "the working.\n"
                "9. Your filing position: whether you are required to file this year, where "
                "you checked, and who you would use to prepare it.\n"
                "10. Confirmation that a guardian has read this assignment with you, and one "
                "question they raised that you could not answer.\n\n"
                "Graded on whether part 7 cites the tax authority's own source rather than a "
                "secondary one, and on whether part 10 shows a real conversation."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Reading What You Are Paid",
            "description": "Four questions on pay documents, withholding and brackets.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What is the single most common financial mistake young earners make?",
                    "choices": [
                        "Spending contractor income as if all of it is theirs, when nothing has been withheld",
                        "Choosing the wrong bank account type",
                        "Failing to negotiate their rate",
                        "Keeping too much money in cash",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is a tax refund?",
                    "choices": [
                        "A government bonus for filing on time",
                        "Your own money being returned, because too much was withheld",
                        "A credit against next year's tax",
                        "Compensation for overpaid Social Security",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What happens when you move into a higher tax bracket?",
                    "choices": [
                        "All of your income is taxed at the higher rate",
                        "Your take-home can fall if the raise is small",
                        "Only the portion of income inside that slice is taxed at the higher rate",
                        "Deductions no longer apply",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does a contractor pay more than expected on the same headline amount?",
                    "choices": [
                        "Contractor income is taxed at a higher bracket",
                        "State taxes apply only to contractors",
                        "Deductions are unavailable to contractors",
                        "They pay both halves of Social Security and Medicare, not just the employee half",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Accounts and Habits",
        "description": (
            "Where money sits, how it is protected, and the small number of habits that do "
            "the work."
        ),
        "lessons": [
            {
                "title": "The Accounts You Need",
                "description": "A simple structure, and what to look for when opening one.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Keep it simple

Three accounts cover almost everybody:

**1. Spending.** The one with the card. Everyday money only.

**2. Saving.** Separate, slightly awkward to reach, interest-bearing. The
emergency buffer and the sinking funds live here.

**3. Tax**, if you have any contractor income. Untouchable. Not a mental
earmark inside the spending account — a separate account, because a mental
earmark gets spent.

A fourth, for a specific goal, is fine. Nine accounts is not a system; it is
avoidance.

## Separation is the mechanism

The reason this works is not organisation. It is that money in a different
account requires a deliberate act to spend, and the deliberate act is the whole
intervention.

Everything automatic — the transfer on payday, the tax share on arrival —
exists so the decision is made once rather than weekly.

## What to look for

- **No monthly fee**, or one waived for a student.
- **No overdraft fees**, or an account that simply declines rather than
  charging. For a young account this matters more than any interest rate.
- **Free ATM access** where you live.
- **A decent app**, with instant notifications for every transaction.
- **Real interest on savings**, which varies a great deal — the difference
  between a default account and a competitive one is real money.
- **Deposit protection**, which in the US means FDIC insurance at a bank or
  NCUA at a credit union. Check it; it is the thing that protects your money if
  the institution fails.

## Opening one as a minor

Usually requires a guardian as a joint account holder, which is normal and
appropriate. It also means a parent can see it, which is a feature at this
stage rather than a problem.

Bring identification, a Social Security number where required, and a guardian.

## The settings to turn on immediately

- **Transaction notifications** for everything. The single best fraud
  protection available and it makes spending visible in a way a monthly
  statement never does.
- **Two-factor authentication.** BM-103, Lesson 1 — the same rules apply and
  the stakes are higher.
- **No card details saved** in a browser you share.
- **A strong, unique password**, never reused.

## Fraud and scams

An athlete with any visibility is a target, and BM-103's patterns were written
for exactly this:

- **Nobody legitimate asks for your password or a one-time code.** Not the
  bank, not ever.
- **Never send money to receive money.**
- **Do not let anybody else use your account**, including a friend who wants
  to "pass something through". That is how people become part of money
  laundering without understanding it, and it is a criminal matter.
- **Report anything odd immediately** — the bank, and a guardian.

If something has gone wrong, tell an adult the same day. Banks can often act
quickly and almost never after a delay.
""",
            },
            {
                "title": "Cards, Fees and Small Leaks",
                "description": "The ordinary things that quietly cost money.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Debit and credit

A **debit card** spends money you have. A **credit card** borrows money you
then owe.

LS-203 covers credit properly — including the fact that used well it is a
tool, and used badly it is the most expensive money most people ever borrow.
For now, the single rule: **a credit card balance not paid in full each month
costs a great deal, and the minimum payment is designed to keep you paying.**

## Buy-now-pay-later

Worth naming because it is aimed directly at young people and does not feel
like borrowing.

It is borrowing. Several small instalment plans running at once are difficult
to track, late fees are common, missed payments can affect credit, and the
whole mechanism exists because people spend more when payment is split.

Treat it as debt, because it is.

## Overdraft

A charge for spending money you do not have, often per transaction, often
large relative to the purchase. Several small overdrafts in a day can cost more
than the purchases.

Set the account to decline instead, if it will. Almost nobody does this and it
removes an entire category of cost.

## The small leaks

Found in every statement exercise:

- **Subscriptions** nobody uses. Cancel them; it takes an afternoon once a
  year.
- **Free trials** that converted.
- **ATM fees** from using the wrong machine.
- **Foreign transaction fees** on travel and online purchases.
- **Delivery fees and service charges**, which add up faster than the food
  does.
- **In-app and in-game spending**, which is specifically designed to be
  frictionless and is frequently the single largest discretionary line in a
  teenager's statement.

## The waiting rules

Two of them, and they are among the few genuinely reliable spending habits:

**The 24-hour rule.** For anything non-trivial, wait a day. A surprising share
of wants evaporate overnight.

**The 30-day list.** For anything large, write it on a list with the date. If
you still want it in thirty days, buy it. Most items get crossed off, and the
ones that survive are usually the ones worth having.

Both work because they separate wanting from buying, which is exactly what
every part of modern retail is built to merge.

## Lending to friends

It happens constantly and it ends badly often enough to have a rule:

**Only lend what you are content to give.** If getting it back matters, do not
lend it.

For anything larger, do not lend at all — say you cannot. LS-301 and LS-303
deal with the family version, which is harder and higher-stakes.
""",
            },
            {
                "title": "Habits That Carry",
                "description": "The short list that still works at every income level.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## What actually matters

Personal finance has a very small number of things that work and an enormous
amount of noise around them. The list is short enough to memorise.

## The eight

**1. Know your numbers.** In and out, from statements, not memory.

**2. Spend less than you receive.** The whole subject, and everything else
serves it.

**3. Pay the future first.** On the day money arrives, automatically.

**4. Keep a buffer.** It is what stops a surprise becoming debt.

**5. Set tax aside on arrival.** For every contractor payment, the day it
lands.

**6. Avoid expensive debt.** Credit card balances, buy-now-pay-later,
overdrafts, and anything with a rate you would not say out loud. LS-203
distinguishes this from the useful kind.

**7. Bank half of every increase.** The rule against lifestyle inflation.

**8. Ask before you sign.** A guardian, and a professional for anything real.

Eight habits. They are the same at $200 a month and at $200,000 a year, which
is why learning them now is worth so much more than the amounts involved
suggest.

## What to ignore

- Anybody promising a return with no risk.
- Anybody promising a specific return at all.
- Trading, crypto and betting content aimed at young men, which is advertising
  dressed as education and is covered properly in LS-202.
- Advice from anybody who earns a commission on your following it. LS-103's
  four questions apply directly.
- Comparison with teammates' spending, almost none of which you can see
  accurately.

## The gap this course is really about

Between what you earn and what you spend. Everything else — investing, credit,
wealth — operates on that gap. With no gap, there is nothing to work with at
any income.

An athlete earning modestly with a 20% gap is in a stronger position than one
earning five times as much with none, and the second case is far more common
than it sounds.

## Where this goes

- **LS-202** invests the gap and teaches how to tell a real adviser from a
  salesperson.
- **LS-203** is debt and credit, used deliberately.
- **LS-301 and LS-303** are the people around the money, which is where most
  athlete finance actually goes wrong.

All three assume this course: that you know your numbers, you have a buffer,
and nothing gets signed without an adult.

## The last point

Money is a tool for making decisions freely. That is the whole value of it —
being able to choose a programme, turn down a bad deal, stop playing when you
want to, help somebody when it matters, and not be forced into anything by a
number.

Everything in this course is in service of that, and none of it requires being
wealthy.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Set Up the System",
            "description": (
                "Accounts, settings and habits, actually in place.\n\n"
                "Submit:\n"
                "1. Your account structure: what you have now and what you are moving to, "
                "with the purpose of each account.\n"
                "2. Your comparison of three real accounts available to you on fees, "
                "overdraft behaviour, ATM access, interest and deposit protection — with the "
                "one you chose and why.\n"
                "3. Your security settings, with screenshots: transaction notifications on, "
                "two-factor enabled, password unique.\n"
                "4. Your overdraft setting, and whether your account declines rather than "
                "charges.\n"
                "5. Your scam rules in your own words, including the one about letting "
                "somebody else use your account.\n"
                "6. Your leak audit: every subscription and recurring charge, with what you "
                "cancelled and the annual saving.\n"
                "7. Your in-app and in-game spending for the last three months, from the real "
                "statement.\n"
                "8. The 24-hour rule and the 30-day list, with your list started and at least "
                "three items dated on it.\n"
                "9. Your lending rule, written as a sentence you would actually say.\n"
                "10. The eight habits, each marked as already doing, started this month, or "
                "not yet — with a date for the ones not yet.\n"
                "11. One paragraph on the gap: what is yours currently, as a percentage, and "
                "what would change it most?\n\n"
                "Graded on whether the accounts and settings are actually in place with "
                "evidence, and on whether part 11 uses your real numbers."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Accounts and Habits",
            "description": "Four questions on accounts, costs and the core habits.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does keeping money in separate accounts work?",
                    "choices": [
                        "Money in a different account requires a deliberate act to spend",
                        "Separate accounts earn more interest",
                        "Banks limit transfers between accounts",
                        "It simplifies tax reporting",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What should you do if someone asks to pass money through your account?",
                    "choices": [
                        "Agree only for people you know well",
                        "Refuse — that is how people become part of money laundering without understanding it",
                        "Agree if the amount is small",
                        "Ask the bank for permission first",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the rule on lending to friends?",
                    "choices": [
                        "Lend only with a written agreement",
                        "Lend no more than a week's income",
                        "Only lend what you are content to give",
                        "Lend only to teammates",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does everything else in personal finance operate on?",
                    "choices": [
                        "Your total income",
                        "Your credit score",
                        "The rate of return you can achieve",
                        "The gap between what you earn and what you spend",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
