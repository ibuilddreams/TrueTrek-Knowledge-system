"use client";

import { AlertCircle } from "lucide-react";
import Loader from "@/components/ui/Loader";
import PortalCard from "../shell/PortalCard";
import { PortalEmpty } from "../shell/PortalUI";
import LessonPlayerPanel from "./LessonPlayerPanel";
import AssignmentPlayerPanel from "./AssignmentPlayerPanel";
import QuizPlayerPanel from "./QuizPlayerPanel";

/** The design's `.card.reader` — the page the student actually reads. */
function Reader({ children, className = "" }) {
  return <PortalCard className={`p-9 max-[40rem]:p-5 ${className}`}>{children}</PortalCard>;
}

export default function ContentPlayerPanel({
  activeItem,
  lesson,
  moduleIndex,
  moduleTitle,
  moduleCount,
  assignment,
  quiz,
  isResolving,
  courseId,
  canInteract,
  previousLesson,
  nextLesson,
  onSelectItem,
}) {
  if (!activeItem) {
    return (
      <Reader>
        <PortalEmpty
          title="Nothing open"
          text="Select a lesson, quiz, or assignment from the curriculum to begin."
        />
      </Reader>
    );
  }

  if (isResolving) {
    return (
      <Reader>
        <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
          <Loader fullScreen={false} tone="portal" label="Loading content..." />
        </div>
      </Reader>
    );
  }

  if (activeItem.type === "LESSON" && lesson) {
    return (
      <Reader>
        <LessonPlayerPanel
          key={lesson.id}
          lesson={lesson}
          moduleIndex={moduleIndex}
          moduleTitle={moduleTitle}
          courseId={courseId}
          canInteract={canInteract}
          previousLesson={previousLesson}
          nextLesson={nextLesson}
          onSelectItem={onSelectItem}
        />
      </Reader>
    );
  }

  if (activeItem.type === "ASSIGNMENT" && assignment) {
    return (
      <Reader>
        <AssignmentPlayerPanel
          key={assignment.id}
          assignment={assignment}
          moduleIndex={moduleIndex}
          moduleCount={moduleCount}
          canInteract={canInteract}
        />
      </Reader>
    );
  }

  if (activeItem.type === "QUIZ" && quiz) {
    return (
      <Reader>
        <QuizPlayerPanel key={quiz.id} quiz={quiz} canInteract={canInteract} />
      </Reader>
    );
  }

  return (
    <Reader>
      <PortalEmpty
        icon={AlertCircle}
        title="Not found"
        text="We couldn't find that item — it may have been removed. Pick something else from the curriculum."
      />
    </Reader>
  );
}
