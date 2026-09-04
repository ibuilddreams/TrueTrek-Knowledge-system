from rest_framework import filters, generics
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from courses.models import Course
from courses.services import is_course_instructor
from enrollments.models import Enrollment
from enrollments.services import can_view_student_in_course, get_visible_enrollments
from modules.models import Module
from users.permissions import IsStudent

from .ai_review.exceptions import AIReviewAlreadyProcessingError
from .ai_review.presenters import latest_review_summary
from .ai_review.services import submit_for_ai_review
from .models import Assignment, AssignmentAttachment, AssignmentSubmission
from .permissions import IsCourseInstructorOrAdmin, IsEnrolledStudentOrAdmin
from .serializers import (
    AssignmentAttachmentOrderEntrySerializer,
    AssignmentAttachmentSerializer,
    AssignmentAttachmentWriteSerializer,
    AssignmentGradeSerializer,
    AssignmentOrderEntrySerializer,
    AssignmentSerializer,
    AssignmentSubmissionFileSerializer,
    AssignmentSubmissionSerializer,
    AssignmentWriteSerializer,
)
from .services import (
    AssignmentAttachmentReorderError,
    AssignmentGradingError,
    AssignmentPublishError,
    AssignmentReorderError,
    AssignmentSubmissionError,
    get_student_assignments,
    grade_submission,
    publish_assignment,
    reorder_assignment_attachments,
    reorder_assignments,
    submit_assignment,
)
from .validators import validate_assignment_file


class StudentAssignmentListView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request):
        data = get_student_assignments(request.user, request=request)
        return success_response(data, message="Student assignments fetched successfully")


def _scope_assignment_queryset_for_reads(queryset, user):
    if user.is_admin:
        return queryset
    if user.is_teacher:
        return queryset.filter(course__instructors__instructor=user).distinct()

    enrolled_course_ids = Enrollment.objects.filter(
        student=user, status=Enrollment.EnrollmentStatus.ACTIVE
    ).values_list("course_id", flat=True)
    return queryset.filter(course_id__in=enrolled_course_ids, status=Status.PUBLISHED)


class AssignmentListCreateView(generics.ListCreateAPIView):
    queryset = Assignment.objects.select_related("course", "module").prefetch_related("attachments")
    pagination_class = Pagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["title", "due_date", "created_at", "order", "total_marks"]
    ordering = ["module", "order"]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsCourseInstructorOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        course_id = self.request.query_params.get("course")
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        module_id = self.request.query_params.get("module")
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        if self.request.method == "GET":
            queryset = _scope_assignment_queryset_for_reads(queryset, self.request.user)

        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AssignmentWriteSerializer
        return AssignmentSerializer

    def list(self, request, *args, **kwargs):
        assignments = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(assignments)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Assignments fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        return success_response(
            AssignmentSerializer(assignment, context={"request": request}).data,
            message="Assignment created successfully",
            status_code=201,
        )


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Assignment.objects.select_related("course", "module").prefetch_related("attachments")

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsCourseInstructorOrAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.method == "GET":
            queryset = _scope_assignment_queryset_for_reads(queryset, self.request.user)
        return queryset

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AssignmentWriteSerializer
        return AssignmentSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            assignment = self.get_queryset().get(pk=kwargs["pk"])
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        serializer = self.get_serializer(assignment, context={"request": request})
        return success_response(serializer.data, message="Assignment fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            assignment = self.get_queryset().get(pk=kwargs["pk"])
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        self.check_object_permissions(request, assignment)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(
            assignment, data=request.data, partial=partial, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        assignment = serializer.save()
        return success_response(
            AssignmentSerializer(assignment, context={"request": request}).data,
            message="Assignment updated successfully",
        )

    def destroy(self, request, *args, **kwargs):
        try:
            assignment = self.get_queryset().get(pk=kwargs["pk"])
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        self.check_object_permissions(request, assignment)

        assignment.delete()
        return success_response(None, message="Assignment deleted successfully")


class AssignmentPublishView(generics.GenericAPIView):
    queryset = Assignment.objects.select_related("course")
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            assignment = self.get_queryset().get(pk=pk)
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        if not (request.user.is_admin or is_course_instructor(request.user, assignment.course)):
            return error_response(
                message="You do not have permission to perform this action.", status_code=403
            )

        try:
            assignment = publish_assignment(assignment)
        except AssignmentPublishError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            AssignmentSerializer(assignment, context={"request": request}).data,
            message="Assignment published successfully",
        )


class AssignmentOrderView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    serializer_class = AssignmentOrderEntrySerializer

    def get_permissions(self):
        return [IsCourseInstructorOrAdmin()]

    def patch(self, request, *args, **kwargs):
        module_id = kwargs["module_id"]
        try:
            module = Module.objects.select_related("course").get(pk=module_id)
        except Module.DoesNotExist:
            return error_response(message="Module with the given id does not exist.", status_code=404)

        if not (request.user.is_admin or is_course_instructor(request.user, module.course)):
            return error_response(
                message="You do not have permission to perform this action.",
                status_code=403,
            )

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            assignments = reorder_assignments(module_id, serializer.validated_data)
        except AssignmentReorderError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            AssignmentSerializer(assignments, many=True, context={"request": request}).data,
            message="Assignments reordered successfully",
        )


