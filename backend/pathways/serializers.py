import json

from django.http import QueryDict
from django.db import transaction
from rest_framework import serializers

from common.image import build_absolute_image_url
from common.models import Status
from common.ordering import get_next_order
from courses.models import Course

from .models import Audience, Pathway, PathwayBundleRule, PathwayCourse, PathwayEnrollment


class AudienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audience
        fields = ["slug", "name"]
        read_only_fields = fields

# Caps for the bullet-list fields on the public pathway page. Mirrors the
# equivalent limits on Course.learning_outcomes (courses/serializers.py).
MAX_BULLET_POINTS = 12
MAX_BULLET_POINT_LENGTH = 300

# The JSON list fields a pathway write accepts, in one place so the multipart
# coercion and the per-field validation can't drift apart.
BULLET_LIST_FIELDS = ("learning_outcomes", "who_is_for", "prerequisites")


def clean_bullet_list(value, field_label):
    """Normalise one bullet-list field: trim, drop blanks, enforce the caps."""
    if not isinstance(value, list):
        raise serializers.ValidationError(f"{field_label} must be a list of points.")
    points = []
    for item in value:
        if not isinstance(item, str):
            raise serializers.ValidationError(f"Each {field_label} point must be text.")
        text = " ".join(item.split())
        if not text:
            continue
        if len(text) > MAX_BULLET_POINT_LENGTH:
            raise serializers.ValidationError(
                f"Each {field_label} point must be at most {MAX_BULLET_POINT_LENGTH} characters."
            )
        points.append(text)
    if len(points) > MAX_BULLET_POINTS:
        raise serializers.ValidationError(
            f"{field_label} can have at most {MAX_BULLET_POINTS} points."
        )
    return points


def serialize_pathway_tiers(pathway):
    """Tier badges for a pathway.

    A pathway can belong to more than one tier — every tier it's currently
    attached to, not just one, so the badge can show all of them.
    """
    return [
        {"id": tp.tier_id, "name": tp.tier.name, "slug": tp.tier.slug, "level": tp.tier.level}
        for tp in pathway.tier_pathways.select_related("tier").order_by("tier__level")
    ]


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
    audiences = AudienceSerializer(many=True, read_only=True)
    course_count = serializers.SerializerMethodField()
    tiers = serializers.SerializerMethodField()

    class Meta:
        model = Pathway
        fields = [
            "id",
            "name",
            "slug",
            "summary",
            "status",
            "base_price",
            "difficulty",
            "duration_weeks",
            "tiers",
            "audiences",
            "course_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_tiers(self, obj):
        return serialize_pathway_tiers(obj)

    def get_course_count(self, obj):
        if hasattr(obj, "published_course_count"):
            return obj.published_course_count
        return obj.pathway_courses.count()


class PathwayDetailSerializer(serializers.ModelSerializer):
    audiences = AudienceSerializer(many=True, read_only=True)
    courses = serializers.SerializerMethodField()
    tiers = serializers.SerializerMethodField()
    course_count = serializers.IntegerField(source="pathway_courses.count", read_only=True)

    class Meta:
        model = Pathway
        fields = [
            "id",
            "name",
            "slug",
            "summary",
            "description",
            "status",
            "base_price",
            "purpose",
            "learning_outcomes",
            "who_is_for",
            "prerequisites",
            "difficulty",
            "duration_weeks",
            "tiers",
            "audiences",
            "course_count",
            "courses",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_tiers(self, obj):
        return serialize_pathway_tiers(obj)

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
    audience_slugs = serializers.SlugRelatedField(
        source="audiences", slug_field="slug", queryset=Audience.objects.all(),
        many=True, required=False,
    )

    class Meta:
        model = Pathway
        fields = [
            "id",
            "name",
            "summary",
            "description",
            "status",
            "base_price",
            "purpose",
            "learning_outcomes",
            "who_is_for",
            "prerequisites",
            "difficulty",
            "duration_weeks",
            "audience_slugs",
        ]
        read_only_fields = ["id"]

    def to_internal_value(self, data):
        # The admin form posts JSON, but accept a multipart/form-encoded body
        # too (same tolerance as CourseWriteSerializer) so the bullet lists can
        # arrive as JSON-encoded strings rather than only as real lists.
        if isinstance(data, QueryDict):
            data = {
                key: data.getlist(key) if key == "audience_slugs" else data.getlist(key)[-1]
                for key in data
            }

        for field in BULLET_LIST_FIELDS:
            value = data.get(field)
            if isinstance(value, str):
                try:
                    data[field] = json.loads(value)
                except ValueError:
                    raise serializers.ValidationError({field: "Must be a valid JSON list."})

        return super().to_internal_value(data)

    def validate_learning_outcomes(self, value):
        return clean_bullet_list(value, "Learning outcomes")

    def validate_who_is_for(self, value):
        return clean_bullet_list(value, "Who this is for")

    def validate_prerequisites(self, value):
        return clean_bullet_list(value, "Prerequisites")

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

    @transaction.atomic
    def create(self, validated_data):
        return super().create(validated_data)

    @transaction.atomic
    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


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
    class Meta:
        model = Pathway
        fields = ["id", "name", "slug", "summary"]
        read_only_fields = fields


class PathwayEnrollmentSerializer(serializers.ModelSerializer):
    pathway = PathwayEnrollmentPathwaySerializer(read_only=True)

    class Meta:
        model = PathwayEnrollment
        fields = ["id", "pathway", "status", "price_paid", "enrolled_at"]
        read_only_fields = fields
