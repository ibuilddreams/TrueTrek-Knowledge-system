"""CN-635: ChatGPT for Everyday Life: An Introduction. Cool Nerds academy,
Level 6 (Adult). Focus area: Artificial Intelligence. Core competencies:
Prompting basics, task automation, finding information safely.

Audience: an adult using an AI assistant for ordinary tasks.

Six framings are load-bearing. First, **these systems are confidently wrong**:
fluency is not accuracy, they fabricate facts, citations, quotations, cases and
products, and the confident register is the hazard rather than an incidental
flaw. Second, **they are never an authority on medical, legal, financial or
dosage questions**, and the course routes every such question to a qualified
person and to the reader's own emergency number where urgent. Third, **what
you type may be retained, reviewed by people and used for training**, so
personal, identifying, confidential and other people's information does not go
in. Fourth, **verification is against the authoritative source itself** —
STU-204's rule, carried through the whole band. Fifth, **it is not a person**,
and the course names emotional reliance and parasocial use honestly while
routing distress to real services. Sixth, **no product, provider, model, price
or capability is named or stated as current**, because they change constantly.

Boundary: CN-636 is creative use and the ownership questions; CN-637 is
detecting AI-generated misinformation; CN-638 is travel; CN-626 is vetting
human professionals; CN-630 is security. CN-635 is everyday use and its
limits.
"""

