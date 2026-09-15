"use client";

import { Download, Loader2 } from "lucide-react";
import { useFileDownload } from "@/hooks/useFileDownload";
import { getFilenameFromUrl } from "@/lib/downloadFile";

export default function ImageLessonViewer({ lesson }) {
  const { download, isDownloading } = useFileDownload();
  const fileUrl = lesson.file;

  if (!fileUrl) {
    return (
      <div
        className="rounded-2xl border border-dashed px-4 py-10 text-center border-line bg-porcelain"
      >
        <p className="text-sm text-muted">
          No image is attached to this lesson.
        </p>
      </div>
    );
  }

  const filename = getFilenameFromUrl(fileUrl, lesson.title || "lesson-image");

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fileUrl}
        alt={lesson.title}
        className="w-full max-h-[70vh] object-contain rounded-xl border border-line bg-porcelain"
      />
      <button
        type="button"
        onClick={() => download(fileUrl, filename)}
        disabled={isDownloading}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 disabled:opacity-50 text-xs font-mono uppercase tracking-wider rounded-lg transition bg-pine hover:bg-moss text-paper"
      >
        {isDownloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Download
      </button>
    </div>
  );
}
