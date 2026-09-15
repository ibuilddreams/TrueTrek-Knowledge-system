"use client";

import dynamic from "next/dynamic";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useFileDownload } from "@/hooks/useFileDownload";
import { getFilenameFromUrl } from "@/lib/downloadFile";

function ViewerLoadingPlaceholder() {
  return (
    <div
      className="rounded-2xl border flex items-center justify-center py-20 border-line bg-porcelain"
    >
      <Loader2
        className="w-6 h-6 animate-spin text-muted"
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
  const { download, isDownloading } = useFileDownload();
  const fileUrl = lesson.file;

  if (!fileUrl) {
    return (
      <div
        className="rounded-2xl border border-dashed px-4 py-10 text-center border-line bg-porcelain"
      >
        <p className="text-sm text-muted">
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
        className="rounded-2xl border px-5 py-8 flex flex-col items-center text-center gap-2 border-line bg-porcelain"
      >
        <FileText className="w-8 h-8 text-pine" />
        <p className="text-sm font-medium text-muted">
          {lesson.title}
        </p>
        <p className="text-sm text-muted">
          This file type can&apos;t be previewed in the browser — download it or open it in a
          new tab instead.
        </p>
      </div>

      <div className="flex items-center gap-2">
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
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border text-xs font-mono uppercase tracking-wider rounded-lg transition border-line hover:border-pine text-muted hover:text-pine"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in new tab
        </a>
      </div>
    </div>
  );
}
