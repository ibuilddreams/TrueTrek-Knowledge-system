"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, History } from "lucide-react";
import { getRolePlayHistory } from "@/services/wargamerService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import Pagination from "@/components/ui/Pagination";
import Loader from "@/components/ui/Loader";
import PortalCard, { PortalCardHead } from "../shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalPill,
} from "../shell/PortalUI";
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

  const STATUS_TONES = {
    COMPLETED: "ok",
    EVALUATING: "warn",
    IN_PROGRESS: "blue",
    ABANDONED: "neutral",
  };

  if (isLoading) {
    return (
      <PortalCard className="p-10">
        <Loader fullScreen={false} tone="cobalt" label="Loading your runs..." />
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
          {getApiErrorMessage(error, "Unable to load your runs.")}
        </p>
        <PortalButton size="sm" onClick={() => refetch()}>
          Retry
        </PortalButton>
      </PortalCard>
    );
  }

  if (sessions.length === 0) {
    return (
      <PortalCard>
        <PortalEmpty
          icon={History}
          title="You haven't run a situation yet"
          text="Finish one and its report card is kept here."
        />
      </PortalCard>
    );
  }

  return (
    <PortalCard>
      <PortalCardHead title="Your past runs" />

      {/* A list, not a table. This sits in the narrow column beside the
          situations, where five columns wrap every cell onto three lines —
          the design draws it as title over date, then the score and how it
          went, which is all a reader scanning their history needs. */}
      <ul className="m-0 list-none p-0">
        {sessions.map((session) => {
          const isDone = session.status === "COMPLETED";
          const scored =
            session.overall_score !== null && session.overall_score !== undefined;
          return (
            <li key={session.id} className="border-t border-cn-p-line first:border-t-0">
              <button
                type="button"
                disabled={!isDone}
                onClick={isDone ? () => onOpenSession?.(session.id) : undefined}
                className="flex w-full items-center gap-3 border-0 bg-transparent px-5 py-3.5 text-left transition-colors duration-150 enabled:cursor-pointer enabled:hover:bg-cn-p-page disabled:cursor-default"
              >
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm font-semibold text-cn-p-ink">
                    {session.scenario_title}
                  </b>
                  <span className="block text-xs text-cn-p-muted">
                    {formatDate(session.created_at)}
                  </span>
                </span>
                {scored && (
                  <b className={`flex-none tabular-nums ${getScoreTone(session.overall_score)}`}>
                    {session.overall_score}
                  </b>
                )}
                <PortalPill tone={STATUS_TONES[session.status] || "neutral"}>
                  {session.verdict ||
                    (session.status
                      ? session.status.charAt(0) +
                        session.status.slice(1).toLowerCase().replace("_", " ")
                      : "—")}
                </PortalPill>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="px-5 pb-4">
        <Pagination
          size="lg"
          tone="cobalt"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalLabel={`${totalCount} run${totalCount === 1 ? "" : "s"}`}
        />
      </div>
    </PortalCard>
  );
}
