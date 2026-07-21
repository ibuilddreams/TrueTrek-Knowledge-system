from django.contrib import admin

from .models import Category, Course


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "created_at")
    list_filter = ("status", "category")
    search_fields = ("title",)
    prepopulated_fields = {"slug": ("title",)}
