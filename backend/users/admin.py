from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomAdminAuthenticationForm
from .models import CustomUser, UserProfile


admin.site.login_form = CustomAdminAuthenticationForm
admin.site.login_template = "admin/login.html"


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    inlines = (UserProfileInline,)

    list_display = (
        "id",
        "username",
        "email",
        "name",
        "role",
        "account_status",
        "is_verified",
        "is_staff",
        "is_active",
    )
    list_filter = ("role", "account_status", "is_verified", "is_staff", "is_active", "is_superuser")
    search_fields = ("username", "email", "first_name", "last_name", "name")
    ordering = ("-date_joined",)
    readonly_fields = ("name", "last_login_ip")

    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "name", "gender")}),
        ("Role & Status", {"fields": ("role", "account_status", "is_verified", "last_login_ip")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "first_name",
                    "last_name",
                    "role",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number", "city", "country", "created_at")
    list_filter = ("country",)
    search_fields = ("user__username", "user__email", "phone_number")
    autocomplete_fields = ("user",)
