"""CN-501: Venture Capital & High-Level Investing. Cool Nerds academy, Level 5
(Graduate School). Focus area: Investing. Core competencies: angel investing,
startup valuation, term sheets.

**This file opens the CN-5xx band and establishes its audience: a graduate.**
Roughly twenty-two to thirty, postgraduate or early-career professional, with
more capability and frequently more money than the CN-4xx reader. Address them
as somebody capable of handling nuance, and route to professionals rather than
to parents.

The catalog's financial disclaimer applies in its strictest form and this file
needs it most. It names **no fund, firm, platform, company, instrument or
figure**, quotes **no valuation, multiple, return or rate as current or
expected**, and labels every number a made-up illustration. Every specific —
what is regulated, who may invest, what exemptions exist, what tax treatment
applies — routes to the reader's own financial regulator and to qualified legal,
tax and financial advisers.

Four framings are load-bearing, all carried from ENT-403. **Most people should
not do this**: angel investing is a concentrated, illiquid, mostly loss-making
asset class, and in many countries it is legally restricted to defined investor
categories for that reason. **The base rate is loss** — most startups fail and
most individual angel investments return nothing — and any teaching that
foregrounds the outliers is survivorship. **Never invest money you cannot lose
entirely, and never borrow to do it.** And the **advance-fee shape** appears
here as it does everywhere: a real investor never charges you to receive their
money, and a real opportunity does not require a fee to access.

Boundary: CN-501 is an investor's view. ENT-403 is the founder raising, CN-403
is portfolio construction, CN-303 is the mechanism at seventeen. They must not
be merged.
"""

