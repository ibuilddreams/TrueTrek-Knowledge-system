from rest_framework import serializers

from common.image import build_absolute_image_url
from common.models import Status
from common.ordering import get_next_order
from courses.models import Course

from .models import Pathway, PathwayBundleRule, PathwayCourse, PathwayEnrollment


class PathwayCourseCourseSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ["id", "title", "slug", "code", "status", "image", "amount"]
        read_only_fields = fields

    def get_image(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.thumbnail)


class PathwayCourseSerializer(serializers.ModelSerializer):
    course = PathwayCourseCourseSerializer(read_only=True)

    class Meta:
        model = PathwayCourse
        fields = ["id", "course", "order"]
        read_only_fields = fields


class PathwayListSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    course_count = serializers.IntegerField(source="pathway_courses.count", read_only=True)

    class Meta:
        model = Pathway
        fields = [
            "id",
            "name",
            "slug",
            "summary",
            "image",
            "status",
            "base_price",
            "course_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_image(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.thumbnail)


class PathwayDetailSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    courses = serializers.SerializerMethodField()

    class Meta:
        model = Pathway
        fields = [
            "id",
            "name",
            "slug",
            "summary",
            "description",
            "image",
            "status",
            "base_price",
            "courses",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_image(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.thumbnail)

    def get_courses(self, obj):
        pathway_courses = obj.pathway_courses.select_related("course").order_by("order")
        return PathwayCourseSerializer(pathway_courses, many=True, context=self.context).data


class PublicPathwayDetailSerializer(PathwayDetailSerializer):
    """Anonymous-safe pathway preview — published pathways/courses only."""

    def get_courses(self, obj):
        pathway_courses = (
            obj.pathway_courses.select_related("course")
            .filter(course__status=Status.PUBLISHED)
            .order_by("order")
        )
        return PathwayCourseSerializer(pathway_courses, many=True, context=self.context).data


class PathwayWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pathway
        fields = ["id", "name", "summary", "description", "thumbnail", "status", "base_price"]
        read_only_fields = ["id"]

    def validate_name(self, value):
        queryset = Pathway.objects.filter(name__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A pathway with this name already exists.")
        return value

    def validate_base_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Base price must be a positive number.")
        return value

    def create(self, validated_data):
        return Pathway.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class PathwayCourseAttachSerializer(serializers.Serializer):
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all())

    def validate_course(self, value):
        pathway = self.context["pathway"]
        if PathwayCourse.objects.filter(pathway=pathway, course=value).exists():
            raise serializers.ValidationError("This course is already attached to the pathway.")
        return value

    def create(self, validated_data):
        pathway = self.context["pathway"]
        return PathwayCourse.objects.create(
            pathway=pathway,
            course=validated_data["course"],
            order=get_next_order(PathwayCourse.objects.filter(pathway=pathway)),
        )


class PathwayCourseOrderEntrySerializer(serializers.Serializer):
    pathwaycourse_id = serializers.IntegerField()
    order = serializers.IntegerField(min_value=1)


class PathwayBundleRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathwayBundleRule
        fields = ["id", "pathway_count", "discount_percent", "created_at", "updated_at"]
        read_only_fields = fields


class PathwayBundleRuleWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathwayBundleRule
        fields = ["id", "pathway_count", "discount_percent"]
        read_only_fields = ["id"]

    def validate_pathway_count(self, value):
        if value < 2:
            raise serializers.ValidationError("Bundle rules apply to two or more pathways.")
        queryset = PathwayBundleRule.objects.filter(pathway_count=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A bundle rule for this pathway count already exists.")
        return value

    def validate_discount_percent(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Discount percent must be between 0 and 100.")
        return value


class PathwayCheckoutRequestSerializer(serializers.Serializer):
    pathway_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False, min_length=1
    )

    def validate_pathway_ids(self, value):
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate pathway ids are not allowed.")
        return value


class PathwayEnrollmentPathwaySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Pathway
        fields = ["id", "name", "slug", "summary", "image"]
        read_only_fields = fields

    def get_image(self, obj):
        return build_absolute_image_url(self.context.get("request"), obj.thumbnail)


class PathwayEnrollmentSerializer(serializers.ModelSerializer):
    pathway = PathwayEnrollmentPathwaySerializer(read_only=True)

    class Meta:
        model = PathwayEnrollment
        fields = ["id", "pathway", "status", "price_paid", "enrolled_at"]
        read_only_fields = fields
