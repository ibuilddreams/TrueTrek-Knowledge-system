from django.db import migrations

CATEGORY_CODE_TO_NAME = {
    "ATHLETIC": "Athletic",
    "ACADEMIC": "Academic",
    "PROFESSIONAL": "Professional",
    "VOCATIONAL": "Vocational",
    "FOUNDATION": "Foundation",
    "LEGACY": "Legacy",
}


def backfill_category_fk(apps, schema_editor):
    Tier = apps.get_model("tiers", "Tier")
    Category = apps.get_model("courses", "Category")

    for tier in Tier.objects.all():
        category_name = CATEGORY_CODE_TO_NAME.get(tier.category)
        if not category_name:
            continue
        tier.category_fk = Category.objects.get(name=category_name)
        tier.save(update_fields=["category_fk"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("tiers", "0008_tier_category_fk"),
        ("courses", "0003_seed_tier_categories"),
    ]

    operations = [
        migrations.RunPython(backfill_category_fk, noop_reverse),
    ]
