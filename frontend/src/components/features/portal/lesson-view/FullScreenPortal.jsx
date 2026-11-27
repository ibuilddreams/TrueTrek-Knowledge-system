"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";

/**
 * Teleports children to <body> as a fixed, full-viewport overlay — above the portal
 * header and sidebar nav — escaping any animated ancestor's transform (which would
 * otherwise confine a `position: fixed` descendant to that ancestor's box instead of
 * the real viewport).
 *
 * This is how a surface that genuinely owns the device hands itself the whole
 * screen: the live classroom and a War Room Live room, both of which hold the
 * camera or microphone. Coursework does not belong here — a quiz renders
 * inside its portal tab, with the sidebar and top bar left alone.
 *
 * Despite living in this folder it is no longer used by the lesson view.
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
