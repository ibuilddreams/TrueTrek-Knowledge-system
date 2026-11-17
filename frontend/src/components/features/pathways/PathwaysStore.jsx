"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { buildAuthUrl } from "@/lib/authRedirect";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import useScrollReveal from "@/hooks/useScrollReveal";
import EmptyState from "@/components/ui/EmptyState";
import CobaltPageHeader from "@/components/ui/CobaltPageHeader";
import { CN_BTN_PRIMARY, CN_BTN_SECONDARY, CN_NOTICE } from "@/components/ui/cobaltStyles";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import BuildYourOwnPathwayBanner from "./BuildYourOwnPathwayBanner";
import PathwayCard from "./PathwayCard";
import SignInToSelectModal from "./SignInToSelectModal";
import PathwayCheckoutModal from "./PathwayCheckoutModal";

const PAGE_SIZE = 9;

export default function PathwaysStore() {
  const pageRef = useRef(null);
  const router = useRouter();
  const { isAuthenticated, isStudent, role, user } = useAuth();

  // Only students can select/purchase a pathway — teachers and admins can
  // still browse and view details, mirroring MerchantStore's cart gating.
  // Guests are treated the same way (redirected to login on first attempt)
  // so the "not signed in yet" flow stays separate from "wrong role" flow.
  const canSelect = !isAuthenticated || isStudent;

  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // What a guest tried to do with a pathway — select it, or read its withheld
  // price. Names the pathway in the prompt's copy and picks which of the two
  // the prompt answers; kept after closing so neither changes mid fade-out.
  const [signInPrompt, setSignInPrompt] = useState(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  // Keyed by id so a selection made on one page survives paginating away
  // from it — there's no server-side cart for pathways to persist this.
  const [selectedMap, setSelectedMap] = useState(new Map());

  function promptSignIn(pathway, intent) {
    setSignInPrompt({ pathway, intent });
    setIsSignInOpen(true);
  }

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
    // Guests get a prompt rather than an abrupt redirect; signing in from it
    // carries `?next=` so they land back on this page.
    if (!isAuthenticated) {
      promptSignIn(pathway, "select");
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

  // The pathway cards reveal a row at a time, re-swept on each new page.
  useScrollReveal(pageRef, [isLoading, pathways.length, page]);

  return (
    <div
      id="pathways-store-container"
      ref={pageRef}
      className="min-h-screen bg-cn-paper pb-32 text-cn-ink"
    >
      {/* The design has no pathways page — it shows them as sections on the
          home and curriculum pages — so this takes the inner-page header the
          design gives every other page, and its wording. */}
      <CobaltPageHeader
        id="pathways-banner-layout"
        as="h2"
        layout="split"
        title="Choose your pathway."
        lead="Each pathway bundles several courses into a single purchase and auto-enrolls you in every course it contains."
      />

      <div className="cn-container pt-12 md:pt-16">
        {/* Role-aware status banner */}
        <div className={`${CN_NOTICE} mb-10 flex-col items-start justify-between gap-4 md:flex-row md:items-center`}>
          {isAuthenticated ? (
            <>
              <p className="leading-relaxed">
                <span className="mr-2 text-xs font-semibold tracking-widest text-cn-accent uppercase">
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
                Pathways are visible to everyone. Sign in as a student to
                see bundle pricing and purchase them.
              </p>
              <button
                type="button"
                onClick={() => router.push(buildAuthUrl(ROUTES.LOGIN, ROUTES.PATHWAYS))}
                className={`${CN_BTN_PRIMARY} h-11 shrink-0`}
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            </>
          )}
        </div>

        <BuildYourOwnPathwayBanner />

        {isLoading && (
          <div
            className="flex min-h-[40vh] items-center justify-center"
            aria-busy="true"
          >
            <Loader fullScreen={false} tone="cobalt" label="Loading pathways..." />
          </div>
        )}

        {isError && (
          <div className="mx-auto max-w-lg rounded-cn-lg border border-cn-rule bg-white p-10 text-center shadow-cn-1">
            <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-cn bg-cn-paper-3 text-cn-live">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="mb-2 text-cn-xl font-bold tracking-[-0.015em] text-cn-ink">
              Failed to Load Pathways
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-cn-ink-2">
              {getApiErrorMessage(error, "Unable to load pathways right now.")}
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

        {!isLoading && !isError && pathways.length === 0 && (
          <div className="rounded-cn-lg border border-dashed border-cn-rule-strong bg-cn-paper-2">
            <EmptyState
              tone="cobalt"
              icon={Route}
              label="No pathways published yet"
              description="Check back soon — new pathways are added regularly."
            />
          </div>
        )}

        {!isLoading && !isError && pathways.length > 0 && (
          <>
            <div
              id="pathways-grid-layout"
              className={`grid grid-cols-1 gap-6 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-3 ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {pathways.map((pathway, index) => (
                <PathwayCard
                  key={pathway.id}
                  pathway={pathway}
                  tone="cobalt"
                  revealDelay={index % 3}
                  accentIndex={index}
                  isSelected={selectedIds.has(pathway.id)}
                  isOwned={ownedPathwayIds.has(pathway.id)}
                  canSelect={canSelect}
                  onToggleSelect={toggleSelect}
                  onRequestSignIn={(selected) => promptSignIn(selected, "price")}
                />
              ))}
            </div>

            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalLabel={`${totalPathways} pathway${totalPathways === 1 ? "" : "s"}`}
                tone="cobalt"
              />
            </div>
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
            <div className="pointer-events-auto flex w-full max-w-lg items-center gap-5 rounded-cn-lg bg-cn-ink px-5 py-4 shadow-cn-3 sm:w-auto">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-widest text-cn-on-ink-2 uppercase">
                  {selectedPathways.length} pathway
                  {selectedPathways.length === 1 ? "" : "s"} selected
                </p>
                <p className="text-sm font-semibold text-white">
                  {formatCoursePrice(selectedTotal)}
                </p>
              </div>
              <button
                id="pathways-checkout-trigger-btn"
                type="button"
                onClick={handleOpenCheckout}
                className="ml-auto inline-flex h-11 shrink-0 items-center gap-2 rounded-cn-sm bg-white px-5 text-sm font-semibold text-cn-accent-3 transition-transform duration-150 ease-cn-out hover:-translate-y-px"
              >
                Checkout
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SignInToSelectModal
        isOpen={isSignInOpen}
        pathwayName={signInPrompt?.pathway?.name}
        intent={signInPrompt?.intent}
        nextPath={ROUTES.PATHWAYS}
        onClose={() => setIsSignInOpen(false)}
      />

      <PathwayCheckoutModal
        isOpen={isCheckoutOpen}
        pathways={selectedPathways}
        isSubmitting={checkoutMutation.isPending}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirm={handleConfirmPayment}
        tone="cobalt"
      />
    </div>
  );
}
