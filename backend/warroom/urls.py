from django.urls import path

from .views import RoomListView, RoomMessageDetailView, RoomMessageListCreateView

urlpatterns = [
    path("rooms/", RoomListView.as_view(), name="warroom-room-list"),
    path(
        "rooms/<int:course_id>/messages/",
        RoomMessageListCreateView.as_view(),
        name="warroom-message-list-create",
    ),
    path(
        "rooms/<int:course_id>/messages/<int:message_id>/",
        RoomMessageDetailView.as_view(),
        name="warroom-message-detail",
    ),
]
