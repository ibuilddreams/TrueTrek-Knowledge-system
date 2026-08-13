from django.contrib import admin

from .models import DrillAttempt, DrillOption, DrillQuestion


class DrillOptionInline(admin.TabularInline):
    model = DrillOption
    extra = 1


@admin.register(DrillQuestion)
class DrillQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "scenario", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("scenario", "guidelines")
    inlines = [DrillOptionInline]


@admin.register(DrillAttempt)
class DrillAttemptAdmin(admin.ModelAdmin):
    list_display = ("student", "question", "attempt_date", "score_awarded", "xp_earned")
    list_filter = ("attempt_date",)
    search_fields = ("student__username", "student__email")
    autocomplete_fields = ("student", "question")
