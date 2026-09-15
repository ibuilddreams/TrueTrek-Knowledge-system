"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookMarked, RefreshCw, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { getStudentEnrollments } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import StudentCourseCard from "../StudentCourseCard";
import CourseDetailScreen from "../course-detail/CourseDetailScreen";
import LessonViewPending from "../lesson-view/LessonViewPending";

const PAGE_SIZE = 6;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function CoursesTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCourseId = searchParams.get("course");
  // Deep-linking straight into a lesson/quiz/assignment — while enrollments are still
  // loading, show the same full-screen takeover the lesson view itself uses instead of
  // this tab's own inline loader, so the portal header/sidebar never flash on refresh.
  const isDeepLinkingIntoContent = Boolean(selectedCourseId && searchParams.get("content"));

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  function openCourse(courseId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("course", String(courseId));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function closeCourse() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("course");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  const {
    data: enrollments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["studentEnrollments"],
    queryFn: async () => {
      const response = await getStudentEnrollments({ page: 1, pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const filteredEnrollments = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      const course = enrollment.course || {};
      const haystack = `${course.title || ""} ${course.code || ""} ${
        course.category?.name || ""
      }`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus = !statusFilter || enrollment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrollments, debouncedSearch, statusFilter]);

  const averageProgress = useMemo(() => {
    if (enrollments.length === 0) return 0;
    const total = enrollments.reduce(
      (sum, item) => sum + (Number(item.completion_percentage) || 0),
      0,
    );
    return Math.round(total / enrollments.length);
  }, [enrollments]);

  const activeCount = enrollments.filter(
    (item) => item.status === "ACTIVE",
  ).length;
  const completedCount = enrollments.filter(
    (item) => item.status === "COMPLETED" || item.is_completed,
  ).length;

  const totalPages = Math.max(
    1,
    Math.ceil(filteredEnrollments.length / PAGE_SIZE),
  );
  const paginatedEnrollments = filteredEnrollments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  if (isLoading) {
    if (isDeepLinkingIntoContent) {
      return <LessonViewPending />;
    }
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        aria-busy="true"
      >
        <Loader fullScreen={false} label="Loading your courses..." />
      </div>
    );
  }

  if (isError) {
    if (isDeepLinkingIntoContent) {
      return (
        <LessonViewPending
          isError
          errorMessage={getApiErrorMessage(error, "Unable to load your enrolled courses.")}
          onRetry={() => refetch()}
        />
      );
    }
    return (
      <div className="border rounded-2xl p-8 text-center max-w-lg mx-auto border-line bg-paper">
        <div className="w-12 h-12 border rounded-2xl flex items-center justify-center mx-auto mb-4 bg-rose-50 border-rose-100 text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold mb-2 text-ink">
          Failed to Load Courses
        </h2>
        <p className="text-sm font-light mb-6 text-muted">
          {getApiErrorMessage(error, "Unable to load your enrolled courses.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 font-bold font-mono text-sm uppercase tracking-wider rounded-xl transition bg-pine hover:bg-moss text-paper"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (selectedCourseId) {
    const selectedEnrollment = enrollments.find(
      (item) => String(item.course?.id) === String(selectedCourseId),
    );

    if (!selectedEnrollment) {
      return (
        <div className="rounded-2xl border border-dashed p-10 text-center space-y-4 border-line bg-paper/70">
          <div className="w-12 h-12 border rounded-2xl flex items-center justify-center mx-auto bg-porcelain border-line text-muted">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted">
            We couldn&apos;t find that course in your enrollments.
          </p>
          <button
            type="button"
            onClick={closeCourse}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-mono uppercase tracking-wider rounded-xl transition bg-pine hover:bg-moss text-paper"
          >
            Back to My Courses
          </button>
        </div>
      );
    }

    return (
      <CourseDetailScreen
        enrollment={selectedEnrollment}
        onBack={closeCourse}
      />
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-paper/70">
        <EmptyState
          icon={BookMarked}
          label="No courses yet"
          description="Once you are enrolled in a course, it will appear here with your live progress."
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[1.75rem] border shadow-[0_18px_50px_-36px_rgba(28,25,23,0.45)] border-line/90 bg-paper"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(168,162,158,0.16),transparent_45%)]" />
        <div className="pointer-events-none absolute -right-10 top-0 h-full w-1/3 bg-linear-to-l to-transparent from-gold/12" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            <div className="max-w-xl min-w-0">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] mb-3 text-pine/80">
                Learning Library
              </p>
              <h2 className="text-3xl sm:text-[2.15rem] font-serif font-bold tracking-tight leading-[1.1] text-ink">
                Your enrolled courses
              </h2>
              <p className="text-sm font-light mt-3 leading-relaxed max-w-md text-muted">
                Track progress across every course assigned to you — calm,
                clear, and ready when you are.
              </p>
            </div>

            <div className="w-full xl:w-auto xl:min-w-[320px]">
              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] mb-1 text-muted">
                    Avg progress
                  </p>
                  <p className="text-3xl font-serif font-bold leading-none text-pine">
                    {averageProgress}
                    <span className="text-base ml-0.5 text-pine/60">
                      %
                    </span>
                  </p>
                </div>
                <p className="text-xs font-light pb-1 text-muted">
                  Across {enrollments.length} course
                  {enrollments.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden bg-porcelain">
                <motion.div
                  className="h-full rounded-full bg-pine"
                  initial={{ width: 0 }}
                  animate={{ width: `${averageProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-0 sm:divide-x border-line/70 sm:divide-line/80">
            <div className="sm:pr-6">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">
                Courses
              </p>
              <p className="text-2xl font-serif font-bold mt-1.5 leading-none text-ink">
                {enrollments.length}
              </p>
              <p className="text-xs mt-1.5 font-light text-muted">
                Total enrollments
              </p>
            </div>
            <div className="sm:px-6">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">
                Active
              </p>
              <p className="text-2xl font-serif font-bold mt-1.5 leading-none text-ink">
                {activeCount}
              </p>
              <p className="text-xs mt-1.5 font-light text-muted">
                Currently in progress
              </p>
            </div>
            <div className="sm:pl-6">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">
                Completed
              </p>
              <p className="text-2xl font-serif font-bold mt-1.5 leading-none text-ink">
                {completedCount}
              </p>
              <p className="text-xs mt-1.5 font-light text-muted">
                Finished learning paths
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="rounded-2xl border shadow-[0_8px_30px_-24px_rgba(28,25,23,0.35)] overflow-hidden border-line/80 bg-paper/90">
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title, code, or category..."
              className="w-full pl-10 pr-10 py-3 border focus:ring-4 focus:ring-pine/10 focus:outline-none rounded-xl text-sm transition bg-porcelain/90 border-line/90 focus:border-pine/70 focus:bg-paper text-ink placeholder:text-muted"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition text-muted hover:text-ink hover:bg-porcelain"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 pt-1 border-t border-line">
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              {STATUS_FILTER_OPTIONS.map((option) => {
                const isActive = statusFilter === option.value;
                return (
                  <button
                    key={option.value || "all"}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition border ${
                      isActive
                        ? "bg-pine text-paper border-pine shadow-sm"
                        : "bg-paper text-muted border-line hover:border-pine/40 hover:text-pine"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-sm sm:text-right shrink-0 text-muted">
              <span className="font-serif font-bold text-ink">
                {filteredEnrollments.length}
              </span>
              {filteredEnrollments.length === 1 ? " course" : " courses"}
              {filteredEnrollments.length !== enrollments.length ? (
                <span className="text-muted">
                  {" "}
                  · {enrollments.length} total
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {filteredEnrollments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-paper/60">
          <EmptyState
            icon={BookMarked}
            label="No matching courses"
            description="Try adjusting your search or status filter."
            compact
            size="lg"
          />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {paginatedEnrollments.map((enrollment, index) => (
              <motion.div
                key={enrollment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
              >
                <StudentCourseCard
                  enrollment={enrollment}
                  onClick={() => openCourse(enrollment.course?.id)}
                />
              </motion.div>
            ))}
          </motion.div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            size="lg"
          />
        </>
      )}
    </div>
  );
}