class AssignmentAttachmentListCreateView(generics.ListCreateAPIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsCourseInstructorOrAdmin()]
        return [IsEnrolledStudentOrAdmin()]

    def get_queryset(self):
        return AssignmentAttachment.objects.filter(
            assignment_id=self.kwargs["assignment_id"]
        ).select_related("assignment__course")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AssignmentAttachmentWriteSerializer
        return AssignmentAttachmentSerializer

    def list(self, request, *args, **kwargs):
        try:
            assignment = Assignment.objects.select_related("course").get(pk=kwargs["assignment_id"])
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        self.check_object_permissions(request, assignment)

        attachments = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(attachments, many=True, context={"request": request})
        return success_response(serializer.data, message="Attachments fetched successfully")

    def create(self, request, *args, **kwargs):
        try:
            assignment = Assignment.objects.get(pk=kwargs["assignment_id"])
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attachment = serializer.save(assignment=assignment, uploaded_by=request.user)
        return success_response(
            AssignmentAttachmentSerializer(attachment, context={"request": request}).data,
            message="Attachment uploaded successfully",
            status_code=201,
        )


class AssignmentAttachmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = AssignmentAttachment.objects.select_related("assignment__course")
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsEnrolledStudentOrAdmin()]
        return [IsCourseInstructorOrAdmin()]

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AssignmentAttachmentWriteSerializer
        return AssignmentAttachmentSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            attachment = self.get_queryset().get(pk=kwargs["pk"])
        except AssignmentAttachment.DoesNotExist:
            return error_response(
                message="Attachment with the given id does not exist.", status_code=404
            )

        self.check_object_permissions(request, attachment)

        serializer = self.get_serializer(attachment, context={"request": request})
        return success_response(serializer.data, message="Attachment fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            attachment = self.get_queryset().get(pk=kwargs["pk"])
        except AssignmentAttachment.DoesNotExist:
            return error_response(
                message="Attachment with the given id does not exist.", status_code=404
            )

        self.check_object_permissions(request, attachment)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(attachment, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        attachment = serializer.save()
        return success_response(
            AssignmentAttachmentSerializer(attachment, context={"request": request}).data,
            message="Attachment updated successfully",
        )

    def destroy(self, request, *args, **kwargs):
        try:
            attachment = self.get_queryset().get(pk=kwargs["pk"])
        except AssignmentAttachment.DoesNotExist:
            return error_response(
                message="Attachment with the given id does not exist.", status_code=404
            )

        self.check_object_permissions(request, attachment)

        attachment.delete()
        return success_response(None, message="Attachment deleted successfully")


class AssignmentAttachmentOrderView(generics.GenericAPIView):
    http_method_names = ["patch", "head", "options"]
    serializer_class = AssignmentAttachmentOrderEntrySerializer

    def get_permissions(self):
        return [IsCourseInstructorOrAdmin()]

    def patch(self, request, *args, **kwargs):
        assignment_id = kwargs["assignment_id"]
        try:
            assignment = Assignment.objects.select_related("course").get(pk=assignment_id)
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        if not (request.user.is_admin or is_course_instructor(request.user, assignment.course)):
            return error_response(
                message="You do not have permission to perform this action.",
                status_code=403,
            )

        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            attachments = reorder_assignment_attachments(assignment_id, serializer.validated_data)
        except AssignmentAttachmentReorderError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            AssignmentAttachmentSerializer(attachments, many=True, context={"request": request}).data,
            message="Attachments reordered successfully",
        )


class AssignmentSubmissionListView(generics.ListAPIView):
    serializer_class = AssignmentSubmissionSerializer
    pagination_class = Pagination
    permission_classes = [IsCourseInstructorOrAdmin]

    def get_queryset(self):
        queryset = AssignmentSubmission.objects.filter(
            assignment_id=self.kwargs["assignment_id"]
        ).select_related("assignment", "student").prefetch_related("files", "ai_reviews")
        if not self.request.user.is_admin:
            visible_student_ids = get_visible_enrollments(
                self.assignment.course, self.request.user
            ).values_list("student_id", flat=True)
            queryset = queryset.filter(student_id__in=visible_student_ids)
        return queryset

    def list(self, request, *args, **kwargs):
        try:
            assignment = Assignment.objects.select_related("course").get(pk=kwargs["assignment_id"])
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        self.check_object_permissions(request, assignment)
        self.assignment = assignment

        submissions = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(submissions)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Submissions fetched successfully")


class AssignmentSubmitView(generics.GenericAPIView):
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, assignment_id):
        try:
            assignment = Assignment.objects.select_related("course").get(pk=assignment_id)
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        if not Enrollment.objects.filter(
            student=request.user,
            course_id=assignment.course_id,
            status=Enrollment.EnrollmentStatus.ACTIVE,
        ).exists():
            return error_response(message="You are not enrolled in this course.", status_code=403)

        files = request.FILES.getlist("files")
        if not files:
            return error_response(message="Provide at least one file.", status_code=400)

        try:
            for uploaded_file in files:
                validate_assignment_file(uploaded_file)
        except ValidationError as exc:
            return error_response(message=str(exc.detail), status_code=400)

        try:
            submission = submit_assignment(request.user, assignment, files)
        except AssignmentSubmissionError as exc:
            return error_response(message=str(exc), status_code=400)

        # The submission is already committed at this point — an AI review
        # failure below can never lose or roll back the student's work
        # (Task 15: "AI failure != submission failure"). submit_for_ai_review
        # never raises for a provider/validation failure; the only exception
        # it can raise is AIReviewAlreadyProcessingError, for the genuine
        # double-click/duplicate-request case (two near-simultaneous submits
        # can both reach this point since submit_assignment's get_or_create
        # isn't itself locked) — that's a real race, not "can't happen", so
        # it's handled the same "submission still saved" way: just skip
        # re-triggering a second attempt and report whatever the in-flight
        # one has produced by the time we serialize the response.
        if assignment.grading_mode == Assignment.GradingMode.AI:
            try:
                submit_for_ai_review(submission)
            except AIReviewAlreadyProcessingError:
                pass
            submission.refresh_from_db()

        return success_response(
            AssignmentSubmissionSerializer(submission, context={"request": request}).data,
            message="Assignment submitted successfully",
            status_code=201,
        )


