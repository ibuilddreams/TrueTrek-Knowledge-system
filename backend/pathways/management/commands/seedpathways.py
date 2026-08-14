from django.core.management.base import BaseCommand
from django.db import transaction

from common.models import Status
from common.ordering import get_next_order
from courses.models import Course
from onboarding.models import Question, QuestionOption, QuestionOptionPathwayWeight
from pathways.models import Pathway, PathwayBundleRule, PathwayCourse

# Pathway/question data superseded by the taxonomy and questionnaire below —
# deleted on every run so re-seeding never leaves stale/duplicate rows lying
# around (includes ad-hoc test rows found in dev DBs, e.g. a zero-priced
# "Athlete" pathway and its now-dead "What best describes you?" question).
LEGACY_PATHWAY_NAMES = ["Parent / Education Pathway", "Athlete"]
LEGACY_QUESTION_TEXTS = ["What best describes you?"]

PATHWAYS = [
    {
        "key": "parent_homeschool",
        "name": "Parent / Homeschool Pathway",
        "summary": "Guided homeschool curriculum and progress tracking for parents teaching their kids at home.",
        "description": (
            "A curated set of courses for parents managing their child's education at home — "
            "covering core academics, study skills, and progress tracking. Demo/placeholder "
            "content seeded for onboarding-flow testing; replace via the admin panel with the "
            "real curriculum once finalized."
        ),
        "status": Status.PUBLISHED,
        "base_price": 199,
    },
    {
        "key": "education_academic",
        "name": "Education / Academic Pathway",
        "summary": "Core academic coursework for students who want a structured, standards-aligned curriculum.",
        "description": (
            "General-purpose academic pathway covering core subjects for students who want a "
            "structured, standards-aligned course of study. Demo/placeholder content seeded "
            "for onboarding-flow testing; replace via the admin panel with the real curriculum "
            "once finalized."
        ),
        "status": Status.PUBLISHED,
        "base_price": 179,
    },
    {
        "key": "ivy_league",
        "name": "Ivy League-Oriented Pathway",
        "summary": "Advanced coursework and admissions prep for students targeting highly selective universities.",
        "description": (
            "Rigorous, admissions-focused pathway for students aiming for Ivy League or other "
            "highly selective universities — advanced coursework paired with application "
            "strategy. Demo/placeholder content seeded for onboarding-flow testing; replace "
            "via the admin panel with the real curriculum once finalized."
        ),
        "status": Status.PUBLISHED,
        "base_price": 299,
    },
    {
        "key": "athlete_sports",
        "name": "Athlete / Sports Pathway",
        "summary": "Flexible academics built around a competitive sports schedule for student-athletes.",
        "description": (
            "Pathway designed for student-athletes who need academic flexibility around "
            "training and competition schedules, without falling behind on coursework. "
            "Demo/placeholder content seeded for onboarding-flow testing; replace via the "
            "admin panel with the real curriculum once finalized."
        ),
        "status": Status.PUBLISHED,
        "base_price": 249,
    },
    {
        "key": "business",
        "name": "Business Pathway",
        "summary": "Practical business, entrepreneurship, and financial literacy coursework.",
        "description": (
            "Pathway for students interested in business, entrepreneurship, and financial "
            "literacy — practical, real-world-oriented coursework. Demo/placeholder content "
            "seeded for onboarding-flow testing; replace via the admin panel with the real "
            "curriculum once finalized."
        ),
        "status": Status.PUBLISHED,
        "base_price": 229,
    },
    {
        "key": "international_student",
        "name": "International Student Pathway",
        "summary": "Cross-border academic and language support for students studying outside their home country.",
        "description": (
            "Support pathway for international students preparing to study in another "
            "country, including academic and language-readiness coursework. "
            "Demo/placeholder content seeded for onboarding-flow testing; replace via the "
            "admin panel with the real curriculum once finalized."
        ),
        "status": Status.PUBLISHED,
        "base_price": 259,
    },
]

BUNDLE_RULES = [
    {"pathway_count": 2, "discount_percent": 15},
    {"pathway_count": 3, "discount_percent": 25},
    {"pathway_count": 4, "discount_percent": 30},
    {"pathway_count": 5, "discount_percent": 35},
]

