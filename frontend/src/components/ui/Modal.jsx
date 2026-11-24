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

// `variant` is additive, the convention the cobalt rollout already follows for
// a shared component (see `AudienceCard`). "classic" is the porcelain/serif
// dialog the ~90 other call sites render and is deliberately unchanged;
// "cobalt" is the design file's `.dlgbox` — white paper, one cobalt signal,
// Inter, 24px radius and no gradient header bar — for the pages already moved
// onto that system. A cobalt page opening the classic dialog reads as a
// different product the moment it appears over the page.
export default function Modal({
  isOpen,
  onClose,
  icon,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
  variant = "classic",
}) {
  const reducedMotion = useReducedMotion();
  const isCobalt = variant === "cobalt";
  // Only the cobalt branch labels its panel: adding the attribute to the
  // classic one would change markup 90 screens render today for no visual gain.
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
          className={`fixed inset-0 z-[100] backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto ${
            isCobalt ? "bg-cn-ink/60" : "bg-ink/60"
          }`}
          onClick={canClose ? onClose : undefined}
        >
          <motion.div
            role={isCobalt ? "dialog" : undefined}
            aria-modal={isCobalt ? "true" : undefined}
            aria-labelledby={isCobalt && title ? titleId : undefined}
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: "easeOut" }}
            className={`tt-interactive scrollbar-hide w-full ${maxWidth} my-auto max-h-[90vh] overflow-y-auto relative ${
              isCobalt
                ? "rounded-cn-lg border border-cn-rule bg-white shadow-cn-3"
                : "border rounded-panel shadow-elevated bg-paper border-line"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            {/* The pine-to-gold seam is the porcelain system's signature and
                has no counterpart in the cobalt design, which marks a dialog
                with its radius and shadow alone. */}
            {!isCobalt && (
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pine via-moss to-gold" />
            )}

            {canClose && (
              <button
                type="button"
                onClick={onClose}
                className={
                  isCobalt
                    ? "absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-cn-sm bg-cn-paper-2 text-cn-ink-2 transition-colors duration-150 cursor-pointer hover:bg-cn-rule hover:text-cn-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent"
                    : "absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 text-muted hover:text-ink hover:bg-porcelain"
                }
                title="Close"
                aria-label="Close"
              >
                <X className={isCobalt ? "h-[18px] w-[18px]" : "w-4 h-4"} />
              </button>
            )}

            <div className={isCobalt ? "p-10 max-[40rem]:p-6" : "p-5 sm:p-7"}>
              {(icon || title) &&
                (isCobalt ? (
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
                      {subtitle && (
                        <p className="text-cn-sm text-cn-muted">{subtitle}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 mb-5 ${canClose ? "pr-8" : ""}`}>
                    {icon && (
                      <IconBadge
                        icon={icon}
                        size="w-10 h-10"
                        iconSize="w-5 h-5"
                        className="rounded-xl border shrink-0 bg-pine/10 text-pine border-pine/20"
                      />
                    )}
                    <div>
                      {title && (
                        <h3 className="text-lg font-serif font-light leading-tight text-ink">
                          {title}
                        </h3>
                      )}
                      {subtitle && (
                        <p className="text-xs font-light text-muted">{subtitle}</p>
                      )}
                    </div>
                  </div>
                ))}

              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
