"use client";

import { Plus, X } from "lucide-react";

export const MAX_LEARNING_OUTCOMES = 12;
export const MAX_LEARNING_OUTCOME_LENGTH = 300;

const FIELD_CLASS =
  "flex-1 min-w-0 px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium";

// Editable list of bullet points, shared by the admin and teacher course forms
// and by the admin pathway form. Blank rows are dropped on submit (see
// cleanLearningOutcomes). The label/hint/placeholder default to the original
// "What you'll learn" wording, so the course forms read exactly as before.
// Passing `label={null}` / `hint={null}` suppresses them, for callers that
// frame the editor with their own heading.
export default function LearningOutcomesField({
  values,
  onChange,
  disabled = false,
  error,
  label = "What you'll learn",
  hint,
  placeholderExample = "Build a complete project from scratch",
  max = MAX_LEARNING_OUTCOMES,
}) {
  const updateAt = (index, text) =>
    onChange(values.map((value, position) => (position === index ? text : value)));
  const removeAt = (index) => onChange(values.filter((_, position) => position !== index));
  const add = () => onChange([...values, ""]);

  return (
    <div>
      {label && <label className={LABEL_CLASS}>{label}</label>}
      {hint !== null && (
        <p className="text-[11px] font-mono text-muted mb-2.5">
          {hint || `Key takeaways shown on the course page (up to ${max}).`}
        </p>
      )}

      {values.length > 0 && (
        <ul className="space-y-2 mb-2.5">
          {values.map((value, index) => (
            <li key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={value}
                onChange={(event) => updateAt(index, event.target.value)}
                disabled={disabled}
                maxLength={MAX_LEARNING_OUTCOME_LENGTH}
                placeholder={`Point ${index + 1}, e.g. ${placeholderExample}`}
                aria-label={`Learning point ${index + 1}`}
                className={FIELD_CLASS}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                aria-label={`Remove learning point ${index + 1}`}
                className="shrink-0 p-2.5 rounded-xl border border-line text-muted hover:text-clay hover:bg-porcelain transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={add}
        disabled={disabled || values.length >= max}
        className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-pine hover:text-moss disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <Plus className="w-3.5 h-3.5" />
        Add point
      </button>

      {error && <p className="text-[11px] font-mono text-red-600 mt-1">{error}</p>}
    </div>
  );
}

// Trims each point and drops blanks — what actually gets sent to the API.
export function cleanLearningOutcomes(values) {
  return values.map((value) => value.trim()).filter(Boolean);
}
