"use client";

import { Layers, ShoppingBag, Trash2, Wand2, X } from "lucide-react";
import {
  CUSTOM_PATHWAY_NAME_MAX_LENGTH,
  CUSTOM_PATHWAY_SUMMARY_MAX_LENGTH,
  MAX_CUSTOM_PATHWAY_COURSES,
  MIN_CUSTOM_PATHWAY_COURSES,
} from "@/constants/pathways";
import { formatCoursePrice } from "@/lib/store";
import EmptyState from "@/components/ui/EmptyState";

const FIELD_CLASS =
  "w-full px-3.5 py-2.5 bg-porcelain border border-line focus:border-moss rounded-xl text-xs font-sans text-ink placeholder:text-muted focus:outline-none focus:bg-paper transition";

// The builder's sticky side panel: name the bundle, review what's in it, and
// save it (optionally going straight to checkout). Pure presentation — all of
// the state lives in CustomPathwayBuilder.
export default function BuilderSummaryPanel({
  name,
  summary,
  selectedCourses,
  total,
  isEditing = false,
  isSaving = false,
  onNameChange,
  onSummaryChange,
  onRemoveCourse,
  onClearAll,
  onSubmit,
  onCancelEdit,
}) {
  const courseCount = selectedCourses.length;
  const hasEnoughCourses = courseCount >= MIN_CUSTOM_PATHWAY_COURSES;
  const hasName = name.trim().length > 0;
  const canSave = hasEnoughCourses && hasName && !isSaving;

  let hint = null;
  if (!hasEnoughCourses) {
    hint = `Add at least ${MIN_CUSTOM_PATHWAY_COURSES} courses to build a pathway (${courseCount} added).`;
  } else if (!hasName) {
    hint = "Give your pathway a name to save it.";
  }

  return (
    <aside
      id="pathway-builder-summary-panel"
      className="lg:sticky lg:top-24 rounded-2xl border border-line bg-paper shadow-soft p-5 space-y-5"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-pine text-paper flex items-center justify-center shrink-0">
          {isEditing ? <Wand2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <h2 className="font-serif font-light text-ink leading-tight">
            {isEditing ? "Editing your pathway" : "Your pathway"}
          </h2>
          <p className="text-[10px] font-sans uppercase tracking-widest font-medium text-muted">
            {courseCount} of {MAX_CUSTOM_PATHWAY_COURSES} courses
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="custom-pathway-name"
            className="text-[9px] font-sans font-medium uppercase tracking-widest text-muted block mb-1.5"
          >
            Pathway Name
          </label>
          <input
            id="custom-pathway-name"
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={CUSTOM_PATHWAY_NAME_MAX_LENGTH}
            placeholder="e.g. My Robotics Track"
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label
            htmlFor="custom-pathway-summary"
            className="text-[9px] font-sans font-medium uppercase tracking-widest text-muted block mb-1.5"
          >
            Note <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            id="custom-pathway-summary"
            value={summary}
            onChange={(event) => onSummaryChange(event.target.value)}
            maxLength={CUSTOM_PATHWAY_SUMMARY_MAX_LENGTH}
            rows={2}
            placeholder="What is this pathway for?"
            className={`${FIELD_CLASS} resize-none`}
          />
        </div>
      </div>

      <div className="rounded-xl border border-line bg-porcelain/80 p-3.5">
        {courseCount === 0 ? (
          <EmptyState
            icon={Layers}
            compact
            label="No courses added yet"
            description="Pick courses from the list to start your bundle."
          />
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto scrollbar-hide">
            {selectedCourses.map((course, index) => (
              <li
                key={course.id}
                className="flex items-center gap-2.5 text-xs bg-paper border border-line rounded-lg px-2.5 py-2"
              >
                <span className="w-5 h-5 shrink-0 rounded-md bg-pine/10 text-pine font-sans text-[10px] font-semibold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink">{course.title}</span>
                <span className="shrink-0 font-sans text-muted">
                  {formatCoursePrice(course.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveCourse(course.id)}
                  aria-label={`Remove ${course.title} from your pathway`}
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-clay hover:bg-rose/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pine"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {courseCount > 0 && (
          <>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-line text-xs">
              <span className="font-sans font-medium text-ink">Bundle total</span>
              <span className="font-sans font-semibold text-moss text-sm">
                {formatCoursePrice(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearAll}
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-sans font-medium uppercase tracking-widest text-muted hover:text-clay transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          </>
        )}
      </div>

      {hint && (
        <p className="text-[11px] font-light leading-relaxed text-muted">{hint}</p>
      )}

      <div className="flex flex-col gap-2.5">
        {isEditing ? (
          <>
            <button
              id="custom-pathway-save-changes-btn"
              type="button"
              onClick={() => onSubmit({ checkoutAfterSave: false })}
              disabled={!canSave}
              className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper font-sans text-xs font-semibold uppercase tracking-widest py-3.5 rounded-full shadow-soft transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSaving}
              className="w-full text-center text-xs font-sans font-medium uppercase tracking-widest text-muted hover:text-ink transition-colors disabled:opacity-60"
            >
              Cancel Editing
            </button>
          </>
        ) : (
          <>
            <button
              id="custom-pathway-create-and-buy-btn"
              type="button"
              onClick={() => onSubmit({ checkoutAfterSave: true })}
              disabled={!canSave}
              className="w-full flex items-center justify-center gap-2 bg-gold hover:brightness-95 text-ink font-sans text-xs font-semibold uppercase tracking-widest py-3.5 rounded-full shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              {isSaving ? "Saving..." : "Create & Buy"}
            </button>
            <button
              id="custom-pathway-save-for-later-btn"
              type="button"
              onClick={() => onSubmit({ checkoutAfterSave: false })}
              disabled={!canSave}
              className="w-full flex items-center justify-center gap-2 bg-porcelain hover:bg-line/40 border border-line text-ink font-sans text-xs font-medium uppercase tracking-widest py-3.5 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Save For Later
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
