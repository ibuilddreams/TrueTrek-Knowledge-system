from django.contrib import admin

from .models import (
    AdminDrillProgress,
    AdminDrillQuizChoice,
    AdminDrillQuizQuestion,
    AdminDrillSchedule,
    AIDrillGeneration,
    DrillAttempt,
    DrillOption,
    DrillQuestion,
)


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


class AdminDrillQuizChoiceInline(admin.TabularInline):
    model = AdminDrillQuizChoice
    extra = 1


class AdminDrillQuizQuestionInline(admin.StackedInline):
    model = AdminDrillQuizQuestion
    extra = 0


@admin.register(AdminDrillSchedule)
class AdminDrillScheduleAdmin(admin.ModelAdmin):
    list_display = ("title", "scheduled_date", "status", "reward_points", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "description")
    inlines = [AdminDrillQuizQuestionInline]


@admin.register(AIDrillGeneration)
class AIDrillGenerationAdmin(admin.ModelAdmin):
    list_display = ("student", "drill_date", "topic", "difficulty", "is_completed", "points_awarded")
    list_filter = ("difficulty", "is_completed")
    search_fields = ("student__username", "student__email", "topic")
    autocomplete_fields = ("student",)
    readonly_fields = [f.name for f in AIDrillGeneration._meta.fields]

    def has_add_permission(self, request):
        return False


@admin.register(AdminDrillProgress)
class AdminDrillProgressAdmin(admin.ModelAdmin):
    list_display = ("student", "schedule", "status", "video_progress_percent", "score_percent", "points_awarded")
    list_filter = ("status",)
    search_fields = ("student__username", "student__email", "schedule__title")
    autocomplete_fields = ("student", "schedule")
