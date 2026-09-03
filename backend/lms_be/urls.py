from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path

from common.media_views import serve_ranged
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny
from users.views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    ForgotPasswordView,
    GoogleAuthView,
    ResetPasswordView,
    SignupView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/modules/', include('modules.urls')),
    path('api/lessons/', include('lessons.urls')),
    path('api/quizzes/', include('quizzes.urls')),
    path('api/assignments/', include('assignments.urls')),
    path('api/enrollments/', include('enrollments.urls')),
    path('api/carts/', include('carts.urls')),
    path('api/daily-drill/', include('daily_drill.urls')),
    path('api/progress/', include('progress.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/pathways/', include('pathways.urls')),
    path('api/tiers/', include('tiers.urls')),
    path('api/onboarding/', include('onboarding.urls')),
    path('api/future-clients/', include('future_clients.urls')),
    path('api/ai-courses/', include('ai_courses.urls')),
    path('api/messaging/', include('messaging.urls')),
    path('api/advisor/', include('advisor.urls')),
    path('api/rewards/', include('rewards.urls')),
    path('api/teacher-requests/', include('teacher_requests.urls')),
    path('api/auth/login/', CustomTokenObtainPairView.as_view()),
    path('api/auth/signup/', SignupView.as_view()),
    path('api/auth/google/', GoogleAuthView.as_view()),
    path('api/auth/refresh/', CustomTokenRefreshView.as_view()),
    path('api/auth/forgot-password/', ForgotPasswordView.as_view()),
    path('api/auth/reset-password/', ResetPasswordView.as_view()),
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema', permission_classes=[AllowAny]), name='redoc'),
]

if settings.DEBUG:
    media_prefix = settings.MEDIA_URL.lstrip('/')
    urlpatterns += [
        re_path(rf'^{media_prefix}(?P<path>.*)$', serve_ranged, {'document_root': settings.MEDIA_ROOT}),
    ]
