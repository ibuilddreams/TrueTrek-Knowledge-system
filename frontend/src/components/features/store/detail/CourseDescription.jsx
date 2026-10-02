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
      <CourseSectionHeading id="course-description-heading">Description</CourseSectionHeading>

      {summary ? (
        <>
          <p
            className={`text-[15px] leading-relaxed text-ink/90 whitespace-pre-line ${
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
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pine hover:text-moss transition"
            >
              {isExpanded ? "Show less" : "Show more"}
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </button>
          )}
        </>
      ) : (
        facts.length === 0 && (
          <p className="text-sm text-muted">No description has been added for this course yet.</p>
        )
      )}

      {facts.length > 0 && (
        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-px overflow-hidden rounded-card border border-line bg-line shadow-soft">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-paper px-4 py-3.5">
              <dt className="text-[10px] font-sans font-medium uppercase tracking-widest text-muted">
                {fact.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink break-words">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