class AssignmentMySubmissionView(generics.GenericAPIView):
    permission_classes = [IsStudent]

    def get(self, request, assignment_id):
        try:
            submission = (
                AssignmentSubmission.objects.select_related("assignment", "student")
                .prefetch_related("files", "ai_reviews")
                .get(assignment_id=assignment_id, student=request.user)
            )
        except AssignmentSubmission.DoesNotExist:
            return error_response(
                message="You have not submitted this assignment yet.", status_code=404
            )

        return success_response(
            AssignmentSubmissionSerializer(submission, context={"request": request}).data,
            message="Submission fetched successfully",
        )


class AssignmentAIReviewRetryView(generics.GenericAPIView):
    """Re-runs AI review for the student's existing submission without
    requiring a new file upload — for the specific "the AI was unavailable,
    just try again" case. Revising and resubmitting different work still
    goes through AssignmentSubmitView (POST .../submit/), which already
    triggers a fresh AI review as part of that request."""

    permission_classes = [IsStudent]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "ai-grading"

    def post(self, request, assignment_id):
        try:
            assignment = Assignment.objects.select_related("course").get(pk=assignment_id)
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        if assignment.grading_mode != Assignment.GradingMode.AI:
            return error_response(
                message="This assignment is not configured for AI review.", status_code=400
            )

        try:
            submission = AssignmentSubmission.objects.get(
                assignment_id=assignment_id, student=request.user
            )
        except AssignmentSubmission.DoesNotExist:
            return error_response(
                message="You have not submitted this assignment yet.", status_code=404
            )

        if submission.graded_by is not None:
            # A teacher/admin has manually graded (or overridden) this
            # submission — a fresh AI pass would call grade_submission(...,
            # grader=None, ...) on a PASS result, silently overwriting the
            # human's marks/feedback and resetting graded_by back to None
            # with no audit trail. Mirrors QuizAnswerAIRetryView's equivalent
            # "already graded, don't let AI retry clobber it" guard.
            return error_response(
                message="This submission has already been graded by a teacher or admin and cannot be re-reviewed by AI.",
                status_code=400,
            )

        try:
            submit_for_ai_review(submission)
        except AIReviewAlreadyProcessingError as exc:
            return error_response(message=str(exc), status_code=409)

        submission.refresh_from_db()
        return success_response(
            AssignmentSubmissionSerializer(submission, context={"request": request}).data,
            message="AI review retried",
        )


