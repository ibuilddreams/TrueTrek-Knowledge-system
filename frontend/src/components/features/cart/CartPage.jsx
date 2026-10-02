"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Info, ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CART_QUERY_KEY, useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { buildAuthUrl } from "@/lib/authRedirect";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { checkoutCart } from "@/services/cartService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import StorePaymentModal from "@/components/features/store/StorePaymentModal";
import CartItemRow from "./CartItemRow";
import CartOrderSummary from "./CartOrderSummary";
import CartPopularTopics from "./CartPopularTopics";
import CartRecommendations from "./CartRecommendations";
import SignInToPurchaseModal from "./SignInToPurchaseModal";

const PRIMARY_LINK =
  "inline-flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper text-xs font-sans font-medium uppercase tracking-widest px-6 py-3 rounded-full shadow-soft transition";

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, isAuthenticated, isStudent, role } = useAuth();
  const { courses, count, isLoading, isPending, removeCourse } = useCart();

  const wishlist = useWishlist();

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSignInPromptOpen, setIsSignInPromptOpen] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);

  const isAuthResolved = status !== "idle" && status !== "loading";

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutCart(),
    onSuccess: (response) => {
      const result = response?.data || {};
      const enrolled = result.enrolled?.length || 0;
      const already = result.already_enrolled?.length || 0;
      const failed = result.failed || [];

      if (enrolled > 0) {
        setEnrolledCount(enrolled);
        toastSuccess(
          enrolled === 1
            ? "Payment successful — you're enrolled in your course!"
            : `Payment successful — you're enrolled in ${enrolled} courses!`,
        );
      } else if (already > 0 && failed.length === 0) {
        toastInfo("You were already enrolled in the course(s) from your cart.");
      }

      failed.forEach((item) => toastError(`${item.course_title}: ${item.reason}`));

      setIsPaymentOpen(false);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["store-public-courses"] });
      queryClient.invalidateQueries({ queryKey: ["studentEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["curriculum-enrollment"] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Checkout failed. Please try again."));
    },
  });

  // Saves to the wishlist first so a failure never loses the item.
  async function handleMoveToWishlist(course) {
    const saved = await wishlist.addCourse(course, { silent: true });
    if (!saved) return;
    removeCourse(course.id);
    toastSuccess("Moved to your wishlist.");
  }

  function handlePurchase() {
    if (!isAuthenticated) {
      setIsSignInPromptOpen(true);
      return;
    }
    setIsPaymentOpen(true);
  }

  // Suggestions are for people who can actually buy (guests and students) and
  // are hidden on the post-purchase confirmation so it stays focused.
  const showRecommendations =
    isAuthResolved &&
    (!isAuthenticated || isStudent) &&
    !isLoading &&
    !(enrolledCount > 0 && count === 0);

  let body;

  if (!isAuthResolved) {
    body = (
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading cart..." />
      </div>
    );
  } else if (isAuthenticated && !isStudent) {
    body = (
      <div className="rounded-card border border-line bg-paper shadow-soft">
        <EmptyState
          icon={ShoppingCart}
          size="lg"
          label="Carts are for student accounts"
          description="Cart and purchasing are available to student accounts only."
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
  } else if (isAuthenticated && enrolledCount > 0 && count === 0) {
    body = (
      <div className="rounded-card border border-line bg-paper shadow-soft">
        <EmptyState
          icon={CheckCircle2}
          size="lg"
          label="Purchase complete"
          description={`You're now enrolled in ${enrolledCount} ${enrolledCount === 1 ? "course" : "courses"}. Start learning from your portal.`}
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={`${ROUTES.STUDENT_PORTAL}?tab=courses`} className={PRIMARY_LINK}>
                Go to My Courses
              </Link>
              <Link
                href={ROUTES.STORE}
                className="text-xs font-sans font-medium uppercase tracking-widest text-muted hover:text-ink transition-colors"
              >
                Keep Browsing
              </Link>
            </div>
          }
        />
      </div>
    );
  } else if (isLoading) {
    body = (
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading cart..." />
      </div>
    );
  } else if (count === 0) {
    body = (
      <div className="space-y-4 pb-2">
        <p className="text-lg font-light italic text-muted">
          <span className="font-medium text-ink">Your cart is empty</span> — let's change
          that. Time to learn some new skills!
        </p>
        <Link href={ROUTES.STORE} className={PRIMARY_LINK}>
          Browse Courses
        </Link>
      </div>
    );
  } else {
    body = (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="space-y-4">
        {!isAuthenticated && (
          <p className="flex items-start gap-2.5 rounded-xl border border-line bg-porcelain p-4 text-xs text-muted leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-px text-gold" />
            <span>
              You're browsing as a guest. Your cart is saved on this device —
              you'll just need to{" "}
              <Link href={buildAuthUrl(ROUTES.LOGIN, ROUTES.CART)} className="font-semibold text-pine underline">
                sign in
              </Link>{" "}
              to complete your purchase.
            </span>
          </p>
        )}
        <ul className="space-y-4">
          {courses.map((course) => (
            <CartItemRow
              key={course.id}
              course={course}
              isRemoving={isPending(course.id)}
              onRemove={removeCourse}
              onMoveToWishlist={handleMoveToWishlist}
            />
          ))}
        </ul>
        </div>

        <CartOrderSummary
          courses={courses}
          isDisabled={checkoutMutation.isPending}
          onPurchase={handlePurchase}
        />
      </div>
    );
  }

  return (
    <div id="cart-page-container" className="min-h-screen cn-page-bg text-ink pb-24">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <div className="mb-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 bg-ink/5 border border-gold/30 px-3.5 py-1.5 rounded-full text-gold font-sans text-xs font-medium uppercase tracking-widest">
            <ShoppingCart className="w-3.5 h-3.5" />
            Your Cart
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-ink leading-[0.95]">
            Review &amp; Purchase
          </h1>
          <p className="text-sm text-muted font-light max-w-xl leading-relaxed">
            Check the courses you've selected, then complete your purchase to enroll instantly.
          </p>
        </div>

        {body}

        {showRecommendations && <CartRecommendations />}
        {showRecommendations && count === 0 && <CartPopularTopics />}
      </div>

      <SignInToPurchaseModal
        isOpen={isSignInPromptOpen}
        courseCount={count}
        nextPath={ROUTES.CART}
        onClose={() => setIsSignInPromptOpen(false)}
      />

      <StorePaymentModal
        isOpen={isPaymentOpen}
        items={courses}
        isSubmitting={checkoutMutation.isPending}
        onClose={() => setIsPaymentOpen(false)}
        onConfirm={() => checkoutMutation.mutate()}
        size="lg"
      />
    </div>
  );
}
