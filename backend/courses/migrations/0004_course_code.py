from django.db import migrations, models
from django.utils.text import slugify


def populate_course_codes(apps, schema_editor):
    Course = apps.get_model("courses", "Course")
    used = set()

    for course in Course.objects.all().order_by("id"):
        base = (course.slug or slugify(course.title) or f"course-{course.id}").upper().replace("-", "")
        base = "".join(char for char in base if char.isalnum())[:40] or f"COURSE{course.id}"
        candidate = base
        suffix = 1
        while candidate in used or Course.objects.filter(code__iexact=candidate).exclude(pk=course.pk).exists():
            candidate = f"{base[:40]}{suffix}"
            suffix += 1
        course.code = candidate
        course.save(update_fields=["code"])
        used.add(candidate)


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0003_remove_category_description"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="code",
            field=models.CharField(blank=True, default="", max_length=50),
        ),
        migrations.RunPython(populate_course_codes, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="course",
            name="code",
            field=models.CharField(max_length=50, unique=True),
        ),
    ]
