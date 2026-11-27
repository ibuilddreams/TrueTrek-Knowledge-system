"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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

/**
 * The design file's `.dlgbox` — white paper, one cobalt signal, Inter, 24px
 * radius and no gradient header bar.
 *
 * This used to carry a second "classic" variant: the porcelain/serif dialog on
 * cream paper under a pine-to-gold seam. The cobalt rollout finished, every one
 * of the ~90 call sites ended up on this design, and the `variant` prop went
 * with the last of them — a dialog that opens in a different design language
 * from the page beneath it reads as a different product.
 */
export default function Modal({
  isOpen,
  onClose,
  icon,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}) {
  const reducedMotion = useReducedMotion();
  const titleId = useId();

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
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          className="fixed inset-0 z-[100] backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto bg-cn-ink/60"
          onClick={canClose ? onClose : undefined}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: "easeOut" }}
            className={`tt-interactive scrollbar-hide w-full ${maxWidth} my-auto max-h-[90vh] overflow-y-auto relative rounded-cn-lg border border-cn-rule bg-white shadow-cn-3`}
            onClick={(event) => event.stopPropagation()}
          >
            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-cn-sm bg-cn-paper-2 text-cn-ink-2 transition-colors duration-150 cursor-pointer hover:bg-cn-rule hover:text-cn-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent"
                title="Close"
                aria-label="Close"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            )}

            <div className="p-10 max-[40rem]:p-6">
              {(icon || title) && (
                // The design's `.dlgbox` stacks: the 52px `.dlgic` tile on its
                // own row, then the heading, then the sub-line. Stacking also
                // keeps the heading clear of the close button, which sits in
                // the same band as the tile but at the far right.
                <div className="mb-4 grid gap-4">
                  {icon && (
                    <IconBadge
                      icon={icon}
                      size="h-[52px] w-[52px]"
                      iconSize="h-6 w-6"
                      className="rounded-2xl bg-cn-paper-3 text-cn-accent"
                    />
                  )}
                  <div className="grid gap-1">
                    {title && (
                      <h2
                        id={titleId}
                        className="text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink"
                      >
                        {title}
                      </h2>
                    )}
                    {subtitle && <p className="text-cn-sm text-cn-muted">{subtitle}</p>}
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
