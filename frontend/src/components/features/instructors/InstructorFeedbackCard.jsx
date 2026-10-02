"use client";

import { useState } from "react";
import { Quote } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import { formatRelativeTime } from "@/lib/relativeTime";

const CLAMP_THRESHOLD = 220;

// One student feedback card: rating, relative date, comment and the course it
// was left for. Student names arrive already shortened ("Dot B.").
export default function InstructorFeedbackCard({ feedback, className = "" }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const comment = (feedback.comment || "").trim();
  const isLong = comment.length > CLAMP_THRESHOLD;

  return (
    <li
      className={`flex flex-col rounded-card border border-line bg-paper p-6 shadow-soft ${className}`}
    >
      <Quote className="w-7 h-7 text-gold/50 fill-gold/20" aria-hidden="true" />

      <div className="mt-3 flex items-center gap-2.5">
        <StarRating value={feedback.rating} compact />
        <span className="text-sm font-semibold text-ink">{Number(feedback.rating).toFixed(1)}</span>
        <span className="text-xs text-muted">{formatRelativeTime(feedback.created_at)}</span>
      </div>

      <div className="mt-3 flex-1">
        {comment ? (
          <>
            <p
              className={`text-sm leading-relaxed text-ink/80 whitespace-pre-line ${
                isLong && !isExpanded ? "line-clamp-5" : ""
              }`}
            >
              {comment}
            </p>
            {isLong && (
              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                aria-expanded={isExpanded}
                className="mt-1 text-xs font-semibold text-pine underline hover:text-moss"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </>
        ) : (
          <p className="text-sm italic text-muted">Left a rating without a comment.</p>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-line">
        <p className="text-sm font-semibold text-ink">{feedback.student_name}</p>
        {feedback.course?.title && (
          <p className="mt-0.5 text-[11px] text-muted leading-snug line-clamp-2">
            Course: {feedback.course.title}
          </p>
        )}
      </div>
    </li>
  );
}
