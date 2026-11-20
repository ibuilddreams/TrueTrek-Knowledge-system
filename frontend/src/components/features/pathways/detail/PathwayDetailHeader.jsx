"use client";

import Link from "next/link";
import { BarChart3, Infinity as InfinityIcon, Layers, Timer } from "lucide-react";
import { ROUTES } from "@/constants/routes";

// The design's `.cdh`: the ink band a detail page opens on. Its right-hand
// column is deliberately empty — the buy card in the body below is pulled up
// into it, which is how the design layers the two.
const DIFFICULTY_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export default function PathwayDetailHeader({ pathway }) {
  const courseCount = pathway.course_count ?? pathway.courses?.length ?? 0;
  const level = DIFFICULTY_LABELS[pathway.difficulty] || "All levels";
  const tier = pathway.tiers?.[0]?.name;

  const facts = [
    {
      icon: Layers,
      label: `${courseCount} course${courseCount === 1 ? "" : "s"}`,
    },
    { icon: BarChart3, label: `${level} starting level` },
    {
      icon: Timer,
      label:
        pathway.duration_weeks > 0
          ? `${pathway.duration_weeks} week${pathway.duration_weeks === 1 ? "" : "s"}`
          : "Self-paced",
    },
    { icon: InfinityIcon, label: "Lifetime access" },
  ];

  return (
    <header className="bg-cn-ink py-16 text-cn-on-ink">
      <div className="cn-container grid gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <div className="grid content-start gap-4">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-cn-sm text-cn-on-ink-2"
          >
            <Link
              href={ROUTES.PATHWAYS}
              className="text-cn-accent-soft no-underline hover:underline"
            >
              Pathways
            </Link>
            <span aria-hidden="true">/</span>
            <span>{tier || "Guided pathway"}</span>
          </nav>

          <h1 className="text-[clamp(2rem,2.4vw+1rem,3.25rem)] leading-[1.08] font-extrabold tracking-[-0.03em] text-cn-on-ink">
            {pathway.name}
          </h1>

          {pathway.summary && (
            <p className="max-w-[52ch] text-cn-lg text-cn-on-ink-2">{pathway.summary}</p>
          )}

          <ul className="m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-3 p-0 text-cn-sm text-cn-on-ink-2">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon aria-hidden="true" className="h-4 w-4 flex-none" strokeWidth={1.9} />
                {label}
              </li>
            ))}
          </ul>

          {pathway.tiers?.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {pathway.tiers.map((item) => (
                <li
                  key={item.id}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-cn-xs font-semibold text-cn-on-ink"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
