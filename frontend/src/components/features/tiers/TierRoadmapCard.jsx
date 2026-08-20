"use client";

import { CheckCircle2, Layers3, Lock, LogIn, Sparkles } from "lucide-react";

const STATUS_META = {
  LOCKED: {
    label: "LOCKED",
    icon: Lock,
    className: "bg-stone-100 text-stone-400 border-stone-200/60",
    iconClassName: "text-stone-400",
  },
  UNLOCKED: {
    label: "UNLOCKED",
    icon: Sparkles,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    iconClassName: "text-amber-600",
  },
  IN_PROGRESS: {
    label: "IN PROGRESS",
    icon: Sparkles,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    iconClassName: "text-amber-600",
  },
  COMPLETED: {
    label: "COMPLETED",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconClassName: "text-emerald-600",
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
      className={`bg-white border rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group ${
        isLocked
          ? "border-stone-200 opacity-75"
          : "border-stone-200/80 hover:shadow-lg hover:-translate-y-1"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md shrink-0 text-amber-700 bg-amber-50 flex items-center gap-1.5">
              <Layers3 className="w-3 h-3" />
              Tier {tier.level}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border truncate bg-stone-50 text-stone-700 border-stone-200">
              {tier.category?.name || "General"}
            </span>
          </div>

          {statusMeta && (
            <span
              className={`flex items-center gap-1 text-[10px] font-mono font-bold border px-2.5 py-1 rounded-full shrink-0 ${statusMeta.className}`}
            >
              {StatusIcon && <StatusIcon className={`w-3 h-3 shrink-0 ${statusMeta.iconClassName}`} />}
              {statusMeta.label}
            </span>
          )}
        </div>

        <h3 className="text-lg font-serif font-semibold tracking-tight mb-2 text-stone-900 group-hover:text-amber-800 transition-colors duration-250 line-clamp-2">
          {tier.name}
        </h3>
        <p className="text-xs font-mono text-stone-400 mb-3 tracking-tight truncate">
          Audience: {tier.audience || "All athletes"}
        </p>
        <p className="text-[13px] leading-relaxed line-clamp-3 font-light mb-4 text-stone-600">
          {tier.focus_description || "No focus description has been added for this tier yet."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-100">
        <span className="text-stone-400 text-[11px] font-mono">
          {pathwayCount} pathway{pathwayCount === 1 ? "" : "s"}
          {tier.estimated_duration ? ` · ${tier.estimated_duration}` : ""}
        </span>

        {isAuthenticated && progress && progress.status !== "LOCKED" ? (
          <span className="text-xs font-semibold font-mono text-amber-700 shrink-0">
            {Number(progress.progress_percentage)}% complete
          </span>
        ) : !isAuthenticated ? (
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 flex items-center gap-1 shrink-0">
            <LogIn className="w-3 h-3" />
            Sign in to track
          </span>
        ) : null}
      </div>
    </div>
  );
}
