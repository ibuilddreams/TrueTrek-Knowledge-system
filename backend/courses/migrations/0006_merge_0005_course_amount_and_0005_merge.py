# Generated manually to resolve conflicting leaf migrations:
# 0005_course_amount and 0005_merge_20260803_1739

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0005_course_amount"),
        ("courses", "0005_merge_20260803_1739"),
    ]

    operations = []
