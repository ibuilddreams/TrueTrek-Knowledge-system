"use client";

import { CheckCircle2, Layers3, Lock, LogIn, Sparkles } from "lucide-react";

// Three states, three readings: locked is quiet, in-flight is the cobalt
// signal, done is the system's one green. Nothing else on the card competes.
const STATUS_META = {
  LOCKED: {
    label: "LOCKED",
    icon: Lock,
    className: "border-cn-rule bg-cn-paper-2 text-cn-muted",
    iconClassName: "text-cn-muted",
  },
  UNLOCKED: {
    label: "UNLOCKED",
    icon: Sparkles,
    className: "border-cn-accent-soft bg-cn-paper-3 text-cn-accent-3",
    iconClassName: "text-cn-accent",
  },
  IN_PROGRESS: {
    label: "IN PROGRESS",
    icon: Sparkles,
    className: "border-cn-accent-soft bg-cn-paper-3 text-cn-accent-3",
    iconClassName: "text-cn-accent",
  },
  COMPLETED: {
    label: "COMPLETED",
    icon: CheckCircle2,
    className: "border-cn-ok/30 bg-cn-ok-bg text-cn-ok",
    iconClassName: "text-cn-ok",
  },
};

export default function TierRoadmapCard({ tier, progress, isAuthenticated, revealDelay = 0 }) {
  const statusMeta = progress ? STATUS_META[progress.status] : null;
  const StatusIcon = statusMeta?.icon;
  const isLocked = progress?.status === "LOCKED";
  const pathwayCount = tier.pathway_count ?? 0;

  return (
    <div
      id={`tier-roadmap-card-${tier.id}`}
      data-cn-reveal
      style={{ "--cn-d": revealDelay }}
      className={`cn-reveal group flex flex-col justify-between rounded-cn-lg border border-cn-rule bg-white p-6 shadow-cn-1 transition-[transform,box-shadow] duration-200 ease-cn-out ${
        isLocked ? "opacity-75" : "hover:-translate-y-1 hover:shadow-cn-3"
      }`}
    >
      <div>
        <div className="mb-5 flex items-center justify-between gap-2 border-b border-cn-rule pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-cn-accent px-2.5 py-1 text-xs font-semibold text-white">
              <Layers3 className="w-3 h-3" />
              Tier {tier.level}
            </span>
            <span className="truncate rounded-full bg-cn-paper-2 px-2.5 py-1 text-xs font-semibold text-cn-ink-2">
              {tier.category?.name || "General"}
            </span>
          </div>

          {statusMeta && (
            <span
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-widest uppercase ${statusMeta.className}`}
            >
              {StatusIcon && <StatusIcon className={`w-3 h-3 shrink-0 ${statusMeta.iconClassName}`} />}
              {statusMeta.label}
            </span>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-cn-lg font-bold tracking-[-0.015em] text-cn-ink transition-colors duration-150 group-hover:text-cn-accent">
          {tier.name}
        </h3>
        <p className="mb-3 truncate text-xs font-semibold tracking-widest text-cn-muted uppercase">
          Audience: {tier.audience || "All athletes"}
        </p>
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-cn-muted">
          {tier.focus_description || "No focus description has been added for this tier yet."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-cn-rule pt-4">
        <span className="text-sm text-cn-muted">
          {pathwayCount} pathway{pathwayCount === 1 ? "" : "s"}
          {tier.estimated_duration ? ` · ${tier.estimated_duration}` : ""}
        </span>

        {isAuthenticated && progress && progress.status !== "LOCKED" ? (
          <span className="shrink-0 text-sm font-semibold text-cn-accent tabular-nums">
            {Number(progress.progress_percentage)}% complete
          </span>
        ) : !isAuthenticated ? (
          <span className="flex shrink-0 items-center gap-1.5 text-sm text-cn-muted">
            <LogIn className="w-3 h-3" />
            Sign in to track
          </span>
        ) : null}
      </div>
    </div>
  );
}
