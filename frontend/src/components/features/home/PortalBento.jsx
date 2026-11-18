"use client";

import { Check, Play } from "lucide-react";
import CountUp from "./CountUp";

// The design's portal bento: one wide tile showing progress tracking, then
// four narrow ones for grading, the daily drill, live classes and rewards.
//
// Everything inside the tiles is an *illustration* of the portal, not live
// data — a signed-out visitor has no courses, no points and no grades, and
// the section's job is to show what the portal looks like. The sample rows
// are therefore fixed, and deliberately use the same course codes and
// pathway photographs the real catalog uses so the picture is honest.
const LESSON_ROWS = [
  {
    title: "The Athlete CEO Mindset",
    percent: 44,
    code: "CEO-101",
    teacher: "Michael Carter",
    next: "The Operating Cadence",
    image: "/images/design/path-ceo.webp",
  },
  {
    title: "The Coaching Exit Strategy",
    percent: 22,
    code: "COH-412",
    teacher: "Emily Rodriguez",
    next: "Preparing Years Before",
    image: "/images/design/path-coaching.webp",
  },
  {
    title: "Building the Target Fit Matrix",
    percent: 68,
    code: "REC-103",
    teacher: "David Nguyen",
    next: "The core model",
    image: "/images/design/path-recruiting.webp",
  },
];

const DRILL_OPTIONS = [
  { key: "A", label: "Sign immediately" },
  { key: "B", label: "Reject outright" },
  { key: "C", label: "Send a redlined counter", correct: true },
];

// Built per tile rather than written once and overridden, because two
// background (or border, or text) utilities on one element resolve by the
// order Tailwind emits them, not the order they are written — appending
// `bg-cn-accent` to a string that already says `bg-white` silently loses, and
// the cobalt tile renders white with white text on it.
const TILE_BASE =
  "relative flex flex-col gap-4 overflow-hidden rounded-cn-lg border p-10 shadow-cn-1 transition-shadow duration-200 ease-cn-out hover:shadow-cn-2";

function tileClass(variant = "paper") {
  return variant === "cobalt"
    ? `${TILE_BASE} border-transparent bg-cn-accent text-cn-on-ink`
    : `${TILE_BASE} border-cn-rule bg-white`;
}
const TILE_H3_BASE = "text-cn-xl font-bold tracking-[-0.015em]";
const TILE_H3 = `${TILE_H3_BASE} text-cn-ink`;
// On the cobalt tile the heading and paragraph inherit the tile's own colour
// rather than naming one, for the same emission-order reason.
const TILE_H3_ON_COBALT = TILE_H3_BASE;
const TILE_P = "max-w-[42ch] text-cn-ink-2";
// `mt-auto` is what keeps every tile's panel on the same baseline however
// long the paragraph above it runs.
const MINI = "mt-auto grid gap-3 rounded-cn bg-cn-paper-2 p-4";

