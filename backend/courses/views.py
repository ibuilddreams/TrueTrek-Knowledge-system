from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.models import Status
from common.pagination import Pagination
from common.response import error_response, success_response
from enrollments.models import Enrollment
from enrollments.serializers import CourseEnrolledStudentSerializer
from users.permissions import IsAdmin, IsTeacher

from .grades import MAX_GRADE, MIN_GRADE, grade_name
from .models import Category, Course, Tag
from .serializers import (
    CategorySerializer,
    CourseDetailSerializer,
    CourseListSerializer,
    CourseWriteSerializer,
    PublicCourseListSerializer,
    PublicCourseRecommendationSerializer,
    PublicCourseDetailSerializer,
    TagSerializer,
    TagWriteSerializer,
    TeacherSerializer,
)

UserModel = get_user_model()


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.prefetch_related("courses__tags", "courses__instructors__instructor")
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def list(self, request, *args, **kwargs):
        categories = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(categories)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Categories fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return success_response(
            self.get_serializer(category).data,
            message="Category created successfully",
            status_code=201,
        )


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def retrieve(self, request, *args, **kwargs):
        category = self.get_object()
        serializer = self.get_serializer(category)
        return success_response(serializer.data, message="Category fetched successfully")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        category = self.get_object()
        serializer = self.get_serializer(category, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        category = serializer.save()
        return success_response(serializer.data, message="Category updated successfully")

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        category.delete()
        return success_response(None, message="Category deleted successfully")


class CourseStatusChoicesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        choices = [
            {"value": value, "label": label}
            for value, label in Course._meta.get_field("status").choices
        ]
        return success_response(choices, message="Course status choices fetched successfully")


class TagListCreateView(generics.ListCreateAPIView):
    queryset = Tag.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_permissions(self):
        if self.request.method == "POST":
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TagWriteSerializer
        return TagSerializer

    def list(self, request, *args, **kwargs):
        tags = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(tags, many=True)
        return success_response(serializer.data, message="Tags fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tag = serializer.save()
        return success_response(
            TagSerializer(tag).data, message="Tag created successfully", status_code=201
        )


class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Tag.objects.all()
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ("PATCH", "DELETE"):
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return TagWriteSerializer
        return TagSerializer

    def retrieve(self, request, *args, **kwargs):
        try:
            tag = self.get_queryset().get(pk=kwargs["pk"])
        except Tag.DoesNotExist:
            return error_response(message="Tag with the given id does not exist.", status_code=404)

        serializer = self.get_serializer(tag)
        return success_response(serializer.data, message="Tag fetched successfully")

    def update(self, request, *args, **kwargs):
        try:
            tag = self.get_queryset().get(pk=kwargs["pk"])
        except Tag.DoesNotExist:
            return error_response(message="Tag with the given id does not exist.", status_code=404)

        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(tag, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        tag = serializer.save()
        return success_response(TagSerializer(tag).data, message="Tag updated successfully")

    def destroy(self, request, *args, **kwargs):
        try:
            tag = self.get_queryset().get(pk=kwargs["pk"])
        except Tag.DoesNotExist:
            return error_response(message="Tag with the given id does not exist.", status_code=404)

        tag.delete()
        return success_response(None, message="Tag deleted successfully")


class PublicCourseListView(generics.ListAPIView):
    """Anonymous-safe curriculum browsing — published courses only, no auth required."""

    queryset = Course.objects.select_related("category").prefetch_related("tags").filter(
        status=Status.PUBLISHED
    )
    serializer_class = PublicCourseListSerializer
    permission_classes = [AllowAny]
    pagination_class = Pagination

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        search = params.get("search")
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))

        category_param = params.get("category")
        if category_param:
            queryset = queryset.filter(category_id=category_param)

        difficulty_param = params.get("difficulty")
        if difficulty_param:
            queryset = queryset.filter(difficulty=difficulty_param.upper())

        # A single grade (Pre-K = -1, K = 0, 1-12) matches every course whose
        # grade range includes it.
        grade_param = params.get("grade")
        if grade_param not in (None, ""):
            try:
                grade = int(grade_param)
            except ValueError:
                grade = None
            if grade is None or not MIN_GRADE <= grade <= MAX_GRADE:
                queryset = queryset.none()
            else:
                queryset = queryset.filter(grade_min__lte=grade, grade_max__gte=grade)

        ordering = {"title": "title", "-title": "-title", "newest": "-created_at"}
        queryset = queryset.order_by(ordering.get(params.get("sort"), "title"), "id")

        # Opt-in — the public curriculum/marketing page shares this endpoint and
        # must keep showing every course regardless of the viewer's enrollment
        # status. Only the Store page passes this, so it's the only caller that
        # gets already-enrolled courses hidden.
        exclude_enrolled = params.get("exclude_enrolled") in ("1", "true", "True")
        if exclude_enrolled and self.request.user and self.request.user.is_authenticated:
            enrolled_course_ids = Enrollment.objects.filter(
                student=self.request.user
            ).values_list("course_id", flat=True)
            queryset = queryset.exclude(id__in=enrolled_course_ids)

        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        courses = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(courses)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Courses fetched successfully")


class PublicCourseRecommendationsView(generics.GenericAPIView):
    """Cart upsell data — courses related to the cart and the most purchased ones.

    `course_ids` (comma-separated) is the viewer's cart: those courses, plus
    anything an authenticated viewer is already enrolled in, are never suggested.
    Anonymous-safe so guests (whose cart lives in the browser) get it too.
    """

    permission_classes = [AllowAny]
    DEFAULT_LIMIT = 8
    MAX_LIMIT = 12

    def _parse_ids(self, raw):
        ids = []
        for part in (raw or "").split(","):
            part = part.strip()
            if part.isdigit():
                ids.append(int(part))
        return ids

    def _parse_limit(self, raw):
        try:
            limit = int(raw)
        except (TypeError, ValueError):
            return self.DEFAULT_LIMIT
        return max(1, min(limit, self.MAX_LIMIT))

    def get(self, request):
        cart_ids = self._parse_ids(request.query_params.get("course_ids"))
        limit = self._parse_limit(request.query_params.get("limit"))

        excluded_ids = set(cart_ids)
        if request.user and request.user.is_authenticated:
            excluded_ids.update(
                Enrollment.objects.filter(student=request.user).values_list("course_id", flat=True)
            )

        candidates = (
            Course.objects.filter(status=Status.PUBLISHED)
            .exclude(id__in=excluded_ids)
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

        # Related: same category or shared tags, best tag overlap first.
        # Popular: most purchased overall, skipping whatever "related" already
        # shows so the two tabs surface different courses.
        related = []
        cart_courses = Course.objects.filter(id__in=cart_ids)
        if cart_courses.exists():
            category_ids = list(cart_courses.values_list("category_id", flat=True))
            tag_ids = list(Tag.objects.filter(courses__in=cart_courses).values_list("id", flat=True))
            related_ids = Course.objects.filter(
                Q(category_id__in=category_ids) | Q(tags__id__in=tag_ids)
            ).values_list("id", flat=True)
            related = list(
                candidates.filter(id__in=related_ids)
                .annotate(shared_tags=Count("tags", filter=Q(tags__id__in=tag_ids), distinct=True))
                .order_by("-shared_tags", "-purchase_count", "title", "id")[:limit]
            )

        popular = candidates.exclude(id__in=[c.id for c in related])
        # With a cart, "popular" means actually purchased. With no cart (the
        # empty-cart "Learners are viewing" shelf) fall back to every published
        # course so a fresh catalogue still has something to show.
        if cart_ids:
            popular = popular.filter(purchase_count__gt=0)

        context = self.get_serializer_context()
        return success_response(
            {
                "related": PublicCourseRecommendationSerializer(related, many=True, context=context).data,
                "popular": PublicCourseRecommendationSerializer(popular[:limit], many=True, context=context).data,
            },
            message="Course recommendations fetched successfully",
        )


class PublicCourseDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicCourseDetailSerializer
    lookup_field = "slug"
    queryset = Course.objects.filter(status=Status.PUBLISHED).select_related("category").prefetch_related(
        "tags",
        "instructors__instructor__profile",
        "instructors__instructor__instructor_profile",
        "modules__lessons",
        "modules__assignments",
        "modules__quizzes",
    )

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data, message="Course details fetched successfully")


class PublicCourseFiltersView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        courses = Course.objects.filter(status=Status.PUBLISHED)

        ranges = courses.exclude(grade_min__isnull=True).exclude(grade_max__isnull=True).values_list(
            "grade_min", "grade_max"
        ).distinct()
        grades = sorted({g for low, high in ranges for g in range(low, high + 1)})

        present_difficulties = set(courses.values_list("difficulty", flat=True).distinct())
        difficulties = [
            {"value": value, "label": label}
            for value, label in Course.Difficulty.choices
            if value in present_difficulties
        ]

        return success_response({
            "subjects": list(Category.objects.filter(courses__in=courses).distinct().order_by("name").values("id", "name")),
            "grades": [{"value": grade, "label": grade_name(grade)} for grade in grades],
            "difficulties": difficulties,
        }, message="Curriculum filters fetched successfully")


class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.select_related("category").prefetch_related("tags", "instructors__instructor")
    permission_classes = [IsAuthenticated]
    pagination_class = Pagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [(IsAdmin | IsTeacher)()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CourseWriteSerializer
        return CourseListSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        search = params.get("search")
        if search:
            queryset = queryset.filter(title__icontains=search)

        status_param = params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        category_param = params.get("category")
        if category_param:
            queryset = queryset.filter(category_id=category_param)

        tags_param = params.get("tags")
        if tags_param:
            queryset = queryset.filter(tags__id=tags_param)

        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        courses = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(courses)
        serializer = self.get_serializer(page, many=True)
        paginated_data = self.paginator.get_paginated_response(serializer.data).data
        return success_response(paginated_data, message="Courses fetched successfully")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return success_response(
            CourseDetailSerializer(course).data,
            message="Course created successfully",
            status_code=201,
        )


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.select_related("category").prefetch_related(
        "tags", "instructors__instructor", "modules__lessons", "modules__assignments", "modules__quizzes"
    )
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            permission = IsAdmin()
            permission.message = "You do not have permission to perform this action. Only admin can perform this action."
            return [permission]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CourseWriteSerializer
        return CourseDetailSerializer

    def retrieve(self, request, *args, **kwargs):
        course = self.get_object()
        serializer = self.get_serializer(course)
        return success_response(serializer.data, message="Course fetched successfully")

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        course = self.get_object()
        serializer = self.get_serializer(course, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return success_response(
            CourseDetailSerializer(course).data, message="Course updated successfully"
        )

    def destroy(self, request, *args, **kwargs):
        try:
            course = self.get_queryset().get(pk=kwargs["pk"])
        except Course.DoesNotExist:
            return error_response(message="Course with the given id does not exist.", status_code=404)
        course.delete()
        return success_response(None, message="Course deleted successfully")


class AdminTeacherAssignedCoursesView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, teacher_id):
        try:
            teacher = UserModel.objects.get(pk=teacher_id, role=UserModel.Roles.TEACHER)
        except UserModel.DoesNotExist:
            return error_response(
                message="Teacher with the given id does not exist.", status_code=404
            )

        courses = Course.objects.filter(
            instructors__instructor_id=teacher_id
        ).select_related("category").prefetch_related("tags", "instructors__instructor")

        data = {
            "teacher": TeacherSerializer(teacher).data,
            "total_courses": courses.count(),
            "courses": CourseListSerializer(courses, many=True).data,
        }
        return success_response(data, message="Teacher's assigned courses fetched successfully")


class AdminTeacherAssignedCoursesWithStudentsView(generics.GenericAPIView):
    permission_classes = [IsAdmin]

    def get(self, request, teacher_id):
        try:
            teacher = UserModel.objects.get(pk=teacher_id, role=UserModel.Roles.TEACHER)
        except UserModel.DoesNotExist:
            return error_response(
                message="Teacher with the given id does not exist.", status_code=404
            )

        courses = Course.objects.filter(instructors__instructor_id=teacher_id)

        courses_data = []
        for course in courses:
            enrollments = Enrollment.objects.filter(
                course=course, teacher_id=teacher_id
            ).select_related("student")
            courses_data.append(
                {
                    "id": course.id,
                    "title": course.title,
                    "slug": course.slug,
                    "status": course.status,
                    "total_students": enrollments.count(),
                    "students": CourseEnrolledStudentSerializer(enrollments, many=True).data,
                }
            )

        data = {
            "teacher": TeacherSerializer(teacher).data,
            "total_courses": len(courses_data),
            "courses": courses_data,
        }
        return success_response(
            data, message="Assigned courses with enrolled students fetched successfully"
        )
