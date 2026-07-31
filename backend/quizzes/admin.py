from django.contrib import admin

from .models import Choice, Question, Quiz, QuizAnswer, QuizAttempt, QuizResult


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1
    fields = ("text", "question_type", "order")


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 2


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "course",
        "status",
        "passing_score",
        "attempts_allowed",
        "time_limit_minutes",
        "order",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = ("title", "course__title")
    autocomplete_fields = ("course", "module")
    inlines = (QuestionInline,)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("text", "quiz", "question_type", "marks", "order")
    list_filter = ("question_type",)
    search_fields = ("text", "quiz__title")
    autocomplete_fields = ("quiz",)
    inlines = (ChoiceInline,)


@admin.register(Choice)
class ChoiceAdmin(admin.ModelAdmin):
    list_display = ("text", "question", "is_correct")
    list_filter = ("is_correct",)
    search_fields = ("text", "question__text")
    autocomplete_fields = ("question",)


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ("student", "quiz", "attempt_number", "status", "started_at", "ended_at")
    list_filter = ("quiz", "status")
    search_fields = ("student__username", "quiz__title")
    autocomplete_fields = ("student", "quiz")


@admin.register(QuizAnswer)
class QuizAnswerAdmin(admin.ModelAdmin):
    list_display = ("attempt", "question", "selected_choice", "marks_awarded", "grading_status")
    list_filter = ("grading_status",)
    search_fields = ("attempt__student__username", "question__text")
    autocomplete_fields = ("attempt", "question", "selected_choice")


@admin.register(QuizResult)
class QuizResultAdmin(admin.ModelAdmin):
    list_display = ("attempt", "score", "percentage", "is_passed")
    list_filter = ("is_passed",)
    search_fields = ("attempt__student__username", "attempt__quiz__title")
    autocomplete_fields = ("attempt",)
