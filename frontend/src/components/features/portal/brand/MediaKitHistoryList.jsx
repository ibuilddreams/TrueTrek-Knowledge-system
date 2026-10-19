"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMediaKitReviews } from "@/services/brandValidatorService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";

const PAGE_SIZE = 10;

export default function MediaKitHistoryList({ onOpenReview }) {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["media-kit-reviews", page],
    queryFn: async () => {
      const response = await getMediaKitReviews({ page, pageSize: PAGE_SIZE });
      return response?.data || { count: 0, results: [] };
    },
  });

  const rows = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const columns = [
    {
      key: "created_at",
      header: "Uploaded",
      render: (row) => (
        <span className="text-muted whitespace-nowrap">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: "original_name",
      header: "File",
      render: (row) => <span className="text-ink truncate">{row.original_name || "Media kit"}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} size="lg" />,
    },
    {
      key: "overall_score",
      header: "Score",
      render: (row) => (
        <span className="font-mono font-bold text-ink">
          {row.status === "COMPLETED" ? `${row.overall_score}/100` : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) =>
        row.status === "COMPLETED" ? (
          <button
            type="button"
            onClick={() => onOpenReview?.(row.id)}
            className="text-[11px] font-mono uppercase tracking-wider text-pine hover:text-moss transition cursor-pointer"
          >
            View
          </button>
        ) : null,
    },
  ];

  return (
    <div className="bg-paper border border-line rounded-2xl shadow-sm p-6">
      <DataTable
        size="lg"
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        error={isError ? getApiErrorMessage(error, "Unable to load your review history.") : null}
        onRetry={refetch}
        emptyLabel="No media kits reviewed yet."
      />
      <Pagination
        size="lg"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalLabel={`${data?.count || 0} review${(data?.count || 0) === 1 ? "" : "s"}`}
      />
    </div>
  );
}
