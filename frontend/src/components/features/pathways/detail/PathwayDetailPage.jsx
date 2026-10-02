"use client";

import { useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { getPublicPathwayBySlug } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import Loader from "@/components/ui/Loader";
import PathwayCheckoutModal from "../PathwayCheckoutModal";
import SignInToSelectModal from "../SignInToSelectModal";
import PathwayAudiencePanel from "./PathwayAudiencePanel";
import PathwayJourneyHero from "./PathwayJourneyHero";
import PathwayOutcomesPanel from "./PathwayOutcomesPanel";
import PathwayPurposeSection from "./PathwayPurposeSection";
import PathwayRelatedCourses from "./PathwayRelatedCourses";
import PathwayRoadmap from "./PathwayRoadmap";
import PathwayStickyBuyBar from "./PathwayStickyBuyBar";
import { usePathwayPurchase } from "./usePathwayPurchase";

const BACK_LINK =
  "inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-widest text-muted hover:text-ink transition-colors";

// Public pathway page (/pathways/<slug>). Structured as a route the reader
// travels — hero, outcomes, brief, then the course-by-course roadmap — rather
// than the course page's hero + sticky-rail + stacked-sections layout.
function PathwayDetailBody({ pathway }) {
  const heroCtaRef = useRef(null);
  const purchase = usePathwayPurchase(pathway);

  return (
    <>
      <PathwayJourneyHero pathway={pathway} purchase={purchase} ctaRef={heroCtaRef} />

      <div className="mt-14 space-y-14 pb-10">
        <PathwayOutcomesPanel outcomes={pathway.learning_outcomes} />
        <PathwayPurposeSection purpose={pathway.purpose} description={pathway.description} />
        <PathwayRoadmap courses={pathway.courses} />
        <PathwayAudiencePanel
          whoIsFor={pathway.who_is_for}
          prerequisites={pathway.prerequisites}
        />
        <PathwayRelatedCourses pathway={pathway} />
      </div>

      <PathwayStickyBuyBar pathway={pathway} purchase={purchase} watchRef={heroCtaRef} />

      <SignInToSelectModal
        isOpen={purchase.isSignInOpen}
        pathwayName={pathway.name}
        nextPath={`${ROUTES.PATHWAYS}/${pathway.slug}`}
        onClose={purchase.closeSignIn}
      />

      <PathwayCheckoutModal
        isOpen={purchase.isCheckoutOpen}
        pathways={[pathway]}
        isSubmitting={purchase.isSubmitting}
        onClose={purchase.closeCheckout}
        onConfirm={purchase.confirmCheckout}
      />
    </>
  );
}

export default function PathwayDetailPage({ slug }) {
  const query = useQuery({
    queryKey: ["public-pathway-detail", slug],
    queryFn: async () => (await getPublicPathwayBySlug(slug)).data,
    retry: (count, error) => error?.status !== 404 && count < 2,
  });

  let body;

  if (query.isLoading) {
    body = (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading pathway..." />
      </div>
    );
  } else if (query.isError) {
    const isNotFound = query.error?.status === 404;
    body = (
      <div role="alert" className="rounded-card border border-line bg-paper p-8 shadow-soft">
        <h1 className="font-serif text-2xl">
          {isNotFound ? "Pathway not found" : "Unable to load this pathway"}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {isNotFound
            ? "This pathway may no longer be available. Head back to browse the other pathways."
            : getApiErrorMessage(query.error, "Please try again.")}
        </p>
        <div className="mt-5 flex items-center gap-4">
          {!isNotFound && (
            <button
              type="button"
              onClick={() => query.refetch()}
              className="text-sm font-semibold text-pine underline"
            >
              Retry
            </button>
          )}
          <Link href={ROUTES.PATHWAYS} className={BACK_LINK}>
            Browse pathways
          </Link>
        </div>
      </div>
    );
  } else if (query.data) {
    body = <PathwayDetailBody pathway={query.data} />;
  }

  return (
    <div id="pathway-detail" className="min-h-screen cn-page-bg pb-28 text-ink overflow-x-clip">
      <div className="mx-auto max-w-6xl px-6">
        <div className="pb-5 pt-8">
          <Link href={ROUTES.PATHWAYS} className={BACK_LINK}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to pathways
          </Link>
        </div>
        {body}
      </div>
    </div>
  );
}
