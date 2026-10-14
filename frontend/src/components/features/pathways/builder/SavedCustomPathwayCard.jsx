"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Pencil, ShoppingBag, Trash2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";

// One saved custom pathway. Purchased bundles become read-only — their price
// and contents have to keep matching what was actually paid for, which the
// backend enforces too.
export default function SavedCustomPathwayCard({
  pathway,
  isEditing = false,
  isBuying = false,
  isDeleting = false,
  onBuy,
  onEdit,
  onDelete,
}) {
  const courses = pathway.courses || [];
  const isPurchased = Boolean(pathway.is_purchased);
  const isBusy = isBuying || isDeleting;

  // A course can be unpublished after the bundle was saved. The price was
  // snapshotted from every course in it, so buying it now would charge for a
  // course that can no longer be enrolled in — the student edits it out first
  // (which reprices the bundle) before they can check out.
  const unavailableCourses = courses.filter(
    (entry) => entry.course && entry.course.status !== "PUBLISHED",
  );
  const hasUnavailableCourses = unavailableCourses.length > 0;

  return (
    <li
      id={`custom-pathway-${pathway.id}`}
      className={`rounded-2xl border bg-paper shadow-soft p-5 flex flex-col gap-4 transition ${
        isEditing ? "border-gold ring-1 ring-gold/40" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-serif font-light text-ink leading-tight truncate">
            {pathway.name}
          </h3>
          <p className="text-[10px] font-sans uppercase tracking-widest font-medium text-muted mt-1">
            {pathway.course_count} course{pathway.course_count === 1 ? "" : "s"} ·{" "}
            {formatCoursePrice(pathway.base_price)}
          </p>
        </div>

        {isPurchased ? (
          <span className="flex items-center gap-1 text-[10px] font-sans font-medium uppercase tracking-widest border px-2.5 py-1 rounded-full shrink-0 bg-sage text-moss border-moss/30">
            <CheckCircle2 className="w-3 h-3 shrink-0 text-moss" />
            Purchased
          </span>
        ) : (
          isEditing && (
            <span className="text-[10px] font-sans font-medium uppercase tracking-widest border px-2.5 py-1 rounded-full shrink-0 bg-gold/15 text-[#8a6f2e] border-gold/30">
              Editing
            </span>
          )
        )}
      </div>

      {pathway.summary && (
        <p className="text-xs font-light leading-relaxed text-muted line-clamp-2">
          {pathway.summary}
        </p>
      )}

      <ul className="flex flex-wrap gap-1.5">
        {courses.map((entry) => (
          <li
            key={entry.id}
            className={`max-w-full truncate text-[11px] font-sans border rounded-full px-2.5 py-1 ${
              entry.course && entry.course.status !== "PUBLISHED"
                ? "bg-rose/30 border-clay/30 text-clay line-through"
                : "bg-porcelain border-line text-muted"
            }`}
          >
            {entry.course?.title}
          </li>
        ))}
      </ul>

      {!isPurchased && hasUnavailableCourses && (
        <p className="flex items-start gap-2 rounded-xl border border-clay/30 bg-rose/20 p-3 text-[11px] leading-relaxed text-clay">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span>
            {unavailableCourses.length === 1
              ? "One course in this pathway is no longer available."
              : `${unavailableCourses.length} courses in this pathway are no longer available.`}{" "}
            Edit the pathway to remove it before buying.
          </span>
        </p>
      )}

      <div className="mt-auto pt-1 flex flex-wrap items-center gap-2">
        {isPurchased ? (
          <Link
            href={`${ROUTES.STUDENT_PORTAL}?tab=courses`}
            className="inline-flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper font-sans text-[11px] font-medium uppercase tracking-widest px-5 py-2.5 rounded-full shadow-soft transition"
          >
            Go To My Courses
          </Link>
        ) : (
          <>
            <button
              id={`custom-pathway-buy-${pathway.id}`}
              type="button"
              onClick={() => onBuy(pathway)}
              disabled={isBusy || hasUnavailableCourses}
              title={
                hasUnavailableCourses
                  ? "Remove the unavailable course(s) before buying"
                  : undefined
              }
              className="inline-flex items-center justify-center gap-2 bg-gold hover:brightness-95 text-ink font-sans text-[11px] font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {isBuying ? "Processing..." : "Buy Now"}
            </button>
            <button
              type="button"
              onClick={() => onEdit(pathway)}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 border border-line bg-porcelain hover:bg-line/40 text-ink font-sans text-[11px] font-medium uppercase tracking-widest px-4 py-2.5 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(pathway)}
              disabled={isBusy}
              aria-label={`Delete ${pathway.name}`}
              className="ml-auto inline-flex items-center justify-center w-9 h-9 rounded-full text-muted hover:text-clay hover:bg-rose/30 transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
