from django.db.models import Max


def get_next_order(queryset):
    current_max = queryset.aggregate(Max("order"))["order__max"]
    return (current_max or 0) + 1
