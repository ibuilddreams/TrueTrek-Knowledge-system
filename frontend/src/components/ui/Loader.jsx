"use client";

import { useTheme } from "@/hooks/useTheme";

export default function Loader({ fullScreen = true, label }) {
  const { isVault } = useTheme();

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      {label && (
        <p
          className={
            "text-xs font-mono uppercase tracking-widest animate-pulse " +
            (isVault ? "text-stone-400" : "text-stone-500")
          }
        >
          {label}
        </p>
      )}
    </div>
  );

  if (!fullScreen) {
    return spinner;
  }

  return (
    <div
      className={
        "min-h-[80vh] flex items-center justify-center " +
        (isVault ? "bg-[#141211]" : "bg-[#faf9f6]")
      }
    >
      {spinner}
    </div>
  );
}
