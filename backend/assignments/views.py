from rest_framework import filters, generics
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from courses.services import is_course_instructor
from enrollments.models import Enrollment
from modules.models import Module
from users.permissions import IsStudent

from .models import Assignment, AssignmentAttachment, AssignmentSubmission
from .permissions import IsCourseInstructorOrAdmin, IsEnrolledStudentOrAdmin
from .serializers import (
    AssignmentAttachmentOrderEntrySerializer,
    AssignmentAttachmentSerializer,
    AssignmentAttachmentWriteSerializer,
    AssignmentGradeSerializer,
    AssignmentOrderEntrySerializer,
    AssignmentSerializer,
    AssignmentSubmissionSerializer,
    AssignmentSubmitSerializer,
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
        data = get_student_assignments(request.user)
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
        return AssignmentSubmission.objects.filter(
            assignment_id=self.kwargs["assignment_id"]
        ).select_related("assignment", "student").prefetch_related("files")

    def list(self, request, *args, **kwargs):
        try:
            assignment = Assignment.objects.select_related("course").get(pk=kwargs["assignment_id"])
        except Assignment.DoesNotExist:
            return error_response(
                message="Assignment with the given id does not exist.", status_code=404
            )

        self.check_object_permissions(request, assignment)

        submissions = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(submissions)
        serializer = self.get_serializer(page, many=True, context={"request": request})
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Submissions fetched successfully")


class AssignmentSubmitView(generics.GenericAPIView):
    permission_classes = [IsStudent]
    serializer_class = AssignmentSubmitSerializer
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

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        files = request.FILES.getlist("files")
        if not serializer.validated_data.get("submission_text", "").strip() and not files:
            return error_response(
                message="Provide submission text or at least one file.", status_code=400
            )

        try:
            for uploaded_file in files:
                validate_assignment_file(uploaded_file)
        except ValidationError as exc:
            return error_response(message=str(exc.detail), status_code=400)

        try:
            submission = submit_assignment(
                request.user,
                assignment,
                serializer.validated_data.get("submission_text", ""),
                files,
            )
        except AssignmentSubmissionError as exc:
            return error_response(message=str(exc), status_code=400)

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
                .prefetch_related("files")
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
