from django.contrib import admin

from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "sport", "rating", "status", "created_at")
    list_filter = ("status", "rating", "created_at")
    search_fields = ("name", "quote", "school")
