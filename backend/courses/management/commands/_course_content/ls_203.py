"""LS-203: Strategic Leverage - Credit and Debt.

Level 2: Wealth & Network Architecture. Written against the course's focus
(leveraging credit and debt to build assets rather than liabilities) and its
core competencies: good versus bad debt, building a credit score, using
business loans for acquisition, and real estate financing basics.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).

Financial **education, not advice**. Credit scoring, loan products and
mortgage rules named here are United States ones, matching the client's brief;
the course says equivalents differ by country, quotes no rate as current, and
routes every borrowing decision through a guardian and a qualified
professional.
"""

MODULES = [
    {
        "title": "Good Debt and Bad Debt",
        "description": (
            "Borrowing is a tool with a price — what separates the uses that build something "
            "from the ones that take it."
        ),
        "lessons": [
            {
                "title": "What Debt Actually Costs",
                "description": "Interest, compounding against you, and the numbers people never calculate.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Education, not advice

This course explains how borrowing works so you can evaluate an offer and talk
to a professional. It recommends no product and quotes no current rate. Credit
rules differ by country and change; every real borrowing decision goes through
a guardian and a qualified adviser.

## Debt is rented money

You pay for the use of somebody else's money. The rent is interest, and the
only honest way to think about any loan is: **what am I getting, and what is
the rent?**

## APR

**Annual Percentage Rate** is the standard comparison figure — the interest
plus most compulsory fees, expressed as a yearly percentage. It exists so
different offers can be compared, which is why the one number to ask for is
always the APR.

Rough ordering, and the gaps between these are enormous:

- Secured borrowing against property is usually the cheapest.
- Student and auto loans sit in the middle.
- Unsecured personal loans higher.
- Credit cards higher again.
- Payday and short-term high-cost lending highest by a wide margin — these can
  reach triple-digit APRs and are the most expensive money most people ever
  touch.

## Compounding, backwards

LS-202 showed compounding working for you. On a credit card it works the same
way against you: interest is charged on interest, and a balance left alone
grows on its own.

The minimum payment is the mechanism. It is set low enough to feel manageable
and it is mostly interest, so a balance paid at the minimum can take many
years and cost more in interest than the original purchase.

That is not an accident of the product. It is the product.

## Calculate the total

Before any borrowing, work out **the total amount repaid**, not the monthly
figure.

The monthly figure is how loans are sold — "only $X a month" — and it hides
the term. The same monthly payment over six years instead of three costs far
more and is presented as the better offer.

So always ask for three numbers:

1. The APR.
2. The total amount repayable.
3. The term.

Then compare total against total.

## The real cost of the car

The worked example that matters most to young earners.

A car bought on finance costs the purchase price, plus interest, plus
insurance — which is very expensive for a young driver — plus tax,
maintenance, fuel and depreciation. The vehicle loses value steadily while the
loan does not.

Which means the common position of owing more than the car is worth
(**negative equity**) is normal rather than unusual, and it is why the car is
the single most common way young people with new income end up trapped.

## The test

Before borrowing anything, three questions:

1. **Does this buy something that will be worth more, earn more, or last
   longer than the loan?**
2. **Can I afford the payment if my income stops?** For an athlete this is
   not hypothetical.
3. **What is the total repaid, and is it worth that?**

If the answers are no, no and "I hadn't worked it out", it is the next
lesson's category.
""",
            },
            {
                "title": "The Distinction",
                "description": "Debt that builds something, and debt that consumes it.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The rough rule

**Good debt** buys something that produces value: an asset that appreciates, an
income, or an increase in what you can earn.

**Bad debt** buys consumption — something that is used up or loses value — and
leaves the repayment behind.

The rule is rough because the same loan can be either depending on the
specifics, which is the real lesson.

## Usually good, if the numbers work

**Education**, where it genuinely raises earnings. "Genuinely" is doing the
work: borrowing heavily for a qualification with poor prospects is not good
debt because it is education.

**A mortgage on a home you will keep.** Module 3's subject. Property can fall,
and transaction costs are large, so this depends on the numbers and the time
horizon.

**Borrowing for a business that produces income**, where the income
comfortably covers the repayment.

**A loan that replaces more expensive debt**, at a genuinely lower total cost.

## Usually bad

**Credit card balances** carried month to month.

**Buy-now-pay-later** stacked across several purchases.

**Payday and high-cost short-term loans.** Close to always the wrong answer,
and designed around people with no alternative.

**Borrowing to invest or to speculate.** Combining LS-202's risk with
leverage, which is how people lose more than they had. For a young athlete:
never.

**Car finance beyond what you need**, which is where the biggest avoidable
numbers usually are.

**Borrowing to maintain a lifestyle.** The most dangerous, because it is
invisible until it is large — and it is the mechanism by which LS-201's
lifestyle inflation becomes a real problem rather than merely a waste.

## What makes the same loan good or bad

Four things:

**The rate.** A low-rate loan on a sensible purchase and a high-rate loan on
the same purchase are different decisions.

**The term** relative to the life of the thing. Still paying for something you
no longer use is a bad loan, whatever it bought.

**Your ability to repay if income stops.** The athlete-specific question.

**Whether you would buy it without the finance.** If the only reason it is
affordable is that payment is spread, the honest answer is that it is not
affordable.

## Leverage, honestly

Borrowing magnifies outcomes in both directions. The same mechanism that makes
a successful property purchase more profitable makes an unsuccessful one far
worse, and the loan does not adjust when things go badly.

"Leverage" in a sales conversation almost always describes the upside. It is
the same word for the downside.

## The athlete rule

Because income can stop suddenly and the earning window may be short:

> **Borrow less than you could, on shorter terms than offered, for things that
> produce value — and keep the payments survivable on a much lower income.**

That is conservative, and conservative is correct when your income depends on
one body.
""",
            },
            {
                "title": "Getting Out of Bad Debt",
                "description": "The order of operations, and what to do if it is already a problem.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## First, see all of it

List every debt: who, how much, the APR, the minimum payment, the term. All of
it, including the small ones and the buy-now-pay-later plans.

People avoid this list because it is unpleasant, and the avoidance is what
lets it grow. Writing it down is the hardest step and the one that most
reliably changes things.

## The order

**1. Keep every minimum payment up to date.** Missed payments add fees and
damage credit for years — Module 2.

**2. Keep a small buffer.** Clearing every penny of debt with nothing in
reserve means the next unexpected cost goes straight back on a card. Keep a
few hundred aside first.

**3. Attack the most expensive first.** Everything spare goes to the highest
APR while the others get minimums. Mathematically this is the cheapest route,
and the gap between a 25% balance and a 6% loan is where the money is.

**4. Then the next most expensive.** Repeat.

## The alternative that also works

Some people clear the **smallest balance first** instead, for the motivation
of finishing one.

It costs slightly more in interest and it works better for some people, and a
method you stick to beats an optimal method you abandon. Choose honestly based
on what you know about yourself.

## Things that genuinely help

- **Ask for a lower rate.** Some issuers will reduce it if asked, particularly
  with a good payment history. Free to ask.
- **A balance transfer** to a lower rate, if the fee is less than the interest
  saved and you can clear it within the promotional period. Read the terms;
  these are structured so that most people do not.
- **Consolidation**, where the total cost is genuinely lower. Often it is not
  — the monthly payment falls because the term is longer, and the total rises.
- **Stop adding to it.** Obvious, routinely skipped, and nothing else works
  without it.

## Things that make it worse

- Paying only minimums indefinitely.
- New borrowing to pay old borrowing at a similar or higher rate.
- Fee-charging "debt relief" companies, when free advice exists.
- Ignoring letters, which removes every option that was available early.
- Borrowing from family without terms, which is LS-301's territory and
  damages more than finances.

## If it is already serious

Missing payments, borrowing to cover borrowing, hiding it, or lying awake
about it — that is past self-management.

- **Tell a parent or guardian.** Today.
- **Get free, regulated debt advice.** Nonprofit credit counselling agencies
  exist in most places; a reputable one does not charge up-front fees and does
  not promise to make debts disappear.
- **Talk to the lenders.** Most have hardship processes and they work far
  better before the account defaults.
- **Do not borrow your way out.**

Debt affects sleep, mood and performance, and the shame around it is the main
reason people wait. It is a solvable problem that gets harder every month it
is unspoken.

## The habit that prevents all of it

LS-201's emergency buffer. Most bad consumer debt starts as an unexpected cost
with no cash available.

Three to six months of essential costs in an accessible account is the single
most effective protection against ever needing this lesson.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Price the Borrowing",
            "description": (
                "Do the arithmetic that lenders present in monthly instalments.\n\n"
                "Submit:\n"
                "1. APR in your own words, and the three numbers to ask for on any loan.\n"
                "2. A real comparison: find three actual advertised offers available where "
                "you live — a credit card, a personal or auto loan, and a short-term "
                "high-cost product. Record the APR for each from the lender's own page and "
                "link it.\n"
                "3. A total-cost calculation for one of them: a realistic borrowed amount, "
                "the term, the monthly payment and the total repaid. Show the working.\n"
                "4. The same purchase over a shorter and a longer term, with the difference "
                "in total cost.\n"
                "5. A minimum-payment projection: a credit card balance of your choosing paid "
                "at the minimum — how long and how much in total. Show the source of the "
                "calculator you used.\n"
                "6. The true cost of a car you might actually buy: purchase, interest, "
                "insurance quoted for your age, tax, maintenance, fuel and estimated "
                "depreciation over three years.\n"
                "7. Your good-debt and bad-debt lists, with one example from each applied to "
                "your own likely future.\n"
                "8. The four things that make the same loan good or bad, applied to the car "
                "in part 6.\n"
                "9. The athlete rule in your own words, and what it would mean for the "
                "largest borrowing you can imagine making.\n"
                "10. Your debt list, if you have any, with the order you would clear it — or, "
                "if you have none, your buffer position and target.\n\n"
                "Graded on whether parts 2 and 6 use real quoted figures, and on whether the "
                "arithmetic in parts 3–5 is shown rather than asserted."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Good and Bad Debt",
            "description": "Four questions on cost, the distinction and repayment.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Why is the monthly payment the wrong number to compare loans on?",
                    "choices": [
                        "It hides the term — the same payment over a longer term costs far more",
                        "It excludes compulsory fees",
                        "It varies with the lender's base rate",
                        "It is calculated after tax",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does the course say the credit-card minimum payment is?",
                    "choices": [
                        "A regulatory requirement protecting borrowers",
                        "The product — set low, mostly interest, so a balance can take years and cost more than the purchase",
                        "The cheapest way to maintain a credit score",
                        "An estimate of affordability based on your income",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the athlete-specific question before borrowing?",
                    "choices": [
                        "Will this affect my eligibility?",
                        "Does my club permit personal finance agreements?",
                        "Can I afford the payment if my income stops?",
                        "Will the asset be worth more by the end of my career?",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should you do before attacking the highest-APR debt?",
                    "choices": [
                        "Consolidate everything into one loan",
                        "Negotiate every rate down",
                        "Clear the smallest balance for momentum",
                        "Keep every minimum payment current, and keep a small buffer",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Credit, and How It Is Measured",
        "description": (
            "What a credit score is, what actually moves it, and why it matters long before "
            "you borrow."
        ),
        "lessons": [
            {
                "title": "What a Credit Score Is",
                "description": "A number about your reliability, and who is reading it.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## What it is

A score summarising how you have handled borrowing, calculated from your
credit report. In the US the reports are held by three bureaus — **Equifax,
Experian and TransUnion** — and the best-known scoring models are **FICO** and
**VantageScore**.

Other countries have different bureaus, different models and in some cases no
score at all. The principles below travel; the specifics do not.

## What is on the report

- Accounts: cards, loans, finance agreements.
- Balances and limits.
- Payment history, including anything late.
- Applications you have made.
- Public records such as judgments or bankruptcies.
- Accounts in collections.

Not on it: your income, your savings, your race, your religion, or your
athletic ability.

## Who reads it

More people than most teenagers expect:

- Lenders, obviously.
- **Landlords**, which is the first real-world use for most young adults.
- **Phone and utility providers**.
- **Insurers**, in many states, where credit-based scores affect premiums.
- Some employers, for certain roles, with permission.

So the score matters well before you intend to borrow. The first time most
people need it is renting a flat, and by then it is too late to start.

## What actually moves it

Roughly in order of weight, with the usual caveat that models differ:

**1. Payment history.** The largest factor by a distance. A single payment
30 days late can be reported and can sit on the report for years.

**2. Amounts owed, especially utilisation.** How much of your available credit
you are using. Lower is better; keeping balances well below the limit matters
more than people think, and this is the fastest thing to improve.

**3. Length of credit history.** How long accounts have been open, which is
why closing your oldest card can be counterproductive.

**4. New credit.** Several applications in a short window looks like distress.

**5. Mix of credit types.** Minor.

## What does not move it

- Checking your own score. That is a **soft** inquiry and has no effect.
- Your income or savings.
- Using a debit card.
- Paying in cash, which simply builds no history at all — the invisible-file
  problem for young adults.

## Hard and soft inquiries

A **soft** inquiry is you checking, or a pre-approval screen. No effect.

A **hard** inquiry is a real application. A small effect, and several in a
short period is worse than one.

Shopping for a single loan — a mortgage or an auto loan — within a short
window is usually treated as one inquiry by the models, so comparing offers is
not penalised the way people fear.

## Check it, free

You are entitled to your credit reports from the bureaus for free, and the
official route is **annualcreditreport.com** rather than any advertised
service. Many banks and cards show a score free as well.

Check annually, and look for anything you do not recognise.
""",
            },
            {
                "title": "Building It From Nothing",
                "description": "The practical steps for somebody with no history at all.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The invisible file

A seventeen-year-old typically has no credit history. That is not a bad score;
it is no score, and to a lender it looks like an unknown.

Building a file takes time, which is why starting early — carefully and in
small amounts — is worth more than almost anything you can do later.

## The usual routes

**An authorised user on a parent's card.** You are added to their account;
their history on that card can appear on your report. Costs nothing, builds
history, and depends entirely on them handling it well. If their account is
mismanaged, this harms you.

**A secured card.** You deposit an amount and that becomes your limit. Low
risk for the issuer, which is why they are available to people with no
history.

**A student card**, where you qualify.

**A small credit-builder loan**, offered by some credit unions, where the
payments build history.

**Reporting rent and utilities**, through services that add them to a report.
Variable in which bureaus and models use them.

All of these need a guardian's involvement while you are a minor, and most
card products require you to be eighteen anyway.

## Then use it correctly

This is the part people get wrong. The purpose is to demonstrate reliability,
not to borrow.

- **Put one small, regular thing on it** — a subscription, a tank of fuel.
- **Pay the statement balance in full, every month, automatically.** Then you
  pay no interest at all and still build history.
- **Keep utilisation low.** Well under the limit, consistently.
- **Never miss a payment.** Set up autopay for at least the minimum as a
  safety net, even if you pay in full manually.
- **Keep the account open** once it exists, even if lightly used. Length of
  history is an asset.

**A credit card paid in full each month costs nothing and builds the thing you
will need.** A credit card carrying a balance is the most expensive borrowing
in Module 1. Same product, opposite outcomes, and the difference is a single
habit.

## What damages it fastest

- A missed payment.
- High utilisation.
- An account going to collections.
- Several applications at once.
- A default or judgment, which can sit for many years.

## The repair reality

There is no quick fix. Anything advertising one is a scam, and "credit repair"
services charging up-front fees are a well-documented category of fraud.

What actually works: pay everything on time, reduce balances, dispute genuine
errors with the bureau directly for free, and wait. Time does most of it.

## Errors

Credit reports contain mistakes more often than people assume — an account
that is not yours, a payment recorded late that was not, a duplicate.

You can dispute them with the bureau for free, and it is worth doing. This is
the practical reason to check your report annually rather than only when you
need it.
""",
            },
            {
                "title": "Borrowing to Buy Something That Earns",
                "description": "Business borrowing, in principle, for somebody who may do it one day.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The idea

The legitimate case for debt is buying something that produces income greater
than the cost of the borrowing.

If a business generates enough to cover repayments with a genuine margin, the
loan is a tool. If it does not, the loan is a problem with a business attached.

## The arithmetic

Before any business borrowing, three numbers:

**1. Expected income from the thing**, conservatively estimated. Then reduce
it, because first-year projections are almost universally optimistic — LS-103
named the planning bias.

**2. All the costs.** Not just the loan: stock, staff, rent, insurance,
licences, tax, repairs, the things nobody listed.

**3. The gap.** Income minus every cost minus the repayment. If that is thin,
small, or depends on everything going right, the answer is no.

## The question that matters most

**What happens if it does not work?**

- Is the loan **secured** on anything — a property, a vehicle, your home?
- Is there a **personal guarantee**, meaning you are liable personally even if
  the business is a company? This is extremely common in small-business
  lending and it is the clause that turns a failed business into personal
  ruin.
- How long could you cover the payments with no income from it?

**Never sign a personal guarantee without independent legal advice.** That
sentence is the single most important one in this lesson.

## The kinds of business borrowing

- **A term loan**: a fixed amount, repaid over a period.
- **A line of credit**: borrow and repay as needed, for cash flow.
- **Equipment finance**, secured on the equipment.
- **Merchant cash advances**, which are repaid from future revenue and are
  usually very expensive — treat them as the payday loans of business
  lending.
- **Investor money**, which is not debt: you sell part of the business, which
  means you share the upside and give up some control.

## The athlete version

LS-202 named this: athletes invest in friends' businesses, restaurants, bars
and ventures in industries nobody involved understands, and the results are
well documented.

Borrowing to do it is the same error with leverage attached.

If you do go into a business:

- **Understand the industry**, or have a partner who genuinely does and has
  their own money in it.
- **Be an owner, not only a source of money.** Money with no control is how
  athletes are used.
- **Everything in writing**, drafted by a lawyer who acts for you alone.
- **Never personally guarantee** anything you could not lose.
- **Keep it a small share** of what you have.

## Why it is in this course anyway

Because business borrowing used properly is how most wealth is actually built,
and because the version of this conversation an athlete usually meets — an
excited pitch from somebody they like — is the version with none of the
arithmetic in it.

Knowing which three numbers to ask for is what makes you an owner rather than
a cheque.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Your Credit File",
            "description": (
                "Find out where you actually stand.\n\n"
                "Submit:\n"
                "1. What a credit score is in your own words, and five groups who read one "
                "besides lenders.\n"
                "2. The five factors that move it, in order of weight, with the one that is "
                "fastest to improve.\n"
                "3. Your own position: do you have a file? Check through the official free "
                "route and report what exists, with a screenshot of the service you used "
                "(amounts and personal details redacted).\n"
                "4. Anything on it you do not recognise, and how a dispute is raised for "
                "free.\n"
                "5. Your building plan: which route you are taking, with the guardian "
                "involvement it requires and the date you will start.\n"
                "6. Your correct-use rules, written as a checklist: what goes on the card, "
                "the autopay setup, the utilisation target.\n"
                "7. Hard and soft inquiries distinguished, and why comparing loan offers in "
                "a short window is not penalised the way people fear.\n"
                "8. Why no quick fix exists, and what a credit-repair scam looks like.\n"
                "9. The three numbers for business borrowing, applied to a real small "
                "business idea — yours or one you know — with conservative figures and every "
                "cost listed.\n"
                "10. What a personal guarantee is, and the rule you are setting about it.\n\n"
                "Graded on whether part 3 was actually checked through the official free "
                "route, and on whether part 9's costs are complete rather than optimistic."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Credit",
            "description": "Four questions on scores, building credit and business borrowing.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What is the largest factor in a credit score?",
                    "choices": [
                        "Payment history",
                        "Length of credit history",
                        "Mix of credit types",
                        "Number of recent applications",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the difference between a credit card that costs nothing and the most expensive borrowing in the course?",
                    "choices": [
                        "The interest rate on the card",
                        "A single habit — paying the statement balance in full each month",
                        "Whether the card is secured",
                        "The size of the credit limit",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does checking your own credit score do to it?",
                    "choices": [
                        "Lowers it slightly for a few months",
                        "Counts as a hard inquiry once a year",
                        "Nothing — it is a soft inquiry",
                        "Raises it by demonstrating engagement",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course call the clause that turns a failed business into personal ruin?",
                    "choices": [
                        "A variable interest rate",
                        "An early repayment charge",
                        "A revenue-based repayment schedule",
                        "A personal guarantee — never signed without independent legal advice",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Property, and Borrowing Deliberately",
        "description": (
            "Mortgage basics, the numbers behind a property decision, and the rules to set "
            "before any of it."
        ),
        "lessons": [
            {
                "title": "How a Mortgage Works",
                "description": "The vocabulary, and the parts that decide the cost.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The structure

A mortgage is a long-term loan secured on the property. Secured means the
lender can take the property if you do not pay, which is why the rate is lower
than unsecured borrowing — and why the consequence of failure is severe.

## The pieces

**Deposit / down payment.** What you put in. A larger one usually means a
better rate and a smaller loan.

**Principal.** The amount borrowed.

**Interest rate**, which may be **fixed** for a period or **adjustable**.
Fixed is predictable; adjustable can rise, and people who bought assuming it
would not are a recurring feature of financial history.

**Term.** Commonly fifteen or thirty years in the US. A longer term means a
lower payment and a much larger total cost.

**Amortisation.** Early payments are mostly interest and late payments are
mostly principal. In the first years you build equity far more slowly than
people assume.

**Escrow.** Property taxes and insurance collected alongside the payment.
This is why the monthly figure is higher than the loan calculator suggested.

**PMI** (private mortgage insurance), typically required with a small down
payment. It protects the lender, not you, and it is a real monthly cost.

**Closing costs.** Several percent of the price, payable at purchase, and
routinely forgotten by first-time buyers.

Other countries have different names, different terms and different norms for
deposits and fixing periods. The structure is the same.

## The numbers that decide it

**Total cost over the term.** A thirty-year mortgage can repay substantially
more than the amount borrowed. That is not a reason not to borrow; it is a
reason to know.

**The real monthly cost**: payment, taxes, insurance, maintenance (a rough
annual percentage of the property value), utilities, and any association fees.

**What happens if the rate rises**, on anything adjustable.

**What happens if your income stops.** The athlete question again, and it
matters more here than anywhere because the asset is where you live.

## Renting is not throwing money away

A widespread and unhelpful claim. Renting buys flexibility, no maintenance
liability and no exposure to a fall in value — and transaction costs mean
buying usually needs several years to break even.

For somebody who may move for a programme, a club or a transfer, flexibility
has real value. Buying because it is what adults do is a worse reason than it
sounds.

## Property prices can fall

They have, in most markets, repeatedly. Combined with a large loan, that
produces negative equity, which is the thing that stops you moving.

Anybody telling you property only goes up is telling you something that is not
true, and usually selling something.
""",
            },
            {
                "title": "Whether a Property Makes Sense",
                "description": "The arithmetic, for a home and for a rental.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## For a home

Five questions before anything else:

**1. How long will I stay?** Transaction costs — closing costs, fees, and the
costs of selling — usually need several years of ownership to absorb. Buying
somewhere you may leave in two years is often a straightforward loss.

**2. Can I afford it on a worse income?** Not your best year. A plausible bad
year.

**3. What is the real monthly cost?** Everything, not the mortgage payment.

**4. What is the deposit, and is my emergency buffer still intact
afterwards?** Spending the entire buffer on a deposit is how new owners end up
on credit cards by the first winter.

**5. Does buying lock me somewhere I might need to leave?** For an athlete
this is a serious question rather than a formality.

## For a rental property

Different, because it is a business, and the way athletes are sold these is
with the optimistic version.

The arithmetic:

- **Rental income**, realistically, less an allowance for **vacancy** — it
  will not be occupied every month.
- Minus the mortgage payment.
- Minus taxes and insurance.
- Minus **maintenance and repairs**, which are larger and lumpier than
  projected.
- Minus **management**, if you are not doing it, which you will not be during
  a season.
- Minus the cost of a bad tenant, eviction or a long void.

If what remains is thin, the investment depends entirely on the price rising,
which is speculation rather than income.

## The specific sales pitch to recognise

"Passive income from real estate" is a very common pitch to athletes, often
packaged with a course, a mentorship or a partner who will "handle
everything".

Red flags, all of them Module 3 of LS-202 in a different costume:

- Projections with no vacancy and no maintenance.
- Appreciation assumed as income.
- A partner who contributes expertise while you contribute the money and the
  personal guarantee.
- Pressure to move quickly on a specific deal.
- A market far from where you live, which you have not seen.

## If you do go ahead

- **Your own lawyer**, acting for you alone.
- **Your own inspection**, by somebody you chose.
- **Your own numbers**, not the seller's spreadsheet.
- **Stress-test them**: three months vacant, a major repair, a rate rise.
- **A guardian or trusted adult** across the whole process.
- **Never a personal guarantee** you could not survive.

## The honest default for a young athlete

Buffer, no expensive debt, long-term money invested simply (LS-202), and rent
while your life is mobile.

Property can be an excellent asset. It is rarely the right *first* one for
somebody who may relocate twice in five years, and the urgency to own
something is almost always coming from outside you.
""",
            },
            {
                "title": "Rules Before the Offers Arrive",
                "description": "Borrowing policy, decided in advance.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## Why now

Credit offers arrive the moment you have income, and they arrive constantly.
Card pre-approvals, car finance at the dealership, buy-now-pay-later at
checkout, a business opportunity from somebody you know.

LS-103's rule: pre-decide, because in the moment you will default to whatever
is easiest.

## The rules

**1. Nothing signed in the room.** A week on any borrowing. Same rule as
LS-202.

**2. Three numbers, always.** APR, total repayable, term. If a salesperson
will not give all three in writing, that is the answer.

**3. Statement balance in full, every month.** The credit card rule, and it is
absolute.

**4. No buy-now-pay-later.** It is borrowing, it is designed to increase
spending, and the convenience is the product.

**5. A cap on car cost** as a share of annual income, decided now, before you
are standing in a showroom with money for the first time.

**6. No borrowing to invest or speculate.** Ever.

**7. No personal guarantee without independent legal advice.**

**8. Buffer before deposit.** The emergency fund is not a down payment.

**9. Every payment on autopay** at least at the minimum, so a missed payment
is impossible.

**10. A guardian or professional on anything above a set amount**, named
now.

## The sentence, again

> *"Send me the APR, the total repayable and the term in writing, and I'll
> come back to you next week."*

It ends most bad borrowing conversations, politely, without requiring you to
have spotted anything.

## What this course was for

Debt is neither good nor bad. It is a tool with a price, and the whole skill
is knowing the price and what you are getting.

Three things to keep:

1. **Know the total, not the monthly.**
2. **Pay the card in full, every month** — it costs nothing and builds the
   thing you will need.
3. **Borrow only for what produces value, and only what survives your income
   stopping.**

## Where this goes

LS-204 and LS-205 are the network and the communication. LS-301, LS-302 and
LS-303 are the people — and in practice, most of what happens to an athlete's
money is decided there rather than here.

The arithmetic in this course is the easy part. Saying no to somebody you love
is the hard part, and that is what the Level 3 courses are for.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Property Arithmetic and a Borrowing Policy",
            "description": (
                "Run the numbers on a real property, then write the rules.\n\n"
                "Submit:\n"
                "1. The mortgage vocabulary defined in your own words: deposit, principal, "
                "fixed versus adjustable, term, amortisation, escrow, PMI, closing costs.\n"
                "2. A real property for sale near you, with the asking price and the listing "
                "linked.\n"
                "3. Its full monthly cost worked out: mortgage payment at a current advertised "
                "rate, taxes, insurance, maintenance allowance, utilities and any fees.\n"
                "4. The total repaid over fifteen and over thirty years, with the difference.\n"
                "5. The five home questions answered for your own likely situation in five "
                "years.\n"
                "6. A rental analysis for the same or another property: realistic rent, "
                "vacancy allowance, every cost, management, and what actually remains.\n"
                "7. A stress test of part 6: three months vacant, one major repair, and a "
                "rate rise.\n"
                "8. The 'passive income' pitch: find one aimed at athletes or young people, "
                "and mark it against the five red flags.\n"
                "9. Your ten borrowing rules, adapted, with your actual car cap as a number "
                "and the named person for rule ten.\n"
                "10. Your sentence, written as you would say it, and the three things you are "
                "keeping from this course.\n\n"
                "Graded on whether parts 2–7 use a real listing and real quoted rates, and on "
                "whether the stress test changes the conclusion."
            ),
            "total_marks": 225,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Property and Policy",
            "description": "Four questions on mortgages, rentals and pre-decided rules.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What does amortisation mean for the first years of a mortgage?",
                    "choices": [
                        "Payments are mostly interest, so equity builds far more slowly than people assume",
                        "The rate is fixed for an introductory period",
                        "Taxes and insurance are collected separately",
                        "Early repayment carries a penalty",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why is 'renting is throwing money away' unhelpful?",
                    "choices": [
                        "Rents rise faster than mortgage payments",
                        "Renting buys flexibility and no maintenance liability, and transaction costs mean buying usually needs several years to break even",
                        "Landlords cover utilities",
                        "Mortgage interest is not tax deductible",
                    ],
                    "answer": 1,
                },
                {
                    "text": "If a rental's remaining income is thin after every real cost, what does the investment depend on?",
                    "choices": [
                        "The quality of the management company",
                        "Keeping the property fully occupied",
                        "The price rising — which is speculation rather than income",
                        "Refinancing at a lower rate later",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say the arithmetic in it is?",
                    "choices": [
                        "The main barrier for most athletes",
                        "Something best delegated to an adviser",
                        "Only relevant once there is significant income",
                        "The easy part — saying no to somebody you love is the hard part",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
