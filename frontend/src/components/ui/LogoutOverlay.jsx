"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

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
      className="min-h-screen flex items-center justify-center px-6 bg-[#faf9f6]"
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
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-10 h-10 border-4 border-pine border-t-transparent rounded-full animate-spin"
            />
          )}
        </AnimatePresence>
        <motion.p
          key={stage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-xs font-mono uppercase tracking-widest text-muted"
        >
          {STAGE_COPY[stage] || STAGE_COPY.loading}
        </motion.p>
      </div>
    </div>
  );
}
