"use client";

import { useMemo } from "react";
import { parseCourseDescription } from "@/lib/courseDescription";

// The catalog authors a description as a focus statement, labelled sections
// ("Core competencies: ...") and a trailing metadata line. Render each prose
// block on its own so the dossier reads as a brief rather than one dense
// paragraph; the metadata line is dropped here, since the dossier already
// shows the course's level, code and category around this card.
export default function CourseOverview({ description }) {
  const { paragraphs } = useMemo(() => parseCourseDescription(description), [description]);

  return (
    <div className="space-y-4">
      <h4 className="font-serif font-bold text-ink text-sm">About this course</h4>

      {paragraphs.length === 0 ? (
        <p className="text-sm text-muted font-light leading-relaxed">
          No course description has been added yet.
        </p>
      ) : (
        <div className="space-y-4">
          {paragraphs.map((paragraph, index) =>
            paragraph.label ? (
              <div key={`${paragraph.label}-${index}`} className="space-y-1.5">
                <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-pine/80">
                  {paragraph.label}
                </p>
                <p className="text-sm text-muted font-light leading-relaxed">{paragraph.text}</p>
              </div>
            ) : (
              <p
                key={`prose-${index}`}
                className={
                  index === 0
                    ? "text-[15px] text-ink/90 font-light leading-relaxed"
                    : "text-sm text-muted font-light leading-relaxed"
                }
              >
                {paragraph.text}
              </p>
            ),
          )}
        </div>
      )}
    </div>
  );
}
