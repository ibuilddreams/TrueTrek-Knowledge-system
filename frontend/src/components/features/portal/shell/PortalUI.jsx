"use client";

import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";

/**
 * The small, repeated pieces of the signed-in design — the page header, the
 * pills, the breadcrumbs, the buttons, the toolbar's search and segmented
 * filter, the progress ring and the key/value tiles.
 *
 * Each one is the portal stylesheet's own primitive (`.phead`, `.pill`,
 * `.crumbs`, `.btn`, `.search`, `.seg`, `ring()`, `.kv`, `.empty`) written
 * once here rather than retyped per screen, so the screens stay in step with
 * each other the way the design's single stylesheet keeps them.
 */

/** `.phead` — the title block at the top of a screen, with optional actions. */
export function PortalPageHead({ title, subtitle, crumbs, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {crumbs}
        <h2 className="text-[26px] leading-[1.2] font-bold tracking-[-0.015em] text-cn-p-ink">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 max-w-[70ch] text-cn-p-ink-2">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}

/** `.crumbs` — every entry but the last is a link back. */
export function PortalCrumbs({ items = [] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-1.5 flex flex-wrap items-center gap-1.5 text-[13px] text-cn-p-ink-2"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {isLast ? (
              <span className="truncate">{item.label}</span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={item.onClick}
                  className="font-semibold text-cn-p-accent hover:underline"
                >
                  {item.label}
                </button>
                <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              </>
            )}
          </span>
        );
      })}
    </nav>
  );
}

const PILL_TONES = {
  neutral: "bg-cn-p-neutral-bg text-cn-p-ink-2",
  blue: "bg-cn-p-soft text-cn-p-soft-ink",
  ok: "bg-cn-p-ok-bg text-cn-p-ok",
  warn: "bg-cn-p-warn-bg text-cn-p-warn",
  bad: "bg-cn-p-bad-bg text-cn-p-bad",
  ink: "bg-cn-p-ink text-white",
};

