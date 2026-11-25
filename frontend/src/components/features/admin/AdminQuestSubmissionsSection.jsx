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
  "px-3.5 py-2.5 bg-cn-p-page border border-cn-p-line focus:border-cn-p-accent focus:bg-cn-p-card focus:outline-none rounded-xl text-xs  text-cn-p-ink transition cursor-pointer";

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
          <span className="font-semibold text-cn-p-ink">{row.student_name || "—"}</span>
          <p className="text-[11px] text-cn-p-ink-2 font-light truncate">{row.student_email}</p>
        </div>
      ),
    },
    {
      key: "quest",
      header: "Quest",
      render: (row) => (
        <div className="min-w-0">
          <span className="text-cn-p-ink">{row.quest_title}</span>
          <p className="text-[11px] text-cn-p-ink-2 font-light">{row.quest_category}</p>
        </div>
      ),
    },
    {
      key: "assigned_date",
      header: "Assigned",
      render: (row) => (
        <span className="text-cn-p-ink-2 whitespace-nowrap">{formatPlainDate(row.assigned_date)}</span>
      ),
    },
    {
      key: "completed_at",
      header: "Completed",
      render: (row) => (
        <span className="text-cn-p-ink-2 whitespace-nowrap">
          {row.completed_at ? formatDateTime(row.completed_at) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge tone="cobalt" size="lg" status={row.status} />,
    },
    {
      key: "points_awarded",
      header: "Points",
      render: (row) => (
        <span
          className={`font-bold tabular-nums ${ row.points_awarded > 0 ? "text-cn-p-ok" : "text-cn-p-ink-2" }`}
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
          <span className="inline-flex items-center gap-1 text-[11px] text-cn-p-accent">
            <Paperclip className="w-3 h-3" />
            Yes
          </span>
        ) : (
          <span className="text-[11px] text-cn-p-ink-2">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailSubmission(row)}
          className="inline-flex items-center gap-1.5 text-[11px] text-cn-p-accent hover:text-cn-p-accent-hover transition cursor-pointer"
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
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cn-p-accent-soft bg-cn-p-ok-bg px-4 py-3">
          <span className="text-xs text-cn-p-ink font-light">
            Showing submissions for{" "}
            <span className="font-semibold">{questFilter.title}</span>
          </span>
          <button
            type="button"
            onClick={onClearQuestFilter}
            className="ml-auto text-[11px] text-cn-p-accent hover:text-cn-p-accent-hover transition cursor-pointer"
          >
            Show all quests
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar tone="cobalt"
          size="lg"
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by student name, email or quest..."
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className={`${FILTER_CLASS} cn-p-select`}
          aria-label="Filter by status"
        >
          {STATUS_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="inline-flex items-center gap-2 text-xs font-sans text-cn-p-ink-2 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={hasProof}
            onChange={(event) => setHasProof(event.target.checked)}
            className="w-4 h-4 accent-cn-p-accent cursor-pointer"
          />
          With proof only
        </label>
      </div>

      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
        <DataTable tone="cobalt"
          size="lg"
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load quest submissions.") : null}
          onRetry={refetch}
          emptyLabel="No quest submissions match these filters."
        />
        <div className="px-4 pb-4">

          <Pagination tone="cobalt"
            size="lg"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${totalCount} submission${totalCount === 1 ? "" : "s"}`}
          />

        </div>
      </div>

      <QuestSubmissionDetailModal
        isOpen={Boolean(detailSubmission)}
        submission={detailSubmission}
        onClose={() => setDetailSubmission(null)}
      />
    </div>
  );
}