# Demo questionnaire — placeholder text/mapping per the client's meeting notes
# (real questions/weights are an admin-editable action item, not code).
# Each option's "weights" dict maps a PATHWAYS "key" -> weight toward that pathway.
QUESTIONS = [
    {
        "text": "What best describes your current situation?",
        "options": [
            {"text": "I'm a parent supporting my child's homeschool education", "weights": {"parent_homeschool": 3}},
            {"text": "I'm a student focused on traditional academic coursework", "weights": {"education_academic": 3}},
            {"text": "I'm aiming for Ivy League or other highly selective admissions", "weights": {"ivy_league": 3}},
            {"text": "I'm a competitive student-athlete balancing sports and school", "weights": {"athlete_sports": 3}},
            {"text": "I'm interested in business, entrepreneurship, or finance", "weights": {"business": 3}},
            {"text": "I'm an international student preparing to study abroad", "weights": {"international_student": 3}},
        ],
    },
    {
        "text": "What age range are you focused on?",
        "options": [
            {"text": "Elementary / homeschool age", "weights": {"parent_homeschool": 2}},
            {"text": "Middle school", "weights": {"education_academic": 1}},
            {"text": "High school", "weights": {"education_academic": 1, "ivy_league": 1, "athlete_sports": 1}},
            {"text": "College and beyond", "weights": {"business": 1, "international_student": 1}},
        ],
    },
    {
        "text": "How much time can you commit each week?",
        "options": [
            {"text": "1-2 hours", "weights": {"parent_homeschool": 1}},
            {"text": "3-5 hours", "weights": {"education_academic": 1, "athlete_sports": 1}},
            {"text": "5+ hours", "weights": {"ivy_league": 2, "business": 1}},
        ],
    },
    {
        "text": "What's your top academic goal right now?",
        "options": [
            {"text": "Getting into a top-tier or Ivy League university", "weights": {"ivy_league": 3}},
            {"text": "Balancing athletics with strong academics", "weights": {"athlete_sports": 3}},
            {"text": "Building practical business or entrepreneurial skills", "weights": {"business": 3}},
            {"text": "Preparing for studying in another country", "weights": {"international_student": 3}},
            {"text": "Staying on track with core school subjects", "weights": {"education_academic": 2}},
        ],
    },
    {
        "text": "Are you currently playing a competitive sport?",
        "options": [
            {"text": "Yes, at a competitive or travel level", "weights": {"athlete_sports": 3}},
            {"text": "Yes, recreationally", "weights": {"athlete_sports": 1}},
            {"text": "No", "weights": {"education_academic": 1}},
        ],
    },
    {
        "text": "Are you studying from outside the country you plan to enroll in?",
        "options": [
            {"text": "Yes, I'm an international or ESL student", "weights": {"international_student": 3}},
            {"text": "No, this doesn't apply to me", "weights": {"education_academic": 1}},
        ],
    },
    {
        "text": "Who is this learning plan primarily for?",
        "options": [
            {"text": "My child (I'm the parent or guardian)", "weights": {"parent_homeschool": 3}},
            {"text": "Myself, as a student", "weights": {"education_academic": 2}},
            {"text": "Myself, to build career or business skills", "weights": {"business": 2}},
        ],
    },
    {
        "text": "What matters most to you in a curriculum?",
        "options": [
            {"text": "Structured, standards-aligned academics", "weights": {"education_academic": 2}},
            {"text": "A competitive edge for elite admissions", "weights": {"ivy_league": 2}},
            {"text": "Flexibility around a sports schedule", "weights": {"athlete_sports": 2}},
            {"text": "Real-world business and financial literacy", "weights": {"business": 2}},
            {"text": "Support for a global or cross-border education path", "weights": {"international_student": 2}},
            {"text": "Simplicity and guidance for homeschool parents", "weights": {"parent_homeschool": 2}},
        ],
    },
]


class Command(BaseCommand):
    help = "Seeds the full pathway taxonomy (with attached courses, bundle pricing, and a sample questionnaire) for testing the onboarding flow end-to-end."

    @transaction.atomic
    def handle(self, *args, **options):
        # .delete()'s returned count includes cascaded child rows (options,
        # PathwayCourse, weights, ...), so count the target rows separately
        # for an accurate log message.
        legacy_pathways = Pathway.objects.filter(name__in=LEGACY_PATHWAY_NAMES)
        removed = legacy_pathways.count()
        legacy_pathways.delete()
        if removed:
            self.stdout.write(self.style.WARNING(f"Removed {removed} legacy pathway record(s)."))

        legacy_questions = Question.objects.filter(text__in=LEGACY_QUESTION_TEXTS)
        removed = legacy_questions.count()
        legacy_questions.delete()
        if removed:
            self.stdout.write(self.style.WARNING(f"Removed {removed} legacy question record(s)."))

        pathways_by_key = {}
        for pathway_data in PATHWAYS:
            key = pathway_data["key"]
            fields = {k: v for k, v in pathway_data.items() if k != "key"}
            pathway, created = Pathway.objects.update_or_create(
                name=fields["name"],
                defaults={k: v for k, v in fields.items() if k != "name"},
            )
            pathways_by_key[key] = pathway
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} pathway: {pathway.name}"))

        courses = list(Course.objects.filter(status=Status.PUBLISHED)[:3])
        if courses:
            for pathway in pathways_by_key.values():
                for course in courses:
                    _, attached = PathwayCourse.objects.get_or_create(
                        pathway=pathway,
                        course=course,
                        defaults={"order": get_next_order(PathwayCourse.objects.filter(pathway=pathway))},
                    )
                    if attached:
                        self.stdout.write(f"  attached course to {pathway.name}: {course.title}")
        else:
            self.stdout.write(
                self.style.WARNING("  No published courses found to attach — run seeddata first.")
            )

        for rule_data in BUNDLE_RULES:
            PathwayBundleRule.objects.update_or_create(
                pathway_count=rule_data["pathway_count"],
                defaults={"discount_percent": rule_data["discount_percent"]},
            )
        self.stdout.write(self.style.SUCCESS(f"Ensured {len(BUNDLE_RULES)} bundle pricing rule(s)."))

        for question_data in QUESTIONS:
            question, created = Question.objects.get_or_create(
                text=question_data["text"],
                defaults={"order": get_next_order(Question.objects.all())},
            )
            # Full replace of options/weights on every run (create or update) so
            # the questionnaire data always matches QUESTIONS above exactly —
            # mirrors QuestionWriteSerializer._write_options' delete-and-recreate.
            question.options.all().delete()
            for index, option_data in enumerate(question_data["options"], start=1):
                option = QuestionOption.objects.create(
                    question=question, text=option_data["text"], order=index
                )
                for pathway_key, weight in option_data["weights"].items():
                    QuestionOptionPathwayWeight.objects.create(
                        option=option, pathway=pathways_by_key[pathway_key], weight=weight
                    )
            self.stdout.write(f"  {'created' if created else 'refreshed'} question: {question.text}")

        self.stdout.write(self.style.SUCCESS("Pathway seed data ready."))
