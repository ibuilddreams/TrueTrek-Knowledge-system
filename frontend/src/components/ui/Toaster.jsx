"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/hooks/useTheme";

export default function Toaster() {
  const { isVault } = useTheme();

  return (
    <SonnerToaster
      position="bottom-right"
      visibleToasts={1}
      theme={isVault ? "dark" : "light"}
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border font-sans shadow-lg " +
            (isVault
              ? "bg-[#141211] border-stone-800 text-stone-200"
              : "bg-white border-stone-250 text-stone-900"),
          title: "font-serif font-bold",
          description: isVault ? "text-stone-400" : "text-stone-500",
          actionButton: "bg-amber-600 text-white",
          cancelButton: isVault
            ? "bg-stone-850 text-stone-300"
            : "bg-stone-100 text-stone-700",
          success: "border-emerald-500/40",
          error: "border-red-500/40",
          warning: "border-amber-500/40",
        },
      }}
    />
  );
}
