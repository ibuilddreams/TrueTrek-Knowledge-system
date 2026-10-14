import tempfile
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings

from courses.management.commands import seeddata as seed
from courses.models import Category, Course
from daily_drill.models import DrillOption, DrillQuestion
from enrollments.models import Enrollment
from instructors.models import InstructorFeedback
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
        self.assertEqual(
            User.objects.filter(role=User.Roles.STUDENT).count(),
            len(seed.STUDENT_NAMES) + len(seed.REVIEWER_NAMES),
        )
        self.assertEqual(
            sorted(Category.objects.values_list("name", flat=True)), sorted(seed.CATEGORY_NAMES)
        )

    def test_every_module_has_one_or_two_distinct_supported_lessons(self):
        seed_offline()

        supported = {Lesson.ContentType.VIDEO, Lesson.ContentType.PDF, Lesson.ContentType.DOCUMENT}
        for course in Course.objects.all():
            for module in course.modules.all():
                content_types = list(module.lessons.values_list("content_type", flat=True))
                self.assertIn(len(content_types), (1, 2), f"{course.code} / {module.title}")
                self.assertEqual(len(content_types), len(set(content_types)))
                self.assertTrue(set(content_types) <= supported)

    def test_every_quiz_question_has_four_choices_with_exactly_one_correct(self):
        seed_offline()

        for course in Course.objects.all():
            for quiz in course.quizzes.all():
                # The restored catalog has subject/provider/grade questions;
                # the new athlete courses also have a focus question.
                expected_count = 4 if course.code in {cd["code"] for cd in seed.COOL_NERDS_COURSE_DEFS} else 3
                self.assertEqual(quiz.questions.count(), expected_count, quiz.title)
                self.assertEqual(quiz.number_of_questions, expected_count)
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

    def test_reseeding_preserves_existing_tiers_and_categories(self):
        # Unrelated tiers and their protected categories must survive.
        category, _ = Category.objects.get_or_create(name="Athletic")
        Tier.objects.create(name="Stale Tier", level=99, category=category)

        seed_offline()

        self.assertTrue(Tier.objects.filter(level=99).exists())
        self.assertTrue(Category.objects.filter(name="Athletic").exists())

    def test_preserves_all_existing_users(self):
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
        student = User.objects.create_user(
            email="old-student@example.com",
            username="old-student@example.com",
            password="x",
            gender=User.Gender.OTHER,
            role=User.Roles.STUDENT,
        )

        seed_offline()

        self.assertTrue(User.objects.filter(pk=admin.pk).exists())
        self.assertTrue(User.objects.filter(pk=superuser.pk).exists())
        self.assertTrue(User.objects.filter(pk=student.pk).exists())
        student.refresh_from_db()
        self.assertTrue(student.check_password("x"))

    def test_reseeding_preserves_course_content_enrollment_progress_and_custom_pathways(self):
        from courses.models import Tag
        from progress.models import CourseProgress

        seed_offline()
        course = Course.objects.get(code=seed.COURSE_DEFS[0]["code"])
        course.title = "Edited by administrator"
        course.save()
        tag = Tag.objects.create(name="Keep my tag")
        course.tags.set([tag])
        student = User.objects.filter(role=User.Roles.STUDENT).first()
        enrollment, _ = Enrollment.objects.get_or_create(student=student, course=course)
        progress = CourseProgress.objects.create(student=student, course=course, completion_percentage=42)
        custom = Pathway.objects.create(name="My custom bundle", is_custom=True, created_by=student)
        link = PathwayCourse.objects.create(pathway=custom, course=course)
        old = Pathway.objects.create(name="Obsolete catalog pathway")
        lesson_ids = list(Lesson.objects.filter(module__course=course).values_list("id", flat=True))

        seed_offline()

        course.refresh_from_db()
        self.assertEqual(course.title, "Edited by administrator")
        self.assertEqual(list(course.tags.values_list("id", flat=True)), [tag.id])
        self.assertEqual(list(Lesson.objects.filter(module__course=course).values_list("id", flat=True)), lesson_ids)
        self.assertTrue(Enrollment.objects.filter(pk=enrollment.pk).exists())
        progress.refresh_from_db()
        self.assertEqual(progress.completion_percentage, 42)
        self.assertTrue(PathwayCourse.objects.filter(pk=link.pk, pathway=custom).exists())
        self.assertFalse(Pathway.objects.filter(pk=old.pk).exists())
        self.assertEqual(Pathway.objects.filter(is_custom=False).count(), len(seed.PATHWAY_DEFS))

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

        # Only the demo reviewers (who back the seeded instructor feedback) are enrolled.
        self.assertFalse(Enrollment.objects.filter(student__email__startswith="student").exists())
        self.assertFalse(
            Enrollment.objects.exclude(student__email__startswith="reviewer").exists()
        )

    def test_every_instructor_gets_profile_details_and_enrolled_feedback(self):
        seed_offline()

        teachers = User.objects.filter(role=User.Roles.TEACHER)
        for teacher in teachers:
            self.assertTrue(teacher.instructor_profile.headline)
            self.assertTrue(teacher.instructor_profile.skills)
            self.assertTrue(teacher.profile.bio)
            feedback = InstructorFeedback.objects.filter(instructor=teacher)
            self.assertEqual(feedback.count(), seed.FEEDBACK_REVIEWS_PER_INSTRUCTOR)
            for item in feedback:
                self.assertTrue(
                    Enrollment.objects.filter(student=item.student, course=item.course).exists()
                )
                self.assertTrue(1 <= item.rating <= 5)

    def test_reseeding_does_not_duplicate_feedback(self):
        seed_offline()
        first = InstructorFeedback.objects.count()

        seed_offline()

        self.assertEqual(InstructorFeedback.objects.count(), first)


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

        # One request per thumbnail, per instructor photo, plus one per shared lesson file — the PDF and
        # DOCX are fetched once each and reused across every PDF/DOCX lesson.
        self.assertEqual(
            mock_get.call_count,
            sum(1 for url in seed.PROVIDER_THUMBNAILS.values() if url)
            + len(seed.LESSON_ASSET_URLS)
            + len(seed.INSTRUCTOR_AVATAR_IDS),
        )

        # Providers with no logo on file are seeded without a thumbnail by design.
        providers_with_logo = {
            name for name, url in seed.PROVIDER_THUMBNAILS.items() if url
        }
        for course_def in seed.COURSE_DEFS:
            if course_def["provider"] in providers_with_logo:
                course = Course.objects.get(code=course_def["code"])
                self.assertTrue(course.thumbnail, course.code)

        for teacher in User.objects.filter(role=User.Roles.TEACHER):
            self.assertTrue(teacher.profile.avatar, teacher.email)

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
