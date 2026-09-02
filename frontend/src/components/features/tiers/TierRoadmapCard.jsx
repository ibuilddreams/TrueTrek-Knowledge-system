"use client";

import { CheckCircle2, Layers3, Lock, LogIn, Sparkles } from "lucide-react";

const STATUS_META = {
  LOCKED: {
    label: "LOCKED",
    icon: Lock,
    className: "bg-porcelain text-muted border-line",
    iconClassName: "text-muted",
  },
  UNLOCKED: {
    label: "UNLOCKED",
    icon: Sparkles,
    className: "bg-gold/15 text-[#8a6f2e] border-gold/30",
    iconClassName: "text-gold",
  },
  IN_PROGRESS: {
    label: "IN PROGRESS",
    icon: Sparkles,
    className: "bg-gold/15 text-[#8a6f2e] border-gold/30",
    iconClassName: "text-gold",
  },
  COMPLETED: {
    label: "COMPLETED",
    icon: CheckCircle2,
    className: "bg-sage text-moss border-moss/30",
    iconClassName: "text-moss",
  },
};

export default function TierRoadmapCard({ tier, progress, isAuthenticated }) {
  const statusMeta = progress ? STATUS_META[progress.status] : null;
  const StatusIcon = statusMeta?.icon;
  const isLocked = progress?.status === "LOCKED";
  const pathwayCount = tier.pathway_count ?? 0;

  return (
    <div
      id={`tier-roadmap-card-${tier.id}`}
      className={`bg-paper border rounded-card shadow-soft p-6 transition-all duration-300 flex flex-col justify-between group ${
        isLocked
          ? "border-line opacity-75"
          : "border-line hover:shadow-elevated hover:-translate-y-1"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-line pb-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-sans text-xs font-medium uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 text-[#8a6f2e] bg-gold/15 flex items-center gap-1.5">
              <Layers3 className="w-3 h-3" />
              Tier {tier.level}
            </span>
            <span className="text-[10px] uppercase font-sans tracking-widest font-medium px-2 py-0.5 rounded-full border truncate bg-porcelain text-ink border-line">
              {tier.category?.name || "General"}
            </span>
          </div>

          {statusMeta && (
            <span
              className={`flex items-center gap-1 text-[10px] font-sans font-medium uppercase tracking-widest border px-2.5 py-1 rounded-full shrink-0 ${statusMeta.className}`}
            >
              {StatusIcon && <StatusIcon className={`w-3 h-3 shrink-0 ${statusMeta.iconClassName}`} />}
              {statusMeta.label}
            </span>
          )}
        </div>

        <h3 className="text-lg font-serif font-light tracking-tight mb-2 text-ink group-hover:text-moss transition-colors duration-250 line-clamp-2">
          {tier.name}
        </h3>
        <p className="text-xs font-sans uppercase tracking-widest text-muted mb-3 truncate">
          Audience: {tier.audience || "All athletes"}
        </p>
        <p className="text-[13px] leading-relaxed line-clamp-3 font-light mb-4 text-muted">
          {tier.focus_description || "No focus description has been added for this tier yet."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-line">
        <span className="text-muted text-[11px] font-sans">
          {pathwayCount} pathway{pathwayCount === 1 ? "" : "s"}
          {tier.estimated_duration ? ` · ${tier.estimated_duration}` : ""}
        </span>

        {isAuthenticated && progress && progress.status !== "LOCKED" ? (
          <span className="text-xs font-semibold font-sans text-moss shrink-0">
            {Number(progress.progress_percentage)}% complete
          </span>
        ) : !isAuthenticated ? (
          <span className="text-[10px] font-sans uppercase tracking-widest font-medium text-muted flex items-center gap-1 shrink-0">
            <LogIn className="w-3 h-3" />
            Sign in to track
          </span>
        ) : null}
      </div>
    </div>
  );
}
