"use client";

import { AlertCircle, Mic, RefreshCw } from "lucide-react";
import { getApiErrorMessage } from "@/lib/apiErrors";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
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
  onOpenDetail,
  isBusy,
}) {
  if (isLoading) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-10">
        <Loader fullScreen={false} label="Loading sessions..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm text-muted font-light">
          {getApiErrorMessage(error, "Unable to load sessions.")}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pine hover:bg-moss text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-6">
        <EmptyState icon={Mic} label={emptyLabel} description={emptyDescription} size="lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onRsvp={onRsvp}
          onCancelRsvp={onCancelRsvp}
          onJoin={onJoin}
          onOpenDetail={onOpenDetail}
          isBusy={isBusy}
        />
      ))}
    </div>
  );
}
