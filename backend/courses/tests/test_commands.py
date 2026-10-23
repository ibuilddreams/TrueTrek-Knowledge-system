import tempfile
from datetime import timedelta
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone

from courses.management.commands import seeddata as seed
from common.models import Status
from courses.models import Category, Course
from daily_drill.models import DrillOption, DrillQuestion
from enrollments.models import Enrollment
from instructors.models import InstructorFeedback
from lessons.models import Lesson
from modules.models import Module
from onboarding.models import Question as OnboardingQuestion
from pathways.models import Pathway, PathwayCourse
from live_sessions.models import LiveSession, SessionSpeaker
from quests.models import DailyQuestAssignment, Quest
from quizzes.models import Choice, Question as QuizQuestion
from rewards.models import PointsTransaction, StudentPointsAccount
from tiers.models import Tier, TierPathway
from wargamer.models import RolePlayScenario, RolePlaySession, RolePlayTurn

User = get_user_model()


def seed_offline(**kwargs):
    """Seeds without touching the network — the thumbnail/lesson-file downloads
    are the only part of the command that reaches out, and they degrade to
    "no media" by design."""
    call_command("seeddata", noinput=True, skip_assets=True, **kwargs)


def seed_offline_fresh(**kwargs):
    """`--fresh`: wipe everything but the admins, then seed."""
    seed_offline(fresh=True, **kwargs)


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

    def test_every_generated_module_has_one_or_two_distinct_supported_lessons(self):
        """The shape of the placeholder content, for the courses that still have it.

        A course with hand-authored curriculum in `_course_content` is excluded
        here and covered by the authored-content tests below — it has three
        lessons per module, one of which is TEXT.
        """
        seed_offline()

        supported = {Lesson.ContentType.VIDEO, Lesson.ContentType.PDF, Lesson.ContentType.DOCUMENT}
        for course in Course.objects.exclude(code__in=seed.COURSE_CONTENT):
            for module in course.modules.all():
                content_types = list(module.lessons.values_list("content_type", flat=True))
                self.assertIn(len(content_types), (1, 2), f"{course.code} / {module.title}")
                self.assertEqual(len(content_types), len(set(content_types)))
                self.assertTrue(set(content_types) <= supported)

    def test_every_quiz_question_has_four_choices_with_exactly_one_correct(self):
        seed_offline()

        # Three of the four candidate questions survive on a generated quiz: Cool
        # Nerds is the only provider in the catalog, so "which provider publishes
        # this?" cannot be given four distinct options and `_create_quiz` drops it
        # by design. An authored quiz has however many questions were written for
        # it.
        authored_codes = set(seed.COURSE_CONTENT)

        for course in Course.objects.all():
            authored = course.code in authored_codes
            for quiz in course.quizzes.all():
                if not authored:
                    self.assertEqual(quiz.questions.count(), 3, quiz.title)
                self.assertEqual(quiz.number_of_questions, quiz.questions.count(), quiz.title)
                for question in quiz.questions.all():
                    self.assertEqual(question.choices.count(), 4, question.text)
                    self.assertEqual(
                        question.choices.filter(is_correct=True).count(), 1, question.text
                    )

    def test_catalog_only_courses_are_pages_with_no_generated_curriculum(self):
        """The Cool Nerds academy sheet gave a focus and a competency line per
        course and no curriculum, so those courses seed as published course pages
        and the generic two-module shell is deliberately not built for them —
        placeholder modules would stand in front of content still being written.
        Everything that makes the page browsable is still seeded.
        """
        seed_offline()

        catalog_only = [cd for cd in seed.COURSE_DEFS if cd.get("catalog_only")]
        self.assertTrue(catalog_only)

        for course_def in catalog_only:
            course = Course.objects.get(code=course_def["code"])
            self.assertEqual(course.modules.count(), 0, course.code)
            self.assertEqual(course.quizzes.count(), 0, course.code)
            self.assertEqual(course.assignments.count(), 0, course.code)
            self.assertEqual(Lesson.objects.filter(module__course=course).count(), 0, course.code)

            self.assertEqual(course.status, Status.PUBLISHED, course.code)
            self.assertTrue(course.instructors.exists(), course.code)
            self.assertTrue(course.tags.exists(), course.code)
            self.assertTrue(course.learning_outcomes, course.code)
            self.assertGreater(course.amount, 0, course.code)
            # The sheet named no pathway, so nothing bundles them.
            self.assertFalse(course.pathway_courses.exists(), course.code)

    def test_a_course_past_school_age_is_labelled_by_stage_not_by_grade(self):
        """`grade_label` is "Undergraduate"/"Graduate School" on the top two Cool
        Nerds bands. Nothing may render those as "Grades Graduate School" — not
        the course page, and not a distractor on some other course's quiz — and
        a course belonging to no school grade must stay out of the grade filter.
        """
        seed_offline()

        undergraduate = Course.objects.get(code="CN-402")
        self.assertIsNone(undergraduate.grade_min)
        self.assertIsNone(undergraduate.grade_max)
        self.assertIn("Written for undergraduate students", undergraduate.learning_outcomes)
        self.assertIn(
            "Written for graduate students",
            Course.objects.get(code="CN-509").learning_outcomes,
        )
        # A school-age band still parses into the grade filter's range query.
        self.assertEqual(
            (Course.objects.get(code="CN-101").grade_min, Course.objects.get(code="CN-101").grade_max),
            (4, 5),
        )

        nonsense = [f"Grades {label}" for label in seed.NON_GRADE_LEVELS]
        for text in Choice.objects.values_list("text", flat=True):
            for phrase in nonsense:
                self.assertNotIn(phrase, text)

    def test_authored_courses_get_their_written_curriculum(self):
        """A course listed in `_course_content` is seeded from that file, not from
        the two-module placeholder template."""
        seed_offline()

        self.assertTrue(seed.COURSE_CONTENT, "no authored curriculum is wired up")

        for code, modules_def in seed.COURSE_CONTENT.items():
            course = Course.objects.get(code=code)
            modules = list(course.modules.order_by("order"))
            self.assertEqual(len(modules), len(modules_def), code)

            for order, (module, module_def) in enumerate(zip(modules, modules_def), start=1):
                where = f"{code} / {module_def['title']}"
                self.assertEqual(module.title, module_def["title"], where)
                self.assertEqual(module.description, module_def["description"], where)
                self.assertEqual(module.order, order, where)

                lessons = list(module.lessons.order_by("order"))
                self.assertEqual(len(lessons), len(module_def["lessons"]), where)
                for lesson, lesson_def in zip(lessons, module_def["lessons"]):
                    self.assertEqual(lesson.title, lesson_def["title"], where)
                    self.assertEqual(lesson.content_type, lesson_def["type"], where)
                    self.assertEqual(lesson.content_data, lesson_def["body"], where)

                # One assignment and one quiz per module, both published.
                assignment = module.assignments.get()
                self.assertEqual(assignment.title, module_def["assignment"]["title"], where)
                self.assertEqual(assignment.course_id, course.id, where)
                self.assertEqual(assignment.status, seed.Status.PUBLISHED, where)

                quiz = module.quizzes.get()
                self.assertEqual(quiz.title, module_def["quiz"]["title"], where)
                self.assertEqual(quiz.course_id, course.id, where)
                self.assertEqual(quiz.status, seed.Status.PUBLISHED, where)

                questions = list(quiz.questions.order_by("order"))
                self.assertEqual(len(questions), len(module_def["quiz"]["questions"]), where)
                for question, question_def in zip(questions, module_def["quiz"]["questions"]):
                    self.assertEqual(question.text, question_def["text"], where)
                    choices = question.choices.all()
                    self.assertEqual(
                        sorted(choices.values_list("text", flat=True)),
                        sorted(question_def["choices"]),
                        where,
                    )
                    self.assertEqual(
                        choices.get(is_correct=True).text,
                        question_def["choices"][question_def["answer"]],
                        where,
                    )

    def test_authored_text_lessons_carry_prose_and_no_file(self):
        """TEXT lessons are the written half of an authored module: Markdown in
        content_data and never a file."""
        seed_offline()

        text_lessons = Lesson.objects.filter(
            module__course__code__in=seed.COURSE_CONTENT,
            content_type=Lesson.ContentType.TEXT,
        )
        self.assertTrue(text_lessons.exists())
        for lesson in text_lessons:
            self.assertTrue(lesson.content_data.strip(), lesson.title)
            self.assertEqual(lesson.content_format, Lesson.ContentFormat.MARKDOWN, lesson.title)
            self.assertFalse(lesson.file, lesson.title)
            self.assertFalse(lesson.video_url, lesson.title)

        # Every authored module pairs that prose with a downloadable handout.
        for code in seed.COURSE_CONTENT:
            for module in Course.objects.get(code=code).modules.all():
                types = set(module.lessons.values_list("content_type", flat=True))
                self.assertIn(Lesson.ContentType.TEXT, types, f"{code} / {module.title}")
                self.assertTrue(
                    types & {Lesson.ContentType.PDF, Lesson.ContentType.DOCUMENT},
                    f"{code} / {module.title}",
                )

    def test_placeholder_modules_are_replaced_but_hand_made_ones_survive(self):
        """An environment seeded before the curriculum was written still holds the
        generated shell; the next reseed removes it and leaves everything else."""
        seed_offline()

        code = next(iter(seed.COURSE_CONTENT))
        course = Course.objects.get(code=code)
        placeholder = Module.objects.create(
            course=course, title=seed.GENERATED_MODULE_TITLES[0], description="generated", order=99
        )
        hand_made = Module.objects.create(
            course=course, title="Added by an administrator", description="keep me", order=100
        )
        authored_ids = list(
            course.modules.exclude(pk__in=[placeholder.pk, hand_made.pk]).values_list(
                "id", flat=True
            )
        )

        seed_offline()

        self.assertFalse(Module.objects.filter(pk=placeholder.pk).exists())
        self.assertTrue(Module.objects.filter(pk=hand_made.pk).exists())
        self.assertEqual(
            list(
                course.modules.exclude(pk=hand_made.pk).order_by("order").values_list(
                    "id", flat=True
                )
            ),
            authored_ids,
        )

    def test_reseeding_refreshes_authored_copy_without_moving_rows_or_deadlines(self):
        """Authored curriculum is editorial copy, so a correction lands on the next
        reseed — but the row keeps its id, and an assignment's deadline does not
        move under a student already working to it."""
        seed_offline()

        code = next(iter(seed.COURSE_CONTENT))
        course = Course.objects.get(code=code)
        module = course.modules.order_by("order").first()
        lesson = module.lessons.order_by("order").first()
        assignment = module.assignments.get()
        quiz = module.quizzes.get()
        question = quiz.questions.order_by("order").first()
        original_body = lesson.content_data
        due_date = assignment.due_date

        lesson.content_data = "scribbled over"
        lesson.save()

        seed_offline()

        lesson.refresh_from_db()
        assignment.refresh_from_db()
        self.assertEqual(lesson.content_data, original_body)
        self.assertEqual(due_date, assignment.due_date)
        # Same rows, so progress, submissions and attempts still point at them.
        self.assertEqual(module.lessons.order_by("order").first().pk, lesson.pk)
        self.assertEqual(module.assignments.get().pk, assignment.pk)
        self.assertEqual(module.quizzes.get().pk, quiz.pk)
        self.assertEqual(quiz.questions.order_by("order").first().pk, question.pk)
        self.assertEqual(question.choices.filter(is_correct=True).count(), 1)

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

    def test_reseeding_keeps_pathway_ids_purchases_and_onboarding_progress(self):
        """The seeded pathways are upserted in place, not rebuilt.

        Rebuilding them cascaded away every `PathwayEnrollment` and left the raw
        ids in `OnboardingProgress.selected_pathway_ids` pointing at rows that no
        longer existed, which sent finished students back through the wizard on
        every reseed.
        """
        from onboarding.models import OnboardingProgress, QuestionnaireAnswer
        from pathways.models import PathwayEnrollment

        seed_offline()

        before = dict(Pathway.objects.filter(is_custom=False).values_list("name", "id"))
        student = User.objects.filter(role=User.Roles.STUDENT).first()
        pathway = Pathway.objects.filter(is_custom=False).order_by("id").first()
        purchase = PathwayEnrollment.objects.create(
            user=student, pathway=pathway, price_paid=199
        )
        progress = OnboardingProgress.objects.create(
            user=student,
            step=OnboardingProgress.Step.CHECKOUT,
            selected_pathway_ids=[pathway.id],
        )
        question = OnboardingQuestion.objects.first()
        answer = QuestionnaireAnswer.objects.create(
            user=student, question=question, option=question.options.first()
        )
        stale = Pathway.objects.create(name="Pathway the client dropped")

        seed_offline()

        # Same rows, same ids.
        self.assertEqual(dict(Pathway.objects.filter(is_custom=False).values_list("name", "id")), before)
        # The purchase, the wizard state and the answers all still resolve.
        self.assertTrue(PathwayEnrollment.objects.filter(pk=purchase.pk).exists())
        progress.refresh_from_db()
        self.assertEqual(progress.step, OnboardingProgress.Step.CHECKOUT)
        self.assertEqual(progress.selected_pathway_ids, [pathway.id])
        self.assertEqual(
            Pathway.objects.filter(id__in=progress.selected_pathway_ids).count(), 1
        )
        answer.refresh_from_db()
        self.assertEqual(answer.option_id, question.options.first().id)
        # A pathway that has fallen out of PATHWAY_DEFS still disappears.
        self.assertFalse(Pathway.objects.filter(pk=stale.pk).exists())

    def test_reseeding_keeps_a_course_an_admin_attached_to_a_seeded_pathway(self):
        seed_offline()

        pathway = Pathway.objects.filter(is_custom=False).first()
        course = Course.objects.exclude(
            id__in=pathway.pathway_courses.values_list("course_id", flat=True)
        ).first()
        link = PathwayCourse.objects.create(
            pathway=pathway,
            course=course,
            order=seed.get_next_order(PathwayCourse.objects.filter(pathway=pathway)),
        )

        seed_offline()

        self.assertTrue(PathwayCourse.objects.filter(pk=link.pk).exists())

    def test_retired_numa_courses_are_deleted_but_hand_made_ones_are_not(self):
        """The client replaced the 629-course Numa catalog with their own thirty."""
        from courses.management.commands._retired_courses import RETIRED_COURSE_CODES

        category, _ = Category.objects.get_or_create(name="Academic")
        retired = Course.objects.create(
            code=RETIRED_COURSE_CODES[0],
            title="A retired Numa course",
            slug="a-retired-numa-course",
            category=category,
        )
        # Not in COURSE_DEFS either, but added by an admin through the portal —
        # it must not be swept up with the retired catalog.
        kept = Course.objects.create(
            code="ADMIN-MADE-1",
            title="Added by an administrator",
            slug="added-by-an-administrator",
            category=category,
        )

        seed_offline()

        self.assertFalse(Course.objects.filter(pk=retired.pk).exists())
        self.assertTrue(Course.objects.filter(pk=kept.pk).exists())
        self.assertEqual(Course.objects.count(), len(seed.COURSE_DEFS) + 1)

    def test_fresh_wipes_everything_except_admins_then_seeds(self):
        category, _ = Category.objects.get_or_create(name="Academic")
        admin = User.objects.create_user(
            email="owner@example.com", username="owner@example.com", password="x",
            gender=User.Gender.OTHER, role=User.Roles.ADMIN,
        )
        superuser = User.objects.create_superuser(
            email="root@example.com", username="root@example.com", password="x",
            gender=User.Gender.OTHER, role=User.Roles.STUDENT,
        )
        student = User.objects.create_user(
            email="old-student@example.com", username="old-student@example.com", password="x",
            gender=User.Gender.OTHER, role=User.Roles.STUDENT,
        )
        stale_course = Course.objects.create(
            code="ADMIN-MADE-1", title="Added by an administrator",
            slug="added-by-an-administrator", category=category,
        )
        custom = Pathway.objects.create(name="A custom bundle", is_custom=True, created_by=student)

        seed_offline_fresh()

        # Admins and superusers survive; everything else is rebuilt.
        self.assertTrue(User.objects.filter(pk=admin.pk).exists())
        self.assertTrue(User.objects.filter(pk=superuser.pk).exists())
        self.assertFalse(User.objects.filter(pk=student.pk).exists())
        self.assertFalse(Course.objects.filter(pk=stale_course.pk).exists())
        self.assertFalse(Pathway.objects.filter(pk=custom.pk).exists())

        # ...and the full dataset is there afterwards.
        self.assertEqual(Course.objects.count(), len(seed.COURSE_DEFS))
        self.assertEqual(Pathway.objects.count(), len(seed.PATHWAY_DEFS))
        self.assertEqual(Tier.objects.count(), len(seed.TIER_DEFS))
        self.assertEqual(OnboardingQuestion.objects.count(), len(seed.QUESTIONNAIRE))
        self.assertEqual(DrillQuestion.objects.count(), len(seed.DRILL_DEFS))
        self.assertEqual(
            User.objects.filter(role=User.Roles.TEACHER).count(), len(seed.TEACHER_NAMES)
        )
        self.assertEqual(
            sorted(Category.objects.values_list("name", flat=True)), sorted(seed.CATEGORY_NAMES)
        )

    def test_fresh_is_idempotent_too(self):
        seed_offline_fresh()
        counts = (Course.objects.count(), Pathway.objects.count(), Tier.objects.count(),
                  User.objects.count(), PathwayCourse.objects.count())

        seed_offline_fresh()

        self.assertEqual(
            counts,
            (Course.objects.count(), Pathway.objects.count(), Tier.objects.count(),
             User.objects.count(), PathwayCourse.objects.count()),
        )

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
            "quests": Quest.objects.count(),
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
                "quests": Quest.objects.count(),
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

        # The shared demo files back the courses that have no written curriculum.
        # An authored course's handout is generated per module, not downloaded,
        # and is covered by the test below.
        generated = Lesson.objects.exclude(module__course__code__in=seed.COURSE_CONTENT)
        pdf_files = set(
            generated.filter(content_type=Lesson.ContentType.PDF).values_list("file", flat=True)
        )
        doc_files = set(
            generated.filter(content_type=Lesson.ContentType.DOCUMENT).values_list(
                "file", flat=True
            )
        )
        self.assertEqual(pdf_files, {seed.LESSON_ASSET_PATHS["pdf"]})
        self.assertEqual(doc_files, {seed.LESSON_ASSET_PATHS["docx"]})
        self.assertFalse(
            Lesson.objects.filter(content_type=Lesson.ContentType.VIDEO).exclude(file="").exists()
        )

    def test_every_authored_module_gets_its_own_rendered_handout(self):
        """The written courses do not share the demo document: each module's
        worksheet is rendered from the same file that authored the module."""
        response = type("Response", (), {"content": b"stub-bytes", "raise_for_status": lambda self: None})

        with patch.object(seed.requests, "get", return_value=response()):
            call_command("seeddata", noinput=True)

        shared = set(seed.LESSON_ASSET_PATHS.values())
        seen = set()

        for code, modules_def in seed.COURSE_CONTENT.items():
            for order, module_def in enumerate(modules_def, start=1):
                lesson_def = next(
                    lesson
                    for lesson in module_def["lessons"]
                    if lesson["type"] in seed.AUTHORED_HANDOUT_TYPES
                )
                lesson = Lesson.objects.get(
                    module__course__code=code, module__title=module_def["title"],
                    title=lesson_def["title"],
                )
                where = f"{code} / {module_def['title']}"

                self.assertEqual(
                    lesson.file.name, seed.handout_path(code, order, lesson_def["type"]), where
                )
                self.assertNotIn(lesson.file.name, shared, where)
                self.assertNotIn(lesson.file.name, seen, f"{where} shares a file with another module")
                seen.add(lesson.file.name)

                with lesson.file.open("rb") as handle:
                    content = handle.read()
                self.assertGreater(len(content), 1000, where)
                if lesson_def["type"] == Lesson.ContentType.PDF:
                    self.assertTrue(content.startswith(b"%PDF"), where)
                else:
                    # .docx is a zip container; PK is its signature.
                    self.assertTrue(content.startswith(b"PK"), where)

        self.assertEqual(len(seen), sum(len(m) for m in seed.COURSE_CONTENT.values()))

    def test_a_handout_that_cannot_be_rendered_does_not_abort_the_seed(self):
        response = type("Response", (), {"content": b"stub-bytes", "raise_for_status": lambda self: None})

        with patch.object(seed.requests, "get", return_value=response()):
            with patch.object(seed, "build_handout_pdf", side_effect=ValueError("boom")):
                call_command("seeddata", noinput=True)

        self.assertEqual(Course.objects.count(), len(seed.COURSE_DEFS))
        # The DOCX handouts still rendered; the PDF lessons simply have no file.
        self.assertTrue(
            Lesson.objects.filter(
                module__course__code__in=seed.COURSE_CONTENT,
                content_type=Lesson.ContentType.DOCUMENT,
            )
            .exclude(file="")
            .exists()
        )

    def test_a_failed_download_does_not_abort_the_seed(self):
        with patch.object(seed.requests, "get", side_effect=seed.requests.RequestException("boom")):
            call_command("seeddata", noinput=True)

        self.assertEqual(Course.objects.count(), len(seed.COURSE_DEFS))
        self.assertFalse(Course.objects.exclude(thumbnail="").exists())


