"use client";

import Link from "next/link";
import { ChevronRight, Infinity as InfinityIcon, Layers, Signal, Timer } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";
import PathwayCtaButton from "./PathwayCtaButton";

const DIFFICULTY_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const PILL =
  "rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest text-paper/85";

const PRIMARY_CTA =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 text-xs font-sans font-bold uppercase tracking-widest text-ink shadow-elevated transition hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed";

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-gold">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-paper">{value}</span>
        <span className="block text-[10px] font-sans uppercase tracking-widest text-paper/55">
          {label}
        </span>
      </span>
    </div>
  );
}

// The pathway's opening panel. Deliberately a self-contained rounded card
// floating on the page background, rather than the course page's edge-to-edge
// banner — the two public detail pages should not open the same way. Keeping
// it contained also means `overflow-hidden` can clip the decorative glow
// without fighting a full-bleed background.
export default function PathwayJourneyHero({ pathway, purchase, ctaRef }) {
  const difficulty = DIFFICULTY_LABELS[pathway.difficulty];
  const courseCount = pathway.course_count ?? pathway.courses?.length ?? 0;
  const tiers = pathway.tiers || [];

  return (
    <header className="relative isolate overflow-hidden rounded-panel bg-pine text-paper shadow-elevated">
      {/* Depth + warmth, all clipped to the panel. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-black/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-28 h-[26rem] w-[26rem] rounded-full bg-gold/15 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />

      <div className="relative p-8 md:p-12">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-sans text-gold"
        >
          <Link href={ROUTES.PATHWAYS} className="hover:underline">
            Pathways
          </Link>
          {tiers[0] && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-paper/40" aria-hidden="true" />
              <span className="text-paper/70">{tiers[0].name}</span>
            </>
          )}
        </nav>

        <div className="mt-7 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest text-gold">
                Guided Pathway
              </span>
              {tiers.map((tier) => (
                <span key={tier.id} className={PILL}>
                  Tier {tier.level}
                </span>
              ))}
              {difficulty && <span className={PILL}>{difficulty}</span>}
            </div>

            <h1 className="mt-6 max-w-2xl font-serif text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">
              {pathway.name}
            </h1>

            {pathway.summary && (
              <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-paper/70">
                {pathway.summary}
              </p>
            )}
          </div>

          {/* Price + action, inline rather than in a floating right rail. */}
          <div
            ref={ctaRef}
            className="w-full rounded-card border border-white/15 bg-white/[0.07] p-6 shadow-soft backdrop-blur-sm"
          >
            <p className="text-[10px] font-sans font-medium uppercase tracking-widest text-paper/55">
              Bundle price
            </p>
            <p className="mt-1.5 font-sans text-4xl font-semibold leading-none text-paper">
              {formatCoursePrice(pathway.base_price)}
            </p>
            <p className="mt-2 text-[11px] text-paper/50">
              {courseCount} course{courseCount === 1 ? "" : "s"}, billed once
            </p>

            <PathwayCtaButton
              id="pathway-hero-cta"
              purchase={purchase}
              className={`${PRIMARY_CTA} mt-5 w-full`}
            />
            {purchase.note && (
              <p className="mt-3 text-center text-[11px] leading-relaxed text-paper/55">
                {purchase.note}
              </p>
            )}
          </div>
        </div>
      </div>

      <dl className="relative grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/10 bg-black/15 px-8 py-7 md:px-12 lg:grid-cols-4">
        <Stat
          icon={Layers}
          value={`${courseCount} course${courseCount === 1 ? "" : "s"}`}
          label="In this pathway"
        />
        <Stat
          icon={Timer}
          value={pathway.duration_weeks > 0 ? `${pathway.duration_weeks} weeks` : "Self-paced"}
          label="Typical pace"
        />
        <Stat icon={Signal} value={difficulty || "All levels"} label="Starting level" />
        <Stat icon={InfinityIcon} value="Lifetime" label="Access to every course" />
      </dl>
    </header>
  );
}
