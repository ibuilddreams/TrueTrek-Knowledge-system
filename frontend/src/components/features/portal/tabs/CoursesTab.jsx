"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookMarked, RefreshCw, Search, X } from "lucide-react";
import { motion } from "motion/react";
import { getStudentEnrollments } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import StudentCourseCard from "../StudentCourseCard";
import StudentCourseDetailDrawer from "../StudentCourseDetailDrawer";

const PAGE_SIZE = 6;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function CoursesTab() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

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

  const totalPages = Math.max(1, Math.ceil(filteredEnrollments.length / PAGE_SIZE));
  const paginatedEnrollments = filteredEnrollments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  if (isLoading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Loading courses">
        <div className="h-24 rounded-2xl bg-stone-100/80 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 rounded-2xl bg-stone-100/80 animate-pulse" />
          ))}
        </div>
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
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="max-w-xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-700/80 mb-2">
            Learning Library
          </p>
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Your enrolled courses
          </h2>
          <p className="text-sm text-stone-500 font-light mt-1.5 leading-relaxed">
            Track progress across every course assigned to you — calm, clear, and ready when you are.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-stone-200/80 bg-white px-3.5 py-2.5 min-w-[96px]">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
              Courses
            </p>
            <p className="text-lg font-serif font-bold text-stone-900 leading-none mt-1">
              {enrollments.length}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white px-3.5 py-2.5 min-w-[96px]">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
              Active
            </p>
            <p className="text-lg font-serif font-bold text-stone-900 leading-none mt-1">
              {activeCount}
            </p>
          </div>
          <div className="rounded-xl border border-stone-200/80 bg-white px-3.5 py-2.5 min-w-[96px]">
            <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
              Avg Progress
            </p>
            <p className="text-lg font-serif font-bold text-amber-800 leading-none mt-1">
              {averageProgress}%
            </p>
          </div>
        </div>
      </div>

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
                  onClick={() => setSelectedEnrollment(enrollment)}
                />
              </motion.div>
            ))}
          </motion.div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <StudentCourseDetailDrawer
        enrollment={selectedEnrollment}
        onClose={() => setSelectedEnrollment(null)}
      />
    </div>
  );
}
