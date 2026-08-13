from django.urls import path

from .views import DailyDrillAttemptView, DailyDrillTodayView

urlpatterns = [
    path("today/", DailyDrillTodayView.as_view(), name="daily-drill-today"),
    path("attempt/", DailyDrillAttemptView.as_view(), name="daily-drill-attempt"),
]
