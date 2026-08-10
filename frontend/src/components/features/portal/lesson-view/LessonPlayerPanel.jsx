"use client";

import { FileQuestion } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import VideoLessonPlayer from "../course-detail/VideoLessonPlayer";
import DocumentLessonViewer from "../course-detail/DocumentLessonViewer";
import ImageLessonViewer from "../course-detail/ImageLessonViewer";
import LessonCompleteButton from "../course-detail/LessonCompleteButton";

function LessonContent({ lesson, isVault }) {
  switch (lesson.content_type) {
    case "VIDEO":
      return <VideoLessonPlayer lesson={lesson} />;
    case "PDF":
    case "DOCUMENT":
      return <DocumentLessonViewer lesson={lesson} />;
    case "IMAGE":
      return <ImageLessonViewer lesson={lesson} />;
    default:
      return (
        <div
          className={`rounded-2xl border border-dashed px-4 py-10 text-center ${
            isVault ? "border-stone-700 bg-white/5" : "border-stone-200 bg-stone-50"
          }`}
        >
          <FileQuestion
            className={`w-6 h-6 mx-auto mb-2 ${isVault ? "text-stone-600" : "text-stone-300"}`}
          />
          <p className={`text-xs ${isVault ? "text-stone-400" : "text-stone-500"}`}>
            This lesson&apos;s content type isn&apos;t supported for in-app viewing yet.
          </p>
        </div>
      );
  }
}

export default function LessonPlayerPanel({ lesson, courseId, canInteract }) {
  const { isVault } = useTheme();

  return (
    <div className="space-y-5">
      <div>
        <p
          className={`text-[10px] font-mono uppercase tracking-[0.16em] mb-1.5 ${
            isVault ? "text-amber-500" : "text-amber-700/80"
          }`}
        >
          Lesson
        </p>
        <h2
          className={`font-serif font-bold text-xl sm:text-2xl leading-tight ${
            isVault ? "text-stone-50" : "text-stone-900"
          }`}
        >
          {lesson.title}
        </h2>
      </div>

      <LessonContent lesson={lesson} isVault={isVault} />

      {lesson.description ? (
        <p
          className={`text-sm font-light leading-relaxed whitespace-pre-line ${
            isVault ? "text-stone-300" : "text-stone-600"
          }`}
        >
          {lesson.description}
        </p>
      ) : null}

      <div
        className={`flex items-center justify-between gap-3 pt-4 border-t ${
          isVault ? "border-stone-800" : "border-stone-100"
        }`}
      >
        <p
          className={`text-[11px] font-mono uppercase tracking-wider ${
            isVault ? "text-stone-500" : "text-stone-400"
          }`}
        >
          {lesson.duration_minutes ? `${lesson.duration_minutes} min` : ""}
        </p>
        <LessonCompleteButton lesson={lesson} courseId={courseId} canInteract={canInteract} />
      </div>
    </div>
  );
}
