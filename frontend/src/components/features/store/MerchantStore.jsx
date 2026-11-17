"use client";

import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  GraduationCap,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  Store,
} from "lucide-react";
import { useEnrollAction } from "@/hooks/useEnrollAction";
import { CATALOG_COURSE_COUNT } from "@/lib/catalog";
import {
  getPublicCourseFilters,
  getPublicCourses,
} from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePaginationAnchor } from "@/hooks/usePaginationAnchor";
import useScrollReveal from "@/hooks/useScrollReveal";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import StoreCourseCard from "./StoreCourseCard";
import StoreAdvisorSuite from "./StoreAdvisorSuite";
import StoreBundles from "./StoreBundles";

const PAGE_SIZE = 9;

// The AI Advisor suite is fully built but its recommendations are still
// grounded in the old hardcoded merchandise catalog, not real courses — kept
// available in its own file, just not rendered until it's rewired.
const SHOW_PROCUREMENT_ADVISOR = false;

// The design's chip toggle (new-design.html `.chipbtn`): a 40px pill that
// fills with ink when it is the one narrowing the catalog.
// Sort options. Deliberately only the orderings the API actually implements
// (`courses/views.py` maps `title`, `-title` and `newest`; everything else
// falls back to title). The design also offers price low/high, which this
// endpoint cannot do — offering it here would silently reorder nothing.
const SORT_OPTIONS = [
  { value: "title", label: "Title: A to Z" },
  { value: "-title", label: "Title: Z to A" },
  { value: "newest", label: "Newest first" },
];

// A row in the filter rail: full width, 44px tall, and filled with the
// design's paper-3 when it is the one narrowing the catalog.
const FILTER_ROW =
  "flex min-h-11 w-full items-center rounded-cn-sm px-3 text-left text-cn-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent max-lg:w-auto max-lg:border max-lg:border-cn-rule";
const FILTER_ROW_ON = "bg-cn-paper-3 font-semibold text-cn-accent-3";
const FILTER_ROW_OFF =
  "font-medium text-cn-ink-2 hover:bg-cn-paper-2 hover:text-cn-ink";

const CHIP =
  "inline-grid h-10 shrink-0 place-items-center rounded-full border px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent active:translate-y-px";
const CHIP_ON = "border-cn-ink bg-cn-ink text-white";
const CHIP_OFF =
  "border-cn-rule-strong bg-white text-cn-ink-2 hover:border-cn-ink hover:text-cn-ink";

