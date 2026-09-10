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
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-2.5 space-y-1.5 -mt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-semibold text-amber-800">
          <Sparkles className="w-3 h-3" />
          {heading}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          title="Dismiss suggestions"
          aria-label="Dismiss suggestions"
          className="w-5 h-5 flex items-center justify-center rounded-md text-amber-700 hover:bg-amber-100 transition cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-1 text-xs font-mono text-amber-700">
          <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          Generating suggestions...
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex items-center justify-between gap-2 py-0.5">
          <p className="text-xs font-mono text-amber-800">Couldn&apos;t generate suggestions right now.</p>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider text-amber-800 border border-amber-300 hover:bg-amber-100 transition cursor-pointer"
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
              className={`w-full text-left px-2.5 py-2 rounded-md border border-amber-200 bg-white hover:border-amber-500 hover:bg-amber-50 transition cursor-pointer text-xs font-mono text-stone-700 leading-relaxed ${
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
