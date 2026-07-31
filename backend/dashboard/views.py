from rest_framework.generics import GenericAPIView

from common.response import success_response
from users.permissions import IsAdmin, IsStudent, IsTeacher

from .services import get_admin_dashboard, get_student_dashboard, get_teacher_dashboard


class StudentDashboardView(GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request):
        data = get_student_dashboard(request.user)
        return success_response(data, message="Student dashboard fetched successfully")


class TeacherDashboardView(GenericAPIView):
    permission_classes = [IsTeacher]

    def get(self, request):
        data = get_teacher_dashboard(request.user)
        return success_response(data, message="Teacher dashboard fetched successfully")


class AdminDashboardStatisticsView(GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        data = get_admin_dashboard()
        return success_response(
            data["statistics"], message="Admin dashboard statistics fetched successfully"
        )


class AdminDashboardActivityProgressView(GenericAPIView):
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


class AdminDashboardChartsView(GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        data = get_admin_dashboard()
        return success_response(
            data["charts"], message="Admin dashboard charts fetched successfully"
        )
