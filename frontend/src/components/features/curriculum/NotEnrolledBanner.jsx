"use client";

import { Lock } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function NotEnrolledBanner() {
  const { isVault } = useTheme();

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 mb-6 ${
        isVault
          ? "bg-stone-900/40 border-stone-800 text-stone-400"
          : "bg-stone-50 border-stone-200/60 text-stone-500"
      }`}
    >
      <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
      <p className="text-xs leading-relaxed">
        You&apos;re not enrolled in this course yet. You can preview its modules and
        lessons below — contact your instructor or program administrator to be
        enrolled and unlock full access.
      </p>
    </div>
  );
}
