"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Paperclip } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getAdminQuestSubmissions } from "@/services/questsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime, formatPlainDate } from "@/lib/adminFormatters";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import QuestSubmissionDetailModal from "@/components/features/admin/QuestSubmissionDetailModal";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ASSIGNED", label: "Still assigned" },
  { value: "SKIPPED", label: "Skipped" },
];

const FILTER_CLASS =
  "px-3.5 py-2.5 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-xs font-mono text-ink transition cursor-pointer";

/**
 * "Who completed which quest" — every student's quest activity, filterable.
 *
 * Read-only on purpose: quests are self-attested and paid out immediately,
 * so there is no approval queue here. This is the audit/inspection surface.
 */
export default function AdminQuestSubmissionsSection({ questFilter, onClearQuestFilter }) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState("");
  const [hasProof, setHasProof] = useState(false);
  const [page, setPage] = useState(1);
  const [detailSubmission, setDetailSubmission] = useState(null);

  // Any filter change invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, hasProof, questFilter]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin-quest-submissions",
      page,
      debouncedSearch,
      status,
      hasProof,
      questFilter?.id ?? null,
    ],
    queryFn: async () => {
      const response = await getAdminQuestSubmissions({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
        quest: questFilter?.id || undefined,
        hasProof: hasProof || undefined,
      });
      return response?.data || { count: 0, results: [] };
    },
  });

  const rows = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const columns = [
    {
      key: "student",
      header: "Student",
      render: (row) => (
        <div className="min-w-0">
          <span className="font-semibold text-ink">{row.student_name || "—"}</span>
          <p className="text-[11px] text-muted font-light truncate">{row.student_email}</p>
        </div>
      ),
    },
    {
      key: "quest",
      header: "Quest",
      render: (row) => (
        <div className="min-w-0">
          <span className="text-ink">{row.quest_title}</span>
          <p className="text-[11px] text-muted font-light">{row.quest_category}</p>
        </div>
      ),
    },
    {
      key: "assigned_date",
      header: "Assigned",
      render: (row) => (
        <span className="text-muted whitespace-nowrap">{formatPlainDate(row.assigned_date)}</span>
      ),
    },
    {
      key: "completed_at",
      header: "Completed",
      render: (row) => (
        <span className="text-muted whitespace-nowrap">
          {row.completed_at ? formatDateTime(row.completed_at) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge size="lg" status={row.status} />,
    },
    {
      key: "points_awarded",
      header: "Points",
      render: (row) => (
        <span
          className={`font-mono font-bold tabular-nums ${
            row.points_awarded > 0 ? "text-emerald-700" : "text-muted"
          }`}
        >
          {row.points_awarded > 0 ? `+${row.points_awarded}` : "—"}
        </span>
      ),
    },
    {
      key: "proof",
      header: "Proof",
      render: (row) =>
        row.proof_file_url || row.proof_url ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-pine">
            <Paperclip className="w-3 h-3" />
            Yes
          </span>
        ) : (
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailSubmission(row)}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-pine hover:text-moss transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {questFilter && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-pine/25 bg-sage/15 px-4 py-3">
          <span className="text-xs text-ink font-light">
            Showing submissions for{" "}
            <span className="font-semibold">{questFilter.title}</span>
          </span>
          <button
            type="button"
            onClick={onClearQuestFilter}
            className="ml-auto text-[11px] font-mono uppercase tracking-wider text-pine hover:text-moss transition cursor-pointer"
          >
            Show all quests
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar
          size="lg"
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by student name, email or quest..."
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className={FILTER_CLASS}
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 text-xs font-sans text-muted cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={hasProof}
            onChange={(event) => setHasProof(event.target.checked)}
            className="w-4 h-4 accent-pine cursor-pointer"
          />
          With proof only
        </label>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load quest submissions.") : null}
          onRetry={refetch}
          emptyLabel="No quest submissions match these filters."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${totalCount} submission${totalCount === 1 ? "" : "s"}`}
        />
      </div>

      <QuestSubmissionDetailModal
        isOpen={Boolean(detailSubmission)}
        submission={detailSubmission}
        onClose={() => setDetailSubmission(null)}
      />
    </div>
  );
}
