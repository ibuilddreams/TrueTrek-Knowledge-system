import { FileQuestion, FileText, Image as ImageIcon, Video } from "lucide-react";

export const LESSON_TYPE_META = {
  VIDEO: { icon: Video, label: "Video", badge: "bg-sky-50 text-sky-600 border-sky-100", badgeVault: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  PDF: { icon: FileText, label: "PDF", badge: "bg-rose-50 text-rose-600 border-rose-100", badgeVault: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  DOCUMENT: { icon: FileText, label: "Document", badge: "bg-blue-50 text-blue-600 border-blue-100", badgeVault: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  IMAGE: { icon: ImageIcon, label: "Image", badge: "bg-violet-50 text-violet-600 border-violet-100", badgeVault: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  DEFAULT: { icon: FileQuestion, label: "Lesson", badge: "bg-stone-50 text-stone-500 border-stone-200", badgeVault: "bg-white/5 text-stone-400 border-stone-700" },
};

export function getLessonTypeMeta(contentType) {
  return LESSON_TYPE_META[contentType] || LESSON_TYPE_META.DEFAULT;
}

const ASSIGNMENT_STATUS_STYLES = {
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
  LATE: "bg-rose-50 text-rose-600 border-rose-100",
  GRADED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  RETURNED: "bg-sky-50 text-sky-700 border-sky-100",
  RESUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
};

const ASSIGNMENT_STATUS_STYLES_VAULT = {
  SUBMITTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  LATE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  GRADED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  RETURNED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  RESUBMITTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export function getAssignmentStatusMeta(submission, isVault) {
  if (!submission) {
    return {
      label: "Not submitted",
      className: isVault
        ? "bg-white/5 text-stone-400 border-stone-700"
        : "bg-stone-50 text-stone-500 border-stone-200",
    };
  }
  const styles = isVault ? ASSIGNMENT_STATUS_STYLES_VAULT : ASSIGNMENT_STATUS_STYLES;
  const fallback = isVault
    ? "bg-white/5 text-stone-400 border-stone-700"
    : "bg-stone-50 text-stone-500 border-stone-200";
  return { label: submission.status, className: styles[submission.status] || fallback };
}

export function getQuizStatusMeta(quiz, isVault) {
  const fallback = isVault
    ? "bg-white/5 text-stone-400 border-stone-700"
    : "bg-stone-50 text-stone-500 border-stone-200";
  const attempt = quiz.latest_attempt;
  if (!attempt) return { label: "Not attempted", className: fallback };
  if (attempt.status === "IN_PROGRESS") {
    return {
      label: "In progress",
      className: isVault
        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
        : "bg-amber-50 text-amber-700 border-amber-100",
    };
  }
  if (attempt.is_passed === true) {
    return {
      label: "Passed",
      className: isVault
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-emerald-50 text-emerald-700 border-emerald-100",
    };
  }
  if (attempt.is_passed === false) {
    return {
      label: "Failed",
      className: isVault
        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
        : "bg-rose-50 text-rose-600 border-rose-100",
    };
  }
  return { label: "Submitted", className: fallback };
}
