"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Blocks,
  BookMarked,
  BookOpen,
  Briefcase,
  Building2,
  Check,
  Clock3,
  GraduationCap,
  Heart,
  KeyRound,
  Landmark,
  Rocket,
  ShoppingCart,
  Trophy,
  Users,
  Wrench,
} from "lucide-react";
import { formatDuration } from "./CourseCatalogParts";
import { formatCoursePrice } from "@/lib/store";

// One crest per seeded category (`CATEGORY_NAMES` in seeddata.py). These were
// emoji, which the OS draws in its own style and colour — "Professional" came
// out as a jagged little chart bitmap that read as a broken image. A Lucide
// glyph in a tinted tile is drawn by the app, stays sharp at any zoom, and
// matches the icons already used further down the card. The two largest
// categories (Coaches & Mentors, Scholars & Founders) had no emoji at all and
// were falling through to the generic book.
const CATEGORY_CRESTS = {
  Academic: { Icon: GraduationCap, tint: "bg-indigo-50 text-indigo-600" },
  Athletic: { Icon: Trophy, tint: "bg-amber-50 text-amber-600" },
  Foundation: { Icon: Blocks, tint: "bg-sky-50 text-sky-600" },
  Legacy: { Icon: Landmark, tint: "bg-stone-100 text-stone-600" },
  Professional: { Icon: Briefcase, tint: "bg-violet-50 text-violet-600" },
  Vocational: { Icon: Wrench, tint: "bg-orange-50 text-orange-600" },
  "Scholars & Founders": { Icon: Rocket, tint: "bg-fuchsia-50 text-fuchsia-600" },
  "Coaches & Mentors": { Icon: Users, tint: "bg-emerald-50 text-emerald-600" },
  "Legacy & Family Offices": { Icon: Building2, tint: "bg-slate-100 text-slate-600" },
};
const DEFAULT_CREST = { Icon: BookMarked, tint: "bg-zinc-100 text-zinc-500" };
const DIFFICULTIES = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" };

export default function CurriculumCourseCard({ course, isSaved, onToggleSaved, canUseCart, inCart, cartPending, onToggleCart }) {
  const accent = course.difficulty === "BEGINNER";
  const duration = formatDuration(course.duration_minutes);
  const description = course.description?.split(/\n\s*\nProvider:/)[0];
  const href = `/curriculum/${course.slug}`;
  const { Icon: CategoryIcon, tint } = CATEGORY_CRESTS[course.category?.name] || DEFAULT_CREST;

  return (
    <article className="flex min-w-0 flex-col rounded-[28px] border border-zinc-100 bg-white p-7 shadow-[0_6px_32px_-16px_rgba(24,24,27,0.12)] transition-shadow hover:shadow-[0_14px_40px_-18px_rgba(24,24,27,0.2)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tint}`}>
          <CategoryIcon className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400" title={course.code}>{course.code}</span>
          <button type="button" onClick={onToggleSaved} aria-pressed={isSaved} aria-label={`${isSaved ? "Unsave" : "Save"} ${course.title}`} className="shrink-0 rounded-full p-2 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-indigo-500">
            <Heart aria-hidden="true" className={`h-4 w-4 ${isSaved ? "fill-rose-600 text-rose-600" : ""}`} />
          </button>
        </div>
      </div>
      <div className="mt-7">
        <span className={`inline-block rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] ${accent ? "bg-indigo-50 text-indigo-800" : "bg-amber-50 text-amber-900"}`}>{course.grade_label || course.category?.name || "General"}</span>
        <h2 className={`mt-5 text-2xl font-bold leading-snug tracking-tight ${accent ? "text-indigo-950" : "text-zinc-900"}`}>
          <Link href={href} className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500">{course.title}</Link>
        </h2>
        <p className="mt-4 text-[13px] font-medium leading-relaxed text-zinc-700"><span className="font-semibold">Subject:</span> {course.category?.name || "General"}</p>
        <p className="mt-5 line-clamp-4 text-sm leading-7 text-zinc-500">{description || "Explore this course and its learning content."}</p>
      </div>
      <div className="mt-auto pt-8">
        <div className="rounded-2xl bg-zinc-50/90 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Course details</p>
          <ul className="mt-4 space-y-3 text-xs font-medium text-zinc-600">
            <li className="flex items-center gap-2.5"><BookOpen aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{DIFFICULTIES[course.difficulty] || "All levels"}</li>
            {duration && <li className="flex items-center gap-2.5"><Clock3 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{duration}</li>}
            <li className="flex items-center justify-between gap-3 border-t border-zinc-200/70 pt-3"><span>Course price</span><span className="text-base font-bold text-zinc-900">{formatCoursePrice(course.amount)}</span></li>
          </ul>
        </div>
        <Link href={href} aria-label={`View course: ${course.title}`} className={`mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 ${accent ? "bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-lg shadow-indigo-500/15" : "bg-zinc-900"}`}>
          <KeyRound aria-hidden="true" className="h-4 w-4" />View course<ArrowUpRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        {canUseCart && <button type="button" onClick={onToggleCart} disabled={cartPending} aria-pressed={inCart} aria-label={`${inCart ? "Remove" : "Add"} ${course.title} ${inCart ? "from" : "to"} cart`} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50">
          {inCart ? <Check aria-hidden="true" className="h-4 w-4" /> : <ShoppingCart aria-hidden="true" className="h-4 w-4" />}{cartPending ? "Updating cart…" : inCart ? "Remove from cart" : "Add to cart"}
        </button>}
      </div>
    </article>
  );
}
