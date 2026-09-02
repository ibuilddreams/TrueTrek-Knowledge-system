"use client";

import { useState } from "react";
import { ChevronDown, Compass } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getInitials } from "@/lib/curriculum";

function PathwayCourseRow({ course }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 overflow-hidden bg-porcelain text-muted border-line">
        {course.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[11px] font-sans font-semibold">{getInitials(course.title)}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium truncate text-ink">
          {course.title}
        </span>
        {course.code && (
          <span className="block text-[11px] font-sans uppercase tracking-widest font-medium text-muted mt-0.5">
            {course.code}
          </span>
        )}
      </span>
    </div>
  );
}

function PathwayRow({ tierPathway, isExpanded, onToggle }) {
  const pathway = tierPathway.pathway;
  const courses = pathway.courses || [];

  return (
    <div className="rounded-2xl border overflow-hidden border-line bg-porcelain/60">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full text-left p-4 space-y-2 transition-colors hover:bg-porcelain"
      >
        <div className="flex items-start justify-between gap-3">
          <h5 className="font-serif font-light truncate text-ink">
            {pathway.name}
          </h5>
          <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </div>
        <p className="flex items-center gap-1 text-[11px] font-sans uppercase tracking-widest font-medium text-muted">
          <Compass className="w-3 h-3" />
          {pathway.course_count} course{pathway.course_count === 1 ? "" : "s"}
        </p>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-3 pt-1 border-t border-line">
              {courses.length > 0 ? (
                <div className="space-y-0.5">
                  {courses.map((course) => (
                    <PathwayCourseRow key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <p className="px-2 pt-2 text-xs font-light text-muted">
                  Courses for this pathway are being finalized.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TierPathwayAccordion({ pathways }) {
  const [expandedIds, setExpandedIds] = useState(
    () => new Set(pathways.map((tierPathway) => tierPathway.id))
  );

  function toggle(tierPathwayId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tierPathwayId)) {
        next.delete(tierPathwayId);
      } else {
        next.add(tierPathwayId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {pathways.map((tierPathway) => (
        <PathwayRow
          key={tierPathway.id}
          tierPathway={tierPathway}
          isExpanded={expandedIds.has(tierPathway.id)}
          onToggle={() => toggle(tierPathway.id)}
        />
      ))}
    </div>
  );
}
