"use client";

import { Download, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useFileDownload } from "@/hooks/useFileDownload";
import { getFilenameFromUrl } from "@/lib/downloadFile";

export default function ImageLessonViewer({ lesson }) {
  const { isVault } = useTheme();
  const { download, isDownloading } = useFileDownload();
  const fileUrl = lesson.file;

  if (!fileUrl) {
    return (
      <div
        className={`rounded-2xl border border-dashed px-4 py-10 text-center ${
          isVault ? "border-stone-700 bg-white/5" : "border-stone-200 bg-stone-50"
        }`}
      >
        <p className={`text-sm ${isVault ? "text-stone-400" : "text-stone-500"}`}>
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
        className={`w-full max-h-[70vh] object-contain rounded-xl border ${
          isVault ? "border-stone-800 bg-[#0c0b0a]" : "border-stone-200 bg-stone-50"
        }`}
      />
      <button
        type="button"
        onClick={() => download(fileUrl, filename)}
        disabled={isDownloading}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 disabled:opacity-50 text-xs font-mono uppercase tracking-wider rounded-lg transition ${
          isVault
            ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
            : "bg-stone-900 hover:bg-stone-800 text-white"
        }`}
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
