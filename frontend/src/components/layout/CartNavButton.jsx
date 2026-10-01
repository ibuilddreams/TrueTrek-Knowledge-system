"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { ROUTES } from "@/constants/routes";

export default function CartNavButton() {
  const pathname = usePathname();
  const { isAuthenticated, isStudent } = useAuth();
  const { count } = useCart();

  // Teachers and admins have no cart — guests and students do (guests are
  // prompted to sign in on the cart page itself).
  const canUseCart = !isAuthenticated || isStudent;
  if (!canUseCart) return null;

  const isActive = pathname?.startsWith(ROUTES.CART);
  const label = `View cart, ${count} ${count === 1 ? "course" : "courses"}`;

  return (
    <Link
      id="nav-cart-btn"
      href={ROUTES.CART}
      title="Course Cart"
      aria-label={label}
      className={`relative w-10 h-10 rounded-[14px] border flex items-center justify-center transition duration-200 hover:-translate-y-0.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-pine ${
        isActive
          ? "bg-pine text-paper border-pine"
          : "bg-white/60 text-ink border-ink/10 hover:bg-paper"
      }`}
    >
      <ShoppingCart className="w-4 h-4" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-gold text-ink text-[11px] font-bold flex items-center justify-center font-sans border-2 border-paper">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
