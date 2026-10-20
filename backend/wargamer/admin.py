from django.contrib import admin

from .models import RolePlayScenario, RolePlaySession, RolePlayTurn


@admin.register(RolePlayScenario)
class RolePlayScenarioAdmin(admin.ModelAdmin):
    list_display = ("code", "title", "relationship", "pressure_type", "persona", "status")
    list_filter = ("status", "relationship", "pressure_type", "persona", "difficulty")
    search_fields = ("code", "title", "key_skill", "counterpart_role")
    readonly_fields = ("created_at", "updated_at")


class RolePlayTurnInline(admin.TabularInline):
    model = RolePlayTurn
    extra = 0
    readonly_fields = ("speaker", "content", "order", "seconds_from_start", "pressure_level")
    can_delete = False


@admin.register(RolePlaySession)
class RolePlaySessionAdmin(admin.ModelAdmin):
    list_display = ("student", "scenario", "status", "overall_score", "passed", "created_at")
    list_filter = ("status", "passed", "persona", "used_fabricated_excuse")
    search_fields = ("student__email", "scenario__code", "scenario__title")
    readonly_fields = ("created_at", "updated_at", "started_at", "completed_at")
    inlines = [RolePlayTurnInline]
