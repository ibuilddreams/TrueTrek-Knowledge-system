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
  isVault,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors group border ${
        isActive
          ? isVault
            ? "bg-amber-500/10 border-amber-500/40"
            : "bg-amber-50/80 border-amber-300"
          : isVault
            ? "border-transparent hover:bg-white/5"
            : "border-transparent hover:bg-stone-50"
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
              ? isVault
                ? "text-amber-300"
                : "text-amber-800"
              : isVault
                ? "text-stone-200 group-hover:text-amber-400"
                : "text-stone-700 group-hover:text-amber-800"
          }`}
        >
          {title}
        </span>
        {meta ? (
          <span
            className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider mt-0.5 ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            {meta}
          </span>
        ) : null}
      </span>
      {statusLabel ? (
        <span
          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border shrink-0 ${statusClassName}`}
        >
          {statusLabel}
        </span>
      ) : isCompleted ? (
        <CheckCircle2
          className={`w-4 h-4 shrink-0 ${isVault ? "text-emerald-400" : "text-emerald-600"}`}
        />
      ) : (
        <Circle className={`w-4 h-4 shrink-0 ${isVault ? "text-stone-700" : "text-stone-200"}`} />
      )}
    </button>
  );
}
