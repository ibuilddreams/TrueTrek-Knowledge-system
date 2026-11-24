"use client";

import { Plus } from "lucide-react";

export default function NewMessageButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-sm font-semibold rounded-xl shadow-md transition cursor-pointer shrink-0"
    >
      <Plus className="w-3.5 h-3.5" />
      New Message
    </button>
  );
}
