from django.urls import path

from .views import ModuleDetailView, ModuleListCreateView, ModuleOrderView

urlpatterns = [
    path("", ModuleListCreateView.as_view(), name="module-list-create"),
    path("<int:pk>/", ModuleDetailView.as_view(), name="module-detail"),
    path("order/<int:course_id>/", ModuleOrderView.as_view(), name="module-order"),
]
