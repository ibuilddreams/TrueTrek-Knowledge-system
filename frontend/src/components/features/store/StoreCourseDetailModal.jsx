"use client";

import {
  BookOpen,
  Clock,
  GraduationCap,
  Layers,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatDurationMinutes } from "@/lib/curriculum";
import { formatCoursePrice } from "@/lib/store";
import CloseButton from "@/components/ui/CloseButton";

export default function StoreCourseDetailModal({
  course,
  isInCart,
  isPending = false,
  canPurchase = true,
  onClose,
  onToggleCart,
}) {
  return (
    <AnimatePresence>
      {course && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-6 bg-ink/60 backdrop-blur-xs"
          id="store-detail-modal-layout"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-paper rounded-panel overflow-hidden max-w-xl w-full border border-line shadow-elevated flex flex-col justify-between"
          >
            <CloseButton
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-ink bg-paper/90 p-2 rounded-full shadow-md z-10 border border-line transition"
              iconClassName="w-4 h-4"
            />

            <div className="relative h-64 bg-porcelain">
              {course.image ? (
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pine to-ink">
                  <BookOpen className="w-14 h-14 text-gold/70" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-paper text-left">
                <span className="text-[10px] font-sans tracking-widest font-medium uppercase bg-gold text-ink px-2 py-0.5 rounded-md mb-2 inline-block">
                  {course.category?.name || "General"}
                </span>
                <h3 className="text-2xl font-serif font-light tracking-tight text-paper leading-[0.92]">
                  {course.title}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-sans font-medium text-paper bg-pine px-3 py-1.5 rounded-lg capitalize">
                  {(course.difficulty || "beginner").toLowerCase()}
                </span>
                <div className="text-right">
                  <span className="text-[10px] font-sans font-medium text-muted block uppercase tracking-widest">
                    Unit Investment
                  </span>
                  <span className="text-2xl font-sans font-semibold text-ink">
                    {formatCoursePrice(course.amount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-line pt-4">
                <p className="text-sm font-sans uppercase text-pine tracking-widest font-medium">
                  Course Overview
                </p>
                <p className="text-sm text-muted leading-relaxed font-light">
                  {course.description || "No description has been added for this course yet."}
                </p>
              </div>

              <div className="space-y-2 bg-porcelain p-4 border border-line rounded-xl text-sm">
                <p className="font-semibold flex items-center gap-1.5 text-ink">
                  <ShieldCheck className="w-4 h-4 text-moss" />
                  Course Details
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted leading-relaxed">
                  <Clock className="w-3.5 h-3.5 text-pine shrink-0" />
                  {formatDurationMinutes(course.duration_minutes)}
                </div>
                {course.tags?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted leading-relaxed">
                    <Layers className="w-3.5 h-3.5 text-pine shrink-0" />
                    {course.tags.map((tag) => tag.name).join(", ")}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 border-t border-line mt-4 flex justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-porcelain hover:bg-line/40 text-ink font-sans text-sm uppercase tracking-widest font-medium py-3 rounded-full transition"
              >
                Return to Catalog
              </button>
              {canPurchase ? (
                <button
                  type="button"
                  onClick={() => {
                    onToggleCart(course);
                    onClose();
                  }}
                  disabled={isPending}
                  className={`flex-1 font-sans text-sm uppercase tracking-widest font-medium py-3 rounded-full transition flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isInCart
                      ? "bg-sage/60 hover:bg-rose/40 text-moss hover:text-clay"
                      : "bg-pine hover:bg-moss text-paper"
                  }`}
                >
                  {isInCart ? (
                    <>
                      <X className="w-4 h-4" /> Remove from Cart
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Add to Cart
                    </>
                  )}
                </button>
              ) : (
                <span
                  className="flex-1 font-sans text-xs uppercase tracking-widest font-medium py-3 rounded-full flex items-center justify-center gap-1.5 bg-porcelain text-muted"
                  title="Only student accounts can add courses to their cart"
                >
                  <GraduationCap className="w-4 h-4" />
                  Student Accounts Only
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
