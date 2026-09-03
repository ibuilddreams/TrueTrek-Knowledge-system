from django.contrib import admin

from .models import PointsTransaction, Reward, RewardFulfillment, RewardRedemption, StudentPointsAccount


@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ("name", "reward_type", "fulfillment_type", "points_required", "status", "created_at")
    list_filter = ("status", "reward_type", "fulfillment_type")
    search_fields = ("name", "description")


@admin.register(StudentPointsAccount)
class StudentPointsAccountAdmin(admin.ModelAdmin):
    list_display = ("student", "balance", "updated_at")
    search_fields = ("student__username", "student__email")
    autocomplete_fields = ("student",)


@admin.register(RewardRedemption)
class RewardRedemptionAdmin(admin.ModelAdmin):
    list_display = ("student", "reward", "points_cost", "status", "created_at", "processed_at")
    list_filter = ("status",)
    search_fields = ("student__username", "student__email", "reward__name")
    autocomplete_fields = ("student", "reward", "processed_by", "approved_by", "cancelled_by")


@admin.register(RewardFulfillment)
class RewardFulfillmentAdmin(admin.ModelAdmin):
    list_display = ("redemption", "mentor", "scheduled_date", "start_time", "meeting_method", "completed_at")
    list_filter = ("meeting_method",)
    search_fields = ("redemption__student__username", "redemption__student__email", "mentor__username")
    autocomplete_fields = ("redemption", "mentor", "completed_by")


@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    list_display = ("student", "amount", "transaction_type", "balance_after", "created_at")
    list_filter = ("transaction_type",)
    search_fields = ("student__username", "student__email", "reason")
    autocomplete_fields = ("student", "drill_attempt", "redemption", "actor")
    readonly_fields = [f.name for f in PointsTransaction._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
