import random
from collections import Counter
from datetime import timedelta

import requests
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from assignments.models import Assignment
from common.models import Status
from common.ordering import get_next_order
from courses.models import Category, Course, CourseInstructor, Tag
from daily_drill.models import DrillOption, DrillQuestion
from enrollments.models import Enrollment
from instructors.models import InstructorFeedback, InstructorProfile
from lessons.models import Lesson
from modules.models import Module
from onboarding.models import Question as OnboardingQuestion
from onboarding.models import QuestionOption, QuestionOptionPathwayWeight
from pathways.audience_defaults import DEFAULT_PATHWAY_AUDIENCES
from pathways.models import Audience, Pathway, PathwayBundleRule, PathwayCourse

from quizzes.models import Choice
from quizzes.models import Question as QuizQuestion
from quizzes.models import Quiz
from tiers.models import Tier, TierPathway
from users.models import UserProfile

from ._numa_catalog import NUMA_COURSE_DEFS, NUMA_PROVIDER_THUMBNAILS

User = get_user_model()

# Explicitly requested password, applied when a seeded teacher/student account
# is first created. The admin account is never touched by this command (see
# `_create_admin`) so it keeps whatever password it already has.
DEFAULT_PASSWORD = "1234567a-"

ADMIN_DATA = {"email": "admin@example.com", "first_name": "Admin", "last_name": "User"}

TEACHER_NAMES = [
    ("Michael", "Carter"),
    ("Sarah", "Bennett"),
    ("David", "Nguyen"),
    ("Emily", "Rodriguez"),
    ("James", "Whitfield"),
    ("Olivia", "Martinez"),
    ("Daniel", "Thompson"),
    ("Robert", "Ellison"),
    ("Natalie", "Brooks"),
]

STUDENT_NAMES = [
    ("Ava", "Johnson"),
    ("Liam", "Smith"),
    ("Sophia", "Brown"),
    ("Noah", "Davis"),
    ("Isabella", "Miller"),
    ("Mason", "Wilson"),
    ("Mia", "Moore"),
    ("Ethan", "Taylor"),
    ("Charlotte", "Anderson"),
    ("Lucas", "Thomas"),
    ("Amelia", "Jackson"),
    ("Benjamin", "White"),
    ("Harper", "Harris"),
    ("Elijah", "Martin"),
    ("Evelyn", "Thompson"),
    ("Alexander", "Garcia"),
    ("Abigail", "Martinez"),
    ("William", "Robinson"),
    ("Emily", "Clark"),
    ("Jacob", "Lewis"),
]

# The single curated category vocabulary shared by Course.category and
# Tier.category (see courses/migrations/0003_seed_tier_categories.py and
# 0004_consolidate_categories.py). `_create_categories` get_or_creates exactly
# this list and rejects any course/tier def naming a category outside it, so a
# reseed can never reintroduce the divergent one-off categories those migrations
# consolidated away. Categories are no longer deleted on reseed -- courses point
# at them and the courses now survive. The last three
# (courses/migrations/0006_audience_categories.py) mirror the homepage audience tracks.
CATEGORY_NAMES = [
    "Academic",
    "Athletic",
    "Foundation",
    "Legacy",
    "Professional",
    "Vocational",
    "Scholars & Founders",
    "Coaches & Mentors",
    "Legacy & Family Offices",
]

def build_course_slug(course_def):
    """A unique `/courses/<slug>` for one course def.

    Numa reuses 78 titles across providers (both Abeka and BJU Press publish an
    "Algebra 1"), which would collide on Course.slug's uniqueness, so those are
    namespaced with the course's own unique code. The Cool Nerds titles already
    open with their code ("CEO-101: ..."), so appending it again would only
    repeat it in the URL — they slugify as-is and read as
    /courses/ceo-101-the-athlete-ceo-mindset-...
    """
    title, code = course_def["title"], course_def["code"]
    if title.upper().startswith(code.upper()):
        return slugify(title)
    return slugify(f"{title}-{code}")


def build_learning_outcomes(course_def):
    """"What you'll learn" points for a seeded course, taken from the client's own
    Focus and Core Competencies columns (no randomness, so reseeding stays
    deterministic). Every field is read with .get so a course def written before
    one of them existed still produces a sensible list rather than a KeyError."""
    outcomes = []
    if course_def.get("focus"):
        outcomes.append(course_def["focus"])
    if course_def.get("core"):
        outcomes.append(f"Core competencies: {course_def['core']}")
    # `subject` holds the sheet's full Level label, e.g. "Level 1: Foundational
    # Executive Readiness" — stated with the pathway so a student can see where
    # this course sits in the sequence.
    level, pathway = course_def.get("subject"), course_def.get("pathway")
    if level and pathway:
        outcomes.append(f"Sits in {level} of {pathway}")
    grade_label = course_def.get("grade_label")
    if grade_label:
        outcomes.append(f"Written for Grades {grade_label}")
    outcomes.append("Track your progress module by module and review at your own pace")
    return outcomes


# Demo reviewers: separate from STUDENT_NAMES on purpose, so the regular demo
# students still start with no enrollments. Each reviewer is enrolled in one of an
# instructor's first two courses so their feedback matches the app's rule that
# only enrolled students can review an instructor.
REVIEWER_NAMES = [
    ("Dorothy", "Baker"),
    ("Thulisile", "Nkosi"),
    ("Richard", "Torres"),
    ("Priya", "Raman"),
    ("Marcus", "Webb"),
    ("Hannah", "Lindqvist"),
    ("Omar", "Haddad"),
    ("Grace", "Okafor"),
    ("Daniel", "Kowalski"),
    ("Sofia", "Marchetti"),
    ("Elijah", "Brooks"),
    ("Naomi", "Fischer"),
]
FEEDBACK_REVIEWS_PER_INSTRUCTOR = 4

# (rating, comment) pairs sampled per instructor. Mostly positive with the odd
# constructive note, and one rating without a comment, like real feedback.
INSTRUCTOR_FEEDBACK_POOL = [
    (5, "Clear, patient and well organised. Every lesson built on the last one, and I always knew what to do next."),
    (5, "Excellent instructor. The assignments were the right level of challenge and the feedback was genuinely useful."),
    (5, "I came in nervous about this subject and left confident. The pacing was perfect for our family."),
    (5, "Explains difficult ideas in a simple way. I went back and reviewed the lessons several times and they held up."),
    (5, "Great structure and great examples. The quizzes at the end of each module really locked in what I'd learned."),
    (5, "Warm, encouraging and professional. My child actually looks forward to these lessons now."),
    (4, "Very thorough course. I'd love a few more practice problems in the later modules, but overall excellent."),
    (4, "Well paced and easy to follow. The reading materials were helpful and the assignments were fair."),
    (4, "Solid teaching and good communication. Would take another course with this instructor."),
    (4, "Helpful and knowledgeable. A couple of lessons could go a little deeper, but I learned a lot."),
    (4, "Good balance of theory and practice. The module summaries made revision quick."),
    (5, "Exactly what I was looking for: structured, practical and easy to fit around a busy week."),
    (3, "Good content overall. I found the first module a bit slow, though it picked up nicely after that."),
    (5, ""),
    (4, ""),
    (5, "Highly recommend. The whole experience, from lessons to assignments, felt carefully thought through."),
]

# Rotated per instructor for the demo "About" text; {placeholders} are filled from
# the instructor's own courses so no unverifiable credentials are invented.
INSTRUCTOR_BIO_TEMPLATES = [
    (
        "I'm {first}, an instructor at Cool Nerds. I teach {course_count} courses spanning "
        "{subjects}, built around trusted programs from {providers}.\n\n"
        "My goal is simple: make every lesson clear, structured and easy to come back to. Each course "
        "I lead pairs guided lessons with practice assignments and quizzes, so you always know exactly "
        "where you stand.\n\n"
        "Whether you're starting fresh or reviewing, I'll help you build confidence one module at a time."
    ),
    (
        "Hello, I'm {first}. At Cool Nerds I guide learners through {course_count} courses in "
        "{subjects}, using materials from {providers}.\n\n"
        "I believe good teaching starts with a clear path. That's why every course I lead is broken "
        "into short modules with readings, assignments and a quiz, so progress is always visible.\n\n"
        "Bring your questions, work at your own pace, and let's make learning something you look forward to."
    ),
    (
        "I'm {first} and I love helping learners succeed. My {course_count} courses on Cool Nerds "
        "cover {subjects}, drawing on programs from {providers}.\n\n"
        "You'll find a steady rhythm in my courses: a short lesson, focused practice, then a quiz to "
        "check understanding. It's a simple approach that keeps things manageable and builds real mastery.\n\n"
        "I'm glad you're here. Let's get started."
    ),
]


# Random-looking portraits for the demo instructors. pravatar serves a fixed photo per
# `img` id, so every seed run gives the same instructors the same faces, and the
# images are downloaded once into media storage like the other seed assets.
INSTRUCTOR_AVATAR_URL = "https://i.pravatar.cc/400?img={image_id}"
INSTRUCTOR_AVATAR_IDS = [12, 32, 47, 15, 5, 33, 60, 25, 68, 11, 3, 52]


def _join_words(items):
    items = list(items)
    if len(items) <= 1:
        return "".join(items)
    return ", ".join(items[:-1]) + f" and {items[-1]}"


def build_instructor_profile(first_name, course_defs, index):
    """Demo headline, bio and skills for one seeded instructor, derived only from
    the courses they teach (deterministic, no randomness).

    Built from each course's `pathway` rather than its `subject`: `subject` now
    carries the sheet's full Level label ("Level 1: The Prospect Pipeline &
    Foundation (Freshman/Sophomore Year)"), which names a position in a sequence
    rather than a discipline — two of them joined into "X and Y educator" was
    both nonsense to read and long enough to overflow the headline column."""
    pathways = Counter(d["pathway"] for d in course_defs if d.get("pathway"))
    providers = Counter(d["provider"] for d in course_defs if d.get("provider"))
    top_pathways = [name for name, _ in pathways.most_common(3)]
    top_providers = [name for name, _ in providers.most_common(3)]

    if len(top_pathways) >= 2:
        headline = f"Teaches {top_pathways[0]} and {top_pathways[1]}"
    elif top_pathways:
        headline = f"Teaches {top_pathways[0]}"
    else:
        headline = "Instructor at Cool Nerds"
    # Read the limit off the model so a future column change cannot silently
    # reintroduce the DataError this guard exists to prevent.
    headline = headline[: InstructorProfile._meta.get_field("headline").max_length]

    bio = INSTRUCTOR_BIO_TEMPLATES[index % len(INSTRUCTOR_BIO_TEMPLATES)].format(
        first=first_name,
        course_count=len(course_defs),
        subjects=_join_words(top_pathways) or "a range of subjects",
        providers=_join_words(top_providers) or "leading publishers",
    )
    return {"headline": headline, "bio": bio, "skills": top_pathways}


