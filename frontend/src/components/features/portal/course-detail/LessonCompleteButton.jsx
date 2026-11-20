"use client";

import { Check, Loader2 } from "lucide-react";
import { useCompleteLesson } from "@/hooks/student/useCompleteLesson";
import { PortalButton, PortalPill } from "../shell/PortalUI";

export default function LessonCompleteButton({ lesson, courseId, canInteract }) {
  const completeLessonMutation = useCompleteLesson(courseId);

  if (lesson.is_completed) {
    return (
      <PortalPill tone="ok">
        <Check aria-hidden="true" className="h-3.5 w-3.5" />
        Completed
      </PortalPill>
    );
  }

  return (
    <PortalButton
      disabled={!canInteract || completeLessonMutation.isPending}
      onClick={() => completeLessonMutation.mutate(lesson.id)}
      title={canInteract ? undefined : "Your enrollment must be active to mark lessons complete"}
    >
      {completeLessonMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      Mark as complete
    </PortalButton>
  );
}
