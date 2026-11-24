"use client";

import {
  AlertTriangle,
  CircleSlash,
  ExternalLink,
  ListChecks,
  Quote,
  RotateCcw,
  ThumbsUp,
} from "lucide-react";
import { formatDateTime } from "@/lib/adminFormatters";
import BrandScoreGauge from "./BrandScoreGauge";
import ReviewFindingList from "./ReviewFindingList";

export default function MediaKitReviewResult({ review, onStartOver }) {
  const missing = review.missing_elements || [];

  return (
    <div className="space-y-5">
      <div className="relative bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm p-6 overflow-hidden">

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <BrandScoreGauge score={review.overall_score} verdict={review.verdict} />

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
              <h3 className="text-lg font-light text-cn-p-ink">Your brand review</h3>
              {review.file_url && (
                <a
                  href={review.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cn-p-accent hover:text-cn-p-accent transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  {review.original_name || "View media kit"}
                </a>
              )}
            </div>

            {review.summary && (
              <p className="text-sm text-cn-p-ink-2 font-light leading-relaxed">{review.summary}</p>
            )}

            <p className="text-[11px] text-cn-p-ink-2 font-light mt-3">
              Reviewed {formatDateTime(review.completed_at || review.created_at)}
            </p>

            <button
              type="button"
              onClick={onStartOver}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-cn-p-line text-cn-p-ink-2 hover:text-cn-p-ink hover:bg-cn-p-page font-bold tabular-nums text-xs  rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Review a new version
            </button>
          </div>
        </div>
      </div>

      {review.sponsor_verdict && (
        <div className="relative bg-cn-p-page border border-cn-p-line rounded-2xl p-6 overflow-hidden">
          <div className="flex gap-4">
            <Quote className="w-6 h-6 shrink-0 text-cn-p-warn" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-cn-p-ink-2 mb-2">
                What the sponsor said
              </p>
              <p className="text-sm text-cn-p-ink font-light italic leading-relaxed">
                {review.sponsor_verdict}
              </p>
            </div>
          </div>
        </div>
      )}

      <ReviewFindingList
        title="Fix these first"
        icon={ListChecks}
        findings={review.recommendations || []}
        tone="neutral"
        numbered
        emptyLabel="No recommendations were returned for this kit."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ReviewFindingList
          title="What's working"
          icon={ThumbsUp}
          findings={review.strengths || []}
          tone="positive"
          emptyLabel="No strengths were identified — start with the fixes above."
        />
        <ReviewFindingList
          title="What's holding you back"
          icon={AlertTriangle}
          findings={review.weaknesses || []}
          tone="negative"
          emptyLabel="No weaknesses were flagged."
        />
      </div>

      {missing.length > 0 && (
        <div className="bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl border bg-cn-p-bad-bg text-cn-p-bad border-transparent flex items-center justify-center shrink-0">
              <CircleSlash className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-cn-p-ink">Missing from your kit</h3>
            <span className="ml-auto text-[11px] tabular-nums text-cn-p-ink-2">{missing.length}</span>
          </div>

          <ul className="flex flex-wrap gap-2">
            {missing.map((element) => (
              <li
                key={element}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-sans border bg-cn-p-bad-bg text-cn-p-bad border-cn-p-bad-bg"
              >
                {element}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
