"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Info, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { buildAuthUrl } from "@/lib/authRedirect";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import CartRecommendationCard from "@/components/features/cart/CartRecommendationCard";

const PRIMARY_LINK =
  "inline-flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper text-xs font-sans font-medium uppercase tracking-widest px-6 py-3 rounded-full shadow-soft transition";

export default function WishlistPage() {
  const router = useRouter();
  const { status, isAuthenticated, isStudent, role } = useAuth();
  const { courses, count, isLoading, isInWishlist, isPending: isWishlistPending, toggleCourse: toggleWishlist } =
    useWishlist();
  const { isInCart, isPending: isCartPending, toggleCourse: toggleCart } = useCart();

  const isAuthResolved = status !== "idle" && status !== "loading";

  let body;

  if (!isAuthResolved || isLoading) {
    body = (
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading wishlist..." />
      </div>
    );
  } else if (isAuthenticated && !isStudent) {
    body = (
      <div className="rounded-card border border-line bg-paper shadow-soft">
        <EmptyState
          icon={Heart}
          size="lg"
          label="Wishlists are for student accounts"
          description="Saving courses is available to student accounts only."
          action={
            <button
              type="button"
              onClick={() => router.push(getPortalRouteForRole(role))}
              className={PRIMARY_LINK}
            >
              Open My Portal
            </button>
          }
        />
      </div>
    );
  } else if (count === 0) {
    body = (
      <div className="rounded-card border border-dashed border-line bg-paper/70">
        <EmptyState
          icon={Heart}
          size="lg"
          label="Your wishlist is empty"
          description="Tap the heart on any course to save it here for later."
          action={
            <Link href={ROUTES.STORE} className={PRIMARY_LINK}>
              Browse Courses
            </Link>
          }
        />
      </div>
    );
  } else {
    body = (
      <div className="space-y-5">
        {!isAuthenticated && (
          <p className="flex items-start gap-2.5 rounded-xl border border-line bg-porcelain p-4 text-xs text-muted leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-px text-gold" />
            <span>
              You're browsing as a guest. Your wishlist is saved on this device —{" "}
              <Link
                href={buildAuthUrl(ROUTES.LOGIN, ROUTES.WISHLIST)}
                className="font-semibold text-pine underline"
              >
                sign in
              </Link>{" "}
              to keep it on your account.
            </span>
          </p>
        )}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {courses.map((course) => (
          <CartRecommendationCard
            key={course.id}
            course={course}
            isInCart={isInCart(course.id)}
            isPending={isCartPending(course.id)}
            isWishlisted={isInWishlist(course.id)}
            isWishlistPending={isWishlistPending(course.id)}
            onToggleCart={toggleCart}
            onToggleWishlist={toggleWishlist}
          />
        ))}
      </ul>
      </div>
    );
  }

  return (
    <div id="wishlist-page-container" className="min-h-screen cn-page-bg text-ink pb-24">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="mb-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 bg-ink/5 border border-gold/30 px-3.5 py-1.5 rounded-full text-gold font-sans text-xs font-medium uppercase tracking-widest">
            <Heart className="w-3.5 h-3.5" />
            Your Wishlist
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-ink leading-[0.95]">
            Saved for Later
          </h1>
          <p className="text-sm text-muted font-light max-w-xl leading-relaxed">
            {count > 0 && (!isAuthenticated || isStudent)
              ? `${count} ${count === 1 ? "course" : "courses"} saved. Add them to your cart whenever you're ready.`
              : "Courses you've saved to come back to."}
          </p>
        </div>

        {body}

        {count > 0 && (!isAuthenticated || isStudent) && (
          <div className="mt-10 flex justify-center">
            <Link
              href={ROUTES.CART}
              className="inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-widest text-muted hover:text-ink transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Go to cart
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
