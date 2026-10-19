"""Daily Quests — assignment, completion and streak logic.

Quests come from an admin-authored catalog and are auto-assigned in a daily
set per student (see `get_or_assign_todays_quests`). Completion is
self-attested with optional proof and pays out immediately through the
existing rewards ledger — there is no admin approval queue, so
`complete_quest` is the only place points are created for this app and it
always routes through `rewards.services.award_points` rather than touching
`StudentPointsAccount` itself.
"""

import random
from datetime import timedelta

from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Max
from django.utils import timezone

from common.models import Status
from rewards.models import PointsTransaction
from rewards.services import award_points

from .exceptions import QuestAlreadyResolvedError, QuestExpiredError
from .models import DailyQuestAssignment, Quest

AssignmentStatus = DailyQuestAssignment.AssignmentStatus


def _published_quests():
    return Quest.objects.filter(status=Status.PUBLISHED)


def _pick_quests_for(student, quest_date, count):
    """Chooses `count` published quests for one student/day.

    Quests the student has never been assigned come first (so the catalog is
    explored before anything repeats), then the least-recently-assigned ones
    — which is what stops a small catalog from showing the same three quests
    every morning. Ties are broken by an RNG seeded on (student, date) so the
    choice is stable: two requests on the same day that both somehow reach
    this function pick the same quests rather than racing to create
    different sets.
    """
    candidates = list(_published_quests())
    if not candidates:
        return []

    last_seen = {
        row["quest_id"]: row["last_date"]
        for row in (
            DailyQuestAssignment.objects.filter(student=student)
            .values("quest_id")
            .annotate(last_date=Max("assigned_date"))
        )
    }

    rng = random.Random(f"{student.pk}:{quest_date.isoformat()}")
    rng.shuffle(candidates)
    # `None` (never assigned) must sort before every real date, hence the
    # two-part key rather than a plain `last_seen.get(...)`.
    candidates.sort(key=lambda quest: (last_seen.get(quest.pk) is not None, last_seen.get(quest.pk) or quest_date))

    chosen = candidates[:count]
    # Prefer a varied set: if the slice is all one category but the catalog
    # has more variety available, swap the tail for the best unused category.
    if len({quest.category for quest in chosen}) == 1 and len(candidates) > len(chosen):
        for quest in candidates[len(chosen):]:
            if quest.category != chosen[0].category:
                chosen[-1] = quest
                break

    return chosen


def get_or_assign_todays_quests(student, quest_date=None):
    """Returns today's assignments for `student`, creating them on the first
    call of the day. Idempotent: a second call the same day returns the rows
    the first one created, and the unique constraint on
    (student, quest, assigned_date) makes that true even under concurrency.
    """
    quest_date = quest_date or timezone.localdate()

    existing = list(
        DailyQuestAssignment.objects.filter(student=student, assigned_date=quest_date).select_related("quest")
    )
    if existing:
        return existing

    chosen = _pick_quests_for(student, quest_date, settings.DAILY_QUEST_COUNT)
    if not chosen:
        return []

    try:
        with transaction.atomic():
            DailyQuestAssignment.objects.bulk_create(
                [
                    DailyQuestAssignment(student=student, quest=quest, assigned_date=quest_date)
                    for quest in chosen
                ]
            )
    except IntegrityError:
        # A concurrent request won the race and created the same set first —
        # its rows are the canonical ones, so fall through and read them.
        pass

    return list(
        DailyQuestAssignment.objects.filter(student=student, assigned_date=quest_date).select_related("quest")
    )


