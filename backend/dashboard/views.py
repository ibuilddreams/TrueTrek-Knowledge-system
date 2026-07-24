from rest_framework.views import APIView

from common.response import success_response
from users.permissions import IsAdmin, IsTeacher

from .services import get_admin_dashboard, get_teacher_dashboard


class TeacherDashboardView(APIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        data = get_teacher_dashboard(request.user)
        return success_response(data, message="Teacher dashboard fetched successfully")


class AdminDashboardStatisticsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        data = get_admin_dashboard()
        return success_response(
            data["statistics"], message="Admin dashboard statistics fetched successfully"
        )


class AdminDashboardActivityProgressView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        data = get_admin_dashboard()
        return success_response(
            {
                "recent_activities": data["recent_activities"],
                "progress_summary": data["progress_summary"],
            },
            message="Admin dashboard activity and progress fetched successfully",
        )


class AdminDashboardChartsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        data = get_admin_dashboard()
        return success_response(
            data["charts"], message="Admin dashboard charts fetched successfully"
        )
