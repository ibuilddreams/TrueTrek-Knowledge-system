from django.contrib import admin

from .models import SavedSearch, SearchHistory


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "query", "searched_at")
    search_fields = ("query", "user__username")
    autocomplete_fields = ("user",)


@admin.register(SavedSearch)
class SavedSearchAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "created_at")
    search_fields = ("name", "user__username")
    autocomplete_fields = ("user",)
