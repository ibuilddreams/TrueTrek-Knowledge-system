"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useCompleteLesson } from "@/hooks/student/useCompleteLesson";
import { useTheme } from "@/hooks/useTheme";

export default function LessonCompleteButton({ lesson, courseId, canInteract }) {
  const { isVault } = useTheme();
  const completeLessonMutation = useCompleteLesson(courseId);
  const isCompleted = Boolean(lesson.is_completed);

  if (isCompleted) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-xs font-mono uppercase tracking-wider rounded-lg ${
          isVault
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-emerald-50 border-emerald-100 text-emerald-700"
        }`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        Completed
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={!canInteract || completeLessonMutation.isPending}
      onClick={() => completeLessonMutation.mutate(lesson.id)}
      title={canInteract ? undefined : "Your enrollment must be active to mark lessons complete"}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono uppercase tracking-wider rounded-lg transition ${
        isVault
          ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
          : "bg-stone-900 hover:bg-stone-800 text-white"
      }`}
    >
      {completeLessonMutation.isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5" />
      )}
      Mark as complete
    </button>
  );
}
