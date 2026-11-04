"""Hand-authored curriculum for the courses that have it, keyed by course code.

`seeddata` generates a two-module placeholder shell for a course it knows
nothing about (`Command._create_modules`): titles built from a template, lessons
that are the same shared demo PDF every time, and a quiz whose questions are
about the course's own metadata rather than its subject. That is honest filler
for a 220-course catalog nobody has written lessons for yet, but it reads as
half-built wherever a real course is on screen.

A course listed here is seeded from this file instead, in one of two shapes.
The **full** shape is six or seven modules written against the course's
description, focus and core competencies, three lessons in each (two written in
Markdown, one a downloadable handout), and an assignment and a quiz per module.
The **short** shape is two or three modules of two or three Markdown lessons,
still with an assignment and a quiz per module but no handout at all, for
courses whose curriculum is being written at a lighter weight; those files set
`HANDOUTS = []`. `Command._create_authored_content` replaces
the generated shell the first time it runs and upserts everything afterwards, so
correcting a line here lands on the next reseed without orphaning a student's
progress — see its docstring for what is deliberately create-only.

**320 of the catalog's 335 courses are written.** The Athlete CEO
Pathway (CEO-101…CEO-304), The Recruiting Pathway (REC-101…REC-303) and The
Mental Toughness Pathway (MT-101…MT-303) are written in the full shape; The
Branding & Marketing Pathway (BM-101…BM-303), the whole Athlete Life Skills &
Transition Pathway (LS-101…LS-404), the whole Parent Pathway (PAR-101…PAR-308),
the whole Cool Nerds Pathway (STU-101…STU-405, all four levels, 36 courses), the
whole Entrepreneur Pathway (ENT-101…ENT-412, all four levels, 55 courses) and
the whole Coaching Pathway (COH-101…COH-412, all four levels, 50 courses) are
written in the short one, as are the **first hundred Cool Nerds academy
courses** — the whole of Levels 1 to 5 plus the first forty of Level 6:
CN-101…CN-110 (Grades 4-5), CN-201…CN-215 (Grades 6-8), CN-301…CN-316
(Grades 9-12), CN-401…CN-410 (Undergraduate), CN-501…CN-509 (Graduate School)
and CN-601…CN-640 (Adult). The remaining 15 academy courses
(CN-641…CN-655, the rest of the Adult band) are still `catalog_only` and seed
no curriculum at all by design. Adding a course is adding a module here and a
line in COURSE_CONTENT below — and, for a CN course, dropping `catalog_only`
from its def in `seeddata.COURSE_DEFS`, because `_validate_course_defs` rejects
a def that claims both.

The catalog has three audiences. Most files address the **athlete**. The PAR
files address a **parent or guardian** directly as "you" and the young person
as "your athlete". The STU files (The Cool Nerds Pathway) address a **student**
who is not assumed to play a sport at all — academic and creative work rather
than training load — which is why STU-101 and LS-101 cover time management
separately and must not be collapsed into each other, and why STU-115 is the
accountability *system* around the single move STU-102's Module 3 teaches.
Level 2 (STU-201…STU-206) is the practical block — household and healthcare
admin, soft skills, entrance exams, studying abroad, self-directed upskilling
and resumes — and three of its files route every changeable fact to an official
source rather than stating one: STU-203 to the test-maker, STU-204 to the
destination government for the student's own nationality (it states no
immigration rule as fact, by design), and STU-206 to the local convention for
photographs, length and naming. STU-205 teaches choosing and proving a skill
where STU-101 teaches studying material somebody else set; the two are
complementary and must not be merged. Level 3 (STU-301…STU-307) is reputation,
brand, a first business, relationships, planning, leadership and keeping your
word; STU-307 is the one most easily written badly, because "loyalty" and
"honour" are the words used to pressure young people into silence, so it is
built around the distinction between loyalty and complicity and states plainly
that harm, danger and anybody at risk go to an adult. Level 4 (STU-401…STU-405)
is money, tax, long-term investing, property and travel, and the first four
carry the same financial-education disclaimer as LS-201/202/203: no product,
provider, rate or figure is named or quoted as current, and every real answer
routes to the country's regulator or revenue authority, a guardian and a
regulated professional. STU-403 is the strictest of them, because this age
group is the primary target for trading apps, "mentors" and signal groups, and
its Module 3 exists to teach the shapes of what is being sold.

The ENT files open a **fourth register**: an aspiring founder, which the
client's own sheet frames as "transitioning from athlete/student to CEO", so
they address a reader who may be an athlete, a student or both and who has no
capital, no team and no track record. ENT-103's risk material deliberately
argues for *small, survivable* risk rather than boldness, and its Module 3
handover on founder mental health after a business closes is load-bearing.
STU-303 and ENT-102/105 cover the same ground for a minor and for an adult
respectively; each file's docstring states the boundary and they must not be
collapsed. Where a file's ground is already covered for the other audience it
points at that course rather than repeating it. Keep that voice if they are
edited.

Five things in the ENT levels have to survive an edit. **ENT-114** teaches a
founder to study other people's businesses and deliberately states no revenue,
valuation or funding figure about a named real company as fact — the sources
it routes to are the company's own filings and statements, because a number
repeated from a profile is a rumour. **ENT-205, ENT-206 and ENT-207** (pricing,
selling and negotiating) are written so that nothing in them reads as a licence
to mislead a buyer; each states where persuasion stops and misrepresentation
begins, and that line is the lesson rather than a caveat on it.
**ENT-301…ENT-305** (entity choice, contracts, intellectual property, tax and
data) name no jurisdiction's rule as universal: each routes the reader to the
authority for the jurisdiction where their customer or their counterparty
actually is, and to a qualified professional before signing or filing, because
these rules differ by country and state and change. **ENT-311** (insurance and
risk transfer) and **ENT-313** (NIL and athlete-founder deals) follow PAR-301's
pattern — find and verify your own rules, quote no policy or bylaw as settled —
and **ENT-314** says plainly that a healthcare, financial or childcare idea is
regulated before it is a business, and that the regulator is the first call
rather than the last. **ENT-401 and ENT-402** (hiring and managing) route every
employment question to the law where the employee works, teach procedural
fairness before any dismissal, and keep the founder's duty of care in the frame
rather than treating people as a resourcing problem. Level 4's remaining courses
add four more. **ENT-403** (venture capital) states plainly that most businesses
should not raise equity, quotes no valuation, multiple or term as current, and
carries the advance-fee warning — a real investor never charges you to receive
their money. **ENT-406** (crisis) routes insolvency to a qualified professional
and says that continuing to trade while knowing the business cannot pay is what
turns a business failure into a personal one; its last lesson on the founder's
own state, including the crisis-line instruction, is load-bearing.
**ENT-409 and ENT-410** carry the catalog's financial disclaimer in its
strictest form — no product, rate or multiple named, tax routed to a qualified
adviser *early* because reliefs frequently need conditions met years in advance,
and post-exit depression signposted exactly as LS-401 signposts the end of a
career. **ENT-411** routes charity and social-enterprise law to the country's
regulator, says what being a trustee actually involves, and carries BM-204's
rule that people receiving help are never photographed or identified — that is
the course's ethical spine, not a presentation note.

**The Coaching Pathway (COH) opens a fifth audience: the coach**, usually
part-time, usually with no formal coach education, usually coaching the way they
were coached. COH-101 establishes the register and every other COH file refers
back to it. Three things run through all fifty and must survive an edit.
**Safeguarding is named in the first module of the first course, not deferred** —
a coach holds power over minors, the duty of care comes before the sport, and no
philosophy justifies how somebody is treated. **Nothing is stated as a universal
rule**: required checks and training, safeguarding duties, codes of conduct,
concussion protocols, eligibility rules and crisis services all differ by
country, sport and governing body, so each is routed to the coach's own
governing body, club and national authority. And the pathway **refuses
intensity, fear and humiliation as coaching methods** throughout, because that
is what many readers were coached with and will otherwise reproduce.
Five files carry framings that a careless edit would invert. **COH-102** removes
welfare decisions from the pressure frame entirely — a suspected head injury,
pain, illness, heat and any safeguarding concern are settled in advance and
never weighed against the score. **COH-103**'s professional-boundaries lesson is
the most load-bearing in the pathway: communication in the open and never
privately with an individual child, no one-to-one situations, and the rules on
transport, changing rooms, contact, photography and social media are what make
closeness safe rather than bureaucracy weighed against it. **COH-104** forbids
stopping a clip to demonstrate an individual's error in front of their peers,
and begins every review with the coach's own mistakes. **COH-107**'s "absolute"
means *consistent, not severe* — the title invites the opposite reading — and it
rejects exercise as punishment and collective punishment explicitly.
**COH-108** is the pathway's most safety-critical file: recognition and routing
rather than treatment, with the crisis instruction repeated in every module, and
"trauma-informed" taught as a way of responding rather than a licence to ask a
child about their trauma. **COH-109** carries the duty to report another adult's
conduct, which is never weighed against the season, the club's reputation, a
friendship or the possibility of being wrong, and is never handled by speaking
to the person. **COH-110** treats the coach's own sustainability as a risk to
the athletes rather than self-care advice, because an exhausted coach reverts to
the default model.

Levels 2 to 4 extend the same register outwards — the session (COH-111…COH-213),
the adults around it (COH-301…COH-313) and the programme (COH-401…COH-412) — and
several files there carry framings that are the course rather than a caveat on
it. **COH-208** refuses hazing, initiation and "earning your place" outright
rather than tolerating a harmless version. **COH-209** separates athlete leaders
from adult staff (COH-303 is the adult version) and states that welfare is the
one thing that can never be delegated to a young person. **COH-210** keeps
return-to-play a clinical decision only, never the coach's and never the
family's, and **COH-211** gives no nutritional or conditioning prescription,
refuses supplements, and routes disordered eating as COH-108 routes distress.
**COH-304** teaches a coach to find and verify their own NIL and eligibility
rules exactly as PAR-301 does for a parent. **COH-303**'s reference rule — never
a positive reference for somebody whose conduct towards young people has
concerned you — is repeated in **COH-411**, because that is the point at which a
safeguarding problem is passed to another club. **COH-312** is secure, report,
do not investigate. **COH-407** routes international moves, trafficking risk and
immigration to the destination government for the athlete's own nationality, in
the pattern STU-204 set, and refuses to proceed where legal responsibility for a
young person cannot be established in writing. **COH-410** carries the catalog's
financial disclaimer for a coach's own income. And **COH-412** closes the
pathway on leaving well — the records, standards and successor that must exist
before a departure, and the fact that an unreported safeguarding concern remains
reportable however long ago it was and whether or not the coach is still in the
sport.

**The CN files open a sixth audience: a child, addressed by school band.**
CN-101…CN-110 are written for a reader of roughly nine to eleven — short
sentences, examples from a classroom, a playground and a kitchen table, never an
office — and CN-201…CN-210 for roughly eleven to fourteen. They are not the
athlete, the parent, the older self-directed STU student, the founder or the
coach. Two framings run through the whole band and must survive an edit: **a
child's own judgement is never the last line of defence** (every file names
going to a trusted adult as the strong move, and each one carries three named
adults rather than one), and **nothing shames a child for how they feel**.

Six CN files carry framings a careless edit would invert, and in two cases the
course's own title is the thing it has to be written against. **CN-103** is the
most dangerous file in the band: "respecting elders" written carelessly teaches
a nine-year-old to comply with an adult who means them harm, so respect is
defined as *how you treat people* and separated explicitly, in every module,
from doing what an adult says — it must never become "always do as you are
told". **CN-109** is the band's safeguarding core: awareness never fear, warning
signs about **behaviour rather than strangers or appearance**, the child's job
is notice-get-away-tell and never confront or investigate, the uh-oh feeling is
sufficient on its own, and body safety is named in plain words with no euphemism
that would leave a child unable to describe what happened. **CN-105** ("Change
is an Adventure!") separates changes a child can prepare for from changes that
have happened to them, and refuses to tell a child whose family is coming apart
to look on the bright side. **CN-106** says in its first lesson that "fearless"
is the wrong word and that nobody is forced to speak. **CN-108** states that
using cleverness to make other people feel small is the opposite of what it
teaches, and that a child hiding their ability is being bullied rather than
choosing. **CN-210** carries CN-109 forward to an age with real independence,
and its Module 3 on being drawn into something — kindness first, then a
manufactured debt — is the part most likely to matter.

The CN-2xx money courses (**CN-201**, **CN-202**) carry the catalog's financial
disclaimer in its strict form, as LS-201/202/203 and STU-401/403 do: no product,
provider, platform or rate named, every figure labelled as a made-up
illustration, and every real decision routed to a parent or carer and a
regulated professional. **CN-203** states no changeable fact as fact and names
no source as reliable, teaching the reader to find whoever is responsible for an
answer instead, and it refuses the cynical failure mode — believing nothing can
be known makes somebody easier to fool, not harder. **CN-204** and **CN-207**
carry ENT-205/206/207's ethics line pitched younger, and **CN-205** refuses
STU-304's "cut people off" framing and keeps conflict and bullying separate
throughout. Every CN file that touches work, money, earning or format routes the
rules to the reader's own country, because they differ everywhere and change.

**CN-301…CN-315 address a reader of roughly fourteen to eighteen** for whom this
becomes real within a year or two. The money courses (**CN-301** credit records,
**CN-302** tax, **CN-303** investing, **CN-304** cards) carry the disclaimer in
its strictest form and name the sheet's US instruments — FICO, W-4, 1040 — only
as that country's instance of a general shape, routing every specific to the
reader's own revenue authority and financial regulator. **CN-303 is the
strictest file in the band**, because this age group is sold trading and crypto
harder than any other: it teaches the shapes, states that most active traders
lose, explains what leverage actually does, and keeps "anything guaranteed is
the warning, not the offer". **CN-306**, **CN-307** and **CN-314** carry
CN-208's honesty rule forward to documents and interviews that are now checkable
— an invention is the one error that cannot be recovered from — and CN-307 adds
that **the applicant pool is not a level field**, naming caring
responsibilities, paid work and the absence of unpaid internships as the
ordinary reasons a strong candidate looks thin on paper. **CN-310** refuses
fallacy-spotting as a weapon and keeps CN-203's refusal of the cynical endpoint.
**CN-311** refuses the manipulation reading of reading people and separates
adjusting register from changing substance. **CN-312** names fear setting's
source accurately, states no fact about the person it names, and keeps CN-206's
gate: the second kind of fear is never a planning problem. **CN-315 is the most
safeguarding-critical file in the band** — the only one where the reader holds
power over younger children — and carries COH-101's structure: safeguarding
named first, nothing stated as a universal rule, the mentor never the last line,
boundaries as what makes closeness safe, and the duty to report another person's
conduct never weighed against the scheme or a friendship.

**CN-401…CN-405 open the band's second audience: an adult.** The guardian
routing that runs from CN-101 to CN-315 is gone; what replaces it is routing to
**regulated professionals, official sources and free advice services**. CN-401
and CN-402 keep the financial disclaimer and treat **student debt and tax
without moralising** — repayment systems differ enormously and "pay it off fast"
is wrong in some of them. CN-403 states plainly that **individual stock
selection is a professional activity** taught here as comprehension rather than
edge, and refuses the property-seminar framing. CN-404 is **honest that the
hidden job market is an advantage unevenly distributed** and names the access
schemes that exist for readers without a network. CN-405 is **honest about
leverage in pay negotiation** — a graduate frequently has little, and much
advice assumes a market they are not in. **CN-406…CN-410** complete the band:
CN-406 is honest about what is and is not known about applicant tracking
systems and carries CN-308's ownership rules into portfolios (employer work,
client work and real data are frequently not yours to publish); **CN-407**
corrects the popular misuse of neuroplasticity and states that brain-training
largely does not transfer; **CN-408** formalises CN-312's rule as *never take a
positive expected value if a possible outcome is one you cannot recover from*
and refuses the cynical reading of game theory, since repeated games and
reputation are the actual condition of working life; **CN-409** never treats
harassment, bullying or discrimination as conflict to be mediated, which is the
central error a course on organisational dynamics can make; and **CN-410**
refuses the claim that everybody needs a personal brand and treats
"authenticity" as the marketed performance it is.

**CN-501…CN-509 open the band's third audience: a graduate**, roughly
twenty-two to thirty, with more capability and frequently more money. Several
files carry framings a careless edit would invert. **CN-501** states that the
base rate in early-stage investing is loss, that the available material is
survivorship, that diversification there is structural rather than optional,
and that for most people the correct allocation is zero — ENT-403's framing from
the investor's side. **CN-502** is written against its own title: "mastering the
tax code" is the belief that produces expensive errors, so it teaches the
questions and states that an accountant is not optional. **CN-503** carries
COH-308's order — act, tell the people affected, report, then communicate — and
says plainly that communications is not the remedy. **CN-504** states that
disclosure before filing can destroy patentability and that confidentiality
obligations survive a relationship. **CN-505** names the change-management
folklore (the unsourced failure rate, the unvalidated models, the grief-stage
framing) and insists that "resistance" is frequently information. **CN-506**
treats anti-bribery as the course rather than a caveat — the laws are
extraterritorial, individuals are imprisoned, and "it is how business is done
there" has never been a defence — and refuses national stereotyping. **CN-507**
carries ENT-411 and BM-204's absolute rule that people receiving help are never
photographed or identified for the giver's benefit, and is honest that
philanthropy is not neutral. **CN-508** states that innovation frameworks are
structuring devices rather than findings and names the consent, data-protection
and ethical-review obligations that user research carries. And **CN-509** is
written against *Fearless Innovation*: CN-408's rule governs it, the question is
always whose risk it is and whether they could absorb it, and safety-critical
and regulated contexts are excluded entirely, because "move fast" there is a
choice to accept a rate of harm.

**CN-601…CN-620 open the band's fourth audience: an adult at any age.** Level 6
is not a school level — it is the part of the catalog that addresses what
actually happens across a life (career change, redundancy, divorce,
bereavement, caring for parents, debt, retirement, ageing), and its readers are
thirty, fifty and seventy as readily as twenty-five. Four things run through
all twenty and must survive an edit. **Nothing is stated as a universal rule**:
employment law, family law, inheritance, tax, benefits, insolvency, care
funding and retirement systems differ completely by country, so each file
routes to the reader's own authority and to a qualified professional, and the
sheet's US instruments (filing status, 401(k)/IRA, catch-up contributions,
FICO) are named only as that country's instance in the pattern CN-301 and
CN-303 set. **The reader may be in difficulty right now**, so free confidential
services are named rather than implied, and the crisis instruction appears in
every module of the files that need it. **Circumstances are named honestly** —
age discrimination, the career-break penalty, the unequal distribution of
caring, pay gaps and damaged finances are structural rather than attitude
problems, and saying otherwise is the edit that would make the band dishonest.
And **no product, provider, scheme, rate or figure is named or quoted as
current** anywhere in it. Eleven files carry framings a careless edit would
invert. **CN-602/CN-604** are honest about applicant tracking systems and about
gaps, and CN-604 states that being behind is structural rather than a
discipline failure. **CN-603** names the unadvertised route as an advantage
unevenly distributed — CN-404's rule — and insists an informational
conversation is never a disguised request for a job. **CN-607 is the strictest
file in the band**: it never advises concealing or moving assets, names
financial abuse in the first module and routes it to a specialist domestic
abuse service before a solicitor, and states that mediation is inappropriate
where there is abuse — the single most dangerous piece of generic divorce
advice. **CN-608** makes every piece of co-parenting advice explicitly
conditional on there being no abuse, and refuses CN-304 and STU-304's "cut
people off" framing. **CN-609** is safety-first by design (romance fraud,
meeting safely, image-based abuse, coercive control) and is written against its
own title, since introversion is not a defect to be performed away.
**CN-610/CN-611** name the cohabiting trap, the capacity-document window that
closes silently, executor personal liability, and correct the five stages of
grief, which were never a description of how the bereaved grieve. **CN-612**
states that nobody is obliged to speak, that breaking down is not failing, that
a complicated or abusive relationship does not require a false tribute, and
follows the established convention on a death by suicide. **CN-614** is the
strictest financial file: being behind is never a reason to take more risk, and
CN-408's unrecoverable-outcome rule governs it. **CN-615** owns the free debt
advice instruction the rest of the band points to, and names debt as a
recognised risk factor for suicide. **CN-617** corrects the midlife-crisis
script and the contested U-shaped curve, and names ageism as structural rather
than fixable by attitude. **CN-618** refuses the assumption that every reader's
children left in the ordinary way — some never leave, some return, some will
never leave, some are estranged and some have died — and names where each of
those readers should go instead. And **CN-620** carries CN-103's rule into
adulthood: respecting parents is never obedience, nobody is obliged to care for
somebody who harmed them, and the carer's own health is treated as a condition
of the caring continuing rather than as self-care advice, in COH-110's framing.

**CN-621…CN-640 complete the Adult band's named territory** — community,
health systems, crisis, technology, social media, AI and later-life housing —
under the same four band-wide rules. Many of them carry framings a careless
edit would invert. **CN-621** is written against "respected elder": respect is
not conferred by age, the mentor who is there to be important is the first
failure mode, and mentoring a young person goes through an organisation with
COH-101's safeguarding structure attached. **CN-622** makes CN-507 and
ENT-411's rule its first lesson — the people an organisation helps are never
photographed or named for the giver's benefit — names donor-advised funds as
one country's instrument, and refuses the overhead ratio as a measure.
**CN-623** gives no clinical advice, names Medicare and health savings accounts
as United States instruments, and states that cost must never be a silent
reason to go without care. **CN-624** routes every hazard to the reader's own
emergency agency, refuses the prepper framing, and makes the
vulnerable-household plan the centre rather than an afterthought — including
that prescription medication is never stockpiled. **CN-625** does not teach
medical triage and says so, and applies CN-408's unrecoverable-outcome rule by
shrinking decisions rather than making better ones. **CN-626** refuses the
cynical position outright — institutional distrust is the sales pitch every
unregulated seller runs on — and makes "how are you paid" the central question.
**CN-627** carries CN-212 and CN-407's correction in full: brain-training
transfer is weak, neuroplasticity is oversold, and **risk reduction is not
prevention**, because the opposite framing blames people who develop dementia.
**CN-628** is written against its own title and treats mindfulness honestly,
including the adverse effects its marketing never mentions. **CN-629** says
plainly that writing about trauma can destabilise, and makes other people's
privacy the central constraint. **CN-630** refuses the condescension that older
people are inherently gullible, and gives the two rules — never remote access,
never move money — that prevent the large losses. **CN-631**'s spine is that a
child is not content: the parents decide, the child's own say grows, and the
assembly problem is what a sequence of ordinary posts reveals. **CN-632** makes
running a group a duty of care, carries CN-409's rule that harassment is never
mediated, and refuses local-group vigilantism because identification from an
image is unreliable and people are misidentified. **CN-633** puts
safety-driven invisibility first — for an abuse survivor the aim is to be hard
to find, and the "build a presence" advice does not apply. **CN-634** carries
CN-606's permissions and tax rules in full, treats disclosure as a legal
requirement, and refuses three categories outright: financial, health and
anything needing an authorisation the reader does not hold. **CN-635** states
that fluency is not accuracy and names the absolute limits — never medical,
legal, financial, dosage or a named real person. **CN-636** refuses images of
real people, names synthetic intimate imagery as criminal in a growing number
of places and any sexual imagery of a child as criminal virtually everywhere,
and presents the training and livelihood objections honestly. **CN-637** makes
CN-203's rule its spine — believing nothing makes you easier to fool — teaches
provenance rather than visual detection, and states that AI detectors must
never be used to accuse anybody. **CN-638** routes entry requirements to the
destination government's own site for the reader's own nationality, dated, in
STU-204 and COH-407's pattern, and names an AI assistant as a source that must
never be used for it. **CN-639** names Medicare as one country's system and
makes under-claiming the central problem. And **CN-640** states that the person
whose home it is decides while they have capacity, names deliberate
deprivation, and carries COH-109's reporting rule into care settings.

Several PAR courses overlap each other by design, and each file's docstring
states the angle that makes it distinct — PAR-102 is the parent's behaviour as
*modelling* while PAR-205 is the same behaviour as *representation*; PAR-102's
Module 3 raises a concern with a coach while PAR-106 is the ongoing
relationship; PAR-104 is the noise a family consumes while PAR-204 is the
attention it receives; PAR-107 is the parent's own conduct at home while
PAR-108 is the child's processing; PAR-205 is how a parent presents generally
while PAR-307 is a parent on the record or addressing a group. Keep those
boundaries when editing, or a level becomes five versions of the same course.

Two files carry safety framing that must survive any edit. **PAR-206** (the
parent's mental health course) states in every module that it teaches
recognition and routing rather than treatment, gives the crisis instruction in
plain language, and requires that a disclosure of self-harm or suicidal
thinking is acted on the same day rather than monitored. **PAR-301** teaches a
parent to *find and verify* their own NIL rules rather than stating rules that
differ by state and association and change constantly — quoting a specific
bylaw as settled fact is the one change that would make it dangerous.

The Mental Toughness courses teach performance psychology, not therapy. Each one
states that boundary and hands over to a professional where the material touches
genuine distress; that framing is deliberate and should be kept if those files
are edited. The same handover appears wherever else the material reaches real
distress — BM-103 (harassment and sextortion), BM-303 (a public mistake),
LS-102 (identity and stress) and LS-301 (family conflict, isolation and guilt) —
and for the same reason. The money courses carry the parallel disclaimer:
LS-201, LS-202 and LS-203 are financial *education*, name no product, quote no
rate as current, and route every real decision through a guardian and a
regulated professional.

Shape of one module, all keys required:

    {
        "title": str,            # unique within the course, and never one of
                                 # seeddata.GENERATED_MODULE_TITLES
        "description": str,      # one or two sentences — the student's course
                                 # page clamps it to two lines
        "lessons": [
            {
                "title": str,    # unique within the module
                "description": str,
                "type": str,     # "TEXT" | "PDF" | "DOCUMENT" — a
                                 # lessons.Lesson.ContentType value. TEXT
                                 # renders `body` as Markdown; the other two
                                 # attach the module's generated handout and
                                 # show `body` as its summary.
                "minutes": int,
                "body": str,
            },
            ...
        ],
        "assignment": {
            "title": str,
            "description": str,  # plain text — the student's assignment modal
                                 # renders it with whitespace-pre-line, not
                                 # Markdown, so asterisks and hashes show up
                                 # literally
            "total_marks": int,
            "due_in_days": int,
        },
        "quiz": {
            "title": str,
            "description": str,
            "passing_score": int,
            "minutes": int,
            "questions": [
                {
                    "text": str,
                    "choices": [str, str, str, str],  # exactly
                                 # seeddata.CHOICES_PER_QUESTION, all distinct
                    "answer": int,                    # index into `choices`
                },
                ...
            ],
        },
    }

`Command._validate_course_content` checks all of that before the seed writes a
row, so a malformed entry is a one-line error rather than a broken course.
"""

