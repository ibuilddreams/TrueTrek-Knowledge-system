"use client";

import { Check } from "lucide-react";

// The photographic panel beside a sign-in form: the design uses the same one
// on the login page and in the enrol modal, so it lives here rather than
// being written twice and drifting.
//
// The panel itself is placed by the caller (`className`), which is what
// decides where it is hidden. The bullet list drops below `lg` on its own:
// where the panel survives as a short banner it has no room for three lines
// under the quote.
const POINTS = [
  "Courses, drills and live classes",
  "Favourites and purchases in one place",
  "Grades and feedback from your teachers",
];

export default function AuthArtPanel({ className = "" }) {
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
        <p className="max-w-[22ch] text-cn-xl leading-[1.2] font-bold tracking-[-0.025em] lg:text-cn-2xl">
          Nine tiers of capital, law and legacy, and one dashboard to work
          through them.
        </p>
        <ul className="m-0 grid list-none gap-2 p-0 text-cn-sm text-cn-on-ink-2 max-lg:hidden">
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
