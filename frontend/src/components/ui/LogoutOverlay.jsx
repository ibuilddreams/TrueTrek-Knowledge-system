"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

// Signing out covers the whole window — `SiteShell` renders this instead of the
// page — and lands on the cobalt login screen, so the overlay is on the cobalt
// palette too. The cream paper and pine spinner it used to draw read as a
// different product in the half-second before /login paints.

const STAGE_COPY = {
  loading: "Signing out...",
  success: "Signed out successfully.",
};

export default function LogoutOverlay({ stage }) {
  return (
    <div
      id="logout-overlay"
      role="alert"
      aria-live="assertive"
      className="min-h-screen flex items-center justify-center px-6 bg-cn-paper"
    >
      <div className="flex flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          {stage === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <CheckCircle2 className="w-10 h-10 text-cn-ok" />
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-10 h-10 border-4 border-cn-accent border-t-transparent rounded-full animate-spin"
            />
          )}
        </AnimatePresence>
        <motion.p
          key={stage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-xs font-sans uppercase tracking-widest text-cn-muted"
        >
          {STAGE_COPY[stage] || STAGE_COPY.loading}
        </motion.p>
      </div>
    </div>
  );
}
