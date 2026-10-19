from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone

from common.models import Status
from rewards.models import PointsTransaction, StudentPointsAccount

from ..exceptions import QuestAlreadyResolvedError, QuestExpiredError
from ..models import DailyQuestAssignment, Quest
from ..services import (
    complete_quest,
    compute_longest_quest_streak,
    compute_quest_streak,
    get_or_assign_todays_quests,
    get_quest_stats,
    skip_quest,
)

UserModel = get_user_model()


def make_student(username="quest-student"):
    return UserModel.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="StrongPass123!",
        role=UserModel.Roles.STUDENT,
        gender=UserModel.Gender.MALE,
    )


def make_quest(title="Delete three off-brand posts", points=10, **kwargs):
    return Quest.objects.create(
        title=title,
        instructions="Scroll back through your feed and remove what no longer fits.",
        points_reward=points,
        **kwargs,
    )


@override_settings(DAILY_QUEST_COUNT=3)
class AssignTodaysQuestsTests(TestCase):
    def setUp(self):
        self.student = make_student()
        for index in range(5):
            make_quest(title=f"Quest {index}")

    def test_assigns_the_configured_number_of_quests(self):
        assignments = get_or_assign_todays_quests(self.student)
        self.assertEqual(len(assignments), 3)
        self.assertEqual(DailyQuestAssignment.objects.filter(student=self.student).count(), 3)

    def test_is_idempotent_within_the_same_day(self):
        first = get_or_assign_todays_quests(self.student)
        second = get_or_assign_todays_quests(self.student)

        self.assertEqual({a.pk for a in first}, {a.pk for a in second})
        self.assertEqual(DailyQuestAssignment.objects.filter(student=self.student).count(), 3)

    def test_never_assigns_draft_or_archived_quests(self):
        Quest.objects.update(status=Status.ARCHIVED)
        published = make_quest(title="The only live one", status=Status.PUBLISHED)

        assignments = get_or_assign_todays_quests(self.student)

        self.assertEqual([a.quest_id for a in assignments], [published.pk])

    def test_prefers_quests_the_student_has_not_seen(self):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        seen = list(Quest.objects.all()[:3])
        for quest in seen:
            DailyQuestAssignment.objects.create(
                student=self.student, quest=quest, assigned_date=yesterday
            )

        assignments = get_or_assign_todays_quests(self.student)
        unseen_ids = set(Quest.objects.exclude(pk__in=[q.pk for q in seen]).values_list("pk", flat=True))

        # Only 2 quests were never assigned, so both must appear in today's set
        # of 3 before any repeat is allowed to fill the last slot.
        self.assertTrue(unseen_ids.issubset({a.quest_id for a in assignments}))

    def test_returns_empty_when_the_catalog_is_empty(self):
        Quest.objects.all().delete()
        self.assertEqual(get_or_assign_todays_quests(self.student), [])


class CompleteQuestTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.quest = make_quest(points=25)
        self.assignment = DailyQuestAssignment.objects.create(
            student=self.student, quest=self.quest, assigned_date=timezone.localdate()
        )

    def test_awards_points_through_the_rewards_ledger(self):
        completed = complete_quest(assignment=self.assignment, reflection="Removed 3 posts.")

        self.assertEqual(completed.status, DailyQuestAssignment.AssignmentStatus.COMPLETED)
        self.assertEqual(completed.points_awarded, 25)
        self.assertIsNotNone(completed.completed_at)

        account = StudentPointsAccount.objects.get(student=self.student)
        self.assertEqual(account.balance, 25)

        txn = PointsTransaction.objects.get(quest_assignment=completed)
        self.assertEqual(txn.amount, 25)
        self.assertEqual(txn.transaction_type, PointsTransaction.TransactionType.QUEST_REWARD)
        self.assertEqual(txn.balance_after, 25)

    def test_cannot_be_completed_twice(self):
        complete_quest(assignment=self.assignment)

        with self.assertRaises(QuestAlreadyResolvedError):
            complete_quest(assignment=self.assignment)

        self.assertEqual(PointsTransaction.objects.filter(quest_assignment=self.assignment).count(), 1)
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 25)

    def test_editing_the_catalog_later_does_not_change_what_was_paid(self):
        completed = complete_quest(assignment=self.assignment)

        self.quest.points_reward = 500
        self.quest.save(update_fields=["points_reward"])

        completed.refresh_from_db()
        self.assertEqual(completed.points_awarded, 25)
        self.assertEqual(StudentPointsAccount.objects.get(student=self.student).balance, 25)

    def test_an_expired_assignment_cannot_be_completed(self):
        stale = DailyQuestAssignment.objects.create(
            student=self.student,
            quest=make_quest(title="Yesterday's quest"),
            assigned_date=timezone.localdate() - timedelta(days=1),
        )

        with self.assertRaises(QuestExpiredError):
            complete_quest(assignment=stale)

    def test_skipping_pays_nothing_and_blocks_later_completion(self):
        skipped = skip_quest(self.assignment)

        self.assertEqual(skipped.status, DailyQuestAssignment.AssignmentStatus.SKIPPED)
        self.assertFalse(PointsTransaction.objects.filter(quest_assignment=self.assignment).exists())
        with self.assertRaises(QuestAlreadyResolvedError):
            complete_quest(assignment=self.assignment)


class QuestStreakTests(TestCase):
    def setUp(self):
        self.student = make_student()
        self.quest = make_quest()

    def _complete_on(self, day):
        DailyQuestAssignment.objects.create(
            student=self.student,
            quest=self.quest,
            assigned_date=day,
            status=DailyQuestAssignment.AssignmentStatus.COMPLETED,
            points_awarded=10,
        )

    def test_no_completions_is_a_zero_streak(self):
        self.assertEqual(compute_quest_streak(self.student), 0)
        self.assertEqual(compute_longest_quest_streak(self.student), 0)

    def test_counts_consecutive_days_ending_today(self):
        today = timezone.localdate()
        for offset in range(3):
            self._complete_on(today - timedelta(days=offset))

        self.assertEqual(compute_quest_streak(self.student), 3)

    def test_streak_survives_a_today_that_is_not_done_yet(self):
        # Finished yesterday, nothing today — the streak is alive until midnight.
        today = timezone.localdate()
        self._complete_on(today - timedelta(days=1))
        self._complete_on(today - timedelta(days=2))

        self.assertEqual(compute_quest_streak(self.student), 2)

    def test_a_two_day_gap_breaks_the_streak(self):
        today = timezone.localdate()
        self._complete_on(today - timedelta(days=3))
        self._complete_on(today - timedelta(days=4))

        self.assertEqual(compute_quest_streak(self.student), 0)
        self.assertEqual(compute_longest_quest_streak(self.student), 2)

    def test_longest_streak_is_found_in_history(self):
        today = timezone.localdate()
        for offset in (10, 11, 12, 13):
            self._complete_on(today - timedelta(days=offset))
        self._complete_on(today)

        self.assertEqual(compute_quest_streak(self.student), 1)
        self.assertEqual(compute_longest_quest_streak(self.student), 4)


class QuestStatsTests(TestCase):
    def test_reports_todays_progress_and_lifetime_totals(self):
        student = make_student()
        quest = make_quest(points=15)
        today = timezone.localdate()

        DailyQuestAssignment.objects.create(
            student=student,
            quest=quest,
            assigned_date=today - timedelta(days=1),
            status=DailyQuestAssignment.AssignmentStatus.COMPLETED,
            points_awarded=15,
        )
        assignment = DailyQuestAssignment.objects.create(
            student=student, quest=make_quest(title="Today"), assigned_date=today
        )
        complete_quest(assignment=assignment)

        stats = get_quest_stats(student)

        self.assertEqual(stats["assigned_today"], 1)
        self.assertEqual(stats["completed_today"], 1)
        self.assertEqual(stats["points_today"], 10)
        self.assertEqual(stats["total_completed"], 2)
        self.assertEqual(stats["total_points_earned"], 25)
        self.assertEqual(stats["current_streak"], 2)
