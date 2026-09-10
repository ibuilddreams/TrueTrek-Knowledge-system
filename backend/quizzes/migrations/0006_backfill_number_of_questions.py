# Backfills Quiz.number_of_questions from each quiz's current template
# question count, now that the field exists (0005) but before Question.attempt
# has any non-NULL rows — every Question at this point in history is
# unambiguously a template question, so a plain count is correct.
from django.db import migrations


def backfill_number_of_questions(apps, schema_editor):
    Quiz = apps.get_model('quizzes', 'Quiz')
    for quiz in Quiz.objects.all():
        count = quiz.questions.count()
        quiz.number_of_questions = count if count > 0 else 10
        quiz.save(update_fields=['number_of_questions'])


class Migration(migrations.Migration):

    dependencies = [
        ('quizzes', '0005_add_number_of_questions_and_question_attempt'),
    ]

    operations = [
        migrations.RunPython(backfill_number_of_questions, migrations.RunPython.noop),
    ]
