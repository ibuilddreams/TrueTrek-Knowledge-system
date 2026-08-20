"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  LogIn,
  RefreshCw,
  Route,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { checkoutPathways, getMyPathways, getPublicPathways } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import PathwayCard from "./PathwayCard";
import PathwayDetailModal from "./PathwayDetailModal";
import PathwayCheckoutModal from "./PathwayCheckoutModal";

const PAGE_SIZE = 9;

export default function PathwaysStore() {
  const router = useRouter();
  const { isAuthenticated, isStudent, role, user } = useAuth();

  // Only students can select/purchase a pathway — teachers and admins can
  // still browse and view details, mirroring MerchantStore's cart gating.
  // Guests are treated the same way (redirected to login on first attempt)
  // so the "not signed in yet" flow stays separate from "wrong role" flow.
  const canSelect = !isAuthenticated || isStudent;

  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [viewingPathwayId, setViewingPathwayId] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // Keyed by id so a selection made on one page survives paginating away
  // from it — there's no server-side cart for pathways to persist this.
  const [selectedMap, setSelectedMap] = useState(new Map());

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["public-pathways", page],
    queryFn: async () => {
      const response = await getPublicPathways({ page, pageSize: PAGE_SIZE });
      return response?.data || { results: [], count: 0 };
    },
    placeholderData: keepPreviousData,
  });

  const pathways = data?.results || [];
  const totalPathways = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalPathways / PAGE_SIZE));

  const { data: myPathwaysData } = useQuery({
    queryKey: ["my-pathways"],
    queryFn: async () => {
      const response = await getMyPathways();
      return response?.data || [];
    },
    enabled: isAuthenticated && isStudent,
  });
  const ownedPathwayIds = useMemo(
    () => new Set((myPathwaysData || []).map((enrollment) => enrollment.pathway.id)),
    [myPathwaysData],
  );

  const selectedPathways = useMemo(() => Array.from(selectedMap.values()), [selectedMap]);
  const selectedIds = useMemo(() => new Set(selectedMap.keys()), [selectedMap]);
  const selectedTotal = useMemo(
    () => selectedPathways.reduce((sum, pathway) => sum + (Number(pathway.base_price) || 0), 0),
    [selectedPathways],
  );

  function toggleSelect(pathway) {
    if (!isAuthenticated) {
      toastInfo("Sign in to select pathways to purchase.");
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!isStudent) {
      toastInfo("Only student accounts can purchase pathways.");
      return;
    }

    if (ownedPathwayIds.has(pathway.id)) {
      toastInfo("You already have access to this pathway.");
      return;
    }

    setSelectedMap((prev) => {
      const next = new Map(prev);
      if (next.has(pathway.id)) {
        next.delete(pathway.id);
      } else {
        next.set(pathway.id, pathway);
      }
      return next;
    });
  }

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutPathways(Array.from(selectedIds)),
    onSuccess: (response) => {
      const result = response?.data || {
        enrolled_pathways: [],
        already_enrolled_pathways: [],
        failed_pathways: [],
      };
      const enrolledCount = result.enrolled_pathways?.length || 0;
      const alreadyCount = result.already_enrolled_pathways?.length || 0;
      const failedCount = result.failed_pathways?.length || 0;

      if (enrolledCount > 0) {
        toastSuccess(
          enrolledCount === 1
            ? "Payment successful — your pathway is unlocked!"
            : `Payment successful — ${enrolledCount} pathways unlocked!`,
        );
      } else if (alreadyCount > 0 && failedCount === 0) {
        toastInfo("You already had access to the selected pathway(s).");
      }

      (result.already_enrolled_pathways || []).forEach((item) => {
        toastInfo(`${item.pathway_name}: you already have access to this pathway.`);
      });

      (result.failed_pathways || []).forEach((item) => {
        toastError(`Pathway #${item.pathway_id}: ${item.reason}`);
      });

      setIsCheckoutOpen(false);
      setSelectedMap(new Map());
      queryClient.invalidateQueries({ queryKey: ["public-pathways"] });
      queryClient.invalidateQueries({ queryKey: ["my-pathways"] });
      queryClient.invalidateQueries({ queryKey: ["studentEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
    },
    onError: (mutationError) => {
      toastError(getApiErrorMessage(mutationError, "Checkout failed. Please try again."));
    },
  });

  function handleOpenCheckout() {
    if (selectedPathways.length === 0) return;
    setIsCheckoutOpen(true);
  }

  function handleConfirmPayment() {
    checkoutMutation.mutate();
  }

  const onNavigateToPortal = () => router.push(getPortalRouteForRole(role));

  // If everything on the current page just got purchased, the refetch after
  // checkout can leave the user stranded on a now-empty page.
  useEffect(() => {
    if (!isLoading && !isFetching && pathways.length === 0 && page > 1) {
      setPage(1);
    }
  }, [isLoading, isFetching, pathways.length, page]);

  return (
    <div
      id="pathways-store-container"
      className="min-h-screen bg-[#faf9f6] text-stone-900 pb-32"
    >
      {/* Dynamic Header */}
      <div
        id="pathways-banner-layout"
        className="bg-[#1c1917] text-white py-16 px-6 border-b border-stone-800 relative overflow-hidden"
      >
        <div
          id="ambient-dot-pathways"
          className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-amber-600/10 blur-[130px] -translate-y-1/2"
        ></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-stone-850 border border-stone-750 px-3.5 py-1.5 rounded-full text-amber-500 font-mono text-xs uppercase tracking-wider">
              <Route className="w-3.5 h-3.5" />
              Bundled Learning Pathways
            </span>
            <h2 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-white">
              Explore the Pathways
            </h2>
            <p className="text-stone-450 text-xs md:text-sm font-light max-w-xl leading-relaxed">
              Each pathway bundles several courses into a single purchase and
              auto-enrolls you in every course it contains.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        {/* Role-aware status banner */}
        <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
          {isAuthenticated ? (
            <>
              <p className="text-xs text-stone-700 font-sans leading-relaxed">
                <span className="font-mono font-bold text-emerald-800 uppercase tracking-widest mr-2">
                  [SIGNED IN]
                </span>
                Signed in as {user?.name || user?.email}.{" "}
                {isStudent
                  ? "Select pathways below to purchase them."
                  : "Purchasing pathways is available to student accounts only."}
              </p>
              <button
                type="button"
                onClick={onNavigateToPortal}
                className="text-[10px] font-mono font-semibold uppercase bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg transition duration-200 shadow-sm shrink-0"
              >
                Open My Portal →
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-stone-700 font-sans leading-relaxed">
                <span className="font-mono font-bold text-amber-800 uppercase tracking-widest mr-2">
                  [BROWSING AS GUEST]
                </span>
                Pathways are visible to everyone. Sign in as a student to
                select and purchase them.
              </p>
              <button
                type="button"
                onClick={() => router.push(ROUTES.LOGIN)}
                className="text-[10px] font-mono font-semibold uppercase bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg transition duration-200 shadow-sm shrink-0 flex items-center gap-1.5"
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            </>
          )}
        </div>

        {isLoading && (
          <div
            className="flex min-h-[40vh] items-center justify-center"
            aria-busy="true"
          >
            <Loader fullScreen={false} label="Loading pathways..." />
          </div>
        )}

        {isError && (
          <div className="border border-stone-200 bg-white rounded-2xl p-8 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-serif font-bold mb-2 text-stone-900">
              Failed to Load Pathways
            </h2>
            <p className="text-xs font-light mb-6 text-stone-500">
              {getApiErrorMessage(error, "Unable to load pathways right now.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-5 py-3 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition bg-stone-900 hover:bg-stone-800 text-stone-100"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && pathways.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
            <EmptyState
              icon={Route}
              label="No pathways published yet"
              description="Check back soon — new pathways are added regularly."
            />
          </div>
        )}

        {!isLoading && !isError && pathways.length > 0 && (
          <>
            <motion.div
              id="pathways-grid-layout"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-200 ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {pathways.map((pathway) => (
                <PathwayCard
                  key={pathway.id}
                  pathway={pathway}
                  isSelected={selectedIds.has(pathway.id)}
                  isOwned={ownedPathwayIds.has(pathway.id)}
                  canSelect={canSelect}
                  onViewDetails={(item) => setViewingPathwayId(item.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </motion.div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalLabel={`${totalPathways} pathway${totalPathways === 1 ? "" : "s"}`}
            />
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedPathways.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-6 pb-6 pointer-events-none"
          >
            <div className="pointer-events-auto bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-5 max-w-lg w-full sm:w-auto">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  {selectedPathways.length} pathway
                  {selectedPathways.length === 1 ? "" : "s"} selected
                </p>
                <p className="text-sm font-mono font-bold text-white">
                  {formatCoursePrice(selectedTotal)}
                </p>
              </div>
              <button
                id="pathways-checkout-trigger-btn"
                type="button"
                onClick={handleOpenCheckout}
                className="ml-auto shrink-0 bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider px-5 py-3 rounded-xl shadow-md transition-all duration-200 flex items-center gap-2"
              >
                Checkout
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PathwayDetailModal
        pathwayId={viewingPathwayId}
        isSelected={viewingPathwayId ? selectedIds.has(viewingPathwayId) : false}
        isOwned={viewingPathwayId ? ownedPathwayIds.has(viewingPathwayId) : false}
        canSelect={canSelect}
        onClose={() => setViewingPathwayId(null)}
        onToggleSelect={toggleSelect}
      />

      <PathwayCheckoutModal
        isOpen={isCheckoutOpen}
        pathways={selectedPathways}
        isSubmitting={checkoutMutation.isPending}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
}
