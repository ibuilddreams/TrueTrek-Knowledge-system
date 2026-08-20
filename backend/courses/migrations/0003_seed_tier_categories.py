from django.db import migrations
from django.utils.text import slugify

TIER_CATEGORY_NAMES = ["Athletic", "Academic", "Professional", "Vocational", "Foundation", "Legacy"]


def seed_categories(apps, schema_editor):
    """Tiers used to pick their category from a hardcoded Python enum, disconnected
    from the real Category model courses already use. These are the same six labels
    that enum offered, added as real Category rows so Tier.category can become a
    proper FK shared with Course.category instead of a second, fixed vocabulary."""
    Category = apps.get_model("courses", "Category")
    for name in TIER_CATEGORY_NAMES:
        Category.objects.get_or_create(name=name, defaults={"slug": slugify(name)})


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(seed_categories, noop_reverse),
    ]
