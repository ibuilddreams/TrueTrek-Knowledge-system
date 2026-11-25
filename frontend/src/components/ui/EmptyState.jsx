"use client";

import { Inbox } from "lucide-react";

// `tone` picks the palette: "porcelain" (the default, unchanged) for the
// screens still on the moss/pine system, "cobalt" for the public pages moved
// onto the new design system, and "portal" for the signed-in portals, which
// have their own `cn-p-*` token set rather than the marketing one.
export default function EmptyState({
  icon: Icon = Inbox,
  label = "Nothing to show yet.",
  description,
  action,
  compact = false,
  size = "base",
  tone = "porcelain",
}) {
  const isPortal = tone === "portal";
  const isCobalt = tone === "cobalt" || isPortal;
  const tile = isPortal
    ? "rounded-cn-p-sm bg-cn-p-soft text-cn-p-soft-ink"
    : "rounded-cn bg-cn-paper-3 text-cn-accent";
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 gap-2.5" : "py-12 gap-3"
      }`}
    >
      <div
        className={`w-12 h-12 flex items-center justify-center mb-1 ${
          isCobalt ? tile : "rounded-2xl bg-porcelain border border-line text-muted"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p
        className={`${size === "lg" ? "text-sm" : "text-xs"} ${
          isPortal
            ? "font-bold text-cn-p-ink"
            : isCobalt
              ? "font-semibold text-cn-ink"
              : "font-medium text-muted"
        }`}
      >
        {label}
      </p>
      {description && (
        <p
          className={`${size === "lg" ? "text-xs" : "text-[11px]"} max-w-[220px] leading-relaxed ${
            isPortal
              ? "text-cn-p-ink-2"
              : isCobalt
                ? "text-cn-ink-2"
                : "font-light text-muted"
          }`}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
