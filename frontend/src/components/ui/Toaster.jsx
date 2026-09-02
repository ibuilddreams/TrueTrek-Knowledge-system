"use client";

import { Toaster as SonnerToaster } from "sonner";

export default function Toaster() {
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
        theme="light"
        duration={4000}
        closeButton
        style={{
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "0",
          "--toast-close-button-transform": "translate(35%, -35%)",
        }}
        toastOptions={{
          classNames: {
            toast: "rounded-2xl border font-sans shadow-lg bg-paper border-line text-ink",
            title: "font-serif font-light",
            description: "text-muted",
            actionButton: "bg-pine text-paper",
            cancelButton: "bg-porcelain text-ink",
            closeButton:
              "!bg-white !border-line !text-muted hover:!text-ink",
            warning: "!border-2 !border-gold",
          },
        }}
      />
    </>
  );
}
