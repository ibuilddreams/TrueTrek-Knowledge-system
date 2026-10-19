from django.contrib import admin

from .models import DailyQuestAssignment, Quest


@admin.register(Quest)
class QuestAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "difficulty", "points_reward", "status")
    list_filter = ("status", "category", "difficulty")
    search_fields = ("title", "instructions")


@admin.register(DailyQuestAssignment)
class DailyQuestAssignmentAdmin(admin.ModelAdmin):
    list_display = ("student", "quest", "assigned_date", "status", "points_awarded")
    list_filter = ("status", "assigned_date")
    search_fields = ("student__email", "quest__title")
