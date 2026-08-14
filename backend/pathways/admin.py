from django.contrib import admin

from .models import Pathway, PathwayBundleRule, PathwayCourse, PathwayEnrollment


class PathwayCourseInline(admin.TabularInline):
    model = PathwayCourse
    extra = 1
    fields = ("course", "order")
    autocomplete_fields = ("course",)


@admin.register(Pathway)
class PathwayAdmin(admin.ModelAdmin):
    list_display = ("name", "status", "base_price", "created_at")
    list_filter = ("status",)
    search_fields = ("name",)
    inlines = (PathwayCourseInline,)


@admin.register(PathwayBundleRule)
class PathwayBundleRuleAdmin(admin.ModelAdmin):
    list_display = ("pathway_count", "discount_percent")


@admin.register(PathwayEnrollment)
class PathwayEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("user", "pathway", "status", "price_paid", "enrolled_at")
    list_filter = ("status",)
    search_fields = ("user__email", "pathway__name")
    autocomplete_fields = ("user", "pathway")
