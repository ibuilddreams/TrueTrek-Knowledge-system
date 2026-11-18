"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatCoursePrice } from "@/lib/store";

// The portal's "Buy course" dialog, as the design draws it: the course and its
// price, a total, a payment method, and one button that pays.
//
// There is no payment gateway behind it, and the note says so in plain words
// rather than implying a card is charged — the only thing a purchase does is
// create the enrolment. The method select exists because the design has one;
// it has a single entry for the same reason the note is there.
const PAYMENT_METHODS = ["Visa ending 4242 (test)"];

export default function BuyCourseModal({
  isOpen,
  course,
  isSubmitting = false,
  onClose,
  onConfirm,
}) {
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);

  useEffect(() => {
    if (isOpen) setMethod(PAYMENT_METHODS[0]);
  }, [isOpen]);

  // Escape closes it, unless a purchase is already in flight — cancelling
  // mid-request would leave the student unsure whether they had bought it.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const price = formatCoursePrice(course?.amount);

  return (
    <AnimatePresence>
      {isOpen && course && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Buy course"
          onClick={isSubmitting ? undefined : onClose}
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-cn-ink/60 p-4 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative my-auto w-full max-w-[560px] overflow-hidden rounded-cn-lg bg-white shadow-cn-3"
          >
            <div className="grid gap-5 p-8">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.03em] text-cn-ink">
                  Buy course
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  aria-label="Close"
                  className="grid h-9 w-9 flex-none place-items-center rounded-cn-sm bg-cn-paper-2 text-cn-ink-2 transition-colors duration-150 hover:bg-cn-paper-3 hover:text-cn-ink disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-cn bg-cn-paper-2 p-4">
                <span className="min-w-0">
                  <b className="block truncate text-cn-ink">{course.title}</b>
                  {course.code && (
                    <small className="block text-cn-sm text-cn-muted">
                      {course.code}
                    </small>
                  )}
                </span>
                <b className="flex-none tabular-nums text-cn-ink">{price}</b>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-cn-rule pt-5">
                <b className="text-cn-ink">Total</b>
                <b className="text-cn-xl font-extrabold tracking-[-0.02em] tabular-nums text-cn-ink">
                  {price}
                </b>
              </div>

              <div className="grid gap-1">
                <label
                  htmlFor="buy-course-method"
                  className="text-cn-sm font-semibold text-cn-ink"
                >
                  Payment method
                </label>
                <select
                  id="buy-course-method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  disabled={isSubmitting}
                  className="h-[50px] w-full rounded-cn-sm border border-cn-muted bg-white px-4 text-cn-ink transition-colors duration-150 hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent disabled:opacity-60"
                >
                  {PAYMENT_METHODS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-cn-sm text-cn-muted">
                Prototype checkout: no payment is taken. The course is added to
                My courses straight away.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-cn-rule bg-cn-paper-2 px-8 py-5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-cn-sm border border-cn-rule-strong bg-white px-5 text-cn-sm font-semibold text-cn-ink transition-colors duration-150 hover:border-cn-ink disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm(course)}
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-cn-sm bg-cn-accent px-5 text-cn-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out enabled:hover:-translate-y-px enabled:hover:bg-cn-accent-2 disabled:opacity-70"
              >
                {isSubmitting ? "Processing…" : `Pay ${price}`}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
