"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQuestHistory } from "@/services/questsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatPlainDate } from "@/lib/adminFormatters";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";

const PAGE_SIZE = 10;

export default function QuestHistoryTable() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["quests", "history", page],
    queryFn: async () => {
      const response = await getQuestHistory({ page, pageSize: PAGE_SIZE });
      return response?.data || { count: 0, results: [] };
    },
  });

  const rows = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const columns = [
    {
      key: "assigned_date",
      header: "Date",
      render: (row) => (
        <span className="text-muted whitespace-nowrap">{formatPlainDate(row.assigned_date)}</span>
      ),
    },
    {
      key: "quest",
      header: "Quest",
      render: (row) => (
        <div className="min-w-0">
          <p className="text-ink font-medium truncate">{row.quest.title}</p>
          <p className="text-[11px] text-muted font-light">{row.quest.category_display}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} size="lg" />,
    },
    {
      key: "points_awarded",
      header: "Points",
      render: (row) => (
        <span
          className={`font-mono font-bold ${row.points_awarded > 0 ? "text-emerald-700" : "text-muted"}`}
        >
          {row.points_awarded > 0 ? `+${row.points_awarded}` : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-paper border border-line rounded-2xl shadow-sm p-6">
      <DataTable
        size="lg"
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={isError ? getApiErrorMessage(error, "Unable to load your quest history.") : null}
        onRetry={refetch}
        emptyLabel="No quests completed yet."
      />
      <Pagination
        size="lg"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalLabel={`${data?.count || 0} quest${(data?.count || 0) === 1 ? "" : "s"}`}
      />
    </div>
  );
}