MODULES = [
    {
        "title": "What This Asset Class Actually Is",
        "description": "Before anything about how to do it.",
        "lessons": [
            {
                "title": "The Base Rate Is Loss",
                "description": "Stated first, on purpose.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## Start with the distribution

Early-stage investing does not produce average outcomes. It produces
a distribution in which **most individual investments return less
than was put in, frequently nothing**, and a very small number
return a large multiple.

That is not a pessimistic framing. It is the structure of the asset
class, and professional investors in it describe it the same way.

The consequence: **the expected value of a single early-stage
investment is dominated by outcomes that almost never happen.**
CN-408's point about where expected value breaks, in its purest
form.

## Why that matters before anything else

Because the material available about this subject is almost entirely
about the outliers.

The companies that succeeded. The investors who backed them. The
returns on those specific investments.

**The ones that did not are not written about**, which is CN-310's
survivorship operating at industrial scale. Reading that material
produces a systematically wrong impression of the base rate, and it
does so in people who know about survivorship.

## What follows

**Diversification is not optional here**, it is structural. A
strategy of a small number of investments in this class is
overwhelmingly likely to return nothing, because the distribution
requires many attempts to have a reasonable chance of containing an
outlier.

Professional early-stage investors hold many positions for precisely
this reason, and an individual making two or three is taking the
risk without the structure that makes the risk rational.

**Which means that for most individuals, the honest answer is not to
do this at all.**

## The other structural features

**Illiquidity.** There is frequently no way to sell. Money committed
is committed, for many years, with no mechanism to exit if your
circumstances change.

**Information asymmetry.** The founder knows far more than you.

**Dilution.** Later rounds reduce your proportion, and terms
negotiated later can reduce your position substantially.

**Long time to any outcome.** Frequently many years, and the
distribution of outcomes includes a long slow decline to nothing
rather than a clean failure.

**Total loss is the modal outcome**, not the tail.

## Regulation exists because of this

In many countries, early-stage investment is restricted to defined
categories — variously described as accredited, sophisticated,
professional, or high-net-worth investors — and firms may not
approach people outside those categories.

**Those restrictions exist because people lost money they could not
afford.**

What the categories are, what qualifies somebody, and what
protections apply differs completely by country and changes. **Find
out from your own regulator before anything**, and note that being
outside the category is information rather than an obstacle to be
worked around.""",
            },
            {
                "title": "The Rules That Do Not Move",
                "description": "If you do this at all.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The constraints

Not advice about how much. Constraints, in CN-408's sense — things
that remove options rather than trading against them.

**Only money you can lose entirely.** Not money with a purpose. Not
the emergency fund. Not anything you would need if your
circumstances changed. The realistic outcome is zero and the plan
must survive it.

**Never borrowed.** Not a loan, not a margin facility, not a
remortgage, not family money you would feel obliged to return.
CN-303's and CN-403's rule, and this is the asset class where it
does the most damage.

**Only after the rest of the structure exists.** CN-401's order:
emergency fund, expensive debt dealt with, matched and
tax-advantaged provision taken, diversified long-term holdings. This
comes after all of that or not at all.

**A small share of total assets**, however convinced you are. The
distribution does not care how good the opportunity looked.

**Never money belonging to somebody else**, and never persuading
friends or family into something you are in.

## Why the last one matters

It is the most common way this damages relationships.

Somebody convinced of an opportunity brings people they know into
it. The base rate operates, the money is lost, and the person who
introduced it carries that.

**If you would not be comfortable telling them in two years that it
returned nothing, do not introduce them.** And in many countries,
introducing people to investments may itself be a regulated
activity — check before doing it.

## Assume it is gone

A practical discipline used by people who do this professionally.

**Write the investment off mentally at the point of making it.**
Account for it as spent. Anything that comes back is a surprise.

That is not pessimism. It is the only framing that produces sensible
behaviour: no chasing, no averaging in to rescue a position, no
decisions driven by the need for it to work out.

## And the opportunity cost is real

The money could be in a diversified, low-cost, liquid holding
instead.

For most people, over most periods, that is the better decision —
and the honest comparison is against that rather than against doing
nothing.

## What this course is

Education about how the asset class works, so that you can
understand it, work in it, evaluate it, or decide not to participate
in it from an informed position.

**It is not advice, it recommends nothing, and nothing in it is a
suggestion that you should invest.** What anybody should do depends
on circumstances this file cannot know, which is what the regulated
profession is for.""",
            },
            {
                "title": "How The Structure Works",
                "description": "Funds, angels and where the money comes from.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Three positions

**Founders**, who hold equity and run the business. ENT-403's side.

**Angels**, individuals investing their own money, usually early and
usually small amounts relative to a fund.

**Funds**, which invest money raised from others — institutions,
endowments, wealthy individuals — under a mandate and for a fee.

Their incentives differ, and understanding that explains most
behaviour you will observe.

## How a fund is structured

Generically, because the detail differs by jurisdiction.

Investors commit capital. Managers invest it over a defined period,
charge an annual fee on committed or managed capital, and take a
share of profits above a threshold.

**Two consequences follow from that structure.**

The fee is charged whether or not the fund performs, which means
raising a larger fund is valuable to the manager independently of
returns.

The profit share rewards outliers, which means the rational strategy
is to pursue investments that could be very large rather than ones
that are likely to be modestly positive.

That is why early-stage funds behave as they do. It is not
irrationality; it is the incentive structure.

## Fund returns

Also worth knowing: fund performance is itself highly skewed. A
small number of firms account for a large share of the returns in
the asset class, and performance persistence is contested.

Which means "investing in venture" is not one thing with one
expected return, and access to the firms that perform well is
restricted.

## Angels

Individuals, investing smaller amounts, frequently earlier,
frequently in sectors they know.

The honest position: **the median angel outcome is poor**, and the
ones who do well typically invest in many companies over many
years, have genuine domain expertise, and have access to
opportunities that are not generally available.

Somebody making two investments, in sectors they do not know, from
opportunities that reached them unsolicited, is in a different
activity.

## Syndicates and platforms

Structures that pool individual investors into a single position,
frequently led by somebody taking a fee or a share.

Check: what the lead is paid, whether they invest their own money on
the same terms, what your rights are in later rounds, and what the
structure does to your position.

**And check the regulatory position**, which differs by country and
is the first question rather than the last.

## Where it sits in a portfolio

CN-403's framing.

This is a concentrated, illiquid, long-duration, high-dispersion
allocation. If it exists at all, it is a small satellite around a
diversified core.

**It is not a substitute for the core and it is not a strategy on its
own.**""",
            },
        ],
        "assignment": {
            "title": "The Base Rate, And The Constraints",
            "description": (
                "Part 1. Write out the distribution of outcomes in early-stage investing in "
                "your own words, and explain specifically why the available material produces "
                "a systematically wrong impression of it.\n\n"
                "Part 2. Find out, from your own country's financial regulator, what investor "
                "categories exist, what qualifies somebody for each, what firms may and may "
                "not do when approaching people outside them, and what protections apply. "
                "Record the source and the date.\n\n"
                "Part 3. Write out the five constraints in your own words. Then explain why "
                "'assume it is gone' produces better behaviour than hoping, and what the "
                "honest comparison is for the opportunity cost.\n\n"
                "Part 4. Explain how a fund's fee and profit-share structure shapes its "
                "behaviour, and what differs for an individual angel. Say what somebody making "
                "two investments in sectors they do not know is actually doing."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "What This Asset Class Is: Check Your Understanding",
            "description": "Four questions on the distribution, constraints and structure.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the modal outcome of an individual early-stage investment?",
                    "choices": [
                        "A modest positive return",
                        "Total loss",
                        "A small loss",
                        "Break-even after a long period",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the available material produce a wrong impression of this asset class?",
                    "choices": [
                        "It is written by people with positions to promote",
                        "It focuses on recent years",
                        "It is almost entirely about the outliers — the ones that failed are not written about",
                        "It does not account for fees",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does a fund's fee structure make raising a larger fund valuable independently of returns?",
                    "choices": [
                        "The annual fee is charged on committed or managed capital whether or not the fund performs",
                        "Larger funds attract better investments",
                        "Fees increase with fund size",
                        "Larger funds have lower costs per investment",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why should you write an early-stage investment off mentally at the point of making it?",
                    "choices": [
                        "It reduces the tax liability",
                        "It is required by most syndicate agreements",
                        "It helps negotiate better terms",
                        "It is the only framing that produces sensible behaviour — no chasing and no decisions driven by needing it to work",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Evaluating, And What Terms Mean",
        "description": "The mechanics, with no figures.",
        "lessons": [
            {
                "title": "What Is Actually Being Assessed",
                "description": "Beyond the pitch.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The honest starting point

At the earliest stage there is frequently no product, no revenue and
no evidence. What exists is a claim about the future made by people
who are selecting what they tell you.

**Which means early-stage assessment is mostly judgement, is mostly
wrong, and should be treated accordingly.**

Professional investors expect to be wrong most of the time. An
individual who believes they can assess this reliably has
misunderstood the activity.

## The questions

Not a model. Questions, and what matters is whether they can be
answered specifically.

**What problem does this solve, for whom, and how do you know they
have it?** The last clause is the one that separates a real finding
from an assumption.

**What evidence exists that somebody will pay?** Not interest. Not
sign-ups. Payment, or something close to it.

**Why these people?** What do they know or have that others do not.

**What has to be true for this to work?** Usually several things,
each uncertain. Multiply them and confidence drops substantially —
CN-408's point.

**What is the market, and how was that number arrived at?** Market
sizing in pitch material is frequently constructed backwards from a
desired conclusion.

**What does the competition actually look like?** "No competition"
almost always means the problem is currently solved by something
else, and that something else is the competition.

**How much money does this need before it is self-sustaining, and
what happens if it is not raised?**

**What would make me decide against this?** Asked of yourself. If
nothing would, you are not evaluating.

## The founder

Frequently described as the main factor, and the assessment is
harder than people claim.

What is reasonably assessable: whether they know their subject in
detail, whether they answer questions directly, whether they have
shipped anything before, whether they are honest about what is not
working, and how they describe people who are not present.

**That last one is unusually informative** and people routinely
ignore it.

## The specific warnings

- **Vagueness about numbers**, or numbers that change between
  conversations.
- **Being unwilling to let you speak to customers.**
- **Pressure to decide quickly.** CN-201's shape.
- **Other investors named to create urgency**, unconfirmed.
- **An inability to say what would falsify the thesis.**
- **Anything guaranteed.** The warning rather than the offer.
- **Defensiveness about due diligence**, which is the clearest
  signal there is.

## What professionals actually do

Speak to customers. Check claims independently. Take references on
the founders, including off-list. Read the documents properly. Use
lawyers.

**An individual who cannot do that is investing on the basis of a
conversation**, and should price that accordingly — which mostly
means not doing it.""",
            },
            {
                "title": "Valuation, Honestly",
                "description": "What the number is and is not.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## It is not a measurement

At the earliest stage, a valuation is **a negotiated number**, not
an assessment of worth.

There are no cash flows to discount and frequently no revenue. The
number is arrived at by reference to what comparable companies
raised at, what the founders want, what the investor will accept,
and how much is being raised.

Treating it as though it were derived from the business is the
commonest misunderstanding, and it affects behaviour: people
negotiate as though there were a correct answer being disputed.

## The mechanics

Pre-money and post-money. The valuation before the investment, and
after it.

**Your proportion is the investment divided by the post-money
figure.** That is the whole arithmetic, and it is worth doing
yourself rather than accepting a stated percentage.

A made-up illustration: invest 100 at a pre-money of 900. Post-money
is 1,000. Your share is 10%.

Change the pre-money to 1,900 and the same 100 buys 5%. **The
valuation determines what you get, which is why it is negotiated
rather than calculated.**

## Dilution

Your proportion falls when new shares are issued, which happens at
every subsequent round.

That is normal and not necessarily bad — a smaller share of a
larger company can be worth more. What matters is the terms on which
it happens and whether you have any rights.

**A share percentage at the time of investment tells you very little
about what you will hold at an exit**, and people routinely model as
though it does.

## Option pools

A detail that materially affects your position and is frequently
missed.

Shares reserved for future employees are commonly created out of the
pre-money valuation, which means existing holders — including the
new investor — bear the dilution.

Whether the pool is pre- or post-money is a negotiated point with a
real effect on what you own.

## Later-round terms

The point most individual investors underestimate.

Terms negotiated in subsequent rounds can substantially reduce the
value of an earlier position, particularly in outcomes that are not
large.

**An early position can be worth very little even in a company that
sells**, depending on what was agreed later and what rights the
earlier holders retained.

That is not unusual and it is not misconduct. It is the structure,
and it is why the documents matter more than the valuation.

## Comparables

Valuations are frequently justified by reference to other companies'
rounds.

Two cautions. The comparables are selected by whoever is using them.
And reported figures are frequently incomplete — the headline number
without the terms attached is close to meaningless, because the
terms determine what the number means.

**This course quotes no valuations, multiples or benchmarks**, for
the reason ENT-114 gives: those are reported inconsistently, change
constantly, and printing one would make this wrong.""",
            },
            {
                "title": "Terms, And Why They Matter More Than Price",
                "description": "What the documents actually do.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The principle

**A good price on bad terms is worse than a fair price on clean
terms.**

Investors who have done this for a long time say this consistently,
and individuals who are new to it negotiate the valuation and accept
the terms.

The terms determine what happens in every outcome other than a very
large success — which is most outcomes.

## What a term sheet is

A document setting out the principal terms of a proposed investment,
usually mostly non-binding, which then becomes the basis for the
binding documents.

**Non-binding does not mean unimportant.** What is agreed there is
very difficult to renegotiate afterwards.

## The categories that matter

Described generically, because the specifics differ by jurisdiction
and by market, and because this course gives no drafting advice.

**Economic terms.** What you get in an exit and in what order.
Preferences determine who is paid first and how much before others
receive anything, and their structure materially changes outcomes
in anything other than a large success.

**Anti-dilution provisions.** What happens to your position if a
later round is at a lower valuation. The variants differ
substantially in effect.

**Control and governance.** Board composition, what requires
consent, what you can block. Frequently more consequential than
economics for how the company is actually run.

**Information rights.** Whether you are entitled to accounts and
updates. Individual investors routinely end up with no visibility at
all, which they discover years later.

**Transfer provisions.** Whether you can sell, and whether you can
be required to sell.

**Pre-emption.** Whether you may participate in later rounds to
maintain your position.

**Founder terms.** Vesting and what happens if a founder leaves,
which protects everybody including the other founders.

## Convertible instruments

Early investments are frequently made through instruments that
convert to equity later rather than pricing the round immediately.

The terms on which they convert — discounts, caps, triggers — can
differ substantially in effect, and the outcome in edge cases is
frequently not what either party assumed.

**These are not simple documents because they are short.**

## Use a lawyer

Said plainly.

These documents are jurisdiction-specific, materially consequential,
and not amenable to interpretation by a careful amateur. The cost of
proper advice is small relative to the amount being committed and
negligible relative to the cost of getting a term wrong.

**Your own lawyer**, instructed by you, not the company's and not
the lead investor's.

If you are not prepared to pay for advice, that is a reasonable
signal that the amount involved is one you should not be
committing.

## And tax

The treatment of early-stage investments, losses, reliefs and gains
is highly specific and in many countries there are schemes with
conditions that must be met in advance.

**That goes to a qualified tax adviser before the investment**, not
after — CN-402's point about reliefs with prior conditions.""",
            },
        ],
        "assignment": {
            "title": "Terms Over Price",
            "description": (
                "Part 1. Write out the eight evaluation questions and explain why 'what would "
                "make me decide against this' is the one that determines whether you are "
                "actually evaluating. Then list the seven specific warnings.\n\n"
                "Part 2. Using made-up figures, work the arithmetic: a pre-money, an "
                "investment, the post-money and the resulting proportion. Then recalculate "
                "with an option pool created out of the pre-money and show who bears the "
                "dilution.\n\n"
                "Part 3. Write out, in your own words, each of the seven categories of term "
                "and what it determines. Explain why a good price on bad terms is worse than a "
                "fair price on clean terms.\n\n"
                "Part 4. Find out what tax treatment, reliefs or schemes apply to early-stage "
                "investment where you live, from your revenue authority, and note any "
                "conditions that must be met in advance. Record the source and the date."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Evaluating And Terms: Check Your Understanding",
            "description": "Four questions on assessment, valuation and documents.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What does 'no competition' in a pitch almost always mean?",
                    "choices": [
                        "The problem is currently solved by something else, and that is the competition",
                        "The market is too new to have competitors",
                        "The founders have not researched the market",
                        "There is a genuine first-mover advantage",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is an early-stage valuation?",
                    "choices": [
                        "A discounted assessment of future cash flows",
                        "A negotiated number, not a measurement of worth",
                        "A figure set by comparable transactions",
                        "An estimate of the company's assets and prospects",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why can an early position be worth very little even in a company that sells?",
                    "choices": [
                        "Early shares are usually a different class",
                        "Founders are paid first by default",
                        "Terms negotiated in later rounds can substantially reduce the value of an earlier position",
                        "Early investments are usually too small to matter",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What do experienced investors say consistently about price and terms?",
                    "choices": [
                        "Price matters most in early rounds",
                        "Terms are standard and rarely negotiable",
                        "Both matter equally",
                        "A good price on bad terms is worse than a fair price on clean terms",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "What Is Sold To People Like You",
        "description": "The module this course exists for.",
        "lessons": [
            {
                "title": "Why This Audience",
                "description": "Educated, earning, and newly eligible.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The target

Somebody in their twenties with a postgraduate qualification, rising
income, some savings, professional self-image, and an interest in
being the kind of person who invests in startups.

**That is a defined and heavily marketed-to group**, and the
marketing is sophisticated because the audience is.

## Why it works on capable people

**Identity.** The activity signals something: being early, being
inside, being the sort of person who understands this. That is a
more effective lever than greed and it is used deliberately.

**Access framing.** Presenting an opportunity as exclusive, as
something not generally available, as something you have been
selected for.

**Survivorship saturation.** The entire public narrative is
outliers, as Module 1 established.

**Complexity as cover.** Terminology that makes it difficult to ask
basic questions without appearing unsophisticated — which is
precisely the dynamic that causes capable people not to ask.

**Peer effects.** A colleague is doing it. Someone from your course
has a position. That is the most effective recruitment mechanism
there is.

## The shapes

Familiar from CN-201, CN-303 and ENT-403, and dressed differently
here.

**Fees to access deal flow.** A subscription, a membership, a
platform fee, a "network" charge. **A real opportunity does not
charge you to see it**, and ENT-403's rule holds: a real investor
never charges you to receive their money.

**Guaranteed or projected returns.** Nobody can guarantee this.
Projections in this asset class are constructions.

**Urgency.** Closing this week, allocation limited, confirm by
Friday. The hurry exists to prevent diligence — not to prevent you
asking a parent, as at thirteen, but to prevent you instructing a
lawyer.

**Named co-investors**, unconfirmed, used to signal validation.

**Opaque structures** where you cannot determine what you would
actually hold.

**Unregulated promotion** to people outside the permitted investor
categories, which in many countries is itself a breach.

**Secondary and pre-IPO offers** — purported access to shares in
well-known private companies, an area with known fraud and in which
what is actually being sold is frequently not what the buyer
believes.

## The two questions

**Where does their money come from?** CN-201's question. If it comes
from fees charged to investors rather than from returns, the
incentive is volume.

**Is this firm authorised, and for this activity?** Checked on your
regulator's own register, not through a link they sent. Clone firms
using genuine firms' details are a documented and common fraud.

## And the peer version

The hardest to resist, because the person is genuine.

Somebody you know and respect is in it and believes it. They may
also be wrong, may be in it through the same mechanism, and may have
a financial interest in your participation that neither of you has
discussed.

**That is not an accusation about them.** It is a reason to do the
same diligence you would do for a stranger.""",
            },
            {
                "title": "Diligence You Can Actually Do",
                "description": "And the point at which the answer is no.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The honest framing

The question is not "how do I assess this well". It is **"can I
assess this at all, and if not, what follows?"**

For most individuals, in most situations, the answer to the first is
no — and the thing that follows is not investing rather than
investing hopefully.

## What is checkable

**Regulatory status.** Is the firm, the platform, the lead or the
promoter authorised, and for this activity? On the regulator's own
register, reached independently.

**Corporate records.** In most countries, companies are registered
publicly: who the directors are, what has been filed, whether
accounts are overdue, and sometimes the share structure. **Free and
underused.**

**The people.** Have they done this before, and what happened?
References, including people not on the list you were given.

**The claims.** Customers, partners, revenue. Can any of it be
confirmed independently?

**The documents.** By a lawyer.

**The tax position.** By a qualified adviser, before committing.

## What is not checkable by you

Whether the product will work. Whether the market exists at the size
claimed. Whether the founders will execute. Whether a later round
will happen and on what terms.

**Those are the factors that determine the outcome**, which is why
this is an asset class in which being thorough still leaves you
mostly wrong.

## The questions that reveal

**"What would have to go wrong for this to fail?"** A founder who
cannot answer specifically is either inexperienced or managing you.

**"Who are three customers I can speak to?"** Refusal is
informative.

**"What did the last investors ask that you found difficult?"**

**"What has gone wrong so far?"** Everything has gone wrong so far.
A company presenting an unbroken record is presenting selectively.

**"May I have my lawyer review this?"** The single most diagnostic
question in this module. Anybody legitimate expects it.

## The sentence

The adult form, from CN-201 through to here:

> **"I'll have my adviser look at it and come back to you."**

A genuine opportunity survives that without difficulty. Everything
in Module 3's list does not, and the reaction is the answer.

## If you are not in the permitted category

In many countries you may not legally be offered these, and a firm
approaching you anyway is telling you something about the firm.

**That restriction is a protection** and the correct response is not
to find a route around it. People who self-certify into a category
they do not meet remove their own protections, and that is the
mechanism rather than a technicality.""",
            },
            {
                "title": "Participating Sensibly, Or Not At All",
                "description": "The last lesson.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The honest recommendation

**For most people in their twenties, the correct allocation to this
asset class is zero.**

Not because it is illegitimate. Because the structure — concentrated,
illiquid, loss-dominated, requiring many positions and access you do
not have — means that participating at small scale is taking the
risk without the mechanism that makes it rational.

The money is better placed in the diversified, low-cost, liquid core
CN-403 described, and the honest comparison is against that.

## If you do participate

**Within the constraints from Module 1**, all of them.

**Many small positions rather than few large ones.** The
distribution requires it.

**In an area you genuinely know**, where your judgement is worth
something and you can assess claims.

**With professional advice** on documents and tax.

**With the money written off** at the point of committing.

**With information rights** negotiated, so you are not finding out
about your own investment years later.

## The better versions of the same interest

If what you want is exposure to early-stage companies, there are
structures with more diversification and more oversight — pooled
vehicles, listed structures, employee participation in a company you
actually work for.

**What exists where you live, what is accessible and what the tax
treatment is differs completely by country.** That is a question for
an adviser and a regulator, and this course names nothing.

## Working in it rather than investing

Worth naming, because it is frequently the better route for somebody
at this stage.

Joining an early-stage company, working in a fund, or advising in a
sector gives you the domain knowledge, the access and the judgement
that make investing rational later — and it is paid rather than
paying.

**Most people who do well as angels did the work first.** CN-410's
ordering, in a different setting.

## If it has gone wrong

If you have invested and lost money, or are in something you cannot
exit, or were approached by somebody unauthorised:

**Take professional advice.** Report to your regulator if the
promotion was unauthorised — that is how firms are stopped.

**Never pay to recover.** The advance-fee shape is the most
reliable tell there is, and recovery approaches following a loss are
a second attempt on somebody already identified. ENT-403's and
CN-303's rule.

## What you have

You know the base rate is loss, that the material about this subject
is survivorship, and that diversification here is structural rather
than optional. You know the constraints that do not move.

You know what a fund's incentives are, what is actually assessable,
and that an early-stage valuation is negotiated rather than
measured. You know that terms matter more than price and why.

And you know what is sold to this audience, the two questions, the
diagnostic request, and that the investor-category restriction is a
protection rather than an obstacle.

## The last instruction

If you take one thing: **this asset class is loss-dominated, and
the honest answer for most people is no.**

Everything else in this course is for the small number for whom it
is not, and for the larger number who will encounter it being
sold.""",
            },
        ],
        "assignment": {
            "title": "The Diagnostic Question",
            "description": (
                "Part 1. Write out why this audience is targeted and the five mechanisms that "
                "work on capable people. Then list the seven shapes and explain what each is "
                "actually doing.\n\n"
                "Part 2. Using your country's regulator and corporate registry, practise the "
                "checkable diligence on any real registered company: regulatory status, "
                "filings, directors, overdue accounts. Record what you found and where, and "
                "note what you could not establish.\n\n"
                "Part 3. Write out the five revealing questions and explain why the request to "
                "have a lawyer review it is the most diagnostic. Then write the sentence you "
                "would use.\n\n"
                "Part 4. Write out the honest recommendation and the reasoning behind it. Then "
                "describe the better versions of the same interest, and why working in the "
                "sector is frequently the better route at this stage."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "What Is Sold To You: Check Your Understanding",
            "description": "Four questions on marketing, diligence and participation.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the most effective lever used on this audience?",
                    "choices": [
                        "Projected returns",
                        "Identity — being the sort of person who is early and inside",
                        "Tax advantages",
                        "Fear of missing an opportunity",
                    ],
                    "answer": 1,
                },
                {
                    "text": "An opportunity charges a fee to access deal flow. What is that?",
                    "choices": [
                        "A normal platform charge",
                        "Acceptable if it is refundable against an investment",
                        "A warning — a real opportunity does not charge you to see it",
                        "Reasonable for curated networks",
                    ],
                    "answer": 2,
                },
                {
                    "text": "You do not meet your country's investor category and a firm offers you an investment anyway. What does that tell you?",
                    "choices": [
                        "Something about the firm — and the restriction is a protection, not an obstacle to work around",
                        "That the rules are applied inconsistently",
                        "That you should self-certify to proceed",
                        "That the opportunity is open to a wider class",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the honest recommendation for most people in their twenties?",
                    "choices": [
                        "A small allocation, well diversified",
                        "Only through pooled vehicles",
                        "Only in sectors they know",
                        "Zero — the structure means participating at small scale takes the risk without the mechanism that makes it rational",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