from .ceo_101 import HANDOUTS as CEO_101_HANDOUTS
from .ceo_101 import MODULES as CEO_101
from .ceo_102 import HANDOUTS as CEO_102_HANDOUTS
from .ceo_102 import MODULES as CEO_102
from .ceo_201 import HANDOUTS as CEO_201_HANDOUTS
from .ceo_201 import MODULES as CEO_201
from .ceo_202 import HANDOUTS as CEO_202_HANDOUTS
from .ceo_202 import MODULES as CEO_202
from .ceo_203 import HANDOUTS as CEO_203_HANDOUTS
from .ceo_203 import MODULES as CEO_203
from .ceo_204 import HANDOUTS as CEO_204_HANDOUTS
from .ceo_204 import MODULES as CEO_204
from .ceo_301 import HANDOUTS as CEO_301_HANDOUTS
from .ceo_301 import MODULES as CEO_301
from .ceo_302 import HANDOUTS as CEO_302_HANDOUTS
from .ceo_302 import MODULES as CEO_302
from .ceo_303 import HANDOUTS as CEO_303_HANDOUTS
from .ceo_303 import MODULES as CEO_303
from .ceo_304 import HANDOUTS as CEO_304_HANDOUTS
from .ceo_304 import MODULES as CEO_304
from .rec_101 import HANDOUTS as REC_101_HANDOUTS
from .rec_101 import MODULES as REC_101
from .rec_102 import HANDOUTS as REC_102_HANDOUTS
from .rec_102 import MODULES as REC_102
from .rec_103 import HANDOUTS as REC_103_HANDOUTS
from .rec_103 import MODULES as REC_103
from .rec_201 import HANDOUTS as REC_201_HANDOUTS
from .rec_201 import MODULES as REC_201
from .rec_202 import HANDOUTS as REC_202_HANDOUTS
from .rec_202 import MODULES as REC_202
from .rec_203 import HANDOUTS as REC_203_HANDOUTS
from .rec_203 import MODULES as REC_203
from .rec_204 import HANDOUTS as REC_204_HANDOUTS
from .rec_204 import MODULES as REC_204
from .rec_301 import HANDOUTS as REC_301_HANDOUTS
from .rec_301 import MODULES as REC_301
from .rec_302 import HANDOUTS as REC_302_HANDOUTS
from .rec_302 import MODULES as REC_302
from .rec_303 import HANDOUTS as REC_303_HANDOUTS
from .rec_303 import MODULES as REC_303
from .mt_101 import HANDOUTS as MT_101_HANDOUTS
from .mt_101 import MODULES as MT_101
from .mt_102 import HANDOUTS as MT_102_HANDOUTS
from .mt_102 import MODULES as MT_102
from .mt_103 import HANDOUTS as MT_103_HANDOUTS
from .mt_103 import MODULES as MT_103
from .mt_201 import HANDOUTS as MT_201_HANDOUTS
from .mt_201 import MODULES as MT_201
from .mt_202 import HANDOUTS as MT_202_HANDOUTS
from .mt_202 import MODULES as MT_202
from .mt_203 import HANDOUTS as MT_203_HANDOUTS
from .mt_203 import MODULES as MT_203
from .mt_204 import HANDOUTS as MT_204_HANDOUTS
from .mt_204 import MODULES as MT_204
from .mt_301 import HANDOUTS as MT_301_HANDOUTS
from .mt_301 import MODULES as MT_301
from .mt_302 import HANDOUTS as MT_302_HANDOUTS
from .mt_302 import MODULES as MT_302
from .mt_303 import HANDOUTS as MT_303_HANDOUTS
from .mt_303 import MODULES as MT_303
from .bm_101 import HANDOUTS as BM_101_HANDOUTS
from .bm_101 import MODULES as BM_101
from .bm_102 import HANDOUTS as BM_102_HANDOUTS
from .bm_102 import MODULES as BM_102
from .bm_103 import HANDOUTS as BM_103_HANDOUTS
from .bm_103 import MODULES as BM_103
from .bm_201 import HANDOUTS as BM_201_HANDOUTS
from .bm_201 import MODULES as BM_201
from .bm_202 import HANDOUTS as BM_202_HANDOUTS
from .bm_202 import MODULES as BM_202
from .bm_203 import HANDOUTS as BM_203_HANDOUTS
from .bm_203 import MODULES as BM_203
from .bm_204 import HANDOUTS as BM_204_HANDOUTS
from .bm_204 import MODULES as BM_204
from .bm_301 import HANDOUTS as BM_301_HANDOUTS
from .bm_301 import MODULES as BM_301
from .bm_302 import HANDOUTS as BM_302_HANDOUTS
from .bm_302 import MODULES as BM_302
from .bm_303 import HANDOUTS as BM_303_HANDOUTS
from .bm_303 import MODULES as BM_303
from .ls_101 import HANDOUTS as LS_101_HANDOUTS
from .ls_101 import MODULES as LS_101
from .ls_102 import HANDOUTS as LS_102_HANDOUTS
from .ls_102 import MODULES as LS_102
from .ls_103 import HANDOUTS as LS_103_HANDOUTS
from .ls_103 import MODULES as LS_103
from .ls_104 import HANDOUTS as LS_104_HANDOUTS
from .ls_104 import MODULES as LS_104
from .ls_201 import HANDOUTS as LS_201_HANDOUTS
from .ls_201 import MODULES as LS_201
from .ls_202 import HANDOUTS as LS_202_HANDOUTS
from .ls_202 import MODULES as LS_202
from .ls_203 import HANDOUTS as LS_203_HANDOUTS
from .ls_203 import MODULES as LS_203
from .ls_204 import HANDOUTS as LS_204_HANDOUTS
from .ls_204 import MODULES as LS_204
from .ls_205 import HANDOUTS as LS_205_HANDOUTS
from .ls_205 import MODULES as LS_205
from .ls_301 import HANDOUTS as LS_301_HANDOUTS
from .ls_301 import MODULES as LS_301
from .ls_302 import HANDOUTS as LS_302_HANDOUTS
from .ls_302 import MODULES as LS_302
from .ls_303 import HANDOUTS as LS_303_HANDOUTS
from .ls_303 import MODULES as LS_303
from .ls_401 import HANDOUTS as LS_401_HANDOUTS
from .ls_401 import MODULES as LS_401
from .ls_402 import HANDOUTS as LS_402_HANDOUTS
from .ls_402 import MODULES as LS_402
from .ls_403 import HANDOUTS as LS_403_HANDOUTS
from .ls_403 import MODULES as LS_403
from .ls_404 import HANDOUTS as LS_404_HANDOUTS
from .ls_404 import MODULES as LS_404
from .par_101 import HANDOUTS as PAR_101_HANDOUTS
from .par_101 import MODULES as PAR_101
from .par_102 import HANDOUTS as PAR_102_HANDOUTS
from .par_102 import MODULES as PAR_102
from .par_103 import HANDOUTS as PAR_103_HANDOUTS
from .par_103 import MODULES as PAR_103
from .par_104 import HANDOUTS as PAR_104_HANDOUTS
from .par_104 import MODULES as PAR_104
from .par_105 import HANDOUTS as PAR_105_HANDOUTS
from .par_105 import MODULES as PAR_105
from .par_106 import HANDOUTS as PAR_106_HANDOUTS
from .par_106 import MODULES as PAR_106
from .par_107 import HANDOUTS as PAR_107_HANDOUTS
from .par_107 import MODULES as PAR_107
from .par_108 import HANDOUTS as PAR_108_HANDOUTS
from .par_108 import MODULES as PAR_108
from .par_109 import HANDOUTS as PAR_109_HANDOUTS
from .par_109 import MODULES as PAR_109
from .par_201 import HANDOUTS as PAR_201_HANDOUTS
from .par_201 import MODULES as PAR_201
from .par_202 import HANDOUTS as PAR_202_HANDOUTS
from .par_202 import MODULES as PAR_202
from .par_203 import HANDOUTS as PAR_203_HANDOUTS
from .par_203 import MODULES as PAR_203
from .par_204 import HANDOUTS as PAR_204_HANDOUTS
from .par_204 import MODULES as PAR_204
from .par_205 import HANDOUTS as PAR_205_HANDOUTS
from .par_205 import MODULES as PAR_205
from .par_206 import HANDOUTS as PAR_206_HANDOUTS
from .par_206 import MODULES as PAR_206
from .par_301 import HANDOUTS as PAR_301_HANDOUTS
from .par_301 import MODULES as PAR_301
from .par_302 import HANDOUTS as PAR_302_HANDOUTS
from .par_302 import MODULES as PAR_302
from .par_303 import HANDOUTS as PAR_303_HANDOUTS
from .par_303 import MODULES as PAR_303
from .par_304 import HANDOUTS as PAR_304_HANDOUTS
from .par_304 import MODULES as PAR_304
from .par_305 import HANDOUTS as PAR_305_HANDOUTS
from .par_305 import MODULES as PAR_305
from .par_306 import HANDOUTS as PAR_306_HANDOUTS
from .par_306 import MODULES as PAR_306
from .par_307 import HANDOUTS as PAR_307_HANDOUTS
from .par_307 import MODULES as PAR_307
from .par_308 import HANDOUTS as PAR_308_HANDOUTS
from .par_308 import MODULES as PAR_308
from .stu_101 import HANDOUTS as STU_101_HANDOUTS
from .stu_101 import MODULES as STU_101
from .stu_102 import HANDOUTS as STU_102_HANDOUTS
from .stu_102 import MODULES as STU_102
from .stu_103 import HANDOUTS as STU_103_HANDOUTS
from .stu_103 import MODULES as STU_103
from .stu_104 import HANDOUTS as STU_104_HANDOUTS
from .stu_104 import MODULES as STU_104
from .stu_105 import HANDOUTS as STU_105_HANDOUTS
from .stu_105 import MODULES as STU_105
from .stu_106 import HANDOUTS as STU_106_HANDOUTS
from .stu_106 import MODULES as STU_106
from .stu_107 import HANDOUTS as STU_107_HANDOUTS
from .stu_107 import MODULES as STU_107
from .stu_108 import HANDOUTS as STU_108_HANDOUTS
from .stu_108 import MODULES as STU_108
from .stu_109 import HANDOUTS as STU_109_HANDOUTS
from .stu_109 import MODULES as STU_109
from .stu_110 import HANDOUTS as STU_110_HANDOUTS
from .stu_110 import MODULES as STU_110
from .stu_111 import HANDOUTS as STU_111_HANDOUTS
from .stu_111 import MODULES as STU_111
from .stu_112 import HANDOUTS as STU_112_HANDOUTS
from .stu_112 import MODULES as STU_112
from .stu_113 import HANDOUTS as STU_113_HANDOUTS
from .stu_113 import MODULES as STU_113
from .stu_114 import HANDOUTS as STU_114_HANDOUTS
from .stu_114 import MODULES as STU_114
from .stu_115 import HANDOUTS as STU_115_HANDOUTS
from .stu_115 import MODULES as STU_115
from .stu_201 import HANDOUTS as STU_201_HANDOUTS
from .stu_201 import MODULES as STU_201
from .stu_202 import HANDOUTS as STU_202_HANDOUTS
from .stu_202 import MODULES as STU_202
from .stu_203 import HANDOUTS as STU_203_HANDOUTS
from .stu_203 import MODULES as STU_203
from .stu_204 import HANDOUTS as STU_204_HANDOUTS
from .stu_204 import MODULES as STU_204
from .stu_205 import HANDOUTS as STU_205_HANDOUTS
from .stu_205 import MODULES as STU_205
from .stu_206 import HANDOUTS as STU_206_HANDOUTS
from .stu_206 import MODULES as STU_206
from .stu_207 import HANDOUTS as STU_207_HANDOUTS
from .stu_207 import MODULES as STU_207
from .stu_208 import HANDOUTS as STU_208_HANDOUTS
from .stu_208 import MODULES as STU_208
from .stu_209 import HANDOUTS as STU_209_HANDOUTS
from .stu_209 import MODULES as STU_209
from .stu_301 import HANDOUTS as STU_301_HANDOUTS
from .stu_301 import MODULES as STU_301
from .stu_302 import HANDOUTS as STU_302_HANDOUTS
from .stu_302 import MODULES as STU_302
from .stu_303 import HANDOUTS as STU_303_HANDOUTS
from .stu_303 import MODULES as STU_303
from .stu_304 import HANDOUTS as STU_304_HANDOUTS
from .stu_304 import MODULES as STU_304
from .stu_305 import HANDOUTS as STU_305_HANDOUTS
from .stu_305 import MODULES as STU_305
from .stu_306 import HANDOUTS as STU_306_HANDOUTS
from .stu_306 import MODULES as STU_306
from .stu_307 import HANDOUTS as STU_307_HANDOUTS
from .stu_307 import MODULES as STU_307
from .stu_401 import HANDOUTS as STU_401_HANDOUTS
from .stu_401 import MODULES as STU_401
from .stu_402 import HANDOUTS as STU_402_HANDOUTS
from .stu_402 import MODULES as STU_402
from .stu_403 import HANDOUTS as STU_403_HANDOUTS
from .stu_403 import MODULES as STU_403
from .stu_404 import HANDOUTS as STU_404_HANDOUTS
from .stu_404 import MODULES as STU_404
from .stu_405 import HANDOUTS as STU_405_HANDOUTS
from .stu_405 import MODULES as STU_405
from .ent_101 import HANDOUTS as ENT_101_HANDOUTS
from .ent_101 import MODULES as ENT_101
from .ent_102 import HANDOUTS as ENT_102_HANDOUTS
from .ent_102 import MODULES as ENT_102
from .ent_103 import HANDOUTS as ENT_103_HANDOUTS
from .ent_103 import MODULES as ENT_103
from .ent_104 import HANDOUTS as ENT_104_HANDOUTS
from .ent_104 import MODULES as ENT_104
from .ent_105 import HANDOUTS as ENT_105_HANDOUTS
from .ent_105 import MODULES as ENT_105
from .ent_106 import HANDOUTS as ENT_106_HANDOUTS
from .ent_106 import MODULES as ENT_106
from .ent_107 import HANDOUTS as ENT_107_HANDOUTS
from .ent_107 import MODULES as ENT_107
from .ent_108 import HANDOUTS as ENT_108_HANDOUTS
from .ent_108 import MODULES as ENT_108
from .ent_109 import HANDOUTS as ENT_109_HANDOUTS
from .ent_109 import MODULES as ENT_109
from .ent_110 import HANDOUTS as ENT_110_HANDOUTS
from .ent_110 import MODULES as ENT_110
from .ent_111 import HANDOUTS as ENT_111_HANDOUTS
from .ent_111 import MODULES as ENT_111
from .ent_112 import HANDOUTS as ENT_112_HANDOUTS
from .ent_112 import MODULES as ENT_112
from .ent_113 import HANDOUTS as ENT_113_HANDOUTS
from .ent_113 import MODULES as ENT_113
from .ent_114 import HANDOUTS as ENT_114_HANDOUTS
from .ent_114 import MODULES as ENT_114
from .ent_201 import HANDOUTS as ENT_201_HANDOUTS
from .ent_201 import MODULES as ENT_201
from .ent_202 import HANDOUTS as ENT_202_HANDOUTS
from .ent_202 import MODULES as ENT_202
from .ent_203 import HANDOUTS as ENT_203_HANDOUTS
from .ent_203 import MODULES as ENT_203
from .ent_204 import HANDOUTS as ENT_204_HANDOUTS
from .ent_204 import MODULES as ENT_204
from .ent_205 import HANDOUTS as ENT_205_HANDOUTS
from .ent_205 import MODULES as ENT_205
from .ent_206 import HANDOUTS as ENT_206_HANDOUTS
from .ent_206 import MODULES as ENT_206
from .ent_207 import HANDOUTS as ENT_207_HANDOUTS
from .ent_207 import MODULES as ENT_207
from .ent_208 import HANDOUTS as ENT_208_HANDOUTS
from .ent_208 import MODULES as ENT_208
from .ent_209 import HANDOUTS as ENT_209_HANDOUTS
from .ent_209 import MODULES as ENT_209
from .ent_210 import HANDOUTS as ENT_210_HANDOUTS
from .ent_210 import MODULES as ENT_210
from .ent_211 import HANDOUTS as ENT_211_HANDOUTS
from .ent_211 import MODULES as ENT_211
from .ent_212 import HANDOUTS as ENT_212_HANDOUTS
from .ent_212 import MODULES as ENT_212
from .ent_213 import HANDOUTS as ENT_213_HANDOUTS
from .ent_213 import MODULES as ENT_213
from .ent_214 import HANDOUTS as ENT_214_HANDOUTS
from .ent_214 import MODULES as ENT_214
from .ent_301 import HANDOUTS as ENT_301_HANDOUTS
from .ent_301 import MODULES as ENT_301
from .ent_302 import HANDOUTS as ENT_302_HANDOUTS
from .ent_302 import MODULES as ENT_302
from .ent_303 import HANDOUTS as ENT_303_HANDOUTS
from .ent_303 import MODULES as ENT_303
from .ent_304 import HANDOUTS as ENT_304_HANDOUTS
from .ent_304 import MODULES as ENT_304
from .ent_305 import HANDOUTS as ENT_305_HANDOUTS
from .ent_305 import MODULES as ENT_305
from .ent_306 import HANDOUTS as ENT_306_HANDOUTS
from .ent_306 import MODULES as ENT_306
from .ent_307 import HANDOUTS as ENT_307_HANDOUTS
from .ent_307 import MODULES as ENT_307
from .ent_308 import HANDOUTS as ENT_308_HANDOUTS
from .ent_308 import MODULES as ENT_308
from .ent_309 import HANDOUTS as ENT_309_HANDOUTS
from .ent_309 import MODULES as ENT_309
from .ent_310 import HANDOUTS as ENT_310_HANDOUTS
from .ent_310 import MODULES as ENT_310
from .ent_311 import HANDOUTS as ENT_311_HANDOUTS
from .ent_311 import MODULES as ENT_311
from .ent_312 import HANDOUTS as ENT_312_HANDOUTS
from .ent_312 import MODULES as ENT_312
from .ent_313 import HANDOUTS as ENT_313_HANDOUTS
from .ent_313 import MODULES as ENT_313
from .ent_314 import HANDOUTS as ENT_314_HANDOUTS
from .ent_314 import MODULES as ENT_314
from .ent_315 import HANDOUTS as ENT_315_HANDOUTS
from .ent_315 import MODULES as ENT_315
from .ent_401 import HANDOUTS as ENT_401_HANDOUTS
from .ent_401 import MODULES as ENT_401
from .ent_402 import HANDOUTS as ENT_402_HANDOUTS
from .ent_402 import MODULES as ENT_402
from .ent_403 import HANDOUTS as ENT_403_HANDOUTS
from .ent_403 import MODULES as ENT_403
from .ent_404 import HANDOUTS as ENT_404_HANDOUTS
from .ent_404 import MODULES as ENT_404
from .ent_405 import HANDOUTS as ENT_405_HANDOUTS
from .ent_405 import MODULES as ENT_405
from .ent_406 import HANDOUTS as ENT_406_HANDOUTS
from .ent_406 import MODULES as ENT_406
from .ent_407 import HANDOUTS as ENT_407_HANDOUTS
from .ent_407 import MODULES as ENT_407
from .ent_408 import HANDOUTS as ENT_408_HANDOUTS
from .ent_408 import MODULES as ENT_408
from .ent_409 import HANDOUTS as ENT_409_HANDOUTS
from .ent_409 import MODULES as ENT_409
from .ent_410 import HANDOUTS as ENT_410_HANDOUTS
from .ent_410 import MODULES as ENT_410
from .ent_411 import HANDOUTS as ENT_411_HANDOUTS
from .ent_411 import MODULES as ENT_411
from .ent_412 import HANDOUTS as ENT_412_HANDOUTS
from .ent_412 import MODULES as ENT_412
from .coh_101 import HANDOUTS as COH_101_HANDOUTS
from .coh_101 import MODULES as COH_101
from .coh_102 import HANDOUTS as COH_102_HANDOUTS
from .coh_102 import MODULES as COH_102
from .coh_103 import HANDOUTS as COH_103_HANDOUTS
from .coh_103 import MODULES as COH_103
from .coh_104 import HANDOUTS as COH_104_HANDOUTS
from .coh_104 import MODULES as COH_104
from .coh_105 import HANDOUTS as COH_105_HANDOUTS
from .coh_105 import MODULES as COH_105
from .coh_106 import HANDOUTS as COH_106_HANDOUTS
from .coh_106 import MODULES as COH_106
from .coh_107 import HANDOUTS as COH_107_HANDOUTS
from .coh_107 import MODULES as COH_107
from .coh_108 import HANDOUTS as COH_108_HANDOUTS
from .coh_108 import MODULES as COH_108
from .coh_109 import HANDOUTS as COH_109_HANDOUTS
from .coh_109 import MODULES as COH_109
from .coh_110 import HANDOUTS as COH_110_HANDOUTS
from .coh_110 import MODULES as COH_110
from .coh_111 import HANDOUTS as COH_111_HANDOUTS
from .coh_111 import MODULES as COH_111
from .coh_112 import HANDOUTS as COH_112_HANDOUTS
from .coh_112 import MODULES as COH_112
from .coh_201 import HANDOUTS as COH_201_HANDOUTS
from .coh_201 import MODULES as COH_201
from .coh_202 import HANDOUTS as COH_202_HANDOUTS
from .coh_202 import MODULES as COH_202
from .coh_203 import HANDOUTS as COH_203_HANDOUTS
from .coh_203 import MODULES as COH_203
from .coh_204 import HANDOUTS as COH_204_HANDOUTS
from .coh_204 import MODULES as COH_204
from .coh_205 import HANDOUTS as COH_205_HANDOUTS
from .coh_205 import MODULES as COH_205
from .coh_206 import HANDOUTS as COH_206_HANDOUTS
from .coh_206 import MODULES as COH_206
from .coh_207 import HANDOUTS as COH_207_HANDOUTS
from .coh_207 import MODULES as COH_207
from .coh_208 import HANDOUTS as COH_208_HANDOUTS
from .coh_208 import MODULES as COH_208
from .coh_209 import HANDOUTS as COH_209_HANDOUTS
from .coh_209 import MODULES as COH_209
from .coh_210 import HANDOUTS as COH_210_HANDOUTS
from .coh_210 import MODULES as COH_210
from .coh_211 import HANDOUTS as COH_211_HANDOUTS
from .coh_211 import MODULES as COH_211
from .coh_212 import HANDOUTS as COH_212_HANDOUTS
from .coh_212 import MODULES as COH_212
from .coh_213 import HANDOUTS as COH_213_HANDOUTS
from .coh_213 import MODULES as COH_213
from .coh_301 import HANDOUTS as COH_301_HANDOUTS
from .coh_301 import MODULES as COH_301
from .coh_302 import HANDOUTS as COH_302_HANDOUTS
from .coh_302 import MODULES as COH_302
from .coh_303 import HANDOUTS as COH_303_HANDOUTS
from .coh_303 import MODULES as COH_303
from .coh_304 import HANDOUTS as COH_304_HANDOUTS
from .coh_304 import MODULES as COH_304
from .coh_305 import HANDOUTS as COH_305_HANDOUTS
from .coh_305 import MODULES as COH_305
from .coh_306 import HANDOUTS as COH_306_HANDOUTS
from .coh_306 import MODULES as COH_306
from .coh_307 import HANDOUTS as COH_307_HANDOUTS
from .coh_307 import MODULES as COH_307
from .coh_308 import HANDOUTS as COH_308_HANDOUTS
from .coh_308 import MODULES as COH_308
from .coh_309 import HANDOUTS as COH_309_HANDOUTS
from .coh_309 import MODULES as COH_309
from .coh_310 import HANDOUTS as COH_310_HANDOUTS
from .coh_310 import MODULES as COH_310
from .coh_311 import HANDOUTS as COH_311_HANDOUTS
from .coh_311 import MODULES as COH_311
from .coh_312 import HANDOUTS as COH_312_HANDOUTS
from .coh_312 import MODULES as COH_312
from .coh_313 import HANDOUTS as COH_313_HANDOUTS
from .coh_313 import MODULES as COH_313
from .coh_401 import HANDOUTS as COH_401_HANDOUTS
from .coh_401 import MODULES as COH_401
from .coh_402 import HANDOUTS as COH_402_HANDOUTS
from .coh_402 import MODULES as COH_402
from .coh_403 import HANDOUTS as COH_403_HANDOUTS
from .coh_403 import MODULES as COH_403
from .coh_404 import HANDOUTS as COH_404_HANDOUTS
from .coh_404 import MODULES as COH_404
from .coh_405 import HANDOUTS as COH_405_HANDOUTS
from .coh_405 import MODULES as COH_405
from .coh_406 import HANDOUTS as COH_406_HANDOUTS
from .coh_406 import MODULES as COH_406
from .coh_407 import HANDOUTS as COH_407_HANDOUTS
from .coh_407 import MODULES as COH_407
from .coh_408 import HANDOUTS as COH_408_HANDOUTS
from .coh_408 import MODULES as COH_408
from .coh_409 import HANDOUTS as COH_409_HANDOUTS
from .coh_409 import MODULES as COH_409
from .coh_410 import HANDOUTS as COH_410_HANDOUTS
from .coh_410 import MODULES as COH_410
from .coh_411 import HANDOUTS as COH_411_HANDOUTS
from .coh_411 import MODULES as COH_411
from .coh_412 import HANDOUTS as COH_412_HANDOUTS
from .coh_412 import MODULES as COH_412
from .cn_101 import HANDOUTS as CN_101_HANDOUTS
from .cn_101 import MODULES as CN_101
from .cn_102 import HANDOUTS as CN_102_HANDOUTS
from .cn_102 import MODULES as CN_102
from .cn_103 import HANDOUTS as CN_103_HANDOUTS
from .cn_103 import MODULES as CN_103
from .cn_104 import HANDOUTS as CN_104_HANDOUTS
from .cn_104 import MODULES as CN_104
from .cn_105 import HANDOUTS as CN_105_HANDOUTS
from .cn_105 import MODULES as CN_105
from .cn_106 import HANDOUTS as CN_106_HANDOUTS
from .cn_106 import MODULES as CN_106
from .cn_107 import HANDOUTS as CN_107_HANDOUTS
from .cn_107 import MODULES as CN_107
from .cn_108 import HANDOUTS as CN_108_HANDOUTS
from .cn_108 import MODULES as CN_108
from .cn_109 import HANDOUTS as CN_109_HANDOUTS
from .cn_109 import MODULES as CN_109
from .cn_110 import HANDOUTS as CN_110_HANDOUTS
from .cn_110 import MODULES as CN_110
from .cn_201 import HANDOUTS as CN_201_HANDOUTS
from .cn_201 import MODULES as CN_201
from .cn_202 import HANDOUTS as CN_202_HANDOUTS
from .cn_202 import MODULES as CN_202
from .cn_203 import HANDOUTS as CN_203_HANDOUTS
from .cn_203 import MODULES as CN_203
from .cn_204 import HANDOUTS as CN_204_HANDOUTS
from .cn_204 import MODULES as CN_204
from .cn_205 import HANDOUTS as CN_205_HANDOUTS
from .cn_205 import MODULES as CN_205
from .cn_206 import HANDOUTS as CN_206_HANDOUTS
from .cn_206 import MODULES as CN_206
from .cn_207 import HANDOUTS as CN_207_HANDOUTS
from .cn_207 import MODULES as CN_207
from .cn_208 import HANDOUTS as CN_208_HANDOUTS
from .cn_208 import MODULES as CN_208
from .cn_209 import HANDOUTS as CN_209_HANDOUTS
from .cn_209 import MODULES as CN_209
from .cn_210 import HANDOUTS as CN_210_HANDOUTS
from .cn_210 import MODULES as CN_210
from .cn_301 import HANDOUTS as CN_301_HANDOUTS
from .cn_301 import MODULES as CN_301
from .cn_302 import HANDOUTS as CN_302_HANDOUTS
from .cn_302 import MODULES as CN_302
from .cn_303 import HANDOUTS as CN_303_HANDOUTS
from .cn_303 import MODULES as CN_303
from .cn_304 import HANDOUTS as CN_304_HANDOUTS
from .cn_304 import MODULES as CN_304
from .cn_305 import HANDOUTS as CN_305_HANDOUTS
from .cn_305 import MODULES as CN_305
from .cn_306 import HANDOUTS as CN_306_HANDOUTS
from .cn_306 import MODULES as CN_306
from .cn_307 import HANDOUTS as CN_307_HANDOUTS
from .cn_307 import MODULES as CN_307
from .cn_308 import HANDOUTS as CN_308_HANDOUTS
from .cn_308 import MODULES as CN_308
from .cn_309 import HANDOUTS as CN_309_HANDOUTS
from .cn_309 import MODULES as CN_309
from .cn_310 import HANDOUTS as CN_310_HANDOUTS
from .cn_310 import MODULES as CN_310
from .cn_311 import HANDOUTS as CN_311_HANDOUTS
from .cn_311 import MODULES as CN_311
from .cn_312 import HANDOUTS as CN_312_HANDOUTS
from .cn_312 import MODULES as CN_312
from .cn_313 import HANDOUTS as CN_313_HANDOUTS
from .cn_313 import MODULES as CN_313
from .cn_314 import HANDOUTS as CN_314_HANDOUTS
from .cn_314 import MODULES as CN_314
from .cn_315 import HANDOUTS as CN_315_HANDOUTS
from .cn_315 import MODULES as CN_315
from .cn_401 import HANDOUTS as CN_401_HANDOUTS
from .cn_401 import MODULES as CN_401
from .cn_402 import HANDOUTS as CN_402_HANDOUTS
from .cn_402 import MODULES as CN_402
from .cn_403 import HANDOUTS as CN_403_HANDOUTS
from .cn_403 import MODULES as CN_403
from .cn_404 import HANDOUTS as CN_404_HANDOUTS
from .cn_404 import MODULES as CN_404
from .cn_405 import HANDOUTS as CN_405_HANDOUTS
from .cn_405 import MODULES as CN_405
from .cn_211 import HANDOUTS as CN_211_HANDOUTS
from .cn_211 import MODULES as CN_211
from .cn_212 import HANDOUTS as CN_212_HANDOUTS
from .cn_212 import MODULES as CN_212
from .cn_213 import HANDOUTS as CN_213_HANDOUTS
from .cn_213 import MODULES as CN_213
from .cn_214 import HANDOUTS as CN_214_HANDOUTS
from .cn_214 import MODULES as CN_214
from .cn_215 import HANDOUTS as CN_215_HANDOUTS
from .cn_215 import MODULES as CN_215
from .cn_316 import HANDOUTS as CN_316_HANDOUTS
from .cn_316 import MODULES as CN_316
from .cn_406 import HANDOUTS as CN_406_HANDOUTS
from .cn_406 import MODULES as CN_406
from .cn_407 import HANDOUTS as CN_407_HANDOUTS
from .cn_407 import MODULES as CN_407
from .cn_408 import HANDOUTS as CN_408_HANDOUTS
from .cn_408 import MODULES as CN_408
from .cn_409 import HANDOUTS as CN_409_HANDOUTS
from .cn_409 import MODULES as CN_409
from .cn_410 import HANDOUTS as CN_410_HANDOUTS
from .cn_410 import MODULES as CN_410
from .cn_501 import HANDOUTS as CN_501_HANDOUTS
from .cn_501 import MODULES as CN_501
from .cn_502 import HANDOUTS as CN_502_HANDOUTS
from .cn_502 import MODULES as CN_502
from .cn_503 import HANDOUTS as CN_503_HANDOUTS
from .cn_503 import MODULES as CN_503
from .cn_504 import HANDOUTS as CN_504_HANDOUTS
from .cn_504 import MODULES as CN_504
from .cn_505 import HANDOUTS as CN_505_HANDOUTS
from .cn_505 import MODULES as CN_505
from .cn_506 import HANDOUTS as CN_506_HANDOUTS
from .cn_506 import MODULES as CN_506
from .cn_507 import HANDOUTS as CN_507_HANDOUTS
from .cn_507 import MODULES as CN_507
from .cn_508 import HANDOUTS as CN_508_HANDOUTS
from .cn_508 import MODULES as CN_508
from .cn_509 import HANDOUTS as CN_509_HANDOUTS
from .cn_509 import MODULES as CN_509
from .cn_601 import HANDOUTS as CN_601_HANDOUTS
from .cn_601 import MODULES as CN_601
from .cn_602 import HANDOUTS as CN_602_HANDOUTS
from .cn_602 import MODULES as CN_602
from .cn_603 import HANDOUTS as CN_603_HANDOUTS
from .cn_603 import MODULES as CN_603
from .cn_604 import HANDOUTS as CN_604_HANDOUTS
from .cn_604 import MODULES as CN_604
from .cn_605 import HANDOUTS as CN_605_HANDOUTS
from .cn_605 import MODULES as CN_605
from .cn_606 import HANDOUTS as CN_606_HANDOUTS
from .cn_606 import MODULES as CN_606
from .cn_607 import HANDOUTS as CN_607_HANDOUTS
from .cn_607 import MODULES as CN_607
from .cn_608 import HANDOUTS as CN_608_HANDOUTS
from .cn_608 import MODULES as CN_608
from .cn_609 import HANDOUTS as CN_609_HANDOUTS
from .cn_609 import MODULES as CN_609
from .cn_610 import HANDOUTS as CN_610_HANDOUTS
from .cn_610 import MODULES as CN_610
from .cn_611 import HANDOUTS as CN_611_HANDOUTS
from .cn_611 import MODULES as CN_611
from .cn_612 import HANDOUTS as CN_612_HANDOUTS
from .cn_612 import MODULES as CN_612
from .cn_613 import HANDOUTS as CN_613_HANDOUTS
from .cn_613 import MODULES as CN_613
from .cn_614 import HANDOUTS as CN_614_HANDOUTS
from .cn_614 import MODULES as CN_614
from .cn_615 import HANDOUTS as CN_615_HANDOUTS
from .cn_615 import MODULES as CN_615
from .cn_616 import HANDOUTS as CN_616_HANDOUTS
from .cn_616 import MODULES as CN_616
from .cn_617 import HANDOUTS as CN_617_HANDOUTS
from .cn_617 import MODULES as CN_617
from .cn_618 import HANDOUTS as CN_618_HANDOUTS
from .cn_618 import MODULES as CN_618
from .cn_619 import HANDOUTS as CN_619_HANDOUTS
from .cn_619 import MODULES as CN_619
from .cn_620 import HANDOUTS as CN_620_HANDOUTS
from .cn_620 import MODULES as CN_620
from .cn_621 import HANDOUTS as CN_621_HANDOUTS
from .cn_621 import MODULES as CN_621
from .cn_622 import HANDOUTS as CN_622_HANDOUTS
from .cn_622 import MODULES as CN_622
from .cn_623 import HANDOUTS as CN_623_HANDOUTS
from .cn_623 import MODULES as CN_623
from .cn_624 import HANDOUTS as CN_624_HANDOUTS
from .cn_624 import MODULES as CN_624
from .cn_625 import HANDOUTS as CN_625_HANDOUTS
from .cn_625 import MODULES as CN_625
from .cn_626 import HANDOUTS as CN_626_HANDOUTS
from .cn_626 import MODULES as CN_626
from .cn_627 import HANDOUTS as CN_627_HANDOUTS
from .cn_627 import MODULES as CN_627
from .cn_628 import HANDOUTS as CN_628_HANDOUTS
from .cn_628 import MODULES as CN_628
from .cn_629 import HANDOUTS as CN_629_HANDOUTS
from .cn_629 import MODULES as CN_629
from .cn_630 import HANDOUTS as CN_630_HANDOUTS
from .cn_630 import MODULES as CN_630
from .cn_631 import HANDOUTS as CN_631_HANDOUTS
from .cn_631 import MODULES as CN_631
from .cn_632 import HANDOUTS as CN_632_HANDOUTS
from .cn_632 import MODULES as CN_632
from .cn_633 import HANDOUTS as CN_633_HANDOUTS
from .cn_633 import MODULES as CN_633
from .cn_634 import HANDOUTS as CN_634_HANDOUTS
from .cn_634 import MODULES as CN_634
from .cn_635 import HANDOUTS as CN_635_HANDOUTS
from .cn_635 import MODULES as CN_635
from .cn_636 import HANDOUTS as CN_636_HANDOUTS
from .cn_636 import MODULES as CN_636
from .cn_637 import HANDOUTS as CN_637_HANDOUTS
from .cn_637 import MODULES as CN_637
from .cn_638 import HANDOUTS as CN_638_HANDOUTS
from .cn_638 import MODULES as CN_638
from .cn_639 import HANDOUTS as CN_639_HANDOUTS
from .cn_639 import MODULES as CN_639
from .cn_640 import HANDOUTS as CN_640_HANDOUTS
from .cn_640 import MODULES as CN_640

