"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { AUDIENCE_PROFILES } from "@/data/audiences";
import SectionHeading from "@/components/ui/SectionHeading";
import AudienceCard from "./AudienceCard";

// The landing target for /audiences and the "All Audiences" link on each
// audience page. Same cards as the homepage, laid out as an even grid rather
// than the homepage's bento.
export default function AudiencesIndex() {
  return (
    <div id="audiences-index-container" className="min-h-screen cn-page-bg pb-24 text-ink">
      <div
        id="audiences-banner-layout"
        className="relative overflow-hidden border-b border-white/10 bg-pine px-6 py-16 text-paper"
      >
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-gold/12 blur-[130px]"
        ></div>

        <div className="relative z-10 mx-auto max-w-6xl space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 font-sans text-xs font-medium uppercase tracking-widest text-gold">
            <Compass className="h-3.5 w-3.5" />
            Who We Serve
          </span>
          <h1 className="font-serif text-4xl font-light leading-[0.92] tracking-tight text-paper md:text-5xl">
            Start With Your Profile
          </h1>
          <p className="max-w-2xl text-sm font-light leading-relaxed text-paper/75 md:text-base">
            Pick the profile that fits you and we&apos;ll show the pathways and
            individual courses built for it, rather than the whole catalogue at
            once.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 pt-14">
        <div id="audiences-index-grid" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCE_PROFILES.map((profile) => (
            // `featured` only shapes the homepage bento, so the index renders
            // every audience with the same compact card for an even grid.
            <AudienceCard key={profile.id} profile={{ ...profile, featured: false }} />
          ))}
        </div>

        <p className="mt-10 text-center text-xs font-light text-muted">
          Prefer to browse everything?{" "}
          <Link
            href={ROUTES.PATHWAYS}
            className="font-medium text-moss underline underline-offset-4 transition hover:text-pine"
          >
            See all pathways
          </Link>{" "}
          or{" "}
          <Link
            href={ROUTES.STORE}
            className="font-medium text-moss underline underline-offset-4 transition hover:text-pine"
          >
            browse the full course store
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
