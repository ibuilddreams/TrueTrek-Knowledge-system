"use client";

import { Sparkles, Trophy } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";

export default function PortalToast({ notification, onDismiss }) {
  if (!notification) return null;

  const isBadge = notification.type === "badge";

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-stone-900 border border-stone-800 text-white rounded-2xl shadow-2xl p-5 flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
          isBadge
            ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
            : "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
        }`}
      >
        {isBadge ? (
          <Trophy className="w-5 h-5 animate-bounce" />
        ) : (
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
        )}
      </div>
      <div className="flex-grow space-y-1 min-w-0">
        <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
          {notification.title}
        </h5>
        <p className="text-[11px] text-stone-300 font-light leading-normal">
          {notification.desc}
        </p>
      </div>
      <CloseButton
        onClick={onDismiss}
        className="text-stone-500 hover:text-white p-1 hover:bg-stone-800 rounded-full transition shrink-0"
        iconClassName="w-3.5 h-3.5"
        title="Dismiss notification"
      />
    </div>
  );
}
