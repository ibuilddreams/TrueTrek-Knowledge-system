"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Layers, Route } from "lucide-react";
import { checkoutPathways, getMyPathways, getPublicPathways } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";
import { useAuth } from "@/hooks/useAuth";
import PathwayCheckoutModal from "@/components/features/pathways/PathwayCheckoutModal";
import PathwayCoursesModal from "./PathwayCoursesModal";
import PathwayPreviewModal from "./PathwayPreviewModal";
import { PortalIcon, PortalKicker } from "./shell/PortalUI";

// Lets a student pick another pathway from a dropdown, pay for it, and go
// straight to its (now enrolled) courses.
export default function MorePathwaysPicker() {
  const queryClient = useQueryClient();
  const { isStudent } = useAuth();
  const containerRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Kept after closing so the preview modal's exit animation doesn't go empty.
  const [previewPathway, setPreviewPathway] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPathway, setSelectedPathway] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // Kept after closing so the courses modal's exit animation doesn't go empty.
  const [purchasedPathway, setPurchasedPathway] = useState(null);
  const [isCoursesOpen, setIsCoursesOpen] = useState(false);

  const { data: allPathways = [], isLoading: isLoadingAll } = useQuery({
    queryKey: ["public-pathways", "portal-picker"],
    queryFn: async () => {
      const response = await getPublicPathways({ page: 1, pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isStudent,
  });

  const { data: myPathways = [], isLoading: isLoadingMine } = useQuery({
    queryKey: ["my-pathways"],
    queryFn: async () => {
      const response = await getMyPathways();
      return response?.data || [];
    },
    enabled: isStudent,
  });

  const availablePathways = useMemo(() => {
    const ownedIds = new Set(myPathways.map((entry) => entry.pathway?.id));
    return allPathways.filter((pathway) => !ownedIds.has(pathway.id));
  }, [allPathways, myPathways]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const checkoutMutation = useMutation({
    mutationFn: (pathway) => checkoutPathways([pathway.id]),
    onSuccess: (response, pathway) => {
      const result = response?.data || {};
      const enrolled = (result.enrolled_pathways?.length || 0) > 0;
      const already = (result.already_enrolled_pathways?.length || 0) > 0;
      const failed = result.failed_pathways || [];

      failed.forEach((item) => toastError(`${pathway.name}: ${item.reason}`));
      (result.enrolled_pathways || []).forEach((item) => {
        if (item.courses_without_instructor?.length) {
          toastInfo(
            "Some courses in this pathway don't have an instructor assigned yet and will be available once they do.",
          );
        }
      });

      if (enrolled) {
        toastSuccess(`Payment successful — ${pathway.name} is unlocked!`);
      } else if (already) {
        toastInfo("You already have access to this pathway.");
      }

      setIsCheckoutOpen(false);
      setSelectedPathway(null);

      if (enrolled || already) {
        setPurchasedPathway(pathway);
        setIsCoursesOpen(true);
      }

      queryClient.invalidateQueries({ queryKey: ["public-pathways"] });
      queryClient.invalidateQueries({ queryKey: ["my-pathways"] });
      queryClient.invalidateQueries({ queryKey: ["studentEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Checkout failed. Please try again."));
    },
  });

  if (!isStudent) return null;
  const isLoading = isLoadingAll || isLoadingMine;
  // Nothing to offer (already owns everything) — stay out of the way, but
  // keep rendering while the post-purchase courses modal is still showing.
  if (!isLoading && availablePathways.length === 0 && !isCoursesOpen) return null;

  function handleSelect(pathway) {
    setPreviewPathway(pathway);
    setIsMenuOpen(false);
    setIsPreviewOpen(true);
  }

  function handlePurchaseFromPreview(pathway) {
    setSelectedPathway(pathway);
    setIsPreviewOpen(false);
    setIsCheckoutOpen(true);
  }

  return (
    <>
      <div
        ref={containerRef}
        className="relative rounded-cn-p border border-cn-p-line bg-cn-p-card p-5"
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <PortalIcon icon={Route} size="lg" />
            <div className="min-w-0">
              <PortalKicker>Grow your library</PortalKicker>
              <h3 className="text-base font-bold text-cn-p-ink">Explore more pathways</h3>
              <p className="text-[13px] text-cn-p-ink-2">
                Pick another pathway to unlock all of its courses and keep learning.
              </p>
            </div>
          </div>

          <div className="relative w-full shrink-0 sm:w-72">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              disabled={isLoading}
              aria-haspopup="listbox"
              aria-expanded={isMenuOpen}
              className="flex h-11 w-full items-center justify-between gap-3 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-4 text-sm text-cn-p-ink transition-colors duration-150 hover:border-cn-p-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="truncate">
                {isLoading ? "Loading pathways..." : "Choose a pathway"}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {!isLoading && (
                  <span className="text-xs text-cn-p-muted tabular-nums">
                    {availablePathways.length}
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 text-cn-p-ink-2 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {isMenuOpen && (
              <ul
                role="listbox"
                aria-label="Available pathways"
                className="absolute top-full right-0 left-0 z-30 mt-2 max-h-80 overflow-y-auto rounded-cn-p border border-cn-p-line bg-cn-p-card p-1.5 shadow-cn-p sm:left-auto sm:w-96"
              >
                {availablePathways.map((pathway) => (
                  <li key={pathway.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => handleSelect(pathway)}
                      className="flex w-full items-start justify-between gap-3 rounded-cn-p-sm p-3 text-left transition-colors duration-150 hover:bg-cn-p-page"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm leading-snug font-semibold text-cn-p-ink">
                          {pathway.name}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-cn-p-ink-2">
                          <Layers className="h-3 w-3" />
                          {pathway.course_count ?? 0} course
                          {pathway.course_count === 1 ? "" : "s"}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-cn-p-accent">
                        {formatCoursePrice(pathway.base_price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <PathwayPreviewModal
        pathway={previewPathway}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onPurchase={handlePurchaseFromPreview}
      />

      <PathwayCheckoutModal
        isOpen={isCheckoutOpen}
        pathways={selectedPathway ? [selectedPathway] : []}
        isSubmitting={checkoutMutation.isPending}
        onClose={() => {
          if (checkoutMutation.isPending) return;
          setIsCheckoutOpen(false);
          setSelectedPathway(null);
          // Backing out of payment returns to the preview rather than dropping the student.
          setIsPreviewOpen(true);
        }}
        onConfirm={() => selectedPathway && checkoutMutation.mutate(selectedPathway)}
      />

      <PathwayCoursesModal
        pathway={purchasedPathway}
        isOpen={isCoursesOpen}
        onClose={() => setIsCoursesOpen(false)}
      />
    </>
  );
}