MODULES = [
    {
        "title": "What It Is And Is Not",
        "description": "Before using it for anything.",
        "lessons": [
            {
                "title": "Fluent Is Not Accurate",
                "description": "The single most important thing in this course.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## What these systems actually do

**Broadly: they produce text that is likely to follow the text they
were given**, based on patterns in an enormous quantity of writing.

**They are extremely good at producing plausible, well-formed,
confident prose.**

**That is not the same as being right**, and the two are easy to
confuse precisely because every signal humans use to judge
reliability — fluency, confidence, structure, detail — is produced
regardless of whether the content is true.

## They make things up

**Stated plainly, because it is the hazard.**

**They invent facts, dates, statistics, quotations, legal cases,
scientific papers, book titles, product features, people and
events** — in exactly the same confident register as everything
else.

**They will invent a citation, complete with author, journal and
year, that does not exist.**

**And they will do it most readily about things that are obscure,
recent, local or specific** — which is frequently exactly what you
asked about.

**There is no internal signal.** It does not know when it is wrong,
and **asking it whether it is sure produces more confident prose
rather than a reliability check.**

## They are not search engines

**Even where one can look things up, the summary is generated**,
and the generation step can misread, merge or invent.

**Treat any factual claim as something to check at the source** —
Module 2.

## They have no access to your particulars

**They do not know your medical history, your contract, your
country's current rules, your account, or what happened last
week.**

**Which means anything specific to you is a guess**, however
tailored it sounds.

## They reflect what they were trained on

**Including its errors, its omissions and its biases.**

**Material about some countries, communities, languages and
subjects is far thinner than about others**, and the output is
correspondingly worse without saying so.

**And it has a training cut-off.** **Anything recent may be absent
or wrong**, and the assistant will frequently answer anyway.

## They are built to be agreeable

**A real and under-appreciated failure mode.**

**Push back on an answer and it will frequently change it**, not
because the new answer is better but because agreement is the
pattern.

**Which means you cannot use its agreement as confirmation**, and
**you should be especially suspicious when it tells you exactly what
you wanted to hear** — CN-626's rule about seeking permission rather
than counsel.

## The honest summary

**Useful for drafting, rephrasing, structuring, summarising
something you provide, explaining a concept generally, and getting
unstuck.**

**Unreliable for facts, figures, citations, current information,
anything local, and anything about you.**

**And never an authority on anything that matters** — Module 1's
next lesson.""",
            },
            {
                "title": "What It Must Never Be Used For",
                "description": "The absolute limits.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## Medical

**Never as a source of diagnosis, treatment, dosage, drug
interaction or whether a symptom is serious.**

**It will answer fluently, it may be wrong, and the failure mode is
somebody not seeking care or taking the wrong amount of
something.**

**Dosage specifically: never.** **A confident wrong number here
kills people**, particularly with children, with older people, and
with medicines that have a narrow safe range.

**If something is urgent, call your country's emergency number** —
CN-625's rule. **Do not type it into anything.**

**What it can reasonably do:** help you phrase a question for your
doctor, explain a general concept so you understand the
conversation, or summarise a document you were given.

**CN-623's four questions are the thing to take to the
appointment**, and an assistant can help you prepare them.

## Legal

**Never as a source of what the law is, what your rights are, what a
contract means, or what you should sign.**

**Law is jurisdictional, changes constantly, and these systems
confidently produce rules from the wrong country and cases that do
not exist** — **lawyers have been sanctioned for filing fabricated
citations produced this way**, which is a matter of public record.

**CN-626's rule: a qualified professional in your jurisdiction, and
ask about time limits early.**

## Financial

**Never as a source of what to do with money**, what a product is,
what the tax treatment is, or whether something is a good
investment.

**CN-613 and CN-614's rules: your revenue authority, your
regulator's register, and a regulated professional.**

**And it cannot tell you whether a firm is authorised.** **Check the
register yourself.**

## Anything about a named real person

**Including yourself.**

**These systems produce false and defamatory statements about real
people**, confidently, including inventing convictions, employment
and events.

**Do not rely on it for anything about anybody**, and **do not
repeat what it says about a person** — CN-629 and CN-632's rule.

## Crisis and distress

**If you are in distress, this is not the place.**

**Contact your doctor, a free 24-hour confidential helpline in your
country, or an emergency department.**

**If you have any thought of harming yourself or of not wanting to
be here, do that today** — this band's instruction everywhere, and
it is not different here.

**An assistant is not a clinician, is not confidential in the way a
helpline is, and cannot get help to you.**

## Decisions about other people

**Medication for a relative, care decisions, safeguarding, whether
to report something, what to do about a child.**

**All of those go to the relevant professional or authority** —
COH-109 and CN-315's rule: **a concern about a child goes to the
designated person or the authority the same day**, not to a chat
window.

## The rule that covers all of it

**If being wrong would cost you money, health, your home, your
liberty or somebody else's safety — it is not the source.**

**Use it to help you ask a better question of the right
person.**""",
            },
            {
                "title": "What You Put In",
                "description": "Privacy, honestly.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Assume it is not private

**What you type may be stored, may be reviewed by people, and may
be used to improve the system** — the details differ by product, by
plan and by setting, and **they change.**

**Find out for the specific thing you use**, from its own settings
and policy, and **check again periodically.**

**Several products offer a way to turn off training use or to
disable history.** **Use it**, and do not treat it as a guarantee.

## What does not go in

**Identifying details** — full name, address, date of birth,
national identity or insurance numbers, passport or licence
numbers.

**Financial details** — account numbers, card numbers, passwords,
security answers. **Never a password, ever** — CN-630's rule.

**Health information**, yours or anybody's.

**Other people's information.** **This is the one people do not
think about**: a relative's diagnosis, a colleague's situation, a
friend's message, a photograph of somebody else.

**Confidential work material** — client information, patient
information, pupil information, commercially confidential material,
anything covered by an agreement. **In many jobs this is a
disciplinary or regulatory matter** — CN-634's point, and people
have lost jobs over it.

**And anything you would not be content to see quoted.**

## The redaction habit

**Where you want help with a real document:**

**Take out the names, the addresses, the account numbers and the
dates**, and replace them with placeholders.

**Ask about the structure and the wording rather than the
particulars.**

**And put the real details back yourself, offline.**

## Uploads

**A document, a photograph or a file you upload is content you have
handed over.**

**Do not upload:** anything containing other people's personal
information, confidential work material, identity documents, or
photographs of children.

**And remember a photograph may carry location data** — CN-631's
point.

## The account itself

**CN-630's rules apply.**

**A unique password and two-factor authentication**, because the
history of what you have typed is frequently personal.

**And be aware that the history is readable by anybody with access
to the device or the account.**

## Where it is somebody else's tool

**An assistant provided by your employer, your bank or a service
has different terms** — frequently better for confidentiality and
frequently logged.

**Find out what the policy is before using it for anything
sensitive**, and **assume your employer can see it.**

## And teach this to the household

**Particularly to anybody who would type a relative's medical
details in to ask what they mean**, which is the single commonest
privacy mistake people make with these tools.""",
            },
        ],
        "assignment": {
            "title": "Learn The Limits First",
            "description": (
                "Part 1. Ask an assistant three factual questions where you already know the "
                "answer, including one obscure or local one, and record where it was wrong or "
                "invented detail. Then ask it for a source and check whether the source "
                "exists.\n\n"
                "Part 2. Write out the categories it must never be used for and the rule that "
                "covers them. Write down what you would do instead in each case, including "
                "which authority or professional.\n\n"
                "Part 3. Find the privacy settings of whatever you use, turn off training use "
                "and history where that is offered, and write out what must never be typed in "
                "— including other people's information.\n\n"
                "Part 4. Practise redaction on a real document: remove names, addresses, "
                "numbers and dates, ask about structure and wording only, and put the real "
                "details back offline."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "What It Is: Check Your Understanding",
            "description": "Four questions on accuracy, limits and privacy.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why is the confident register the hazard?",
                    "choices": [
                        "It encourages longer answers",
                        "Every signal people use to judge reliability — fluency, confidence, structure, detail — is produced regardless of whether the content is true",
                        "It makes the output harder to read",
                        "It discourages follow-up questions",
                    ],
                    "answer": 1,
                },
                {
                    "text": "You push back on an answer and it changes. What does that tell you?",
                    "choices": [
                        "The new answer is more accurate",
                        "It has checked its reasoning",
                        "Nothing about accuracy — agreement is the pattern, so you cannot use it as confirmation",
                        "The original answer was fabricated",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the rule that covers every absolute limit?",
                    "choices": [
                        "Never use it for anything you could look up",
                        "Never use it without checking a second source",
                        "Never use it for anything professional",
                        "If being wrong would cost you money, health, your home, your liberty or somebody else's safety, it is not the source",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Which privacy mistake do people most commonly make?",
                    "choices": [
                        "Typing in another person's information, such as a relative's medical details, to ask what they mean",
                        "Using a weak account password",
                        "Leaving the history enabled",
                        "Uploading documents rather than typing",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Using It Well",
        "description": "For the things it is actually good at.",
        "lessons": [
            {
                "title": "What To Actually Ask It",
                "description": "The tasks where it earns its place.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The pattern

**It is good where you supply the substance and it supplies the
form.**

**It is unreliable where it has to supply the substance.**

**That one distinction decides almost every use.**

## The things it does well

**Drafting something you then rewrite** — a letter, a complaint, an
advertisement, a eulogy you will heavily change (CN-612), a
description, a covering message (CN-602).

**Rephrasing.** Making something shorter, clearer, more formal,
less angry, or understandable by somebody outside your field —
CN-602's translation rule.

**Summarising material you provide**, with the caution that it can
drop or distort things, so **read the original for anything that
matters.**

**Explaining a general concept** at a level you choose. *"Explain
this as you would to somebody who has never done it."*

**Structuring.** Turning a muddle of notes into an order, which is
genuinely useful for CN-629's memoir material and CN-612's
speeches.

**Generating options** — names, questions to ask, things you might
have forgotten, ways to approach something.

**Getting unstuck**, which is frequently its best use: a bad first
draft to react to is easier than a blank page.

**And routine text** — a template, a form of words, a polite
refusal, a formal paragraph.

## How to ask so the answer is useful

**Give it the context.** Who it is for, what it is for, how long,
what tone, what it must include.

**Give it an example** of what good looks like.

**Say what to avoid.**

**Ask for several versions**, then take the best parts.

**And iterate.** *"Shorter."* *"Less formal."* *"Take out the
flattery."*

**The commonest failure is a vague request producing generic
output**, and the fix is more context rather than cleverer wording.

## Ask it to ask you

**The technique most people do not know and which works best.**

**"Before you draft this, ask me what you need to know."**

**It then asks sensible questions and the result is specific to your
situation** rather than generic.

## Make it show its working

**"What are you unsure about here?"**

**"What would I need to check?"**

**"What is the strongest argument against this?"** — CN-626's rule
about finding the best counter-argument deliberately.

**Those produce more useful output than asking for confidence**,
and they give you the checking list.

## Keep your own voice

**CN-612 and CN-629's point.**

**Output that sounds like nobody is the default**, and for anything
personal — a eulogy, a memoir, a letter to your family — **that is
exactly wrong.**

**Use it for structure and then write it yourself**, or rewrite
every sentence.

**Anything that matters emotionally should be in your words**, and
people can tell.""",
            },
            {
                "title": "Verifying",
                "description": "The habit that makes it safe.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The rule

**Every factual claim, figure, name, date, citation, rule, price and
recommendation is checked at the authoritative source before you
rely on it.**

**STU-204's rule, which this band carries everywhere: a lead, not an
authority.**

## What the authoritative source is

**For a rule or an entitlement:** the government department,
authority or regulator that owns it.

**For tax:** your revenue authority — CN-613.

**For health:** your own clinician, or your health service's
published guidance — CN-623.

**For a law or a right:** a qualified professional in your
jurisdiction — CN-626.

**For a firm:** your country's official register — CN-303's rule.

**For a product, a price or an availability:** the seller's own
site.

**For a quotation or a study:** the original, which you find
yourself.

**And for anything local or recent: not this.**

## Lateral reading

**The method that actually works** — CN-203 and CN-637's
technique.

**Do not evaluate the answer by reading it harder. Leave it and see
what other sources say**, starting with the one that owns the fact.

**Specifically: search for the thing itself rather than for the
claim**, because searching the claim returns the claim.

## The citation test

**Quick, revealing, and worth doing once so you believe this.**

**Ask for sources for a factual answer. Then look each one up.**

**You will frequently find:** a paper that does not exist; a real
author attached to a title they never wrote; a real paper that says
something different; or a link that goes nowhere.

**Having done that once, you will check everything afterwards**,
which is the point of the exercise.

## Signs the answer is likely to be wrong

**It is about something obscure, local, recent or very specific.**

**It gives a precise number without a source.**

**It describes a rule without naming the jurisdiction.**

**It names a person, a case, a study or a product.**

**It is exactly what you wanted to hear** — Module 1.

**And it is about a country other than the one most of its training
material came from.**

## Use it to find the question, not the answer

**The safest and most productive habit.**

**"What should I be asking my accountant about this?"**

**"What are the things people forget when doing this?"**

**"What would a surveyor look for?"**

**Those outputs are checkable, useful even when imperfect, and they
make the expensive hour with the actual professional far more
productive** — CN-626's point about doing the admin yourself.

## And correct it when it is wrong

**Not for its benefit — for yours.**

**Noticing and naming the error keeps the habit alive**, and the
people who get into trouble are the ones who stopped checking
because it had been right the last twenty times.""",
            },
            {
                "title": "Everyday Tasks",
                "description": "Concrete uses that are worth the time.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Letters and complaints

**One of the best uses.**

**Give it the facts, the dates, what you want, and the tone**, and
ask for a short formal letter.

**It is particularly good at taking the anger out of a complaint**,
which makes complaints more effective — CN-633's point about the
calm single reply.

**Check every fact and date yourself**, and **send it from your own
words.**

## Understanding something you were sent

**A letter from an authority, a policy document, a medical summary,
a technical quote.**

**Redact the personal details first** — Module 1 — **then ask what
it is saying in plain words and what it is asking you to do.**

**Then verify with the organisation itself**, because **a
misunderstanding of an official letter is expensive** and the
assistant does not know your circumstances.

## Preparing for appointments

**Genuinely useful and low-risk.**

**CN-623's four questions, CN-626's questions for a professional,
CN-607's nine questions for a family lawyer.**

**Ask it to help you turn a muddle into a short prioritised list**,
then take the list rather than the answers.

## Learning something

**Good for explanation at a level you choose, and for being asked
questions.**

**"Test me on this."** **Retrieval practice is one of the two study
techniques with strong evidence** — CN-627's point — and an
assistant is a reasonable way to do it.

**Verify anything factual**, and **prefer a proper course or book
for the structure** — CN-627's finding about adult learning.

## Household and planning

**Meal plans from what is in the cupboard. A packing list. A
checklist for a move** — CN-619. **A plan for clearing a house.
Questions to ask a tradesperson. A reading list.**

**Low stakes, easy to check, and genuinely time-saving.**

## Writing with somebody else's material

**Careful.**

**Do not paste other people's writing, photographs or confidential
documents in** — Module 1.

**And CN-636's territory: output may resemble existing work**, so
for anything published, check.

## Accessibility uses

**Worth naming because they are the most valuable to some
readers.**

**Reading text aloud, describing an image, simplifying dense
language, transcribing, translating roughly, and helping somebody
who finds writing difficult say what they mean.**

**For people with sight loss, dyslexia, fatigue or after a stroke,
these are a real improvement in independence.**

**With the same limits: not for anything medical, legal or
financial, and not with other people's information.**

## And keep the receipts

**For anything that matters, keep what you actually sent** — not the
draft it produced.

**And never send something you have not read in full.** **The
commonest embarrassment is text that contains a placeholder, a wrong
name, or a paragraph about a different situation entirely.**""",
            },
        ],
        "assignment": {
            "title": "Use It For What It Is Good At",
            "description": (
                "Part 1. Use it for three drafting tasks where you supply the substance — a "
                "complaint, a rephrasing and a structure — and rewrite each in your own words "
                "before sending.\n\n"
                "Part 2. Use the ask-it-to-ask-you technique and the three working questions, "
                "and record how much more specific the output was.\n\n"
                "Part 3. Do the citation test: ask for sources on a factual answer and look "
                "every one up. Record what you found, and write out the signs an answer is "
                "likely to be wrong.\n\n"
                "Part 4. Use it to prepare for a real appointment by turning a muddle into a "
                "short prioritised list of questions, and take the questions rather than the "
                "answers. Verify anything factual at the authoritative source."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Using It Well: Check Your Understanding",
            "description": "Four questions on tasks, verification and everyday use.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What single distinction decides almost every use?",
                    "choices": [
                        "Whether the task is personal or professional",
                        "It is good where you supply the substance and it supplies the form, and unreliable where it must supply the substance",
                        "Whether the subject is technical",
                        "Whether the output will be published",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is lateral reading?",
                    "choices": [
                        "Reading the answer twice before accepting it",
                        "Comparing several AI assistants' answers",
                        "Leaving the answer and seeing what other sources say, starting with the one that owns the fact — and searching for the thing rather than for the claim",
                        "Reading the citations in order",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the safest and most productive habit?",
                    "choices": [
                        "Asking for shorter answers",
                        "Asking the same question twice",
                        "Requesting sources with every answer",
                        "Using it to find the question rather than the answer — what to ask the professional, and what people forget",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What is the commonest embarrassment when sending AI-assisted text?",
                    "choices": [
                        "Text containing a placeholder, a wrong name, or a paragraph about a different situation entirely",
                        "A tone that is too formal",
                        "Repetition across paragraphs",
                        "Length",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Keeping It In Its Place",
        "description": "The human part.",
        "lessons": [
            {
                "title": "It Is Not A Person",
                "description": "Said carefully, because people do form attachments.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## Why this lesson exists

**These systems are designed to be conversational, agreeable and
available**, and people respond to that — **which is a fact about
how humans work rather than a failing in anybody.**

**Some people talk to an assistant daily, find it easier than
talking to people, and come to rely on it.**

**It is worth being clear-eyed about that without being
dismissive.**

## What is actually happening

**It has no memory of you beyond what the product stores, no
continuity of relationship, and no understanding of you.**

**It agrees with you by design** — Module 1 — **which is pleasant
and is the opposite of what a friend, an adviser or a therapist
does.**

**And it cannot act.** It cannot ring somebody, come round, notice
you are not yourself, or get help to you.

## The honest risks

**Reliance replacing contact.** CN-618 and CN-627's finding:
**isolation does real measurable damage**, and something that makes
isolation more comfortable can delay the thing that would fix it.

**Agreement replacing counsel.** CN-626's rule: **somebody who only
consults what agrees with them has sought permission rather than
counsel** — and an agreeable assistant is the purest form of that.

**And it is not confidential in the way people assume** — Module
1.

## Where it is genuinely helpful

**Saying so, because the risks are not the whole story.**

**Rehearsing a difficult conversation** before having it — CN-605,
CN-612 and LS-302's rehearsal instruction.

**Getting words out** when writing is difficult.

**Company while doing a task**, which is a modest and real thing.

**And ordering your thoughts before taking them to a person**,
which is a good use and ends with a person.

## Distress

**Stated plainly and repeated from Module 1.**

**If you are struggling, an assistant is not the place.**

**Contact your doctor, or a free 24-hour confidential helpline in
your country, or an emergency department.**

**If you have any thought of harming yourself or of not wanting to
be here, do that today.**

**Those services are staffed by people who are trained, who can act,
and who are there for exactly this.** **Enormous numbers of ordinary
people use them.**

## And for somebody who is isolated

**The practical version.**

**Use it, if it helps — and put one human thing in the week as
well.** CN-618 and CN-627's instruction: **one fixed, recurring,
in-person commitment with other people in it.**

**Tell one person you are using it a lot**, which is the sentence
that tends to lead somewhere better.

## Children and vulnerable adults

**Named briefly.**

**Do not leave a child unsupervised with a general-purpose
assistant**, and be aware that some products are age-restricted and
that content filtering is imperfect.

**And where somebody has cognitive impairment, be careful about
reliance on something that will confidently tell them wrong
things** — CN-620 and CN-627's territory.""",
            },
            {
                "title": "The Honest Objections",
                "description": "Which deserve a straight answer.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## This course does not sell it

**There are real objections and a reader is entitled to them.**

## How it was built

**These systems were trained on enormous quantities of text and
images, much of it written by people who were not asked and are not
paid.**

**That is contested, it is the subject of litigation in several
countries, and the legal position is genuinely unsettled** —
CN-636's module.

**Somebody who declines to use these tools for that reason is
making a defensible choice**, and this course does not treat it as
ignorance.

## Work

**These tools are displacing some work**, particularly routine
writing, translation, illustration and support work.

**The honest position: the effects so far are real, uneven, and
smaller than the loudest predictions in either direction**, and
nobody reliably knows where it goes.

**What is reasonable to say:** CN-313 and CN-617's rule — **"what
can I be useful for?" is a more durable question than "how do I keep
up?"**

## Environment

**Training and running these systems uses substantial energy and
water.**

**Figures circulating are frequently poorly sourced**, so this
course quotes none — **but the resource use is real and is a
legitimate reason to use it deliberately rather than constantly.**

## Errors with consequences

**The ones already documented:** fabricated legal citations filed in
court; false accusations about real people; incorrect medical and
safety information; and automated systems making decisions about
benefits, hiring and policing with errors that fall unevenly.

**Those are not hypothetical**, and they are the reason Module 1's
limits are stated absolutely.

## Bias

**Output reflects the material it was trained on**, which
over-represents some languages, countries, communities and
perspectives and under-represents others.

**Which means it is worse, less often, and more confidently wrong,
about people and places that are less represented** — and it does
not say so.

## The dependence question

**Worth asking honestly.**

**If you can no longer write a letter, structure an argument or
draft a message without it, something has been lost** — and for
skills you want to keep, **use it after your own attempt rather than
instead of it.**

**CN-627's rule: keep something you are doing without help.**

## The reasonable position

**Use it for what it is good at. Verify everything. Keep it out of
the places in Module 1. Do not let it replace people. And do not
pretend the objections are nothing.**

**That is neither evangelism nor refusal**, and it is the position
this course argues for.""",
            },
            {
                "title": "A Settled Way Of Using It",
                "description": "The last lesson.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The rules, assembled

**Fluent is not accurate.**

**Verify every fact at the source that owns it.**

**Never for medical, legal, financial, dosage, or anything about a
named real person.**

**Nothing personal, identifying, confidential or belonging to
somebody else goes in.**

**Use it where you supply the substance.**

**Use it to find the question rather than the answer.**

**Read everything before you send it.**

**And it is not a person, and not a crisis service.**

## Set it up once

**Turn off training use and history where offered** — Module 1.

**A unique password and two-factor authentication.**

**Decide what you will and will not use it for**, written down.

**And tell the household the rules**, particularly about other
people's information.

## Stay current without chasing

**These products change constantly** — capabilities, prices,
settings and policies.

**Which is a reason not to learn a product deeply and a reason to
re-check the privacy settings periodically.**

**And treat confident claims about what it can now do with the same
scepticism as everything else** — much of the coverage is marketing.

## Teach somebody else

**CN-621's instruction.**

**The people most likely to be harmed by these tools are people
using them without knowing Module 1** — somebody taking medical
advice from one, pasting a relative's details in, or believing a
fabricated citation.

**Twenty minutes explaining the limits to somebody is more useful
than anything else in this course.**

## What you have

You know fluency is not accuracy, that these systems fabricate
confidently, that there is no internal signal, and that agreement is
the pattern.

You know the absolute limits — medical, legal, financial, dosage,
named people, crisis and decisions about others — and the rule that
covers them.

You know what must never be typed in, including other people's
information, and the redaction habit.

You know what it is actually good at, how to ask, the
ask-it-to-ask-you technique, and to keep your own voice for anything
that matters.

You know the verification rule, lateral reading, the citation test,
and the signs an answer is likely to be wrong.

You know it is not a person, where distress goes instead, and the
honest objections.

## The last instruction

**Do the citation test once, properly.**

**Ask it a factual question in an area you know, ask for its
sources, and look every single one up.**

**Nothing anybody writes about these tools will teach you as much as
spending twenty minutes discovering, yourself, that a perfectly
formatted reference can be entirely invented.**

**After that, you will check — which is the whole of using these
things safely.**""",
            },
        ],
        "assignment": {
            "title": "Settle How You Will Use It",
            "description": (
                "Part 1. Write out honestly how much you are using it, whether it is replacing "
                "contact with people, and whether you are using it as agreement rather than "
                "counsel. Add one fixed in-person commitment to the week.\n\n"
                "Part 2. Write out the honest objections — training material, work, "
                "environment, documented errors, bias and dependence — and your own position on "
                "each.\n\n"
                "Part 3. Set it up once: privacy settings, unique password, two-factor "
                "authentication, and a written list of what you will and will not use it for. "
                "Tell the household the rules about other people's information.\n\n"
                "Part 4. Do the citation test properly in an area you know, and look every "
                "source up. Then spend twenty minutes teaching somebody else the limits."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "In Its Place: Check Your Understanding",
            "description": "Four questions on reliance, objections and settling.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is the risk in an assistant being agreeable by design?",
                    "choices": [
                        "It produces longer answers than necessary",
                        "Agreement replaces counsel — somebody who only consults what agrees with them has sought permission rather than advice",
                        "It discourages follow-up questions",
                        "It reduces the accuracy of factual answers",
                    ],
                    "answer": 1,
                },
                {
                    "text": "How does this course treat somebody who declines to use these tools over how they were built?",
                    "choices": [
                        "As misinformed about how training works",
                        "As likely to change their mind",
                        "As making a defensible choice — the position is contested and genuinely unsettled",
                        "As overstating the legal position",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What is the honest point about bias in the output?",
                    "choices": [
                        "It affects only political subjects",
                        "It has largely been corrected in newer systems",
                        "It applies equally across all topics",
                        "It is worse, less often and more confidently wrong about people and places that are less represented — and it does not say so",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What should you do with a skill you want to keep?",
                    "choices": [
                        "Use the assistant after your own attempt rather than instead of it",
                        "Avoid using an assistant for it at all",
                        "Use it only for checking the result",
                        "Alternate between doing it yourself and using the assistant",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
]

HANDOUTS = []
