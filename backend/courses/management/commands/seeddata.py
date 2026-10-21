import random
from collections import Counter
from datetime import timedelta
from io import BytesIO
from statistics import mean

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from assignments.models import Assignment
from carts.models import CartItem
from common.models import Status
from common.ordering import get_next_order
from courses.models import Category, Course, CourseInstructor, Tag
from daily_drill.models import DrillOption, DrillQuestion
from enrollments.models import Enrollment, EnrollmentHistory
from future_clients.models import FutureClientApplication
from instructors.models import InstructorFeedback, InstructorProfile
from lessons.models import Lesson
from modules.models import Module
from onboarding.models import OnboardingProgress
from onboarding.models import Question as OnboardingQuestion
from onboarding.models import QuestionOption, QuestionOptionPathwayWeight
from pathways.audience_defaults import DEFAULT_PATHWAY_AUDIENCES
from pathways.models import (
    Audience,
    Pathway,
    PathwayBundleRule,
    PathwayCourse,
    PathwayEnrollment,
)
from progress.models import CourseProgress, LearningActivity, LessonProgress, ModuleProgress

from live_sessions.models import LiveSession, SessionSpeaker
from quests.models import Quest
from quizzes.models import Choice
from quizzes.models import Question as QuizQuestion
from quizzes.models import Quiz
from tiers.models import Tier, TierPathway, TierProgress
from rewards.models import PointsTransaction
from rewards.services import award_points
from users.models import UserProfile
from wargamer.models import RolePlayScenario, RolePlaySession, RolePlayTurn

from ._course_content import COURSE_CONTENT
from ._handouts import PDF_AVAILABLE, build_handout_docx, build_handout_pdf
from ._retired_courses import RETIRED_COURSE_CODES

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


# Pathways whose reader is not the student the grade label describes. A parent
# taking PAR-107 or a coach taking COH-301 is not "in Grades 9-12"; the label on
# those courses says which years of an athlete's career the material covers, so
# the "What you'll learn" line is worded for them rather than reading as a
# mistake on the course page. Keyed by pathway name because `grade_label`
# itself is shared with the student-facing courses and carries no reader.
ADULT_READER_PATHWAYS = {
    "The Parent Pathway",
    "The Coaching Pathway",
}


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
        if course_def.get("pathway") in ADULT_READER_PATHWAYS:
            outcomes.append(f"Covers the Grades {grade_label} years of an athlete's career")
        else:
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

# The two titles `_create_modules` generates. A course that has since been given
# hand-authored curriculum in `_course_content` keeps none of them: they are the
# placeholder shell that content replaces (`_replace_generated_modules`), so this
# set is what that delete is keyed on. Deleting by an explicit title list, rather
# than "every module that isn't authored", is the same rule `_reset_catalog`
# follows for the retired courses — a module an admin added by hand is not in the
# authored list either and must survive.
GENERATED_MODULE_TITLES = [module_def["title"] for module_def in MODULE_DEFS]

# Lesson content types a `_course_content` lesson may declare. TEXT lessons carry
# their prose in `content_data` and no file; the other two carry the module's own
# generated handout (see below) and use `content_data` for its summary.
AUTHORED_LESSON_TYPES = (
    Lesson.ContentType.TEXT,
    Lesson.ContentType.PDF,
    Lesson.ContentType.DOCUMENT,
)
AUTHORED_HANDOUT_TYPES = (Lesson.ContentType.PDF, Lesson.ContentType.DOCUMENT)

# Where a generated handout is stored, and the extension per content type. These
# are written fresh on every seed rather than reused like a downloaded asset,
# because the handout is rendered from `_course_content` and has to change when
# the file that authored it does.
HANDOUT_DIR = "lessons/handouts"
HANDOUT_EXTENSIONS = {Lesson.ContentType.PDF: "pdf", Lesson.ContentType.DOCUMENT: "docx"}


def handout_path(code, module_order, content_type):
    """Deterministic storage path, so a reseed overwrites rather than piling up
    `…-module-1_a1b2c3.pdf` copies beside the one the lesson points at."""
    return (
        f"{HANDOUT_DIR}/{slugify(code)}-module-{module_order}."
        f"{HANDOUT_EXTENSIONS[content_type]}"
    )

# Random but deterministic course price, in whole-dollar steps.
COURSE_AMOUNT_CHOICES = list(range(20, 300, 10))

# Provider logo, keyed by provider name, downloaded once into
# MEDIA_ROOT/course_thumbnails/ and shared by every course from that provider.
# Cool Nerds is the only provider in COURSE_DEFS and has no logo on file, so this
# is intentionally a single None entry: `_download_assets` skips a provider whose
# URL is None and its courses seed without a thumbnail (the frontend falls back to
# its own placeholder). The 30 Numa provider logos that used to live here went with
# the catalog they belonged to. Add a hosted URL here to give the Cool Nerds
# courses real artwork.
PROVIDER_THUMBNAILS = {
    "Cool Nerds": None,
}

