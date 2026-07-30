"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookMarked, BookPlus, RefreshCw } from "lucide-react";
import { getTeacherAssignedCourses } from "@/services/teacherCoursesService";
import { getCategories } from "@/services/categoriesService";
import { getTags } from "@/services/tagsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import TeacherCourseCard from "@/components/features/teachers/TeacherCourseCard";
import CourseStudentsScreen from "./CourseStudentsScreen";
import CourseContentScreen from "./CourseContentScreen";

const PAGE_SIZE = 10;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function MyCoursesTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCourseId = searchParams.get("courseId");
  const activeView = searchParams.get("view") === "content" ? "content" : "students";

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [page, setPage] = useState(1);

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

  const handleBackToCourses = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("courseId");
    params.delete("view");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const categoryFilterOptions = useMemo(
    () => [
      { value: "", label: "All Categories" },
      ...categories.map((category) => ({
        value: String(category.id),
        label: category.name,
      })),
    ],
    [categories],
  );

  const tagFilterOptions = useMemo(
    () => [
      { value: "", label: "All Tags" },
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
          <div className="h-24 rounded-2xl bg-stone-100 animate-pulse" />
          <div className="h-96 rounded-2xl bg-stone-100 animate-pulse" />
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

    return (
      <CourseStudentsScreen
        courseId={activeCourseId}
        course={activeCourse}
        onBack={handleBackToCourses}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 flex-1 min-w-0">
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search courses by title..."
          />
          <div className="w-full sm:w-48 shrink-0">
            <SearchableSelect
              placeholder="All Statuses"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <SearchableSelect
              placeholder="All Categories"
              options={categoryFilterOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
            />
          </div>
          <div className="w-full sm:w-48 shrink-0">
            <SearchableSelect
              placeholder="All Tags"
              options={tagFilterOptions}
              value={tagFilter}
              onChange={setTagFilter}
            />
          </div>
        </div>

        <button
          type="button"
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          title="Add a new course"
          aria-label="Add a new course"
        >
          <BookPlus className="w-4 h-4" />
          ADD COURSE
        </button>
      </div>

      {isCoursesLoading && (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
          aria-busy="true"
          aria-label="Loading assigned courses"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-64 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isCoursesLoading && isCoursesError && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
            Failed to Load Your Courses
          </h2>
          <p className="text-xs text-stone-500 font-light mb-6">
            {getApiErrorMessage(coursesError, "Unable to load your assigned courses.")}
          </p>
          <button
            type="button"
            onClick={() => refetchCourses()}
            className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {!isCoursesLoading && !isCoursesError && paginatedCourses.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm">
          <EmptyState
            icon={BookMarked}
            label="No assigned courses found."
            description="Courses you've been assigned to teach will appear here."
          />
        </div>
      )}

      {!isCoursesLoading && !isCoursesError && paginatedCourses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {paginatedCourses.map((course) => (
            <TeacherCourseCard
              key={course.id}
              course={course}
              onViewCourse={() => handleViewCourse(course)}
              onViewStudents={() => handleViewStudents(course)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalLabel={`${filteredCourses.length} course${filteredCourses.length === 1 ? "" : "s"}`}
      />
    </div>
  );
}
