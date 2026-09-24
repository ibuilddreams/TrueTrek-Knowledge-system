from django.urls import path

from .views import (
    AdminTestimonialDeleteView,
    AdminTestimonialHideView,
    AdminTestimonialListView,
    AdminTestimonialPublishView,
    PublicTestimonialListView,
    TestimonialCreateView,
)

urlpatterns = [
    path("submit/", TestimonialCreateView.as_view(), name="testimonial-submit"),
    path("public/", PublicTestimonialListView.as_view(), name="testimonial-public-list"),
    path("admin/", AdminTestimonialListView.as_view(), name="testimonial-admin-list"),
    path("admin/<int:pk>/publish/", AdminTestimonialPublishView.as_view(), name="testimonial-admin-publish"),
    path("admin/<int:pk>/hide/", AdminTestimonialHideView.as_view(), name="testimonial-admin-hide"),
    path("admin/<int:pk>/", AdminTestimonialDeleteView.as_view(), name="testimonial-admin-delete"),
]
