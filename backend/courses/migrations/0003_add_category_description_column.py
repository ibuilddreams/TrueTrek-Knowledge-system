from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0002_tag_course_difficulty_course_duration_minutes_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='description',
            field=models.TextField(blank=True),
        ),
    ]
