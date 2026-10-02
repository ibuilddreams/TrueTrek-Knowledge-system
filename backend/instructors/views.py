from django.db.models import Avg, Count, Q
from rest_framework import generics
from rest_framework.permissions import AllowAny

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from courses.models import Course
from courses.serializers import PublicCourseRecommendationSerializer
from enrollments.models import Enrollment
from users.permissions import IsStudent, IsTeacher

from .models import InstructorFeedback
from .serializers import (
    InstructorFeedbackSerializer,
    InstructorFeedbackWriteSerializer,
    InstructorProfileWriteSerializer,
    InstructorPublicSerializer,
)
from .services import eligible_courses, get_public_instructor, instructor_stats, published_courses_for


def _not_found():
    return error_response(message="Instructor not found.", status_code=404)


class InstructorDetailView(generics.GenericAPIView):
    """Public instructor page data: profile, stats and their published courses."""

    permission_classes = [AllowAny]

    def get(self, request, pk):
        instructor = get_public_instructor(pk)
        if not instructor:
            return _not_found()

        context = self.get_serializer_context()
        courses = (
            published_courses_for(instructor)
            .select_related("category")
            .prefetch_related("tags")
            .annotate(
                purchase_count=Count(
                    "enrollments",
                    filter=~Q(enrollments__status=Enrollment.EnrollmentStatus.CANCELLED),
                    distinct=True,
                )
            )
            .order_by("-purchase_count", "title", "id")
        )
        data = InstructorPublicSerializer(instructor, context=context).data
        data["stats"] = instructor_stats(instructor)
        data["courses"] = PublicCourseRecommendationSerializer(courses, many=True, context=context).data
        return success_response(data, message="Instructor fetched successfully")


class InstructorFeedbackListCreateView(generics.GenericAPIView):
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsStudent()]
        return [AllowAny()]

    def get(self, request, pk):
        instructor = get_public_instructor(pk)
        if not instructor:
            return _not_found()
        feedback = InstructorFeedback.objects.filter(instructor=instructor).select_related(
            "student", "course", "instructor"
        )
        page = self.paginate_queryset(feedback)
        serializer = InstructorFeedbackSerializer(page, many=True)
        return success_response(
            self.paginator.get_paginated_response(serializer.data).data,
            message="Feedback fetched successfully",
        )

    def post(self, request, pk):
        instructor = get_public_instructor(pk)
        if not instructor:
            return _not_found()

        serializer = InstructorFeedbackWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.validated_data["course"]

        if not eligible_courses(request.user, instructor).filter(pk=course.pk).exists():
            return error_response(
                message="You can only review instructors of courses you're enrolled in.",
                status_code=403,
            )

        feedback, created = InstructorFeedback.objects.update_or_create(
            student=request.user,
            instructor=instructor,
            course=course,
            defaults={
                "rating": serializer.validated_data["rating"],
                "comment": serializer.validated_data["comment"],
            },
        )
        return success_response(
            InstructorFeedbackSerializer(feedback).data,
            message="Feedback submitted" if created else "Feedback updated",
            status_code=201 if created else 200,
        )


class InstructorFeedbackEligibilityView(generics.GenericAPIView):
    """Which of the instructor's courses the signed-in student may review, and
    the feedback they've already left for each."""

    permission_classes = [IsStudent]

    def get(self, request, pk):
        instructor = get_public_instructor(pk)
        if not instructor:
            return _not_found()

        existing = {
            item.course_id: item
            for item in InstructorFeedback.objects.filter(
                instructor=instructor, student=request.user
            ).select_related("student", "course")
        }
        data = [
            {
                "course": {"id": course.id, "title": course.title, "slug": course.slug},
                "feedback": (
                    InstructorFeedbackSerializer(existing[course.id]).data
                    if course.id in existing
                    else None
                ),
            }
            for course in eligible_courses(request.user, instructor).order_by("title")
        ]
        return success_response(data, message="Eligible courses fetched successfully")


class InstructorFeedbackDetailView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def delete(self, request, pk, course_id):
        deleted, _ = InstructorFeedback.objects.filter(
            instructor_id=pk, student=request.user, course_id=course_id
        ).delete()
        if not deleted:
            return error_response(message="Feedback not found.", status_code=404)
        return success_response(None, message="Feedback deleted")


class MyInstructorProfileView(generics.GenericAPIView):
    """The signed-in teacher's own public profile (GET to load the form, PATCH to save)."""

    permission_classes = [IsTeacher]

    def _payload(self, request):
        user = type(request.user).objects.select_related("profile", "instructor_profile").get(
            pk=request.user.pk
        )
        data = InstructorPublicSerializer(user, context=self.get_serializer_context()).data
        data["stats"] = instructor_stats(user)
        data["is_public"] = bool(get_public_instructor(user.pk))
        return data

    def get(self, request):
        return success_response(self._payload(request), message="Profile fetched successfully")

    def patch(self, request):
        serializer = InstructorProfileWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(request.user)
        return success_response(self._payload(request), message="Profile updated successfully")


class MyInstructorFeedbackView(generics.GenericAPIView):
    """Feedback the signed-in teacher has received (works before they have a public page)."""

    permission_classes = [IsTeacher]
    pagination_class = Pagination

    def get(self, request):
        feedback = InstructorFeedback.objects.filter(instructor=request.user).select_related(
            "student", "course", "instructor"
        )
        page = self.paginate_queryset(feedback)
        serializer = InstructorFeedbackSerializer(page, many=True)
        data = self.paginator.get_paginated_response(serializer.data).data
        data["summary"] = instructor_stats(request.user)
        return success_response(data, message="Feedback fetched successfully")


class CourseFeedbackListView(generics.GenericAPIView):
    """Public feedback left for a published course's instructors, with the
    course's overall rating — shown under the instructors on the course page."""

    permission_classes = [AllowAny]
    pagination_class = Pagination

    def get(self, request, slug):
        course = Course.objects.filter(slug=slug, status=Status.PUBLISHED).first()
        if not course:
            return error_response(message="Course not found.", status_code=404)

        feedback = InstructorFeedback.objects.filter(course=course).select_related(
            "student", "course", "instructor"
        )
        totals = feedback.aggregate(reviews=Count("id"), rating=Avg("rating"))
        page = self.paginate_queryset(feedback)
        serializer = InstructorFeedbackSerializer(page, many=True)
        data = self.paginator.get_paginated_response(serializer.data).data
        data["summary"] = {
            "reviews": totals["reviews"] or 0,
            "rating": round(totals["rating"], 1) if totals["rating"] is not None else None,
        }
        return success_response(data, message="Feedback fetched successfully")
