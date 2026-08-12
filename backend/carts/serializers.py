from rest_framework import serializers

from common.models import Status
from courses.models import Course
from courses.serializers import PublicCourseListSerializer

from .models import CartItem


class CartItemSerializer(serializers.ModelSerializer):
    course = PublicCourseListSerializer(read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "course", "created_at"]
        read_only_fields = fields


class CartItemWriteSerializer(serializers.ModelSerializer):
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.filter(status=Status.PUBLISHED)
    )

    class Meta:
        model = CartItem
        fields = ["course"]

    def validate_course(self, value):
        request = self.context.get("request")
        if request and CartItem.objects.filter(user=request.user, course=value).exists():
            raise serializers.ValidationError("This course is already in your cart.")
        return value