# Cool Nerds' own curriculum, and the whole catalog: every course from the
# client's "Courses We need to add" sheet. The 629-course Numa demo catalog that
# used to live here was removed at the client's request, so every course below is
# first-party and `provider` is always Cool Nerds. There is no provider logo to
# download, so these seed without a thumbnail (see `_download_assets`). The codes
# of the retired Numa courses live in `_retired_courses.py`, which `_reset_catalog`
# reads to delete them from an environment that still has them.
#
# The sheet arrived in two deliveries and is now transcribed in full: the three
# athlete pathways first (CEO/REC/MT, 30 courses), then the remaining six
# (BM/LS/PAR/STU/ENT/COH, 190 courses). They are grouped below by pathway, in
# sheet order within each, which is also the order PATHWAY_DEFS lists their
# codes. The later six widen the catalog past the athlete: the Parent, Cool
# Nerds, Entrepreneur and Coaching pathways are written for readers who are not
# the athlete at all, which is what finally gives the homepage's six audience
# cards something of their own to lead to (`pathways/audience_defaults.py`).
#
# `title` carries the sheet's course code ("CEO-101: ...") because that is how the
# client refers to them and how they sort inside a pathway, and `subject` carries
# the sheet's full Level label from column A ("Level 2: Business Operations,
# Branding & Compliance"). `grade_label` is its school-year hint -- the sheet
# spells the years out for Recruiting only, so everything else runs 9-12. On a
# parent or coach course that label describes the athlete the material is about,
# not the person taking it; the sheet gives no reader-age hint for those and
# inventing one would read as fact.
#
# Those two are not just labelling. `_create_quiz` builds each question's wrong
# answers from the other real values in this list, so a single-provider catalog
# with one level and one grade label would leave it nothing to choose from. The
# levels (now 31 distinct labels) and four grade labels keep those questions
# answerable, and `focus` (unique per course) backs a third. `provider` is left
# as the one value it honestly has; _create_quiz drops any question it cannot
# fill with four options.
# `pathway` and `core` feed the course page's "What you'll learn" list.
COURSE_DEFS = [
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

    # The Branding & Marketing Pathway
    {"code": "BM-101", "title": "BM-101: The Digital Footprint & Reputation Audit", "category": "Professional", "description": "Cleaning up the past to prepare for the future.\n\nCore competencies: Conducting a deep-clean of existing social media, understanding the permanence of digital actions, and identifying what college coaches look for (and flag) during recruiting sweeps.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Digital Architecture · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Digital Architecture", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Cleaning up the past to prepare for the future.", "core": "Conducting a deep-clean of existing social media, understanding the permanence of digital actions, and identifying what college coaches look for (and flag) during recruiting sweeps.", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 1: Digital Architecture"]},
    {"code": "BM-102", "title": "BM-102: Brand Identity & Core Values", "category": "Professional", "description": "Discovering what the athlete represents beyond their sport.\n\nCore competencies: Defining personal pillars (e.g., family, academics, community service, faith), creating a personal mission statement, and ensuring digital content aligns with those values.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Digital Architecture · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Digital Architecture", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Discovering what the athlete represents beyond their sport.", "core": "Defining personal pillars (e.g., family, academics, community service, faith), creating a personal mission statement, and ensuring digital content aligns with those values.", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 1: Digital Architecture"]},
    {"code": "BM-103", "title": "BM-103: Privacy, Security & Digital Boundaries", "category": "Professional", "description": "Protecting the athlete's peace of mind and physical safety.\n\nCore competencies: Managing direct messages, recognizing digital extortion/scams, establishing private vs. public accounts, and dealing with online harassment or fan toxicity.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Digital Architecture · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Digital Architecture", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Protecting the athlete's peace of mind and physical safety.", "core": "Managing direct messages, recognizing digital extortion/scams, establishing private vs. public accounts, and dealing with online harassment or fan toxicity.", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 1: Digital Architecture"]},
    {"code": "BM-201", "title": "BM-201: Storytelling & The Athlete Narrative", "category": "Professional", "description": "Moving from random posts to a cohesive storyline.\n\nCore competencies: The \"Hero's Journey\" applied to sports, documenting the process (training, studying, recovering) rather than just the highlights, and writing compelling captions.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Content Strategy & Community (Growing the Asset) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Content Strategy & Community (Growing the Asset)", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Moving from random posts to a cohesive storyline.", "core": "The \"Hero's Journey\" applied to sports, documenting the process (training, studying, recovering) rather than just the highlights, and writing compelling captions.", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 2: Content Strategy & Community (Growing the Asset)"]},
    {"code": "BM-202", "title": "BM-202: Platform Mechanics & The Algorithm", "category": "Professional", "description": "Understanding how different platforms distribute content.\n\nCore competencies: The distinct purposes of Instagram (visual portfolio), TikTok (reach and personality), X/Twitter (recruiting and networking), and LinkedIn (B2B and post-sports career).\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Content Strategy & Community (Growing the Asset) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Content Strategy & Community (Growing the Asset)", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Understanding how different platforms distribute content.", "core": "The distinct purposes of Instagram (visual portfolio), TikTok (reach and personality), X/Twitter (recruiting and networking), and LinkedIn (B2B and post-sports career).", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 2: Content Strategy & Community (Growing the Asset)"]},
    {"code": "BM-203", "title": "BM-203: Basic Media Production (Phone to Feed)", "category": "Professional", "description": "Creating high-quality assets without a production budget.\n\nCore competencies: Lighting basics, audio clarity, using free mobile editing software (like CapCut), and understanding safe zones for vertical video.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Content Strategy & Community (Growing the Asset) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Content Strategy & Community (Growing the Asset)", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Creating high-quality assets without a production budget.", "core": "Lighting basics, audio clarity, using free mobile editing software (like CapCut), and understanding safe zones for vertical video.", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 2: Content Strategy & Community (Growing the Asset)"]},
    {"code": "BM-204", "title": "BM-204: Community Engagement & Networking", "category": "Professional", "description": "Turning passive followers into an active community.\n\nCore competencies: Replying to comments strategically, collaborating with other local athletes, and using social media to champion teammates and local causes.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Content Strategy & Community (Growing the Asset) · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Content Strategy & Community (Growing the Asset)", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Turning passive followers into an active community.", "core": "Replying to comments strategically, collaborating with other local athletes, and using social media to champion teammates and local causes.", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 2: Content Strategy & Community (Growing the Asset)"]},
    {"code": "BM-301", "title": "BM-301: The Pitch - Marketing to Local Businesses", "category": "Professional", "description": "Translating a digital following into real-world value for sponsors.\n\nCore competencies: Identifying local businesses that align with the athlete's values, calculating engagement rates over raw follower counts, and creating a 1-page digital media kit.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Monetization & Public Relations (The Executive Tier) · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Monetization & Public Relations (The Executive Tier)", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Translating a digital following into real-world value for sponsors.", "core": "Identifying local businesses that align with the athlete's values, calculating engagement rates over raw follower counts, and creating a 1-page digital media kit.", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 3: Monetization & Public Relations (The Executive Tier)"]},
    {"code": "BM-302", "title": "BM-302: Media Training & Interview Mastery", "category": "Professional", "description": "Controlling the narrative when the microphone is on.\n\nCore competencies: The \"Bridging\" technique (steering a reporter's question back to the athlete's main talking points), mastering the post-game interview, and speaking on podcasts.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Monetization & Public Relations (The Executive Tier) · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Monetization & Public Relations (The Executive Tier)", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Controlling the narrative when the microphone is on.", "core": "The \"Bridging\" technique (steering a reporter's question back to the athlete's main talking points), mastering the post-game interview, and speaking on podcasts.", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 3: Monetization & Public Relations (The Executive Tier)"]},
    {"code": "BM-303", "title": "BM-303: The Capstone - Crisis Management & Long-Term Equity", "category": "Professional", "description": "Protecting the brand asset over a lifetime.\n\nCore competencies: Formulating a response to a bad game, a viral mistake, or an injury; understanding trademark basics for catchphrases or logos; and transitioning a sports brand into a professional business brand.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Monetization & Public Relations (The Executive Tier) · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Monetization & Public Relations (The Executive Tier)", "grade_label": "9–12", "pathway": "The Branding & Marketing Pathway", "focus": "Protecting the brand asset over a lifetime.", "core": "Formulating a response to a bad game, a viral mistake, or an injury; understanding trademark basics for catchphrases or logos; and transitioning a sports brand into a professional business brand.", "tags": ["Cool Nerds", "The Branding & Marketing Pathway", "Level 3: Monetization & Public Relations (The Executive Tier)"]},

    # The Athlete Life Skills & Transition Pathway
    {"code": "LS-101", "title": "LS-101: Time Management & Energy Optimization", "category": "Vocational", "description": "Mastering schedule control to balance academic, athletic, and personal demands without burnout.\n\nCore competencies: Calendar blocking, distinguishing urgent vs. important, travel-time optimization, and sleep scheduling.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Core Fundamentals · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Core Fundamentals", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Mastering schedule control to balance academic, athletic, and personal demands without burnout.", "core": "Calendar blocking, distinguishing urgent vs. important, travel-time optimization, and sleep scheduling.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 1: Core Fundamentals"]},
    {"code": "LS-102", "title": "LS-102: Life On and Off the Court", "category": "Vocational", "description": "Maintaining a healthy dual-identity without letting on-court performance dictate off-court self-worth.\n\nCore competencies: Boundary setting, emotional regulation, separating personal identity from athletic outcomes, and stress management.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Core Fundamentals · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Core Fundamentals", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Maintaining a healthy dual-identity without letting on-court performance dictate off-court self-worth.", "core": "Boundary setting, emotional regulation, separating personal identity from athletic outcomes, and stress management.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 1: Core Fundamentals"]},
    {"code": "LS-103", "title": "LS-103: Applied Critical Thinking for Athletes", "category": "Vocational", "description": "Making high-stakes, rapid decisions with long-term consequences in mind.\n\nCore competencies: Second-order consequence mapping, avoiding cognitive biases, evaluating sources of advice, and problem-solving under pressure.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Core Fundamentals · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Core Fundamentals", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Making high-stakes, rapid decisions with long-term consequences in mind.", "core": "Second-order consequence mapping, avoiding cognitive biases, evaluating sources of advice, and problem-solving under pressure.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 1: Core Fundamentals"]},
    {"code": "LS-104", "title": "LS-104: The Standard of a Professional", "category": "Vocational", "description": "Defining what it means to be a professional in sports and business.\n\nCore competencies: Accountability, punctuality, respecting organizational hierarchies, emotional control in professional settings, operating with integrity.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Core Fundamentals · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Core Fundamentals", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Defining what it means to be a professional in sports and business.", "core": "Accountability, punctuality, respecting organizational hierarchies, emotional control in professional settings, operating with integrity.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 1: Core Fundamentals"]},
    {"code": "LS-201", "title": "LS-201: Financial Literacy Basics", "category": "Vocational", "description": "Understanding cash flow, budgeting, and the true cost of lifestyle inflation.\n\nCore competencies: Reading a paystub/1099, budgeting 101, understanding tax brackets, and basic bank account management.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Wealth & Network Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Wealth & Network Architecture", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Understanding cash flow, budgeting, and the true cost of lifestyle inflation.", "core": "Reading a paystub/1099, budgeting 101, understanding tax brackets, and basic bank account management.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 2: Wealth & Network Architecture"]},
    {"code": "LS-202", "title": "LS-202: Advanced Wealth & Investment Strategies", "category": "Vocational", "description": "Transitioning from making money to growing and protecting wealth for the long term.\n\nCore competencies: Compound interest, vetting financial advisors, understanding asset classes, and avoiding predatory investments.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Wealth & Network Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Wealth & Network Architecture", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Transitioning from making money to growing and protecting wealth for the long term.", "core": "Compound interest, vetting financial advisors, understanding asset classes, and avoiding predatory investments.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 2: Wealth & Network Architecture"]},
    {"code": "LS-203", "title": "LS-203: Strategic Leverage - Credit and Debt", "category": "Vocational", "description": "Leveraging credit and debt to build assets rather than liabilities.\n\nCore competencies: Good vs. bad debt, building credit scores, utilizing business loans for acquisition, and real estate financing basics.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Wealth & Network Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Wealth & Network Architecture", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Leveraging credit and debt to build assets rather than liabilities.", "core": "Good vs. bad debt, building credit scores, utilizing business loans for acquisition, and real estate financing basics.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 2: Wealth & Network Architecture"]},
    {"code": "LS-204", "title": "LS-204: Building Business Relationships", "category": "Vocational", "description": "Creating a professional network that outlasts an athletic career.\n\nCore competencies: The 30-second elevator pitch, LinkedIn optimization, informational interviewing, and converting fans into mentors.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Wealth & Network Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Wealth & Network Architecture", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Creating a professional network that outlasts an athletic career.", "core": "The 30-second elevator pitch, LinkedIn optimization, informational interviewing, and converting fans into mentors.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 2: Wealth & Network Architecture"]},
    {"code": "LS-205", "title": "LS-205: The Executive Communicator", "category": "Vocational", "description": "Speaking effectively in boardrooms, networking events, and business settings.\n\nCore competencies: Active listening, non-verbal communication, email etiquette, and public speaking off the field.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Wealth & Network Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Wealth & Network Architecture", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Speaking effectively in boardrooms, networking events, and business settings.", "core": "Active listening, non-verbal communication, email etiquette, and public speaking off the field.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 2: Wealth & Network Architecture"]},
    {"code": "LS-301", "title": "LS-301: Managing Family & Friends", "category": "Vocational", "description": "Navigating shifting dynamics when visibility and financial success increase.\n\nCore competencies: Managing expectations, spotting the \"hanger-on\" effect, protecting inner circles, and managing guilt.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Relationship Governance & Dynamics · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Relationship Governance & Dynamics", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Navigating shifting dynamics when visibility and financial success increase.", "core": "Managing expectations, spotting the \"hanger-on\" effect, protecting inner circles, and managing guilt.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 3: Relationship Governance & Dynamics"]},
    {"code": "LS-302", "title": "LS-302: The Power of \"No\" & Boundary Setting", "category": "Vocational", "description": "Learning how to say no effectively and protect personal energy without burning bridges.\n\nCore competencies: Tactical scripts for declining requests, separating guilt from responsibility, and enforcing physical and financial boundaries.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Relationship Governance & Dynamics · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Relationship Governance & Dynamics", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Learning how to say no effectively and protect personal energy without burning bridges.", "core": "Tactical scripts for declining requests, separating guilt from responsibility, and enforcing physical and financial boundaries.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 3: Relationship Governance & Dynamics"]},
    {"code": "LS-303", "title": "LS-303: The \"Highest Earner\" Dynamic", "category": "Vocational", "description": "Navigating the psychological and practical realities of becoming the family's primary breadwinner.\n\nCore competencies: Financial boundary setting, avoiding the \"ATM syndrome\", establishing family trusts or managed allowances, and communicating financial limits.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Relationship Governance & Dynamics · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Relationship Governance & Dynamics", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Navigating the psychological and practical realities of becoming the family's primary breadwinner.", "core": "Financial boundary setting, avoiding the \"ATM syndrome\", establishing family trusts or managed allowances, and communicating financial limits.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 3: Relationship Governance & Dynamics"]},
    {"code": "LS-401", "title": "LS-401: The Psychology of Life After Sports", "category": "Vocational", "description": "Managing the emotional and psychological shift when the playing days end.\n\nCore competencies: Grieving the end of a sports career, finding a new \"why\", avoiding post-retirement depression, and reframing competitiveness.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: The Executive Transition & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: The Executive Transition & Legacy", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Managing the emotional and psychological shift when the playing days end.", "core": "Grieving the end of a sports career, finding a new \"why\", avoiding post-retirement depression, and reframing competitiveness.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 4: The Executive Transition & Legacy"]},
    {"code": "LS-402", "title": "LS-402: Transferable Skills Translation", "category": "Vocational", "description": "Mapping athletic traits directly to corporate, business, and entrepreneurial value.\n\nCore competencies: Resume writing for athletes, translating sports jargon to business terminology, and executive interview prep.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: The Executive Transition & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: The Executive Transition & Legacy", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Mapping athletic traits directly to corporate, business, and entrepreneurial value.", "core": "Resume writing for athletes, translating sports jargon to business terminology, and executive interview prep.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 4: The Executive Transition & Legacy"]},
    {"code": "LS-403", "title": "LS-403: Philanthropy & Community Impact", "category": "Vocational", "description": "Structuring giving and community foundation work for maximum, sustainable impact.\n\nCore competencies: Setting up a 501(c)(3) or Donor Advised Fund, aligning philanthropy with personal values, strategic giving, and board management.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: The Executive Transition & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: The Executive Transition & Legacy", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Structuring giving and community foundation work for maximum, sustainable impact.", "core": "Setting up a 501(c)(3) or Donor Advised Fund, aligning philanthropy with personal values, strategic giving, and board management.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 4: The Executive Transition & Legacy"]},
    {"code": "LS-404", "title": "LS-404: The Capstone - Launching Your Next Chapter", "category": "Vocational", "description": "Executing the transition into a career, business venture, or community leadership role.\n\nCore competencies: Business plan basics, utilizing the alumni network, securing internships/shadowing, and launching a post-sports enterprise.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: The Executive Transition & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: The Executive Transition & Legacy", "grade_label": "9–12", "pathway": "The Athlete Life Skills & Transition Pathway", "focus": "Executing the transition into a career, business venture, or community leadership role.", "core": "Business plan basics, utilizing the alumni network, securing internships/shadowing, and launching a post-sports enterprise.", "tags": ["Cool Nerds", "The Athlete Life Skills & Transition Pathway", "Level 4: The Executive Transition & Legacy"]},

    # The Parent Pathway
    {"code": "PAR-101", "title": "PAR-101: The Blueprint for Building a Great Student-Athlete", "category": "Foundation", "description": "Establishing the baseline routines for academic and athletic success.\n\nCore competencies: Time management support, academic accountability, and nutrition/sleep baselines.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Foundation · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Foundation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Establishing the baseline routines for academic and athletic success.", "core": "Time management support, academic accountability, and nutrition/sleep baselines.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 1: The Foundation"]},
    {"code": "PAR-102", "title": "PAR-102: Be a Great Example", "category": "Foundation", "description": "Modeling the behavior, integrity, and emotional control you want to see in your athlete.\n\nCore competencies: Sideline etiquette, conflict resolution with coaches, and emotional regulation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Foundation · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Foundation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Modeling the behavior, integrity, and emotional control you want to see in your athlete.", "core": "Sideline etiquette, conflict resolution with coaches, and emotional regulation.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 1: The Foundation"]},
    {"code": "PAR-103", "title": "PAR-103: Managing Your Expectations", "category": "Foundation", "description": "Keeping realistic, healthy goals for your child's athletic career.\n\nCore competencies: Understanding the statistical reality of college/pro sports, redefining success, and celebrating development over outcomes.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Foundation · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Foundation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Keeping realistic, healthy goals for your child's athletic career.", "core": "Understanding the statistical reality of college/pro sports, redefining success, and celebrating development over outcomes.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 1: The Foundation"]},
    {"code": "PAR-104", "title": "PAR-104: How to Silence the Noise", "category": "Foundation", "description": "Ignoring external pressure from other parents, rankings, and social media.\n\nCore competencies: Focusing on the process, avoiding the comparison trap, and managing social media consumption.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Foundation · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Foundation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Ignoring external pressure from other parents, rankings, and social media.", "core": "Focusing on the process, avoiding the comparison trap, and managing social media consumption.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 1: The Foundation"]},
    {"code": "PAR-105", "title": "PAR-105: Managing Your Kids", "category": "Foundation", "description": "Supporting your child's emotional and physical development without overstepping.\n\nCore competencies: Active listening, recognizing burnout, and balancing the parent vs. coach dynamic.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Foundation · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Foundation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Supporting your child's emotional and physical development without overstepping.", "core": "Active listening, recognizing burnout, and balancing the parent vs. coach dynamic.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 1: The Foundation"]},
    {"code": "PAR-106", "title": "PAR-106: Respecting the Coach", "category": "Foundation", "description": "Maintaining healthy boundaries and communication with coaching staff.\n\nCore competencies: Conflict resolution, the 24-hour rule, and understanding appropriate channels for feedback.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Foundation · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Foundation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Maintaining healthy boundaries and communication with coaching staff.", "core": "Conflict resolution, the 24-hour rule, and understanding appropriate channels for feedback.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 1: The Foundation"]},
    {"code": "PAR-107", "title": "PAR-107: Be a Parent But Not a Bully", "category": "Foundation", "description": "Supporting your child without crossing into toxic or overbearing pressure.\n\nCore competencies: Positive reinforcement, avoiding the \"car-ride-home\" critique, and fostering emotional safety.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Foundation · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Foundation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Supporting your child without crossing into toxic or overbearing pressure.", "core": "Positive reinforcement, avoiding the \"car-ride-home\" critique, and fostering emotional safety.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 1: The Foundation"]},
    {"code": "PAR-108", "title": "PAR-108: Managing Failure", "category": "Foundation", "description": "Helping your child process setbacks constructively.\n\nCore competencies: Reframing losses, separating self-worth from performance, and building psychological resilience.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Foundation · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Foundation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Helping your child process setbacks constructively.", "core": "Reframing losses, separating self-worth from performance, and building psychological resilience.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 1: The Foundation"]},
    {"code": "PAR-109", "title": "PAR-109: Losing Respectfully", "category": "Foundation", "description": "Modeling and teaching exceptional sportsmanship in defeat.\n\nCore competencies: Post-game etiquette, processing unfavorable officiating, and maintaining composure.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Foundation · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Foundation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Modeling and teaching exceptional sportsmanship in defeat.", "core": "Post-game etiquette, processing unfavorable officiating, and maintaining composure.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 1: The Foundation"]},
    {"code": "PAR-201", "title": "PAR-201: Choosing the Right Sports Program", "category": "Foundation", "description": "Evaluating AAU, club, and high school programs for optimal development.\n\nCore competencies: Assessing team culture, evaluating coaching staff, and understanding playing time vs. long-term development.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Navigation · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Navigation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Evaluating AAU, club, and high school programs for optimal development.", "core": "Assessing team culture, evaluating coaching staff, and understanding playing time vs. long-term development.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 2: The Navigation"]},
    {"code": "PAR-202", "title": "PAR-202: Branding for Your Kids", "category": "Foundation", "description": "Helping your child build an authentic and safe personal brand.\n\nCore competencies: Digital privacy, content strategy, and reputation management.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Navigation · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Navigation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Helping your child build an authentic and safe personal brand.", "core": "Digital privacy, content strategy, and reputation management.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 2: The Navigation"]},
    {"code": "PAR-203", "title": "PAR-203: Scouting Colleges", "category": "Foundation", "description": "Taking an active, realistic role in the college recruiting process.\n\nCore competencies: Campus visit evaluations, understanding roster depth, and separating sales pitches from reality.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Navigation · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Navigation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Taking an active, realistic role in the college recruiting process.", "core": "Campus visit evaluations, understanding roster depth, and separating sales pitches from reality.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 2: The Navigation"]},
    {"code": "PAR-204", "title": "PAR-204: Understanding the Attention Which Comes From Sports", "category": "Foundation", "description": "Preparing the family for the reality of community and media scrutiny.\n\nCore competencies: Managing local fame, navigating jealous peers, and protecting family privacy.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Navigation · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Navigation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Preparing the family for the reality of community and media scrutiny.", "core": "Managing local fame, navigating jealous peers, and protecting family privacy.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 2: The Navigation"]},
    {"code": "PAR-205", "title": "PAR-205: Presenting Yourself", "category": "Foundation", "description": "Acting as the professional and poised face of your family's brand.\n\nCore competencies: Sideline body language, parent digital footprint, and professional conduct.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Navigation · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Navigation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Acting as the professional and poised face of your family's brand.", "core": "Sideline body language, parent digital footprint, and professional conduct.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 2: The Navigation"]},
    {"code": "PAR-206", "title": "PAR-206: The Mental Health Pathway", "category": "Foundation", "description": "Recognizing and proactively addressing your athlete's psychological well-being.\n\nCore competencies: Identifying signs of anxiety/depression, utilizing sports psychologists, and balancing athletic stress.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: The Navigation · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: The Navigation", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Recognizing and proactively addressing your athlete's psychological well-being.", "core": "Identifying signs of anxiety/depression, utilizing sports psychologists, and balancing athletic stress.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 2: The Navigation"]},
    {"code": "PAR-301", "title": "PAR-301: Name, Image and Likeness (NIL) 101", "category": "Foundation", "description": "Understanding the basics of NIL legislation, compliance, and amateurism.\n\nCore competencies: State high school bylaws, NCAA regulations, and basic tax implications.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Business & Leverage · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Business & Leverage", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Understanding the basics of NIL legislation, compliance, and amateurism.", "core": "State high school bylaws, NCAA regulations, and basic tax implications.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 3: Business & Leverage"]},
    {"code": "PAR-302", "title": "PAR-302: Managing the Deals for Your Kids", "category": "Foundation", "description": "Overseeing early brand deals, sponsorships, and business inquiries.\n\nCore competencies: Reviewing contract terms, financial shielding, and protecting the athlete from predatory agreements.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Business & Leverage · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Business & Leverage", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Overseeing early brand deals, sponsorships, and business inquiries.", "core": "Reviewing contract terms, financial shielding, and protecting the athlete from predatory agreements.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 3: Business & Leverage"]},
    {"code": "PAR-303", "title": "PAR-303: Agencies versus Advisors", "category": "Foundation", "description": "Knowing who to trust and hire for representation and guidance.\n\nCore competencies: Differentiating between agents and advisors, understanding fee structures, and navigating NCAA agent rules.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Business & Leverage · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Business & Leverage", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Knowing who to trust and hire for representation and guidance.", "core": "Differentiating between agents and advisors, understanding fee structures, and navigating NCAA agent rules.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 3: Business & Leverage"]},
    {"code": "PAR-304", "title": "PAR-304: Using & Creating Leverage", "category": "Foundation", "description": "Maximizing your child's value in recruiting and endorsements.\n\nCore competencies: Negotiating scholarship offers, timing commitments, and identifying multiple pathway options.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Business & Leverage · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Business & Leverage", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Maximizing your child's value in recruiting and endorsements.", "core": "Negotiating scholarship offers, timing commitments, and identifying multiple pathway options.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 3: Business & Leverage"]},
    {"code": "PAR-305", "title": "PAR-305: Mastering Opportunities for a High-Profile Athlete", "category": "Foundation", "description": "Maximizing elite invites, camps, and national exposure safely.\n\nCore competencies: Vetting elite showcases, handling VIP recruiting visits, and navigating media requests.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Business & Leverage · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Business & Leverage", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Maximizing elite invites, camps, and national exposure safely.", "core": "Vetting elite showcases, handling VIP recruiting visits, and navigating media requests.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 3: Business & Leverage"]},
    {"code": "PAR-306", "title": "PAR-306: Networking", "category": "Foundation", "description": "Building professional relationships with recruiters, coaches, and sponsors.\n\nCore competencies: The parent elevator pitch, appropriate follow-ups, and long-term relationship management.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Business & Leverage · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Business & Leverage", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Building professional relationships with recruiters, coaches, and sponsors.", "core": "The parent elevator pitch, appropriate follow-ups, and long-term relationship management.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 3: Business & Leverage"]},
    {"code": "PAR-307", "title": "PAR-307: Public Speaking", "category": "Foundation", "description": "Communicating effectively in booster meetings, interviews, and events.\n\nCore competencies: Addressing groups, advocating professionally without overstepping, and media readiness.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Business & Leverage · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Business & Leverage", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Communicating effectively in booster meetings, interviews, and events.", "core": "Addressing groups, advocating professionally without overstepping, and media readiness.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 3: Business & Leverage"]},
    {"code": "PAR-308", "title": "PAR-308: You Can't Take Everyone With You", "category": "Foundation", "description": "Managing the social circle and expectations as your child's profile rises.\n\nCore competencies: Boundary setting with extended family, identifying opportunistic relationships, and protecting the inner circle.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Business & Leverage · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Business & Leverage", "grade_label": "9–12", "pathway": "The Parent Pathway", "focus": "Managing the social circle and expectations as your child's profile rises.", "core": "Boundary setting with extended family, identifying opportunistic relationships, and protecting the inner circle.", "tags": ["Cool Nerds", "The Parent Pathway", "Level 3: Business & Leverage"]},

    # The Cool Nerds Pathway
    {"code": "STU-101", "title": "STU-101: Managing Your Time", "category": "Scholars & Founders", "description": "Optimizing daily schedules for peak academic and personal performance.\n\nCore competencies: Calendar management, deep work blocks, and combating procrastination.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Optimizing daily schedules for peak academic and personal performance.", "core": "Calendar management, deep work blocks, and combating procrastination.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-102", "title": "STU-102: Being Independent and Responsible", "category": "Scholars & Founders", "description": "Transitioning from a dependent student to a self-sufficient young adult.\n\nCore competencies: Accountability, proactive problem-solving, and personal discipline.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Transitioning from a dependent student to a self-sufficient young adult.", "core": "Accountability, proactive problem-solving, and personal discipline.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-103", "title": "STU-103: Being a Nerd is Cool", "category": "Scholars & Founders", "description": "Embracing academic passion and intellectual curiosity.\n\nCore competencies: Reframing intelligence as an asset, finding your niche, and ignoring the \"too cool to care\" trap.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Embracing academic passion and intellectual curiosity.", "core": "Reframing intelligence as an asset, finding your niche, and ignoring the \"too cool to care\" trap.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-104", "title": "STU-104: Parents Are an Asset Not a Liability", "category": "Scholars & Founders", "description": "Transforming the parent-child relationship into a strategic partnership.\n\nCore competencies: Upward communication, mutual respect, and establishing mature boundaries.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Transforming the parent-child relationship into a strategic partnership.", "core": "Upward communication, mutual respect, and establishing mature boundaries.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-105", "title": "STU-105: Peer Pressure for Success", "category": "Scholars & Founders", "description": "Navigating high-achievement environments without toxic competition.\n\nCore competencies: Healthy rivalry, combating imposter syndrome, and collaborative success.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Navigating high-achievement environments without toxic competition.", "core": "Healthy rivalry, combating imposter syndrome, and collaborative success.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-106", "title": "STU-106: Anxiety is Fuel for Growth", "category": "Scholars & Founders", "description": "Rechanneling nervous energy into productive action.\n\nCore competencies: Stress framing, performance anxiety management, and nervous system regulation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Rechanneling nervous energy into productive action.", "core": "Stress framing, performance anxiety management, and nervous system regulation.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-107", "title": "STU-107: Mental Toughness", "category": "Scholars & Founders", "description": "Building psychological resilience against academic and social setbacks.\n\nCore competencies: Grit, failing forward, and bouncing back from rejection.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Building psychological resilience against academic and social setbacks.", "core": "Grit, failing forward, and bouncing back from rejection.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-108", "title": "STU-108: Dealing with Death", "category": "Scholars & Founders", "description": "Healthy processing of grief, loss, and tragedy.\n\nCore competencies: Navigating the stages of grief, seeking professional help, and supporting friends in mourning.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Healthy processing of grief, loss, and tragedy.", "core": "Navigating the stages of grief, seeking professional help, and supporting friends in mourning.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-109", "title": "STU-109: Substance Abuse Awareness", "category": "Scholars & Founders", "description": "Understanding the physiological and life-altering risks of dependency.\n\nCore competencies: Identifying addiction, refusing high-risk situations, and peer intervention.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Understanding the physiological and life-altering risks of dependency.", "core": "Identifying addiction, refusing high-risk situations, and peer intervention.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-110", "title": "STU-110: Karma is Real", "category": "Scholars & Founders", "description": "Understanding the long-term ROI of ethics, kindness, and character.\n\nCore competencies: Integrity, reputation management, and servant leadership.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Understanding the long-term ROI of ethics, kindness, and character.", "core": "Integrity, reputation management, and servant leadership.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-111", "title": "STU-111: The Courage to Stand Out", "category": "Scholars & Founders", "description": "Embracing individuality and resisting the urge to conform.\n\nCore competencies: Self-advocacy, independent thinking, and overcoming the fear of judgment.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Embracing individuality and resisting the urge to conform.", "core": "Self-advocacy, independent thinking, and overcoming the fear of judgment.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-112", "title": "STU-112: Violence is Not the Way", "category": "Scholars & Founders", "description": "De-escalation and peaceful conflict resolution.\n\nCore competencies: Emotional regulation, de-escalation tactics, understanding consequences, and walking away from provocation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "De-escalation and peaceful conflict resolution.", "core": "Emotional regulation, de-escalation tactics, understanding consequences, and walking away from provocation.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-113", "title": "STU-113: Believing in Yourself", "category": "Scholars & Founders", "description": "Building unshakeable self-confidence and self-efficacy.\n\nCore competencies: Positive self-talk, visualization, overcoming self-doubt, and internal validation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Building unshakeable self-confidence and self-efficacy.", "core": "Positive self-talk, visualization, overcoming self-doubt, and internal validation.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-114", "title": "STU-114: Don't Be Afraid to Do the Work", "category": "Scholars & Founders", "description": "Embracing the grind and understanding that there are no shortcuts to success.\n\nCore competencies: Work ethic, delayed gratification, persistence, and embracing the process.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Embracing the grind and understanding that there are no shortcuts to success.", "core": "Work ethic, delayed gratification, persistence, and embracing the process.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-115", "title": "STU-115: Accountability Pathways", "category": "Scholars & Founders", "description": "Taking absolute ownership of your actions, failures, and successes.\n\nCore competencies: Removing excuses, owning mistakes, transparent communication, and self-correction.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Personal Mastery & Resilience · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Personal Mastery & Resilience", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Taking absolute ownership of your actions, failures, and successes.", "core": "Removing excuses, owning mistakes, transparent communication, and self-correction.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 1: Personal Mastery & Resilience"]},
    {"code": "STU-201", "title": "STU-201: Foundational Life Skills", "category": "Scholars & Founders", "description": "Mastering the basic mechanics of daily adulting.\n\nCore competencies: Household basics, basic auto care, and navigating the healthcare system.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Academic & Professional Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Academic & Professional Architecture", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Mastering the basic mechanics of daily adulting.", "core": "Household basics, basic auto care, and navigating the healthcare system.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 2: Academic & Professional Architecture"]},
    {"code": "STU-202", "title": "STU-202: Developing Soft Skills", "category": "Scholars & Founders", "description": "Mastering interpersonal dynamics and emotional intelligence.\n\nCore competencies: Active listening, conflict resolution, and empathy in team settings.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Academic & Professional Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Academic & Professional Architecture", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Mastering interpersonal dynamics and emotional intelligence.", "core": "Active listening, conflict resolution, and empathy in team settings.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 2: Academic & Professional Architecture"]},
    {"code": "STU-203", "title": "STU-203: Preparing for College Entrance Exams", "category": "Scholars & Founders", "description": "Strategic testing methodology and mental endurance.\n\nCore competencies: Test endurance, logic deduction, and study scheduling.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Academic & Professional Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Academic & Professional Architecture", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Strategic testing methodology and mental endurance.", "core": "Test endurance, logic deduction, and study scheduling.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 2: Academic & Professional Architecture"]},
    {"code": "STU-204", "title": "STU-204: Studying Abroad", "category": "Scholars & Founders", "description": "Expanding global perspectives through international education.\n\nCore competencies: Cultural adaptation, passport/visa logistics, and global networking.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Academic & Professional Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Academic & Professional Architecture", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Expanding global perspectives through international education.", "core": "Cultural adaptation, passport/visa logistics, and global networking.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 2: Academic & Professional Architecture"]},
    {"code": "STU-205", "title": "STU-205: Learning Up Skills", "category": "Scholars & Founders", "description": "Continuous self-education and acquiring high-income technical skills.\n\nCore competencies: Self-guided learning, certification tracking, and skill stacking.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Academic & Professional Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Academic & Professional Architecture", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Continuous self-education and acquiring high-income technical skills.", "core": "Self-guided learning, certification tracking, and skill stacking.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 2: Academic & Professional Architecture"]},
    {"code": "STU-206", "title": "STU-206: Resume Building", "category": "Scholars & Founders", "description": "Crafting a compelling professional narrative on paper.\n\nCore competencies: Action verbs, formatting, and ATS (Applicant Tracking System) optimization.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Academic & Professional Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Academic & Professional Architecture", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Crafting a compelling professional narrative on paper.", "core": "Action verbs, formatting, and ATS (Applicant Tracking System) optimization.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 2: Academic & Professional Architecture"]},
    {"code": "STU-207", "title": "STU-207: Interview Skills", "category": "Scholars & Founders", "description": "Mastering the art of the professional conversation.\n\nCore competencies: The STAR method, reading body language, and answering behavioral questions.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Academic & Professional Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Academic & Professional Architecture", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Mastering the art of the professional conversation.", "core": "The STAR method, reading body language, and answering behavioral questions.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 2: Academic & Professional Architecture"]},
    {"code": "STU-208", "title": "STU-208: How to Get an Internship", "category": "Scholars & Founders", "description": "Proactive outreach to secure real-world corporate experience.\n\nCore competencies: Cold emailing, navigating career fairs, and portfolio creation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Academic & Professional Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Academic & Professional Architecture", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Proactive outreach to secure real-world corporate experience.", "core": "Cold emailing, navigating career fairs, and portfolio creation.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 2: Academic & Professional Architecture"]},
    {"code": "STU-209", "title": "STU-209: Being Respectful to the Team", "category": "Scholars & Founders", "description": "Fostering a healthy, respectful, and productive team environment.\n\nCore competencies: Active listening, valuing diverse opinions, constructive feedback, and role acceptance.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Academic & Professional Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Academic & Professional Architecture", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Fostering a healthy, respectful, and productive team environment.", "core": "Active listening, valuing diverse opinions, constructive feedback, and role acceptance.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 2: Academic & Professional Architecture"]},
    {"code": "STU-301", "title": "STU-301: Building Your Brand", "category": "Scholars & Founders", "description": "Defining your personal and professional identity early.\n\nCore competencies: Personal value proposition, reputation building, and digital consistency.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Brand, Business & Relationships · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Brand, Business & Relationships", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Defining your personal and professional identity early.", "core": "Personal value proposition, reputation building, and digital consistency.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 3: Brand, Business & Relationships"]},
    {"code": "STU-302", "title": "STU-302: Marketing Your Skills on Social Media", "category": "Scholars & Founders", "description": "Using digital platforms as a professional portfolio.\n\nCore competencies: LinkedIn optimization, content creation, and digital networking.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Brand, Business & Relationships · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Brand, Business & Relationships", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Using digital platforms as a professional portfolio.", "core": "LinkedIn optimization, content creation, and digital networking.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 3: Brand, Business & Relationships"]},
    {"code": "STU-303", "title": "STU-303: Creating Your Own Company", "category": "Scholars & Founders", "description": "The fundamentals of youth entrepreneurship.\n\nCore competencies: Lean startup methodology, LLC basics, and validating a business idea.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Brand, Business & Relationships · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Brand, Business & Relationships", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "The fundamentals of youth entrepreneurship.", "core": "Lean startup methodology, LLC basics, and validating a business idea.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 3: Brand, Business & Relationships"]},
    {"code": "STU-304", "title": "STU-304: You Can't Take Everyone With You", "category": "Scholars & Founders", "description": "Outgrowing relationships that no longer align with your future.\n\nCore competencies: Toxic friend identification, boundary setting, and finding mentors.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Brand, Business & Relationships · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Brand, Business & Relationships", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Outgrowing relationships that no longer align with your future.", "core": "Toxic friend identification, boundary setting, and finding mentors.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 3: Brand, Business & Relationships"]},
    {"code": "STU-305", "title": "STU-305: Strategic Planning Pathway", "category": "Scholars & Founders", "description": "Architecting a 1, 3, and 5-year life roadmap.\n\nCore competencies: OKRs (Objectives and Key Results), reverse engineering goals, and pivot strategies.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Brand, Business & Relationships · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Brand, Business & Relationships", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Architecting a 1, 3, and 5-year life roadmap.", "core": "OKRs (Objectives and Key Results), reverse engineering goals, and pivot strategies.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 3: Brand, Business & Relationships"]},
    {"code": "STU-306", "title": "STU-306: Leadership is King", "category": "Scholars & Founders", "description": "Cultivating the traits that make others want to follow you.\n\nCore competencies: Leading by example, decision-making, inspiring others, and servant leadership.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Brand, Business & Relationships · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Brand, Business & Relationships", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Cultivating the traits that make others want to follow you.", "core": "Leading by example, decision-making, inspiring others, and servant leadership.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 3: Brand, Business & Relationships"]},
    {"code": "STU-307", "title": "STU-307: Leveraging Loyalty and Honor", "category": "Scholars & Founders", "description": "Building a reputation of trustworthiness and steadfast loyalty in personal and professional life.\n\nCore competencies: Keeping your word, defending your core values, honoring commitments, and building lifelong trust.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Brand, Business & Relationships · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Brand, Business & Relationships", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Building a reputation of trustworthiness and steadfast loyalty in personal and professional life.", "core": "Keeping your word, defending your core values, honoring commitments, and building lifelong trust.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 3: Brand, Business & Relationships"]},
    {"code": "STU-401", "title": "STU-401: Managing Your Money", "category": "Scholars & Founders", "description": "Basic financial literacy and cash flow management.\n\nCore competencies: Zero-based budgeting, avoiding consumer debt, and basic banking.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Financial Independence & Adulting · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Financial Independence & Adulting", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Basic financial literacy and cash flow management.", "core": "Zero-based budgeting, avoiding consumer debt, and basic banking.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 4: Financial Independence & Adulting"]},
    {"code": "STU-402", "title": "STU-402: Understanding Taxes", "category": "Scholars & Founders", "description": "Demystifying the tax system for young adults.\n\nCore competencies: W-2 vs 1099, filing a return, and understanding deductions.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Financial Independence & Adulting · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Financial Independence & Adulting", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Demystifying the tax system for young adults.", "core": "W-2 vs 1099, filing a return, and understanding deductions.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 4: Financial Independence & Adulting"]},
    {"code": "STU-403", "title": "STU-403: Creating Wealth", "category": "Scholars & Founders", "description": "Long-term strategies for building net worth over time.\n\nCore competencies: Index funds, compound interest, and avoiding get-rich-quick schemes.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Financial Independence & Adulting · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Financial Independence & Adulting", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Long-term strategies for building net worth over time.", "core": "Index funds, compound interest, and avoiding get-rich-quick schemes.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 4: Financial Independence & Adulting"]},
    {"code": "STU-404", "title": "STU-404: Buying a Home", "category": "Scholars & Founders", "description": "The mechanics and timeline of real estate acquisition.\n\nCore competencies: Credit scores, mortgages, and down payment planning.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Financial Independence & Adulting · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Financial Independence & Adulting", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "The mechanics and timeline of real estate acquisition.", "core": "Credit scores, mortgages, and down payment planning.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 4: Financial Independence & Adulting"]},
    {"code": "STU-405", "title": "STU-405: Traveling", "category": "Scholars & Founders", "description": "Seeing the world efficiently, safely, and broadly.\n\nCore competencies: Travel budgeting, safety protocols, and cultural immersion.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Financial Independence & Adulting · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Financial Independence & Adulting", "grade_label": "9–12", "pathway": "The Cool Nerds Pathway", "focus": "Seeing the world efficiently, safely, and broadly.", "core": "Travel budgeting, safety protocols, and cultural immersion.", "tags": ["Cool Nerds", "The Cool Nerds Pathway", "Level 4: Financial Independence & Adulting"]},

    # The Entrepreneur Pathway
    {"code": "ENT-101", "title": "ENT-101: The Founder's Mentality", "category": "Professional", "description": "Transitioning from athlete/student to CEO.\n\nCore competencies: Identifying transferable skills, developing resilience, vision setting.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Transitioning from athlete/student to CEO.", "core": "Identifying transferable skills, developing resilience, vision setting.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-102", "title": "ENT-102: Idea Generation & Validation", "category": "Professional", "description": "Finding problems worth solving.\n\nCore competencies: Brainstorming frameworks, pain-point analysis, testing assumptions.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Finding problems worth solving.", "core": "Brainstorming frameworks, pain-point analysis, testing assumptions.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-103", "title": "ENT-103: Embracing Risk & Failure", "category": "Professional", "description": "The psychology of entrepreneurship.\n\nCore competencies: Risk tolerance mapping, failing fast, reframing setbacks.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "The psychology of entrepreneurship.", "core": "Risk tolerance mapping, failing fast, reframing setbacks.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-104", "title": "ENT-104: Time Capital", "category": "Professional", "description": "Investing your free time like a startup.\n\nCore competencies: Auditing time, prioritizing high-leverage tasks, consistency over intensity.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Investing your free time like a startup.", "core": "Auditing time, prioritizing high-leverage tasks, consistency over intensity.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-105", "title": "ENT-105: Lean Startup Methodology", "category": "Professional", "description": "Building minimum viable products (MVPs).\n\nCore competencies: Build-measure-learn feedback loops, rapid prototyping.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Building minimum viable products (MVPs).", "core": "Build-measure-learn feedback loops, rapid prototyping.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-106", "title": "ENT-106: Market Research 101", "category": "Professional", "description": "Understanding your target audience.\n\nCore competencies: Competitor analysis, customer interviews, demographic mapping.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Understanding your target audience.", "core": "Competitor analysis, customer interviews, demographic mapping.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-107", "title": "ENT-107: Value Proposition Design", "category": "Professional", "description": "Creating products people actually want.\n\nCore competencies: Feature vs. benefit analysis, solving acute pain points.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Creating products people actually want.", "core": "Feature vs. benefit analysis, solving acute pain points.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-108", "title": "ENT-108: Bootstrapping vs. Raising Capital", "category": "Professional", "description": "Funding your first venture.\n\nCore competencies: Self-funding strategies, pros/cons of debt vs. equity.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Funding your first venture.", "core": "Self-funding strategies, pros/cons of debt vs. equity.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-109", "title": "ENT-109: The Solopreneur Playbook", "category": "Professional", "description": "Starting a business with zero employees.\n\nCore competencies: Wearing multiple hats, low-overhead business models.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Starting a business with zero employees.", "core": "Wearing multiple hats, low-overhead business models.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-110", "title": "ENT-110: Designing a Business Model", "category": "Professional", "description": "How your idea will actually make money.\n\nCore competencies: Subscription models, transactional models, freemium, licensing.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "How your idea will actually make money.", "core": "Subscription models, transactional models, freemium, licensing.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-111", "title": "ENT-111: Competitive Analysis", "category": "Professional", "description": "Studying the competition without copying.\n\nCore competencies: SWOT analysis, finding market gaps, differentiation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Studying the competition without copying.", "core": "SWOT analysis, finding market gaps, differentiation.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-112", "title": "ENT-112: The Hustle Fallacy", "category": "Professional", "description": "Working smart, avoiding burnout, and protecting energy.\n\nCore competencies: Boundary setting, recognizing diminishing returns, sustainable growth.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Working smart, avoiding burnout, and protecting energy.", "core": "Boundary setting, recognizing diminishing returns, sustainable growth.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-113", "title": "ENT-113: The Art of the Pivot", "category": "Professional", "description": "When and how to change direction.\n\nCore competencies: Recognizing product-market fit failure, adapting without starting over.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "When and how to change direction.", "core": "Recognizing product-market fit failure, adapting without starting over.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-114", "title": "ENT-114: Athlete-Founder Case Studies", "category": "Professional", "description": "Case studies of athletes who successfully navigated the boardroom.\n\nCore competencies: Analyzing Magic Johnson's real estate, Serena Williams' VC, and LeBron James' SpringHill Company.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: The Entrepreneurial Mindset & Foundations · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: The Entrepreneurial Mindset & Foundations", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Case studies of athletes who successfully navigated the boardroom.", "core": "Analyzing Magic Johnson's real estate, Serena Williams' VC, and LeBron James' SpringHill Company.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 1: The Entrepreneurial Mindset & Foundations"]},
    {"code": "ENT-201", "title": "ENT-201: Architecting a Brand Identity", "category": "Professional", "description": "Logos, colors, and tone of voice.\n\nCore competencies: Brand archetypes, visual consistency, mission statements.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Logos, colors, and tone of voice.", "core": "Brand archetypes, visual consistency, mission statements.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-202", "title": "ENT-202: Storytelling for Founders", "category": "Professional", "description": "Pitching your vision to the world.\n\nCore competencies: The hero's journey in business, crafting an origin story.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Pitching your vision to the world.", "core": "The hero's journey in business, crafting an origin story.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-203", "title": "ENT-203: Social Media for Business", "category": "Professional", "description": "Converting followers into customers.\n\nCore competencies: Platform selection, content calendars, organic vs. paid reach.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Converting followers into customers.", "core": "Platform selection, content calendars, organic vs. paid reach.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-204", "title": "ENT-204: Content Marketing Ecosystems", "category": "Professional", "description": "Podcasts, blogs, and short-form video.\n\nCore competencies: Repurposing content, SEO basics, building authority.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Podcasts, blogs, and short-form video.", "core": "Repurposing content, SEO basics, building authority.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-205", "title": "ENT-205: Sales Psychology", "category": "Professional", "description": "How to sell without feeling sleazy.\n\nCore competencies: Consultative selling, overcoming objections, closing techniques.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "How to sell without feeling sleazy.", "core": "Consultative selling, overcoming objections, closing techniques.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-206", "title": "ENT-206: B2B vs. B2C Strategies", "category": "Professional", "description": "Selling to businesses vs. consumers.\n\nCore competencies: Sales cycles, procurement processes, consumer psychology.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Selling to businesses vs. consumers.", "core": "Sales cycles, procurement processes, consumer psychology.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-207", "title": "ENT-207: Pricing Strategies", "category": "Professional", "description": "How to price your product or service.\n\nCore competencies: Value-based pricing, cost-plus pricing, psychological pricing.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "How to price your product or service.", "core": "Value-based pricing, cost-plus pricing, psychological pricing.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-208", "title": "ENT-208: Customer Acquisition & Lifetime Value", "category": "Professional", "description": "The math behind marketing.\n\nCore competencies: Calculating CAC and LTV, optimizing ad spend, retention.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "The math behind marketing.", "core": "Calculating CAC and LTV, optimizing ad spend, retention.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-209", "title": "ENT-209: Email Marketing Mastery", "category": "Professional", "description": "Owning your audience.\n\nCore competencies: List building, lead magnets, automated email sequences.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Owning your audience.", "core": "List building, lead magnets, automated email sequences.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-210", "title": "ENT-210: Community Building", "category": "Professional", "description": "Creating loyal fans and advocates.\n\nCore competencies: Managing digital groups, fostering user-generated content.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Creating loyal fans and advocates.", "core": "Managing digital groups, fostering user-generated content.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-211", "title": "ENT-211: Affiliate Marketing & Partnerships", "category": "Professional", "description": "Leveraging other people's audiences.\n\nCore competencies: Structuring affiliate deals, influencer outreach, strategic alignment.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Leveraging other people's audiences.", "core": "Structuring affiliate deals, influencer outreach, strategic alignment.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-212", "title": "ENT-212: PR and Media Outreach", "category": "Professional", "description": "Getting free press for your startup.\n\nCore competencies: Writing press releases, pitching journalists, media training.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Getting free press for your startup.", "core": "Writing press releases, pitching journalists, media training.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-213", "title": "ENT-213: The Perfect Pitch Deck", "category": "Professional", "description": "Designing slides that win investors.\n\nCore competencies: Deck structure, financial projections, presenting the ask.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Designing slides that win investors.", "core": "Deck structure, financial projections, presenting the ask.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-214", "title": "ENT-214: Fractional Leadership & Consulting", "category": "Professional", "description": "Monetizing domain expertise by operating as fractional executives or advisors.\n\nCore competencies: Service packaging, B2B consulting, leveraging specialized sports/business knowledge.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Brand, Marketing, & Sales Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Brand, Marketing, & Sales Architecture", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Monetizing domain expertise by operating as fractional executives or advisors.", "core": "Service packaging, B2B consulting, leveraging specialized sports/business knowledge.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 2: Brand, Marketing, & Sales Architecture"]},
    {"code": "ENT-301", "title": "ENT-301: Business Structures", "category": "Professional", "description": "LLCs, S-Corps, and C-Corps explained.\n\nCore competencies: Liability protection, tax implications of entities, incorporation steps.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "LLCs, S-Corps, and C-Corps explained.", "core": "Liability protection, tax implications of entities, incorporation steps.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-302", "title": "ENT-302: Protecting Your IP", "category": "Professional", "description": "Trademarks, copyrights, and patents.\n\nCore competencies: Identifying intellectual property, filing basics, avoiding infringement.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Trademarks, copyrights, and patents.", "core": "Identifying intellectual property, filing basics, avoiding infringement.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-303", "title": "ENT-303: Contract Anatomy", "category": "Professional", "description": "Drafting and reviewing basic business agreements.\n\nCore competencies: NDAs, independent contractor agreements, terms of service.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Drafting and reviewing basic business agreements.", "core": "NDAs, independent contractor agreements, terms of service.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-304", "title": "ENT-304: Startup Accounting & Bookkeeping", "category": "Professional", "description": "Managing cash flow and P&L.\n\nCore competencies: Reading a balance sheet, separating personal/business funds.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Managing cash flow and P&L.", "core": "Reading a balance sheet, separating personal/business funds.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-305", "title": "ENT-305: Navigating Business Taxes", "category": "Professional", "description": "Deductions, quarterly payments, and strategy.\n\nCore competencies: Eligible write-offs, estimated taxes, preparing for tax season.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Deductions, quarterly payments, and strategy.", "core": "Eligible write-offs, estimated taxes, preparing for tax season.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-306", "title": "ENT-306: Supply Chain & Logistics", "category": "Professional", "description": "From manufacturing to fulfillment.\n\nCore competencies: Sourcing vendors, dropshipping vs. inventory, shipping logistics.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "From manufacturing to fulfillment.", "core": "Sourcing vendors, dropshipping vs. inventory, shipping logistics.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-307", "title": "ENT-307: Automation & AI Tools", "category": "Professional", "description": "Scaling operations without hiring.\n\nCore competencies: CRM automation, workflow triggers, leveraging AI for business.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Scaling operations without hiring.", "core": "CRM automation, workflow triggers, leveraging AI for business.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-308", "title": "ENT-308: Building a Remote Team", "category": "Professional", "description": "Hiring freelancers and virtual assistants.\n\nCore competencies: Global sourcing, writing clear SOPs (Standard Operating Procedures).\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Hiring freelancers and virtual assistants.", "core": "Global sourcing, writing clear SOPs (Standard Operating Procedures).", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-309", "title": "ENT-309: Customer Success", "category": "Professional", "description": "Turning complaints into 5-star reviews.\n\nCore competencies: Refund policies, managing negative feedback, customer retention.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Turning complaints into 5-star reviews.", "core": "Refund policies, managing negative feedback, customer retention.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-310", "title": "ENT-310: Inventory Management", "category": "Professional", "description": "Avoiding dead stock and stockouts.\n\nCore competencies: Just-in-time inventory, forecasting demand, warehousing basics.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Avoiding dead stock and stockouts.", "core": "Just-in-time inventory, forecasting demand, warehousing basics.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-311", "title": "ENT-311: Risk Management & Insurance", "category": "Professional", "description": "Protecting the business from liability.\n\nCore competencies: General liability insurance, cyber insurance, risk mitigation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Protecting the business from liability.", "core": "General liability insurance, cyber insurance, risk mitigation.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-312", "title": "ENT-312: E-commerce Fundamentals", "category": "Professional", "description": "Shopify, Amazon, and direct-to-consumer.\n\nCore competencies: Store setup, payment gateways, conversion rate optimization.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Shopify, Amazon, and direct-to-consumer.", "core": "Store setup, payment gateways, conversion rate optimization.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-313", "title": "ENT-313: The \"NIL to LLC\" Pipeline", "category": "Professional", "description": "Using initial NIL checks to seed an LLC rather than buying liabilities.\n\nCore competencies: LLC formation capital, acquiring real estate, funding inventory.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Using initial NIL checks to seed an LLC rather than buying liabilities.", "core": "LLC formation capital, acquiring real estate, funding inventory.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-314", "title": "ENT-314: Healthcare & Wellness Entrepreneurship", "category": "Professional", "description": "Operating outpatient health centers, PT clinics, and training facilities.\n\nCore competencies: EHR complexities, regulatory compliance, facility management.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Operating outpatient health centers, PT clinics, and training facilities.", "core": "EHR complexities, regulatory compliance, facility management.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-315", "title": "ENT-315: Tech Stack Automation Capstone", "category": "Professional", "description": "Building a low-code operational backend for under $100 a month.\n\nCore competencies: React, Tailwind CSS, cloud databases, Aircall/IVR systems.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: Operations, Legal, & Financial Engineering · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: Operations, Legal, & Financial Engineering", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Building a low-code operational backend for under $100 a month.", "core": "React, Tailwind CSS, cloud databases, Aircall/IVR systems.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 3: Operations, Legal, & Financial Engineering"]},
    {"code": "ENT-401", "title": "ENT-401: Hiring Your First Employee", "category": "Professional", "description": "Payroll, compliance, and culture.\n\nCore competencies: W-2 hiring process, conducting interviews, onboarding.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Payroll, compliance, and culture.", "core": "W-2 hiring process, conducting interviews, onboarding.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-402", "title": "ENT-402: Delegating & Management", "category": "Professional", "description": "Moving from operator to owner.\n\nCore competencies: Trusting your team, setting KPIs, giving constructive feedback.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Moving from operator to owner.", "core": "Trusting your team, setting KPIs, giving constructive feedback.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-403", "title": "ENT-403: Venture Capital & Angel Investors", "category": "Professional", "description": "Navigating term sheets and dilution.\n\nCore competencies: Equity financing, valuation basics, dealing with investors.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Navigating term sheets and dilution.", "core": "Equity financing, valuation basics, dealing with investors.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-404", "title": "ENT-404: Scaling Strategies", "category": "Professional", "description": "Franchising, licensing, and new markets.\n\nCore competencies: Identifying growth opportunities, replicating success.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Franchising, licensing, and new markets.", "core": "Identifying growth opportunities, replicating success.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-405", "title": "ENT-405: Strategic Partnerships & Joint Ventures", "category": "Professional", "description": "Teaming up with bigger players.\n\nCore competencies: Drafting joint ventures, co-marketing, mutual benefit analysis.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Teaming up with bigger players.", "core": "Drafting joint ventures, co-marketing, mutual benefit analysis.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-406", "title": "ENT-406: Crisis Management for CEOs", "category": "Professional", "description": "Navigating PR disasters and cash crunches.\n\nCore competencies: Emergency cash reserves, transparent communication, disaster recovery.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Navigating PR disasters and cash crunches.", "core": "Emergency cash reserves, transparent communication, disaster recovery.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-407", "title": "ENT-407: The Psychology of Leadership", "category": "Professional", "description": "Inspiring a team during tough times.\n\nCore competencies: Emotional intelligence, conflict resolution at the executive level.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Inspiring a team during tough times.", "core": "Emotional intelligence, conflict resolution at the executive level.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-408", "title": "ENT-408: Mergers & Acquisitions", "category": "Professional", "description": "Buying other businesses to grow.\n\nCore competencies: Valuing a target business, due diligence, integration.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Buying other businesses to grow.", "core": "Valuing a target business, due diligence, integration.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-409", "title": "ENT-409: The Exit Strategy", "category": "Professional", "description": "Preparing to sell your company.\n\nCore competencies: Business valuation multiples, finding brokers, the acquisition process.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Preparing to sell your company.", "core": "Business valuation multiples, finding brokers, the acquisition process.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-410", "title": "ENT-410: Wealth Management for Founders", "category": "Professional", "description": "Diversifying your profits.\n\nCore competencies: Personal investing post-exit, avoiding lifestyle creep.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Diversifying your profits.", "core": "Personal investing post-exit, avoiding lifestyle creep.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-411", "title": "ENT-411: Philanthropy & Social Impact", "category": "Professional", "description": "Building a purpose-driven enterprise.\n\nCore competencies: Social enterprise models, corporate social responsibility, donating profits.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Building a purpose-driven enterprise.", "core": "Social enterprise models, corporate social responsibility, donating profits.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},
    {"code": "ENT-412", "title": "ENT-412: The Serial Entrepreneur", "category": "Professional", "description": "Taking lessons from venture 1 to venture 2.\n\nCore competencies: Avoiding complacency, starting fresh, leveraging past networks.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Scaling, Leadership, & Legacy · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Scaling, Leadership, & Legacy", "grade_label": "9–12", "pathway": "The Entrepreneur Pathway", "focus": "Taking lessons from venture 1 to venture 2.", "core": "Avoiding complacency, starting fresh, leveraging past networks.", "tags": ["Cool Nerds", "The Entrepreneur Pathway", "Level 4: Scaling, Leadership, & Legacy"]},

    # The Coaching Pathway
    {"code": "COH-101", "title": "COH-101: The Modern Coach's Philosophy", "category": "Coaches & Mentors", "description": "Evolving from a dictator to a transformational leader.\n\nCore competencies: Establishing core values, coaching identity, and player-centric culture.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Evolving from a dictator to a transformational leader.", "core": "Establishing core values, coaching identity, and player-centric culture.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-102", "title": "COH-102: Leadership by Decision Making", "category": "Coaches & Mentors", "description": "Making high-pressure, split-second decisions under scrutiny.\n\nCore competencies: Game-theory application, risk assessment, and decisive authority.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Making high-pressure, split-second decisions under scrutiny.", "core": "Game-theory application, risk assessment, and decisive authority.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-103", "title": "COH-103: Developing People Skills", "category": "Coaches & Mentors", "description": "Building authentic trust and rapport with modern athletes.\n\nCore competencies: Active listening, emotional intelligence, and empathetic coaching.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Building authentic trust and rapport with modern athletes.", "core": "Active listening, emotional intelligence, and empathetic coaching.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-104", "title": "COH-104: Learning from Mistakes", "category": "Coaches & Mentors", "description": "Deconstructing losses and coaching errors constructively.\n\nCore competencies: Film room accountability, post-game reflection, and ego management.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Deconstructing losses and coaching errors constructively.", "core": "Film room accountability, post-game reflection, and ego management.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-105", "title": "COH-105: Believing in Your Philosophy", "category": "Coaches & Mentors", "description": "Sticking to your tactical identity during adversity.\n\nCore competencies: Resilience under fan/media pressure, long-term vision vs short-term panic.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Sticking to your tactical identity during adversity.", "core": "Resilience under fan/media pressure, long-term vision vs short-term panic.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-106", "title": "COH-106: The Psychology of Motivation", "category": "Coaches & Mentors", "description": "Understanding what drives different athletes.\n\nCore competencies: Intrinsic vs extrinsic motivation, generational differences in players.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Understanding what drives different athletes.", "core": "Intrinsic vs extrinsic motivation, generational differences in players.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-107", "title": "COH-107: Establishing Absolute Accountability", "category": "Coaches & Mentors", "description": "Creating a culture where standards are non-negotiable.\n\nCore competencies: Holding stars and bench players to the same standard, peer accountability.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Creating a culture where standards are non-negotiable.", "core": "Holding stars and bench players to the same standard, peer accountability.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-108", "title": "COH-108: Coaching with Empathy", "category": "Coaches & Mentors", "description": "Balancing high standards with mental health awareness.\n\nCore competencies: Recognizing burnout, trauma-informed coaching, psychological safety.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Balancing high standards with mental health awareness.", "core": "Recognizing burnout, trauma-informed coaching, psychological safety.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-109", "title": "COH-109: Ethical Leadership on the Sideline", "category": "Coaches & Mentors", "description": "Integrity when no one is watching.\n\nCore competencies: Rule compliance, sportsmanship, and modeling honorable behavior.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Integrity when no one is watching.", "core": "Rule compliance, sportsmanship, and modeling honorable behavior.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-110", "title": "COH-110: Time Management for Coaches", "category": "Coaches & Mentors", "description": "Balancing practice planning, film study, and personal life.\n\nCore competencies: Calendar blocking, preventing coach burnout, efficient administration.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Balancing practice planning, film study, and personal life.", "core": "Calendar blocking, preventing coach burnout, efficient administration.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-111", "title": "COH-111: The Coach's Voice & Body Language", "category": "Coaches & Mentors", "description": "Controlling the sideline environment.\n\nCore competencies: Non-verbal communication, sideline composure, vocal modulation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Controlling the sideline environment.", "core": "Non-verbal communication, sideline composure, vocal modulation.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-112", "title": "COH-112: Continuous Learning & Scouting", "category": "Coaches & Mentors", "description": "Staying ahead of tactical trends in sports.\n\nCore competencies: Attending clinics, studying cross-sport innovations, analytical scouting.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 1: Coaching Mindset & Foundational Leadership · Format: Online", "difficulty": Course.Difficulty.BEGINNER, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 1: Coaching Mindset & Foundational Leadership", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Staying ahead of tactical trends in sports.", "core": "Attending clinics, studying cross-sport innovations, analytical scouting.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 1: Coaching Mindset & Foundational Leadership"]},
    {"code": "COH-201", "title": "COH-201: Getting the Most Out of Your Athletes", "category": "Coaches & Mentors", "description": "Unlocking hidden potential in role players and stars.\n\nCore competencies: Individualized motivation, pushing thresholds, cultivating confidence.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Unlocking hidden potential in role players and stars.", "core": "Individualized motivation, pushing thresholds, cultivating confidence.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-202", "title": "COH-202: Player Development Systems", "category": "Coaches & Mentors", "description": "Building year-round technical skill roadmaps.\n\nCore competencies: Progressive drill design, off-season workouts, skill tracking.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Building year-round technical skill roadmaps.", "core": "Progressive drill design, off-season workouts, skill tracking.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-203", "title": "COH-203: Team Development & Culture Building", "category": "Coaches & Mentors", "description": "Creating a unified locker room from diverse personalities.\n\nCore competencies: Team building outside the sport, establishing team covenants, rituals.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Creating a unified locker room from diverse personalities.", "core": "Team building outside the sport, establishing team covenants, rituals.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-204", "title": "COH-204: Building Team Chemistry", "category": "Coaches & Mentors", "description": "Fostering genuine camaraderie and unselfish play.\n\nCore competencies: Role acceptance, ego dampening, celebrating teammate success.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Fostering genuine camaraderie and unselfish play.", "core": "Role acceptance, ego dampening, celebrating teammate success.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-205", "title": "COH-205: Calling the Right Play", "category": "Coaches & Mentors", "description": "Game management, situational awareness, and play-calling strategy.\n\nCore competencies: Clock management, exploiting defensive tendencies, situational playbooks.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Game management, situational awareness, and play-calling strategy.", "core": "Clock management, exploiting defensive tendencies, situational playbooks.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-206", "title": "COH-206: Designing Practice Flow", "category": "Coaches & Mentors", "description": "Maximizing rep efficiency in limited time.\n\nCore competencies: High-tempo practice design, station work, minimizing standing around.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Maximizing rep efficiency in limited time.", "core": "High-tempo practice design, station work, minimizing standing around.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-207", "title": "COH-207: Managing Special Talents & Superstars", "category": "Coaches & Mentors", "description": "Coaching elite players without alienating the roster.\n\nCore competencies: Special accommodations vs team rules, keeping egos in check.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Coaching elite players without alienating the roster.", "core": "Special accommodations vs team rules, keeping egos in check.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-208", "title": "COH-208: Integrating Freshmen & Rookies", "category": "Coaches & Mentors", "description": "Accelerating the transition of younger players to varsity/college speed.\n\nCore competencies: Mentorship pairings, simplifying playbooks for newcomers, reducing anxiety.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Accelerating the transition of younger players to varsity/college speed.", "core": "Mentorship pairings, simplifying playbooks for newcomers, reducing anxiety.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-209", "title": "COH-209: Positional Leadership Training", "category": "Coaches & Mentors", "description": "Developing captains and on-field generals.\n\nCore competencies: Empowering players to lead drills, holding teammates accountable in the locker room.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Developing captains and on-field generals.", "core": "Empowering players to lead drills, holding teammates accountable in the locker room.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-210", "title": "COH-210: Rehabilitation & Injury Return", "category": "Coaches & Mentors", "description": "Managing the physical and mental recovery of injured players.\n\nCore competencies: Bridging medical staff and coaching staff, keeping injured players engaged.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Managing the physical and mental recovery of injured players.", "core": "Bridging medical staff and coaching staff, keeping injured players engaged.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-211", "title": "COH-211: Off-Season Conditioning & Nutrition", "category": "Coaches & Mentors", "description": "Partnering with strength coaches for optimal performance.\n\nCore competencies: Periodization, nutritional baselines, injury prevention protocols.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Partnering with strength coaches for optimal performance.", "core": "Periodization, nutritional baselines, injury prevention protocols.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-212", "title": "COH-212: Analytics in Coaching", "category": "Coaches & Mentors", "description": "Using data to drive tactical and personnel decisions.\n\nCore competencies: Evaluating advanced metrics, efficiency ratings, objective film breakdown.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Using data to drive tactical and personnel decisions.", "core": "Evaluating advanced metrics, efficiency ratings, objective film breakdown.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-213", "title": "COH-213: Scouting Opponents", "category": "Coaches & Mentors", "description": "Game-planning effectively without overloading players.\n\nCore competencies: Tendency reports, simplifying complex scouting into actionable keys.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 2: Player & Team Architecture · Format: Online", "difficulty": Course.Difficulty.INTERMEDIATE, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 2: Player & Team Architecture", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Game-planning effectively without overloading players.", "core": "Tendency reports, simplifying complex scouting into actionable keys.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 2: Player & Team Architecture"]},
    {"code": "COH-301", "title": "COH-301: Parent Management 101", "category": "Coaches & Mentors", "description": "Setting boundaries and building allies out of parents.\n\nCore competencies: Pre-season parent meetings, the 24-hour rule, diffusing hostile confrontations.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Setting boundaries and building allies out of parents.", "core": "Pre-season parent meetings, the 24-hour rule, diffusing hostile confrontations.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-302", "title": "COH-302: Family Management for Coaches", "category": "Coaches & Mentors", "description": "Balancing a demanding coaching schedule with marriage and children.\n\nCore competencies: Protecting family time, including family in team culture, mitigating burnout.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Balancing a demanding coaching schedule with marriage and children.", "core": "Protecting family time, including family in team culture, mitigating burnout.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-303", "title": "COH-303: Coaching Your Coaches", "category": "Coaches & Mentors", "description": "Managing, mentoring, and evaluating assistant coaches.\n\nCore competencies: Delegating responsibilities, constructive feedback, staff cohesion.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Managing, mentoring, and evaluating assistant coaches.", "core": "Delegating responsibilities, constructive feedback, staff cohesion.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-304", "title": "COH-304: Finding NIL Deals for Students", "category": "Coaches & Mentors", "description": "Helping student-athletes navigate brand partnerships ethically.\n\nCore competencies: Connecting players with local businesses, understanding compliance, brand advocacy.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Helping student-athletes navigate brand partnerships ethically.", "core": "Connecting players with local businesses, understanding compliance, brand advocacy.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-305", "title": "COH-305: Pro Versus High School Coaching", "category": "Coaches & Mentors", "description": "Adapting your leadership style across different levels.\n\nCore competencies: Navigating institutional politics (HS) vs economic pressures (Pro/College).\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Adapting your leadership style across different levels.", "core": "Navigating institutional politics (HS) vs economic pressures (Pro/College).", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-306", "title": "COH-306: Navigating the Collegiate Recruiting Process", "category": "Coaches & Mentors", "description": "Acting as an advocate for your players with college scouts.\n\nCore competencies: Honest evaluations, building relationships with college coaches, protecting players from scams.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Acting as an advocate for your players with college scouts.", "core": "Honest evaluations, building relationships with college coaches, protecting players from scams.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-307", "title": "COH-307: Athletic Department Politics", "category": "Coaches & Mentors", "description": "Navigating administration, boosters, and athletic directors.\n\nCore competencies: Managing upward, securing budgets, protecting program autonomy.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Navigating administration, boosters, and athletic directors.", "core": "Managing upward, securing budgets, protecting program autonomy.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-308", "title": "COH-308: Media Training for Coaches", "category": "Coaches & Mentors", "description": "Handling press conferences, post-game interviews, and social media.\n\nCore competencies: Controlling the narrative, protecting players in public statements, avoiding PR traps.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Handling press conferences, post-game interviews, and social media.", "core": "Controlling the narrative, protecting players in public statements, avoiding PR traps.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-309", "title": "COH-309: Booster Club & Fundraising Management", "category": "Coaches & Mentors", "description": "Securing supplemental funding for equipment and travel.\n\nCore competencies: Donor relations, transparent fund accounting, community engagement.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Securing supplemental funding for equipment and travel.", "core": "Donor relations, transparent fund accounting, community engagement.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-310", "title": "COH-310: Facility & Equipment Operations", "category": "Coaches & Mentors", "description": "Managing resources safely and efficiently.\n\nCore competencies: Equipment safety audits, scheduling gym/field time, gear maintenance.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Managing resources safely and efficiently.", "core": "Equipment safety audits, scheduling gym/field time, gear maintenance.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-311", "title": "COH-311: Compliance & Eligibility Oversight", "category": "Coaches & Mentors", "description": "Protecting your players' academic standing and eligibility.\n\nCore competencies: Monitoring grade checks, study halls, NCAA/state association rule compliance.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Protecting your players' academic standing and eligibility.", "core": "Monitoring grade checks, study halls, NCAA/state association rule compliance.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-312", "title": "COH-312: Crisis Management on the Roster", "category": "Coaches & Mentors", "description": "Handling off-field behavioral issues, arrests, or scandals.\n\nCore competencies: Disciplinary frameworks, partnering with school administration, legal boundaries.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Handling off-field behavioral issues, arrests, or scandals.", "core": "Disciplinary frameworks, partnering with school administration, legal boundaries.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-313", "title": "COH-313: Community Engagement & Outreach", "category": "Coaches & Mentors", "description": "Building a program that represents the local community.\n\nCore competencies: Youth clinics, community service projects, fan base cultivation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 3: External Stakeholders, NIL, & Staff Management · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 3: External Stakeholders, NIL, & Staff Management", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Building a program that represents the local community.", "core": "Youth clinics, community service projects, fan base cultivation.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 3: External Stakeholders, NIL, & Staff Management"]},
    {"code": "COH-401", "title": "COH-401: Transitioning from Assistant to Head Coach", "category": "Coaches & Mentors", "description": "Taking the leap into the top chair.\n\nCore competencies: Interviewing for head coaching jobs, establishing immediate authority, re-recruiting the roster.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Taking the leap into the top chair.", "core": "Interviewing for head coaching jobs, establishing immediate authority, re-recruiting the roster.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-402", "title": "COH-402: Building a Program Legacy", "category": "Coaches & Mentors", "description": "Constructing a sustainable system that outlasts your tenure.\n\nCore competencies: Youth pipeline integration, middle school-to-varsity continuity, institutional memory.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Constructing a sustainable system that outlasts your tenure.", "core": "Youth pipeline integration, middle school-to-varsity continuity, institutional memory.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-403", "title": "COH-403: Multi-Sport Coaching Synergy", "category": "Coaches & Mentors", "description": "Applying cross-sport training concepts to prevent burnout.\n\nCore competencies: Cross-training benefits, multi-sport athlete advocacy, workload management.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Applying cross-sport training concepts to prevent burnout.", "core": "Cross-training benefits, multi-sport athlete advocacy, workload management.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-404", "title": "COH-404: The Transfer Portal & Roster Construction", "category": "Coaches & Mentors", "description": "Navigating modern roster fluidity and recruitment cycles.\n\nCore competencies: Evaluating portal talent, retention strategies, squad balance.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Navigating modern roster fluidity and recruitment cycles.", "core": "Evaluating portal talent, retention strategies, squad balance.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-405", "title": "COH-405: Contract Negotiation for Coaches", "category": "Coaches & Mentors", "description": "Securing fair compensation, bonuses, and buyouts.\n\nCore competencies: Understanding agent representation, performance clauses, contract duration.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Securing fair compensation, bonuses, and buyouts.", "core": "Understanding agent representation, performance clauses, contract duration.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-406", "title": "COH-406: Sports Science & Biomechanics Integration", "category": "Coaches & Mentors", "description": "Utilizing cutting-edge technology for injury prevention.\n\nCore competencies: Wearable data tracking, force plates, workload monitoring.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Utilizing cutting-edge technology for injury prevention.", "core": "Wearable data tracking, force plates, workload monitoring.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-407", "title": "COH-407: International Scouting & Global Pathways", "category": "Coaches & Mentors", "description": "Recruiting and coaching international talent.\n\nCore competencies: Cultural adaptation, visa logistics, global talent evaluation.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Recruiting and coaching international talent.", "core": "Cultural adaptation, visa logistics, global talent evaluation.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-408", "title": "COH-408: The Psychology of Winning Championships", "category": "Coaches & Mentors", "description": "Managing the pressure of the postseason.\n\nCore competencies: Championship week routines, handling media distractions, peaking at the right time.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Managing the pressure of the postseason.", "core": "Championship week routines, handling media distractions, peaking at the right time.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-409", "title": "COH-409: Building a Coaching Brand & Thought Leadership", "category": "Coaches & Mentors", "description": "Publishing books, speaking at clinics, and building your reputation.\n\nCore competencies: Sharing methodologies, clinic presentations, networking with elite coaches.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Publishing books, speaking at clinics, and building your reputation.", "core": "Sharing methodologies, clinic presentations, networking with elite coaches.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-410", "title": "COH-410: Financial Literacy for Coaches", "category": "Coaches & Mentors", "description": "Managing irregular coaching income and retirement planning.\n\nCore competencies: Pension management, private camps revenue, long-term wealth building.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Managing irregular coaching income and retirement planning.", "core": "Pension management, private camps revenue, long-term wealth building.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-411", "title": "COH-411: Designing a Coaching Mentorship Tree", "category": "Coaches & Mentors", "description": "Giving back by developing the next generation of coaches.\n\nCore competencies: Mentoring assistants, writing recommendations, open-door staff policies.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Giving back by developing the next generation of coaches.", "core": "Mentoring assistants, writing recommendations, open-door staff policies.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
    {"code": "COH-412", "title": "COH-412: The Coaching Exit Strategy", "category": "Coaches & Mentors", "description": "Knowing when and how to walk away on your own terms.\n\nCore competencies: Honoring your legacy, succession planning, post-coaching career opportunities.\n\nProvider: Cool Nerds · 1 credit · Grades 9–12 · Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery · Format: Online", "difficulty": Course.Difficulty.ADVANCED, "provider": "Cool Nerds", "provider_thumbnail_url": None, "subject": "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery", "grade_label": "9–12", "pathway": "The Coaching Pathway", "focus": "Knowing when and how to walk away on your own terms.", "core": "Honoring your legacy, succession planning, post-coaching career opportunities.", "tags": ["Cool Nerds", "The Coaching Pathway", "Level 4: Advanced Legacy, Career Progression, & Multi-Sport Mastery"]},
]

# Distractor pools for the generated quiz's metadata questions (see
# `_create_course_content`) — every distinct subject/provider/grade-label that actually
# appears somewhere in COURSE_DEFS, so a wrong answer is always another real value from
# the catalog rather than something made up.
ALL_SUBJECTS = sorted({course_def["subject"] for course_def in COURSE_DEFS})
ALL_PROVIDERS = sorted({course_def["provider"] for course_def in COURSE_DEFS})
ALL_GRADE_LABELS = sorted({course_def["grade_label"] for course_def in COURSE_DEFS})
# Every course's Focus line from the client's sheet — unique per course, so this
# is the one pool that scales with the catalog rather than with its vocabulary.
ALL_FOCUSES = sorted({course_def["focus"] for course_def in COURSE_DEFS})

# One correct answer plus three distractors. `_create_quiz` drops any question
# whose pool cannot supply that many distinct values.
CHOICES_PER_QUESTION = 4

# The nine pathways from the client's "Courses We need to add" sheet, each
# holding exactly the courses it listed, in sheet order. The 15 demo pathways
# that used to live here (homeschool, Ivy League, trades, international...) were
# removed at the client's request along with the catalog they bundled, so these
# nine are now the whole offering. TIER_DEFS, QUESTIONNAIRE and
# DEFAULT_PATHWAY_AUDIENCES all key off the names and keys below, and a stale
# reference is a hard KeyError at seed time -- adding a pathway here means
# adding it to all three (`pathways/tests/test_audience_defaults.py` and
# `courses/tests/test_commands.py::test_pathways_and_tiers_are_wired_to_real_content`
# fail if you don't).
#
# `base_price` scales with the size of the bundle rather than being a flat
# figure: the Entrepreneur pathway is 55 courses and the Branding & Marketing
# pathway is 10, and charging both the same would make the bundle discount
# (`BUNDLE_RULES`) nonsense. These are placeholder figures for the client to
# price properly in the admin. Note that `_seed_pathways` update_or_creates the
# pathway row, so unlike a course's `amount` (create-only) a price edited in the
# admin IS overwritten on the next reseed -- move `base_price` out of those
# defaults once the client is pricing in production.
#
# The sheet's own spellings are kept for the course codes and levels but not for
# the pathway names: "Entreprenuer", "Cool Nerdz" and the bare "Parents" and
# "Coaches" headers are rendered here as "The Entrepreneur Pathway", "The Cool
# Nerds Pathway" (matching the `cool-nerds` audience slug and the Cool Nerds
# provider name), "The Parent Pathway" and "The Coaching Pathway", so every row
# in the admin's pathway list reads the same way.
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
    {
        "key": "branding_marketing",
        "name": "The Branding & Marketing Pathway",
        "summary": "Turning an athlete's social presence into an owned, defensible asset: audit, story, production, then monetization.",
        "description": (
            "Takes the athlete's digital presence from liability to asset - a deep-clean of the "
            "footprint college coaches sweep, personal pillars and a mission statement, privacy and "
            "harassment handling, then narrative, platform mechanics and phone-to-feed production, "
            "ending in the local-business pitch, interview technique and lifetime brand equity."
        ),
        "base_price": 249,
        "course_codes": [
            "BM-101", "BM-102", "BM-103", "BM-201", "BM-202",
            "BM-203", "BM-204", "BM-301", "BM-302", "BM-303"
        ],
    },
    {
        "key": "athlete_life_skills",
        "name": "The Athlete Life Skills & Transition Pathway",
        "summary": "The off-field curriculum: time and energy, money and credit, relationship boundaries, then the transition out of sport.",
        "description": (
            "The life an athletic career is built on and the one that follows it - calendar control "
            "and professional standards, financial literacy through investing, credit and the "
            "executive network, the harder relationship work of family, boundaries and being the "
            "highest earner, then retirement psychology, transferable skills, philanthropy and the "
            "next chapter."
        ),
        "base_price": 329,
        "course_codes": [
            "LS-101", "LS-102", "LS-103", "LS-104", "LS-201",
            "LS-202", "LS-203", "LS-204", "LS-205", "LS-301",
            "LS-302", "LS-303", "LS-401", "LS-402", "LS-403",
            "LS-404"
        ],
    },
    {
        "key": "parent_pathway",
        "name": "The Parent Pathway",
        "summary": "Written for the parent: the routines and example that build an athlete, then navigation, and finally NIL, agents and leverage.",
        "description": (
            "The sideline seat, done well - baseline routines, modelling behaviour, realistic "
            "expectations and silencing the noise; then choosing programs, scouting colleges and "
            "handling the attention sport brings; then the business end, where NIL rules, agents "
            "versus advisors, deal review and leverage decide what a family keeps."
        ),
        "base_price": 349,
        "course_codes": [
            "PAR-101", "PAR-102", "PAR-103", "PAR-104", "PAR-105",
            "PAR-106", "PAR-107", "PAR-108", "PAR-109", "PAR-201",
            "PAR-202", "PAR-203", "PAR-204", "PAR-205", "PAR-206",
            "PAR-301", "PAR-302", "PAR-303", "PAR-304", "PAR-305",
            "PAR-306", "PAR-307", "PAR-308"
        ],
    },
    {
        "key": "cool_nerds",
        "name": "The Cool Nerds Pathway",
        "summary": "The non-athlete track: personal mastery and resilience, academic and professional architecture, brand and business, then money.",
        "description": (
            "Thirty-six courses for the student who competes in classrooms rather than stadiums - "
            "time, independence, anxiety, grief, substance awareness and the courage to stand out; "
            "then adulting basics, entrance exams, resumes, interviews and internships; then "
            "personal brand, a first company and the relationships that scale with you; closing on "
            "budgeting, taxes, wealth, a first home and the world."
        ),
        "base_price": 449,
        "course_codes": [
            "STU-101", "STU-102", "STU-103", "STU-104", "STU-105",
            "STU-106", "STU-107", "STU-108", "STU-109", "STU-110",
            "STU-111", "STU-112", "STU-113", "STU-114", "STU-115",
            "STU-201", "STU-202", "STU-203", "STU-204", "STU-205",
            "STU-206", "STU-207", "STU-208", "STU-209", "STU-301",
            "STU-302", "STU-303", "STU-304", "STU-305", "STU-306",
            "STU-307", "STU-401", "STU-402", "STU-403", "STU-404",
            "STU-405"
        ],
    },
    {
        "key": "entrepreneurship",
        "name": "The Entrepreneur Pathway",
        "summary": "Founder to operator to owner: mindset and validation, brand and sales, operations/legal/finance, then scaling and the exit.",
        "description": (
            "The longest track in the catalog, and the most operational - founder mentality, idea "
            "validation, lean MVPs and the athlete-founder case studies; brand identity, sales "
            "psychology, pricing, CAC and the pitch deck; entity structures, IP, contracts, "
            "bookkeeping, taxes, supply chain and automation; then first hires, capital, "
            "partnerships, M&A, the exit and what a founder does with the proceeds."
        ),
        "base_price": 549,
        "course_codes": [
            "ENT-101", "ENT-102", "ENT-103", "ENT-104", "ENT-105",
            "ENT-106", "ENT-107", "ENT-108", "ENT-109", "ENT-110",
            "ENT-111", "ENT-112", "ENT-113", "ENT-114", "ENT-201",
            "ENT-202", "ENT-203", "ENT-204", "ENT-205", "ENT-206",
            "ENT-207", "ENT-208", "ENT-209", "ENT-210", "ENT-211",
            "ENT-212", "ENT-213", "ENT-214", "ENT-301", "ENT-302",
            "ENT-303", "ENT-304", "ENT-305", "ENT-306", "ENT-307",
            "ENT-308", "ENT-309", "ENT-310", "ENT-311", "ENT-312",
            "ENT-313", "ENT-314", "ENT-315", "ENT-401", "ENT-402",
            "ENT-403", "ENT-404", "ENT-405", "ENT-406", "ENT-407",
            "ENT-408", "ENT-409", "ENT-410", "ENT-411", "ENT-412"
        ],
    },
    {
        "key": "coaching",
        "name": "The Coaching Pathway",
        "summary": "The coach's own curriculum: philosophy and people skills, player and team architecture, stakeholders and NIL, then legacy.",
        "description": (
            "Written for the person running the program - coaching philosophy, decision-making "
            "under scrutiny, motivation, accountability and empathy; then development systems, "
            "practice design, superstars, captains and analytics; then parents, boosters, athletic "
            "department politics, NIL and compliance; closing on the head-coaching chair, the "
            "transfer portal, contracts, a mentorship tree and the exit."
        ),
        "base_price": 499,
        "course_codes": [
            "COH-101", "COH-102", "COH-103", "COH-104", "COH-105",
            "COH-106", "COH-107", "COH-108", "COH-109", "COH-110",
            "COH-111", "COH-112", "COH-201", "COH-202", "COH-203",
            "COH-204", "COH-205", "COH-206", "COH-207", "COH-208",
            "COH-209", "COH-210", "COH-211", "COH-212", "COH-213",
            "COH-301", "COH-302", "COH-303", "COH-304", "COH-305",
            "COH-306", "COH-307", "COH-308", "COH-309", "COH-310",
            "COH-311", "COH-312", "COH-313", "COH-401", "COH-402",
            "COH-403", "COH-404", "COH-405", "COH-406", "COH-407",
            "COH-408", "COH-409", "COH-410", "COH-411", "COH-412"
        ],
    },
]

# The nine tiers, in level order. `pathway_keys` are PATHWAY_DEFS keys and their
# list order becomes each TierPathway.order (1-based, per tier). A pathway may
# legitimately appear under more than one tier — TierPathway is a real M2M, not
# a Pathway.tier FK.
#
# Every tier now carries at least one pathway. Six of them were empty while the
# catalog was the client's three athlete pathways; the other six from the sheet
# are exactly the "later curriculum" that comment was waiting for, and they fill
# the tiers by audience rather than by sequence:
#
#   The Parent Playbook      -> The Parent Pathway (its whole reason to exist)
#   The Scholar's Foundation -> Cool Nerds, the non-athlete student track
#   The Career Launchpad     -> Cool Nerds again (resumes, interviews,
#                               internships) plus Athlete Life Skills, which is
#                               the same material for someone leaving sport
#   The Pathfinder           -> Athlete Life Skills and Entrepreneur: practical
#                               life skills, financial independence, a first
#                               business
#   The Business Elite Level -> Entrepreneur, the scaling/legal/exit half of it
#   Critical Thinking        -> Coaching. That tier is "high-stakes
#                               decision-makers across all domains", and
#                               COH-102 is game-theory application and risk
#                               assessment under scrutiny — the head coach is
#                               the decision-maker the client has curriculum
#                               for. Revisit if a coach-specific tier is added.
#
# Branding & Marketing sits under The Blueprint (early positioning, the
# footprint audit) and The Elite Level (its monetization half), which is the
# M2M doing what it is there for.
TIER_DEFS = [
    {
        "level": 1,
        "name": "The Blueprint",
        "audience": "8th-10th Grade Athletes",
        "focus_description": "Early positioning, academic foundations, and avoiding common pitfalls.",
        "category": "Athletic",
        "estimated_duration": "12 Months",
        "pathway_keys": ["mental_toughness", "branding_marketing"],
    },
    {
        "level": 2,
        "name": "The Parent Playbook",
        "audience": "Parents of Rising Elite Athletes",
        "focus_description": "Managing external pressures, vetting professionals, and protecting the family.",
        "category": "Foundation",
        "estimated_duration": "Ongoing",
        "pathway_keys": ["parent_pathway"],
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
        "pathway_keys": ["cool_nerds"],
    },
    {
        "level": 5,
        "name": "The Career Launchpad",
        "audience": "High School Upperclassmen and College Students (11th Grade - College)",
        "focus_description": "College admissions, internships, networking, and early career placement.",
        "category": "Academic",
        "estimated_duration": "6-9 Months",
        "pathway_keys": ["cool_nerds", "athlete_life_skills"],
    },
    {
        "level": 6,
        "name": "The Pathfinder",
        "audience": "11th Grade to Young Adults Exploring Trades, Vocational, or Alternative Paths",
        "focus_description": "Practical life skills, financial independence, career exploration, and self-discovery.",
        "category": "Vocational",
        "estimated_duration": "6 Months",
        "pathway_keys": ["athlete_life_skills", "entrepreneurship"],
    },
    {
        "level": 7,
        "name": "The Elite Level",
        "audience": "College Stars, Top-100 High School Recruits, and Pro-Bound Athletes",
        "focus_description": "NIL maximization, pro transition, complex contract negotiation, and foundational wealth building.",
        "category": "Athletic",
        "estimated_duration": "Year-Round",
        "pathway_keys": ["athlete_ceo", "branding_marketing"],
    },
    {
        "level": 8,
        "name": "The Business Elite Level",
        "audience": "High-Level Corporate Executives, Founders, and Business Leaders",
        "focus_description": "Business scaling, operational efficiency, AI integration, infrastructure building, and strategic resource allocation.",
        "category": "Professional",
        "estimated_duration": "6 Months",
        "pathway_keys": ["entrepreneurship"],
    },
    {
        "level": 9,
        "name": "Critical Thinking",
        "audience": "High-Stakes Decision-Makers Across All Domains",
        "focus_description": "Cognitive biases, mental models, risk assessment, game theory, and strategic execution.",
        "category": "Legacy",
        "estimated_duration": "Custom Iterative",
        "pathway_keys": ["coaching"],
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
# fifteen demo pathways, then shrank to three questions and eight options when
# the client's sheet left only the three athlete pathways to separate. The other
# six pathways from the sheet put the other audiences back: a parent, a coach, a
# non-athlete student and a would-be founder can all be told apart again, so the
# answers below are the three questions widened rather than rewritten.
#
# The three question TEXTS are deliberately unchanged. `_seed_questionnaire`
# get_or_creates a question by its text, so editing one on a server that has
# already been seeded would leave the old row standing next to the new one and
# show students a question whose answers weight nothing. New OPTIONS under an
# existing question are safe (they are upserted), which is why the business and
# coaching answers are filed under "What matters most to you in a curriculum?"
# rather than under the academic question where they would read oddly.
QUESTIONNAIRE = [
    {
        "text": "What best describes your current situation?",
        "options": [
            {"text": "I'm a competitive student-athlete balancing sports and school", "weights": {"mental_toughness": 2, "athlete_life_skills": 1}},
            {"text": "I'm an athlete in the middle of the recruiting window (11th-12th grade)", "weights": {"recruiting_readiness": 3}},
            {"text": "I'm a college or pro-bound athlete managing NIL opportunities", "weights": {"athlete_ceo": 3, "branding_marketing": 2}},
            {"text": "I'm a student who competes in the classroom rather than the stadium", "weights": {"cool_nerds": 3}},
            {"text": "I'm a parent supporting a student-athlete", "weights": {"parent_pathway": 3}},
            {"text": "I coach, train or mentor athletes", "weights": {"coaching": 3}},
        ],
    },
    {
        "text": "What's your top academic goal right now?",
        "options": [
            {"text": "Balancing athletics with strong academics", "weights": {"mental_toughness": 1}},
            {"text": "Earning a college athletic offer", "weights": {"recruiting_readiness": 3}},
            {"text": "Maximizing NIL and business opportunities as an athlete", "weights": {"athlete_ceo": 3}},
            {"text": "Leaving school ready for work, not just ready for exams", "weights": {"cool_nerds": 3, "athlete_life_skills": 1}},
            {"text": "Helping my student get the most out of school and sport", "weights": {"parent_pathway": 3}},
        ],
    },
    {
        "text": "What matters most to you in a curriculum?",
        "options": [
            {"text": "A clear roadmap through recruiting and NIL decisions", "weights": {"recruiting_readiness": 2, "athlete_ceo": 2}},
            {"text": "Sharper judgement under pressure and uncertainty", "weights": {"mental_toughness": 2}},
            {"text": "Practical life skills - money, time and relationships", "weights": {"athlete_life_skills": 2, "cool_nerds": 2}},
            {"text": "Turning an audience into sponsorships and income", "weights": {"branding_marketing": 3}},
            {"text": "Building and running a business of my own", "weights": {"entrepreneurship": 3}},
            {"text": "Developing the people I lead", "weights": {"coaching": 3, "parent_pathway": 1}},
        ],
    },
]


QUEST_DEFS = [
    {
        "title": "Audit your last 30 posts",
        "instructions": (
            "Scroll back through your last 30 posts. Delete or archive any that no longer "
            "represent the athlete and person you want a sponsor to see."
        ),
        "category": "AUDIT",
        "difficulty": "EASY",
        "points_reward": 15,
        "estimated_minutes": 15,
        "proof_hint": "Screenshot your cleaned-up profile grid",
    },
    {
        "title": "Rewrite your Instagram bio",
        "instructions": (
            "Rewrite your bio so it says who you are, what you play, your graduation year "
            "and what you stand for — in that order. No empty quotes."
        ),
        "category": "PROFILE",
        "difficulty": "EASY",
        "points_reward": 10,
        "estimated_minutes": 10,
        "proof_hint": "Screenshot your updated bio",
    },
    {
        "title": "Post a 15-second teammate highlight",
        "instructions": (
            "Record and post a 15-second video highlighting a teammate's work this week. "
            "Name them, say exactly what they did well."
        ),
        "category": "CONTENT",
        "difficulty": "MEDIUM",
        "points_reward": 25,
        "estimated_minutes": 20,
        "proof_hint": "Link the post or attach the clip",
    },
    {
        "title": "Reply to every comment from this week",
        "instructions": (
            "Go back through this week's posts and reply to every single comment. "
            "Engagement rate is what a sponsor actually pays for."
        ),
        "category": "ENGAGEMENT",
        "difficulty": "EASY",
        "points_reward": 10,
        "estimated_minutes": 15,
        "proof_hint": "Screenshot a few of your replies",
    },
    {
        "title": "Write down your three brand pillars",
        "instructions": (
            "Name the three things you want to be known for beyond your sport. Every post "
            "you make from now on should ladder up to one of them."
        ),
        "category": "REFLECTION",
        "difficulty": "EASY",
        "points_reward": 10,
        "estimated_minutes": 10,
        "proof_hint": "",
    },
    {
        "title": "Record your follower and engagement numbers",
        "instructions": (
            "Open the insights on each platform and write down your follower count, average "
            "likes and average views. These are the numbers a sponsor asks for first."
        ),
        "category": "AUDIT",
        "difficulty": "EASY",
        "points_reward": 15,
        "estimated_minutes": 10,
        "proof_hint": "Screenshot your insights page",
    },
    {
        "title": "Draft your one-line sponsorship pitch",
        "instructions": (
            "Write one sentence that tells a local business what they get by sponsoring you. "
            "Not what you need — what they get."
        ),
        "category": "OUTREACH",
        "difficulty": "MEDIUM",
        "points_reward": 25,
        "estimated_minutes": 20,
        "proof_hint": "",
    },
    {
        "title": "List five local businesses to approach",
        "instructions": (
            "Name five businesses within 20 minutes of you whose customers look like your "
            "audience. Find the owner's name for each one."
        ),
        "category": "OUTREACH",
        "difficulty": "MEDIUM",
        "points_reward": 25,
        "estimated_minutes": 25,
        "proof_hint": "",
    },
    {
        "title": "Post your training process, not just the result",
        "instructions": (
            "Post something from the unglamorous middle — the 6am session, the rehab, the "
            "film study. Process content is what builds an audience that stays."
        ),
        "category": "CONTENT",
        "difficulty": "MEDIUM",
        "points_reward": 20,
        "estimated_minutes": 20,
        "proof_hint": "Link the post",
    },
    {
        "title": "Thank someone who helped you this season",
        "instructions": (
            "Publicly thank a coach, trainer, parent or teammate. Be specific about what "
            "they did. Gratitude is the most underrated brand move there is."
        ),
        "category": "ENGAGEMENT",
        "difficulty": "EASY",
        "points_reward": 15,
        "estimated_minutes": 10,
        "proof_hint": "Link the post",
    },
]



SPEAKER_DEFS = [
    {
        "name": "Jordan Reyes",
        "headline": "D1 Wide Receiver — University of Oregon",
        "sport": "Football",
        "school": "University of Oregon",
        "graduation_year": 2027,
        "bio": (
            "Grew to 40k followers during his junior year of high school off film "
            "clips alone. Now runs his own NIL deals and has strong opinions about "
            "what he posted at 16."
        ),
        "instagram_handle": "@jordanreyes",
    },
    {
        "name": "Maya Torres",
        "headline": "D1 Track & Field — LSU",
        "sport": "Track & Field",
        "school": "Louisiana State University",
        "graduation_year": 2026,
        "bio": (
            "Signed three local sponsorships before she ever left her home town by "
            "treating her media kit like a business proposal, not a highlight reel."
        ),
        "instagram_handle": "@mayaruns",
    },
    {
        "name": "Deshawn Carter",
        "headline": "D1 Basketball — University of Kansas",
        "sport": "Basketball",
        "school": "University of Kansas",
        "graduation_year": 2027,
        "bio": (
            "Lost a scholarship offer over an old post and rebuilt his presence from "
            "scratch. Talks openly about the audit he wishes he had done earlier."
        ),
        "instagram_handle": "@dcarterhoops",
    },
    {
        "name": "Alina Park",
        "headline": "D1 Soccer — Stanford University",
        "sport": "Soccer",
        "school": "Stanford University",
        "graduation_year": 2026,
        "bio": (
            "Built an audience of coaches and recruiters rather than chasing follower "
            "count, and explains why the smaller number was worth more."
        ),
        "instagram_handle": "@alinapark",
    },
]

# War Room Live runs monthly. Offsets are relative to the seed date so a fresh
# environment always has one finished session (with a recording to watch) and
# two scheduled ahead of it, rather than a wall of stale past dates.
LIVE_SESSION_DEFS = [
    {
        "title": "Mistakes I Made Posting Online",
        "topic": "Brand Audit",
        "days_offset": -30,
        "duration_minutes": 60,
        "speakers": ["Deshawn Carter"],
        "description": (
            "An honest hour on the posts that cost him opportunities — what recruiters "
            "actually look for, and how to audit years of history without deleting "
            "everything that made you interesting."
        ),
        "talking_points": [
            "The post that cost me an offer",
            "How coaches really check your socials",
            "Auditing without erasing your personality",
            "Rebuilding after you've cleaned house",
        ],
        "recording_url": "https://example.com/warroom/mistakes-i-made-posting-online",
        "recap": (
            "Key takeaway: recruiters look for patterns, not single posts. Deshawn's "
            "rule — if you would not say it in front of a coach, a parent and a "
            "sponsor at the same time, it does not go up."
        ),
    },
    {
        "title": "Building Your Brand in High School",
        "topic": "Getting Started",
        "days_offset": 14,
        "duration_minutes": 60,
        "speakers": ["Jordan Reyes", "Alina Park"],
        "description": (
            "Two current college athletes on what actually worked for them before they "
            "signed — and the things they wasted a year on."
        ),
        "talking_points": [
            "What worked for me in high school",
            "How I grew my following without going viral",
            "Why follower count is the wrong target",
            "What I wish I had done differently",
        ],
    },
    {
        "title": "Landing Your First Local Sponsor",
        "topic": "Sponsorship",
        "days_offset": 45,
        "duration_minutes": 60,
        "speakers": ["Maya Torres"],
        "description": (
            "How to approach a local business, what to put in front of them, and what "
            "to do when they say no the first time."
        ),
        "talking_points": [
            "Finding businesses whose customers are your audience",
            "What a sponsor needs to see in your media kit",
            "Pricing your first package",
            "Following up without being annoying",
        ],
    },
]


# The client's LS-302 "No Muscle" module, verbatim in substance: three
# pressure situations, one per relationship the brief names (family, friends,
# community), each with the A.B.P. model answer it teaches.
#
# `opening_message` is the role-play prompt from the brief — the counterpart's
# first line is authored rather than generated, so every student meets the
# same pitch and starting a scene costs no model call (see
# wargamer/models.py::RolePlayScenario).
#
# Every scenario uses the GUILT_TRIP persona. All three turn on emotional
# debt, and a counterpart who is persistent without being hostile is what
# keeps the exercise realistic — an admin can raise a single scenario to
# AGGRESSIVE or PERSISTENT from the portal when they want it harder.
ROLEPLAY_SCENARIO_DEFS = [
    {
        "code": "LS-302-S1",
        "title": 'The Financial "Investment"',
        "relationship": "FAMILY",
        "pressure_type": "FINANCIAL",
        "key_skill": "Financial boundaries",
        "counterpart_role": "Your older cousin",
        "setup": (
            "You have just signed your first major NIL deal. At a family gathering, an older "
            "cousin pulls you aside with a \u201cguaranteed\u201d business idea and asks you to put in "
            "$10,000 to get it started \u2014 reminding you, more than once, how they looked out "
            "for you growing up."
        ),
        "opening_message": (
            "Look man, I\u2019ve got this apparel brand ready to launch. I just need $10k to get the "
            "first inventory order. You know I bought your cleats back in middle school when "
            "things were tight. This is family wealth we\u2019re building \u2014 I wouldn\u2019t ask if it "
            "wasn\u2019t a sure thing."
        ),
        "exercise": (
            "Decline the investment without insulting your cousin\u2019s business sense and without "
            "sounding arrogant about your new income."
        ),
        "ideal_acknowledge": (
            "I appreciate you bringing this to me, and I\u2019ll never forget how you looked out for "
            "me when I was younger."
        ),
        "ideal_boundary": (
            "Right now I have a rule I set with my family about money: nothing goes into private "
            "businesses or loans outside my plan. That\u2019s not a this-deal thing, it\u2019s every deal."
        ),
        "ideal_pivot": (
            "I can\u2019t put money in, but if you launch an online store, send me the link and I\u2019ll "
            "share it on my socials to get some eyes on it."
        ),
        "persona": "GUILT_TRIP",
        "difficulty": "MEDIUM",
        "points_reward": 50,
        "order": 1,
    },
    {
        "code": "LS-302-S2",
        "title": "The VIP Access Expectation",
        "relationship": "FRIENDS",
        "pressure_type": "ACCESS",
        "key_skill": "Social boundaries",
        "counterpart_role": "Three childhood friends",
        "setup": (
            "You have been invited to an exclusive recruiting event and you are allowed a strict "
            "plus-one. Three childhood friends expect you to pull strings and get all of them in, "
            "assuming your status means the rules bend for you."
        ),
        "opening_message": (
            "Bro, just tell the bouncer or the event coordinator you\u2019re with us. You\u2019re the star "
            "recruit \u2014 they aren\u2019t going to tell you no. If you go in there and leave us out "
            "here, you\u2019re changing on us."
        ),
        "exercise": (
            "Hold the line on the event\u2019s rules without folding to the accusation that you are "
            "\u201cchanging\u201d or acting better than your hometown friends."
        ),
        "ideal_acknowledge": "I want you guys in there with me just as much as you want to be there.",
        "ideal_boundary": (
            "But I don\u2019t control the door, and this event has a strict security list. If I try to "
            "force three extra people in, it makes me look unprofessional in front of the coaches "
            "and organisers watching me tonight."
        ),
        "ideal_pivot": (
            "I have to handle business inside tonight, but let\u2019s grab food tomorrow at our usual "
            "spot and I\u2019ll fill you in on everything."
        ),
        "persona": "GUILT_TRIP",
        "difficulty": "MEDIUM",
        "points_reward": 50,
        "order": 2,
    },
    {
        "code": "LS-302-S3",
        "title": "The Time & Energy Drain",
        "relationship": "COMMUNITY",
        "pressure_type": "TIME",
        "key_skill": "Time and energy management",
        "counterpart_role": "A community figure from your neighbourhood",
        "setup": (
            "It is 9:00 PM on a Thursday and you have a critical game tomorrow night that heavy "
            "recruiters will be attending. An extended family member and local community figure "
            "calls, demanding you show up to a late-night social event to \u201cshow face\u201d and take "
            "pictures \u2014 implying that skipping it means you are arrogant."
        ),
        "opening_message": (
            "We have the whole neighbourhood at the hall right now waiting for you. It\u2019s just for "
            "an hour. People are saying you think you\u2019re too good for us now that you\u2019re getting "
            "all these offers. Just come take some pictures and you can leave."
        ),
        "exercise": (
            "Protect your sleep and your pre-game mental state, enforcing a hard cutoff time "
            "against community pressure \u2014 without appearing ungrateful."
        ),
        "ideal_acknowledge": (
            "It means a lot that everyone is there and wants to see me. I love representing our city."
        ),
        "ideal_boundary": (
            "But I keep a 24-hour pre-game routine, and I\u2019m already in it for tomorrow night. I "
            "don\u2019t make appearances inside that window \u2014 for anybody."
        ),
        "ideal_pivot": (
            "I can\u2019t make it out tonight, but please tell everyone thank you for the support, and "
            "I hope to see you all in the stands tomorrow."
        ),
        "persona": "GUILT_TRIP",
        "difficulty": "HARD",
        "points_reward": 60,
        "order": 3,
    },
]


# ---------------------------------------------------------------------------
# Three more situations beyond the client's brief, which specified only the
# three above. These exist so the other personas are exercisable without an
# admin having to hand-write a scenario first: one each for the persistent
# negotiator, the passive-aggressive and the aggressive counterpart. Delete
# this block if the client wants LS-302 to stay at exactly three.
# ---------------------------------------------------------------------------
ROLEPLAY_SCENARIO_DEFS += [
    {
        "code": "LS-302-S4",
        "title": "The Shrinking Ask",
        "relationship": "FRIENDS",
        "pressure_type": "FINANCIAL",
        "key_skill": "Financial boundaries",
        "counterpart_role": "A friend from your group chat",
        "setup": (
            "A friend wants you to bankroll a party bus for homecoming weekend. Every time "
            "you say no, the number gets smaller \u2014 and the ask never actually ends."
        ),
        "opening_message": (
            "So the bus is $2,000 for the night. If you cover it, everybody comes. You\u2019re the "
            "only one of us who can even do that right now."
        ),
        "exercise": (
            "End the negotiation instead of winning each round of it \u2014 a smaller number is "
            "still the same ask."
        ),
        "ideal_acknowledge": "I know you\u2019ve been planning this weekend for months, and I want it to go off.",
        "ideal_boundary": (
            "I\u2019m not funding it, at any number. I put myself on a fixed monthly budget and "
            "group spending isn\u2019t in it \u2014 that\u2019s the whole answer, not an opening offer."
        ),
        "ideal_pivot": (
            "I\u2019ll be on the bus and I\u2019ll pay my own seat like everybody else. Put me down for one."
        ),
        "persona": "PERSISTENT",
        "difficulty": "HARD",
        "points_reward": 55,
        "order": 4,
    },
    {
        "code": "LS-302-S5",
        "title": "The Favour That Was Never Asked For",
        "relationship": "COMMUNITY",
        "pressure_type": "ACCESS",
        "key_skill": "Social boundaries",
        "counterpart_role": "A local booster",
        "setup": (
            "A local businessman who sponsored your team\u2019s uniforms two years ago now wants "
            "an introduction to your trainer and your contacts \u2014 and keeps implying you owe "
            "him for it."
        ),
        "opening_message": (
            "It\u2019s fine, don\u2019t worry about it. I just thought after the uniforms I\u2019d at least "
            "get a phone number out of you. Everybody says you\u2019ve got a short memory now."
        ),
        "exercise": (
            "Refuse to pass on contacts you don\u2019t control, without accepting a debt you never "
            "agreed to."
        ),
        "ideal_acknowledge": "Those uniforms meant a lot to the team that year, and I\u2019ve said thank you publicly.",
        "ideal_boundary": (
            "I don\u2019t pass on my trainer\u2019s number, for anyone. He takes referrals through his "
            "own office and that\u2019s his rule, not mine to bend."
        ),
        "ideal_pivot": "I\u2019ll send you his office page \u2014 you can reach out directly and say I sent you.",
        "persona": "PASSIVE_AGGRESSIVE",
        "difficulty": "MEDIUM",
        "points_reward": 50,
        "order": 5,
    },
    {
        "code": "LS-302-S6",
        "title": "The Weekend Shift",
        "relationship": "FAMILY",
        "pressure_type": "TIME",
        "key_skill": "Time and energy management",
        "counterpart_role": "Your uncle, who runs the family shop",
        "setup": (
            "Your uncle expects you back on weekend shifts at the family shop now that the "
            "season has started \u2014 the same Saturdays you train and travel \u2014 and he is not "
            "asking politely."
        ),
        "opening_message": (
            "I had you on the schedule for Saturday. This shop paid for your equipment for six "
            "years and now you\u2019re too busy? Be here at eight."
        ),
        "exercise": (
            "Hold your training schedule against a direct order from someone with real "
            "authority over you, without escalating it into a family fight."
        ),
        "ideal_acknowledge": "This shop is the reason I had anything to train with, and I\u2019m not pretending otherwise.",
        "ideal_boundary": (
            "I can\u2019t take Saturdays during the season. My travel and training schedule is set "
            "by the programme through March and I don\u2019t get to move it."
        ),
        "ideal_pivot": "I can do Sunday evenings and the whole of spring break \u2014 put me on for those.",
        "persona": "AGGRESSIVE",
        "difficulty": "HARD",
        "points_reward": 60,
        "order": 6,
    },
]


# ---------------------------------------------------------------------------
# Demo role-play runs, so every Tactical Wargamer screen has something in it
# on a fresh environment: the admin activity feed, a student's Past Runs
# table, the module stat strip and the report card all read from session
# rows, and a catalog alone leaves every one of them empty.
#
# Seeded against the demo students (student1@example.com upwards) only, the
# same way _seed_instructor_feedback seeds reviews from the demo reviewers.
# The opening counterpart line is NOT written out here \u2014 the seeder takes it
# from the scenario, exactly as services.start_session does, so a transcript
# can never drift from the catalog copy above it.
#
# Between them these cover every state the UI renders: a strong pass, a
# failed run (with an empty strengths list, which is its own empty state), a
# pass that leaned on an invented authority, a resumable conversation, one
# the student walked away from, and one whose scoring call failed.
# ---------------------------------------------------------------------------
ROLEPLAY_RUN_DEFS = [
    {
        "scenario_code": "LS-302-S1",
        "student_index": 0,
        "days_ago": 9,
        "status": "COMPLETED",
        "conceded": True,
        "turns": [
            {
                "speaker": "ATHLETE",
                "seconds": 22,
                "content": (
                    "I appreciate you bringing this to me, and I\u2019ve never forgotten you buying "
                    "my cleats when things were tight. But I can\u2019t put money into it. I set a "
                    "rule with my family when the deal closed: nothing goes into private "
                    "businesses or loans, no exceptions."
                ),
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 31,
                "pressure": 4,
                "content": (
                    "Rules? Come on now, you\u2019re the one who makes the rules these days. I\u2019m not "
                    "some stranger off the street asking you for a favour \u2014 I\u2019m family."
                ),
            },
            {
                "speaker": "ATHLETE",
                "seconds": 58,
                "content": (
                    "That\u2019s exactly why I\u2019m telling you straight instead of ducking your calls. "
                    "The rule isn\u2019t about you \u2014 it\u2019s so I never have to choose between family "
                    "and a balance sheet. What I can do is put your launch in front of my "
                    "followers the day it goes live."
                ),
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 70,
                "pressure": 3,
                "content": "So that\u2019s a no on the money. Just say it plain.",
            },
            {
                "speaker": "ATHLETE",
                "seconds": 88,
                "content": (
                    "That\u2019s a no on the money. The share is a yes and I mean it \u2014 send me the "
                    "link when you\u2019ve got one."
                ),
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 96,
                "pressure": 1,
                "content": "Alright. I\u2019ll take the share. Appreciate you being straight with me.",
            },
        ],
        "report": {
            "time_to_boundary_score": 92,
            "tone_control_score": 86,
            "deflection_to_policy_score": 90,
            "boundary_turn": 1,
            "verdict": "Held the line",
            "summary": (
                "You refused in your first message, stayed warm the whole way through, and "
                "closed the negotiation instead of leaving it hanging. That is what the method "
                "looks like when it works."
            ),
            "criteria_notes": {
                "time_to_boundary": "Your first message contained an unambiguous \u201cI can\u2019t put money into it\u201d.",
                "tone_control": "You stayed steady when he called the rule an excuse, and never got defensive.",
                "deflection_to_policy": "You pointed at a rule you already keep rather than judging his idea.",
            },
            "strengths": [
                {
                    "title": "Acknowledged something specific",
                    "detail": "The cleats. Naming the real thing he did is what stopped the no from landing cold.",
                },
                {
                    "title": "Repeated the boundary without changing it",
                    "detail": "When he pushed, you restated the same rule in the same words instead of negotiating.",
                },
                {
                    "title": "Closed it out",
                    "detail": "\u201cSend me the link\u201d ends the conversation on something you can actually deliver.",
                },
            ],
            "improvements": [
                {
                    "title": "Lead with the acknowledge, then stop",
                    "detail": "Your first message ran four sentences. The same words in two would hit harder.",
                },
                {
                    "title": "Name what the share is worth",
                    "detail": "\u201cI\u2019ll put it in front of 14,000 people\u201d makes the pivot feel like a real offer, not a consolation prize.",
                },
            ],
            "suggested_response": (
                "You bought my cleats when nobody else was going to \u2014 I remember. I can\u2019t put "
                "money in, though. I have a rule with my family that nothing goes into private "
                "businesses, and that\u2019s every deal, not just this one. When you launch, send me "
                "the link and I\u2019ll put it in front of my followers."
            ),
            "used_fabricated_excuse": False,
            "fabrication_note": "",
        },
    },
    {
        "scenario_code": "LS-302-S1",
        "student_index": 1,
        "days_ago": 6,
        "status": "COMPLETED",
        "turns": [
            {
                "speaker": "ATHLETE",
                "seconds": 41,
                "content": (
                    "Hey, that... I mean, that sounds cool honestly. Let me think about it? "
                    "Maybe I could do something, I\u2019m not sure how much."
                ),
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 52,
                "pressure": 5,
                "content": (
                    "What\u2019s there to think about? I\u2019m not asking for a handout, I\u2019m offering "
                    "you a piece of it. You know I\u2019d do it for you in a heartbeat."
                ),
            },
            {
                "speaker": "ATHLETE",
                "seconds": 96,
                "content": (
                    "I know, I know. I feel bad about it honestly. Maybe like a couple thousand? "
                    "I\u2019d have to ask somebody first."
                ),
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 108,
                "pressure": 5,
                "content": (
                    "A couple thousand doesn\u2019t get the order made. Do the ten and you\u2019ll have "
                    "it back by spring. Ask whoever you need to ask and call me tonight."
                ),
            },
            {
                "speaker": "ATHLETE",
                "seconds": 150,
                "content": "Okay. Let me see what I can do and I\u2019ll text you.",
            },
        ],
        "report": {
            "time_to_boundary_score": 14,
            "tone_control_score": 52,
            "deflection_to_policy_score": 18,
            "boundary_turn": 0,
            "verdict": "Left the door wide open",
            "summary": (
                "You never actually said no. Every message was a softer version of maybe, and "
                "by the end you had agreed to go and find the money. From his side of that "
                "conversation, he got a yes."
            ),
            "criteria_notes": {
                "time_to_boundary": "No refusal appears anywhere in the transcript \u2014 \u201clet me think about it\u201d is a delay, not a boundary.",
                "tone_control": "You stayed calm, but the apologising (\u201cI feel bad\u201d) handed him the next move.",
                "deflection_to_policy": "You reached for \u201cI\u2019d have to ask somebody\u201d, which invites him to wait rather than stop.",
            },
            "strengths": [],
            "improvements": [
                {
                    "title": "Say the word no",
                    "detail": "Nothing else in this exercise counts until a refusal is actually on the table.",
                },
                {
                    "title": "Stop negotiating against yourself",
                    "detail": "You offered two thousand before he asked for less. That tells him the number is movable.",
                },
                {
                    "title": "Drop \u201cI\u2019d have to ask somebody\u201d",
                    "detail": "It makes someone else the decision-maker and guarantees a second conversation.",
                },
                {
                    "title": "Don\u2019t apologise for having a rule",
                    "detail": "\u201cI feel bad\u201d is the opening he used to push again. Warm is good; sorry is not.",
                },
            ],
            "suggested_response": (
                "I appreciate you thinking of me first, I really do. I can\u2019t invest though \u2014 I "
                "keep a hard line that none of my money goes into private businesses, and that "
                "isn\u2019t going to change this month or next. If you get it off the ground, I\u2019ll "
                "share it with my followers the day you launch."
            ),
            "used_fabricated_excuse": False,
            "fabrication_note": "",
        },
    },
    {
        "scenario_code": "LS-302-S2",
        "student_index": 0,
        "days_ago": 4,
        "status": "COMPLETED",
        "conceded": True,
        "turns": [
            {
                "speaker": "ATHLETE",
                "seconds": 16,
                "content": "My agent handles the guest list, I literally can\u2019t add names to it.",
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 24,
                "pressure": 4,
                "content": (
                    "Your agent? Two months ago you were riding with us in Marcus\u2019s car. Now "
                    "you\u2019ve got people who handle things."
                ),
            },
            {
                "speaker": "ATHLETE",
                "seconds": 49,
                "content": (
                    "I hear you. But I don\u2019t control that door tonight \u2014 there\u2019s a security "
                    "list, and if I push three extra names onto it I\u2019m the one who looks "
                    "unprofessional in front of the coaches who are in that room."
                ),
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 60,
                "pressure": 3,
                "content": "So we drove all the way out here for nothing.",
            },
            {
                "speaker": "ATHLETE",
                "seconds": 84,
                "content": (
                    "Not for nothing. I\u2019m out by ten \u2014 let\u2019s hit the usual spot after and I\u2019ll "
                    "tell you everything that happened in there."
                ),
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 92,
                "pressure": 1,
                "content": "Fine. Ten o\u2019clock. Don\u2019t leave us sitting out here.",
            },
        ],
        "report": {
            "time_to_boundary_score": 88,
            "tone_control_score": 76,
            "deflection_to_policy_score": 64,
            "boundary_turn": 1,
            "verdict": "Held it, on the wrong foundation",
            "summary": (
                "You refused immediately and recovered well, and the pivot landed. The problem "
                "is what you refused with: the first thing out of your mouth was an agent, and "
                "the real reason \u2014 the security list \u2014 only arrived once he pushed."
            ),
            "criteria_notes": {
                "time_to_boundary": "A clear no in your first message, inside twenty seconds.",
                "tone_control": "Steady, though \u201cI hear you\u201d did a lot of work it shouldn\u2019t have had to.",
                "deflection_to_policy": "The security list is a real constraint; the agent is not, and you led with the agent.",
            },
            "strengths": [
                {
                    "title": "Refused in one line",
                    "detail": "No build-up, no hedging. He knew the answer before his second message.",
                },
                {
                    "title": "The pivot was specific",
                    "detail": "A time and a place beats \u201clet\u2019s link up sometime\u201d every single time.",
                },
            ],
            "improvements": [
                {
                    "title": "Lead with the real constraint",
                    "detail": "Your second message was the right first message. Open with the security list.",
                },
                {
                    "title": "Acknowledge before you refuse",
                    "detail": "You skipped the A entirely, which is why his comeback was about you changing.",
                },
            ],
            "suggested_response": (
                "I want you three in there with me as much as you want to be in there. I don\u2019t "
                "control the door though \u2014 it\u2019s a security list and I\u2019m one name on it. If I "
                "try to force three more, I look unprofessional in front of the people I came "
                "here to impress. I\u2019m out by ten; usual spot, and I\u2019ll tell you everything."
            ),
            "used_fabricated_excuse": True,
            "fabrication_note": (
                "You opened with \u201cmy agent handles the guest list\u201d. A high-school athlete "
                "very rarely has an agent, and the first time someone checks, the boundary "
                "collapses and so does your credibility. The security list you reached for in "
                "your second message was true and did exactly the same job \u2014 lead with that."
            ),
        },
    },
    {
        "scenario_code": "LS-302-S3",
        "student_index": 0,
        "days_ago": 1,
        "status": "IN_PROGRESS",
        "turns": [
            {
                "speaker": "ATHLETE",
                "seconds": 19,
                "content": "It means a lot that everybody\u2019s out there \u2014 I love repping the city, you know that.",
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 29,
                "pressure": 4,
                "content": "Then show your face. Twenty minutes, a few pictures, and you\u2019re gone. That\u2019s nothing.",
            },
        ],
    },
    {
        "scenario_code": "LS-302-S3",
        "student_index": 1,
        "days_ago": 3,
        "status": "ABANDONED",
        "turns": [
            {
                "speaker": "ATHLETE",
                "seconds": 27,
                "content": "I can\u2019t come out tonight, I\u2019ve got a game tomorrow.",
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 38,
                "pressure": 5,
                "content": (
                    "One hour. The whole neighbourhood is sitting here. You can\u2019t give your own "
                    "people one hour out of your night?"
                ),
            },
        ],
    },
    {
        "scenario_code": "LS-302-S4",
        "student_index": 2,
        "days_ago": 2,
        "status": "EVALUATING",
        "error_message": (
            "The scoring service is busy right now. Try again in a moment \u2014 your conversation "
            "is saved."
        ),
        "turns": [
            {
                "speaker": "ATHLETE",
                "seconds": 24,
                "content": "I\u2019m not covering the bus. I\u2019ll pay for my own seat like everybody else.",
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 33,
                "pressure": 4,
                "content": "Okay, okay \u2014 what if it\u2019s just the deposit? Five hundred and the rest of us split the rest.",
            },
            {
                "speaker": "ATHLETE",
                "seconds": 61,
                "content": (
                    "Same answer. It\u2019s not the number, it\u2019s that group spending isn\u2019t in my "
                    "budget at all. My seat, same as yours."
                ),
            },
            {
                "speaker": "COUNTERPART",
                "seconds": 72,
                "pressure": 3,
                "content": "Then just cover the driver\u2019s tip. That\u2019s like sixty bucks, you won\u2019t even feel it.",
            },
        ],
    },
]


class Command(BaseCommand):
    help = (
        "Seeds the catalog: the canonical categories, teachers, students, the client's 30 Cool "
        "Nerds courses (each with a random-but-deterministic price, 1-2 modules, 1-2 lessons per "
        "module, one assignment and one quiz), 3 pathways, tiers, bundle pricing rules, the "
        "onboarding questionnaire, and the Daily Drill bank. "
        "By default only two things are deleted (see `_reset_catalog`): the 629 retired Numa "
        "demo courses, and the seeded pathways, which are rebuilt from PATHWAY_DEFS. Everything "
        "else is upserted by its natural key, so other courses, user accounts, course "
        "enrollments, progress and students' own custom pathways all survive and this is safe "
        "to run against a server that already holds real data. Pass --fresh to instead wipe "
        "every row except admin accounts first, for a server you mean to rebuild from scratch. "
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
            "--fresh",
            action="store_true",
            help=(
                "Start from an empty database: delete EVERY row except admin accounts and "
                "superusers, then seed. Destroys real student accounts, enrolments, purchases "
                "and progress — only for a server you intend to rebuild from scratch. Without "
                "it, the command preserves all of that (see `_reset_catalog`)."
            ),
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
        self._validate_course_content()

        fresh = options["fresh"]

        if not options["noinput"]:
            if fresh:
                others = User.objects.exclude(role=User.Roles.ADMIN).exclude(
                    is_superuser=True
                ).count()
                prompt = (
                    "--fresh: this DELETES EVERY ROW except admin accounts and superusers — "
                    f"all {Course.objects.count()} course(s), {others} teacher/student "
                    "account(s) and with them every enrolment, purchase, submission and "
                    "progress record, plus all pathways (including students' own custom "
                    "bundles), tiers, categories, tags, drills and onboarding answers.\n"
                    "THIS DESTROYS REAL USER DATA. Only do it on a server you mean to rebuild "
                    "from scratch; without --fresh the command preserves all of it.\n"
                )
            else:
                retired = Course.objects.filter(code__in=RETIRED_COURSE_CODES).count()
                stale = (
                    Pathway.objects.filter(is_custom=False)
                    .exclude(name__in=[pathway_def["name"] for pathway_def in PATHWAY_DEFS])
                    .count()
                )
                prompt = (
                    f"This DELETES {retired} retired Numa course(s) — along with their modules, "
                    "lessons, enrolments and progress — and "
                    f"{stale} stale seeded pathway(s) that are no longer in the catalog.\n"
                    "PRESERVED: every other course (including any an admin added by hand), "
                    "the nine current pathways and their ids, pathway purchases, categories, "
                    "tags, user accounts, course enrollments, progress, daily drills, "
                    "onboarding answers and progress, and students' own custom pathways. "
                    "Everything else is upserted, so re-running only adds or updates.\n"
                )
                placeholders = Module.objects.filter(
                    course__code__in=COURSE_CONTENT, title__in=GENERATED_MODULE_TITLES
                ).count()
                if placeholders:
                    prompt += (
                        f"It also replaces {placeholders} auto-generated placeholder module(s) "
                        f"in the {len(COURSE_CONTENT)} course(s) that now carry written "
                        "curriculum, deleting their lessons, assignments, quizzes and any "
                        "progress or submissions against them.\n"
                    )

            confirm = input(
                prompt
                + f"It then seeds {len(COURSE_DEFS)} Cool Nerds course(s), "
                f"{len(PATHWAY_DEFS)} pathway(s), {len(TIER_DEFS)} tier(s), "
                f"{len(TEACHER_NAMES)} teacher(s), "
                f"{len(STUDENT_NAMES) + len(REVIEWER_NAMES)} student(s), the admin, bundle "
                f"rules, {len(QUESTIONNAIRE)} onboarding question(s) and "
                f"{len(DRILL_DEFS)} daily drill(s).\n"
                "The regular demo students will NOT be auto-enrolled in any course (only the "
                "demo reviewers are, so instructor feedback matches real enrollments).\n"
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
            if fresh:
                self._reset_everything()
                self.stdout.write(
                    self.style.WARNING("--fresh: cleared every row (admin accounts preserved)")
                )
            else:
                retired_courses, removed_pathways = self._reset_catalog()
                self.stdout.write(
                    self.style.WARNING(
                        f"Removed {retired_courses} retired course(s) and {removed_pathways} "
                        "stale pathway(s) — everything else preserved"
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

            self._seed_quests()
            self.stdout.write(self.style.SUCCESS(f"Seeded {len(QUEST_DEFS)} daily quests"))

            self._seed_roleplay_scenarios()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Seeded {len(ROLEPLAY_SCENARIO_DEFS)} Tactical Wargamer role-play scenarios"
                )
            )

            roleplay_runs = self._seed_roleplay_demo_runs(students)
            self.stdout.write(
                self.style.SUCCESS(f"Seeded {roleplay_runs} demo role-play run(s)")
            )

            self._seed_war_room_live()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Seeded {len(SPEAKER_DEFS)} War Room Live speakers and "
                    f"{len(LIVE_SESSION_DEFS)} sessions"
                )
            )

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
        assets = {
            "provider_thumbnails": {},
            "lessons": {},
            "instructor_avatars": [],
            "handouts": {},
        }

        if skip:
            self.stdout.write(
                self.style.WARNING("--skip-assets: seeding without thumbnails or lesson files")
            )
            return assets

        assets["handouts"] = self._build_handouts()

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
                f"{len(assets['lessons'])} shared lesson file(s), "
                f"{len(assets['handouts'])} course handout(s) and "
                f"{len(assets['provider_thumbnails'])} provider thumbnail(s) in media storage"
            )
        )
        return assets

    def _build_handouts(self):
        """Renders the handout every authored module carries, into media storage.

        The 210 courses without written curriculum still share one demo PDF and
        one demo DOCX, which is honest filler for a lesson nobody has authored.
        An authored module is different: its third lesson is a named worksheet
        that the two lessons beside it tell the student to fill in, so it is
        rendered from the same `_course_content` entry that wrote them
        (`_handouts.py`). Returns {(course code, module order): stored path};
        a handout that could not be rendered is simply absent and its lesson
        seeds without a file, the same degradation as a failed download.
        """
        built = {}
        failures = 0

        for code, modules_def in COURSE_CONTENT.items():
            for module_order, module_def in enumerate(modules_def, start=1):
                lesson_def = next(
                    lesson
                    for lesson in module_def["lessons"]
                    if lesson["type"] in AUTHORED_HANDOUT_TYPES
                )
                is_pdf = lesson_def["type"] == Lesson.ContentType.PDF
                if is_pdf and not PDF_AVAILABLE:
                    failures += 1
                    continue

                subtitle = f"{code} \u00b7 Module {module_order} \u00b7 {module_def['title']}"
                buffer = BytesIO()
                try:
                    render = build_handout_pdf if is_pdf else build_handout_docx
                    render(lesson_def["handout"], lesson_def["title"], subtitle, buffer)
                except Exception as exc:  # noqa: BLE001 - one bad handout must not abort the seed
                    self.stdout.write(
                        self.style.WARNING(
                            f"Could not render the handout for {code} module {module_order} "
                            f"({exc}) — that lesson will seed without a file."
                        )
                    )
                    failures += 1
                    continue

                path = handout_path(code, module_order, lesson_def["type"])
                # Overwritten rather than reused: unlike a downloaded asset, this
                # file's content changes whenever `_course_content` does.
                if default_storage.exists(path):
                    default_storage.delete(path)
                built[(code, module_order)] = default_storage.save(
                    path, ContentFile(buffer.getvalue())
                )

        if failures and not PDF_AVAILABLE:
            self.stdout.write(
                self.style.WARNING(
                    f"reportlab is not installed — {failures} PDF handout(s) were skipped. "
                    "Install it (it is in requirements.txt) to seed them."
                )
            )
        return built

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

    def _validate_course_content(self):
        """Fails fast on an unusable `_course_content` entry.

        Every mistake below is one the seed would otherwise carry into the
        database and only show up in a student's browser: a module titled like
        a generated placeholder would be deleted by `_replace_generated_modules`
        the moment it was written, two lessons sharing a title would collapse
        into one row on upsert, and a quiz question with a bad answer index
        would be unanswerable.
        """
        unknown = sorted(set(COURSE_CONTENT) - {cd["code"] for cd in COURSE_DEFS})
        if unknown:
            raise CommandError(
                "COURSE_CONTENT has curriculum for course code(s) that are not in "
                "COURSE_DEFS: " + ", ".join(unknown)
            )

        for code, modules_def in COURSE_CONTENT.items():
            if not modules_def:
                raise CommandError(f"COURSE_CONTENT[{code}] has no modules")

            titles = [module_def["title"] for module_def in modules_def]
            duplicates = sorted(t for t, n in Counter(titles).items() if n > 1)
            if duplicates:
                raise CommandError(
                    f"COURSE_CONTENT[{code}] repeats module title(s): " + ", ".join(duplicates)
                )
            clashes = sorted(set(titles) & set(GENERATED_MODULE_TITLES))
            if clashes:
                raise CommandError(
                    f"COURSE_CONTENT[{code}] uses the generated placeholder module title(s) "
                    + ", ".join(clashes)
                    + " — `_replace_generated_modules` would delete them on the next reseed"
                )

            for module_def in modules_def:
                where = f"COURSE_CONTENT[{code}] / {module_def['title']}"
                lessons = module_def["lessons"]
                if not lessons:
                    raise CommandError(f"{where} has no lessons")

                lesson_titles = [lesson_def["title"] for lesson_def in lessons]
                if len(set(lesson_titles)) != len(lesson_titles):
                    raise CommandError(f"{where} repeats a lesson title")

                for lesson_def in lessons:
                    if lesson_def["type"] not in AUTHORED_LESSON_TYPES:
                        raise CommandError(
                            f"{where} / {lesson_def['title']} has unsupported content type "
                            f"{lesson_def['type']}"
                        )
                    if not lesson_def["body"].strip():
                        raise CommandError(f"{where} / {lesson_def['title']} has no content")
                    if lesson_def["type"] in AUTHORED_HANDOUT_TYPES:
                        self._validate_handout(f"{where} / {lesson_def['title']}", lesson_def)

                for index, question_def in enumerate(module_def["quiz"]["questions"], start=1):
                    choices = question_def["choices"]
                    if len(choices) != CHOICES_PER_QUESTION or len(set(choices)) != len(choices):
                        raise CommandError(
                            f"{where} quiz question {index} needs "
                            f"{CHOICES_PER_QUESTION} distinct choices"
                        )
                    if not 0 <= question_def["answer"] < len(choices):
                        raise CommandError(
                            f"{where} quiz question {index} has an out-of-range answer index"
                        )

    def _validate_handout(self, where, lesson_def):
        """A handout renders straight into a student's download, so a spec that
        is missing a heading or has a ragged table is caught here rather than in
        reportlab's traceback halfway through a seed."""
        handout = lesson_def.get("handout")
        if not handout or not handout.get("intro", "").strip():
            raise CommandError(f"{where} has no handout intro")
        if not handout.get("sections"):
            raise CommandError(f"{where} has a handout with no sections")

        for index, section in enumerate(handout["sections"], start=1):
            if not section.get("heading", "").strip():
                raise CommandError(f"{where} handout section {index} has no heading")
            if not any(
                section.get(key) for key in ("paragraphs", "bullets", "fields", "table")
            ):
                raise CommandError(f"{where} handout section {index} is empty")

            table = section.get("table")
            if table:
                if not table.get("columns") or not table.get("rows"):
                    raise CommandError(
                        f"{where} handout section {index} has a table with no columns or rows"
                    )
                width = len(table["columns"])
                for row_index, row in enumerate(table["rows"], start=1):
                    if len(row) != width:
                        raise CommandError(
                            f"{where} handout section {index} table row {row_index} has "
                            f"{len(row)} cell(s) for {width} column(s)"
                        )

    def _reset_everything(self):
        """`--fresh`: wipes every row except admin accounts and superusers.

        For rebuilding a server from scratch. Deleting the non-admin users
        cascades their enrolments, submissions, quiz attempts, progress, cart
        items, drill attempts, pathway purchases and onboarding answers; the
        explicit deletes below cover the same tables for rows an admin owns,
        plus the content nobody owns at all. Students' custom pathways go with
        their owners (`created_by` cascades) and the `Pathway` sweep catches any
        an admin built.

        Order matters: Category is PROTECTed by both Course.category and
        Tier.category, so every course and tier has to be gone before the
        categories can be cleared.
        """
        User.objects.exclude(role=User.Roles.ADMIN).exclude(is_superuser=True).delete()

        # Learner-activity tables — anything still here belongs to an admin account.
        EnrollmentHistory.objects.all().delete()
        Enrollment.objects.all().delete()
        LessonProgress.objects.all().delete()
        ModuleProgress.objects.all().delete()
        CourseProgress.objects.all().delete()
        LearningActivity.objects.all().delete()
        CartItem.objects.all().delete()
        OnboardingProgress.objects.all().delete()
        PathwayEnrollment.objects.all().delete()
        TierProgress.objects.all().delete()

        # Applications carry their own applicant details rather than an FK to a
        # seeded user, so deleting users doesn't cascade them.
        FutureClientApplication.objects.all().delete()
        DrillQuestion.objects.all().delete()

        Course.objects.all().delete()
        Tier.objects.all().delete()
        Pathway.objects.all().delete()
        OnboardingQuestion.objects.all().delete()
        PathwayBundleRule.objects.all().delete()

        Category.objects.all().delete()
        Tag.objects.all().delete()

    def _reset_catalog(self):
        """Clears the parts of the catalog that have to be rebuilt, and no more.

        Two things are deleted; everything else this command seeds is upserted
        by its natural key, so a reseed is safe to run against a server holding
        real data.

        1. The retired Numa courses (`_retired_courses.RETIRED_COURSE_CODES`).
           The client replaced that 629-course demo catalog with their own
           thirty courses, so an environment still holding it needs them gone.
           They are deleted by exact code, never as "everything not in
           COURSE_DEFS" — a course an admin added by hand through the portal is
           not in COURSE_DEFS either and must survive. Deleting a course
           cascades its modules, lessons, assignments, quizzes, cart items,
           enrolments and progress, which is the point: there is nothing left to
           study in a course that no longer exists.

        2. **Stale** seeded pathways only — a non-custom pathway whose name is no
           longer in PATHWAY_DEFS. The client's nine replaced a catalog of
           fifteen and a pathway that is gone from the sheet has to actually
           disappear rather than linger unlisted, but the nine that remain are
           upserted in place by `_seed_pathways` and keep their primary keys.

           That distinction is load-bearing rather than cosmetic. This used to
           delete *every* seeded pathway and rebuild it, which quietly reset
           real users on every run: `PathwayEnrollment` — the record of a
           pathway purchase — cascades with its pathway, and
           `OnboardingProgress.selected_pathway_ids` stores raw ids in a
           JSONField, so a rebuilt catalog left every student's finished
           onboarding pointing at pathways that no longer existed and sent them
           back through the wizard. Keeping the rows keeps both.

           Deleting a stale pathway still cascades its PathwayCourse rows, its
           TierPathway attachments (the Tier rows themselves survive and
           `_create_tiers` re-attaches them), its PathwayEnrollments and its
           QuestionOptionPathwayWeights.

        Students' own custom pathways (`is_custom`) are excluded: they are not
        part of the seeded catalog, and deleting one would destroy a bundle a
        student built and may have paid for.
        """
        retired = Course.objects.filter(code__in=RETIRED_COURSE_CODES)
        retired_count = retired.count()
        retired.delete()

        stale_pathways = Pathway.objects.filter(is_custom=False).exclude(
            name__in=[pathway_def["name"] for pathway_def in PATHWAY_DEFS]
        )
        pathway_count = stale_pathways.count()
        stale_pathways.delete()

        return retired_count, pathway_count

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
        # first created: now that `_reset_catalog` leaves users alone, a
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
        """Creates one Course row per COURSE_DEFS entry — the client's own title,
        level, pathway and grade data — plus a small amount of platform content so
        every course is actually usable in the LMS: a random-but-deterministic
        price, 1-2 modules, and in each module 1-2 lessons, an assignment and a
        quiz. None of that generated content is real curriculum material (the
        sheet gives a Focus and a Core Competencies line per course, not lesson
        prose), so the quiz is grounded in the course's own real metadata
        (level/grade/focus) rather than inventing subject-matter questions."""
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

            authored = COURSE_CONTENT.get(course_def["code"])
            # Existing catalog content may have been edited or purchased. Only
            # generate demo content for newly created courses. An authored
            # course is the exception: its curriculum is seeded on every run,
            # because a course whose placeholder modules were already generated
            # into an existing environment has to pick the real ones up (the
            # upserts below make the second run a no-op).
            if not created and not authored:
                continue

            teacher = teachers_by_code[course_def["code"]]

            if created:
                CourseInstructor.objects.update_or_create(
                    course=course, instructor=teacher, defaults={"is_lead": True}
                )
                course.tags.set(get_tag(name) for name in course_def["tags"])

            if authored:
                self._create_authored_content(course, authored, teacher, assets["handouts"])
                continue

            modules = self._create_modules(course, course_def, rng, assets["lessons"])
            # One assignment and one quiz in EVERY module, not just the first:
            # a module that holds lessons but nothing to submit and nothing to
            # check reads as half-built in the student, teacher and admin
            # screens alike. Both are titled with their module as well as their
            # course, so a two-module course doesn't show two rows with the
            # same name.
            for module in modules:
                self._create_assignment(module, course, course_def, teacher)
                self._create_quiz(module, course, course_def, rng)

        return courses_by_code

    def _create_authored_content(self, course, modules_def, teacher, handouts):
        """Seeds the hand-written curriculum carried by `_course_content`.

        A course listed there gets real modules, lessons, assignments and
        quizzes written against its own description instead of the generic
        two-module shell `_create_modules` builds, so the placeholder shell is
        removed first (`_replace_generated_modules`).

        Everything here is upserted by natural key rather than created once:
        this is editorial copy maintained in this repo (the same rule
        SPEAKER_DEFS follows), so correcting a lesson lands on the next reseed
        while the row keeps its id — and with it every LessonProgress,
        submission and quiz attempt pointing at it. The create-only exceptions
        are an assignment's due date and author and a module's assignment/quiz
        `order`: a reseed must not move a deadline out from under a student
        already working to it, nor undo an admin's reordering.
        """
        self._replace_generated_modules(course)

        for module_order, module_def in enumerate(modules_def, start=1):
            module, _ = Module.objects.update_or_create(
                course=course,
                title=module_def["title"],
                defaults={
                    "description": module_def["description"],
                    "order": module_order,
                },
            )
            handout_file = handouts.get((course.code, module_order), "")
            for lesson_order, lesson_def in enumerate(module_def["lessons"], start=1):
                self._create_authored_lesson(module, lesson_def, lesson_order, handout_file)
            self._create_authored_assignment(module, course, module_def["assignment"], teacher)
            self._create_authored_quiz(module, course, module_def["quiz"])

    def _replace_generated_modules(self, course):
        """Drops the placeholder modules `_create_modules` wrote for a course
        that now has authored curriculum.

        Keyed on the exact generated titles rather than "every module that is
        not in the authored list" — the same rule `_reset_catalog` follows for
        the retired courses, because a module an admin added by hand through
        the portal is not in the authored list either and must survive. The
        delete cascades the placeholder's lessons, assignments, quizzes and the
        progress/submissions hanging off them, which is the point: that content
        was filler generated from the course's metadata, and leaving it beside
        the real curriculum would show students two parallel syllabi. It runs
        on every reseed and matches nothing after the first.
        """
        Module.objects.filter(course=course, title__in=GENERATED_MODULE_TITLES).delete()

    def _create_authored_lesson(self, module, lesson_def, order, handout_file):
        content_type = lesson_def["type"]
        defaults = {
            "description": lesson_def["description"],
            "content_type": content_type,
            "content_data": lesson_def["body"],
            "content_format": Lesson.ContentFormat.MARKDOWN,
            "video_url": None,
            "duration_minutes": lesson_def["minutes"],
            "order": order,
        }
        is_handout = content_type in AUTHORED_HANDOUT_TYPES
        stored = handout_file if is_handout else ""
        if not is_handout or stored:
            # A TEXT lesson carries its prose in content_data and never a file.
            defaults["file"] = stored
        # `file` is left out of `defaults` only when this module's handout could
        # not be rendered this run (or was skipped with --skip-assets), so the row
        # keeps whatever file it already has instead of having it cleared. On
        # creation there is nothing to keep, so it is written either way.

        Lesson.objects.update_or_create(
            module=module,
            title=lesson_def["title"],
            defaults=defaults,
            create_defaults={**defaults, "file": stored},
        )

    def _create_authored_assignment(self, module, course, assignment_def, teacher):
        shared = {
            "course": course,
            "description": assignment_def["description"],
            "total_marks": assignment_def["total_marks"],
            "status": Status.PUBLISHED,
            "grading_mode": Assignment.GradingMode.MANUAL,
            "allow_resubmission": True,
        }
        Assignment.objects.update_or_create(
            module=module,
            title=assignment_def["title"],
            defaults=shared,
            create_defaults={
                **shared,
                "due_date": timezone.now() + timedelta(days=assignment_def["due_in_days"]),
                "order": get_next_order(Assignment.objects.filter(module=module)),
                "created_by": teacher,
            },
        )

    def _create_authored_quiz(self, module, course, quiz_def):
        questions_def = quiz_def["questions"]
        shared = {
            "course": course,
            "description": quiz_def["description"],
            "passing_score": quiz_def["passing_score"],
            "time_limit_minutes": quiz_def["minutes"],
            "number_of_questions": len(questions_def),
            "status": Status.PUBLISHED,
        }
        quiz, _ = Quiz.objects.update_or_create(
            module=module,
            title=quiz_def["title"],
            defaults=shared,
            create_defaults={
                **shared,
                "order": get_next_order(Quiz.objects.filter(module=module)),
            },
        )

        for order, question_def in enumerate(questions_def, start=1):
            # Keyed on `order`, not on the text, so rewording a question edits
            # the existing row instead of leaving the old wording behind as an
            # extra question. `attempt=None` is what makes it a template
            # question (see quizzes.models.Question) — the AI-regenerated
            # per-attempt ones must never be touched here.
            question, _ = QuizQuestion.objects.update_or_create(
                quiz=quiz,
                attempt=None,
                order=order,
                defaults={
                    "text": question_def["text"],
                    "question_type": QuizQuestion.QuestionType.MCQ,
                    "marks": 1,
                },
            )
            choices = question_def["choices"]
            answer = question_def["answer"]
            for index, text in enumerate(choices):
                Choice.objects.update_or_create(
                    question=question, text=text, defaults={"is_correct": index == answer}
                )
            # Options dropped by a later edit go with it. QuizAnswer.selected_choice
            # is SET_NULL, so a student's past attempt keeps its row.
            question.choices.exclude(text__in=choices).delete()

        quiz.questions.filter(attempt__isnull=True, order__gt=len(questions_def)).delete()
        return quiz

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
            title=f"{course.title} — {module.title} Assignment",
            defaults={
                "course": course,
                "description": (
                    f"Complete the exercises for {module.title} in {course.title} "
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
        # 30-provider catalog, but every course is now first-party and "Cool
        # Nerds" is the only publisher, so the provider question can no
        # longer be asked: its pool is a single value, which would render as one
        # choice that is also the answer. CANDIDATES is therefore filtered rather
        # than trimmed by hand, so this keeps working if the catalog grows a second
        # provider or shrinks to one subject.
        candidates = [
            (
                f'Which level of its pathway does "{course.title}" belong to?',
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
            (
                f'What is the focus of "{course.title}"?',
                course_def["focus"],
                ALL_FOCUSES,
            ),
        ]
        questions = [
            (text, correct, pool)
            for text, correct, pool in candidates
            if len({value for value in pool if value != correct}) >= CHOICES_PER_QUESTION - 1
        ]

        quiz, _ = Quiz.objects.get_or_create(
            module=module,
            title=f"{course.title} — {module.title} Quiz",
            defaults={
                "course": course,
                "description": f"Quick knowledge check on {module.title} in {course.title}.",
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
            # first in every question. The rotation is drawn from the shared seeded
            # RNG rather than from `order`: a one-provider catalog only yields three
            # answerable questions per quiz (the provider one cannot fill four
            # options), so `order % 4` would make the position a pure function of the
            # question number — the first answer always "D", and never "A". Drawing it
            # spreads the correct answer across all four positions across the catalog
            # and stays deterministic, so re-seeding reproduces the same quiz.
            rotation = rng.randrange(len(options))
            for option_text in options[rotation:] + options[:rotation]:
                Choice.objects.get_or_create(
                    question=question,
                    text=option_text,
                    defaults={"is_correct": option_text == correct_answer},
                )
        return quiz

    def _seed_pathways(self, courses_by_code):
        """Upserts the nine seeded pathways by name, into the rows that are
        already there.

        `_reset_catalog` only removes pathways that have fallen out of
        PATHWAY_DEFS, so these keep their primary keys across a reseed — which
        is what keeps a student's pathway purchase (`PathwayEnrollment`) and the
        ids stored in `OnboardingProgress.selected_pathway_ids` pointing at
        something real.

        Course attachments are added, never removed: an admin may have attached
        a course to a seeded pathway by hand through the portal, and that is
        indistinguishable here from one the sheet dropped. A course the client
        removes from a pathway is detached in the admin, the same way a course
        an admin added is kept.
        """
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

    def _seed_quests(self):
        """Upserts the starter Daily Quest catalog by title (its natural key).

        Like every other upsert here, this never deletes: a quest an admin
        added through the portal isn't in QUEST_DEFS and must survive, and a
        seeded quest a student has already completed is referenced by a points
        ledger entry (DailyQuestAssignment.quest is PROTECT). Admin edits to a
        seeded quest's wording are overwritten on reseed, matching how
        _seed_drills treats drill options."""
        for quest_def in QUEST_DEFS:
            Quest.objects.update_or_create(
                title=quest_def["title"],
                defaults={
                    "instructions": quest_def["instructions"],
                    "category": quest_def["category"],
                    "difficulty": quest_def["difficulty"],
                    "points_reward": quest_def["points_reward"],
                    "estimated_minutes": quest_def["estimated_minutes"],
                    "proof_hint": quest_def["proof_hint"],
                    "status": Status.PUBLISHED,
                },
            )

    def _seed_roleplay_scenarios(self):
        """Upserts the LS-302 role-play catalog by scenario code (its natural key).

        Like every other upsert here, this never deletes: a scenario an admin
        wrote through the portal isn't in ROLEPLAY_SCENARIO_DEFS and must
        survive, and a seeded scenario a student has already run is referenced
        by a points ledger entry (RolePlaySession.scenario is PROTECT). Admin
        edits to a seeded scenario's wording are overwritten on reseed,
        matching how _seed_quests and _seed_drills treat their copy.
        """
        for scenario_def in ROLEPLAY_SCENARIO_DEFS:
            RolePlayScenario.objects.update_or_create(
                code=scenario_def["code"],
                defaults={
                    "title": scenario_def["title"],
                    "relationship": scenario_def["relationship"],
                    "pressure_type": scenario_def["pressure_type"],
                    "key_skill": scenario_def["key_skill"],
                    "counterpart_role": scenario_def["counterpart_role"],
                    "setup": scenario_def["setup"],
                    "opening_message": scenario_def["opening_message"],
                    "exercise": scenario_def["exercise"],
                    "ideal_acknowledge": scenario_def["ideal_acknowledge"],
                    "ideal_boundary": scenario_def["ideal_boundary"],
                    "ideal_pivot": scenario_def["ideal_pivot"],
                    "persona": scenario_def["persona"],
                    "difficulty": scenario_def["difficulty"],
                    "points_reward": scenario_def["points_reward"],
                    "order": scenario_def["order"],
                    "status": Status.PUBLISHED,
                },
            )

    def _seed_roleplay_demo_runs(self, students):
        """Demo transcripts and report cards for the Tactical Wargamer.

        A catalog on its own leaves the admin activity feed, the student's
        Past Runs table and every number in the module stat strip empty, so
        there is nothing to look at until someone sits down and role-plays.
        These give a fresh environment something on every screen, the same
        way `_seed_instructor_feedback` gives the instructor pages reviews.

        Idempotent by the only rule that makes sense here: a student who
        already has *any* run of a scenario keeps what they have. Re-running
        the command never stacks demo transcripts on top of each other and
        never overwrites a run a real tester produced.

        The derived fields are computed the same way `evaluate_session` does
        rather than written into ROLEPLAY_RUN_DEFS by hand \u2014 the overall
        score is the mean of the three criteria, the pass mark comes from
        settings, and the points come from the scenario. A seeded pass is
        paid through `rewards.services.award_points` like a real one, so the
        ledger, the student's balance and `points_awarded` can't disagree.
        """
        if not students:
            return 0

        codes = {run_def["scenario_code"] for run_def in ROLEPLAY_RUN_DEFS}
        scenarios = {
            scenario.code: scenario
            for scenario in RolePlayScenario.objects.filter(code__in=codes)
        }
        now = timezone.now()
        created = 0

        for run_def in ROLEPLAY_RUN_DEFS:
            scenario = scenarios.get(run_def["scenario_code"])
            if scenario is None:
                continue

            student = students[run_def["student_index"] % len(students)]
            if RolePlaySession.objects.filter(student=student, scenario=scenario).exists():
                continue

            turns = run_def["turns"]
            started = now - timedelta(days=run_def["days_ago"])
            last_seconds = turns[-1]["seconds"] if turns else 0

            session = RolePlaySession.objects.create(
                student=student,
                scenario=scenario,
                persona=scenario.persona,
                status=run_def["status"],
                started_at=started,
                last_activity_at=started + timedelta(seconds=last_seconds),
                athlete_turn_count=sum(1 for turn in turns if turn["speaker"] == "ATHLETE"),
                counterpart_conceded=run_def.get("conceded", False),
                error_message=run_def.get("error_message", ""),
            )

            # The scene always opens on the scenario's own authored line, so
            # it is taken from the catalog rather than repeated in the run
            # definition — exactly what services.start_session does.
            RolePlayTurn.objects.create(
                session=session,
                speaker=RolePlayTurn.Speaker.COUNTERPART,
                content=scenario.opening_message,
                order=0,
                seconds_from_start=0,
            )
            for order, turn in enumerate(turns, start=1):
                RolePlayTurn.objects.create(
                    session=session,
                    speaker=turn["speaker"],
                    content=turn["content"],
                    order=order,
                    seconds_from_start=turn["seconds"],
                    pressure_level=turn.get("pressure"),
                )

            report = run_def.get("report")
            if session.status == RolePlaySession.SessionStatus.COMPLETED and report:
                overall = round(
                    mean(
                        (
                            report["time_to_boundary_score"],
                            report["tone_control_score"],
                            report["deflection_to_policy_score"],
                        )
                    )
                )
                passed = overall >= settings.ROLEPLAY_PASS_SCORE_PERCENT

                athlete_seconds = [
                    turn["seconds"] for turn in turns if turn["speaker"] == "ATHLETE"
                ]
                boundary_turn = report.get("boundary_turn") or None
                if boundary_turn and boundary_turn <= len(athlete_seconds):
                    session.boundary_seconds = athlete_seconds[boundary_turn - 1]
                    session.boundary_turn = boundary_turn

                for key, value in report.items():
                    if key == "boundary_turn":
                        continue
                    setattr(session, key, value)

                session.overall_score = overall
                session.passed = passed
                session.completed_at = started + timedelta(seconds=last_seconds + 6)
                session.provider = settings.AI_PROVIDER
                session.model_name = settings.AI_CHAT_MODEL

                if passed and scenario.points_reward:
                    session.points_awarded = scenario.points_reward
                session.save()

                if (
                    session.points_awarded
                    and not PointsTransaction.objects.filter(roleplay_session=session).exists()
                ):
                    award_points(
                        student=student,
                        amount=session.points_awarded,
                        transaction_type=PointsTransaction.TransactionType.ROLEPLAY_REWARD,
                        reason=f"Role-Play: {scenario.title}",
                        roleplay_session=session,
                    )

            elif session.status == RolePlaySession.SessionStatus.ABANDONED:
                session.completed_at = started + timedelta(seconds=last_seconds + 30)
                session.save(update_fields=["completed_at", "updated_at"])

            # created_at is auto_now_add, so the run dates are spread with an
            # update — same trick as _seed_instructor_feedback.
            RolePlaySession.objects.filter(pk=session.pk).update(created_at=started)
            created += 1

        return created

    def _seed_war_room_live(self):
        """Upserts the War Room Live speaker roster and its monthly session
        series.

        Speakers are upserted by name — their bio is editorial copy and is
        safe to refresh. Sessions use get_or_create by title and therefore
        keep whatever `scheduled_at` they already have: moving a session an
        admin has rescheduled, or that students have already RSVP'd to, would
        send people to the wrong time. Nothing here is ever deleted."""
        speakers_by_name = {}
        for speaker_def in SPEAKER_DEFS:
            speaker, _ = SessionSpeaker.objects.update_or_create(
                name=speaker_def["name"],
                defaults={
                    "headline": speaker_def["headline"],
                    "sport": speaker_def["sport"],
                    "school": speaker_def["school"],
                    "graduation_year": speaker_def["graduation_year"],
                    "bio": speaker_def["bio"],
                    "instagram_handle": speaker_def["instagram_handle"],
                    "is_active": True,
                },
            )
            speakers_by_name[speaker.name] = speaker

        # 7pm local on the offset day — the hour these actually run.
        base = timezone.localtime(timezone.now()).replace(
            hour=19, minute=0, second=0, microsecond=0
        )
        for session_def in LIVE_SESSION_DEFS:
            session, created = LiveSession.objects.get_or_create(
                title=session_def["title"],
                defaults={
                    "topic": session_def["topic"],
                    "description": session_def["description"],
                    "talking_points": session_def["talking_points"],
                    "scheduled_at": base + timedelta(days=session_def["days_offset"]),
                    "duration_minutes": session_def["duration_minutes"],
                    "meeting_method": LiveSession.MeetingMethod.ZOOM,
                    "recording_url": session_def.get("recording_url"),
                    "recap": session_def.get("recap", ""),
                    "status": LiveSession.SessionStatus.SCHEDULED,
                },
            )
            if created:
                session.speakers.set(
                    [speakers_by_name[name] for name in session_def["speakers"]]
                )
