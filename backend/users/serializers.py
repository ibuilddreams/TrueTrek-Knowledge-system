from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.http import QueryDict
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from common.image import build_absolute_image_url
from courses.serializers import CourseListSerializer

from .models import UserProfile

UserModel = get_user_model()


def _build_token_response(user):
    refresh = CustomTokenObtainPairSerializer.get_token(user)
    return {
        "refresh_token": str(refresh),
        "access_token": str(refresh.access_token),
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "full_name": user.name,
            "email": user.email,
            "role": user.role,
        },
    }


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


class SignupSerializer(serializers.ModelSerializer):
    """Self-service signup — always creates a STUDENT account and, unlike
    CreateStudentSerializer (admin-only), returns JWT tokens immediately so the
    onboarding wizard can move straight into the questionnaire without a
    separate login step."""

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
        return _build_token_response(instance)


class GoogleAuthSerializer(serializers.Serializer):
    """Google Sign-In — verifies the ID token from Google Identity Services
    (frontend's GoogleSignInButton), then logs the matching user in or creates
    a new STUDENT account on first sign-in. Google-created accounts get an
    unusable password (Google is the only way in until the user sets one via
    forgot-password) and `gender` defaults to OTHER since Google's basic scopes
    don't provide it — the user can update it later from their profile."""

    credential = serializers.CharField(write_only=True)

    def validate_credential(self, value):
        if not settings.GOOGLE_CLIENT_ID:
            raise ValidationError("Google sign-in is not configured on this server.")

        try:
            payload = google_id_token.verify_oauth2_token(
                value, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
        except (ValueError, GoogleAuthError):
            # ValueError: malformed/expired/wrong-audience token (the common case).
            # GoogleAuthError: e.g. couldn't reach Google to fetch/refresh its
            # signing certs — a transient network issue, not the caller's fault,
            # but still surfaced as a clean 400 rather than an unhandled 500.
            raise ValidationError("Invalid or expired Google credential.")

        if not payload.get("email"):
            raise ValidationError("This Google account has no email address.")
        if not payload.get("email_verified"):
            raise ValidationError("This Google account's email address is not verified.")

        return payload

    def _generate_username(self, email):
        base = email.split("@")[0] or "user"
        username = base
        suffix = 1
        while UserModel.objects.filter(username__iexact=username).exists():
            suffix += 1
            username = f"{base}{suffix}"
        return username

    def save(self):
        payload = self.validated_data["credential"]
        email = UserModel.objects.normalize_email(payload["email"])

        user = UserModel.objects.filter(email__iexact=email).first()
        if user is None:
            user = UserModel.objects.create_user(
                username=self._generate_username(email),
                email=email,
                password=None,
                first_name=payload.get("given_name", ""),
                last_name=payload.get("family_name", ""),
                gender=UserModel.Gender.OTHER,
                role=UserModel.Roles.STUDENT,
                is_verified=True,
            )

        if not user.is_active:
            raise PermissionDenied("Your account is inactive.")

        return user

    def to_representation(self, instance):
        return _build_token_response(instance)


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

    def update(self, instance, validated_data):
        account_status = validated_data.get("account_status")
        instance = super().update(instance, validated_data)

        if account_status is not None:
            instance.is_active = account_status == UserModel.AccountStatus.ACTIVE
            instance.save(update_fields=["is_active"])

        return instance

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

    def update(self, instance, validated_data):
        account_status = validated_data.get("account_status")
        instance = super().update(instance, validated_data)

        if account_status is not None:
            instance.is_active = account_status == UserModel.AccountStatus.ACTIVE
            instance.save(update_fields=["is_active"])

        return instance

    def to_representation(self, instance):
        return TeacherSerializer(instance).data


class TeacherCourseStatsSerializer(CourseListSerializer):
    total_students = serializers.IntegerField(read_only=True)
    modules_count = serializers.IntegerField(read_only=True)
    lessons_count = serializers.IntegerField(read_only=True)
    assignments_count = serializers.IntegerField(read_only=True)
    quizzes_count = serializers.IntegerField(read_only=True)

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + [
            "total_students",
            "modules_count",
            "lessons_count",
            "assignments_count",
            "quizzes_count",
        ]


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
    avatar = serializers.ImageField(required=False, allow_null=True)

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

    def to_internal_value(self, data):
        # A multipart request (needed for the avatar file) can't nest fields under
        # "profile" the way JSON can, so the avatar upload is sent as flat top-level
        # keys and folded into a "profile" dict here — same QueryDict-flattening
        # approach as CourseWriteSerializer.to_internal_value for its nested fields.
        if isinstance(data, QueryDict):
            converted = {key: data.getlist(key)[-1] for key in data}
            profile_data = {}
            for field in UserProfileWriteSerializer().fields:
                if field in converted:
                    profile_data[field] = converted.pop(field)
            # multipart has no way to send a real null — an emptied date field
            # arrives as "", which DateField would otherwise reject as malformed.
            if profile_data.get("date_of_birth") == "":
                profile_data["date_of_birth"] = None
            if profile_data:
                converted["profile"] = profile_data
            data = converted

        return super().to_internal_value(data)

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
