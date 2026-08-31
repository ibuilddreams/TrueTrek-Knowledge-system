from django.urls import path

from .views import AdvisorChatView

urlpatterns = [
    path("chat/", AdvisorChatView.as_view(), name="advisor-chat"),
]
