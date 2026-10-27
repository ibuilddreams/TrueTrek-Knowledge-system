"""ENT-105: Lean Startup Methodology. Entrepreneur Pathway, Level 1.
Build-measure-learn, minimum viable products, rapid prototyping.

Closes Level 1 of the Entrepreneur Pathway. Same founder audience as ENT-101.
ENT-102 covers validation before building — interviews, assumptions, the ask
for money; this course picks up at the point where the evidence supports making
something, and covers the build loop, what an MVP actually is, measurement and
the pivot/persevere decision. The two overlap by design and each points at the
other; keep the interview technique in ENT-102 and the build mechanics here.
"""

MODULES = [
    {
        "title": "The Loop",
        "description": "Build, measure, learn — and why the order is backwards.",
        "lessons": [
            {
                "title": "What the Loop Is For",
                "description": "Reducing uncertainty, not producing features.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The problem it solves

The traditional way of starting something: plan thoroughly, build it
properly, launch, find out whether anybody wants it.

The flaw is the last step. Everything before it was spent on an
untested assumption, and if the assumption was wrong the whole
investment is gone.

## The alternative

Work in short cycles, each designed to **answer a question**:

**Build** the smallest thing that produces an answer → **measure** what
actually happens → **learn** and decide what to do next → repeat.

Each loop should be weeks, not months.

## The order is backwards

The name says build-measure-learn and the thinking runs the other way:

1. **Learn:** what is the riskiest thing I do not know (ENT-102)?
2. **Measure:** what observation would tell me?
3. **Build:** what is the smallest thing that produces that
   observation?

Founders who start at "build" produce features and learn nothing.
Starting at "what do I need to know" is the entire discipline.

## What counts as learning

**Validated learning** — something you now know because of what people
actually did:

- Eleven of forty people paid.
- Nobody came back after the first use.
- They all used it for something other than what it was for.

Not learning:

- "People seem interested."
- "The feedback was positive."
- "I think we're onto something."

The test: could you state it as a fact about behaviour, with a number?

## Why speed matters

The number of loops you complete before running out of money, time or
morale is roughly what determines whether you find something that works.

Which means every week spent polishing is a loop you did not run, and
cycle time is a more important metric than almost anything else
(ENT-104).

## Where it does not apply neatly

Honest caveat. The loop assumes you can build something small and show
it quickly. That is harder when:

- The product is regulated, physical or safety-critical.
- Customers are large organisations with long buying cycles.
- A partial version is genuinely useless.

The principle still holds — test the riskiest assumption cheapest — but
the test may be a prototype, a letter of intent, or a paid pilot rather
than a working product (ENT-102).
""",
            },
            {
                "title": "The Minimum Viable Product",
                "description": "The most misunderstood term in the pathway.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## What it is

The **smallest thing you can put in front of a real person that answers
your riskiest question.**

That is the definition. Everything else follows from it.

## What it is not

- Not a cut-down version of the finished product.
- Not version one of a roadmap.
- Not a prototype nobody sees.
- Not "the product but with fewer features".
- Not something that takes six months.

The common mistake: treating MVP as a smaller build, when it is
frequently not a build at all.

## Forms it takes

Ordered by cost, cheapest first:

**A conversation with a mock-up.** Drawings, slides, a single page.
Enough to show the idea and get a reaction — including a reaction to a
price.

**A landing page.** Describe the thing, ask for sign-ups or pre-orders,
count. Tests whether the proposition interests anybody.

**Doing it manually.** The most underused and most informative. Deliver
the service entirely by hand for one customer. Nothing is built, and you
learn what actually matters (ENT-102).

**A manual back end.** Customers see a product; behind it you are doing
the work by hand. Normal, and several large companies started this way.

**A single-feature product.** One thing, done properly.

**A paid pilot.** For larger customers, where a real product is not
feasible: a scoped, paid engagement that tests both value and
willingness to pay.

## Viable means something

The "viable" part matters: it has to actually deliver the benefit, or
you learn nothing except that a broken thing is unpopular.

Small in scope. Not bad at what it does.

## The embarrassment test

> *"If you are not embarrassed by the first version, you launched too
> late."*

Useful with one qualification: embarrassed by its **scope** — how
little it does, how rough it looks — not by it being broken,
misleading, or unsafe.

Never ship something that loses somebody's data, takes money without
delivering, or is dangerous. Those are not MVPs, they are failures.

## Charging from the start

Where you can, charge for the MVP, however little.

Payment is the only reliable signal (ENT-102), and a free product
attracts people who would never pay and produces feedback from exactly
the wrong group.

## Who to show it to

Not everybody. A small number of people with the problem, who you can
talk to properly afterwards.

Ten engaged users tell you more than a thousand who tried it once.
""",
            },
            {
                "title": "Prototyping Fast",
                "description": "Making something this week.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Time-box it

Decide the duration before starting: *"two weeks, then it goes in front
of somebody."*

Without a box, scope expands continuously and nothing is shown. The
deadline is what forces the scope decisions, and the scope decisions are
where the thinking is.

## Cut hard

For each feature: *if this were missing, would the thing still answer my
question?*

If yes, cut it. Almost everything gets cut. A first version typically
does one thing for one kind of person in one situation.

Specifically defer:

- Accounts and logins, where you can.
- Settings and options.
- Anything "for later scale".
- Design beyond legible and unembarrassing.
- Automating what you can do by hand.
- Edge cases.

## Do it by hand

The strongest technique in this course: **before building anything,
deliver it manually to one real customer.**

- You find out what actually matters, which is never what you assumed.
- You get revenue before you write anything.
- You learn the process before automating it (ENT-104).
- If it turns out nobody wants it, you lost a week.

Founders skip this because it does not scale. It is not supposed to
scale; it is supposed to teach you.

## Use what exists

Build as little as possible:

- Existing tools, assembled, before anything custom.
- Spreadsheets and forms before software.
- Messaging and email before a platform.
- Templates before design.

The question is never "what would be impressive to have built", it is
"what is the fastest route to the answer".

## Finishing

Most prototypes die at ninety per cent, because the last part is dull
and the next idea is interesting (STU-205).

- Define "done" as "a real person can use it to get the benefit".
- Resist additions once building has started; write them on a list
  instead.
- Ship it, then improve.

## Getting it in front of people

Decide this before you build, not after:

- Who are the first ten, by name (ENT-102)?
- How will you contact them?
- What will you ask them to do?
- What will you measure (Module 2)?

A finished prototype with no route to users is the most common dead end
in this pathway, and it is entirely avoidable by answering those four
questions first.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Build the Smallest Thing",
            "description": (
                "Submit:\n"
                "1. The loop in the correct order — learn, measure, build — applied to "
                "your riskiest open question.\n"
                "2. Three things you currently believe, rewritten as validated learning "
                "or marked as unvalidated.\n"
                "3. Your MVP, defined, with which of the six forms it takes and why.\n"
                "4. Everything you cut, with the question each would not have helped "
                "answer.\n"
                "5. Your time box, and whether you held it.\n"
                "6. The manual delivery to one real customer, with what surprised you.\n"
                "7. What you assembled from existing tools rather than building.\n"
                "8. Whether you charged, how much, and how many paid.\n"
                "9. Your first ten users by name, how you contacted them, and what you "
                "asked them to do — written before you built.\n"
                "10. The thing shipped, with the version that embarrassed you and why it "
                "was scope rather than quality.\n\n"
                "Graded on part 6 having genuinely happened and part 9 being written "
                "before the build."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: The Loop",
            "description": "Four questions on the loop, MVPs and prototyping.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "In what order should the loop actually be thought through?",
                    "choices": [
                        "Learn, measure, build — what do I need to know, what would tell me, what is the smallest thing that produces it",
                        "Build, measure, learn, as the name says",
                        "Measure, learn, build",
                        "Build, learn, measure",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is a minimum viable product?",
                    "choices": [
                        "A cut-down version of the finished product",
                        "The smallest thing you can put in front of a real person that answers your riskiest question",
                        "Version one of the roadmap",
                        "A working prototype with the core features",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What should the first version embarrass you about?",
                    "choices": [
                        "Nothing — it should be presentable",
                        "Its reliability under load",
                        "Its scope — how little it does — never its being broken, misleading or unsafe",
                        "Its pricing",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why deliver the thing manually before building it?",
                    "choices": [
                        "It is cheaper to run",
                        "It keeps customers closer",
                        "It avoids technical debt",
                        "You learn what actually matters, get revenue first, and lose only a week if nobody wants it",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Measuring",
        "description": "Knowing what actually happened.",
        "lessons": [
            {
                "title": "What to Measure",
                "description": "Numbers that mean something.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Decide before you launch

What would mean this is working? Write the number down first
(ENT-102).

Afterwards, everything looks like evidence of something, and whichever
number happens to be highest becomes the one you quote.

## Vanity numbers

Go up, feel good, mean nothing:

- Total sign-ups ever.
- Page views.
- Followers (STU-302).
- Downloads.
- "Interest".
- Cumulative totals of anything, which only ever rise.

They are not lies; they are just uninformative, and they are what people
report when the real numbers are bad.

## Numbers that mean something

- **Did they use it?** Not signed up — used.
- **Did they come back?** The single most informative number for most
  products.
- **Did they pay?**
- **Did they keep paying?**
- **Did they tell somebody?**
- **What proportion of the people who saw it did each of those?**

Proportions, not totals. "Forty people signed up" tells you nothing
without knowing how many were asked.

## The conversion chain

Map the whole path and measure each step:

> Heard about it → looked → tried → used properly → came back → paid →
> stayed

Measuring only the ends tells you something is wrong. Measuring each
step tells you where, which is the only actionable version.

## Cohorts

Compare groups of users by when they started, rather than looking at
everybody together.

A total that is rising can hide the fact that each new group behaves
worse than the last. Cohorts make that visible; aggregates hide it, and
aggregates are what most founders look at.

## Keep it small

Three to five numbers, reviewed weekly. Not a dashboard of forty.

Pick the one number that best represents whether the business is
working, and watch it closely. For most early businesses that is paying
customers who come back.

## Qualitative too

Numbers tell you what happened; people tell you why:

- Talk to users who stayed and users who left. The second group is more
  informative and harder to reach.
- Ask: *"What nearly stopped you using this?"*
- Watch somebody use it without helping them. Uncomfortable, and more
  informative than any survey.

## Honesty

Warning signs (ENT-103):

- Quoting totals rather than rates.
- Changing the metric when it looks bad.
- Excluding users who did not work out.
- Counting friends and family.
- Reporting the best week as though it were typical.
""",
            },
            {
                "title": "Running an Experiment",
                "description": "Testing one thing properly.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The structure

1. **The question.** One, specific.
2. **The assumption** being tested (ENT-102).
3. **The prediction**, with a number.
4. **What you will do.**
5. **What you will measure.**
6. **The threshold** that means yes, and the one that means no.
7. **The time limit.**

Written down before starting. An experiment without a written threshold
is just doing something and feeling about it afterwards.

## An example

> **Question:** will small clinics pay for this monthly?
> **Assumption:** the problem is painful enough to pay for.
> **Prediction:** at least 3 of 20 approached will start a paid trial.
> **Action:** contact 20 clinics, offer a paid month at £40.
> **Measure:** number who pay.
> **Threshold:** 3+ = continue; 1–2 = unclear, test the price; 0 = the
> assumption is wrong.
> **Time:** three weeks.

Unambiguous in advance, which is the entire point.

## One variable

Change one thing at a time. If you change the price, the message and the
customer simultaneously and the result improves, you have learnt
nothing you can act on.

Slower, and it is the only version that produces knowledge.

## Enough people

Three users is an anecdote. You do not need statistical rigour at this
stage, but you need enough that one unusual person does not decide it.

Rough guidance: twenty for a qualitative signal, more if the differences
are small. Be more cautious about a result that is close to the
threshold than one that is clear.

## Small, frequent

Many small experiments beat one large one:

- Faster answers.
- Cheaper to be wrong.
- Easier to attribute the result.
- Morale survives a failed small test.

One week per experiment is a good target early on (ENT-104).

## Negative results

A test showing it does not work is a success. You spent three weeks
instead of a year (ENT-103).

Record it properly: what you tested, what happened, what you concluded,
what you would try next. A record of twelve experiments is a genuine
asset and most founders keep none.

## Common mistakes

- No threshold written in advance.
- Stopping early because it looked good.
- Extending it because it looked bad.
- Testing something you were going to do anyway.
- Testing the comfortable assumption rather than the fatal one.
- Running it on friends.
""",
            },
            {
                "title": "Learning From It",
                "description": "Turning the result into a decision.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The step that gets skipped

Many founders build and measure and then start the next build without
ever deciding what the last result meant.

The learn step is a deliberate act: sit down, look at the data, write
down what you now know.

## The questions

After each loop:

- What did we predict, and what happened?
- Which assumption is now confirmed or refuted?
- What do we now know that we did not?
- What is the next riskiest unknown?
- What is the next experiment?

Fifteen minutes, written down. Without the writing it does not
accumulate and the same thing gets retested a year later.

## Three outcomes

**Confirmed.** The assumption held. Move to the next riskiest unknown
and build a bit more.

**Refuted.** It did not. Something changes — Module 3.

**Unclear**, which is the most common. Diagnose before acting:

- Was the test badly designed?
- Were there too few people?
- Did they understand what was being offered?
- Was it the right people?

Frequently the correct response is to rerun a better-designed version
rather than to change the business.

## Separating signal from noise

- One enthusiastic user is not a signal.
- One angry user is not a signal.
- A pattern across ten is.
- The loudest feedback is rarely the most representative.
- What people **do** outweighs what they **say**, always.

## Feature requests

Users will ask for things. Treat requests as information about a
problem rather than as instructions:

- Ask *why* they want it, which frequently reveals a different need.
- Count how many ask for the same thing.
- Weight requests from people who pay far above those from people who do
  not.
- Do not build something because one customer asked loudly.

## Building a knowledge base

One running document:

| Date | Assumption | Test | Result | Conclusion |

After a year this is the most valuable thing you own: it stops you
repeating tests, it shows your pattern of error, and it is what makes
your judgement better than a beginner's (STU-305).

## When the loop stops being useful

Once the fundamentals are validated — people want it, they pay, you can
reach them — the emphasis shifts from testing to delivering and
improving.

The loop does not disappear; it applies to each new feature, price and
market. But a business that is still questioning whether anybody wants
it in year three has not been reading its own results (ENT-103).
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Measure and Learn",
            "description": (
                "Submit:\n"
                "1. Five vanity numbers you could report, and the real numbers behind "
                "each.\n"
                "2. Your conversion chain, with every step and a measurement for each.\n"
                "3. Your three to five core numbers, and the single one that best "
                "represents whether this is working.\n"
                "4. A cohort comparison, or an explanation of what you would need to "
                "produce one.\n"
                "5. A full experiment written to the seven-part structure, before "
                "running it.\n"
                "6. The experiment run, with the actual result against your written "
                "threshold.\n"
                "7. Proof you changed one variable only.\n"
                "8. Your written learn step: the five questions answered.\n"
                "9. Three users interviewed — including at least one who stopped using "
                "it — with what nearly stopped them.\n"
                "10. Your experiment log, with every test so far.\n\n"
                "Graded on part 5 being written before part 6, and part 9 including "
                "somebody who left."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Measuring",
            "description": "Four questions on metrics, experiments and learning.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is wrong with vanity numbers?",
                    "choices": [
                        "They are uninformative, and they are what people report when the real numbers are bad",
                        "They are usually inaccurate",
                        "They are difficult to track reliably",
                        "They only apply to consumer products",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why use cohorts rather than aggregate totals?",
                    "choices": [
                        "Aggregates are harder to calculate",
                        "A rising total can hide each new group behaving worse than the last",
                        "Cohorts are required for forecasting",
                        "Totals exclude users who churn",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is an experiment without a written threshold?",
                    "choices": [
                        "A useful qualitative exercise",
                        "A valid test with a subjective outcome",
                        "Just doing something and feeling about it afterwards",
                        "A pilot rather than an experiment",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the most common experiment outcome, and the right response?",
                    "choices": [
                        "Refuted — change the business",
                        "Confirmed — build more",
                        "Refuted — rerun with more users",
                        "Unclear — diagnose the test, and frequently rerun a better-designed version",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Pivot or Persevere",
        "description": "The decision the whole method exists to inform.",
        "lessons": [
            {
                "title": "Reading the Evidence",
                "description": "Deciding what the results actually say.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The regular decision

At each review point, one of three:

- **Persevere.** Keep going, next experiment.
- **Pivot.** Change something fundamental.
- **Stop** (ENT-103).

Make it a scheduled decision with written criteria rather than a mood
that accumulates (STU-305).

## Signs to persevere

- The numbers are moving in the right direction, even slowly.
- Users who try it come back.
- Somebody has paid, and some have paid again.
- You are learning something each loop.
- The remaining problems are execution problems rather than demand
  problems.

Slow progress is progress. The long middle is not failure (ENT-101).

## Signs to pivot

- Loops are running but nothing moves.
- People try it once and do not return.
- Nobody will pay at any price you can deliver for.
- The same objection keeps appearing.
- Your users are a different group from the one you aimed at — **which
  is frequently a signal rather than a problem.**
- They use it for something other than its purpose, consistently. That
  something is usually the real business.

## Signs to stop

- Several pivots, no traction.
- The arithmetic cannot work (ENT-102).
- You cannot reach customers affordably.
- Resources are nearly out and nothing indicates a turn.
- It is damaging your health, finances or relationships (ENT-103).

## Not a feeling

The decision is made against evidence and criteria written in advance,
not against how this week went.

- Good week, no underlying change: not a reason to persevere.
- Bad week, underlying numbers improving: not a reason to pivot.

Look at the trend across loops, which is why the experiment log matters
(Module 2).

## Ask somebody

- Somebody who knows the market: is this normal at this stage?
- Somebody who knows you: am I repeating my pattern?
- Somebody unsentimental: what does this evidence say?

Give them the numbers, not your interpretation. Their reading will
frequently differ, and theirs is usually right (ENT-101).

## Timing

Common errors in both directions (ENT-103):

- **Pivoting too soon**, before the test was fair, every time something
  is hard.
- **Pivoting too late**, after a year of evidence, because changing
  feels like admitting the original was wrong.

The written criteria resolve both.
""",
            },
            {
                "title": "How to Pivot",
                "description": "Changing one layer, not everything.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## Change the smallest thing

A pivot is not starting over. Identify which layer is actually wrong and
change that one (STU-305):

**Customer.** Same solution, different group. The most common and
frequently the right one — particularly when a group you did not target
is using it.

**Problem.** Same customer, different problem. You know them; you picked
the wrong pain.

**Solution.** Right customer and problem, wrong approach.

**Price or model.** Same everything, different pricing — a subscription
instead of one-off, higher, much higher, or sold to a different payer.

**Channel.** Same everything, a different way of reaching them. Many
"nobody wants this" conclusions are actually "nobody heard about this".

**Scope.** One feature people love becomes the whole product, or the
product becomes part of something larger.

Most situations needing "a complete rethink" are a customer or a channel
problem.

## Keep what works

Before pivoting, write down what the evidence actually supports:

- Which users liked it, and which part.
- What people did pay for.
- Which part of the message landed.
- Who responded at all.

A pivot built on the one thing that worked is far better than one built
on a new idea (ENT-102).

## Then go back to validating

A pivot creates new assumptions, and they are untested:

- New customer means new interviews.
- New problem means new validation.
- New price means a new ask.

Do not skip this because you did it once. The most common post-pivot
error is building the new version on the old version's evidence.

## Tell people

- **Existing customers**, with notice, and honour what you promised them
  (STU-307).
- Anybody who backed you.
- Anybody depending on you.

A pivot handled well keeps relationships; one that silently abandons
people does not.

## Write it down

Before memory tidies it:

- What was the original hypothesis?
- What did the evidence show?
- Which layer changed and why?
- What am I keeping?
- What is the new hypothesis and its first test?

Three of these over two years is a genuine education in your own
judgement.

## Limits

Pivoting constantly is not iteration, it is avoidance (STU-205):

- Give each version a fair, scheduled test.
- Do not pivot toward whatever is currently fashionable.
- Do not pivot to escape the dull middle.
- Two or three substantive pivots with no traction is usually the signal
  to stop rather than to try a fourth (ENT-103).
""",
            },
            {
                "title": "Beyond the First Loop",
                "description": "What changes once something works.",
                "type": "TEXT",
                "minutes": 9,
                "body": """## The shift

Once people want it, pay for it and come back, the questions change:

- From "does anybody want this?" to "can I reach more of them
  repeatably?"
- From building anything to building reliably.
- From doing everything manually to writing down and handing over
  (ENT-104).
- From surviving to deciding how large you want this to be (ENT-101).

## What stays

The method does not stop:

- Every new feature is an assumption.
- Every new market is an assumption.
- Every price change is an experiment.
- Keep talking to customers weekly, permanently.

Businesses that stop testing build increasingly confident products that
fewer people want.

## Growth is its own problem

Worth knowing before you get there:

- Growing faster than you can deliver damages the reputation you built
  (STU-301).
- Cash gets tighter as you grow, not easier, because you pay for things
  before customers pay you.
- The thing that got your first ten customers rarely gets the next
  hundred.
- Each stage needs different work, and holding on to the old work is a
  common failure.

## Keep the loop small as you grow

Larger organisations lose the loop: longer cycles, more planning, less
contact with users.

The discipline is to keep running small experiments even when you could
afford big ones — because the cost of being wrong rises with the size of
the bet, not with the size of the company.

## Your own judgement

The real output of all this is not a product. It is you, with:

- A documented history of what you predicted and what happened.
- A sense of which assumptions are usually wrong.
- Practice at reading evidence honestly.
- Knowing your own pattern — pivot too early, build too long, avoid
  selling (ENT-104).

That judgement transfers to everything afterwards, including to a job,
and it is the thing that makes a second attempt materially better
(ENT-103).

## Closing Level 1

Across these five courses:

- **ENT-101:** what you bring, what the job is, and owning it.
- **ENT-102:** find a real problem and test it before building.
- **ENT-103:** take survivable risks, fail cheaply, close well.
- **ENT-104:** time is the capital; consistency beats intensity.
- **ENT-105:** build the smallest thing, measure what happened, decide.

Together: **small bets, tested honestly, repeated for years, without
betting anything you cannot afford to lose.**

## The summary

1. The loop reduces uncertainty; it does not produce features.
2. Think learn → measure → build, not the other way round.
3. An MVP is the smallest thing that answers your riskiest question.
4. Deliver it manually to one person before building anything.
5. Embarrassing in scope, never broken or unsafe.
6. Decide the number that means success before you launch.
7. Rates and cohorts, not totals.
8. Write the threshold before the experiment.
9. Pivot the smallest layer that is wrong, keep what worked, revalidate.
10. Decide at scheduled points against written criteria, not on how the
    week felt.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Decide What Happens Next",
            "description": (
                "Submit:\n"
                "1. Your review date and the written criteria for persevere, pivot and "
                "stop.\n"
                "2. Your evidence across every loop so far, as a trend rather than a "
                "snapshot.\n"
                "3. Which of the three the evidence supports, and why not the other "
                "two.\n"
                "4. An unsentimental person given your numbers without your "
                "interpretation, and their reading.\n"
                "5. If pivoting: which layer is wrong, out of the six, and why not the "
                "others.\n"
                "6. What the evidence supports keeping.\n"
                "7. The new assumptions your pivot creates, and how you will validate "
                "them.\n"
                "8. How you would tell existing customers and anybody who backed you.\n"
                "9. A written pivot record covering all five questions.\n"
                "10. The Level 1 summary in your own words: the one sentence that "
                "connects ENT-101 to ENT-105, and the ten-point summary with the two "
                "you find hardest.\n\n"
                "Graded on part 1 being written in advance, part 2 being real data, and "
                "part 4 having happened."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Pivot or Persevere",
            "description": "Four questions on reading evidence, pivoting and what follows.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Users are a different group from the one you aimed at. What is that?",
                    "choices": [
                        "Frequently a signal rather than a problem — the customer layer may be what to change",
                        "A marketing failure to correct",
                        "A reason to narrow the product",
                        "Evidence the positioning is unclear",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What are many 'nobody wants this' conclusions actually?",
                    "choices": [
                        "A pricing problem",
                        "'Nobody heard about this' — a channel problem",
                        "A timing problem",
                        "A product quality problem",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the most common post-pivot error?",
                    "choices": [
                        "Changing too many layers at once",
                        "Abandoning existing customers",
                        "Building the new version on the old version's evidence",
                        "Pivoting before the previous test was fair",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the real output of the whole method?",
                    "choices": [
                        "A validated product",
                        "A repeatable growth process",
                        "A documented market understanding",
                        "Your own judgement — a record of predictions against outcomes, and knowing your own pattern",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
