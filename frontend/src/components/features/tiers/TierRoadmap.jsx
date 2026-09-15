"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertCircle, Layers3, LogIn, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { getMyTierProgress, getPublicTiers } from "@/services/tiersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import TierRoadmapCard from "./TierRoadmapCard";

export default function TierRoadmap() {
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

  return (
    <div id="tiers-roadmap-container" className="min-h-screen cn-page-bg text-ink pb-32">
      <div className="bg-pine text-paper py-16 px-6 border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-gold/12 blur-[130px] -translate-y-1/2" />
        <div className="max-w-6xl mx-auto relative z-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full text-gold font-sans text-xs uppercase tracking-widest font-medium">
              <Layers3 className="w-3.5 h-3.5" />
              The Life Education Journey
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-light leading-[0.92] tracking-tight text-paper">
              Tier Roadmap
            </h2>
            <p className="text-paper/70 text-xs md:text-sm font-light max-w-xl leading-relaxed">
              Progress through each tier by completing its pathways — every tier unlocks the next.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        <div className="bg-porcelain border border-line rounded-2xl p-4 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          {isAuthenticated ? (
            <>
              <p className="text-xs text-ink font-sans leading-relaxed">
                <span className="font-sans font-medium text-moss uppercase tracking-widest mr-2">
                  [SIGNED IN]
                </span>
                Signed in as {user?.name || user?.email}. Your progress is shown on each tier below.
              </p>
              <button
                type="button"
                onClick={onNavigateToPortal}
                className="text-xs font-sans font-medium uppercase tracking-widest bg-pine hover:bg-moss text-paper px-4 py-2 rounded-full transition duration-200 shadow-sm shrink-0"
              >
                Open My Portal →
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-ink font-sans leading-relaxed">
                <span className="font-sans font-medium text-gold uppercase tracking-widest mr-2">
                  [BROWSING AS GUEST]
                </span>
                The tier roadmap is visible to everyone. Sign in to track your own progress.
              </p>
              <button
                type="button"
                onClick={() => router.push(ROUTES.LOGIN)}
                className="text-xs font-sans font-medium uppercase tracking-widest bg-pine hover:bg-moss text-paper px-4 py-2 rounded-full transition duration-200 shadow-sm shrink-0 flex items-center gap-1.5"
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            </>
          )}
        </div>

        {isLoading && (
          <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
            <Loader fullScreen={false} label="Loading tiers..." />
          </div>
        )}

        {isError && (
          <div className="border border-line bg-paper rounded-2xl p-8 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif font-light mb-2 text-ink">Failed to Load Tiers</h2>
            <p className="text-xs font-light mb-6 text-muted">
              {getApiErrorMessage(error, "Unable to load the tier roadmap right now.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-3 font-sans font-medium text-xs uppercase tracking-widest rounded-full transition border border-line text-ink hover:bg-porcelain"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && tiers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-paper/70">
            <EmptyState
              icon={Layers3}
              label="No tiers published yet"
              description="Check back soon — the tier roadmap is still being built out."
            />
          </div>
        )}

        {!isLoading && !isError && tiers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {tiers.map((tier) => (
              <TierRoadmapCard
                key={tier.id}
                tier={tier}
                progress={progressByTierId.get(tier.id)}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
