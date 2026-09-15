"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";

/**
 * Teleports children to <body> as a fixed, full-viewport overlay — above the portal
 * header and sidebar nav — escaping any animated ancestor's transform (which would
 * otherwise confine a `position: fixed` descendant to that ancestor's box instead of
 * the real viewport). Shared by the lesson view itself and by its loading/error states,
 * so nothing upstream (course overview, "Back to My Courses", the loading spinner for
 * the course-detail fetch) is ever visible for a moment while deep-linking into a lesson.
 */
export default function FullScreenPortal({ children }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-70 overflow-y-auto bg-porcelain text-ink"
    >
      {children}
    </motion.div>,
    document.body
  );
}
