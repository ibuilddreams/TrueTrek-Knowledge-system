"""CN-302: Tax Basics for Teen Earners. Cool Nerds academy, Level 3
(Grades 9-12). Focus area: Taxes. Core competencies: W-4s, 1040 basics,
understanding pay stubs, income tax.

Audience: a student roughly fourteen to eighteen with a first job, first
freelance work, or about to have one.

**The sheet's competencies name US forms (W-4, 1040) and this course does not
treat them as universal.** Income tax exists in nearly every country and is
administered completely differently: whether tax is deducted at source or
declared annually, what the thresholds are, what a young earner must register
for, what a self-employed person owes and when, and what forms exist at all.
So the course teaches the *mechanism* — gross and net, deduction at source
versus self-declaration, what a payslip shows, what records to keep — and routes
every specific to the reader's own country's revenue authority, naming the US
forms only as that country's instance of a general shape. It quotes **no rate,
threshold, allowance or deadline** and says so.

Two further framings are load-bearing. **Being paid without any record is named
as a risk to the worker**, not a perk — no proof of earnings, no protection, no
contributions — rather than being moralised about. And Module 3 covers **tax
scams aimed at young people**, including refund phishing and the shape where
somebody wants to use a young person's tax identity, which belongs with CN-202's
rule about never letting anybody use your name or account.

Boundary: CN-302 is tax at sixteen with a first job. CN-402 is deductions and
gig-economy tax at undergraduate level, CN-204 is the business itself, and
ENT-304/409 are the founder's version. They must not be merged.
"""

