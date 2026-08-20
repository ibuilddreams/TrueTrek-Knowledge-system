from django.db import migrations


def relock_unpurchased_tiers(apps, schema_editor):
    """Tier unlock used to default Tier 1 to UNLOCKED for every student, and cascade
    the next tier open once a percentage threshold was crossed — neither had anything
    to do with an actual purchase. Now that unlock only ever comes from buying a
    pathway attached to the tier, any non-LOCKED TierProgress row for a tier the
    student never bought into is stale data from the old rule and must be reset."""
    TierProgress = apps.get_model("tiers", "TierProgress")
    TierPathway = apps.get_model("tiers", "TierPathway")
    PathwayEnrollment = apps.get_model("pathways", "PathwayEnrollment")

    for progress in TierProgress.objects.exclude(status="LOCKED").select_related("tier"):
        purchased_pathway_ids = set(
            TierPathway.objects.filter(tier_id=progress.tier_id).values_list("pathway_id", flat=True)
        )
        has_purchase = (
            purchased_pathway_ids
            and PathwayEnrollment.objects.filter(
                user_id=progress.student_id, pathway_id__in=purchased_pathway_ids
            ).exists()
        )
        if not has_purchase:
            progress.status = "LOCKED"
            progress.unlocked_at = None
            progress.completed_at = None
            progress.save(update_fields=["status", "unlocked_at", "completed_at"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tiers", "0006_remove_tier_unlock_threshold_percent"),
    ]

    operations = [
        migrations.RunPython(relock_unpurchased_tiers, noop_reverse),
    ]
