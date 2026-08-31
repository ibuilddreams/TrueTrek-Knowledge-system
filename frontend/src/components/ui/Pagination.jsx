"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function Pagination({ page, totalPages, onPageChange, totalLabel, size = "base" }) {
  const { isVault } = useTheme();

  if (totalPages <= 1 && !totalLabel) return null;

  return (
    <div
      className={`flex items-center justify-between gap-4 pt-4 mt-2 border-t ${
        isVault ? "border-stone-800" : "border-stone-100"
      }`}
    >
      {totalLabel && (
        <p
          className={`${size === "lg" ? "text-xs" : "text-[11px]"} font-mono ${isVault ? "text-stone-500" : "text-stone-400"}`}
        >
          {totalLabel}
        </p>
      )}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
              isVault
                ? "border-stone-700 text-stone-300 hover:bg-white/5"
                : "border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className={`${size === "lg" ? "text-sm" : "text-xs"} font-mono font-semibold min-w-[3.5rem] text-center ${
              isVault ? "text-stone-300" : "text-stone-700"
            }`}
          >
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
              isVault
                ? "border-stone-700 text-stone-300 hover:bg-white/5"
                : "border-stone-200 text-stone-600 hover:bg-stone-50"
            }`}
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
