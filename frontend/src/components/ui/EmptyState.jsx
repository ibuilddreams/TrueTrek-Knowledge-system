"use client";

import { Inbox } from "lucide-react";

// `tone` picks the palette: "porcelain" (the default, unchanged) for the
// screens still on the moss/pine system, "cobalt" for the pages moved onto
// the new design system.
export default function EmptyState({
  icon: Icon = Inbox,
  label = "Nothing to show yet.",
  description,
  action,
  compact = false,
  size = "base",
  tone = "porcelain",
}) {
  const isCobalt = tone === "cobalt";
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 gap-2.5" : "py-12 gap-3"
      }`}
    >
      <div
        className={`w-12 h-12 flex items-center justify-center mb-1 ${
          isCobalt
            ? "rounded-cn bg-cn-paper-3 text-cn-accent"
            : "rounded-2xl bg-porcelain border border-line text-muted"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p
        className={`${size === "lg" ? "text-sm" : "text-xs"} ${
          isCobalt ? "font-semibold text-cn-ink" : "font-medium text-muted"
        }`}
      >
        {label}
      </p>
      {description && (
        <p
          className={`${size === "lg" ? "text-xs" : "text-[11px]"} max-w-[220px] leading-relaxed ${
            isCobalt ? "text-cn-ink-2" : "font-light text-muted"
          }`}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
