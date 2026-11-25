"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { getPublicPathwayBySlug } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toPathwayParagraphs } from "@/lib/pathwayDescription";
import Loader from "@/components/ui/Loader";
import PathwayCheckoutModal from "../PathwayCheckoutModal";
import SignInToSelectModal from "../SignInToSelectModal";
import PathwayBuyCard from "./PathwayBuyCard";
import PathwayCourseList from "./PathwayCourseList";
import PathwayDetailHeader from "./PathwayDetailHeader";
import PathwayRelatedCourses from "./PathwayRelatedCourses";
import { usePathwayPurchase } from "./usePathwayPurchase";

// The public pathway page (/pathways/<slug>), built in the design's own
// detail-page language — the ink header band, an 8/4 body, and a sticky buy
// card pulled up into the band. The design file has no pathway page of its
// own; its one detail page is a course, and this is that layout carrying a
// bundle instead.
const H2 = "text-cn-2xl font-extrabold tracking-[-0.02em] text-cn-ink";

/** The design's `.cdlearn`: a bordered panel holding a two-column checklist. */
function ChecklistPanel({ id, title, items }) {
  if (!items?.length) return null;
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <h2 id={id} className={H2}>
        {title}
      </h2>
      <div className="rounded-cn-lg border border-cn-rule p-10 max-[40rem]:p-6">
        <ul className="m-0 grid list-none gap-x-6 gap-y-3 p-0 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-cn-ink-2">
              <Check
                aria-hidden="true"
                className="mt-[3px] h-[18px] w-[18px] flex-none text-cn-accent"
                strokeWidth={2.4}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PathwayDetailBody({ pathway }) {
  const purchase = usePathwayPurchase(pathway);
  const paragraphs = toPathwayParagraphs(pathway.description || pathway.summary);
  // The audiences this bundle is reachable through are real catalog data;
  // `who_is_for` is the admin's own prose, shown when they have written it.
  const audienceItems = [
    ...(pathway.who_is_for || []),
    ...(pathway.audiences || []).map((audience) => audience.name),
  ];

  return (
    <>
      <PathwayDetailHeader pathway={pathway} />

      <section className="pb-24">
        <div className="cn-container grid items-start gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
          <div className="grid gap-16 pt-16">
            <ChecklistPanel
              id="pathway-outcomes-heading"
              title="What you'll learn"
              items={pathway.learning_outcomes}
            />

            {(paragraphs.length > 0 || pathway.purpose) && (
              <section aria-labelledby="pathway-purpose-heading" className="grid gap-4">
                <h2 id="pathway-purpose-heading" className={H2}>
                  Why this pathway exists
                </h2>
                <div className="grid gap-3">
                  {pathway.purpose && (
                    <p className="text-cn-lg text-cn-ink-2">{pathway.purpose}</p>
                  )}
                  {paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-cn-ink-2">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            )}

            <PathwayCourseList courses={pathway.courses} />

            <ChecklistPanel
              id="pathway-audience-heading"
              title="Who it's for"
              items={audienceItems}
            />

            <ChecklistPanel
              id="pathway-prerequisites-heading"
              title="Before you start"
              items={pathway.prerequisites}
            />
          </div>

          {/* The design pulls this card up into the ink band above it, which
              is why the header's own right-hand column is left empty. In one
              column there is no band to sit in and no rail to stick to, so it
              comes first instead — a price and an enrol button belong above
              fifty-five courses, not under them. */}
          <aside className="max-lg:order-first max-lg:pt-10 lg:sticky lg:top-[100px] lg:-mt-[250px]">
            <PathwayBuyCard pathway={pathway} purchase={purchase} />
          </aside>
        </div>
      </section>

      <div className="cn-container pb-24">
        <PathwayRelatedCourses pathway={pathway} />
      </div>

      <SignInToSelectModal
        isOpen={purchase.isSignInOpen}
        pathwayName={pathway.name}
        intent={purchase.signInIntent}
        nextPath={`${ROUTES.PATHWAYS}/${pathway.slug}`}
        onClose={purchase.closeSignIn}
      />

      <PathwayCheckoutModal
        tone="cobalt"
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

  if (query.isLoading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        aria-busy="true"
      >
        <Loader fullScreen={false} tone="cobalt" label="Loading pathway..." />
      </div>
    );
  }

  if (query.isError) {
    const isNotFound = query.error?.status === 404;
    return (
      <div className="cn-container py-24">
        <div
          role="alert"
          className="mx-auto max-w-xl rounded-cn-lg border border-cn-rule bg-white p-10 text-center shadow-cn-1"
        >
          <h1 className="text-cn-2xl font-extrabold tracking-[-0.03em] text-cn-ink">
            {isNotFound ? "Pathway not found" : "Unable to load this pathway"}
          </h1>
          <p className="mt-3 text-cn-ink-2">
            {isNotFound
              ? "This pathway may no longer be available. Head back to browse the others."
              : getApiErrorMessage(query.error, "Please try again.")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!isNotFound && (
              <button
                type="button"
                onClick={() => query.refetch()}
                className="inline-flex h-[50px] items-center justify-center rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
              >
                Retry
              </button>
            )}
            <Link
              href={ROUTES.PATHWAYS}
              className="inline-flex h-[50px] items-center justify-center rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-cn-base font-semibold text-cn-ink transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-ink"
            >
              Browse pathways
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="pathway-detail" className="overflow-x-clip">
      {query.data && <PathwayDetailBody pathway={query.data} />}
    </div>
  );
}
