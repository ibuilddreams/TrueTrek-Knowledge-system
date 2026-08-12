"use client";

import { BookOpen, GraduationCap, Info, Plus, X } from "lucide-react";
import { formatCoursePrice } from "@/lib/store";

export default function StoreCourseCard({
  course,
  isInCart,
  isPending = false,
  canPurchase = true,
  onViewDetails,
  onToggleCart,
}) {
  return (
    <div
      id={`store-course-card-${course.id}`}
      className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
    >
      <div>
        <div className="relative h-56 overflow-hidden bg-stone-100">
          {course.image ? (
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950">
              <BookOpen className="w-10 h-10 text-amber-500/70" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 to-transparent"></div>

          <span className="absolute top-4 left-4 text-[9px] font-mono tracking-wider font-extrabold uppercase bg-stone-950/80 text-amber-500 border border-stone-800/80 px-2.5 py-1 rounded-md backdrop-blur-xs">
            {course.category?.name || "General"}
          </span>

          <span className="absolute bottom-4 right-4 text-[9px] font-mono font-semibold bg-white/90 text-stone-800 px-2.5 py-1 rounded-md shadow-xs capitalize">
            {(course.difficulty || "beginner").toLowerCase()}
          </span>
        </div>

        <div className="p-6 space-y-3">
          <h3 className="text-base font-serif font-bold tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed font-light line-clamp-3">
            {course.description || "No description has been added for this course yet."}
          </p>
        </div>
      </div>

      <div className="p-6 pt-0 border-t border-stone-100 mt-4 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono font-semibold text-stone-400 block uppercase tracking-wider">
            Invest Cost
          </span>
          <span className="text-xl font-mono font-bold text-stone-900">
            {formatCoursePrice(course.amount)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`view-details-${course.id}`}
            type="button"
            onClick={() => onViewDetails(course)}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-2.5 rounded-xl text-xs transition duration-200"
            title="View Course Details"
          >
            <Info className="w-4 h-4" />
          </button>
          {canPurchase ? (
            <button
              id={`toggle-cart-${course.id}`}
              type="button"
              onClick={() => onToggleCart(course)}
              disabled={isPending}
              className={`font-mono text-xs uppercase font-extrabold px-4 py-2.5 rounded-xl tracking-wider transition-all duration-200 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                isInCart
                  ? "bg-stone-200 hover:bg-red-100 text-stone-700 hover:text-red-700"
                  : "bg-stone-950 hover:bg-stone-800 text-white"
              }`}
            >
              {isPending ? (
                "..."
              ) : isInCart ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  Remove
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Acquire
                </>
              )}
            </button>
          ) : (
            <span
              className="font-mono text-[10px] uppercase font-bold px-3 py-2.5 rounded-xl tracking-wider flex items-center gap-1.5 bg-stone-100 text-stone-400"
              title="Only student accounts can add courses to their cart"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student Only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
