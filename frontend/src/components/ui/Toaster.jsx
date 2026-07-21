"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@/hooks/useTheme";

export default function Toaster() {
  const { isVault } = useTheme();

  return (
    <>
      <style>{`
        [data-sonner-toast][data-type="success"] {
          background: #059669 !important;
          border-color: #059669 !important;
          color: #fff !important;
        }
        [data-sonner-toast][data-type="error"] {
          background: #dc2626 !important;
          border-color: #dc2626 !important;
          color: #fff !important;
        }
        [data-sonner-toast][data-type="success"] [data-title],
        [data-sonner-toast][data-type="success"] [data-description],
        [data-sonner-toast][data-type="success"] [data-icon],
        [data-sonner-toast][data-type="error"] [data-title],
        [data-sonner-toast][data-type="error"] [data-description],
        [data-sonner-toast][data-type="error"] [data-icon] {
          color: #fff !important;
        }
        [data-sonner-toast][data-type="success"] [data-close-button],
        [data-sonner-toast][data-type="error"] [data-close-button] {
          background: rgba(255, 255, 255, 0.15) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
          color: #fff !important;
        }
        [data-sonner-toast][data-type="success"] [data-close-button]:hover,
        [data-sonner-toast][data-type="error"] [data-close-button]:hover {
          background: rgba(255, 255, 255, 0.3) !important;
        }
      `}</style>
      <SonnerToaster
        position="bottom-right"
        visibleToasts={1}
        theme={isVault ? "dark" : "light"}
        duration={4000}
        closeButton
        style={{
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "0",
          "--toast-close-button-transform": "translate(35%, -35%)",
        }}
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
            closeButton: isVault
              ? "!bg-stone-900 !border-stone-700 !text-stone-300 hover:!text-white"
              : "!bg-white !border-stone-250 !text-stone-400 hover:!text-stone-900",
            warning: "!border-2 !border-amber-500",
          },
        }}
      />
    </>
  );
}
