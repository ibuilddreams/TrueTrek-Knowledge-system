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
      className="bg-paper border border-line rounded-card overflow-hidden shadow-soft hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
    >
      <div>
        <div className="relative h-56 overflow-hidden bg-porcelain">
          {course.image ? (
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pine to-ink">
              <BookOpen className="w-10 h-10 text-gold/70" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent"></div>

          <span className="absolute top-4 left-4 text-[10px] font-sans tracking-widest font-medium uppercase bg-ink/80 text-gold border border-ink/60 px-2.5 py-1 rounded-md backdrop-blur-xs">
            {course.category?.name || "General"}
          </span>

          <span className="absolute bottom-4 right-4 text-[10px] font-sans font-medium bg-paper/90 text-ink px-2.5 py-1 rounded-md shadow-xs capitalize">
            {(course.difficulty || "beginner").toLowerCase()}
          </span>
        </div>

        <div className="p-6 space-y-3">
          <h3 className="text-base font-serif font-light tracking-tight text-ink group-hover:text-pine transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-sm text-muted leading-relaxed font-light line-clamp-3">
            {course.description || "No description has been added for this course yet."}
          </p>
        </div>
      </div>

      <div className="p-6 pt-0 border-t border-line mt-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-sans font-medium text-muted block uppercase tracking-widest">
            Invest Cost
          </span>
          <span className="text-xl font-sans font-semibold text-ink">
            {formatCoursePrice(course.amount)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`view-details-${course.id}`}
            type="button"
            onClick={() => onViewDetails(course)}
            className="bg-porcelain hover:bg-line/40 text-ink p-2.5 rounded-xl text-sm transition duration-200"
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
              className={`font-sans text-xs uppercase font-medium px-4 py-2.5 rounded-full tracking-widest transition-all duration-200 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                isInCart
                  ? "bg-sage/60 hover:bg-rose/40 text-moss hover:text-clay"
                  : "bg-pine hover:bg-moss text-paper"
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
              className="font-sans text-[11px] uppercase font-medium px-3 py-2.5 rounded-xl tracking-widest flex items-center gap-1.5 bg-porcelain text-muted"
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