# Fixed seed for every random-but-deterministic choice `_create_course_content` makes
# (course amount, module/lesson counts, quiz distractor sampling) — reused every run so
# reseeding always produces the exact same dataset, per this command's "safe to re-run"
# guarantee.
SEED_RNG_SEED = 42

YOUTUBE_DEMO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Real, publicly hosted sample files shared by every generated PDF/DOCX lesson — the
# seeded documents are identical demo content, so 1000+ per-course copies would buy
# nothing. Downloaded once into MEDIA_ROOT by `_download_assets`.
LESSON_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
LESSON_DOCX_URL = "https://calibre-ebook.com/downloads/demos/demo.docx"
LESSON_ASSET_PATHS = {
    "pdf": "lessons/seed-sample-lesson.pdf",
    "docx": "lessons/seed-sample-lesson.docx",
}
LESSON_ASSET_URLS = {"pdf": LESSON_PDF_URL, "docx": LESSON_DOCX_URL}

# Each generated module gets 1-2 lessons, cycling through these content types in order.
LESSON_TYPE_CYCLE = [Lesson.ContentType.VIDEO, Lesson.ContentType.PDF, Lesson.ContentType.DOCUMENT]

LESSON_TYPE_LABELS = {
    Lesson.ContentType.VIDEO: "Video Walkthrough",
    Lesson.ContentType.PDF: "Reading (PDF)",
    Lesson.ContentType.DOCUMENT: "Reference Guide (DOCX)",
}

# `asset` names the LESSON_ASSET_PATHS entry attached to Lesson.file. PDF and DOCUMENT
# lessons carry a file; VIDEO lessons carry a video_url instead.
LESSON_TYPE_CONTENT = {
    Lesson.ContentType.VIDEO: {
        "video_url": YOUTUBE_DEMO_URL,
        "content_data": "",
        "duration_minutes": 12,
        "asset": None,
    },
    Lesson.ContentType.PDF: {
        "video_url": None,
        "content_data": "Downloadable PDF reference material covering this module's topic in depth.",
        "duration_minutes": None,
        "asset": "pdf",
    },
    Lesson.ContentType.DOCUMENT: {
        "video_url": None,
        "content_data": "Supplementary DOCX handout with worked examples and practice notes.",
        "duration_minutes": None,
        "asset": "docx",
    },
}

# Titles/descriptions for the 1-2 generated modules per course, used in list order.
MODULE_DEFS = [
    {
        "title": "Foundations",
        "description": "Introduces the foundational concepts covered in {title}.",
    },
    {
        "title": "Applied Practice",
        "description": "Applies the concepts from {title} through guided practice and review.",
    },
]

# Random but deterministic course price, in whole-dollar steps.
COURSE_AMOUNT_CHOICES = list(range(20, 300, 10))

# Provider logo, keyed by provider name, downloaded once into
# MEDIA_ROOT/course_thumbnails/ and shared by every course from that provider.
# Cool Nerds has no logo on file, so its entry is intentionally None:
# `_download_assets` skips a provider whose URL is None and its courses seed
# without a thumbnail (the frontend falls back to its own placeholder). Add a
# hosted URL here to give the Cool Nerds courses real artwork. The 30 Numa
# provider logos come from the catalog module beside this one.
PROVIDER_THUMBNAILS = {
    "Cool Nerds": None,
    **NUMA_PROVIDER_THUMBNAILS,
}

