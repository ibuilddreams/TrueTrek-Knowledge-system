from django.contrib import admin
from django.db.models import Count

from common.admin_export import ExportCsvMixin

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
class CourseAdmin(ExportCsvMixin, admin.ModelAdmin):
    list_display = ("code", "title", "category", "status", "difficulty", "duration_minutes", "created_at")
    list_filter = ("status", "difficulty", "category", "tags")
    search_fields = ("code", "title", "description")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("category",)
    filter_horizontal = ("tags",)
    inlines = (CourseInstructorInline,)

    export_filename_prefix = "courses"
    export_fields = (
        ("ID", "id"),
        ("Code", "code"),
        ("Title", "title"),
        ("Slug", "slug"),
        ("Category", "category__name"),
        ("Status", "get_status_display"),
        ("Difficulty", "get_difficulty_display"),
        ("Tags", "export_tags"),
        ("Instructors", "export_instructors"),
        ("Price", "amount"),
        ("Duration (minutes)", "duration_minutes"),
        ("Grade min", "grade_min"),
        ("Grade max", "grade_max"),
        ("Grade label", "grade_label"),
        ("Modules", "module_count"),
        ("Enrollments", "enrollment_count"),
        ("Learning outcomes", "learning_outcomes"),
        ("Description", "description"),
        ("Created at", "created_at"),
        ("Updated at", "updated_at"),
    )

    def get_export_queryset(self, request, queryset):
        # The two counts are what an admin opens a catalog export for, and both
        # are counted distinctly because a tag filter on the changelist leaves a
        # join behind that would otherwise multiply them.
        return (
            queryset.select_related("category")
            .prefetch_related("tags", "instructors__instructor")
            .annotate(
                module_count=Count("modules", distinct=True),
                enrollment_count=Count("enrollments", distinct=True),
            )
        )

    def export_tags(self, obj):
        return [tag.name for tag in obj.tags.all()]

    def export_instructors(self, obj):
        return [
            link.instructor.name or link.instructor.get_username()
            for link in obj.instructors.all()
        ]


@admin.register(CourseInstructor)
class CourseInstructorAdmin(admin.ModelAdmin):
    list_display = ("course", "instructor", "is_lead", "created_at")
    list_filter = ("is_lead",)
    search_fields = ("course__title", "instructor__username", "instructor__email")
    autocomplete_fields = ("course", "instructor")
