"use client";

import Link from "next/link";
import { BookOpen, Flame, Plus, Users, X } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";
import WishlistHeartButton from "@/components/features/wishlist/WishlistHeartButton";

// Compact course card used by the cart suggestions carousel and the wishlist
// grid. `showPopularity` adds the "Popular" badge + student count (Most
// purchased tab); otherwise the grade range is shown instead.
export default function CartRecommendationCard({
  course,
  isInCart,
  isPending = false,
  isWishlisted = false,
  isWishlistPending = false,
  showPopularity = false,
  onToggleCart,
  onToggleWishlist,
  className = "",
}) {
  const purchaseCount = course.purchase_count || 0;
  const detailHref = `${ROUTES.STORE}/${course.slug}`;

  return (
    <li
      id={`cart-recommendation-${course.id}`}
      className={`bg-paper border border-line rounded-card overflow-hidden shadow-soft hover:shadow-elevated hover:border-pine/30 transition-shadow duration-300 flex flex-col group ${className}`}
    >
      <div className="relative aspect-video overflow-hidden bg-porcelain">
        <Link
          href={detailHref}
          className="block w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pine"
          aria-label={`View details for ${course.title}`}
        >
          {course.image ? (
            <img
              src={course.image}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pine to-ink">
              <BookOpen className="w-8 h-8 text-gold/70" />
            </div>
          )}
        </Link>

        <span className="pointer-events-none absolute top-3 left-3 text-[10px] font-sans tracking-widest font-medium uppercase bg-ink/80 text-gold px-2 py-0.5 rounded-md">
          {course.category?.name || "General"}
        </span>

        {onToggleWishlist && (
          <WishlistHeartButton
            isWishlisted={isWishlisted}
            isPending={isWishlistPending}
            onToggle={() => onToggleWishlist(course)}
            className="absolute top-2.5 right-2.5"
          />
        )}

        {showPopularity && purchaseCount > 0 && (
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1 text-[10px] font-sans font-semibold bg-gold text-ink px-2 py-0.5 rounded-md shadow-xs">
            <Flame className="w-3 h-3" />
            Popular
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2">
        <Link href={detailHref} className="text-left focus:outline-none focus-visible:underline">
          <h3 className="text-[15px] font-serif tracking-tight text-ink group-hover:text-pine transition-colors line-clamp-2 min-h-[2.6rem] leading-snug">
            {course.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-[11px] text-muted font-sans">
          <span className="capitalize">{(course.difficulty || "beginner").toLowerCase()}</span>
          {showPopularity && purchaseCount > 0 ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                {purchaseCount.toLocaleString()} {purchaseCount === 1 ? "student" : "students"}
              </span>
            </>
          ) : (
            course.grade_label && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{course.grade_label}</span>
              </>
            )
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between gap-3">
          <span className="text-lg font-sans font-semibold text-ink">
            {formatCoursePrice(course.amount)}
          </span>
          <button
            type="button"
            onClick={() => onToggleCart(course)}
            disabled={isPending}
            className={`font-sans text-[11px] uppercase font-medium px-4 py-2.5 rounded-full tracking-widest transition-all duration-200 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed ${
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
                Add to cart
              </>
            )}
          </button>
        </div>
      </div>
    </li>
  );
}
