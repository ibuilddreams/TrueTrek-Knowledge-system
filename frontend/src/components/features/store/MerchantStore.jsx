"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  LogIn,
  RefreshCw,
  ShoppingBag,
  ShoppingCart,
  Store,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { getPublicCourses } from "@/services/coursesService";
import {
  addToCart,
  checkoutCart,
  getCart,
  removeFromCart,
} from "@/services/cartService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import StoreCourseCard from "./StoreCourseCard";
import StoreCourseDetailModal from "./StoreCourseDetailModal";
import StoreCartDrawer from "./StoreCartDrawer";
import StorePaymentModal from "./StorePaymentModal";
import StoreAdvisorSuite from "./StoreAdvisorSuite";

const PAGE_SIZE = 9;

// The AI Advisor suite is fully built but its recommendations are still
// grounded in the old hardcoded merchandise catalog, not real courses — kept
// available in its own file, just not rendered until it's rewired.
const SHOW_PROCUREMENT_ADVISOR = false;

export default function MerchantStore() {
  const router = useRouter();
  const { isAuthenticated, isStudent, role, user } = useAuth();

  // Only students can own a cart / purchase — teachers and admins can still
  // browse and view course details, they just don't get cart functionality.
  // Guests are treated like students here (they simply get redirected to
  // login on the first cart action) so the "not signed in yet" flow is kept
  // separate from the "signed in with the wrong role" flow.
  const canUseCart = !isAuthenticated || isStudent;

  const queryClient = useQueryClient();

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [page, setPage] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewingCourse, setViewingCourse] = useState(null);

  const onNavigateToPortal = () => router.push(getPortalRouteForRole(role));

  function handleSelectCategory(categoryId) {
    setSelectedCategoryId(categoryId);
    setPage(1);
  }

  // Paginated, server-filtered by category — mirrors the curriculum page's
  // fetching pattern exactly, including keepPreviousData so the grid doesn't
  // flash empty while switching pages/categories.
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["store-public-courses", page, selectedCategoryId],
    queryFn: async () => {
      const response = await getPublicCourses({
        page,
        pageSize: PAGE_SIZE,
        category: selectedCategoryId || undefined,
        excludeEnrolled: true,
      });
      return response?.data || { results: [], count: 0 };
    },
    placeholderData: keepPreviousData,
  });

  const courses = data?.results || [];
  const totalCourses = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCourses / PAGE_SIZE));

  // Independent, unfiltered fetch used only to populate the category filter
  // bar — the paginated/filtered query above can't be reused for this, since
  // once a category is selected its results would only ever contain it.
  const { data: categorySourceCourses = [] } = useQuery({
    queryKey: ["store-categories-source"],
    queryFn: async () => {
      const response = await getPublicCourses({ pageSize: 100, excludeEnrolled: true });
      return response?.data?.results || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => {
    const map = new Map();
    categorySourceCourses.forEach((course) => {
      if (course.category?.id) map.set(course.category.id, course.category);
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [categorySourceCourses]);

  // Cart is server-persisted per authenticated student — disabled for guests
  // (no session to scope it to) and for teachers/admins (cart is a
  // student-only backend endpoint, so fetching it for other roles would
  // just 403).
  const { data: cartItems = [], isLoading: isCartLoading } = useQuery({
    queryKey: ["store-cart"],
    queryFn: async () => {
      const response = await getCart();
      return response?.data || [];
    },
    enabled: isAuthenticated && isStudent,
  });

  const cart = useMemo(() => cartItems.map((item) => item.course), [cartItems]);
  const cartIds = useMemo(
    () => new Set(cart.map((course) => course.id)),
    [cart],
  );

  const addToCartMutation = useMutation({
    mutationFn: (course) => addToCart(course.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-cart"] });
    },
    onError: (mutationError) => {
      toastError(
        getApiErrorMessage(
          mutationError,
          "Unable to add this course to your cart.",
        ),
      );
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: (courseId) => removeFromCart(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-cart"] });
    },
    onError: (mutationError) => {
      toastError(
        getApiErrorMessage(
          mutationError,
          "Unable to remove this course from your cart.",
        ),
      );
    },
  });

  function isInCart(courseId) {
    return cartIds.has(courseId);
  }

  function isCartActionPending(courseId) {
    return (
      (addToCartMutation.isPending &&
        addToCartMutation.variables?.id === courseId) ||
      (removeFromCartMutation.isPending &&
        removeFromCartMutation.variables === courseId)
    );
  }

  function toggleCart(course) {
    if (!isAuthenticated) {
      toastInfo("Sign in to add courses to your cart.");
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!isStudent) {
      toastInfo("Only student accounts can add courses to their cart.");
      return;
    }

    const wasInCart = cartIds.has(course.id);
    if (wasInCart) {
      removeFromCartMutation.mutate(course.id);
    } else {
      addToCartMutation.mutate(course);
      setIsCartOpen(true);
    }
  }

  function handleRemoveFromCart(courseId) {
    removeFromCartMutation.mutate(courseId);
  }

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutCart(),
    onSuccess: (response) => {
      const result = response?.data || { enrolled: [], already_enrolled: [], failed: [] };
      const enrolledCount = result.enrolled?.length || 0;
      const alreadyCount = result.already_enrolled?.length || 0;
      const failedCount = result.failed?.length || 0;

      if (enrolledCount > 0) {
        toastSuccess(
          enrolledCount === 1
            ? "Payment successful — you're enrolled in your course!"
            : `Payment successful — you're enrolled in ${enrolledCount} courses!`
        );
      } else if (alreadyCount > 0 && failedCount === 0) {
        toastInfo("You were already enrolled in the course(s) from your cart.");
      }

      (result.failed || []).forEach((item) => {
        toastError(`${item.course_title}: ${item.reason}`);
      });

      setIsPaymentModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["store-cart"] });
      queryClient.invalidateQueries({ queryKey: ["store-public-courses"] });
      queryClient.invalidateQueries({ queryKey: ["store-categories-source"] });
      queryClient.invalidateQueries({ queryKey: ["studentEnrollments"] });
    },
    onError: (mutationError) => {
      toastError(getApiErrorMessage(mutationError, "Checkout failed. Please try again."));
    },
  });

  function handlePurchase() {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  }

  function handleConfirmPayment() {
    checkoutMutation.mutate();
  }

  // If everything on the current store page just got purchased/enrolled, the
  // refetch after checkout can leave the user stranded on a now-empty page —
  // send them back to page 1 rather than showing an empty grid.
  useEffect(() => {
    if (!isLoading && !isFetching && courses.length === 0 && page > 1) {
      setPage(1);
    }
  }, [isLoading, isFetching, courses.length, page]);

  return (
    <div
      id="merchant-store-container"
      className="min-h-screen cn-page-bg text-ink pb-24"
    >
      {/* Dynamic Header */}
      <div
        id="store-banner-layout"
        className="bg-pine text-paper py-16 px-6 border-b border-white/10 relative overflow-hidden"
      >
        <div
          id="ambient-dot-store"
          className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-gold/12 blur-[130px] -translate-y-1/2"
        ></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-ink/20 border border-gold/30 px-3.5 py-1.5 rounded-full text-gold font-sans text-xs font-medium uppercase tracking-widest">
              <ShoppingBag className="w-3.5 h-3.5" />
              Licensed Course Depository
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-light tracking-tight text-paper leading-[0.92]">
              The Strategic Store
            </h2>
            <p className="text-paper/70 text-sm md:text-sm font-light max-w-xl leading-relaxed">
              Browse every course on TrueTrek Learning, add it to your cart,
              and check out to enroll instantly.
            </p>
          </div>

          {canUseCart && (
            <div className="shrink-0 flex items-center gap-4">
              <button
                id="shopping-cart-toggle-btn"
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative bg-gold hover:brightness-95 text-ink p-4 rounded-2xl flex items-center gap-3 transition-all duration-200 shadow-md transform hover:scale-[1.02]"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="font-sans text-xs font-medium uppercase tracking-widest hidden sm:inline">
                  Active Ledger
                </span>
                <span className="bg-ink text-gold text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center font-sans">
                  {cart.length}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {/* Role-aware status banner — reuses the same banner slot the promo/coupon banner used to occupy */}
        <div
          className={`border border-line rounded-2xl p-4 mb-10 flex flex-col md:flex-row items-center justify-between gap-4 ${
            isAuthenticated ? "bg-sage/40" : "bg-porcelain"
          }`}
        >
          {isAuthenticated ? (
            <>
              <p className="text-sm text-ink/80 font-sans leading-relaxed">
                <span className="font-sans font-bold text-moss uppercase tracking-widest text-xs mr-2">
                  [SIGNED IN]
                </span>
                Signed in as {user?.name || user?.email}.{" "}
                {isStudent
                  ? "Add courses to your cart below."
                  : "Cart and purchasing are available to student accounts only."}
              </p>
              <button
                type="button"
                onClick={onNavigateToPortal}
                className="text-xs font-sans font-medium uppercase tracking-widest bg-pine hover:bg-moss text-paper px-4 py-2 rounded-full transition duration-200 shadow-sm shrink-0"
              >
                Open My Portal →
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-ink/80 font-sans leading-relaxed">
                <span className="font-sans font-bold text-gold uppercase tracking-widest text-xs mr-2">
                  [BROWSING AS GUEST]
                </span>
                Courses are visible to everyone. Sign in as a student to add
                courses to your cart and check out.
              </p>
              <button
                type="button"
                onClick={() => router.push(ROUTES.LOGIN)}
                className="text-xs font-sans font-medium uppercase tracking-widest bg-pine hover:bg-moss text-paper px-4 py-2 rounded-full transition duration-200 shadow-sm shrink-0 flex items-center gap-1.5"
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            </>
          )}
        </div>

        {SHOW_PROCUREMENT_ADVISOR && <StoreAdvisorSuite />}

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line pb-5 mb-10">
          <button
            id="store-cat-btn-all"
            type="button"
            onClick={() => handleSelectCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-sans font-medium uppercase tracking-widest transition-all ${
              selectedCategoryId === null
                ? "bg-pine text-paper"
                : "bg-porcelain text-muted border border-line hover:bg-line/30"
            }`}
          >
            ALL
          </button>
          {categories.map((category) => (
            <button
              id={`store-cat-btn-${category.id}`}
              key={category.id}
              type="button"
              onClick={() => handleSelectCategory(category.id)}
              className={`px-4 py-2 rounded-full text-xs font-sans font-medium uppercase tracking-widest transition-all ${
                selectedCategoryId === category.id
                  ? "bg-pine text-paper"
                  : "bg-porcelain text-muted border border-line hover:bg-line/30"
              }`}
            >
              {category.name.toUpperCase()}
            </button>
          ))}
        </div>

        {isLoading && (
          <div
            className="flex min-h-[40vh] items-center justify-center"
            aria-busy="true"
          >
            <Loader fullScreen={false} label="Loading store..." />
          </div>
        )}

        {isError && (
          <div className="border border-line bg-paper rounded-card p-8 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif font-light mb-2 text-ink">
              Failed to Load Store
            </h2>
            <p className="text-sm font-light mb-6 text-muted">
              {getApiErrorMessage(error, "Unable to load the store right now.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-3 font-sans text-xs font-medium uppercase tracking-widest rounded-full transition bg-pine hover:bg-moss text-paper"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && courses.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-paper/70">
            <EmptyState
              icon={Store}
              label={
                selectedCategoryId === null
                  ? "No courses published yet"
                  : "No matching courses"
              }
              description={
                selectedCategoryId === null
                  ? "Check back soon — new courses are added regularly."
                  : "Try selecting a different category filter."
              }
              size="lg"
            />
          </div>
        )}

        {!isLoading && !isError && courses.length > 0 && (
          <>
            <motion.div
              id="store-grid-layout"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-200 ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {courses.map((course) => (
                <StoreCourseCard
                  key={course.id}
                  course={course}
                  isInCart={isInCart(course.id)}
                  isPending={isCartActionPending(course.id)}
                  canPurchase={canUseCart}
                  onViewDetails={setViewingCourse}
                  onToggleCart={toggleCart}
                />
              ))}
            </motion.div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalLabel={`${totalCourses} course${totalCourses === 1 ? "" : "s"}`}
              size="lg"
            />
          </>
        )}
      </div>

      <StoreCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        isLoading={isCartLoading}
        pendingCourseIds={
          removeFromCartMutation.isPending
            ? [removeFromCartMutation.variables]
            : []
        }
        onRemove={handleRemoveFromCart}
        onPurchase={handlePurchase}
      />

      <StoreCourseDetailModal
        course={viewingCourse}
        isInCart={viewingCourse ? isInCart(viewingCourse.id) : false}
        isPending={
          viewingCourse ? isCartActionPending(viewingCourse.id) : false
        }
        canPurchase={canUseCart}
        onClose={() => setViewingCourse(null)}
        onToggleCart={toggleCart}
      />

      <StorePaymentModal
        isOpen={isPaymentModalOpen}
        items={cart}
        isSubmitting={checkoutMutation.isPending}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
        size="lg"
      />
    </div>
  );
}
