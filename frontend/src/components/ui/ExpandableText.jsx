"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Long text clamped to a few lines with a Show more / Show less toggle.
// Short text renders as-is, with no toggle. `lines` must be one of the
// literal clamp classes below so Tailwind can see them.
const CLAMP_CLASSES = {
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

export default function ExpandableText({
  text,
  lines = 4,
  threshold = 280,
  className = "",
  buttonClassName = "",
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const value = (text || "").trim();
  if (!value) return null;
  const isLong = value.length > threshold;

  return (
    <div>
      <p className={`whitespace-pre-line ${isLong && !isExpanded ? CLAMP_CLASSES[lines] : ""} ${className}`}>
        {value}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded((previous) => !previous)}
          aria-expanded={isExpanded}
          className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pine hover:text-moss transition ${buttonClassName}`}
        >
          {isExpanded ? "Show less" : "Show more"}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
