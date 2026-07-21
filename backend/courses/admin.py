from django.contrib import admin

from .models import Category, Course, CourseInstructor, Tag


class CourseInstructorInline(admin.TabularInline):
    model = CourseInstructor
    extra = 1
    autocomplete_fields = ("instructor",)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "status", "difficulty", "duration_minutes", "created_at")
    list_filter = ("status", "difficulty", "category", "tags")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("category",)
    filter_horizontal = ("tags",)
    inlines = (CourseInstructorInline,)


@admin.register(CourseInstructor)
class CourseInstructorAdmin(admin.ModelAdmin):
    list_display = ("course", "instructor", "is_lead", "created_at")
    list_filter = ("is_lead",)
    search_fields = ("course__title", "instructor__username", "instructor__email")
    autocomplete_fields = ("course", "instructor")
