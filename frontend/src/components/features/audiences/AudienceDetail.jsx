"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import useScrollReveal from "@/hooks/useScrollReveal";
import { ROUTES } from "@/constants/routes";
import { AUDIENCE_PROFILES, getAudienceProfile } from "@/data/audiences";
import { getPublicPathways, } from "@/services/pathwaysService";
import { getPublicCourses } from "@/services/coursesService";
import CobaltSectionHead from "@/components/features/home/CobaltSectionHead";
import CobaltPathwayCard from "@/components/features/pathways/CobaltPathwayCard";
import SignInToSelectModal from "@/components/features/pathways/SignInToSelectModal";
import AudienceClosingCta from "./AudienceClosingCta";

// One audience's page: who it is for, how much there is for them, and the
// pathways built for them. The chip row moves between audiences in place —
// the design has no audiences index, so this page is both the destination and
// the switcher.
//
// Both figures in the banner are counted server-side for this audience:
// pathways by their own audience link, courses by the published pathways that
// carry them. Only the counts are read from the course query — the catalog
// itself is the store's job.
const PATHWAY_PAGE_SIZE = 100;

function Stat({ label, value, isReady }) {
  return (
    <div className="rounded-cn border border-cn-rule bg-white px-6 py-4 shadow-cn-1">
      <dt className="text-cn-sm text-cn-muted">{label}</dt>
      <dd className="m-0 text-cn-3xl leading-[1.55] font-extrabold tracking-[-0.03em] tabular-nums text-cn-ink">
        {isReady ? value : "—"}
      </dd>
    </div>
  );
}

export default function AudienceDetail({ slug }) {
  const pageRef = useRef(null);
  const profile = getAudienceProfile(slug);
  const audienceSlug = profile?.slug;

  // The pathway whose withheld bundle price a guest tapped. Kept after the
  // modal closes so its name doesn't vanish mid fade-out.
  const [pricePrompt, setPricePrompt] = useState(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const pathwaysQuery = useQuery({
    queryKey: ["audience-pathways", audienceSlug],
    queryFn: async () => {
      const response = await getPublicPathways({
        pageSize: PATHWAY_PAGE_SIZE,
        audience: audienceSlug,
      });
      return response?.data || { results: [], count: 0 };
    },
    enabled: Boolean(audienceSlug),
  });

  // Asked for a single row: this is only here for the headline count, so it
  // never pulls a page of courses it would then throw away.
  const coursesQuery = useQuery({
    queryKey: ["audience-course-count", audienceSlug],
    queryFn: async () => {
      const response = await getPublicCourses({
        page: 1,
        pageSize: 1,
        audience: audienceSlug,
      });
      return response?.data?.count || 0;
    },
    enabled: Boolean(audienceSlug),
  });

  const pathways = pathwaysQuery.data?.results || [];
  const totalPathways = pathwaysQuery.data?.count || 0;
  const totalCourses = coursesQuery.data || 0;

  useScrollReveal(pageRef, [pathways.length]);

  // Defensive only — the route resolves the slug before rendering this.
  if (!profile) return null;

  return (
    <div
      id={`audience-page-${profile.slug}`}
      ref={pageRef}
      className="min-h-screen bg-cn-paper text-cn-ink"
    >
      <header className="cn-banner relative isolate overflow-hidden bg-cn-paper-2 py-24">
        <div className="cn-container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Link
              href={ROUTES.HOME}
              className="cn-enter mb-4 inline-flex text-cn-sm font-semibold text-cn-accent no-underline hover:underline"
            >
              Who it&apos;s for
            </Link>
            <h1 className="cn-enter max-w-[14ch] text-cn-display-s font-extrabold tracking-[-0.035em] text-cn-ink">
              {profile.title}
            </h1>
            <p
              className="cn-enter mt-6 max-w-[40ch] text-cn-lg leading-[1.5] text-cn-ink-2"
              style={{ "--cn-delay": "90ms" }}
            >
              {profile.description}
            </p>

            <dl
              className="cn-enter mt-6 grid grid-cols-2 gap-3"
              style={{ "--cn-delay": "180ms" }}
            >
              <Stat
                label={`Pathway${totalPathways === 1 ? "" : "s"}`}
                value={totalPathways}
                isReady={pathwaysQuery.isSuccess}
              />
              <Stat
                label={`Course${totalCourses === 1 ? "" : "s"}`}
                value={totalCourses}
                isReady={coursesQuery.isSuccess}
              />
            </dl>

            {/* The switcher. `aria-current` rather than `aria-pressed`: these
                are links to other pages, not toggles on this one. */}
            <nav
              aria-label="Audiences"
              className="cn-enter mt-6 flex flex-wrap gap-2"
              style={{ "--cn-delay": "270ms" }}
            >
              {AUDIENCE_PROFILES.map((item) => {
                const isCurrent = item.slug === profile.slug;
                return (
                  <Link
                    key={item.id}
                    href={`${ROUTES.AUDIENCES}/${item.slug}`}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`inline-grid h-10 place-items-center rounded-full border px-4 text-cn-sm no-underline transition-colors duration-150 ease-cn-out ${
                      isCurrent
                        ? "border-cn-ink bg-cn-ink font-medium text-cn-on-ink"
                        : "border-cn-rule-strong bg-white font-medium text-cn-ink-2 hover:border-cn-ink hover:text-cn-ink"
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>

          <figure
            className="cn-enter m-0 aspect-4/3 overflow-hidden rounded-cn-lg shadow-cn-3 max-lg:hidden"
            style={{ "--cn-delay": "180ms" }}
          >
            <img
              src={profile.image}
              alt={profile.title}
              width={1200}
              height={900}
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          </figure>
        </div>
      </header>

      <section id="audience-pathways-section" className="cn-section">
        <div className="cn-container">
          <CobaltSectionHead
            headingId="audience-pathways-heading"
            heading={`Pathways for ${profile.headingName}.`}
            lead="Bundled programs with a clear path from learning to putting it into practice."
          />

          {pathwaysQuery.isSuccess && pathways.length === 0 ? (
            <p className="rounded-cn-lg border border-cn-rule bg-white p-10 text-center text-cn-ink-2 shadow-cn-1">
              No pathways are published for this profile yet.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pathways.map((pathway, index) => (
                <CobaltPathwayCard
                  key={pathway.id}
                  pathway={pathway}
                  revealDelay={index % 3}
                  onRequestSignIn={(selected) => {
                    setPricePrompt(selected);
                    setIsSignInOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <AudienceClosingCta />

      {/* `next` is this audience page, so signing in from here lands the
          visitor back where they were. */}
      <SignInToSelectModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        pathwayName={pricePrompt?.name}
        nextPath={`${ROUTES.AUDIENCES}/${profile.slug}`}
        intent="price"
      />
    </div>
  );
}
