"""CN-638: Using AI to Plan Travel and Logistics. Cool Nerds academy, Level 6
(Adult). Focus area: Artificial Intelligence. Core competencies: Itinerary
generation, budget optimization, language translation apps.

Audience: an adult planning travel with the help of AI tools.

Six framings are load-bearing. First, **AI invents travel detail
confidently**: flights, trains, opening hours, prices, routes, hotels and
whole attractions that do not exist, and people have arrived to find them
missing — so nothing is booked or relied on without checking the operator
itself. Second, **entry, visa and health requirements go to the destination
government's own site, for the reader's own nationality, dated** — STU-204,
COH-407 and CN-619's absolute rule, and an assistant is explicitly named as
one of the sources that must never be used for it. Third, **translation
failures in medical, legal and emergency settings are named**, with the
instruction to use a professional interpreter where it matters. Fourth,
**CN-618's travel material is carried**: insurance, pre-existing condition
declaration, medication legality and documents. Fifth, **travel fraud is
named**, including that AI makes convincing fake listings cheap. Sixth, **no
tool, airline, provider, price or capability is named or stated as current.**

Boundary: CN-635 owns the general accuracy and privacy material; CN-637 is
misinformation; CN-618 owns travel insurance and health; CN-619 is relocating
abroad. CN-638 is using these tools to plan a trip.
"""

