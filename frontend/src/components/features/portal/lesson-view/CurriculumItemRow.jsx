"use client";

import { CheckCircle2, Circle } from "lucide-react";

export default function CurriculumItemRow({
  icon: Icon,
  iconClassName,
  title,
  meta,
  statusLabel,
  statusClassName,
  isCompleted,
  isActive,
  onClick,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-current={isActive ? "true" : undefined}
      className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors group border disabled:cursor-default disabled:opacity-50 ${
        isActive
          ? "bg-pine/10 border-pine/20"
          : "border-transparent hover:bg-porcelain disabled:hover:bg-transparent"
      }`}
    >
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${iconClassName}`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[12.5px] font-medium truncate transition-colors ${
            isActive
              ? "text-pine"
              : "text-muted group-hover:text-pine"
          }`}
        >
          {title}
        </span>
        {meta ? (
          <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider mt-0.5 text-muted">
            {meta}
          </span>
        ) : null}
      </span>
      {statusLabel ? (
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border shrink-0 ${statusClassName}`}
        >
          {statusLabel}
        </span>
      ) : isCompleted ? (
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
      ) : (
        <Circle className="w-4 h-4 shrink-0 text-muted" />
      )}
    </button>
  );
}
