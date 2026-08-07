"use client";

import { motion, AnimatePresence } from "motion/react";

export const VIEW_TRANSITION_MOTION = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.5, ease: "easeInOut" },
};

/**
 * Shared enter/exit animation for anything that mounts as a "new view":
 * routed pages, active tab content, or any conditionally rendered section.
 * Keep the motion values here so route transitions and component-level
 * transitions stay visually identical.
 */
export default function ViewTransition({
  viewKey,
  children,
  className,
  mode = "wait",
}) {
  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={viewKey}
        className={className}
        {...VIEW_TRANSITION_MOTION}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
