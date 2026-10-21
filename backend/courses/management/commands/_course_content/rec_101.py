"""REC-101: The Recruiting Landscape & Academic Safety Net.

Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year) — the
first course of The Recruiting Pathway. Written against the course's focus
(the timeline and non-negotiable requirements for recruitment) and its core
competencies: NCAA Eligibility Center registration, core course requirements,
the sliding scale, and the functional differences between D-I, D-II, D-III,
NAIA and JUCO.

Eligibility standards and recruiting calendars are revised between academic
years and differ by sport and division, so every lesson teaches the shape and
sends the student to the Eligibility Center, their own association and the
programme itself for the current numbers.
"""

MODULES = [
    {
        "title": "How Recruiting Actually Works",
        "description": (
            "The mechanics behind the process: who decides, how the funnel narrows, and why "
            "most of it is invisible from the outside."
        ),
        "lessons": [
            {
                "title": "The Funnel, and Where You Are In It",
                "description": "How a programme goes from thousands of names to a signed class.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## It is a funnel, not a search

A college programme does not go looking for one athlete. It builds a list of
hundreds or thousands of names per class and narrows it over two or three years:

1. **Awareness.** Your name enters a database — from a camp, a coach's
   recommendation, film you sent, a recruiting service, a tournament roster.
2. **Evaluation.** Somebody watches film. This is where most names leave the
   funnel, usually in under a minute.
3. **Contact.** A questionnaire, a camp invitation, a generic letter. Real but
   not a judgement yet.
4. **Prioritisation.** You are on a board, ranked against others at your
   position. Still invisible to you.
5. **Offer.** What "being recruited" looks like from the outside, and the part
   that happens last.

Most of this happens without you knowing. An athlete who thinks nothing is
happening is frequently sitting at stage 2 or 4.

## Who actually decides

Rarely the head coach alone. In most programmes:

- A **position coach** or assistant owns your region or position group.
- A **recruiting coordinator** manages the board and the calendar.
- A **director of operations** handles logistics, visits and compliance.
- The **head coach** signs off late.

Knowing this changes who you contact and what you ask — REC-201 is built on it.

## What you control

Not the board. Not the position need. You control three things: the film,
the academic record, and whether you are easy to deal with. That is the whole
list, and this pathway is about doing all three properly.
""",
            },
            {
                "title": "The Four-Year Timeline",
                "description": "What actually happens in each year, and what to do in the one you are in.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Nothing starts in senior year

The familiar story — "nobody contacted me until senior year" — is usually an
athlete who became visible late. The work that makes you visible happens
earlier.

**Freshman year.** Grades, because the academic record from this year is already
permanent and already counts. Learn your sport. Record everything you do, even
if nothing is published yet.

**Sophomore year.** Open the eligibility account. Build the first real film.
Start the target list from REC-103. Attend a small number of well-chosen events.
First contact from programmes often arrives this year — much of it generic.

**Junior year.** The decisive one in most sports. Film from a full varsity
season, a real outbound campaign (REC-201), campus visits (REC-203), and the
first genuine conversations.

**Senior year.** Offers, decisions, signing — and the academic requirements that
have to be finished before the year starts in some divisions.

## Sports move at different speeds

Some sports commit athletes very early; others fill most of a class in the final
months. Softball, lacrosse and soccer run early; some track and field events and
many Division III programmes run late. **Find out what normal looks like in your
sport**, from a coach who has moved athletes through it recently, and plan to
that calendar rather than to a general one.

## The year you are in

Whatever year it is, the next action is the same: make the academic record safe,
then make the film good. Everything else in this pathway sits on those two.
""",
            },
            {
                "title": "Recruiting Timeline Planner",
                "description": "Year-by-year planner with the actions, documents and deadlines for your sport.",
                "type": "PDF",
                "minutes": 18,
                "body": """Downloadable planner for Module 1. Page one maps the funnel — awareness,
evaluation, contact, prioritisation, offer — with space to record where you
believe you currently stand with each programme on your list and the evidence
for it.

Page two is the four-year timeline, one row per school year, with the academic,
film, outreach and event actions due in each, plus a panel for what "normal"
looks like in your sport and who told you.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Your Recruiting Reality Check",
            "description": (
                "Find out how your sport actually works, from someone who knows.\n\n"
                "Submit:\n"
                "1. Your sport's real timeline. Interview one person who has moved athletes "
                "through recruitment in your sport in the last three years — a high school "
                "coach, a club coach, or a recent college athlete. Record what year most "
                "athletes commit, what the first real contact usually is, and what they said "
                "most families get wrong.\n"
                "2. The funnel. For three programmes you are interested in, state honestly which "
                "stage you believe you are at and what evidence you have. 'I don't know' is an "
                "acceptable and common answer; say so rather than guessing upward.\n"
                "3. Your year. Identify which school year you are in and list the specific "
                "actions due in it from the timeline.\n"
                "4. The three things you control — film, academic record, being easy to deal "
                "with. Rate yourself on each out of five and give one line of evidence per "
                "rating.\n"
                "5. One paragraph: what did you believe about recruiting before this module that "
                "the interview changed?\n\n"
                "Graded on whether the interview actually happened, on the honesty of the funnel "
                "assessment, and on whether the self-ratings are evidenced rather than hopeful."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: How Recruiting Works",
            "description": "Four questions on the recruiting funnel and timeline.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "At which stage of the funnel do most names leave, usually in under a minute?",
                    "choices": ["Awareness", "Evaluation", "Prioritisation", "Offer"],
                    "answer": 1,
                },
                {
                    "text": "Who typically owns a region or position group in a college recruiting operation?",
                    "choices": [
                        "The head coach personally",
                        "The director of operations",
                        "A position coach or assistant",
                        "The compliance office",
                    ],
                    "answer": 2,
                },
                {
                    "text": "According to the lesson, which three things does an athlete actually control?",
                    "choices": [
                        "The film, the academic record, and being easy to deal with",
                        "The position need, the board ranking, and the offer",
                        "The recruiting calendar, the budget, and the coaching staff",
                        "Camp invitations, scholarship totals, and roster spots",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does the course tell you to find out what “normal” looks like in your own sport?",
                    "choices": [
                        "Every sport uses the same timeline, so it is a formality",
                        "Only Division I sports have a recruiting calendar",
                        "The timeline depends on the athlete's grades",
                        "Sports commit athletes at very different points, so a general calendar misleads",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Division Map",
        "description": (
            "What D-I, D-II, D-III, NAIA and JUCO actually are, how they differ in aid, "
            "demands and admissions, and which ones fit you."
        ),
        "lessons": [
            {
                "title": "Five Destinations, Not a Ranking",
                "description": "The functional differences between the associations and divisions.",
                "type": "TEXT",
                "minutes": 15,
                "body": """## They are different products, not a league table

**NCAA Division I.** The largest budgets and the heaviest time demand. Athletic
aid is available in most sports. Certification through the NCAA Eligibility
Center is required.

**NCAA Division II.** Athletic aid available, usually in partial amounts,
combined with academic aid. A deliberately more balanced model. Also certified
through the Eligibility Center.

**NCAA Division III.** **No athletic scholarships** — and this is the most
misunderstood fact in recruiting. D-III programmes fund athletes through
academic and need-based aid, which at some institutions adds up to more than a
partial athletic award elsewhere. Competitive, shorter seasons, and no
Eligibility Center certification required for most athletes.

**NAIA.** A separate association with its own eligibility centre and its own
rules. Athletic aid available. Often smaller institutions, frequently with a
genuine path to early playing time.

**NJCAA (junior college).** Two-year institutions. A real route for athletes who
need academic repair, more development time, or a second look. Many athletes
transfer from here into four-year programmes.

## How to think about it

Ask three questions rather than ranking them:

1. **Where would I actually play?** Four years of competing beats four years of
   watching at a more famous address.
2. **What would I pay?** The headline level says very little about your family's
   real cost. REC-301 does this arithmetic properly.
3. **What is the life like?** Time demand, travel, and whether your intended
   degree survives the schedule.

## The honest filter

An athlete whose list is nine Division I programmes and nothing else usually has
a list of zero. Every tier of this map contains good outcomes, and REC-103 builds
a list across several.
""",
            },
            {
                "title": "Aid, Admission and the Real Cost",
                "description": "Athletic aid, academic aid and need-based aid — and why the sticker price is not the price.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Three different pots

**Athletic aid** comes from the athletics department and is governed by the
association's rules. Available in D-I, D-II and NAIA; not in D-III.

**Academic aid** comes from the institution and is based on your record. It is
frequently larger and more durable than a partial athletic award, and it does
not disappear if you stop playing.

**Need-based aid** comes from federal, state and institutional sources and is
assessed on family finances, through the financial aid application process each
institution requires.

These stack. A D-III institution with a high sticker price and strong academic
aid can cost a family less than a public university with a small athletic award
— which is exactly why the comparison in REC-301 is done in dollars rather than
in levels.

## What this means at fifteen

The academic record is the one lever that works in all three pots **and** in
admissions. Grades are not the academic safety net because sport might not work
out. They are the thing that makes more of the map reachable while sport is
going well.

## Admissions still applies

Being recruited is not being admitted. At most institutions a coach can support
an application, sometimes strongly, but the admissions office decides, and at
academically selective institutions the academic floor for a recruited athlete
is still high. A coach who stops communicating after seeing a transcript has
usually made an admissions judgement rather than an athletic one.

## Verify everything by institution

Aid rules, scholarship structures and roster limits have changed in recent
years and continue to settle. Ask each programme directly what is available for
your class, and treat anything you were told two years ago as out of date.
""",
            },
            {
                "title": "Division Comparison Worksheet",
                "description": "Side-by-side comparison of the five destinations against your own priorities.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable worksheet for Module 2. The comparison table runs D-I, D-II, D-III,
NAIA and NJCAA across athletic aid, academic and need-based aid, certification
required, typical time demand, season length and likely playing time, with a
column for what you have verified yourself and when.

A second section scores each destination against your own three questions —
where would I actually play, what would my family pay, what is the life like —
and a closing panel separates being recruited from being admitted.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Division Research and Honest Fit",
            "description": (
                "Research the map properly, then place yourself on it honestly.\n\n"
                "Submit:\n"
                "1. A completed comparison of all five destinations, with sources and dates for "
                "anything you looked up rather than assumed.\n"
                "2. For each of D-I, D-II, D-III, NAIA and NJCAA, name one real programme in "
                "your sport within reach of your home or your academic record.\n"
                "3. The aid question. Explain in your own words how athletic, academic and "
                "need-based aid differ and how they stack. Then explain why a D-III institution "
                "can cost a family less than a public university with a partial athletic award.\n"
                "4. Your honest placement: which destinations are realistic for you right now, "
                "based on evidence rather than hope? Name the evidence — your times, your "
                "statistics, your grades, what a coach has actually told you.\n"
                "5. One paragraph on what would have to change in the next twelve months for the "
                "next tier up to become realistic.\n\n"
                "Graded on the accuracy of the research, and on whether the honest placement is "
                "supported by evidence rather than ambition."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Division Map",
            "description": "Four questions on divisions, associations and aid.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which of these does NOT award athletic scholarships?",
                    "choices": ["NCAA Division II", "NCAA Division III", "NAIA", "NJCAA"],
                    "answer": 1,
                },
                {
                    "text": "Why can a Division III institution with a high sticker price cost a family less than a public university with a partial athletic award?",
                    "choices": [
                        "Division III institutions charge athletes a reduced tuition rate",
                        "Athletic awards are taxed and academic awards are not",
                        "Academic and need-based aid stack, and are often larger and more durable",
                        "Division III seasons are shorter, so costs are lower",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the lesson say about being recruited versus being admitted?",
                    "choices": [
                        "A coach's support guarantees admission at most institutions",
                        "Recruited athletes bypass the admissions process",
                        "Admission is decided before any coach makes contact",
                        "A coach can support an application, but the admissions office decides",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What does the course say about an athlete whose list is nine Division I programmes and nothing else?",
                    "choices": [
                        "They usually have a list of zero",
                        "They are correctly focused on the highest level",
                        "They should add only more Division I programmes",
                        "They have a strong negotiating position",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Eligibility Center and the Academic Floor",
        "description": (
            "Registering, understanding core courses and the academic standard, and treating "
            "the transcript as a recruiting asset."
        ),
        "lessons": [
            {
                "title": "Registering, and What Gets Certified",
                "description": "Which account, when to open it, and what the centre actually does.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Who needs to register

Athletes expecting to compete in **NCAA Division I or II** register with the
**NCAA Eligibility Center**. Athletes heading to the **NAIA** register with the
NAIA's own eligibility centre — a separate organisation and a separate
registration. **Division III** does not generally require certification, and
**NJCAA** has its own requirements handled largely through the institution.

If you do not know yet, open a profile and upgrade it later. The cost of opening
it early is a few minutes; the cost of opening it late is finding a problem with
no time to fix it.

## What the centre certifies

Two things, neither of them athletic:

1. **Academic qualification**, against the core-course rules.
2. **Amateurism status** — whether anything you have done affects amateur
   standing. This is where NIL activity, payment, and playing with professionals
   are assessed, which is why CEO-202's records matter here.

It does not evaluate how good you are and has no influence on whether a
programme recruits you.

## What you have to do, and when

- Open the account and keep your details current.
- Have your school send transcripts at the points the centre asks for them.
- Answer the amateurism questions honestly and completely.
- Check back at the start of each academic year, because the requirements are
  revised and your own record changes.

## Where the real work is

Registration is an afternoon. The thing that actually determines certification is
four years of course selection, which CEO-102 covers in depth and which this
course treats as the recruiting asset it is. A coach weighing two similar
athletes and finding one has an academic question mark has an easy decision.
""",
            },
            {
                "title": "Core Courses, GPA and the Sliding Scale",
                "description": "The shape of the academic standard, why the numbers move, and how to verify yours.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The shape

Across recent years the Division I and II standards have shared three parts:

1. **A set number of core courses** — sixteen — distributed across English,
   mathematics at Algebra I or higher, natural or physical science, social
   science and additional academic subjects.
2. **A timing requirement in Division I**: a share of those courses, including
   several in English, maths and science, completed before the seventh semester
   begins. After that point those grades are locked.
3. **A minimum core-course GPA**, calculated from approved core courses on the
   centre's own scale — not your school's weighted GPA.

## The sliding scale

For many years Division I used a **sliding scale**: a lower core GPA required a
higher standardized test score and vice versa. The standardized-test requirement
was then removed, which changed how the standard works in practice.

Learn the principle — that the academic standard is a floor you can be below —
and **verify the current requirement yourself each year**. An athlete working
from a coach's memory of their own recruitment is working from a rulebook that
may no longer exist.

## A course is core because it is on the list

Not because it sounds academic. Every high school has an approved core-course
list filed with the centre, under its own school code. Check it **before**
choosing next year's courses, and check that any summer, online or
credit-recovery course is from an approved provider and recorded properly. This
is the single most common way an athlete loses eligibility quietly.

## The recruiting consequence

An athlete who can say "I am on track, here are my core courses by subject, here
is my core GPA, registered and verified in September" has removed a risk the
programme would otherwise have to price in. That sentence is worth more in a
coach's office than most things an athlete says about themselves.
""",
            },
            {
                "title": "Eligibility and Core-Course Tracker",
                "description": "Registration checklist and a core-course audit by subject, with a verification log.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable tracker for Module 3. The registration section covers which centre
applies to you, the account type, the date opened, when transcripts are sent and
the annual check-in date.

The audit runs the subject areas down the page with courses completed, courses
planned, the semester each falls in and a running count, beside a space for the
current-year requirements you verified yourself with their source and date. A
verification log records every answer you were given, by whom and when, because
an answer from a previous academic year is not an answer.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Registration Status and Core-Course Audit",
            "description": (
                "Use real sources. Do not copy the figures from the lesson — the lesson "
                "deliberately does not give them.\n\n"
                "Submit:\n"
                "1. Which eligibility centre applies to you, why, and your registration status "
                "with the date you opened the account or will open it.\n"
                "2. Your school's approved core-course list for the current year, with the "
                "source and date you retrieved it.\n"
                "3. A core-course audit by subject: completed with grades, planned by semester, "
                "and a running count.\n"
                "4. The current Division I and II academic requirements as published today, with "
                "the date you checked and the source, plus one sentence on how the sliding scale "
                "worked and what changed.\n"
                "5. Your own core GPA calculated on the centre's scale, with your working shown. "
                "This is the number most students get wrong.\n"
                "6. The risk paragraph: the single biggest academic risk in your plan right now, "
                "and the specific action that reduces it.\n\n"
                "Graded on the use of current dated sources, the correctness of the core GPA "
                "calculation, and whether the risk named is the real one."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Eligibility",
            "description": "Four questions on registration, core courses and the academic standard.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Which two things does the NCAA Eligibility Center certify?",
                    "choices": [
                        "Athletic ability and academic qualification",
                        "Academic qualification and amateurism status",
                        "Amateurism status and financial need",
                        "Division placement and scholarship eligibility",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What made a class a core course?",
                    "choices": [
                        "It is an honours or advanced course",
                        "It carries a full credit",
                        "It appears on that school's NCAA-approved core-course list",
                        "A college coach recommended it",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What was the sliding scale?",
                    "choices": [
                        "A reduction in tuition based on family income",
                        "A ranking of athletes by position within a recruiting class",
                        "A schedule for when coaches may contact recruits",
                        "A relationship where a lower core GPA required a higher test score, and vice versa",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Which athlete removes a risk a programme would otherwise have to price in?",
                    "choices": [
                        "One who can show they are on track, with core courses, core GPA and registration verified and dated",
                        "One with the highest weighted GPA in their school",
                        "One who registers with every eligibility centre available",
                        "One who defers all academic questions to their counsellor",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Recruiting Calendar and Contact Rules",
        "description": (
            "Why a coach's silence is often a rule rather than a verdict, and how to work "
            "with the calendar instead of against it."
        ),
        "lessons": [
            {
                "title": "Periods, and What They Permit",
                "description": "Contact, evaluation, quiet and dead periods — and who they bind.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The calendar exists

Division I and II recruiting run on a published calendar that differs by sport
and by year. It divides the year into periods, and the names are consistent even
where the dates are not:

- **Contact period.** Coaches may have in-person contact with you and your
  family, on or off campus.
- **Evaluation period.** Coaches may watch you compete and visit your school,
  but may not have in-person recruiting conversations with you off campus.
- **Quiet period.** In-person contact only on the college's own campus.
- **Dead period.** No in-person contact at all, on or off campus. Written and
  electronic communication generally continues.

## Who is bound

**The coach, not you.** You may call, email or visit a campus at any time; the
restrictions govern what the coach may do in response. That asymmetry matters:
an athlete who understands it stops reading a dead period as rejection.

## Silence usually is not a verdict

Three ordinary explanations before you conclude you are not wanted:

1. The calendar does not permit a reply yet in your sport and class.
2. There is a first-permissible-contact date for your year that has not arrived.
3. Your email went to a generic inbox, which REC-201 fixes.

## What you do with it

- Find **your sport's current calendar** and put the periods in your own
  calendar.
- Time your outreach so it lands when a coach can act on it.
- Use dead and quiet periods for the work that does not need them: film,
  grades, the target list, your own questions.
- Never ask a coach to break a rule. It puts them in a position with their
  compliance office and it is remembered.

Rules and dates change annually, so verify yours each year rather than reusing
last year's.
""",
            },
            {
                "title": "Recruiting Services, Rankings and Noise",
                "description": "What third-party services do and do not do, and how to spend nothing on the ones that matter least.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The industry around you

A large commercial industry sells access, exposure and rankings to recruiting
families. Some of it is useful and much of it is sold with urgency, which — as
CEO-101 noted — is the oldest sales technique there is.

## What is usually worth paying for

- A **film platform** coaches already use in your sport, so your film arrives in
  the format they expect.
- Occasionally, a **well-chosen event** with verified attendance by programmes on
  your list. REC-202 is about telling those apart.

## What is usually not

- **Paid rankings and star ratings.** Coaches have their own boards. Ratings
  influence attention at the very top of some sports and almost nothing
  elsewhere.
- **Profile services** that email your details to thousands of coaches. The
  generic blast is deleted; REC-201's targeted version is not.
- **"Exposure" packages** sold off the back of an unsolicited call telling you a
  coach has noticed you. Ask which coach, at which programme, and watch what
  happens.

## The screening questions

Before any payment:

1. Which specific programmes on my list use this, and how do I know?
2. What exactly do I get, and what does it replace that I could do myself?
3. Who is paid if I say yes, and what are they paid?
4. What happens if I spend nothing?

The last one is the important one. An athlete with good film, good grades and a
targeted outreach campaign is reachable without any of it, and REC-102 and
REC-201 build exactly that.
""",
            },
            {
                "title": "Calendar and Services Briefing",
                "description": "Your sport's calendar laid out, plus a screening sheet for paid services and events.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable briefing for Module 4. Page one is a twelve-month calendar grid to
fill in with your sport's current contact, evaluation, quiet and dead periods,
the first-permissible-contact date for your class, and the outreach you have
timed to land inside a period a coach can act on.

Page two is the service screening sheet: what is being sold, which programmes on
your list actually use it, what it replaces that you could do yourself, who is
paid and how much, and what happens if you spend nothing.""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Your Sport's Calendar and a Spend Decision",
            "description": (
                "Find the real calendar, then make one honest spending decision.\n\n"
                "Submit:\n"
                "1. Your sport's current recruiting calendar for your division of interest, with "
                "the source and date. Mark the contact, evaluation, quiet and dead periods and "
                "the first-permissible-contact date for your graduating class.\n"
                "2. An outreach plan timed against it: when your emails will land, and why those "
                "windows.\n"
                "3. In your own words, explain who the contact rules bind and what that means "
                "when a coach does not reply.\n"
                "4. A service screening. Take one real paid recruiting service, event or ranking "
                "product currently marketed to families in your sport. Run the four screening "
                "questions and reach a decision.\n"
                "5. The no-spend plan: write out what you would do over the next six months if "
                "your budget were zero. For most athletes this is the actual plan.\n\n"
                "Graded on whether the calendar is current and correctly read, and on whether "
                "the service screening identifies how the seller makes money."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: Calendar and Contact",
            "description": "Four questions on recruiting periods and third-party services.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "During a dead period, what is generally permitted?",
                    "choices": [
                        "In-person contact on the college campus only",
                        "Written and electronic communication, but no in-person contact",
                        "Evaluation at your competitions, but no campus visits",
                        "Nothing at all, including email",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Who do the recruiting contact rules bind?",
                    "choices": [
                        "The athlete and the coach equally",
                        "The athlete's high school coach",
                        "The college coach, not the athlete",
                        "Only athletes who have registered with an eligibility centre",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which screening question does the lesson call the important one before paying for a recruiting service?",
                    "choices": [
                        "How many coaches will see my profile?",
                        "Does it include a highlight video?",
                        "Is there a discount for paying annually?",
                        "What happens if I spend nothing?",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What does the course say about asking a coach to work around a recruiting rule?",
                    "choices": [
                        "Never do it — it puts them in a position with compliance and is remembered",
                        "It is acceptable if the request is small",
                        "It demonstrates initiative to a coaching staff",
                        "It is expected practice during quiet periods",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "The Academic Safety Net",
        "description": (
            "Treating grades as the asset that widens the map, keeps aid available and "
            "survives an injury."
        ),
        "lessons": [
            {
                "title": "Grades Widen the Map",
                "description": "How the academic record changes which programmes are reachable and what they can offer.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Three effects, all of them recruiting effects

**1. More of the map becomes reachable.** Academically selective institutions —
across every division — have a floor that a coach cannot move very far. A
stronger record puts a whole tier of programmes on your list that would
otherwise be closed regardless of how you play.

**2. More money becomes available.** Academic aid is awarded on your record and
does not come out of the athletics budget. For a coach with limited athletic aid
to distribute, an athlete who brings academic money attached is cheaper — which
is a real and widely understood recruiting advantage.

**3. Risk comes off the table.** An athlete with no academic question mark is
simpler to recruit. No waiting on a transcript, no conversation with admissions,
no chance of a certification problem in July.

## The part nobody says out loud

Coaches lose athletes to academic ineligibility every year, and it costs them a
roster spot and a season. They are therefore cautious with athletes who look
like a risk. You cannot talk your way out of that impression; you can only not
create it.

## And the obvious one

Most recruited athletes do not play professionally, and some do not finish a
career at all. The degree is what remains. CEO-102's optionality work is the
long version of this argument; the short version is that the record you build at
fifteen decides how many doors are open at twenty-two.

## What this looks like in practice

Nothing dramatic: attend, submit, ask for help early, keep the standing academic
block through the season, and protect the core courses. It is unglamorous and it
is the highest-return work in this entire pathway.
""",
            },
            {
                "title": "Protecting Grades Through a Season",
                "description": "The practical systems that keep an academic record intact while competing and travelling.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The season is the risk

Grades rarely fall because a subject is impossible. They fall during a six-week
stretch of travel, late finishes and missed classes — predictable, visible on a
calendar in August, and almost never planned for.

## Four systems

**1. The travel protocol.** Agreed in writing with each teacher before the
season: what you submit before leaving, what is due on return, how a missed
assessment is made up. An athlete with a protocol and a delayed bus has an
administrative inconvenience; an athlete without one has a zero.

**2. The standing academic block.** One protected slot a week that does not move
for anything, kept even in the weeks you feel fine — because those weeks pay for
the weeks you do not.

**3. Early flags, not late rescues.** The moment a grade moves the wrong way,
you speak to the teacher. Week two is a conversation; week nine is a
negotiation.

**4. The pre-season conversation with each teacher.** Hand them your competition
schedule and ask one question: what is the best way to stay current with your
class when I travel? You are asking for a procedure, not for leniency, and most
teachers have one.

## If something has already gone wrong

Fix it early and properly. Repeating a course, credit recovery and summer school
all work, with three conditions: an approved provider, correct recording by your
school, and completion before any applicable timing deadline. Confirm all three
**before** enrolling — this is the most common quiet eligibility failure in high
school sport.

## Tell the truth to coaches

If there is a weak semester, do not hide it. Explain what happened, what you
changed, and what the record shows since. A coach who discovers it from a
transcript draws a worse conclusion than the one you would have given them.
""",
            },
            {
                "title": "Academic Safety Net Plan",
                "description": "Travel protocol, standing block, early-flag process and the recovery decision log.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable plan for Module 5. Page one holds the travel protocol in a form each
teacher can sign off: what is submitted before departure, what is due on return,
how a missed assessment is made up, and the competition dates it covers.

Page two carries the standing academic block, the resources available to you with
times and locations, an early-flag tracker for any grade moving the wrong way,
and a recovery decision log recording the provider, its approval status and the
date your school confirmed the credit would be recorded.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Build the Safety Net Before the Season",
            "description": (
                "Part of this assignment happens in person. Plan it, then do it.\n\n"
                "Submit:\n"
                "1. Your travel protocol for the coming season, specific enough to be followed "
                "by someone else, with the competition dates it covers.\n"
                "2. Evidence of the pre-season conversation with at least two teachers: what you "
                "asked, in the brief format, and what was agreed.\n"
                "3. Your standing academic block: day, time, length, and what it is protected "
                "against.\n"
                "4. Your early-flag rule, written as a sentence: at what point do you speak to a "
                "teacher, and what do you say?\n"
                "5. An honest account of your last competitive season's effect on your grades. "
                "What moved, when, and why? If there was no effect, show the evidence.\n"
                "6. If you have a weak semester on your record, draft the two or three sentences "
                "you would say to a coach about it.\n\n"
                "Graded on whether the conversations happened, on the specificity of the travel "
                "protocol, and on the honesty of the season analysis."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: The Academic Safety Net",
            "description": "Four questions on grades as a recruiting asset and protecting them in season.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does an athlete with strong grades make a coach's recruiting job easier?",
                    "choices": [
                        "They can be recruited outside the published calendar",
                        "They may bring academic aid that does not come from the athletics budget, and carry no eligibility risk",
                        "They are exempt from the Eligibility Center process",
                        "They require fewer campus visits",
                    ],
                    "answer": 1,
                },
                {
                    "text": "When do grades most often fall, according to the lesson?",
                    "choices": [
                        "At the start of the academic year",
                        "In subjects the athlete has never studied before",
                        "During a stretch of travel, late finishes and missed classes in season",
                        "In the final weeks before graduation",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the correct response to a grade moving the wrong way in week two?",
                    "choices": [
                        "Wait until the end of term to see whether it recovers",
                        "Ask a parent to contact the school",
                        "Reduce training until the grade improves",
                        "Speak to the teacher immediately — week two is a conversation, week nine is a negotiation",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What does the course advise about a weak semester on your transcript?",
                    "choices": [
                        "Explain it to coaches yourself, with what changed and what the record shows since",
                        "Leave it unmentioned unless a coach raises it",
                        "Ask your school to remove it from the transcript",
                        "Send transcripts only after an offer is made",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Your Prospect Baseline",
        "description": (
            "The capstone: an honest written baseline of where you stand athletically and "
            "academically, and the twelve-month plan that follows from it."
        ),
        "lessons": [
            {
                "title": "Measuring Yourself Honestly",
                "description": "Getting real numbers, comparing against real benchmarks, and writing down what they say.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Numbers, not adjectives

A baseline is made of things somebody else could verify:

- **Physical and performance data** relevant to your sport: times, heights,
  weights lifted, measurements. Measured properly, not estimated.
- **Competition data**: statistics, minutes, level played, results.
- **Academic data**: unweighted GPA, core GPA, core courses completed, any test
  scores you have.
- **Film**: how much exists, from how many games, how recent.

Write the actual figures. "Pretty fast" is not a baseline.

## Compare against the right benchmarks

Find published roster data, recent signing information and event results for the
programmes on your list, and compare honestly. Most sports have broadly
understood ranges at each level, and your own coaches know them.

Two failure modes here, both common:

- **Comparing to the best athlete in the class** rather than to the athletes
  programmes on your list actually take.
- **Comparing to your teammates**, which tells you where you stand in one school
  and nothing about where you stand in a recruiting class.

## Get a second opinion

Ask two people who will tell you the truth — a varsity coach, a club coach,
someone who has recruited or been recruited recently: *based on what you have
seen, what level is realistic for me right now, and what would have to change?*

Their answer may be uncomfortable. It is also the single most useful piece of
information in this course, and it is free.

## Baseline, not verdict

Everything in a baseline is a starting point. REC-102 and REC-103 are what you
do about it, and a freshman or sophomore has a great deal of time to move the
numbers — which is exactly why you measure them now rather than later.
""",
            },
            {
                "title": "The Twelve-Month Prospect Plan",
                "description": "Turning the baseline into dated actions across film, grades, events and outreach.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Four lanes, twelve months

Your plan runs in four lanes, and the mistake is to work only the one you enjoy.

**Film.** When you will capture it, from which games, and when the first reel is
cut. REC-102 is the method.

**Academic.** Course selection for next year, core-course count, the GPA you are
protecting, the registration and verification dates.

**Development.** The specific physical or technical gaps your baseline exposed,
with how they are being worked and who is overseeing it.

**Exposure.** Events only after they have been screened for return (REC-202), and
the first outreach campaign once the film exists (REC-201).

## Sequencing rules

1. **Film before outreach.** An email with nothing to watch is a wasted first
   impression, and you only get one with each programme.
2. **Grades before everything**, because they gate which programmes can even
   consider you.
3. **One event well-chosen** beats four attended because they were advertised.

## Review it quarterly

Four times a year, against the CEO-101 OKR habit: what moved, what is at risk,
what is the next correction? A recruiting plan reviewed quarterly from the
freshman year is an entirely different thing from one assembled in a panic in
the autumn of senior year.

## Who sees this

Your parents or guardians, your high school coach, and anyone advising you.
Everyone working on your behalf should be working from the same page — which is
literally what the capstone produces.
""",
            },
            {
                "title": "Prospect Baseline and Twelve-Month Plan",
                "description": "Baseline data sheet, benchmark comparison and the four-lane plan.",
                "type": "DOCUMENT",
                "minutes": 20,
                "body": """Editable pack for the REC-101 capstone. The baseline sheet records physical and
performance data, competition statistics, academic figures and current film —
with a column for who measured each and when, so nothing on it is an estimate.

The benchmark page compares those figures against published roster and signing
data for programmes on your list, with space for the two honest second opinions
you collected. The plan runs four lanes — film, academic, development, exposure
— across twelve months, with dated actions and a quarterly review line.""",
            },
        ],
        "assignment": {
            "title": "Capstone — Prospect Baseline and Twelve-Month Plan",
            "description": (
                "Measure where you are, then write what happens next.\n\n"
                "Part A — The baseline. Real figures only: physical and performance data, "
                "competition statistics, unweighted and core GPA, core courses completed, and "
                "what film currently exists. For each, state who measured it and when. Estimates "
                "must be labelled as estimates.\n\n"
                "Part B — The benchmark. Compare your figures against published roster or "
                "signing data for five programmes on your list. Show the data and the source.\n\n"
                "Part C — Two second opinions. Ask two people who will tell you the truth what "
                "level is realistic for you right now and what would have to change. Record what "
                "they said, in their words, including anything uncomfortable.\n\n"
                "Part D — The twelve-month plan. Four lanes — film, academic, development, "
                "exposure — with dated actions and your four quarterly review dates. Respect the "
                "sequencing rules: grades first, film before outreach.\n\n"
                "Part E — One paragraph: where does your baseline differ most from where you "
                "thought you were, and what are you doing about it?\n\n"
                "Graded on whether the figures are real and sourced, on whether the second "
                "opinions were genuinely sought, and on whether the plan follows from the "
                "baseline rather than from ambition."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: The Prospect Baseline",
            "description": "Four questions on measuring yourself and planning the next twelve months.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which comparison does the course say is the useful one?",
                    "choices": [
                        "Against the best athlete in your graduating class",
                        "Against your own teammates",
                        "Against last season's version of yourself only",
                        "Against the athletes the programmes on your list actually take",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What question does the course tell you to ask two people who will be honest with you?",
                    "choices": [
                        "Do you think I will get a scholarship?",
                        "What level is realistic for me right now, and what would have to change?",
                        "Which programmes should I email first?",
                        "Am I better than the athletes at our rival school?",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the plan put film before outreach?",
                    "choices": [
                        "Coaches cannot reply to email without film on file",
                        "Film platforms require a profile before sending",
                        "An email with nothing to watch wastes the one first impression you get with each programme",
                        "Outreach is not permitted before junior year",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say a baseline is?",
                    "choices": [
                        "A starting point, measured now precisely so there is time to move it",
                        "A verdict on the level an athlete will reach",
                        "A document for coaches rather than for the athlete",
                        "A one-off exercise completed in senior year",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
]


# One handout spec per module, in module order (see `_handouts.py` for the shape).
HANDOUTS = [
    {
        "intro": (
            "Module 1's planner. Most of recruiting happens where you cannot see it, so this "
            "page is about locating yourself honestly in the funnel and knowing what is due in "
            "the school year you are actually in."
        ),
        "sections": [
            {
                "heading": "1. Where Am I in the Funnel?",
                "paragraphs": [
                    "One row per programme. “I don't know” is an honest and common "
                    "answer — write it rather than guessing upward."
                ],
                "table": {
                    "columns": ["Programme", "Stage I believe I'm at", "Evidence for that", "Last contact"],
                    "rows": [["", "", "", ""] for _ in range(5)],
                },
            },
            {
                "heading": "2. The Four-Year Timeline",
                "table": {
                    "columns": ["Year", "Academic", "Film", "Outreach", "Events"],
                    "rows": [
                        ["Freshman", "", "", "", ""],
                        ["Sophomore", "", "", "", ""],
                        ["Junior", "", "", "", ""],
                        ["Senior", "", "", "", ""],
                    ],
                },
                "fields": ["What “normal” looks like in my sport", "Who told me, and when"],
            },
            {
                "heading": "3. The Three Things I Control",
                "bullets": [
                    "The film — does it exist, is it recent, is it any good?",
                    "The academic record — is it safe, and is it verified?",
                    "Being easy to deal with — do I reply, turn up, and do what I said?",
                ],
                "fields": ["Rating /5 and evidence — film", "Rating /5 and evidence — academics", "Rating /5 and evidence — reliability", "My next action this month"],
            },
        ],
    },
    {
        "intro": (
            "Module 2's comparison. Five destinations, not a league table. Fill the verified "
            "column yourself — aid rules and roster structures have changed recently and "
            "continue to settle."
        ),
        "sections": [
            {
                "heading": "1. The Map",
                "table": {
                    "columns": ["", "Athletic aid?", "Certification required", "Time demand", "Likely playing time", "Verified by me / date"],
                    "rows": [
                        ["NCAA Division I", "", "", "", "", ""],
                        ["NCAA Division II", "", "", "", "", ""],
                        ["NCAA Division III", "", "", "", "", ""],
                        ["NAIA", "", "", "", "", ""],
                        ["NJCAA", "", "", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. One Real Programme at Each Level",
                "paragraphs": [
                    "Within reach of your home or your academic record. This is the exercise "
                    "that breaks the “nine Division I programmes and nothing else” list."
                ],
                "table": {
                    "columns": ["Level", "Programme", "Why it is realistic for me"],
                    "rows": [["D-I", "", ""], ["D-II", "", ""], ["D-III", "", ""], ["NAIA", "", ""], ["NJCAA", "", ""]],
                },
            },
            {
                "heading": "3. The Three Questions",
                "bullets": [
                    "Where would I actually play? Four years competing beats four years watching at a more famous address.",
                    "What would my family pay? Athletic, academic and need-based aid stack — the sticker price is not the price.",
                    "What is the life like? Time demand, travel, and whether my intended degree survives the schedule.",
                ],
                "fields": ["Destinations that are realistic for me today", "The evidence for that", "What would have to change for the next tier up"],
            },
        ],
    },
    {
        "intro": (
            "Module 3's tracker. Registration takes an afternoon; certification is decided by "
            "four years of course selection. Verify the current requirements yourself each "
            "September — they are revised, and an old answer is not an answer."
        ),
        "sections": [
            {
                "heading": "1. Registration",
                "table": {
                    "columns": ["Item", "Mine"],
                    "rows": [
                        ["Which centre applies to me, and why", ""],
                        ["Account type", ""],
                        ["Date opened", ""],
                        ["Who sends my transcript, and when", ""],
                        ["Annual check-in date", ""],
                    ],
                },
            },
            {
                "heading": "2. Core-Course Audit",
                "paragraphs": [
                    "A class is core because it is on your school's approved list, not because "
                    "it sounds academic. Any summer, online or recovery credit must come from an "
                    "approved provider and be recorded properly."
                ],
                "table": {
                    "columns": ["Subject area", "Completed (with grades)", "Planned", "Semester", "Running count"],
                    "rows": [
                        ["English", "", "", "", ""],
                        ["Mathematics (Algebra I+)", "", "", "", ""],
                        ["Natural / physical science", "", "", "", ""],
                        ["Additional English / maths / science", "", "", "", ""],
                        ["Social science", "", "", "", ""],
                        ["Additional academic", "", "", "", ""],
                    ],
                },
            },
            {
                "heading": "3. Verified This Year",
                "table": {
                    "columns": ["Requirement", "Current figure", "Source", "Date checked"],
                    "rows": [
                        ["Core courses required", "", "", ""],
                        ["Division I timing requirement", "", "", ""],
                        ["Minimum core GPA", "", "", ""],
                        ["Test score requirement", "", "", ""],
                        ["My own core GPA (show the working)", "", "", ""],
                    ],
                },
            },
        ],
    },
    {
        "intro": (
            "Module 4's briefing. The calendar binds the coach, not you — which is why a "
            "silence is usually a rule rather than a verdict. Fill in your own sport's dates; "
            "they change every year."
        ),
        "sections": [
            {
                "heading": "1. My Sport's Calendar",
                "table": {
                    "columns": ["Period", "Dates this year", "What a coach may do", "What I will do in it"],
                    "rows": [
                        ["Contact", "", "", ""],
                        ["Evaluation", "", "", ""],
                        ["Quiet", "", "", ""],
                        ["Dead", "", "", ""],
                    ],
                },
                "fields": ["First permissible contact date for my class", "Source and date I checked"],
            },
            {
                "heading": "2. Before You Conclude You Are Not Wanted",
                "bullets": [
                    "The calendar may not permit a reply yet in your sport and class.",
                    "The first-permissible-contact date for your year may not have arrived.",
                    "Your email may have gone to a generic inbox — REC-201 fixes that.",
                    "Never ask a coach to work around a rule. It is remembered.",
                ],
            },
            {
                "heading": "3. Screening a Paid Service or Event",
                "table": {
                    "columns": ["Question", "Answer"],
                    "rows": [
                        ["What is being sold, and for how much?", ""],
                        ["Which programmes on my list actually use it, and how do I know?", ""],
                        ["What does it replace that I could do myself?", ""],
                        ["Who is paid if I say yes, and how much?", ""],
                        ["What happens if I spend nothing?", ""],
                    ],
                },
                "fields": ["My decision", "My six-month plan if the budget were zero"],
            },
        ],
    },
    {
        "intro": (
            "Module 5's plan. Grades rarely fall because a subject is impossible — they fall "
            "during a stretch of travel that was visible on a calendar in August. These four "
            "systems are what stop that."
        ),
        "sections": [
            {
                "heading": "1. Travel Protocol",
                "paragraphs": [
                    "Agreed in writing with each teacher before the season, specific enough that "
                    "someone else could follow it."
                ],
                "table": {
                    "columns": ["Teacher / subject", "Submitted before departure", "Due on return", "How a missed assessment is made up", "Agreed on"],
                    "rows": [["", "", "", "", ""] for _ in range(4)],
                },
            },
            {
                "heading": "2. The Standing Block and the Early Flag",
                "fields": [
                    "My standing academic block — day, time, length",
                    "What it is protected against",
                    "My early-flag rule, as a sentence",
                    "Resources available to me (tutoring, office hours, study hall)",
                ],
                "bullets": [
                    "Keep the block in the weeks you feel fine — those weeks pay for the weeks you do not.",
                    "Week two is a conversation. Week nine is a negotiation.",
                    "Ask each teacher for a procedure, not for leniency.",
                ],
            },
            {
                "heading": "3. Recovery, If It Is Already Needed",
                "paragraphs": [
                    "Repeating, credit recovery and summer school all work under three "
                    "conditions — approved provider, correct recording, before any timing "
                    "deadline. Confirm all three before enrolling."
                ],
                "table": {
                    "columns": ["Course", "Provider", "Approved?", "School confirmed recording / date"],
                    "rows": [["", "", "", ""] for _ in range(3)],
                },
                "fields": ["If I have a weak semester: the two or three sentences I would say to a coach"],
            },
        ],
    },
    {
        "intro": (
            "The REC-101 capstone. A baseline is made of numbers somebody else could verify, "
            "and it is a starting point rather than a verdict — which is exactly why you "
            "measure it now, while there is time to move it."
        ),
        "sections": [
            {
                "heading": "1. The Baseline",
                "paragraphs": [
                    "Write the actual figures, and say who measured each and when. Estimates "
                    "must be labelled as estimates."
                ],
                "table": {
                    "columns": ["Measure", "Figure", "Measured by", "Date"],
                    "rows": [
                        ["Physical / performance data", "", "", ""],
                        ["Competition statistics", "", "", ""],
                        ["Level played", "", "", ""],
                        ["Unweighted GPA", "", "", ""],
                        ["Core GPA", "", "", ""],
                        ["Core courses completed", "", "", ""],
                        ["Film available (games, how recent)", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Benchmark and Second Opinions",
                "table": {
                    "columns": ["Programme", "Their published roster / signing data", "How I compare", "Source"],
                    "rows": [["", "", "", ""] for _ in range(5)],
                },
                "fields": [
                    "Second opinion 1 — who, and what they said",
                    "Second opinion 2 — who, and what they said",
                    "The uncomfortable part of what I heard",
                ],
            },
            {
                "heading": "3. The Twelve-Month Plan",
                "paragraphs": [
                    "Grades before everything; film before outreach; one well-chosen event "
                    "beats four advertised ones."
                ],
                "table": {
                    "columns": ["Lane", "Next 3 months", "Months 4-6", "Months 7-12"],
                    "rows": [
                        ["Film", "", "", ""],
                        ["Academic", "", "", ""],
                        ["Development", "", "", ""],
                        ["Exposure", "", "", ""],
                    ],
                },
                "fields": ["Quarterly review dates", "Who else has a copy of this plan"],
            },
        ],
    },
]
