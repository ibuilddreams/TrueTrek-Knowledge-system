from rest_framework import serializers

from common.models import Status
from courses.models import Course
from courses.serializers import PublicCourseListSerializer

from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    course = PublicCourseListSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "course", "created_at"]
        read_only_fields = fields


class WishlistItemWriteSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.filter(status=Status.PUBLISHED)
    )

    class Meta:
        model = WishlistItem
        fields = ["course"]

    def validate_course(self, value):
        request = self.context.get("request")
        if request and WishlistItem.objects.filter(user=request.user, course=value).exists():
            raise serializers.ValidationError("This course is already in your wishlist.")
        return value
