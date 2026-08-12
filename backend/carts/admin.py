from django.contrib import admin

from .models import CartItem


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("user", "course", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "user__email", "course__title")
    autocomplete_fields = ("user", "course")
