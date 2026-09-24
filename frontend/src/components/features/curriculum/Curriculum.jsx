"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CourseBanner, CourseBadges } from "./CourseCatalogParts";
import { useQuery } from "@tanstack/react-query";
import { Heart, Search } from "lucide-react";
import { getPublicCourses, getPublicCourseFilters } from "@/services/coursesService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/lib/apiErrors";
import Loader from "@/components/ui/Loader";

const SAVED_KEY = "truetrek-saved-curriculum";
const PAGE_SIZE = 24;

export default function Curriculum() {
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const [filters, setFilters] = useState({ category: "", sort: "title" });
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState([]);
  const [savedOnly, setSavedOnly] = useState(false);
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
  const subjects = facets.data?.subjects || [];
  return (
    <div className="min-h-screen bg-porcelain px-5 py-12 text-ink md:px-8" id="curriculum-container">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-serif">Curriculum Explorer</h1>
        <p className="mt-3 text-muted">Browse TrueTrek's courses by subject, and dive into each one's modules, lessons, assignments, and quizzes.</p>
        <div className="mt-8 flex flex-wrap items-end gap-3">
          <label className="flex min-w-32 flex-col gap-1 text-sm">
            <span>Subject</span>
            <select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)} className="max-w-64 rounded-xl border border-line bg-paper px-3 py-2.5">
              <option value="">All subjects</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
          </label>
          <button type="button" aria-pressed={savedOnly} title="Courses saved in this browser" onClick={() => setSavedOnly(!savedOnly)} className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${savedOnly ? "border-pine bg-pine text-paper" : "border-line bg-paper"}`}><Heart className="h-4 w-4" />Saved ({saved.length})</button>
          <label className="ml-auto flex flex-col gap-1 text-sm"><span>Sort</span><select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)} className="rounded-xl border border-line bg-paper px-3 py-2.5"><option value="title">Title A–Z</option><option value="-title">Title Z–A</option><option value="newest">Newest</option></select></label>
        </div>
        <label className="relative mt-5 block"><span className="sr-only">Search courses</span><Search className="absolute left-4 top-3.5 h-5 w-5 text-muted" /><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search courses..." className="w-full rounded-xl border border-line bg-paper py-3 pl-12 pr-4" /></label>
        {facets.isError && <p role="alert" className="mt-3 text-sm text-red-700">Filters could not load. <button type="button" className="underline" onClick={() => facets.refetch()}>Retry filters</button></p>}
        <p className="my-5 text-sm text-muted" aria-live="polite">{coursesQuery.isLoading ? "Loading courses…" : `${count} course${count === 1 ? "" : "s"}`}{savedOnly ? " · Showing saved courses on this page" : ""}</p>
        {coursesQuery.isLoading ? <Loader fullScreen={false} label="Loading curriculum..." /> : coursesQuery.isError ? (
          <div role="alert" className="rounded-2xl border border-line bg-paper p-8 text-center"><p>{getApiErrorMessage(coursesQuery.error, "Unable to load curriculum.")}</p><button type="button" onClick={() => coursesQuery.refetch()} className="mt-4 text-pine underline">Try again</button></div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-line bg-paper p-12 text-center"><h2 className="text-xl">No courses found</h2><p className="mt-2 text-muted">Try adjusting your search or filters.</p></div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isSaved = saved.includes(String(course.id));
              return <article key={course.id} className="relative overflow-hidden rounded-2xl border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
                <Link href={`/curriculum/${course.slug}`} className="block h-full w-full text-left focus-visible:outline-2 focus-visible:outline-pine focus-visible:outline-offset-[-3px]" aria-label={`View ${course.title}`}>
                  <CourseBanner course={course} />
                  <div className="space-y-3 p-4">
                    <h2 className="text-base font-serif font-medium">{course.title}</h2>
                    <p className="line-clamp-2 text-sm font-light text-muted">{course.description || "No description has been added for this course yet."}</p>
                    <CourseBadges course={course} />
                  </div>
                </Link>
                <button type="button" onClick={() => toggleSaved(course)} aria-pressed={isSaved} aria-label={`${isSaved ? "Unsave" : "Save"} ${course.title}`} className="absolute right-3 top-3 rounded-full bg-white/90 p-2.5 text-ink hover:bg-white"><Heart className={`h-4 w-4 ${isSaved ? "fill-rose-600 text-rose-600" : ""}`} /></button>
              </article>;
            })}
          </div>
        )}
        {!coursesQuery.isError && !savedOnly && count > PAGE_SIZE && <nav aria-label="Course pages" className="mt-8 flex items-center justify-center gap-5"><button type="button" disabled={page <= 1 || coursesQuery.isFetching} onClick={() => setPage(page - 1)} className="rounded-xl border border-line bg-paper px-4 py-2 disabled:opacity-40">Previous</button><span className="text-sm">Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || coursesQuery.isFetching} onClick={() => setPage(page + 1)} className="rounded-xl border border-line bg-paper px-4 py-2 disabled:opacity-40">Next</button></nav>}
      </div>
    </div>
  );
}
