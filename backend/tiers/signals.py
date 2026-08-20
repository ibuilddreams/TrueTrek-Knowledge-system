from django.db.models.signals import post_save
from django.dispatch import receiver

from pathways.models import PathwayEnrollment
from progress.models import CourseProgress

from .models import Tier
from .services import recalculate_tier_progress, unlock_tier_for_purchase


@receiver(post_save, sender=CourseProgress)
def recalculate_tier_progress_on_course_progress_change(sender, instance, **kwargs):
    affected_tiers = Tier.objects.filter(
        tier_pathways__pathway__pathway_courses__course_id=instance.course_id
    ).distinct()
    for tier in affected_tiers:
        recalculate_tier_progress(instance.student, tier)


@receiver(post_save, sender=PathwayEnrollment)
def unlock_tiers_on_pathway_purchase(sender, instance, created, **kwargs):
    """Buying a pathway immediately unlocks every tier it belongs to — tier
    unlock isn't purely sequential, since pathways are purchasable independently
    of tier order (e.g. buying a Tier 8 pathway without ever touching Tier 1-7)."""
    if not created:
        return
    affected_tiers = Tier.objects.filter(tier_pathways__pathway=instance.pathway).distinct()
    for tier in affected_tiers:
        unlock_tier_for_purchase(instance.user, tier)
        recalculate_tier_progress(instance.user, tier)
