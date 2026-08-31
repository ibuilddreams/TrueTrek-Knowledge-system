"use client";

const STATUS_COLORS = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  DRAFT: "bg-stone-100 text-stone-600 border-stone-200",
  ARCHIVED: "bg-stone-100 text-stone-500 border-stone-200",
  SUSPENDED: "bg-amber-50 text-amber-700 border-amber-200",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  DEACTIVATED: "bg-rose-50 text-rose-700 border-rose-200",
  PASSED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-rose-50 text-rose-700 border-rose-200",
  NOT_ATTEMPTED: "bg-stone-100 text-stone-500 border-stone-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-200",
  GRADED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  EXPIRED: "bg-orange-50 text-orange-700 border-orange-200",
  ABANDONED: "bg-stone-200 text-stone-600 border-stone-300",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function StatusBadge({ status, size = "base" }) {
  const normalized = (status || "").toUpperCase();
  const colorClass = STATUS_COLORS[normalized] || "bg-stone-100 text-stone-600 border-stone-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded ${size === "lg" ? "text-[11px]" : "text-[10px]"} font-mono uppercase tracking-widest border shrink-0 ${colorClass}`}
    >
      {status || "Unknown"}
    </span>
  );
}
