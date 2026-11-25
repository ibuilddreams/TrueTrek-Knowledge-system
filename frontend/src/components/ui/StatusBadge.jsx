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
  EVALUATING: "bg-gold/12 text-gold border-gold/25",
  SUBMITTED: "bg-gold/12 text-gold border-gold/25",
  GRADED: "bg-sage/40 text-pine border-pine/20",
  EXPIRED: "bg-clay/12 text-clay border-clay/25",
  ABANDONED: "bg-porcelain text-muted border-line",
  PENDING: "bg-gold/12 text-gold border-gold/25",
  APPROVED: "bg-sage/40 text-pine border-pine/20",
  REJECTED: "bg-rose/35 text-clay border-clay/25",
  UNDER_REVIEW: "bg-sky/60 text-blue border-blue/20",
  CHANGES_REQUESTED: "bg-gold/12 text-gold border-gold/25",
  HIDDEN: "bg-clay/12 text-clay border-clay/25",
};

// The portal design has no bordered, uppercase, monospaced badge: it has one
// `.pill`, a 24px rounded chip in one of five tones. `tone="cobalt"` renders
// that; the default is the porcelain badge above, byte-identical, because the
// admin portal and the public site still read it.
const COBALT_TONES = {
  ok: "bg-cn-p-ok-bg text-cn-p-ok",
  warn: "bg-cn-p-warn-bg text-cn-p-warn",
  bad: "bg-cn-p-bad-bg text-cn-p-bad",
  blue: "bg-cn-p-soft text-cn-p-soft-ink",
  neutral: "bg-cn-p-neutral-bg text-cn-p-ink-2",
};

// Keyed on the same vocabulary as STATUS_COLORS, plus the words the teacher
// screens pass through as display strings (concern severities, class states).
const COBALT_STATUS_TONES = {
  ACTIVE: "ok", PUBLISHED: "ok", PASSED: "ok", GRADED: "ok", APPROVED: "ok",
  COMPLETED: "ok", RESOLVED: "ok", AVAILABLE: "ok", ACCEPTED: "ok",
  SUSPENDED: "warn", IN_PROGRESS: "warn", EVALUATING: "warn", SUBMITTED: "warn",
  PENDING: "warn", CHANGES_REQUESTED: "warn", OPEN: "warn", MEDIUM: "warn",
  STARTING: "warn", RECORDING: "warn", PROCESSING: "warn", TRANSCRIBING: "warn",
  COLLECTING: "warn", SUMMARIZING: "warn", PAUSED: "warn",
  CANCELLED: "bad", DEACTIVATED: "bad", FAILED: "bad", REJECTED: "bad",
  EXPIRED: "bad", HIDDEN: "bad", HIGH: "bad", OVERDUE: "bad", SAFETY: "bad",
  UNDER_REVIEW: "blue", SCHEDULED: "blue", LIVE: "blue",
  DRAFT: "neutral", ARCHIVED: "neutral", NOT_ATTEMPTED: "neutral",
  ABANDONED: "neutral", LOW: "neutral", ENDED: "neutral",
};

export default function StatusBadge({ status, size = "base", tone = "porcelain" }) {
  const normalized = (status || "").toUpperCase();

  if (tone === "cobalt") {
    // A caller may pass either the stored code (`IN_PROGRESS`) or the display
    // string the API sent alongside it (`In Progress`), so both resolve here —
    // the classic path above is left exactly as it was.
    const key = normalized.replace(/[\s-]+/g, "_");
    const toneClass = COBALT_TONES[COBALT_STATUS_TONES[key] ?? "neutral"];
    // The design's pills are sentence case: "Published", "In progress". Both
    // spellings a caller can arrive with are rewritten to it — the stored code
    // (`IN_PROGRESS`) and the Title Case display string Django's own `choices`
    // send alongside it (`In Progress`) — so the same status never reads two
    // ways depending on which field the screen happened to render. Only
    // statuses pass through here, so there is no brand or acronym to protect.
    const text =
      typeof status === "string" && /^[A-Za-z][A-Za-z0-9_ ]*$/.test(status)
        ? status.charAt(0).toUpperCase() +
          status.slice(1).toLowerCase().replace(/_/g, " ")
        : status || "Unknown";
    return (
      <span
        className={`inline-flex h-6 flex-none items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${toneClass}`}
      >
        {text}
      </span>
    );
  }

  const colorClass = STATUS_COLORS[normalized] || "bg-porcelain text-muted border-line";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded ${size === "lg" ? "text-[11px]" : "text-[10px]"} font-mono uppercase tracking-widest border shrink-0 ${colorClass}`}
    >
      {status || "Unknown"}
    </span>
  );
}
