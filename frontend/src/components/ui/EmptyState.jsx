"use client";

import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  label = "Nothing to show yet.",
  description,
  action,
  compact = false,
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 gap-2.5" : "py-12 gap-3"
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-stone-50 border border-stone-100 text-stone-400 flex items-center justify-center mb-1">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-medium text-stone-500">{label}</p>
      {description && (
        <p className="text-[11px] font-light text-stone-400 max-w-[220px] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
