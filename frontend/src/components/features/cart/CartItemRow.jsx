"use client";

import Link from "next/link";
import { BookOpen, Heart, Trash2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";

export default function CartItemRow({
  course,
  isRemoving = false,
  onRemove,
  onMoveToWishlist,
}) {
  return (
    <li
      id={`cart-item-${course.id}`}
      className={`flex gap-4 sm:gap-5 p-4 sm:p-5 bg-paper border border-line rounded-card shadow-soft transition-opacity ${
        isRemoving ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="w-24 h-24 sm:w-32 sm:h-28 rounded-xl overflow-hidden border border-line shrink-0 bg-porcelain">
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pine to-ink">
            <BookOpen className="w-7 h-7 text-gold/70" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-sans tracking-widest font-medium uppercase bg-ink/80 text-gold px-2 py-0.5 rounded-md">
              {course.category?.name || "General"}
            </span>
            <span className="text-[10px] font-sans font-medium bg-porcelain border border-line text-ink px-2 py-0.5 rounded-md capitalize">
              {(course.difficulty || "beginner").toLowerCase()}
            </span>
          </div>
          <h3 className="text-base font-serif font-light tracking-tight text-ink line-clamp-2">
            <Link href={`${ROUTES.STORE}/${course.slug}`} className="hover:text-pine transition-colors">
              {course.title}
            </Link>
          </h3>
          <p className="hidden sm:block text-xs text-muted font-light leading-relaxed line-clamp-2">
            {course.description || "No description has been added for this course yet."}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={() => onRemove(course.id)}
            disabled={isRemoving}
            className="text-muted hover:text-clay font-sans text-[11px] uppercase tracking-widest font-medium flex items-center gap-1.5 disabled:cursor-not-allowed disabled:hover:text-muted transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isRemoving ? "Removing..." : "Remove"}
          </button>
          {onMoveToWishlist && (
            <button
              type="button"
              onClick={() => onMoveToWishlist(course)}
              disabled={isRemoving}
              className="text-muted hover:text-pine font-sans text-[11px] uppercase tracking-widest font-medium flex items-center gap-1.5 disabled:cursor-not-allowed transition-colors"
            >
              <Heart className="w-3.5 h-3.5" />
              Move to wishlist
            </button>
          )}
          </div>
          <span className="text-lg font-sans font-semibold text-ink">
            {formatCoursePrice(course.amount)}
          </span>
        </div>
      </div>
    </li>
  );
}