def complete_quest(*, assignment, reflection="", proof_file=None, proof_original_name="", proof_url=""):
    """Marks one assignment complete and pays its points, atomically.

    Re-reads the row under `select_for_update` before checking its status so
    a double-submit (two taps on "Mark Complete") can't award the same quest
    twice — the second call finds it already COMPLETED and raises.
    """
    today = timezone.localdate()

    with transaction.atomic():
        assignment = DailyQuestAssignment.objects.select_for_update().select_related("quest").get(
            pk=assignment.pk
        )

        if assignment.status != AssignmentStatus.ASSIGNED:
            raise QuestAlreadyResolvedError("This quest has already been resolved.")
        if assignment.assigned_date < today:
            raise QuestExpiredError("This quest expired — it belongs to an earlier day.")

        points = assignment.quest.points_reward

        assignment.status = AssignmentStatus.COMPLETED
        assignment.completed_at = timezone.now()
        assignment.points_awarded = points
        assignment.reflection = reflection or ""
        assignment.proof_url = proof_url or None
        if proof_file is not None:
            assignment.proof_file = proof_file
            assignment.proof_original_name = proof_original_name
        assignment.save()

        if points:
            award_points(
                student=assignment.student,
                amount=points,
                transaction_type=PointsTransaction.TransactionType.QUEST_REWARD,
                reason=f"Daily Quest: {assignment.quest.title}",
                quest_assignment=assignment,
            )

    return assignment


def skip_quest(assignment):
    """Dismisses a quest for the day without points. Kept distinct from
    simply leaving it ASSIGNED so the student's history shows a deliberate
    pass rather than an unexplained gap, and so a skipped quest stops
    counting against today's completion ratio."""
    today = timezone.localdate()

    with transaction.atomic():
        assignment = DailyQuestAssignment.objects.select_for_update().get(pk=assignment.pk)
        if assignment.status != AssignmentStatus.ASSIGNED:
            raise QuestAlreadyResolvedError("This quest has already been resolved.")
        if assignment.assigned_date < today:
            raise QuestExpiredError("This quest expired — it belongs to an earlier day.")
        assignment.status = AssignmentStatus.SKIPPED
        assignment.save(update_fields=["status", "updated_at"])

    return assignment


def _completion_dates(student):
    return set(
        DailyQuestAssignment.objects.filter(
            student=student, status=AssignmentStatus.COMPLETED
        ).values_list("assigned_date", flat=True)
    )


def compute_quest_streak(student):
    """Consecutive days ending today (or yesterday) on which the student
    completed at least one quest. Always derived from the assignment rows —
    never stored — so it can't go stale, matching
    `daily_drill.services.get_streak_status`.
    """
    dates = _completion_dates(student)
    if not dates:
        return 0

    today = timezone.localdate()
    # A streak stays alive until midnight: if today isn't done yet, count
    # back from yesterday instead of reporting a broken streak at 00:01.
    cursor = today if today in dates else today - timedelta(days=1)
    if cursor not in dates:
        return 0

    streak = 0
    while cursor in dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def compute_longest_quest_streak(student):
    dates = sorted(_completion_dates(student))
    if not dates:
        return 0

    longest = current = 1
    for previous, day in zip(dates, dates[1:]):
        current = current + 1 if (day - previous).days == 1 else 1
        longest = max(longest, current)
    return longest


def get_quest_stats(student, quest_date=None):
    """Header/progress numbers for the Quests tab."""
    quest_date = quest_date or timezone.localdate()
    todays = DailyQuestAssignment.objects.filter(student=student, assigned_date=quest_date)
    completed_today = todays.filter(status=AssignmentStatus.COMPLETED)

    all_completed = DailyQuestAssignment.objects.filter(student=student, status=AssignmentStatus.COMPLETED)
    total_points = sum(all_completed.values_list("points_awarded", flat=True))

    return {
        "date": quest_date.isoformat(),
        "assigned_today": todays.count(),
        "completed_today": completed_today.count(),
        "points_today": sum(completed_today.values_list("points_awarded", flat=True)),
        "total_completed": all_completed.count(),
        "total_points_earned": total_points,
        "current_streak": compute_quest_streak(student),
        "longest_streak": compute_longest_quest_streak(student),
    }
