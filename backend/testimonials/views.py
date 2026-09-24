from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import AllowAny

from common.pagination import Pagination
from common.response import success_response
from users.permissions import IsAdmin

from .models import Testimonial, TestimonialStatus
from .serializers import PublicTestimonialSerializer, TestimonialCreateSerializer, TestimonialSerializer
from .throttling import TestimonialSubmitThrottle


class TestimonialCreateView(generics.CreateAPIView):
    """Public endpoint: a client/athlete submits a testimonial for admin review."""

    serializer_class = TestimonialCreateSerializer
    permission_classes = [AllowAny]
    throttle_classes = [TestimonialSubmitThrottle]
    throttle_scope = "testimonial-submit"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        testimonial = serializer.save()
        return success_response(
            serializer.to_representation(testimonial),
            message="Thanks for sharing your experience! Your testimonial is pending review.",
            status_code=201,
        )


class PublicTestimonialListView(generics.ListAPIView):
    """Public endpoint: published testimonials shown on the Future Clients page."""

    serializer_class = PublicTestimonialSerializer
    permission_classes = [AllowAny]
    pagination_class = Pagination

    def get_queryset(self):
        return Testimonial.objects.filter(status=TestimonialStatus.PUBLISHED)

    def list(self, request, *args, **kwargs):
        testimonials = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(testimonials)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Testimonials fetched successfully")


class AdminTestimonialListView(generics.ListAPIView):
    serializer_class = TestimonialSerializer
    permission_classes = [IsAdmin]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = Testimonial.objects.all()

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(quote__icontains=search))

        return queryset

    def list(self, request, *args, **kwargs):
        testimonials = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(testimonials)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Testimonials fetched successfully")


class AdminTestimonialPublishView(generics.GenericAPIView):
    queryset = Testimonial.objects.all()
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        testimonial = self.get_object()
        testimonial.status = TestimonialStatus.PUBLISHED
        testimonial.save(update_fields=["status", "updated_at"])
        return success_response(TestimonialSerializer(testimonial).data, message="Testimonial published")


class AdminTestimonialHideView(generics.GenericAPIView):
    queryset = Testimonial.objects.all()
    permission_classes = [IsAdmin]

    def post(self, request, *args, **kwargs):
        testimonial = self.get_object()
        testimonial.status = TestimonialStatus.HIDDEN
        testimonial.save(update_fields=["status", "updated_at"])
        return success_response(TestimonialSerializer(testimonial).data, message="Testimonial hidden")


class AdminTestimonialDeleteView(generics.DestroyAPIView):
    queryset = Testimonial.objects.all()
    permission_classes = [IsAdmin]

    def destroy(self, request, *args, **kwargs):
        testimonial = self.get_object()
        testimonial.delete()
        return success_response(None, message="Testimonial deleted")
