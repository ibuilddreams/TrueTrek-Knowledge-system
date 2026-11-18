"use client";

import { Check } from "lucide-react";

// The design's `.lgart`: the photographic panel beside a sign-in form. It is
// used in two places that style it differently, which is what `variant` picks:
//
//   "page"  — the login page's `.lgwrap .lgart`. The quote drops from
//             `--text-2xl` to `--text-xl` and the bullets disappear below
//             60rem, where the panel becomes a 280px banner above the form.
//   "modal" — the enrol dialog's `.lgm .lgart`. The quote is always
//             `--text-xl` and the whole panel is hidden below 48rem, so its
//             bullets never need to hide on their own.
//
// Both breakpoints are the design's own, not Tailwind's `lg` — they differ by
// 64px and 256px respectively, which is a visible layout change on a laptop.
const POINTS = [
  "Courses, drills and live classes",
  "Your courses and purchases in one place",
  "Grades and feedback from your teachers",
];

export default function AuthArtPanel({ className = "", variant = "page" }) {
  const isModal = variant === "modal";

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src="/images/design/hero-athlete-study.webp"
        alt="A student athlete studying at a library table"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,37,128,0.05)_30%,rgba(10,16,40,0.86))]"
      />
      <div className="absolute inset-x-10 bottom-10 z-10 grid gap-4 text-cn-on-ink">
        <img
          src="/images/design/mark-white.png"
          alt=""
          aria-hidden="true"
          width={44}
          height={54}
          className="w-11 opacity-90"
        />
        <p
          className={`max-w-[22ch] leading-[1.2] font-bold tracking-[-0.025em] ${
            isModal ? "text-cn-xl" : "text-cn-2xl max-[60rem]:text-cn-xl"
          }`}
        >
          Nine tiers of capital, law and legacy, and one dashboard to work
          through them.
        </p>
        <ul
          className={`m-0 grid list-none gap-2 p-0 text-cn-sm text-cn-on-ink-2 ${
            isModal ? "" : "max-[60rem]:hidden"
          }`}
        >
          {POINTS.map((point) => (
            <li key={point} className="flex items-center gap-2">
              <Check
                className="h-4 w-4 flex-none text-cn-accent-soft"
                strokeWidth={2.4}
              />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
