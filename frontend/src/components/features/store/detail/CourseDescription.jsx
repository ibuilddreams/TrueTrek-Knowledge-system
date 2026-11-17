"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { parseCourseDescription } from "@/lib/courseDescription";
import CourseSectionHeading from "./CourseSectionHeading";

const COLLAPSE_THRESHOLD = 600;

// Description prose, followed by the catalog metadata (provider, credits,
// grades, subject, format) as a "Course details" list when present.
export default function CourseDescription({ description }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { summary, facts } = useMemo(() => parseCourseDescription(description), [description]);
  const isLong = summary.length > COLLAPSE_THRESHOLD;

  return (
    <section aria-labelledby="course-description-heading">
      <CourseSectionHeading tone="cobalt" id="course-description-heading">Description</CourseSectionHeading>

      {summary ? (
        <>
          <p
            className={`text-[15px] leading-relaxed text-cn-ink-2 whitespace-pre-line ${
              isLong && !isExpanded ? "line-clamp-6" : ""
            }`}
          >
            {summary}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setIsExpanded((value) => !value)}
              aria-expanded={isExpanded}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-cn-accent hover:text-cn-accent-2 transition"
            >
              {isExpanded ? "Show less" : "Show more"}
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </>
      ) : (
        facts.length === 0 && (
          <p className="text-sm text-cn-muted">No description has been added for this course yet.</p>
        )
      )}

      {facts.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-px overflow-hidden rounded-cn border border-cn-rule bg-cn-rule shadow-cn-1">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-white px-4 py-3.5">
              <dt className="text-xs font-semibold tracking-widest uppercase text-cn-muted">
                {fact.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-cn-ink break-words">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
