"use client";

import { Plus } from "lucide-react";

export default function NewMessageButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition cursor-pointer shrink-0"
    >
      <Plus className="w-3.5 h-3.5" />
      New Message
    </button>
  );
}
