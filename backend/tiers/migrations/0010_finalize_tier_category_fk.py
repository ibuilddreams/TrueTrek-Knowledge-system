import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tiers", "0009_backfill_tier_category_fk"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="tier",
            name="category",
        ),
        migrations.RenameField(
            model_name="tier",
            old_name="category_fk",
            new_name="category",
        ),
        migrations.AlterField(
            model_name="tier",
            name="category",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tiers",
                to="courses.category",
            ),
        ),
    ]
