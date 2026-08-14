from django.contrib import admin

from .models import (
    OnboardingProgress,
    Question,
    QuestionOption,
    QuestionOptionPathwayWeight,
    QuestionnaireAnswer,
)


class QuestionOptionPathwayWeightInline(admin.TabularInline):
    model = QuestionOptionPathwayWeight
    extra = 1
    autocomplete_fields = ("pathway",)


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 1
    fields = ("text", "order")


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("text", "order", "is_multi_select", "is_active", "created_at")
    list_filter = ("is_multi_select", "is_active")
    search_fields = ("text",)
    inlines = (QuestionOptionInline,)


@admin.register(QuestionOption)
class QuestionOptionAdmin(admin.ModelAdmin):
    list_display = ("text", "question", "order")
    search_fields = ("text", "question__text")
    autocomplete_fields = ("question",)
    inlines = (QuestionOptionPathwayWeightInline,)


@admin.register(QuestionnaireAnswer)
class QuestionnaireAnswerAdmin(admin.ModelAdmin):
    list_display = ("user", "question", "option", "created_at")
    search_fields = ("user__email", "question__text")
    autocomplete_fields = ("user", "question", "option")


@admin.register(OnboardingProgress)
class OnboardingProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "step", "updated_at")
    list_filter = ("step",)
    search_fields = ("user__email",)
    autocomplete_fields = ("user",)
