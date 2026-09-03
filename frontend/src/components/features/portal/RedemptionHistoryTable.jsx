"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyRedemptions } from "@/services/rewardsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import DataTable from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import RedemptionDetailModal from "./RedemptionDetailModal";

const PAGE_SIZE = 10;

export default function RedemptionHistoryTable() {
  const [page, setPage] = useState(1);
  const [selectedRedemption, setSelectedRedemption] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["rewards", "my-redemptions", page],
    queryFn: async () => {
      const response = await getMyRedemptions({ page, pageSize: PAGE_SIZE });
      return response?.data || { count: 0, results: [] };
    },
  });

  const redemptions = data?.results || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / PAGE_SIZE));

  const columns = [
    {
      key: "reward",
      header: "Reward",
      render: (redemption) => <span className="font-semibold text-stone-800">{redemption.reward?.name}</span>,
    },
    {
      key: "points_cost",
      header: "Points Spent",
      render: (redemption) => (
        <span className="font-mono font-bold text-rose-600">-{redemption.points_cost.toLocaleString()}</span>
      ),
    },
    {
      key: "created_at",
      header: "Redeemed",
      render: (redemption) => (
        <span className="text-stone-500 whitespace-nowrap">{formatDateTime(redemption.created_at)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (redemption) => <StatusBadge size="lg" status={redemption.status} />,
    },
    {
      key: "notes",
      header: "Notes",
      render: (redemption) => (
        <span className="text-stone-500 font-light">
          {redemption.status === "CANCELLED"
            ? redemption.cancellation_reason || "—"
            : redemption.status === "SCHEDULED"
              ? "Scheduled — view details"
              : "View details"}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6">
      <DataTable
        size="lg"
        columns={columns}
        rows={redemptions}
        isLoading={isLoading}
        error={isError ? getApiErrorMessage(error, "Unable to load redemption history.") : null}
        onRetry={refetch}
        onRowClick={setSelectedRedemption}
        emptyLabel="No redemptions yet."
      />
      <Pagination
        size="lg"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalLabel={`${data?.count || 0} redemption${(data?.count || 0) === 1 ? "" : "s"}`}
      />

      <RedemptionDetailModal
        isOpen={Boolean(selectedRedemption)}
        onClose={() => setSelectedRedemption(null)}
        redemption={selectedRedemption}
      />
    </div>
  );
}