class AssignmentGradeSubmissionView(generics.GenericAPIView):
    serializer_class = AssignmentGradeSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            submission = AssignmentSubmission.objects.select_related(
                "assignment__course", "student"
            ).get(pk=pk)
        except AssignmentSubmission.DoesNotExist:
            return error_response(
                message="Submission with the given id does not exist.", status_code=404
            )

        if not (
            request.user.is_admin
            or is_course_instructor(request.user, submission.assignment.course)
        ):
            return error_response(
                message="You do not have permission to perform this action.", status_code=403
            )

        if not request.user.is_admin and not can_view_student_in_course(
            request.user, submission.student_id, submission.assignment.course
        ):
            return error_response(
                message="You do not have permission to perform this action.", status_code=403
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            submission = grade_submission(
                submission,
                request.user,
                serializer.validated_data["marks"],
                serializer.validated_data.get("feedback", ""),
            )
        except AssignmentGradingError as exc:
            return error_response(message=str(exc), status_code=400)

        return success_response(
            AssignmentSubmissionSerializer(submission, context={"request": request}).data,
            message="Submission graded successfully",
        )


class AssignmentCourseProgressListView(generics.GenericAPIView):
    """Teacher/admin-facing submission-grading dashboard for one course."""

    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get(self, request, course_id):
        try:
            course = Course.objects.get(pk=course_id)
        except Course.DoesNotExist:
            return error_response(message="Course with the given id does not exist.", status_code=404)

        if not (request.user.is_admin or is_course_instructor(request.user, course)):
            return error_response(
                message="You do not have permission to perform this action.", status_code=403
            )

        assignments = Assignment.objects.filter(course=course, status=Status.PUBLISHED)
        assignment_id = request.query_params.get("assignment")
        if assignment_id:
            assignments = assignments.filter(id=assignment_id)
        assignments = list(assignments.order_by("module", "order"))
        assignment_ids = [assignment.id for assignment in assignments]

        enrollments = get_visible_enrollments(course, request.user).select_related("student")
        student_id = request.query_params.get("student")
        if student_id:
            enrollments = enrollments.filter(student_id=student_id)
        enrollments = list(enrollments)
        student_ids = [enrollment.student_id for enrollment in enrollments]

        submissions = (
            AssignmentSubmission.objects.filter(
                assignment_id__in=assignment_ids, student_id__in=student_ids
            )
            .exclude(status=AssignmentSubmission.SubmissionStatus.DRAFT)
            .select_related("student")
            .prefetch_related("files", "ai_reviews")
        )
        submission_map = {(s.assignment_id, s.student_id): s for s in submissions}

        all_rows = []
        for assignment in assignments:
            for enrollment in enrollments:
                submission = submission_map.get((assignment.id, enrollment.student_id))
                all_rows.append(
                    {
                        "assignment": {
                            "id": assignment.id,
                            "title": assignment.title,
                            "total_marks": assignment.total_marks,
                            "due_date": assignment.due_date,
                            "grading_mode": assignment.grading_mode,
                        },
                        "student": {
                            "id": enrollment.student_id,
                            "name": enrollment.student.name,
                            "email": enrollment.student.email,
                        },
                        "status": submission.status if submission else "PENDING",
                        "submission_id": submission.id if submission else None,
                        "submitted_at": submission.submitted_at if submission else None,
                        "marks": submission.marks if submission else None,
                        "feedback": submission.feedback if submission else "",
                        "graded_at": submission.graded_at if submission else None,
                        "files": (
                            AssignmentSubmissionFileSerializer(
                                submission.files.all(), many=True, context={"request": request}
                            ).data
                            if submission
                            else []
                        ),
                        "ai_review": (
                            latest_review_summary(submission)
                            if submission and assignment.grading_mode == Assignment.GradingMode.AI
                            else None
                        ),
                    }
                )

        total_submissions = sum(1 for row in all_rows if row["submission_id"] is not None)
        graded = sum(1 for row in all_rows if row["marks"] is not None)
        stats = {
            "total_assignments": len(assignments),
            "total_submissions": total_submissions,
            "pending_reviews": total_submissions - graded,
            "graded": graded,
        }

        status_filter = request.query_params.get("status")
        rows = (
            [row for row in all_rows if row["status"] == status_filter]
            if status_filter
            else all_rows
        )

        page = self.paginate_queryset(rows)
        paginated_data = self.paginator.get_paginated_response(page).data
        data = {"stats": stats, **paginated_data}
        return success_response(data, message="Assignment progress fetched successfully")