# Lesson content types whose file is the module's generated handout rather than
# prose in `content_data`.
HANDOUT_LESSON_TYPES = ("PDF", "DOCUMENT")


def _with_handouts(code, modules, handouts):
    """Attaches each handout spec to the lesson that carries the file.

    A course file keeps its handouts in a list parallel to MODULES rather than
    inline, so the prose of a module and the worksheet that goes with it can be
    edited without scrolling past each other. They are paired here, at import,
    and a mismatch is an ImportError rather than a module that seeds a lesson
    with nothing behind its download button.

    A module may carry **no** handout — the shorter, text-only courses are built
    that way, and those files set `HANDOUTS = []`. The pairing is therefore
    against the modules that *do* have a PDF or DOCUMENT lesson, in order, and
    what is rejected is a module with two of them or a count that does not line
    up.
    """
    carriers = []
    for module in modules:
        documents = [
            lesson for lesson in module["lessons"] if lesson["type"] in HANDOUT_LESSON_TYPES
        ]
        if len(documents) > 1:
            raise ValueError(
                f"{code} / {module['title']}: a module may carry at most one PDF or DOCUMENT "
                f"lesson, found {len(documents)}"
            )
        if documents:
            carriers.append((module, documents[0]))

    if len(carriers) != len(handouts):
        raise ValueError(
            f"{code}: {len(carriers)} module(s) carry a handout lesson but HANDOUTS holds "
            f"{len(handouts)} spec(s) — they must line up, in module order"
        )

    for (_module, lesson), handout in zip(carriers, handouts):
        lesson["handout"] = handout

    return modules


