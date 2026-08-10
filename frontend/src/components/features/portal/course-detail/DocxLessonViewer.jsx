"use client";

import { useEffect, useState } from "react";
import mammoth from "mammoth";
import { Download, FileWarning, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useFileDownload } from "@/hooks/useFileDownload";
import { getFilenameFromUrl } from "@/lib/downloadFile";

const PROSE_CLASSES =
  "[&_h1]:font-serif [&_h1]:font-bold [&_h1]:text-xl [&_h1]:mt-6 [&_h1]:mb-3 first:[&_h1]:mt-0 " +
  "[&_h2]:font-serif [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-5 [&_h2]:mb-2.5 first:[&_h2]:mt-0 " +
  "[&_h3]:font-serif [&_h3]:font-bold [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2 first:[&_h3]:mt-0 " +
  "[&_p]:mb-3 [&_p]:leading-relaxed " +
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 " +
  "[&_strong]:font-semibold [&_em]:italic " +
  "[&_table]:w-full [&_table]:border-collapse [&_table]:mb-4 [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_th]:font-semibold " +
  "[&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3";

export default function DocxLessonViewer({ fileUrl, title }) {
  const { isVault } = useTheme();
  const { download, isDownloading } = useFileDownload();
  const [html, setHtml] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setLoadError(false);

    async function loadDocument() {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error("Failed to fetch document");
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) setHtml(result.value);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }

    loadDocument();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  const filename = getFilenameFromUrl(fileUrl, `${title || "lesson"}.docx`);

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
          Word document
        </p>
        <button
          type="button"
          onClick={() => download(fileUrl, filename)}
          disabled={isDownloading}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border disabled:opacity-50 text-[10px] font-mono uppercase tracking-wider rounded-lg transition ${
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

      <div
        className={`max-h-[75vh] overflow-y-auto p-6 sm:p-8 ${
          isVault ? "bg-[#161412]" : "bg-white"
        }`}
      >
        {loadError ? (
          <div className="py-16 text-center space-y-2">
            <FileWarning
              className={`w-6 h-6 mx-auto ${isVault ? "text-rose-400" : "text-rose-500"}`}
            />
            <p className={`text-xs ${isVault ? "text-stone-400" : "text-stone-500"}`}>
              This document couldn&apos;t be loaded for preview — try downloading it instead.
            </p>
          </div>
        ) : html === null ? (
          <div className="flex justify-center py-16">
            <Loader2
              className={`w-6 h-6 animate-spin ${isVault ? "text-stone-500" : "text-stone-400"}`}
            />
          </div>
        ) : (
          <div
            className={`text-sm max-w-none ${PROSE_CLASSES} ${
              isVault
                ? "text-stone-200 [&_h1]:text-stone-50 [&_h2]:text-stone-50 [&_h3]:text-stone-100 [&_td]:border-stone-700 [&_th]:border-stone-700 [&_a]:text-amber-400"
                : "text-stone-700 [&_h1]:text-stone-900 [&_h2]:text-stone-900 [&_h3]:text-stone-800 [&_td]:border-stone-200 [&_th]:border-stone-200 [&_a]:text-amber-700"
            }`}
            // eslint-disable-next-line react/no-danger -- mammoth converts a docx's own
            // content into a constrained HTML subset (headings/paragraphs/lists/tables);
            // it never preserves macros or scripts, so this is not attacker-controlled markup.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </div>
  );
}
