"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMediaKitReviews } from "@/services/brandValidatorService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import Pagination from "@/components/ui/Pagination";
import Loader from "@/components/ui/Loader";
import { AlertCircle, FileText } from "lucide-react";
import PortalCard from "../shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalPill,
  PortalTable,
  PortalTd,
  PortalTh,
  PortalTr,
} from "../shell/PortalUI";

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

  const count = data?.count || 0;
  const STATUS_TONES = { COMPLETED: "ok", PROCESSING: "warn", PENDING: "warn", FAILED: "bad" };

  if (isLoading) {
    return (
      <PortalCard className="p-10">
        <Loader fullScreen={false} tone="cobalt" label="Loading your review history..." />
      </PortalCard>
    );
  }

  if (isError) {
    return (
      <PortalCard className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
          <AlertCircle className="h-5 w-5" />
        </span>
        <p className="text-sm text-cn-p-ink-2">
          {getApiErrorMessage(error, "Unable to load your review history.")}
        </p>
        <PortalButton size="sm" onClick={() => refetch()}>
          Retry
        </PortalButton>
      </PortalCard>
    );
  }

  if (rows.length === 0) {
    return (
      <PortalCard>
        <PortalEmpty
          icon={FileText}
          title="No reviews yet"
          text="Your first review shows up here."
        />
      </PortalCard>
    );
  }

  return (
    <PortalCard>
      <PortalTable>
        <thead>
          <tr>
            <PortalTh>File</PortalTh>
            <PortalTh>Uploaded</PortalTh>
            <PortalTh align="right">Score</PortalTh>
            <PortalTh>Status</PortalTh>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isDone = row.status === "COMPLETED";
            return (
              <PortalTr
                key={row.id}
                onOpen={isDone ? () => onOpenReview?.(row.id) : undefined}
              >
                <PortalTd>
                  <span className="flex items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-cn-p-sm bg-cn-p-soft text-cn-p-soft-ink">
                      <FileText className="h-4 w-4" />
                    </span>
                    <b className="min-w-0 truncate font-semibold text-cn-p-ink">
                      {row.original_name || "Media kit"}
                    </b>
                  </span>
                </PortalTd>
                <PortalTd className="text-sm whitespace-nowrap text-cn-p-ink-2">
                  {formatDateTime(row.created_at)}
                </PortalTd>
                <PortalTd align="right" numeric>
                  {isDone ? (
                    <b className="font-bold text-cn-p-ink">{row.overall_score}/100</b>
                  ) : (
                    <span className="text-cn-p-ink-2">&mdash;</span>
                  )}
                </PortalTd>
                <PortalTd>
                  <PortalPill tone={STATUS_TONES[row.status] || "neutral"}>
                    {row.status
                      ? row.status.charAt(0) + row.status.slice(1).toLowerCase()
                      : "—"}
                  </PortalPill>
                </PortalTd>
              </PortalTr>
            );
          })}
        </tbody>
      </PortalTable>

      <div className="px-5 pb-4">
        <Pagination
          size="lg"
          tone="cobalt"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${count} review${count === 1 ? "" : "s"}`}
        />
      </div>
    </PortalCard>
  );
}