/** `.pill` — a 24px status chip. */
export function PortalPill({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex h-6 flex-none items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${
        PILL_TONES[tone] ?? PILL_TONES.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}

const BUTTON_VARIANTS = {
  pri: "bg-cn-p-accent text-white hover:bg-cn-p-accent-hover",
  sec: "border-cn-p-line-2 bg-cn-p-card text-cn-p-ink hover:border-cn-p-ink",
  ghost: "bg-transparent text-cn-p-accent hover:bg-cn-p-soft",
};

const BUTTON_SIZES = {
  md: "h-11 px-[18px] text-sm",
  sm: "h-9 px-3 text-[13px]",
};

/** `.btn` — `as="link"` renders the same shape as a Next `Link`. */
export function PortalButton({
  variant = "pri",
  size = "md",
  as = "button",
  href,
  className = "",
  children,
  ...rest
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-cn-p-sm border border-transparent font-semibold whitespace-nowrap transition-[background-color,border-color] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 ${
    BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.pri
  } ${BUTTON_SIZES[size] ?? BUTTON_SIZES.md} ${className}`;

  if (as === "link") {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

/** `.search` as it sits inside a card's `.toolbar`. */
export function PortalSearchBox({ value, onChange, placeholder, className = "" }) {
  return (
    <label
      className={`flex h-10 w-[280px] max-w-full items-center gap-2.5 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3.5 text-cn-p-muted focus-within:border-cn-p-accent ${className}`}
    >
      <Search aria-hidden="true" className="h-[18px] w-[18px] flex-none" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full border-0 bg-transparent text-sm text-cn-p-ink outline-none placeholder:text-cn-p-muted"
      />
    </label>
  );
}

/** `.seg` — the segmented filter. */
export function PortalSegmented({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap gap-0.5 rounded-xl bg-cn-p-neutral-bg p-1"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`h-[34px] rounded-[9px] border-0 px-3 text-[13px] font-semibold ${
              isActive
                ? "bg-cn-p-card text-cn-p-ink shadow-[0_1px_2px_rgba(17,24,39,0.08)]"
                : "bg-transparent text-cn-p-ink-2"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** The design's `ring()` donut, drawn at any size with a label in the middle. */
export function PortalRing({ value = 0, size = 104, label, sub }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = size / 2 - 9;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label ?? ""} ${pct}%`.trim()}
      className="flex-none"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-cn-p-track)"
        strokeWidth="10"
      />
      {/* A rounded cap draws a visible dot even at zero, which reads as one
          lesson's worth of progress nobody has made — so no arc at all. */}
      {pct > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-cn-p-accent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(circumference * pct) / 100} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dasharray] duration-700 ease-cn-out"
        />
      )}
      <text
        x="50%"
        y={sub ? "47%" : "54%"}
        textAnchor="middle"
        fontSize={size > 90 ? 26 : 18}
        fontWeight="700"
        fill="var(--color-cn-p-ink)"
      >
        {label ?? `${pct}%`}
      </text>
      {sub && (
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          fontSize="10"
          fontWeight="600"
          letterSpacing="1"
          fill="var(--color-cn-p-ink-2)"
        >
          {sub}
        </text>
      )}
    </svg>
  );
}

/** `.kv` — the small key/value tiles. `columns` matches the design's own grid. */
export function PortalKv({ columns = 4, className = "", children }) {
  return (
    <dl
      className={`m-0 grid gap-3 ${
        columns === 2 ? "grid-cols-2" : "grid-cols-2 min-[40rem]:grid-cols-4"
      } ${className}`}
    >
      {children}
    </dl>
  );
}

export function PortalKvItem({ label, value }) {
  return (
    <div className="rounded-xl bg-cn-p-page px-3.5 py-3">
      <dt className="text-xs text-cn-p-ink-2">{label}</dt>
      <dd className="m-0 mt-0.5 text-base font-bold text-cn-p-ink">{value}</dd>
    </div>
  );
}

/** `.kick` — the small uppercase label above a card's contents. */
export function PortalKicker({ className = "", children }) {
  return (
    <span
      className={`text-xs font-semibold tracking-[0.08em] text-cn-p-ink-2 uppercase ${className}`}
    >
      {children}
    </span>
  );
}

/** `.secl` — the uppercase divider inside an open module. */
export function PortalSectionLabel({ className = "", children }) {
  return (
    <div
      className={`px-2 pt-3 pb-1 text-xs font-bold tracking-[0.06em] text-cn-p-muted uppercase ${className}`}
    >
      {children}
    </div>
  );
}

/** `.empty` — the centred nothing-here block. */
export function PortalEmpty({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
      {Icon && (
        <span className="grid h-9 w-9 place-items-center rounded-cn-p-sm bg-cn-p-soft text-cn-p-soft-ink">
          <Icon className="h-6 w-6" strokeWidth={1.9} />
        </span>
      )}
      <h4 className="text-base font-bold text-cn-p-ink">{title}</h4>
      {text && <p className="max-w-[46ch] text-sm text-cn-p-ink-2">{text}</p>}
      {children}
    </div>
  );
}

/** `.tick` — the completion circle beside a lesson. */
export function PortalTick({ isOn, size = 24 }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`grid flex-none place-items-center rounded-full border-2 ${
        isOn
          ? "border-cn-p-accent bg-cn-p-accent text-white"
          : "border-cn-p-line-2 text-transparent"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ width: size * 0.58, height: size * 0.58 }}
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

const ICON_TONES = {
  accent: "bg-cn-p-soft text-cn-p-soft-ink",
  warn: "bg-cn-p-warn-bg text-cn-p-warn",
  ok: "bg-cn-p-ok-bg text-cn-p-ok",
  bad: "bg-cn-p-bad-bg text-cn-p-bad",
};

/** `.ico` / `.ico.lg` — the rounded tile a row's glyph sits in. */
export function PortalIcon({ icon: Icon, tone = "accent", size = "md", children }) {
  const isLarge = size === "lg";
  return (
    <span
      className={`grid flex-none place-items-center ${
        isLarge ? "h-11 w-11 rounded-xl" : "h-9 w-9 rounded-cn-p-sm"
      } ${ICON_TONES[tone] ?? ICON_TONES.accent}`}
    >
      {Icon ? (
        <Icon
          className={isLarge ? "h-[22px] w-[22px]" : "h-[18px] w-[18px]"}
          strokeWidth={1.9}
        />
      ) : (
        children
      )}
    </span>
  );
}
