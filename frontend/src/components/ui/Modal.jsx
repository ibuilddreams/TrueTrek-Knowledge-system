"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import IconBadge from "@/components/ui/IconBadge";

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
          className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={canClose ? onClose : undefined}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`scrollbar-hide bg-white border border-stone-200 rounded-2xl shadow-2xl w-full ${maxWidth} my-auto max-h-[90vh] overflow-y-auto relative`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
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
                      className="bg-amber-600/10 text-amber-700 rounded-xl border border-amber-200/40 shrink-0"
                    />
                  )}
                  <div>
                    {title && (
                      <h3 className="text-lg font-serif font-bold text-stone-900 leading-tight">
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p className="text-xs text-stone-500 font-light">{subtitle}</p>
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
