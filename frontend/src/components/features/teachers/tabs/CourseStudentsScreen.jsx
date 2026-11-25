"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LineChart, TrendingUp, Users } from "lucide-react";
import { getTeacherCourseStudents } from "@/services/teacherCoursesService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import SearchBar from "@/components/ui/SearchBar";
import Loader from "@/components/ui/Loader";
import PortalCard, {
  PortalStat,
} from "@/components/features/portal/shell/PortalCard";
import {
  PortalEmpty,
  PortalPageHead,
  PortalSegmented,
  PortalToolbar,
} from "@/components/features/portal/shell/PortalUI";
import SearchableSelect from "@/components/ui/SearchableSelect";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/adminFormatters";

const PAGE_SIZE = 6;

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "progress_desc", label: "Progress (high-low)" },
  { value: "progress_asc", label: "Progress (low-high)" },
];

function initialsFor(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mapApiStudent(student) {
  return {
    id: student.student_id,
    name: student.name,
    email: student.email || null,
    enrolledAt: student.enrolled_at,
    progress: Math.round(student.progress?.completion_percentage ?? 0),
    lessons: student.progress?.lessons_completed ?? 0,
    assigns: student.assignments?.submitted ?? 0,
    quizAvg: Math.round(student.quiz_performance?.average_percentage ?? 0),
    status: student.status,
  };
}

function formatEnrolledDate(value) {
  return formatDate(value);
}

export default function CourseStudentsScreen({ courseId, course, onBack }) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOption, setSortOption] = useState("name_asc");
  const [page, setPage] = useState(1);

  const { data: apiStudents, isLoading } = useQuery({
    queryKey: ["teacherCourseStudents", courseId],
    queryFn: async () => {
      const response = await getTeacherCourseStudents(courseId);
      const rawStudents = response?.data?.students || [];
      return rawStudents.map(mapApiStudent);
    },
    enabled: Boolean(courseId),
    retry: false,
  });

  const students = apiStudents || [];

  const filteredStudents = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    const filtered = students.filter((student) => {
      if (
        query &&
        !student.name.toLowerCase().includes(query) &&
        !student.email?.toLowerCase().includes(query)
      )
        return false;
      if (statusFilter === "ACTIVE" && student.status !== "ACTIVE") return false;
      if (statusFilter === "INACTIVE" && student.status === "ACTIVE") return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "progress_desc":
          return b.progress - a.progress;
        case "progress_asc":
          return a.progress - b.progress;
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [students, debouncedSearch, statusFilter, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = filteredStudents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const enrolledCount = students.length;
  const activeCount = students.filter((student) => student.status === "ACTIVE").length;
  const avgProgress = enrolledCount
    ? Math.round(students.reduce((sum, student) => sum + student.progress, 0) / enrolledCount)
    : 0;

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (student) => (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full bg-cn-p-soft text-cn-p-soft-ink flex items-center justify-center font-bold text-xs shrink-0"
          >
            {initialsFor(student.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-cn-p-ink truncate">{student.name}</p>
            {student.email && (
              <p className="text-[11px] text-cn-p-ink-2 truncate">{student.email}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "enrolledAt",
      header: "Enrolled",
      render: (student) => formatEnrolledDate(student.enrolledAt),
    },
    {
      key: "progress",
      header: "Progress",
      render: (student) => (
        <div className="min-w-[7rem]">
          <span
            className={`text-sm font-bold ${ student.progress >= 75 ? "text-emerald-700" : "text-cn-p-soft-ink" }`}
          >
            {student.progress}%
          </span>
          <div className="h-1.5 rounded-full bg-cn-p-page overflow-hidden mt-1">
            <div
              className={`h-full rounded-full ${ student.progress >= 75 ? "bg-emerald-600" : "bg-cn-p-accent" }`}
              style={{ width: `${student.progress}%` }}
            />
          </div>
        </div>
      ),
    },
    { key: "lessons", header: "Lessons", render: (student) => student.lessons },
    { key: "assigns", header: "Assigns", render: (student) => student.assigns },
    {
      key: "quizAvg",
      header: "Quiz avg",
      render: (student) => (
        <span
          className={`text-sm font-bold ${ student.quizAvg >= 70 ? "text-emerald-700" : "text-cn-p-soft-ink" }`}
        >
          {student.quizAvg}%
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (student) => <StatusBadge tone="cobalt" status={student.status} size="lg" />,
    },
    {
      key: "actions",
      header: "",
      render: () => (
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-cn-p-line text-cn-p-ink-2 hover:bg-cn-p-page cursor-pointer transition"
          title="View student progress"
          aria-label="View student progress"
        >
          <LineChart className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-cn-p-ink-2 hover:text-cn-p-accent transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to My courses
      </button>

      <PortalPageHead
        title={course?.title || "Course"}
        subtitle="Everyone enrolled in this course, with how far each of them has got."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <PortalStat label="Enrolled" value={enrolledCount} icon={Users} />
        <PortalStat label="Active" value={activeCount} icon={Users} tone="ok" />
        <PortalStat label="Average progress" value={`${avgProgress}%`} icon={TrendingUp} />
      </div>

      <PortalToolbar className="rounded-cn-p border border-cn-p-line bg-cn-p-card">
        <SearchBar
          tone="cobalt"
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search by name or email"
          className="w-full sm:w-[280px]"
          size="lg"
        />

        <PortalSegmented
          ariaLabel="Enrolment status"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
          options={STATUS_FILTERS}
        />

        <div className="w-full sm:w-52 shrink-0">
          <SearchableSelect
            tone="cobalt"
            options={SORT_OPTIONS}
            value={sortOption}
            onChange={setSortOption}
            size="lg"
          />
        </div>
      </PortalToolbar>

      <PortalCard className="overflow-hidden">
        {isLoading ? (
          <div className="p-10">
            <Loader tone="cobalt" fullScreen={false} label="Loading students..." />
          </div>
        ) : paginatedStudents.length === 0 ? (
          <PortalEmpty
            icon={Users}
            title={
              students.length === 0
                ? "No students are enrolled in this course yet"
                : "No students match your filters"
            }
            text={
              students.length === 0
                ? "Enrolled students appear here with their progress."
                : "Clear the search or the status filter to see everyone again."
            }
          />
        ) : (
          <DataTable
            tone="cobalt"
            columns={columns}
            rows={paginatedStudents}
            keyField="id"
            size="lg"
          />
        )}
        {!isLoading && (
          <div className="px-4 pb-4">
            <Pagination
              tone="cobalt"
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalLabel={`Showing ${Math.min((page - 1) * PAGE_SIZE + 1, filteredStudents.length)}-${Math.min(
                page * PAGE_SIZE,
                filteredStudents.length,
              )} of ${filteredStudents.length}`}
              size="lg"
            />
          </div>
        )}
      </PortalCard>
    </div>
  );
}
