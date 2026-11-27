"""Quiz-domain constants shared across apps.

Lives here rather than in settings because these are facts about the quiz
model, not per-deployment configuration: `ai_courses` writes quizzes through
`quizzes.models` and has to agree with the quiz API about how big one can be,
exactly as it already shares `quizzes.question_repair`'s repair rules.
"""

# The largest question set a single quiz attempt may be asked for — both the
# manual/API `Quiz.number_of_questions` and `ai_courses`' `questions_per_quiz`.
#
# Raised from 20 so a quiz can be a real exam rather than a spot check. Two
# things had to change with it and neither is optional: a retry's AI call is
# split into parallel batches (quizzes/ai_generation.py) so a set this size
# still lands inside one synchronous request, and both admin/teacher quiz
# forms carry the same bound so the UI can never offer a number the API
# rejects.
MAX_QUESTIONS_PER_QUIZ = 70

# What a quiz is created with when nobody says otherwise — kept in step with
# `Quiz.number_of_questions`' model default, which `ai_courses` also defaults to
# so a generated quiz is not quietly shorter than an authored one.
DEFAULT_QUESTIONS_PER_QUIZ = 10
