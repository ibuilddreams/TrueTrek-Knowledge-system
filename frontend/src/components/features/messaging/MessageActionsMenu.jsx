"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import Popover from "@/components/ui/Popover";

export default function MessageActionsMenu({ isOpen, onClose, anchorRef, isMine, onCopy, onEdit, onDelete }) {
  const items = [
    { key: "copy", label: "Copy", icon: Copy, onSelect: onCopy },
    ...(isMine ? [{ key: "edit", label: "Edit", icon: Pencil, onSelect: onEdit }] : []),
    ...(isMine ? [{ key: "delete", label: "Delete", icon: Trash2, onSelect: onDelete, danger: true }] : []),
  ];

  return (
    <Popover isOpen={isOpen} onClose={onClose} anchorRef={anchorRef} width={160}>
      {items.map(({ key, label, icon: Icon, onSelect, danger }) => (
        <button
          key={key}
          type="button"
          onClick={() => {
            onClose();
            onSelect();
          }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
            danger ? "text-rose-700 hover:bg-rose-50" : "text-stone-700 hover:bg-stone-50"
          }`}
        >
          <Icon className={`w-3.5 h-3.5 ${danger ? "text-rose-500" : "text-stone-400"}`} />
          {label}
        </button>
      ))}
    </Popover>
  );
}
