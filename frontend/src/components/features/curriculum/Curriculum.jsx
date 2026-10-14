"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CurriculumFilters from "./CurriculumFilters";
import CurriculumCourseCard from "./CurriculumCourseCard";
import { getPublicCourses, getPublicCourseFilters } from "@/services/coursesService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import Loader from "@/components/ui/Loader";

const SAVED_KEY = "truetrek-saved-curriculum";
const PAGE_SIZE = 24;
const DEFAULT_FILTERS = { category: "", tier: "", grade: "", difficulty: "", sort: "title" };

export default function Curriculum() {
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const { isAuthenticated, isStudent } = useAuth();
  const { isInCart, isPending, toggleCourse } = useCart();
  const canUseCart = !isAuthenticated || isStudent;
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      if (Array.isArray(stored)) setSaved(stored.filter((id) => typeof id === "string"));
    } catch { /* A blocked or unavailable browser store does not prevent browsing. */ }
  }, []);

  const facets = useQuery({ queryKey: ["curriculum-filters"], queryFn: async () => (await getPublicCourseFilters()).data });
  const coursesQuery = useQuery({
    queryKey: ["curriculum-courses", query, filters, page],
    queryFn: async () => (await getPublicCourses({ ...filters, search: query, page, pageSize: PAGE_SIZE })).data,
  });
  const allCourses = coursesQuery.data?.results || [];
  const courses = savedOnly ? allCourses.filter((course) => saved.includes(String(course.id))) : allCourses;
  const count = coursesQuery.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  function updateFilter(key, value) { setFilters((current) => ({ ...current, [key]: value })); setPage(1); }
  function toggleSaved(course) {
    const id = String(course.id);
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
    setSaved(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* Keep this session's selection. */ }
  }
  function clearFilters() { setFilters((current) => ({ ...DEFAULT_FILTERS, sort: current.sort })); setPage(1); }
  const tiers = facets.data?.tiers || [];
  const subjects = facets.data?.subjects || [];
  const grades = facets.data?.grades || [];
  const difficulties = facets.data?.difficulties || [];
  return (
    <div className="min-h-screen bg-[#fafafa] px-5 py-10 font-sans text-zinc-900 md:px-8 md:py-12" id="curriculum-container">
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto mb-7 max-w-3xl text-center md:mb-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-[56px] md:leading-[1.15]">The 9-Tier Curriculum</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-zinc-500">Explore courses built around your next chapter. Filter by tier, subject, or grade to find your next course and discover what you’ll learn.</p>
        </header>
        <CurriculumFilters
          filters={filters}
          search={search}
          onSearchChange={(value) => { setSearch(value); setPage(1); }}
          onFilterChange={updateFilter}
          onClear={clearFilters}
          subjects={subjects}
          tiers={tiers}
          grades={grades}
          difficulties={difficulties}
          savedCount={saved.length}
          savedOnly={savedOnly}
          onToggleSaved={() => setSavedOnly(!savedOnly)}
        />
        {facets.isError && <p role="alert" className="mt-3 text-sm text-red-700">Filters could not load. <button type="button" className="underline" onClick={() => facets.refetch()}>Retry filters</button></p>}
        <p className="my-3 text-xs text-zinc-500" aria-live="polite">{coursesQuery.isLoading ? "Loading courses…" : `${count} course${count === 1 ? "" : "s"}`}{savedOnly ? " · Showing saved courses on this page" : ""}</p>
        {coursesQuery.isLoading ? <Loader fullScreen={false} label="Loading curriculum..." /> : coursesQuery.isError ? (
          <div role="alert" className="rounded-2xl border border-line bg-paper p-8 text-center"><p>{getApiErrorMessage(coursesQuery.error, "Unable to load curriculum.")}</p><button type="button" onClick={() => coursesQuery.refetch()} className="mt-4 text-pine underline">Try again</button></div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper p-12 text-center"><h2 className="text-xl">No courses found</h2><p className="mt-2 text-muted">Try adjusting your search or filters.</p></div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CurriculumCourseCard
                key={course.id}
                course={course}
                isSaved={saved.includes(String(course.id))}
                onToggleSaved={() => toggleSaved(course)}
                canUseCart={canUseCart}
                inCart={isInCart(course.id)}
                cartPending={isPending(course.id)}
                onToggleCart={() => toggleCourse(course)}
              />
            ))}
          </div>
        )}
        {!coursesQuery.isError && !savedOnly && count > PAGE_SIZE && <nav aria-label="Course pages" className="mt-8 flex items-center justify-center gap-5"><button type="button" disabled={page <= 1 || coursesQuery.isFetching} onClick={() => setPage(page - 1)} className="rounded-xl border border-line bg-paper px-4 py-2 disabled:opacity-40">Previous</button><span className="text-sm">Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || coursesQuery.isFetching} onClick={() => setPage(page + 1)} className="rounded-xl border border-line bg-paper px-4 py-2 disabled:opacity-40">Next</button></nav>}
      </div>
    </div>
  );
}
