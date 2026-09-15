"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  GraduationCap,
  Layers3,
  Lock,
  LogIn,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { getMyTierProgress, getPublicTierById, getPublicTiers } from "@/services/tiersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import SectionHeading from "@/components/ui/SectionHeading";
import CloseButton from "@/components/ui/CloseButton";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import TierPathwayAccordion from "./TierPathwayAccordion";

const STATUS_META = {
  LOCKED: { label: "LOCKED", icon: Lock, pulse: false },
  UNLOCKED: { label: "UNLOCKED", icon: Sparkles, pulse: false },
  IN_PROGRESS: { label: "IN PROGRESS", icon: Sparkles, pulse: true },
  COMPLETED: { label: "COMPLETED", icon: CheckCircle2, pulse: false },
};

const CATEGORY_COLORS = {
  Athletic: "bg-sky text-blue border-blue/15",
  Academic: "bg-sage text-moss border-moss/15",
  Professional: "bg-mint text-moss border-moss/15",
  Vocational: "bg-rose text-clay border-clay/15",
  Legacy: "bg-gold/25 text-[#8a6f2e] border-[#8a6f2e]/15",
  Foundation: "bg-lavender text-[#6b5a8a] border-[#6b5a8a]/15",
};

// Categories are real Category rows shared with courses (not a fixed enum), so any
// category name not in CATEGORY_COLORS above (a newly added admin category) still
// renders with a sensible neutral badge instead of breaking.
function getCategoryColor(categoryName) {
  const palette = CATEGORY_COLORS[categoryName];
  if (palette) return palette;
  return "bg-porcelain text-muted border-line";
}

function getStatusColor(status) {
  switch (status) {
    case "COMPLETED":
      return "bg-sage text-moss border-moss/20";
    case "IN_PROGRESS":
    case "UNLOCKED":
      return "bg-pine/8 text-pine border-pine/20";
    default:
      return "bg-porcelain text-muted border-line";
  }
}

