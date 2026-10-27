"""ENT-312: E-commerce Fundamentals. Entrepreneur Pathway, Level 3.
Store setup, payment gateways, conversion rate optimisation.

Founder audience, as ENT-101. Boundary: ENT-306 and ENT-310 cover the goods
and the stock behind the store; ENT-203 and ENT-204 cover getting people to
it; ENT-208 covers the acquisition arithmetic. This course is the store itself
— the platform decision, taking money, and turning visitors into customers.
Deliberately vendor-neutral, consistent with the catalog. The consumer law and
payment compliance material in Module 2 is load-bearing: online selling is one
of the most regulated small-business activities, obligations are set by where
the customer is, and founders routinely launch without knowing any of it.
"""

MODULES = [
    {
        "title": "Setting Up",
        "description": "The platform, and what has to be in place.",
        "lessons": [
            {
                "title": "Choosing a Platform",
                "description": "The decision, made sensibly.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The options

Generically, because products change:

**A hosted store platform.** Monthly fee, works immediately, handles
payments and hosting. The default for most small businesses.

**A marketplace.** You sell inside somebody else's site. Instant
access to buyers, fees per sale, little control, and they own the
customer relationship (ENT-110).

**A website with a shop added.** More control over the wider site,
more setup, more maintenance.

**Self-hosted or custom.** Full control, real technical requirement,
rarely justified for a first store (ENT-315).

**Social selling.** Selling through a social platform's own
facilities. Low friction, limited control, fully dependent on that
platform (ENT-203).

## The trade-off

Control against convenience:

- Hosted platforms get you selling quickly and take a fee.
- Marketplaces bring traffic and take the relationship.
- Custom gives control and takes time and money.

For a first store with limited capital, **hosted is almost always
right** (ENT-108). Build custom only when a hosted platform
genuinely cannot do something your business needs.

## Marketplace risk

Worth stating plainly (ENT-110):

- They can change fees, rules or rankings at any time.
- They can suspend your account, sometimes in error, with limited
  appeal.
- They own the customer data in most cases.
- You compete directly with other sellers of the same thing, usually
  on price (ENT-111).

Using one for reach while building your own store and your own list is
a reasonable strategy. Depending entirely on one is a structural risk
(ENT-209).

## What to compare

- **Total cost** — subscription, transaction fees, payment fees, apps
  and add-ons. The add-ons are where costs accumulate.
- **Payment options** available in your market.
- **Whether it handles your tax requirements** (ENT-305).
- **Whether you can export your data** — non-negotiable
  (ENT-307).
- **Whether it scales** to ten times your volume.
- **Whether it integrates** with your accounting and stock systems
  (ENT-304, ENT-310).

## Do not over-build

The commonest early mistake: months spent building a store before
knowing whether anybody will buy (ENT-105).

- A simple store with a few products can be live in days.
- Sell something first.
- Improve it with what you learn.

A store is a tool for selling, not a project (ENT-104).

## The domain and the name

- Your own domain, owned by you, not by an agency
  (ENT-302).
- Checked against trademark registers before committing
  (ENT-201).
- Registered to the business, with renewal reminders set.

Losing a domain to a lapsed renewal or an agency dispute is a real and
avoidable disaster.
""",
            },
            {
                "title": "The Store Itself",
                "description": "What has to be there.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The job of a store

A visitor should be able to work out, within seconds:

- What you sell.
- Whether it is for them (ENT-107).
- What it costs.
- Whether you are trustworthy.
- How to buy it.

Most small-business stores fail at one of those, usually the first or
the fourth.

## The pages you need

- **Home**, saying plainly what you sell and for whom.
- **Product pages**, one per item.
- **About**, with a real person and real information.
- **Contact**, with genuine details.
- **Delivery and returns**, clear and findable
  (ENT-306).
- **Terms**, privacy and anything legally required (Module 2).

## Product pages

Where the sale happens:

- **Good photographs**, several, from different angles, at scale.
- **A clear, specific description** — what it is, what it does, who
  it suits (ENT-107).
- **Specifications** — size, materials, weight, compatibility.
- **Price**, with the full cost clear (Module 2).
- **Delivery time**, stated honestly.
- **Stock availability** (ENT-310).
- **Reviews**, where you have them (ENT-309).
- **Answers to the obvious questions** people ask.

That last point is the cheapest improvement available: collect the
questions customers actually ask and answer them on the page
(ENT-106).

## Photographs

For a physical product, the single largest factor:

- Multiple angles.
- Something for scale.
- In use, where that helps.
- Consistent style across products (ENT-201).
- Good light; a window and a plain background is enough to start.

Poor photographs cost more sales than almost anything else on the
page.

## Trust signals

You are an unknown business asking for payment (ENT-206):

- Real contact details, including a physical address where required.
- A real person on the about page.
- Reviews.
- A clear returns policy (ENT-309).
- Secure payment, visibly.
- No spelling errors, which readers treat as a signal.

## Mobile

Most visitors will be on a phone:

- Check every page on an actual phone.
- Check the whole purchase, on a phone, on a slow connection.
- Buttons large enough, text readable, forms short.

A store that works on a desktop and badly on a phone is losing most of
its potential sales.

## Speed

Slow pages lose buyers, measurably:

- Compress images; they are usually the cause.
- Remove unnecessary apps and scripts.
- Test it, and test it on a phone connection.

## Search and navigation

- Working search, if you have more than a few products.
- Sensible categories.
- Filters, if the range warrants them (ENT-310).
- No more than a couple of clicks to anything.
""",
            },
            {
                "title": "Taking Payment",
                "description": "Gateways, fees and security.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## What you need

A way to take money that is:

- Available in your market and to your customers.
- Secure and compliant.
- Affordable at your volume.
- Reliable.

Most hosted platforms include or integrate with payment providers,
which is the simplest route to start.

## The fees

Understand the full cost (ENT-110):

- A percentage of each transaction, plus frequently a fixed amount.
- Higher rates for some card types and for international cards.
- Currency conversion charges.
- Chargeback fees.
- Monthly or account fees.
- Payout timing — when money actually reaches you, which affects cash
  (ENT-304).

At small volumes these are a meaningful share of margin. At higher
volumes rates are frequently negotiable, and almost nobody asks.

## Payment methods

Offer what your customers actually use:

- Cards, as a minimum.
- Digital wallets, which materially improve mobile conversion.
- Local methods, which differ substantially by country and can be
  essential in some markets (STU-204).
- Buy-now-pay-later, which can increase conversion and carries its own
  fees and considerations.

Ask customers, and look at what competitors in your market offer
(ENT-111).

## Compliance and security

Taking card payments brings obligations:

- **Card data security standards apply** to businesses handling card
  payments. Using a reputable provider that handles the card data
  reduces your scope substantially — which is a strong argument for
  not handling card details yourself.
- **Never store card details** yourself unless you genuinely know what
  that entails.
- **Never accept card details by email or phone message.**
- Keep systems updated and access controlled (ENT-307).

**Find out what applies to you** from your payment provider and the
relevant standards body, and take advice if you are doing anything
unusual.

## Verifying the provider

- Is it **authorised or registered** where you are? Payment services
  are regulated in most countries; check the regulator's register.
- What are its payout terms and reserve policies?
- What happens to your money if it fails?
- What are its rules about your product category — some are
  restricted.

That last point catches people: providers restrict certain categories
and will close accounts, sometimes abruptly, holding funds.

## Fraud

Online selling attracts it (STU-403):

- Use the provider's fraud tools.
- Be cautious with unusually large first orders, mismatched addresses
  and urgent delivery requests.
- Never ship to a different address on an unverified order without
  checking.
- Understand who bears the loss for a fraudulent transaction — it is
  frequently the merchant.

## Chargebacks

A customer disputing a payment (ENT-309):

- Fees apply, and a pattern affects your standing with the provider.
- Keep evidence — delivery confirmation, correspondence, terms
  accepted.
- Respond within the deadline.
- The best protection is clear description, clear terms and resolving
  problems before the customer feels they have no alternative.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Build the Store",
            "description": (
                "Submit:\n"
                "1. Your platform choice, with total cost including add-ons and "
                "transaction fees.\n"
                "2. Your data export, tested, with where it is kept.\n"
                "3. If using a marketplace: your assessment of the structural risk and "
                "what you are building alongside it.\n"
                "4. Your domain ownership, registered to the business, with renewal "
                "reminders and the trademark check.\n"
                "5. One product page meeting all eight elements, with the customer "
                "questions answered on it.\n"
                "6. Your photographs, with multiple angles and something for scale.\n"
                "7. Your trust signals, audited against the six listed.\n"
                "8. The full purchase completed by you on a phone, on a slow "
                "connection, with what you fixed.\n"
                "9. Your payment provider: fees in full, payout timing, authorisation "
                "checked on the regulator's register, and its rules about your "
                "category.\n"
                "10. Your fraud and chargeback procedures, including who bears the "
                "loss.\n\n"
                "Graded on part 2 being tested, part 8 having actually been done, and "
                "part 9 citing the register."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Setting Up",
            "description": "Four questions on platforms, the store and payment.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the commonest early mistake with an online store?",
                    "choices": [
                        "Months spent building it before knowing whether anybody will buy",
                        "Choosing a hosted platform rather than custom",
                        "Offering too few payment methods",
                        "Launching with too few products",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the cheapest improvement available to a product page?",
                    "choices": [
                        "Adding more photographs",
                        "Answering the questions customers actually ask",
                        "Shortening the description",
                        "Adding a countdown timer",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why use a reputable provider that handles card data itself?",
                    "choices": [
                        "It reduces transaction fees",
                        "It speeds up payouts",
                        "It substantially reduces your scope under card data security obligations",
                        "It improves conversion rates",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What catches sellers out about payment providers?",
                    "choices": [
                        "Currency conversion charges",
                        "Monthly account fees",
                        "Chargeback deadlines",
                        "Restricted product categories, leading to abrupt account closure with funds held",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Legal Side",
        "description": "What online selling requires.",
        "lessons": [
            {
                "title": "Consumer Rights Online",
                "description": "The obligations, which are not optional.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Online selling is heavily regulated

Selling to consumers at a distance carries specific obligations in
most countries — frequently more than selling face to face.

**The rules are generally set by where the customer is**, not where
you are, so selling internationally means several regimes
(ENT-206).

**Find out what applies from the official consumer protection
authority in every market you sell into**, and take advice. Nothing
here is a statement of your obligations.

## The questions to answer

1. **What information must I give before purchase** — about the
   product, the price, delivery, my identity and address?
2. **What cancellation rights** do consumers have, within what period,
   and how must I tell them?
3. **Does it differ** for goods, services and digital content?
4. **Who pays return postage?**
5. **How quickly must I refund?**
6. **What are my obligations** if something is faulty or not as
   described?
7. **What must appear on the website itself** — business details,
   registration numbers, contact routes?
8. **What rules apply to pricing displays**, including whether tax
   must be included?

## Things that commonly apply

Without asserting they apply to you:

- **Clear pre-contract information**, before the customer is bound.
- **A cancellation right** for distance sales, within a period, with
  specific information that must be provided.
- **A requirement that the price shown is the price payable**, with no
  surprise mandatory charges (ENT-207).
- **A requirement to identify the business** clearly.
- **Confirmation of the order** in a durable form.
- **Rules about automatic renewals and subscriptions.**

## The common failures

- No or inadequate cancellation information.
- Delivery charges appearing at the last step (ENT-306).
- Terms that purport to exclude statutory rights, which are
  unenforceable (ENT-303).
- No business address or real contact route.
- Claims that cannot be substantiated (ENT-205).
- Fake urgency or scarcity, which is specifically prohibited in many
  places (ENT-206).

## Accessibility

Increasingly a legal requirement as well as good practice:

- Sufficient colour contrast.
- Text that can be resized.
- Images with alternative text.
- Navigable without a mouse.
- Forms properly labelled.

**Check what applies where you operate**; requirements differ and are
expanding.

## Getting it right

- Read your own authority's guidance for online sellers; it is
  usually written for small businesses.
- Have your terms and policies drafted or reviewed for the markets you
  sell into (ENT-303).
- Check your checkout against the requirements, step by step.
- Review when you enter a new market (STU-204).

## Enforcement

Consumer authorities do act against small businesses, frequently
following complaints:

- Penalties.
- Required changes.
- Publicity.
- Platform removal, where you sell through one.

The compliance work is a few hours. The alternative is not.
""",
            },
            {
                "title": "Data and Privacy",
                "description": "Obligations that apply to every online seller.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Every store holds personal data

Names, addresses, order history, email addresses, payment references,
browsing behaviour. All of it is personal data in most regimes
(ENT-303).

## The rules travel

Obligations are generally set by **where the individual is**, which
for an online store can mean several regimes at once
(ENT-209).

**Find out what applies from your data protection authority**, and
take advice if you sell across borders.

## What is generally required

Common across many regimes:

- **A lawful basis** for holding and using the data.
- **A privacy notice**, accessible before data is collected, saying
  what you collect, why, how long you keep it, who you share it with
  and what rights people have.
- **Security** appropriate to the risk.
- **Responding to requests** for access, correction or deletion within
  a time limit.
- **Keeping data only as long as needed.**
- **Reporting breaches** within a deadline, frequently short
  (ENT-212).
- **Registration or a fee**, in some countries.

## Cookies and tracking

Specifically regulated in many places:

- Consent may be required before non-essential cookies and tracking
  are set.
- Consent must usually be freely given and as easy to refuse as to
  accept.
- Analytics and advertising pixels are frequently non-essential.
- A banner that only offers "accept" is non-compliant in many
  jurisdictions.

**Check what applies and configure accordingly.** This is one of the
most commonly breached requirements by small stores.

## Email marketing

Separately regulated (ENT-209):

- Consent requirements for marketing email.
- An exemption for existing customers in some regimes, with
  conditions.
- Opt-out in every message, honoured promptly.
- A tick box at checkout must not be pre-ticked in most regimes.

## Suppliers and tools

Every service touching customer data — your platform, payment
provider, email tool, analytics, fulfilment partner
(ENT-306):

- Check what they do with the data and where it is stored.
- Written terms are usually required.
- Cross-border transfers may require a specific mechanism.
- **You generally remain responsible** for data processed on your
  behalf.

## Practical steps

- Write down what data you hold and why.
- Publish a privacy notice and link it everywhere data is collected.
- Configure your cookie consent properly.
- Secure accounts with strong unique passwords and two-factor
  authentication (ENT-307).
- Limit who has access.
- Delete what you no longer need.
- Know your breach reporting deadline **before** you need it.

## If there is a breach

- Contain it immediately.
- Assess the risk to individuals.
- **Report within the deadline** if required.
- Tell affected customers where required.
- Take advice the same day (ENT-212).

Delay is what turns a breach into a penalty.
""",
            },
            {
                "title": "Tax and Cross-Border Selling",
                "description": "The obligations that scale with reach.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Selling online crosses borders easily

Which is the appeal, and which creates obligations in places you have
never been (ENT-305).

**Take advice before selling internationally at any volume**, and
check the position in each market.

## The questions

1. **Purchase or sales tax** — do I have to register and charge it in
   my own country, and from what threshold?
2. **Do I have obligations in the customer's country**, and from what
   threshold or from the first sale?
3. **How should prices be displayed** — tax inclusive or exclusive,
   and does it differ by market?
4. **Who is responsible for import duties and taxes** on goods sent
   abroad, and how is that presented to the customer
   (ENT-306)?
5. **Are digital products treated differently?** In many systems they
   are, and sometimes with no threshold at all.
6. **What invoicing requirements** apply?
7. **Does selling through a marketplace change who accounts for the
   tax?** In several systems it does.
8. **What records must I keep, and for how long?**

Several of these have answers that surprise sellers, particularly the
digital products one and the marketplace one.

## The thresholds

Crossing a threshold creates an obligation whether or not you noticed
(ENT-305):

- Monitor turnover monthly, by market where relevant.
- Know the threshold in each market you sell into.
- Register before, not after.

The liability can accrue from the date you should have registered,
including tax you never charged.

## Import duties on outbound goods

The common customer complaint (ENT-306):

- A customer receiving an unexpected duty bill produces a complaint, a
  refund and a poor review (ENT-309).
- Decide whether you or the customer pays, and **state it clearly
  before purchase**.
- Options exist for collecting it at checkout in some arrangements;
  ask your carrier.

## Marketplaces

In several systems, marketplaces are now required to account for tax
on sales through them, which changes your obligations
(ENT-305).

Do not assume. Check what your marketplace does and what remains
yours.

## Restricted goods and markets

- Some products cannot be exported or imported to certain countries.
- Some require licences.
- Sanctions apply to some destinations and parties.

**Check before offering international shipping**, and screen where
required. This is not an area for assumptions (ENT-306).

## Keeping it manageable

A sensible approach for a small store:

- Start with your own market, properly compliant.
- Add markets deliberately, one at a time, with advice.
- Restrict shipping to markets you have checked.
- Review annually and whenever volume changes.

Selling worldwide from day one sounds appealing and creates
obligations in dozens of jurisdictions.

## Records

- Every sale, with the destination.
- Tax charged, by market.
- Evidence of where the customer was, which some regimes require.
- Kept for the period required (ENT-304).
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Comply",
            "description": (
                "Submit, citing official authorities with dates for every market:\n"
                "1. All eight consumer rights questions answered for every market you "
                "sell into.\n"
                "2. Your checkout checked step by step against those requirements, "
                "with what you fixed.\n"
                "3. Your pre-contract information and cancellation information, as "
                "presented to customers.\n"
                "4. Your accessibility position, with what applies where you operate.\n"
                "5. A written record of all personal data your store holds, and your "
                "lawful basis.\n"
                "6. Your privacy notice and your cookie consent configuration, with "
                "evidence refusing is as easy as accepting.\n"
                "7. Every tool touching customer data, with written terms in place.\n"
                "8. Your breach reporting deadline and containment process.\n"
                "9. All eight tax questions answered, including digital products and "
                "marketplace treatment.\n"
                "10. Your position on import duties for outbound goods, and which "
                "markets you have restricted because you have not checked them.\n\n"
                "Graded on every answer citing an authority with a date, and part 2 "
                "producing real fixes."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Legal Side",
            "description": "Four questions on consumer rights, data and tax.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Whose rules apply when selling online to consumers?",
                    "choices": [
                        "Generally those of the country where the customer is",
                        "Those of the country where the business is registered",
                        "Those of the platform's jurisdiction",
                        "Whichever the terms specify",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is non-compliant in many jurisdictions?",
                    "choices": [
                        "Using analytics at all",
                        "A cookie banner that only offers 'accept'",
                        "Storing order history",
                        "Emailing existing customers",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What happens when a tax threshold is crossed unnoticed?",
                    "choices": [
                        "Registration is required from the following period",
                        "A warning is issued first",
                        "The liability can accrue from the date you should have registered, including tax you never charged",
                        "Only future sales are affected",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What produces a complaint, a refund and a poor review?",
                    "choices": [
                        "Slow international shipping",
                        "Limited payment options abroad",
                        "Restricting which countries you ship to",
                        "A customer receiving an unexpected import duty bill",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Conversion",
        "description": "Turning visitors into customers.",
        "lessons": [
            {
                "title": "Where People Stop",
                "description": "Finding the actual problem.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The funnel

Visitors → viewed a product → added to basket → started checkout →
completed.

People drop at every step. Measuring each tells you **where** the
problem is, which is the only actionable version (ENT-208).

Measuring only the overall rate tells you something is wrong and
nothing about what.

## Typical causes by step

**Visitors who never view a product.** Wrong traffic, or the home page
does not say what you sell (ENT-107).

**Viewed but not added.** Price, photographs, description, delivery
cost, availability, or an unanswered question (Module 1).

**Added but not checked out.** The classic: unexpected delivery cost,
required account creation, or they were comparing.

**Started but not completed.** Payment options, form length, trust,
or an error.

## The biggest causes

Consistently, across online retail:

- **Unexpected costs** appearing late — delivery, tax, fees. The
  largest single cause (ENT-306).
- **Being required to create an account.**
- **A long or confusing checkout.**
- **Limited payment options** (Module 1).
- **Delivery too slow, or unclear.**
- **Not trusting the site** (Module 1).
- **Errors or something not working.**

Most of these are fixable in an afternoon.

## Watch somebody buy

The single most informative thing you can do:

- Ask somebody who does not know your business to buy something.
- Watch without helping. Say nothing.
- Note every hesitation, every re-read, every wrong click.

Uncomfortable, and more useful than any amount of analytics
(ENT-106).

## Ask the people who did not buy

- A short question on an abandoned basket email: *"was there anything
  that stopped you?"*
- Ask customers what nearly stopped them (ENT-202).
- Read support questions for confusion (ENT-309).

## Your own data

- Where people stop, step by step.
- Which products convert and which do not.
- Mobile against desktop, separately — the difference is frequently
  large (Module 1).
- Which traffic sources convert (ENT-208).

## Do not optimise prematurely

With few visitors, differences are noise:

- A difference across fifty visitors means nothing.
- Fix the obvious problems first — they do not need testing.
- Get traffic before optimising conversion of a trickle
  (ENT-203).

A store converting badly with no visitors has a traffic problem, not a
conversion problem.
""",
            },
            {
                "title": "Fixing the Obvious Things",
                "description": "The changes that do not need testing.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Show the full cost early

The single biggest fix (Module 3, lesson 1):

- Delivery cost visible before checkout, ideally on the product page.
- Any fees or taxes clear.
- No surprises at the final step.

It is also a legal requirement in many places (Module 2).

## Allow guest checkout

Requiring an account before purchase loses a meaningful share of
buyers. Offer the account afterwards, when they have already bought.

## Shorten the checkout

- Ask only for what you need to fulfil and comply.
- One page, or clearly numbered steps with progress shown.
- Address lookup rather than manual entry.
- Sensible defaults.
- Clear error messages that say what to fix.

Every field removed increases completion.

## Offer the payment methods people use

Including digital wallets, which materially improve mobile conversion
by removing typing (Module 1).

## Fix the phone experience

Most visitors are on a phone:

- Complete the purchase yourself, on a phone, on a slow connection.
- Fix everything that is awkward.
- Check buttons, text size and form fields.

Founders test on a desktop and lose most of their customers on a
phone.

## Make it fast

Slow pages lose buyers measurably (Module 1):

- Compress images.
- Remove unused apps and scripts.
- Test on a phone connection.

## Answer the questions

Collect what customers ask and answer it on the page
(ENT-106):

- Sizing, compatibility, materials.
- How long delivery takes.
- What happens if it is wrong.

Each unanswered question is a reason to leave and compare.

## Build trust

- Real contact details and a real person (Module 1).
- Reviews, genuine (ENT-309).
- A clear, generous returns policy — this is one of the largest
  conversion improvements available and it requires only that you mean
  it.
- Secure payment, visible.

## Abandoned basket recovery

A reminder email to somebody who left something behind recovers a
meaningful share:

- One or two messages, not five.
- Helpful rather than pressuring.
- Include what they left and a direct link.
- Comply with marketing consent rules — this is marketing
  (ENT-209).
- Ask whether something stopped them (Module 3, lesson 1).

## Honestly

Everything here is about removing obstacles rather than persuading
(ENT-206):

- No fake countdowns.
- No invented stock scarcity.
- No pre-ticked boxes.
- No hidden costs.

Those are unlawful in many jurisdictions and they produce refunds,
chargebacks and poor reviews (ENT-205).
""",
            },
            {
                "title": "Testing and Improving",
                "description": "Deliberate improvement over time.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Test only when you have volume

Comparing two versions requires enough visitors for the difference to
mean something (ENT-105).

With low traffic:

- Fix the obvious things, which do not need testing (lesson 2).
- Make bigger changes rather than small ones.
- Rely on watching people and asking them (lesson 1).

## Running a test properly

When you do have volume:

- **One variable at a time.**
- **Written expectation** before starting: what result would mean it
  worked.
- **Run long enough** to cover a full weekly cycle.
- **Do not stop early** because it looks good.
- **Measure the outcome that matters** — completed purchases and
  revenue, not clicks.

## What is worth testing

- The product page headline and description (ENT-107).
- Photographs.
- Price presentation (ENT-207).
- Delivery options and how they are shown.
- The checkout flow.
- Trust elements.

## Measure retention too

A change that increases conversion and increases refunds has made
things worse (ENT-206).

Track together:

- Conversion rate.
- Average order value.
- Return and refund rate.
- Repeat purchase rate (ENT-208).

## Average order value

Frequently easier to improve than conversion:

- Related products, genuinely relevant.
- Bundles at a fair saving.
- A free-delivery threshold, costed properly (ENT-306).
- A higher-specification option (ENT-207).

Done honestly these help the customer. Done as pressure they produce
returns.

## Repeat purchase

The cheapest growth available (ENT-208):

- A good post-purchase experience (ENT-309).
- Email to existing customers (ENT-209).
- Reminders when something is likely to be needed again.
- Making reordering easy.

Most stores concentrate entirely on acquisition and ignore the
customers they already have.

## The monthly review

Thirty minutes (ENT-304):

- Visitors, conversion by step, orders, revenue.
- Mobile against desktop.
- Return rate and reasons (ENT-309).
- Abandoned baskets recovered.
- The one thing to change this month.

## The honest perspective

For a small store:

- Fixing obvious problems produces more than any testing programme.
- Traffic is usually the constraint, not conversion
  (ENT-203).
- Returns and retention matter as much as conversion
  (ENT-208).
- Compliance is not optional and is cheaper than the alternative
  (Module 2).

## The summary

1. Hosted is almost always right for a first store; sell before
   building.
2. A marketplace brings traffic and owns the relationship.
3. Photographs and answered questions are the largest product page
   factors.
4. Complete your own purchase on a phone, on a slow connection.
5. Online consumer obligations are set by where the customer is.
6. Cookie consent must be as easy to refuse as to accept.
7. Monitor tax thresholds by market; crossing one creates liability
   regardless.
8. Unexpected costs at checkout are the largest single cause of
   abandonment.
9. Allow guest checkout and remove every unnecessary field.
10. Measure conversion and returns together, and fix the obvious
    before testing.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Convert Better",
            "description": (
                "Submit:\n"
                "1. Your funnel measured at every step, mobile and desktop "
                "separately.\n"
                "2. Somebody who does not know your business watched buying, with "
                "every hesitation noted.\n"
                "3. Ten non-buyers asked what stopped them, with the answers.\n"
                "4. Evidence the full cost is shown before checkout.\n"
                "5. Guest checkout enabled, and every unnecessary field removed, with "
                "the before and after.\n"
                "6. Your page speed, tested on a phone connection, with what you "
                "fixed.\n"
                "7. The customer questions now answered on product pages.\n"
                "8. Your abandoned basket sequence, compliant with marketing consent "
                "rules.\n"
                "9. One test run with a written expectation, enough volume and one "
                "variable — or an explanation of why you have too little traffic to "
                "test.\n"
                "10. Conversion, average order value, return rate and repeat purchase "
                "tracked together for three months.\n\n"
                "Graded on part 2 having happened, part 5 showing real removal, and "
                "part 10 measuring returns alongside conversion."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Conversion",
            "description": "Four questions on diagnosis, fixes and testing.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the largest single cause of checkout abandonment?",
                    "choices": [
                        "Unexpected costs appearing late",
                        "Slow page loading",
                        "Limited payment options",
                        "Long delivery times",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the single most informative conversion exercise?",
                    "choices": [
                        "Reviewing analytics by traffic source",
                        "Watching somebody who does not know your business try to buy, without helping",
                        "Running an A/B test on the product page",
                        "Surveying existing customers",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does a store converting badly with no visitors have?",
                    "choices": [
                        "A product problem",
                        "A pricing problem",
                        "A traffic problem, not a conversion problem",
                        "A trust problem",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What must be measured alongside conversion?",
                    "choices": [
                        "Page views per session",
                        "Traffic source quality",
                        "Time on site",
                        "Return and refund rate — a change raising one and worsening the other has made things worse",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
