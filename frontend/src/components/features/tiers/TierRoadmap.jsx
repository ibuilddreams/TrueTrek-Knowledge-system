"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertCircle, Layers3, LogIn, RefreshCw } from "lucide-react";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { getMyTierProgress, getPublicTiers } from "@/services/tiersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import useScrollReveal from "@/hooks/useScrollReveal";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import CobaltPageHeader from "@/components/ui/CobaltPageHeader";
import { CN_BTN_PRIMARY, CN_BTN_SECONDARY, CN_NOTICE } from "@/components/ui/cobaltStyles";
import TierRoadmapCard from "./TierRoadmapCard";

export default function TierRoadmap() {
  const pageRef = useRef(null);
  const router = useRouter();
  const { isAuthenticated, role, user } = useAuth();

  const {
    data: tiersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["public-tiers"],
    queryFn: async () => {
      const response = await getPublicTiers({ pageSize: 100 });
      return response?.data || { results: [], count: 0 };
    },
  });

  const { data: myProgress = [] } = useQuery({
    queryKey: ["my-tier-progress"],
    queryFn: async () => {
      const response = await getMyTierProgress();
      return response?.data || [];
    },
    enabled: isAuthenticated,
  });

  const tiers = tiersData?.results || [];
  const progressByTierId = new Map(myProgress.map((row) => [row.tier.id, row]));

  const onNavigateToPortal = () => router.push(getPortalRouteForRole(role));

  // The tier cards reveal a row at a time, re-swept when they arrive.
  useScrollReveal(pageRef, [isLoading, tiers.length]);

  return (
    <div
      id="tiers-roadmap-container"
      ref={pageRef}
      className="min-h-screen bg-cn-paper pb-24 text-cn-ink"
    >
      {/* The design has no tiers page — it shows the ladder as a section on
          the curriculum page — so this takes the inner-page header the design
          gives every other page, and its wording. */}
      <CobaltPageHeader
        as="h2"
        layout="split"
        title="The tiers, in order."
        lead="Progress through each tier by completing its pathways — every tier unlocks the next."
      />

      <div className="cn-container pt-12 md:pt-16">
        <div className={`${CN_NOTICE} mb-10 flex-col items-start justify-between gap-4 md:flex-row md:items-center`}>
          {isAuthenticated ? (
            <>
              <p className="leading-relaxed">
                <span className="mr-2 text-xs font-semibold tracking-widest text-cn-accent uppercase">
                  [SIGNED IN]
                </span>
                Signed in as {user?.name || user?.email}. Your progress is shown on each tier below.
              </p>
              <button
                type="button"
                onClick={onNavigateToPortal}
                className={`${CN_BTN_PRIMARY} h-11 shrink-0`}
              >
                Open My Portal →
              </button>
            </>
          ) : (
            <>
              <p className="leading-relaxed">
                <span className="mr-2 text-xs font-semibold tracking-widest text-cn-accent uppercase">
                  [BROWSING AS GUEST]
                </span>
                The tier roadmap is visible to everyone. Sign in to track your own progress.
              </p>
              <button
                type="button"
                onClick={() => router.push(ROUTES.LOGIN)}
                className={`${CN_BTN_PRIMARY} h-11 shrink-0`}
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            </>
          )}
        </div>

        {isLoading && (
          <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
            <Loader fullScreen={false} tone="cobalt" label="Loading tiers..." />
          </div>
        )}

        {isError && (
          <div className="mx-auto max-w-lg rounded-cn-lg border border-cn-rule bg-white p-10 text-center shadow-cn-1">
            <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-cn bg-cn-paper-3 text-cn-live">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="mb-2 text-cn-xl font-bold tracking-[-0.015em] text-cn-ink">Failed to Load Tiers</h2>
            <p className="mb-6 text-sm leading-relaxed text-cn-ink-2">
              {getApiErrorMessage(error, "Unable to load the tier roadmap right now.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className={CN_BTN_SECONDARY}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && tiers.length === 0 && (
          <div className="rounded-cn-lg border border-dashed border-cn-rule-strong bg-cn-paper-2">
            <EmptyState
              tone="cobalt"
              icon={Layers3}
              label="No tiers published yet"
              description="Check back soon — the tier roadmap is still being built out."
            />
          </div>
        )}

        {!isLoading && !isError && tiers.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tiers.map((tier, index) => (
              <TierRoadmapCard
                key={tier.id}
                tier={tier}
                revealDelay={index % 3}
                progress={progressByTierId.get(tier.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
