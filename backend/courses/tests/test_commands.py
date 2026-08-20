import tempfile
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings

from courses.management.commands import seeddata as seed
from courses.models import Category, Course
from daily_drill.models import DrillOption, DrillQuestion
from enrollments.models import Enrollment
from lessons.models import Lesson
from onboarding.models import Question as OnboardingQuestion
from pathways.models import Pathway, PathwayCourse
from quizzes.models import Question as QuizQuestion
from tiers.models import Tier, TierPathway

User = get_user_model()


def seed_offline(**kwargs):
    """Seeds without touching the network — the thumbnail/lesson-file downloads
    are the only part of the command that reaches out, and they degrade to
    "no media" by design."""
    call_command("seeddata", noinput=True, skip_assets=True, **kwargs)


class SeedDataCommandTests(TestCase):
    def test_seeds_the_full_dataset(self):
        seed_offline()

        self.assertEqual(Course.objects.count(), len(seed.COURSE_DEFS))
        self.assertEqual(Pathway.objects.count(), len(seed.PATHWAY_DEFS))
        self.assertEqual(Tier.objects.count(), len(seed.TIER_DEFS))
        self.assertEqual(OnboardingQuestion.objects.count(), len(seed.QUESTIONNAIRE))
        self.assertEqual(DrillQuestion.objects.count(), len(seed.DRILL_DEFS))
        self.assertEqual(User.objects.filter(role=User.Roles.TEACHER).count(), len(seed.TEACHER_NAMES))
        self.assertEqual(User.objects.filter(role=User.Roles.STUDENT).count(), len(seed.STUDENT_NAMES))
        self.assertEqual(
            sorted(Category.objects.values_list("name", flat=True)), sorted(seed.CATEGORY_NAMES)
        )

    def test_every_module_has_a_video_pdf_and_document_lesson(self):
        seed_offline()

        for course in Course.objects.all():
            for module in course.modules.all():
                content_types = sorted(module.lessons.values_list("content_type", flat=True))
                self.assertEqual(
                    content_types,
                    sorted(
                        [
                            Lesson.ContentType.VIDEO,
                            Lesson.ContentType.PDF,
                            Lesson.ContentType.DOCUMENT,
                        ]
                    ),
                    f"{course.code} / {module.title}",
                )

    def test_every_quiz_question_has_four_choices_with_exactly_one_correct(self):
        seed_offline()

        for course in Course.objects.all():
            for quiz in course.quizzes.all():
                self.assertEqual(quiz.questions.count(), 10, quiz.title)
                for question in quiz.questions.all():
                    self.assertEqual(question.choices.count(), 4, question.text)
                    self.assertEqual(
                        question.choices.filter(is_correct=True).count(), 1, question.text
                    )

    def test_correct_answers_are_not_always_the_first_choice(self):
        seed_offline()

        # Choice has no Meta.ordering, so choices come back in insert order.
        positions = set()
        for question in QuizQuestion.objects.all():
            flags = list(question.choices.order_by("id").values_list("is_correct", flat=True))
            positions.add(flags.index(True))

        # Every position is used, so a seeded quiz can't be passed by always
        # picking option A.
        self.assertEqual(positions, {0, 1, 2, 3})

    def test_pathways_and_tiers_are_wired_to_real_content(self):
        seed_offline()

        # No pathway is empty, and every pathway hangs off at least one tier —
        # an unattached pathway is invisible in the tier-driven student UI.
        for pathway in Pathway.objects.all():
            self.assertTrue(pathway.pathway_courses.exists(), pathway.name)
            self.assertTrue(pathway.tier_pathways.exists(), pathway.name)

        self.assertEqual(
            PathwayCourse.objects.count(),
            sum(len(pathway_def["course_codes"]) for pathway_def in seed.PATHWAY_DEFS),
        )

        # TierPathway.order is unique *per tier* and restarts at 1, matching the
        # unique_tierpathway_order_per_tier constraint.
        for tier in Tier.objects.all():
            orders = sorted(
                TierPathway.objects.filter(tier=tier).values_list("order", flat=True)
            )
            self.assertEqual(orders, list(range(1, len(orders) + 1)), tier.name)

    def test_reset_data_clears_a_tier_protected_category_without_error(self):
        # Category is PROTECTed by both Course.category and Tier.category, so
        # _reset_data has to delete every course and tier before it touches
        # categories — otherwise this raises ProtectedError.
        category, _ = Category.objects.get_or_create(name="Athletic")
        Tier.objects.create(name="Stale Tier", level=99, category=category)

        seed_offline()

        self.assertFalse(Tier.objects.filter(level=99).exists())
        self.assertTrue(Category.objects.filter(name="Athletic").exists())

    def test_preserves_admins_and_superusers_but_deletes_everyone_else(self):
        admin = User.objects.create_user(
            email="owner@example.com",
            username="owner@example.com",
            password="x",
            gender=User.Gender.OTHER,
            role=User.Roles.ADMIN,
        )
        # A superuser whose role was never set to ADMIN still counts as staff to
        # preserve — losing the only Django-admin login to a reseed is not an
        # acceptable outcome.
        superuser = User.objects.create_superuser(
            email="root@example.com",
            username="root@example.com",
            password="x",
            gender=User.Gender.OTHER,
            role=User.Roles.STUDENT,
        )
        doomed = User.objects.create_user(
            email="old-student@example.com",
            username="old-student@example.com",
            password="x",
            gender=User.Gender.OTHER,
            role=User.Roles.STUDENT,
        )

        seed_offline()

        self.assertTrue(User.objects.filter(pk=admin.pk).exists())
        self.assertTrue(User.objects.filter(pk=superuser.pk).exists())
        self.assertFalse(User.objects.filter(pk=doomed.pk).exists())

    def test_is_idempotent(self):
        seed_offline()
        counts = {
            "courses": Course.objects.count(),
            "lessons": Lesson.objects.count(),
            "pathways": Pathway.objects.count(),
            "pathway_courses": PathwayCourse.objects.count(),
            "tiers": Tier.objects.count(),
            "tier_pathways": TierPathway.objects.count(),
            "questions": OnboardingQuestion.objects.count(),
            "drills": DrillQuestion.objects.count(),
            "drill_options": DrillOption.objects.count(),
            "users": User.objects.count(),
        }

        seed_offline()

        self.assertEqual(
            counts,
            {
                "courses": Course.objects.count(),
                "lessons": Lesson.objects.count(),
                "pathways": Pathway.objects.count(),
                "pathway_courses": PathwayCourse.objects.count(),
                "tiers": Tier.objects.count(),
                "tier_pathways": TierPathway.objects.count(),
                "questions": OnboardingQuestion.objects.count(),
                "drills": DrillQuestion.objects.count(),
                "drill_options": DrillOption.objects.count(),
                "users": User.objects.count(),
            },
        )

    def test_skip_assets_leaves_thumbnails_and_lesson_files_empty(self):
        seed_offline()

        self.assertFalse(Course.objects.exclude(thumbnail="").exists())
        self.assertFalse(Lesson.objects.exclude(file="").exists())

    def test_students_are_not_auto_enrolled(self):
        seed_offline()

        self.assertEqual(Enrollment.objects.count(), 0)


