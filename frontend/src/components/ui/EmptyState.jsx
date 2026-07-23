"use client";

import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, label = "Nothing to show yet.", action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-stone-400">
      <Icon className="w-6 h-6" />
      <p className="text-xs font-light text-center">{label}</p>
      {action}
    </div>
  );
}
