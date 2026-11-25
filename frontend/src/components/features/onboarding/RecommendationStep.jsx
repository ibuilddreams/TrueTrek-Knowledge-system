"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { getPathwayRecommendations } from "@/services/onboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import { CN_BTN_PRIMARY } from "@/components/ui/cobaltStyles";
import OnboardingErrorPanel from "./OnboardingErrorPanel";

export default function RecommendationStep({
  selectedPathwayIds,
  onSelectionChange,
  onContinue,
}) {
  const {
    data: pathways = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["onboarding-recommendations"],
    queryFn: async () => {
      const response = await getPathwayRecommendations();
      return response?.data || [];
    },
  });

  const topScore = pathways.length ? Math.max(...pathways.map((p) => p.score || 0)) : 0;

  function toggleSelection(pathwayId) {
    const isSelected = selectedPathwayIds.includes(pathwayId);
    onSelectionChange(
      isSelected
        ? selectedPathwayIds.filter((id) => id !== pathwayId)
        : [...selectedPathwayIds, pathwayId]
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} tone="cobalt" label="Finding your pathways..." />
      </div>
    );
  }

  if (isError) {
    return (
      <OnboardingErrorPanel
        title="We couldn't load your pathways."
        message={getApiErrorMessage(error, "Unable to load pathway recommendations right now.")}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <div>
        <h2 className="text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink">
          Pick your pathway.
        </h2>
        <p className="mt-2 text-cn-ink-2">
          Matched to your answers. Take the top one, or take more than one —
          you&apos;re not limited to a single pathway.
        </p>
      </div>

      {pathways.length === 0 ? (
        <EmptyState
          tone="cobalt"
          size="lg"
          label="No pathways available yet"
          description="Check back soon — pathways are added regularly."
        />
      ) : (
        <div className="grid gap-2.5">
          {pathways.map((pathway) => {
            const isSelected = selectedPathwayIds.includes(pathway.id);
            const isTop = topScore > 0 && pathway.score === topScore;

            return (
              <button
                key={pathway.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSelection(pathway.id)}
                className={`flex w-full items-start gap-3.5 rounded-cn-sm border-[1.5px] bg-white p-4 text-left transition-[border-color,background-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent ${
                  isSelected
                    ? "border-cn-accent bg-cn-paper-3"
                    : "border-cn-rule hover:border-cn-accent-soft"
                }`}
              >
                {/* Reads as a checkbox when nothing is chosen — an unselected
                    `.k` badge with no letter in it is just a blank grey
                    square, which looks like a rendering fault rather than a
                    control. */}
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid h-[30px] w-[30px] flex-none place-items-center rounded-[8px] border-[1.5px] transition-colors duration-150 ${
                    isSelected
                      ? "border-cn-accent bg-cn-accent text-white"
                      : "border-cn-rule-strong bg-white text-cn-muted"
                  }`}
                >
                  {isSelected && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>

                <span className="grid min-w-0 flex-1 gap-1.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <b className="text-cn-base text-cn-ink">{pathway.name}</b>
                    {isTop && (
                      <span className="rounded-full bg-cn-accent px-2.5 py-0.5 text-cn-xs font-semibold text-white">
                        Recommended
                      </span>
                    )}
                  </span>

                  {pathway.tiers?.length > 0 && (
                    <span className="text-cn-sm font-semibold text-cn-accent">
                      {pathway.tiers
                        .map((tier) => `Tier ${tier.level} — ${tier.name}`)
                        .join(" · ")}
                    </span>
                  )}

                  <span className="line-clamp-2 text-cn-sm text-cn-ink-2">
                    {pathway.summary}
                  </span>

                  <span className="flex items-baseline justify-between gap-3 pt-1 text-cn-sm text-cn-muted">
                    <span>
                      {pathway.course_count} course{pathway.course_count === 1 ? "" : "s"}
                    </span>
                    <span className="text-cn-lg font-extrabold tracking-[-0.02em] tabular-nums text-cn-ink">
                      {formatCoursePrice(pathway.base_price)}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={selectedPathwayIds.length === 0}
        className={`${CN_BTN_PRIMARY} w-full`}
      >
        Continue
        <ArrowRight className="h-[18px] w-[18px]" />
      </button>
    </>
  );
}
