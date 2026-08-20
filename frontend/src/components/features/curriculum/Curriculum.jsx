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
import { useTheme } from "@/hooks/useTheme";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { getMyTierProgress, getPublicTierById, getPublicTiers } from "@/services/tiersService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import SectionHeading from "@/components/ui/SectionHeading";
import CloseButton from "@/components/ui/CloseButton";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

const STATUS_META = {
  LOCKED: { label: "LOCKED", icon: Lock, pulse: false },
  UNLOCKED: { label: "UNLOCKED", icon: Sparkles, pulse: false },
  IN_PROGRESS: { label: "IN PROGRESS", icon: Sparkles, pulse: true },
  COMPLETED: { label: "COMPLETED", icon: CheckCircle2, pulse: false },
};

const CATEGORY_COLORS = {
  Athletic: {
    vault: "bg-orange-950/40 text-orange-300 border-orange-800/50",
    light: "bg-orange-50 text-orange-700 border-orange-200/50",
  },
  Academic: {
    vault: "bg-blue-950/40 text-blue-300 border-blue-800/50",
    light: "bg-blue-50 text-blue-700 border-blue-200/50",
  },
  Professional: {
    vault: "bg-emerald-950/40 text-emerald-300 border-emerald-800/50",
    light: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  },
  Vocational: {
    vault: "bg-rose-950/40 text-rose-300 border-rose-800/50",
    light: "bg-rose-50 text-rose-700 border-rose-200/50",
  },
  Legacy: {
    vault: "bg-amber-950/40 text-amber-300 border-amber-800/50",
    light: "bg-amber-50 text-amber-700 border-amber-200/50",
  },
  Foundation: {
    vault: "bg-purple-950/40 text-purple-300 border-purple-800/50",
    light: "bg-purple-50 text-purple-700 border-purple-200/50",
  },
};

// Categories are real Category rows shared with courses (not a fixed enum), so any
// category name not in CATEGORY_COLORS above (a newly added admin category) still
// renders with a sensible neutral badge instead of breaking.
function getCategoryColor(categoryName, vault) {
  const palette = CATEGORY_COLORS[categoryName];
  if (palette) return vault ? palette.vault : palette.light;
  return vault ? "bg-stone-900 text-stone-300 border-stone-700" : "bg-stone-50 text-stone-700 border-stone-200";
}

function getStatusColor(status, vault) {
  switch (status) {
    case "COMPLETED":
      return vault
        ? "bg-emerald-900/30 text-emerald-300 border-emerald-700/40"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "IN_PROGRESS":
    case "UNLOCKED":
      return vault
        ? "bg-amber-900/30 text-amber-300 border-amber-700/40"
        : "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return vault
        ? "bg-stone-800/60 text-stone-500 border-stone-700/50"
        : "bg-stone-100 text-stone-400 border-stone-200/60";
  }
}

