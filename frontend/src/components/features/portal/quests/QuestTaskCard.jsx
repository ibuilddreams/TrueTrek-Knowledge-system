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
      className={`relative bg-cn-p-card border rounded-2xl shadow-sm p-5 flex flex-col gap-4 overflow-hidden transition-colors ${
        isCompleted ? "border-cn-p-accent-soft" : "border-cn-p-line"
      } ${isSkipped ? "opacity-60" : ""}`}
    >

      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${categoryMeta.tone}`}
        >
          <CategoryIcon className="w-5 h-5" />
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-[10px] font-semibold text-cn-p-ink-2 font-semibold">
            {quest.category_display}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
              QUEST_DIFFICULTY_TONE[quest.difficulty] || QUEST_DIFFICULTY_TONE.EASY
            }`}
          >
            {quest.difficulty_display}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-bold text-cn-p-ink leading-snug">{quest.title}</h3>
        <p className="text-xs text-cn-p-ink-2 font-light mt-1.5 leading-relaxed">{quest.instructions}</p>
      </div>

      <div className="flex items-center gap-3 text-[11px]">
        <span className="font-bold text-cn-p-ink tabular-nums">
          {isCompleted ? `+${assignment.points_awarded}` : `+${quest.points_reward}`}
          <span className="font-sans font-normal text-cn-p-ink-2 ml-1">pts</span>
        </span>
        <span className="inline-flex items-center gap-1 text-cn-p-ink-2 font-light">
          <Clock className="w-3 h-3" />
          {quest.estimated_minutes} min
        </span>
      </div>

      {isCompleted && assignment.reflection && (
        <div className="rounded-xl bg-cn-p-page border border-cn-p-line p-3">
          <p className="text-[10px] font-semibold text-cn-p-ink-2 mb-1">Your note</p>
          <p className="text-xs text-cn-p-ink font-light leading-relaxed">{assignment.reflection}</p>
        </div>
      )}

      {isCompleted && (assignment.proof_file_url || assignment.proof_url) && (
        <div className="flex flex-wrap items-center gap-3">
          {assignment.proof_file_url && (
            <a
              href={assignment.proof_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cn-p-accent hover:text-cn-p-accent transition"
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
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cn-p-accent hover:text-cn-p-accent transition"
            >
              <ExternalLink className="w-3 h-3" />
              Open link
            </a>
          )}
        </div>
      )}

      <div className="mt-auto pt-1">
        {isCompleted ? (
          <div className="w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-semibold font-semibold rounded-xl bg-cn-p-soft text-cn-p-accent border border-cn-p-accent-soft">
            <Check className="w-4 h-4" />
            Completed
          </div>
        ) : isSkipped ? (
          <div className="w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-semibold font-semibold rounded-xl bg-cn-p-page text-cn-p-ink-2 border border-cn-p-line">
            Skipped for today
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onComplete?.(assignment)}
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-semibold font-semibold rounded-xl bg-cn-p-accent hover:bg-cn-p-accent-hover text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check className="w-4 h-4" />
              I Did This
            </button>
            <button
              type="button"
              onClick={() => onSkip?.(assignment)}
              disabled={isBusy}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold rounded-lg text-cn-p-ink-2 hover:text-cn-p-ink hover:bg-cn-p-page transition disabled:opacity-50 cursor-pointer"
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
