"use client";

import { Download } from "lucide-react";

export default function ImageLessonViewer({ lesson }) {
  const fileUrl = lesson.file;

  if (!fileUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center">
        <p className="text-xs text-stone-500">No image is attached to this lesson.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={fileUrl}
        alt={lesson.title}
        className="w-full max-h-[60vh] object-contain rounded-xl border border-stone-200 bg-stone-50"
      />
      <a
        href={fileUrl}
        download
        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-mono uppercase tracking-wider rounded-lg transition"
      >
        <Download className="w-3.5 h-3.5" />
        Download
      </a>
    </div>
  );
}
