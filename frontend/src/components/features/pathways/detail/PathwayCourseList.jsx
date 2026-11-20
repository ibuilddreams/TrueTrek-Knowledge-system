"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import PathwayCourseOutline from "./PathwayCourseOutline";

// The design's `.cdmods`: one bordered block, a row per item, each opening in
// place. On a course page those rows are modules; here they are the courses
// the bundle holds, in the order they are meant to be taken.
export default function PathwayCourseList({ courses }) {
  const ordered = [...(courses || [])].sort((a, b) => a.order - b.order);
  const [openIds, setOpenIds] = useState(() => new Set());

  const allOpen = ordered.length > 0 && openIds.size === ordered.length;

  function toggle(id) {
    setOpenIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (ordered.length === 0) {
    return (
      <div className="grid gap-4">
        <h2 className="text-cn-2xl font-extrabold tracking-[-0.02em] text-cn-ink">
          Courses in this pathway
        </h2>
        <p className="rounded-cn-lg border border-cn-rule p-10 text-cn-ink-2">
          No courses have been added to this pathway yet.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="pathway-courses-heading" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2
          id="pathway-courses-heading"
          className="text-cn-2xl font-extrabold tracking-[-0.02em] text-cn-ink"
        >
          Courses in this pathway
        </h2>
        {ordered.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setOpenIds(allOpen ? new Set() : new Set(ordered.map((entry) => entry.id)))
            }
            className="shrink-0 text-cn-sm font-semibold text-cn-accent hover:underline"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-cn-lg border border-cn-rule">
        {ordered.map((entry, index) => {
          const course = entry.course || {};
          const isOpen = openIds.has(entry.id);
          return (
            <div
              key={entry.id}
              className="border-t border-cn-rule first:border-t-0"
            >
              <button
                type="button"
                onClick={() => toggle(entry.id)}
                aria-expanded={isOpen}
                className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 bg-cn-paper-2 px-6 py-4 text-left"
              >
                <span className="text-cn-xs font-semibold text-cn-muted tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="grid min-w-0 gap-0.5">
                  <span className="truncate font-semibold text-cn-ink">
                    {course.title || "Course"}
                  </span>
                  {course.code && (
                    <span className="text-cn-xs text-cn-muted">{course.code}</span>
                  )}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-[18px] w-[18px] flex-none text-cn-muted transition-transform duration-150 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && <PathwayCourseOutline slug={course.slug} isOpen={isOpen} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
