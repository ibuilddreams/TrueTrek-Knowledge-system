"use client";

import { Check, Clock, ExternalLink, Paperclip, SkipForward } from "lucide-react";
import { getQuestCategoryMeta, QUEST_DIFFICULTY_TONE } from "./questConstants";

/**
 * One task on the daily dashboard.
 *
 * The primary action is a full-width "I Did This" button rather than a small
 * link: completing a quest is the single thing a student comes to this
 * screen to do, and the earlier compact variant left that unclear.
 */
export default function QuestTaskCard({ assignment, onComplete, onSkip, isBusy = false }) {
  const { quest } = assignment;
  const isCompleted = assignment.status === "COMPLETED";
  const isSkipped = assignment.status === "SKIPPED";

  const categoryMeta = getQuestCategoryMeta(quest.category);
  const CategoryIcon = categoryMeta.icon;

  return (
    <div
      className={`relative bg-paper border rounded-2xl shadow-sm p-5 flex flex-col gap-4 overflow-hidden transition-colors ${
        isCompleted ? "border-pine/30" : "border-line"
      } ${isSkipped ? "opacity-60" : ""}`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-80 ${
          isCompleted ? "from-pine via-moss to-pine" : "from-pine via-moss to-gold"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${categoryMeta.tone}`}
        >
          <CategoryIcon className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted font-semibold">
            {quest.category_display}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border shrink-0 ${
              QUEST_DIFFICULTY_TONE[quest.difficulty] || QUEST_DIFFICULTY_TONE.EASY
            }`}
          >
            {quest.difficulty_display}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-serif font-bold text-ink leading-snug">{quest.title}</h3>
        <p className="text-xs text-muted font-light mt-1.5 leading-relaxed">{quest.instructions}</p>
      </div>

      <div className="flex items-center gap-3 text-[11px]">
        <span className="font-mono font-bold text-ink tabular-nums">
          {isCompleted ? `+${assignment.points_awarded}` : `+${quest.points_reward}`}
          <span className="font-sans font-normal text-muted ml-1">pts</span>
        </span>
        <span className="inline-flex items-center gap-1 text-muted font-light">
          <Clock className="w-3 h-3" />
          {quest.estimated_minutes} min
        </span>
      </div>

      {isCompleted && assignment.reflection && (
        <div className="rounded-xl bg-porcelain border border-line p-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">Your note</p>
          <p className="text-xs text-ink font-light leading-relaxed">{assignment.reflection}</p>
        </div>
      )}

      {isCompleted && (assignment.proof_file_url || assignment.proof_url) && (
        <div className="flex flex-wrap items-center gap-3">
          {assignment.proof_file_url && (
            <a
              href={assignment.proof_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-pine hover:text-moss transition"
            >
              <Paperclip className="w-3 h-3" />
              {assignment.proof_original_name || "View proof"}
            </a>
          )}
          {assignment.proof_url && (
            <a
              href={assignment.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-pine hover:text-moss transition"
            >
              <ExternalLink className="w-3 h-3" />
              Open link
            </a>
          )}
        </div>
      )}

      <div className="mt-auto pt-1">
        {isCompleted ? (
          <div className="w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-semibold font-mono uppercase tracking-wider rounded-xl bg-sage/40 text-pine border border-pine/20">
            <Check className="w-4 h-4" />
            Completed
          </div>
        ) : isSkipped ? (
          <div className="w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-semibold font-mono uppercase tracking-wider rounded-xl bg-porcelain text-muted border border-line">
            Skipped for today
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onComplete?.(assignment)}
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-semibold font-mono uppercase tracking-wider rounded-xl bg-pine hover:bg-moss text-paper shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              I Did This
            </button>
            <button
              type="button"
              onClick={() => onSkip?.(assignment)}
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-[11px] font-mono uppercase tracking-wider rounded-lg text-muted hover:text-ink hover:bg-porcelain transition disabled:opacity-50 cursor-pointer"
            >
              <SkipForward className="w-3 h-3" />
              Skip for today
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
