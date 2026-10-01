"use client";

import { Heart, RotateCcw } from "lucide-react";
import CurriculumFilterSelect from "./CurriculumFilterSelect";

const SORT_OPTIONS = [
  { value: "title", label: "Title A–Z" },
  { value: "-title", label: "Title Z–A" },
  { value: "newest", label: "Newest" },
];

export default function CurriculumFilters({
  filters,
  onFilterChange,
  onClear,
  subjects = [],
  grades = [],
  difficulties = [],
  savedCount,
  savedOnly,
  onToggleSaved,
}) {
  const activeCount = [filters.category, filters.grade, filters.difficulty].filter(Boolean).length;

  return (
    <div
      id="curriculum-filters"
      className="mt-8 rounded-2xl border border-line bg-paper/70 p-4 sm:p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CurriculumFilterSelect
          id="curriculum-filter-subject"
          label="Subject"
          value={filters.category}
          onChange={(value) => onFilterChange("category", value)}
          allLabel="All subjects"
          options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
        />
        <CurriculumFilterSelect
          id="curriculum-filter-grade"
          label="Grade level"
          value={filters.grade}
          onChange={(value) => onFilterChange("grade", value)}
          allLabel="All grades"
          options={grades.map((grade) => ({ value: String(grade.value), label: grade.label }))}
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

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <button
          type="button"
          aria-pressed={savedOnly}
          title="Courses saved in this browser"
          onClick={onToggleSaved}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition ${
            savedOnly ? "border-pine bg-pine text-paper" : "border-line bg-paper hover:border-ink/25"
          }`}
        >
          <Heart className="h-4 w-4" />
          Saved ({savedCount})
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="ml-auto flex items-center gap-1.5 text-xs font-sans font-medium uppercase tracking-widest text-muted transition hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear filters ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
