"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";

// One audience card. Shared by the homepage "Who We Serve" grid and the
// /audiences index so the two never drift apart. Every card is a link into
// that audience's page — audience cards are the primary navigation entry
// point into the curriculum, not decoration.
//
// `featured` cards are the full-bleed photographic bookends of the homepage
// bento grid: the image fills the card and the copy sits bottom-anchored on
// top of it, so the tall `lg:row-span-2` column never opens a dead gap.
export default function AudienceCard({ profile, className = "" }) {
  const Icon = profile.icon;
  const href = `${ROUTES.AUDIENCES}/${profile.slug}`;
  const focusClass =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-4";

  if (profile.featured) {
    return (
      <Link
        key={profile.id}
        id={`audience-card-${profile.id}`}
        href={href}
        aria-label={`Explore pathways for ${profile.title}`}
        className={`${focusClass} group relative isolate flex min-h-[360px] flex-col overflow-hidden rounded-panel border border-line shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-elevated ${className}`}
      >
        <img
          src={profile.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/75 to-ink/20"
        ></div>

        <span className="absolute top-5 right-5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-widest text-paper backdrop-blur-md">
          {profile.tag}
        </span>

        <div className="mt-auto p-6 lg:p-7">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/12 text-paper backdrop-blur-md">
            <Icon className="h-5 w-5" />
          </span>
          <h4 className="mb-3 font-serif text-2xl font-light leading-[1.05] tracking-tight text-paper lg:text-3xl">
            {profile.title}
          </h4>
          <p className="text-sm leading-relaxed text-paper/75">{profile.description}</p>

          {profile.chips && (
            <div className="mt-6 flex flex-wrap gap-2">
              {profile.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-sans font-semibold uppercase tracking-widest text-paper/90 backdrop-blur-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          <span
            aria-hidden="true"
            className="mt-6 flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-widest text-gold transition-all group-hover:gap-2.5"
          >
            Explore Pathways
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      key={profile.id}
      id={`audience-card-${profile.id}`}
      href={href}
      aria-label={`Explore pathways for ${profile.title}`}
      className={`${focusClass} group relative flex flex-col overflow-hidden rounded-card border border-line bg-paper shadow-soft transition duration-500 hover:-translate-y-1 hover:border-pine/25 hover:shadow-elevated ${className}`}
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={profile.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent"
        ></div>
        <span className="absolute top-3.5 right-3.5 rounded-full border border-line bg-paper/95 px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-widest text-pine">
          {profile.tag}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${profile.iconClassName}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
          <h4 className="font-serif text-lg font-light leading-[1.1] tracking-tight text-ink">
            {profile.title}
          </h4>
        </div>
        <p className="text-xs leading-relaxed text-muted">{profile.description}</p>

        <span
          aria-hidden="true"
          className="mt-4 flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-widest text-moss transition-all group-hover:gap-2.5"
        >
          Explore Pathways
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