class SeedDataQuestTests(TestCase):
    """The Daily Quest catalog seeds like every other upsert here: it adds and
    refreshes the seeded set, and never removes anything else."""

    def test_seeds_the_starter_quest_catalog(self):
        seed_offline()

        self.assertEqual(Quest.objects.count(), len(seed.QUEST_DEFS))
        self.assertTrue(Quest.objects.filter(title="Audit your last 30 posts").exists())

    def test_reseeding_preserves_hand_made_quests_and_student_progress(self):
        seed_offline()

        hand_made = Quest.objects.create(
            title="Admin-authored quest", instructions="Added through the portal.", points_reward=5
        )
        student = User.objects.filter(role=User.Roles.STUDENT).first()
        seeded = Quest.objects.get(title="Audit your last 30 posts")
        assignment = DailyQuestAssignment.objects.create(
            student=student,
            quest=seeded,
            assigned_date="2026-01-01",
            status=DailyQuestAssignment.AssignmentStatus.COMPLETED,
            points_awarded=15,
        )

        seed_offline()

        self.assertTrue(Quest.objects.filter(pk=hand_made.pk).exists())
        self.assertTrue(Quest.objects.filter(pk=seeded.pk).exists())
        assignment.refresh_from_db()
        self.assertEqual(assignment.points_awarded, 15)
        self.assertEqual(assignment.status, DailyQuestAssignment.AssignmentStatus.COMPLETED)


