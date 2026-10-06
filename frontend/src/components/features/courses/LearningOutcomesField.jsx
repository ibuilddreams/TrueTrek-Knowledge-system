"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";

export const MAX_LEARNING_OUTCOMES = 12;
export const MAX_LEARNING_OUTCOME_LENGTH = 300;

const FIELD_CLASS =
  "w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60";

const ICON_BUTTON_CLASS =
  "shrink-0 p-1.5 rounded-lg text-muted hover:bg-paper transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent";

// Editable list of bullet points, shared by the admin and teacher course forms
// and by the admin pathway form. Blank rows are dropped on submit (see
// cleanLearningOutcomes). The label/hint/placeholder default to the original
// "What you'll learn" wording, so the course forms read exactly as before.
// Passing `label={null}` suppresses the card chrome (header, counter, empty
// state), for callers that frame the editor with their own heading — the
// pathway form wraps each list in its own BulletCard.
export default function LearningOutcomesField({
  values,
  onChange,
  disabled = false,
  error,
  label = "What you'll learn",
  hint,
  placeholderExample = "Build a complete project from scratch",
  max = MAX_LEARNING_OUTCOMES,
  // Lowercase singular used in the button labels and screen-reader names, so the
  // same editor can read as "Add point" or "Add objective".
  itemNoun = "point",
}) {
  const hasChrome = Boolean(label);
  const isFull = values.length >= max;

  // Rows are keyed by index, so a newly added/reordered row has to be focused
  // after the re-render that creates it rather than inside the handler.
  const inputRefs = useRef([]);
  const pendingFocus = useRef(null);

  // Set only when a paste had to be cut short by `max`, so lines never go
  // missing silently.
  const [droppedNotice, setDroppedNotice] = useState("");

  useEffect(() => {
    if (pendingFocus.current === null) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    inputRefs.current[index]?.focus();
  });

  const commit = (next, focusIndex = null) => {
    pendingFocus.current = focusIndex;
    setDroppedNotice("");
    onChange(next);
  };

  const updateAt = (index, text) => {
    setDroppedNotice("");
    onChange(values.map((value, position) => (position === index ? text : value)));
  };

  const removeAt = (index, focusIndex = null) =>
    commit(
      values.filter((_, position) => position !== index),
      focusIndex
    );

  const add = () => {
    if (isFull) return;
    commit([...values, ""], values.length);
  };

  const insertAfter = (index) => {
    if (isFull) return;
    const next = [...values];
    next.splice(index + 1, 0, "");
    commit(next, index + 1);
  };

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next, target);
  };

  // Pasting a list (from a doc, or the plain textarea this editor replaced) should
  // land as one row per line rather than collapsing into a single run-on point.
  const handlePaste = (index) => (event) => {
    const pasted = event.clipboardData?.getData("text") || "";
    if (!/[\r\n]/.test(pasted)) return;

    const lines = pasted
      .split(/\r?\n/)
      // maxLength only constrains typing, so a pasted line has to be cut here or
      // it reaches the API over the server's own per-point limit.
      .map((line) =>
        line.replace(/^\s*[-*•]\s*/, "").trim().slice(0, MAX_LEARNING_OUTCOME_LENGTH)
      )
      .filter(Boolean);
    if (lines.length === 0) return;

    event.preventDefault();
    const next = [...values];
    // An empty row is consumed by the paste; a filled one is kept and the lines
    // go in after it.
    const isRowEmpty = !next[index].trim();
    const start = isRowEmpty ? index : index + 1;
    next.splice(start, isRowEmpty ? 1 : 0, ...lines);

    const capped = next.slice(0, max);
    commit(capped, Math.min(start + lines.length - 1, capped.length - 1));

    const dropped = next.length - capped.length;
    if (dropped > 0) {
      // Must come after commit(), which clears any previous notice.
      setDroppedNotice(
        `Only ${max} fit — ${dropped} pasted line${dropped === 1 ? " was" : "s were"} dropped.`
      );
    }
  };

  const handleKeyDown = (index) => (event) => {
    if (event.key === "Enter") {
      // Without this, Enter inside the form would submit the whole course.
      event.preventDefault();
      insertAfter(index);
      return;
    }
    if (event.key === "Backspace" && values[index] === "" && values.length > 1) {
      event.preventDefault();
      removeAt(index, Math.max(index - 1, 0));
    }
  };

  const list = (
    <>
      {values.length > 0 && (
        <ul className="space-y-2">
          {values.map((value, index) => (
            <li key={index} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-paper text-[11px] font-mono tabular-nums text-muted"
              >
                {index + 1}
              </span>

              <input
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                value={value}
                onChange={(event) => updateAt(index, event.target.value)}
                onKeyDown={handleKeyDown(index)}
                onPaste={handlePaste(index)}
                disabled={disabled}
                maxLength={MAX_LEARNING_OUTCOME_LENGTH}
                placeholder={`e.g. ${placeholderExample}`}
                aria-label={`Learning ${itemNoun} ${index + 1}`}
                className={`${FIELD_CLASS} flex-1 min-w-0`}
                autoComplete="off"
              />

              <div className="shrink-0 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Move learning ${itemNoun} ${index + 1} up`}
                  className={`${ICON_BUTTON_CLASS} hover:text-pine`}
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={disabled || index === values.length - 1}
                  aria-label={`Move learning ${itemNoun} ${index + 1} down`}
                  className={`${ICON_BUTTON_CLASS} hover:text-pine`}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                  aria-label={`Remove learning ${itemNoun} ${index + 1}`}
                  className={`${ICON_BUTTON_CLASS} hover:text-clay`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasChrome && values.length === 0 ? (
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-line bg-paper/60 px-4 py-3 text-left text-[11px] font-mono text-muted transition hover:border-pine hover:text-pine disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          Add your first {itemNoun} — e.g. {placeholderExample}
        </button>
      ) : (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <button
            type="button"
            onClick={add}
            disabled={disabled || isFull}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-pine transition hover:border-pine hover:bg-sage/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:bg-paper"
          >
            <Plus className="w-3.5 h-3.5" />
            Add {itemNoun}
          </button>
          {droppedNotice ? (
            <p className="text-[11px] font-mono text-clay">{droppedNotice}</p>
          ) : (
            values.length > 0 && (
              <p className="text-[11px] font-mono text-muted">
                {isFull ? `Maximum of ${max} ${itemNoun}s reached.` : "Press Enter to add another."}
              </p>
            )
          )}
        </div>
      )}

      {error && <p className="text-[11px] font-mono text-red-600 mt-2">{error}</p>}
    </>
  );

  if (!hasChrome) return <div>{list}</div>;

  return (
    <div
      className={`rounded-2xl border bg-porcelain/40 p-4 transition-colors ${
        error ? "border-red-300" : "border-line"
      }`}
    >
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-sans font-semibold uppercase tracking-widest text-ink">{label}</p>
          {hint !== null && (
            <p className="mt-1 text-[11px] font-mono text-muted">
              {hint || "Key takeaways shown on the course page."}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full border border-line bg-paper px-2 py-0.5 text-[10px] font-mono tabular-nums text-muted">
          {values.length}/{max}
        </span>
      </div>

      {list}
    </div>
  );
}

// Trims each point and drops blanks — what actually gets sent to the API.
export function cleanLearningOutcomes(values) {
  return values.map((value) => value.trim()).filter(Boolean);
}
