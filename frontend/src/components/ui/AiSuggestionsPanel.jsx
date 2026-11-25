"use client";

import { RefreshCw, Sparkles, X } from "lucide-react";

export default function AiSuggestionsPanel({
  heading,
  suggestions = [],
  isLoading,
  isError,
  onRetry,
  onSelect,
  onDismiss,
  multiline = false,
}) {
  return (
    <div className="rounded-lg border border-cn-p-soft bg-cn-p-soft p-2.5 space-y-1.5 -mt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-cn-p-soft-ink">
          <Sparkles className="w-3 h-3" />
          {heading}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          title="Dismiss suggestions"
          aria-label="Dismiss suggestions"
          className="w-5 h-5 flex items-center justify-center rounded-md text-cn-p-soft-ink hover:bg-cn-p-soft transition cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-1 text-xs text-cn-p-soft-ink">
          <div className="w-3 h-3 border-2 border-cn-p-soft border-t-transparent rounded-full animate-spin" />
          Generating suggestions...
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex items-center justify-between gap-2 py-0.5">
          <p className="text-xs text-cn-p-soft-ink">Couldn&apos;t generate suggestions right now.</p>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider text-cn-p-soft-ink border border-cn-p-soft hover:bg-cn-p-soft transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && suggestions.length > 0 && (
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              type="button"
              onClick={() => onSelect(suggestion)}
              className={`w-full text-left px-2.5 py-2 rounded-md border border-cn-p-soft bg-cn-p-card hover:border-cn-p-accent-soft hover:bg-cn-p-soft transition cursor-pointer text-xs text-cn-p-ink-2 leading-relaxed ${
 multiline ? "line-clamp-3" : "truncate"
 }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
