"use client";

import { FileQuestion } from "lucide-react";
import VideoLessonPlayer from "../course-detail/VideoLessonPlayer";
import DocumentLessonViewer from "../course-detail/DocumentLessonViewer";
import ImageLessonViewer from "../course-detail/ImageLessonViewer";
import TextLessonViewer from "../course-detail/TextLessonViewer";
import LessonCompleteButton from "../course-detail/LessonCompleteButton";

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
        <div className="rounded-2xl border border-dashed px-4 py-10 text-center border-line bg-porcelain">
          <FileQuestion className="w-6 h-6 mx-auto mb-2 text-muted" />
          <p className="text-sm text-muted">
            This lesson&apos;s content type isn&apos;t supported for in-app viewing yet.
          </p>
        </div>
      );
  }
}

export default function LessonPlayerPanel({ lesson, courseId, canInteract }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] mb-1.5 text-gold/80">
          Lesson
        </p>
        <h2 className="font-serif font-bold text-xl sm:text-2xl leading-tight text-ink">
          {lesson.title}
        </h2>
      </div>

      <LessonContent lesson={lesson} />

      {lesson.description ? (
        <p className="text-sm font-light leading-relaxed whitespace-pre-line text-muted">
          {lesson.description}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-line">
        <p className="text-xs font-mono uppercase tracking-wider text-muted">
          {lesson.duration_minutes ? `${lesson.duration_minutes} min` : ""}
        </p>
        <LessonCompleteButton lesson={lesson} courseId={courseId} canInteract={canInteract} />
      </div>
    </div>
  );
}
