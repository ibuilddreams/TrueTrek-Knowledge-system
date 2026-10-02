"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BookOpen, CheckCircle2, Heart, ShoppingCart, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CART_QUERY_KEY, useCart } from "@/hooks/useCart";
import { useCourseEnrollment } from "@/hooks/useCourseEnrollment";
import { useWishlist } from "@/hooks/useWishlist";
import { getPortalRouteForRole, ROUTES } from "@/constants/routes";
import { addToCart } from "@/services/cartService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import { toastError } from "@/lib/toast";

const PRIMARY_BUTTON =
  "w-full inline-flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper text-xs font-sans font-medium uppercase tracking-widest px-5 py-3.5 rounded-full shadow-soft transition disabled:opacity-60 disabled:cursor-not-allowed";

const SECONDARY_BUTTON =
  "w-full inline-flex items-center justify-center gap-2 border border-pine text-pine hover:bg-pine hover:text-paper text-xs font-sans font-medium uppercase tracking-widest px-5 py-3.5 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed";

// Sticky purchase card: thumbnail, price, add to cart / wishlist / buy now,
// plus what's included. Students who already own the course get a "Start
// learning" link instead; teachers and admins get a link to their portal.
export default function CoursePurchaseCard({ course }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, isAuthenticated, isStudent, role } = useAuth();
  const { isGuest, isInCart, isPending: isCartPending, addCourse, toggleCourse } = useCart();
  const wishlist = useWishlist();
  const enrollmentQuery = useCourseEnrollment(course.id);

  const isAuthResolved = status !== "idle" && status !== "loading";
  const inCart = isInCart(course.id);
  const isWishlisted = wishlist.isInWishlist(course.id);

  // Adds the course (if needed) and goes straight to the cart. Students' carts
  // live on the server, so wait for the add to land before navigating.
  async function handleBuyNow() {
    if (inCart) {
      router.push(ROUTES.CART);
      return;
    }
    if (isGuest) {
      addCourse(course);
      router.push(ROUTES.CART);
      return;
    }
    try {
      await addToCart(course.id);
      await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      router.push(ROUTES.CART);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to add this course to your cart."));
    }
  }

  let actions;
  if (!isAuthResolved || (isAuthenticated && isStudent && enrollmentQuery.isLoading)) {
    actions = (
      <button type="button" disabled className={PRIMARY_BUTTON}>
        Loading…
      </button>
    );
  } else if (isAuthenticated && !isStudent) {
    actions = (
      <Link href={getPortalRouteForRole(role)} className={PRIMARY_BUTTON}>
        Open your portal
        <ArrowRight className="w-4 h-4" />
      </Link>
    );
  } else if (enrollmentQuery.data) {
    actions = (
      <>
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          You're enrolled in this course
        </p>
        <Link href={`${ROUTES.STUDENT_PORTAL}?tab=courses&course=${course.id}`} className={PRIMARY_BUTTON}>
          Start learning
          <ArrowRight className="w-4 h-4" />
        </Link>
      </>
    );
  } else {
    actions = (
      <>
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => toggleCourse(course)}
            disabled={isCartPending(course.id)}
            className={`${inCart ? SECONDARY_BUTTON : PRIMARY_BUTTON} flex-1`}
          >
            {inCart ? <X className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            {inCart ? "Remove from cart" : "Add to cart"}
          </button>
          <button
            type="button"
            onClick={() => wishlist.toggleCourse(course)}
            disabled={wishlist.isPending(course.id)}
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
            className="shrink-0 w-12 rounded-full border border-pine text-pine hover:bg-porcelain flex items-center justify-center transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? "fill-clay text-clay" : ""}`} />
          </button>
        </div>
        <button type="button" onClick={handleBuyNow} className={SECONDARY_BUTTON}>
          Buy now
        </button>
        {inCart && (
          <Link
            href={ROUTES.CART}
            className="block text-center text-xs font-sans font-medium text-pine hover:underline"
          >
            View cart
          </Link>
        )}
      </>
    );
  }

  return (
    <div className="rounded-card border border-line bg-paper shadow-elevated overflow-hidden">
      <div className="aspect-video bg-porcelain">
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pine to-ink">
            <BookOpen className="w-10 h-10 text-gold/70" />
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        <p className="text-3xl font-sans font-semibold text-ink">{formatCoursePrice(course.amount)}</p>
        <div className="space-y-3">{actions}</div>
      </div>
    </div>
  );
}
