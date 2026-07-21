from django.contrib import admin

from .models import Module


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order", "created_at")
    list_filter = ("course",)
    search_fields = ("title", "course__title")
    ordering = ("course", "order")
    autocomplete_fields = ("course",)
