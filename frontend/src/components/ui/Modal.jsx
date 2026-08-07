"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import IconBadge from "@/components/ui/IconBadge";
import { useTheme } from "@/hooks/useTheme";

let openModalCount = 0;
let previousBodyOverflow = "";

function lockBodyScroll() {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  openModalCount += 1;
}

function unlockBodyScroll() {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

export default function Modal({
  isOpen,
  onClose,
  icon,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}) {
  const { isVault } = useTheme();

  useEffect(() => {
    if (!isOpen) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [isOpen]);

  const canClose = typeof onClose === "function";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={`fixed inset-0 z-[100] backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto ${
            isVault ? "bg-black/70" : "bg-stone-900/60"
          }`}
          onClick={canClose ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`scrollbar-hide border rounded-2xl shadow-2xl w-full ${maxWidth} my-auto max-h-[90vh] overflow-y-auto relative ${
              isVault
                ? "bg-[#161412] border-stone-700/80"
                : "bg-white border-stone-200"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className={`absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 ${
                  isVault
                    ? "text-stone-500 hover:text-stone-200 hover:bg-white/10"
                    : "text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                }`}
                title="Close"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="p-5 sm:p-7">
              {(icon || title) && (
                <div className={`flex items-center gap-3 mb-5 ${canClose ? "pr-8" : ""}`}>
                  {icon && (
                    <IconBadge
                      icon={icon}
                      size="w-10 h-10"
                      iconSize="w-5 h-5"
                      className={`rounded-xl border shrink-0 ${
                        isVault
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-amber-600/10 text-amber-700 border-amber-200/40"
                      }`}
                    />
                  )}
                  <div>
                    {title && (
                      <h3
                        className={`text-lg font-serif font-bold leading-tight ${
                          isVault ? "text-stone-50" : "text-stone-900"
                        }`}
                      >
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p
                        className={`text-xs font-light ${
                          isVault ? "text-stone-400" : "text-stone-500"
                        }`}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
