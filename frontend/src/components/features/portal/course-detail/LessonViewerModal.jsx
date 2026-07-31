"use client";

import { FileQuestion, FileText, Image as ImageIcon, Video } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import VideoLessonPlayer from "./VideoLessonPlayer";
import DocumentLessonViewer from "./DocumentLessonViewer";
import ImageLessonViewer from "./ImageLessonViewer";
import LessonCompleteButton from "./LessonCompleteButton";

const CONTENT_TYPE_META = {
  VIDEO: { label: "Video lesson", icon: Video },
  PDF: { label: "PDF document", icon: FileText },
  DOCUMENT: { label: "Document", icon: FileText },
  IMAGE: { label: "Image", icon: ImageIcon },
};

function LessonContent({ lesson }) {
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
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center">
          <FileQuestion className="w-6 h-6 text-stone-300 mx-auto mb-2" />
          <p className="text-xs text-stone-500">
            This lesson&apos;s content type isn&apos;t supported for in-app viewing yet.
          </p>
        </div>
      );
  }
}

export default function LessonViewerModal({ lesson, isLoading, courseId, canInteract, onClose }) {
  const isOpen = Boolean(lesson) || Boolean(isLoading);
  const meta = lesson ? CONTENT_TYPE_META[lesson.content_type] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={meta?.icon}
      title={lesson?.title || "Loading lesson..."}
      subtitle={meta?.label}
      maxWidth="max-w-3xl"
    >
      {isLoading || !lesson ? (
        <div className="flex min-h-[30vh] items-center justify-center" aria-busy="true">
          <Loader fullScreen={false} label="Loading lesson content..." />
        </div>
      ) : (
        <div className="space-y-5">
          {lesson.description ? (
            <p className="text-sm text-stone-600 font-light leading-relaxed">
              {lesson.description}
            </p>
          ) : null}

          <LessonContent lesson={lesson} />

          <div className="flex items-center justify-between gap-3 pt-4 border-t border-stone-100">
            <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
              {lesson.duration_minutes ? `${lesson.duration_minutes} min` : ""}
            </p>
            <LessonCompleteButton lesson={lesson} courseId={courseId} canInteract={canInteract} />
          </div>
        </div>
      )}
    </Modal>
  );
}