# Cool Nerds' own curriculum: the thirty courses from the client's "Courses We
# need to add" sheet. Every course below is first-party, `provider` is always
# Cool Nerds, and there is no provider logo to download, so these seed without a
# thumbnail (see `_download_assets`). They are the only courses bundled into
# PATHWAY_DEFS; the 629 Numa courses sit alongside them in the catalog without
# belonging to a pathway.
#
# `title` carries the sheet's course code ("CEO-101: ...") because that is how the
# client refers to them and how they sort inside a pathway, and `subject` carries
# the sheet's full Level label from column A ("Level 2: Business Operations,
# Branding & Compliance"). `grade_label` is its school-year hint -- the sheet
# spells the years out for Recruiting only, so the other two run 9-12.
#
# Those two are not just labelling. `_create_quiz` builds each question's wrong
# answers from the other real values in this list, so a single-provider catalog
# with one level and one grade label would leave it nothing to choose from. Nine
# levels and four grade labels keep those questions answerable, and `focus`
# (unique per course) backs a third. `provider` is left as the one value it
# honestly has; _create_quiz drops any question it cannot fill with four options.
# `pathway` and `core` feed the course page's "What you'll learn" list.
COOL_NERDS_COURSE_DEFS = [
    {"code": "CEO-101", "title": "CEO-101: The Athlete CEO Mindset & Enterprise Foundations", "category": "Professional", "description": "Establishing the transition from athlete to Chief Executive Officer of \"Me, Inc.\"\n\nCore competencies: Time/energy management matrixes, personal governance models, and setting multi-year athletic, academic, and professional OKRs (Objectives and Key Results).\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Foundational Executive Readiness · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Foundational Executive Readiness", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Establishing the transition from athlete to Chief Executive Officer of \"Me, Inc.\"", "core": "Time/energy management matrixes, personal governance models, and setting multi-year athletic, academic, and professional OKRs (Objectives and Key Results).", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 1: Foundational Executive Readiness"]},
    {"code": "CEO-102", "title": "CEO-102: Academic Leverage & Collegiate Eligibility Architecture", "category": "Professional", "description": "Aligning academic progress with long-term career optionality.\n\nCore competencies: NCAA Clearinghouse rules, high school state association regulations, credit-to-GPA optimization, and leveraging university/school academic resources for professional advantage.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Foundational Executive Readiness · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Foundational Executive Readiness", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Aligning academic progress with long-term career optionality.", "core": "NCAA Clearinghouse rules, high school state association regulations, credit-to-GPA optimization, and leveraging university/school academic resources for professional advantage.", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 1: Foundational Executive Readiness"]},
    {"code": "CEO-201", "title": "CEO-201: Personal Branding & Digital Asset Architecture", "category": "Professional", "description": "Transforming social media presence into high-value digital property.\n\nCore competencies: Audience demographic auditing, content monetization strategies, digital footprint cleanup, and personal brand guidelines/style sheets.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Business Operations, Branding & Compliance · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Business Operations, Branding & Compliance", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Transforming social media presence into high-value digital property.", "core": "Audience demographic auditing, content monetization strategies, digital footprint cleanup, and personal brand guidelines/style sheets.", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 2: Business Operations, Branding & Compliance"]},
    {"code": "CEO-202", "title": "CEO-202: NIL Compliance, Contracts & Legal Literacy", "category": "Professional", "description": "Protecting amateur eligibility while navigating local, state, and collegiate NIL bylaws.\n\nCore competencies: Understanding state-by-state high school NIL restrictions, identifying predatory contract terms (exclusivity, royalty locks, IP transfer), and FTC disclosure guidelines.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Business Operations, Branding & Compliance · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Business Operations, Branding & Compliance", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Protecting amateur eligibility while navigating local, state, and collegiate NIL bylaws.", "core": "Understanding state-by-state high school NIL restrictions, identifying predatory contract terms (exclusivity, royalty locks, IP transfer), and FTC disclosure guidelines.", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 2: Business Operations, Branding & Compliance"]},
    {"code": "CEO-203", "title": "CEO-203: Financial Literacy, Wealth Preservation & Tax Management", "category": "Professional", "description": "Managing 1099 independent contractor income and long-term financial health.\n\nCore competencies: Basic tax forecasting, 1099 vs. W-2 earnings, setting up business accounts, liquid reserve management, and evaluating financial advisors/fiduciaries.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Business Operations, Branding & Compliance · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Business Operations, Branding & Compliance", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Managing 1099 independent contractor income and long-term financial health.", "core": "Basic tax forecasting, 1099 vs. W-2 earnings, setting up business accounts, liquid reserve management, and evaluating financial advisors/fiduciaries.", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 2: Business Operations, Branding & Compliance"]},
    {"code": "CEO-204", "title": "CEO-204: Media Strategy, Public Relations & Crisis Governance", "category": "Professional", "description": "Mastering live press conferences, podcasting, and managing public narrative.\n\nCore competencies: The \"3-Message House\" framework for interviews, handling high-pressure media questions, crisis response protocols, and reputation repair.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Business Operations, Branding & Compliance · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Business Operations, Branding & Compliance", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Mastering live press conferences, podcasting, and managing public narrative.", "core": "The \"3-Message House\" framework for interviews, handling high-pressure media questions, crisis response protocols, and reputation repair.", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 2: Business Operations, Branding & Compliance"]},
    {"code": "CEO-301", "title": "CEO-301: Deal Structuring, Commercial Negotiations & Advisory Management", "category": "Professional", "description": "Evaluating, pitching, and executing brand partnerships and advisory relationships.\n\nCore competencies: Building a 3-page corporate pitch deck, evaluating ROI for brand partners, conducting negotiation drills, and selecting/vetting agents, attorneys, and managers.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Advanced Executive Operations & Lifetime Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Advanced Executive Operations & Lifetime Legacy", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Evaluating, pitching, and executing brand partnerships and advisory relationships.", "core": "Building a 3-page corporate pitch deck, evaluating ROI for brand partners, conducting negotiation drills, and selecting/vetting agents, attorneys, and managers.", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 3: Advanced Executive Operations & Lifetime Legacy"]},
    {"code": "CEO-302", "title": "CEO-302: High-Performance Operations & Kinetic Recovery Protocols", "category": "Professional", "description": "Treating physical and mental health as non-negotiable operational assets.\n\nCore competencies: Sleep hygiene science, nutrition/supplement auditing, injury recovery frameworks, and burnout detection mechanisms.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Advanced Executive Operations & Lifetime Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Advanced Executive Operations & Lifetime Legacy", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Treating physical and mental health as non-negotiable operational assets.", "core": "Sleep hygiene science, nutrition/supplement auditing, injury recovery frameworks, and burnout detection mechanisms.", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 3: Advanced Executive Operations & Lifetime Legacy"]},
    {"code": "CEO-303", "title": "CEO-303: Emotional Intelligence, Relationship Governance & Boundary Setting", "category": "Professional", "description": "Managing peer dynamics, romantic relationships, family ties, and networking.\n\nCore competencies: Executing the \"No Muscle\" without alienating peers, protecting personal boundaries against \"hanger-on\" dynamics, and building an executive mentorship advisory board.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Advanced Executive Operations & Lifetime Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Advanced Executive Operations & Lifetime Legacy", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Managing peer dynamics, romantic relationships, family ties, and networking.", "core": "Executing the \"No Muscle\" without alienating peers, protecting personal boundaries against \"hanger-on\" dynamics, and building an executive mentorship advisory board.", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 3: Advanced Executive Operations & Lifetime Legacy"]},
    {"code": "CEO-304", "title": "CEO-304: The Capstone - Post-Athletic Transition & Venture Building", "category": "Professional", "description": "Leveraging athletic equity to build sustainable long-term businesses and community organizations.\n\nCore competencies: Venture capital and angel investment basics, founding non-profits/foundations, career mapping beyond sports, and executing an executive exit/transition playbook.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Advanced Executive Operations & Lifetime Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Advanced Executive Operations & Lifetime Legacy", "grade_label": "9–12", "pathway": "The Athlete CEO Pathway", "focus": "Leveraging athletic equity to build sustainable long-term businesses and community organizations.", "core": "Venture capital and angel investment basics, founding non-profits/foundations, career mapping beyond sports, and executing an executive exit/transition playbook.", "tags": ["Cool Nerds", "The Athlete CEO Pathway", "Level 3: Advanced Executive Operations & Lifetime Legacy"]},
    {"code": "REC-101", "title": "REC-101: The Recruiting Landscape & Academic Safety Net", "category": "Athletic", "description": "Understanding the timeline and non-negotiable requirements for recruitment.\n\nCore competencies: NCAA Eligibility Center registration, core course requirements, the sliding scale (GPA/Test Scores), and the functional differences between D-I, D-II, D-III, NAIA, and JUCO pathways.\n\nProvider: Cool Nerds · 1 credit · Grades 9–10 · Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year) · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year)", "grade_label": "9–10", "pathway": "The Recruiting Readiness Pathway", "focus": "Understanding the timeline and non-negotiable requirements for recruitment.", "core": "NCAA Eligibility Center registration, core course requirements, the sliding scale (GPA/Test Scores), and the functional differences between D-I, D-II, D-III, NAIA, and JUCO pathways.", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year)"]},
    {"code": "REC-102", "title": "REC-102: The Digital Portfolio & Film Room", "category": "Athletic", "description": "Creating the ultimate athletic sales asset.\n\nCore competencies: How college coaches watch film (first 30 seconds rule), isolating the right plays, updating stats across digital platforms (Hudl, MaxPreps), and avoiding over-edited \"mixtape\" red flags.\n\nProvider: Cool Nerds · 1 credit · Grades 9–10 · Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year) · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year)", "grade_label": "9–10", "pathway": "The Recruiting Readiness Pathway", "focus": "Creating the ultimate athletic sales asset.", "core": "How college coaches watch film (first 30 seconds rule), isolating the right plays, updating stats across digital platforms (Hudl, MaxPreps), and avoiding over-edited \"mixtape\" red flags.", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year)"]},
    {"code": "REC-103", "title": "REC-103: Building the Target \"Fit\" Matrix", "category": "Athletic", "description": "Creating a realistic, data-driven list of target schools.\n\nCore competencies: Analyzing college roster depth (who is graduating at your position), evaluating degree programs, geographic preferences, and separating the \"dream school\" from the \"right school.\"\n\nProvider: Cool Nerds · 1 credit · Grades 9–10 · Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year) · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year)", "grade_label": "9–10", "pathway": "The Recruiting Readiness Pathway", "focus": "Creating a realistic, data-driven list of target schools.", "core": "Analyzing college roster depth (who is graduating at your position), evaluating degree programs, geographic preferences, and separating the \"dream school\" from the \"right school.\"", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 1: The Prospect Pipeline & Foundation (Freshman/Sophomore Year)"]},
    {"code": "REC-201", "title": "REC-201: Communication Architecture & The Cold Pitch", "category": "Athletic", "description": "Reaching out to college coaches like a professional.\n\nCore competencies: Crafting the perfect introduction email, subject line optimization, managing direct messages on social media, and preparing for the first phone call with a recruiter.\n\nProvider: Cool Nerds · 1 credit · Grades 10–11 · Level 2: The Outbound Campaign (Sophomore/Junior Year) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Outbound Campaign (Sophomore/Junior Year)", "grade_label": "10–11", "pathway": "The Recruiting Readiness Pathway", "focus": "Reaching out to college coaches like a professional.", "core": "Crafting the perfect introduction email, subject line optimization, managing direct messages on social media, and preparing for the first phone call with a recruiter.", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 2: The Outbound Campaign (Sophomore/Junior Year)"]},
    {"code": "REC-202", "title": "REC-202: Showcase, Combine & Camp ROI", "category": "Athletic", "description": "Maximizing exposure while minimizing wasted money.\n\nCore competencies: Identifying which \"invite-only\" camps are genuine vs. money-grabs, setting goals for regional combines, and how to introduce yourself to a coach on the sideline.\n\nProvider: Cool Nerds · 1 credit · Grades 10–11 · Level 2: The Outbound Campaign (Sophomore/Junior Year) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Outbound Campaign (Sophomore/Junior Year)", "grade_label": "10–11", "pathway": "The Recruiting Readiness Pathway", "focus": "Maximizing exposure while minimizing wasted money.", "core": "Identifying which \"invite-only\" camps are genuine vs. money-grabs, setting goals for regional combines, and how to introduce yourself to a coach on the sideline.", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 2: The Outbound Campaign (Sophomore/Junior Year)"]},
    {"code": "REC-203", "title": "REC-203: The Campus Visit Breakdown", "category": "Athletic", "description": "Maximizing unofficial and official visits to read the true culture of a program.\n\nCore competencies: Questions to ask the coaching staff, observing player interactions, evaluating the strength/conditioning facilities, and identifying empty promises.\n\nProvider: Cool Nerds · 1 credit · Grades 10–11 · Level 2: The Outbound Campaign (Sophomore/Junior Year) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Outbound Campaign (Sophomore/Junior Year)", "grade_label": "10–11", "pathway": "The Recruiting Readiness Pathway", "focus": "Maximizing unofficial and official visits to read the true culture of a program.", "core": "Questions to ask the coaching staff, observing player interactions, evaluating the strength/conditioning facilities, and identifying empty promises.", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 2: The Outbound Campaign (Sophomore/Junior Year)"]},
    {"code": "REC-204", "title": "REC-204: The Parent/Guardian Protocol", "category": "Athletic", "description": "Establishing the family's role as the support system, not the front office.\n\nCore competencies: The \"red flags\" college coaches look for in parents, how to support the athlete during stressful communication lulls, and financial planning for travel/camps.\n\nProvider: Cool Nerds · 1 credit · Grades 10–11 · Level 2: The Outbound Campaign (Sophomore/Junior Year) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Outbound Campaign (Sophomore/Junior Year)", "grade_label": "10–11", "pathway": "The Recruiting Readiness Pathway", "focus": "Establishing the family's role as the support system, not the front office.", "core": "The \"red flags\" college coaches look for in parents, how to support the athlete during stressful communication lulls, and financial planning for travel/camps.", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 2: The Outbound Campaign (Sophomore/Junior Year)"]},
    {"code": "REC-301", "title": "REC-301: Deconstructing Offers, Walk-Ons & Roster Math", "category": "Athletic", "description": "Understanding what is actually on the table.\n\nCore competencies: Equivalency vs. Head-Count sports, partial scholarship math, understanding the Preferred Walk-On (PWO) route, and the realities of the Transfer Portal's impact on high school recruits.\n\nProvider: Cool Nerds · 1 credit · Grades 11–12 · Level 3: The Close & Transition (Junior/Senior Year) · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: The Close & Transition (Junior/Senior Year)", "grade_label": "11–12", "pathway": "The Recruiting Readiness Pathway", "focus": "Understanding what is actually on the table.", "core": "Equivalency vs. Head-Count sports, partial scholarship math, understanding the Preferred Walk-On (PWO) route, and the realities of the Transfer Portal's impact on high school recruits.", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 3: The Close & Transition (Junior/Senior Year)"]},
    {"code": "REC-302", "title": "REC-302: Negotiation, Leverage & The Decision", "category": "Athletic", "description": "Managing the pressure of the final choice.\n\nCore competencies: How to ethically leverage competing offers, asking for more time when a coach issues a deadline, and committing with conviction.\n\nProvider: Cool Nerds · 1 credit · Grades 11–12 · Level 3: The Close & Transition (Junior/Senior Year) · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: The Close & Transition (Junior/Senior Year)", "grade_label": "11–12", "pathway": "The Recruiting Readiness Pathway", "focus": "Managing the pressure of the final choice.", "core": "How to ethically leverage competing offers, asking for more time when a coach issues a deadline, and committing with conviction.", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 3: The Close & Transition (Junior/Senior Year)"]},
    {"code": "REC-303", "title": "REC-303: The Capstone - Signing Day to Summer Workouts", "category": "Athletic", "description": "Bridging the gap between high school senior and college freshman.\n\nCore competencies: National Letter of Intent (NLI) logistics, securing the collegiate summer workout packet, adjusting to elite conditioning standards, and arriving on campus ready to compete.\n\nProvider: Cool Nerds · 1 credit · Grades 11–12 · Level 3: The Close & Transition (Junior/Senior Year) · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: The Close & Transition (Junior/Senior Year)", "grade_label": "11–12", "pathway": "The Recruiting Readiness Pathway", "focus": "Bridging the gap between high school senior and college freshman.", "core": "National Letter of Intent (NLI) logistics, securing the collegiate summer workout packet, adjusting to elite conditioning standards, and arriving on campus ready to compete.", "tags": ["Cool Nerds", "The Recruiting Readiness Pathway", "Level 3: The Close & Transition (Junior/Senior Year)"]},
    {"code": "MT-101", "title": "MT-101: Identity Beyond the Jersey", "category": "Athletic", "description": "Decoupling self-worth from athletic performance.\n\nCore competencies: The \"Who Am I?\" audit, understanding the danger of a singular athletic identity, and building psychological safety nets for when sports are temporarily (or permanently) removed.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Psychological Foundations (Awareness & Identity) · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Psychological Foundations (Awareness & Identity)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Decoupling self-worth from athletic performance.", "core": "The \"Who Am I?\" audit, understanding the danger of a singular athletic identity, and building psychological safety nets for when sports are temporarily (or permanently) removed.", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 1: Psychological Foundations (Awareness & Identity)"]},
    {"code": "MT-102", "title": "MT-102: Emotional Literacy & Baseline Auditing", "category": "Athletic", "description": "Recognizing emotional states before they hijack performance.\n\nCore competencies: Naming emotions (frustration vs. anger vs. anxiety), identifying physical \"tells\" of emotional spikes (e.g., shallow breathing, clenched jaw), and establishing a neutral emotional baseline.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Psychological Foundations (Awareness & Identity) · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Psychological Foundations (Awareness & Identity)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Recognizing emotional states before they hijack performance.", "core": "Naming emotions (frustration vs. anger vs. anxiety), identifying physical \"tells\" of emotional spikes (e.g., shallow breathing, clenched jaw), and establishing a neutral emotional baseline.", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 1: Psychological Foundations (Awareness & Identity)"]},
    {"code": "MT-103", "title": "MT-103: Mastering the Inner Critic", "category": "Athletic", "description": "Taking control of internal dialogue.\n\nCore competencies: Identifying negative self-talk loops, the difference between productive self-correction and destructive self-punishment, and developing personalized \"anchor phrases\" to reset focus.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Psychological Foundations (Awareness & Identity) · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Psychological Foundations (Awareness & Identity)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Taking control of internal dialogue.", "core": "Identifying negative self-talk loops, the difference between productive self-correction and destructive self-punishment, and developing personalized \"anchor phrases\" to reset focus.", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 1: Psychological Foundations (Awareness & Identity)"]},
    {"code": "MT-201", "title": "MT-201: Pre-Game Architecture & Routine", "category": "Athletic", "description": "Creating predictable mental states before competition.\n\nCore competencies: Building a custom pre-game physical and mental sequence, the psychology of visualization (seeing success vs. seeing the process), and the difference between \"hype\" (adrenaline) and \"focus\" (clarity).\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Tactical Arsenal (Performance Under Fire) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Tactical Arsenal (Performance Under Fire)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Creating predictable mental states before competition.", "core": "Building a custom pre-game physical and mental sequence, the psychology of visualization (seeing success vs. seeing the process), and the difference between \"hype\" (adrenaline) and \"focus\" (clarity).", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 2: The Tactical Arsenal (Performance Under Fire)"]},
    {"code": "MT-202", "title": "MT-202: Processing Pressure & The Anxiety Protocol", "category": "Athletic", "description": "Converting nervous energy into competitive fuel.\n\nCore competencies: Box breathing and physiological resets, the \"What's Important Now\" (W.I.N.) framework for staying present, and managing the weight of parental or scout expectations.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Tactical Arsenal (Performance Under Fire) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Tactical Arsenal (Performance Under Fire)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Converting nervous energy into competitive fuel.", "core": "Box breathing and physiological resets, the \"What's Important Now\" (W.I.N.) framework for staying present, and managing the weight of parental or scout expectations.", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 2: The Tactical Arsenal (Performance Under Fire)"]},
    {"code": "MT-203", "title": "MT-203: Reframing Failure & The \"Next Play\" Mentality", "category": "Athletic", "description": "Drastically reducing the time it takes to recover from an in-game mistake.\n\nCore competencies: The \"flush it\" physical trigger (e.g., tapping the helmet, wiping the shoes), separating the action (a bad pass) from the identity (a bad player), and analyzing film without emotional attachment.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Tactical Arsenal (Performance Under Fire) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Tactical Arsenal (Performance Under Fire)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Drastically reducing the time it takes to recover from an in-game mistake.", "core": "The \"flush it\" physical trigger (e.g., tapping the helmet, wiping the shoes), separating the action (a bad pass) from the identity (a bad player), and analyzing film without emotional attachment.", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 2: The Tactical Arsenal (Performance Under Fire)"]},
    {"code": "MT-204", "title": "MT-204: Post-Game Decompression & Recovery", "category": "Athletic", "description": "Healthy processing of wins and losses before returning to daily life.\n\nCore competencies: The 24-hour rule for emotional reactions, managing the car ride home with parents, and preventing one bad performance from bleeding into the academic week.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Tactical Arsenal (Performance Under Fire) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Tactical Arsenal (Performance Under Fire)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Healthy processing of wins and losses before returning to daily life.", "core": "The 24-hour rule for emotional reactions, managing the car ride home with parents, and preventing one bad performance from bleeding into the academic week.", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 2: The Tactical Arsenal (Performance Under Fire)"]},
    {"code": "MT-301", "title": "MT-301: The Psychology of Injury & Rehabilitation", "category": "Athletic", "description": "Managing the isolation and depression that often accompanies physical trauma.\n\nCore competencies: Setting micro-goals for physical therapy, staying engaged with team culture when unable to play, and overcoming the fear of re-injury upon return.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Elite Armor (Adversity & Leadership) · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Elite Armor (Adversity & Leadership)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Managing the isolation and depression that often accompanies physical trauma.", "core": "Setting micro-goals for physical therapy, staying engaged with team culture when unable to play, and overcoming the fear of re-injury upon return.", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 3: Elite Armor (Adversity & Leadership)"]},
    {"code": "MT-302", "title": "MT-302: Unlocking the \"Flow\" State", "category": "Athletic", "description": "Finding the zone where skill and challenge perfectly align.\n\nCore competencies: Understanding the neuroscience of flow, eliminating external distractions, and letting go of conscious thought during high-speed competition.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Elite Armor (Adversity & Leadership) · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Elite Armor (Adversity & Leadership)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Finding the zone where skill and challenge perfectly align.", "core": "Understanding the neuroscience of flow, eliminating external distractions, and letting go of conscious thought during high-speed competition.", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 3: Elite Armor (Adversity & Leadership)"]},
    {"code": "MT-303", "title": "MT-303: The Capstone - Alpha Leadership & Team Psychology", "category": "Athletic", "description": "Projecting mental toughness outward to elevate the entire roster.\n\nCore competencies: Leading through adversity, confronting teammates constructively (the \"care enough to confront\" model), and becoming an extension of the coaching staff's culture.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Elite Armor (Adversity & Leadership) · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Elite Armor (Adversity & Leadership)", "grade_label": "9–12", "pathway": "The Mental Toughness Pathway", "focus": "Projecting mental toughness outward to elevate the entire roster.", "core": "Leading through adversity, confronting teammates constructively (the \"care enough to confront\" model), and becoming an extension of the coaching staff's culture.", "tags": ["Cool Nerds", "The Mental Toughness Pathway", "Level 3: Elite Armor (Adversity & Leadership)"]},
]

# The whole catalog: the client's thirty Cool Nerds courses first, then Numa's
# 629. Order matters — `_create_course_content` consumes one shared RNG in this
# order, so appending rather than interleaving keeps the Cool Nerds courses'
# generated prices and quizzes identical to what they were before Numa's catalog
# was restored alongside them.
COURSE_DEFS = COOL_NERDS_COURSE_DEFS + NUMA_COURSE_DEFS

# Distractor pools for the generated quiz's metadata questions (see
# `_create_course_content`) — every distinct subject/provider/grade-label that actually
# appears somewhere in COURSE_DEFS, so a wrong answer is always another real value from
# the catalog rather than something made up.
ALL_SUBJECTS = sorted({course_def["subject"] for course_def in COURSE_DEFS})
ALL_PROVIDERS = sorted({course_def["provider"] for course_def in COURSE_DEFS})
ALL_GRADE_LABELS = sorted({course_def["grade_label"] for course_def in COURSE_DEFS})
# Every course's Focus line from the client's sheet — unique per course, so this
# is the one pool that scales with the catalog rather than with its vocabulary.
# Only the Cool Nerds defs carry one, so this is keyed off `.get`: a Numa course
# simply gets no focus question (see `_create_quiz`).
ALL_FOCUSES = sorted({cd["focus"] for cd in COURSE_DEFS if cd.get("focus")})

# One correct answer plus three distractors. `_create_quiz` drops any question
# whose pool cannot supply that many distinct values.
CHOICES_PER_QUESTION = 4

# The three pathways from the client's "Courses We need to add" sheet, each
# holding exactly the ten courses it listed, in sheet order. The 15 demo pathways
# that used to live here (homeschool, Ivy League, trades, international...) were
# removed at the client's request along with the catalog they bundled, so these
# three are now the whole offering. TIER_DEFS, QUESTIONNAIRE and
# DEFAULT_PATHWAY_AUDIENCES were pruned to match -- each of them keys off the
# names and keys below, and a stale reference is a hard KeyError at seed time.
PATHWAY_DEFS = [
    {
        "key": "athlete_ceo",
        "name": "The Athlete CEO Pathway",
        "summary": "Running your athletic career as an enterprise: governance, brand, NIL compliance, money and the exit.",
        "description": (
            "Treats the athlete as the chief executive of 'Me, Inc.' — personal governance and OKRs, "
            "eligibility architecture, brand and NIL contracts, tax and wealth preservation, media "
            "and crisis handling, then deal structuring and the post-athletic venture transition."
        ),
        "base_price": 299,
        "course_codes": [
            "CEO-101", "CEO-102", "CEO-201", "CEO-202", "CEO-203",
            "CEO-204", "CEO-301", "CEO-302", "CEO-303", "CEO-304"
        ],
    },
    {
        "key": "recruiting_readiness",
        "name": "The Recruiting Readiness Pathway",
        "summary": "The full recruiting cycle: eligibility and film, the outbound campaign, then offers, leverage and signing.",
        "description": (
            "Walks a prospect from freshman year to signing day — NCAA eligibility and the division "
            "landscape, highlight film and a data-driven target list, cold outreach and camp ROI, "
            "campus visits, then offer math, negotiation and the handoff to college conditioning."
        ),
        "base_price": 249,
        "course_codes": [
            "REC-101", "REC-102", "REC-103", "REC-201", "REC-202",
            "REC-203", "REC-204", "REC-301", "REC-302", "REC-303"
        ],
    },
    {
        "key": "mental_toughness",
        "name": "The Mental Toughness Pathway",
        "summary": "Sport psychology from identity and emotional literacy through pressure routines to injury and team leadership.",
        "description": (
            "Builds the psychological side of competing — decoupling self-worth from performance, "
            "naming emotions before they hijack a game, pre-game routines and pressure protocols, "
            "resetting after mistakes, then the harder ground of injury, flow and leading a locker "
            "room."
        ),
        "base_price": 199,
        "course_codes": [
            "MT-101", "MT-102", "MT-103", "MT-201", "MT-202",
            "MT-203", "MT-204", "MT-301", "MT-302", "MT-303"
        ],
    },
]

# The nine tiers, in level order. `pathway_keys` are PATHWAY_DEFS keys and their
# list order becomes each TierPathway.order (1-based, per tier). A pathway may
# legitimately appear under more than one tier — TierPathway is a real M2M, not
# a Pathway.tier FK.
#
# Six of the nine now carry no pathways. The tiers themselves are product
# structure the client has not retired, but the demo pathways that filled them
# went with the Numa catalog, and the sheet's three replacements are all
# athlete-facing: Mental Toughness under The Blueprint, Recruiting Readiness
# under The Recruiting Window, Athlete CEO under The Elite Level. An empty tier
# renders as a tier with nothing beneath it rather than breaking — nothing
# asserts that a tier HAS pathways, only that a pathway has a tier — so these
# are left in place for the client's later curriculum to fill.
TIER_DEFS = [
    {
        "level": 1,
        "name": "The Blueprint",
        "audience": "8th-10th Grade Athletes",
        "focus_description": "Early positioning, academic foundations, and avoiding common pitfalls.",
        "category": "Athletic",
        "estimated_duration": "12 Months",
        "pathway_keys": ["mental_toughness"],
    },
    {
        "level": 2,
        "name": "The Parent Playbook",
        "audience": "Parents of Rising Elite Athletes",
        "focus_description": "Managing external pressures, vetting professionals, and protecting the family.",
        "category": "Foundation",
        "estimated_duration": "Ongoing",
        "pathway_keys": [],
    },
    {
        "level": 3,
        "name": "The Recruiting Window",
        "audience": "High School Upperclassmen Athletes and Their Parents (11th-12th Grade)",
        "focus_description": "Securing the offer, official visits, and early NIL preparation.",
        "category": "Athletic",
        "estimated_duration": "8 Months",
        "pathway_keys": ["recruiting_readiness"],
    },
    {
        "level": 4,
        "name": "The Scholar's Foundation",
        "audience": "Ambitious Non-Athlete Students and Their Parents (7th-10th Grade)",
        "focus_description": "Academic excellence, early leadership, tech literacy, and extracurricular strategy.",
        "category": "Academic",
        "estimated_duration": "18 Months",
        "pathway_keys": [],
    },
    {
        "level": 5,
        "name": "The Career Launchpad",
        "audience": "High School Upperclassmen and College Students (11th Grade - College)",
        "focus_description": "College admissions, internships, networking, and early career placement.",
        "category": "Academic",
        "estimated_duration": "6-9 Months",
        "pathway_keys": [],
    },
    {
        "level": 6,
        "name": "The Pathfinder",
        "audience": "11th Grade to Young Adults Exploring Trades, Vocational, or Alternative Paths",
        "focus_description": "Practical life skills, financial independence, career exploration, and self-discovery.",
        "category": "Vocational",
        "estimated_duration": "6 Months",
        "pathway_keys": [],
    },
    {
        "level": 7,
        "name": "The Elite Level",
        "audience": "College Stars, Top-100 High School Recruits, and Pro-Bound Athletes",
        "focus_description": "NIL maximization, pro transition, complex contract negotiation, and foundational wealth building.",
        "category": "Athletic",
        "estimated_duration": "Year-Round",
        "pathway_keys": ["athlete_ceo"],
    },
    {
        "level": 8,
        "name": "The Business Elite Level",
        "audience": "High-Level Corporate Executives, Founders, and Business Leaders",
        "focus_description": "Business scaling, operational efficiency, AI integration, infrastructure building, and strategic resource allocation.",
        "category": "Professional",
        "estimated_duration": "6 Months",
        "pathway_keys": [],
    },
    {
        "level": 9,
        "name": "Critical Thinking",
        "audience": "High-Stakes Decision-Makers Across All Domains",
        "focus_description": "Cognitive biases, mental models, risk assessment, game theory, and strategic execution.",
        "category": "Legacy",
        "estimated_duration": "Custom Iterative",
        "pathway_keys": [],
    },
]

BUNDLE_RULES = [
    {"pathway_count": 2, "discount_percent": 15},
    {"pathway_count": 3, "discount_percent": 25},
    {"pathway_count": 4, "discount_percent": 30},
    {"pathway_count": 5, "discount_percent": 35},
]

# Daily Drill scenarios, upserted by scenario text so a reseed refreshes the bank
# without duplicating it or dropping the attempts students have already made.
# Each option carries the impact/rationale text the drill result screen shows
# once a student picks it.
DRILL_DEFS = [
    {
        "scenario": (
            "An energy drink brand \"HyperCharge\" offers you a $15,000 NIL contract. However, the "
            "contract contains a non-compete clause that blocks you from wearing or endorsing any "
            "activewear brand, even during official collegiate tournaments which are sponsored by "
            "your varsity equipment sponsor. What is your move?"
        ),
        "guidelines": "Goal: Balance immediate monetization with future flexibility and compliance with institutional athletic rules.",
        "options": [
            {
                "key": "A",
                "text": "Sign immediately. $15k is high upfront liquidity and you can deal with school policy violations later.",
                "impact": "High immediate revenue, but severely compromises athletic eligibility. This could lead to suspensions and violate university licensing covenants.",
                "rationale": "Accepting cash with restrictive covenants that violate school athletic rules leads to suspensions. Immediate cash is wiped out by damage to athlete reputation.",
                "score": 30,
            },
            {
                "key": "B",
                "text": "Reject the offer outright and state that the athletic-wear restrictions make you too big a risk to sign.",
                "impact": "Zero conflict, but also zero revenue. Misses an opportunity to show commercial posture and negotiate better terms.",
                "rationale": "While safe, an elite operator negotiates for mutual fit instead of flat rejection.",
                "score": 60,
            },
            {
                "key": "C",
                "text": "Present a redlined counter-contract excluding official school athletic uniforms from the non-compete scope, capping the restriction to beverage products.",
                "impact": "Demonstrates professional executive posture, protects university compliance standing, and keeps the beverage cash flowing.",
                "rationale": "Perfect deal-making posture. This keeps you in play for your school equipment sponsor and still lands the HyperCharge beverage contract.",
                "score": 100,
            },
        ],
    },
    {
        "scenario": (
            "Your tracking metrics reveal severe sleep debt (averaging 5.4 hours) caused by exam "
            "weeks colliding with 5:30 AM pre-dawn training runs. National scouts visit your camp "
            "in 3 days and your energy is depleted. How do you adjust your schedule?"
        ),
        "guidelines": "Goal: Optimize cognition and muscle recovery while maintaining visibility with the scouting staff.",
        "options": [
            {
                "key": "A",
                "text": "Power through with high-caffeine supplements. Push harder; scouts want to see relentless stamina.",
                "impact": "Heart-rate spikes, nervous fatigue, elevated cortisol, and a real risk of cramps or poor reaction time during scout drills.",
                "rationale": "Pushing through physiological fatigue with stimulants produces a hollow performance and sharply increases injury risk.",
                "score": 40,
            },
            {
                "key": "B",
                "text": "Ask the coaching staff to swap pre-dawn runs for afternoon film sessions, using the mornings for recovery sleep.",
                "impact": "Restores central nervous system recovery and cognitive clarity for the scout drills while keeping playbook knowledge sharp.",
                "rationale": "Recovery is a performance weapon. Afternoon film keeps you visible and compliant while restoring physical output.",
                "score": 100,
            },
            {
                "key": "C",
                "text": "Skip training entirely without telling the staff, claiming sudden illness to guarantee rest.",
                "impact": "Restores physical state but craters trust with the scouting team and head coaches.",
                "rationale": "Uncoordinated absences signal unreliability, a major red flag for scouts evaluating culture fit.",
                "score": 25,
            },
        ],
    },
    {
        "scenario": (
            "An alumnus and business owner offers to fund your tech venture with $50,000, but "
            "requests 45% equity and a veto right over all subsequent funding rounds — before you "
            "have even launched an MVP. He says: \"Take it now, or you will find no other backing "
            "in this town.\" How do you proceed?"
        ),
        "guidelines": "Goal: Secure startup resources without surrendering future venture control or paralyzing the cap table.",
        "options": [
            {
                "key": "A",
                "text": "Accept immediately. $50k is crucial to build the product and start hiring.",
                "impact": "The venture is hyper-diluted and later investors reject the terms because of the alumni veto right.",
                "rationale": "Giving away 45% plus a veto right at pre-seed blocks all future financing agility and turns you into a subsidiary rather than a founder.",
                "score": 35,
            },
            {
                "key": "B",
                "text": "Decline the terms diplomatically and counter with a SAFE at a fair valuation cap, deferring the equity conversion to the next institutional round.",
                "impact": "Preserves cap-table health, keeps funding options open, and signals business maturity.",
                "rationale": "A SAFE keeps governance clean and aligns valuation with standard startup practice, blocking an early predatory takeover.",
                "score": 100,
            },
            {
                "key": "C",
                "text": "Decline and tell the alumnus his terms are predatory and that you will expose his practices across campus networks.",
                "impact": "Protects equity, but burns a powerful institutional bridge and creates toxic noise around your team.",
                "rationale": "Combative communication never yields long-term strategic leverage, even when you are right on the substance.",
                "score": 50,
            },
        ],
    },
    {
        "scenario": (
            "Bidding a major electrical upgrade for an industrial warehouse, a subcontractor submits "
            "a bid 40% below market average but mentions they operate under \"unregistered staff "
            "arrangements\". Winning guarantees high margins but exposes you to regulatory audits. "
            "What is your call?"
        ),
        "guidelines": "Goal: Secure commercial margins while maintaining licensing integrity and occupational safety compliance.",
        "options": [
            {
                "key": "A",
                "text": "Accept the low bid. It secures maximum short-term profit, and regulatory issues sit with the subcontractor.",
                "impact": "Very high immediate margin, but exposes your contractor license to suspension and potential safety liability under audit.",
                "rationale": "Using unregistered labour violates general contractor licensing covenants. Licence suspension far outweighs short-term bid profit.",
                "score": 35,
            },
            {
                "key": "B",
                "text": "Reject the bid outright and work only with premium contractors, even if it makes you uncompetitive locally.",
                "impact": "Maintains perfect compliance standing, but misses the chance to set vendor standards or negotiate conforming terms.",
                "rationale": "Safe, but an elite contractor manages risk proactively and communicates compliance standards rather than rejecting silently.",
                "score": 65,
            },
            {
                "key": "C",
                "text": "Formally request proof of workers' compensation insurance and current field certifications, countering with standard vendor compliance codes.",
                "impact": "Demonstrates professional posture, protects your licensing standing, and forces compliance while keeping the bid live.",
                "rationale": "Formalizing compliance requirements shields your firm from audits while keeping you commercially competitive.",
                "score": 100,
            },
        ],
    },
]

# Onboarding questionnaire used to recommend a pathway. Each option's "weights"
# dict maps a PATHWAY_DEFS "key" -> weight toward that pathway. Every pathway key
# must appear somewhere below, otherwise that pathway can only ever be
# recommended at score 0 (see onboarding/services.compute_pathway_recommendations,
# which ranks every published pathway and falls back to 0 for unweighted ones).
# A key that is NOT in PATHWAY_DEFS is worse than useless: `_seed_questionnaire`
# looks it up in pathways_by_key and a stale one aborts the seed with a KeyError.
#
# This was eight questions and forty-three options while the catalog carried
# fifteen demo pathways. Removing them left most answers pointing at nothing --
# "I'm a parent supporting my child's homeschool education" can no longer
# recommend anything -- so the dead options were dropped rather than left to
# recommend nothing, and the five questions that lost every answer went with
# them. What remains is the subset that genuinely separates the client's three
# athlete pathways. It is deliberately thin: this wants rewriting around the
# client's own segmentation once they send curriculum for the other audiences.
QUESTIONNAIRE = [
    {
        "text": "What best describes your current situation?",
        "options": [
            {"text": "I'm a competitive student-athlete balancing sports and school", "weights": {"mental_toughness": 2}},
            {"text": "I'm an athlete in the middle of the recruiting window (11th-12th grade)", "weights": {"recruiting_readiness": 3}},
            {"text": "I'm a college or pro-bound athlete managing NIL opportunities", "weights": {"athlete_ceo": 3}},
        ],
    },
    {
        "text": "What's your top academic goal right now?",
        "options": [
            {"text": "Balancing athletics with strong academics", "weights": {"mental_toughness": 1}},
            {"text": "Earning a college athletic offer", "weights": {"recruiting_readiness": 3}},
            {"text": "Maximizing NIL and business opportunities as an athlete", "weights": {"athlete_ceo": 3}},
        ],
    },
    {
        "text": "What matters most to you in a curriculum?",
        "options": [
            {"text": "A clear roadmap through recruiting and NIL decisions", "weights": {"recruiting_readiness": 2, "athlete_ceo": 2}},
            {"text": "Sharper judgement under pressure and uncertainty", "weights": {"mental_toughness": 2}},
        ],
    },
]


class Command(BaseCommand):
    help = (
        "Seeds the catalog: the canonical categories, teachers, students, 659 courses (the "
        "client's 30 Cool Nerds courses plus Numa's 629-course catalog from "
        "https://numaschool.com/curriculum, each with a downloaded provider-logo thumbnail, a "
        "random-but-deterministic price, 1-2 modules, 1-2 lessons per module, one assignment and "
        "one quiz), pathways, tiers, bundle pricing rules, the onboarding questionnaire, and the "
        "Daily Drill bank. "
        "ONLY the seeded pathways are deleted-and-rebuilt (see `_reset_pathway_catalog`); "
        "everything else is upserted by its natural key, so existing courses, user accounts, "
        "course enrollments, progress and students' own custom pathways all survive and this is "
        "safe to run against a server that already holds real data. "
        "Student-course enrollments are intentionally NOT seeded — enroll students manually "
        "(e.g. via the admin portal) after seeding. Safe to re-run — every run produces the same "
        "dataset, and media files already on disk are reused rather than re-downloaded. Pass "
        "--noinput to skip the confirmation prompt (e.g. for CI/deploy scripts) and --skip-assets "
        "to seed without network access."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--noinput",
            action="store_true",
            help="Skip the confirmation prompt and seed immediately.",
        )
        parser.add_argument(
            "--skip-assets",
            action="store_true",
            help=(
                "Don't download provider-logo thumbnails or lesson PDF/DOCX files. Use when the "
                "machine has no outbound network access — courses and lessons are seeded without "
                "media."
            ),
        )

    def handle(self, *args, **options):
        # Before anything is written, and before the prompt, so a broken catalog
        # is a one-line error rather than a half-finished seed.
        self._validate_course_defs()

        if not options["noinput"]:
            confirm = input(
                f"This DELETES the {Pathway.objects.filter(is_custom=False).count()} seeded "
                "pathway(s) and rebuilds them from PATHWAY_DEFS. That also drops those pathways' "
                "course lists, tier attachments and pathway purchases.\n"
                "PRESERVED: courses, categories, tags, user accounts, course enrollments, "
                "progress, daily drills, onboarding answers, and students' own custom pathways. "
                "Everything else is upserted, so re-running only adds or updates.\n"
                "The regular demo students will NOT be auto-enrolled in any course (only the demo "
                "reviewers are, so instructor feedback matches real enrollments).\n"
                "Type 'yes' to continue: "
            )
            if confirm.strip().lower() != "yes":
                self.stdout.write(self.style.WARNING("Aborted — no changes were made."))
                return

        # Assets are fetched BEFORE the transaction opens, so a dozen-plus network
        # round trips never hold a write transaction open, and an unreachable host
        # degrades to "seeded without that file" instead of rolling the seed back.
        assets = self._download_assets(skip=options["skip_assets"])

        with transaction.atomic():
            removed = self._reset_pathway_catalog()
            self.stdout.write(
                self.style.WARNING(
                    f"Removed {removed} seeded pathway(s) — everything else preserved"
                )
            )

            self._create_admin()
            self.stdout.write(self.style.SUCCESS("Ensured 1 admin"))

            teachers = [
                self._create_user(first, last, f"teacher{i}@example.com", User.Roles.TEACHER)
                for i, (first, last) in enumerate(TEACHER_NAMES, start=1)
            ]
            self.stdout.write(self.style.SUCCESS(f"Created {len(teachers)} teachers"))

            students = [
                self._create_user(first, last, f"student{i}@example.com", User.Roles.STUDENT)
                for i, (first, last) in enumerate(STUDENT_NAMES, start=1)
            ]
            self.stdout.write(self.style.SUCCESS(f"Created {len(students)} students"))

            reviewers = [
                self._create_user(first, last, f"reviewer{i}@example.com", User.Roles.STUDENT)
                for i, (first, last) in enumerate(REVIEWER_NAMES, start=1)
            ]
            self.stdout.write(self.style.SUCCESS(f"Created {len(reviewers)} demo reviewers"))

            # Wraps around when there are more courses than teachers, so adding a
            # course def never has to be paired with adding a teacher name.
            teachers_by_code = {
                course_def["code"]: teachers[index % len(teachers)]
                for index, course_def in enumerate(COURSE_DEFS)
            }

            categories = self._create_categories()
            self.stdout.write(self.style.SUCCESS(f"Ensured {len(categories)} categories"))

            courses_by_code = self._create_course_content(categories, teachers_by_code, assets)
            self.stdout.write(
                self.style.SUCCESS(f"Created {len(courses_by_code)} Cool Nerds courses")
            )

            pathways_by_key = self._seed_pathways(courses_by_code)
            self.stdout.write(self.style.SUCCESS(f"Created {len(pathways_by_key)} pathways"))

            tiers = self._create_tiers(categories, pathways_by_key)
            self.stdout.write(
                self.style.SUCCESS(f"Created {len(tiers)} tiers with their pathway attachments")
            )

            self._seed_bundle_rules()
            self.stdout.write(self.style.SUCCESS(f"Ensured {len(BUNDLE_RULES)} bundle pricing rule(s)"))

            self._seed_questionnaire(pathways_by_key)
            self.stdout.write(self.style.SUCCESS(f"Seeded {len(QUESTIONNAIRE)} onboarding questions"))

            self._seed_drills()
            self.stdout.write(self.style.SUCCESS(f"Seeded {len(DRILL_DEFS)} daily drill scenarios"))

            self._seed_instructor_profiles(teachers_by_code, assets["instructor_avatars"])
            feedback_count = self._seed_instructor_feedback(teachers, reviewers)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Filled {len(teachers)} instructor profiles with {feedback_count} student feedback entries"
                )
            )

        self.stdout.write(self.style.SUCCESS("Seed data completed successfully."))

    def _download_assets(self, skip=False):
        """Fetches every curriculum provider's logo, plus the one shared PDF/DOCX
        lesson file, into media storage ONCE and returns the stored paths.
        Thumbnails are keyed by provider name for `_create_course_content` to
        assign as each of that provider's courses' thumbnail. A provider with no
        logo on file (None in PROVIDER_THUMBNAILS) or a failed download is
        simply absent from the result, and its courses are seeded without a
        thumbnail; a failed lesson-asset download leaves the affected lessons
        without a file."""
        assets = {"provider_thumbnails": {}, "lessons": {}, "instructor_avatars": []}

        if skip:
            self.stdout.write(
                self.style.WARNING("--skip-assets: seeding without thumbnails or lesson files")
            )
            return assets

        for name, url in LESSON_ASSET_URLS.items():
            path = self._store_asset(LESSON_ASSET_PATHS[name], url)
            if path:
                assets["lessons"][name] = path

        for provider, url in PROVIDER_THUMBNAILS.items():
            if not url:
                continue
            ext = url.split("?")[0].rsplit(".", 1)[-1].lower()
            ext = ext if ext in ("png", "jpg", "jpeg", "webp") else "jpg"
            path = self._store_asset(f"course_thumbnails/provider-{slugify(provider)}.{ext}", url)
            if path:
                assets["provider_thumbnails"][provider] = path

        for image_id in INSTRUCTOR_AVATAR_IDS:
            path = self._store_asset(
                f"avatars/seed-instructor-{image_id}.jpg",
                INSTRUCTOR_AVATAR_URL.format(image_id=image_id),
            )
            if path:
                assets["instructor_avatars"].append(path)

        self.stdout.write(
            self.style.SUCCESS(
                f"Prepared {len(assets['instructor_avatars'])} instructor photo(s), "
                f"{len(assets['lessons'])} lesson file(s) and "
                f"{len(assets['provider_thumbnails'])} provider thumbnail(s) in media storage"
            )
        )
        return assets

    def _store_asset(self, path, url):
        """Downloads `url` to MEDIA_ROOT/<path> once and returns the stored name to
        assign to a FileField/ImageField. A file already on disk is reused, so
        re-seeding neither re-downloads nor accumulates suffixed duplicates the way
        an unconditional `default_storage.save` would (`seed-python101_a1b2c3.jpg`).
        Returns None on any failure — a missing demo file must not abort the seed."""
        if default_storage.exists(path):
            return path

        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            self.stdout.write(self.style.WARNING(f"Could not download {url} ({exc}) — skipping."))
            return None

        return default_storage.save(path, ContentFile(response.content))

    def _validate_course_defs(self):
        """Fails fast on the two ways the merged catalog could corrupt itself.

        Both are nasty at runtime rather than obvious: a duplicate code makes
        `get_or_create` hand back the wrong course and silently merge two
        entries, and a duplicate slug raises an IntegrityError deep inside the
        seed, after other rows have been written.
        """
        for label, values in (
            ("code", [cd["code"] for cd in COURSE_DEFS]),
            ("slug", [build_course_slug(cd) for cd in COURSE_DEFS]),
        ):
            duplicates = sorted(v for v, n in Counter(values).items() if n > 1)
            if duplicates:
                raise CommandError(
                    f"COURSE_DEFS has {len(duplicates)} duplicate course {label}(s): "
                    + ", ".join(duplicates[:5])
                    + ("..." if len(duplicates) > 5 else "")
                )

    def _reset_pathway_catalog(self):
        """Deletes the seeded pathways so PATHWAY_DEFS can rebuild them.

        Deliberately narrow — this command used to wipe every row except the
        admin, which made it unusable against a server holding real data.
        Courses, categories, tags, user accounts, course enrollments, progress,
        daily drills and onboarding answers are all left alone now; everything
        the command seeds is upserted by its natural key, so only the pathways
        themselves need clearing to be rebuilt from scratch.

        Deleted by cascade along with the pathways:
          - PathwayCourse — which courses each pathway bundles;
          - TierPathway — the Tier rows survive and `_create_tiers` re-attaches;
          - PathwayEnrollment for those pathways;
          - QuestionOptionPathwayWeight pointing at them, which
            `_seed_questionnaire` then re-creates against the new rows.

        A PathwayEnrollment is the record of a *pathway* purchase. The course
        Enrollments that purchase granted are separate rows and are NOT touched,
        so a student who bought a pathway keeps access to every course in it.

        Students' own custom pathways (`is_custom`) are excluded: they are not
        part of the seeded catalog, and deleting one would destroy a bundle a
        student built and may have paid for.
        """
        seeded = Pathway.objects.filter(is_custom=False)
        removed = seeded.count()
        seeded.delete()
        return removed

    def _create_admin(self):
        user, created = User.objects.get_or_create(
            email=ADMIN_DATA["email"],
            defaults={
                "username": ADMIN_DATA["email"],
                "first_name": ADMIN_DATA["first_name"],
                "last_name": ADMIN_DATA["last_name"],
                "gender": User.Gender.OTHER,
                "role": User.Roles.ADMIN,
                "is_verified": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            user.set_password("Password@123")
            user.save(update_fields=["password"])
        return user

    def _create_user(self, first_name, last_name, email, role):
        # Matched on email, so a re-seed reuses the existing account rather than
        # creating a second one. DEFAULT_PASSWORD is only set when the account is
        # first created: now that `_reset_pathway_catalog` leaves users alone, a
        # seed must not reset the password of someone already using the system.
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "first_name": first_name,
                "last_name": last_name,
                "gender": User.Gender.OTHER,
                "role": role,
                "is_verified": True,
            },
        )
        if created:
            user.set_password(DEFAULT_PASSWORD)
            user.save(update_fields=["password"])
        return user

    def _create_categories(self):
        categories = {name: Category.objects.get_or_create(name=name)[0] for name in CATEGORY_NAMES}

        # Guards against a new course or tier def quietly reintroducing a seventh
        # category and re-splitting the vocabulary courses.0004 consolidated.
        referenced = {course_def["category"] for course_def in COURSE_DEFS}
        referenced |= {tier_def["category"] for tier_def in TIER_DEFS}
        unknown = sorted(referenced - set(categories))
        if unknown:
            raise CommandError(
                "Seed definitions reference categories that are not in CATEGORY_NAMES: "
                + ", ".join(unknown)
            )

        return categories

    def _create_course_content(self, categories, teachers_by_code, assets):
        """Creates one Course row per COURSE_DEFS entry — Numa's real catalog title,
        provider, subject, and grade data — plus a small amount of platform content
        so every course is actually usable in the LMS: a random-but-deterministic
        price, 1-2 modules, 1-2 lessons per module, one assignment, and one quiz.
        None of that generated content is real curriculum material (Numa's catalog
        doesn't expose any), so the quiz is grounded in the course's own real
        metadata (subject/provider/grade) rather than inventing subject-matter
        questions."""
        courses_by_code = {}
        tag_cache = {}
        # One shared seed, consumed in COURSE_DEFS order, so a reseed reproduces the
        # exact same amounts/module counts/quiz distractors every time (see
        # SEED_RNG_SEED).
        rng = random.Random(SEED_RNG_SEED)

        def get_tag(name):
            if name not in tag_cache:
                tag_cache[name] = Tag.objects.get_or_create(name=name)[0]
            return tag_cache[name]

        for course_def in COURSE_DEFS:
            thumbnail = assets["provider_thumbnails"].get(course_def["provider"]) or ""
            course, created = Course.objects.get_or_create(
                code=course_def["code"],
                defaults={
                    "title": course_def["title"],
                    "slug": build_course_slug(course_def),
                    "description": course_def["description"],
                    "category": categories[course_def["category"]],
                    "thumbnail": thumbnail,
                    "status": Status.PUBLISHED,
                    "difficulty": course_def["difficulty"],
                    "amount": rng.choice(COURSE_AMOUNT_CHOICES),
                    "learning_outcomes": build_learning_outcomes(course_def),
                },
            )
            courses_by_code[course_def["code"]] = course

            # Existing catalog content may have been edited or purchased. Only
            # generate demo content for newly created courses.
            if not created:
                continue

            teacher = teachers_by_code[course_def["code"]]
            CourseInstructor.objects.update_or_create(
                course=course, instructor=teacher, defaults={"is_lead": True}
            )

            course.tags.set(get_tag(name) for name in course_def["tags"])

            modules = self._create_modules(course, course_def, rng, assets["lessons"])
            self._create_assignment(modules[0], course, course_def, teacher)
            self._create_quiz(modules[0], course, course_def, rng)

        return courses_by_code

    def _create_modules(self, course, course_def, rng, lesson_assets):
        num_modules = rng.randint(1, 2)
        modules = []
        for module_order, module_def in enumerate(MODULE_DEFS[:num_modules], start=1):
            module, _ = Module.objects.get_or_create(
                course=course,
                title=module_def["title"],
                defaults={
                    "description": module_def["description"].format(title=course.title),
                    "order": module_order,
                },
            )
            modules.append(module)

            num_lessons = rng.randint(1, 2)
            # Sampled WITHOUT replacement — Lesson.title is f"{module_title} — {label}",
            # so two lessons landing on the same content_type would collide on
            # get_or_create(module, title) and silently collapse into one row instead
            # of the intended num_lessons.
            content_types = rng.sample(LESSON_TYPE_CYCLE, num_lessons)
            for lesson_order, content_type in enumerate(content_types, start=1):
                self._create_lesson(module, module_def["title"], content_type, lesson_order, lesson_assets)

        return modules

    def _create_lesson(self, module, module_title, content_type, order, lesson_assets):
        label = LESSON_TYPE_LABELS[content_type]
        spec = LESSON_TYPE_CONTENT[content_type]
        Lesson.objects.get_or_create(
            module=module,
            title=f"{module_title} — {label}",
            defaults={
                "description": f"{label} for {module_title}.",
                "content_type": content_type,
                "content_data": spec["content_data"],
                "video_url": spec["video_url"],
                # VIDEO lessons carry a video_url instead, so `asset` is None there.
                "file": lesson_assets.get(spec["asset"]) or "",
                "duration_minutes": spec["duration_minutes"],
                "order": order,
            },
        )

    def _create_assignment(self, module, course, course_def, teacher):
        Assignment.objects.get_or_create(
            module=module,
            title=f"{course.title} Assignment",
            defaults={
                "course": course,
                "description": (
                    f"Complete the exercises for {course.title} "
                    f"({course_def['subject']}, Grades {course_def['grade_label']})."
                ),
                "due_date": timezone.now() + timedelta(days=14),
                "total_marks": 100,
                "status": Status.PUBLISHED,
                "grading_mode": Assignment.GradingMode.MANUAL,
                "allow_resubmission": True,
                "order": get_next_order(Assignment.objects.filter(module=module)),
                "created_by": teacher,
            },
        )

    def _create_quiz(self, module, course, course_def, rng):
        # The seed has no real lesson prose to quiz over, so instead of fabricating
        # subject-matter questions each one checks something true about the course
        # itself, and every wrong answer is another real value from COURSE_DEFS
        # rather than something invented.
        #
        # A question is only usable if its pool holds four distinct values — one
        # right answer and three distractors. That was free against a 629-course,
        # 30-provider catalog, but the catalog is now thirty first-party courses
        # and "Cool Nerds" is the only publisher, so the provider question can no
        # longer be asked: its pool is a single value, which would render as one
        # choice that is also the answer. CANDIDATES is therefore filtered rather
        # than trimmed by hand, so this keeps working if the catalog grows a second
        # provider or shrinks to one subject.
        # `subject` is a pathway level for a Cool Nerds course ("Level 2:
        # Business Operations...") but a school subject for a Numa one
        # ("English Language Arts"), so the question is worded from whichever
        # it is. Only Cool Nerds defs carry a `focus`, so that question is
        # offered only when there is one to ask about.
        candidates = [
            (
                f'Which level of its pathway does "{course.title}" belong to?'
                if course_def.get("pathway")
                else f'Which subject does "{course.title}" belong to?',
                course_def["subject"],
                ALL_SUBJECTS,
            ),
            (
                f'Which curriculum provider publishes "{course.title}"?',
                course_def["provider"],
                ALL_PROVIDERS,
            ),
            (
                f'What grade level is "{course.title}" recommended for?',
                f"Grades {course_def['grade_label']}",
                [f"Grades {g}" for g in ALL_GRADE_LABELS],
            ),
        ]
        if course_def.get("focus"):
            candidates.append(
                (
                    f'What is the focus of "{course.title}"?',
                    course_def["focus"],
                    ALL_FOCUSES,
                )
            )
        questions = [
            (text, correct, pool)
            for text, correct, pool in candidates
            if len({value for value in pool if value != correct}) >= CHOICES_PER_QUESTION - 1
        ]

        quiz, _ = Quiz.objects.get_or_create(
            module=module,
            title=f"{course.title} — Quiz",
            defaults={
                "course": course,
                "description": f"Quick knowledge check on {course.title}.",
                "passing_score": 70,
                "time_limit_minutes": 15,
                "number_of_questions": len(questions),
                "status": Status.PUBLISHED,
                "order": get_next_order(Quiz.objects.filter(module=module)),
            },
        )

        for order, (text, correct_answer, pool) in enumerate(questions, start=1):
            question, _ = QuizQuestion.objects.get_or_create(
                quiz=quiz,
                text=text,
                defaults={
                    "question_type": QuizQuestion.QuestionType.MCQ,
                    "marks": 1,
                    "order": order,
                },
            )
            distractor_pool = sorted({value for value in pool if value != correct_answer})
            distractors = rng.sample(distractor_pool, CHOICES_PER_QUESTION - 1)
            options = [correct_answer] + distractors
            # `options[0]` is always the correct answer before rotation, and Choice has
            # no Meta.ordering — inserting them as written would put the right answer
            # first in every question. Rotating by the question's order spreads it
            # across all four positions and stays deterministic, so re-seeding
            # reproduces the same quiz.
            rotation = order % len(options)
            for option_text in options[rotation:] + options[:rotation]:
                Choice.objects.get_or_create(
                    question=question,
                    text=option_text,
                    defaults={"is_correct": option_text == correct_answer},
                )
        return quiz

    def _seed_pathways(self, courses_by_code):
        pathways_by_key = {}
        for pathway_def in PATHWAY_DEFS:
            pathway, created = Pathway.objects.update_or_create(
                name=pathway_def["name"],
                is_custom=False,
                defaults={
                    "summary": pathway_def["summary"],
                    "description": pathway_def["description"],
                    "status": Status.PUBLISHED,
                    "base_price": pathway_def["base_price"],
                },
            )
            pathways_by_key[pathway_def["key"]] = pathway
            # Only on first creation: re-seeding must not undo an admin's
            # later audience edits.
            if created:
                pathway.audiences.set(
                    Audience.objects.filter(
                        slug__in=DEFAULT_PATHWAY_AUDIENCES.get(pathway.name, [])
                    )
                )
            for code in pathway_def["course_codes"]:
                course = courses_by_code.get(code)
                if not course:
                    continue
                # Appended at the next free order rather than at the list
                # index: on a re-seed the pathway's existing courses may have
                # been reordered in the admin, and a fixed index would collide
                # with the (pathway, order) unique constraint.
                PathwayCourse.objects.get_or_create(
                    pathway=pathway,
                    course=course,
                    defaults={
                        "order": get_next_order(
                            PathwayCourse.objects.filter(pathway=pathway)
                        )
                    },
                )
        return pathways_by_key

    def _create_tiers(self, categories, pathways_by_key):
        tiers = []
        for tier_def in TIER_DEFS:
            tier, _ = Tier.objects.update_or_create(
                level=tier_def["level"],
                defaults={
                    "name": tier_def["name"],
                    "audience": tier_def["audience"],
                    "focus_description": tier_def["focus_description"],
                    "status": Status.PUBLISHED,
                    "category": categories[tier_def["category"]],
                    "estimated_duration": tier_def["estimated_duration"],
                },
            )
            tiers.append(tier)

            # Append after any preserved custom-pathway attachments so their
            # existing per-tier order values cannot collide with the new links.
            for pathway_key in tier_def["pathway_keys"]:
                TierPathway.objects.update_or_create(
                    tier=tier, pathway=pathways_by_key[pathway_key],
                    defaults={"order": get_next_order(TierPathway.objects.filter(tier=tier))}
                )
        return tiers

    def _seed_bundle_rules(self):
        for rule in BUNDLE_RULES:
            PathwayBundleRule.objects.update_or_create(
                pathway_count=rule["pathway_count"],
                defaults={"discount_percent": rule["discount_percent"]},
            )

    def _seed_questionnaire(self, pathways_by_key):
        """Upserts the onboarding questions, their options and pathway weights.

        Updated in place rather than deleted and recreated: students' existing
        QuestionnaireAnswers point at these option rows, so recreating them
        would wipe everyone's onboarding history on every seed. The weights are
        gone by then regardless — `_reset_pathway_catalog` cascades them away
        with the pathways they pointed at — so they are written fresh here.
        """
        for order, question_def in enumerate(QUESTIONNAIRE, start=1):
            question, _ = OnboardingQuestion.objects.get_or_create(
                text=question_def["text"], defaults={"order": order}
            )
            for index, option_def in enumerate(question_def["options"], start=1):
                option, _ = QuestionOption.objects.update_or_create(
                    question=question, text=option_def["text"], defaults={"order": index}
                )
                for pathway_key, weight in option_def["weights"].items():
                    QuestionOptionPathwayWeight.objects.update_or_create(
                        option=option,
                        pathway=pathways_by_key[pathway_key],
                        defaults={"weight": weight},
                    )

    def _seed_instructor_profiles(self, teachers_by_code, avatars=()):
        """Public instructor details (bio, headline, skills, photo) for every teacher
        that teaches at least one seeded course. `avatars` are stored image paths,
        handed out in order (wrapping around). Safe to re-run: it updates in place."""
        grouped = {}
        for course_def in COURSE_DEFS:
            teacher = teachers_by_code.get(course_def["code"])
            if teacher:
                grouped.setdefault(teacher.pk, (teacher, []))[1].append(course_def)

        for index, (teacher, course_defs) in enumerate(
            sorted(grouped.values(), key=lambda item: item[0].email)
        ):
            details = build_instructor_profile(teacher.first_name, course_defs, index)
            profile_defaults = {"bio": details["bio"]}
            if avatars:
                profile_defaults["avatar"] = avatars[index % len(avatars)]
            UserProfile.objects.update_or_create(user=teacher, defaults=profile_defaults)
            InstructorProfile.objects.update_or_create(
                user=teacher,
                defaults={"headline": details["headline"], "skills": details["skills"]},
            )

    def _seed_instructor_feedback(self, teachers, reviewers):
        """A few reviews per instructor from demo reviewers, each enrolled in one of
        that instructor's first two courses. Deterministic and safe to re-run."""
        if not reviewers:
            return 0

        rng = random.Random(SEED_RNG_SEED + 1)
        now = timezone.now()
        created = 0

        for teacher_index, teacher in enumerate(teachers):
            taught = list(
                Course.objects.filter(instructors__instructor=teacher, status=Status.PUBLISHED)
                .order_by("code")
                .distinct()[:2]
            )
            if not taught:
                continue

            reviews = rng.sample(INSTRUCTOR_FEEDBACK_POOL, FEEDBACK_REVIEWS_PER_INSTRUCTOR)
            for offset, (rating, comment) in enumerate(reviews):
                reviewer = reviewers[
                    (teacher_index * FEEDBACK_REVIEWS_PER_INSTRUCTOR + offset) % len(reviewers)
                ]
                course = taught[offset % len(taught)]
                Enrollment.objects.get_or_create(
                    student=reviewer, course=course, defaults={"teacher": teacher}
                )
                feedback, _ = InstructorFeedback.objects.update_or_create(
                    instructor=teacher,
                    student=reviewer,
                    course=course,
                    defaults={"rating": rating, "comment": comment},
                )
                # created_at is auto_now_add, so spread the dates with an update.
                InstructorFeedback.objects.filter(pk=feedback.pk).update(
                    created_at=now - timedelta(days=rng.randint(3, 150), hours=rng.randint(0, 23))
                )
                created += 1

        return created

    def _seed_drills(self):
        for drill_def in DRILL_DEFS:
            question, _ = DrillQuestion.objects.get_or_create(
                scenario=drill_def["scenario"],
                defaults={"guidelines": drill_def["guidelines"], "status": Status.PUBLISHED},
            )
            for option_def in drill_def["options"]:
                DrillOption.objects.update_or_create(
                    question=question,
                    key=option_def["key"],
                    defaults={
                        "text": option_def["text"],
                        "impact": option_def["impact"],
                        "rationale": option_def["rationale"],
                        "score": option_def["score"],
                    },
                )
