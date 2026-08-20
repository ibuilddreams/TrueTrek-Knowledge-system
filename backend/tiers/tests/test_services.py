from django.contrib.auth import get_user_model
from django.test import TestCase

from common.models import Status
from courses.models import Category, Course
from pathways.models import Pathway, PathwayCourse, PathwayEnrollment
from progress.models import CourseProgress

from ..models import Tier, TierPathway, TierProgress
from ..services import (
    TierPathwayError,
    TierReorderError,
    attach_pathway_to_tier,
    get_or_create_tier_progress,
    recalculate_tier_progress,
    reorder_tier_pathways,
    reorder_tiers,
    unlock_tier_for_purchase,
)

UserModel = get_user_model()


def make_user(email, role, **extra):
    return UserModel.objects.create_user(
        username=email.split("@")[0],
        email=email,
        password="StrongPass123!",
        role=role,
        gender=UserModel.Gender.MALE,
        **extra,
    )


class TierProgressServiceTests(TestCase):
    def setUp(self):
        self.student = make_user("student@example.com", UserModel.Roles.STUDENT)

        self.category = Category.objects.create(name="Academics")
        self.course_a = Course.objects.create(
            title="Course A", code="CA101", category=self.category,
            status=Status.PUBLISHED, amount=100,
        )
        self.course_b = Course.objects.create(
            title="Course B", code="CB101", category=self.category,
            status=Status.PUBLISHED, amount=50,
        )

        self.tier1 = Tier.objects.create(name="The Blueprint", level=1)
        self.tier2 = Tier.objects.create(name="The Recruiting Window", level=2)

        self.pathway = Pathway.objects.create(name="Athlete Foundation")
        TierPathway.objects.create(tier=self.tier1, pathway=self.pathway, order=1)
        PathwayCourse.objects.create(pathway=self.pathway, course=self.course_a, order=1)
        PathwayCourse.objects.create(pathway=self.pathway, course=self.course_b, order=2)

    def test_get_or_create_tier_progress_starts_every_tier_locked(self):
        rows = list(get_or_create_tier_progress(self.student))

        by_level = {row.tier.level: row for row in rows}
        self.assertEqual(by_level[1].status, TierProgress.ProgressStatus.LOCKED)
        self.assertIsNone(by_level[1].unlocked_at)
        self.assertEqual(by_level[2].status, TierProgress.ProgressStatus.LOCKED)
        self.assertIsNone(by_level[2].unlocked_at)

    def test_get_or_create_tier_progress_is_idempotent(self):
        get_or_create_tier_progress(self.student)
        count_after_first_call = TierProgress.objects.filter(student=self.student).count()

        get_or_create_tier_progress(self.student)
        count_after_second_call = TierProgress.objects.filter(student=self.student).count()

        self.assertEqual(count_after_first_call, 2)
        self.assertEqual(count_after_second_call, 2)

    def test_recalculate_without_a_purchase_computes_percentage_but_stays_locked(self):
        CourseProgress.objects.create(student=self.student, course=self.course_a, is_completed=True)

        progress = recalculate_tier_progress(self.student, self.tier1)

        self.assertEqual(progress.progress_percentage, 50)
        self.assertEqual(progress.status, TierProgress.ProgressStatus.LOCKED)

    def test_recalculate_partial_progress_after_purchase_marks_in_progress(self):
        unlock_tier_for_purchase(self.student, self.tier1)
        CourseProgress.objects.create(student=self.student, course=self.course_a, is_completed=True)

        progress = recalculate_tier_progress(self.student, self.tier1)

        self.assertEqual(progress.progress_percentage, 50)
        self.assertEqual(progress.status, TierProgress.ProgressStatus.IN_PROGRESS)

        tier2_progress = TierProgress.objects.filter(student=self.student, tier=self.tier2).first()
        self.assertIsNone(tier2_progress)

    def test_recalculate_full_completion_after_purchase_marks_completed_with_timestamp(self):
        unlock_tier_for_purchase(self.student, self.tier1)
        CourseProgress.objects.create(student=self.student, course=self.course_a, is_completed=True)
        CourseProgress.objects.create(student=self.student, course=self.course_b, is_completed=True)

        progress = recalculate_tier_progress(self.student, self.tier1)

        self.assertEqual(progress.progress_percentage, 100)
        self.assertEqual(progress.status, TierProgress.ProgressStatus.COMPLETED)
        self.assertIsNotNone(progress.completed_at)

    def test_recalculate_never_upgrades_a_locked_tier(self):
        # tier2 is LOCKED and has no pathways/courses of its own here; simulate a
        # recalculation call happening on it anyway and confirm it stays LOCKED.
        progress = recalculate_tier_progress(self.student, self.tier2)
        self.assertEqual(progress.status, TierProgress.ProgressStatus.LOCKED)

    def test_course_shared_across_two_tiers_updates_progress_for_both(self):
        tier3 = Tier.objects.create(name="The Scholar's Foundation", level=3)
        shared_pathway = Pathway.objects.create(name="Scholar Track")
        TierPathway.objects.create(tier=tier3, pathway=shared_pathway, order=1)
        PathwayCourse.objects.create(pathway=shared_pathway, course=self.course_a, order=1)

        CourseProgress.objects.create(student=self.student, course=self.course_a, is_completed=True)

        tier1_progress = recalculate_tier_progress(self.student, self.tier1)
        tier3_progress = recalculate_tier_progress(self.student, tier3)

        self.assertEqual(tier1_progress.progress_percentage, 50)
        self.assertEqual(tier3_progress.progress_percentage, 100)

    def test_same_pathway_attached_to_two_tiers_counts_toward_both(self):
        # The whole point of TierPathway being a through-model: one pathway can
        # be shared across multiple tiers, not force-duplicated per tier.
        tier3 = Tier.objects.create(name="The Scholar's Foundation", level=3)
        TierPathway.objects.create(tier=tier3, pathway=self.pathway, order=1)

        CourseProgress.objects.create(student=self.student, course=self.course_a, is_completed=True)
        CourseProgress.objects.create(student=self.student, course=self.course_b, is_completed=True)

        tier1_progress = recalculate_tier_progress(self.student, self.tier1)
        tier3_progress = recalculate_tier_progress(self.student, tier3)

        self.assertEqual(tier1_progress.progress_percentage, 100)
        self.assertEqual(tier3_progress.progress_percentage, 100)

    def test_saving_course_progress_triggers_recalculation_via_signal(self):
        unlock_tier_for_purchase(self.student, self.tier1)

        CourseProgress.objects.create(student=self.student, course=self.course_a, is_completed=True)
        CourseProgress.objects.create(student=self.student, course=self.course_b, is_completed=True)

        tier1_progress = TierProgress.objects.get(student=self.student, tier=self.tier1)
        self.assertEqual(tier1_progress.progress_percentage, 100)
        self.assertEqual(tier1_progress.status, TierProgress.ProgressStatus.COMPLETED)

    def test_saving_course_progress_without_a_purchase_never_unlocks_the_tier(self):
        CourseProgress.objects.create(student=self.student, course=self.course_a, is_completed=True)
        CourseProgress.objects.create(student=self.student, course=self.course_b, is_completed=True)

        tier1_progress = TierProgress.objects.get(student=self.student, tier=self.tier1)
        self.assertEqual(tier1_progress.progress_percentage, 100)
        self.assertEqual(tier1_progress.status, TierProgress.ProgressStatus.LOCKED)