function StatusPill({ status }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className={`flex items-center gap-1 text-[11px] font-sans uppercase tracking-widest font-medium border px-2.5 py-1 rounded-full shrink-0 ${
        meta.pulse ? "animate-pulse" : ""
      } ${getStatusColor(status)}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {meta.label}
    </span>
  );
}

export default function Curriculum() {
  const router = useRouter();
  const { isAuthenticated, role, user } = useAuth();

  const [selectedFilter, setSelectedFilter] = useState("All");
  const [activeTierId, setActiveTierId] = useState(null);

  const onNavigateToPortal = () => router.push(getPortalRouteForRole(role));

  const {
    data: tiers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["curriculum-tiers"],
    queryFn: async () => {
      const response = await getPublicTiers({ pageSize: 100 });
      return response?.data?.results || [];
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
  const progressByTierId = useMemo(
    () => new Map(myProgress.map((row) => [row.tier.id, row])),
    [myProgress]
  );

  const activeTierQuery = useQuery({
    queryKey: ["curriculum-tier-detail", activeTierId],
    queryFn: async () => {
      const response = await getPublicTierById(activeTierId);
      return response?.data || null;
    },
    enabled: Boolean(activeTierId),
  });
  const activeTier = activeTierQuery.data;
  const activeTierProgress = activeTierId ? progressByTierId.get(activeTierId) : null;

  const categoryFilters = useMemo(() => {
    const seen = new Map();
    tiers.forEach((tier) => {
      if (tier.category?.name && !seen.has(tier.category.name)) {
        seen.set(tier.category.name, tier.category.id);
      }
    });
    return ["All", ...seen.keys()];
  }, [tiers]);

  const filteredTiers = useMemo(() => {
    if (selectedFilter === "All") return tiers;
    return tiers.filter((tier) => tier.category?.name === selectedFilter);
  }, [tiers, selectedFilter]);

  function handleSelectPathway() {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }
    router.push(ROUTES.PATHWAYS);
  }

  return (
    <div
      id="curriculum-container"
      className="py-16 px-6 min-h-screen transition-colors duration-300 cn-page-bg"
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          className="mb-12"
          eyebrow="The Life Education Journey"
          eyebrowClassName="text-pine"
          heading="Tier Curriculum"
          headingClassName="text-4xl md:text-5xl font-serif font-light leading-[0.92] tracking-tight text-ink"
          subtitle="Nine tiers, each built around a stage of the journey — from foundational readiness through elite and executive mastery. Explore what's inside before you commit to a pathway."
          subtitleClassName="text-base max-w-2xl mx-auto font-light leading-relaxed mb-4 text-muted"
          size="lg"
        />

        {isAuthenticated ? (
          <div
            id="curriculum-session-banner"
            className="border rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-sage/70 border-sage"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-sage text-moss">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-sans uppercase tracking-widest font-medium text-moss">
                  Signed In
                </p>
                <p className="text-xs font-light mt-0.5 text-moss">
                  Signed in as {user?.name || user?.email}. Your real progress is shown on each tier below.
                </p>
              </div>
            </div>
            <button
              id="goto-portal-btn"
              onClick={onNavigateToPortal}
              className="text-[11px] font-sans uppercase tracking-widest font-semibold bg-pine hover:bg-moss text-paper px-4 py-2 rounded-lg transition duration-200 shadow-sm self-start sm:self-auto shrink-0"
            >
              Open My Portal →
            </button>
          </div>
        ) : (
          <div
            id="curriculum-session-banner"
            className="border rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-paper border-line"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-pine/8 text-pine">
                <Layers3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-sans uppercase tracking-widest font-medium text-pine">
                  Browsing as Guest
                </p>
                <p className="text-xs font-light mt-0.5 text-muted">
                  Every tier is visible to everyone. Sign in to track your own progress through them.
                </p>
              </div>
            </div>
            <button
              id="goto-login-btn"
              onClick={() => router.push(ROUTES.LOGIN)}
              className="text-[11px] font-sans uppercase tracking-widest font-semibold px-4 py-2 rounded-lg transition duration-200 shadow-sm self-start sm:self-auto shrink-0 bg-pine hover:bg-moss text-paper"
            >
              Sign In
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 border-b pb-6 border-line">
          <span className="mr-2 font-sans uppercase tracking-widest text-xs font-medium flex items-center gap-1 text-muted">
            <Filter className="w-3.5 h-3.5" /> Filter Category:
          </span>
          {categoryFilters.map((filter) => (
            <button
              id={`filter-tag-${filter.replace(/\s+/g, "-").toLowerCase()}`}
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-sans uppercase tracking-widest transition duration-300 border ${
                selectedFilter === filter
                  ? "bg-pine text-paper border-pine font-semibold"
                  : "bg-paper hover:bg-porcelain text-muted border-line shadow-xs"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
            <Loader fullScreen={false} label="Loading curriculum..." />
          </div>
        )}

        {isError && (
          <div className="border rounded-2xl p-8 text-center max-w-lg mx-auto border-line bg-paper">
            <div className="w-12 h-12 border rounded-2xl flex items-center justify-center mx-auto mb-4 bg-rose-50 border-rose-100 text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif font-light mb-2 text-ink">
              Failed to Load Curriculum
            </h2>
            <p className="text-sm font-light mb-6 text-muted">
              {getApiErrorMessage(error, "Unable to load the curriculum right now.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-3 font-semibold font-sans text-sm uppercase tracking-widest rounded-xl transition bg-pine hover:bg-moss text-paper"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredTiers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line bg-paper/70">
            <EmptyState
              icon={Layers3}
              label="No tiers in this category yet"
              description="Try a different filter, or check back soon."
              size="lg"
            />
          </div>
        )}

        {!isLoading && !isError && filteredTiers.length > 0 && (
          <motion.div
            id="tiers-cards-grid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTiers.map((tier) => {
              const progress = progressByTierId.get(tier.id);
              return (
                <div
                  id={`tier-card-${tier.id}`}
                  key={tier.id}
                  onClick={() => setActiveTierId(tier.id)}
                  className="border rounded-panel p-6 shadow-soft hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group bg-paper border-line"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b pb-3 mb-4 border-line">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-sans uppercase tracking-widest text-xs font-medium px-2.5 py-1 rounded-md shrink-0 text-pine bg-pine/8">
                          Tier {tier.level}
                        </span>
                        <span
                          className={`text-[11px] uppercase font-sans tracking-widest font-medium px-2 py-0.5 rounded-full border truncate ${getCategoryColor(
                            tier.category?.name
                          )}`}
                        >
                          {tier.category?.name || "Uncategorized"}
                        </span>
                      </div>
                      {isAuthenticated && progress && <StatusPill status={progress.status} />}
                    </div>

                    <h3 className="text-lg font-serif font-light tracking-tight mb-2 transition-colors duration-250 text-ink group-hover:text-pine">
                      {tier.name}
                    </h3>
                    {tier.audience && (
                      <p className="text-sm font-sans text-muted mb-3 tracking-tight">
                        Focus: {tier.audience}
                      </p>
                    )}
                    <p className="text-xs font-sans uppercase tracking-widest font-medium text-muted mb-3">
                      {tier.pathway_count} pathway{tier.pathway_count === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <span className="text-muted text-xs font-sans">
                      {tier.estimated_duration || "Self-paced"}
                    </span>
                    <span className="text-sm font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all text-pine">
                      Analyze Tier Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        <AnimatePresence>
          {activeTierId && (
            <>
              <div
                id="drawer-backdrop"
                onClick={() => setActiveTierId(null)}
                className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 transition-opacity"
              />

              <motion.div
                id="drawer-surface"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-lg rounded-l-panel shadow-elevated z-50 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-paper"
              >
                {activeTierQuery.isLoading || !activeTier ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader fullScreen={false} label="Loading tier..." />
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between border-b pb-4 mb-6 border-line">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-sans uppercase tracking-widest text-xs font-medium px-3 py-1.5 rounded-lg border text-pine bg-pine/8 border-pine/20">
                            Tier {activeTier.level}
                          </span>
                          <span
                            className={`text-sm uppercase font-sans tracking-widest font-medium px-3 py-1 rounded-full border ${getCategoryColor(
                              activeTier.category?.name
                            )}`}
                          >
                            {activeTier.category?.name || "Uncategorized"}
                          </span>
                          {isAuthenticated && activeTierProgress && (
                            <StatusPill status={activeTierProgress.status} />
                          )}
                        </div>
                        <CloseButton onClick={() => setActiveTierId(null)} title="Close details drawer" />
                      </div>

                      <h3 className="text-2xl md:text-3xl font-serif font-light leading-[0.92] tracking-tight mb-1 text-ink">
                        {activeTier.name}
                      </h3>
                      {activeTier.audience && (
                        <p className="font-sans text-sm tracking-widest uppercase mb-4 text-muted">
                          {activeTier.audience}
                        </p>
                      )}

                      {activeTier.audience && (
                        <div className="border p-4 rounded-xl mb-6 bg-porcelain border-line">
                          <p className="text-muted text-[11px] font-sans uppercase tracking-widest font-medium mb-1">
                            AUDIENCE SCOPE
                          </p>
                          <p className="text-sm font-medium text-ink">
                            {activeTier.audience}
                          </p>
                        </div>
                      )}

                      <p className="text-sm leading-relaxed mb-8 font-light text-muted">
                        {activeTier.focus_description || "No description has been added for this tier yet."}
                      </p>

                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Compass className="w-4 h-4 text-pine" />
                          <h4 className="text-sm font-sans uppercase tracking-widest font-medium text-ink">
                            CURRICULUM FOCUS PATHWAYS
                          </h4>
                        </div>
                        {activeTier.pathways?.length ? (
                          <TierPathwayAccordion pathways={activeTier.pathways} />
                        ) : (
                          <p className="text-sm font-light text-muted">
                            Pathways for this tier are being finalized.
                          </p>
                        )}
                      </div>

                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className="w-4 h-4 text-pine" />
                          <h4 className="text-sm font-sans uppercase tracking-widest font-medium text-ink">
                            WHAT YOU'LL LEARN
                          </h4>
                        </div>
                        {activeTier.pathways?.length ? (
                          <ul className="space-y-2">
                            {activeTier.pathways.map((tierPathway) => (
                              <li
                                key={tierPathway.id}
                                className="flex items-start gap-2.5 text-sm leading-relaxed text-muted"
                              >
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-pine" />
                                <span>
                                  Complete <strong>{tierPathway.pathway.name}</strong> —{" "}
                                  {tierPathway.pathway.course_count} course
                                  {tierPathway.pathway.course_count === 1 ? "" : "s"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm font-light text-muted">
                            Outcomes will appear once pathways are attached to this tier.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t flex items-center justify-between -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 border-line bg-porcelain">
                      <div className="flex items-center gap-2 font-sans text-sm text-muted">
                        <Clock className="w-4 h-4 text-pine" />
                        <span>
                          ESTIMATED DURATION:{" "}
                          <strong className="text-ink">
                            {activeTier.estimated_duration || "Self-paced"}
                          </strong>
                        </span>
                      </div>
                      <button
                        id="drawer-select-pathway-btn"
                        onClick={handleSelectPathway}
                        className="font-semibold text-sm px-5 py-2.5 rounded-lg tracking-wide transition flex items-center gap-1.5 bg-pine hover:bg-moss text-paper"
                      >
                        {!isAuthenticated && <LogIn className="w-3.5 h-3.5" />}
                        Select Pathway
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
