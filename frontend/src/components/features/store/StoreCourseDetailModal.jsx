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
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-xs"
          id="store-detail-modal-layout"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-white rounded-3xl overflow-hidden max-w-xl w-full border border-stone-200 shadow-2xl flex flex-col justify-between"
          >
            <CloseButton
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 bg-white/90 p-2 rounded-full shadow-md z-10 border border-stone-200 transition"
              iconClassName="w-4 h-4"
            />

            <div className="relative h-64 bg-stone-100">
              {course.image ? (
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950">
                  <BookOpen className="w-14 h-14 text-amber-500/70" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 text-white text-left">
                <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase bg-amber-600 text-white px-2 py-0.5 rounded-md mb-2 inline-block">
                  {course.category?.name || "General"}
                </span>
                <h3 className="text-2xl font-serif font-bold tracking-tight text-white leading-tight">
                  {course.title}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-[#faece1] bg-[#1c1917] px-3 py-1.5 rounded-lg capitalize">
                  {(course.difficulty || "beginner").toLowerCase()}
                </span>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-semibold text-stone-400 block uppercase tracking-wider">
                    Unit Investment
                  </span>
                  <span className="text-2xl font-mono font-bold text-stone-900">
                    {formatCoursePrice(course.amount)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-stone-100 pt-4">
                <p className="text-sm font-mono uppercase text-amber-800 tracking-wider font-bold">
                  Course Overview
                </p>
                <p className="text-sm text-stone-600 leading-relaxed font-light">
                  {course.description || "No description has been added for this course yet."}
                </p>
              </div>

              <div className="space-y-2 bg-stone-50 p-4 border border-stone-200 rounded-xl text-sm">
                <p className="font-bold flex items-center gap-1.5 text-stone-850">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Course Details
                </p>
                <div className="flex items-center gap-1.5 text-xs text-stone-500 leading-relaxed">
                  <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  {formatDurationMinutes(course.duration_minutes)}
                </div>
                {course.tags?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 leading-relaxed">
                    <Layers className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    {course.tags.map((tag) => tag.name).join(", ")}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 pt-0 border-t border-stone-100 mt-4 flex justify-between gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-sm uppercase font-extrabold py-3 rounded-xl transition"
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
                  className={`flex-1 font-mono text-sm uppercase font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isInCart
                      ? "bg-stone-100 hover:bg-red-100 text-stone-700 hover:text-red-700"
                      : "bg-[#141211] hover:bg-amber-600 hover:text-white text-white"
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
                  className="flex-1 font-mono text-xs uppercase font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 bg-stone-100 text-stone-400"
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
