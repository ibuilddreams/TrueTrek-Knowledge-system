"""CN-401: Financial Independence: The Post-Grad Plan. Cool Nerds academy,
Level 4 (Undergraduate). Focus area: Finance. Core competencies: budgeting
software, loan repayment, 401(k) vs IRA.

**This file opens the CN-4xx band and establishes its audience: an adult.**
The reader is roughly eighteen to twenty-two, at or near the end of
undergraduate study, with their own income, their own obligations and their own
decisions. Address them as an adult. The guardian routing that runs through
CN-1xx to CN-3xx is gone; what replaces it is routing to **regulated
professionals, official sources and free advice services**, which is the adult
form of the same rule.

The catalog's financial disclaimer applies in full and in its strict form. The
sheet's competencies name US retirement vehicles (401(k), IRA) and this course
**does not treat them as universal**: what tax-advantaged accounts exist, what
employer or state contributions apply, what student loan repayment looks like,
what thresholds and reliefs exist, and how any of it is taxed differ completely
by country and change every year. So the file teaches the *shapes* — tax
advantage, employer matching, repayment mechanics — names the US instruments
only as that country's instance, and routes every specific to the reader's own
revenue authority, financial regulator and a qualified adviser. **No product,
provider, platform, rate, threshold or figure is stated as current**, and every
number is labelled a made-up illustration.

Two further framings are load-bearing. Module 2 treats **student debt without
moralising**: repayment systems differ enormously, some are income-contingent
and behave unlike ordinary debt, and advice to "pay it off fast" is wrong in
some systems and right in others. And Module 3 names **the financial
independence movement honestly** — the arithmetic is real, the lifestyle
promises frequently are not, and much of what is sold under that banner is
CN-303's Module 3 wearing a different name.

Boundary: CN-401 is the first adult plan. CN-301/302/303/304 are the
high-school versions, CN-402 is tax strategy, CN-403 is portfolio construction.
They must not be merged.
"""

