"use client";

import { useState } from "react";
import { X } from "lucide-react";

export const MAX_SKILLS = 12;
export const MAX_SKILL_LENGTH = 40;

// Chip input for the "Skills I teach" list: Enter or comma adds a skill,
// Backspace on an empty field removes the last one. Duplicates (ignoring
// case) and blanks are ignored.
export default function SkillsTagInput({ values, onChange, disabled = false, error }) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const text = draft.replace(/\s+/g, " ").trim();
    setDraft("");
    if (!text) return;
    if (values.some((value) => value.toLowerCase() === text.toLowerCase())) return;
    if (values.length >= MAX_SKILLS) return;
    onChange([...values, text.slice(0, MAX_SKILL_LENGTH)]);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && !draft && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const isFull = values.length >= MAX_SKILLS;

  return (
    <div>
      <div
        className={`flex flex-wrap items-center gap-2 px-3 py-2.5 bg-porcelain border rounded-xl transition focus-within:border-pine focus-within:bg-paper ${
          error ? "border-red-400" : "border-line"
        } ${disabled ? "opacity-60" : ""}`}
      >
        {values.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1.5 rounded-full bg-paper border border-line pl-3 pr-1.5 py-1 text-xs font-sans text-ink"
          >
            {skill}
            <button
              type="button"
              onClick={() => onChange(values.filter((value) => value !== skill))}
              disabled={disabled}
              aria-label={`Remove ${skill}`}
              className="w-5 h-5 rounded-full flex items-center justify-center text-muted hover:bg-porcelain hover:text-clay transition"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          disabled={disabled || isFull}
          maxLength={MAX_SKILL_LENGTH}
          placeholder={isFull ? "Maximum reached" : values.length ? "Add another…" : "e.g. Algebra, Latin, Public speaking"}
          aria-label="Add a skill"
          className="flex-1 min-w-32 bg-transparent text-sm font-mono text-ink placeholder:text-muted focus:outline-none"
        />
      </div>
      <p className="mt-1.5 text-[11px] font-mono text-muted">
        Press Enter or comma to add. Up to {MAX_SKILLS} skills.
      </p>
      {error && <p className="text-[11px] font-mono text-red-600 mt-1">{error}</p>}
    </div>
  );
}
