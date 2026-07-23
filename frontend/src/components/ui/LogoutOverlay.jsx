"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

const STAGE_COPY = {
  loading: "Signing out...",
  success: "Signed out successfully.",
};

export default function LogoutOverlay({ stage }) {
  const isVisible = stage === "loading" || stage === "success";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="logout-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950/70 backdrop-blur-sm px-6"
          role="alert"
          aria-live="assertive"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-stone-200 rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center gap-4 max-w-xs w-full text-center"
          >
            {stage === "success" ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            ) : (
              <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
            )}
            <p className="text-xs font-mono uppercase tracking-widest text-stone-600">
              {STAGE_COPY[stage]}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
