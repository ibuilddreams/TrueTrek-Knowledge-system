"""CN-408: Complex Decision Making Under Uncertainty. Cool Nerds academy,
Level 4 (Undergraduate). Focus area: Decision Making. Core competencies: game
theory basics, risk matrices, expected value.

Audience: an adult, roughly eighteen to twenty-two, as CN-401.

Four framings are load-bearing. First, the course **states plainly where
expected value stops applying**: it is the right tool for repeatable decisions
with bounded stakes, and applying it to one-off decisions that could ruin you is
the specific error that produces catastrophe — ENT-103's and CN-312's survivable
framing, formalised. Second, **some things are not inputs**: safety, legality,
obligations to other people and anything that would have to be concealed are
settled before any analysis begins, which is CN-209's settled list at adult
stakes. Third, the **game theory material refuses the cynical reading** — it is
routinely taught as though rational self-interest is the whole story, and the
file states that repeated games, reputation and trust are the actual condition
of working life, which is CN-404's point in formal clothes. Fourth, it is
**honest about the limits of quantification**: a number produced from invented
inputs is still invented, risk matrices hide dealbreakers behind totals, and
false precision is a known failure mode.

Boundary: CN-408 is formal decision tools for an adult. CN-209 is the method at
thirteen, CN-101 at nine, CN-312 is fear setting, CN-310 is evidence, CN-403 is
investment risk. They must not be merged.
"""

