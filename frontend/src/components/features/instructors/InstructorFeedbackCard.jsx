"use client";

import { useState } from "react";
import { Quote } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import { formatRelativeTime } from "@/lib/relativeTime";

const CLAMP_THRESHOLD = 220;

// One student feedback card: rating, relative date, comment and the course it
// was left for. Student names arrive already shortened ("Dot B.").
// `tone` is the palette: "porcelain" (the default, unchanged) on the public
// instructor page, "cobalt" inside the teacher portal.
export default function InstructorFeedbackCard({ feedback, className = "", tone = "porcelain" }) {
  const isCobalt = tone === "cobalt";
  const [isExpanded, setIsExpanded] = useState(false);
  const comment = (feedback.comment || "").trim();
  const isLong = comment.length > CLAMP_THRESHOLD;

  return (
    <li
      className={`flex flex-col border p-6 ${
        isCobalt
          ? "rounded-cn-p border-cn-p-line bg-cn-p-card"
          : "rounded-card border-line bg-paper shadow-soft"
      } ${className}`}
    >
      <Quote
        className={`w-7 h-7 ${isCobalt ? "text-cn-p-accent-soft fill-cn-p-soft" : "text-gold/50 fill-gold/20"}`}
        aria-hidden="true"
      />

      <div className="mt-3 flex items-center gap-2.5">
        <StarRating value={feedback.rating} compact />
        <span className={`text-sm font-semibold ${isCobalt ? "text-cn-p-ink" : "text-ink"}`}>
          {Number(feedback.rating).toFixed(1)}
        </span>
        <span className={`text-xs ${isCobalt ? "text-cn-p-muted" : "text-muted"}`}>
          {formatRelativeTime(feedback.created_at)}
        </span>
      </div>

      <div className="mt-3 flex-1">
        {comment ? (
          <>
            <p
              className={`text-sm leading-relaxed whitespace-pre-line ${isCobalt ? "text-cn-p-ink-2" : "text-ink/80"} ${
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
                className={`mt-1 text-xs font-semibold underline ${isCobalt ? "text-cn-p-accent hover:text-cn-p-accent-hover" : "text-pine hover:text-moss"}`}
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </>
        ) : (
          <p className={`text-sm italic ${isCobalt ? "text-cn-p-ink-2" : "text-muted"}`}>
            Left a rating without a comment.
          </p>
        )}
      </div>

      <div className={`mt-4 pt-4 border-t ${isCobalt ? "border-cn-p-line" : "border-line"}`}>
        <p className={`text-sm font-semibold ${isCobalt ? "text-cn-p-ink" : "text-ink"}`}>
          {feedback.student_name}
        </p>
        {feedback.course?.title && (
          <p className={`mt-0.5 text-[11px] leading-snug line-clamp-2 ${isCobalt ? "text-cn-p-muted" : "text-muted"}`}>
            Course: {feedback.course.title}
          </p>
        )}
      </div>
    </li>
  );
}