function Bar({ percent, className = "" }) {
  return (
    <span
      className={`block overflow-hidden rounded-full bg-cn-paper-4 ${className}`}
    >
      <span
        className="cn-bar-fill block h-full rounded-[inherit] bg-cn-accent"
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}

export default function PortalBento() {
  return (
    <div id="portal-bento" className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
      {/* Progress tracking — the wide tile, split text / window. */}
      <article
        data-cn-reveal
        className={`cn-reveal ${tileClass()} md:col-span-2 lg:col-span-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-10`}
      >
        <div className="grid content-center gap-4">
          <h3 className={TILE_H3}>Lessons that track themselves</h3>
          <p className={TILE_P}>
            Every lesson, assignment and quiz updates progress the moment it is
            done.
          </p>
          <ul className="mt-2 grid list-none gap-2 p-0 text-cn-sm text-cn-ink-2">
            {[
              "Progress saved on every lesson",
              "Your next lesson, always one click away",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check
                  className="w-4 h-4 flex-none text-cn-accent"
                  strokeWidth={2.4}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-cn border border-cn-rule bg-white shadow-cn-2">
          <div className="flex items-center justify-between border-b border-cn-rule bg-cn-paper-2 px-4 py-3">
            <b className="text-cn-sm text-cn-ink">Continue learning</b>
            <span className="rounded-full bg-cn-paper-3 px-2.5 py-0.5 text-cn-xs font-semibold text-cn-accent-3">
              {LESSON_ROWS.length} in progress
            </span>
          </div>
          <ul className="m-0 list-none px-4 py-1">
            {LESSON_ROWS.map((row) => (
              <li
                key={row.code}
                className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-4 border-b border-cn-rule py-3 last:border-b-0"
              >
                <span className="h-[52px] w-[52px] overflow-hidden rounded-xl">
                  <img
                    src={row.image}
                    alt=""
                    width={104}
                    height={104}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="grid min-w-0 gap-1.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <b className="truncate text-cn-sm text-cn-ink">{row.title}</b>
                    <span className="text-cn-sm font-bold tabular-nums text-cn-accent">
                      {row.percent}%
                    </span>
                  </span>
                  <Bar percent={row.percent} className="h-[5px]" />
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-cn-xs text-cn-muted">
                    <span className="font-bold text-cn-ink-2">{row.code}</span>
                    {row.teacher}
                    <span className="inline-flex items-center gap-1 font-semibold text-cn-accent-3 max-sm:w-full sm:ml-auto">
                      <Play className="w-3 h-3 fill-current text-cn-accent" />
                      Next: {row.next}
                    </span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </article>

      {/* Grading — the one cobalt tile in the grid. */}
      <article
        data-cn-reveal
        style={{ "--cn-d": 1 }}
        className={`cn-reveal ${tileClass("cobalt")} lg:col-span-2`}
      >
        <h3 className={TILE_H3_ON_COBALT}>Graded with feedback</h3>
        <p className="max-w-[42ch] text-cn-on-ink-2">
          Teachers grade from one queue. Students see the score and the note
          straight away.
        </p>
        <div className={`${MINI} bg-white/10`}>
          <div className="flex items-center justify-between gap-3 rounded-cn-sm bg-white/12 p-4">
            <span>
              <b className="block">CEO-101 Module 1</b>
              <span className="text-cn-xs opacity-80">
                Feedback from Michael Carter
              </span>
            </span>
            <span className="flex-none text-cn-2xl leading-[1.55] font-extrabold tracking-[-0.03em] whitespace-nowrap">
              <CountUp value={132} />
              <span className="text-cn-base opacity-60"> / 150</span>
            </span>
          </div>
        </div>
      </article>

      {/* The daily drill. */}
      <article data-cn-reveal className={`cn-reveal ${tileClass()} lg:col-span-2`}>
        <h3 className={TILE_H3}>A drill every morning</h3>
        <p className={TILE_P}>
          One real dilemma a day, with the best move explained.
        </p>
        <div className={MINI}>
          {DRILL_OPTIONS.map((option) => (
            <div
              key={option.key}
              className={`flex items-center gap-3 rounded-cn-sm border-[1.5px] bg-white p-3 text-cn-sm transition-[border-color,background-color] duration-[400ms] ${
                option.correct
                  ? "border-cn-ok bg-cn-ok-bg"
                  : "border-cn-rule"
              }`}
            >
              <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-lg bg-cn-paper-2 text-cn-xs font-bold">
                {option.key}
              </span>
              {option.label}
            </div>
          ))}
        </div>
      </article>

      {/* Live classes. */}
      <article
        data-cn-reveal
        style={{ "--cn-d": 1 }}
        className={`cn-reveal ${tileClass()} lg:col-span-2`}
      >
        <h3 className={TILE_H3}>Live classes</h3>
        <p className={TILE_P}>
          Instructors go live; enrolled students get the alert.
        </p>
        <div className={MINI}>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-cn-sm font-semibold text-cn-ink">
              <span className="cn-livedot h-2 w-2 rounded-full bg-cn-live" />
              Office hours
            </span>
            <span className="flex">
              {["ER", "AJ", "LS", "+6"].map((initials) => (
                <span
                  key={initials}
                  className="-ml-2 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-cn-paper-3 text-[11px] font-bold text-cn-accent first:ml-0"
                >
                  {initials}
                </span>
              ))}
            </span>
          </div>
          <span className="grid h-11 place-items-center rounded-cn-sm bg-cn-accent px-4 text-cn-sm font-semibold text-white">
            Join class
          </span>
        </div>
      </article>

      {/* Rewards. */}
      <article
        data-cn-reveal
        style={{ "--cn-d": 2 }}
        className={`cn-reveal ${tileClass()} md:col-span-2 lg:col-span-2`}
      >
        <h3 className={TILE_H3}>Rewards that mean something</h3>
        <p className={TILE_P}>
          Quests and drills earn points for mentorship, merch and access.
        </p>
        <div className={MINI}>
          <span className="text-cn-xs text-cn-muted">Points balance</span>
          <CountUp
            value={240}
            className="text-[clamp(2.5rem,3vw+1rem,3.5rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums text-cn-ink"
          />
          <Bar percent={80} className="h-1.5" />
          <span className="text-cn-xs text-cn-muted">
            30 points to a mentor session
          </span>
        </div>
      </article>
    </div>
  );
}
