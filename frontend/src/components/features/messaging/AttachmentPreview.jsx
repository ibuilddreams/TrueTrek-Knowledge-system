"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";

function formatFileSize(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function AttachmentPreview({ file, onRemove }) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return undefined;
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200">
      <span className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
        {isImage && imagePreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagePreviewUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <FileText className="w-4 h-4 text-stone-400" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-stone-700 truncate">{file.name}</span>
        <span className="block text-[10px] font-mono text-stone-400">{formatFileSize(file.size)}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attachment"
        className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
