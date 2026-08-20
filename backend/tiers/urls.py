from django.urls import path

from .views import (
    MyTierProgressView,
    PublicTierDetailView,
    PublicTierListView,
    TierDetailView,
    TierListCreateView,
    TierOrderView,
    TierPathwayAttachView,
    TierPathwayDetachView,
    TierPathwayOrderView,
    TierProgressDetailView,
)

urlpatterns = [
    path("public/", PublicTierListView.as_view(), name="tier-public-list"),
    path("public/<int:pk>/", PublicTierDetailView.as_view(), name="tier-public-detail"),
    path("mine/", MyTierProgressView.as_view(), name="tier-mine"),
    path("order/", TierOrderView.as_view(), name="tier-order"),
    path("", TierListCreateView.as_view(), name="tier-list-create"),
    path("<int:pk>/", TierDetailView.as_view(), name="tier-detail"),
    path("<int:pk>/progress/", TierProgressDetailView.as_view(), name="tier-progress-detail"),
    path("<int:tier_id>/pathways/", TierPathwayAttachView.as_view(), name="tier-pathway-attach"),
    path(
        "<int:tier_id>/pathways/<int:pathway_id>/",
        TierPathwayDetachView.as_view(),
        name="tier-pathway-detach",
    ),
    path(
        "<int:tier_id>/pathways/order/",
        TierPathwayOrderView.as_view(),
        name="tier-pathway-order",
    ),
]
