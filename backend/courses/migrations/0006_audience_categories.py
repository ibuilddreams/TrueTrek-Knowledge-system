from django.db import migrations
from django.utils.text import slugify

# Audience-track categories (mirroring the homepage's Scholars & Founders,
# Coaches & Mentors and Legacy & Family Offices tracks) plus the existing
# courses that belong under them, as {category: {course code: previous category}}.
# The previous category is kept so the migration can be reversed.
AUDIENCE_CATEGORIES = {   'Coaches & Mentors': {   'OM-HEALTH': 'Athletic',
                             'OM-MEDIA': 'Vocational',
                             'OM-PSYCH': 'Vocational'},
    'Legacy & Family Offices': {'MB-BIBLICAL-ECON': 'Vocational', 'MB-STEWARD': 'Vocational'},
    'Scholars & Founders': {   'ABEKA-ECON': 'Academic',
                               'AOP-ECON': 'Academic',
                               'BJU-ECON': 'Academic',
                               'MP-LOGIC1': 'Vocational',
                               'MP-LOGIC2': 'Vocational',
                               'OM-ECON': 'Academic'}}


def apply_audience_categories(apps, schema_editor):
    Category = apps.get_model("courses", "Category")
    Course = apps.get_model("courses", "Course")

    for new_name, courses in AUDIENCE_CATEGORIES.items():
        # Historical models skip Category.save(), so the slug is set explicitly.
        new_category, _ = Category.objects.get_or_create(
            name=new_name, defaults={"slug": slugify(new_name)}
        )
        Course.objects.filter(code__in=courses.keys()).update(category=new_category)


def revert_audience_categories(apps, schema_editor):
    Category = apps.get_model("courses", "Category")
    Course = apps.get_model("courses", "Course")

    for new_name, courses in AUDIENCE_CATEGORIES.items():
        for code, old_name in courses.items():
            old_category = Category.objects.filter(name=old_name).first()
            if old_category:
                Course.objects.filter(code=code).update(category=old_category)
        Category.objects.filter(name=new_name, courses__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0005_course_grade_range"),
    ]

    operations = [
        migrations.RunPython(apply_audience_categories, revert_audience_categories),
    ]