class SeedDataAssetTests(TestCase):
    """Covers the download path with a stubbed HTTP client, so the assertions
    hold on a machine with no outbound network access."""

    def setUp(self):
        self._media = tempfile.TemporaryDirectory()
        self.addCleanup(self._media.cleanup)
        overrider = override_settings(MEDIA_ROOT=self._media.name)
        overrider.enable()
        self.addCleanup(overrider.disable)

    def test_downloads_each_asset_once_and_attaches_it(self):
        response = type("Response", (), {"content": b"stub-bytes", "raise_for_status": lambda self: None})

        with patch.object(seed.requests, "get", return_value=response()) as mock_get:
            call_command("seeddata", noinput=True)

        # One request per thumbnail plus one per shared lesson file — the PDF and
        # DOCX are fetched once each and reused across every PDF/DOCX lesson.
        self.assertEqual(
            mock_get.call_count,
            len(seed.COURSE_THUMBNAIL_URLS) + len(seed.LESSON_ASSET_URLS),
        )

        for course in Course.objects.all():
            self.assertTrue(course.thumbnail, course.code)

        pdf_files = set(
            Lesson.objects.filter(content_type=Lesson.ContentType.PDF).values_list("file", flat=True)
        )
        doc_files = set(
            Lesson.objects.filter(content_type=Lesson.ContentType.DOCUMENT).values_list(
                "file", flat=True
            )
        )
        self.assertEqual(pdf_files, {seed.LESSON_ASSET_PATHS["pdf"]})
        self.assertEqual(doc_files, {seed.LESSON_ASSET_PATHS["docx"]})
        self.assertFalse(
            Lesson.objects.filter(content_type=Lesson.ContentType.VIDEO).exclude(file="").exists()
        )

    def test_a_failed_download_does_not_abort_the_seed(self):
        with patch.object(seed.requests, "get", side_effect=seed.requests.RequestException("boom")):
            call_command("seeddata", noinput=True)

        self.assertEqual(Course.objects.count(), len(seed.COURSE_DEFS))
        self.assertFalse(Course.objects.exclude(thumbnail="").exists())
