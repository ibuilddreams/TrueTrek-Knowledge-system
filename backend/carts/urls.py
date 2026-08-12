from django.urls import path

from .views import CartCheckoutView, CartItemDetailView, CartItemListCreateView

urlpatterns = [
    path("", CartItemListCreateView.as_view(), name="cart-list-create"),
    path("checkout/", CartCheckoutView.as_view(), name="cart-checkout"),
    path("<int:course_id>/", CartItemDetailView.as_view(), name="cart-detail"),
]
