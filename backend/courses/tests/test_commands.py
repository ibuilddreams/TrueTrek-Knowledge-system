import tempfile
from datetime import timedelta
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone

from courses.management.commands import seeddata as seed
from courses.models import Category, Course
from daily_drill.models import DrillOption, DrillQuestion
from enrollments.models import Enrollment
from instructors.models import InstructorFeedback
from lessons.models import Lesson
from onboarding.models import Question as OnboardingQuestion
from pathways.models import Pathway, PathwayCourse
from live_sessions.models import LiveSession, SessionSpeaker
from quests.models import DailyQuestAssignment, Quest
from quizzes.models import Question as QuizQuestion
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

        # Three of the four candidate questions survive: Cool Nerds is the only
        # provider in the catalog, so "which provider publishes this?" cannot be
        # given four distinct options and `_create_quiz` drops it by design.
        expected_count = 3

        for course in Course.objects.all():
            for quiz in course.quizzes.all():
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
