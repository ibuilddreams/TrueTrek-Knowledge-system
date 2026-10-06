"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  RefreshCw,
  RotateCcw,
  SearchX,
  ShoppingBag,
  Store,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { getPublicCourseFilters, getPublicCourses } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useCart } from "@/hooks/useCart";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useWishlist } from "@/hooks/useWishlist";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import SearchBar from "@/components/ui/SearchBar";
import StoreCourseCard from "./StoreCourseCard";
import StoreAdvisorSuite from "./StoreAdvisorSuite";

const PAGE_SIZE = 9;

// The AI Advisor suite is fully built but its recommendations are still
// grounded in the old hardcoded merchandise catalog, not real courses — kept
// available in its own file, just not rendered until it's rewired.
const SHOW_PROCUREMENT_ADVISOR = false;

export default function MerchantStore() {
  const { isAuthenticated, isStudent } = useAuth();

  // Only students can own a cart / purchase — teachers and admins can still
  // browse and view course details, they just don't get cart functionality.
  // Guests can fill a cart too (stored in their browser) and are asked to
  // sign in only at purchase time.
  const canUseCart = !isAuthenticated || isStudent;

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounced so typing doesn't fire a request per keystroke; trimmed so
  // trailing whitespace doesn't look like a different search to the query cache.
  const searchTerm = useDebouncedValue(search).trim();

  // Deep link from the empty-cart "Popular Topics" chips: /store?category=<id>.
  useEffect(() => {
    const categoryParam = new URLSearchParams(window.location.search).get("category");
    if (categoryParam && /^\d+$/.test(categoryParam)) {
      setSelectedCategoryId(Number(categoryParam));
    }
  }, []);

  function handleSelectCategory(categoryId) {
    setSelectedCategoryId(categoryId);
    setPage(1);
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleClearFilters() {
    setSelectedCategoryId(null);
    setSearch("");
    setPage(1);
  }

  // Paginated, with search and category both applied server-side — mirrors the
  // curriculum page's fetching pattern exactly, including keepPreviousData so
  // the grid doesn't flash empty while switching pages or searching.
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["store-public-courses", page, selectedCategoryId, searchTerm],
    queryFn: async () => {
      const response = await getPublicCourses({
        page,
        pageSize: PAGE_SIZE,
        search: searchTerm || undefined,
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

  // Category filter bar: every subject that has published courses, from the
  // dedicated filters endpoint. (Deriving it from a page of courses would drop
  // any category whose courses fall outside that page.)
  const { data: categories = [] } = useQuery({
    queryKey: ["public-course-filters"],
    queryFn: async () => {
      const response = await getPublicCourseFilters();
      return response?.data?.subjects || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const activeFilterCount = [selectedCategoryId, search.trim()].filter(Boolean).length;

  // Guests (browser-stored) and students (server-persisted) share the same
  // cart API — see useCart. Teachers/admins get an info toast instead.
  const { isInCart, isPending: isCartActionPending, toggleCourse } = useCart();
  const wishlist = useWishlist();

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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {SHOW_PROCUREMENT_ADVISOR && <StoreAdvisorSuite />}

        <SearchBar
          id="store-search"
          size="lg"
          className="w-full mb-6"
          inputClassName="bg-paper font-sans"
          value={search}
          onChange={handleSearchChange}
          placeholder="Search courses by title or description..."
        />

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4 mb-4">
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

        {(!isError || activeFilterCount > 0) && (
          <div className="mb-6 flex items-center gap-4">
            {!isError && (
              <p
                id="store-results-summary"
                aria-live="polite"
                className="text-xs font-sans text-muted"
              >
                {isLoading
                  ? "Loading courses…"
                  : `${totalCourses} course${totalCourses === 1 ? "" : "s"}${
                      searchTerm ? ` matching “${searchTerm}”` : ""
                    }`}
              </p>
            )}
            {activeFilterCount > 0 && (
              <button
                id="store-clear-filters"
                type="button"
                onClick={handleClearFilters}
                className="ml-auto flex shrink-0 items-center gap-1.5 text-xs font-sans font-medium uppercase tracking-widest text-muted transition hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear filters ({activeFilterCount})
              </button>
            )}
          </div>
        )}

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
              icon={activeFilterCount > 0 ? SearchX : Store}
              label={
                activeFilterCount > 0
                  ? "No matching courses"
                  : "No courses published yet"
              }
              description={
                activeFilterCount > 0
                  ? "Try a different search term or clear your filters."
                  : "Check back soon — new courses are added regularly."
              }
              action={
                activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 font-sans text-xs font-medium uppercase tracking-widest rounded-full transition bg-pine hover:bg-moss text-paper"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear filters
                  </button>
                ) : undefined
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
                  onToggleCart={toggleCourse}
                  isWishlisted={wishlist.isInWishlist(course.id)}
                  isWishlistPending={wishlist.isPending(course.id)}
                  onToggleWishlist={canUseCart ? wishlist.toggleCourse : undefined}
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

    </div>
  );
}
