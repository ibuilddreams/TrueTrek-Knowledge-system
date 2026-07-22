from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny
from users.views import (
    CustomTokenObtainPairView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/auth/login/', CustomTokenObtainPairView.as_view()),
    path('api/auth/forgot-password/', ForgotPasswordView.as_view()),
    path('api/auth/reset-password/', ResetPasswordView.as_view()),
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema', permission_classes=[AllowAny]), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
