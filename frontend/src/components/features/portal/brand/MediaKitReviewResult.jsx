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
      <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-80" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <BrandScoreGauge score={review.overall_score} verdict={review.verdict} />

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
              <h3 className="text-lg font-serif font-light text-ink">Your brand review</h3>
              {review.file_url && (
                <a
                  href={review.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-pine hover:text-moss transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  {review.original_name || "View media kit"}
                </a>
              )}
            </div>

            {review.summary && (
              <p className="text-sm text-muted font-light leading-relaxed">{review.summary}</p>
            )}

            <p className="text-[11px] text-muted font-light mt-3">
              Reviewed {formatDateTime(review.completed_at || review.created_at)}
            </p>

            <button
              type="button"
              onClick={onStartOver}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-line text-muted hover:text-ink hover:bg-porcelain font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Review a new version
            </button>
          </div>
        </div>
      </div>

      {review.sponsor_verdict && (
        <div className="relative bg-porcelain border border-line rounded-2xl p-6 overflow-hidden">
          <div className="flex gap-4">
            <Quote className="w-6 h-6 shrink-0 text-gold" />
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-2">
                What the sponsor said
              </p>
              <p className="text-sm text-ink font-light italic leading-relaxed">
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
        <div className="bg-paper border border-line rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl border bg-rose/35 text-clay border-clay/20 flex items-center justify-center shrink-0">
              <CircleSlash className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-serif font-bold text-ink">Missing from your kit</h3>
            <span className="ml-auto text-[11px] font-mono text-muted">{missing.length}</span>
          </div>

          <ul className="flex flex-wrap gap-2">
            {missing.map((element) => (
              <li
                key={element}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-sans border bg-rose/20 text-clay border-clay/20"
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
