"""PAR-206: The Mental Health Pathway.

Level 2: The Navigation. Written against the course's focus (recognising and
proactively addressing an athlete's psychological wellbeing) and its core
competencies: identifying signs of anxiety and depression, using sports
psychologists, and balancing athletic stress.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).

**The reader is the parent, and this is the most safety-sensitive file in the
catalog.** It teaches a parent to *recognise and route*, never to diagnose or
treat. Every module states that boundary, names the professional, and gives
crisis instructions in plain language rather than euphemism. The athlete-facing
counterparts are MT-202 and LS-102; this course points at them and does not
repeat them.

If this file is edited, three things must survive: the explicit "this is not
treatment" framing, the named crisis instruction in every module, and the rule
that a disclosure of self-harm or suicidal thinking is acted on the same day
rather than monitored.
"""

MODULES = [
    {
        "title": "Knowing What You Are Looking At",
        "description": (
            "The difference between ordinary adolescence, athletic stress and a condition "
            "that needs treatment."
        ),
        "lessons": [
            {
                "title": "What This Course Is and Is Not",
                "description": "The boundary, and why a parent's job is recognition rather than treatment.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Read this first

This course helps you **notice** and **route**. It does not help you diagnose,
assess or treat, and it is not a substitute for a professional.

Anxiety, depression, eating disorders and other conditions are medical
matters. They are common, they are treatable, and the outcome depends far more
on how early somebody gets help than on anything a parent does alone.

Your job is: notice early, ask well, respond calmly, and get the right person
involved.

## Why it matters in sport specifically

Athletes are not exempt from mental illness and in several respects are more
exposed:

- High performance pressure, publicly evaluated.
- Identity concentrated in one activity (LS-102).
- Injury, which removes the activity and the social group at once.
- Deselection, which is a repeated public rejection.
- Body and weight scrutiny in some sports.
- A culture that frequently rewards concealment and treats struggling as
  weakness.
- Transitions — moving up, moving club, the end of participation.

The concealment point is the one that matters most to a parent. Athletes are
trained to push through, and that is exactly the instinct that delays help.

## The crisis instruction, stated now

It appears in every module of this course deliberately.

**If your child tells you, or you believe, that they are thinking about
suicide or harming themselves:**

- **Act today.** Not next week, not after the season.
- **Ask directly.** "Are you thinking about killing yourself?" Asking does
  not plant the idea — the evidence is clear on this, and it is the single
  most common reason parents hesitate.
- **Do not leave them alone** if the risk feels immediate.
- **Contact your physician, a crisis line, or emergency services.**
- **Remove access to means** where you reasonably can — medication, anything
  obviously dangerous in the house.
- **Stay calm and stay with them.** Your composure is what makes it possible
  for them to keep talking.

Find your country's crisis line now and save it in your phone. That is this
module's first assignment task.

## What you can legitimately do

- Know the signs (Lesson 2).
- Ask properly (Module 2).
- Reduce load, protect sleep, hold the household steady.
- Get the professional involved and support the treatment.
- Make it safe to tell you.

## What you cannot do

- Diagnose.
- Decide it is "just a phase" on your own.
- Treat it with training, discipline or a talking-to.
- Promise confidentiality for a disclosure about safety.

That last point is worth stating to your child in advance: *"I will always
take you seriously, and if you are in danger I will get help. I won't pretend
otherwise."*
""",
            },
            {
                "title": "Ordinary, Stressed, or Unwell",
                "description": "Three different states, and how to tell them apart.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Three states

**Ordinary adolescence.** Moodiness, irritability, tiredness, wanting
privacy, strong reactions to things that seem small. Normal, episodic, and it
does not pervade everything.

**Athletic stress or burnout.** PAR-105's subject: exhaustion, reduced sense
of accomplishment, and the sport stopping mattering. Largely confined to the
sport, and it responds to load reduction and rest.

**A mental health condition.** Pervasive, persistent, and it extends beyond
the sport into the rest of their life. It does not lift with a good week or a
rest.

The distinction that matters most: **does it extend beyond the sport, and has
it lasted?**

## Signs of anxiety

Beyond ordinary pre-competition nerves, which are normal and useful:

- Worry that is constant and about many things, not one.
- Physical symptoms — stomach aches, headaches, nausea, racing heart —
  particularly before school, not only before fixtures.
- Avoidance: of school, of social situations, of competition.
- Panic episodes: sudden intense fear, breathlessness, a sense of losing
  control.
- Reassurance-seeking that never settles anything.
- Sleep disrupted by worry.
- Perfectionism that produces distress rather than standards.

## Signs of depression

- Low or empty mood most of the day, most days, for two weeks or more.
- Loss of interest in everything — including things unrelated to sport that
  they used to enjoy. **This is the most distinctive sign.**
- Sleep badly disrupted, too little or far too much.
- Appetite or weight changed noticeably.
- Exhausted regardless of rest.
- Difficulty concentrating or making decisions.
- Feeling worthless, or guilty about things that are not their fault.
- Withdrawing from friends and family.
- Irritability, which in adolescents is frequently more visible than
  sadness.
- Thoughts of death or self-harm.

## Signs of disordered eating

PAR-101 listed them; they belong here too and they are a medical emergency
category of their own:

- Restricting, skipping meals, new rules about food.
- Eating secretly, or distress at eating with others.
- Rapid weight change in either direction.
- Exercise beyond their programme.
- Preoccupation with shape, calories or weight.
- In girls, periods becoming irregular or stopping — a medical sign.
- Frequent illness or repeated stress injuries.

Eating disorders are more common in athletes than in the general population
and they are serious. Early treatment changes outcomes substantially.

## The two-week rule

Several signs together, for **more than two weeks**, is the threshold for a
professional conversation.

Not certainty. A reason to ask somebody qualified.

## And the crisis instruction, again

**Any mention of self-harm or suicidal thinking is acted on today** — ask
directly, do not leave them alone if the risk feels immediate, contact your
physician, a crisis line, or emergency services.
""",
            },
            {
                "title": "What Makes It More Likely",
                "description": "The risk and protective factors a family can actually influence.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Risk is not blame

Knowing what raises risk is useful because some of it is modifiable. None of
it means a family caused anything — mental illness has causes nobody controls,
including genetic ones.

## What raises risk in young athletes

**Injury**, particularly long-term or career-threatening. One of the
best-documented triggers, and the one families least prepare for (PAR-108).

**Deselection and the end of participation** (LS-401).

**Overtraining and chronic sleep debt** (PAR-101).

**Identity concentrated in sport** (LS-102).

**Performance pressure**, including parental (PAR-107).

**Weight-category and aesthetic sports.**

**Transitions** — new club, new level, leaving home.

**Social isolation**, including from being singled out (PAR-204).

**Online abuse** (PAR-202).

**A family history** of mental illness, which matters and is worth knowing.

**Other life events** — bereavement, separation, illness at home — which do
not stop because somebody plays sport.

## What protects

Most of this pathway, in one list:

- **A reliable adult they can tell the truth to** — the strongest single
  factor (PAR-107).
- **Sleep** (PAR-101).
- **An identity with more than one part** (LS-102).
- **Friendships outside the team.**
- **Enjoyment of the sport**, which is also the strongest predictor of
  staying in it.
- **Autonomy** — a say in their own schedule and goals (PAR-105).
- **A household where the result does not change the emotional weather**
  (PAR-107).
- **Knowing where help is**, before it is needed.

## The injury case specifically

Worth planning for, because it is predictable and families are blindsided.

When a significant injury happens, do these deliberately:

- Keep them connected to the team socially.
- Give the rehabilitation visible structure and progress.
- Expect frustration and low mood, and do not require positivity.
- Watch for the two-week markers.
- Mention early to the physician that mood is part of what you are watching.

## The conversation to have before anything happens

Once, calmly, so it is already said:

> *"If you ever feel properly low, or anxious in a way that isn't going away,
> I want you to tell me. It's common, it's treatable, and it isn't a weakness
> or a thing I'd be disappointed about. And if you ever think about hurting
> yourself, you tell me the same day and we'll get help."*

A child who has heard that is far more likely to speak. One who has not
frequently assumes their parent would be disappointed, which is the single
most common reason young people stay silent.

**And the instruction stands: any disclosure of self-harm or suicidal
thinking is acted on today** — ask directly, stay with them, and contact a
physician, a crisis line or emergency services.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Know the Signs and the Numbers",
            "description": (
                "Preparation, done before anything is wrong.\n\n"
                "Submit:\n"
                "1. Your country's crisis line, saved in your phone, with a screenshot. Do "
                "this task first.\n"
                "2. Your physician's contact details, and how quickly you could get an "
                "appointment.\n"
                "3. Your school's safeguarding or pastoral lead and any counselling "
                "provision, named.\n"
                "4. Any mental health support your club, league or governing body provides, "
                "researched and named.\n"
                "5. The boundary in your own words: what this course helps you do, and what "
                "it does not.\n"
                "6. The three states distinguished — ordinary adolescence, athletic stress, "
                "a condition — with the question that separates them.\n"
                "7. The signs of anxiety, depression and disordered eating, with an honest "
                "assessment of your athlete against each and how long anything has been "
                "present.\n"
                "8. The risk factors currently present in your child's situation.\n"
                "9. The protective factors, with the two weakest in your household and what "
                "you are doing about them.\n"
                "10. Your injury plan: the five things you would do deliberately.\n"
                "11. The before-anything-happens conversation, had, with what you said and "
                "how they responded.\n"
                "12. The crisis instruction written out as steps you could follow while "
                "frightened.\n\n"
                "Graded on whether parts 1–4 name real, saved contacts, and on whether part "
                "11 is a real conversation."
            ),
            "total_marks": 250,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: Knowing What You Are Looking At",
            "description": "Four questions on the boundary, the signs and crisis response.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What should a parent do if they believe their child is thinking about suicide?",
                    "choices": [
                        "Act today — ask directly, do not leave them alone if risk feels immediate, and contact a physician, crisis line or emergency services",
                        "Monitor for two weeks as with other signs",
                        "Raise it with the school first",
                        "Wait for them to bring it up themselves",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What does the evidence say about asking a young person directly whether they are thinking about suicide?",
                    "choices": [
                        "It should only be done by a trained professional",
                        "Asking does not plant the idea — and hesitation is the most common parental error",
                        "It increases distress in the short term",
                        "It is only appropriate where other signs are present",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What distinguishes a mental health condition from athletic stress?",
                    "choices": [
                        "Its severity",
                        "Whether the athlete asks for help",
                        "Whether it extends beyond the sport into the rest of their life, and how long it has lasted",
                        "Whether it follows an injury",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the most distinctive sign of depression?",
                    "choices": [
                        "Irritability",
                        "Disrupted sleep",
                        "Difficulty concentrating",
                        "Loss of interest in everything, including things unrelated to sport they used to enjoy",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Talking and Getting Help",
        "description": (
            "How to raise it, and how to get the right professional involved quickly."
        ),
        "lessons": [
            {
                "title": "Raising It",
                "description": "The conversation, done in a way that does not close it.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## When

- **Not in a crisis**, if you can choose. Calm, ordinary time.
- **Side by side** rather than face to face — driving, walking, washing up
  (PAR-105).
- **Not immediately after a fixture.**
- **When you have time**, so it is not interrupted.

## How to open it

Observation, not diagnosis:

> *"I've noticed you've not been sleeping well and you've not wanted to see
> anyone for a few weeks. I'm not having a go — I just wanted to check how
> you're doing, properly."*

What that does: names something specific and observable, removes blame, and
asks rather than tells.

What not to open with:

- "Are you depressed?" — a label, and easy to deny.
- "What's wrong with you?"
- "You need to snap out of it."
- "Other people have it worse."
- "You've got nothing to be sad about", which is both untrue and silencing.

## During it

- **Listen more than you talk** (PAR-105's six behaviours).
- **Do not fix.**
- **Do not minimise**, and do not catastrophise either.
- **Believe them.**
- **Ask open questions**: "What does it feel like?" "When did it start?"
  "What makes it worse?"
- **Tolerate silence.**
- **Do not make it about you** — your worry, your guilt, your disappointment.

## Asking the direct question

If anything suggests risk, ask it plainly:

> *"Have you been having thoughts of hurting yourself, or of not wanting to
> be here?"*

Say it in ordinary words. Do not soften it into something ambiguous. If the
answer is yes, or unclear, that is **today's** matter — ask whether they have
a plan, do not leave them alone if the risk feels immediate, and contact your
physician, a crisis line or emergency services.

## If they will not talk

Common. Do not force it.

- Say what you have noticed and that you are not going away.
- Make sure there is another adult they could go to — a relative, a coach, a
  teacher, the school counsellor.
- Tell them the school and the physician exist and that they can go without
  you.
- Keep offering, without pressure.
- Keep the ordinary things going: meals, routine, being in the same room.

And if the signs are serious, **a child's reluctance to talk does not delay
getting professional advice.** You can speak to a physician yourself about
what you are seeing.

## What to say about help

Normalise it plainly:

> *"Lots of people get help with this. It works. It's the same as going to a
> physio for your knee — you wouldn't try to fix that yourself."*

That comparison lands well with athletes, who already accept specialist help
for bodies.

## And afterwards

- Follow up in a few days.
- Do not announce it to other people.
- Do not tell the coach without asking them first, unless safety requires it.
- Keep treating them normally.
""",
            },
            {
                "title": "Who Does What",
                "description": "The professionals, and which one you actually need.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The confusion

"Sports psychologist", "counsellor", "therapist", "psychiatrist" and "mental
performance coach" are used interchangeably by families and they are not the
same thing.

Getting the right one quickly matters.

## Who they are

**Your physician / family doctor.** The usual starting point. Can assess, rule
out physical causes — thyroid problems, anaemia, concussion effects and others
can present as low mood — and refer onward. Where you are unsure, start here.

**Clinical psychologist.** Assesses and treats mental health conditions with
talking therapies. Requires a professional qualification and registration.

**Psychiatrist.** A medical doctor specialising in mental illness, able to
prescribe medication. Usually by referral, and the route for more severe
presentations.

**Counsellor / psychotherapist.** Talking therapy. Regulation varies by
country, so check the registering body.

**Sport psychologist.** Works on performance — focus, confidence, routines,
anxiety around competition. Some are also clinically qualified and many are
not. **A sport psychologist is not a substitute for clinical care**, and a
good one will say so and refer.

**Mental performance or mindset coach.** Frequently unregulated with no
clinical training at all. May be useful for performance; not a route for
illness.

**School counsellor or pastoral lead.** Accessible, free, and frequently the
fastest first step. Can also coordinate adjustments at school.

**Registered dietitian**, for anything involving eating.

## Which one for what

- **Low mood, anxiety, persistent distress, anything in Module 1's lists** →
  physician first, then clinical psychologist or psychiatrist by referral.
- **Possible eating disorder** → physician urgently, and a specialist service.
  Do not wait.
- **Performance anxiety specifically, with no wider symptoms** → sport
  psychologist is reasonable.
- **Difficulty after injury** → physician, and consider a psychologist with
  sport experience.
- **School-related distress** → school counsellor and physician.
- **Crisis** → crisis line or emergency services, today.

## Checking somebody is qualified

Non-negotiable, and it takes five minutes:

- **Check the register.** Every country has a body registering psychologists
  and a separate one for counsellors. Verify, do not accept a claim.
- **Ask about experience with adolescents**, and with athletes.
- **Ask how they work**, and what the plan would be.
- **Ask about confidentiality and its limits** — what they would tell you,
  and when.
- **Ask what happens if it is more serious** than their scope.

Be wary of anybody unregulated making clinical claims, anybody promising
quick fixes, and anybody selling a programme rather than offering treatment.

## Cost and access

- Public health systems, where they exist, are the first route and are often
  slow. Start the referral anyway.
- School provision is free and fast.
- Some governing bodies, clubs and players' associations provide confidential
  support — ask.
- Insurance may cover it.
- Charities and helplines provide free support and advice to families.

**Start the slow route and the fast route at the same time.** A waiting list
does not prevent you using a school counsellor or a crisis line meanwhile.

## And the instruction, again

**Any disclosure of self-harm or suicidal thinking is acted on today**, not
added to a waiting list — crisis line, physician, or emergency services.
""",
            },
            {
                "title": "Supporting Treatment",
                "description": "The parent's role once a professional is involved.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Your role changes

Once a professional is involved, you are support rather than the person
managing it. That is a relief and most parents find it hard.

## What helps

**Get them there.** Appointments, transport, scheduling. Treatment works when
it is attended, and a teenager with a full training schedule needs it
protected like any other commitment.

**Protect the time.** If a session clashes with training, the session wins.
Say that to the coach if necessary; you do not have to say why (Lesson 3's
privacy note).

**Follow the advice**, including the parts that are inconvenient.

**Do not ask what was discussed.** Therapy works partly because it is
private. Ask how they found it, not what they said.

**Expect it to be slow.** Improvement is rarely linear, and several weeks
without visible change is normal rather than evidence it is not working.

**Keep the household steady.** Routine, sleep, meals, normal expectations.

**Look after yourself** (Module 3).

## About medication

If it is recommended:

- It is a clinical decision, made by a qualified prescriber.
- Ask the questions you have — effects, timescale, side effects, review,
  what happens in sport.
- **Check anything prescribed against your sport's anti-doping rules**, with
  the prescriber and the governing body. Some medications require a
  therapeutic use exemption and the process takes time.
- Do not stop or change it without the prescriber.
- Do not let anybody — a coach, a relative, the internet — talk your family
  out of a clinical decision.

## Telling the club

Your child's decision where possible, and theirs to lead on.

Reasons to tell somebody: load can be adjusted, expectations managed,
somebody can watch for them, and a coach who does not know may push in exactly
the wrong direction.

How:

- Ask your child first.
- Tell one person, usually the head coach or the welfare officer.
- Say what is needed — reduced load, flexibility, a watchful eye — rather
  than the detail.
- Ask that it goes no further.

**The exception:** where there is a safety risk, the people responsible for
your child need to know, and that overrides a preference for privacy. Say that
to your child rather than doing it behind them.

## Confidentiality with your child

Be honest in advance about what you will and will not keep private:

> *"What you tell me stays between us, unless you're in danger. If you are, I
> will get help — and I'll tell you I'm doing it."*

A promise you cannot keep destroys the thing you need most, and a limit stated
in advance is accepted far better than one applied in a crisis.

## When it is not improving

- Say so to the professional. "This doesn't seem to be helping" is a
  legitimate thing to raise.
- Ask about reviewing the approach.
- Ask for a second opinion.
- Escalate if things worsen.

## And the instruction

**Any disclosure of self-harm or suicidal thinking is acted on today.** During
treatment too — tell the treating professional immediately, and use the crisis
route if it is urgent.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — The Conversation and the Routes",
            "description": (
                "Prepare the conversation, and map the professionals.\n\n"
                "Submit:\n"
                "1. Your opening, written as an observation rather than a diagnosis, using "
                "something you have actually noticed.\n"
                "2. The five openings not to use, with any you would have used.\n"
                "3. The direct question about self-harm, written in plain words as you would "
                "say it.\n"
                "4. Your plan if they will not talk, including the other adults they could "
                "go to, named.\n"
                "5. Your normalising line about getting help, in your own words.\n"
                "6. The seven professional roles defined in one sentence each, with which "
                "one you would contact for each of the six situations in Lesson 2.\n"
                "7. A real register check: look up the registering body for psychologists "
                "and for counsellors in your country, and report how you would verify "
                "somebody.\n"
                "8. Your access routes, researched: public provision and its likely wait, "
                "school provision, any club or governing body support, insurance, and a free "
                "helpline.\n"
                "9. Your anti-doping check plan if medication were ever prescribed.\n"
                "10. Your position on telling the club: who, what you would say, and the "
                "safety exception.\n"
                "11. The confidentiality limit, stated to your child in advance, with what "
                "you said.\n"
                "12. What you would do if treatment did not seem to be helping.\n\n"
                "Graded on whether parts 7 and 8 name real registering bodies and real "
                "services, and on whether part 11 is a conversation that happened."
            ),
            "total_marks": 250,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: Talking and Getting Help",
            "description": "Four questions on raising it, professionals and treatment.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "How should a parent open the conversation?",
                    "choices": [
                        "With a specific observation, no blame, and a question rather than a label",
                        "By asking directly whether they are depressed",
                        "By describing their own experience first",
                        "By arranging a professional appointment and telling them afterwards",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is a sport psychologist not?",
                    "choices": [
                        "Useful for performance anxiety",
                        "A substitute for clinical care — a good one will say so and refer",
                        "Sometimes clinically qualified as well",
                        "An appropriate first contact for competition nerves",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What should a parent not ask after a therapy session?",
                    "choices": [
                        "How they found it",
                        "Whether they want to continue",
                        "What was discussed — therapy works partly because it is private",
                        "Whether the time works for them",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should a parent state in advance about confidentiality?",
                    "choices": [
                        "That everything will be kept private",
                        "That the coach will always be informed",
                        "That the school decides what is shared",
                        "That it stays between you unless they are in danger — and that you will tell them if you act",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Prevention and the Household",
        "description": (
            "Reducing the load that causes harm, and looking after the adults too."
        ),
        "lessons": [
            {
                "title": "Balancing Athletic Stress",
                "description": "The load decisions that are genuinely protective.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Most of prevention is load and sleep

Unglamorous and true. A substantial share of what presents as a mood problem
in a young athlete is a tired, over-committed child.

That does not mean every case is load. It means load is the first thing to
look at because it is modifiable.

## The levers

**Sleep.** Eight to ten hours. The highest-return intervention available, and
PAR-101 covers how.

**Total load**, counted across every source — club, school, representative
team, strength work, physical education. PAR-105's audit, and no single coach
sees it.

**A real off-season**, in every sport, at every age.

**Lighter weeks**, built in: three hard weeks and a lighter fourth.

**Rest days**, actually taken.

**Food**, enough for the training being done (PAR-101).

**Unstructured time.** A teenager with no empty evenings is a teenager with
nowhere to recover.

## The protective non-sport things

- Friendships outside the team.
- Something they do that is not evaluated.
- School going reasonably well.
- A family life that is not organised entirely around fixtures (PAR-104).
- An identity with more than one part (LS-102).

Those are not luxuries competing with training. They are the things that make
a hard period survivable.

## The transitions to watch

Risk concentrates predictably. Reduce something at each:

- Moving up an age group.
- Changing club.
- Starting at a more demanding programme.
- Exam years.
- A growth spurt.
- Returning from injury.
- The end of a season.

## Reducing the pressure you add

PAR-107's material, in one sentence: a child whose parent's warmth visibly
depends on performance carries that permanently, and it is one of the most
consistently identified contributors to anxiety in youth sport.

The audit is in PAR-107 and it is worth re-running annually.

## Autonomy

One of the strongest protective factors and the easiest to improve.

Let them choose things: which sessions, which goals, whether to play a second
sport, whether to take a break. A child who feels the sport is theirs copes
with its difficulties far better than one who feels it is being done to them.

## When to take something out

If several of the two-week markers are present, reduce load **before**
waiting to see.

- Remove one commitment for a month.
- Protect sleep absolutely.
- Keep the social parts and drop the demanding parts where you can.
- Tell the coach you are doing it; most will support it, and most would have
  if asked earlier.

Reducing load is not giving up, and it is frequently the intervention that
prevents a much larger one.

## And the instruction

**Any disclosure of self-harm or suicidal thinking is acted on today** — ask
directly, do not leave them alone if the risk feels immediate, and contact a
physician, a crisis line or emergency services. Load reduction is prevention,
not a response to crisis.
""",
            },
            {
                "title": "Looking After Yourself",
                "description": "The parent's own wellbeing, which is not optional.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Parents struggle too

A parent supporting an unwell child, or carrying anxiety about their child's
sport, is at real risk themselves — and almost no youth sport material says
so.

It matters practically: your capacity to help is a function of your own state,
and children detect an exhausted, frightened parent accurately.

## The signs in yourself

- Anxiety that affects your week around fixtures.
- Your mood tracking their results (PAR-103).
- Sleeping badly, worrying at night.
- Irritability at home.
- Inability to stop managing it.
- Isolation — nobody you can say any of this to.
- Your own enjoyment of their sport gone entirely.

## What helps

**Tell somebody.** A partner, a friend outside the club, a counsellor. Parents
of unwell children frequently carry it alone while managing everybody else.

**Your own physician**, if it is affecting you.

**Something of your own** that is not their sport (PAR-103).

**Shared load.** Driving, appointments, decisions — with a partner, a
relative, another family.

**Reduce your exposure.** You do not have to attend everything (PAR-102).

**Support services for parents and carers** exist in most countries,
frequently free, and they are specifically for this.

## If there are two parents

- Agree the approach, in private, before presenting it.
- Do not let one be the enforcer and the other the ally.
- Do not use the child as a messenger.
- Check how the other one is doing, which nobody does.

And if you disagree about treatment or seriousness, take that disagreement to
the professional rather than resolving it between you.

## Siblings

Routinely forgotten when one child is unwell:

- They notice everything.
- They may be frightened, and nobody has explained anything.
- They may be getting much less attention.
- They may be managing their own difficulty quietly, because the household
  already has one.

Tell them something age-appropriate and true. Keep asking about their lives.
Protect some time for them (PAR-101).

## Guilt

Almost universal among parents in this situation: that you caused it, missed
it, pushed too hard, did not notice.

Some of it may be worth examining honestly (PAR-107). Most of it is not
useful, and mental illness has causes nobody controls.

What matters now is what you do next, and you are already doing it by reading
this.

## And the instruction, one last time

**Any disclosure of self-harm or suicidal thinking is acted on today** — ask
directly, stay with them, and contact a physician, a crisis line or emergency
services. That applies whatever else is happening in the household, and it
takes precedence over every other consideration in this pathway.
""",
            },
            {
                "title": "The Culture You Set",
                "description": "Making it normal to say something is wrong.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## The thing that decides outcomes

Not knowledge of the signs. Whether your child tells somebody early.

Everything else in this course is downstream of that, and it is built by a
household's ordinary behaviour over years.

## What makes it possible

**Predictable reactions.** A child who cannot guess how you will respond tells
you nothing (PAR-107).

**Proportion.** Small things get small reactions.

**No punishment for honesty.** The condition that decides it.

**Talking about it normally**, before anything is wrong. Mental health
mentioned in the house the way physical health is.

**Seeing adults get help.** If you have had counselling, if a relative takes
medication, if you talk about your own difficult period — say so, briefly and
without drama. It is the most persuasive thing available.

**Not treating it as weakness**, in anybody, including in people in the news.

**Language.** Avoid "mental", "crazy", "soft", "attention-seeking" about
anybody. Children hear how a household talks about other people and conclude
how it would talk about them.

## In sport specifically

Push back, gently, on the culture where you meet it:

- "Just get on with it" as a universal answer.
- Treating a struggling athlete as uncommitted.
- A coach who disparages players who get help.
- Teammates mocking somebody who is struggling.

A parent who says, once, in front of their child, that getting help is
sensible rather than weak has done something useful.

## The annual check

Once a year, honestly:

- Does my child know how to tell me something is wrong?
- Have they ever told me something difficult, and how did I handle it?
- Do they know who else they could go to?
- Are the crisis numbers saved?
- Is their load sustainable?
- Is their life wider than this?
- How am I doing?

## Where this sits

- **PAR-101** — sleep, food, load.
- **PAR-105** — listening, and burnout.
- **PAR-107** — the pressure you add, and emotional safety.
- **PAR-108** — processing failure.
- **This course** — recognising illness and routing it.
- **LS-102, MT-202, LS-401** — the athlete's own side.

## The summary

1. **Know the signs**, and the two-week rule.
2. **Save the crisis number** now.
3. **Ask directly** when something suggests risk, in plain words.
4. **Route to the right professional**, and check the register.
5. **Reduce load** early; it is the modifiable part.
6. **Look after yourself.**
7. **Make it normal to say something is wrong.**

And the one that overrides everything: **any disclosure of self-harm or
suicidal thinking is acted on today** — ask directly, do not leave them alone
if the risk feels immediate, and contact a physician, a crisis line or
emergency services.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Prevention, Yourself, and the Culture",
            "description": (
                "The modifiable parts.\n\n"
                "Submit:\n"
                "1. Your athlete's total load across every source, with the weekly and "
                "annual totals and the actual off-season in weeks.\n"
                "2. Their average sleep over two weeks, against the eight-to-ten target.\n"
                "3. The protective non-sport things in their life, named — and any that do "
                "not exist.\n"
                "4. The transitions coming in the next eighteen months, with what you will "
                "reduce at each.\n"
                "5. Your autonomy audit: what do they actually get to choose? Ask them.\n"
                "6. Your re-run of PAR-107's pressure audit, honestly.\n"
                "7. Your own state against the seven signs in Lesson 2, honestly.\n"
                "8. Who you have told how you are actually doing, and support services for "
                "parents in your country, researched and named.\n"
                "9. If there are two parents: your agreed approach, and how you check on "
                "each other.\n"
                "10. What siblings have been told, and what you are doing for them.\n"
                "11. Your household's language and culture: what has been said about mental "
                "health in front of your children, and what you are changing.\n"
                "12. The seven annual check questions, answered now as a baseline, with the "
                "review date in your calendar.\n"
                "13. Confirmation that the crisis number from Module 1 is still saved.\n\n"
                "Graded on the honesty of parts 6, 7 and 11, and on whether part 8 names a "
                "real service."
            ),
            "total_marks": 250,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Prevention and the Household",
            "description": "Four questions on load, the parent's own state and culture.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Why is load the first thing to look at?",
                    "choices": [
                        "It is modifiable — and a substantial share of what presents as a mood problem is a tired, over-committed child",
                        "It is the most common cause of depression in athletes",
                        "Coaches expect it to be addressed first",
                        "It rules out medical causes",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What should happen if several two-week markers are present?",
                    "choices": [
                        "Monitor for a further fortnight before acting",
                        "Reduce load before waiting to see, and contact a professional",
                        "Increase structure and competition to restore motivation",
                        "Wait until the end of the season",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course say about the parent's own wellbeing?",
                    "choices": [
                        "It should be addressed after the child has recovered",
                        "It is a private matter separate from the child's care",
                        "Your capacity to help is a function of your own state, and children detect an exhausted parent accurately",
                        "It rarely affects the outcome",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What actually decides outcomes?",
                    "choices": [
                        "The parent's knowledge of the warning signs",
                        "The speed of referral",
                        "Which professional is involved",
                        "Whether the child tells somebody early — which a household builds over years",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
