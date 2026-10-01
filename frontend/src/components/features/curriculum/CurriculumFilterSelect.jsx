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
  // Selects without an "all" option (e.g. sort) are never shown as an active filter.
  const isActive = allLabel !== undefined && value !== "";

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-sans font-medium uppercase tracking-widest text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full appearance-none rounded-xl border bg-paper py-2.5 pl-3.5 pr-10 text-sm text-ink transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/40 disabled:cursor-not-allowed disabled:opacity-60 ${
            isActive ? "border-pine" : "border-line hover:border-ink/25"
          }`}
        >
          {allLabel !== undefined && <option value="">{allLabel}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
