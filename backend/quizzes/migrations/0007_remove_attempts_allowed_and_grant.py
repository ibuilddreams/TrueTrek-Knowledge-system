# Final step of the quiz-attempt redesign: attempts are now unlimited, and
# the self-service-retry/teacher-grant feature built around the old cap
# (QuizAttemptGrant) is removed along with it. No code references either
# by this point.
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('quizzes', '0006_backfill_number_of_questions'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='quiz',
            name='attempts_allowed',
        ),
        migrations.DeleteModel(
            name='QuizAttemptGrant',
        ),
    ]
