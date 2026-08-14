"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, RefreshCw, Sparkles } from "lucide-react";
import { getPathwayRecommendations } from "@/services/onboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

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
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader fullScreen={false} label="Finding your pathways..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="border border-stone-200 bg-white rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold mb-2 text-stone-900">
            Failed to Load Recommendations
          </h2>
          <p className="text-xs font-light mb-6 text-stone-500">
            {getApiErrorMessage(error, "Unable to load pathway recommendations right now.")}
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
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="bg-white border border-stone-200/85 rounded-2xl shadow-xl relative overflow-hidden p-8 sm:p-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />

        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl border bg-amber-600/10 text-amber-700 border-amber-200/40 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-1.5 text-stone-900">
            Your Recommended Pathways
          </h2>
          <p className="text-xs font-light leading-relaxed text-stone-500">
            Based on your answers. Pick any pathway — or more than one — you&apos;re not
            limited to the top match.
          </p>
        </div>

        {pathways.length === 0 ? (
          <EmptyState
            label="No pathways available yet"
            description="Check back soon — pathways are added regularly."
          />
        ) : (
          <div className="space-y-3 mb-8">
            {pathways.map((pathway) => {
              const isSelected = selectedPathwayIds.includes(pathway.id);
              const isTop = topScore > 0 && pathway.score === topScore;

              return (
                <button
                  key={pathway.id}
                  type="button"
                  onClick={() => toggleSelection(pathway.id)}
                  className={`w-full text-left border rounded-2xl p-5 transition flex items-start gap-4 ${
                    isSelected
                      ? "border-amber-600 bg-amber-50"
                      : "border-stone-200 bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "border-stone-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-serif font-bold text-stone-900">{pathway.name}</h3>
                      {isTop && (
                        <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 font-light leading-relaxed mb-2 line-clamp-2">
                      {pathway.summary}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                      <span>
                        {pathway.course_count} course{pathway.course_count === 1 ? "" : "s"}
                      </span>
                      <span className="text-stone-800 font-bold text-xs normal-case tracking-normal">
                        {formatCoursePrice(pathway.base_price)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onContinue}
          disabled={selectedPathwayIds.length === 0}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
