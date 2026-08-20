import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tiers", "0007_relock_unpurchased_tiers"),
        ("courses", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="tier",
            name="category_fk",
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tiers_pending_migration",
                to="courses.category",
            ),
        ),
    ]
