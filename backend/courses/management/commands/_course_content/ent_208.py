"""ENT-208: Customer Acquisition & Lifetime Value. Entrepreneur Pathway, Level 2.
Calculating acquisition cost and lifetime value, optimising spend, retention.

Founder audience, as ENT-101. Boundary: ENT-110 introduces unit economics as
part of choosing a model; this course is the arithmetic itself at working
depth — how to calculate the two numbers honestly, what they mean together,
and how to improve them. ENT-309 is the customer-success practice that
retention depends on; this course supplies the measurement that makes the case
for it. The course repeatedly insists on counting the founder's own time,
because excluding it is what makes unviable acquisition look affordable.
"""

MODULES = [
    {
        "title": "The Two Numbers",
        "description": "Calculating them honestly.",
        "lessons": [
            {
                "title": "Acquisition Cost",
                "description": "What it really costs to get one customer.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The definition

Everything spent to acquire customers in a period, divided by the
number acquired.

Simple, and almost always calculated wrongly because founders leave
things out.

## What goes in

- Advertising spend (ENT-203).
- Tools and software used for marketing or sales.
- Anything paid to a freelancer or agency.
- Content production costs (ENT-204).
- Events, travel, samples.
- Commission or referral fees (ENT-211).
- Free trials and their delivery cost.
- **Your own time**, at a realistic rate.

That last item is the one that is always omitted and frequently the
largest. A founder spending fifteen hours a week selling is the main
acquisition cost of most small businesses (ENT-109).

## The calculation

> *Last quarter: £600 advertising, £150 tools, 120 hours of my time at
> £40 = £4,800. Total £5,550. Eighteen new customers. £308 each.*

That number is usually a shock, and it is the real one.

## By channel

An aggregate figure hides everything. Calculate it separately for each
route (ENT-203):

- Referrals: frequently near zero.
- Direct outreach: your time only.
- Content: time, over a long horizon (ENT-204).
- Paid advertising: spend plus time.
- Events: cost plus time.

Then you can tell which channel to do more of, which is the point.

## Attribution

Honestly, you frequently cannot tell which channel produced a
customer: they read something, heard your name, searched, and enquired.

Practical approach (ENT-106):

- **Ask every enquiry how they heard of you.** Imperfect and the most
  useful data available.
- Look at correlation over quarters.
- Accept that some is unattributable, and say so rather than assigning
  it arbitrarily.

## The payback period

How long until a customer has repaid their acquisition cost
(ENT-110).

For a business funding growth from revenue, this matters more than the
lifetime ratio: a customer who takes eighteen months to pay back
consumes cash you do not have (ENT-304).

Short payback beats large eventual value when you are bootstrapping
(ENT-108).

## Blended versus paid

Two useful figures:

- **Blended:** all customers, all costs. The true business figure.
- **Paid only:** customers from paid channels, divided by paid spend.
  What tells you whether advertising works.

Founders report the blended figure — flattered by free referrals — and
use it to justify paid spend that is not working.
""",
            },
            {
                "title": "Lifetime Value",
                "description": "What a customer is actually worth.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The definition

The total **gross margin** a customer produces over their relationship
with you.

Margin, not revenue. A customer paying £1,000 a year with £700 of
delivery cost is worth £300 a year, not £1,000, and using revenue is
the second commonest error in this course (ENT-110).

## The calculation

**For a repeating business:**

> *Gross margin per period × number of periods they stay.*

> *£39/month, £6 delivery cost = £33 margin. Average 26 months = £858.*

**For a transactional business:**

> *Margin per purchase × purchases per year × years they keep buying.*

**For a one-off business:**

> *Margin on one sale, plus any referrals they generate.*

## Measuring how long they stay

The hard part for a new business: you do not know yet.

- Start with observed data, however little.
- Use the first cohort's retention as an early estimate (ENT-105).
- Be conservative. Early estimates are reliably optimistic.
- Recalculate quarterly as real data accumulates.

If you have no data, state the assumption explicitly rather than
embedding a guess in a confident figure.

## Churn

The proportion of customers leaving in a period, and the number that
determines lifetime value in a subscription business.

Small-sounding monthly churn compounds into short average lifetimes.
Work out what your rate implies over a year rather than reading the
monthly figure as reassuring (ENT-110).

Track it monthly, by cohort, and ask everybody who leaves why.

## Referrals

Frequently ignored and sometimes the largest component:

- A customer who refers two others has a value far above their own
  purchases.
- Referred customers typically cost nothing to acquire and stay longer
  (ENT-309).

Track referrals per customer. It changes which customers are worth
having.

## By segment

Calculate separately (ENT-106). Frequently:

- One segment stays twice as long.
- Another has twice the margin.
- A third costs twice as much to acquire.

An aggregate figure averages away the thing you most need to know,
which is **which customers to go after** (Module 2).

## Being honest

The temptation is to use optimistic assumptions:

- An average lifetime longer than observed.
- Revenue instead of margin.
- Excluding customers who left quickly.
- Counting referrals twice.

An inflated lifetime value justifies acquisition spending that will
quietly consume the business (ENT-108). Be conservative; the
pessimistic version is the one to plan with.
""",
            },
            {
                "title": "Reading Them Together",
                "description": "What the relationship tells you.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The core test

> **Lifetime value must comfortably exceed acquisition cost.**

Not marginally. Several times over, because:

- Lifetime value estimates are optimistic.
- The gap pays for everything that is not delivery — overheads, your
  income, reinvestment.
- Conditions worsen; costs rise and churn increases.

A commonly cited rule of thumb is a multiple of around three. Treat it
as orientation rather than a law, and work out what your own business
requires (ENT-110).

## Where businesses break

**Value below cost.** Every customer loses money, and growth makes it
worse. This is survivable only with a credible plan to change one of
the two numbers, and that plan usually does not exist.

**Marginally above.** No room for error, no money for anything other
than delivery, and one bad quarter is fatal.

**Payback too long.** Healthy ratio, no cash. The business cannot fund
its own growth (ENT-108).

**Hidden in the average.** One segment profitable, another losing,
aggregate acceptable. You grow the wrong one (Module 2).

## Reading the direction

More important than the level:

- Is acquisition cost rising? Usually it does as you exhaust the
  easiest customers.
- Is churn rising? Usually a signal about the product or the segment
  (ENT-113).
- Is margin falling? Usually delivery cost drifting or discounting
  (ENT-207).

Track all three monthly. The trend tells you more than the current
figure.

## What to do when the gap is too small

In rough order of effectiveness (ENT-110):

1. **Raise the price** (ENT-207).
2. **Improve retention**, which multiplies the whole lifetime value
   (ENT-309).
3. **Sell more to existing customers**, at near-zero acquisition cost.
4. **Reduce delivery cost**, usually by narrowing or standardising.
5. **Reduce acquisition cost**, usually by narrowing the segment
   (ENT-106).
6. **Change the model** (ENT-110).

Working harder is not on the list.

## Retention is the biggest lever

Worth stating separately: a modest improvement in how long customers
stay increases lifetime value proportionally, costs far less than
acquiring new customers, and improves referrals at the same time.

Most small businesses put almost all their effort into acquisition and
almost none into retention, which is backwards (ENT-309).

## Reviewing

Monthly: the three trends.
Quarterly: both numbers, by segment and by channel.
Annually: whether the model still works (ENT-110).
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Calculate Them",
            "description": (
                "Submit:\n"
                "1. Your acquisition cost for last quarter, with every component "
                "including your own time at a realistic rate.\n"
                "2. The same figure calculated separately per channel.\n"
                "3. Your blended figure and your paid-only figure, with the "
                "difference.\n"
                "4. 'How did you hear of us?' asked of every enquiry for a month, with "
                "the results and the unattributable share.\n"
                "5. Your lifetime value, using gross margin rather than revenue, with "
                "the retention assumption stated explicitly.\n"
                "6. Your churn rate, and what it implies over a year.\n"
                "7. Referrals per customer, tracked.\n"
                "8. Both numbers calculated separately for two segments.\n"
                "9. Your ratio and your payback period, with whether the payback is "
                "affordable from revenue.\n"
                "10. The three trends tracked over three months, with which of the six "
                "fixes you will apply first.\n\n"
                "Graded on part 1 including your time, part 5 using margin, and part 8 "
                "being genuinely split."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: The Two Numbers",
            "description": "Four questions on acquisition cost, lifetime value and the ratio.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which component of acquisition cost is always omitted and frequently the largest?",
                    "choices": [
                        "The founder's own time",
                        "Tools and software",
                        "Free trial delivery costs",
                        "Referral commissions",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the second commonest error in calculating lifetime value?",
                    "choices": [
                        "Using too short a time horizon",
                        "Using revenue instead of gross margin",
                        "Excluding referrals",
                        "Averaging across segments",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why do founders report the blended acquisition figure?",
                    "choices": [
                        "It is easier to calculate",
                        "It is the standard reporting convention",
                        "It is flattered by free referrals, and is used to justify paid spend that is not working",
                        "It is more stable month to month",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the biggest lever on lifetime value?",
                    "choices": [
                        "Raising the price",
                        "Reducing delivery cost",
                        "Reducing acquisition cost",
                        "Improving retention",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Acquiring Customers Efficiently",
        "description": "Spending less to get more.",
        "lessons": [
            {
                "title": "Choosing Channels",
                "description": "Where the customers actually come from.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The channels

Generically:

- **Referrals and word of mouth.** Cheapest, highest-converting,
  slowest to scale deliberately (ENT-309).
- **Direct outreach.** Your time; works immediately; does not
  compound.
- **Content and search.** Slow, compounds, cheap per customer
  eventually (ENT-204).
- **Social.** Variable; depends entirely on the market (ENT-203).
- **Email to your own list.** Cheap and high-converting once built
  (ENT-209).
- **Partnerships and affiliates.** Pay per result; depends on finding
  the right partner (ENT-211).
- **Events and communities.** Expensive in time, high quality
  (ENT-210).
- **Paid advertising.** Fast, measurable, expensive, stops when you
  stop.
- **Press.** Unpredictable, free, occasionally transformative
  (ENT-212).

## The honest ranking for a small business

For most small businesses with no capital, in order of what actually
works:

1. Referrals from existing customers.
2. Direct outreach to a specific segment.
3. Partnerships.
4. Content, over a long horizon.
5. Paid, only once the economics are proven.

Most founders invert this, starting with paid or social because it
feels like marketing (ENT-203).

## One or two channels

Doing five badly produces nothing. Pick one or two, do them properly
for six months, measure (ENT-203).

Add a third only when one is reliably producing.

## Judging a channel

For each:

- Cost per customer acquired, including time.
- Volume available — can it produce enough?
- Quality — do these customers stay (Module 1)?
- Time to results.
- Whether it compounds or stops when you stop.
- Whether you control it (ENT-110).

## The quality difference

Customers from different channels behave differently:

- Referred customers typically stay longest and complain least.
- Discount-driven customers leave first (ENT-207).
- Customers from content frequently arrive better informed and
  convert more easily.

Calculate lifetime value **by channel** as well as acquisition cost
(Module 1). A channel with higher cost and much better retention may be
the best one.

## Compounding versus linear

- **Linear:** outreach, paid advertising, events. Output stops when
  effort stops.
- **Compounding:** content, referrals, reputation, an email list. They
  accumulate (STU-301).

A new business needs linear channels for immediate revenue and should
be building compounding ones alongside. Relying only on linear means
starting from zero every month (ENT-109).

## Reviewing

Quarterly:

- Cost and quality per channel.
- Which is improving, which is getting more expensive.
- Whether to stop one and concentrate.
""",
            },
            {
                "title": "Referrals",
                "description": "The cheapest channel, built deliberately.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Why it is the best channel

- Near-zero acquisition cost.
- Highest conversion, because trust is transferred.
- Referred customers stay longer (Module 1).
- It compounds.

For most small businesses it is, or should be, the largest source of
customers (ENT-309).

## Why it is under-used

Founders wait for it rather than building it. Referrals happen
occasionally by accident and systematically only when asked.

## The prerequisite

Something worth referring:

- The work is good.
- You are easy to deal with (ENT-309).
- Problems are handled well.
- You do what you said (STU-307).

No referral programme compensates for a mediocre experience.

## Asking

The step almost nobody takes:

- **At the point of satisfaction**, not months later.
- **Specifically:** not "if you know anybody", but *"do you know
  another clinic in a similar position?"*
- **Make it easy:** offer to write the introduction message for them.
- **Routinely**, as part of your process, not when desperate.

> *"Glad that worked. Two things — could I quote a line from you about
> it, and is there anybody else you think I should talk to?"*

Two sentences producing testimonial and referral at once (ENT-202).

## Incentives

Handle carefully:

- A small thank-you for a successful referral is normal and welcome.
- Large commissions change the relationship and can produce low-quality
  referrals.
- **Disclosure matters.** In many jurisdictions an incentivised
  recommendation must be disclosed, and in regulated sectors referral
  fees may be restricted or prohibited. **Check what applies to you**
  (ENT-211, ENT-303).
- Consider giving the benefit to the referred customer instead, which
  avoids most of the problem.

## Other referral sources

Not only customers:

- **Adjacent businesses** serving the same customers differently — the
  most under-used source (ENT-211).
- **Suppliers.**
- **Former colleagues and employers.**
- **Competitors**, for work they cannot take (ENT-111).
- **Professionals** — accountants, lawyers — who advise your
  customers.

Build two or three of these relationships deliberately. Each can
produce customers for years at no cost.

## Making it systematic

- Ask every satisfied customer, as part of your process.
- Track where referrals come from.
- Thank referrers, always and promptly.
- Tell them the outcome.
- Keep in touch with past customers twice a year (STU-301).

## Measuring

- Referrals per customer.
- Proportion of new customers from referral.
- Retention of referred customers against others.

A business where the referral share is rising is becoming structurally
healthier, regardless of what the top-line growth says.
""",
            },
            {
                "title": "Paid Acquisition",
                "description": "When and how to spend.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## When it makes sense

Only when:

- You know your lifetime value with real data (Module 1).
- You know what you can afford to pay for a customer.
- The organic version already works — paid amplifies something
  functioning; it does not create demand (ENT-102).
- You can measure what happened.
- You can afford to lose the test budget (ENT-108).

Spending before those are true is how founders lose money and conclude
advertising does not work.

## The affordable cost

> **What you can pay to acquire a customer = lifetime value ÷ your
> required multiple, adjusted for how long payback takes.**

Work it out before any spend. Then spend against it, and stop if the
actual cost exceeds it (ENT-110).

## Starting

- **Small.** An amount you would not mind losing entirely.
- **One channel**, one audience, one message.
- **A specific destination** that converts (ENT-107).
- **Measurement in place** before the first pound.
- **A written expectation:** what result would mean it works
  (ENT-105).

## The common mistakes

- Boosting posts with no offer and no destination (ENT-203).
- No tracking, so no learning.
- Targeting too broadly.
- Judging on clicks rather than customers.
- Scaling before the economics are proven.
- Continuing because it is running.
- Attributing every sale in the period to the advertising.

## Scaling

Only when the economics hold at the current level:

- Increase gradually.
- Expect cost per customer to **rise** as you expand beyond the best
  audience. It almost always does.
- Recalculate at each level.
- Have a ceiling cost above which you stop.

A channel profitable at £500 a month is frequently unprofitable at
£5,000, and discovering that by spending £5,000 is expensive.

## Rules and obligations

- Advertising claims must be truthful and substantiated; sectors differ
  and some are heavily regulated. **Check what applies where you
  advertise** (ENT-212).
- Paid partnerships and endorsements must be disclosed in most
  jurisdictions (ENT-211).
- Data protection rules apply to targeting, tracking and anything you
  collect. Take advice if you are processing personal data
  (ENT-303).

## The honest position

For most small businesses, paid acquisition is:

- Worth a small, measured experiment.
- Rarely the main channel at this scale.
- Reliably outperformed per pound by referrals, outreach and email
  (Module 2, ENT-209).

Treat it as one tested option, not as what marketing means.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Acquire Efficiently",
            "description": (
                "Submit:\n"
                "1. Every channel assessed against the six judging criteria.\n"
                "2. Your one or two chosen channels, and what you have stopped.\n"
                "3. Lifetime value calculated by channel, not just acquisition cost.\n"
                "4. Your linear and compounding channels, with what you are building "
                "alongside immediate revenue.\n"
                "5. Your referral ask, used with ten satisfied customers, with the "
                "results.\n"
                "6. Three non-customer referral sources developed, by name.\n"
                "7. Your referral share of new customers, and whether it is rising.\n"
                "8. Any incentive you offer, with the disclosure and sector rules that "
                "apply, from an official source.\n"
                "9. Your affordable acquisition cost, calculated from real lifetime "
                "value.\n"
                "10. If you have spent on paid: the written expectation set beforehand, "
                "the actual cost per customer, and whether you stopped or scaled.\n\n"
                "Graded on part 5 having happened, part 8 citing the rules, and part 9 "
                "using real data."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Acquiring Efficiently",
            "description": "Four questions on channels, referrals and paid spend.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What should a small business with no capital try first?",
                    "choices": [
                        "Referrals from existing customers, then direct outreach",
                        "Paid advertising, because it is measurable",
                        "Social media, because it is free",
                        "Content, because it compounds",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why do referrals not happen systematically?",
                    "choices": [
                        "Customers forget who referred them",
                        "Founders wait for them rather than asking at the point of satisfaction",
                        "Most customers have no relevant contacts",
                        "Incentives are needed to trigger them",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What should you expect as you scale paid acquisition?",
                    "choices": [
                        "Cost per customer falls with volume",
                        "Conversion improves as the audience warms",
                        "Cost per customer rises as you expand beyond the best audience",
                        "Attribution becomes more accurate",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does paid advertising do?",
                    "choices": [
                        "Creates demand for a new product",
                        "Replaces the need for organic channels",
                        "Reduces acquisition cost over time",
                        "Amplifies something already functioning",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Retention",
        "description": "The side of the equation that gets ignored.",
        "lessons": [
            {
                "title": "Why Retention Beats Acquisition",
                "description": "The arithmetic, and the neglect.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The imbalance

Most small businesses put the great majority of their marketing effort
into acquiring customers and almost none into keeping them.

The arithmetic says that is backwards.

## Why it is backwards

- **Keeping a customer costs a fraction of acquiring one** (Module 1).
- Retention improvements multiply lifetime value directly.
- Existing customers buy more over time.
- They refer (Module 2).
- They are easier to sell to; no trust has to be built (ENT-205).

A business losing customers as fast as it gains them is running to
stand still, however good the acquisition numbers look.

## The leaky bucket

With high churn, acquisition only fills a bucket that is emptying:

> *Gaining twenty a month and losing eighteen is net two, for the cost
> of twenty.*

Fixing the leak is almost always cheaper than increasing the flow, and
founders reliably choose the flow because it is more visible
(ENT-110).

## Measuring retention

- **Churn rate** per period.
- **Average customer lifetime.**
- **Cohort retention** — of customers who joined in a given month, how
  many remain at three, six and twelve months. Far more informative
  than an aggregate (ENT-105).
- **Repeat purchase rate**, for transactional businesses.
- **Revenue retention**, which can exceed 100% if existing customers
  spend more over time.

## Why customers leave

Research consistently finds the largest category is not price or
product but **feeling neglected or badly treated**.

For a small business that is good news: it is the cheapest thing to
fix (ENT-309).

Other common reasons:

- The problem went away.
- They never got started properly.
- Something went wrong and was handled badly.
- They forgot why they were paying.
- Their circumstances changed.

## Ask everybody who leaves

The most valuable and least collected data:

- A short, genuine question: *"What made you decide to stop?"*
- No attempt to win them back in that message.
- Log it and count the reasons.

Ten honest answers tell you more than any amount of analysis
(ENT-106).

## The early period

Most churn happens early. A customer who gets no value in the first
weeks leaves, and no later effort recovers them.

Which makes onboarding — the first days — the highest-leverage
retention work available (ENT-309).
""",
            },
            {
                "title": "Improving It",
                "description": "What actually keeps customers.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Onboarding

The first days decide the relationship (ENT-309):

- Get them to the first useful outcome as fast as possible.
- Remove every step that is not required.
- Check in personally in the first week.
- Make sure they know how to get help.

A customer who succeeds once rarely leaves soon after. One who never
gets started always does.

## Regular contact

Most neglect is passive rather than deliberate:

- A scheduled check-in — monthly or quarterly, depending on the
  relationship.
- Something useful, not a sales message (ENT-204).
- Noticing when usage or ordering drops, and asking.

The simple act of being in contact prevents a large share of quiet
departures.

## Delivering consistently

- Do what you said, when you said (STU-307).
- Warn early when you cannot (ENT-112).
- Handle problems quickly and generously (ENT-309).
- Do not let quality fall while chasing new customers — the commonest
  cause of churn in a growing small business (ENT-402).

## Making it worth staying

- Keep improving what they get.
- Tell them what has improved; people do not notice unprompted.
- Give longstanding customers something — priority, a better rate, a
  genuine thank you.
- Ask what would make it better, and act on it visibly (ENT-309).

## Reducing accidental churn

A surprising proportion of losses are mechanical:

- A failed payment nobody followed up.
- A renewal nobody mentioned.
- A contact who left the organisation and nobody replaced
  (ENT-206).
- An email going to a dead address.

Each is fixable with a process and costs nothing (ENT-104).

## Selling more to existing customers

The cheapest revenue available, at effectively zero acquisition cost
(ENT-110):

- A higher tier (ENT-207).
- An adjacent service.
- More volume.
- Something they currently buy elsewhere.

Ask what else they need. Most small businesses never do.

## When a customer should leave

Not every customer is worth keeping (ENT-112):

- Consistently unprofitable (ENT-110).
- Consuming disproportionate support.
- Treating you or anybody working with you badly.
- Wrong for what you do, so the relationship frustrates both sides.

Ending it properly — with notice and a handover — is better than a
long, resentful relationship (STU-307).

## Measuring improvement

- Churn by cohort, monthly.
- Reasons for leaving, counted.
- Revenue from existing customers as a share of the total.
- Referrals per customer (Module 2).
""",
            },
            {
                "title": "Running It as a System",
                "description": "Tracking, deciding and improving.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The dashboard

Six numbers, reviewed monthly (ENT-304):

1. New customers.
2. Churned customers.
3. Acquisition cost, blended and paid.
4. Lifetime value.
5. Payback period.
6. Revenue from existing customers.

That is sufficient for a small business. More produces a reporting
habit rather than a decision.

## The monthly review

Thirty minutes:

- What moved, and why?
- Is acquisition cost rising?
- Is churn rising?
- Which channel produced customers this month?
- What is the one thing to change?

One change at a time, measured (ENT-105).

## The decisions these numbers drive

- **Which channel to invest in** — the one with the best cost and
  retention combined (Module 2).
- **Whether to raise prices** (ENT-207).
- **Whether to spend on retention or acquisition.**
- **Which segment to pursue** (ENT-106).
- **Whether the model works at all** (ENT-110).

Without the numbers each of these is guesswork, which is how most
small businesses make them.

## Keeping it honest

- Count your own time.
- Use margin, not revenue.
- Be conservative on lifetime estimates.
- Do not exclude inconvenient customers.
- Split by segment and channel.
- State assumptions explicitly.

An optimistic model justifies spending that quietly consumes the
business, and the error only becomes visible when the cash does
(ENT-108).

## When the numbers say stop

Sometimes the honest conclusion is that acquisition cannot work at a
viable cost in this segment.

Responses (ENT-113):

- Change segment.
- Change price (ENT-207).
- Change channel.
- Change the model (ENT-110).
- Stop (ENT-103).

Continuing to acquire customers at a loss, hoping volume helps, is the
one response that never works.

## Building the habit

- Record acquisition cost and churn from the first customer.
- Ask every enquiry how they heard of you (Module 1).
- Ask every leaver why.
- Review monthly, decide quarterly.

Businesses that do this from the start make better decisions than
those that start measuring in year three, by which time the habits are
set and the history is lost.

## The summary

1. Acquisition cost must include your own time; it usually dominates.
2. Lifetime value uses gross margin, never revenue.
3. Calculate both by channel and by segment — aggregates hide the
   answer.
4. Payback period matters more than the ratio when cash is tight.
5. Retention is the biggest lever and the most neglected.
6. The largest reason customers leave is feeling neglected.
7. Ask everybody who leaves why, and count the reasons.
8. Referrals are the cheapest channel and happen only when asked.
9. Paid amplifies something working; it does not create demand.
10. Six numbers, monthly; one change at a time.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Keep Them",
            "description": (
                "Submit:\n"
                "1. Your leaky-bucket arithmetic: gained, lost and net, for three "
                "months.\n"
                "2. Cohort retention at three, six and twelve months.\n"
                "3. Every leaver asked why, with the reasons counted.\n"
                "4. Your onboarding process, and how quickly a customer reaches a first "
                "useful outcome.\n"
                "5. Your scheduled check-in rhythm, with four weeks of whether it "
                "happened.\n"
                "6. Every mechanical cause of churn you found, with the process that "
                "fixes it.\n"
                "7. What you sold to existing customers this quarter, and its "
                "acquisition cost.\n"
                "8. One customer you ended the relationship with, or should, and why.\n"
                "9. Your six-number dashboard, filled in for three months.\n"
                "10. Your monthly review, completed once, with the one thing you "
                "changed and the result.\n\n"
                "Graded on part 3 having happened, part 9 being real numbers, and part "
                "10 being one change rather than six."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Retention",
            "description": "Four questions on retention, improvement and measurement.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the largest reason customers leave?",
                    "choices": [
                        "Feeling neglected or badly treated",
                        "Price",
                        "A competitor's product",
                        "Product shortcomings",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why do founders choose acquisition over fixing churn?",
                    "choices": [
                        "Acquisition is cheaper per customer",
                        "It is more visible, even though fixing the leak is almost always cheaper",
                        "Churn cannot be measured reliably",
                        "Retention takes longer to show results",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Where is the highest-leverage retention work?",
                    "choices": [
                        "The annual renewal conversation",
                        "Regular quarterly check-ins",
                        "Onboarding — the first days, because most churn happens early",
                        "Handling complaints well",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What response to unviable acquisition never works?",
                    "choices": [
                        "Changing segment",
                        "Raising the price",
                        "Changing the model",
                        "Continuing to acquire at a loss, hoping volume helps",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
