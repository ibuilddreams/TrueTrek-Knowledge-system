from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

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
        ]
        read_only_fields = fields
