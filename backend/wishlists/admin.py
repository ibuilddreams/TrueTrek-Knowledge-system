from django.contrib import admin

from .models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "user__email", "course__title")
    autocomplete_fields = ("user", "course")
