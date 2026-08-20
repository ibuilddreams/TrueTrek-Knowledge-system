from rest_framework import serializers

from courses.serializers import CourseCategorySerializer
from pathways.models import Pathway

from .models import Tier, TierPathway, TierProgress


class TierPathwayPathwaySerializer(serializers.ModelSerializer):
    course_count = serializers.IntegerField(source="pathway_courses.count", read_only=True)

    class Meta:
        model = Pathway
        fields = ["id", "name", "slug", "status", "base_price", "course_count"]
        read_only_fields = fields


class TierPathwaySerializer(serializers.ModelSerializer):
    """Serializes the tier<->pathway link itself (not the pathway directly) —
    `id` here is the TierPathway row's id, used by the reorder endpoint, since
    the same pathway can appear in more than one tier with a different order
    in each."""

    pathway = TierPathwayPathwaySerializer(read_only=True)

    class Meta:
        model = TierPathway
        fields = ["id", "pathway", "order"]
        read_only_fields = fields


class TierListSerializer(serializers.ModelSerializer):
    category = CourseCategorySerializer(read_only=True)
    pathway_count = serializers.IntegerField(source="tier_pathways.count", read_only=True)

    class Meta:
        model = Tier
        fields = [
            "id",
            "name",
            "slug",
            "level",
            "audience",
            "status",
            "category",
            "estimated_duration",
            "pathway_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class TierDetailSerializer(serializers.ModelSerializer):
    category = CourseCategorySerializer(read_only=True)
    pathways = serializers.SerializerMethodField()

    class Meta:
        model = Tier
        fields = [
            "id",
            "name",
            "slug",
            "level",
            "audience",
            "focus_description",
            "status",
            "category",
            "estimated_duration",
            "pathways",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_pathways(self, obj):
        tier_pathways = obj.tier_pathways.select_related("pathway").order_by("order")
        return TierPathwaySerializer(tier_pathways, many=True, context=self.context).data


class TierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tier
        fields = [
            "id",
            "name",
            "level",
            "audience",
            "focus_description",
            "status",
            "category",
            "estimated_duration",
        ]
        read_only_fields = ["id"]

    def validate_level(self, value):
        queryset = Tier.objects.filter(level=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("A tier with this level already exists.")
        return value

    def create(self, validated_data):
        return Tier.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class TierOrderEntrySerializer(serializers.Serializer):
    tier_id = serializers.IntegerField()
    level = serializers.IntegerField(min_value=1)


class TierPathwayAttachSerializer(serializers.Serializer):
    pathway = serializers.PrimaryKeyRelatedField(queryset=Pathway.objects.all())


class TierPathwayOrderEntrySerializer(serializers.Serializer):
    tierpathway_id = serializers.IntegerField()
    order = serializers.IntegerField(min_value=1)


class TierProgressTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tier
        fields = ["id", "name", "slug", "level", "audience"]
        read_only_fields = fields


class TierProgressSerializer(serializers.ModelSerializer):
    tier = TierProgressTierSerializer(read_only=True)

    class Meta:
        model = TierProgress
        fields = ["id", "tier", "status", "progress_percentage", "unlocked_at", "completed_at"]
        read_only_fields = fields
