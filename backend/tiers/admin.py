from django.contrib import admin

from .models import Tier, TierPathway, TierProgress


class TierPathwayInline(admin.TabularInline):
    model = TierPathway
    extra = 1
    fields = ("pathway", "order")
    autocomplete_fields = ("pathway",)


@admin.register(Tier)
class TierAdmin(admin.ModelAdmin):
    list_display = ("level", "name", "status", "audience")
    list_filter = ("status",)
    search_fields = ("name",)
    inlines = (TierPathwayInline,)


@admin.register(TierProgress)
class TierProgressAdmin(admin.ModelAdmin):
    list_display = ("student", "tier", "status", "progress_percentage", "unlocked_at", "completed_at")
    list_filter = ("status", "tier")
    search_fields = ("student__email", "tier__name")
    autocomplete_fields = ("student", "tier")
