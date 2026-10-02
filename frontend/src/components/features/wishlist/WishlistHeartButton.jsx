"use client";

import { Heart } from "lucide-react";

// Round heart toggle used on course cards (overlaid on the thumbnail).
export default function WishlistHeartButton({
  isWishlisted,
  isPending = false,
  onToggle,
  className = "",
}) {
  const label = isWishlisted ? "Remove from wishlist" : "Add to wishlist";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      title={label}
      aria-label={label}
      aria-pressed={isWishlisted}
      className={`w-9 h-9 rounded-full bg-paper/95 border border-line shadow-soft flex items-center justify-center transition hover:scale-110 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-pine ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          isWishlisted ? "fill-clay text-clay" : "text-ink"
        }`}
      />
    </button>
  );
}
