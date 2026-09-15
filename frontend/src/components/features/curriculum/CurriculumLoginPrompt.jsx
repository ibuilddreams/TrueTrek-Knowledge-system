"use client";

import { useRouter } from "next/navigation";
import { LogIn, ShieldAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ROUTES } from "@/constants/routes";
import CloseButton from "@/components/ui/CloseButton";

export default function CurriculumLoginPrompt({ course, onClose }) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {course && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4 text-left border bg-white border-stone-250"
          >
            <div className="flex items-start justify-between pb-3.5 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-amber-500/10 border border-amber-500/20 text-amber-750">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-stone-900">
                    Sign In Required
                  </h3>
                  <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                    Restricted curriculum content
                  </p>
                </div>
              </div>
              <CloseButton
                onClick={onClose}
                className="p-1 border rounded-full transition shrink-0 border-stone-200 text-stone-400 hover:text-stone-900 hover:bg-stone-50"
                iconClassName="w-4 h-4"
              />
            </div>

            <p className="text-sm leading-relaxed text-stone-600">
              Log in to view the full curriculum for{" "}
              <strong className="text-stone-800">
                {course.title}
              </strong>
              , including its modules and lessons.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl transition text-stone-500 hover:text-stone-900 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => router.push(ROUTES.LOGIN)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider rounded-xl transition bg-stone-900 hover:bg-stone-800 text-white"
              >
                <LogIn className="w-3.5 h-3.5" />
                Log In
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
