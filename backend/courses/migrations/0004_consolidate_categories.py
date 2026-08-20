from django.db import migrations

# Courses used to accumulate one-off categories (Athletics, Business, Humanities, ...)
# independently of the six canonical categories Tiers now share with Courses (Athletic,
# Academic, Professional, Vocational, Foundation, Legacy). Map every legacy category to
# its closest canonical match so Category becomes one curated list instead of two
# divergent vocabularies.
OLD_TO_NEW_CATEGORY = {
    "Athletics": "Athletic",
    "The Blueprint": "Athletic",
    "Business": "Professional",
    "Communication": "Academic",
    "Humanities": "Academic",
    "Mathematics": "Academic",
    "Science": "Academic",
    "Technology": "Vocational",
}


def consolidate_categories(apps, schema_editor):
    Category = apps.get_model("courses", "Category")
    Course = apps.get_model("courses", "Course")

    for old_name, new_name in OLD_TO_NEW_CATEGORY.items():
        old_category = Category.objects.filter(name=old_name).first()
        if not old_category:
            continue
        new_category = Category.objects.get(name=new_name)
        Course.objects.filter(category=old_category).update(category=new_category)
        old_category.delete()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0003_seed_tier_categories"),
    ]

    operations = [
        migrations.RunPython(consolidate_categories, noop_reverse),
    ]
