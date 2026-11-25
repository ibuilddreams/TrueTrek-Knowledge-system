"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookOpen, BookPlus, RefreshCw, Send, Users } from "lucide-react";
import { getTeacherAssignedCourses } from "@/services/teacherCoursesService";
import { getCategories } from "@/services/categoriesService";
import { getTags } from "@/services/tagsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalPageHead,
  PortalTable,
  PortalTd,
  PortalTh,
  PortalToolbar,
  PortalToolbarCount,
  PortalTr,
} from "@/components/features/portal/shell/PortalUI";
import TeacherCourseFormModal from "@/components/features/teachers/TeacherCourseFormModal";
import CourseStudentsScreen from "./CourseStudentsScreen";
import CourseContentScreen from "./CourseContentScreen";
import CourseFeedScreen from "./CourseFeedScreen";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function MyCoursesTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCourseId = searchParams.get("courseId");
  const rawView = searchParams.get("view");
  const activeView = rawView === "content" || rawView === "feed" ? rawView : "students";

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  const {
    data: courses = [],
    isLoading: isCoursesLoading,
    isError: isCoursesError,
    error: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: [
      "teacherAssignedCourses",
      {
        search: debouncedSearch,
        status: statusFilter,
        category: categoryFilter,
        tags: tagFilter,
      },
    ],
    queryFn: async () => {
      const response = await getTeacherAssignedCourses({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        tags: tagFilter || undefined,
      });
      return response?.data?.courses || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories({ pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const response = await getTags();
      return response?.data || [];
    },
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, tagFilter]);

  const handleViewStudents = useCallback(
    (course) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("courseId", String(course.id));
      params.set("view", "students");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleViewCourse = useCallback(
    (course) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("courseId", String(course.id));
      params.set("view", "content");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleViewFeed = useCallback(
    (course) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("courseId", String(course.id));
      params.set("view", "feed");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleBackToCourses = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("courseId");
    params.delete("view");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const categoryFilterOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((category) => ({
        value: String(category.id),
        label: category.name,
      })),
    ],
    [categories],
  );

  const tagFilterOptions = useMemo(
    () => [
      { value: "", label: "All tags" },
      ...tags.map((tag) => ({ value: String(tag.id), label: tag.name })),
    ],
    [tags],
  );

  const filteredCourses = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return courses.filter((course) => {
      if (query && !course.title?.toLowerCase().includes(query)) return false;
      if (statusFilter && course.status !== statusFilter) return false;
      if (categoryFilter && String(course.category?.id) !== categoryFilter)
        return false;
      if (
        tagFilter &&
        !course.tags?.some((tag) => String(tag.id) === tagFilter)
      )
        return false;
      return true;
    });
  }, [courses, debouncedSearch, statusFilter, categoryFilter, tagFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const paginatedCourses = filteredCourses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  if (activeCourseId) {
    if (isCoursesLoading) {
      return (
        <div className="space-y-5" aria-busy="true" aria-label="Loading course">
          <div className="h-24 rounded-2xl bg-cn-p-page animate-pulse" />
          <div className="h-96 rounded-2xl bg-cn-p-page animate-pulse" />
        </div>
      );
    }

    const activeCourse = courses.find(
      (course) => String(course.id) === activeCourseId,
    );

    if (activeView === "content") {
      return (
        <CourseContentScreen
          courseId={activeCourseId}
          course={activeCourse}
          onBack={handleBackToCourses}
        />
      );
    }

    if (activeView === "feed") {
      return (
        <CourseFeedScreen
          courseId={activeCourseId}
          course={activeCourse}
          onBack={handleBackToCourses}
        />
      );
    }

    return (
      <CourseStudentsScreen
        courseId={activeCourseId}
        course={activeCourse}
        onBack={handleBackToCourses}
      />
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="My courses"
        subtitle="Courses you teach. Open one to build modules, lessons, assignments and quizzes."
      >
        <PortalButton onClick={() => setIsAddCourseModalOpen(true)}>
          <BookPlus className="h-4 w-4" />
          Add course
        </PortalButton>
      </PortalPageHead>

      {/* The design's `.toolbar` normally sits on the top edge of the card it
          filters. Here it is its own bar, because the filters apply to the
          whole result set rather than to the page of it the table shows. */}
      <PortalToolbar className="rounded-cn-p border border-cn-p-line bg-cn-p-card">
        <SearchBar
          tone="cobalt"
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search courses"
          className="w-full sm:w-[280px]"
          size="lg"
        />
        <div className="w-full sm:w-44 shrink-0">
          <SearchableSelect
            tone="cobalt"
            placeholder="All Statuses"
            options={STATUS_FILTER_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
            size="lg"
          />
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <SearchableSelect
            tone="cobalt"
            placeholder="All Categories"
            options={categoryFilterOptions}
            value={categoryFilter}
            onChange={setCategoryFilter}
            size="lg"
          />
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <SearchableSelect
            tone="cobalt"
            placeholder="All Tags"
            options={tagFilterOptions}
            value={tagFilter}
            onChange={setTagFilter}
            size="lg"
          />
        </div>
        <PortalToolbarCount>
          {filteredCourses.length} course{filteredCourses.length === 1 ? "" : "s"}
        </PortalToolbarCount>
      </PortalToolbar>

      <TeacherCourseFormModal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        onSaved={() => refetchCourses()}
      />

      {/* A plain element rather than PortalCard: the card takes only a tone
          and a className, so the ARIA attributes would be dropped. */}
      {isCoursesLoading && (
        <div
          className="h-96 animate-pulse rounded-cn-p border border-cn-p-line bg-cn-p-card"
          aria-busy="true"
          aria-label="Loading assigned courses"
        />
      )}

      {!isCoursesLoading && isCoursesError && (
        <PortalCard className="mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
            <AlertCircle className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-bold text-cn-p-ink">
            We couldn&apos;t load your courses
          </h2>
          <p className="text-sm text-cn-p-ink-2">
            {getApiErrorMessage(coursesError, "Unable to load your assigned courses.")}
          </p>
          <PortalButton size="sm" onClick={() => refetchCourses()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </PortalButton>
        </PortalCard>
      )}

      {!isCoursesLoading && !isCoursesError && (
        <PortalCard className="overflow-hidden">
          {paginatedCourses.length === 0 ? (
            <PortalEmpty
              icon={BookOpen}
              title="No courses found"
              text="Courses you have been assigned to teach appear here."
            />
          ) : (
            <PortalTable>
              <thead>
                <tr>
                  <PortalTh>Course</PortalTh>
                  <PortalTh>Category</PortalTh>
                  <PortalTh>Status</PortalTh>
                  <PortalTh align="right">Modules</PortalTh>
                  <PortalTh align="right">Lessons</PortalTh>
                  <PortalTh align="right">Assignments</PortalTh>
                  <PortalTh align="right">Quizzes</PortalTh>
                  <PortalTh align="right">Students</PortalTh>
                  <PortalTh>
                    <span className="sr-only">Actions</span>
                  </PortalTh>
                </tr>
              </thead>
              <tbody>
                {paginatedCourses.map((course) => (
                  <PortalTr key={course.id} onOpen={() => handleViewCourse(course)}>
                    <PortalTd>
                      <b className="block font-semibold text-cn-p-ink">{course.title}</b>
                      {/* Most seeded titles already open with the code
                          ("CEO-101: ..."), so repeating it underneath is
                          noise — it only shows where the title omits it. */}
                      {course.code && !course.title?.startsWith(course.code) && (
                        <span className="block text-xs text-cn-p-muted">{course.code}</span>
                      )}
                    </PortalTd>
                    <PortalTd className="text-sm text-cn-p-ink-2">
                      {course.category?.name || "Uncategorized"}
                    </PortalTd>
                    <PortalTd>
                      <StatusBadge tone="cobalt" status={course.status} />
                    </PortalTd>
                    <PortalTd align="right" numeric>
                      {course.modules_count ?? 0}
                    </PortalTd>
                    <PortalTd align="right" numeric>
                      {course.lessons_count ?? 0}
                    </PortalTd>
                    <PortalTd align="right" numeric>
                      {course.assignments_count ?? 0}
                    </PortalTd>
                    <PortalTd align="right" numeric>
                      {course.quizzes_count ?? 0}
                    </PortalTd>
                    <PortalTd align="right" numeric>
                      {course.total_students ?? 0}
                    </PortalTd>
                    <PortalTd>
                      {/* These stop propagation because the row itself opens
                          the course builder. */}
                      <span className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleViewStudents(course);
                          }}
                          aria-label={`View students enrolled in ${course.title}`}
                          title="Enrolled students"
                          className="grid h-9 w-9 place-items-center rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card text-cn-p-ink-2 transition hover:border-cn-p-ink hover:text-cn-p-ink"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleViewFeed(course);
                          }}
                          aria-label={`Post to the class feed for ${course.title}`}
                          title="Class feed"
                          className="grid h-9 w-9 place-items-center rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card text-cn-p-ink-2 transition hover:border-cn-p-ink hover:text-cn-p-ink"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </span>
                    </PortalTd>
                  </PortalTr>
                ))}
              </tbody>
            </PortalTable>
          )}
        </PortalCard>
      )}

      <Pagination
        tone="cobalt"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalLabel={`${filteredCourses.length} course${filteredCourses.length === 1 ? "" : "s"}`}
        size="lg"
      />
    </div>
  );
}
