"use client";

import { AlertCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import Loader from "@/components/ui/Loader";
import LessonPlayerPanel from "./LessonPlayerPanel";
import AssignmentPlayerPanel from "./AssignmentPlayerPanel";
import QuizPlayerPanel from "./QuizPlayerPanel";

function PanelShell({ children, isVault }) {
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${
        isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200 bg-white"
      }`}
    >
      {children}
    </div>
  );
}

export default function ContentPlayerPanel({
  activeItem,
  lesson,
  assignment,
  quiz,
  isResolving,
  courseId,
  canInteract,
}) {
  const { isVault } = useTheme();

  if (!activeItem) {
    return (
      <PanelShell isVault={isVault}>
        <div className="flex min-h-[40vh] items-center justify-center text-center px-4">
          <p className={`text-sm ${isVault ? "text-stone-400" : "text-stone-500"}`}>
            Select a lesson, quiz, or assignment from the curriculum to begin.
          </p>
        </div>
      </PanelShell>
    );
  }

  if (isResolving) {
    return (
      <PanelShell isVault={isVault}>
        <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
          <Loader fullScreen={false} label="Loading content..." />
        </div>
      </PanelShell>
    );
  }

  if (activeItem.type === "LESSON" && lesson) {
    return (
      <PanelShell isVault={isVault}>
        <LessonPlayerPanel key={lesson.id} lesson={lesson} courseId={courseId} canInteract={canInteract} />
      </PanelShell>
    );
  }

  if (activeItem.type === "ASSIGNMENT" && assignment) {
    return (
      <PanelShell isVault={isVault}>
        <AssignmentPlayerPanel key={assignment.id} assignment={assignment} canInteract={canInteract} />
      </PanelShell>
    );
  }

  if (activeItem.type === "QUIZ" && quiz) {
    return (
      <PanelShell isVault={isVault}>
        <QuizPlayerPanel key={quiz.id} quiz={quiz} canInteract={canInteract} />
      </PanelShell>
    );
  }

  return (
    <PanelShell isVault={isVault}>
      <div className="flex flex-col items-center justify-center text-center gap-3 min-h-[40vh] px-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
            isVault
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-rose-50 border-rose-100 text-rose-600"
          }`}
        >
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className={`text-sm ${isVault ? "text-stone-400" : "text-stone-500"}`}>
          We couldn&apos;t find that item — it may have been removed. Pick something else from
          the curriculum.
        </p>
      </div>
    </PanelShell>
  );
}
