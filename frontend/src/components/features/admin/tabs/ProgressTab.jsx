"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, LineChart, RefreshCw } from "lucide-react";
import { getCourses } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import AdminCourseProgressScreen from "../AdminCourseProgressScreen";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

const PAGE_SIZE = 10;

export default function ProgressTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCourseId = searchParams.get("progressCourseId");

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [page, setPage] = useState(1);

  const {
    data: courses = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminCourses", { search: debouncedSearch, forProgress: true }],
    queryFn: async () => {
      const response = await getCourses({ search: debouncedSearch || undefined });
      return response?.data?.results || [];
    },
  });

  const handleSelectCourse = useCallback(
    (course) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("progressCourseId", String(course.id));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const handleBack = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("progressCourseId");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const totalPages = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const paginatedCourses = courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCourse = useMemo(
    () => courses.find((course) => String(course.id) === activeCourseId),
    [courses, activeCourseId],
  );

  if (activeCourseId) {
    return (
      <AdminCourseProgressScreen courseId={activeCourseId} course={activeCourse} onBack={handleBack} />
    );
  }

  const columns = [
    { key: "title", header: "Course", render: (course) => course.title },
    { key: "category", header: "Category", render: (course) => course.category?.name || "—" },
    { key: "status", header: "Status", render: (course) => <StatusBadge tone="cobalt" size="lg" status={course.status} /> },
    {
      key: "actions",
      header: "",
      render: (course) => (
        <button
          type="button"
          onClick={() => handleSelectCourse(course)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cn-p-accent hover:text-cn-p-accent-hover transition cursor-pointer"
        >
          <LineChart className="w-3.5 h-3.5" />
          View progress
        </button>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Progress"
        subtitle="Completion across every course on the platform."
      />

      <SearchBar tone="cobalt" size="lg"
        value={searchInput}
        onChange={(value) => {
          setSearchInput(value);
          setPage(1);
        }}
        placeholder="Search courses by title..."
      />

      {!isLoading && isError && (
        <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-cn-p-bad-bg border border-cn-p-bad-bg text-cn-p-bad rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-cn-p-ink-2 font-light mb-6">
            {getApiErrorMessage(error, "Unable to load courses.")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white font-bold text-sm rounded-cn-p-sm transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {!isError && (
        <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
          <DataTable tone="cobalt" size="lg"
            columns={columns}
            rows={paginatedCourses}
            keyField="id"
            isLoading={isLoading}
            emptyLabel="No courses found."
          />
          <div className="px-4 pb-4">

            <Pagination tone="cobalt" size="lg"
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalLabel={`${courses.length} course${courses.length === 1 ? "" : "s"}`}
            />

          </div>
        </div>
      )}
    </div>
  );
}
