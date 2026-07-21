from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("action", "object_name", "object_id", "user", "ip_address", "created_at")
    list_filter = ("action",)
    search_fields = ("object_name", "object_id", "user__username")
    autocomplete_fields = ("user",)
    readonly_fields = (
        "user",
        "action",
        "object_name",
        "object_id",
        "ip_address",
        "old_values",
        "new_values",
        "created_at",
        "updated_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
