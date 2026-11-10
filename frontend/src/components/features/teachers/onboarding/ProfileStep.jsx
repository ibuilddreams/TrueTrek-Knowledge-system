"use client";

import {
  ERROR_CLASS,
  FIELD_CLASS,
  HINT_CLASS,
  LABEL_CLASS,
} from "./fieldStyles";
import {
  MAX_BIO_LENGTH,
  MIN_BIO_LENGTH,
  QUALIFICATION_OPTIONS,
} from "@/constants/teacherOnboarding";

// Step 1 — who the applicant is professionally. These are the fields an admin
// reads first, and the ones that pre-fill the public instructor profile once
// the application is approved.
export default function ProfileStep({ form, errors, onChange, disabled }) {
  const bioLength = form.bio.trim().length;

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="onboarding-headline" className={LABEL_CLASS}>
          Professional headline <span className="text-clay">*</span>
        </label>
        <input
          id="onboarding-headline"
          type="text"
          maxLength={120}
          value={form.headline}
          onChange={(event) => onChange("headline", event.target.value)}
          disabled={disabled}
          placeholder="e.g. Secondary mathematics teacher and exam coach"
          className={FIELD_CLASS}
        />
        {errors.headline ? (
          <p className={ERROR_CLASS}>{errors.headline}</p>
        ) : (
          <p className={HINT_CLASS}>One line students see under your name.</p>
        )}
      </div>

      <div>
        <label htmlFor="onboarding-bio" className={LABEL_CLASS}>
          About you <span className="text-clay">*</span>
        </label>
        <textarea
          id="onboarding-bio"
          rows={6}
          maxLength={MAX_BIO_LENGTH}
          value={form.bio}
          onChange={(event) => onChange("bio", event.target.value)}
          disabled={disabled}
          placeholder="Where you have taught, what you have taught, and who you have taught it to."
          className={`${FIELD_CLASS} resize-none`}
        />
        <div className="flex items-start justify-between gap-3">
          {errors.bio ? (
            <p className={ERROR_CLASS}>{errors.bio}</p>
          ) : (
            <p className={HINT_CLASS}>At least {MIN_BIO_LENGTH} characters.</p>
          )}
          <p
            className={`text-[11px] font-mono mt-1.5 shrink-0 ${
              bioLength >= MIN_BIO_LENGTH ? "text-pine" : "text-muted"
            }`}
          >
            {bioLength}/{MIN_BIO_LENGTH}
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="onboarding-qualification" className={LABEL_CLASS}>
            Highest qualification <span className="text-clay">*</span>
          </label>
          <select
            id="onboarding-qualification"
            value={form.highest_qualification}
            onChange={(event) => onChange("highest_qualification", event.target.value)}
            disabled={disabled}
            className={FIELD_CLASS}
          >
            <option value="">Select a qualification</option>
            {QUALIFICATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.highest_qualification && (
            <p className={ERROR_CLASS}>{errors.highest_qualification}</p>
          )}
        </div>

        <div>
          <label htmlFor="onboarding-experience" className={LABEL_CLASS}>
            Years of teaching experience <span className="text-clay">*</span>
          </label>
          <input
            id="onboarding-experience"
            type="number"
            min={0}
            max={70}
            inputMode="numeric"
            value={form.years_of_experience}
            onChange={(event) => onChange("years_of_experience", event.target.value)}
            disabled={disabled}
            placeholder="0"
            className={FIELD_CLASS}
          />
          {errors.years_of_experience && (
            <p className={ERROR_CLASS}>{errors.years_of_experience}</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="onboarding-linkedin" className={LABEL_CLASS}>
            LinkedIn
          </label>
          <input
            id="onboarding-linkedin"
            type="url"
            value={form.linkedin_url}
            onChange={(event) => onChange("linkedin_url", event.target.value)}
            disabled={disabled}
            placeholder="https://linkedin.com/in/you"
            className={FIELD_CLASS}
          />
          {errors.linkedin_url && <p className={ERROR_CLASS}>{errors.linkedin_url}</p>}
        </div>

        <div>
          <label htmlFor="onboarding-portfolio" className={LABEL_CLASS}>
            Website or portfolio
          </label>
          <input
            id="onboarding-portfolio"
            type="url"
            value={form.portfolio_url}
            onChange={(event) => onChange("portfolio_url", event.target.value)}
            disabled={disabled}
            placeholder="https://yoursite.com"
            className={FIELD_CLASS}
          />
          {errors.portfolio_url && <p className={ERROR_CLASS}>{errors.portfolio_url}</p>}
        </div>
      </div>
    </div>
  );
}
