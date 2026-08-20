from django.db import migrations


def backfill_unlocks(apps, schema_editor):
    """Before the unlock_tiers_on_pathway_purchase signal existed, buying a
    pathway never unlocked the tier(s) it belongs to unless the sequential
    tier-progression chain happened to reach it first. This catches up any
    PathwayEnrollment that predates the signal."""
    PathwayEnrollment = apps.get_model("pathways", "PathwayEnrollment")
    TierPathway = apps.get_model("tiers", "TierPathway")
    TierProgress = apps.get_model("tiers", "TierProgress")

    for enrollment in PathwayEnrollment.objects.all():
        tier_ids = TierPathway.objects.filter(pathway_id=enrollment.pathway_id).values_list(
            "tier_id", flat=True
        )
        for tier_id in tier_ids:
            progress, created = TierProgress.objects.get_or_create(
                student_id=enrollment.user_id,
                tier_id=tier_id,
                defaults={"status": "UNLOCKED", "unlocked_at": enrollment.enrolled_at},
            )
            if not created and progress.status == "LOCKED":
                progress.status = "UNLOCKED"
                progress.unlocked_at = enrollment.enrolled_at
                progress.save(update_fields=["status", "unlocked_at"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tiers", "0004_tier_category_tier_estimated_duration"),
        ("pathways", "0004_remove_pathway_unique_pathway_order_per_tier_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_unlocks, noop_reverse),
    ]