MODULES = [
    {
        "title": "The First Real Income",
        "description": "Setting it up before habits form.",
        "lessons": [
            {
                "title": "What Changes When You Are Paid Properly",
                "description": "And why the first two years matter disproportionately.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## A short window

The period between a first proper income and the arrival of fixed
obligations is the easiest time in most people's lives to establish
how they handle money.

Not because there is much of it. Because nothing has calcified yet:
no mortgage, often no dependants, and spending habits that have not
yet expanded to meet the new number.

**Whatever you set up in the first two years tends to persist**,
and changing it later means reducing a standard of living you have
got used to, which is far harder than never raising it.

## Lifestyle creep

The specific mechanism.

Income rises. Spending rises to match, usually within weeks,
usually in ways that do not feel like decisions — a slightly better
flat, eating out more often, subscriptions, replacing things
sooner.

A year later the new income feels exactly as tight as the old one,
and the difference has gone somewhere nobody can account for.

That is not weakness. It is the default, and CN-202 described the
nine-year-old version. The only reliable counter is deciding, in
advance, what share of any increase is allowed to become spending.

**A useful discipline: when income rises, allocate a defined share
of the increase to saving before any of it reaches your current
account.**

## The order of operations

Roughly, and subject entirely to your own country and
circumstances:

1. **Enough to cover an emergency**, somewhere safe and reachable.
2. **Anything matched or relieved** — employer contributions,
   state top-ups, tax-advantaged accounts. These are frequently the
   best terms available anywhere and leaving them is leaving money.
3. **Expensive debt**, dealt with.
4. **Long-term investing**, diversified and low-cost.
5. **Specific goals** with their own timelines.

Most people's real problems are in the first three. Step four gets
all the attention.

## The emergency fund

The least exciting item and the one that makes everything else
possible.

It is what prevents a broken boiler becoming expensive debt, and
what allows somebody to leave a bad job or a bad living situation.

**How much depends on your circumstances** — how secure your income
is, who depends on you, what your fixed costs are. Common guidance
ranges widely and this course quotes none of it; work it out from
your actual monthly fixed costs rather than from a rule of thumb
designed for a different country.

Keep it somewhere safe, separate, and boring. Not invested.

## What this course will not do

Name a product, a provider, an account or a rate. Quote a threshold.
Tell you what the tax treatment is where you live.

All of that is country-specific and changes annually. The method of
finding yours is Module 1's last lesson, and it does not expire.""",
            },
            {
                "title": "Knowing Your Numbers",
                "description": "Budgeting, without the moralising.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## What budgeting actually is

Not restriction. **Knowing where money goes, and deciding rather
than discovering.**

The dividing line between people who handle money well and badly is
not income. It is whether they could tell you, roughly, what comes
in and what goes out.

## Three numbers

**In** — net, not gross. CN-302's distinction and it is the only
one that is real.

**Out, fixed** — rent, bills, insurance, debt payments,
subscriptions. The amount that leaves whether or not you do
anything.

**Out, variable** — everything else.

The gap between the first and the second two is what you actually
have.

## The fixed number is the one that matters

Most people focus on variable spending — coffee, takeaways, the
small things.

That is the wrong target. **Fixed costs are larger, they recur
automatically, and they are set once rather than resisted daily.**

Rent, a car, a phone contract, insurance, subscriptions. Reviewing
those once a year is worth more than a year of discipline about
small purchases.

## Software

The sheet's competency names budgeting software. The honest
position:

**A tool helps if it reduces friction** — automatic categorisation,
a shared view with a partner, alerts.

**A tool is not the method.** People buy one, set it up, and never
look at it. A spreadsheet somebody actually reviews beats an app
they do not.

**Be careful what you connect.** Anything that links to your bank
accounts needs real scrutiny: whether the provider is regulated
where you live, what happens to your data, and who else gets access.
Check your country's financial regulator for whether the firm is
authorised.

This course names no product and recommends none.

## Automate the structure

Set up on payday, before anything is spent:

- Transfer to savings.
- Transfer to investing.
- Fixed costs paid by automatic payment.
- What remains is spendable, and does not need tracking item by
  item.

**That removes the need for willpower**, which is the only approach
that survives contact with a busy life.

## Review

Monthly, briefly. Annually, properly.

The annual review is the valuable one: every fixed cost, every
subscription, every renewal. Most people find something they are
paying for and not using, and something that has quietly increased.

## What budgeting is not

**It is not a moral activity.** Spending on things you enjoy is the
point of having money.

**It is not primarily about going without.** It is about directing
the money at what you actually want rather than letting it
disperse.

**It does not fix an income that is too low.** Some people's problem
is not their spending, and telling them otherwise is both wrong and
cruel. If income genuinely does not cover essentials, that is a
different problem and Module 2's advice services are the right
route.""",
            },
            {
                "title": "Finding Out What Exists Where You Live",
                "description": "The only durable part of this subject.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Why nothing is named here

What exists differs completely by country and changes every year:

- Which tax-advantaged accounts exist and their rules.
- Whether employers must contribute to a pension, and how much.
- Whether the state tops anything up.
- What allowances and thresholds apply.
- How investment returns and withdrawals are taxed.
- What protection exists if a provider fails.
- What student loan repayment looks like.

The US instruments the sheet names — a 401(k) as an employer-linked
retirement account, an IRA as an individual one — are that country's
instance of two general shapes. Most countries have equivalents
under other names and with different rules.

**Anything this course stated would be wrong somewhere and out of
date within a year.**

## The four sources

**1. Your country's revenue authority.** For anything about tax,
reliefs, allowances and what must be declared. CN-302's rule.

**2. Your country's financial regulator.** For which firms are
authorised, what protection exists, warnings, and free consumer
guidance. Usually a government site.

**3. A free, independent money advice service**, where one exists.
Many countries have statutory or charitable bodies with nothing to
sell.

**4. A regulated adviser**, for decisions involving real money.
Qualified, usually registered, and accountable for their advice in a
way nothing on the internet is.

## The questions to answer

Write these down with the date, because they will need rechecking.

- What tax-advantaged accounts exist for somebody like me?
- Does my employer contribute to anything, and do I have to opt
  in?
- Is there a state scheme and am I in it?
- What are the annual limits?
- How is it taxed going in, growing, and coming out?
- What happens if I move country?
- What protection exists if a provider fails?

## The one that catches people

**Employer matching.**

Where an employer will contribute if you do, not doing so is
declining part of your pay. It is frequently the single
highest-return thing available to an ordinary person, and large
numbers of people in their twenties do not take it up because the
paperwork arrived in a busy week.

**Find out on day one of any job whether this exists and what you
have to do.**

## Advisers

Worth knowing how they are paid, because it determines what they
recommend.

Some charge a fee. Some are paid by the products they sell, which
creates an obvious interest. Which arrangements are permitted
differs by country and several have restricted commission
specifically.

**Ask directly: how are you paid, and are you able to recommend
products from the whole market?** A straightforward answer is a good
sign.

Check they are on your regulator's register before anything else.""",
            },
        ],
        "assignment": {
            "title": "The First Setup",
            "description": (
                "Part 1. Work out your three numbers for a typical month: net income, fixed "
                "costs itemised, and variable spending. Use real figures if you have them and "
                "realistic estimates if you do not. Identify your largest three fixed costs.\n\n"
                "Part 2. Design the automatic structure: what leaves on payday, in what order, "
                "to where. Write out the order of operations and say which step you are "
                "currently at.\n\n"
                "Part 3. Using your country's revenue authority and financial regulator, "
                "answer the seven questions from the lesson. Write down each answer, the "
                "source and the date. Do not sign up to anything.\n\n"
                "Part 4. Find out whether any current or prospective employer matches "
                "contributions, what you must do to receive it, and what happens if you do "
                "nothing. Then write down the two questions you would ask any adviser before "
                "taking advice."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "The First Real Income: Check Your Understanding",
            "description": "Four questions on habits, budgeting and finding the rules.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why do the first two years of a proper income matter disproportionately?",
                    "choices": [
                        "Nothing has calcified yet, and whatever you set up tends to persist",
                        "Tax rates are lower at the start of a career",
                        "Investment returns are higher when started early in a job",
                        "Employers offer better terms to new staff",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which spending should you review first?",
                    "choices": [
                        "Small daily purchases, which add up fastest",
                        "Fixed costs — they are larger, recur automatically and are set once rather than resisted daily",
                        "Occasional large purchases",
                        "Anything bought on credit",
                    ],
                    "answer": 1,
                },
                {
                    "text": "An employer will contribute to a scheme if you do, and you do not. What is that?",
                    "choices": [
                        "A reasonable choice if money is tight",
                        "Something to review after a year in the job",
                        "Declining part of your pay",
                        "Only relevant once you earn more",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should you ask any financial adviser first?",
                    "choices": [
                        "What returns their clients have achieved",
                        "How long they have been practising",
                        "Which products they recommend most",
                        "How they are paid, and whether they can recommend from the whole market",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Debt, Including The Education Kind",
        "description": "What it actually is, without the moralising.",
        "lessons": [
            {
                "title": "Student Loans Are Not One Thing",
                "description": "And the advice differs completely by system.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The most country-specific topic in this course

Student finance differs more between countries than almost any
other financial subject, and advice imported from one system into
another is frequently actively harmful.

So this lesson describes the **shapes** and tells you to find out
which one you are in.

## The main shapes

**Income-contingent repayment.** You repay a percentage of income
above a threshold, for a defined period, after which any remaining
balance is cancelled. Repayment stops if income falls below the
threshold.

That behaves very unlike ordinary debt. It functions closer to a
graduate contribution, and a balance that will never be repaid in
full is not comparable to a credit card balance.

**Conventional loan repayment.** Fixed instalments over a term,
regardless of income, with real consequences for missing them.
Behaves like other debt.

**Mixed systems.** Some public loans income-contingent, some private
loans conventional, frequently held by the same person.

**No loans.** Some countries fund study differently.

## Why the distinction decides everything

In a conventional system, paying extra reduces total interest and is
frequently sensible.

In an income-contingent system where a balance is likely to be
cancelled, paying extra may be **paying money nobody would ever have
collected** — and the same money in a pension or an emergency fund
would have done more.

That is not a rule. It depends on the specific terms, your expected
income, the interest treatment and the cancellation period.

**It is also exactly the kind of question a regulated adviser or
your country's official student finance body answers and a video
does not.**

## What to find out

For your own loan, from the official body that administers it:

- Is repayment income-contingent or conventional?
- What is the threshold and how is it adjusted?
- What percentage, of what?
- How is interest calculated?
- Is there a cancellation period?
- What happens if I move abroad?
- Is there any penalty for paying early?
- Which of my loans are on which terms?

Write down the answers and the date.

## Private loans are different

Where they exist, private student debt is usually conventional debt
with ordinary consequences, and it should be treated as such rather
than lumped in with a public income-contingent loan.

**Know which of yours is which.** People frequently do not, and it
changes the right answer entirely.

## Without moralising

Two bad framings, both common.

**"Debt is shameful."** Most people who studied took it because
that was the available route. It is not a character flaw.

**"Pay it off as fast as possible."** Right in some systems, wrong
in others, and stated as universal by people who have only
experienced one.

The useful position is neither: **find out exactly what yours is,
then decide.**""",
            },
            {
                "title": "Other Debt, And Which To Attack",
                "description": "Prioritising properly.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Make the list

CN-304's one page, in adult form.

Every debt: who it is owed to, the balance, the rate, the minimum
payment, the date due, and whether it is secured on anything.

Nothing can be planned until that page exists, and the version in
somebody's head is always worse than the real one — which is itself
a reason to write it.

## Priority is not only about rate

Two different orderings, and people conflate them.

**By consequence.** Some debts cost you your home, your heating,
your liberty, or essential services. Those come first, regardless of
rate, because the consequence is not financial.

What falls into that category differs by country. Your country's
free debt advice service will say.

**By cost.** Among debts with ordinary consequences, highest rate
first saves the most money.

## The two approaches

**Highest rate first.** Minimums on everything, everything spare at
the most expensive. Mathematically optimal.

**Smallest balance first.** Clear the smallest, then the next.
Slightly more expensive, produces visible progress, and people stick
with it.

CN-304's point: a plan somebody follows beats an optimal plan they
abandon.

## Before overpaying anything

Three questions.

**Is there an emergency fund?** Overpaying debt and then borrowing
again when something breaks is a round trip with fees attached.

**Is there matched employer money being left?** That is usually a
better return than repaying moderate-rate debt — the one thing that
typically outranks it.

**Is this debt actually expensive?** Some is not, and the money may
do more elsewhere. Student loans in an income-contingent system are
the obvious case.

## Consolidation

Moving several debts into one.

Sometimes genuinely helpful: a lower rate, one payment, a clear end
date.

Frequently not: a longer term means more total interest even at a
lower rate, fees are added, and freed-up credit lines get used
again, leaving somebody with the consolidation loan **and** the
original debts.

**Take advice before consolidating**, from a free advice service
rather than from a firm selling the consolidation.

## If it is unmanageable

Act early. The difference between a difficult situation and a
serious one is how long it ran before somebody spoke.

**Free, confidential debt advice exists in most countries**, from
charities or statutory bodies with nothing to sell. They deal with
this daily and the people who use them are ordinary.

Find yours through your financial regulator or consumer body, and
know it before you need it.

**Never pay a company to do what a free service does**, and never
accept an approach from somebody offering to clear your debts.
CN-301's module three.""",
            },
            {
                "title": "Protecting Against The Downside",
                "description": "Insurance and the things nobody sets up.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## What this is for

Everything else in this course assumes income continues.

Protection is what covers the situations where it does not, or where
something expensive happens. It is dull, it is frequently skipped by
people in their twenties, and it is the difference between a bad
year and a catastrophic one.

## The categories

Generic shapes. What exists, what is compulsory, what is provided by
the state and what by employers differs completely by country.

**Health cover.** In some countries largely provided publicly, in
others essential to arrange privately. Know which you are in and
what gaps exist.

**Income protection.** Pays something if you cannot work through
illness or injury. Frequently the most valuable and least bought.

**Life cover.** Matters if somebody depends on you financially.
Frequently unnecessary if nobody does.

**Liability cover.** If you could be held responsible for damage or
injury. Compulsory for some activities and professions.

**Property and contents.**

**Compulsory cover** for specific activities — driving, certain
professions, letting property.

## What your employer may provide

Frequently more than people realise: health cover, income
protection, life cover, legal help, counselling.

**Find out what yours includes** — people pay separately for things
they already have, and others assume cover they do not have.

## The honest questions

Before buying anything:

**What specifically does it pay out for, and what is excluded?**
Exclusions are where the arguments happen. Read them.

**What happens to a claim?** Look for information about how claims
are actually handled, not the marketing.

**Is the provider authorised** by your country's regulator?

**Could I absorb this loss myself?** Insurance is for losses you
could not absorb. Insuring small, affordable things is usually
poor value.

## The documents nobody sets up

Boring, cheap or free, and the absence causes real problems.

**A will**, if you have anything or anybody depending on you. What
makes one valid differs by country and the formalities matter.

**Beneficiary nominations** on pensions and similar — frequently
separate from a will and frequently overlooked.

**Someone knowing where things are.** A list of accounts,
providers and documents, accessible to somebody you trust.

**Arrangements for incapacity**, which exist in some form in most
countries under various names.

**These are jurisdiction-specific and the formalities decide
whether they work.** Use a qualified professional, not a template
from the internet.

## Nobody does this at twenty-two

Which is why it is here. Setting up protection and the basic
documents takes a few hours once, and the people who have done it do
not think about it again.""",
            },
        ],
        "assignment": {
            "title": "The One Page, And What You Are Actually In",
            "description": (
                "Part 1. Find out, from the official body administering your student finance, "
                "the answers to all eight questions in the lesson. Write them down with the "
                "date. State clearly whether your loan is income-contingent or conventional, "
                "and whether any of it is private.\n\n"
                "Part 2. Build the one page for all your debts: who, balance, rate, minimum, "
                "date, secured or not. Then order it twice — by consequence and by cost — and "
                "say which approach you would use and why.\n\n"
                "Part 3. Answer the three questions before overpaying anything. Find your "
                "country's free debt advice service through the regulator and write it down.\n\n"
                "Part 4. List what protection you currently have, including anything through "
                "an employer or a family policy. Identify one gap. Then write down which of "
                "the four documents you do not have and what the formalities are where you "
                "live."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Debt, Including The Education Kind: Check Your Understanding",
            "description": "Four questions on student loans, priority and protection.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why is 'pay off your student loan as fast as possible' not universal advice?",
                    "choices": [
                        "Early repayment usually carries a penalty",
                        "In an income-contingent system with cancellation, extra payments may be money nobody would ever have collected",
                        "Student loan interest is always lower than other debt",
                        "Repayment is handled automatically in most countries",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which debts come first regardless of interest rate?",
                    "choices": [
                        "The largest balances",
                        "The ones with the shortest terms",
                        "Those whose consequence is not financial — home, heating, liberty, essential services",
                        "Anything owed to family or friends",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What typically outranks repaying moderate-rate debt?",
                    "choices": [
                        "Matched employer contributions being left on the table",
                        "Investing in a diversified portfolio",
                        "Overpaying a mortgage",
                        "Building a larger emergency fund than needed",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which protection is frequently the most valuable and the least bought?",
                    "choices": [
                        "Life cover",
                        "Contents insurance",
                        "Income protection",
                        "Liability cover",
                    ],
                    "answer": 2,
                },
            ],
        },
    },
    {
        "title": "Independence, Honestly",
        "description": "The arithmetic, and what is sold under its name.",
        "lessons": [
            {
                "title": "What Financial Independence Actually Means",
                "description": "The real arithmetic.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## A precise definition

**Financial independence** is the point at which your assets
generate enough to cover your living costs, so that working becomes
optional.

That is it. It is an arithmetic condition, not a lifestyle.

## The two variables

Only two things determine how long it takes.

**Your savings rate** — the proportion of income you do not spend.

**Your costs** — which determine both how much you need to
accumulate and how fast you accumulate it.

Income matters, but less than people assume: somebody earning a
great deal who spends nearly all of it is further away than somebody
earning modestly who saves a third.

## Why costs count twice

The non-obvious part.

Reducing your spending by an amount does two things simultaneously:
it increases what you save each year, **and** it reduces the total
you need, because the target is a multiple of annual costs.

That double effect is why savings rate dominates the arithmetic.

## The rough model

A made-up illustration, with invented assumptions, to show the
shape — not a prediction and not advice.

If you need some multiple of annual spending accumulated, and your
investments grow at some rate, then the time to reach it depends
almost entirely on what proportion of income you save.

Save a small proportion and it takes most of a working life. Save a
large proportion and it takes considerably less. The relationship is
not linear — it drops sharply as the rate rises.

**Work it out with your own numbers** rather than taking anybody's
figures. Any spreadsheet can do it.

## The assumptions that get hidden

Here is where honest arithmetic and marketing diverge.

Every projection rests on assumptions about **growth rates**,
**inflation**, **tax treatment**, **how long you live** and **what
happens in bad decades**. Change any of them and the answer moves
substantially.

Projections are presented as though these are known. They are not.
A model is a conversation about assumptions, not a forecast.

This course quotes none of them, for the reason CN-313 gave: a
confident number about the future is an argument, not information.

## What it is genuinely good for

Even if you never reach it, the framework is useful.

**It makes costs visible** as a multiple rather than a monthly
figure.

**It reframes savings** as buying time rather than going without.

**It produces optionality long before independence** — the ability
to leave a bad job, retrain, take a risk, or absorb a shock. That
arrives far earlier than the full target and is worth more to most
people.

## What it is not

Not a guarantee. Not a plan that survives contact with illness,
redundancy, caring responsibilities or a bad decade.

And not an argument for spending nothing in your twenties. **A
decade spent miserable to retire slightly earlier is a poor trade**,
and the people who present it otherwise are usually selling
something.""",
            },
            {
                "title": "What Is Being Sold Under That Name",
                "description": "CN-303's module three, in adult form.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The genre

An enormous amount of content is produced about financial
independence, early retirement and passive income. Some is honest
and useful. A great deal is a business whose customer is the reader.

CN-201's question still answers most of it: **where does their money
actually come from?**

Frequently: a course, a membership, affiliate links to platforms
that pay for sign-ups, or advertising revenue from the content
itself. Not from the method being described.

## The shapes

**"Passive income."** Almost nothing described this way is passive.
Property is a job. A business is a job. Content is a job. Genuinely
passive income is essentially investment returns, and those are
proportional to capital — which means the honest version is "have
capital", which does not sell.

**Survivorship.** The people who retired at thirty-two during a
particular period, in a particular market, with a particular income,
are visible. Those who tried the same thing and did not are not
writing about it. CN-310's rule.

**Unrepresentative starting points.** Frequently undisclosed: a very
high income, an inheritance, a partner's income, a property bought
at a particular time, or income from the content itself.

**Projections with hidden assumptions.** Module 1's point. A
confident chart of your future is a set of assumptions presented as
a destiny.

**Guaranteed returns.** Anything guaranteed is the warning, not the
offer. Unchanged since CN-201.

**Urgency and secret knowledge.** Unchanged.

## Property specifically

Heavily promoted to people in their twenties as the route.

The honest version: it is a real asset class, it is **leveraged**,
it is illiquid, it carries costs people routinely omit from their
calculations — maintenance, vacancy, tax, transaction costs,
management, regulation — and the regulatory position differs
completely by country and is changing in many.

**Leverage cuts both ways**, and it is how people in property lose
more than they put in. CN-303's rule holds.

What is sold at seminars is frequently the seminar.

## Side income

Legitimate and worth doing. CN-308's subject, in adult form.

Just be honest about what it is: a second job, with a real time
cost, and in most countries with tax and possibly registration
obligations from the first payment. CN-402 covers that.

## The test

Still the adult version of the same sentence:

> **"I'll look into that and decide later."**

And the three checks: is the firm on the regulator's register, can
you explain where the return comes from, and what does it cost you
every year as a percentage including everything.

## If you have already lost money

It happens to competent people and the industry is professional.

**Do not send more.** No legitimate investment requires you to pay
to receive your own money, and the recovery approach that follows a
loss is a second attempt on somebody already identified.

Report it through your country's official fraud reporting route,
reachable via the financial regulator.""",
            },
            {
                "title": "A Plan You Will Actually Follow",
                "description": "The last lesson.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Complexity is the enemy

An elaborate plan that requires attention every month will be
abandoned within a year.

What survives is simple, automatic and requires almost no
decisions.

## The whole thing, on one page

For most people in their twenties, in most countries, something like
this:

1. Know the three numbers, reviewed monthly.
2. Emergency fund, sized from your actual fixed costs, somewhere
   safe and separate.
3. Take anything matched or tax-advantaged, in full.
4. Clear expensive debt.
5. Invest regularly and automatically, diversified and low-cost.
6. Protection and documents in place.
7. Review properly once a year.

That is it. It takes a few hours to set up and a few minutes a
month to maintain, and it outperforms most elaborate approaches
because it gets followed.

## Decide the rules while it is calm

CN-304's point in adult form.

Write down, now:

- What share of any pay rise becomes saving rather than spending.
- What you will do when markets fall by a third. ("Nothing.")
- What you will not borrow for.
- What you will not invest in, however it is presented.
- At what point you will take professional advice.

Decisions made in advance, by somebody with nothing at stake, are
better than decisions made in the moment.

## Review once a year

Fixed costs. Subscriptions. Insurance renewals. Whether your
employer's terms changed. Whether your country's rules changed —
they do, annually.

An hour. It is usually the highest-value hour of financial work
anybody does.

## Get advice at the real decisions

Not for everything. For these:

- Anything involving a property purchase.
- Anything involving substantial money or a long commitment.
- When your circumstances change — a partner, a child, moving
  country, inheriting something.
- Tax questions beyond the straightforward.
- Anything you do not fully understand.

A regulated professional, checked against the register, asked how
they are paid.

## What money is for

CN-202's point, at twenty-two.

Choices. Safety. Time. The ability to help people. Not a score.

Somebody who reaches a large number having spent a decade anxious
and joyless has not won. The plan is supposed to serve a life rather
than replace one.

## What you have

You know that the first two years set habits that persist, how
lifestyle creep works, and the order of operations. You know what
budgeting actually is and that fixed costs are the real target.

You know this course names no product, rate or threshold, and the
four sources that answer for your own country. You know that student
loans are not one thing and which questions decide it. You know how
to prioritise debt and what protection and documents nobody sets
up.

And you know the real arithmetic of independence, the assumptions
hidden inside every projection, and what is sold under that name.

## The last instruction

Set up the automatic transfer this month, however small.

Everything else in this course is an argument for that one
action.""",
            },
        ],
        "assignment": {
            "title": "Your Own Numbers",
            "description": (
                "Part 1. Build the independence model with your own figures: annual costs, "
                "savings rate, and a growth assumption you choose. Write down every assumption "
                "explicitly and show how the answer changes when you vary each one.\n\n"
                "Part 2. Write out the seven shapes used to sell financial independence "
                "content. For one piece of content you have seen, without naming it, answer: "
                "where did their money come from, and what was undisclosed about their "
                "starting point?\n\n"
                "Part 3. Write your one-page plan, all seven steps, with the actual accounts "
                "and amounts where you know them and the gaps marked where you do not.\n\n"
                "Part 4. Write down your rules, decided now while it is calm: the share of a "
                "pay rise that becomes saving, what you do when markets fall by a third, what "
                "you will not borrow for, what you will not invest in, and when you will take "
                "professional advice. Date it."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Independence, Honestly: Check Your Understanding",
            "description": "Four questions on the arithmetic, the selling and the plan.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does savings rate dominate the arithmetic of financial independence?",
                    "choices": [
                        "Because investment returns are unpredictable",
                        "Reducing spending increases what you save and reduces the total you need — it counts twice",
                        "Because income is usually fixed",
                        "Because tax treatment favours savers",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is true of almost everything described as 'passive income'?",
                    "choices": [
                        "It requires substantial capital to start",
                        "It is taxed more heavily than employment",
                        "It is not passive — property, business and content are all jobs",
                        "It is only available in certain countries",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is hidden inside every confident projection about your financial future?",
                    "choices": [
                        "Assumptions about growth, inflation, tax, longevity and bad decades",
                        "The author's own financial position",
                        "The fees charged by the recommended products",
                        "The country the model was built for",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does a simple automatic plan outperform an elaborate one?",
                    "choices": [
                        "It has lower fees",
                        "It is easier to explain to an adviser",
                        "It produces better returns",
                        "It gets followed",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
