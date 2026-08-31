"use client";

import dynamic from "next/dynamic";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useFileDownload } from "@/hooks/useFileDownload";
import { getFilenameFromUrl } from "@/lib/downloadFile";

function ViewerLoadingPlaceholder() {
  const { isVault } = useTheme();
  return (
    <div
      className={`rounded-2xl border flex items-center justify-center py-20 ${
        isVault ? "border-stone-800 bg-[#0c0b0a]" : "border-stone-200 bg-stone-100"
      }`}
    >
      <Loader2
        className={`w-6 h-6 animate-spin ${isVault ? "text-stone-500" : "text-stone-400"}`}
      />
    </div>
  );
}

// react-pdf/mammoth both do their real work client-side (canvas rendering, DOM
// injection) — loading them only in the browser avoids any SSR/hydration risk.
const PdfLessonViewer = dynamic(() => import("./PdfLessonViewer"), {
  ssr: false,
  loading: ViewerLoadingPlaceholder,
});
const DocxLessonViewer = dynamic(() => import("./DocxLessonViewer"), {
  ssr: false,
  loading: ViewerLoadingPlaceholder,
});

function isDocxFile(fileUrl) {
  return /\.docx($|\?)/i.test(fileUrl || "");
}

export default function DocumentLessonViewer({ lesson }) {
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
          No file is attached to this lesson.
        </p>
      </div>
    );
  }

  if (lesson.content_type === "PDF") {
    return <PdfLessonViewer fileUrl={fileUrl} title={lesson.title} />;
  }

  if (lesson.content_type === "DOCUMENT" && isDocxFile(fileUrl)) {
    return <DocxLessonViewer fileUrl={fileUrl} title={lesson.title} />;
  }

  const filename = getFilenameFromUrl(fileUrl, lesson.title || "lesson-file");

  return (
    <div className="space-y-3">
      <div
        className={`rounded-2xl border px-5 py-8 flex flex-col items-center text-center gap-2 ${
          isVault ? "border-stone-800 bg-[#0c0b0a]" : "border-stone-200 bg-stone-50"
        }`}
      >
        <FileText className={`w-8 h-8 ${isVault ? "text-amber-500" : "text-amber-600"}`} />
        <p className={`text-sm font-medium ${isVault ? "text-stone-200" : "text-stone-700"}`}>
          {lesson.title}
        </p>
        <p className={`text-sm ${isVault ? "text-stone-400" : "text-stone-500"}`}>
          This file type can&apos;t be previewed in the browser — download it or open it in a
          new tab instead.
        </p>
      </div>

      <div className="flex items-center gap-2">
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
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-xs font-mono uppercase tracking-wider rounded-lg transition ${
            isVault
              ? "border-stone-700 hover:border-amber-500/50 text-stone-400 hover:text-amber-400"
              : "border-stone-200 hover:border-amber-300 text-stone-600 hover:text-amber-800"
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in new tab
        </a>
      </div>
    </div>
  );
}
