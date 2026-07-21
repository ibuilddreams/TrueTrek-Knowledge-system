from django.contrib.admin.forms import AdminAuthenticationForm
from django.contrib.auth.forms import UsernameField
from django import forms


class CustomAdminAuthenticationForm(AdminAuthenticationForm):
    username = UsernameField(
        label="Username or Email",
        widget=forms.TextInput(attrs={"autofocus": True}),
    )