"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, LineChart, RefreshCw } from "lucide-react";
import { getTeacherAssignedCourses } from "@/services/teacherCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import {
  PortalButton,
  PortalPageHead,
  PortalToolbar,
  PortalToolbarCount,
} from "@/components/features/portal/shell/PortalUI";
import TeacherCourseProgressScreen from "../TeacherCourseProgressScreen";

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
    queryKey: ["teacherAssignedCourses", { search: debouncedSearch, forProgress: true }],
    queryFn: async () => {
      const response = await getTeacherAssignedCourses({ search: debouncedSearch || undefined });
      return response?.data?.courses || [];
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
      <TeacherCourseProgressScreen
        courseId={activeCourseId}
        course={activeCourse}
        onBack={handleBack}
      />
    );
  }

  const columns = [
    { key: "title", header: "Course", render: (course) => course.title },
    { key: "category", header: "Category", render: (course) => course.category?.name || "—" },
    { key: "status", header: "Status", render: (course) => <StatusBadge tone="cobalt" status={course.status} size="lg" /> },
    { key: "total_students", header: "Students", render: (course) => course.total_students ?? 0 },
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
        subtitle="How far students have got in each of your courses."
      />

      {!isLoading && isError && (
        <PortalCard className="mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
            <AlertCircle className="h-6 w-6" />
          </span>
          <p className="text-sm text-cn-p-ink-2">
            {getApiErrorMessage(error, "Unable to load your assigned courses.")}
          </p>
          <PortalButton size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </PortalButton>
        </PortalCard>
      )}

      {!isError && (
        <PortalCard className="overflow-hidden">
          <PortalToolbar>
            <SearchBar
              tone="cobalt"
              value={searchInput}
              onChange={(value) => {
                setSearchInput(value);
                setPage(1);
              }}
              placeholder="Search courses"
              className="w-full sm:w-[280px]"
              size="lg"
            />
            <PortalToolbarCount>
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </PortalToolbarCount>
          </PortalToolbar>

          <DataTable
            tone="cobalt"
            columns={columns}
            rows={paginatedCourses}
            keyField="id"
            isLoading={isLoading}
            emptyLabel="No assigned courses found."
            size="lg"
          />
          <div className="px-4 pb-4">
            <Pagination
              tone="cobalt"
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalLabel={`${courses.length} course${courses.length === 1 ? "" : "s"}`}
              size="lg"
            />
          </div>
        </PortalCard>
      )}
    </div>
  );
}
