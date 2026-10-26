"""LS-202: Advanced Wealth & Investment Strategies.

Level 2: Wealth & Network Architecture. Written against the course's focus
(moving from making money to growing and protecting it) and its core
competencies: compound interest, vetting financial advisers, understanding
asset classes, and avoiding predatory investments.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).

This is financial **education, not financial advice**, and the course says so
repeatedly. It names no product, recommends no allocation, quotes no expected
return as a promise, and routes every real decision through a guardian and a
regulated professional. Account types and regulators named are United States
ones, matching the client's brief; the lesson says that equivalents differ by
country.
"""

MODULES = [
    {
        "title": "Compounding and Time",
        "description": (
            "The one mathematical fact that makes investing worth doing, and why being "
            "seventeen is the largest advantage in this course."
        ),
        "lessons": [
            {
                "title": "What Compounding Actually Is",
                "description": "Growth on growth, and why the curve looks wrong.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## What this course is and is not

**Education, not advice.** It explains the concepts and the vocabulary so you
can have a competent conversation with a regulated professional and recognise
a bad one.

It recommends nothing, names no product, and promises no return. Every actual
decision belongs with a guardian and a qualified, regulated adviser, and the
account types and regulators here are United States ones — equivalents exist
elsewhere under different names.

## Simple and compound

**Simple growth:** you earn a return on what you put in.

**Compound growth:** you earn a return on what you put in *and* on the returns
you already earned. Those returns then earn returns.

That difference sounds small over a year and is enormous over decades, and it
is the entire reason long-term investing works.

## The shape

Compound growth is slow, slow, slow, and then startling. For a long time it
looks like nothing is happening, and most of the total arrives at the end.

An illustration with a round, made-up rate purely to show the shape: money
growing at 8% a year roughly doubles every nine years. So one unit becomes
about two after nine years, four after eighteen, eight after twenty-seven,
sixteen after thirty-six.

The jump from eight to sixteen in the final nine years is larger than
everything that happened in the first twenty-seven combined.

**8% is not a prediction.** Real returns vary enormously, can be negative for
years at a time, and nobody knows what the next decade holds. The number is
there to show the curve, not to forecast one.

## Why seventeen is the advantage

Because the number of doublings is what matters, and doublings come from
years.

Money invested at eighteen has a different number of decades in front of it
than money invested at thirty-five, and that difference is worth more than any
difference in how cleverly either is invested.

This is the single most valuable thing in the course, and it is available to a
student with very small amounts.

## Small and early beats large and late

Somebody investing modest amounts from eighteen and stopping at thirty can
finish ahead of somebody starting at thirty and continuing for the rest of
their career, even though the second person put in far more.

Not always, and it depends on returns nobody can promise. But the mechanism is
real, and the intuition most people have — that the amount matters more than
the timing — is the wrong way round.

## Compounding runs backwards too

The same mathematics applies to debt. A credit-card balance at a high rate
compounds against you, and LS-203 covers it.

It also applies to fees. A 1% annual fee does not cost 1%; compounded over
decades it can consume a substantial share of the final total, which is why
Module 2 treats costs as seriously as it does.

## What it requires

- **Time**, which you have.
- **Not interrupting it.** Taking money out resets the clock on that money.
- **Consistency** more than size.
- **Tolerating the boring middle**, which is most of it.

Nothing about this is clever. That is precisely why it works and why so few
people do it.
""",
            },
            {
                "title": "Risk, Return and Time Horizon",
                "description": "The relationship that explains every sensible investment decision.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The rule

Higher expected return comes with higher risk. Always.

There is no asset with high return and no risk. Anybody offering one is either
mistaken or lying, and that single sentence prevents most of the losses in
Module 3.

## What risk actually means

Not "might lose everything". It means **the range of outcomes is wider** — up
and down — and that you cannot know in advance where in the range you will
land.

Two things with the same average outcome can be wildly different investments
if one of them regularly falls by a third along the way.

## Volatility and loss are different

**Volatility** is the value moving up and down. Uncomfortable, and not by
itself a loss.

**A permanent loss** is the thing not recovering, or you selling while it is
down and turning a paper fall into a real one.

Most harm to ordinary investors comes from the second: selling in a crash.
The market falling is normal and expected; the decision to sell at the bottom
is what converts it into damage.

## Time horizon decides everything

**Money needed soon** — this year, next year, an emergency buffer, money for
a deposit — does not belong anywhere it can fall. A plain savings account is
the correct home, even though it grows slowly. The point of that money is that
it is there.

**Money not needed for decades** can tolerate the ride, because there is time
to recover.

The most common serious error made by inexperienced investors is putting
short-horizon money into long-horizon assets, then being forced to sell at a
bad moment. That is how a market fall becomes a personal disaster.

## Diversification

Spreading across many holdings so that no single failure matters much.

The reason it is emphasised so heavily is that individual companies fail
regularly and unpredictably, including good ones. Owning a broad slice of many
things removes the risk that any particular one is the one you owned.

It does not remove market-wide risk. Nothing does.

## For an athlete specifically

Two risks are structural and worth naming:

**Your income is concentrated.** It depends on one body, one sport, and
possibly one contract. Putting your savings into the same industry — a sports
business, a teammate's venture, a brand in your sector — doubles down on a
risk you already carry.

**Your earning window may be short.** Money earned in a few years may need to
last far longer, which argues for caution and for professional help, not for
chasing returns to make up time.

## What to take from this

- No return without risk.
- Short-horizon money stays safe and boring.
- Long-horizon money can take volatility, if you do not sell.
- Spread it out.
- Do not concentrate your savings in the same thing your income depends on.

None of that tells you what to buy. That conversation belongs with a regulated
professional, which is Module 2.
""",
            },
            {
                "title": "Where Money Can Sit",
                "description": "The main asset classes, in plain language, with no recommendation.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Vocabulary, not instruction

This lesson is so that words in an adviser's mouth are not unfamiliar. It does
not tell you what to own.

## Cash and cash equivalents

A savings account, a money-market account, a short-term certificate. Very low
risk, protected up to the insured limit (FDIC at a bank, NCUA at a credit
union), modest return, and the value does not fall in nominal terms.

The right home for the emergency buffer and anything needed soon. Its real
risk is inflation — money that grows more slowly than prices loses purchasing
power quietly.

## Bonds

Lending money to a government or a company, which pays interest and returns
the principal at the end. Generally lower risk and lower expected return than
shares, and not risk-free — issuers can default and bond values move with
interest rates.

## Shares (stocks, equities)

Part-ownership of a company. Historically the highest long-run returns of the
mainstream classes, with the widest swings and no guarantee attached to either
of those statements.

**Individual shares** mean the fortunes of one company. **Funds** hold many at
once.

## Funds, index funds and ETFs

A **fund** pools money across many holdings. An **index fund** simply tracks a
broad market rather than trying to beat it, which keeps costs very low. An
**ETF** is a fund traded like a share.

The reason low-cost broad funds are so often recommended to beginners is
mathematical rather than ideological: diversification is built in, and the
fee drag that compounding punishes is small. The evidence that most active
managers do not beat a broad index over long periods, after fees, is strong
and consistent.

## Property

A house, land, or a fund that holds property. Illiquid, expensive to
transact, often bought with debt (LS-203), and emphatically not a guaranteed
rise.

## Retirement accounts

In the US, tax-advantaged containers — a 401(k) through an employer, an IRA or
a Roth IRA individually. They are **not** investments themselves; they are
wrappers holding investments, with tax treatment and rules attached.

Worth knowing now: a Roth IRA generally requires earned income, which a
teenager with a job or contractor income may have, and the decades ahead of
that money are the compounding advantage from Lesson 1. Contribution limits
and eligibility change annually — the source is the tax authority, and the
setup conversation is with a guardian.

## What is not an asset class

**Cryptocurrency**, collectibles, sports cards, sneakers, betting. Some have
produced spectacular returns and some have destroyed people; none have the
long record, the regulation or the cash flows the classes above have. Treat
any of them as speculation, which means money you can lose entirely, and never
as a plan.

**Betting and trading apps** aimed at young men are covered in Module 3. They
are not investing.

## The honest summary

Most people's sensible long-term answer is boring, low-cost, broad and left
alone for decades. It is not exciting, it cannot be posted about, and it has
been the right answer for most people for a very long time.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Compounding, Risk and Vocabulary",
            "description": (
                "Work the numbers yourself and learn the words.\n\n"
                "Submit:\n"
                "1. Compounding in your own words, with the distinction from simple growth.\n"
                "2. A compounding table you build yourself: a starting amount, a monthly "
                "contribution you could actually make, and three different assumed annual "
                "rates — showing the balance at 10, 20, 30 and 40 years. Show your working "
                "or your spreadsheet.\n"
                "3. The same table with the start delayed by ten years, and the difference at "
                "year forty.\n"
                "4. A fee comparison: the same projection with 0.1% and 1% annual costs, and "
                "what the difference is in money at year forty.\n"
                "5. One paragraph on what those three tables actually show, and what they do "
                "not — including why the rates are assumptions and not predictions.\n"
                "6. Risk and volatility distinguished, with an example of each.\n"
                "7. Your own money sorted by time horizon: what you need within two years, "
                "and what you would not touch for ten or more.\n"
                "8. The two structural risks for an athlete, applied to you specifically.\n"
                "9. The asset classes defined in one sentence each, in your own words, plus "
                "the two things the course says are not asset classes and why.\n"
                "10. Three questions this module raised that you cannot answer, listed for a "
                "professional.\n\n"
                "Graded on whether the tables were actually built rather than quoted, and on "
                "whether part 5 is appropriately careful about what a projection is."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Compounding and Risk",
            "description": "Four questions on compounding, risk and asset classes.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Why is being seventeen the largest advantage in this course?",
                    "choices": [
                        "The number of doublings is what matters, and doublings come from years",
                        "Young investors can take more risk",
                        "Fees are lower on smaller accounts",
                        "Tax treatment is better before eighteen",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What converts a market fall into real damage for most investors?",
                    "choices": [
                        "Holding through the volatility",
                        "Selling at the bottom — turning a paper fall into a permanent loss",
                        "Diversifying too widely",
                        "Investing in bonds rather than shares",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Where does money needed within a year or two belong?",
                    "choices": [
                        "In a broad, low-cost index fund",
                        "Split between shares and bonds",
                        "Somewhere it cannot fall — a plain savings account, even though it grows slowly",
                        "In a retirement account for the tax advantage",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What structural risk does an athlete take by investing in a sports business or a teammate's venture?",
                    "choices": [
                        "Those businesses have higher failure rates",
                        "It is usually prohibited by governing bodies",
                        "It triggers additional tax reporting",
                        "It concentrates savings in the same thing their income already depends on",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Vetting an Adviser",
        "description": (
            "Telling a regulated professional from a salesperson, which is the highest-stakes "
            "skill in this course."
        ),
        "lessons": [
            {
                "title": "Who Is Actually Qualified",
                "description": "Titles, regulation, and the one distinction that matters most.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Why this module exists

Athletes are a target. The pattern is well documented: a young person with
money, little financial experience, time pressure, a short earning window and
an entourage. The losses that follow are among the best-known stories in
sport.

Almost all of it is preventable at the point of choosing who to listen to.

## "Financial adviser" is not a protected term

In many places, anybody can use it. What is regulated is specific activity and
specific licences, so the question is never "are you an adviser" but **"what
are you registered to do, and with whom?"**

In the US, the main registers are:

- **SEC or state securities regulators**, for investment advisers. An adviser
  files a **Form ADV**, which is public and says what they do, how they are
  paid and whether they have a disciplinary history.
- **FINRA BrokerCheck**, which shows a broker's registration, employment
  history and any complaints or disciplinary actions.
- **State insurance departments**, for anybody selling insurance products.

Equivalents exist in other countries under different names. The principle is
the same: there is a public register, and checking it takes five minutes.

## The distinction that matters most

**Fiduciary** means legally obliged to act in your best interest.

**Suitability** — the weaker standard some salespeople operate under — means
the product merely has to be *suitable*, which permits recommending the
suitable product that pays them most.

So the first question is: **"Are you a fiduciary, at all times, in writing?"**

An unwillingness to say yes in writing is a complete answer.

## How they are paid

This determines almost everything about the advice.

- **Fee-only.** Paid by you — a flat fee, an hourly rate, or a percentage of
  assets. No commissions. The fewest conflicts.
- **Commission-based.** Paid by the product provider when you buy. The advice
  and the sale are the same event.
- **Fee-based.** Both, and the similarity of the name to "fee-only" is not an
  accident.

Ask directly: *"How exactly are you paid, including anything from third
parties?"* Then ask them to put it in writing.

## Credentials worth something

- **CFP** (Certified Financial Planner) — a real examination, experience
  requirement and ethics standard.
- **CPA** for tax, **attorney** for legal.
- Membership of a body with a complaints process.

Credentials are not a guarantee of good advice. Their absence, combined with
no registration, is close to a guarantee of the opposite.

## What is not a credential

A large following, having played professionally, being somebody's cousin, a
confident manner, an expensive office, a testimonial from an athlete you have
heard of, or the phrase "I work with a lot of athletes".

LS-103's four questions apply with full force: expertise in this specific
thing, what they gain, whether they carry consequence, and what they actually
know about you.
""",
            },
            {
                "title": "The Questions to Ask",
                "description": "A script, because this conversation is hard to improvise at eighteen.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Take somebody with you

Before the script: **never meet a financial professional alone as a young
person.** A guardian, a parent, a trusted adult. Preferably somebody who will
ask the awkward questions you may not want to.

That is not distrust of a specific person. It is the structural protection
from LS-103, and everybody legitimate expects it.

## The questions

Ask all of them. Write down the answers.

**1. Are you a fiduciary at all times, and will you confirm that in writing?**

**2. How exactly are you paid?** All of it — fees, commissions, revenue
sharing, anything from a product provider.

**3. What are your registrations and licences, and under what name are you
registered?** Then check it yourself, afterwards, on the public register.

**4. Have you ever been disciplined, sanctioned or had a complaint upheld?**
Then check that too, independently.

**5. What are the total annual costs of what you are recommending?** Advice
fee, fund costs, platform fees, transaction charges, insurance costs — all in,
as a percentage and as a number of dollars.

**6. What are the alternatives you considered and rejected, and why?**

**7. What happens if I want to leave? Are there exit penalties or a lock-up
period?**

**8. How does this work if my income stops next year?**

**9. Who else is involved?** Custodian, platform, any affiliated company.
**Does the money go to a third-party custodian, or to you?** It should never
go to the adviser personally.

**10. Can I have everything in writing and take a week to decide?**

## The answers that end the conversation

- Reluctance to confirm fiduciary status in writing.
- Vagueness about compensation.
- Pressure to decide today.
- "This is only available now."
- Guaranteed or specific promised returns.
- Discouraging you from involving a parent, a second opinion or an
  accountant.
- Asking for money to be transferred to them personally rather than a
  recognised custodian.
- Being unable to explain it in plain language. If they cannot, either they do
  not understand it or they would rather you did not.

**Any one of those is sufficient reason to leave.** You do not need to be
certain they are dishonest, and you do not owe them a decision.

## Two more structural protections

**Separate your advisers.** The person who manages your money, the person who
does your taxes and the person who handles your contracts should be different
people with no financial relationship. A single person doing all three with
nobody checking is the configuration behind most of the well-known cases.

**You read the statements.** Monthly, yourself, even when you do not fully
understand them. Ask about anything you do not recognise. An adviser who knows
nobody reads the statements is in a different position from one who knows
somebody does.

## Second opinions

For anything significant, pay a fee-only planner for a one-off review.

A few hundred dollars for an independent read on a large decision is the
cheapest insurance in this entire pathway.
""",
            },
            {
                "title": "Protecting What You Have",
                "description": "Structures, boring decisions and the things that actually preserve wealth.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Keeping is harder than earning

Earning requires talent and work, and plenty of athletes manage it. Keeping
requires decisions made against social pressure, often repeatedly, and far
fewer manage that.

The list below is unglamorous, and that is the point.

## The protections

**Separate accounts** for tax, spending, saving and investing. LS-201's
structure, scaled up.

**An emergency buffer** that is never invested.

**Insurance**, which nobody wants to discuss and which matters disproportionately
for an athlete. Health cover, and in some sports disability or
loss-of-earnings cover. Discuss it with a professional and read the exclusions
— policies covering athletes frequently exclude exactly the thing you want
covered.

**A will, and account beneficiaries.** Uncomfortable at eighteen; genuinely
important once there is money or dependants.

**An entity, where appropriate.** Business or partnership income may be better
run through a company structure — a real question for an accountant, not a
default.

**Nobody else has access** to your accounts. Not a parent beyond a required
joint account while you are a minor, not a partner, not an agent, not a
business manager. Somebody can be authorised to *view*; the ability to move
money should be yours.

**You sign your own things**, having read them. Never pre-sign blank forms,
and never give anybody a general power of attorney over your finances without
independent legal advice.

**Read the statements.** Said twice in this module deliberately.

## The ways athlete money actually disappears

Ranked roughly by how often they appear in the real cases:

1. **Lifestyle inflation.** LS-201's subject, and the biggest by volume.
2. **Supporting too many people.** LS-301 and LS-303.
3. **Bad business investments**, usually a friend's venture, in an industry
   nobody involved understood.
4. **Fraud by somebody trusted**, enabled by nobody reading statements and one
   person controlling everything.
5. **Property bought badly**, with too much debt and no rental analysis.
6. **Divorce and family disputes** with no agreements in place.
7. **Tax**, unpaid because nothing was set aside — LS-201's habit.
8. **Speculation**: crypto, betting, trading, and "ground-floor" opportunities.

Notice how few involve markets falling. The market is not the main risk to
your money. **The people around it are**, including you.

## The boring plan

A plan most professionals would recognise as sensible for most people:

- Buffer first.
- Expensive debt cleared (LS-203).
- Tax set aside, always.
- Long-term money in low-cost, broad, diversified holdings, left alone.
- Insurance appropriate to your situation.
- Reviewed once or twice a year, not weekly.
- Nothing speculative beyond money you could lose entirely without it
  mattering.

It takes about an hour a year to maintain. It is not interesting, it cannot be
posted about, and it is what the people who keep their money actually do.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Vet Somebody For Real",
            "description": (
                "Practise the check now, when nothing is at stake.\n\n"
                "Submit:\n"
                "1. Fiduciary versus suitability, explained in your own words, and why the "
                "distinction matters.\n"
                "2. The three ways advisers are paid, with the conflicts in each.\n"
                "3. A real register check: pick a financial professional — one advertising "
                "locally, or one who works with athletes — and look them up on the "
                "appropriate public register. Report what you found, where, and what the "
                "record says about their registration, compensation and disciplinary "
                "history.\n"
                "4. A second check on somebody who turns out not to be registered at all, if "
                "you can find one, and what they are claiming to do.\n"
                "5. The ten questions, written out as you would actually ask them, in your "
                "own voice.\n"
                "6. The eight answers that end the conversation, and the sentence you would "
                "use to leave.\n"
                "7. Your adult-in-the-room rule for financial meetings: who, and what they "
                "are there to ask.\n"
                "8. Your separation-of-advisers plan: who would do money, tax and contracts, "
                "and how you would ensure no financial relationship between them.\n"
                "9. The eight ways athlete money disappears, each rated for how likely it is "
                "to be your risk, with reasoning.\n"
                "10. The boring plan, written as the seven things you would actually do, in "
                "order.\n\n"
                "Graded on whether part 3 is a genuine register lookup with a named source, "
                "and on whether part 9 is honest about your own exposure."
            ),
            "total_marks": 225,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Vetting an Adviser",
            "description": "Four questions on regulation, questions and protection.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What does fiduciary mean, as opposed to suitability?",
                    "choices": [
                        "Legally obliged to act in your best interest, rather than merely recommending something suitable",
                        "Licensed by a state regulator rather than a federal one",
                        "Paid by fees rather than commission",
                        "Holding a recognised professional qualification",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Where should money go when you invest through an adviser?",
                    "choices": [
                        "Into an account the adviser controls on your behalf",
                        "To a recognised third-party custodian — never to the adviser personally",
                        "Into a joint account with the advisory firm",
                        "Wherever the product provider directs",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why should the people handling your money, your taxes and your contracts be different?",
                    "choices": [
                        "It reduces total fees",
                        "Regulators require the separation",
                        "A single person doing all three with nobody checking is the configuration behind most well-known cases",
                        "Each specialism has different reporting deadlines",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the list of ways athlete money disappears suggest about the main risk?",
                    "choices": [
                        "Market crashes are the dominant threat",
                        "Tax changes cause most losses",
                        "Poor investment selection is the usual cause",
                        "Few cases involve markets falling — the people around the money are the main risk",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Predatory Offers",
        "description": (
            "The specific things sold to young athletes, how they work, and the rules that "
            "defeat them."
        ),
        "lessons": [
            {
                "title": "How a Bad Offer Is Built",
                "description": "The common structure underneath almost all of them.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## They are not all crude

Some predatory offers are obvious frauds. Most are not — they are legal
products, sold hard, that are simply bad for the person buying them.

Recognising the structure matters more than recognising a specific scam,
because the specific scams change and the structure does not.

## The components

**1. An exceptional return**, stated or implied. "Guaranteed", "risk-free",
"we've never had a down year", or a figure that is far above what mainstream
investments produce. Lesson 1 said why that cannot exist.

**2. Urgency.** A closing window, a limited allocation, a price that rises
tomorrow. CEO-101, BM-103 and LS-103 all named urgency, because it is the
constant across every category of manipulation.

**3. Exclusivity and flattery.** "This isn't available to the public." "We only
work with serious athletes." It is designed to make scrutiny feel like
ingratitude.

**4. Complexity.** If you cannot explain it, you cannot evaluate it — and some
products are complex precisely so that you cannot.

**5. Social proof.** Another athlete is in. A name you recognise is involved.
Frequently the earlier participants were paid to be there, or are themselves
being used.

**6. Discouraging outside advice.** Subtly: "accountants never understand
these." Or directly: "don't tell your parents until it's done."

**7. A hidden cost structure.** Commissions, lock-ups, exit penalties, layered
fees. Module 2's question five exists for this.

## The categories aimed at athletes

- **A friend's or relative's business**, needing investment. The most common
  and the most emotionally difficult, because refusing is a relationship
  decision rather than a financial one.
- **Real estate deals** promising passive income, often requiring significant
  debt, frequently in a market nobody involved knows.
- **Restaurants, bars and nightclubs.** Famously popular with athletes and
  famously poor investments for passive owners.
- **"Ground-floor" ventures** — an app, a brand, a startup — where you are the
  money and somebody else is the control.
- **Crypto, trading and betting**, marketed heavily to young men through
  people who are paid to market them.
- **Insurance sold as an investment**, which can be the right product for
  specific situations and is sold far more widely than those situations
  occur.
- **Anybody offering to manage everything** so you can focus on your sport.
  Convenient, and it is the structure behind the worst cases in Module 2.

## The questions that defeat all of it

**"Why me?"** Why is someone offering this to a teenager rather than to
institutions whose job is finding good investments?

**"What do you get?"** Always.

**"What happens if it fails — who loses what?"** If the answer is you and only
you, that is the whole deal.

**"Can I take a week and have my accountant look at it?"** The single most
effective sentence in this course. Everything legitimate survives it, and
almost nothing predatory does.
""",
            },
            {
                "title": "Betting, Trading and the Apps",
                "description": "The category aimed hardest at young athletes, treated on its own.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Why it gets its own lesson

Sports betting and trading apps are advertised relentlessly to young men,
frequently through sport itself, often by people who are paid and do not say
so. For athletes there is also a hard rule attached.

## The rule first

**Betting on your own sport is prohibited** by essentially every governing
body, and in many places it is a criminal matter. That usually extends to:

- Betting on your own team or competition, in any amount.
- Betting through somebody else's account.
- Passing on inside information to anybody who bets.
- In many sports, betting on *any* event in your sport, anywhere.

The penalties range from suspension to a permanent ban, and "I only bet a
small amount" has ended careers. Know your own sport's rule — it is published
— and know that ignorance has never been accepted as a defence.

**If anybody asks you for information, or asks you to influence anything in a
match, tell your governing body's integrity line and an adult immediately.**
That is approach-by-a-corruptor, it is a serious criminal matter, and reporting
it promptly protects you.

## The mathematics

Betting products are priced so that the operator profits on average. That is
not an accusation; it is how the business exists.

Which means: across enough bets, the expected result is a loss. Skill does not
change the structure — the price moves to account for it, and accounts that
consistently win are routinely restricted.

Free bets, boosts and promotions are customer acquisition, and the terms
attached usually require more staking than the bonus is worth.

## Trading apps

Frequent trading of shares, options, leveraged products or crypto is not
investing. Consistent evidence shows that most frequent retail traders lose
money, and that the more they trade the worse they do, even in rising markets.

The apps are designed like games — notifications, streaks, confetti,
leaderboards — because engagement is the business model. That design is not
neutral; it is built to increase how often you act, and acting more often is
the thing that costs you.

## The addiction risk

This is the part that matters most.

Gambling disorder is real, it is disproportionately common in young men and in
athletes, and it does not look like a problem from inside. The warning signs:

- Betting more than intended, or more often.
- Chasing losses.
- Hiding it, or lying about amounts.
- Borrowing to bet.
- Thinking about it when you are not doing it.
- Betting more when stressed or after a bad performance.

**If any of those are true, tell somebody today** — a parent, a physician, a
school welfare lead, or a confidential gambling helpline. It is treatable, help
works better the earlier it comes, and it is not a character failing.

Many sports have confidential support specifically for players, outside the
club's own structures.

## The honest summary

Betting is entertainment with a known cost, prohibited in your own sport, and
carrying a genuine addiction risk at your age. Frequent trading is the same
thing wearing a suit.

Neither is an investment strategy, and neither belongs anywhere near the plan
in Module 2.
""",
            },
            {
                "title": "Rules You Decide Now",
                "description": "The policies to set before there is money and pressure.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## Why in advance

LS-103 made the argument: decisions made under pressure default to habit, so
the ones that matter are pre-decided when nothing is happening.

Nowhere is that truer than money, because the pressure is social and arrives
from people you like.

## The rules worth setting

**1. Nothing is signed in the room.** A week, minimum, on anything financial.
No exceptions, including for people you trust, including when it is
"embarrassing" to ask.

**2. Nothing without the adult.** A guardian for anything contractual while
you are a minor; a qualified professional for anything significant
afterwards.

**3. Nothing I cannot explain.** If you cannot explain it to a friend in two
minutes, you do not buy it.

**4. Nothing guaranteed.** Any promised return ends the conversation.

**5. Nothing from an unregistered person.** Check the register first, every
time.

**6. A fixed speculation limit**, if any — a small percentage of savings, which
you could lose entirely without it mattering. Money, not percentage of
ambition.

**7. No investing in a business run by a friend or relative** unless you would
give them the money outright. Because you probably will not get it back, and
the relationship costs more than the money.

**8. No lending above a set amount.** LS-201's rule, scaled.

**9. Nothing in my own sport's betting markets.** Zero, ever.

**10. I read the statements.** Monthly.

Ten rules. Write them down, give a copy to a guardian, and treat them as
decided rather than as something to reason about each time.

## The sentence

One sentence does most of the work, and it is worth practising out loud:

> *"That sounds interesting — send it to me in writing and I'll go through it
> with my parents and my accountant, and come back to you next week."*

Polite, final, and it filters almost everything. Note what it does not do: it
does not argue, it does not say no, and it does not require you to have spotted
anything.

## When you get it wrong

You will, at some point, lose money on something. Everybody does.

- **Stop the loss** rather than doubling down to recover it. Chasing is the
  mechanism that turns a loss into a disaster.
- **Tell somebody.** Shame is what keeps people in bad situations.
- **Report fraud** — to the regulator, the platform and, where it is criminal,
  the police. You will not be the only one.
- **Review the process**, not just the outcome. Which rule did you not apply?

## What this course was for

Not to make you an investor at seventeen. To make sure that if money arrives,
it does not leave the way it has left so many athletes before you.

The three things to keep:

1. **Time is the advantage** — start small, start early, leave it alone.
2. **Check the register, and ask how they are paid.**
3. **Nothing is signed in the room.**

LS-203 takes the same approach to debt, and LS-301 and LS-303 deal with the
people, which is where most of it is actually decided.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Your Financial Rules",
            "description": (
                "Decide them now, in writing, with a guardian.\n\n"
                "Submit:\n"
                "1. The seven components of a bad offer, each with a real example you have "
                "seen advertised or been shown — online counts.\n"
                "2. One real offer or advertisement aimed at young people, analysed against "
                "all seven components, with a screenshot.\n"
                "3. The four defeating questions, in your own words.\n"
                "4. Your sport's actual betting rule: find it, quote it, and cite the "
                "governing body document you found it in.\n"
                "5. Your sport's integrity or confidential reporting line, saved in your "
                "phone, with a screenshot.\n"
                "6. The gambling warning signs, with an honest self-assessment and the person "
                "you would tell.\n"
                "7. Why frequent trading is not investing, in your own words, including what "
                "the app design is doing.\n"
                "8. Your ten rules, written out, adapted to your situation, with any you "
                "would add.\n"
                "9. Your one sentence, practised, plus the person you practised it on and "
                "what they said.\n"
                "10. Evidence that a guardian has read and kept a copy of your ten rules.\n"
                "11. Your plan for when you get it wrong: the four steps, in your own words.\n\n"
                "Graded on whether part 4 cites the real governing-body document, and on "
                "whether part 10 actually happened."
            ),
            "total_marks": 225,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Predatory Offers",
            "description": "Four questions on bad offers, betting and pre-decided rules.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Why learn the structure of a bad offer rather than specific scams?",
                    "choices": [
                        "The specific scams change and the structure does not",
                        "Specific scams are rarely reported",
                        "Most bad offers are illegal and therefore hidden",
                        "Regulators publish the structures but not the cases",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What should you do if somebody asks you for inside information or to influence a match?",
                    "choices": [
                        "Refuse and avoid that person in future",
                        "Tell your governing body's integrity line and an adult immediately",
                        "Report it to the club at the end of the season",
                        "Discuss it with teammates to see if they were approached",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why are trading apps designed with notifications, streaks and confetti?",
                    "choices": [
                        "To help users track performance",
                        "To meet regulatory disclosure requirements",
                        "Engagement is the business model — the design increases how often you act, and acting more often costs you",
                        "To distinguish investing from gambling products",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the rule about investing in a friend's or relative's business?",
                    "choices": [
                        "Insist on a formal shareholding and a board seat",
                        "Limit it to a fixed percentage of savings",
                        "Require an independent valuation first",
                        "Do not, unless you would give them the money outright",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
