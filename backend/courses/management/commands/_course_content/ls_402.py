"""LS-402: Transferable Skills Translation.

Level 4: The Executive Transition & Legacy. Written against the course's focus
(mapping athletic traits to corporate, business and entrepreneurial value) and
its core competencies: resume writing for athletes, translating sports jargon
into business terminology, and executive interview preparation.

Short shape: three modules of three Markdown lessons, with an assignment and a
quiz per module and no handout (`HANDOUTS = []`).

Resume conventions, and the word "resume" itself, are United States ones,
matching the client's brief; the lessons note where other markets differ.
"""

MODULES = [
    {
        "title": "What You Actually Have",
        "description": (
            "The skills underneath the sport, named precisely enough that somebody outside "
            "it can recognise them."
        ),
        "lessons": [
            {
                "title": "Traits Are Not Evidence",
                "description": "Why 'hard-working team player' is worth nothing, and what replaces it.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The claim everybody makes

Ask a former athlete what they bring and you get: hard-working, disciplined, a
team player, competitive, coachable, resilient.

All true, and all worthless as written, because:

- Every candidate claims them.
- None can be checked.
- They describe a personality rather than a capability.
- They do not say what you would actually do on a Tuesday.

A hiring manager reading "hard-working team player" learns nothing, and they
have read it four hundred times.

## What replaces it

**Evidence.** A specific thing you did, with a scale, a duration and an
outcome.

Not: *"Disciplined and committed."*

But: *"Trained twenty hours a week for six years alongside full-time study,
across a 140-mile weekly commute, while maintaining a 3.6 GPA."*

The second sentence contains the first and cannot be argued with. It is also
unusual, which is the point — very few twenty-two-year-olds can write it.

## The translation rule

For every trait, ask: **what did I do that proves it, and what was the
number?**

| Trait | Evidence |
|---|---|
| Disciplined | 5am sessions, five days a week, four years, while studying |
| Coachable | Rebuilt technique mid-season on a coach's instruction; ranked X by the end |
| Resilient | Returned from an ACL injury through a nine-month rehabilitation programme |
| Team player | Captained a squad of 24 across two seasons; ran the weekly meeting |
| Competitive | Competed at state level; ranked in the top N of my age group |
| Time management | Balanced 20 hours' training, a part-time job and a full course load |

The right-hand column is a resume. The left-hand column is a wasted page.

## Numbers you already have

Athletes undercount their own data. You have:

- Hours trained per week, and years.
- Squad size, and how many you were responsible for.
- Competitions, selections, rankings, records.
- Travel: distance, frequency, nights away.
- Money: budgets managed, sponsorship earned, funds raised.
- Audience: followers, reach, engagement — BM-301's figures.
- People coached, taught or mentored.
- Academic results, held simultaneously.

Write them all down. Half of them will end up in a document.

## What is genuinely rare

Be honest about which of these is unusual, because that is what to lead with:

- **Sustained commitment to a hard thing over years.** Genuinely rare in
  people your age.
- **Being coached** — receiving criticism and acting on it without defending.
  Rare at every age.
- **Performing when it counts**, repeatedly, with an audience.
- **Losing publicly and continuing.** Most people have never had to.
- **Working with people you did not choose**, for years.
- **Managing load**, LS-101's subject, at a level most students never face.

Those six are the real product. The sport is how you acquired them.

## The one caveat

LS-104's catch: it is the behaviours, not the having played. An athlete who
was late, sulked at correction and blamed teammates carries none of this.

The evidence has to be real, because the interview in Module 3 will ask for
the specifics.
""",
            },
            {
                "title": "Translating the Language",
                "description": "Saying it in words a business reader already uses.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The jargon problem

Sport has its own vocabulary and a reader outside it either does not
understand or does not weight it correctly.

"Starting varsity point guard" means a great deal to one reader and nothing
to another. "Made the travel squad" could be anything. "D1" means nothing in
most of the world.

So translate, and translate into the terms the reader already uses.

## The dictionary

| Sport | Business |
|---|---|
| Captain | Team lead; led a group of N |
| Coach's feedback | Performance review; acted on structured feedback |
| Game plan | Strategy; prepared approach |
| Film study | Analysis; data review and preparation |
| Pre-season | Planning and development cycle |
| Training block | Structured development programme |
| Selected for the squad | Selected from N applicants / top X% |
| Rehabilitation | Structured recovery programme, managed to a timeline |
| Recruiting process | Managed a multi-party application and selection process |
| Sponsorship | Business development; secured and delivered a commercial partnership |
| Running my accounts | Content production and audience growth; N reach, X% engagement |
| Team meeting | Chaired a weekly operational meeting |

## Scale, don't shrink

Translating is not downgrading. Give the scale honestly:

- "Competed nationally" is better than "played a bit" and better than
  implying professional status.
- "One of 18 selected from 300 trialists" is a selection statistic a reader
  immediately understands.
- "Managed a $4,000 seasonal budget" is real budget responsibility, however
  small it sounds to you.

## Never inflate

LS-104's integrity rule, and this is where it is tested.

Do not claim a level you did not reach, a title you did not hold, or a role
you did not do. Sport is small, it is checkable, and the people interviewing
you frequently know somebody.

**A modest, specific, true claim beats an impressive vague one**, every time —
because the specific one survives the follow-up question and the vague one
does not.

## Explain, briefly

Where a term has to stay, add five words:

> *"Varsity captain (senior team, 24 players, top division of a 60-school
> league)."*

The parenthesis costs nothing and makes the line legible to anybody.

## What to leave out

- Statistics that only mean something inside the sport.
- Every award. Pick the two that matter.
- Anything from before high school.
- Nicknames, slogans, motivational language.
- The detail of an injury, beyond the fact of a managed return.

## Outside the US

Conventions differ. "Resume" is a CV in much of the world, length norms
differ, photographs are expected in some countries and never in others, and
some markets do not use a personal statement at all.

Find out the convention for where you are applying — and that research itself
is the skill this course is teaching.
""",
            },
            {
                "title": "Finding the Gaps Honestly",
                "description": "What sport did not give you, and how to close it.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Be honest in both directions

A course that only tells you how valuable you are is flattery. The transition
goes better for people who know what they are missing.

## The common gaps

**Formal work experience.** Many athletes reach twenty-two with little. It is
the most common gap and the easiest to close — any work, any internship, any
shadowing.

**Specific technical skills.** Most roles need something: a software package,
a qualification, a language, an accounting basic. Sport gave you none of them.

**Professional written communication.** LS-205's subject. An athlete who has
only written to coaches and teammates has a real gap, and it is visible in the
first email.

**Commercial understanding.** How a business makes money, what a margin is,
what a client expects. LS-201 and BM-301 start it; most athletes need more.

**Working alone.** Sport is highly structured and highly social. Self-directed
work in an office or at home is a different skill and takes adjustment.

**Patience with slowness.** Results in sport are weekly. In most careers they
are annual, and that is genuinely difficult for people used to a scoreboard.

**Network outside sport.** LS-204's whole subject, and it is a gap that takes
years rather than months.

## Closing them

- **Take any work.** Anything is better than nothing on a page, and it
  teaches you how a workplace actually runs.
- **Get one technical qualification** relevant to where you are heading.
  Cheap, fast, and it signals seriousness.
- **Write deliberately.** LS-205's rules, in every email from now.
- **Shadow somebody**, for a day. LS-204's informational interview, extended.
- **Read about the industry** you are entering. Three hours of reading puts
  you ahead of most applicants.

## What not to do

**Apologise for the gaps.** Everybody has them, and at twenty-two nobody
expects a full career history. Naming a gap and saying what you are doing
about it is strong; apologising is not.

**Assume the sport covers it.** It does not. "I was an athlete" is not an
answer to "do you know Excel".

**Let somebody tell you it was wasted time.** It was not, and the evidence in
Lesson 1 is real. Both things are true: you have unusual strengths and
specific gaps.

## The honest self-assessment

Write two lists:

**What I have that most applicants do not.** Lesson 1's six rare things, with
evidence.

**What most applicants have that I do not.** The gaps above, specifically.

Then one line per gap: what you are doing about it, with a date.

That document is the preparation for every interview in Module 3, because the
question "what is your weakness?" is asking exactly this and almost nobody
answers it well.
""",
            },
        ],
        "assignment": {
            "title": "Module 1 — The Evidence Inventory",
            "description": (
                "Collect the raw material before writing anything.\n\n"
                "Submit:\n"
                "1. The six traits athletes claim, each rewritten as evidence with a number, "
                "a duration and an outcome from your own career.\n"
                "2. Your full number inventory: hours, years, squad sizes, selections, "
                "rankings, travel, budgets, audience figures, people coached, academic "
                "results held simultaneously.\n"
                "3. Your six rare things, with the specific evidence for each — and an honest "
                "note on any you cannot evidence.\n"
                "4. The LS-104 check: is each claim actually true of how you behaved, not "
                "just of your results?\n"
                "5. Twelve sport terms from your own life translated into business language, "
                "using the dictionary as a model.\n"
                "6. Three lines from a draft resume with the explanatory parenthesis added, "
                "so a reader outside your sport understands the scale.\n"
                "7. Anything you were tempted to inflate, and what you wrote instead.\n"
                "8. Your two lists: what you have that most applicants do not, and what most "
                "applicants have that you do not.\n"
                "9. One line per gap: what you are doing about it, with a date.\n"
                "10. If you are applying outside the US, the resume conventions for that "
                "market and where you found them.\n\n"
                "Graded on whether part 2's numbers are real and specific, and on whether "
                "part 8's second list is genuinely honest."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: What You Have",
            "description": "Four questions on evidence, translation and gaps.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why is 'hard-working team player' worth nothing on a resume?",
                    "choices": [
                        "Every candidate claims it, it cannot be checked, and it does not say what you would do on a Tuesday",
                        "It is too informal for business writing",
                        "Hiring managers prefer technical skills",
                        "It repeats what the job description already says",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the translation rule for any trait?",
                    "choices": [
                        "Find the closest business synonym",
                        "What did I do that proves it, and what was the number?",
                        "State the trait, then give an example in the interview",
                        "Rank the traits by relevance to the role",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does a modest specific claim beat an impressive vague one?",
                    "choices": [
                        "Modesty is valued in interviews",
                        "Vague claims take longer to read",
                        "The specific one survives the follow-up question",
                        "Specific claims are easier to verify by reference",
                    ],
                    "answer": 2,
                },
                {
                    "text": "How should a gap in your experience be handled?",
                    "choices": [
                        "Leave it out and redirect to strengths",
                        "Explain that athletic commitment prevented it",
                        "Apologise for it briefly and move on",
                        "Name it and say what you are doing about it, with a date",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Documents",
        "description": (
            "A resume, a cover letter and a profile that make a reader want to meet you."
        ),
        "lessons": [
            {
                "title": "Building the Resume",
                "description": "Structure, length and what a reader actually does with it.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## How it is read

Quickly. A first pass is often under a minute, frequently less, and
increasingly a system filters it before a person sees it.

Which means: the top third does most of the work, it must be scannable rather
than readable, and it must contain the words from the job description.

## The structure

**One page** at your stage. Two only with substantial experience.

1. **Name and contact.** Email (professional), phone, city, LinkedIn URL
   (LS-204). No full address, no photograph in the US, no date of birth.

2. **A summary, three lines.** Who you are, what you are aiming at, and the
   single strongest piece of evidence.

   > *Recent graduate (B.S. Kinesiology, 3.6 GPA) and four-year collegiate
   > volleyball athlete. Captained a 24-player squad and ran a $4,000 seasonal
   > budget. Seeking an entry-level role in sports operations.*

3. **Experience**, most recent first. Jobs, internships, coaching,
   volunteering — and **athletics as an entry in its own right**, because it is
   where most of your evidence lives.

4. **Education.** Degree, institution, dates, GPA if it is a strength,
   relevant coursework.

5. **Skills.** Technical and specific. Software, languages,
   certifications.

6. **Optional:** awards (two at most), volunteering, publications.

## The athletics entry

Write it like a job, because it was one:

> **Varsity Volleyball — State University** *(Aug 2021 – May 2025)*
> - Trained 20+ hours weekly across four seasons alongside a full course load,
>   maintaining a 3.6 GPA.
> - Elected team captain for two seasons; led a 24-player squad, chaired the
>   weekly player meeting and served as the link between players and coaching
>   staff.
> - Managed a $4,000 seasonal equipment budget and coordinated travel for 18
>   away fixtures a year.
> - Returned to full competition after a nine-month shoulder rehabilitation,
>   completing a structured programme with the medical staff.

Four lines, every one with a number, none of them a personality claim.

## Bullet construction

**Verb + what + scale + outcome.**

- *"Coordinated travel logistics for 18 away fixtures across four states."*
- *"Raised $7,200 for the club through a sponsored event, a 40% increase on
  the previous year."*
- *"Grew a social audience from 400 to 6,000 and secured two local sponsorship
  agreements."*

Start with a verb. No "responsible for", no "helped with", no "duties
included".

## Tailor it

The single highest-return habit, and almost nobody does it.

- Read the job description.
- Note the words it uses.
- Use those words where they are honestly true of you.
- Reorder so the most relevant experience is first.

Fifteen minutes per application, and it is the difference between a filtered
resume and an interview.

## Mechanics

- **PDF**, unless asked otherwise.
- **Named properly:** `SamEllis-Resume-2026.pdf`.
- **Plain, readable layout.** No columns that confuse a filtering system, no
  photographs, no graphics, no skill-rating bars.
- **Consistent dates and tenses.**
- **Proofread by somebody else.** A typo on a one-page document is read as
  carelessness and it is the easiest thing in this course to avoid.
""",
            },
            {
                "title": "The Cover Letter and the Application",
                "description": "The part most people skip, and why it works when it is done properly.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Why bother

Most cover letters are generic and ignored. A specific one is unusual enough
to be read, because it demonstrates the one thing a resume cannot: that you
know what this organisation does and why you want this job.

## The structure

Four paragraphs. Under one page. Addressed to a named person wherever you can
find one.

**1. Why this job, specifically.** Not "I am writing to apply". Something
about them, which proves you looked.

> *"I've followed the work your foundation has done with the after-school
> programme in Eastside since I volunteered with a similar scheme in college,
> and the operations coordinator role is exactly the work I want to be
> doing."*

**2. What you bring, with evidence.** Two or three sentences, pulled from
Module 1 and matched to what the role actually requires.

**3. Something about you that the resume cannot show.** Briefly. Why this
field, what you are trying to build, a short specific story.

**4. A clear close.** Available from a date, happy to come in, thank you.

## The rules

- **Never generic.** A letter that could go to any employer reads as one that
  did.
- **Never repeat the resume.** Add to it.
- **Short.** Four short paragraphs.
- **Their name, spelled correctly.** LS-205's point, and getting it wrong is
  fatal.
- **Proofread.**

## Applying well

- **Apply to fewer, properly.** Ten tailored applications beat a hundred
  generic ones, reliably.
- **Find a human.** LS-204's network: somebody who works there, an alumnus,
  somebody a connection knows. A referral is worth more than any document.
- **Follow up once**, after a week or two. Then stop.
- **Track it.** A sheet: role, organisation, date applied, contact, status,
  follow-up date.
- **Expect rejection**, in volume. It is the normal shape of a job search and
  it is not a verdict on you — which an athlete, of all people, is equipped to
  handle.

## Your online presence is part of the application

Assume they will search your name.

- **LinkedIn**, current and complete (LS-204).
- **The BM-101 audit**, re-run. Everything from the five flagged categories
  gone.
- **Your public accounts**, consistent with what you have claimed.
- **Privacy settings** checked.

That audit is part of the application whether you treat it that way or not.

## Using the athlete angle

It opens doors and it does not close the deal.

- **Do** mention it — it is genuinely distinguishing and it is where your
  evidence is.
- **Do not** make it the entire identity of your application. "Former athlete"
  is not a qualification.
- **Do** connect it to the role explicitly: what from it applies here.
- **Do not** assume anybody is impressed. Many will be; some will suspect you
  have no other skills, and the way to answer that suspicion is Module 1's
  evidence.
""",
            },
            {
                "title": "References and the Record",
                "description": "The people who confirm what you claimed.",
                "type": "TEXT",
                "minutes": 11,
                "body": """## Who to ask

Three or four, covering different things:

- **A coach**, who can speak to work rate, coachability and leadership — the
  strongest reference an athlete has.
- **An employer**, however small the job.
- **A professor or teacher**, who can speak to the academic side.
- **Somebody from volunteering or coaching**, if you have it.

Not: family, teammates your own age, or anybody who would struggle to be
specific.

## How to ask

Properly, in advance, with what they need:

> *"I'm applying for operations roles in sport and I wondered whether you'd be
> willing to act as a reference. I've attached my resume and the job
> description — if it helps, the things I'd most want somebody to be able to
> speak to are the captaincy and the budget work. No problem at all if you'd
> rather not."*

Three features: an advance ask, the material they need, and an easy way to
decline.

## Keep them informed

- **Tell them when you have given their name**, and for what.
- **Tell them the outcome.** LS-204's report-back rule, and it is what keeps a
  reference willing.
- **Thank them**, specifically.

## Build it years early

A reference is a relationship, not a form. The coach who writes well for you
at twenty-two is the one you stayed in contact with at nineteen.

LS-204's maintenance — twice a year, two minutes — is the mechanism.

## The record of what you did

Keep it, because memory fades and documents get lost:

- Results, selections, rankings.
- Letters, awards, certificates.
- Budget documents, sponsorship agreements (BM-301), anything you ran.
- Photographs of you working, coaching, speaking.
- Written feedback from coaches and employers.
- Academic transcripts.

One folder. You will want it at twenty-five and again at thirty-five, and by
then nobody can reconstruct it.

## Online, permanently

LS-204's argument: LinkedIn is the durable version. Put the athletic record on
it properly, keep the entries, and it persists long after anybody at your old
club can confirm anything.

## The thing to remember

A reference confirms. It does not rescue. If the evidence in Module 1 is thin
or inflated, the reference call is where that surfaces.

Which is the same point this whole course keeps making: the documents are a
description of something real, and the work is making sure the real thing is
there.
""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Write the Documents",
            "description": (
                "Real, finished, tailored to a real posting.\n\n"
                "Submit:\n"
                "1. A one-page resume as a PDF, named correctly, with all six sections.\n"
                "2. Your three-line summary, with the single strongest piece of evidence "
                "in it.\n"
                "3. Your athletics entry, written as a job, with at least four bullets each "
                "containing a number.\n"
                "4. Every bullet checked against verb + what + scale + outcome. Mark any that "
                "start with 'responsible for' or 'helped with' and rewrite them.\n"
                "5. A real job posting you could plausibly apply for, linked.\n"
                "6. Your resume tailored to that posting: what you changed, which words you "
                "took from the description, and what you reordered.\n"
                "7. A cover letter for that posting, four paragraphs, addressed to a named "
                "person you found.\n"
                "8. Evidence of the search for a human connection at that organisation: who "
                "you looked for and what you found.\n"
                "9. Your BM-101 audit re-run: what a search for your name currently returns, "
                "with a screenshot from a logged-out browser.\n"
                "10. Three references identified and asked, with the exact wording of your "
                "ask and their replies.\n"
                "11. Your record folder, with a screenshot of its structure.\n"
                "12. Your application tracker, set up.\n\n"
                "Graded on whether the resume fits on one page with real numbers, and on "
                "whether part 6 shows genuine tailoring rather than a retitled file."
            ),
            "total_marks": 250,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: The Documents",
            "description": "Four questions on resumes, cover letters and references.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "How should a bullet point be constructed?",
                    "choices": [
                        "Verb, what, scale, outcome — never 'responsible for'",
                        "Role, duration, responsibility, skill demonstrated",
                        "Context, action, result, reflection",
                        "Trait, example, evidence, reference",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the single highest-return habit in applying, that almost nobody does?",
                    "choices": [
                        "Applying within 24 hours of a posting",
                        "Tailoring the resume to the job description, using its own words where true",
                        "Attaching a portfolio",
                        "Following up twice",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What should the first paragraph of a cover letter do?",
                    "choices": [
                        "State the role and where you saw it advertised",
                        "Summarise your strongest achievement",
                        "Say why this job specifically, with something about them that proves you looked",
                        "Explain your athletic background",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does a reference do?",
                    "choices": [
                        "Compensates for gaps in experience",
                        "Vouches for potential rather than record",
                        "Replaces the need for detailed evidence",
                        "Confirms — it does not rescue, and thin or inflated claims surface there",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "The Interview",
        "description": (
            "Preparing for, and performing in, the conversation that decides it."
        ),
        "lessons": [
            {
                "title": "Preparation",
                "description": "The work that happens before the room.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Most interviews are decided by preparation

Not by charisma. By whether the candidate knew what the organisation does,
had specific examples ready, and had thought about what the role actually
involves.

That is entirely controllable, and athletes are unusually well equipped for it
because it is the same as preparing for an opponent.

## Research

- **What the organisation does**, in a sentence you could say out loud.
- **How it makes money**, or where its funding comes from.
- **Recent news** — an announcement, a launch, an award, a difficulty.
- **The role**: read the description line by line and note what each
  requirement is really asking for.
- **The people**: who is interviewing you, on LinkedIn.
- **Their competitors**, roughly.

An hour. Most candidates do fifteen minutes, and the difference is audible.

## Build the story bank

The single most useful preparation. Eight to ten specific stories from your
life, each answering a standard question type:

- A time you led something.
- A time you failed.
- A time you were criticised and acted on it.
- A time you handled pressure.
- A time you worked with somebody difficult.
- A time you had to learn something quickly.
- A time you managed competing demands.
- A time you were responsible for something going wrong.
- A time you changed your mind.
- Something you are proud of.

Write each one out. Then compress each to about ninety seconds.

Most will come from sport, and that is correct — that is where your evidence
is.

## STAR

The standard structure, and it is standard because it works:

- **Situation.** One sentence of context.
- **Task.** What you had to do.
- **Action.** What *you* did. The longest part, and the part people skip.
- **Result.** What happened, with a number where there is one.

> *"In my junior season we lost four straight and the squad had split into
> groups. (S) As captain, I had to get us functioning before the conference
> games. (T) I asked the coach for ten minutes at the start of each session,
> ran a short players-only meeting weekly, and spoke to the four players I
> thought were most disengaged individually. (A) We won six of the last eight
> and two of those four players started in the final. (R)"*

Ninety seconds, specific, and the "I" is doing the work rather than "we".

## The two questions you will definitely get

**"Tell me about yourself."** Not your life story. Ninety seconds: where you
are now, the relevant background, why this role. LS-204's thirty-second
introduction, extended.

**"What is your weakness?"** Module 1's gap list. A real gap, named honestly,
with what you are doing about it. Not "I work too hard", which is heard as an
evasion by everybody.

## Prepare your own questions

Three or four, and they must be real:

- "What does somebody who does well in this role do in their first year?"
- "What's the hardest part of the job?"
- "How is the team structured?"
- "What are you hoping to have in place twelve months from now?"

Not salary in a first interview. Not anything a search would answer.

## Practise out loud

With somebody, recorded. LS-205's method, and it is uncomfortable for exactly
one session.
""",
            },
            {
                "title": "In the Room",
                "description": "Delivery, nerves and the athlete-specific questions.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## The basics

LS-205's material, applied:

- **Early.** Fifteen minutes, in the building; two minutes, on a call.
- **Dressed slightly smarter** than the setting requires.
- **Firm handshake, eye contact, their name.**
- **Slow down.** Nerves accelerate everybody.
- **Pause before answering.** Two seconds reads as thinking.
- **Answer the question asked**, then stop.
- **Take notes**, which almost no candidate does and every interviewer
  notices.

## Nerves

Normal. MT-101's tools: long exhale, feet on the floor, attention on the first
answer rather than the whole hour.

And the athlete's advantage, said plainly: you have performed under far more
pressure than this, in front of more people, with a worse downside. An
interview is a conversation in a quiet room with somebody who wants it to go
well.

## Answering

- **Specifics, not generalities.** Every answer should contain a thing that
  happened.
- **Use the story bank**, adapted to the question rather than recited.
- **If you do not know, say so.** "I haven't done that — the closest I've done
  is X, and I'd expect to pick it up the same way." Honest, and it beats
  bluffing, which is always detected.
- **Do not criticise anybody** — a former coach, employer, teammate or
  programme. BM-302's rule, and it is the fastest way to lose a room.
- **Keep answers to about ninety seconds** unless asked for more.

## The athlete-specific questions

You will get some version of these.

**"Why not keep playing?"** Answer calmly and without bitterness, whatever the
real story. "My eligibility ended and I'd always planned to move into X." Or:
"I was injured and that decided it for me." No detail required.

**"Do you have any real work experience?"** Module 1's evidence. Name the work
you do have, then the athletics entry as the structured commitment it was.

**"Will you find office work boring after that?"** A fair question and worth a
real answer: *"The thing I actually liked was getting better at something over
years. That part transfers."*

**"Are you going to leave if a playing opportunity comes up?"** If the answer
is no, say so plainly. If you are not sure, do not lie — say what your
commitment actually is.

**"Aren't you too competitive for a team environment?"** *"Competitive about
the result, not about my teammates. I played in a squad of 24 for four years."*

## At the end

- **Ask your questions.**
- **Ask about the process and the timeline.**
- **Thank them**, by name.
- **Thank-you email within a day**, three lines, referencing something
  specific from the conversation.

## Afterwards

- **Write down what was asked** while it is fresh. The same questions recur.
- **Note what you handled badly** and fix it before the next one.
- **If rejected, ask for feedback** once, politely. Some will give it, and it
  is worth more than another ten applications.
""",
            },
            {
                "title": "The First Job, and What Comes After",
                "description": "Choosing, starting, and the long arc.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Choosing

If you are lucky enough to choose, weigh:

- **What you will learn**, which matters more than the title at this stage.
- **Who you will work for.** A good manager early is worth more than a better
  salary.
- **Whether it opens doors** or narrows them.
- **Whether you can live on it**, which LS-201's budget answers.
- **Whether you would be proud to describe it.**

What not to weigh heavily: the job title, the brand name, what sounds
impressive to people from your old life.

## The first job is not the career

Most people's first role is not the thing they end up doing, and that is
normal rather than a failure to plan. It is where you learn how work works.

Give it a proper run — a year or two — before concluding anything. LS-401's
point about patience applies: results in careers are annual, not weekly.

## Starting well

LS-104, applied:

- Early, prepared, every day.
- Do the unglamorous tasks well.
- Ask questions in the first month, when it is expected.
- Learn names, including the people with no title.
- Do what you said you would do.
- Write clearly (LS-205).
- Say little in meetings for the first few weeks.

An athlete who does those seven things stands out immediately, because the
habits are already built and most people's are not.

## The adjustments

Three things most former athletes find hard, and it helps to expect them:

**The pace.** Nothing is decided this week. Deadlines move. People take
holidays mid-project. This is not incompetence; it is how most work runs.

**The feedback gap.** No coach telling you daily how you are doing. Ask for
it: a short monthly conversation with your manager, requested by you.

**No scoreboard.** Build your own measures, as in LS-401: a qualification,
a project completed, a skill acquired.

## Keep building

- **The network** (LS-204): twice a year, two minutes.
- **The profile**, updated.
- **One new skill a year**, formally.
- **Informational interviews**, still, in whatever field you are curious
  about.

## The summary of this course

1. **Traits are worthless; evidence is everything.** Every claim gets a number.
2. **Translate the language** so a reader outside sport can weigh it.
3. **Know your gaps**, name them, and close them with dates.
4. **One page, tailored, proofread.**
5. **A story bank of ten**, in STAR, at ninety seconds each.
6. **Prepare for an hour**, which is four times what most candidates do.
7. **Start the next thing properly** — early, prepared, reliable.

## Where this goes

LS-403 is structured giving, and LS-404 is the launch — a business, a role, a
leadership position, with a plan and dates.

Both assume this one: that you can describe what you actually have in language
somebody else recognises, which is a skill, not a document.
""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Story Bank and a Real Interview",
            "description": (
                "Prepare properly, then do it under observation.\n\n"
                "Submit:\n"
                "1. An hour of research on a real organisation you would apply to: what they "
                "do, how they are funded, recent news, the role line by line, and who would "
                "interview you.\n"
                "2. Your story bank: ten stories, each written in full STAR, each compressed "
                "to a ninety-second version.\n"
                "3. For each, the question type it answers.\n"
                "4. Your check that the Action section is the longest part and uses 'I' "
                "rather than 'we'.\n"
                "5. Your ninety-second 'tell me about yourself'.\n"
                "6. Your weakness answer, built from Module 1's gap list, with what you are "
                "doing about it.\n"
                "7. Your four questions for them, with why each is worth asking.\n"
                "8. Your answers to the five athlete-specific questions, in your own words.\n"
                "9. A recorded mock interview of at least twenty minutes with somebody "
                "playing the interviewer, using questions you have not seen.\n"
                "10. Your honest review of the recording: pace, specifics, answer length, "
                "whether you criticised anybody, whether you stopped talking.\n"
                "11. Your thank-you email, written as you would send it.\n"
                "12. Your post-interview record: the questions you were asked and the two you "
                "handled worst.\n\n"
                "Graded on whether the story bank reaches ten real STAR stories, and on "
                "whether part 10 identifies genuine weaknesses in the recording."
            ),
            "total_marks": 250,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: The Interview",
            "description": "Four questions on preparation, delivery and starting.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What does STAR stand for, and which part do people skip?",
                    "choices": [
                        "Situation, Task, Action, Result — and they skip Action, which is the longest part",
                        "Story, Task, Approach, Reflection — and they skip Reflection",
                        "Setting, Target, Attempt, Review — and they skip Target",
                        "Situation, Team, Action, Result — and they skip Team",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is wrong with answering 'I work too hard' to the weakness question?",
                    "choices": [
                        "It is too common to be memorable",
                        "It is heard as an evasion by everybody",
                        "It suggests poor time management",
                        "It contradicts the athlete narrative",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What should you do if asked about something you have not done?",
                    "choices": [
                        "Describe how you would approach it in theory",
                        "Redirect to a related strength without acknowledging the gap",
                        "Say so, name the closest thing you have done, and say how you would pick it up",
                        "Ask the interviewer to move on",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What matters more than the title in a first role?",
                    "choices": [
                        "The salary",
                        "The organisation's reputation",
                        "The length of the contract",
                        "What you will learn, and who you will work for",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# No handouts: this course uses the short, text-only shape (see `__init__.py`).
HANDOUTS = []
