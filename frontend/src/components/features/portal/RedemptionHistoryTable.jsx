"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Gift, RefreshCw } from "lucide-react";
import { getMyRedemptions } from "@/services/rewardsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import {
  PortalButton,
  PortalEmpty,
  PortalPill,
  PortalTable,
  PortalTd,
  PortalTh,
  PortalTr,
} from "./shell/PortalUI";
import RedemptionDetailModal from "./RedemptionDetailModal";

const PAGE_SIZE = 10;

// What each redemption status means in the portal's palette. Anything the
// server sends that isn't listed falls back to neutral rather than going
// unstyled, so a new status added server-side degrades quietly.
const STATUS_TONES = {
  PENDING: "warn",
  APPROVED: "blue",
  SCHEDULED: "blue",
  FULFILLED: "ok",
  COMPLETED: "ok",
  CANCELLED: "neutral",
  REJECTED: "bad",
};

function statusLabel(status) {
  if (!status) return "—";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

// The design's "My redemptions" tab: what you asked for, what it cost and
// where the request has got to. Rendered bare — `RewardsTab` owns the card.
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
  const count = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  if (isLoading) {
    return (
      <div className="p-10">
        <Loader fullScreen={false} tone="cobalt" label="Loading your redemptions..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
          <AlertCircle className="h-5 w-5" />
        </span>
        <p className="text-sm text-cn-p-ink-2">
          {getApiErrorMessage(error, "Unable to load redemption history.")}
        </p>
        <PortalButton size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </PortalButton>
      </div>
    );
  }

  if (redemptions.length === 0) {
    return (
      <PortalEmpty
        icon={Gift}
        title="No redemptions yet"
        text="Redeem a reward and track it here until it is delivered."
      />
    );
  }

  return (
    <>
      <PortalTable>
        <thead>
          <tr>
            <PortalTh>Reward</PortalTh>
            <PortalTh>Requested</PortalTh>
            <PortalTh align="right">Points spent</PortalTh>
            <PortalTh>Status</PortalTh>
          </tr>
        </thead>
        <tbody>
          {redemptions.map((redemption) => (
            <PortalTr
              key={redemption.id}
              onOpen={() => setSelectedRedemption(redemption)}
            >
              <PortalTd>
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-cn-p-sm bg-cn-p-soft text-cn-p-soft-ink">
                    <Gift className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <b className="block font-semibold text-cn-p-ink">
                      {redemption.reward?.name}
                    </b>
                    <span className="block text-[13px] text-cn-p-muted">
                      {redemption.status === "CANCELLED"
                        ? redemption.cancellation_reason || "Cancelled"
                        : "View details"}
                    </span>
                  </span>
                </span>
              </PortalTd>
              <PortalTd className="text-sm whitespace-nowrap text-cn-p-ink-2">
                {formatDateTime(redemption.created_at)}
              </PortalTd>
              <PortalTd align="right" numeric>
                <b className="font-bold text-cn-p-ink-2">
                  -{redemption.points_cost.toLocaleString()}
                </b>
              </PortalTd>
              <PortalTd>
                <PortalPill tone={STATUS_TONES[redemption.status] || "neutral"}>
                  {statusLabel(redemption.status)}
                </PortalPill>
              </PortalTd>
            </PortalTr>
          ))}
        </tbody>
      </PortalTable>

      <div className="px-5 pb-4">
        <Pagination
          size="lg"
          tone="cobalt"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${count} redemption${count === 1 ? "" : "s"}`}
        />
      </div>

      <RedemptionDetailModal
        isOpen={Boolean(selectedRedemption)}
        onClose={() => setSelectedRedemption(null)}
        redemption={selectedRedemption}
      />
    </>
  );
}
