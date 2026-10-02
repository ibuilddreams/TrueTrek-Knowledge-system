from django.urls import path

from .views import WishlistItemDetailView, WishlistItemListCreateView

urlpatterns = [
    path("", WishlistItemListCreateView.as_view(), name="wishlist-list-create"),
    path("<int:course_id>/", WishlistItemDetailView.as_view(), name="wishlist-detail"),
]
