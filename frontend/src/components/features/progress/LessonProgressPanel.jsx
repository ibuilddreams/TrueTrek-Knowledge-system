"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, PlayCircle, TrendingUp, Users, XCircle } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import StatCard from "@/components/ui/StatCard";
import Modal from "@/components/ui/Modal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getModules } from "@/services/modulesService";
import { getCourseLessonProgress, getStudentLessonProgress } from "@/services/progressService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { PAGE_SIZE, BULK_FETCH_SIZE } from "./progressConstants";
import { paginate } from "./progressUtils";
import { makeSkin } from "@/lib/portalSkin";

// Rendered by both the admin and the teacher portal, so the palette comes
// from the caller: "porcelain" (the default, unchanged) or the signed-in
// portal's cobalt.
export default function LessonProgressPanel({ courseId, tone = "porcelain" }) {
  const skin = makeSkin(tone);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [moduleFilter, setModuleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewingStudent, setViewingStudent] = useState(null);

  const { data: modules = [] } = useQuery({
    queryKey: ["modules", courseId],
    queryFn: async () => {
      const response = await getModules({ courseId });
      return response?.data?.results || [];
    },
    enabled: Boolean(courseId),
  });

  const progressQuery = useQuery({
    queryKey: ["course-lesson-progress", courseId],
    queryFn: async () => {
      const response = await getCourseLessonProgress(courseId, { pageSize: BULK_FETCH_SIZE });
      return response?.data;
    },
    enabled: Boolean(courseId),
  });

  const detailQuery = useQuery({
    queryKey: ["student-lesson-progress", courseId, viewingStudent?.student_id],
    queryFn: async () => {
      const response = await getStudentLessonProgress(courseId, viewingStudent.student_id);
      return response?.data;
    },
    enabled: Boolean(courseId) && Boolean(viewingStudent),
  });

  const stats = progressQuery.data?.stats;
  const allRows = progressQuery.data?.results || [];

  const filteredRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return allRows.filter((row) => {
      if (query && !row.name?.toLowerCase().includes(query) && !row.email?.toLowerCase().includes(query))
        return false;
      return true;
    });
  }, [allRows, debouncedSearch]);

  const { totalPages, safePage, pageItems } = paginate(filteredRows, page, PAGE_SIZE);

  const moduleFilterOptions = useMemo(
    () => [
      { value: "", label: "All modules" },
      ...modules.map((module) => ({ value: String(module.id), label: module.title })),
    ],
    [modules],
  );

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (row) => (
        <div className="min-w-0">
          <p className={skin("text-sm font-semibold text-stone-800 truncate")}>{row.name}</p>
          <p className={skin("text-[11px] font-mono text-stone-400 truncate")}>{row.email}</p>
        </div>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (row) => (
        <div className="min-w-[7rem]">
          <span
            className={skin(`text-sm font-mono font-bold ${
              row.completion_percentage >= 75 ? "text-emerald-700" : "text-amber-700"
            }`)}
          >
            {row.completion_percentage}%
          </span>
          <div className={skin("h-1.5 rounded-full bg-stone-200 overflow-hidden mt-1")}>
            <div
              className={skin(`h-full rounded-full ${
                row.completion_percentage >= 75 ? "bg-emerald-600" : "bg-amber-600"
              }`)}
              style={{ width: `${row.completion_percentage}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "lessons_completed",
      header: "Completed",
      render: (row) => `${row.lessons_completed}/${row.total_lessons}`,
    },
    { key: "pending_lessons", header: "Pending", render: (row) => row.pending_lessons },
    {
      key: "last_completed_at",
      header: "Last activity",
      render: (row) => formatDate(row.last_completed_at),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => setViewingStudent(row)}
          className={skin(`text-xs font-semibold transition cursor-pointer ${tone === "cobalt" ? "text-cn-p-accent hover:underline" : "font-mono text-amber-700 hover:text-amber-900"}`)}
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard tone={tone} label="Total students" value={stats?.total_students ?? "—"} icon={Users} size="lg" />
        <StatCard tone={tone}
          label="Completed lessons"
          value={stats?.completed_lessons ?? "—"}
          icon={CheckCircle2}
          accent="emerald"
          size="lg"
        />
        <StatCard tone={tone}
          label="Pending lessons"
          value={stats?.pending_lessons ?? "—"}
          icon={Clock}
          accent="rose"
          size="lg"
        />
        <StatCard tone={tone}
          label="Avg completion"
          value={`${stats?.average_completion ?? 0}%`}
          icon={TrendingUp}
          accent="stone"
          size="lg"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar tone={tone}
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search students by name or email..."
          size="lg"
        />
        <div className="w-full sm:w-56 shrink-0">
          <SearchableSelect tone={tone}
            options={moduleFilterOptions}
            value={moduleFilter}
            onChange={(value) => {
              setModuleFilter(value);
              setPage(1);
            }}
            placeholder="All Modules"
            size="lg"
          />
        </div>
      </div>

      <div className={skin("bg-white border border-stone-200 rounded-2xl shadow-sm p-6")}>
        <DataTable tone={tone}
          columns={columns}
          rows={pageItems}
          keyField="student_id"
          isLoading={progressQuery.isLoading}
          error={
            progressQuery.isError
              ? getApiErrorMessage(progressQuery.error, "Unable to load lesson progress.")
              : null
          }
          onRetry={() => progressQuery.refetch()}
          emptyLabel="No students enrolled in this course yet."
          size="lg"
        />
        <Pagination tone={tone}
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredRows.length} student${filteredRows.length === 1 ? "" : "s"}`}
          size="lg"
        />
      </div>

      <Modal variant={tone === "cobalt" ? "cobalt" : "classic"}
        isOpen={Boolean(viewingStudent)}
        onClose={() => setViewingStudent(null)}
        icon={PlayCircle}
        title="Lesson breakdown"
        subtitle={viewingStudent ? `${viewingStudent.name} · ${viewingStudent.completion_percentage}% complete` : ""}
        maxWidth="max-w-xl"
      >
        {detailQuery.isLoading && <p className={skin("text-sm text-stone-400")}>Loading...</p>}
        <div className="space-y-4">
          {detailQuery.data?.modules?.map((module) => (
            <div key={module.id} className="space-y-2">
              <p className={skin("text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold")}>
                {module.title}
              </p>
              <ul className="space-y-1.5">
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className={skin("flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-stone-100 bg-stone-50/60")}
                  >
                    <span className={skin("text-sm text-stone-700 truncate")}>{lesson.title}</span>
                    {lesson.is_completed ? (
                      <span className={skin("inline-flex items-center gap-1 text-[11px] font-mono uppercase text-emerald-700 shrink-0")}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {formatDate(lesson.completed_at)}
                      </span>
                    ) : (
                      <span className={skin("inline-flex items-center gap-1 text-[11px] font-mono uppercase text-stone-400 shrink-0")}>
                        <XCircle className="w-3.5 h-3.5" />
                        Pending
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
