"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Clock, Trophy } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import SearchBar from "@/components/ui/SearchBar";
import SearchableSelect from "@/components/ui/SearchableSelect";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getAssignmentCourseProgress, getAssignments } from "@/services/assignmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import { ASSIGNMENT_STATUS_OPTIONS, PAGE_SIZE, BULK_FETCH_SIZE } from "./progressConstants";
import { paginate } from "./progressUtils";
import GradeSubmissionModal from "./GradeSubmissionModal";
import { makeSkin } from "@/lib/portalSkin";

// Rendered by both the admin and the teacher portal, so the palette comes
// from the caller: "porcelain" (the default, unchanged) or the signed-in
// portal's cobalt.
// Defaults to cobalt: every call site (Admin and Teacher → Course progress)
// already passes it, and the porcelain path below is the old admin skin that
// nothing renders any more. Left reachable via `tone="porcelain"` rather than
// deleted, but a caller that forgets the prop should get the live design, not
// a cream dialog over a white screen.
export default function AssignmentProgressPanel({ courseId, tone = "cobalt" }) {
  const skin = makeSkin(tone);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [assignmentFilter, setAssignmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [gradingRow, setGradingRow] = useState(null);

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", { courseId }],
    queryFn: async () => {
      const response = await getAssignments({ courseId });
      return response?.data?.results || [];
    },
    enabled: Boolean(courseId),
  });

  const progressQuery = useQuery({
    queryKey: ["assignment-course-progress", courseId],
    queryFn: async () => {
      const response = await getAssignmentCourseProgress(courseId, { pageSize: BULK_FETCH_SIZE });
      return response?.data;
    },
    enabled: Boolean(courseId),
  });

  const stats = progressQuery.data?.stats;
  const allRows = useMemo(
    () =>
      (progressQuery.data?.results || []).map((row) => ({
        ...row,
        rowId: `${row.assignment.id}-${row.student.id}`,
      })),
    [progressQuery.data],
  );

  const filteredRows = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return allRows.filter((row) => {
      if (assignmentFilter && String(row.assignment.id) !== assignmentFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (
        query &&
        !row.student.name?.toLowerCase().includes(query) &&
        !row.student.email?.toLowerCase().includes(query)
      )
        return false;
      return true;
    });
  }, [allRows, debouncedSearch, assignmentFilter, statusFilter]);

  const { totalPages, safePage, pageItems } = paginate(filteredRows, page, PAGE_SIZE);

  const assignmentFilterOptions = useMemo(
    () => [
      { value: "", label: "All assignments" },
      ...assignments.map((assignment) => ({ value: String(assignment.id), label: assignment.title })),
    ],
    [assignments],
  );

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (row) => (
        <div className="min-w-0">
          <p className={skin("text-sm font-semibold text-stone-800 truncate")}>{row.student.name}</p>
          <p className={skin("text-[11px] font-mono text-stone-400 truncate")}>{row.student.email}</p>
        </div>
      ),
    },
    {
      key: "assignment",
      header: "Assignment",
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          {row.assignment.title}
          {row.assignment.grading_mode === "AI" && (
            <span className={skin("text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200")}>
              AI
            </span>
          )}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (row) => <StatusBadge tone={tone} status={row.status} size="lg" /> },
    { key: "submitted_at", header: "Submitted", render: (row) => formatDateTime(row.submitted_at) || "—" },
    {
      key: "marks",
      header: "Marks",
      render: (row) => (row.marks !== null ? `${row.marks}/${row.assignment.total_marks}` : "—"),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.submission_id ? (
          <button
            type="button"
            onClick={() => setGradingRow(row)}
            className={skin(`text-xs font-semibold transition cursor-pointer ${tone === "cobalt" ? "text-cn-p-accent hover:underline" : "font-mono text-amber-700 hover:text-amber-900"}`)}
          >
            {row.status === "GRADED" ? "Edit Grade" : "Grade"}
          </button>
        ) : (
          <span className={skin("text-xs font-mono text-stone-300")}>—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard tone={tone}
          label="Total assignments"
          value={stats?.total_assignments ?? "—"}
          icon={ClipboardCheck}
          size="lg"
        />
        <StatCard tone={tone}
          label="Total submissions"
          value={stats?.total_submissions ?? "—"}
          icon={CheckCircle2}
          accent="emerald"
          size="lg"
        />
        <StatCard tone={tone}
          label="Pending reviews"
          value={stats?.pending_reviews ?? "—"}
          icon={Clock}
          accent="rose"
          size="lg"
        />
        <StatCard tone={tone} label="Graded" value={stats?.graded ?? "—"} icon={Trophy} accent="stone" size="lg" />
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
            options={assignmentFilterOptions}
            value={assignmentFilter}
            onChange={(value) => {
              setAssignmentFilter(value);
              setPage(1);
            }}
            placeholder="All Assignments"
            size="lg"
          />
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <SearchableSelect tone={tone}
            options={ASSIGNMENT_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            placeholder="All Statuses"
            size="lg"
          />
        </div>
      </div>

      <div className={skin("bg-white border border-stone-200 rounded-2xl shadow-sm p-6")}>
        <DataTable tone={tone}
          columns={columns}
          rows={pageItems}
          keyField="rowId"
          isLoading={progressQuery.isLoading}
          error={
            progressQuery.isError
              ? getApiErrorMessage(progressQuery.error, "Unable to load assignment progress.")
              : null
          }
          onRetry={() => progressQuery.refetch()}
          emptyLabel="No assignments or submissions found."
          size="lg"
        />
        <Pagination tone={tone}
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredRows.length} record${filteredRows.length === 1 ? "" : "s"}`}
          size="lg"
        />
      </div>

      <GradeSubmissionModal
        row={gradingRow}
        onClose={() => setGradingRow(null)}
        courseId={courseId}
        tone={tone}
      />
    </div>
  );
}
