from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from common.admin_export import ExportCsvMixin

from .forms import CustomAdminAuthenticationForm
from .models import CustomUser, UserProfile


admin.site.login_form = CustomAdminAuthenticationForm
admin.site.login_template = "admin/login.html"


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0


@admin.register(CustomUser)
class CustomUserAdmin(ExportCsvMixin, UserAdmin):
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
        ("Personal Info", {"fields": ("first_name", "last_name", "name")}),
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

    export_filename_prefix = "users"
    # The account, then the profile attached to it. Nothing from the password
    # column: an export is a file that gets emailed around, and a hash is still
    # a credential.
    export_fields = (
        ("ID", "id"),
        ("Username", "username"),
        ("Email", "email"),
        ("First name", "first_name"),
        ("Last name", "last_name"),
        ("Full name", "name"),
        ("Role", "get_role_display"),
        ("Account status", "get_account_status_display"),
        ("Verified", "is_verified"),
        ("Advisor", "is_advisor"),
        ("Active", "is_active"),
        ("Staff", "is_staff"),
        ("Superuser", "is_superuser"),
        ("Groups", "export_groups"),
        ("Date joined", "date_joined"),
        ("Last login", "last_login"),
        ("Last login IP", "last_login_ip"),
        ("Created at", "created_at"),
        ("Updated at", "updated_at"),
        ("Phone number", "profile__phone_number"),
        ("Date of birth", "profile__date_of_birth"),
        ("Address", "profile__address"),
        ("City", "profile__city"),
        ("Country", "profile__country"),
        ("Website", "profile__website"),
        ("Bio", "profile__bio"),
    )

    def get_export_queryset(self, request, queryset):
        # A profile and the groups per row, or the export would be one query
        # per user per column. `profile` is missing on accounts created before
        # the row existed, which the accessor reads as an empty cell.
        return queryset.select_related("profile").prefetch_related("groups")

    def get_export_object_label(self, obj):
        # `str(user)` is "<username> (ROLE)", and the role in a filename is
        # noise beside a username that is already unique.
        return obj.get_username()

    def export_groups(self, obj):
        return [group.name for group in obj.groups.all()]


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone_number", "city", "country", "created_at")
    list_filter = ("country",)
    search_fields = ("user__username", "user__email", "phone_number")
    autocomplete_fields = ("user",)
