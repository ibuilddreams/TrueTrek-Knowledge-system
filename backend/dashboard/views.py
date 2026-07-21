from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from common.response import success_response

from .services import get_dashboard_for_user


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_dashboard_for_user(request.user)
        return success_response(data, message="Dashboard fetched successfully")
