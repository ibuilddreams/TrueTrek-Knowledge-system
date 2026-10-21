"""CEO-202: NIL Compliance, Contracts & Legal Literacy.

Level 2: Business Operations, Branding & Compliance. Written against the
course's focus (protecting amateur eligibility while navigating local, state and
collegiate NIL bylaws) and its core competencies: state-by-state high school NIL
restrictions, identifying predatory contract terms such as exclusivity, royalty
locks and IP transfer, and FTC disclosure guidelines.

Every module states plainly that it is education rather than legal advice, and
that NIL rules differ by state and change between academic years, so the student
is sent to their own state association, their school and a qualified adult
rather than to a number in a lesson.
"""

MODULES = [
    {
        "title": "The NIL Landscape",
        "description": (
            "What name, image and likeness actually covers, who regulates it, and why the "
            "answer changes with your address."
        ),
        "lessons": [
            {
                "title": "Name, Image and Likeness, Defined",
                "description": "What the three words cover, what they do not, and the difference between NIL and pay-for-play.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Start with the words

**Name.** Your name, nickname, signature, and the right to attach them to
something.

**Image.** Photographs and video of you. Note that most of it is taken by
somebody else, and whoever pressed the button generally owns the copyright in
the photograph even though you are in it.

**Likeness.** Anything that identifies you without needing your name — a
caricature, a jersey number with your silhouette, a recognisable gesture.

Together they are a property right: **the right to control commercial use of
your identity.** NIL activity is a business paying you for access to that
right.

## What NIL is not

- **Not pay-for-play.** Payment for athletic performance — for signing with a
  school, for playing, for winning — sits outside NIL and is prohibited under
  college association rules.
- **Not a recruiting inducement.** An arrangement offered to get you to attend a
  particular school is regulated very differently from a genuine commercial
  deal, and both sides of that line matter.
- **Not automatically permitted.** NIL being legal in general says nothing about
  whether it is permitted for a high school athlete in your state, in your
  sport, this season.

## A note on what this course is

This is education, not legal advice. It will make you a dramatically better
reader of an agreement and a much harder person to take advantage of. It does
not replace a qualified adult — a lawyer, your athletic director, or a
compliance officer — and in several places it will tell you to go and find one.
""",
            },
            {
                "title": "Four Rulebooks and the Order They Apply In",
                "description": "Federal and state law, your state association, your school, and the college association you are aiming at.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Four, not one

**1. Federal law.** Contract and consumer law, tax, and advertising rules.
The FTC's disclosure requirements in Module 5 live here, and they apply to
everyone regardless of sport or age.

**2. State law.** Many states have statutes specifically about athlete NIL
activity. They differ substantially, including on what a minor can agree to and
who must co-sign.

**3. Your state athletic association.** The rulebook that governs whether you
are eligible to play this Friday, covered in CEO-102. Its NIL position may be
more restrictive than state law allows businesses to offer.

**4. The college association you are aiming at** — NCAA, NAIA or NJCAA. Rules on
disclosure, on arrangements that look like inducements, and on what a
collective may do.

## The ordering rule

You must satisfy **all four**. The permissive one is never the answer. A deal
that federal law allows, state law permits and a college coach encourages can
still cost you your high school season — and the high school season is the one
happening now.

## The three questions for any offer

1. *Is a high school athlete in my state permitted to do this at all?*
2. *Does it touch anything my school owns?* School name, logo, uniform, facility,
   or team imagery. These are nearly always restricted, because they are not
   yours to license.
3. *Is anyone paying me for performance, or to attend somewhere?* If the answer
   is yes in any form, stop and take it to an adult before replying.

## Keep the answers

Every answer you receive goes into a dated compliance log with the name of the
person who gave it. Module 6 builds that log; start it today.
""",
            },
            {
                "title": "NIL Landscape Briefing (Printable)",
                "description": "Reference sheet mapping the four rulebooks and the questions each one answers.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable briefing for Module 1. Page one maps the four rulebooks — federal,
state law, state athletic association, college association — with the questions
each one answers, who to ask, and a dated line for the answer.

Page two is the three-question triage card for any incoming offer, sized to keep
in a phone case or a locker, plus the plain-language definitions of name, image
and likeness, pay-for-play and recruiting inducement.""",
            },
        ],
        "assignment": {
            "title": "Module 1 — Your NIL Rulebook Map",
            "description": (
                "Find out what actually applies to you. This assignment is research, not "
                "opinion.\n\n"
                "Submit:\n"
                "1. Your state: does it have a statute covering athlete NIL activity? Cite what "
                "you found and the date you checked. If you cannot find one, say so and describe "
                "where you looked.\n"
                "2. Your state athletic association's current position on high school NIL, with "
                "the handbook section or policy document cited and dated.\n"
                "3. Your school's own policy, if it has one, and the name and role of the person "
                "who would answer an NIL question for you.\n"
                "4. In your own words, the difference between an NIL deal, pay-for-play and a "
                "recruiting inducement, with one example of each.\n"
                "5. The first three entries in your compliance log: three questions you asked, "
                "who you asked, the date, and the answer.\n\n"
                "Graded on the accuracy and currency of your sources, and on whether the "
                "examples in part 4 show you can tell the three apart."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 1 — Knowledge Check: The NIL Landscape",
            "description": "Four questions on what NIL covers and which rulebooks apply.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which of these is an NIL activity rather than pay-for-play?",
                    "choices": [
                        "A booster paying a bonus for every goal scored",
                        "A local car dealership paying for a social post advertising its service department",
                        "A payment offered on condition you commit to a particular school",
                        "A cash prize awarded by your team for winning a league title",
                    ],
                    "answer": 1,
                },
                {
                    "text": "When the four rulebooks differ, which one applies?",
                    "choices": [
                        "The most permissive, since permission exists somewhere",
                        "Whichever was enacted most recently",
                        "All of them — you must satisfy every rulebook that applies to you",
                        "Only the college association you are targeting",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Why does the lesson flag your school's name, logo and uniform as a problem area?",
                    "choices": [
                        "They photograph badly in sponsored content",
                        "They require a separate FTC disclosure",
                        "They are owned by the sponsor once a deal is signed",
                        "They are not yours to license, and their use is nearly always restricted",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Who generally owns the copyright in a photograph of you taken by someone else?",
                    "choices": [
                        "The person who took the photograph",
                        "You, because it is your likeness",
                        "The school, if it was taken at a school event",
                        "Nobody — sports photographs are public domain",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "High School NIL Restrictions",
        "description": (
            "The restrictions that most often catch high school athletes: school marks, "
            "prohibited categories, inducements and the role of a guardian."
        ),
        "lessons": [
            {
                "title": "What State Associations Typically Restrict",
                "description": "The common restriction patterns, and why you still have to read your own association's text.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Patterns, not rules

State associations have moved at different speeds and in different directions on
high school NIL. Some permit it with conditions, some restrict it heavily, and
the text changes between academic years. What follows are the **patterns that
recur**, so you know what to look for in your own handbook. None of them is a
substitute for reading it.

**School identity.** Nearly every association that permits NIL still prohibits
using the school's name, logo, mascot, uniform, facilities or team imagery in
commercial content. You can usually say what you do; you usually cannot wear the
jersey while doing it.

**Prohibited categories.** Commonly excluded: alcohol, tobacco and vaping,
cannabis, gambling and sports betting, adult content, firearms and weapons,
prescription and some supplement products. Supplements deserve special care
because a banned substance in a product you endorsed is your problem.

**No school or team involvement.** Coaches and school staff are typically
barred from arranging deals, and school time, equipment and facilities are
usually off limits.

**No inducements.** Nothing may be offered to influence where you enrol or
transfer. This is the restriction most likely to be enforced seriously.

**Disclosure.** Many associations require a deal to be reported, sometimes in
advance, often on a specific form within a set number of days.

## The reading task

Find your association's NIL policy, read it in full — it is usually short — and
write the five patterns above in your own words with the section number beside
each. That single exercise puts you ahead of most adults around you.
""",
            },
            {
                "title": "Minors, Guardians and Who Actually Signs",
                "description": "Why a contract with a minor works differently, and what a guardian's signature does and does not do.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## A minor's contract is a different object

In most of the United States, an agreement signed by someone under eighteen is
**voidable by the minor** — it can generally be disaffirmed. That sounds like
protection, and partly it is. But it has consequences that cut both ways:

- Businesses know it, which is why they will usually require a parent or
  guardian to sign as well, binding an adult who cannot disaffirm.
- Disaffirming is not consequence-free. Money or product received may have to go
  back, and the reputational cost in a small market is real.

Several states have specific statutes about athlete agreements involving minors,
including requirements for guardian co-signature and limits on term length.

## What a guardian signature means

It means an adult who is responsible for you has read and accepted the terms —
including any obligation that outlives your interest in the deal. It is not a
formality and it is not a favour. The adult signing is taking on real
obligations.

So the guardian must actually read it. An athlete who presents a contract at
11pm the night before a deadline has not given anyone a chance to do their job,
which is one more reason for the two-day rule from CEO-201.

## Your own agency inside this

Being a minor does not make you a passenger. You read it first, you summarise it
for the adult in plain language, you mark the clauses you do not understand, and
you are the one who says no. The signature is shared; the decision is yours.

## Never sign in the room

No exceptions. Not for a deadline, not for a camera, not because somebody drove
a long way. A business that cannot wait two days for a minor's guardian to read
an agreement has told you something useful about the business.
""",
            },
            {
                "title": "High School NIL Compliance Checklist",
                "description": "Pre-deal checklist covering school marks, categories, inducements, reporting and signatures.",
                "type": "DOCUMENT",
                "minutes": 15,
                "body": """Editable checklist for Module 2, to be run before any agreement is signed.
Sections cover: school identity (name, logo, uniform, facility, team imagery),
prohibited product categories, whether any school staff were involved in
arranging it, whether anything resembles an enrolment inducement, the reporting
form and deadline your association requires, and the signature block with the
guardian line.

A sign-off panel records who reviewed it, on what date, and the two-day pause
between receiving the agreement and signing.""",
            },
        ],
        "assignment": {
            "title": "Module 2 — Association Policy Brief and Compliance Checklist",
            "description": (
                "Read your own association's NIL policy and turn it into something usable.\n\n"
                "Submit:\n"
                "1. A plain-language summary of your state association's NIL policy, with "
                "section numbers, covering at minimum: school identity, prohibited categories, "
                "school and staff involvement, inducements, and reporting requirements. Note the "
                "date you accessed the document.\n"
                "2. Your completed compliance checklist, tailored to your association's actual "
                "requirements rather than the generic version.\n"
                "3. The reporting procedure: what form, to whom, within how many days, and "
                "where you will keep a copy.\n"
                "4. A minors paragraph: who would co-sign for you, what you will give them to "
                "read, and how far in advance.\n"
                "5. One scenario. Describe a realistic offer that would be legal in general but "
                "would breach your association's rules, and explain exactly which rule it "
                "breaks.\n\n"
                "Graded on the accuracy of the citations and on whether the scenario in part 5 "
                "shows real understanding of your own association's text."
            ),
            "total_marks": 150,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 2 — Knowledge Check: High School Restrictions",
            "description": "Four questions on common restrictions and agreements involving minors.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Which restriction pattern appears in nearly every state association that permits high school NIL?",
                    "choices": [
                        "A ban on using the school's name, logo, uniform or facilities in commercial content",
                        "A cap on total annual earnings",
                        "A requirement to use a licensed agent",
                        "A ban on all social media posting during the season",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Why does the lesson single out supplement endorsements for special care?",
                    "choices": [
                        "They usually pay less than other categories",
                        "A banned substance in a product you endorsed becomes your problem",
                        "They always require a guardian's signature",
                        "They cannot be disclosed under FTC rules",
                    ],
                    "answer": 1,
                },
                {
                    "text": "In most of the United States, an agreement signed by a minor is generally:",
                    "choices": [
                        "Automatically invalid and unenforceable by anyone",
                        "Binding exactly as an adult's agreement is",
                        "Voidable by the minor, which is why businesses require a guardian to co-sign",
                        "Only valid if filed with the state association",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What does the course say about signing an agreement in the room where it is offered?",
                    "choices": [
                        "It is acceptable if a parent is physically present",
                        "It is acceptable when the amount is small",
                        "It is acceptable if the business has a deadline",
                        "Never do it — a business that cannot wait two days has told you something useful",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Reading an Agreement",
        "description": (
            "The anatomy of a commercial agreement, clause by clause, and how to summarise one "
            "in plain language."
        ),
        "lessons": [
            {
                "title": "The Clauses Every Agreement Has",
                "description": "A walk through the standard structure so nothing in a contract is unfamiliar.",
                "type": "TEXT",
                "minutes": 15,
                "body": """## Contracts are formulaic, which is good news

Almost every commercial agreement you will see contains the same clauses in
roughly the same order. Learn the skeleton once and an unfamiliar contract
becomes a form you are filling in.

**Parties.** Who exactly is agreeing. Look for the full legal entity name, not a
brand name. If you cannot identify the company, you cannot enforce anything
against it.

**Term.** When it starts and when it ends. Watch for automatic renewal.

**Services / deliverables.** Precisely what you must do. Vague deliverables are
a trap: "social media support" can mean one post or forty.

**Compensation.** How much, in what form, and **when**. "Net 60" means you are
paid two months after invoicing. Non-cash compensation belongs here too.

**Grant of rights.** What the business may use, where, for how long, and in what
media. This is the most important clause in the document and the one athletes
skim. Module 4 is devoted to it.

**Exclusivity.** What you may not do, and for whom, during the term.

**Approval.** Who approves content before it runs, and whether you can decline a
use of your image.

**Termination.** How either side gets out, with how much notice, and what
survives.

**Morality / conduct.** What behaviour lets them terminate, and whether the
clause runs both ways.

**Indemnity.** Who pays if something goes wrong. A broad indemnity given by a
seventeen-year-old is a genuine risk and a reason to get adult help.

**Governing law and disputes.** Which state's law applies, and whether you are
agreeing to arbitrate somewhere far away.

## The reading method

Read it three times: once end to end for shape, once with a highlighter marking
every obligation **you** take on, and once marking every right **they** receive.
Then write the plain-language summary from the next lesson.
""",
            },
            {
                "title": "The Plain-Language Summary and the Question List",
                "description": "Turning a contract into six sentences anyone can check, and asking questions without losing the deal.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Six sentences

Before anyone signs, write the agreement out as six sentences:

1. *I am agreeing with [full legal entity].*
2. *I must deliver [exact deliverables] by [dates].*
3. *They may use [what] in [where] for [how long].*
4. *I will be paid [amount and form] on [when], and it is taxable income.*
5. *During the term I may not [exclusivity], and either of us can end it by
   [termination].*
6. *If something goes wrong, [who is responsible] and disputes are handled
   [where].*

If you cannot complete a sentence, you have found the question you need to ask.
That is the purpose of the exercise: it converts a document you half-understand
into a short, specific list.

## Asking questions does not lose good deals

New athletes fear that questions make them look difficult. In practice the
opposite is true — businesses that work with professionals expect questions, and
a counterparty irritated by basic clarification is telling you how the rest of
the relationship will go.

Ask like this: *"Two things I want to make sure I've understood correctly —
clause 4 on usage, and the renewal in clause 2. Can you walk me through them?"*
Calm, specific, no apology.

## Three things to get in writing every time

1. The final signed version, countersigned, in your records.
2. Any promise made verbally that matters. If it is not in the document, it does
   not exist.
3. The contact who can answer questions during the term, by name and email.
""",
            },
            {
                "title": "Contract Anatomy Worksheet",
                "description": "Clause-by-clause worksheet with the six-sentence summary and a question list.",
                "type": "PDF",
                "minutes": 18,
                "body": """Printable worksheet for Module 3. Page one lists the standard clauses — parties,
term, deliverables, compensation, grant of rights, exclusivity, approval,
termination, conduct, indemnity, governing law — each with space to copy the
actual wording and note what it means in your own words.

Page two holds the six-sentence plain-language summary with blanks, a question
list with a column for the answer received and the date, and a records panel for
the countersigned copy and the named contact for the term.""",
            },
        ],
        "assignment": {
            "title": "Module 3 — Contract Read-Through and Plain-Language Summary",
            "description": (
                "Practise on a real document. Use an agreement you have been offered, a sample "
                "NIL agreement published by a state association or university compliance office, "
                "or one supplied by your instructor. Do not use a template you wrote yourself.\n\n"
                "Submit:\n"
                "1. The source of the agreement you analysed.\n"
                "2. A completed clause-by-clause worksheet: for each standard clause, the actual "
                "wording and your plain-language restatement. Mark any clause the document does "
                "not contain — absences matter.\n"
                "3. Your six-sentence summary.\n"
                "4. A question list: every sentence you could not complete, written as a "
                "question you would actually send.\n"
                "5. Your three highest-risk clauses, ranked, with one line each on why.\n\n"
                "Graded on the accuracy of the restatements, on whether missing clauses were "
                "noticed, and on whether the risk ranking identifies genuine exposure rather "
                "than unfamiliar language."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 3 — Knowledge Check: Reading an Agreement",
            "description": "Four questions on contract anatomy and the summary method.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "Which clause does the lesson call the most important and the most commonly skimmed?",
                    "choices": ["Term", "Compensation", "Grant of rights", "Governing law"],
                    "answer": 2,
                },
                {
                    "text": "What does the lesson say about a promise made verbally but absent from the document?",
                    "choices": [
                        "It is binding if a witness was present",
                        "It does not exist — if it is not in the document, it is not part of the deal",
                        "It takes effect once the first payment is made",
                        "It can be added later without a new signature",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Why does the course describe vague deliverables as a trap?",
                    "choices": [
                        "They delay the first payment",
                        "They prevent the agreement from being reported to your association",
                        "They make FTC disclosure impossible",
                        "Wording such as “social media support” can mean one post or forty",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What is the purpose of writing the six-sentence plain-language summary?",
                    "choices": [
                        "It replaces the need for an adult to review the agreement",
                        "It is required by most state associations",
                        "A sentence you cannot complete is exactly the question you need to ask",
                        "It shortens the contract so less of it is binding",
                    ],
                    "answer": 2,
                },
            ],
        },
    },
    {
        "title": "Predatory Terms",
        "description": (
            "The specific clauses that cost athletes the most: broad rights grants, perpetual "
            "and exclusive terms, royalty locks, IP transfer and auto-renewal."
        ),
        "lessons": [
            {
                "title": "Rights Grants: Scope, Media, Territory and Time",
                "description": "The four dimensions of a rights grant, and what a broad one actually gives away.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Four dimensions

Every grant of rights has four dimensions, and a predatory clause simply
maximises all of them at once:

**Scope.** What may be used — the content produced under the deal, or any image
of you that exists?

**Media.** Where it may appear. "All media now known or hereafter devised" is
standard-sounding language that means everywhere, forever, including media that
does not exist yet.

**Territory.** "Worldwide" is normal for online content and is not, by itself, a
red flag.

**Time.** The duration of use. This is the one to watch: a three-month campaign
does not require a perpetual licence.

## The sentence to look for

> *"Athlete grants Company a perpetual, irrevocable, worldwide, royalty-free,
> exclusive, transferable licence to use Athlete's name, image and likeness in
> all media now known or hereafter devised."*

Read it word by word:

- **Perpetual, irrevocable** — forever, and you cannot take it back.
- **Royalty-free** — no further payment, ever, no matter how much they use it.
- **Exclusive** — you cannot licence the same rights to anyone else, including
  yourself.
- **Transferable** — they can hand it to someone else. You may end up associated
  with a company you have never heard of.

## What reasonable looks like

> *"...a non-exclusive licence to use the Content produced under this Agreement
> in Company's owned and paid media for twelve months from first publication,
> within the United States."*

Specific content, specific media, specific duration, specific place, and
non-exclusive.

## The ask

You do not have to refuse a broad grant outright. Ask for it to be bounded:
*"Can we limit the licence to the content produced under this agreement, for the
twelve months of the campaign?"* Many businesses say yes immediately, because
the broad wording was a template nobody thought about.
""",
            },
            {
                "title": "Royalty Locks, IP Transfer and the Quiet Clauses",
                "description": "Assignment of IP, auto-renewal, right of first refusal and other terms that outlive the deal.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## Assignment versus licence

A **licence** is permission to use something you still own. An **assignment**
transfers ownership. Language such as "Athlete hereby assigns all right, title
and interest" is a transfer, and it is a very different thing from permission.

Watch for assignment of: content you produced, a logo or wordmark you designed,
a phrase or slogan associated with you, or — most seriously — a trademark
application filed in your name or nickname.

## Royalty locks

Terms that fix your compensation permanently while the business's use grows
without limit. Typical shapes:

- A one-off fee against a perpetual, royalty-free licence.
- A merchandise percentage calculated after undefined "costs".
- A "reduced rate for future work" clause that prices years of your work at
  today's audience size.

## Auto-renewal

A term that renews automatically unless you cancel in a narrow window, often 30
to 90 days before expiry, and often in writing by post. The fix is simple: put
the cancellation window in your calendar on the day you sign, with a reminder
two weeks before it opens.

## Right of first refusal and matching rights

A clause requiring you to bring future offers to them first, or allowing them to
match any offer you receive. These are not automatically unfair, but they make
you harder to work with — a competitor knows their offer may simply be matched,
so they may not bother making one.

## Clauses that run one way

A morality clause letting them terminate for your conduct, with nothing
equivalent if their conduct embarrasses you. Ask for it to be mutual. The answer
tells you how the relationship is going to work.

## The three-word test

Before signing, locate every instance of **perpetual**, **exclusive** and
**assign**. If any appears and you cannot explain in plain language why it is
there and what it costs you, the document is not ready to sign.
""",
            },
            {
                "title": "Red Flag Clause Library",
                "description": "Side-by-side library of predatory wording and the bounded version to ask for.",
                "type": "DOCUMENT",
                "minutes": 20,
                "body": """Editable library for Module 4. Each entry pairs the predatory wording with a
bounded alternative and a plain-language note on what the difference is worth:
perpetual and irrevocable licences, exclusivity without a category limit,
royalty-free grants, transferable licences, assignment of IP, trademark filings
in your name, royalty locks, auto-renewal windows, right of first refusal,
one-way morality clauses and broad indemnities.

A final page holds the three-word search — perpetual, exclusive, assign — and a
scripted, non-confrontational request for each one.""",
            },
        ],
        "assignment": {
            "title": "Module 4 — Red Flag Audit and Redline Requests",
            "description": (
                "Find the predatory terms in a real document and write the requests that would "
                "fix them.\n\n"
                "Submit:\n"
                "1. The agreement you audited and its source. You may reuse the document from "
                "Module 3.\n"
                "2. A rights-grant breakdown across all four dimensions: scope, media, territory "
                "and time. Quote the actual wording.\n"
                "3. Your three-word search results: every occurrence of perpetual, exclusive and "
                "assign, with what each one does.\n"
                "4. A red flag table: each problem clause, what it costs you in plain language, "
                "and the bounded version you would ask for — written as the exact sentence you "
                "would send.\n"
                "5. Auto-renewal check: does the agreement renew automatically, what is the "
                "cancellation window, and what calendar reminder would you set and when?\n"
                "6. One paragraph: which single clause would you refuse to sign under any "
                "circumstances, and why?\n\n"
                "Graded on whether you found the real exposure, and on whether your redline "
                "requests are specific, polite and signable as written."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Module 4 — Knowledge Check: Predatory Terms",
            "description": "Four questions on rights grants, assignment and renewal traps.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What does a “perpetual, irrevocable, royalty-free” licence mean for the athlete?",
                    "choices": [
                        "They may use it forever, you cannot withdraw it, and you are never paid again",
                        "They may use it for the term and must renegotiate afterwards",
                        "Use is unlimited but you receive a royalty on each use",
                        "The licence ends automatically when the campaign ends",
                    ],
                    "answer": 0,
                },
                {
                    "text": "What is the difference between a licence and an assignment?",
                    "choices": [
                        "A licence is written; an assignment is verbal",
                        "A licence is permission to use something you still own; an assignment transfers ownership",
                        "A licence applies to images; an assignment applies to text",
                        "There is no practical difference",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Which three words does the course tell you to search for before signing anything?",
                    "choices": [
                        "Payment, deadline, renewal",
                        "Indemnity, arbitration, jurisdiction",
                        "Perpetual, exclusive, assign",
                        "Deliverables, approval, termination",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What practical step does the lesson recommend on the day you sign an agreement with auto-renewal?",
                    "choices": [
                        "Send written notice of cancellation immediately",
                        "Ask for the renewal clause to be read aloud",
                        "File the agreement with your state association",
                        "Put the cancellation window in your calendar with a reminder two weeks before it opens",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Disclosure and Advertising Rules",
        "description": (
            "The FTC's requirements for disclosing a material connection, and how to make a "
            "disclosure that actually counts."
        ),
        "lessons": [
            {
                "title": "Material Connection and “Clear and Conspicuous”",
                "description": "When disclosure is required, and the standard a disclosure has to meet.",
                "type": "TEXT",
                "minutes": 14,
                "body": """## The rule, in one sentence

If you have a **material connection** to a brand that your audience would not
reasonably expect, and you are endorsing it, you must **disclose** that
connection **clearly and conspicuously**.

## What counts as a material connection

Far more than cash:

- Payment of any size.
- Free or discounted product, including something you keep.
- Gear, meals, travel, event access, training.
- A family or employment relationship with the business.
- An affiliate commission, a discount code, a referral arrangement.

"I wasn't paid, they just sent it to me" is the most common misunderstanding in
this area. Free product is a material connection.

## What "clear and conspicuous" means in practice

The FTC's guidance is about whether an ordinary viewer actually notices and
understands the disclosure. In practice that means:

- **Placed where it will be seen**, before or at the start of the endorsement —
  not after a "more" cut, not at the end of a caption, not buried in a block of
  hashtags.
- **In the same medium.** Spoken content gets a spoken disclosure. Video gets an
  on-screen disclosure that stays long enough to read.
- **In plain words.** "Ad", "Advertisement", "Paid partnership with X", "Thanks
  to X for sending me this". Vague tags such as "sp", "collab", "ambassador" or
  "thanks X" alone are not sufficient.
- **Not only the platform's own tool.** A built-in paid-partnership label is
  helpful, and the FTC has been clear that creators should not rely on it alone.

## Honesty obligations beyond disclosure

- You may only endorse something you have actually used and genuinely believe.
- You may not claim results the product cannot deliver.
- The audience data you give a sponsor must be true. Inflated numbers are a
  misrepresentation, which is a much more serious problem than an awkward
  conversation about a small account.
""",
            },
            {
                "title": "Building Disclosure Into the System",
                "description": "Making compliance automatic rather than a decision made at posting time.",
                "type": "TEXT",
                "minutes": 12,
                "body": """## Do not rely on remembering

Disclosure failures are usually not defiance; they are a tired person posting at
11pm. Build it into the system from CEO-201 so it does not depend on memory.

**In the style sheet.** Your exact disclosure line, written out and ready to
copy. One line, in your own voice, used every time.

**In the format template.** Each format that can ever be sponsored carries the
disclosure slot in its template — on-screen text position for video, first line
for captions, spoken line for audio.

**In the contract.** Add disclosure as an obligation in the agreement itself, so
there is no awkwardness when a brand asks you to leave it off. A brand that asks
you to hide a paid relationship is asking you to take a risk they are not taking.

**In the approval step.** Nothing sponsored is published without the disclosure
check. One checkbox.

## Keep the receipts

For every paid or gifted item: what was received, its value, from whom, which
posts covered it, the live links, and the disclosure used. This record does
several jobs at once — it supports your state association reporting, it is the
basis of the tax records in CEO-203, and it is the only way to answer a question
about a post from eighteen months ago.

## Disclosure is not a confession

The tone matters. A disclosure delivered apologetically teaches the audience
that something is wrong. Delivered plainly, as a fact, it does the opposite: it
is evidence that you tell your audience the truth, which is the trust asset from
CEO-201 being deposited rather than spent.
""",
            },
            {
                "title": "Disclosure Standards and Records Sheet",
                "description": "Disclosure wording bank, placement rules by format, and the paid-item register.",
                "type": "PDF",
                "minutes": 15,
                "body": """Printable sheet for Module 5. Page one holds the disclosure wording bank —
acceptable plain-language phrasings alongside the vague tags that do not meet
the standard — and placement rules per format: caption first line, on-screen
duration for video, spoken line for audio, and story placement.

Page two is the paid-item register: date, what was received, estimated value,
from whom, the posts it covered with links, the disclosure used, and the
association reporting date. The register feeds both the compliance log in
Module 6 and the income records in CEO-203.""",
            },
        ],
        "assignment": {
            "title": "Module 5 — Disclosure Standard and Audit",
            "description": (
                "Write your standard, then audit yourself against it.\n\n"
                "Submit:\n"
                "1. Your disclosure line, written out exactly as it will appear, plus placement "
                "rules for each of your formats from CEO-201.\n"
                "2. A self-audit of your last six months of posts. Identify every post involving "
                "free product, a discount code, an affiliate link, event access or any other "
                "material connection. For each: was it disclosed, and did the disclosure meet "
                "the clear-and-conspicuous standard?\n"
                "3. Corrections. What you have done or will do about any post that falls short.\n"
                "4. Three examples. Find three sponsored posts by other creators — not "
                "classmates — and assess each disclosure as adequate or inadequate, with your "
                "reasoning.\n"
                "5. Your paid-item register, set up and populated with anything you have already "
                "received.\n\n"
                "If you have never had a material connection, say so and complete parts 1, 4 and "
                "5. That is a full-credit submission.\n\n"
                "Graded on whether your standard meets the requirement, on the honesty of the "
                "self-audit, and on the reasoning in the three examples."
            ),
            "total_marks": 100,
            "due_in_days": 14,
        },
        "quiz": {
            "title": "Module 5 — Knowledge Check: Disclosure",
            "description": "Four questions on material connection and disclosure practice.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Which of these is a material connection requiring disclosure?",
                    "choices": [
                        "Free product sent to you that you keep, with no cash payment",
                        "Only cash payments above a set threshold",
                        "Only arrangements lasting longer than one month",
                        "Only deals that involve a written contract",
                    ],
                    "answer": 0,
                },
                {
                    "text": "Which disclosure placement meets the clear-and-conspicuous standard?",
                    "choices": [
                        "At the end of a long caption, after a block of hashtags",
                        "At the start of the caption, in plain words such as “Ad” or “Paid partnership with X”",
                        "In the comments section, pinned to the top",
                        "In the account bio, covering all posts at once",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the lesson say about relying solely on a platform's built-in paid-partnership label?",
                    "choices": [
                        "It is the preferred method and replaces any written disclosure",
                        "It is prohibited by the FTC",
                        "It is helpful, but creators should not rely on it alone",
                        "It only applies to video content",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What should you do if a brand asks you to leave the disclosure off?",
                    "choices": [
                        "Comply if the arrangement involved no cash",
                        "Use a vague tag such as “collab” as a compromise",
                        "Disclose only in the following post",
                        "Treat it as a warning sign — they are asking you to take a risk they are not taking",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
    {
        "title": "Your Compliance System",
        "description": (
            "The capstone: a standing review process, a named adviser, a records system and a "
            "written decision protocol for any offer."
        ),
        "lessons": [
            {
                "title": "The Offer Protocol",
                "description": "A written, repeatable sequence from first contact to signature or refusal.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## Decide the process once

Pressure is the enemy in every module of this course. A written protocol means
the sequence is already decided before the first interesting offer arrives.

**Step 1 — Receive and pause.** The scripted sentence: *"Thank you. Please send
the details in writing and I'll come back to you within two days."* Nothing is
agreed verbally, ever.

**Step 2 — Triage.** The three questions from Module 1. Is this permitted for a
high school athlete in my state? Does it touch anything my school owns? Is
anyone paying for performance or enrolment? A no at this stage ends it, politely.

**Step 3 — Read.** The Module 3 method: three passes, the clause worksheet, the
six-sentence summary, the question list.

**Step 4 — Red-flag audit.** The three-word search and the red flag table from
Module 4.

**Step 5 — Adult review.** The agreement, your summary and your questions go to
your guardian, and to a lawyer or compliance contact for anything significant.
Give them a minimum of forty-eight hours.

**Step 6 — Negotiate.** Send the redline requests as written sentences.

**Step 7 — Report.** Your state association's form, inside its deadline.

**Step 8 — File.** Countersigned copy, final deliverables, disclosure used, and
the calendar entry for renewal or expiry.

## Where to stop

Any step may end with a no. A protocol whose only possible outcome is a
signature is not a protocol — it is a formality.
""",
            },
            {
                "title": "Advisers, Records and the Annual Review",
                "description": "Who you need on the bench, what to keep, and how long to keep it.",
                "type": "TEXT",
                "minutes": 13,
                "body": """## The compliance bench

Three people, named in advance:

**1. Your school contact.** Usually the athletic director. Answers state
association and school-policy questions, and receives your reporting forms.

**2. An adult who signs.** A guardian who has read this material and understands
that signing is an obligation rather than a formality.

**3. A legal contact.** For anything beyond a simple one-post arrangement. Some
families have one; many do not, and finding one in advance is the point. Ask
your school, ask a local business you trust, and ask about low-cost options —
some bar associations and university clinics run programmes covering exactly
this.

Add a fourth once there is money: the tax preparer from CEO-203. Make that
contact before the first filing deadline, not during it.

## What to keep, and for how long

Everything, for at least seven years, because that is how tax records work:
signed agreements, invoices, proof of payment, records of non-cash items, the
posts delivered with links, disclosure wording, association reporting forms and
their acknowledgements, and your dated compliance log of every question asked
and answered.

Keep it somewhere that survives a lost phone and a broken laptop. Two places,
one of them not in your bedroom.

## The annual review

Once a year, in the same month, four questions:

1. Have the rules changed — state law, association policy, school policy,
   college association?
2. Do any agreements renew or expire in the next twelve months?
3. Is every adviser slot still filled with someone currently reachable?
4. Does anything in my archive now conflict with a current obligation?

Two hours a year. It is the cheapest insurance in this pathway.
""",
            },
            {
                "title": "Compliance System Pack",
                "description": "Offer protocol card, adviser register, records index and annual review checklist.",
                "type": "DOCUMENT",
                "minutes": 18,
                "body": """Editable pack for the CEO-202 capstone. The offer protocol card lays out the
eight steps with the scripted sentences, sized to keep on a phone. The adviser
register names your school contact, signing adult, legal contact and tax
contact, with how each is reached and the date you last spoke.

The records index lists what is kept, where, in which two locations, and for how
long. The annual review checklist carries the four questions with a dated
sign-off line for each year.""",
            },
        ],
        "assignment": {
            "title": "Capstone — Your NIL Compliance System",
            "description": (
                "Build the system you will actually run, and test it against a real scenario.\n\n"
                "Part A — The system. Submit your offer protocol (all eight steps, with your own "
                "scripted sentences), your adviser register with real names and roles, your "
                "records index naming two storage locations, and your annual review date.\n\n"
                "Part B — The dry run. Take a realistic offer — either one you have received or "
                "this one: a regional sports-drink distributor offers $500 and free product for "
                "six posts over three months, wants to use your photo in store displays "
                "indefinitely, asks for exclusivity in the beverage category for two years, and "
                "wants an answer by Friday. Run the full protocol in writing, step by step, "
                "including the triage answers, the six-sentence summary, the red flag table, the "
                "redline requests you would send, and your decision.\n\n"
                "Part C — The conversation, 200-300 words. Speak to your school's athletic "
                "director or compliance contact. Ask what their reporting process is and what "
                "they most often see athletes get wrong. Write up what you learned and what you "
                "changed in your system afterwards.\n\n"
                "Graded on completeness of the system, the quality of the dry run — particularly "
                "whether you caught the indefinite usage and the two-year exclusivity — and "
                "evidence that the conversation happened."
            ),
            "total_marks": 200,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "Capstone — Knowledge Check: Compliance Systems",
            "description": "Four questions on the offer protocol, advisers and records.",
            "passing_score": 70,
            "minutes": 12,
            "questions": [
                {
                    "text": "What is the first step of the offer protocol?",
                    "choices": [
                        "Receive and pause — ask for details in writing and respond within two days",
                        "Negotiate the fee before anything else",
                        "Report the offer to your state association",
                        "Send the agreement to a lawyer immediately",
                    ],
                    "answer": 0,
                },
                {
                    "text": "How long does the course say records should be kept?",
                    "choices": [
                        "Until the agreement ends",
                        "At least seven years, because that is how tax records work",
                        "One full academic year",
                        "Only until the association reporting form is acknowledged",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What does the course say about a protocol whose only possible outcome is a signature?",
                    "choices": [
                        "It is efficient and preferable for small deals",
                        "It is acceptable if an adult reviews every step",
                        "It is not a protocol — it is a formality",
                        "It is the standard approach for a first partnership",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which of these is NOT one of the four annual review questions?",
                    "choices": [
                        "Have the rules changed across any of the four rulebooks?",
                        "Do any agreements renew or expire in the next twelve months?",
                        "Is every adviser slot filled with someone currently reachable?",
                        "Has my follower count grown enough to raise my rate card?",
                    ],
                    "answer": 3,
                },
            ],
        },
    },
]


# One handout spec per module, in module order (see `_handouts.py` for the shape).
HANDOUTS = [
    {
        "intro": (
            "Module 1's briefing. Four rulebooks apply to you and you must satisfy all of them — "
            "the permissive one is never the answer. This is education, not legal advice: record "
            "who gave you each answer and when."
        ),
        "sections": [
            {
                "heading": "1. The Four Rulebooks",
                "table": {
                    "columns": ["Rulebook", "What it answers", "Who I ask", "Answer / date"],
                    "rows": [
                        ["Federal law", "Disclosure, contracts, tax", "", ""],
                        ["State law", "What a minor may agree to, who co-signs", "", ""],
                        ["State athletic association", "Whether I can play on Friday", "", ""],
                        ["College association", "Disclosure, inducements, collectives", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Triage Card — Any Incoming Offer",
                "bullets": [
                    "Is a high school athlete in my state permitted to do this at all?",
                    "Does it touch anything my school owns — name, logo, uniform, facility, team imagery?",
                    "Is anyone paying me for performance, or to attend somewhere? If yes in any form, stop and take it to an adult.",
                ],
                "fields": ["The offer", "Triage answers", "Decision", "Date"],
            },
            {
                "heading": "3. Definitions, In My Own Words",
                "paragraphs": [
                    "NIL is the right to control commercial use of your identity. Pay-for-play and "
                    "recruiting inducements are regulated very differently, and both sides of that "
                    "line matter."
                ],
                "fields": ["NIL deal — my definition and an example", "Pay-for-play — definition and example", "Recruiting inducement — definition and example"],
            },
        ],
    },
    {
        "intro": (
            "Module 2's checklist, to be run before any agreement is signed. The patterns below "
            "recur across state associations, but none of them is a substitute for reading your "
            "own handbook."
        ),
        "sections": [
            {
                "heading": "1. Pre-Signature Checks",
                "table": {
                    "columns": ["Check", "My association's rule", "Clear?"],
                    "rows": [
                        ["School name, logo, mascot, uniform, facility, team imagery", "", ""],
                        ["Prohibited categories (alcohol, tobacco/vape, cannabis, gambling, adult, firearms, supplements)", "", ""],
                        ["School staff involvement in arranging it", "", ""],
                        ["Anything resembling an enrolment inducement", "", ""],
                        ["Reporting form and deadline", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Signatures and the Two-Day Pause",
                "paragraphs": [
                    "An agreement signed by a minor is generally voidable, which is why businesses "
                    "require a guardian to co-sign — an adult who cannot disaffirm. The guardian "
                    "must actually read it, so give them time."
                ],
                "fields": [
                    "Who co-signs for me",
                    "Date I received the agreement",
                    "Date I gave it to them to read",
                    "Earliest date I may sign (received + 2 days)",
                ],
            },
            {
                "heading": "3. Reporting",
                "bullets": [
                    "Never sign in the room. A business that cannot wait two days has told you something useful.",
                    "You read it first, summarise it in plain language for the adult, and mark what you do not understand.",
                    "File the reporting form inside its deadline and keep the acknowledgement.",
                ],
                "fields": ["Form required", "Sent to whom", "Deadline (days)", "Where my copy is kept"],
            },
        ],
    },
    {
        "intro": (
            "Module 3's worksheet. Contracts are formulaic, which is good news: learn the skeleton "
            "once and an unfamiliar agreement becomes a form you are filling in. Read it three "
            "times — for shape, for your obligations, for their rights."
        ),
        "sections": [
            {
                "heading": "1. Clause by Clause",
                "paragraphs": [
                    "Copy the actual wording, then restate it in your own words. Mark any clause "
                    "the document does not contain — absences matter."
                ],
                "table": {
                    "columns": ["Clause", "What it actually says", "In my own words", "Present?"],
                    "rows": [
                        ["Parties (full legal entity)", "", "", ""],
                        ["Term and renewal", "", "", ""],
                        ["Deliverables", "", "", ""],
                        ["Compensation and timing", "", "", ""],
                        ["Grant of rights", "", "", ""],
                        ["Exclusivity", "", "", ""],
                        ["Approval", "", "", ""],
                        ["Termination", "", "", ""],
                        ["Conduct / morality", "", "", ""],
                        ["Indemnity", "", "", ""],
                        ["Governing law and disputes", "", "", ""],
                    ],
                },
            },
            {
                "heading": "2. The Six-Sentence Summary",
                "paragraphs": [
                    "A sentence you cannot complete is exactly the question you need to ask. That "
                    "is the purpose of the exercise."
                ],
                "fields": [
                    "I am agreeing with…",
                    "I must deliver… by…",
                    "They may use… in… for…",
                    "I will be paid… on…, and it is taxable income",
                    "During the term I may not…, and either of us can end it by…",
                    "If something goes wrong,… and disputes are handled…",
                ],
            },
            {
                "heading": "3. Question List and Records",
                "table": {
                    "columns": ["My question", "Sent to", "Answer received", "Date"],
                    "rows": [["", "", "", ""] for _ in range(4)],
                },
                "bullets": [
                    "If it is not in the document, it does not exist — get every verbal promise in writing.",
                    "Keep the countersigned copy, not your draft.",
                    "Record the named contact who can answer questions during the term.",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 4's clause library. Each predatory term is paired with the bounded version to "
            "ask for. You rarely have to refuse outright — most broad wording is template language "
            "nobody thought about, and bounding it is a one-line request."
        ),
        "sections": [
            {
                "heading": "1. The Rights Grant, In Four Dimensions",
                "table": {
                    "columns": ["Dimension", "What the contract says", "What I would ask for"],
                    "rows": [
                        ["Scope — what may be used", "", ""],
                        ["Media — where it may appear", "", ""],
                        ["Territory", "", ""],
                        ["Time — duration of use", "", ""],
                    ],
                },
            },
            {
                "heading": "2. Red Flags and Their Bounded Versions",
                "table": {
                    "columns": ["Predatory wording", "What it costs you", "Bounded version to request"],
                    "rows": [
                        ["Perpetual, irrevocable licence", "Forever, and you cannot take it back", "Twelve months from first publication"],
                        ["Royalty-free", "No further payment however much they use it", "Renewal fee for continued use"],
                        ["Exclusive (no category limit)", "You cannot licence it to anyone, including yourself", "Non-exclusive, or exclusive within one named category"],
                        ["Transferable", "They can hand it to a company you have never heard of", "Not transferable without my written consent"],
                        ["Athlete hereby assigns…", "Ownership transfers; it is not permission", "Licence, not assignment"],
                        ["Auto-renewal", "Renews unless cancelled in a narrow window", "Expires unless both parties renew in writing"],
                        ["One-way morality clause", "They can exit on your conduct; you cannot on theirs", "Make it mutual"],
                    ],
                },
            },
            {
                "heading": "3. The Three-Word Search",
                "paragraphs": [
                    "Before signing, find every instance of perpetual, exclusive and assign. If any "
                    "appears and you cannot explain in plain language why it is there and what it "
                    "costs you, the document is not ready to sign."
                ],
                "fields": [
                    "“Perpetual” appears at…",
                    "“Exclusive” appears at…",
                    "“Assign” appears at…",
                    "Auto-renewal cancellation window — calendar reminder set for",
                    "The one clause I would not sign under any circumstances",
                ],
            },
        ],
    },
    {
        "intro": (
            "Module 5's disclosure standards. If you have a material connection your audience "
            "would not expect, disclose it clearly and conspicuously. Free product is a material "
            "connection — that is the most common misunderstanding in this area."
        ),
        "sections": [
            {
                "heading": "1. Wording That Meets the Standard",
                "table": {
                    "columns": ["Acceptable", "Not sufficient on its own"],
                    "rows": [
                        ["Ad", "sp"],
                        ["Advertisement", "collab"],
                        ["Paid partnership with [brand]", "ambassador"],
                        ["Thanks to [brand] for sending me this", "A thank-you with no disclosure"],
                        ["Your own line, in plain words", "The platform's built-in label alone"],
                    ],
                },
            },
            {
                "heading": "2. Placement by Format",
                "paragraphs": [
                    "Placed where it will be seen, before or at the start of the endorsement — not "
                    "after a “more” cut, not at the end of a caption, not buried in "
                    "hashtags. Spoken content gets a spoken disclosure."
                ],
                "table": {
                    "columns": ["Format", "Where the disclosure goes", "How long it stays up"],
                    "rows": [
                        ["Caption post", "First line", "—"],
                        ["Short-form video", "On screen, from the start", ""],
                        ["Story", "On the frame itself", ""],
                        ["Audio / podcast", "Spoken, before the endorsement", "—"],
                    ],
                },
                "fields": ["My disclosure line, exactly as it will appear"],
            },
            {
                "heading": "3. Paid-Item Register",
                "paragraphs": [
                    "This register does three jobs: it supports association reporting, it feeds the "
                    "tax records in CEO-203, and it is the only way to answer a question about a "
                    "post from eighteen months ago."
                ],
                "table": {
                    "columns": ["Date", "What was received", "Value", "From", "Posts / links", "Disclosure used", "Reported"],
                    "rows": [["", "", "", "", "", "", ""] for _ in range(5)],
                },
            },
        ],
    },
    {
        "intro": (
            "The CEO-202 capstone pack. The protocol is decided once, while nothing is happening, "
            "so the sequence is already settled before the first interesting offer arrives. Any "
            "step may end with a no — a protocol whose only outcome is a signature is a formality."
        ),
        "sections": [
            {
                "heading": "1. The Offer Protocol",
                "table": {
                    "columns": ["Step", "What I do", "My script / who I contact"],
                    "rows": [
                        ["1. Receive and pause", "Nothing agreed verbally, ever", ""],
                        ["2. Triage", "The three questions from Module 1", ""],
                        ["3. Read", "Three passes, worksheet, six sentences", ""],
                        ["4. Red-flag audit", "Three-word search, red flag table", ""],
                        ["5. Adult review", "Minimum 48 hours", ""],
                        ["6. Negotiate", "Redline requests as written sentences", ""],
                        ["7. Report", "Association form, inside deadline", ""],
                        ["8. File", "Countersigned copy, renewal diarised", ""],
                    ],
                },
            },
            {
                "heading": "2. Adviser Register",
                "table": {
                    "columns": ["Role", "Name", "How to reach them", "Last spoke"],
                    "rows": [
                        ["School contact (athletic director)", "", "", ""],
                        ["Signing adult", "", "", ""],
                        ["Legal contact", "", "", ""],
                        ["Tax preparer", "", "", ""],
                    ],
                },
            },
            {
                "heading": "3. Records and Annual Review",
                "paragraphs": [
                    "Keep everything for at least seven years, in two places, one of them not in "
                    "your bedroom. Two hours a year is the cheapest insurance in this pathway."
                ],
                "bullets": [
                    "Have the rules changed — state law, association policy, school policy, college association?",
                    "Do any agreements renew or expire in the next twelve months?",
                    "Is every adviser slot still filled with someone currently reachable?",
                    "Does anything in my archive now conflict with a current obligation?",
                ],
                "fields": ["Storage location 1", "Storage location 2", "Annual review month", "This year's review date"],
            },
        ],
    },
]