MODULES = [
    {
        "title": "Before Any Tool",
        "description": "What is not analysed, and what the question actually is.",
        "lessons": [
            {
                "title": "The Things That Are Not Inputs",
                "description": "Settled before the analysis starts.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## Why this is first

Once you have a method for quantifying trade-offs, it becomes
possible to quantify things that should never have been put on the
scales.

That is not a hypothetical failure. It is how competent people
arrive at decisions they later cannot explain: each step was
reasonable, and something that should have been a constraint was
treated as a variable.

## The settled list

Decided in advance, not scored, not traded against an upside however
large:

- **Anything unsafe to other people.**
- **Anything unlawful.**
- **Anything requiring a false statement**, in any form.
- **Anything you would have to conceal** from people entitled to
  know — a regulator, an employer, a partner, a client.
- **Obligations you have already taken on**, until properly
  discharged or renegotiated.
- **Anything where the cost falls on somebody who did not agree to
  it.**

If one of these is present, the decision is already made. You do not
build a matrix.

## Constraints and preferences

A useful distinction and a precise one.

**A constraint** is something that must hold. Options that breach it
are removed before scoring.

**A preference** is something you would like more of, which trades
against other preferences.

**Confusing the two is the error.** A constraint entered as a
heavily weighted preference can be outweighed, which is exactly what
should be impossible.

So: write the constraints first, filter, then score what survives.

## Who else is in it

The commonest way analysis goes wrong in professional settings.

A decision that is good for you and bad for somebody who relied on
you is not an efficient decision. **It is a cost moved onto
somebody else**, and the analysis only looked good because their
side was not in it.

Ask explicitly: who bears the downside, did they agree to it, and
would they recognise the description of it in my analysis?

CN-313's question about who pays, applied to your own choices.

## Whose decision is it

Before analysing anything: is this mine, shared, or somebody
else's?

Analysing somebody else's decision produces frustration. Treating a
shared decision as yours produces a conflict. And in a professional
setting, making a decision that was not yours to make is a serious
error regardless of whether it was correct.

## And most decisions do not need this

CN-209's size rule, and it matters more as the tools get better.

Reserve formal analysis for decisions that are hard to reverse,
affect a long period, affect other people, or keep you awake.

Everything else should be made quickly. **A method applied to
everything is a method that consumes the attention the important
decisions needed.**""",
            },
            {
                "title": "Getting The Question Right",
                "description": "Most bad decisions answer the wrong one.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Framing determines the answer

The same situation described two ways produces different decisions,
reliably, in everybody.

A choice presented as avoiding a loss is treated differently from
the identical choice presented as securing a gain. This is one of
the most replicated findings in the field and it operates on people
who know about it.

**Which means: describe the decision more than one way before
deciding.** If the answer changes with the description, you have
found something important.

## Ask why twice

CN-209's method at adult stakes.

> Should I take this job?
> *Why am I asking?* Because I am unhappy where I am.
> *Why?* Because of the work, or the manager, or the pay, or the
> commute.

That is a different question with different options — including
several that do not involve leaving.

## The options you were shown are rarely all of them

A decision presented as A or B frequently has a C that nobody
mentioned, and the person presenting it had reasons for the framing.

Standard additional options, which people systematically omit:

- **Not yet.** Delay is a real option with a real value.
- **A smaller version.** Trial, pilot, partial, reversible.
- **Both**, in sequence or in part.
- **Renegotiate the constraint** so the choice is unnecessary.
- **Do nothing**, deliberately rather than by default.

**Doing nothing is an option that should be scored**, not the
absence of a decision. It has consequences like any other.

## Criteria before options

CN-209's rule, and it is the single most important procedural point
in this course.

Decide what matters, and how much, **before you look at the
candidates.** Criteria chosen afterwards will favour whatever you
already preferred, and you will not notice.

Write them down and date them.

## Reversibility

Classify the decision before analysing it.

**Reversible** decisions should be made quickly. The cost of being
slow exceeds the cost of being wrong, because you can change it.

**Irreversible** ones deserve the full method: slow down, get
advice, sleep on it, and take the option that preserves future
choices where the difference is marginal.

Most decisions are the first kind and are treated as the second.

## State it in one sentence

Before any analysis, write the decision as a single question with a
date.

If you cannot, you do not yet know what you are deciding — and a
startling proportion of long deliberations are people analysing
something they have never stated.""",
            },
            {
                "title": "What You Actually Know",
                "description": "Three different kinds of not knowing.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Risk and uncertainty are not the same

A distinction that matters and is routinely blurred.

**Risk**: you know the possible outcomes and something about how
likely they are. A quantifiable situation.

**Uncertainty**: you know some outcomes are possible and you cannot
sensibly assign probabilities.

**Ignorance**: you do not know what the possible outcomes are.

Most consequential decisions sit in the second and third, and most
tools are built for the first. Applying a risk tool to an uncertain
situation produces a number that looks like knowledge and is not.

## Where numbers come from

Before trusting any calculation, ask of every input: **where did
this come from?**

- Measured data, from a source responsible for it.
- A reasonable estimate with a stated basis.
- A guess.
- A number somebody wanted.

**A calculation is not more reliable than its worst input**, and
putting guesses through arithmetic does not improve them. It makes
them look authoritative, which is worse.

## Reduce the uncertainty first

The step people skip in favour of analysing what they have.

Before modelling, ask: **what could I find out cheaply that would
change this decision?**

A conversation with somebody who has done it. A small test. A week's
trial. One question to whoever is responsible for the answer.

**Frequently the information is obtainable and nobody tried**,
because analysis feels like progress and asking feels like
exposure.

## Value of information

A useful formalisation of that instinct.

Information is only worth obtaining if it could change what you do.
If both answers lead to the same decision, finding out is a
comfort purchase rather than a decision input.

So ask: **what would I do differently if I knew?** If nothing,
decide now.

## Confidence intervals, honestly

Rather than a single number, estimate a range you are genuinely
confident the answer falls within.

Two things happen. The ranges are much wider than people first
write, and that width is itself the finding — it tells you whether
you are in risk or in uncertainty.

People are systematically overconfident about ranges, and knowing
that is not enough to fix it. Widening your first instinct
deliberately is.

## When you cannot know

Some things are genuinely unknowable in advance.

The response is not more analysis. It is designing for it:
**reversible, small, survivable, and able to absorb being wrong.**

CN-312's and CN-403's rule, and Module 2's subject.""",
            },
        ],
        "assignment": {
            "title": "The Question, And What Is Not On The Table",
            "description": (
                "Part 1. Write out the settled list in your own words and explain the "
                "difference between a constraint and a preference, with an example of what "
                "goes wrong when a constraint is entered as a heavily weighted preference.\n\n"
                "Part 2. Take a real decision. Write it as one sentence with a date. Ask why "
                "twice and say whether the question changed. Then describe the same decision "
                "two different ways and say whether your instinct moved.\n\n"
                "Part 3. List at least five options including 'not yet', a smaller version and "
                "'do nothing'. Then write your criteria with weights, dated, before looking at "
                "the options again.\n\n"
                "Part 4. For every uncertain input, say which of the four kinds of number it "
                "is. Then identify what you could find out cheaply that would actually change "
                "the decision, and go and find it out."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Before Any Tool: Check Your Understanding",
            "description": "Four questions on constraints, framing and uncertainty.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the error when a constraint is entered as a heavily weighted preference?",
                    "choices": [
                        "It can be outweighed — which is exactly what should be impossible",
                        "It makes the analysis harder to explain",
                        "It distorts the relative weight of other criteria",
                        "It is difficult to score consistently",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What should you do before deciding, given that framing determines the answer?",
                    "choices": [
                        "Write the decision down and sleep on it",
                        "Describe the decision more than one way and see whether the answer changes",
                        "Ask somebody else to describe it",
                        "Use a standard template for all decisions",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the difference between risk and uncertainty?",
                    "choices": [
                        "Risk involves money and uncertainty does not",
                        "Risk is short-term and uncertainty is long-term",
                        "With risk you know the outcomes and something about likelihoods; with uncertainty you cannot sensibly assign probabilities",
                        "Uncertainty can be reduced and risk cannot",
                    ],
                    "answer": 2,
                },
                {
                    "text": "When is information worth obtaining?",
                    "choices": [
                        "Whenever it is cheaply available",
                        "When it reduces the range of possible outcomes",
                        "When it comes from an authoritative source",
                        "Only if it could change what you do",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Expected Value, And Where It Breaks",
        "description": "The tool, and the specific situations it must not be used in.",
        "lessons": [
            {
                "title": "The Arithmetic",
                "description": "What expected value is and what it assumes.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The calculation

For each possible outcome: multiply what it is worth by how likely
it is. Add them up.

That is the expected value — the average result if the same decision
were repeated many times.

A made-up illustration, with invented figures.

An option has a 70% chance of gaining 100 and a 30% chance of losing
200.

Expected value: (0.7 × 100) + (0.3 × −200) = 70 − 60 = **+10**.

Positive, so the arithmetic says take it.

## What it is genuinely good for

**Repeatable decisions with bounded stakes.**

Many small similar decisions where no single outcome is
catastrophic. Over enough repetitions, the average is what you
actually get, which is precisely what the calculation describes.

That is a real and useful class: operational choices, pricing
decisions, which of many opportunities to pursue, whether a process
is worth running.

## Three assumptions, all frequently false

**That you can repeat it.** The average only arrives over many
trials. For a decision you make once, you get one of the outcomes,
not the average.

**That the probabilities are known.** Where they are invented,
multiplying them produces an invented answer with a decimal point.

**That the values are linear.** Losing a given amount frequently
matters far more to you than gaining the same amount, because of
what it does to your position. Treating them as equal and opposite
is the assumption that fails hardest.

## Why people misuse it

Because it produces a single number, and a single number feels like
an answer.

**False precision is the specific danger**: an output stated to two
decimal places from inputs that were guesses. The arithmetic was
correct and the result is meaningless.

Write the ranges. Show the inputs. Say which were estimates.

## Sensitivity

The useful thing to do with any model.

**Vary each input and see which ones change the decision.**

Usually one or two dominate and the rest barely matter. Those are
the ones to spend effort on reducing uncertainty about — and if the
decision flips within a plausible range, the model has told you it
cannot decide this for you.

That is a legitimate and valuable output.

## Use it to structure, not to decide

The honest position.

The value of doing the calculation is mostly that it forces you to
state the outcomes, the likelihoods and what they are worth — which
is where the thinking is.

**The number at the end is a by-product.** CN-209's point about the
grid, formalised.""",
            },
            {
                "title": "Where It Must Not Be Used",
                "description": "The most important lesson in this course.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The rule

> **Never take a positive expected value if a possible outcome is
> one you cannot recover from.**

That sentence is the whole lesson and it is the single most
consequential thing in this file.

## Why the arithmetic fails here

Because the average only exists across repetitions, and an outcome
that removes your ability to continue ends the sequence.

A series of favourable bets, each with positive expected value,
produces ruin with certainty if the stake is large enough relative
to what you have and the sequence is long enough. The arithmetic is
not wrong; it is answering a different question from the one that
matters.

## What this looks like in practice

- An investment with a strong expected return that could, in a bad
  case, remove everything — CN-403's leverage.
- A business decision that is good on average and could end the
  business.
- Anything where a low-probability outcome is a serious injury, a
  prosecution, or somebody else being harmed.
- Borrowing to pursue a positive-expectation opportunity, which is
  the standard mechanism.

In each case the correct response is not a better estimate. **It is
that the option is removed**, as Module 1 said.

## The separate question

So every decision has two, in order.

**1. Could the worst realistic outcome end the sequence?** If yes,
stop or shrink.

**2. Only then: is the expected value positive?**

Asking them in the other order is how competent people arrive at
catastrophe.

## Survivable, reversible, repeatable

ENT-103's and CN-312's framing, in formal terms.

The reason small, survivable, reversible decisions are
disproportionately effective is not caution. It is that **they
preserve the ability to keep making decisions**, which is what
converts positive expectation into actual gain over time.

Staying in the game is most of winning it — CN-403's last
lesson.

## Asymmetry is the opportunity

The useful shape to look for.

**Limited downside, large or uncapped upside**, repeatable.

Applying for something. Starting something small. Asking. Making a
thing. Writing something publicly. Sending the message.

Each costs little, most produce nothing, and the distribution is
such that doing many of them is sensible precisely because no single
failure is costly.

**That is the correct application of expected value**, and it is
where most of the value in a career comes from.

## And the mirror

Avoid the opposite shape: small, frequent, reliable gains with a
rare catastrophic loss.

It looks excellent for a long time and the record is misleading
right up until it is not. Several professional disasters have
exactly this structure.

**If a strategy has never had a bad year, ask what its bad year
looks like.**""",
            },
            {
                "title": "Matrices, And What They Hide",
                "description": "Scoring tools, used carefully.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## What a risk matrix is

Risks plotted against likelihood and impact, usually scored and
sometimes multiplied, to produce a priority order.

Widely used, genuinely useful for structuring a conversation, and
with two well-known failure modes that are worth understanding
before using one.

## Failure one: it hides dealbreakers

A low-likelihood, catastrophic risk can score lower than a
high-likelihood, moderate one.

That is arithmetically consistent and strategically wrong, because
the first could end everything and the second is an inconvenience.

**Catastrophic outcomes are not managed by priority score.** They
are constraints — Module 1's list — and they are handled first,
separately, whatever the matrix says.

## Failure two: false precision

Scores of 1 to 5 multiplied together produce numbers that look
measured and are not. Two risks scored 12 and 10 are not reliably
distinguishable, and the ordering frequently reflects who filled in
the form.

**Use it to group, not to rank.** Which risks are serious enough to
need action, and which are not.

## Using one properly

**List the risks**, including the ones nobody wants to say.

**Assess likelihood and impact separately**, and say what the
impact is in concrete terms rather than as a number.

**Separate out anything catastrophic or irreversible** and handle it
as a constraint.

**For everything else: who owns it, what reduces it, and what is
the trigger for acting.**

That last column is the one that matters and is routinely blank.
**A risk register that has changed no decision is administration**,
which is COH-406's point in a different setting.

## Decision matrices

The same shape for choosing between options — CN-209's grid.

Same two cautions. The total hides dealbreakers, and the weights
determine the answer.

So: **look at where the gaps are largest**, at any option scoring
very low on something important, and at every box you could not
score — which is the list of things to go and find out.

**Then ignore the total**, and notice your reaction to it, which is
honest information.

## Pre-mortem

The most effective single technique in this module and the cheapest.

Before deciding: **imagine it is a year later and this went badly.
Write down why.**

People generate far more and better failure modes when asked to
explain a failure that has happened than when asked what might go
wrong.

Do it with other people, in writing, before anybody has committed.
It routinely surfaces the thing everybody was privately worried
about — CN-209's point about groups and unspoken objections.""",
            },
        ],
        "assignment": {
            "title": "Two Questions, In Order",
            "description": (
                "Part 1. Work an expected value calculation on a real decision with your own "
                "figures. Label every input as measured, estimated, guessed, or wanted. Then "
                "run a sensitivity check: vary each input and identify which one or two "
                "actually change the decision.\n\n"
                "Part 2. Write out the rule about unrecoverable outcomes and the two questions "
                "in order. Then apply both to your decision and say explicitly whether the "
                "worst realistic outcome could end the sequence.\n\n"
                "Part 3. Find one real example of the asymmetric shape available to you — "
                "limited downside, large upside, repeatable — and one example of its mirror. "
                "Explain why the second looks excellent for a long time.\n\n"
                "Part 4. Run a pre-mortem on the decision: imagine it is a year later and it "
                "went badly, and write down why, in detail. Do it with at least one other "
                "person and record what they surfaced that you had not."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Expected Value: Check Your Understanding",
            "description": "Four questions on the tool, its limits and matrices.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "When is expected value the right tool?",
                    "choices": [
                        "Repeatable decisions with bounded stakes, where no single outcome is catastrophic",
                        "Any decision where probabilities can be estimated",
                        "Decisions with a long time horizon",
                        "One-off decisions with large potential gains",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What are the two questions, in order?",
                    "choices": [
                        "Is the expected value positive, and could I recover from the worst case?",
                        "Could the worst realistic outcome end the sequence, and only then is the expected value positive?",
                        "What are the probabilities, and what are the values?",
                        "Is it reversible, and is it affordable?",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why do catastrophic risks get mishandled by a risk matrix?",
                    "choices": [
                        "They are hard to estimate",
                        "People avoid writing them down",
                        "A low-likelihood catastrophic risk can score lower than a high-likelihood moderate one",
                        "Matrices do not have enough categories",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does a pre-mortem work better than asking what might go wrong?",
                    "choices": [
                        "It takes longer, so more is considered",
                        "It involves more people",
                        "It produces a written record",
                        "People generate far more and better failure modes when explaining a failure that has happened",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Decisions With Other People In Them",
        "description": "Game theory, without the cynicism.",
        "lessons": [
            {
                "title": "When The Outcome Depends On Somebody Else",
                "description": "The basic ideas, stated plainly.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## A different kind of problem

Everything so far assumed the world does not respond to your
choice.

A great many real decisions involve somebody else who is also
choosing, whose choice depends on what they expect you to do.

That is the subject, and the useful parts of it are few and
genuinely applicable.

## Think about their position

The single most useful idea, and the one people skip.

**What are their options, what do they actually want, and what will
they do given what they expect from me?**

Most negotiation and strategic failures are somebody optimising
their own side as though the other party were scenery.

CN-207's rule — work out what the other person actually cares about
— is this, formalised.

## Dominant and dominated options

Occasionally one option is better for somebody whatever anybody else
does. Then they will take it, and you can plan accordingly.

More usefully, you can frequently eliminate options that are worse
for them in every case — which narrows what you need to consider
substantially.

## The commitment idea

Counter-intuitive and real.

**Removing your own options can strengthen your position**, if the
other party knows it.

Somebody who genuinely cannot go beyond a limit is more credible
than somebody who could and says they will not. A published policy,
a mandate, a constraint you did not choose — these change what the
other side expects.

The requirement is that it must be **visible and actually binding.**
A commitment nobody believes is worse than none, and people who
bluff this are found out, which is Module 3's subject.

## Information asymmetry

One party knowing more than the other.

Two consequences worth knowing.

**It can collapse a market.** If buyers cannot distinguish quality,
they will not pay for it, so sellers of the good version leave —
which is why credentials, warranties, guarantees and reputations
exist.

**It creates an obligation.** Knowing something the other party does
not, in a transaction, is the point at which persuasion and
misrepresentation diverge — ENT-205's and CN-207's line.

## Coordination

Many situations are not conflicts at all. Both parties would prefer
to agree and the difficulty is agreeing on which.

The practical response is usually dull: **talk to them**, propose
something specific, and accept a slightly worse option that both can
actually reach rather than holding out for the best one.

A great many professional standoffs are coordination problems being
treated as conflicts.

## And the limits

Formal game theory assumes rational actors with known preferences,
and people are neither.

It is a way of structuring a situation and generating hypotheses
about what somebody might do. **It is not a prediction**, and
treating its outputs as forecasts about real people is a known way
to be badly wrong.""",
            },
            {
                "title": "Repeated Games, And Why Reputation Is The Real Answer",
                "description": "Refusing the cynical reading.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The famous example

Two parties can each cooperate or defect. Both cooperating is good
for both. Defecting while the other cooperates is best for the
defector and worst for the other. Both defecting is bad for both.

Played once, the logic pushes both towards defecting, and they end
up worse off than if they had cooperated.

## What that is routinely taken to show

That rational self-interest means betraying people, that trust is
naive, and that anybody not defecting has not understood the
mathematics.

**That reading is wrong, and it is wrong for a reason the same field
established.**

## Repetition changes everything

When the same parties interact repeatedly and expect to continue, the
analysis reverses.

Strategies that cooperate, respond to defection, and return to
cooperation perform well in repeated play. Defection is punished by
the other party's future behaviour, and the value of a continuing
relationship exceeds the gain from one betrayal.

That is not a moral claim bolted on. **It is the result.**

## Working life is a repeated game

This is the point.

You will encounter the same people repeatedly, in the same industry,
over decades, and the ones you do not meet again will have spoken to
the ones you do. CN-404's point: the world is far smaller than it
looks.

Which means the strategy that works is the unglamorous one: **do
what you said, be straightforward, do not take the one-off gain at
somebody's expense, and respond proportionately when somebody
else does.**

Not because it is nice. Because it is what the analysis actually
supports once the game is correctly specified.

## Reputation is the mechanism

It is how a repeated game works between people who have not met
before.

Somebody checks what you are like with somebody who knows. That
means your behaviour towards one person affects transactions with
people you have never met, which is the practical reason the
short-term gain is a bad trade.

## Forgiveness and proportionality

The strategies that do well are not pushovers and are not
vindictive.

They respond to a defection, and they return to cooperation when the
other party does. Unlimited retaliation performs badly; so does
never responding.

That maps closely onto what functional professional relationships
look like, which is not a coincidence.

## Where it genuinely is one-shot

Some interactions are genuinely single: a one-off transaction with
somebody you will never encounter, in a market with no reputation
mechanism.

**Those are precisely the situations where people behave worst**,
and they are also where consumer protection, regulation and
contracts exist to substitute for the missing repetition.

Knowing that is useful in both directions: it tells you where to be
careful as a buyer, and it tells you what is actually holding your
own behaviour up if the answer is only "nobody will find out."

## The honest summary

The mathematics does not say betray people. It says that in a world
of repeated interaction with reputations, being reliable is the
strategy — and that is the world you are in.""",
            },
            {
                "title": "Deciding Well Over A Career",
                "description": "The last lesson.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Judge the process

CN-209's point and the most important habit in this course.

**A good decision is not the same as a good outcome.** You can
decide well and lose, and decide carelessly and win.

Judging yourself only by outcomes means learning the wrong lesson
from both, and in a field with any randomness it means learning
almost nothing at all.

## Keep a decision journal

Three lines for anything significant, dated:

**What I chose. Why. What I expect to happen, with a confidence
level.**

Then read it back.

## Why it is necessary

Memory revises itself. After an outcome is known, people remember
having expected it, reliably and unconsciously.

Which means **without a written record you cannot find out whether
your judgement is any good**, and most people never do.

This is the single highest-return habit in this whole band, it takes
two minutes, and almost nobody keeps one.

## What to look for

Over a year of entries, patterns rather than individual verdicts.

- Am I systematically overconfident, and in which domains?
- Do I underestimate how long things take? Almost everybody does.
- Do I over-weight recent events?
- Am I better or worse when rushed?
- Do I decide well in one area and badly in another?

That last one is common and useful: most people are not uniformly
good or bad at deciding.

## Get a second view

For anything significant, somebody with no stake.

Not for approval. Ask them specifically: **what am I not seeing, and
what would make this go wrong?**

Then listen without defending, which is CN-310's hardest habit.

## Decide, then commit

The failure that follows good analysis.

Having decided, reopening it repeatedly without new information is
not diligence. It is anxiety, and it costs the execution.

**New information reopens a decision. Discomfort does not.**

## And change your mind when the evidence does

The other side of the same rule.

Staying with a decision because reversing it would be admitting
something is CN-209's sunk cost, and it is responsible for a
substantial share of professional and personal damage.

The question is always the same: **starting from today, would I
choose this?**

## What you have

You know the settled list, the difference between a constraint and a
preference, and that some things are removed before any scoring. You
know framing determines answers, that the options presented are
rarely all of them, and to set criteria before looking.

You know the three kinds of not-knowing, where numbers come from,
and that a calculation is not better than its worst input.

You know what expected value is good for, and the rule that matters
most: never take a positive expectation if a possible outcome is one
you cannot recover from. You know the asymmetric shape to look for
and the mirror to avoid.

And you know that the repeated game is the one you are actually
in — which is why reliability is the strategy rather than the
concession.

## The last instruction

Start the decision journal this week. Three lines, dated, with a
confidence level.

In two years it will be the most useful thing you took from this
course.""",
            },
        ],
        "assignment": {
            "title": "The Journal, And The Other Side",
            "description": (
                "Part 1. Take a decision involving another party. Write out their options, "
                "what they actually want, and what they will do given what they expect from "
                "you. Then say what that changes about your approach.\n\n"
                "Part 2. Explain why the cynical reading of the one-shot example is wrong, "
                "what repetition changes, and why working life is a repeated game. Then "
                "identify one genuinely one-shot situation you have been in and what held your "
                "own behaviour up.\n\n"
                "Part 3. Start the decision journal. Enter three real decisions with your "
                "reasoning, your expectation and a confidence level, dated. Set a reminder to "
                "review them in six months.\n\n"
                "Part 4. For one significant decision, get a second view from somebody with no "
                "stake, asking specifically what you are not seeing and what would make it go "
                "wrong. Write down what they said without defending any of it."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Decisions With Other People: Check Your Understanding",
            "description": "Four questions on strategy, repetition and process.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the requirement for a commitment to strengthen your position?",
                    "choices": [
                        "It must be visible and actually binding — a commitment nobody believes is worse than none",
                        "It must be communicated in writing",
                        "It must be made early in a negotiation",
                        "It must be costly to you",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does the analysis actually show once interactions are repeated?",
                    "choices": [
                        "That defection remains optimal but is harder to conceal",
                        "Strategies that cooperate, respond to defection and return to cooperation perform well",
                        "That outcomes depend mainly on who moves first",
                        "That reputation only matters in small markets",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Where do people behave worst, and why do contracts and regulation exist there?",
                    "choices": [
                        "In large organisations, because responsibility is diffuse",
                        "In negotiations with unequal power",
                        "In genuinely one-shot interactions with no reputation mechanism",
                        "Where the amounts involved are largest",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why is a written decision journal necessary rather than just reflecting?",
                    "choices": [
                        "It is easier to share with a mentor",
                        "It forces more careful reasoning at the time",
                        "It provides evidence if a decision is questioned",
                        "Memory revises itself — after an outcome is known, people remember having expected it",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]

HANDOUTS = []
