"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQuestHistory } from "@/services/questsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatPlainDate } from "@/lib/adminFormatters";
import Pagination from "@/components/ui/Pagination";
import Loader from "@/components/ui/Loader";
import { AlertCircle, CircleCheck, RefreshCw } from "lucide-react";
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

  const count = data?.count || 0;

  if (isLoading) {
    return (
      <PortalCard className="p-10">
        <Loader fullScreen={false} tone="cobalt" label="Loading your quest history..." />
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
          {getApiErrorMessage(error, "Unable to load your quest history.")}
        </p>
        <PortalButton size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </PortalButton>
      </PortalCard>
    );
  }

  if (rows.length === 0) {
    return (
      <PortalCard>
        <PortalEmpty
          icon={CircleCheck}
          title="No quests completed yet"
          text="Finish one of today's quests and it is recorded here."
        />
      </PortalCard>
    );
  }

  return (
    <PortalCard>
      <PortalTable>
        <thead>
          <tr>
            <PortalTh>Quest</PortalTh>
            <PortalTh>Date</PortalTh>
            <PortalTh>Status</PortalTh>
            <PortalTh align="right">Points</PortalTh>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <PortalTr key={row.id}>
              <PortalTd>
                <b className="block font-semibold text-cn-p-ink">{row.quest.title}</b>
                <span className="block text-[13px] text-cn-p-muted">
                  {row.quest.category_display}
                </span>
              </PortalTd>
              <PortalTd className="text-sm whitespace-nowrap text-cn-p-ink-2">
                {formatPlainDate(row.assigned_date)}
              </PortalTd>
              <PortalTd>
                <PortalPill tone={row.points_awarded > 0 ? "ok" : "neutral"}>
                  {row.status
                    ? row.status.charAt(0) + row.status.slice(1).toLowerCase()
                    : "—"}
                </PortalPill>
              </PortalTd>
              <PortalTd align="right" numeric>
                <b className={row.points_awarded > 0 ? "font-bold text-cn-p-ok" : "font-bold text-cn-p-ink-2"}>
                  {row.points_awarded > 0 ? `+${row.points_awarded}` : "—"}
                </b>
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
          totalLabel={`${count} quest${count === 1 ? "" : "s"}`}
        />
      </div>
    </PortalCard>
  );
}
