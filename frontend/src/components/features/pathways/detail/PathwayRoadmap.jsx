"use client";

import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { formatCoursePrice } from "@/lib/store";
import PathwayCourseOutline from "./PathwayCourseOutline";
import PathwaySectionHeading from "./PathwaySectionHeading";

// The pathway as a route: numbered stops on a connected rail, each one a course
// that expands in place to reveal its modules and lessons. Expanding is
// deliberate — clicking a stop shows what's inside rather than navigating away
// to the course's own store page, so the pathway stays the thing being read.
export default function PathwayRoadmap({ courses }) {
  const ordered = [...(courses || [])].sort((a, b) => a.order - b.order);
  const [openIds, setOpenIds] = useState(() => new Set(ordered.slice(0, 1).map((e) => e.id)));

  const toggle = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOpen = ordered.length > 0 && openIds.size === ordered.length;

  return (
    <section aria-labelledby="pathway-roadmap-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PathwaySectionHeading id="pathway-roadmap-heading" eyebrow="The Route">
          Your course-by-course roadmap
        </PathwaySectionHeading>

        {ordered.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setOpenIds(allOpen ? new Set() : new Set(ordered.map((entry) => entry.id)))
            }
            className="mb-5 shrink-0 text-[11px] font-sans font-semibold uppercase tracking-widest text-moss hover:text-pine transition"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        )}
      </div>

      {ordered.length === 0 ? (
        <p className="rounded-card border border-line bg-paper p-6 text-sm text-muted shadow-soft">
          No courses have been added to this pathway yet.
        </p>
      ) : (
        <ol className="relative space-y-4">
          {/* The rail the stops hang off. Hidden on mobile where there's no room. */}
          <span
            aria-hidden="true"
            className="absolute left-5 top-6 bottom-6 hidden w-px bg-gradient-to-b from-moss/40 via-line to-transparent sm:block"
          />

          {ordered.map((entry, index) => {
            const course = entry.course || {};
            const isOpen = openIds.has(entry.id);
            const panelId = `pathway-stop-panel-${entry.id}`;

            return (
              <li key={entry.id} className="relative sm:pl-14">
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-5 hidden h-10 w-10 items-center justify-center rounded-full border font-sans text-xs font-bold tabular-nums transition sm:flex ${
                    isOpen
                      ? "border-moss bg-pine text-paper"
                      : "border-line bg-paper text-muted"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div
                  className={`overflow-hidden rounded-card border bg-paper shadow-soft transition ${
                    isOpen ? "border-moss/40" : "border-line hover:border-pine/25"
                  }`}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => toggle(entry.id)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-porcelain/50"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-porcelain">
                        {course.image ? (
                          <img
                            src={course.image}
                            alt=""
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <BookOpen className="h-4 w-4 text-muted" />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-lg font-light leading-tight tracking-tight text-ink">
                          {course.title}
                        </span>
                        <span className="mt-1 block text-xs font-sans text-muted">
                          <span className="sm:hidden">Step {index + 1} · </span>
                          {course.code ? `${course.code} · ` : ""}
                          {formatCoursePrice(course.amount)} separately
                        </span>
                      </span>

                      <span className="hidden shrink-0 text-[11px] font-sans font-semibold uppercase tracking-widest text-moss sm:block">
                        {isOpen ? "Hide" : "See inside"}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </h3>

                  <div id={panelId} hidden={!isOpen}>
                    <PathwayCourseOutline slug={course.slug} isOpen={isOpen} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
