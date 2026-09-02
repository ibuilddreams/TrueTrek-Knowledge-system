"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange, totalLabel, size = "base" }) {
  if (totalPages <= 1 && !totalLabel) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-4 mt-2 border-t border-line">
      {totalLabel && (
        <p className={`${size === "lg" ? "text-xs" : "text-[11px]"} font-sans text-muted`}>
          {totalLabel}
        </p>
      )}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition border-line text-muted hover:bg-porcelain"
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className={`${size === "lg" ? "text-sm" : "text-xs"} font-sans font-semibold min-w-[3.5rem] text-center text-ink`}
          >
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition border-line text-muted hover:bg-porcelain"
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
