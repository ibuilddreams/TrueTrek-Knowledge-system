"use client";

import { ChevronDown } from "lucide-react";

export default function CurriculumFilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  allLabel,
  disabled = false,
}) {
  // Every select is styled identically whether or not it is narrowing the
  // results. The "Reset (n)" button beside them already says how many filters
  // are on, so a separately coloured control only read as out of place.
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label
        htmlFor={id}
        className="pl-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full truncate appearance-none rounded-lg border border-zinc-200 bg-zinc-50/70 pl-3 pr-8 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {allLabel !== undefined && <option value="">{allLabel}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
      </div>
    </div>
  );
}
