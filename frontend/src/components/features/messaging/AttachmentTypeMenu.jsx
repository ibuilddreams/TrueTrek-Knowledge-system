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
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    key: "video",
    label: "Video",
    caption: "Clip or recording",
    icon: Video,
    accept: "video/*",
    tone: "bg-rose-50 text-rose-700 border-rose-100",
  },
  {
    key: "file",
    label: "File",
    caption: "Document or other file",
    icon: FileText,
    accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt",
    tone: "bg-stone-100 text-stone-700 border-stone-200",
  },
];

export default function AttachmentTypeMenu({ isOpen, onClose, anchorRef, onSelect }) {
  return (
    <Popover isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={224} align="start">
      <div className="py-1 divide-y divide-stone-100">
        {ATTACHMENT_TYPES.map(({ key, label, caption, icon: Icon, accept, tone }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              onClose();
              onSelect(accept);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <span
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tone}`}
            >
              <Icon className="w-4 h-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-stone-800">{label}</span>
              <span className="block text-[11px] text-stone-400 font-light truncate">
                {caption}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Popover>
  );
}
