from rest_framework import serializers

from .models import Testimonial, TestimonialStatus


class TestimonialSerializer(serializers.ModelSerializer):
    """Full admin-facing representation, including moderation fields."""

    class Meta:
        model = Testimonial
        fields = [
            "id",
            "name",
            "role",
            "school",
            "sport",
            "email",
            "quote",
            "rating",
            "verified_badge",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class PublicTestimonialSerializer(serializers.ModelSerializer):
    """What the Future Clients page renders — no contact details."""

    class Meta:
        model = Testimonial
        fields = ["id", "name", "role", "school", "sport", "quote", "rating", "verified_badge", "created_at"]
        read_only_fields = fields


class TestimonialCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ["name", "role", "school", "sport", "email", "quote", "rating"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please enter your name.")
        return value

    def validate_quote(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Please share a few words about your experience.")
        return value

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def create(self, validated_data):
        return Testimonial.objects.create(status=TestimonialStatus.PENDING, **validated_data)

    def to_representation(self, instance):
        return TestimonialSerializer(instance, context=self.context).data