export default function MerchantStore() {
  const pageRef = useRef(null);
  const { enroll: handleEnroll, enrollModal } = useEnrollAction();

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState(SORT_OPTIONS[0].value);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [resultsRef, changePage] = usePaginationAnchor(setPage);

  // Debounced so typing doesn't fire a request per keystroke; trimmed so
  // trailing whitespace doesn't look like a different search to the query cache.
  const searchTerm = useDebouncedValue(search).trim();

  // Deep link from the empty-cart "Popular Topics" chips: /store?category=<id>.
  useEffect(() => {
    const categoryParam = new URLSearchParams(window.location.search).get(
      "category",
    );
    if (categoryParam && /^\d+$/.test(categoryParam)) {
      setSelectedCategoryId(Number(categoryParam));
    }
  }, []);

  function handleSelectCategory(categoryId) {
    setSelectedCategoryId(categoryId);
    setPage(1);
  }

  function handleSelectDifficulty(value) {
    setDifficulty(value);
    setPage(1);
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  function handleClearFilters() {
    setSelectedCategoryId(null);
    setDifficulty("");
    setSearch("");
    setPage(1);
  }

  // Paginated, with search and category both applied server-side — mirrors the
  // curriculum page's fetching pattern exactly, including keepPreviousData so
  // the grid doesn't flash empty while switching pages or searching.
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      "store-public-courses",
      page,
      selectedCategoryId,
      difficulty,
      sort,
      searchTerm,
    ],
    queryFn: async () => {
      const response = await getPublicCourses({
        page,
        pageSize: PAGE_SIZE,
        search: searchTerm || undefined,
        category: selectedCategoryId || undefined,
        difficulty: difficulty || undefined,
        sort,
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
  const { data: facets } = useQuery({
    queryKey: ["public-course-filters"],
    queryFn: async () => (await getPublicCourseFilters())?.data || {},
    staleTime: 5 * 60 * 1000,
  });
  const categories = facets?.subjects || [];
  const difficulties = facets?.difficulties || [];

  const activeFilterCount = [
    selectedCategoryId,
    difficulty,
    search.trim(),
  ].filter(Boolean).length;
  // When the search box is the only thing narrowing results, the empty state
  // talks about the search instead of "filters" — a category isn't involved.
  const isSearchOnly =
    Boolean(search.trim()) && !selectedCategoryId && !difficulty;


  // If everything on the current store page just got purchased/enrolled, the
  // refetch after checkout can leave the user stranded on a now-empty page —
  // send them back to page 1 rather than showing an empty grid.
  useEffect(() => {
    if (!isLoading && !isFetching && courses.length === 0 && page > 1) {
      setPage(1);
    }
  }, [isLoading, isFetching, courses.length, page]);

  // Each page of the grid reveals as it is scrolled to, and is swept again
  // when a new page or a new filter brings different cards in.
  useScrollReveal(pageRef, [
    isLoading,
    courses.length,
    page,
    selectedCategoryId,
    difficulty,
    sort,
  ]);

  return (
    <div
      id="merchant-store-container"
      ref={pageRef}
      className="min-h-screen bg-cn-paper pb-24 text-cn-ink"
    >
      {/* The design's store hero: centred over a paper-3 -> paper wash, with
          the search box as a wide pill and the bundle chips under it. */}
      <header
        id="store-banner-layout"
        className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-cn-paper-3),var(--color-cn-paper)_85%)] pt-24 pb-16"
      >
        <div className="cn-container grid justify-items-center gap-6 text-center">
          <div>
            <h1 className="cn-enter text-cn-display-s font-extrabold tracking-[-0.035em] text-cn-ink">
              The course store.
            </h1>
            <p className="cn-enter mx-auto mt-4 max-w-[46ch] text-cn-lg leading-[1.55] text-cn-ink-2">
              {totalCourses || CATALOG_COURSE_COUNT} courses across the catalog.
              Save the ones you want, then buy them in your cart.
            </p>
          </div>

          <label
            className="cn-enter flex h-[60px] w-[min(640px,100%)] items-center gap-2 rounded-full border border-cn-rule bg-white px-6 text-cn-muted shadow-cn-2 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-cn-accent"
            style={{ "--cn-delay": "90ms" }}
          >
            <Search aria-hidden="true" className="h-5 w-5 flex-none" />
            <input
              id="store-search"
              type="search"
              aria-label="Search courses"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search courses, topics or codes"
              className="w-full border-0 bg-transparent text-cn-base text-cn-ink outline-none"
            />
          </label>

          <div className="cn-enter" style={{ "--cn-delay": "180ms" }}>
            <StoreBundles />
          </div>
        </div>
      </header>

      <div className="cn-container mt-16 grid items-start gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
        {SHOW_PROCUREMENT_ADVISOR && <StoreAdvisorSuite />}

        {/* The filter rail. Sticky on a wide screen so it stays reachable
            down a long grid; static below that, where it sits above it. */}
        <aside
          aria-label="Filters"
          className="grid gap-10 lg:sticky lg:top-[100px]"
        >
          <div className="grid gap-1">
            <h2 className="mb-2 text-cn-sm leading-[1.04] font-bold text-cn-ink">Category</h2>
            <div
              role="group"
              aria-label="Category"
              className="grid gap-1 max-lg:flex max-lg:flex-wrap max-lg:gap-1.5"
            >
              <button
                id="store-cat-btn-all"
                type="button"
                aria-pressed={selectedCategoryId === null}
                onClick={() => handleSelectCategory(null)}
                className={`${FILTER_ROW} ${selectedCategoryId === null ? FILTER_ROW_ON : FILTER_ROW_OFF}`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  id={`store-cat-btn-${category.id}`}
                  key={category.id}
                  type="button"
                  aria-pressed={selectedCategoryId === category.id}
                  onClick={() => handleSelectCategory(category.id)}
                  className={`${FILTER_ROW} ${selectedCategoryId === category.id ? FILTER_ROW_ON : FILTER_ROW_OFF}`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1">
            <h2 className="mb-2 text-cn-sm leading-[1.04] font-bold text-cn-ink">Level</h2>
            {[{ value: "", label: "Any level" }, ...difficulties].map(
              (option) => (
                <label
                  key={option.value || "any"}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-cn-sm px-3 text-cn-sm font-medium text-cn-ink-2 transition-colors duration-150 hover:bg-cn-paper-2 hover:text-cn-ink"
                >
                  <input
                    type="radio"
                    name="store-level"
                    value={option.value}
                    checked={difficulty === option.value}
                    onChange={() => handleSelectDifficulty(option.value)}
                    className="m-0 h-[18px] w-[18px] accent-cn-accent"
                  />
                  {option.label}
                </label>
              ),
            )}
          </div>

          <p className="flex gap-3 rounded-cn bg-cn-paper-2 p-4 text-cn-sm text-cn-ink-2">
            <GraduationCap
              aria-hidden="true"
              className="mt-0.5 h-[18px] w-[18px] flex-none text-cn-accent"
            />
            Courses you enroll in wait in My courses, in your portal.
            You&apos;ll be asked to sign in first.
          </p>
        </aside>

        <div>
          {/* Count on the left, sort on the right, over one rule. */}
          <div
            ref={resultsRef}
            className="mb-6 flex scroll-mt-28 items-center justify-between gap-4 border-b border-cn-rule pb-4"
          >
            <span
              id="store-results-summary"
              aria-live="polite"
              className="font-semibold text-cn-ink"
            >
              {isLoading
                ? "Loading courses…"
                : `${totalCourses} course${totalCourses === 1 ? "" : "s"}`}
            </span>

            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  id="store-clear-filters"
                  type="button"
                  onClick={handleClearFilters}
                  className="flex shrink-0 items-center gap-2 rounded-cn-sm px-2 py-1 text-cn-sm font-semibold text-cn-accent hover:underline"
                >
                  <RotateCcw className="h-4 w-4" />
                  {isSearchOnly ? "Clear search" : "Clear filters"}
                </button>
              )}
              <label className="flex items-center gap-3 text-cn-sm text-cn-muted">
                Sort by
                <select
                  id="store-sort"
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-cn-sm border border-cn-muted bg-white px-4 text-cn-sm text-cn-ink transition-colors duration-150 hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {isLoading && (
            <div
              className="flex min-h-[40vh] items-center justify-center"
              aria-busy="true"
            >
              <Loader
                fullScreen={false}
                tone="cobalt"
                label="Loading store..."
              />
            </div>
          )}

          {isError && (
            <div className="mx-auto max-w-lg rounded-cn-lg border border-cn-rule bg-white p-10 text-center shadow-cn-1">
              <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-cn bg-cn-paper-3 text-cn-live">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="mb-2 text-cn-xl font-bold tracking-[-0.015em] text-cn-ink">
                Failed to Load Store
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-cn-ink-2">
                {getApiErrorMessage(
                  error,
                  "Unable to load the store right now.",
                )}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex h-[50px] items-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && courses.length === 0 && (
            <div className="rounded-cn-lg border border-dashed border-cn-rule-strong bg-cn-paper-2">
              <EmptyState
                tone="cobalt"
                icon={activeFilterCount > 0 ? SearchX : Store}
                label={
                  activeFilterCount > 0
                    ? "No matching courses"
                    : "No courses published yet"
                }
                description={
                  activeFilterCount > 0
                    ? isSearchOnly
                      ? "Try a different search term or clear your search."
                      : "Try a different search term or clear your filters."
                    : "Check back soon — new courses are added regularly."
                }
                action={
                  activeFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="inline-flex h-11 items-center gap-2 rounded-cn-sm bg-cn-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {isSearchOnly ? "Clear search" : "Clear filters"}
                    </button>
                  ) : undefined
                }
                size="lg"
              />
            </div>
          )}

          {!isLoading && !isError && courses.length > 0 && (
            <>
              {/* The grid's entry animation now lives on the cards themselves
                (`.cn-reveal`), a row at a time as they are scrolled to, which
                is what every other converted catalog does. */}
              <div
                id="store-grid-layout"
                className={`grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 ${
                  isFetching ? "opacity-60" : "opacity-100"
                }`}
              >
                {courses.map((course, index) => (
                  <StoreCourseCard
                    key={course.id}
                    course={course}
                    revealDelay={index % 2}
                    onRequestEnroll={handleEnroll}
                  />
                ))}
              </div>

              <div className="mt-10">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={changePage}
                  totalLabel={`${totalCourses} course${totalCourses === 1 ? "" : "s"}`}
                  size="lg"
                  tone="cobalt"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Signing in finishes the action they asked for: the visitor lands on
          the portal's checkout for the course they picked, rather than back on
          the grid wondering whether it worked. */}
      {enrollModal}
    </div>
  );
}
