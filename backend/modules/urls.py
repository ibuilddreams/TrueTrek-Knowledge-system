from django.urls import path

from .views import ModuleDetailView, ModuleListCreateView

urlpatterns = [
    path("", ModuleListCreateView.as_view(), name="module-list-create"),
    path("<int:pk>/", ModuleDetailView.as_view(), name="module-detail"),
]
