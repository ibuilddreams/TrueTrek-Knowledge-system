"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Trophy, X, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ROUTES } from "@/constants/routes";

// Shown once a visitor has played the home page's free drill.
//
// This is its own overlay rather than `components/ui/Modal`, because it is a
// sales panel rather than a dialog: a perk list, its own header art and the
// home page's own layout, none of which `Modal`'s icon/title/subtitle header
// has a place for. (It used to be kept apart for a second reason — `Modal`
// was the porcelain/serif dialog and read as a different product here — but
// `Modal` is on this same cobalt system now, so only the layout reason is
// left.)
const PERKS = [
  {
    icon: Zap,
    title: "A new drill every morning",
    text: "One real dilemma a day, written for where you are now.",
  },
  {
    icon: Flame,
    title: "A streak worth keeping",
    text: "Every drill you finish counts, and the run is yours to protect.",
  },
  {
    icon: Trophy,
    title: "Points you can spend",
    text: "Drills, quests and courses all pay into the same balance.",
  },
];

export default function DrillSignupModal({ isOpen, onClose, result }) {
  const reducedMotion = useReducedMotion();
  const primaryRef = useRef(null);

  // Escape closes, and the page behind stops scrolling while it is open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    primaryRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-cn-ink/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drill-signup-title"
            initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reducedMotion ? 0 : 8,
              scale: reducedMotion ? 1 : 0.98,
            }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-cn-lg border border-cn-rule bg-white shadow-cn-3"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full text-cn-muted transition-colors duration-150 hover:bg-cn-paper-2 hover:text-cn-ink"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-8 max-[40rem]:p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cn-paper-3 px-3 py-1 text-cn-xs font-semibold text-cn-accent-3">
                That was today&apos;s free drill
              </span>

              <h2
                id="drill-signup-title"
                className="mt-4 text-cn-2xl font-extrabold tracking-[-0.03em] text-cn-ink"
              >
                Keep going tomorrow.
              </h2>

              <p className="mt-2 text-cn-ink-2">
                {result
                  ? `${
                      result.is_best
                        ? `You picked the strongest move — ${result.selected.score} out of 100.`
                        : `You scored ${result.selected.score} out of 100 on that one.`
                    } Visitors get one drill a day. With an account you get the rest — and they start counting.`
                  : "Visitors get one drill a day. With an account you get the rest — and they start counting."}
              </p>

              {/* The explanation lives here rather than in the tile, which
                  shares a bento row with two tiles that would stretch to
                  match anything it grew by. */}
              {result && (
                <div className="mt-5 grid gap-2 rounded-cn border border-cn-rule bg-cn-paper-2 p-4">
                  <b
                    className={`text-cn-sm font-bold ${
                      result.is_best ? "text-cn-ok" : "text-cn-ink"
                    }`}
                  >
                    {result.is_best
                      ? "Best move."
                      : `Option ${result.best.key} was the strongest move.`}
                  </b>
                  <p className="text-cn-sm text-cn-ink-2">{result.best.text}</p>
                  <p className="text-cn-sm text-cn-ink-2">
                    {result.best.rationale}
                  </p>
                </div>
              )}

              <ul className="mt-6 grid list-none gap-4 p-0">
                {PERKS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-cn-paper-3 text-cn-accent">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0">
                      <b className="block text-cn-sm font-bold text-cn-ink">
                        {title}
                      </b>
                      <span className="block text-cn-sm text-cn-ink-2">
                        {text}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3">
                <Link
                  ref={primaryRef}
                  href={ROUTES.SIGNUP}
                  className="inline-flex h-[50px] items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
                >
                  Create your free account
                  <ArrowRight className="h-[18px] w-[18px]" />
                </Link>
                <Link
                  href={ROUTES.LOGIN}
                  className="inline-flex h-[50px] items-center justify-center rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-cn-base font-semibold text-cn-ink transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-ink"
                >
                  I already have an account
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-cn-sm font-semibold text-cn-muted transition-colors duration-150 hover:text-cn-ink"
                >
                  Keep looking around
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
