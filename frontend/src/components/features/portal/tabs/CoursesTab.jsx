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
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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
      0
    );
    return Math.round(total / enrollments.length);
  }, [enrollments]);

  const activeCount = enrollments.filter((item) => item.status === "ACTIVE").length;
  const completedCount = enrollments.filter(
    (item) => item.status === "COMPLETED" || item.is_completed
  ).length;

  const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / PAGE_SIZE));
  const paginatedEnrollments = filteredEnrollments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading your courses..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
          Failed to Load Courses
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">
          {getApiErrorMessage(error, "Unable to load your enrolled courses.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (selectedCourseId) {
    const selectedEnrollment = enrollments.find(
      (item) => String(item.course?.id) === String(selectedCourseId)
    );

    if (!selectedEnrollment) {
      return (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70 p-10 text-center space-y-4">
          <div className="w-12 h-12 bg-stone-50 border border-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-stone-500">
            We couldn&apos;t find that course in your enrollments.
          </p>
          <button
            type="button"
            onClick={closeCourse}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono uppercase tracking-wider rounded-xl transition"
          >
            Back to My Courses
          </button>
        </div>
      );
    }

    return <CourseDetailScreen enrollment={selectedEnrollment} onBack={closeCourse} />;
  }

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
        <EmptyState
          icon={BookMarked}
          label="No courses yet"
          description="Once you are enrolled in a course, it will appear here with your live progress."
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
        className="relative overflow-hidden rounded-[1.75rem] border border-stone-200/90 bg-white shadow-[0_18px_50px_-36px_rgba(28,25,23,0.45)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(168,162,158,0.16),_transparent_45%)]" />
        <div className="pointer-events-none absolute -right-10 top-0 h-full w-1/3 bg-gradient-to-l from-amber-50/80 to-transparent" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            <div className="max-w-xl min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700/80 mb-3">
                Learning Library
              </p>
              <h2 className="text-3xl sm:text-[2.15rem] font-serif font-bold text-stone-900 tracking-tight leading-[1.1]">
                Your enrolled courses
              </h2>
              <p className="text-sm text-stone-500 font-light mt-3 leading-relaxed max-w-md">
                Track progress across every course assigned to you — calm, clear, and ready when you are.
              </p>
            </div>

            <div className="w-full xl:w-auto xl:min-w-[320px]">
              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400 mb-1">
                    Avg progress
                  </p>
                  <p className="text-3xl font-serif font-bold text-amber-800 leading-none">
                    {averageProgress}
                    <span className="text-base text-amber-700/60 ml-0.5">%</span>
                  </p>
                </div>
                <p className="text-[11px] text-stone-400 font-light pb-1">
                  Across {enrollments.length} course
                  {enrollments.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${averageProgress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-stone-200/70 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-0 sm:divide-x sm:divide-stone-200/80">
            <div className="sm:pr-6">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400">
                Courses
              </p>
              <p className="text-2xl font-serif font-bold text-stone-900 mt-1.5 leading-none">
                {enrollments.length}
              </p>
              <p className="text-[11px] text-stone-400 mt-1.5 font-light">
                Total enrollments
              </p>
            </div>
            <div className="sm:px-6">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400">
                Active
              </p>
              <p className="text-2xl font-serif font-bold text-stone-900 mt-1.5 leading-none">
                {activeCount}
              </p>
              <p className="text-[11px] text-stone-400 mt-1.5 font-light">
                Currently in progress
              </p>
            </div>
            <div className="sm:pl-6">
              <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400">
                Completed
              </p>
              <p className="text-2xl font-serif font-bold text-stone-900 mt-1.5 leading-none">
                {completedCount}
              </p>
              <p className="text-[11px] text-stone-400 mt-1.5 font-light">
                Finished learning paths
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="rounded-2xl border border-stone-200/80 bg-white/90 shadow-[0_8px_30px_-24px_rgba(28,25,23,0.35)] overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by title, code, or category..."
              className="w-full pl-10 pr-10 py-3 bg-stone-50/90 border border-stone-200/90 focus:border-amber-500/70 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:outline-none rounded-xl text-sm text-stone-800 placeholder:text-stone-400 transition"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 pt-1 border-t border-stone-100">
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              {STATUS_FILTER_OPTIONS.map((option) => {
                const isActive = statusFilter === option.value;
                return (
                  <button
                    key={option.value || "all"}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider transition border ${
                      isActive
                        ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                        : "bg-white text-stone-500 border-stone-200 hover:border-amber-300 hover:text-amber-800"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-stone-500 sm:text-right shrink-0">
              <span className="font-serif font-bold text-stone-900">
                {filteredEnrollments.length}
              </span>
              {filteredEnrollments.length === 1 ? " course" : " courses"}
              {filteredEnrollments.length !== enrollments.length ? (
                <span className="text-stone-400">
                  {" "}
                  · {enrollments.length} total
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      {filteredEnrollments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white/60">
          <EmptyState
            icon={BookMarked}
            label="No matching courses"
            description="Try adjusting your search or status filter."
            compact
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
