"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { ROUTES } from "@/constants/routes";

export default function WishlistNavButton() {
  const pathname = usePathname();
  const { isAuthenticated, isStudent } = useAuth();
  const { count } = useWishlist();

  // Same audience as the cart: guests (prompted to sign in on the page) and students.
  const canUseWishlist = !isAuthenticated || isStudent;
  if (!canUseWishlist) return null;

  const isActive = pathname?.startsWith(ROUTES.WISHLIST);
  const label = `View wishlist, ${count} ${count === 1 ? "course" : "courses"}`;

  return (
    <Link
      id="nav-wishlist-btn"
      href={ROUTES.WISHLIST}
      title="Wishlist"
      aria-label={label}
      className={`relative w-10 h-10 rounded-[14px] border flex items-center justify-center transition duration-200 hover:-translate-y-0.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-pine ${
        isActive
          ? "bg-pine text-paper border-pine"
          : "bg-white/60 text-ink border-ink/10 hover:bg-paper"
      }`}
    >
      <Heart className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-gold text-ink text-[11px] font-bold flex items-center justify-center font-sans border-2 border-paper">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
