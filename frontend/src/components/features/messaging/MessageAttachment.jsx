"use client";

import { FileText } from "lucide-react";

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

export default function MessageAttachment({ message }) {
  if (!message.attachment) return null;

  if (message.attachment_type === "IMAGE") {
    return (
      <a href={message.attachment} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={message.attachment}
          alt={message.attachment_original_name || "Attachment"}
          className="max-w-56 max-h-56 rounded-lg object-cover border border-black/5"
        />
      </a>
    );
  }

  if (message.attachment_type === "VIDEO") {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video src={message.attachment} controls className="max-w-64 rounded-lg border border-black/5" />
    );
  }

  return (
    <a
      href={message.attachment}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/60 border border-black/10 hover:bg-white transition"
    >
      <FileText className="w-6 h-6 shrink-0 text-stone-500" />
      <span className="min-w-0">
        <span className="block text-xs font-semibold truncate max-w-40">
          {message.attachment_original_name || "Attachment"}
        </span>
        <span className="block text-[10px] font-mono text-stone-400">
          {formatFileSize(message.attachment_size)}
        </span>
      </span>
    </a>
  );
}