class SeedDataWarRoomLiveTests(TestCase):
    def test_seeds_the_speaker_roster_and_session_series(self):
        seed_offline()

        self.assertEqual(SessionSpeaker.objects.count(), len(seed.SPEAKER_DEFS))
        self.assertEqual(LiveSession.objects.count(), len(seed.LIVE_SESSION_DEFS))

        # One finished session with a recording, two still ahead of it.
        past = LiveSession.objects.get(title="Mistakes I Made Posting Online")
        self.assertTrue(past.recording_url)
        self.assertTrue(past.recap)
        self.assertEqual([s.name for s in past.speakers.all()], ["Deshawn Carter"])

        upcoming = LiveSession.objects.get(title="Building Your Brand in High School")
        self.assertEqual(upcoming.speakers.count(), 2)
        self.assertIn("What worked for me in high school", upcoming.talking_points)

    def test_reseeding_never_moves_an_already_scheduled_session(self):
        """A session students may have RSVP'd to must keep its time — sending
        people to the wrong hour would be worse than stale copy."""
        seed_offline()
        session = LiveSession.objects.get(title="Building Your Brand in High School")
        session.scheduled_at = session.scheduled_at + timedelta(days=3)
        session.save(update_fields=["scheduled_at"])
        rescheduled_to = session.scheduled_at

        seed_offline()

        session.refresh_from_db()
        self.assertEqual(session.scheduled_at, rescheduled_to)
        self.assertEqual(LiveSession.objects.count(), len(seed.LIVE_SESSION_DEFS))

    def test_reseeding_preserves_hand_made_sessions_and_speakers(self):
        seed_offline()
        hand_made = LiveSession.objects.create(
            title="Admin-scheduled AMA", scheduled_at=timezone.now() + timedelta(days=5)
        )
        guest = SessionSpeaker.objects.create(name="Guest Coach")

        seed_offline()

        self.assertTrue(LiveSession.objects.filter(pk=hand_made.pk).exists())
        self.assertTrue(SessionSpeaker.objects.filter(pk=guest.pk).exists())


