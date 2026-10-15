"use client";

import { Heart, RotateCcw, Search } from "lucide-react";
import CurriculumFilterSelect from "./CurriculumFilterSelect";

const SORT_OPTIONS = [
  { value: "title", label: "Title A–Z" },
  { value: "-title", label: "Title Z–A" },
  { value: "newest", label: "Newest" },
];

export default function CurriculumFilters({
  filters,
  search,
  onSearchChange,
  onFilterChange,
  onClear,
  subjects = [],
  tiers = [],
  difficulties = [],
  savedCount,
  savedOnly,
  onToggleSaved,
}) {
  const activeCount = [filters.category, filters.difficulty, filters.tier].filter(Boolean).length;

  return (
    <div
      id="curriculum-filters"
      className="rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[0_2px_12px_rgba(24,24,27,0.03)] sm:p-4"
    >
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <CurriculumFilterSelect
          id="curriculum-filter-tier"
          label="Tier"
          value={filters.tier}
          onChange={(value) => onFilterChange("tier", value)}
          allLabel="All tiers"
          options={tiers.map((tier) => ({ value: tier.slug, label: `Tier ${tier.level}: ${tier.name}` }))}
        />
        <CurriculumFilterSelect
          id="curriculum-filter-subject"
          label="Subject"
          value={filters.category}
          onChange={(value) => onFilterChange("category", value)}
          allLabel="All subjects"
          options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
        />
        <CurriculumFilterSelect
          id="curriculum-filter-difficulty"
          label="Difficulty"
          value={filters.difficulty}
          onChange={(value) => onFilterChange("difficulty", value)}
          allLabel="All levels"
          options={difficulties.map((level) => ({ value: level.value, label: level.label }))}
        />
        <CurriculumFilterSelect
          id="curriculum-filter-sort"
          label="Sort by"
          value={filters.sort}
          onChange={(value) => onFilterChange("sort", value)}
          options={SORT_OPTIONS}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
        <label className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <span className="sr-only">Search courses</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search courses…" className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50/70 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        </label>
        <button
          type="button"
          aria-pressed={savedOnly}
          title="Courses saved in this browser"
          onClick={onToggleSaved}
          className={`flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
            savedOnly ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          <Heart aria-hidden="true" className={`h-3.5 w-3.5 ${savedOnly ? "fill-current" : ""}`} />
          Saved ({savedCount})
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
