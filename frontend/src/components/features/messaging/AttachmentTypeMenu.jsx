"use client";

import { FileText, Image as ImageIcon, Video } from "lucide-react";
import Popover from "@/components/ui/Popover";

const ATTACHMENT_TYPES = [
  {
    key: "image",
    label: "Image",
    caption: "Photo or picture",
    icon: ImageIcon,
    accept: "image/*",
    tone: "bg-cn-p-soft text-cn-p-soft-ink border-cn-p-accent-soft",
  },
  {
    key: "video",
    label: "Video",
    caption: "Clip or recording",
    icon: Video,
    accept: "video/*",
    tone: "bg-cn-p-bad-bg text-cn-p-bad border-cn-p-bad-bg",
  },
  {
    key: "file",
    label: "File",
    caption: "Document or other file",
    icon: FileText,
    accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt",
    tone: "bg-cn-p-neutral-bg text-cn-p-ink border-cn-p-line-2",
  },
];

export default function AttachmentTypeMenu({ isOpen, onClose, anchorRef, onSelect }) {
  return (
    <Popover isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={224} align="start">
      <div className="py-1 divide-y divide-cn-p-line">
        {ATTACHMENT_TYPES.map(({ key, label, caption, icon: Icon, accept, tone }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              onClose();
              onSelect(accept);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-cn-p-page transition-colors cursor-pointer"
          >
            <span
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tone}`}
            >
              <Icon className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-cn-p-ink">{label}</span>
              <span className="block text-[11px] text-cn-p-muted font-light truncate">
                {caption}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Popover>
  );
}
