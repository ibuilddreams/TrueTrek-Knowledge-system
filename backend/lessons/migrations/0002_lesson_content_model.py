from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lessons', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='lesson',
            name='content',
        ),
        migrations.AddField(
            model_name='lesson',
            name='content_type',
            field=models.CharField(
                choices=[('VIDEO', 'Video'), ('PDF', 'PDF'), ('DOCUMENT', 'Document')],
                default='DOCUMENT',
                max_length=20,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='lesson',
            name='video_url',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='lesson',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to='lessons/'),
        ),
        migrations.AlterField(
            model_name='lesson',
            name='duration_minutes',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
        migrations.DeleteModel(
            name='LessonAttachment',
        ),
        migrations.DeleteModel(
            name='LessonResource',
        ),
        migrations.DeleteModel(
            name='VideoLesson',
        ),
    ]
