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
    <div className="rounded-lg border border-gold/25 bg-gold/10 p-2.5 space-y-1.5 -mt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider font-semibold text-gold">
          <Sparkles className="w-3 h-3" />
          {heading}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          title="Dismiss suggestions"
          aria-label="Dismiss suggestions"
          className="w-5 h-5 flex items-center justify-center rounded-md text-gold hover:bg-gold/15 transition cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 py-1 text-xs font-mono text-gold">
          <div className="w-3 h-3 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          Generating suggestions...
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex items-center justify-between gap-2 py-0.5">
          <p className="text-xs font-mono text-gold">Couldn&apos;t generate suggestions right now.</p>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider text-gold border border-gold/30 hover:bg-gold/15 transition cursor-pointer"
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
              className={`w-full text-left px-2.5 py-2 rounded-md border border-gold/25 bg-paper hover:border-gold hover:bg-gold/10 transition cursor-pointer text-xs font-mono text-muted leading-relaxed ${
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
