from django.core.management.base import BaseCommand
from django.db import transaction

from daily_drill.models import DrillOption, DrillQuestion

QUESTIONS = [
    {
        "scenario": (
            'An energy drink brand "HyperCharge" offers you a $15,000 NIL contract. However, '
            "the contract contains a non-compete clause that blocks you from wearing or endorsing "
            "any activewear brand, even during official collegiate tournaments which are sponsored "
            "by your varsity equipment sponsor (under direct Nike/Adidas schools policies). What is "
            "your move?"
        ),
        "guidelines": (
            "Goal: Balance immediate monetization with future flexibility and compliance with "
            "institutional athletic rules."
        ),
        "options": [
            {
                "key": "A",
                "text": (
                    "Sign immediately. $15k is high upfront liquidity and you can deal with school "
                    "policy violations later."
                ),
                "impact": (
                    "High immediate revenue, but severely compromises athletic eligibility. This "
                    "could lead to suspensions, violating university licensing covenants."
                ),
                "score": 30,
                "rationale": (
                    "Accepting cash with restrictive covenants that violate school athletic rules "
                    "leads to suspensions. Immediate cash is wiped out by damage to athlete "
                    "reputation."
                ),
            },
            {
                "key": "B",
                "text": (
                    "Reject the offer outright and state that you are too big of a risk to sign "
                    "athletic-wear restrictions."
                ),
                "impact": (
                    "Zero conflict, but also zero revenue. Misses an opportunity to show "
                    "commercial posture and negotiate better terms."
                ),
                "score": 60,
                "rationale": (
                    "While safe, an elite pathfinder negotiates for mutual fit instead of flat "
                    "rejection."
                ),
            },
            {
                "key": "C",
                "text": (
                    "Present a redlined countered contract, requesting the exclusion of official "
                    "school athletic uniforms from the non-compete scope, explicitly capping the "
                    "restriction to beverage products."
                ),
                "impact": (
                    "Demonstrates professional executive posture, saves university compliance "
                    "standing, and keeps beverage cash flowing."
                ),
                "score": 100,
                "rationale": (
                    "Perfect deal-making posture. This keeps you in play for both your school "
                    "equipment sponsor and gets you the HyperCharge beverage contract!"
                ),
            },
        ],
    },
    {
        "scenario": (
            "Your physical diagnostic tracking metrics reveal severe sleep debt (average 5.4 hours) "
            "due to academic exam weeks coupled with 5:30 AM pre-dawn training runs. The national "
            "scouts are visiting your camp in 3 days. Your energy feels depleted. How do you adjust "
            "your macro habit schema?"
        ),
        "guidelines": (
            "Goal: Optimize mental cognition and muscle fiber recovery while maintaining scout "
            "visual alignment."
        ),
        "options": [
            {
                "key": "A",
                "text": (
                    "Power through via high-caffeine supplements. Push harder; scouts want to see "
                    "raw, relentless stamina."
                ),
                "impact": (
                    "Heart-rate spike, intense nervous fatigue, elevated cortisol, risk of severe "
                    "muscle cramps or poor visual cognitive response under scout drills."
                ),
                "score": 40,
                "rationale": (
                    "Pushing through physiological fatigue with chemical stimulants results in a "
                    "hollow visual output and highly increases risk of athletic injury."
                ),
            },
            {
                "key": "B",
                "text": (
                    "Request the coaching staff to temporarily swap pre-dawn runs for afternoon "
                    "mental film sessions, utilizing the morning for strategic recovery sleep."
                ),
                "impact": (
                    "Ensures optimal central nervous system recovery, cognitive clarity, and raw "
                    "power for the scout drills while keeping playbook IQ high."
                ),
                "score": 100,
                "rationale": (
                    "True masters understand that physiological restoration is a weapon. "
                    "Afternoon film sessions keep compliance high while restoring physical "
                    "performance metrics."
                ),
            },
            {
                "key": "C",
                "text": (
                    "Skip training entirely without notifying the staff, claiming sudden illness "
                    "to guarantee raw rest."
                ),
                "impact": (
                    "Restores physical state but craters trust scores with the scouting team and "
                    "head coaches."
                ),
                "score": 25,
                "rationale": (
                    "Uncoordinated absences signal unreliability, which is a major red flag for "
                    "professional scouts looking for elite culture fits."
                ),
            },
        ],
    },
    {
        "scenario": (
            "An alumnus and major business owner offers to fund your local tech venture with "
            '$50,000, but requests 45% equity and a veto right over all subsequent funding rounds '
            'before you have launched an MVP. He states: "Take it now, or you will find no other '
            'backing in this town." How do you proceed?'
        ),
        "guidelines": (
            "Goal: Secure startup resources without giving away future venture control or "
            "paralyzing capitalization boards."
        ),
        "options": [
            {
                "key": "A",
                "text": (
                    "Accept immediately. $50k is crucial to build the tech ecosystem and start "
                    "hire contracts."
                ),
                "impact": (
                    "Venture is hyper-diluted and subsequent Series A investors reject the terms "
                    "due to the alumni veto right."
                ),
                "score": 35,
                "rationale": (
                    "Giving away 45% and a veto right on pre-seed levels blocks capitalization "
                    "agility, essentially turning you into a subsidiary rather than an autonomous "
                    "founder."
                ),
            },
            {
                "key": "B",
                "text": (
                    "Decline the terms diplomatically. Offer a SAFE (Simple Agreement for Future "
                    "Equity) at a fair evaluation cap, limiting equity swap at the next "
                    "institutional round."
                ),
                "impact": (
                    "Preserves cap-table health, keeps cash pathways open, and sets a precedent "
                    "of institutional business maturity."
                ),
                "score": 100,
                "rationale": (
                    "Using a SAFE keeps governance clear and aligns valuation with modern startup "
                    "ecosystem standards, blocking early vulture capital takeovers."
                ),
            },
            {
                "key": "C",
                "text": (
                    "Decline and tell the alumnus that his terms are predatory and you will expose "
                    "his practices on campus networks."
                ),
                "impact": (
                    "Protects equity, but burns a powerful institutional bridge and triggers toxic "
                    "network noise around your team."
                ),
                "score": 50,
                "rationale": (
                    "Incubators teach emotional parity. Combative communication models never "
                    "yield long-term strategic leverage."
                ),
            },
        ],
    },
    {
        "scenario": (
            "During a major electrical service upgrade bid for an industrial warehouse, a "
            'subcontractor submits an ultra-low-cost bid that is 40% below market average, but '
            'mentions they operate under "unregistered staff arrangements". Winning this contract '
            "guarantees high immediate margins for your firm, but exposes you to regulatory "
            "compliance audits. What is your call?"
        ),
        "guidelines": (
            "Goal: Secure commercial margins while maintaining licensing integrity and "
            "occupational safety laws."
        ),
        "options": [
            {
                "key": "A",
                "text": (
                    "Accept the low subcontractor bid. It secures maximum short-term profits, and "
                    "any regulatory issues are under the subcontractor's direct liability."
                ),
                "impact": (
                    "Extremely high immediate bidding margins, but severely exposes your general "
                    "contractor license to suspension and potential OSHA safety liabilities if an "
                    "audit occurs."
                ),
                "score": 35,
                "rationale": (
                    "Accepting unregistered labor violates general contractor licensing covenants. "
                    "The potential of license suspension and liability far outweighs short-term "
                    "bidding profits."
                ),
            },
            {
                "key": "B",
                "text": (
                    "Reject the bid outright. It is too risky to hire anyone without formal "
                    "verified documents, and you should only work with high-end premium "
                    "contractors, even if it makes you uncompetitive in local bid submissions."
                ),
                "impact": (
                    "Maintains perfect compliance standing, but misses the opportunity to "
                    "establish operational posture or negotiate conforming safety terms."
                ),
                "score": 65,
                "rationale": (
                    "While safe, an elite contractor manages risks pro-actively and communicates "
                    "corporate compliance standards with vendor networks rather than silent "
                    "rejection."
                ),
            },
            {
                "key": "C",
                "text": (
                    "Formally request the subcontractor to provide valid verification of worker "
                    "compensation insurance and current field certifications, countering with "
                    "standard commercial vendor compliance codes to shield your firm."
                ),
                "impact": (
                    "Demonstrates professional enterprise posture, protects licensing standing, "
                    "and forces raw compliance while keeping local bidding active."
                ),
                "score": 100,
                "rationale": (
                    "This is the master craftsman standard. By formalizing compliance "
                    "requirements, you shield your organization from audits while keeping "
                    "commercial bids in play."
                ),
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seeds the Daily Drill question bank (idempotent — safe to re-run)."

    @transaction.atomic
    def handle(self, *args, **options):
        created_count = 0

        for entry in QUESTIONS:
            question, created = DrillQuestion.objects.get_or_create(
                scenario=entry["scenario"],
                defaults={"guidelines": entry["guidelines"]},
            )
            if not created:
                continue

            created_count += 1
            for option in entry["options"]:
                DrillOption.objects.create(question=question, **option)

        self.stdout.write(self.style.SUCCESS(f"Seeded {created_count} new drill question(s)."))