function StatusPill({ status, vault }) {
  const meta = STATUS_META[status];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className={`flex items-center gap-1 text-[10px] font-mono font-bold border px-2.5 py-1 rounded-full shrink-0 ${
        meta.pulse ? "animate-pulse" : ""
      } ${getStatusColor(status, vault)}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {meta.label}
    </span>
  );
}

export default function Curriculum() {
  const router = useRouter();
  const { isVault } = useTheme();
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
      className={`py-16 px-6 min-h-screen transition-colors duration-300 ${
        isVault ? "bg-[#0c0b0a]" : "bg-[#faf9f6]"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          className="mb-12"
          eyebrow="The Life Education Journey"
          eyebrowClassName={isVault ? "text-amber-500" : "text-amber-700"}
          heading="Tier Curriculum"
          headingClassName={`text-4xl md:text-5xl font-serif font-semibold tracking-tight ${
            isVault ? "text-stone-100" : "text-stone-900"
          }`}
          subtitle="Nine tiers, each built around a stage of the journey — from foundational readiness through elite and executive mastery. Explore what's inside before you commit to a pathway."
          subtitleClassName={`text-sm max-w-2xl mx-auto font-light leading-relaxed mb-4 ${
            isVault ? "text-stone-400" : "text-stone-600"
          }`}
        />

        {isAuthenticated ? (
          <div
            id="curriculum-session-banner"
            className={`border rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isVault ? "bg-emerald-900/20 border-emerald-800/40" : "bg-emerald-50/70 border-emerald-200/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isVault ? "bg-emerald-600/15 text-emerald-400" : "bg-emerald-600/10 text-emerald-700"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p
                  className={`text-xs font-mono font-bold uppercase tracking-wide ${
                    isVault ? "text-emerald-300" : "text-emerald-800"
                  }`}
                >
                  Signed In
                </p>
                <p
                  className={`text-[11px] font-light mt-0.5 ${
                    isVault ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  Signed in as {user?.name || user?.email}. Your real progress is shown on each tier below.
                </p>
              </div>
            </div>
            <button
              id="goto-portal-btn"
              onClick={onNavigateToPortal}
              className="text-[10px] font-mono font-semibold uppercase bg-emerald-700 hover:bg-emerald-850 text-white px-4 py-2 rounded-lg transition duration-200 shadow-sm self-start sm:self-auto shrink-0"
            >
              Open My Portal →
            </button>
          </div>
        ) : (
          <div
            id="curriculum-session-banner"
            className={`border rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isVault ? "bg-stone-900/40 border-stone-800" : "bg-stone-50 border-stone-200/80"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isVault ? "bg-amber-600/15 text-amber-500" : "bg-amber-600/10 text-amber-750"
                }`}
              >
                <Layers3 className="w-4 h-4" />
              </div>
              <div>
                <p
                  className={`text-xs font-mono font-bold uppercase tracking-wide ${
                    isVault ? "text-amber-400" : "text-amber-900"
                  }`}
                >
                  Browsing as Guest
                </p>
                <p
                  className={`text-[11px] font-light mt-0.5 ${
                    isVault ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  Every tier is visible to everyone. Sign in to track your own progress through them.
                </p>
              </div>
            </div>
            <button
              id="goto-login-btn"
              onClick={() => router.push(ROUTES.LOGIN)}
              className={`text-[10px] font-mono font-semibold uppercase px-4 py-2 rounded-lg transition duration-200 shadow-sm self-start sm:self-auto shrink-0 ${
                isVault
                  ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                  : "bg-stone-900 hover:bg-stone-800 text-white"
              }`}
            >
              Sign In
            </button>
          </div>
        )}

        <div
          className={`flex flex-wrap items-center justify-center gap-2 mb-12 border-b pb-6 ${
            isVault ? "border-stone-800" : "border-stone-200"
          }`}
        >
          <span
            className={`mr-2 font-mono text-xs flex items-center gap-1 ${
              isVault ? "text-stone-400" : "text-stone-500"
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> Filter Category:
          </span>
          {categoryFilters.map((filter) => (
            <button
              id={`filter-tag-${filter.replace(/\s+/g, "-").toLowerCase()}`}
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-mono tracking-wide transition duration-300 border ${
                selectedFilter === filter
                  ? isVault
                    ? "bg-amber-600 text-stone-950 border-amber-600 font-semibold"
                    : "bg-stone-900 text-white border-stone-900 font-semibold"
                  : isVault
                    ? "bg-stone-900/60 hover:bg-stone-800 text-stone-400 border-stone-700"
                    : "bg-white hover:bg-stone-100 text-stone-600 border-stone-200/80 shadow-xs"
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
          <div
            className={`border rounded-2xl p-8 text-center max-w-lg mx-auto ${
              isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200 bg-white"
            }`}
          >
            <div
              className={`w-12 h-12 border rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                isVault
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : "bg-rose-50 border-rose-100 text-rose-600"
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className={`text-xl font-serif font-bold mb-2 ${isVault ? "text-stone-50" : "text-stone-900"}`}>
              Failed to Load Curriculum
            </h2>
            <p className={`text-xs font-light mb-6 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
              {getApiErrorMessage(error, "Unable to load the curriculum right now.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className={`inline-flex items-center gap-2 px-5 py-3 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition ${
                isVault
                  ? "bg-amber-600 hover:bg-amber-500 text-stone-100"
                  : "bg-stone-900 hover:bg-stone-800 text-stone-100"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredTiers.length === 0 && (
          <div
            className={`rounded-2xl border border-dashed ${
              isVault ? "border-stone-700 bg-[#161412]/70" : "border-stone-200 bg-white/70"
            }`}
          >
            <EmptyState
              icon={Layers3}
              label="No tiers in this category yet"
              description="Try a different filter, or check back soon."
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
                  className={`border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group ${
                    isVault ? "bg-[#161412] border-stone-800" : "bg-white border-stone-200/80"
                  }`}
                >
                  <div>
                    <div
                      className={`flex items-center justify-between gap-2 border-b pb-3 mb-4 ${
                        isVault ? "border-stone-800" : "border-stone-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md shrink-0 ${
                            isVault ? "text-amber-500 bg-amber-600/15" : "text-amber-750 bg-amber-50"
                          }`}
                        >
                          Tier {tier.level}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border truncate ${getCategoryColor(
                            tier.category?.name,
                            isVault
                          )}`}
                        >
                          {tier.category?.name || "Uncategorized"}
                        </span>
                      </div>
                      {isAuthenticated && progress && <StatusPill status={progress.status} vault={isVault} />}
                    </div>

                    <h3
                      className={`text-lg font-serif font-semibold tracking-tight mb-2 transition-colors duration-250 ${
                        isVault
                          ? "text-stone-100 group-hover:text-amber-500"
                          : "text-stone-900 group-hover:text-amber-800"
                      }`}
                    >
                      {tier.name}
                    </h3>
                    {tier.audience && (
                      <p className="text-xs font-mono text-stone-400 mb-3 tracking-tight">
                        Focus: {tier.audience}
                      </p>
                    )}
                    <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-3">
                      {tier.pathway_count} pathway{tier.pathway_count === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div
                    className={`flex items-center justify-between pt-4 border-t ${
                      isVault ? "border-stone-800" : "border-stone-100"
                    }`}
                  >
                    <span className="text-stone-400 text-[11px] font-mono">
                      {tier.estimated_duration || "Self-paced"}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all ${
                        isVault ? "text-amber-500" : "text-amber-700"
                      }`}
                    >
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
                className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 transition-opacity"
              />

              <motion.div
                id="drawer-surface"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`fixed right-0 top-0 bottom-0 w-full max-w-lg shadow-2xl z-50 p-6 md:p-8 flex flex-col justify-between overflow-y-auto ${
                  isVault ? "bg-[#161412] border-l border-stone-800" : "bg-white"
                }`}
              >
                {activeTierQuery.isLoading || !activeTier ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader fullScreen={false} label="Loading tier..." />
                  </div>
                ) : (
                  <>
                    <div>
                      <div
                        className={`flex items-center justify-between border-b pb-4 mb-6 ${
                          isVault ? "border-stone-800" : "border-stone-100"
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-mono text-sm font-bold px-3 py-1.5 rounded-lg border ${
                              isVault
                                ? "text-amber-400 bg-amber-600/15 border-amber-700/40"
                                : "text-amber-800 bg-amber-50 border-amber-200/40"
                            }`}
                          >
                            Tier {activeTier.level}
                          </span>
                          <span
                            className={`text-xs uppercase font-mono tracking-widest px-3 py-1 rounded-full border ${getCategoryColor(
                              activeTier.category?.name,
                              isVault
                            )}`}
                          >
                            {activeTier.category?.name || "Uncategorized"}
                          </span>
                          {isAuthenticated && activeTierProgress && (
                            <StatusPill status={activeTierProgress.status} vault={isVault} />
                          )}
                        </div>
                        <CloseButton onClick={() => setActiveTierId(null)} title="Close details drawer" />
                      </div>

                      <h3
                        className={`text-2xl md:text-3xl font-serif font-bold tracking-tight mb-1 ${
                          isVault ? "text-stone-100" : "text-stone-900"
                        }`}
                      >
                        {activeTier.name}
                      </h3>
                      {activeTier.audience && (
                        <p
                          className={`font-mono text-xs tracking-wider uppercase mb-4 ${
                            isVault ? "text-stone-400" : "text-stone-500"
                          }`}
                        >
                          {activeTier.audience}
                        </p>
                      )}

                      {activeTier.audience && (
                        <div
                          className={`border p-4 rounded-xl mb-6 ${
                            isVault ? "bg-stone-900/40 border-stone-800" : "bg-stone-50 border-stone-200/60"
                          }`}
                        >
                          <p className="text-stone-400 text-[10px] font-mono uppercase tracking-wider mb-1">
                            AUDIENCE SCOPE
                          </p>
                          <p className={`text-sm font-medium ${isVault ? "text-stone-200" : "text-stone-800"}`}>
                            {activeTier.audience}
                          </p>
                        </div>
                      )}

                      <p
                        className={`text-sm leading-relaxed mb-8 font-light ${
                          isVault ? "text-stone-400" : "text-stone-600"
                        }`}
                      >
                        {activeTier.focus_description || "No description has been added for this tier yet."}
                      </p>

                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Compass className="w-4 h-4 text-amber-700" />
                          <h4
                            className={`text-xs font-mono uppercase tracking-wider ${
                              isVault ? "text-stone-100" : "text-stone-900"
                            }`}
                          >
                            CURRICULUM FOCUS PATHWAYS
                          </h4>
                        </div>
                        {activeTier.pathways?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {activeTier.pathways.map((tierPathway) => (
                              <span
                                key={tierPathway.id}
                                className={`px-3.5 py-2 rounded-xl text-xs font-medium border ${
                                  isVault
                                    ? "bg-stone-800/60 text-stone-300 border-stone-700/50"
                                    : "bg-stone-100 text-stone-800 border-stone-200/40"
                                }`}
                              >
                                {tierPathway.pathway.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-xs font-light ${isVault ? "text-stone-500" : "text-stone-400"}`}>
                            Pathways for this tier are being finalized.
                          </p>
                        )}
                      </div>

                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className="w-4 h-4 text-amber-700" />
                          <h4
                            className={`text-xs font-mono uppercase tracking-wider ${
                              isVault ? "text-stone-100" : "text-stone-900"
                            }`}
                          >
                            WHAT YOU'LL LEARN
                          </h4>
                        </div>
                        {activeTier.pathways?.length ? (
                          <ul className="space-y-2">
                            {activeTier.pathways.map((tierPathway) => (
                              <li
                                key={tierPathway.id}
                                className={`flex items-start gap-2.5 text-xs leading-relaxed ${
                                  isVault ? "text-stone-400" : "text-stone-650"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                                <span>
                                  Complete <strong>{tierPathway.pathway.name}</strong> —{" "}
                                  {tierPathway.pathway.course_count} course
                                  {tierPathway.pathway.course_count === 1 ? "" : "s"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className={`text-xs font-light ${isVault ? "text-stone-500" : "text-stone-400"}`}>
                            Outcomes will appear once pathways are attached to this tier.
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className={`pt-6 border-t flex items-center justify-between -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 ${
                        isVault ? "border-stone-800 bg-stone-900/40" : "border-stone-100 bg-stone-50"
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 font-mono text-xs ${
                          isVault ? "text-stone-400" : "text-stone-500"
                        }`}
                      >
                        <Clock className="w-4 h-4 text-amber-700" />
                        <span>
                          ESTIMATED DURATION:{" "}
                          <strong className={isVault ? "text-stone-200" : "text-stone-800"}>
                            {activeTier.estimated_duration || "Self-paced"}
                          </strong>
                        </span>
                      </div>
                      <button
                        id="drawer-select-pathway-btn"
                        onClick={handleSelectPathway}
                        className={`font-semibold text-xs px-5 py-2.5 rounded-lg tracking-wide transition flex items-center gap-1.5 ${
                          isVault
                            ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                            : "bg-stone-900 hover:bg-stone-800 text-white"
                        }`}
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
