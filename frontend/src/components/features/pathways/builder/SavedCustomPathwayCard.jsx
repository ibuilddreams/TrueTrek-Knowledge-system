"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Pencil, ShoppingBag, Trash2 } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";
import { CN_BTN_PRIMARY, CN_BTN_SECONDARY } from "@/components/ui/cobaltStyles";

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
      className={`flex flex-col gap-4 rounded-cn-lg border bg-white p-5 shadow-cn-1 transition ${
        isEditing ? "border-cn-accent ring-1 ring-cn-accent-soft" : "border-cn-rule"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-cn-base font-bold tracking-[-0.015em] text-cn-ink">
            {pathway.name}
          </h3>
          <p className="mt-1 text-[13px] text-cn-muted">
            {pathway.course_count} course{pathway.course_count === 1 ? "" : "s"} ·{" "}
            {formatCoursePrice(pathway.base_price)}
          </p>
        </div>

        {isPurchased ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-cn-ok-bg px-2.5 py-1 text-cn-xs font-semibold text-cn-ok">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            Purchased
          </span>
        ) : (
          isEditing && (
            <span className="shrink-0 rounded-full bg-cn-paper-3 px-2.5 py-1 text-cn-xs font-semibold text-cn-accent-3">
              Editing
            </span>
          )
        )}
      </div>

      {pathway.summary && (
        <p className="line-clamp-2 text-cn-sm leading-relaxed text-cn-ink-2">
          {pathway.summary}
        </p>
      )}

      <ul className="flex flex-wrap gap-1.5">
        {courses.map((entry) => (
          <li
            key={entry.id}
            className={`max-w-full truncate rounded-full border px-2.5 py-1 text-[13px] ${
              entry.course && entry.course.status !== "PUBLISHED"
                ? "border-cn-live/30 bg-cn-paper-2 text-cn-live line-through"
                : "border-cn-rule bg-cn-paper-2 text-cn-ink-2"
            }`}
          >
            {entry.course?.title}
          </li>
        ))}
      </ul>

      {!isPurchased && hasUnavailableCourses && (
        <p className="flex items-start gap-2 rounded-cn border border-cn-live/30 bg-cn-paper-2 p-3 text-cn-sm leading-relaxed text-cn-live">
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
            href={`${ROUTES.STUDENT_PORTAL}/courses`}
            className={`${CN_BTN_PRIMARY} h-11`}
          >
            Go to my courses
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
              className={`${CN_BTN_PRIMARY} h-11`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {isBuying ? "Processing..." : "Buy now"}
            </button>
            <button
              type="button"
              onClick={() => onEdit(pathway)}
              disabled={isBusy}
              className={`${CN_BTN_SECONDARY} h-11`}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(pathway)}
              disabled={isBusy}
              aria-label={`Delete ${pathway.name}`}
              className="ml-auto grid h-9 w-9 place-items-center rounded-full text-cn-muted transition hover:bg-cn-paper-3 hover:text-cn-live focus:outline-none focus-visible:outline-2 focus-visible:outline-cn-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
