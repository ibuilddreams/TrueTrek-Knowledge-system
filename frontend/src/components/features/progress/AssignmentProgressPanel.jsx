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

export default function AssignmentProgressPanel({ courseId }) {
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
      { value: "", label: "All Assignments" },
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
          <p className="text-xs font-semibold text-stone-800 truncate">{row.student.name}</p>
          <p className="text-[10px] font-mono text-stone-400 truncate">{row.student.email}</p>
        </div>
      ),
    },
    { key: "assignment", header: "Assignment", render: (row) => row.assignment.title },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
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
            className="text-[11px] font-mono font-semibold text-amber-700 hover:text-amber-900 transition cursor-pointer"
          >
            {row.status === "GRADED" ? "Edit Grade" : "Grade"}
          </button>
        ) : (
          <span className="text-[11px] font-mono text-stone-300">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assignments" value={stats?.total_assignments ?? "—"} icon={ClipboardCheck} />
        <StatCard
          label="Total Submissions"
          value={stats?.total_submissions ?? "—"}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard label="Pending Reviews" value={stats?.pending_reviews ?? "—"} icon={Clock} accent="rose" />
        <StatCard label="Graded" value={stats?.graded ?? "—"} icon={Trophy} accent="stone" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
            setPage(1);
          }}
          placeholder="Search students by name or email..."
        />
        <div className="w-full sm:w-56 shrink-0">
          <SearchableSelect
            options={assignmentFilterOptions}
            value={assignmentFilter}
            onChange={(value) => {
              setAssignmentFilter(value);
              setPage(1);
            }}
            placeholder="All Assignments"
          />
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <SearchableSelect
            options={ASSIGNMENT_STATUS_OPTIONS}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            placeholder="All Statuses"
          />
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
        <DataTable
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
        />
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${filteredRows.length} record${filteredRows.length === 1 ? "" : "s"}`}
        />
      </div>

      <GradeSubmissionModal row={gradingRow} onClose={() => setGradingRow(null)} courseId={courseId} />
    </div>
  );
}
