"use client";

import { AlertCircle, Mic, RefreshCw } from "lucide-react";
import { getApiErrorMessage } from "@/lib/apiErrors";
import Loader from "@/components/ui/Loader";
import { PortalEmpty } from "../shell/PortalUI";
import SessionCard from "./SessionCard";

export default function SessionList({
  sessions = [],
  isLoading,
  isError,
  error,
  onRetry,
  emptyLabel,
  emptyDescription,
  onRsvp,
  onCancelRsvp,
  onJoin,
  onOpenNotes,
  onOpenDetail,
  isBusy,
}) {
  if (isLoading) {
    return (
      <div className="bg-cn-p-card border border-cn-p-line rounded-2xl p-10">
        <Loader fullScreen={false} tone="portal" label="Loading sessions..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="w-10 h-10 bg-cn-p-bad-bg border border-cn-p-bad-bg text-cn-p-bad rounded-xl flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm text-cn-p-ink-2 font-light">
          {getApiErrorMessage(error, "Unable to load sessions.")}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white font-bold tabular-nums text-xs  rounded-lg transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <PortalEmpty icon={Mic} title={emptyLabel} text={emptyDescription} />
    );
  }

  return (
    // One full-width row per session, divided by a rule — the design's
    // `.list` inside `.card.p0`. A grid of bordered cards inside a panel that
    // already has a border reads as a card within a card.
    <div className="grid grid-cols-[minmax(0,1fr)]">
      {sessions.map((session) => (
        <div key={session.id} className="border-t border-cn-p-line first:border-t-0">
        <SessionCard
          flat
          session={session}
          onRsvp={onRsvp}
          onCancelRsvp={onCancelRsvp}
          onJoin={onJoin}
          onOpenNotes={onOpenNotes}
          onOpenDetail={onOpenDetail}
          isBusy={isBusy}
        />
        </div>
      ))}
    </div>
  );
}
