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
  "px-3.5 py-2.5 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-xs font-mono text-ink transition cursor-pointer";

function scoreTone(score) {
  if (score === null || score === undefined) return "text-muted";
  if (score >= 75) return "text-emerald-700";
  if (score >= 50) return "text-amber-700";
  return "text-rose-700";
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
          <span className="font-semibold text-ink">{row.student_name || "—"}</span>
          <p className="text-[11px] text-muted font-light truncate">{row.student_email}</p>
        </div>
      ),
    },
    {
      key: "scenario",
      header: "Scenario",
      render: (row) => (
        <div className="min-w-0">
          <span className="text-xs text-ink">{row.scenario_title}</span>
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
            {row.scenario_code} &middot; {row.persona_display}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge size="lg" status={row.status} />,
    },
    {
      key: "overall_score",
      header: "Overall",
      render: (row) => (
        <span className={`font-mono font-bold tabular-nums ${scoreTone(row.overall_score)}`}>
          {row.overall_score ?? "—"}
        </span>
      ),
    },
    {
      key: "rubric",
      header: "Boundary / Tone / Policy",
      render: (row) =>
        row.overall_score === null || row.overall_score === undefined ? (
          <span className="text-muted">&mdash;</span>
        ) : (
          <span className="font-mono text-xs text-muted tabular-nums">
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
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700">
            Flagged
          </span>
        ) : (
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
            &mdash;
          </span>
        ),
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
      key: "created_at",
      header: "Run",
      render: (row) => (
        <span className="text-xs text-muted">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => setDetailSessionId(row.id)}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-pine hover:text-moss transition cursor-pointer"
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
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-pine/25 bg-sage/15 px-4 py-3">
          <span className="text-xs text-ink font-light">
            Showing runs of <span className="font-semibold">{scenarioFilter.title}</span>
          </span>
          <button
            type="button"
            onClick={onClearScenarioFilter}
            className="ml-auto text-[11px] font-mono uppercase tracking-wider text-pine hover:text-moss transition cursor-pointer"
          >
            Show all scenarios
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar
          size="lg"
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search by student name, email or scenario..."
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

        <select
          value={passed}
          onChange={(event) => setPassed(event.target.value)}
          className={FILTER_CLASS}
          aria-label="Filter by result"
        >
          {RESULT_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft p-6">
        <DataTable
          size="lg"
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          error={isError ? getApiErrorMessage(error, "Unable to load role-play runs.") : null}
          onRetry={refetch}
          emptyLabel="No role-play runs match these filters."
        />
        <Pagination
          size="lg"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${totalCount} run${totalCount === 1 ? "" : "s"}`}
        />
      </div>

      <RolePlaySessionDetailModal
        sessionId={detailSessionId}
        onClose={() => setDetailSessionId(null)}
      />
    </div>
  );
}
