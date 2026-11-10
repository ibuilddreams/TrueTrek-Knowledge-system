"use client";

import SkillsTagInput from "@/components/features/teachers/SkillsTagInput";
import { ERROR_CLASS, FIELD_CLASS, HINT_CLASS, LABEL_CLASS } from "./fieldStyles";
import {
  MAX_TEACHING_STATEMENT_LENGTH,
  MIN_TEACHING_STATEMENT_LENGTH,
} from "@/constants/teacherOnboarding";

// Step 2 — what they teach and how. `SkillsTagInput` is the same chip input
// the public instructor profile uses for its skills list, so the two screens
// behave identically and an approved application pre-fills that list.
export default function ExpertiseStep({ form, errors, onChange, disabled }) {
  const statementLength = form.teaching_statement.trim().length;

  return (
    <div className="space-y-5">
      <div>
        <span className={LABEL_CLASS}>
          Subjects you can teach <span className="text-clay">*</span>
        </span>
        <SkillsTagInput
          values={form.expertise}
          onChange={(values) => onChange("expertise", values)}
          disabled={disabled}
          error={errors.expertise}
        />
      </div>

      <div>
        <label htmlFor="onboarding-teaching-statement" className={LABEL_CLASS}>
          Your teaching approach <span className="text-clay">*</span>
        </label>
        <textarea
          id="onboarding-teaching-statement"
          rows={6}
          maxLength={MAX_TEACHING_STATEMENT_LENGTH}
          value={form.teaching_statement}
          onChange={(event) => onChange("teaching_statement", event.target.value)}
          disabled={disabled}
          placeholder="How you run a lesson, how you handle a student who is behind, and what students get from you that they would not get elsewhere."
          className={`${FIELD_CLASS} resize-none`}
        />
        <div className="flex items-start justify-between gap-3">
          {errors.teaching_statement ? (
            <p className={ERROR_CLASS}>{errors.teaching_statement}</p>
          ) : (
            <p className={HINT_CLASS}>
              At least {MIN_TEACHING_STATEMENT_LENGTH} characters. This is the part reviewers
              read most closely.
            </p>
          )}
          <p
            className={`text-[11px] font-mono mt-1.5 shrink-0 ${
              statementLength >= MIN_TEACHING_STATEMENT_LENGTH ? "text-pine" : "text-muted"
            }`}
          >
            {statementLength}/{MIN_TEACHING_STATEMENT_LENGTH}
          </p>
        </div>
      </div>
    </div>
  );
}
