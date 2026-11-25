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
import { CN_BTN_PRIMARY, CN_BTN_SECONDARY } from "@/components/ui/cobaltStyles";

const FIELD_CLASS =
  "w-full rounded-cn-sm border border-cn-rule-strong bg-white px-3.5 py-2.5 text-sm text-cn-ink transition outline-none placeholder:text-cn-muted focus:border-cn-accent";

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
      className="space-y-5 rounded-cn-lg border border-cn-rule bg-white p-5 shadow-cn-1 lg:sticky lg:top-24"
    >
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-cn-sm bg-cn-accent text-white">
          {isEditing ? <Wand2 className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <h2 className="text-cn-base font-bold tracking-[-0.015em] text-cn-ink">
            {isEditing ? "Editing your pathway" : "Your pathway"}
          </h2>
          <p className="text-[13px] text-cn-muted">
            {courseCount} of {MAX_CUSTOM_PATHWAY_COURSES} courses
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="custom-pathway-name"
            className="mb-1.5 block text-[13px] font-semibold text-cn-ink"
          >
            Pathway name
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
            className="mb-1.5 block text-[13px] font-semibold text-cn-ink"
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

      <div className="rounded-cn border border-cn-rule bg-cn-paper-2 p-3.5">
        {courseCount === 0 ? (
          <EmptyState
            tone="cobalt"
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
                className="flex items-center gap-2.5 rounded-cn-sm border border-cn-rule bg-white px-2.5 py-2 text-[13px]"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-cn-paper-3 text-[10px] font-semibold text-cn-accent">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-cn-ink">{course.title}</span>
                <span className="shrink-0 tabular-nums text-cn-muted">
                  {formatCoursePrice(course.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveCourse(course.id)}
                  aria-label={`Remove ${course.title} from your pathway`}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-cn-muted transition hover:bg-cn-paper-3 hover:text-cn-live focus:outline-none focus-visible:outline-2 focus-visible:outline-cn-accent"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {courseCount > 0 && (
          <>
            <div className="mt-3 flex items-center justify-between border-t border-cn-rule pt-3 text-sm">
              <span className="font-semibold text-cn-ink">Bundle total</span>
              <span className="text-cn-base font-extrabold tracking-[-0.03em] tabular-nums text-cn-ink">
                {formatCoursePrice(total)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearAll}
              className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-cn-muted transition-colors hover:text-cn-live"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          </>
        )}
      </div>

      {hint && (
        <p className="text-[13px] leading-relaxed text-cn-ink-2">{hint}</p>
      )}

      <div className="flex flex-col gap-2.5">
        {isEditing ? (
          <>
            <button
              id="custom-pathway-save-changes-btn"
              type="button"
              onClick={() => onSubmit({ checkoutAfterSave: false })}
              disabled={!canSave}
              className={`${CN_BTN_PRIMARY} w-full`}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSaving}
              className="w-full text-center text-sm font-semibold text-cn-muted transition-colors hover:text-cn-ink disabled:opacity-60"
            >
              Cancel editing
            </button>
          </>
        ) : (
          <>
            <button
              id="custom-pathway-create-and-buy-btn"
              type="button"
              onClick={() => onSubmit({ checkoutAfterSave: true })}
              disabled={!canSave}
              className={`${CN_BTN_PRIMARY} w-full`}
            >
              <ShoppingBag className="w-4 h-4" />
              {isSaving ? "Saving..." : "Create & buy"}
            </button>
            <button
              id="custom-pathway-save-for-later-btn"
              type="button"
              onClick={() => onSubmit({ checkoutAfterSave: false })}
              disabled={!canSave}
              className={`${CN_BTN_SECONDARY} w-full`}
            >
              Save for later
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
