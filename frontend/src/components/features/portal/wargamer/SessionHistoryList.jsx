"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { getRolePlayHistory } from "@/services/wargamerService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import { getScoreTone } from "./wargamerConstants";

const PAGE_SIZE = 10;

/** Every run this student has made, newest first. */
export default function SessionHistoryList({ onOpenSession }) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["roleplay", "history", page],
    queryFn: async () => {
      const response = await getRolePlayHistory({ page, pageSize: PAGE_SIZE });
      return response?.data || { count: 0, results: [] };
    },
  });

  const sessions = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const columns = [
    {
      key: "scenario",
      header: "Situation",
      render: (session) => (
        <div>
          <span className="font-semibold text-ink">{session.scenario_title}</span>
          <p className="text-[11px] text-muted font-light">
            {session.scenario_code} &middot; {session.key_skill}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (session) => <StatusBadge size="lg" status={session.status} />,
    },
    {
      key: "overall_score",
      header: "Score",
      render: (session) =>
        session.overall_score === null || session.overall_score === undefined ? (
          <span className="text-muted">&mdash;</span>
        ) : (
          <span className={`font-mono font-bold tabular-nums ${getScoreTone(session.overall_score)}`}>
            {session.overall_score}
          </span>
        ),
    },
    {
      key: "verdict",
      header: "Verdict",
      render: (session) => (
        <span className="text-xs text-muted font-light">{session.verdict || "—"}</span>
      ),
    },
    {
      key: "points_awarded",
      header: "Points",
      render: (session) => (
        <span className="font-mono font-bold text-ink tabular-nums">
          {session.points_awarded || 0}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Run",
      render: (session) => formatDate(session.created_at),
    },
  ];

  return (
    <div className="bg-paper border border-line rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-porcelain border border-line text-muted flex items-center justify-center shrink-0">
          <History className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-serif font-bold text-ink">Your past runs</h3>
          <p className="text-[11px] text-muted font-light">
            Open a scored run to read its report card again.
          </p>
        </div>
      </div>

      <DataTable
        size="lg"
        columns={columns}
        rows={sessions}
        isLoading={isLoading}
        error={isError ? getApiErrorMessage(error, "Unable to load your runs.") : null}
        onRetry={refetch}
        emptyLabel="You haven't run a situation yet."
        onRowClick={(session) =>
          session.status === "COMPLETED" ? onOpenSession?.(session.id) : undefined
        }
      />

      <Pagination
        size="lg"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalLabel={`${totalCount} run${totalCount === 1 ? "" : "s"}`}
      />
    </div>
  );
}
