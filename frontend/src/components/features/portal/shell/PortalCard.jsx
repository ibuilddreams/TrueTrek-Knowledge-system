"use client";

import Link from "next/link";

// The portal's panel, and the header that sits inside it. The design uses the
// same white card with a 16px radius and a hairline rule everywhere in the
// signed-in app, so it lives here rather than being re-typed per screen.
const SURFACES = {
  card: "border border-cn-p-line bg-cn-p-card",
  // The dashboard hero. Its own surface rather than a class the caller
  // appends: Tailwind resolves conflicting utilities by the order they are
  // emitted in the stylesheet, not by their order in the class string, so a
  // `bg-*` added after the base one is not guaranteed to win.
  accent: "border-0 bg-cn-p-accent text-white",
};

export default function PortalCard({ tone = "card", className = "", children }) {
  return (
    <section className={`rounded-cn-p ${SURFACES[tone] ?? SURFACES.card} ${className}`}>
      {children}
    </section>
  );
}

/** Title on the left, an optional link on the right, over a hairline rule. */
export function PortalCardHead({ title, action, href, onAction }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-cn-p-line px-5 py-4">
      <h2 className="text-base font-bold tracking-[-0.01em] text-cn-p-ink">
        {title}
      </h2>
      {action && href && (
        <Link
          href={href}
          className="text-sm font-semibold text-cn-p-accent no-underline hover:underline"
        >
          {action}
        </Link>
      )}
      {action && !href && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-semibold text-cn-p-accent hover:underline"
        >
          {action}
        </button>
      )}
    </div>
  );
}

/** One of the dashboard's four headline numbers. */
export function PortalStat({ label, value, hint, icon: Icon, tone = "accent" }) {
  const TONES = {
    accent: "bg-cn-p-soft text-cn-p-accent",
    warn: "bg-cn-p-warn-bg text-cn-p-warn",
    ok: "bg-cn-p-ok-bg text-cn-p-ok",
    neutral: "bg-cn-p-neutral-bg text-cn-p-ink-2",
  };
  return (
    <PortalCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-cn-p-ink-2">{label}</p>
        {Icon && (
          <span
            className={`grid h-9 w-9 flex-none place-items-center rounded-cn-p-sm ${TONES[tone] || TONES.accent}`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
          </span>
        )}
      </div>
      <p className="mt-3 text-[32px] leading-none font-extrabold tracking-[-0.02em] tabular-nums text-cn-p-ink">
        {value}
      </p>
      {hint && <p className="mt-2 text-[13px] text-cn-p-muted">{hint}</p>}
    </PortalCard>
  );
}

/** The thin progress rail the design uses beside a percentage. */
export function PortalBar({ value = 0, className = "" }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <span
      className={`block h-1.5 w-full overflow-hidden rounded-full bg-cn-p-track ${className}`}
    >
      <span
        className="block h-full rounded-full bg-cn-p-accent transition-[width] duration-500 ease-cn-out"
        style={{ width: `${pct}%` }}
      />
    </span>
  );
}
