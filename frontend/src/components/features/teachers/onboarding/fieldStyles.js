/**
  * The form styling the teacher portal already uses (see InstructorProfileTab
   * and TeacherRequestDetailModal), named once here because the onboarding
   * wizard spreads one form across five step components and five copies of the
   * same class string is five places for it to drift.
   */

export const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60";

export const LABEL_CLASS =
  "block mb-1.5 text-[13px] font-semibold text-cn-p-ink";

export const ERROR_CLASS = "text-xs text-cn-p-bad mt-1";

export const HINT_CLASS = "text-[11px] font-sans text-cn-p-ink-2 mt-1.5";

export const PRIMARY_BUTTON_CLASS =
  "px-[18px] py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2";

export const SECONDARY_BUTTON_CLASS =
  "px-[18px] py-3 bg-cn-p-card hover:border-cn-p-ink text-cn-p-ink text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 border border-cn-p-line-2 disabled:opacity-60 disabled:cursor-not-allowed";
