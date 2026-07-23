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
};

export default function StatusBadge({ status }) {
  const normalized = (status || "").toUpperCase();
  const colorClass = STATUS_COLORS[normalized] || "bg-stone-100 text-stone-600 border-stone-200";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border shrink-0 ${colorClass}`}
    >
      {status || "Unknown"}
    </span>
  );
}
