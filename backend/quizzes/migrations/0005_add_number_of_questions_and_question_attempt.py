# Additive-only step of the quiz-attempt redesign (unlimited attempts +
# AI-regenerated retries): adds Quiz.number_of_questions and the nullable
# Question.attempt FK. Every existing Question row is correctly attempt=NULL
# (template) by construction — no backfill needed for that field.
# Quiz.number_of_questions is backfilled from existing question counts in
# the next migration. Quiz.attempts_allowed / QuizAttemptGrant are dropped
# in the migration after that, once no code references them anymore.

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quizzes', '0004_quizattemptgrant'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='attempt',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='quizzes.quizattempt'),
        ),
        migrations.AddField(
            model_name='quiz',
            name='number_of_questions',
            field=models.PositiveIntegerField(default=10, validators=[django.core.validators.MinValueValidator(1)]),
        ),
    ]
