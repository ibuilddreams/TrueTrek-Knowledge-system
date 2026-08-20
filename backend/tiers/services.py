from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from common.ordering import get_next_order
from pathways.models import PathwayCourse
from progress.models import CourseProgress

from .models import Tier, TierPathway, TierProgress


class TierReorderError(Exception):
    pass


class TierPathwayError(Exception):
    pass


def get_or_create_tier_progress(student):
    """Lazily ensures a TierProgress row exists for every Tier for this student.

    Called on first read rather than eagerly for every student at signup, to avoid
    a mass row-creation job every time a new Tier is added. Every tier starts LOCKED
    (the model default) — no tier is free; a tier only ever becomes UNLOCKED via an
    actual pathway purchase (see unlock_tier_for_purchase).
    """
    existing_tier_ids = set(
        TierProgress.objects.filter(student=student).values_list("tier_id", flat=True)
    )
    missing_tiers = Tier.objects.exclude(id__in=existing_tier_ids)

    new_rows = [TierProgress(student=student, tier=tier) for tier in missing_tiers]

    if new_rows:
        TierProgress.objects.bulk_create(new_rows)

    return TierProgress.objects.filter(student=student).select_related("tier").order_by("tier__level")


def _course_ids_for_tier(tier):
    pathway_ids = TierPathway.objects.filter(tier=tier).values_list("pathway_id", flat=True)
    return set(PathwayCourse.objects.filter(pathway_id__in=pathway_ids).values_list("course_id", flat=True))


def recalculate_tier_progress(student, tier):
    course_ids = _course_ids_for_tier(tier)
    total = len(course_ids)

    if total == 0:
        percentage = Decimal(0)
    else:
        completed = CourseProgress.objects.filter(
            student=student, course_id__in=course_ids, is_completed=True
        ).count()
        percentage = (Decimal(completed) / Decimal(total) * 100).quantize(Decimal("0.01"))

    progress, _ = TierProgress.objects.get_or_create(student=student, tier=tier)
    progress.progress_percentage = percentage

    # A LOCKED tier has never been purchased, so its status is untouched here — only
    # unlock_tier_for_purchase is allowed to move a tier out of LOCKED.
    if progress.status != TierProgress.ProgressStatus.LOCKED:
        if percentage >= 100:
            progress.status = TierProgress.ProgressStatus.COMPLETED
            if not progress.completed_at:
                progress.completed_at = timezone.now()
        elif percentage > 0:
            progress.status = TierProgress.ProgressStatus.IN_PROGRESS
        else:
            progress.status = TierProgress.ProgressStatus.UNLOCKED

    progress.save()

    return progress


def unlock_tier_for_purchase(student, tier):
    """Buying a pathway grants real access to it regardless of tier sequence —
    a student can purchase a Tier 8 pathway without ever touching Tiers 1-7, so
    tier unlock can't be purely sequential. This is the one place allowed to
    flip a LOCKED tier straight to UNLOCKED outside the normal progression
    chain in recalculate_tier_progress."""
    progress, _ = TierProgress.objects.get_or_create(student=student, tier=tier)
    if progress.status == TierProgress.ProgressStatus.LOCKED:
        progress.status = TierProgress.ProgressStatus.UNLOCKED
        progress.unlocked_at = timezone.now()
        progress.save()
    return progress


def reorder_tiers(entries):
    tier_ids = [entry["tier_id"] for entry in entries]

    if len(tier_ids) != len(set(tier_ids)):
        raise TierReorderError("Duplicate tier ids are not allowed.")

    levels = [entry["level"] for entry in entries]
    if len(levels) != len(set(levels)):
        raise TierReorderError("Duplicate level values are not allowed.")

    existing_ids = set(Tier.objects.values_list("id", flat=True))
    if set(tier_ids) != existing_ids:
        raise TierReorderError("Submitted tier ids must exactly match every existing tier.")

    # Staged through a temporary offset range — `level` is a globally unique field,
    # same non-deferrable-index reasoning as assignments.services.reorder_assignments.
    temp_offset = max(levels) + 1
    with transaction.atomic():
        for index, entry in enumerate(entries):
            Tier.objects.filter(pk=entry["tier_id"]).update(level=temp_offset + index)
        for entry in entries:
            Tier.objects.filter(pk=entry["tier_id"]).update(level=entry["level"])

    return Tier.objects.order_by("level")


def attach_pathway_to_tier(tier, pathway):
    if TierPathway.objects.filter(tier=tier, pathway=pathway).exists():
        raise TierPathwayError("This pathway is already attached to this tier.")
    return TierPathway.objects.create(
        tier=tier, pathway=pathway, order=get_next_order(TierPathway.objects.filter(tier=tier))
    )


def reorder_tier_pathways(tier_id, entries):
    tierpathway_ids = [entry["tierpathway_id"] for entry in entries]

    if len(tierpathway_ids) != len(set(tierpathway_ids)):
        raise TierPathwayError("Duplicate tier-pathway ids are not allowed.")

    orders = [entry["order"] for entry in entries]
    if len(orders) != len(set(orders)):
        raise TierPathwayError("Duplicate order values are not allowed.")

    existing_ids = set(TierPathway.objects.filter(tier_id=tier_id).values_list("id", flat=True))
    if set(tierpathway_ids) != existing_ids:
        raise TierPathwayError(
            "Submitted ids must exactly match the pathways attached to this tier."
        )

    # Staged through a temporary offset range — same non-deferrable-index reasoning
    # as assignments.services.reorder_assignments / pathways.services.reorder_pathway_courses.
    temp_offset = max(orders) + 1
    with transaction.atomic():
        for index, entry in enumerate(entries):
            TierPathway.objects.filter(pk=entry["tierpathway_id"], tier_id=tier_id).update(
                order=temp_offset + index
            )
        for entry in entries:
            TierPathway.objects.filter(pk=entry["tierpathway_id"], tier_id=tier_id).update(
                order=entry["order"]
            )

    return TierPathway.objects.select_related("pathway").filter(tier_id=tier_id).order_by("order")
