"""ENT-310: Inventory Management. Entrepreneur Pathway, Level 3.
Just-in-time thinking, forecasting demand, warehousing basics.

Founder audience, as ENT-101. Boundary: ENT-306 is the supply chain — finding
suppliers, compliance, importing, fulfilment; this course is the stock itself
once you have it. ENT-304 supplies the cash framing it depends on. The central
argument is that inventory is cash in a different shape, and that the two
failures — running out of what sells and holding what does not — are both cash
problems rather than operational inconveniences.
"""

MODULES = [
    {
        "title": "Stock Is Cash",
        "description": "The framing everything else follows from.",
        "lessons": [
            {
                "title": "What Inventory Actually Costs",
                "description": "Beyond the purchase price.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The reframe

Stock is not an asset sitting usefully on a shelf. It is **cash you
have converted into boxes**, and you cannot pay anybody with boxes
(ENT-304).

Every decision in this course follows from that.

## The carrying cost

Holding stock costs money continuously:

- **Capital tied up**, unavailable for anything else
  (ENT-108).
- **Storage** — space, racking, utilities.
- **Insurance** (ENT-311).
- **Handling** — your time or somebody's.
- **Deterioration, damage and loss.**
- **Obsolescence**, which is the largest and least visible.
- **The opportunity cost** of what that cash could have done.

Together these are substantial annually. A business holding a large
amount of slow-moving stock is paying for it every month without
noticing.

## The two failures

**Stockouts.** You cannot supply what somebody wants:

- Lost sales, immediately.
- Customers who go elsewhere and stay there (ENT-309).
- Reputational cost, particularly in consumer markets.
- Emergency reordering at worse terms (ENT-306).

**Excess and dead stock.** You hold what does not sell:

- Cash permanently converted into something unsellable.
- Carrying cost continuing.
- Eventually written off or sold below cost.

The second is worse, because the first is recoverable and the second
is money gone.

## The tension

Everything in inventory management is the trade-off between those
two. There is no setting that eliminates both; there is a balance
appropriate to your margins, lead times and demand variability.

## The cash timeline

For an imported product (ENT-306):

> *Pay supplier in January. Goods arrive March. Sold through June to
> September. Paid as sold.*

Eight months between cash out and cash fully back. That is the
working capital requirement, and it is why growing a stocked business
consumes cash rather than generating it (ENT-304).

## Stock turnover

The single most useful inventory measure:

> **How many times a year you sell through your average stock
> holding.**

High turnover means cash cycles quickly. Low turnover means cash is
sitting still.

Track it, by product. The number itself matters less than the trend
and the comparison between products (Module 3).

## The discipline

- Know what you have.
- Know how fast each thing sells.
- Reorder before running out, allowing for lead time (Module 2).
- Identify slow-moving stock early and clear it (Module 3).

Four things. Most small businesses do none of them systematically and
discover the problem when cash runs short.
""",
            },
            {
                "title": "Knowing What You Have",
                "description": "Accurate records, which most businesses lack.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The starting point

You cannot manage stock you cannot count. A surprising number of
small businesses genuinely do not know what they hold.

## The record

For each item:

- A unique code.
- Description.
- Quantity on hand.
- Location, if more than one.
- Cost per unit, landed (ENT-306).
- Supplier and lead time.
- Reorder point and quantity (Module 2).
- Date of last sale.

A spreadsheet is adequate for a small range. Software becomes worth it
with volume, multiple locations or multiple sales channels
(ENT-312).

## Keeping it accurate

Records drift from reality:

- Sales not recorded.
- Damages not written off.
- Returns not put back.
- Samples and personal use not recorded.
- Theft.
- Miscounts at receipt.

**Every movement must be recorded.** A record nobody updates is worse
than none, because decisions are made on it.

## Counting

Two approaches:

- **A full count**, periodically. Disruptive, thorough, usually
  annual and frequently required for accounts (ENT-304).
- **Cycle counting** — counting a portion regularly, so everything is
  counted over a period. Less disruptive, catches errors sooner, and
  better for most businesses.

Count high-value and fast-moving items more often.

## Reconciling

When the count differs from the record:

- Investigate before adjusting.
- Look for a pattern — one product, one period, one process.
- Adjust the record and note why.
- Fix the cause.

Persistent unexplained differences indicate a process problem or
theft, and both need addressing rather than adjusting away.

## Multiple channels

If you sell in more than one place — your own site, a marketplace,
in person — stock must be synchronised (ENT-312).

Selling the same unit twice produces a cancellation, a refund and a
poor review. This is the most common operational failure in
multi-channel selling, and it is what stock software mainly exists to
prevent.

## Valuation

Stock has a value in your accounts, and the method matters
(ENT-304):

- Different methods exist for valuing stock when unit costs have
  varied.
- The method affects reported profit and tax.
- Obsolete or unsellable stock should be written down.

**Your accountant will tell you the required approach** for your
jurisdiction and structure. Carrying unsellable stock at full value
overstates both your assets and your profit (Module 3).

## Traceability

Where it matters — perishables, regulated products, anything with a
recall risk (ENT-306):

- Batch or lot numbers recorded at receipt.
- Which batch went to which customer, where possible.
- Expiry dates tracked.

This is what makes a recall manageable rather than catastrophic.
""",
            },
            {
                "title": "Forecasting Demand",
                "description": "Imperfectly, but deliberately.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## It will be wrong

All forecasts are wrong. The purpose is not accuracy; it is being
**less wrong than guessing**, and having a stated assumption you can
correct (ENT-105).

## Start with history

Once you have any:

- Units sold per product, per month.
- The trend.
- Seasonality.
- Anything unusual, excluded or noted.

Three months of data is thin. Twelve is useful. Two years shows
seasonality properly.

## Without history

For a new product:

- A comparable product you already sell.
- Supplier or industry information, treated cautiously
  (ENT-106).
- A small first order to generate data (ENT-306).
- Pre-orders, which are the best possible forecast
  (ENT-105).

**Order small and learn** rather than forecasting confidently from
nothing. The unit price saving on a large first order is frequently
wiped out by one unsellable batch.

## Adjusting for known factors

- Marketing planned (ENT-208).
- A price change (ENT-207).
- Seasonality.
- A competitor's action (ENT-111).
- Something affecting the whole market.

State each adjustment and its reasoning, so you can review whether it
was right.

## Seasonality

Substantial in many businesses and routinely under-planned:

- Identify your pattern from history.
- Order for the peak with lead time included (Module 2).
- Plan the cash for buying ahead of the peak (ENT-304).
- Plan for the trough — do not hold peak-level stock through it.

Being out of stock in your busiest week is the most expensive
stockout there is.

## Forecast by product

Aggregate forecasts hide everything:

- Some products grow while others decline.
- Variants sell very unevenly; the distribution is rarely even.
- A few products usually account for most sales (Module 3).

Forecast the important ones individually and group the rest.

## Reviewing

Monthly (ENT-304):

- Forecast against actual, by product.
- Where were you wrong, and by how much?
- Why?
- Adjust the next period.

Forecasting improves only with this comparison. Most businesses
forecast and never check.

## Building in error

Since the forecast is wrong:

- Hold safety stock proportionate to how variable demand is and how
  long the lead time is (Module 2).
- Prefer more frequent smaller orders where the supplier allows
  (ENT-306).
- Have a plan for both outcomes — what you do if it sells twice as
  fast, and if it does not sell.

That last question is the one founders do not ask before ordering.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Know Your Stock",
            "description": (
                "Submit:\n"
                "1. Your full carrying cost, estimated across all seven elements.\n"
                "2. Your cash timeline from paying the supplier to being fully paid "
                "by customers.\n"
                "3. Your stock turnover, overall and by product.\n"
                "4. Your stock record, with all eight fields per item.\n"
                "5. Your counting approach, with evidence of one count and any "
                "discrepancies investigated.\n"
                "6. If you sell in more than one place: how stock is synchronised.\n"
                "7. Your valuation method, as advised by your accountant, and any "
                "stock written down.\n"
                "8. Twelve months of sales history by product, with the seasonality.\n"
                "9. A forecast for the next quarter by product, with each adjustment "
                "and its reasoning stated.\n"
                "10. Last quarter's forecast against actual, with why you were wrong.\n\n"
                "Graded on part 3 being real numbers, part 5 investigating rather "
                "than adjusting, and part 10 being a real comparison."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Stock Is Cash",
            "description": "Four questions on cost, records and forecasting.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which inventory failure is worse, and why?",
                    "choices": [
                        "Excess stock — a stockout is recoverable, dead stock is money gone",
                        "Stockouts, because customers leave permanently",
                        "They are equally costly",
                        "It depends entirely on margin",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the most common operational failure in multi-channel selling?",
                    "choices": [
                        "Inconsistent pricing",
                        "Selling the same unit twice because stock is not synchronised",
                        "Different delivery promises",
                        "Duplicate customer records",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the purpose of a demand forecast?",
                    "choices": [
                        "To predict sales accurately",
                        "To satisfy a lender",
                        "To be less wrong than guessing, with a stated assumption you can correct",
                        "To set the marketing budget",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which question do founders not ask before ordering stock?",
                    "choices": [
                        "What is the unit cost at this volume?",
                        "What is the lead time?",
                        "What is the minimum order quantity?",
                        "What do I do if it does not sell?",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Deciding What to Hold",
        "description": "Reorder points, quantities and lead times.",
        "lessons": [
            {
                "title": "Lead Time and Reorder Points",
                "description": "When to order.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Lead time

The time from placing an order to having sellable stock:

- Supplier production time.
- Shipping.
- Customs clearance, if importing (ENT-306).
- Receipt and inspection.
- Getting it into the system and onto the shelf.

Founders use the supplier's quoted production time and are
consistently short. Measure the **actual total**, from your own
history, and use that.

## The reorder point

The stock level at which you place the next order:

> **Reorder point = (how fast it sells × lead time) + safety stock**

If something sells twenty a week and takes six weeks to arrive, you
need 120 units to cover the wait, plus a buffer.

Set one for every product. Without it, reordering happens when
somebody notices, which is too late.

## Safety stock

The buffer for things going wrong:

- Demand higher than forecast.
- Lead time longer than expected.
- A delivery that is short or defective (ENT-306).

**How much** depends on:

- How variable demand is — steady products need less.
- How variable lead time is — unreliable suppliers need more.
- The cost of a stockout — high for your best seller, low for a
  marginal item.
- The carrying cost (Module 1).

More safety stock means fewer stockouts and more cash tied up. That is
the trade-off and it should be made deliberately per product rather
than uniformly.

## Order quantity

How much to order balances:

- **Ordering costs** — admin, shipping, minimums (ENT-306).
- **Carrying costs** — cash, storage, obsolescence (Module 1).

Larger orders reduce the first and increase the second.

Practical approach for a small business:

- Meet the supplier's minimum, no more, until a product is proven.
- Order enough to cover a sensible period — frequently one to three
  months of sales plus lead time.
- Prefer smaller more frequent orders where shipping allows, because
  it reduces cash tied up and risk (ENT-304).
- Take volume discounts only when you are confident the stock will
  sell (ENT-306).

## Just-in-time, honestly

Holding minimal stock and relying on frequent replenishment:

- **Good:** very little cash tied up, minimal obsolescence.
- **Hard:** requires reliable short lead times and predictable demand,
  and any disruption causes immediate stockouts.

For a small business with overseas suppliers and variable demand, full
just-in-time is usually unrealistic. The useful version is the
**principle**: hold as little as you safely can, and question every
unit (ENT-306).

## Reviewing the parameters

Quarterly, per significant product:

- Has the sales rate changed?
- Has lead time changed?
- Have we had stockouts, or excess?
- Should the reorder point or quantity change?

Parameters set once and never revisited are a common source of both
failures.
""",
            },
            {
                "title": "Range and Variants",
                "description": "How many different things to stock.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The instinct to expand

More products looks like more sales. Frequently it is more cash tied
up, more complexity and no more revenue (ENT-110).

## The concentration

In most product businesses, a small proportion of products accounts
for most of the sales. The rest collectively contribute little and
consume:

- Cash.
- Storage.
- Attention.
- Forecasting effort.
- Complexity in every process.

Check your own distribution. Founders are frequently surprised how
concentrated it is.

## Variants multiply

Sizes, colours, options. Each is a separate stock item to forecast,
hold and count:

- Three colours and five sizes is fifteen items, not two decisions.
- Demand across variants is rarely even — some sell out while others
  never move.
- The slow variants become dead stock while the fast ones are out of
  stock.

**Be sceptical of variants.** Each should earn its place with actual
sales, not with the argument that somebody might want it.

## Adding a product

Before adding anything (ENT-105):

- What evidence is there that it will sell?
- What cash does it tie up?
- What does it displace — attention, space, cash?
- Can it be tested without committing to stock — pre-order, made to
  order, dropshipped (ENT-306)?
- What is the plan if it does not sell?

## Reviewing the range

Quarterly, by product:

- Units sold.
- Revenue and gross margin (ENT-110).
- Stock turnover (Module 1).
- Stock on hand, in months of sales.
- Date of last sale.

Then classify: core, viable, marginal, dead.

## Cutting

Uncomfortable and usually correct:

- Discontinue products with poor turnover and poor margin.
- Reduce variants to those that actually sell.
- Clear the stock (Module 3) and do not reorder.

A narrower range frequently produces more profit: less cash tied up,
simpler operations, better availability of what people actually buy
(ENT-110).

## The objections

**"Customers expect a full range."** Check. Frequently they expect
availability of the main items, which a narrower range improves.

**"It only costs a little to keep."** It costs the carrying cost, the
complexity and the attention, continuously (Module 1).

**"It might sell."** It has had its chance. Evidence beats hope
(ENT-105).

## Made to order

Where feasible, an alternative to stocking variants:

- Longer delivery time, no stock risk.
- Suits higher-value, lower-volume, customisable products.
- Can be offered alongside stocked core items.

A core range held in stock plus a wider range made to order is
frequently the best structure for a small business.
""",
            },
            {
                "title": "Storage and Handling",
                "description": "Where it lives and how it moves.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Options

- **At home**, initially (ENT-306).
- **Self-storage**, cheap and manual.
- **Shared or managed space.**
- **A third-party fulfilment provider**, who stores and ships.
- **Your own unit**, once volume justifies the fixed cost
  (ENT-109).

Move up only when the current option genuinely constrains you. A
fixed-cost unit taken too early is a serious burden in a quiet quarter
(ENT-110).

## Insurance

**Check your insurance covers stock where it is actually stored** —
standard policies frequently exclude business stock held at home, and
businesses discover this after a flood (ENT-311).

Also check:

- Cover value against actual stock value.
- Goods in transit.
- What the provider's liability is, if stored elsewhere — frequently
  far less than the value.

## Organisation

Basic and it saves real time:

- A consistent location for each item, recorded (Module 1).
- Fast-moving items accessible.
- Clear labelling.
- Oldest stock used first, particularly where there is any expiry or
  obsolescence risk.
- Separate areas for incoming, outgoing, damaged and returned.

That last one prevents the common error of damaged or returned goods
being sold as new.

## Receiving

Every delivery (ENT-306):

- Check quantity against the order.
- Inspect against the specification and reference sample.
- Photograph any damage before accepting.
- Record batch numbers.
- Report discrepancies immediately; claim windows are short.
- Enter into the stock record the same day.

Stock received and not recorded is the main source of record
inaccuracy (Module 1).

## Picking and packing

- A defined process, documented (ENT-308).
- A check against the order before sealing.
- Record the dispatch and update stock.

Picking errors cost a replacement, the shipping twice and a
dissatisfied customer (ENT-309). A simple check step prevents most
of them.

## Returns

A separate flow (ENT-309):

- Inspect on arrival.
- Decide: resellable, repairable, or write off.
- If resellable, return it to stock properly and update the record.
- If not, record the write-off (Module 3).

Returns sitting in a corner uncounted are a common source of both
record error and lost value.

## Safety

If you or anybody else handles stock:

- Safe lifting and storage; do not stack beyond what is safe.
- Clear access routes.
- Appropriate equipment.
- **Find out what health and safety obligations apply** where you
  operate, particularly if anybody else works there
  (ENT-401).

These are legal obligations in most jurisdictions, not good practice.

## Security

- Lockable, with controlled access.
- A record of who has access.
- Higher-value items secured separately.
- Stock discrepancies investigated rather than adjusted away
  (Module 1).
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Set the Parameters",
            "description": (
                "Submit:\n"
                "1. Your actual total lead time per supplier, measured from your own "
                "history rather than quoted.\n"
                "2. A reorder point for every product, with the calculation shown.\n"
                "3. Your safety stock per product, with the reasoning for the "
                "differences.\n"
                "4. Your order quantities, and why smaller more frequent orders are or "
                "are not possible.\n"
                "5. Your sales distribution across products, showing the "
                "concentration.\n"
                "6. Every variant, with units sold and date of last sale.\n"
                "7. Your range classified into core, viable, marginal and dead, with "
                "what you are cutting.\n"
                "8. Where stock is stored, and written confirmation your insurance "
                "covers it there at the right value.\n"
                "9. Your receiving, picking and returns processes, documented.\n"
                "10. What health and safety obligations apply where stock is handled, "
                "from an official source.\n\n"
                "Graded on part 1 being measured, part 7 identifying real cuts, and "
                "parts 8 and 10 being confirmed rather than assumed."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: What to Hold",
            "description": "Four questions on reorder points, range and storage.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What lead time should a reorder point use?",
                    "choices": [
                        "The actual total measured from your own history, not the supplier's quoted production time",
                        "The supplier's quoted time plus a margin",
                        "The shipping time",
                        "An industry average",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What happens with variants in most product businesses?",
                    "choices": [
                        "Demand spreads evenly across them",
                        "Slow variants become dead stock while fast ones are out of stock",
                        "They increase total sales proportionally",
                        "They reduce per-unit costs",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the main source of stock record inaccuracy?",
                    "choices": [
                        "Theft",
                        "Miscounting at the annual count",
                        "Stock received and not recorded",
                        "Returns processed incorrectly",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What do standard insurance policies frequently exclude?",
                    "choices": [
                        "Goods in transit",
                        "Damage during handling",
                        "Theft from a locked unit",
                        "Business stock held at home",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Dead Stock and Improvement",
        "description": "Clearing what does not sell, and getting better.",
        "lessons": [
            {
                "title": "Identifying and Clearing",
                "description": "Dealing with stock that is not moving.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Identify it early

The longer dead stock is held, the more it costs and the less it is
worth (Module 1).

Review monthly:

- Items with no sales in a defined period.
- Items with stock representing many months of sales.
- Items with falling sales and high stock.
- Seasonal items after their season.

Set a rule — no sales in ninety days, or more than six months of
cover — and review everything that triggers it.

## The sunk cost problem

What you paid is gone. The only question is **what you can recover
now** (ENT-103).

Founders refuse to sell below cost, hold it for two years, and
eventually write it off entirely — recovering nothing instead of
something.

Selling at a loss today is frequently better than holding it. Run the
arithmetic rather than the instinct.

## Options, in order

1. **Discount it**, enough to actually move it (ENT-207).
2. **Bundle it** with something that sells.
3. **Sell it through a different channel** — a clearance site, a
   marketplace, a liquidator.
4. **Offer it to trade** or to a competitor.
5. **Use it** — samples, promotions, replacements.
6. **Donate it**, which may have tax implications; check
   (ENT-305).
7. **Write it off and dispose of it** properly.

## Discounting without damaging the brand

- Keep clearance separate from your main presentation where possible
  (ENT-201).
- Time-limited, and honour the limit (ENT-205).
- Do not discount the same lines repeatedly, which trains customers to
  wait (ENT-207).
- Be clear it is clearance rather than a general price reduction.

## Writing it off

When it genuinely cannot be sold:

- Record the write-off properly in your accounts
  (ENT-304).
- Your accountant will advise on treatment and any tax consequence
  (ENT-305).
- Dispose of it responsibly — check what obligations apply to the
  material.
- Do not carry unsellable stock at full value; it overstates your
  assets and your profit (Module 1).

## Learning from it

Every piece of dead stock was an ordering decision:

- What did we believe when we ordered it?
- What was the evidence?
- Did we order too much, or was the product wrong?
- Was it a variant that should never have existed (Module 2)?
- What would have told us sooner?

Record it. The pattern across several is where the improvement is
(ENT-105).

## Preventing it

- Small first orders (ENT-306).
- Test before committing (ENT-105).
- Fewer variants (Module 2).
- Reorder points reviewed as sales change (Module 2).
- Monthly review, so it is caught at three months rather than
  eighteen.

Dead stock is almost always a decision made months earlier with
insufficient evidence.
""",
            },
            {
                "title": "Measuring and Improving",
                "description": "The numbers that drive decisions.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The measures

Six, reviewed monthly (ENT-304):

1. **Stock value**, total and by product.
2. **Stock turnover**, overall and by product (Module 1).
3. **Months of cover** per product — stock divided by monthly sales.
4. **Stockouts** — how many, which products, estimated lost sales.
5. **Dead stock value** (lesson 1).
6. **Record accuracy** — count against record.

## Reading them

- **Turnover falling:** cash increasingly tied up. Investigate which
  products.
- **Months of cover rising:** you are ordering faster than selling.
- **Stockouts on fast movers:** reorder points too low, or lead time
  longer than assumed (Module 2).
- **Stockouts on slow movers:** probably fine; do not over-correct.
- **Dead stock rising:** ordering decisions need examining.
- **Record accuracy falling:** a process problem (Module 1).

## Where the money usually is

In rough order for a small product business:

1. **Reducing dead stock** and not creating more.
2. **Narrowing the range** (Module 2).
3. **Smaller, more frequent orders**, where shipping allows.
4. **Better reorder points**, reducing stockouts on the products that
   matter.
5. **Negotiating supplier terms** — longer payment improves cash more
   than a discount (ENT-306).
6. **Reducing storage cost.**

## The cash view

Monthly, alongside the cash forecast (ENT-304):

- How much cash is in stock?
- Is that rising or falling?
- Is it rising faster than sales?

Stock value growing faster than revenue is a warning, and it is
frequently the thing that produces a cash problem three months later.

## Improving forecasting

- Compare forecast to actual monthly, by product (Module 1).
- Note why each was wrong.
- Adjust method, not just numbers.
- Over a year, the pattern of your errors is itself information —
  most founders are consistently optimistic.

## Supplier conversations

Once you have a track record (ENT-306):

- Smaller minimum order quantities.
- Shorter lead times.
- Longer payment terms.
- Holding stock for you and releasing it in batches, which some
  suppliers will do.

Each reduces the cash you must hold. Ask; many are negotiable and
founders assume they are not.

## Reviewing annually

- Total stock value against revenue.
- Dead stock written off this year, and why.
- Stockouts and estimated lost sales.
- Whether the range is right (Module 2).
- Whether storage still suits the volume.
- The single biggest constraint.
""",
            },
            {
                "title": "Growing Without Drowning",
                "description": "Inventory as the business scales.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Growth consumes cash

The central problem (ENT-304):

- More sales means more stock.
- More stock means more cash tied up, before the sales happen.
- Growth therefore makes cash worse before it makes it better.

Businesses fail while growing, and inventory is one of the main
mechanisms.

## Planning growth financially

Before committing to a growth push (ENT-208):

- How much additional stock will it require?
- When is that cash needed, against when sales arrive?
- Does the cash forecast survive it (ENT-304)?
- What funding, if any, is needed and from where
  (ENT-108)?

A marketing campaign that succeeds and leaves you unable to supply is
worse than one that fails (ENT-306).

## Scaling the operation

Each stage needs different arrangements:

- **Home storage** works to a point.
- **Self-storage** to a larger point.
- **Third-party fulfilment** removes handling and adds per-unit cost
  (ENT-306).
- **Your own space and people** adds fixed cost and control
  (ENT-401).

Move when the current arrangement genuinely constrains you, not in
anticipation. A fixed cost taken early is a liability in a quiet
quarter (ENT-110).

## Systems

Spreadsheets stop working at some point (Module 1):

- Multiple channels needing synchronisation (ENT-312).
- More items than can be tracked manually.
- More than one person handling stock.
- Errors becoming frequent.

Move to software when those bite, not before. Software introduced too
early is an unmaintained system (ENT-307).

## Delegating it

Inventory work is well suited to being handed over
(ENT-308):

- Document the processes (Module 2).
- Define reorder points so decisions are rule-based
  (Module 2).
- Keep the ordering decisions yourself initially — they are cash
  decisions.
- Review the measures yourself, monthly (lesson 2).

## The things that break at scale

- Record accuracy, as volume rises.
- Multi-channel synchronisation (Module 1).
- Reorder points left unrevised as sales change.
- Range expanding faster than anybody reviews it (Module 2).
- Storage reached capacity without anybody noticing.

Each is prevented by the monthly review.

## The honest summary

Inventory management is unglamorous and it is one of the main things
that determines whether a product business survives:

- Stock is cash in a different shape.
- The two failures are both cash problems.
- Most of the discipline is counting, reviewing and acting monthly.

A business that does that will have better availability, less dead
stock and more cash than one that does not — with no other advantage.

## The summary

1. Stock is cash you have converted into boxes.
2. Carrying cost is continuous and largely invisible.
3. Dead stock is worse than a stockout, because it is money gone.
4. You cannot manage stock you cannot count; record every movement.
5. Forecast by product, compare to actual, and correct the method.
6. Reorder point uses measured lead time, not quoted.
7. Set safety stock deliberately per product, not uniformly.
8. Be sceptical of variants; each must earn its place with sales.
9. What you paid is gone — sell below cost rather than holding
   forever.
10. Growth consumes cash, and inventory is one of the main
    mechanisms.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Clear It and Improve",
            "description": (
                "Submit:\n"
                "1. Your dead stock rule, and everything currently triggering it.\n"
                "2. The recoverable value of your dead stock now, against holding it "
                "another year.\n"
                "3. What you cleared, by which route, and what you recovered.\n"
                "4. Your write-off treatment, as advised by your accountant.\n"
                "5. For three dead items: what you believed when you ordered, and what "
                "would have told you sooner.\n"
                "6. Your six measures, tracked for three months.\n"
                "7. Stock value against revenue over three months, with whether stock "
                "is growing faster.\n"
                "8. Your forecast errors over three months, with the pattern.\n"
                "9. Supplier terms you have asked to change, and the responses.\n"
                "10. Your growth plan's cash implication for stock, against your cash "
                "forecast.\n\n"
                "Graded on part 3 being real clearance, part 6 being real tracked "
                "data, and part 10 being a genuine cash check."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Dead Stock and Improvement",
            "description": "Four questions on clearing, measuring and scaling.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the only relevant question about dead stock?",
                    "choices": [
                        "What you can recover now — what you paid is gone",
                        "Whether it can be sold at cost",
                        "How long it has been held",
                        "Whether demand might return",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is a warning sign in the monthly stock numbers?",
                    "choices": [
                        "Stockouts on slow-moving items",
                        "Stock value growing faster than revenue",
                        "Turnover varying between products",
                        "Record accuracy below one hundred per cent",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is worse than a marketing campaign that fails?",
                    "choices": [
                        "One that produces low-quality customers",
                        "One that costs more than forecast",
                        "One that succeeds and leaves you unable to supply",
                        "One that cannot be measured",
                    ],
                    "answer": 2,
                },
                {
                    "text": "When should you move to inventory software?",
                    "choices": [
                        "Before the first large order",
                        "As soon as you have more than one product",
                        "When an accountant recommends it",
                        "When multi-channel, volume, multiple people or frequent errors bite — not before",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
