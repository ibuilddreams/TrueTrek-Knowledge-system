"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getAdminRolePlaySessions } from "@/services/wargamerService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import SearchBar from "@/components/ui/SearchBar";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import RolePlaySessionDetailModal from "@/components/features/admin/RolePlaySessionDetailModal";

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "COMPLETED", label: "Scored" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "EVALUATING", label: "Scoring failed" },
  { value: "ABANDONED", label: "Walked away" },
];

const RESULT_FILTERS = [
  { value: "", label: "All results" },
  { value: "true", label: "Passed" },
  { value: "false", label: "Did not pass" },
];

const FILTER_CLASS =
  "px-3.5 py-2.5 bg-cn-p-page border border-cn-p-line focus:border-cn-p-accent focus:bg-cn-p-card focus:outline-none rounded-xl text-xs  text-cn-p-ink transition cursor-pointer";

function scoreTone(score) {
  if (score === null || score === undefined) return "text-cn-p-ink-2";
  if (score >= 75) return "text-cn-p-ok";
  if (score >= 50) return "text-cn-p-warn";
  return "text-cn-p-bad";
}

/**
 * Every student's role-play activity — "who ran which situation and how did
 * it go".
 *
 * Read-only by design, like the quest submissions feed: scoring is automatic
 * and already paid out, so there is nothing to approve here. Reversing a
 * wrongly awarded run is a points adjustment in Rewards, which keeps that
 * ledger append-only.
 */
export default function AdminRolePlaySessionsSection({ scenarioFilter, onClearScenarioFilter }) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [status, setStatus] = useState("");
  const [passed, setPassed] = useState("");
  const [page, setPage] = useState(1);
  const [detailSessionId, setDetailSessionId] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, passed, scenarioFilter]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "admin-roleplay-sessions",
      page,
      debouncedSearch,
      status,
      passed,
      scenarioFilter?.id ?? null,
    ],
    queryFn: async () => {
      const response = await getAdminRolePlaySessions({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
        passed: passed || undefined,
        scenario: scenarioFilter?.id || undefined,
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
      key: "scenario",
      header: "Scenario",
      render: (row) => (
        <div className="min-w-0">
          <span className="text-xs text-cn-p-ink">{row.scenario_title}</span>
          <p className="text-[11px] text-cn-p-ink-2">
            {row.scenario_code} &middot; {row.persona_display}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge tone="cobalt" size="lg" status={row.status} />,
    },
    {
      key: "overall_score",
      header: "Overall",
      render: (row) => (
        <span className={`font-bold tabular-nums ${scoreTone(row.overall_score)}`}>
          {row.overall_score ?? "—"}
        </span>
      ),
    },
    {
      key: "rubric",
      header: "Boundary / tone / policy",
      render: (row) =>
        row.overall_score === null || row.overall_score === undefined ? (
          <span className="text-cn-p-ink-2">&mdash;</span>
        ) : (
          <span className="text-xs text-cn-p-ink-2 tabular-nums">
            {row.time_to_boundary_score} / {row.tone_control_score} /{" "}
            {row.deflection_to_policy_score}
          </span>
        ),
    },
    {
      key: "used_fabricated_excuse",
      header: "Made-up excuse",
      render: (row) =>
        row.used_fabricated_excuse ? (
          <span className="text-[11px] text-cn-p-warn">
            Flagged
          </span>
        ) : (
          <span className="text-[11px] text-cn-p-ink-2">
            &mdash;
          </span>
        ),
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
      key: "created_at",
      header: "Run",
      render: (row) => (
        <span className="text-xs text-cn-p-ink-2">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailSessionId(row.id)}
          className="inline-flex items-center gap-1.5 text-[11px] text-cn-p-accent hover:text-cn-p-accent-hover transition cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          Transcript
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {scenarioFilter && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cn-p-accent-soft bg-cn-p-ok-bg px-4 py-3">
          <span className="text-xs text-cn-p-ink font-light">
            Showing runs of <span className="font-semibold">{scenarioFilter.title}</span>
          </span>
          <button
            type="button"
            onClick={onClearScenarioFilter}
            className="ml-auto text-[11px] text-cn-p-accent hover:text-cn-p-accent-hover transition cursor-pointer"
          >
            Show all scenarios
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar tone="cobalt"
          size="lg"
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by student name, email or scenario..."
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

        <select
          value={passed}
          onChange={(event) => setPassed(event.target.value)}
          className={`${FILTER_CLASS} cn-p-select`}
          aria-label="Filter by result"
        >
          {RESULT_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p overflow-hidden">
        <DataTable tone="cobalt"
          size="lg"
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load role-play runs.") : null}
          onRetry={refetch}
          emptyLabel="No role-play runs match these filters."
        />
        <div className="px-4 pb-4">

          <Pagination tone="cobalt"
            size="lg"
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalLabel={`${totalCount} run${totalCount === 1 ? "" : "s"}`}
          />

        </div>
      </div>

      <RolePlaySessionDetailModal
        sessionId={detailSessionId}
        onClose={() => setDetailSessionId(null)}
      />
    </div>
  );
}