MODULES = [
    {
        "title": "What It Will Get Wrong",
        "description": "Specifically, in travel.",
        "lessons": [
            {
                "title": "It Invents Travel Detail",
                "description": "Confidently, and people have been caught.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## The specific failure

**CN-635's point, in the domain where it is most testable.**

**These tools invent:** flight numbers and routes that do not
exist; train times and connections that are wrong; opening hours;
prices; distances and journey times; hotels; restaurants; museums;
and **whole attractions that are not there.**

**People have travelled to places that do not exist**, arrived at
closed museums on the day they are always closed, and missed
connections that were never possible — **and the reports of this
are consistent enough that it is a known pattern rather than an
anecdote.**

## Why travel is especially bad for this

**It is specific, local and current** — CN-635's three warning
signs, all at once.

**Timetables, prices, opening hours and availability change
constantly**, and anything beyond the training material is either
absent or invented.

**And the detail is plausible.** A fabricated train at 07:42 from a
real station to a real town is not detectable by reading it.

## What it is safe for

**Ideas.** Where to consider, what a region contains, what kind of
trip something could be.

**Structure.** Turning a muddle into a sensible order, a rough
number of days per place, a realistic pace.

**Questions.** What to ask a tour operator, what people forget to
pack, what to check before booking.

**Explanation.** What a thing is, how a transport system generally
works, what a custom means.

**Drafting.** A message to a host, a request, a complaint — CN-635's
module.

**And variation**: several versions of an itinerary to react to.

## What it is not safe for

**Anything you will book, pay for, turn up to, or rely on.**

**Anything with a time attached.**

**Anything with a price attached.**

**Anything about entry requirements** — Module 2, where the rule is
absolute.

**Anything about health, medication or safety** — CN-635's limits.

**And anything about a specific business**, including whether it
exists.

## The verification rule

**Every single item you will act on is confirmed at the operator's
own site.**

**The airline. The railway. The ferry company. The museum. The
hotel. The restaurant. The tour operator. The local transport
authority.**

**Not an aggregator, not a review site, not a blog, and not the
assistant** — **the organisation that owns the fact**, which is
STU-204's rule and CN-635's.

## Treat the output as a to-check list

**The habit that makes these tools useful here.**

**Generate the itinerary, then convert it into a list of things to
confirm**, and go down the list.

**It is still faster than starting from nothing**, and **it is the
only safe way to use it for travel.**""",
            },
            {
                "title": "Entry Requirements Are Not Negotiable",
                "description": "The absolute rule in this course.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The rule

**Visa, entry, passport validity, transit and health-entry
requirements come from the destination government's own official
site, for your own nationality, checked close to travel, and
dated.**

**STU-204 set this rule, COH-407 carried it for athletes and
CN-619 for people relocating. It is the same rule and it is
absolute.**

## What must never be the source

**An AI assistant**, which produces confident, plausible, wrong
requirements, frequently for the wrong nationality or an outdated
rule.

**A forum, a social media group, a blog, or a video.**

**A relative or a friend who went last year** — **with a different
passport, under different rules.**

**A travel agent's summary**, which is a lead rather than an
authority.

**An airline's website**, which is useful and is not the
government.

**And a third-party "visa service"**, many of which charge
substantially for a free or cheap official process — **Module 3's
fraud lesson.**

## Why nationality matters so much

**Requirements differ completely by passport**, and frequently by
where you are resident, where you are travelling from, how long you
are staying, and what you will be doing.

**Two people on the same trip can have entirely different
requirements**, which is the single commonest way a household gets
this wrong.

**Check for every traveller separately**, including children, and
including anybody with dual nationality — **which has its own
complications and occasionally obliges you to enter on a particular
passport.**

## The things people are caught by

**Passport validity**, which frequently must extend months beyond
your return and which is counted differently by different
countries.

**Blank pages** required.

**Transit visas**, where you change planes in a third country —
**the most commonly missed requirement there is.**

**Pre-travel authorisations**, which are not visas, which apply to
visitors from many countries, and which must be obtained in
advance.

**Onward or return ticket requirements.**

**Proof of funds or accommodation.**

**Vaccination and health certificate requirements**, which differ by
country and sometimes by where you have recently been.

**And rules for travelling with children**, where one parent is
travelling alone or where names differ — **which has stopped people
at borders**, and where a letter of consent or documentation is
frequently needed.

## Check again before you go

**Requirements change**, sometimes at short notice.

**Check when you book and again a week before**, and **note the date
you checked.**

## And for anything unusual

**Working, studying, volunteering, staying long, moving, taking
medication, taking equipment, taking an animal, or travelling with
a criminal record** — **ask the destination's embassy or consulate
directly**, in writing, and keep the answer.

**CN-619's rule for an international move, and the same rule applies
to an unusual trip.**""",
            },
            {
                "title": "Health, Medication And Insurance",
                "description": "CN-618's material, carried.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## None of this goes to an assistant

**CN-635's absolute limit: never medical, never dosage, never
whether something is safe for you.**

**Your own clinician, a travel health service, and your country's
official travel health guidance.**

## Insurance

**CN-618's lesson and it is the most skipped item in travel.**

**Declare every pre-existing medical condition, honestly and in
full.** **This is where claims are refused**, the refusals are
large, and **"I didn't think it counted" is not a defence** —
CN-623's rule.

**Check what it actually covers**: medical treatment, medical
repatriation, cancellation, what activities are excluded, and what
happens if you have to come home for a family emergency.

**Check the age limits and the condition limits**, which tighten
with age — **and there are specialist insurers for older travellers
and for pre-existing conditions.**

**And find out what reciprocal healthcare arrangements exist**
between your country and the destination — **they are not insurance
and are not a substitute for it.**

## Medication

**Three things to check, from official sources.**

**Is it legal there?** **Some common prescription medicines —
including some painkillers, stimulants, sleep medicines and
treatments for anxiety — are controlled or banned in some
countries**, and people have been detained for carrying them.

**Check the destination's own embassy or health authority**, and ask
your prescriber.

**What documentation is needed?** Frequently a letter from your
prescriber with the generic name, dose and reason, and the
medication in its original labelled packaging.

**And how much may you carry**, which is limited in some places.

**Take enough for the trip plus a margin**, split between bags,
**and never only in checked luggage.**

## Vaccinations and health preparation

**From a travel health service or your own clinician, well in
advance** — some need weeks and some need a course.

**And check your country's official travel health guidance for the
destination**, which is free and specific.

## Accessibility and mobility

**Arrange it in advance and confirm it directly** — airlines,
railways and accommodation all have processes, and **an assistant
cannot confirm that a hotel's "accessible room" means what you
need.**

**Ask specific questions of the provider**: door widths, step-free
route, bathroom layout, lift, and what happens if the lift fails.

**And confirm mobility equipment arrangements in writing**, because
this is a frequent and serious failure.

## If something happens abroad

**Know in advance:** the emergency number for the country, your
insurer's emergency line, where your country's embassy or consulate
is, and what it can and cannot do.

**Keep those with your documents**, and **leave a copy with somebody
at home** — CN-624's point about an out-of-area contact.

## And for travel while caring or while unwell

**CN-620's readers.**

**Plan what happens if the person you care for needs you**, and
check that your insurance covers cancellation for that reason —
**frequently it does not unless the condition was declared.**""",
            },
        ],
        "assignment": {
            "title": "Check Everything You Will Act On",
            "description": (
                "Part 1. Generate an itinerary with an assistant, then convert it into a "
                "to-check list and confirm every item at the operator's own site. Record how "
                "many items were wrong, invented or out of date.\n\n"
                "Part 2. Check entry requirements for every traveller separately on the "
                "destination government's own site, for each person's own nationality, and "
                "note the date you checked. Check transit countries and passport validity "
                "specifically.\n\n"
                "Part 3. Arrange insurance declaring every pre-existing condition in full, and "
                "check what it covers including repatriation and cancellation for a caring "
                "emergency.\n\n"
                "Part 4. Check whether each of your medications is legal at the destination, "
                "what documentation is needed, and how much you may carry. Book any travel "
                "health appointment well in advance."
            ),
            "total_marks": 150,
            "due_in_days": 21,
        },
        "quiz": {
            "title": "What It Gets Wrong: Check Your Understanding",
            "description": "Four questions on invention, entry rules and health.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why is travel an especially bad subject for these tools?",
                    "choices": [
                        "The vocabulary is specialised",
                        "It is specific, local and current all at once — and the invented detail is plausible rather than detectable",
                        "Training material about travel is scarce",
                        "Operators block automated access",
                    ],
                    "answer": 1,
                },
                {
                    "text": "Where do entry and visa requirements come from?",
                    "choices": [
                        "The airline's website, which is updated continuously",
                        "A travel agent who specialises in the destination",
                        "The destination government's own official site, for your own nationality, checked close to travel and dated",
                        "A visa service that handles the application",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Which requirement is the most commonly missed?",
                    "choices": [
                        "Proof of funds",
                        "Blank passport pages",
                        "Vaccination certificates",
                        "Transit visas, where you change planes in a third country",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What must you check about medication before travelling?",
                    "choices": [
                        "Whether it is legal there — some common prescription medicines are controlled or banned, and people have been detained",
                        "Whether the brand name is available locally",
                        "Whether your insurer covers replacement",
                        "Whether it needs refrigeration in transit",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Planning And Budgeting With It",
        "description": "Where it genuinely helps.",
        "lessons": [
            {
                "title": "Building An Itinerary",
                "description": "Using it for the part it is good at.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## Give it the constraints

**The quality of the output depends almost entirely on what you put
in** — CN-635's rule.

**Tell it:** how many days, who is travelling and their ages, how
you want to travel, your budget range, your mobility and health
constraints, what you want from the trip, what you dislike, what
time of year, and **what you have already decided.**

**And ask it to ask you** before drafting — CN-635's technique,
which produces a far more specific result.

## Ask for the shape, not the detail

**"A realistic ten-day route through this region for somebody who
does not want to move every night"** is a good request.

**"The train times"** is not.

**Use it for:** the order of places, how long in each, a realistic
pace, what to consider dropping, and what a region contains.

**Then confirm every concrete item yourself** — Module 1.

## Ask for the things people get wrong

**Where it genuinely adds value.**

**"What do people underestimate about this trip?"**

**"What is likely to be closed, and when?"**

**"What would make this difficult for somebody with limited
mobility?"**

**"What should I book in advance?"**

**"What are the common mistakes?"**

**Those outputs are checkable, useful even when imperfect, and they
surface things you would not have thought to ask.**

## Build in more time than it suggests

**Generated itineraries are consistently over-packed**, because
nothing in the model accounts for queues, tiredness, transfers,
getting lost, weather, or the fact that you are on holiday.

**A realistic plan has fewer things in it**, particularly for older
travellers, travellers with children, and anybody with a health
condition.

**One main thing a day is a reasonable pace** and it is the
commonest regret in reverse.

## Season, weather and closures

**Ask, then check.**

**Many places close for a season, a religious period, a national
holiday or a weekly closing day**, and **generated itineraries
routinely put people at a museum on the day it is always shut.**

**Check each one on its own site.**

## Keep a working document

**Not in the chat.**

**A document with: every booking reference, every confirmation,
every address, every telephone number, the dates you checked entry
requirements, insurance details, and your medical summary** —
CN-623's one page.

**Printed as well as on the phone**, because phones are lost and
batteries die — CN-624's point.

**And a copy left with somebody at home.**

## And decide before you book

**CN-626's rule: urgency exists to stop you checking.**

**Pressure to book now — one room left, price rising, offer ending —
is a design feature of travel sites**, and most of it is
manufactured.

**Decide what you want, then book it.**""",
            },
            {
                "title": "Budgeting Honestly",
                "description": "Including the costs that are left out.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## It will under-estimate

**Generated budgets are consistently optimistic**, because the
training material is full of aspirational travel writing and because
nobody writes about the dull costs.

**Treat any figure it gives as a prompt to go and check**, not as a
number.

## The costs routinely left out

**Getting to and from the airport or station**, at both ends.

**Baggage**, seat selection, and the other unbundled charges.

**Travel insurance** — Module 1, and it is not optional.

**Tourist taxes and city taxes**, charged on arrival in many
places.

**Tips and service charges**, which differ enormously by country and
which people both over and under-estimate.

**Card charges and exchange costs**, which are substantial and which
Module 3 covers.

**Entry fees**, which add up quickly.

**Water, coffee and the small constant spending**, which is most of
what people actually overspend on.

**Medication, sun protection and the things you forgot.**

**And the cost of things going wrong** — a missed connection, a
night extra, a taxi.

**Add a contingency** of a meaningful proportion rather than a token
one.

## Money abroad

**Find out before you go**, from your own bank:

**What they charge** for card payments and withdrawals abroad.

**Whether you must tell them you are travelling.**

**What the emergency process is** if a card is lost or blocked —
**which is the single most common travel money problem.**

**And take more than one card, from more than one provider, kept
separately** — plus a small amount of local cash.

## The exchange trap

**Named because it costs people real money every trip.**

**When a card machine abroad offers to charge you in your own
currency, it is almost always worse** — a conversion applied at a
rate the merchant's provider chooses.

**Choose the local currency**, which lets your own provider do the
conversion.

**And avoid airport exchange**, which has among the worst rates
anywhere.

## Cheaper, honestly

**Flexibility is worth more than every technique** — CN-618's point,
and for this readership **travelling outside school holidays is
frequently the single largest saving available.**

**Travelling midweek, outside peak season, and for longer and less
often.**

**And booking directly with the operator rather than through an
intermediary**, which frequently costs the same and **gives you
somebody to deal with when something goes wrong** — which is the
part that matters.

## Do not let it optimise you into misery

**A plan that saves money by three changes, an early flight and a
hotel an hour out is a cheaper trip and a worse one.**

**Decide what the trip is for first** — CN-601's frame — **and
optimise within that rather than for the lowest total.**""",
            },
            {
                "title": "Translation",
                "description": "Useful, and dangerous in specific places.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## What it is good at

**Genuinely transformative for ordinary travel.**

**Menus, signs, timetables, labels, instructions, and short
exchanges** — ordering, asking directions, shopping, checking in.

**Camera translation of text**, which is the single most useful
travel feature there is.

**And offline packs**, which you should download before you go,
because **the moment you most need translation is frequently the
moment you have no connection** — a border, a rural road, an
underground station.

## What it gets wrong

**Idiom, humour, politeness and register**, routinely — **which can
make you sound rude without knowing.**

**Pronouns, gender and formality**, which some languages encode and
which translation handles badly.

**Names, places and brands.**

**Anything ambiguous**, which it resolves silently and confidently.

**Negation and conditionals**, occasionally — **"you may not" and
"you need not" are different instructions and are sometimes
swapped.**

**And less-resourced languages**, where quality is substantially
worse and where it is most likely to be relied on.

## Where it must not be the only tool

**Medical.** **A professional interpreter, not an app** — CN-623's
rule: **in many health systems an interpreter is a right and is
free, and you should ask for one.**

**Never use a child as an interpreter**, and avoid using a family
member for anything significant.

**Legal.** Police, immigration, a court, a contract, a statement,
anything you are signing. **Ask for an official interpreter**, which
you are frequently entitled to.

**Emergencies.** **Know the emergency number and a few words**, and
**many emergency services can arrange interpretation** — say the
name of your language clearly and stay on the line.

**Anything you are agreeing to.** **Do not sign a document you
cannot read**, however reassuring the translation looks.

**And anything where being wrong matters** — a medication
instruction, a safety notice, an allergy.

## For allergies and conditions specifically

**Do not rely on a live translation.**

**Carry a printed card**, prepared in advance, in the local
language, checked by a person who speaks it — stating the allergy or
condition, what you cannot have, and what to do in an emergency.

**Those cards are available from allergy and condition
organisations in many countries**, and they are far more reliable
than an app at a counter.

## Learn twenty words

**Unfashionable and it does more than any app.**

**Please, thank you, hello, excuse me, yes, no, I do not speak the
language, do you speak mine, how much, where is, help, I need a
doctor, I am allergic to, the numbers, and the name of your
condition.**

**It changes how you are treated**, and it works when the battery
does not.

## And privacy

**CN-635's rule applies.**

**Do not photograph or type other people's documents, medical
information or confidential material into a translation tool**, and
be aware that **many of these services send what you give them to a
server.**

**Check whether yours works offline for anything sensitive.**""",
            },
        ],
        "assignment": {
            "title": "Plan It Realistically",
            "description": (
                "Part 1. Give an assistant your full constraints, ask it to ask you questions "
                "first, and request the shape rather than the detail. Then ask the five "
                "what-people-get-wrong questions and check the answers.\n\n"
                "Part 2. Cut the itinerary back to one main thing a day and check every "
                "opening time, closing day and seasonal closure on each place's own site.\n\n"
                "Part 3. Build the budget from the full list including every cost routinely "
                "left out, add a meaningful contingency, and find out from your bank what they "
                "charge abroad and what the emergency process is for a lost card.\n\n"
                "Part 4. Download offline translation before travelling, learn the twenty "
                "words, and prepare a printed card in the local language for any allergy or "
                "condition. Write out where an app must never be the only tool."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Planning: Check Your Understanding",
            "description": "Four questions on itineraries, budgets and translation.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "What is consistently wrong with generated itineraries?",
                    "choices": [
                        "They omit well-known attractions",
                        "They are over-packed, because nothing accounts for queues, tiredness, transfers, weather or being on holiday",
                        "They favour expensive options",
                        "They avoid public transport",
                    ],
                    "answer": 1,
                },
                {
                    "text": "A card machine abroad offers to charge you in your own currency. What should you do?",
                    "choices": [
                        "Accept, since the rate is guaranteed",
                        "Accept for small amounts only",
                        "Choose the local currency, which lets your own provider do the conversion",
                        "Pay in cash instead",
                    ],
                    "answer": 2,
                },
                {
                    "text": "Where must a translation app never be the only tool?",
                    "choices": [
                        "Ordering in restaurants",
                        "Reading signs and timetables",
                        "Shopping and asking directions",
                        "Medical, legal, emergency settings and anything you are signing",
                    ],
                    "answer": 3,
                },
                {
                    "text": "What is more reliable than an app for an allergy or condition?",
                    "choices": [
                        "A printed card prepared in advance in the local language and checked by a person who speaks it",
                        "A photograph of your prescription",
                        "A translated note typed into your phone",
                        "A medical bracelet in your own language",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
    {
        "title": "Booking, Fraud And Getting There",
        "description": "The part where money moves.",
        "lessons": [
            {
                "title": "Travel Fraud",
                "description": "Which these tools have made cheaper to run.",
                "type": "TEXT",
                "minutes": 8,
                "body": """## Why it has got worse

**Generating convincing listings, photographs, reviews, websites and
correspondence is now cheap** — CN-636's module.

**Which means the old advice to look for poor English, bad
photographs and an unprofessional site no longer works.**

**Provenance rather than appearance** — CN-637's rule, applied to a
booking.

## The shapes

**Accommodation that does not exist**, listed on a real-looking site
or on a marketplace, with pressure to pay outside the platform.

**A cloned website** of a real airline, hotel or agency, reached
through a search advert rather than by typing the address.

**A fake booking confirmation**, followed by a request for an extra
payment.

**A call about a booking you did make**, claiming a payment problem
— **which means they have your details and is frequently a data
breach rather than a guess** — CN-630's module.

**Fake visa and authorisation services**, charging heavily for a
free or cheap official process — Module 1.

**Prize holidays and timeshare presentations**, where the method is
to prevent you leaving to think.

**And fake transport**, taxis and tours arranged on arrival.

## The rules

**Book directly with the operator wherever possible**, reached by
typing the address yourself or through an app you installed from an
official store — **never through a search advert and never through a
link in a message.**

**Pay in a way that carries protection** — CN-616's point about card
protections, and **find out what applies where you live.**

**Never pay by bank transfer, gift card or cryptocurrency** for
travel, to anybody, ever.

**Never pay outside a platform** when a host asks — which is the
single commonest accommodation fraud.

**Verify the property independently.** Reverse image search the
photographs, look the address up on a map, and check whether the
property appears on other sites under a different name — **CN-637's
method and it catches most of it.**

**Be suspicious of a price far below the others.**

**And never decide quickly.**

## For an unfamiliar operator

**Check whether they are a member of whatever bonding, licensing or
protection scheme exists in your country** — many have one for
package travel, and **it is the difference between being brought
home and not when a company fails.**

**Find out what that scheme is before booking anything
substantial.**

## If something goes wrong

**Contact your card provider immediately** — speed decides recovery,
CN-630's rule.

**Report it** to your country's fraud reporting body and the
police.

**Tell the platform**, which may have its own protection.

**And check your insurance**, which sometimes covers it.

## And beware recovery fraud afterwards

**CN-630 and CN-609's rule: somebody offering to get the money back
for a fee is the same people or people who bought the list.**

## Protect the trip itself

**Do not announce that your house is empty** — CN-624 and CN-631's
rule: **"we're away for two weeks" is a post for after you get
back**, and it affects some insurance.

**Tell a neighbour instead.**""",
            },
            {
                "title": "Documents, Devices And Being Away",
                "description": "The practical security.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## Before you go

**Photograph or scan everything** — passport, visa, insurance,
tickets, booking references, prescriptions, driving licence, and
your medical summary.

**Store them somewhere you can reach without your luggage**, and
**leave a copy with somebody at home** — CN-624's out-of-area
contact.

**Printed as well as digital**, because a dead phone takes
everything.

**And write down the numbers you would need** — insurer, bank,
embassy, a family member — **because you do not know any of them**,
CN-624's card.

## Devices

**CN-630's module, with travel additions.**

**Update everything before you go.**

**Screen lock and encryption on**, and **find-my-device enabled.**

**Back up before travelling**, so a lost phone is an inconvenience
rather than a loss.

**Avoid financial transactions on public wi-fi**, or use your own
connection.

**Be careful with public charging points** where you can — using
your own charger and a wall socket avoids the question entirely.

**And know that some countries may inspect devices at the
border**, which is worth knowing if you carry confidential work
material — **and CN-635's rule: do not have other people's
confidential material on a travelling device.**

## While you are away

**Do not post where you are in real time** — CN-631's rule about
live video and routine.

**Post afterwards.**

**Keep valuables and documents separate** from each other and from
your day bag.

**And set up transaction alerts** before you go, which is the
fastest fraud detection there is — CN-630.

## If you are robbed or lose documents

**Report to the local police and get a report reference**, which
insurance and your embassy will both want.

**Contact your embassy or consulate** for emergency travel
documents.

**Contact your bank and card providers immediately.**

**And contact your insurer**, within whatever deadline the policy
sets.

## If something serious happens

**Know in advance what your embassy or consulate can and cannot
do** — **which is less than most people assume**: they cannot pay
bills, provide legal advice, get you out of prison or override local
law.

**What they can usually do:** issue emergency documents, contact
family, provide lists of local lawyers and doctors, and help in
cases of death, arrest or serious illness.

**Your insurer's emergency line is frequently the more useful
call.**

## And for somebody travelling alone

**Particularly for older travellers.**

**Agree a check-in schedule with somebody at home**, and agree what
they do if you miss it.

**Share your itinerary and your accommodation details with them.**

**And know the emergency number for every country you will be in**,
which differs.""",
            },
            {
                "title": "Using It Well, And Its Place",
                "description": "The last lesson.",
                "type": "TEXT",
                "minutes": 7,
                "body": """## The settled method

**Use it for ideas, shape, questions and drafting.**

**Convert everything concrete into a to-check list.**

**Confirm each item at the operator's own site.**

**Take entry, health and medication requirements only from official
sources, for your own nationality, dated.**

**Book directly, pay with protection, and never outside a
platform.**

**And carry the document that does not need a battery.**

## What it is genuinely worth

**Said positively, because the course has been cautionary.**

**For somebody who finds planning daunting, who has not travelled
for years, or who is going somewhere unfamiliar, these tools
genuinely lower the barrier** — they produce a starting point, they
answer the questions you did not know to ask, and they make an
unfamiliar transport system comprehensible.

**And camera translation is a real change in what is possible**
for people travelling without a shared language.

**Those are substantial, and they are available now.**

## Do not let it plan you out of the trip

**The thing worth saying last.**

**An optimised itinerary is not the same as a good trip.**

**The parts people remember are almost always the unplanned ones** —
the conversation, the wrong turning, the place you stayed longer
than you meant to, the afternoon you did nothing.

**Leave space for that.** A plan with nothing unscheduled in it has
removed the thing you went for.

## And ask people

**The source these tools cannot replace.**

**The person at the desk, the neighbour who went, the local, the
person in the shop.**

**They know what is actually open, what is actually worth it, and
what has changed** — and **asking is itself most of what travelling
is for.**

## What you have

You know these tools invent flights, times, prices, places and
whole attractions, and that travel is the worst subject for it.

You know to treat the output as a to-check list and to confirm every
item at the operator's own site.

You know entry requirements come only from the destination
government's own site, for your own nationality, dated — and the
list of sources that must never be used.

You know the insurance declaration rule, that some medicines are
controlled abroad, and what documentation to carry.

You know generated itineraries are over-packed and generated budgets
optimistic, and the costs routinely left out.

You know where translation must never be the only tool, and to carry
a printed card for a condition.

And you know the fraud shapes, that appearance no longer indicates
legitimacy, and that provenance does.

## The last instruction

**Before your next trip, do the two checks that nothing else
replaces.**

**Entry requirements, on the destination government's own site, for
every traveller's own nationality, with the date written down.**

**And insurance, with every pre-existing condition declared in
full.**

**Everything else in this course can be got wrong and recovered
from. Those two are the ones that end trips and refuse claims.**""",
            },
        ],
        "assignment": {
            "title": "Book Safely, Travel Prepared",
            "description": (
                "Part 1. Write out the travel fraud shapes and the seven rules. Reverse image "
                "search the photographs of any accommodation you are considering and check the "
                "address on a map.\n\n"
                "Part 2. Find out what bonding, licensing or protection scheme exists in your "
                "country for package travel, and check whether your operator is in it. Confirm "
                "what payment protection your card gives.\n\n"
                "Part 3. Scan and print every document, write the numbers card, leave copies "
                "with somebody at home, back up your devices, and set up transaction alerts.\n\n"
                "Part 4. Find out what your embassy or consulate can and cannot do, agree a "
                "check-in schedule if travelling alone, and do the two checks: entry "
                "requirements on the official site with the date, and insurance with every "
                "condition declared."
            ),
            "total_marks": 150,
            "due_in_days": 28,
        },
        "quiz": {
            "title": "Booking And Going: Check Your Understanding",
            "description": "Four questions on fraud, documents and method.",
            "passing_score": 70,
            "minutes": 10,
            "questions": [
                {
                    "text": "Why does the old advice about spotting a fake listing no longer work?",
                    "choices": [
                        "Platforms now remove obvious fakes",
                        "Generating convincing listings, photographs, reviews and sites is now cheap — so provenance rather than appearance is the method",
                        "Most fraud has moved to telephone contact",
                        "Reviews are now verified",
                    ],
                    "answer": 1,
                },
                {
                    "text": "What is the single commonest accommodation fraud?",
                    "choices": [
                        "A cloned hotel website",
                        "A fake booking confirmation",
                        "A host asking you to pay outside the platform",
                        "An inflated cleaning charge on arrival",
                    ],
                    "answer": 2,
                },
                {
                    "text": "What can an embassy or consulate usually not do?",
                    "choices": [
                        "Issue emergency travel documents",
                        "Contact your family",
                        "Provide lists of local lawyers and doctors",
                        "Pay your bills, give legal advice, get you out of prison or override local law",
                    ],
                    "answer": 3,
                },
                {
                    "text": "Which two checks does this course say nothing else replaces?",
                    "choices": [
                        "Entry requirements on the destination government's own site for each traveller's nationality, and insurance with every pre-existing condition declared",
                        "Flight confirmations and accommodation reviews",
                        "Vaccination records and currency rates",
                        "Passport validity and baggage allowance",
                    ],
                    "answer": 0,
                },
            ],
        },
    },
]

HANDOUTS = []