class TierPathwayServiceTests(TestCase):
    def setUp(self):
        self.tier1 = Tier.objects.create(name="The Blueprint", level=1)
        self.tier2 = Tier.objects.create(name="The Recruiting Window", level=2)
        self.pathway = Pathway.objects.create(name="Athlete Foundation")

    def test_attach_assigns_next_order(self):
        first = attach_pathway_to_tier(self.tier1, self.pathway)
        second_pathway = Pathway.objects.create(name="Second Pathway")
        second = attach_pathway_to_tier(self.tier1, second_pathway)

        self.assertEqual(first.order, 1)
        self.assertEqual(second.order, 2)

    def test_attach_same_pathway_to_two_different_tiers_succeeds(self):
        attach_pathway_to_tier(self.tier1, self.pathway)
        tier_pathway_2 = attach_pathway_to_tier(self.tier2, self.pathway)

        self.assertEqual(TierPathway.objects.filter(pathway=self.pathway).count(), 2)
        self.assertEqual(tier_pathway_2.order, 1)

    def test_attach_rejects_duplicate_attachment_to_same_tier(self):
        attach_pathway_to_tier(self.tier1, self.pathway)
        with self.assertRaises(TierPathwayError):
            attach_pathway_to_tier(self.tier1, self.pathway)


