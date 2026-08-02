"use client";

import { Download, ExternalLink, FileText } from "lucide-react";

export default function DocumentLessonViewer({ lesson }) {
  const fileUrl = lesson.file;

  if (!fileUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center">
        <p className="text-xs text-stone-500">No file is attached to this lesson.</p>
      </div>
    );
  }

  const isPdf = lesson.content_type === "PDF";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-8 flex flex-col items-center text-center gap-2">
        <FileText className="w-8 h-8 text-amber-600" />
        <p className="text-sm text-stone-700 font-medium">{lesson.title}</p>
        <p className="text-xs text-stone-500">
          {isPdf
            ? "Preview isn't available here — download it or open it in a new tab."
            : "This file type can't be previewed in the browser — download it or open it in a new tab (which will download it too)."}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={fileUrl}
          download
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-mono uppercase tracking-wider rounded-lg transition"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </a>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:border-amber-300 text-stone-600 hover:text-amber-800 text-[11px] font-mono uppercase tracking-wider rounded-lg transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in new tab
        </a>
      </div>
    </div>
  );
}
