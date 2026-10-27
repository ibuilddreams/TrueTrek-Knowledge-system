"""STU-401: Managing Your Money. Cool Nerds Pathway, Level 4.
Student-facing. Zero-based budgeting, avoiding consumer debt, basic banking.

Carries the same financial-education disclaimer as LS-201/202/203 and the PAR
money courses, and it must survive any edit: this is education, not advice. No
product is named, no rate is quoted as current, no provider is recommended, and
every real decision is routed through a guardian and, where money is at stake,
a regulated professional. Account types, consumer-credit rules, protections and
the age at which anything may be opened or signed differ by country and change,
so the course teaches the mechanism and sends the student to the official
regulator and their own bank for the facts.
"""

MODULES = [
    {
        "title": "Knowing Where It Goes",
        "description": "The measurement that has to come before any plan.",
        "lessons": [
            {
                "title": "Before Anything Else",
                "description": "What this course is and is not.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## Read this first

This is **financial education, not financial advice.**

- No product, bank, app or provider is named or recommended here.
- No interest rate, fee or figure quoted anywhere in this course is
  current. Rates change constantly.
- Rules about accounts, credit, protections and what somebody your age may
  open or sign **differ by country and change**.

For anything specific to you: check your own country's financial
**regulator** and your own bank's published terms, talk to a parent or
guardian, and for a real decision involving real money, talk to a
regulated professional.

Nobody should make a financial decision because a course said so.

## Why bother at this age

Two reasons that are actually true:

**The habits set early.** How you handle twenty pounds a week is how you
will handle two thousand a month. The amounts change; the behaviour
mostly does not.

**The mistakes are cheap now.** Mismanaging a small amount at seventeen
costs almost nothing and teaches the same lesson that costs thousands at
twenty-seven.

## What this course covers

- Finding out where your money actually goes.
- Giving every unit of it a job before it is spent.
- Why consumer debt is the thing to avoid above all else.
- How the basic accounts work, in principle.
- The scams aimed specifically at people your age.

## What it does not

- What to invest in. That is STU-403, and it is also not advice there.
- Tax, which is STU-402.
- Anything about property, which is STU-404.
- Anything specific to your country, which you look up.

## The one thing

If nothing else from this course survives:

**Spend less than you receive, consistently, and do not borrow for things
that do not last.**

Everything else is refinement. Almost every serious money problem people
have at twenty-five comes from breaking one of those two.
""",
            },
            {
                "title": "Tracking",
                "description": "You cannot manage what you have not measured.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Nearly everybody is wrong about this

Ask somebody what they spend on food, or on small purchases, and they
will be wrong — usually by a large margin and usually downward.

Not dishonesty. Small amounts are invisible individually and substantial
in aggregate, and memory does not sum them.

## Track everything for one month

Every amount in and out. No judgement, no changes, just recording.

How:
- A note on your phone, written at the moment of spending.
- Or the bank's own transaction list, if everything goes through one
  account.
- Or a notebook.

The method does not matter. Doing it at the moment rather than from
memory does.

## Then categorise

At the end of the month, sort it:

| Category | Examples |
| --- | --- |
| Fixed | Phone, transport pass, subscriptions |
| Food | Shopping, eating out, coffee |
| Going out | Events, cinema, with friends |
| Things | Clothes, games, equipment |
| Giving | Gifts, contributions |
| Saving | What was left and kept |

Add up each. Most people get at least one genuine surprise, and the
surprise is the point of the exercise.

## What to look for

- **The invisible category.** Many small purchases that sum to more than
  anything you consciously decided.
- **Subscriptions.** Check every recurring payment. People pay for things
  they stopped using months ago.
- **Convenience spending**, which is usually where money leaks.
- **Spending shape.** Is it steady, or all in the three days after money
  arrives?

## Honesty

Nobody sees this but you. A tracking exercise where you quietly omit the
embarrassing purchases produces a document about an imaginary person.

## After the first month

Tracking every transaction forever is unnecessary. After a month or two
you know your pattern.

Then: check weekly against your plan (next lesson), do a full tracking
month once or twice a year, and look properly whenever something changes
— a job, a move, a new commitment.
""",
            },
            {
                "title": "Zero-Based Budgeting",
                "description": "Giving every unit a job before it is spent.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The idea

A normal budget sets limits and hopes. A zero-based budget assigns
**every** unit of income to a specific job before the month starts, until
nothing is unassigned.

Income minus every assignment equals zero. Not zero left in the account —
zero *unallocated*. Saving is one of the jobs.

## Why it works

- There is no vague remainder to disappear.
- Saving happens first rather than from what survives.
- Every spend is a decision you already made, so declining something is
  easy: "that's not in this month" rather than a judgement call
  (STU-105).
- It makes trade-offs visible — more here means less there, explicitly.

## Doing it

Monthly, fifteen minutes:

1. **Income.** What is actually arriving. Only what is certain.
2. **Fixed things first.** Phone, transport, subscriptions, anything
   committed.
3. **Saving next**, not last. A real number, however small.
4. **Essentials.** Food, travel.
5. **Everything else**, in named categories with amounts.
6. **Check it sums to your income exactly.** If it does not, something has
   to change — usually step 5.

## Saving first

The single most effective habit in personal finance: decide the saving
amount before the spending, and move it out of reach on the day money
arrives.

Whatever is left over at the end of the month is almost never what you
intended to save, because spending expands into whatever is available.

## Categories that help

- **A buffer** for things that go wrong — a broken phone, a replacement
  something. Without one, every surprise becomes a crisis or a borrowing
  decision.
- **Irregular costs** divided by twelve: presents, trips, equipment. These
  are predictable annually and surprising monthly.
- **Something enjoyable**, deliberately. A budget with no allowance for
  anything fun is abandoned by week three, which is worse than a looser
  one that lasts.

## It will be wrong

The first three months of any budget are wrong. Adjust rather than
abandon:

- Overspent a category: find where it comes from, this month.
- Consistently overspending the same one: the number was unrealistic.
  Raise it and lower another.
- Income changed: redo it.

## Weekly, five minutes

Compare what you have spent against what you assigned. Five minutes, once
a week, is what makes the difference between a budget and a document.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Measure and Plan",
            "description": (
                "Submit:\n"
                "1. The disclaimer in your own words: what this course is, what it is "
                "not, and where real answers come from.\n"
                "2. Your guess, written first, at what you spend monthly in four "
                "categories.\n"
                "3. One month of tracking every amount in and out, recorded at the "
                "moment.\n"
                "4. Those transactions categorised, with totals.\n"
                "5. The gap between your guess and the reality, by category.\n"
                "6. Every recurring payment you have, with whether you still use it.\n"
                "7. Your invisible category: the small purchases that summed to more than "
                "you expected.\n"
                "8. A zero-based budget for next month, summing exactly to your income, "
                "with saving placed before spending.\n"
                "9. Your buffer amount and your annual irregular costs divided by twelve.\n"
                "10. Four weekly five-minute checks, with what you adjusted.\n\n"
                "Graded on part 3 being a real contemporaneous record and part 8 summing "
                "exactly."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Knowing Where It Goes",
            "description": "Four questions on the disclaimer, tracking and budgeting.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Where should answers specific to your own money come from?",
                    "choices": [
                        "Your country's financial regulator, your bank's published terms, a guardian, and a regulated professional",
                        "This course, applied to your situation",
                        "The most popular personal finance resources online",
                        "Whichever bank you already use",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why is memory a poor guide to spending?",
                    "choices": [
                        "People deliberately understate it",
                        "Small amounts are invisible individually, substantial in aggregate, and memory does not sum them",
                        "Most spending is irregular",
                        "Bank statements lag behind purchases",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does 'zero' mean in zero-based budgeting?",
                    "choices": [
                        "Nothing left in the account at month end",
                        "No borrowing of any kind",
                        "Zero unallocated income — every unit has an assigned job, including saving",
                        "No spending outside fixed categories",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does a budget with no allowance for anything enjoyable fail?",
                    "choices": [
                        "It understates real costs",
                        "It cannot absorb surprises",
                        "It makes saving feel punitive",
                        "It is abandoned by week three, which is worse than a looser one that lasts",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Debt",
        "description": "The thing to avoid above all else at this stage.",
        "lessons": [
            {
                "title": "How Borrowing Actually Works",
                "description": "The mechanism, in principle.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The mechanism

You receive money now and repay more later. The extra is interest, and it
is the price of having it sooner.

Two things determine how expensive that is: the **rate**, and **how long**
you take to repay. The second matters more than people expect — a modest
rate over several years costs a great deal.

Compound interest works against you here exactly as it works for you in
STU-403. The same mechanism, pointed the other way.

## Minimum payments

Most revolving credit lets you pay a small minimum each month. Paying only
the minimum can extend a debt for years and multiply what you ultimately
repay.

The published figures for this are on your own provider's statement,
which by law in many countries must show what minimum payments cost you.
Read that section of a real statement — it is the single most educational
document in personal finance.

## Good and bad borrowing

A rough and useful distinction:

**Possibly reasonable:** borrowing for something that lasts or increases
what you can earn — education, in some systems, or a home (STU-404). Even
then, only on terms you have read and can afford.

**Almost never reasonable:** borrowing for something consumed quickly —
clothes, a holiday, going out, a phone upgrade, a gift. You finish paying
long after the thing is gone.

## The specific traps for your age group

- **Buy-now-pay-later.** Frictionless, feels unlike borrowing, easy to
  accumulate across several providers at once, and missed payments can
  have consequences. It is credit.
- **Overdrafts** used routinely rather than as an emergency.
- **High-cost short-term lending**, which is specifically dangerous.
- **Borrowing from friends**, which costs the friendship more often than
  the money (STU-304).
- **Anybody offering easy money.** Module 3.

## If you already owe something

Not a disaster and not shameful:

- Write down every debt: who, how much, the rate, the minimum payment.
  Most people avoid this list and it is the first step.
- Pay more than the minimum wherever you can.
- Talk to a **free, regulated debt advice service** — most countries have
  one, and it is free and confidential.
- Tell a parent or guardian. This is the step people delay longest and
  regret delaying.
- **Never** take new borrowing to pay old borrowing without proper advice.

## Never borrow to

- Invest, trade, or buy anything speculative. This is how people lose more
  than they had (STU-403).
- Start a first business (STU-303).
- Impress anybody.
- Gamble. If gambling is involved at all, that is a separate and serious
  problem — tell an adult and contact a gambling support service in your
  country.
""",
            },
            {
                "title": "Why Things Cost More Than the Price",
                "description": "Spending decisions, clearly.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Price in hours

A useful conversion: divide the price by what you earn an hour.

A £60 thing is six hours of a £10/hour job. Not an argument against buying
it — an argument for knowing what you are trading, which "£60" does not
convey.

## Wants and needs

The distinction is real and the line is personal. Useful test: *if I did
not buy this, what would actually happen?*

- Nothing: want.
- A genuine problem: need.

Both are legitimate. Confusing them is what causes trouble, and almost
everybody classifies a want as a need at the moment of buying it.

## The delay

The most effective single technique in spending:

**For anything above a threshold you set — £30, £50, whatever fits your
income — wait 48 hours.**

A large share of the time you will not want it. The desire was the moment,
not the object.

For very large purchases, make it a week.

## How spending is engineered

Worth knowing, because it is designed by people who are good at it:

- **Saved cards and one-tap buying** remove the friction that would have
  made you think.
- **Scarcity and countdowns** manufacture urgency.
- **"Only £X a month"** reframes a large cost as a small one.
- **Free delivery thresholds** make you spend more to save less.
- **Recommendations after purchase**, when you are already in a buying
  frame.
- **Advertising shown to you specifically**, based on what you looked at.

None of this is a conspiracy; it is just a professionalised industry
pointed at your attention. Recognising a technique substantially reduces
its effect.

## Practical defences

- Remove saved payment details, so each purchase takes a minute.
- Unsubscribe from marketing emails.
- Do not shop when bored, upset or late at night (STU-106).
- Keep a list of things you want and revisit it monthly; most items fall
  off.

## Spending on other people

- Buying friendship does not work and is noticed.
- Do not lend what you cannot afford to lose — treat it as a gift or do
  not do it (STU-304).
- You can decline expensive plans. "I can't do that this month" is a
  complete sentence (STU-105).

## It is allowed to spend money

This is not an argument for spending nothing. Money is for using.

The point is that it should go to things you actually chose, which is
exactly what a budget makes possible.
""",
            },
            {
                "title": "Saving and the Buffer",
                "description": "The thing that prevents most money problems.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The emergency fund

The most valuable thing in personal finance and the least exciting: money
set aside for things that go wrong.

**What it prevents:** a broken phone, a lost job, an unexpected cost
becoming a borrowing decision. Almost every debt spiral starts with a
surprise and no buffer.

**How much:** adults are commonly advised to hold several months of
essential costs. For a student, a smaller specific target — enough to
replace the thing most likely to break, plus a month of your committed
costs — is realistic and genuinely protective.

**Where:** somewhere accessible and separate from day-to-day money. Not
invested; this one is not about returns (STU-403).

## Pay yourself first

Move the saving on the day money arrives, automatically if your bank
allows it.

Everybody intends to save what is left and almost nobody has anything
left. Spending expands to fill available money; the only reliable defence
is reducing what is available.

## Separate the pots

Saving with no purpose gets spent. Saving with a name usually does not:

- Emergency buffer.
- A specific thing you want.
- Something a year out — a trip, a course, equipment.

Separate accounts or clearly separate amounts. The naming is doing real
psychological work and it is worth the small effort.

## Small amounts matter

Saving five pounds a week feels pointless and is not: it is the habit that
matters now, because the habit is what will be running when the amounts
are large.

Somebody who saves consistently on a small income reliably outperforms
somebody who intends to start when they earn more. The second person
almost never starts, because costs rise with income.

## Where to keep it

A general principle rather than advice: money you might need within a
year or two should be somewhere **accessible and not at risk of losing
value**. Money for much later is a different question (STU-403).

For what is actually available to somebody your age, in your country, with
what protections: **ask your bank, check your country's regulator, and
involve a parent or guardian.** Do not take account recommendations from a
course, a video, or anybody paid to refer you.

## When saving is not possible

Sometimes there is genuinely nothing spare. That is a real situation and
not a personal failing.

- Save something, even a very small amount, for the habit.
- Focus on not acquiring debt, which matters more than saving.
- If money is a real problem at home, there may be school, local or
  government support available — your school's staff will know, and asking
  is not shameful.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Debt, Spending, Saving",
            "description": (
                "Submit:\n"
                "1. How interest works, in your own words, and why the repayment period "
                "matters as much as the rate.\n"
                "2. A real statement's minimum-payment section read, with what it showed "
                "— yours, a family member's with permission, or a published example.\n"
                "3. The distinction between borrowing for something lasting and something "
                "consumed, with an example of each from real life.\n"
                "4. The traps aimed at your age group, with any you have used.\n"
                "5. Your country's free regulated debt advice service, named, with how to "
                "contact it.\n"
                "6. Ten recent purchases converted into hours of your own earnings.\n"
                "7. Three things you wanted, put through the 48-hour delay, with what you "
                "decided.\n"
                "8. Six spending techniques you can identify being used on you, with "
                "examples.\n"
                "9. Your buffer target, where it is held, and how you will get there.\n"
                "10. Your pay-yourself-first amount, and proof it moved on the day money "
                "arrived for four weeks.\n\n"
                "Graded on part 2 being a real document and part 10 being four real "
                "transfers."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Debt",
            "description": "Four questions on borrowing, spending and saving.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What determines how expensive borrowing is?",
                    "choices": [
                        "The rate and how long you take to repay — the second matters more than people expect",
                        "The rate alone",
                        "The size of the original amount",
                        "Whether the lender is regulated",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is true of buy-now-pay-later?",
                    "choices": [
                        "It is interest-free, so it is not borrowing",
                        "It is credit — frictionless, easy to accumulate across providers, and missed payments can have consequences",
                        "It is safer than an overdraft in all cases",
                        "It only applies to large purchases",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the most effective single technique in spending decisions?",
                    "choices": [
                        "Comparing prices across sellers",
                        "Paying in cash rather than by card",
                        "Waiting 48 hours above a threshold you set",
                        "Setting a monthly limit per category",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does an emergency buffer matter more than it sounds?",
                    "choices": [
                        "It earns a return over time",
                        "It demonstrates discipline to lenders",
                        "It covers predictable annual costs",
                        "Almost every debt spiral starts with a surprise and no buffer",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Accounts and Protection",
        "description": "How banking works, and the scams aimed at you.",
        "lessons": [
            {
                "title": "Basic Banking",
                "description": "The principles, with the specifics looked up.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Again: no products here

Account names, features, eligibility ages, fees and protections differ by
country and by provider and they change. Nothing below is a recommendation
and no figure is quoted.

What follows is the set of **concepts** and the set of **questions to
ask** — and you ask them of your own bank, your country's regulator, and a
parent or guardian.

## The kinds of account, in principle

- **A day-to-day account** for money coming in and going out.
- **A savings account**, intended to be left alone, usually paying
  something.
- **Accounts for people under 18**, which exist in most countries with
  different rules and usually require a parent or guardian.
- **Tax-advantaged accounts**, which some countries offer for saving or
  investing. Entirely country-specific — look yours up (STU-402).

## Questions to ask before opening anything

1. What does it cost — monthly fees, transaction fees, overdraft charges?
2. What are the eligibility rules for my age?
3. Does it come with an overdraft, and is it opt-in?
4. Can I access the money, and how quickly?
5. Is my money protected if the provider fails, and up to what limit under
   my country's scheme?
6. Is this provider regulated in my country, and how do I check on the
   regulator's own register?

Question six is not optional. Anybody can build a convincing app.

## Reading a statement

Learn to do this properly:

- Every transaction, checked against what you remember.
- Anything you do not recognise, queried the same day.
- Fees and charges, which are frequently overlooked.
- Recurring payments.

Monthly, ten minutes.

## Security

- Never share a password, PIN or one-time code. **Nobody legitimate will
  ever ask for one** — not your bank, not the police, not anybody.
- Different passwords for banking than for anything else.
- Two-factor authentication on.
- Do not do banking on public wifi.
- Check your own bank's genuine phone number from your card or its
  official site, never from a message you received.

## If something goes wrong

- Contact your bank immediately, through a number you looked up yourself.
- Report unauthorised transactions straight away; protections frequently
  depend on reporting promptly.
- Tell a parent or guardian.
- Keep records of everything.

## Your own money, in a family

In many families, money is shared, managed by parents, or contributed to
collectively. That is normal and varies by culture.

What is worth having regardless: knowing what you have, what is yours,
what is expected of you, and having that conversation openly rather than
assuming (STU-104).
""",
            },
            {
                "title": "Scams",
                "description": "Recognising what is aimed at you.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Why this lesson

Young people are specifically targeted, and the main defence is
recognising the shape rather than knowing every variant — the variants
change monthly.

## The shapes

**Anything guaranteed.** Guaranteed returns, guaranteed profit, guaranteed
job, guaranteed visa. Nothing is guaranteed. The word itself is the
warning (STU-204, STU-208).

**Urgency.** Decide now, offer ends tonight, your account will be closed.
Pressure exists to prevent you checking, which is the one thing that would
stop it.

**Secrecy.** Do not tell your parents. Do not tell the bank. Keep this
between us. **Always** a scam, with no exceptions worth considering.

**Upfront payment.** A fee to receive money, to get a job, to release a
prize, to unlock an account.

**Someone you have not met in person**, asking for money, however long
you have been talking.

**Being asked to move money through your account.** This is called money
muling, it is a crime you would be committing, and it is pitched to
students as easy money. You can be prosecuted, lose banking access for
years, and the people recruiting you know that.

**Too-good returns on an investment.** STU-403 covers this; the short
version is that unusually high returns always carry unusually high risk,
whatever the pitch says.

**Someone contacting you claiming to be your bank, the police, or a tax
authority**, asking you to move money "to a safe account". No legitimate
body does this, ever.

## Online and social

- Fake shops on social platforms.
- "Investment mentors" and signal groups, including ones run by people
  your age (STU-302).
- Ticket and goods sales from strangers.
- Accounts hacked and the owner's friends messaged for money. Verify by
  phoning the person.
- Romance approaches that turn into money requests.

## The rules

1. **Never pay to receive money.**
2. **Never share a code, password or PIN.**
3. **Never let anybody use your account.**
4. **Never decide under time pressure.**
5. **Never keep a money matter secret from a parent or guardian.**
6. **Check the organisation independently**, on your country's regulator
   register.
7. **If you are being told to hurry and to keep quiet, it is a scam.**
   Both together, always.

## If it has happened

- Tell a parent or guardian immediately. This is the step shame delays,
  and delay is what makes it worse.
- Contact your bank straight away.
- Report it to your country's fraud reporting service and the police.
- Keep every message.
- **You are not stupid.** These are designed by professionals and they
  work on adults, including careful ones. The only mistake would be not
  telling anybody.
""",
            },
            {
                "title": "Building the Habit",
                "description": "What to carry forward.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The monthly routine

Thirty minutes, once a month, for the rest of your life:

1. Read the statement, line by line.
2. Check spending against the budget.
3. Move the saving.
4. Check recurring payments.
5. Update the budget for next month.

That routine, done consistently, prevents the large majority of personal
money problems.

## The annual review

- What did I earn, spend and save this year?
- Did the buffer grow?
- Any debt? Is it reducing?
- Have I checked what my country offers that I am not using — accounts,
  support, allowances (STU-402)?
- What was the largest avoidable waste?

## When your income changes

The dangerous moment is income rising, because costs expand to meet it
automatically unless you decide otherwise.

When you start earning more:

- Decide in advance what proportion of the increase is saved.
- Increase the saving before the spending.
- Avoid committing the increase to anything recurring immediately.

People who do this at the first pay rise are in a structurally different
position ten years later from people who do not.

## Talking about money

A habit worth building: money is treated as unmentionable, which protects
nobody except people selling things.

- Ask family how they manage it.
- Ask what people earn in fields you are considering, which is legitimate
  research (STU-206).
- Say honestly when you cannot afford something (STU-105).
- Help a friend who is struggling by pointing them at free regulated
  advice, not by lending.

## Where to learn more

- Your country's financial regulator usually publishes free, neutral
  consumer guidance. This is the best source available and almost nobody
  uses it.
- Free money advice charities.
- Your bank's own published terms, read properly.
- **Not** social media finance content, which is overwhelmingly either
  wrong, advertising, or both (STU-302).

## The summary

1. This is education, not advice; real answers come from the regulator,
   your bank, a guardian and a professional.
2. Spend less than you receive; do not borrow for things that do not last.
3. Track a full month before planning anything.
4. Zero-based budget: every unit assigned, saving before spending.
5. A buffer prevents most money problems.
6. Price things in hours; wait 48 hours above a threshold.
7. Minimum payments extend debt for years.
8. Check any provider on your country's regulator's own register.
9. Hurry plus secrecy equals scam, every time.
10. Thirty minutes a month, and raise the saving before the spending when
    income rises.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Accounts, Safety, Routine",
            "description": (
                "Submit:\n"
                "1. The six questions to ask before opening an account, answered for an "
                "account available to someone your age in your country, from the "
                "provider's own published terms.\n"
                "2. How you would check that a provider is regulated, with the register "
                "you would use.\n"
                "3. What protection scheme exists in your country if a provider fails, and "
                "its limit — from an official source.\n"
                "4. A real statement read line by line, with anything you could not "
                "identify.\n"
                "5. Your security checklist, applied, with what you changed.\n"
                "6. The seven scam rules in your own words.\n"
                "7. What money muling is, why it is a crime, and what it would cost you.\n"
                "8. Your country's fraud reporting service, named, with how to contact "
                "it.\n"
                "9. Your monthly thirty-minute routine, scheduled, with one completed.\n"
                "10. Your written rule for what happens to the first pay rise you get.\n\n"
                "Graded on parts 1, 2, 3 and 8 citing official sources with dates."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Accounts and Protection",
            "description": "Four questions on banking, scams and routine.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What combination always indicates a scam?",
                    "choices": [
                        "Being told to hurry and to keep it secret",
                        "An offer that arrives unsolicited",
                        "A request for identity documents",
                        "Contact from an unfamiliar number",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is money muling?",
                    "choices": [
                        "Borrowing to lend to somebody else at a higher rate",
                        "Letting money be moved through your account — a crime you would be committing, pitched to students as easy money",
                        "Holding cash for somebody temporarily",
                        "Transferring money abroad without declaring it",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the dangerous moment for a budget?",
                    "choices": [
                        "An unexpected large expense",
                        "A month with irregular costs",
                        "Income rising, because costs expand to meet it unless you decide otherwise",
                        "Losing track for a few weeks",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the best source of neutral consumer money guidance?",
                    "choices": [
                        "Your bank's relationship team",
                        "Established personal finance creators",
                        "Comparison websites",
                        "Your country's financial regulator, which publishes it free and almost nobody uses it",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
