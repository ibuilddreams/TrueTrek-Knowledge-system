"use client";

import Link from "next/link";
import { CreditCard, Lock } from "lucide-react";
import { formatCoursePrice } from "@/lib/store";
import { ROUTES } from "@/constants/routes";

export default function CartOrderSummary({ courses, onPurchase, isDisabled = false }) {
  const subtotal = courses.reduce((sum, course) => sum + (Number(course.amount) || 0), 0);

  return (
    <aside
      id="cart-order-summary"
      className="bg-paper border border-line rounded-card shadow-soft p-6 space-y-5 lg:sticky lg:top-28"
    >
      <h2 className="font-serif font-light text-lg text-ink">Order Summary</h2>

      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">
            {courses.length} {courses.length === 1 ? "course" : "courses"}
          </dt>
          <dd className="font-sans font-semibold text-ink">{formatCoursePrice(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-line">
          <dt className="font-bold text-ink">Total</dt>
          <dd className="text-xl font-sans font-semibold text-ink">
            {formatCoursePrice(subtotal)}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onPurchase}
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper font-sans text-sm font-medium uppercase tracking-widest py-3.5 rounded-full shadow-soft transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <CreditCard className="w-4 h-4" />
        Purchase
      </button>

      <Link
        href={ROUTES.STORE}
        className="block text-center text-xs font-sans font-medium uppercase tracking-widest text-muted hover:text-ink transition-colors"
      >
        Continue Browsing
      </Link>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
        <Lock className="w-3 h-3 shrink-0" />
        Instant enrollment after payment
      </p>
    </aside>
  );
}