MODULES = [
    {
        "title": "Where The Money Goes",
        "description": "The mechanism, before any form.",
        "lessons": [
            {
                "title": "Gross, Net, And The Gap",
                "description": "Why the number you agreed is not the number you get.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The first payslip surprise

You agree an hourly rate. You work a number of hours. You multiply.
Then the money arrives and it is less.

Nothing has gone wrong. This is how it works everywhere, and nobody
explains it beforehand.

## Two words

**Gross** is what you earned before anything is taken off.

**Net** is what actually reaches you.

The gap between them is deductions — tax, and in most countries some
form of social contribution, and sometimes other things like a
pension.

When somebody tells you what a job pays, it is almost always the
gross figure. When you are working out whether you can afford
something, only the net figure is real.

## What tax actually is

Money collected by a government to pay for things nobody buys
individually: roads, schools, hospitals, courts, defence, benefits,
the people who inspect food.

You can have a view about how much there should be and what it
should be spent on — that is politics and this course has no opinion
about it.

What is not optional is understanding the mechanism, because not
understanding it is how people end up with an unexpected bill.

## Two ways it gets collected

Nearly every country uses one or both.

**Deducted at source.** Your employer takes it off before paying
you and sends it to the revenue authority. You see the deduction on
a payslip. Most employed people in most countries are in this
system.

**Self-declared.** You receive the full amount, and later you declare
your income and pay what is owed. This is usually how self-employed
and freelance income works.

**The second one is where young people get caught**, because the
money arrives looking like it is all yours, and it is not. More in
Module 2.

## Progressive rates

Most countries charge a higher percentage on higher slices of
income.

A thing almost everybody misunderstands: **moving into a higher band
does not make all your income taxed at the higher rate.** Only the
slice above the threshold is. Earning slightly more never leaves you
with less after tax.

People believe the opposite and turn down work because of it.

## What this course will not tell you

No rates. No thresholds. No allowances. No deadlines. No form
numbers as universal.

All of those differ by country and change every year. Anything
quoted here would be wrong somewhere and out of date eventually.

The next lesson is how to find yours, which does not go out of
date.""",
            },
            {
                "title": "Finding Your Own Country's Rules",
                "description": "The only durable answer.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## One authority, and it is findable

Every country has a revenue authority — the government body that
collects tax. In the US it is the IRS; in the UK, HMRC; every
country has its own, and the sheet's "W-4" and "1040" are the US
instance of forms that exist in some shape nearly everywhere.

**That authority's own website is where the answers are.** Not a
video, not a forum, not an app, not a relative's memory of how it
worked when they were young.

## Why it has to be the official one

Three reasons.

**It changes annually.** Rates, thresholds and allowances are
frequently adjusted every year. A video from two years ago is
wrong.

**It is country-specific**, and most online material assumes a
country without saying which.

**Getting it wrong has consequences** — penalties, interest, and in
serious cases worse. This is one of the areas where being casually
misinformed costs real money.

## The questions to answer

Find these for your own country, with a parent or carer:

- Is there an amount you can earn before paying income tax?
- How is tax collected from employed people?
- At what point does somebody have to register or declare?
- What applies to self-employed or freelance income?
- Are there different rules for people under eighteen?
- What are the deadlines?
- What records must be kept, and for how long?

Write the answers down with the date you found them, because they
will need rechecking.

## Where else to look

**The revenue authority's own guidance**, which in most countries
includes plain-language pages for young people and first-time
earners.

**A free advice service**, if your country has one.

**A qualified professional** — an accountant or tax adviser — once
real money is involved. That is not a luxury; for anybody
self-employed it is usually cheaper than the mistakes.

**Not** somebody confident on the internet, and not somebody selling
a method.

## Do it with an adult

At your age, and genuinely at any age where money is involved, a
parent or carer should be part of this.

Anything involving your tax identity, registering with an authority,
or handing over identifying details is not something to do alone
from a phone.

## The thing that does not change

Whatever country, whatever year:

**Keep records. Find out before you earn, not after. Put money aside
if it is not being deducted. Ask the official source. Get a
professional when it is real.**

That is the whole of it, and it is true everywhere.""",
            },
            {
                "title": "Reading A Payslip",
                "description": "Checking that you were paid correctly.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Somebody should check it

Employers make mistakes. Payroll systems make mistakes. Nobody else
is checking yours.

So the first useful habit of working life is reading the payslip
rather than only looking at the amount in the account.

## What is on one

The layout differs by country, the content is broadly similar.

**The period** it covers.

**Gross pay** — hours times rate, plus anything extra.

**Deductions** — income tax, social or national contributions,
sometimes pension, sometimes student loan repayments where a country
runs them that way.

**Net pay** — what reaches you.

**Year-to-date totals** — what you have earned and paid so far this
tax year. Useful, and ignored by almost everybody.

**Your identifying details** — an employee number and usually a tax
reference of some kind.

## What to check, every time

Four things. It takes ninety seconds.

**1. Are the hours right?** Against your own record of what you
worked. Which means keeping your own record — a note on your phone
of start and finish times. This is the single most useful habit in
this lesson.

**2. Is the rate right?** Including any higher rate for particular
hours, if that applies where you are.

**3. Do the deductions look consistent** with last time?

**4. Does the net figure match what arrived?**

## If something is wrong

Raise it, politely, early, in writing.

"I think there may be an error on my payslip for this period — can
we check the hours?" is a completely normal message and nobody will
think less of you for it.

Keep your own record. The conversation is much easier when you can
say which days.

## Minimum pay

Most countries set a legal minimum rate, and many have different
rates by age.

**What it is where you live is something to look up**, on your
government's own site, before you agree to anything. This course
quotes none, because they differ everywhere and are usually revised
annually.

Being paid less than the legal minimum is not something to accept
quietly. A parent or carer, and in many countries a government
employment body, can help.

## Keep everything

Payslips, contracts, messages agreeing hours or rates, and your own
record of hours worked.

In most countries you are expected to keep tax records for several
years, and they are the only evidence if something is disputed.

A folder — physical or on a computer a parent or carer also knows
about — is enough. Starting it with the first job is far easier than
reconstructing it later.""",
            },
        ],
        "assignment": {
            "title": "Your Revenue Authority",
            "description": (
                "Part 1. With a parent or carer, find your country's revenue authority and "
                "answer the seven questions from the lesson. Write down each answer, where you "
                "found it, and the date. Do not enter personal details anywhere.\n\n"
                "Part 2. Explain, in your own words, the difference between gross and net, the "
                "two ways tax is collected, and why moving into a higher band does not reduce "
                "your take-home pay.\n\n"
                "Part 3. Find a sample payslip for your country, or use a real one with "
                "permission and the figures removed. Label every part of it and write down the "
                "four things to check every time.\n\n"
                "Part 4. Look up the legal minimum rate for somebody your age where you live, "
                "on a government site. Write it down with the source and the date. Then set up "
                "your own record of hours worked and describe how you will keep it."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Where The Money Goes: Check Your Understanding",
            "description": "Four questions on gross and net, finding rules and payslips.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "You move into a higher tax band. What happens?",
                    "choices": [
                        "All of your income is taxed at the higher rate",
                        "Only the slice above the threshold is — earning more never leaves you with less",
                        "Your allowance is removed",
                        "You must switch to self-declaring",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which collection method catches young people out?",
                    "choices": [
                        "Deduction at source, because the payslip is confusing",
                        "Both equally",
                        "Self-declared, because the money arrives looking like it is all yours",
                        "Neither — young people are usually exempt",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why must tax information come from your country's revenue authority?",
                    "choices": [
                        "It changes annually, it is country-specific, and getting it wrong costs real money",
                        "Other sources are usually behind a paywall",
                        "Because only they can answer questions about your own situation",
                        "Because accountants are too expensive at your age",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the single most useful habit when you start a job?",
                    "choices": [
                        "Reading your contract carefully once",
                        "Checking your bank balance after each payment",
                        "Asking colleagues what they are paid",
                        "Keeping your own record of the hours you worked",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Earning Outside A Payslip",
        "description": "Freelance, self-employed, and the money that is not all yours.",
        "lessons": [
            {
                "title": "Nobody Is Deducting Anything",
                "description": "The thing that catches people.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The dangerous feeling

You do a job for somebody — editing, tutoring, design, a repair,
making something — and they pay you the whole agreed amount.

It feels like all of it is yours. It arrives in your account as a
single clean number with nothing taken off.

In most countries, some of it is not yours. It is tax that has not
been collected yet.

## Why this goes wrong

Because the bill arrives later — sometimes much later, sometimes a
year or more after the money was earned and spent.

By then the money is gone, and the person is being asked for
something they no longer have.

That is the single most common way self-employment goes wrong for
people of any age, and it is entirely preventable.

## The rule

> **When money arrives that has had nothing deducted, immediately
> move a share of it into a separate place and do not touch it.**

Not later. Immediately, as it arrives, in the same way CN-102 said
to save before spending.

What share depends entirely on your country's rates and your
circumstances, which is a question for the revenue authority's own
guidance and, once it is real, an accountant.

The habit is the same wherever you are: separate it the moment it
lands.

## Registering

Most countries require somebody earning self-employed income to
register with the revenue authority, often above a threshold and
usually by a deadline.

Whether that applies to you, at what point, and whether being under
eighteen changes anything, is a question for your country's
authority and for a parent or carer.

**Find out before you start earning**, not after. Registering late
is a common and avoidable problem.

## Keep records from day one

For anything self-employed, keep:

- What came in, from whom, on what date.
- What you spent that was genuinely for the work.
- Receipts for both.
- Anything agreeing the work — messages, emails, a note.

A spreadsheet is enough. Starting it on the first job takes two
minutes; reconstructing a year of it takes a weekend and will be
wrong.

## Costs may reduce what is owed

In most systems, genuine costs of doing the work reduce the income
that is taxed.

What counts differs completely by country and there are rules about
what is a genuine business cost and what is not. Guessing is how
people get it wrong in both directions.

So: keep every receipt, and let the authority's guidance or an
accountant tell you which ones count. CN-402 goes further for an
older reader.

## When to pay somebody

Once income is more than occasional, an accountant is usually worth
more than they cost — in avoided penalties, correct claims, and not
spending your weekends on it.

That is not this course telling you to hire one now. It is telling
you to know that the threshold exists, and to talk to a parent or
carer when you approach it.""",
            },
            {
                "title": "Being Paid Without A Record",
                "description": "Why it costs the worker.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## It will be offered

At some point somebody will offer to pay you with no record — no
payslip, no invoice, nothing written down, often in cash.

Sometimes that is somebody trying to avoid their own obligations.
Sometimes it is just informal and nobody has thought about it.

This lesson is not a lecture about honesty. It is about what it
costs **you**, which is the part nobody mentions.

## What you lose

**Proof you earned anything.** Which matters when renting somewhere,
applying for finance, or claiming anything that depends on income.

**Proof you worked there at all.** No reference, no record of
experience, nothing to point to.

**Protection.** In most countries, employment rights — minimum pay,
hours limits, safety obligations, being paid at all — attach to a
recorded working relationship. Off the books, your position if
something goes wrong is weak.

**Contributions.** In many countries, contributions made while
working count towards healthcare, pensions or benefits later. Not
recorded means not counted, and the person who loses that is you,
decades later.

**Recourse if they do not pay.** With nothing written down, you
have very little.

## And the obligation stays yours

Important: in most systems, income is taxable whether or not
anybody recorded it.

So being paid in an untraceable way does not usually remove your
obligation — it just means nobody has handled it, and you are the
one exposed if it is ever examined.

The person who suggested it is rarely the one who ends up explaining
it.

## What to do

Ask for it to be recorded properly. "Can we do this with an invoice
/ on the books?" is a normal question.

If you are employed, you should be getting payslips. If you are
self-employed, you issue an invoice — a simple document with the
date, what the work was, the amount, and who it is for.

**Keep your own record regardless.** Even an informal job: dates,
hours, amount, who. That is your evidence and it costs nothing.

## If somebody refuses

A person who will not record paying you is telling you something
about how they do business, and about what will happen if there is a
dispute.

You are allowed to decline work. Talk to a parent or carer about it
before deciding — and if somebody is pressuring you, or if the work
itself seems unclear about what it actually is, that is a separate
and more serious matter, which CN-210 covers.

## Not a moral lecture

To be clear: nobody is suggesting a sixteen-year-old doing a few
hours for a neighbour is a tax criminal.

The point is that the informal version is sold to young people as a
favour — more money, no paperwork — and it is usually a worse deal
for them than for the person offering it.""",
            },
            {
                "title": "Filing, And What A Return Actually Is",
                "description": "The annual process, in general terms.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## What a return is

A **tax return** is a declaration to the revenue authority: here is
what I earned, here are my allowable costs, here is what I believe I
owe.

They check it, and either collect what is outstanding or refund what
was overpaid.

The US instance is the 1040; nearly every country has an equivalent,
with different names, different forms and different deadlines.

## Who has to file

Differs completely. In many countries, somebody whose income is
entirely from an employer with tax deducted at source does not need
to file anything at all. In others, nearly everybody files.

Self-employed income, income from more than one source, or income
above certain levels commonly triggers a requirement.

**Whether it applies to you is a question for your own country's
revenue authority**, and the honest answer for a sixteen-year-old
with a part-time job in many countries is: probably not yet.

Knowing *when* it will start applying is the useful thing.

## Refunds happen

A thing worth knowing, because people leave money unclaimed.

If too much was deducted — common for people who worked only part of
a year, or had several jobs, or started partway through — there may
be a refund owed.

In some countries that happens automatically. In others you have to
claim it.

**Checking is free and you do it yourself**, through the revenue
authority. Which leads directly to Module 3, because "you are owed a
refund" is one of the most common messages scammers send.

## Deadlines matter

Where filing is required, the deadlines are real and penalties for
missing them are usually automatic — charged whether or not any tax
was actually owed.

So the two dates worth knowing, if filing applies to you, are when
the return is due and when any payment is due. They are often not
the same date.

Put them in a calendar the moment you learn them.

## Getting help

**The revenue authority itself.** Most have helplines and plain
guidance, and they are generally more helpful than people expect —
their job includes getting it right, not catching you out.

**A qualified accountant**, once it is real.

**A free advice service**, where one exists.

**Not** a confident stranger, and not anybody charging a large fee
to file a simple return.

## What to do now

You probably do not have to file anything yet.

What you can do: find out at what point it would start applying to
you, write that down, and start the records habit now so that when
it does apply the information already exists.

That is the entire practical content of this module, and it takes an
afternoon.""",
            },
        ],
        "assignment": {
            "title": "The Separate Pot",
            "description": (
                "Part 1. Write out the rule about money that arrives with nothing deducted, "
                "and explain in your own words why self-employment goes wrong for people a "
                "year after the money was earned.\n\n"
                "Part 2. Build a simple record-keeping spreadsheet with columns for what came "
                "in, from whom, when, what you spent for the work, and receipts. Fill in three "
                "made-up entries to show it works.\n\n"
                "Part 3. Write out everything a worker loses by being paid with no record. "
                "Then write the sentence you would use to ask for it to be recorded properly.\n\n"
                "Part 4. Using your country's revenue authority, find out at what point you "
                "would have to register or file, and what the deadlines are. Write the answers "
                "down with the date. If the answer is that it does not apply to you yet, write "
                "down what would change that."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Earning Outside A Payslip: Check Your Understanding",
            "description": "Four questions on self-employment, records and filing.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Money arrives from freelance work with nothing deducted. What should you do?",
                    "choices": [
                        "Immediately move a share into a separate place and do not touch it",
                        "Wait until the end of the tax year and work out what is owed",
                        "Spend it, since tax is only due above a threshold",
                        "Ask the person who paid you how much to keep",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does a worker lose by being paid with no record?",
                    "choices": [
                        "Nothing, as long as the amounts are small",
                        "Proof of earnings, proof of experience, protection, contributions and recourse if unpaid",
                        "Only the ability to claim a refund",
                        "Only their employment rights",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Does being paid without a record usually remove your tax obligation?",
                    "choices": [
                        "Yes, if nobody recorded it there is nothing to declare",
                        "Yes, below a certain amount",
                        "No — income is usually taxable whether or not anybody recorded it",
                        "It depends on whether you were employed or self-employed",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Where penalties for late filing apply, when are they usually charged?",
                    "choices": [
                        "Only if tax was owed",
                        "Only after a reminder is ignored",
                        "Only for self-employed people",
                        "Automatically, whether or not any tax was actually owed",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Scams And Mistakes",
        "description": "Where people actually get hurt.",
        "lessons": [
            {
                "title": "The Refund Message",
                "description": "The most common scam you will meet.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The shape

A message, email or call: you are owed a refund, click here to
claim it, enter your details.

Or the other version: you owe tax, you are in trouble, pay
immediately or something bad happens.

Both are extremely common in every country that has a tax system,
and both are aimed at everybody, including young people with a first
job who do not yet know how this works.

## Why they work

**The first one offers money.** Free money produces a reaction that
switches off checking.

**The second one produces fear.** Fear of an official body, an
unfamiliar process and a threat you cannot evaluate.

Both use CN-201's urgency shape: act now, do not go and ask
anybody.

## How revenue authorities actually behave

This differs by country and you should check yours — but some things
are near-universal and worth knowing.

- They generally do **not** ask for payment by unusual methods.
  Gift cards, vouchers, transfers to a personal account or
  cryptocurrency are never how a government collects tax.
- They generally do **not** threaten immediate arrest over the
  phone.
- They generally do **not** ask for full bank details by email or
  text to issue a refund.
- Real correspondence usually arrives through established channels
  and can be verified by contacting them yourself.

## The one rule

> **Never use the link, the number or the reply address in the
> message.**

Go to the revenue authority's own website, independently, by typing
it in. Log in there, or phone the number published there.

If the refund is real, it will be there. If the debt is real, they
will know about it.

That single habit defeats essentially all of these, and it costs
thirty seconds.

## Tell an adult

If you get one of these, show a parent or carer before doing
anything at all.

And if you have already clicked, entered details, or paid — **tell
them today**. Not tomorrow. Acting quickly matters: accounts can be
secured, cards stopped, and in many countries there are official
routes for reporting it.

**You will not be in trouble.** These are designed by professionals
and they catch people of every age, including people whose job is
finance.

## The identity version

A more serious variant: somebody uses your tax identity, or asks to
use it.

That might be a "job" that needs your identifying number, somebody
offering to file on your behalf for a share, or somebody asking to
put income or a refund through your details.

**Never let anybody use your tax identity, your identifying number
or your account.** That is CN-202's rule and it matters more here,
because the person whose identity it is becomes the one explaining
it.

If anybody asks: tell a parent or carer that day.""",
            },
            {
                "title": "Bad Advice, Confidently Delivered",
                "description": "The other way people get this wrong.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Not a scam, still damaging

Most tax problems are not caused by criminals. They are caused by
somebody confident who was wrong.

A relative who did it years ago under different rules. A video
assuming a different country. Somebody in a forum who is certain. A
friend who "doesn't bother declaring it".

## The claims to distrust

**"You don't need to declare that."** Possibly true where they live,
possibly not true where you live, possibly out of date.

**"Everybody claims that as an expense."** A claim about what is
common is not a claim about what is allowed.

**"They'll never find out."** Authorities increasingly receive data
directly from platforms, banks and employers. This claim ages
badly.

**"You can write off anything if you call it a business cost."** No.
There are rules, and inventing costs is not optimisation, it is a
false declaration.

**"Set up a company and pay no tax."** A version of this is
repeatedly sold to young people online. Company structures have real
uses, real costs and real obligations, and the online version is
usually either wrong or a service being sold.

## Avoidance, evasion and the line

Worth having clear.

**Arranging your affairs within the rules** — using an allowance,
claiming a genuine cost, using a scheme the government created — is
legitimate.

**Declaring something false**, hiding income, or inventing costs is
evasion, which is a crime in essentially every country.

The line is not always obvious at the edges, and that is exactly
what qualified advisers are for. What is obvious: **if a plan
depends on a false statement, it is over the line**, however it is
described.

## The pattern you already know

A method being sold. Urgency. Secret knowledge the authorities do
not want you to have. Guaranteed outcomes. Payment up front.

That is CN-201's list, and it applies here identically. Tax is one
of the most heavily marketed subjects online precisely because it is
complicated and everybody has to deal with it.

## What to do instead

**The authority's own guidance** first. It is free, it is correct
for your country, and it is written to be understood.

**A qualified professional** when it is real money. In most countries
there are registered or chartered designations — somebody with one
is accountable for their advice in a way a video is not.

**A free advice service** if cost is a barrier.

## The sentence, again

> **"I'll check that with the revenue authority."**

Legitimate advice survives that. Everything in this lesson's list
does not — and watching which reaction you get is faster than
evaluating the advice itself.""",
            },
            {
                "title": "The Habits That Make This Easy",
                "description": "The last lesson.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Most of this is admin, not intelligence

People imagine tax trouble comes from not understanding the rules.

Mostly it comes from not having the records, missing a date, or
spending money that was never theirs. All three are habits, and all
three are fixable at sixteen.

## The five habits

**1. Keep records from day one.** Every job, every payment, every
receipt, every agreement. A folder and a spreadsheet.

**2. Separate the tax money as it arrives.** For anything with
nothing deducted. Immediately, into somewhere separate.

**3. Put the dates in a calendar.** Registration deadlines, filing
deadlines, payment deadlines — the moment you learn they apply.

**4. Check your payslip.** Ninety seconds, every time, against your
own record of hours.

**5. Ask the official source first.** Before believing anybody.

Those five prevent almost everything that goes wrong.

## Ask early, not when it is a problem

Revenue authorities are generally more reasonable with somebody who
comes forward than with somebody who is found.

Most have processes for people who have made a mistake, got behind,
or did not realise something applied to them. Those processes exist
because this is common.

So the instinct to say nothing and hope is exactly backwards, in the
same way CN-301 described for debt.

## This is a normal part of working

Worth saying, because tax is presented as either frightening or
boring and it is neither.

It is a thing adults deal with routinely. Most of it is
straightforward once somebody has explained it. The people who
struggle are overwhelmingly the ones who were never told any of
this and then found out under pressure.

You are being told at sixteen, which is the whole point.

## What you have

You know what gross and net are and why the gap exists, and that
moving into a higher band never leaves you worse off. You know the
two collection methods and which one catches people. You know that
this course quotes no rates or forms as universal and how to find
your own country's.

You know how to read a payslip and the four things to check. You
know the rule about separating money that arrives undeducted, what
being paid with no record actually costs you, and what a return is.

And you know the refund-message shape, the one rule that defeats it,
that nobody ever uses your tax identity, and the difference between
arranging your affairs and declaring something false.

## The last instruction

Find your country's revenue authority this week. Look at their
guidance for young people or first-time earners. Write down the one
thing that surprised you.

That page will still be the right answer in twenty years, which is
more than can be said for anything else about this subject.""",
            },
        ],
        "assignment": {
            "title": "The Thirty-Second Habit",
            "description": (
                "Part 1. Write out the two shapes of tax scam message and why each works. "
                "Then write the one rule that defeats essentially all of them, and what you "
                "would do if you had already clicked.\n\n"
                "Part 2. Write out the five claims to distrust and why each one is weak. Then "
                "explain, in your own words, the line between arranging your affairs within "
                "the rules and declaring something false.\n\n"
                "Part 3. Write out the five habits. For each, describe exactly what you will "
                "do — where the folder is, which spreadsheet, which calendar.\n\n"
                "Part 4. Visit your country's revenue authority and find their guidance for "
                "young or first-time earners. Write down three things you did not know and one "
                "thing that surprised you, with the date you looked."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Scams And Mistakes: Check Your Understanding",
            "description": "Four questions on scams, bad advice and habits.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "You get a message saying you are owed a tax refund. What is the one rule?",
                    "choices": [
                        "Check whether the sender address looks official",
                        "Never use the link, number or reply address — go to the authority's own site yourself",
                        "Reply asking them to confirm the amount",
                        "Forward it to a parent and wait",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Somebody asks to put income through your tax identity for a share. What do you do?",
                    "choices": [
                        "Agree if the amount is small",
                        "Ask them to put it in writing first",
                        "Refuse — never let anybody use your tax identity — and tell a parent or carer that day",
                        "Check with the revenue authority whether it is allowed",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Where is the clear line between legitimate arrangement and evasion?",
                    "choices": [
                        "Whether an accountant suggested it",
                        "Whether the amounts are large",
                        "Whether the authority is likely to notice",
                        "If a plan depends on a false statement, it is over the line",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What causes most tax trouble?",
                    "choices": [
                        "Not having records, missing a date, or spending money that was never yours",
                        "Not understanding the rules well enough",
                        "Deliberate attempts to pay less",
                        "Authorities changing the rules without notice",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
]

HANDOUTS = []
