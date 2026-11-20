"use client";

import { Check, ChevronLeft, ChevronRight, Clock, FileQuestion } from "lucide-react";
import VideoLessonPlayer from "../course-detail/VideoLessonPlayer";
import DocumentLessonViewer from "../course-detail/DocumentLessonViewer";
import ImageLessonViewer from "../course-detail/ImageLessonViewer";
import TextLessonViewer from "../course-detail/TextLessonViewer";
import LessonCompleteButton from "../course-detail/LessonCompleteButton";
import { PortalButton, PortalPill } from "../shell/PortalUI";

function LessonContent({ lesson }) {
  switch (lesson.content_type) {
    case "VIDEO":
      return <VideoLessonPlayer lesson={lesson} />;
    case "PDF":
    case "DOCUMENT":
      return <DocumentLessonViewer lesson={lesson} />;
    case "IMAGE":
      return <ImageLessonViewer lesson={lesson} />;
    case "TEXT":
      return <TextLessonViewer lesson={lesson} />;
    default:
      return (
        <div className="rounded-cn-p border border-dashed border-cn-p-line bg-cn-p-page px-4 py-10 text-center">
          <FileQuestion className="mx-auto mb-2 h-6 w-6 text-cn-p-muted" />
          <p className="text-sm text-cn-p-ink-2">
            This lesson&apos;s content type isn&apos;t supported for in-app viewing yet.
          </p>
        </div>
      );
  }
}

export default function LessonPlayerPanel({
  lesson,
  moduleIndex,
  moduleTitle,
  courseId,
  canInteract,
  previousLesson,
  nextLesson,
  onSelectItem,
}) {
  const isCompleted = Boolean(lesson.is_completed);

  return (
    <article>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-[13px] text-cn-p-ink-2">
        <PortalPill tone="blue">Lesson</PortalPill>
        {moduleTitle && (
          <span>
            Module {Number(moduleIndex ?? 0) + 1}: {moduleTitle}
          </span>
        )}
        {lesson.duration_minutes ? (
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            {lesson.duration_minutes} min
          </span>
        ) : null}
      </div>

      <h2 className="mb-2 text-[30px] leading-[1.2] font-bold tracking-[-0.015em] text-cn-p-ink">
        {lesson.title}
      </h2>

      {lesson.description ? (
        <p className="text-lg whitespace-pre-line text-cn-p-ink-2">{lesson.description}</p>
      ) : null}

      <div className="mt-6">
        <LessonContent lesson={lesson} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-cn-p-line pt-5">
        {previousLesson ? (
          <PortalButton
            variant="sec"
            onClick={() => onSelectItem("LESSON", previousLesson.id)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </PortalButton>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center gap-3">
          {isCompleted ? (
            <PortalPill tone="ok">
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
              Completed
            </PortalPill>
          ) : (
            <LessonCompleteButton
              lesson={lesson}
              courseId={courseId}
              canInteract={canInteract}
            />
          )}
          {nextLesson && (
            <PortalButton
              variant={isCompleted ? "pri" : "sec"}
              onClick={() => onSelectItem("LESSON", nextLesson.id)}
            >
              Next lesson
              <ChevronRight className="h-4 w-4" />
            </PortalButton>
          )}
        </div>
      </div>
    </article>
  );
}
