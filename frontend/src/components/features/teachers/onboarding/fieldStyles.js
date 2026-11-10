/**
 * The form styling the teacher portal already uses (see InstructorProfileTab
 * and TeacherRequestDetailModal), named once here because the onboarding
 * wizard spreads one form across five step components and five copies of the
 * same class string is five places for it to drift.
 */

export const FIELD_CLASS =
  "w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60";

export const LABEL_CLASS =
  "text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium";

export const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

export const HINT_CLASS = "text-[11px] font-sans text-muted mt-1.5";

export const PRIMARY_BUTTON_CLASS =
  "px-6 py-3 bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper text-sm font-semibold font-mono rounded-full tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2";

export const SECONDARY_BUTTON_CLASS =
  "px-5 py-3 bg-transparent hover:bg-porcelain text-ink text-sm font-semibold font-mono rounded-full tracking-wider transition-colors duration-150 border border-line shadow-sm disabled:opacity-60 disabled:cursor-not-allowed";
