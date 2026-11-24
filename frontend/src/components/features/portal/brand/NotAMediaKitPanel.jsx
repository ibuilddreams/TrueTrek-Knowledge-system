"use client";

import { FileQuestion, RotateCcw } from "lucide-react";

/**
 * Shown when the review completed but the model judged the upload not to be
 * a media kit at all.
 *
 * This is deliberately not the FAILED state: nothing went wrong, so the
 * student is told what they actually sent rather than being shown a
 * misleading 0/100 with a list of "missing" sponsorship elements.
 */
export default function NotAMediaKitPanel({ review, onStartOver }) {
  return (
    <div className="relative bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm p-8 overflow-hidden text-center">

      <div className="w-14 h-14 mx-auto rounded-2xl bg-cn-p-warn-bg border border-cn-p-warn-bg text-cn-p-warn flex items-center justify-center mb-4">
        <FileQuestion className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-light text-cn-p-ink">
        That doesn&apos;t look like a media kit
      </h3>

      {review?.sponsor_verdict ? (
        <p className="text-sm text-cn-p-ink-2 font-light mt-2.5 max-w-md mx-auto leading-relaxed">
          {review.sponsor_verdict}
        </p>
      ) : (
        <p className="text-sm text-cn-p-ink-2 font-light mt-2.5 max-w-md mx-auto leading-relaxed">
          We couldn&apos;t find a sponsorship media kit on that page.
        </p>
      )}

      <div className="rounded-xl bg-cn-p-page border border-cn-p-line p-4 mt-6 text-left max-w-md mx-auto">
        <p className="text-[10px] font-semibold text-cn-p-ink-2 mb-2">
          A media kit should include
        </p>
        <ul className="text-xs text-cn-p-ink font-light space-y-1.5 leading-relaxed">
          <li>— Your name, sport, position and graduation year</li>
          <li>— A headshot or action photo</li>
          <li>— Follower counts and engagement numbers</li>
          <li>— What a sponsor gets in return</li>
          <li>— How to contact you</li>
        </ul>
      </div>

      {review?.original_name && (
        <p className="text-[11px] text-cn-p-ink-2 font-light mt-4">
          You uploaded: {review.original_name}
        </p>
      )}

      <button
        type="button"
        onClick={onStartOver}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white font-bold tabular-nums text-xs  rounded-lg transition cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Upload your media kit
      </button>
    </div>
  );
}
