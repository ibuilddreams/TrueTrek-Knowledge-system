"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle } from "lucide-react";

export default function DiscardChangesDialog({ isOpen, onDiscard, onContinue }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white border border-stone-200 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

            <div className="p-6">
              <div className="w-11 h-11 bg-amber-50 border border-amber-200/50 text-amber-700 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-900">
                Discard unsaved changes?
              </h3>
              <p className="text-xs text-stone-500 font-light mt-1.5">
                You have made changes to your profile that haven&apos;t been saved. This action cannot be undone.
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onContinue}
                  className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all border border-stone-200 shadow-sm"
                >
                  Continue Editing
                </button>

                <button
                  type="button"
                  onClick={onDiscard}
                  className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
