from django.contrib import admin

from .models import GeneratedReport, ReportExport


class ReportExportInline(admin.TabularInline):
    model = ReportExport
    extra = 0


@admin.register(GeneratedReport)
class GeneratedReportAdmin(admin.ModelAdmin):
    list_display = ("report_type", "generated_by", "generated_at")
    list_filter = ("report_type",)
    search_fields = ("generated_by__username",)
    autocomplete_fields = ("generated_by",)
    inlines = (ReportExportInline,)


@admin.register(ReportExport)
class ReportExportAdmin(admin.ModelAdmin):
    list_display = ("report", "export_format", "status", "created_at")
    list_filter = ("export_format", "status")
    search_fields = ("report__generated_by__username",)
    autocomplete_fields = ("report",)
