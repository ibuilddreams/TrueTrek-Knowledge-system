"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// `tone` picks the palette: "porcelain" (the default, unchanged) for the
// screens still on the moss/pine system, "cobalt" for the pages moved onto
// the new design system.
export default function Pagination({ page, totalPages, onPageChange, totalLabel, size = "base", tone = "porcelain" }) {
  if (totalPages <= 1 && !totalLabel) return null;

  const isCobalt = tone === "cobalt";
  const rule = isCobalt ? "border-cn-rule" : "border-line";
  const quiet = isCobalt ? "text-cn-muted" : "text-muted";
  const stepper = isCobalt
    ? "border-cn-rule-strong bg-white text-cn-ink shadow-cn-1 enabled:hover:border-cn-ink"
    : "border-line text-muted hover:bg-porcelain";

  return (
    <div className={`flex items-center justify-between gap-4 pt-4 mt-2 border-t ${rule}`}>
      {totalLabel && (
        <p className={`${size === "lg" ? "text-xs" : "text-[11px]"} font-sans ${quiet}`}>
          {totalLabel}
        </p>
      )}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={`flex items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${isCobalt ? "h-10 w-10 rounded-cn-sm" : "h-8 w-8"} ${stepper}`}
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className={`${size === "lg" ? "text-sm" : "text-xs"} font-sans font-semibold min-w-[3.5rem] text-center tabular-nums ${isCobalt ? "text-cn-ink" : "text-ink"}`}
          >
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={`flex items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 ${isCobalt ? "h-10 w-10 rounded-cn-sm" : "h-8 w-8"} ${stepper}`}
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
