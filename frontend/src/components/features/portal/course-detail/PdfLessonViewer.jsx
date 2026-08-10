"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { Download, Loader2, Minus, Plus, TriangleAlert } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useFileDownload } from "@/hooks/useFileDownload";
import { getFilenameFromUrl } from "@/lib/downloadFile";

// PDF.js renders in a worker thread — point it at the copy bundled with pdfjs-dist
// rather than fetching one from a CDN at runtime.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MIN_SCALE = 0.75;
const MAX_SCALE = 2;
const SCALE_STEP = 0.25;

function ToolbarButton({ onClick, disabled, isVault, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed transition ${
        isVault
          ? "border-stone-700 text-stone-300 hover:border-amber-500/50 hover:text-amber-400"
          : "border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-800"
      }`}
    >
      {children}
    </button>
  );
}

export default function PdfLessonViewer({ fileUrl, title }) {
  const { isVault } = useTheme();
  const { download, isDownloading } = useFileDownload();
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1);
  const [loadError, setLoadError] = useState(false);

  const filename = getFilenameFromUrl(fileUrl, `${title || "lesson"}.pdf`);

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        isVault ? "border-stone-800 bg-[#0c0b0a]" : "border-stone-200 bg-stone-100"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 border-b ${
          isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200 bg-white"
        }`}
      >
        <p
          className={`text-[11px] font-mono uppercase tracking-wider truncate ${
            isVault ? "text-stone-400" : "text-stone-500"
          }`}
        >
          {numPages ? `${numPages} page${numPages === 1 ? "" : "s"}` : "PDF document"}
        </p>

        <div className="flex items-center gap-1.5 shrink-0">
          <ToolbarButton
            onClick={() => setScale((value) => Math.max(MIN_SCALE, value - SCALE_STEP))}
            disabled={scale <= MIN_SCALE}
            isVault={isVault}
            title="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </ToolbarButton>
          <span
            className={`text-[10px] font-mono w-9 text-center ${
              isVault ? "text-stone-400" : "text-stone-500"
            }`}
          >
            {Math.round(scale * 100)}%
          </span>
          <ToolbarButton
            onClick={() => setScale((value) => Math.min(MAX_SCALE, value + SCALE_STEP))}
            disabled={scale >= MAX_SCALE}
            isVault={isVault}
            title="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </ToolbarButton>

          <button
            type="button"
            onClick={() => download(fileUrl, filename)}
            disabled={isDownloading}
            className={`inline-flex items-center gap-1.5 ml-1 px-2.5 py-1.5 border disabled:opacity-50 text-[10px] font-mono uppercase tracking-wider rounded-lg transition ${
              isVault
                ? "border-stone-700 hover:border-amber-500/50 hover:bg-white/10 text-stone-300 hover:text-amber-400"
                : "border-stone-200 hover:border-amber-300 hover:bg-white text-stone-600 hover:text-amber-800"
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
      </div>

      <div className="max-h-[75vh] overflow-y-auto flex flex-col items-center gap-3 p-4">
        {loadError ? (
          <div className="py-16 text-center space-y-2">
            <TriangleAlert
              className={`w-6 h-6 mx-auto ${isVault ? "text-rose-400" : "text-rose-500"}`}
            />
            <p className={`text-xs ${isVault ? "text-stone-400" : "text-stone-500"}`}>
              This PDF couldn&apos;t be loaded for preview — try downloading it instead.
            </p>
          </div>
        ) : (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: loadedPages }) => setNumPages(loadedPages)}
            onLoadError={() => setLoadError(true)}
            loading={
              <div className="flex justify-center py-16">
                <Loader2
                  className={`w-6 h-6 animate-spin ${isVault ? "text-stone-500" : "text-stone-400"}`}
                />
              </div>
            }
          >
            {Array.from({ length: numPages || 0 }, (_, index) => (
              <Page
                key={index}
                pageNumber={index + 1}
                scale={scale}
                className="shadow-md mb-3 last:mb-0"
              />
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}