COURSE_CONTENT = {
    "CEO-101": _with_handouts("CEO-101", CEO_101, CEO_101_HANDOUTS),
    "CEO-102": _with_handouts("CEO-102", CEO_102, CEO_102_HANDOUTS),
    "CEO-201": _with_handouts("CEO-201", CEO_201, CEO_201_HANDOUTS),
    "CEO-202": _with_handouts("CEO-202", CEO_202, CEO_202_HANDOUTS),
    "CEO-203": _with_handouts("CEO-203", CEO_203, CEO_203_HANDOUTS),
    "CEO-204": _with_handouts("CEO-204", CEO_204, CEO_204_HANDOUTS),
    "CEO-301": _with_handouts("CEO-301", CEO_301, CEO_301_HANDOUTS),
    "CEO-302": _with_handouts("CEO-302", CEO_302, CEO_302_HANDOUTS),
    "CEO-303": _with_handouts("CEO-303", CEO_303, CEO_303_HANDOUTS),
    "CEO-304": _with_handouts("CEO-304", CEO_304, CEO_304_HANDOUTS),
    "REC-101": _with_handouts("REC-101", REC_101, REC_101_HANDOUTS),
    "REC-102": _with_handouts("REC-102", REC_102, REC_102_HANDOUTS),
    "REC-103": _with_handouts("REC-103", REC_103, REC_103_HANDOUTS),
    "REC-201": _with_handouts("REC-201", REC_201, REC_201_HANDOUTS),
    "REC-202": _with_handouts("REC-202", REC_202, REC_202_HANDOUTS),
    "REC-203": _with_handouts("REC-203", REC_203, REC_203_HANDOUTS),
    "REC-204": _with_handouts("REC-204", REC_204, REC_204_HANDOUTS),
    "REC-301": _with_handouts("REC-301", REC_301, REC_301_HANDOUTS),
    "REC-302": _with_handouts("REC-302", REC_302, REC_302_HANDOUTS),
    "REC-303": _with_handouts("REC-303", REC_303, REC_303_HANDOUTS),
    "MT-101": _with_handouts("MT-101", MT_101, MT_101_HANDOUTS),
    "MT-102": _with_handouts("MT-102", MT_102, MT_102_HANDOUTS),
    "MT-103": _with_handouts("MT-103", MT_103, MT_103_HANDOUTS),
    "MT-201": _with_handouts("MT-201", MT_201, MT_201_HANDOUTS),
    "MT-202": _with_handouts("MT-202", MT_202, MT_202_HANDOUTS),
    "MT-203": _with_handouts("MT-203", MT_203, MT_203_HANDOUTS),
    "MT-204": _with_handouts("MT-204", MT_204, MT_204_HANDOUTS),
    "MT-301": _with_handouts("MT-301", MT_301, MT_301_HANDOUTS),
    "MT-302": _with_handouts("MT-302", MT_302, MT_302_HANDOUTS),
    "MT-303": _with_handouts("MT-303", MT_303, MT_303_HANDOUTS),
    "BM-101": _with_handouts("BM-101", BM_101, BM_101_HANDOUTS),
    "BM-102": _with_handouts("BM-102", BM_102, BM_102_HANDOUTS),
    "BM-103": _with_handouts("BM-103", BM_103, BM_103_HANDOUTS),
    "BM-201": _with_handouts("BM-201", BM_201, BM_201_HANDOUTS),
    "BM-202": _with_handouts("BM-202", BM_202, BM_202_HANDOUTS),
    "BM-203": _with_handouts("BM-203", BM_203, BM_203_HANDOUTS),
    "BM-204": _with_handouts("BM-204", BM_204, BM_204_HANDOUTS),
    "BM-301": _with_handouts("BM-301", BM_301, BM_301_HANDOUTS),
    "BM-302": _with_handouts("BM-302", BM_302, BM_302_HANDOUTS),
    "BM-303": _with_handouts("BM-303", BM_303, BM_303_HANDOUTS),
    "LS-101": _with_handouts("LS-101", LS_101, LS_101_HANDOUTS),
    "LS-102": _with_handouts("LS-102", LS_102, LS_102_HANDOUTS),
    "LS-103": _with_handouts("LS-103", LS_103, LS_103_HANDOUTS),
    "LS-104": _with_handouts("LS-104", LS_104, LS_104_HANDOUTS),
    "LS-201": _with_handouts("LS-201", LS_201, LS_201_HANDOUTS),
    "LS-202": _with_handouts("LS-202", LS_202, LS_202_HANDOUTS),
    "LS-203": _with_handouts("LS-203", LS_203, LS_203_HANDOUTS),
    "LS-204": _with_handouts("LS-204", LS_204, LS_204_HANDOUTS),
    "LS-205": _with_handouts("LS-205", LS_205, LS_205_HANDOUTS),
    "LS-301": _with_handouts("LS-301", LS_301, LS_301_HANDOUTS),
    "LS-302": _with_handouts("LS-302", LS_302, LS_302_HANDOUTS),
    "LS-303": _with_handouts("LS-303", LS_303, LS_303_HANDOUTS),
    "LS-401": _with_handouts("LS-401", LS_401, LS_401_HANDOUTS),
    "LS-402": _with_handouts("LS-402", LS_402, LS_402_HANDOUTS),
    "LS-403": _with_handouts("LS-403", LS_403, LS_403_HANDOUTS),
    "LS-404": _with_handouts("LS-404", LS_404, LS_404_HANDOUTS),
    "PAR-101": _with_handouts("PAR-101", PAR_101, PAR_101_HANDOUTS),
    "PAR-102": _with_handouts("PAR-102", PAR_102, PAR_102_HANDOUTS),
    "PAR-103": _with_handouts("PAR-103", PAR_103, PAR_103_HANDOUTS),
    "PAR-104": _with_handouts("PAR-104", PAR_104, PAR_104_HANDOUTS),
    "PAR-105": _with_handouts("PAR-105", PAR_105, PAR_105_HANDOUTS),
    "PAR-106": _with_handouts("PAR-106", PAR_106, PAR_106_HANDOUTS),
    "PAR-107": _with_handouts("PAR-107", PAR_107, PAR_107_HANDOUTS),
    "PAR-108": _with_handouts("PAR-108", PAR_108, PAR_108_HANDOUTS),
    "PAR-109": _with_handouts("PAR-109", PAR_109, PAR_109_HANDOUTS),
    "PAR-201": _with_handouts("PAR-201", PAR_201, PAR_201_HANDOUTS),
    "PAR-202": _with_handouts("PAR-202", PAR_202, PAR_202_HANDOUTS),
    "PAR-203": _with_handouts("PAR-203", PAR_203, PAR_203_HANDOUTS),
    "PAR-204": _with_handouts("PAR-204", PAR_204, PAR_204_HANDOUTS),
    "PAR-205": _with_handouts("PAR-205", PAR_205, PAR_205_HANDOUTS),
    "PAR-206": _with_handouts("PAR-206", PAR_206, PAR_206_HANDOUTS),
    "PAR-301": _with_handouts("PAR-301", PAR_301, PAR_301_HANDOUTS),
    "PAR-302": _with_handouts("PAR-302", PAR_302, PAR_302_HANDOUTS),
    "PAR-303": _with_handouts("PAR-303", PAR_303, PAR_303_HANDOUTS),
    "PAR-304": _with_handouts("PAR-304", PAR_304, PAR_304_HANDOUTS),
    "PAR-305": _with_handouts("PAR-305", PAR_305, PAR_305_HANDOUTS),
    "PAR-306": _with_handouts("PAR-306", PAR_306, PAR_306_HANDOUTS),
    "PAR-307": _with_handouts("PAR-307", PAR_307, PAR_307_HANDOUTS),
    "PAR-308": _with_handouts("PAR-308", PAR_308, PAR_308_HANDOUTS),
    "STU-101": _with_handouts("STU-101", STU_101, STU_101_HANDOUTS),
    "STU-102": _with_handouts("STU-102", STU_102, STU_102_HANDOUTS),
    "STU-103": _with_handouts("STU-103", STU_103, STU_103_HANDOUTS),
    "STU-104": _with_handouts("STU-104", STU_104, STU_104_HANDOUTS),
    "STU-105": _with_handouts("STU-105", STU_105, STU_105_HANDOUTS),
    "STU-106": _with_handouts("STU-106", STU_106, STU_106_HANDOUTS),
    "STU-107": _with_handouts("STU-107", STU_107, STU_107_HANDOUTS),
    "STU-108": _with_handouts("STU-108", STU_108, STU_108_HANDOUTS),
    "STU-109": _with_handouts("STU-109", STU_109, STU_109_HANDOUTS),
    "STU-110": _with_handouts("STU-110", STU_110, STU_110_HANDOUTS),
    "STU-111": _with_handouts("STU-111", STU_111, STU_111_HANDOUTS),
    "STU-112": _with_handouts("STU-112", STU_112, STU_112_HANDOUTS),
    "STU-113": _with_handouts("STU-113", STU_113, STU_113_HANDOUTS),
    "STU-114": _with_handouts("STU-114", STU_114, STU_114_HANDOUTS),
    "STU-115": _with_handouts("STU-115", STU_115, STU_115_HANDOUTS),
    "STU-201": _with_handouts("STU-201", STU_201, STU_201_HANDOUTS),
    "STU-202": _with_handouts("STU-202", STU_202, STU_202_HANDOUTS),
    "STU-203": _with_handouts("STU-203", STU_203, STU_203_HANDOUTS),
    "STU-204": _with_handouts("STU-204", STU_204, STU_204_HANDOUTS),
    "STU-205": _with_handouts("STU-205", STU_205, STU_205_HANDOUTS),
    "STU-206": _with_handouts("STU-206", STU_206, STU_206_HANDOUTS),
    "STU-207": _with_handouts("STU-207", STU_207, STU_207_HANDOUTS),
    "STU-208": _with_handouts("STU-208", STU_208, STU_208_HANDOUTS),
    "STU-209": _with_handouts("STU-209", STU_209, STU_209_HANDOUTS),
    "STU-301": _with_handouts("STU-301", STU_301, STU_301_HANDOUTS),
    "STU-302": _with_handouts("STU-302", STU_302, STU_302_HANDOUTS),
    "STU-303": _with_handouts("STU-303", STU_303, STU_303_HANDOUTS),
    "STU-304": _with_handouts("STU-304", STU_304, STU_304_HANDOUTS),
    "STU-305": _with_handouts("STU-305", STU_305, STU_305_HANDOUTS),
    "STU-306": _with_handouts("STU-306", STU_306, STU_306_HANDOUTS),
    "STU-307": _with_handouts("STU-307", STU_307, STU_307_HANDOUTS),
    "STU-401": _with_handouts("STU-401", STU_401, STU_401_HANDOUTS),
    "STU-402": _with_handouts("STU-402", STU_402, STU_402_HANDOUTS),
    "STU-403": _with_handouts("STU-403", STU_403, STU_403_HANDOUTS),
    "STU-404": _with_handouts("STU-404", STU_404, STU_404_HANDOUTS),
    "STU-405": _with_handouts("STU-405", STU_405, STU_405_HANDOUTS),
    "ENT-101": _with_handouts("ENT-101", ENT_101, ENT_101_HANDOUTS),
    "ENT-102": _with_handouts("ENT-102", ENT_102, ENT_102_HANDOUTS),
    "ENT-103": _with_handouts("ENT-103", ENT_103, ENT_103_HANDOUTS),
    "ENT-104": _with_handouts("ENT-104", ENT_104, ENT_104_HANDOUTS),
    "ENT-105": _with_handouts("ENT-105", ENT_105, ENT_105_HANDOUTS),
    "ENT-106": _with_handouts("ENT-106", ENT_106, ENT_106_HANDOUTS),
    "ENT-107": _with_handouts("ENT-107", ENT_107, ENT_107_HANDOUTS),
    "ENT-108": _with_handouts("ENT-108", ENT_108, ENT_108_HANDOUTS),
    "ENT-109": _with_handouts("ENT-109", ENT_109, ENT_109_HANDOUTS),
    "ENT-110": _with_handouts("ENT-110", ENT_110, ENT_110_HANDOUTS),
    "ENT-111": _with_handouts("ENT-111", ENT_111, ENT_111_HANDOUTS),
    "ENT-112": _with_handouts("ENT-112", ENT_112, ENT_112_HANDOUTS),
    "ENT-113": _with_handouts("ENT-113", ENT_113, ENT_113_HANDOUTS),
    "ENT-114": _with_handouts("ENT-114", ENT_114, ENT_114_HANDOUTS),
    "ENT-201": _with_handouts("ENT-201", ENT_201, ENT_201_HANDOUTS),
    "ENT-202": _with_handouts("ENT-202", ENT_202, ENT_202_HANDOUTS),
    "ENT-203": _with_handouts("ENT-203", ENT_203, ENT_203_HANDOUTS),
    "ENT-204": _with_handouts("ENT-204", ENT_204, ENT_204_HANDOUTS),
    "ENT-205": _with_handouts("ENT-205", ENT_205, ENT_205_HANDOUTS),
    "ENT-206": _with_handouts("ENT-206", ENT_206, ENT_206_HANDOUTS),
    "ENT-207": _with_handouts("ENT-207", ENT_207, ENT_207_HANDOUTS),
    "ENT-208": _with_handouts("ENT-208", ENT_208, ENT_208_HANDOUTS),
    "ENT-209": _with_handouts("ENT-209", ENT_209, ENT_209_HANDOUTS),
    "ENT-210": _with_handouts("ENT-210", ENT_210, ENT_210_HANDOUTS),
    "ENT-211": _with_handouts("ENT-211", ENT_211, ENT_211_HANDOUTS),
    "ENT-212": _with_handouts("ENT-212", ENT_212, ENT_212_HANDOUTS),
    "ENT-213": _with_handouts("ENT-213", ENT_213, ENT_213_HANDOUTS),
    "ENT-214": _with_handouts("ENT-214", ENT_214, ENT_214_HANDOUTS),
    "ENT-301": _with_handouts("ENT-301", ENT_301, ENT_301_HANDOUTS),
    "ENT-302": _with_handouts("ENT-302", ENT_302, ENT_302_HANDOUTS),
    "ENT-303": _with_handouts("ENT-303", ENT_303, ENT_303_HANDOUTS),
    "ENT-304": _with_handouts("ENT-304", ENT_304, ENT_304_HANDOUTS),
    "ENT-305": _with_handouts("ENT-305", ENT_305, ENT_305_HANDOUTS),
    "ENT-306": _with_handouts("ENT-306", ENT_306, ENT_306_HANDOUTS),
    "ENT-307": _with_handouts("ENT-307", ENT_307, ENT_307_HANDOUTS),
    "ENT-308": _with_handouts("ENT-308", ENT_308, ENT_308_HANDOUTS),
    "ENT-309": _with_handouts("ENT-309", ENT_309, ENT_309_HANDOUTS),
    "ENT-310": _with_handouts("ENT-310", ENT_310, ENT_310_HANDOUTS),
    "ENT-311": _with_handouts("ENT-311", ENT_311, ENT_311_HANDOUTS),
    "ENT-312": _with_handouts("ENT-312", ENT_312, ENT_312_HANDOUTS),
    "ENT-313": _with_handouts("ENT-313", ENT_313, ENT_313_HANDOUTS),
    "ENT-314": _with_handouts("ENT-314", ENT_314, ENT_314_HANDOUTS),
    "ENT-315": _with_handouts("ENT-315", ENT_315, ENT_315_HANDOUTS),
    "ENT-401": _with_handouts("ENT-401", ENT_401, ENT_401_HANDOUTS),
    "ENT-402": _with_handouts("ENT-402", ENT_402, ENT_402_HANDOUTS),
    "ENT-403": _with_handouts("ENT-403", ENT_403, ENT_403_HANDOUTS),
    "ENT-404": _with_handouts("ENT-404", ENT_404, ENT_404_HANDOUTS),
    "ENT-405": _with_handouts("ENT-405", ENT_405, ENT_405_HANDOUTS),
    "ENT-406": _with_handouts("ENT-406", ENT_406, ENT_406_HANDOUTS),
    "ENT-407": _with_handouts("ENT-407", ENT_407, ENT_407_HANDOUTS),
    "ENT-408": _with_handouts("ENT-408", ENT_408, ENT_408_HANDOUTS),
    "ENT-409": _with_handouts("ENT-409", ENT_409, ENT_409_HANDOUTS),
    "ENT-410": _with_handouts("ENT-410", ENT_410, ENT_410_HANDOUTS),
    "ENT-411": _with_handouts("ENT-411", ENT_411, ENT_411_HANDOUTS),
    "ENT-412": _with_handouts("ENT-412", ENT_412, ENT_412_HANDOUTS),
    "COH-101": _with_handouts("COH-101", COH_101, COH_101_HANDOUTS),
    "COH-102": _with_handouts("COH-102", COH_102, COH_102_HANDOUTS),
    "COH-103": _with_handouts("COH-103", COH_103, COH_103_HANDOUTS),
    "COH-104": _with_handouts("COH-104", COH_104, COH_104_HANDOUTS),
    "COH-105": _with_handouts("COH-105", COH_105, COH_105_HANDOUTS),
    "COH-106": _with_handouts("COH-106", COH_106, COH_106_HANDOUTS),
    "COH-107": _with_handouts("COH-107", COH_107, COH_107_HANDOUTS),
    "COH-108": _with_handouts("COH-108", COH_108, COH_108_HANDOUTS),
    "COH-109": _with_handouts("COH-109", COH_109, COH_109_HANDOUTS),
    "COH-110": _with_handouts("COH-110", COH_110, COH_110_HANDOUTS),
    "COH-111": _with_handouts("COH-111", COH_111, COH_111_HANDOUTS),
    "COH-112": _with_handouts("COH-112", COH_112, COH_112_HANDOUTS),
    "COH-201": _with_handouts("COH-201", COH_201, COH_201_HANDOUTS),
    "COH-202": _with_handouts("COH-202", COH_202, COH_202_HANDOUTS),
    "COH-203": _with_handouts("COH-203", COH_203, COH_203_HANDOUTS),
    "COH-204": _with_handouts("COH-204", COH_204, COH_204_HANDOUTS),
    "COH-205": _with_handouts("COH-205", COH_205, COH_205_HANDOUTS),
    "COH-206": _with_handouts("COH-206", COH_206, COH_206_HANDOUTS),
    "COH-207": _with_handouts("COH-207", COH_207, COH_207_HANDOUTS),
    "COH-208": _with_handouts("COH-208", COH_208, COH_208_HANDOUTS),
    "COH-209": _with_handouts("COH-209", COH_209, COH_209_HANDOUTS),
    "COH-210": _with_handouts("COH-210", COH_210, COH_210_HANDOUTS),
    "COH-211": _with_handouts("COH-211", COH_211, COH_211_HANDOUTS),
    "COH-212": _with_handouts("COH-212", COH_212, COH_212_HANDOUTS),
    "COH-213": _with_handouts("COH-213", COH_213, COH_213_HANDOUTS),
    "COH-301": _with_handouts("COH-301", COH_301, COH_301_HANDOUTS),
    "COH-302": _with_handouts("COH-302", COH_302, COH_302_HANDOUTS),
    "COH-303": _with_handouts("COH-303", COH_303, COH_303_HANDOUTS),
    "COH-304": _with_handouts("COH-304", COH_304, COH_304_HANDOUTS),
    "COH-305": _with_handouts("COH-305", COH_305, COH_305_HANDOUTS),
    "COH-306": _with_handouts("COH-306", COH_306, COH_306_HANDOUTS),
    "COH-307": _with_handouts("COH-307", COH_307, COH_307_HANDOUTS),
    "COH-308": _with_handouts("COH-308", COH_308, COH_308_HANDOUTS),
    "COH-309": _with_handouts("COH-309", COH_309, COH_309_HANDOUTS),
    "COH-310": _with_handouts("COH-310", COH_310, COH_310_HANDOUTS),
    "COH-311": _with_handouts("COH-311", COH_311, COH_311_HANDOUTS),
    "COH-312": _with_handouts("COH-312", COH_312, COH_312_HANDOUTS),
    "COH-313": _with_handouts("COH-313", COH_313, COH_313_HANDOUTS),
    "COH-401": _with_handouts("COH-401", COH_401, COH_401_HANDOUTS),
    "COH-402": _with_handouts("COH-402", COH_402, COH_402_HANDOUTS),
    "COH-403": _with_handouts("COH-403", COH_403, COH_403_HANDOUTS),
    "COH-404": _with_handouts("COH-404", COH_404, COH_404_HANDOUTS),
    "COH-405": _with_handouts("COH-405", COH_405, COH_405_HANDOUTS),
    "COH-406": _with_handouts("COH-406", COH_406, COH_406_HANDOUTS),
    "COH-407": _with_handouts("COH-407", COH_407, COH_407_HANDOUTS),
    "COH-408": _with_handouts("COH-408", COH_408, COH_408_HANDOUTS),
    "COH-409": _with_handouts("COH-409", COH_409, COH_409_HANDOUTS),
    "COH-410": _with_handouts("COH-410", COH_410, COH_410_HANDOUTS),
    "COH-411": _with_handouts("COH-411", COH_411, COH_411_HANDOUTS),
    "COH-412": _with_handouts("COH-412", COH_412, COH_412_HANDOUTS),
    "CN-101": _with_handouts("CN-101", CN_101, CN_101_HANDOUTS),
    "CN-102": _with_handouts("CN-102", CN_102, CN_102_HANDOUTS),
    "CN-103": _with_handouts("CN-103", CN_103, CN_103_HANDOUTS),
    "CN-104": _with_handouts("CN-104", CN_104, CN_104_HANDOUTS),
    "CN-105": _with_handouts("CN-105", CN_105, CN_105_HANDOUTS),
    "CN-106": _with_handouts("CN-106", CN_106, CN_106_HANDOUTS),
    "CN-107": _with_handouts("CN-107", CN_107, CN_107_HANDOUTS),
    "CN-108": _with_handouts("CN-108", CN_108, CN_108_HANDOUTS),
    "CN-109": _with_handouts("CN-109", CN_109, CN_109_HANDOUTS),
    "CN-110": _with_handouts("CN-110", CN_110, CN_110_HANDOUTS),
    "CN-201": _with_handouts("CN-201", CN_201, CN_201_HANDOUTS),
    "CN-202": _with_handouts("CN-202", CN_202, CN_202_HANDOUTS),
    "CN-203": _with_handouts("CN-203", CN_203, CN_203_HANDOUTS),
    "CN-204": _with_handouts("CN-204", CN_204, CN_204_HANDOUTS),
    "CN-205": _with_handouts("CN-205", CN_205, CN_205_HANDOUTS),
    "CN-206": _with_handouts("CN-206", CN_206, CN_206_HANDOUTS),
    "CN-207": _with_handouts("CN-207", CN_207, CN_207_HANDOUTS),
    "CN-208": _with_handouts("CN-208", CN_208, CN_208_HANDOUTS),
    "CN-209": _with_handouts("CN-209", CN_209, CN_209_HANDOUTS),
    "CN-210": _with_handouts("CN-210", CN_210, CN_210_HANDOUTS),
    "CN-301": _with_handouts("CN-301", CN_301, CN_301_HANDOUTS),
    "CN-302": _with_handouts("CN-302", CN_302, CN_302_HANDOUTS),
    "CN-303": _with_handouts("CN-303", CN_303, CN_303_HANDOUTS),
    "CN-304": _with_handouts("CN-304", CN_304, CN_304_HANDOUTS),
    "CN-305": _with_handouts("CN-305", CN_305, CN_305_HANDOUTS),
    "CN-306": _with_handouts("CN-306", CN_306, CN_306_HANDOUTS),
    "CN-307": _with_handouts("CN-307", CN_307, CN_307_HANDOUTS),
    "CN-308": _with_handouts("CN-308", CN_308, CN_308_HANDOUTS),
    "CN-309": _with_handouts("CN-309", CN_309, CN_309_HANDOUTS),
    "CN-310": _with_handouts("CN-310", CN_310, CN_310_HANDOUTS),
    "CN-311": _with_handouts("CN-311", CN_311, CN_311_HANDOUTS),
    "CN-312": _with_handouts("CN-312", CN_312, CN_312_HANDOUTS),
    "CN-313": _with_handouts("CN-313", CN_313, CN_313_HANDOUTS),
    "CN-314": _with_handouts("CN-314", CN_314, CN_314_HANDOUTS),
    "CN-315": _with_handouts("CN-315", CN_315, CN_315_HANDOUTS),
    "CN-401": _with_handouts("CN-401", CN_401, CN_401_HANDOUTS),
    "CN-402": _with_handouts("CN-402", CN_402, CN_402_HANDOUTS),
    "CN-403": _with_handouts("CN-403", CN_403, CN_403_HANDOUTS),
    "CN-404": _with_handouts("CN-404", CN_404, CN_404_HANDOUTS),
    "CN-405": _with_handouts("CN-405", CN_405, CN_405_HANDOUTS),
    "CN-211": _with_handouts("CN-211", CN_211, CN_211_HANDOUTS),
    "CN-212": _with_handouts("CN-212", CN_212, CN_212_HANDOUTS),
    "CN-213": _with_handouts("CN-213", CN_213, CN_213_HANDOUTS),
    "CN-214": _with_handouts("CN-214", CN_214, CN_214_HANDOUTS),
    "CN-215": _with_handouts("CN-215", CN_215, CN_215_HANDOUTS),
    "CN-316": _with_handouts("CN-316", CN_316, CN_316_HANDOUTS),
    "CN-406": _with_handouts("CN-406", CN_406, CN_406_HANDOUTS),
    "CN-407": _with_handouts("CN-407", CN_407, CN_407_HANDOUTS),
    "CN-408": _with_handouts("CN-408", CN_408, CN_408_HANDOUTS),
    "CN-409": _with_handouts("CN-409", CN_409, CN_409_HANDOUTS),
    "CN-410": _with_handouts("CN-410", CN_410, CN_410_HANDOUTS),
    "CN-501": _with_handouts("CN-501", CN_501, CN_501_HANDOUTS),
    "CN-502": _with_handouts("CN-502", CN_502, CN_502_HANDOUTS),
    "CN-503": _with_handouts("CN-503", CN_503, CN_503_HANDOUTS),
    "CN-504": _with_handouts("CN-504", CN_504, CN_504_HANDOUTS),
    "CN-505": _with_handouts("CN-505", CN_505, CN_505_HANDOUTS),
    "CN-506": _with_handouts("CN-506", CN_506, CN_506_HANDOUTS),
    "CN-507": _with_handouts("CN-507", CN_507, CN_507_HANDOUTS),
    "CN-508": _with_handouts("CN-508", CN_508, CN_508_HANDOUTS),
    "CN-509": _with_handouts("CN-509", CN_509, CN_509_HANDOUTS),
    "CN-601": _with_handouts("CN-601", CN_601, CN_601_HANDOUTS),
    "CN-602": _with_handouts("CN-602", CN_602, CN_602_HANDOUTS),
    "CN-603": _with_handouts("CN-603", CN_603, CN_603_HANDOUTS),
    "CN-604": _with_handouts("CN-604", CN_604, CN_604_HANDOUTS),
    "CN-605": _with_handouts("CN-605", CN_605, CN_605_HANDOUTS),
    "CN-606": _with_handouts("CN-606", CN_606, CN_606_HANDOUTS),
    "CN-607": _with_handouts("CN-607", CN_607, CN_607_HANDOUTS),
    "CN-608": _with_handouts("CN-608", CN_608, CN_608_HANDOUTS),
    "CN-609": _with_handouts("CN-609", CN_609, CN_609_HANDOUTS),
    "CN-610": _with_handouts("CN-610", CN_610, CN_610_HANDOUTS),
    "CN-611": _with_handouts("CN-611", CN_611, CN_611_HANDOUTS),
    "CN-612": _with_handouts("CN-612", CN_612, CN_612_HANDOUTS),
    "CN-613": _with_handouts("CN-613", CN_613, CN_613_HANDOUTS),
    "CN-614": _with_handouts("CN-614", CN_614, CN_614_HANDOUTS),
    "CN-615": _with_handouts("CN-615", CN_615, CN_615_HANDOUTS),
    "CN-616": _with_handouts("CN-616", CN_616, CN_616_HANDOUTS),
    "CN-617": _with_handouts("CN-617", CN_617, CN_617_HANDOUTS),
    "CN-618": _with_handouts("CN-618", CN_618, CN_618_HANDOUTS),
    "CN-619": _with_handouts("CN-619", CN_619, CN_619_HANDOUTS),
    "CN-620": _with_handouts("CN-620", CN_620, CN_620_HANDOUTS),
    "CN-621": _with_handouts("CN-621", CN_621, CN_621_HANDOUTS),
    "CN-622": _with_handouts("CN-622", CN_622, CN_622_HANDOUTS),
    "CN-623": _with_handouts("CN-623", CN_623, CN_623_HANDOUTS),
    "CN-624": _with_handouts("CN-624", CN_624, CN_624_HANDOUTS),
    "CN-625": _with_handouts("CN-625", CN_625, CN_625_HANDOUTS),
    "CN-626": _with_handouts("CN-626", CN_626, CN_626_HANDOUTS),
    "CN-627": _with_handouts("CN-627", CN_627, CN_627_HANDOUTS),
    "CN-628": _with_handouts("CN-628", CN_628, CN_628_HANDOUTS),
    "CN-629": _with_handouts("CN-629", CN_629, CN_629_HANDOUTS),
    "CN-630": _with_handouts("CN-630", CN_630, CN_630_HANDOUTS),
    "CN-631": _with_handouts("CN-631", CN_631, CN_631_HANDOUTS),
    "CN-632": _with_handouts("CN-632", CN_632, CN_632_HANDOUTS),
    "CN-633": _with_handouts("CN-633", CN_633, CN_633_HANDOUTS),
    "CN-634": _with_handouts("CN-634", CN_634, CN_634_HANDOUTS),
    "CN-635": _with_handouts("CN-635", CN_635, CN_635_HANDOUTS),
    "CN-636": _with_handouts("CN-636", CN_636, CN_636_HANDOUTS),
    "CN-637": _with_handouts("CN-637", CN_637, CN_637_HANDOUTS),
    "CN-638": _with_handouts("CN-638", CN_638, CN_638_HANDOUTS),
    "CN-639": _with_handouts("CN-639", CN_639, CN_639_HANDOUTS),
    "CN-640": _with_handouts("CN-640", CN_640, CN_640_HANDOUTS),
}