class ReorderServiceTests(TestCase):
    def setUp(self):
        self.tier1 = Tier.objects.create(name="The Blueprint", level=1)
        self.tier2 = Tier.objects.create(name="The Recruiting Window", level=2)
        self.tier3 = Tier.objects.create(name="The Scholar's Foundation", level=3)

        self.pathway_a = Pathway.objects.create(name="Pathway A")
        self.pathway_b = Pathway.objects.create(name="Pathway B")
        self.pathway_c = Pathway.objects.create(name="Pathway C")

        self.tp_a = TierPathway.objects.create(tier=self.tier1, pathway=self.pathway_a, order=1)
        self.tp_b = TierPathway.objects.create(tier=self.tier1, pathway=self.pathway_b, order=2)
        self.tp_c = TierPathway.objects.create(tier=self.tier1, pathway=self.pathway_c, order=3)

    def test_reorder_tier_pathways_swaps_without_unique_constraint_collision(self):
        # A full-cycle swap (1<->3) is exactly the case a naive direct-write loop
        # collides on, since (tier, order) is a non-deferrable unique index.
        result = reorder_tier_pathways(
            self.tier1.id,
            [
                {"tierpathway_id": self.tp_a.id, "order": 3},
                {"tierpathway_id": self.tp_b.id, "order": 2},
                {"tierpathway_id": self.tp_c.id, "order": 1},
            ],
        )

        orders_by_name = {tp.pathway.name: tp.order for tp in result}
        self.assertEqual(orders_by_name["Pathway A"], 3)
        self.assertEqual(orders_by_name["Pathway B"], 2)
        self.assertEqual(orders_by_name["Pathway C"], 1)

    def test_reorder_tier_pathways_rejects_incomplete_id_set(self):
        with self.assertRaises(TierPathwayError):
            reorder_tier_pathways(self.tier1.id, [{"tierpathway_id": self.tp_a.id, "order": 1}])

    def test_reorder_tier_pathways_rejects_duplicate_orders(self):
        with self.assertRaises(TierPathwayError):
            reorder_tier_pathways(
                self.tier1.id,
                [
                    {"tierpathway_id": self.tp_a.id, "order": 1},
                    {"tierpathway_id": self.tp_b.id, "order": 1},
                    {"tierpathway_id": self.tp_c.id, "order": 2},
                ],
            )

    def test_reorder_tiers_swaps_without_unique_constraint_collision(self):
        result = reorder_tiers(
            [
                {"tier_id": self.tier1.id, "level": 3},
                {"tier_id": self.tier2.id, "level": 2},
                {"tier_id": self.tier3.id, "level": 1},
            ]
        )

        levels_by_name = {t.name: t.level for t in result}
        self.assertEqual(levels_by_name["The Blueprint"], 3)
        self.assertEqual(levels_by_name["The Scholar's Foundation"], 1)

    def test_reorder_tiers_rejects_mismatched_id_set(self):
        with self.assertRaises(TierReorderError):
            reorder_tiers([{"tier_id": self.tier1.id, "level": 1}])


class PathwayPurchaseUnlockTests(TestCase):
    """Regression coverage: buying a pathway must unlock every tier it belongs
    to immediately, regardless of tier sequence — pathways are purchasable
    independently of tier order, so unlock can't be purely sequential."""

    def setUp(self):
        self.student = make_user("buyer@example.com", UserModel.Roles.STUDENT)
        self.tier1 = Tier.objects.create(name="The Blueprint", level=1)
        for level in range(2, 8):
            Tier.objects.create(name=f"Tier {level}", level=level)
        self.tier8 = Tier.objects.create(name="The Business Elite Level", level=8)
        self.pathway = Pathway.objects.create(name="Business Pathway")
        TierPathway.objects.create(tier=self.tier8, pathway=self.pathway, order=1)

    def test_buying_a_high_tier_pathway_unlocks_it_without_sequential_progression(self):
        self.assertFalse(TierProgress.objects.filter(student=self.student, tier=self.tier8).exists())

        PathwayEnrollment.objects.create(user=self.student, pathway=self.pathway)

        tier8_progress = TierProgress.objects.get(student=self.student, tier=self.tier8)
        self.assertEqual(tier8_progress.status, TierProgress.ProgressStatus.UNLOCKED)
        self.assertIsNotNone(tier8_progress.unlocked_at)

        # Tiers 2-7 must stay LOCKED — the purchase should not accidentally
        # unlock the sequential chain leading up to tier 8.
        for level in range(2, 8):
            progress = TierProgress.objects.filter(
                student=self.student, tier__level=level
            ).first()
            if progress:
                self.assertEqual(progress.status, TierProgress.ProgressStatus.LOCKED)

    def test_purchasing_a_pathway_attached_to_multiple_tiers_unlocks_all_of_them(self):
        tier3 = Tier.objects.get(level=3)
        TierPathway.objects.create(tier=tier3, pathway=self.pathway, order=1)

        PathwayEnrollment.objects.create(user=self.student, pathway=self.pathway)

        self.assertEqual(
            TierProgress.objects.get(student=self.student, tier=self.tier8).status,
            TierProgress.ProgressStatus.UNLOCKED,
        )
        self.assertEqual(
            TierProgress.objects.get(student=self.student, tier=tier3).status,
            TierProgress.ProgressStatus.UNLOCKED,
        )