class SeedDataWargamerTests(TestCase):
    """The LS-302 catalog upserts by scenario code like every other catalog
    here; the demo runs exist only so a fresh environment has something on
    every Tactical Wargamer screen."""

    def test_seeds_the_scenario_catalog_by_code(self):
        seed_offline()

        self.assertEqual(RolePlayScenario.objects.count(), len(seed.ROLEPLAY_SCENARIO_DEFS))
        scenario = RolePlayScenario.objects.get(code="LS-302-S1")
        self.assertEqual(scenario.persona, RolePlayScenario.Persona.GUILT_TRIP)
        self.assertTrue(scenario.opening_message)
        self.assertTrue(scenario.ideal_boundary)

    def test_every_persona_is_represented_so_all_four_are_testable(self):
        seed_offline()

        personas = set(RolePlayScenario.objects.values_list("persona", flat=True))
        self.assertEqual(personas, set(RolePlayScenario.Persona.values))

    def test_demo_runs_cover_every_state_the_ui_renders(self):
        seed_offline()

        statuses = set(RolePlaySession.objects.values_list("status", flat=True))
        self.assertEqual(
            statuses,
            {
                RolePlaySession.SessionStatus.COMPLETED,
                RolePlaySession.SessionStatus.IN_PROGRESS,
                RolePlaySession.SessionStatus.ABANDONED,
                RolePlaySession.SessionStatus.EVALUATING,
            },
        )
        self.assertEqual(RolePlaySession.objects.count(), len(seed.ROLEPLAY_RUN_DEFS))
        self.assertTrue(RolePlaySession.objects.filter(passed=True).exists())
        self.assertTrue(RolePlaySession.objects.filter(passed=False, overall_score__isnull=False).exists())
        self.assertTrue(RolePlaySession.objects.filter(used_fabricated_excuse=True).exists())

    def test_a_demo_transcript_opens_on_the_scenarios_own_authored_line(self):
        seed_offline()

        session = RolePlaySession.objects.filter(
            scenario__code="LS-302-S1", status=RolePlaySession.SessionStatus.COMPLETED
        ).first()
        opening = session.turns.order_by("order").first()

        self.assertEqual(opening.order, 0)
        self.assertEqual(opening.speaker, RolePlayTurn.Speaker.COUNTERPART)
        self.assertEqual(opening.content, session.scenario.opening_message)

    def test_a_demo_score_is_derived_the_same_way_evaluate_session_derives_it(self):
        seed_offline()

        for session in RolePlaySession.objects.filter(
            status=RolePlaySession.SessionStatus.COMPLETED
        ):
            expected = round(
                (
                    session.time_to_boundary_score
                    + session.tone_control_score
                    + session.deflection_to_policy_score
                )
                / 3
            )
            self.assertEqual(session.overall_score, expected)
            self.assertEqual(
                session.passed,
                session.overall_score >= settings.ROLEPLAY_PASS_SCORE_PERCENT,
            )

    def test_a_demo_pass_is_paid_through_the_shared_ledger(self):
        seed_offline()

        passed = RolePlaySession.objects.filter(passed=True).first()
        transaction = PointsTransaction.objects.get(roleplay_session=passed)

        self.assertEqual(transaction.amount, passed.points_awarded)
        self.assertEqual(
            transaction.transaction_type, PointsTransaction.TransactionType.ROLEPLAY_REWARD
        )
        # The balance is what the student actually sees, so it has to match
        # the sum of what the seeded runs claim to have paid them.
        account = StudentPointsAccount.objects.get(student=passed.student)
        their_paid_runs = RolePlaySession.objects.filter(student=passed.student, passed=True)
        self.assertEqual(
            account.balance, sum(their_paid_runs.values_list("points_awarded", flat=True))
        )

    def test_a_failed_run_is_scored_but_never_paid(self):
        seed_offline()

        failed = RolePlaySession.objects.filter(
            status=RolePlaySession.SessionStatus.COMPLETED, passed=False
        ).first()

        self.assertIsNotNone(failed.overall_score)
        self.assertEqual(failed.points_awarded, 0)
        self.assertFalse(PointsTransaction.objects.filter(roleplay_session=failed).exists())

    def test_reseeding_never_duplicates_a_run_or_pays_twice(self):
        seed_offline()
        before = RolePlaySession.objects.count()
        balances = dict(StudentPointsAccount.objects.values_list("student_id", "balance"))

        seed_offline()

        self.assertEqual(RolePlaySession.objects.count(), before)
        self.assertEqual(
            dict(StudentPointsAccount.objects.values_list("student_id", "balance")), balances
        )

    def test_reseeding_preserves_hand_made_scenarios_and_real_runs(self):
        seed_offline()

        hand_made = RolePlayScenario.objects.create(
            code="LS-302-X1",
            title="Added through the portal",
            relationship=RolePlayScenario.Relationship.FAMILY,
            pressure_type=RolePlayScenario.PressureType.TIME,
            key_skill="Time boundaries",
            counterpart_role="An aunt",
            setup="Something an admin wrote.",
            opening_message="Come on, just this once.",
            exercise="Say no.",
        )
        student = User.objects.filter(role=User.Roles.STUDENT).last()
        seeded = RolePlayScenario.objects.get(code="LS-302-S6")
        real_run = RolePlaySession.objects.create(
            student=student,
            scenario=seeded,
            persona=seeded.persona,
            status=RolePlaySession.SessionStatus.COMPLETED,
            started_at=timezone.now(),
            overall_score=91,
            passed=True,
            points_awarded=60,
        )

        seed_offline()

        self.assertTrue(RolePlayScenario.objects.filter(pk=hand_made.pk).exists())
        real_run.refresh_from_db()
        self.assertEqual(real_run.overall_score, 91)
        self.assertEqual(real_run.points_awarded, 60)

    def test_fresh_rebuilds_the_demo_runs_from_scratch(self):
        seed_offline()
        seed_offline_fresh()

        self.assertEqual(RolePlaySession.objects.count(), len(seed.ROLEPLAY_RUN_DEFS))
        self.assertEqual(RolePlayScenario.objects.count(), len(seed.ROLEPLAY_SCENARIO_DEFS))
