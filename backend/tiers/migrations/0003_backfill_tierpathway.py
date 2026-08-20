from django.db import migrations


def backfill_tier_pathway(apps, schema_editor):
    Pathway = apps.get_model("pathways", "Pathway")
    TierPathway = apps.get_model("tiers", "TierPathway")

    for pathway in Pathway.objects.filter(tier__isnull=False):
        TierPathway.objects.get_or_create(
            tier_id=pathway.tier_id,
            pathway_id=pathway.id,
            defaults={"order": pathway.order or 1},
        )


def noop_reverse(apps, schema_editor):
    # Nothing to reverse into — Pathway.tier/order are removed by a later
    # migration in the same forward sequence, so there's no field to restore.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tiers", "0002_tierpathway"),
        ("pathways", "0003_pathway_order_pathway_tier_and_more"),
    ]

    operations = [
        migrations.RunPython(backfill_tier_pathway, noop_reverse),
    ]
