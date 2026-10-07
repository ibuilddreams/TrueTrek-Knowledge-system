from django.urls import path

from .views import (
    AudienceListView,
    MyPathwaysView,
    PathwayBundleRuleDetailView,
    PathwayBundleRuleListCreateView,
    PathwayCheckoutView,
    PathwayCourseAttachView,
    PathwayCourseDetachView,
    PathwayCourseOrderView,
    PathwayDetailView,
    PathwayListCreateView,
    PublicPathwayDetailBySlugView,
    PublicPathwayDetailView,
    PublicPathwayListView,
)

urlpatterns = [
    path("audiences/", AudienceListView.as_view(), name="pathway-audiences"),
    path("public/", PublicPathwayListView.as_view(), name="pathway-public-list"),
    path("public/<int:pk>/", PublicPathwayDetailView.as_view(), name="pathway-public-detail"),
    path(
        "public/<slug:slug>/",
        PublicPathwayDetailBySlugView.as_view(),
        name="pathway-public-detail-by-slug",
    ),
    path("mine/", MyPathwaysView.as_view(), name="pathway-mine"),
    path("checkout/", PathwayCheckoutView.as_view(), name="pathway-checkout"),
    path("bundle-rules/", PathwayBundleRuleListCreateView.as_view(), name="pathway-bundle-rule-list-create"),
    path("bundle-rules/<int:pk>/", PathwayBundleRuleDetailView.as_view(), name="pathway-bundle-rule-detail"),
    path("", PathwayListCreateView.as_view(), name="pathway-list-create"),
    path("<int:pk>/", PathwayDetailView.as_view(), name="pathway-detail"),
    path("<int:pathway_id>/courses/", PathwayCourseAttachView.as_view(), name="pathway-course-attach"),
    path(
        "<int:pathway_id>/courses/<int:course_id>/",
        PathwayCourseDetachView.as_view(),
        name="pathway-course-detach",
    ),
    path(
        "<int:pathway_id>/courses/order/",
        PathwayCourseOrderView.as_view(),
        name="pathway-course-order",
    ),
]
