"use client";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import {
  STALLED_AFTER_SECONDS,
  formatElapsed,
  isGenerationRunning,
  useElapsedSeconds,
} from "@/hooks/admin/useAiCourseGeneration";

/**
 * The strip above the courses table that makes an AI generation survivable:
 * it is the way back into a generation whose wizard was closed, and the only
 * place a generation that finished while the admin was elsewhere reports what
 * happened.
 *
 * It owns no polling and no job id of its own — `job` comes from
 * useAiCourseGenerationWatcher, which asks the server what is running. Every
 * action here just opens the wizard on that job, so Review & Edit / Try Again /
 * Cancel keep living in exactly one place.
 */
export default function AiGenerationBanner({ job, onOpen, onDismiss }) {
  const running = isGenerationRunning(job);
  const elapsed = useElapsedSeconds(job?.started_at || job?.created_at, running);
  // step_changed_at moves only when the service actually reported something new,
  // so this says "quiet", not merely "running".
  const sinceLastChange = useElapsedSeconds(job?.step_changed_at, running);
  const isStalled =
    running && Boolean(job?.step_changed_at) && sinceLastChange >= STALLED_AFTER_SECONDS;

  if (!job) return null;

  const warningCount = job.warnings?.length || 0;

  if (running) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="bg-paper border border-line rounded-card shadow-soft p-4 sm:p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-10 h-10 shrink-0 rounded-full border-[3px] border-porcelain border-t-pine animate-spin" />

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pine" />
              Generating with AI
            </p>
            <p className="text-sm font-semibold text-ink mt-1 truncate">
              {job.step || "Starting..."}
            </p>
            {job.step_detail && (
              <p className="text-xs text-ink/70 truncate">{job.step_detail}</p>
            )}

            <div className="mt-2 h-2 bg-porcelain rounded-full overflow-hidden">
              <div
                className="h-full bg-pine transition-all duration-500"
                style={{ width: `${job.progress_percent || 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-mono text-muted">
              {job.progress_percent || 0}% · {formatElapsed(elapsed)} elapsed · this keeps
              running if you close it or switch tabs.
            </p>
            {isStalled && (
              <p className="mt-1 text-[11px] font-mono text-gold">
                No new progress from the AI service for {formatElapsed(sinceLastChange)} —
                still waiting, not given up on.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="shrink-0 px-4 py-2.5 bg-paper hover:bg-porcelain text-ink text-sm font-semibold font-mono rounded-xl tracking-wider border border-line shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            View Progress
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    );
  }

  if (job.status === "FAILED") {
    return (
      <section className="border border-red-200 bg-red-50/70 rounded-card shadow-soft p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <XCircle className="w-6 h-6 shrink-0 text-red-600" />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">AI course generation failed</p>
            <p className="text-[11px] font-mono text-muted mt-0.5">
              No course was created — nothing was saved.
            </p>
            {job.error_message && (
              /* Clamped: a generation that failed before the service's own error
                 was parsed still carries a raw JSON body here. */
              <p className="mt-2 text-xs text-red-800 leading-relaxed max-h-20 overflow-y-auto break-words whitespace-pre-wrap">
                {job.error_message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpen}
              className="px-4 py-2.5 bg-pine hover:bg-moss text-paper text-sm font-semibold font-mono rounded-xl tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <DismissButton onDismiss={onDismiss} label="Dismiss this failed generation" />
          </div>
        </div>
      </section>
    );
  }

  if (job.status === "CANCELLED") {
    return (
      <section className="bg-paper border border-line rounded-card shadow-soft p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 shrink-0 text-muted" />
          <p className="text-sm font-semibold text-ink flex-1">AI course generation cancelled</p>
          <DismissButton onDismiss={onDismiss} label="Dismiss this cancelled generation" />
        </div>
      </section>
    );
  }

  return (
    <section className="border border-emerald-200 bg-emerald-50/60 rounded-card shadow-soft p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-700">
            Course generated
          </p>
          <p className="text-sm font-bold text-ink mt-0.5 truncate">
            {job.course?.title || "Draft course ready"}
          </p>
          <p className="text-[11px] font-mono text-muted mt-0.5">
            Saved as {job.course?.status || "DRAFT"} — it is in the list below.
            {warningCount > 0 &&
              ` ${warningCount} item${warningCount === 1 ? "" : "s"} need attention.`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpen}
            className="px-4 py-2.5 bg-pine hover:bg-moss text-paper text-sm font-semibold font-mono rounded-xl tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Review &amp; Edit
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <DismissButton onDismiss={onDismiss} label="Dismiss this generation result" />
        </div>
      </div>
    </section>
  );
}

function DismissButton({ onDismiss, label }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      title={label}
      aria-label={label}
      className="p-2.5 rounded-xl text-muted hover:text-ink hover:bg-paper/70 transition-colors cursor-pointer"
    >
      <X className="w-4 h-4" />
    </button>
  );
}
