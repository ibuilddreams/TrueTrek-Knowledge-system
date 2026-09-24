"use client";

const STATUS_COLORS = {
  ACTIVE: "bg-sage/40 text-pine border-pine/20",
  PUBLISHED: "bg-sage/40 text-pine border-pine/20",
  DRAFT: "bg-porcelain text-muted border-line",
  ARCHIVED: "bg-porcelain text-muted border-line",
  SUSPENDED: "bg-gold/12 text-gold border-gold/25",
  CANCELLED: "bg-rose/35 text-clay border-clay/25",
  COMPLETED: "bg-sky/60 text-blue border-blue/20",
  DEACTIVATED: "bg-rose/35 text-clay border-clay/25",
  PASSED: "bg-sage/40 text-pine border-pine/20",
  FAILED: "bg-rose/35 text-clay border-clay/25",
  NOT_ATTEMPTED: "bg-porcelain text-muted border-line",
  IN_PROGRESS: "bg-gold/12 text-gold border-gold/25",
  SUBMITTED: "bg-gold/12 text-gold border-gold/25",
  GRADED: "bg-sage/40 text-pine border-pine/20",
  EXPIRED: "bg-clay/12 text-clay border-clay/25",
  ABANDONED: "bg-porcelain text-muted border-line",
  PENDING: "bg-gold/12 text-gold border-gold/25",
  APPROVED: "bg-sage/40 text-pine border-pine/20",
  REJECTED: "bg-rose/35 text-clay border-clay/25",
  HIDDEN: "bg-clay/12 text-clay border-clay/25",
};

export default function StatusBadge({ status, size = "base" }) {
  const normalized = (status || "").toUpperCase();
  const colorClass = STATUS_COLORS[normalized] || "bg-porcelain text-muted border-line";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded ${size === "lg" ? "text-[11px]" : "text-[10px]"} font-mono uppercase tracking-widest border shrink-0 ${colorClass}`}
    >
      {status || "Unknown"}
    </span>
  );
}
