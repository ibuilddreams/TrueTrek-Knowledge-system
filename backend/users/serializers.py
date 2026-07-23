from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from common.image import build_absolute_image_url

from .models import UserProfile

UserModel = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["email"] = serializers.EmailField()

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )

        if user is None:
            inactive_user = self._get_inactive_user_with_matching_password(email, password)
            if inactive_user is not None:
                raise PermissionDenied("Your account is inactive.")
            raise ValidationError("Invalid email or password")

        refresh = self.get_token(user)

        return {
            "refresh": refresh,
            "access": refresh.access_token,
            "user": user,
        }

    @staticmethod
    def _get_inactive_user_with_matching_password(email, password):
        try:
            user = UserModel.objects.get(email__iexact=email)
        except UserModel.DoesNotExist:
            return None

        if user.is_active or not user.check_password(password):
            return None

        return user

    def to_representation(self, instance):
        user = instance["user"]

        return {
            "refresh_token": str(instance["refresh"]),
            "access_token": str(instance["access"]),
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": user.name,
                "email": user.email,
                "role": user.role,
            },
        }


class CreateStudentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    gender = serializers.ChoiceField(choices=UserModel.Gender.choices, required=True)

    class Meta:
        model = UserModel
        fields = ["id", "username", "first_name", "last_name", "email", "password", "gender"]

    def validate_email(self, value):
        email = UserModel.objects.normalize_email(value)
        if UserModel.objects.filter(email__iexact=email).exists():
            raise ValidationError("A user with this email already exists.")
        return email

    def validate_username(self, value):
        if UserModel.objects.filter(username__iexact=value).exists():
            raise ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        return UserModel.objects.create_user(
            password=password,
            role=UserModel.Roles.STUDENT,
            **validated_data,
        )

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "username": instance.username,
            "first_name": instance.first_name,
            "last_name": instance.last_name,
            "full_name": instance.name,
            "email": instance.email,
            "gender": instance.gender,
            "role": instance.role,
        }


class StudentSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="name", read_only=True)

    class Meta:
        model = UserModel
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "gender",
            "role",
            "account_status",
            "date_joined",
        ]
        read_only_fields = fields


class StudentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ["first_name", "last_name", "gender", "account_status"]

    def to_representation(self, instance):
        return StudentSerializer(instance).data


class CreateTeacherSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    gender = serializers.ChoiceField(choices=UserModel.Gender.choices, required=True)

    class Meta:
        model = UserModel
        fields = ["id", "username", "first_name", "last_name", "email", "password", "gender"]

    def validate_email(self, value):
        email = UserModel.objects.normalize_email(value)
        if UserModel.objects.filter(email__iexact=email).exists():
            raise ValidationError("A user with this email already exists.")
        return email

    def validate_username(self, value):
        if UserModel.objects.filter(username__iexact=value).exists():
            raise ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        return UserModel.objects.create_user(
            password=password,
            role=UserModel.Roles.TEACHER,
            **validated_data,
        )

    def to_representation(self, instance):
        return {
            "id": instance.id,
            "username": instance.username,
            "first_name": instance.first_name,
            "last_name": instance.last_name,
            "full_name": instance.name,
            "email": instance.email,
            "gender": instance.gender,
            "role": instance.role,
        }


class TeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="name", read_only=True)

    class Meta:
        model = UserModel
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "gender",
            "role",
            "account_status",
            "date_joined",
        ]
        read_only_fields = fields


class TeacherUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ["first_name", "last_name", "gender", "account_status"]

    def to_representation(self, instance):
        return TeacherSerializer(instance).data


class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            "avatar",
            "bio",
            "date_of_birth",
            "phone_number",
            "address",
            "city",
            "country",
            "website",
        ]
        read_only_fields = fields

    def get_avatar(self, instance):
        return build_absolute_image_url(self.context.get("request"), instance.avatar)


class UserProfileWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "bio",
            "date_of_birth",
            "phone_number",
            "address",
            "city",
            "country",
            "website",
        ]


class ProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="name", read_only=True)
    role = serializers.CharField(source="get_role_display", read_only=True)
    profile = serializers.SerializerMethodField()

    class Meta:
        model = UserModel
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "gender",
            "role",
            "account_status",
            "is_verified",
            "profile",
        ]
        read_only_fields = fields

    def get_profile(self, instance):
        profile = getattr(instance, "profile", None)
        if profile is None:
            return None
        return UserProfileSerializer(profile, context=self.context).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get("profile") is None:
            data.pop("profile", None)
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="name", required=False, allow_blank=False)
    gender = serializers.ChoiceField(choices=UserModel.Gender.choices, required=False, allow_null=True)
    profile = UserProfileWriteSerializer(required=False)

    class Meta:
        model = UserModel
        fields = ["full_name", "email", "gender", "profile"]

    def validate_email(self, value):
        email = UserModel.objects.normalize_email(value)
        if UserModel.objects.filter(email__iexact=email).exclude(pk=self.instance.pk).exists():
            raise ValidationError("A user with this email already exists.")
        return email

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)

        for attr, value in validated_data.items():
            if value is None:
                continue
            setattr(instance, attr, value)
        instance.save()

        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance

    def to_representation(self, instance):
        return ProfileSerializer(instance, context=self.context).data


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise ValidationError({"confirm_password": "Passwords do not match."})

        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = UserModel.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist):
            raise ValidationError({"uid": "This password reset link is invalid or has expired."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise ValidationError({"token": "This password reset link is invalid or has expired."})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
