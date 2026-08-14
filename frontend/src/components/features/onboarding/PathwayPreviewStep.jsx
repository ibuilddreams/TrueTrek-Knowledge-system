"use client";

import { useQueries } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { getPublicPathwayById } from "@/services/pathwaysService";
import { formatCoursePrice } from "@/lib/store";
import Loader from "@/components/ui/Loader";

export default function PathwayPreviewStep({ selectedPathwayIds, onBack, onContinue }) {
  const pathwayQueries = useQueries({
    queries: selectedPathwayIds.map((id) => ({
      queryKey: ["onboarding-pathway-preview", id],
      queryFn: async () => {
        const response = await getPublicPathwayById(id);
        return response?.data;
      },
    })),
  });

  const isLoading = pathwayQueries.some((query) => query.isLoading);
  const isError = pathwayQueries.some((query) => query.isError);
  const pathways = pathwayQueries.map((query) => query.data).filter(Boolean);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader fullScreen={false} label="Loading pathway details..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="bg-white border border-stone-200/85 rounded-2xl shadow-xl relative overflow-hidden p-8 sm:p-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />

        <div className="text-center mb-8">
          <h2 className="text-2xl font-serif font-bold mb-1.5 text-stone-900">
            Preview Your Pathway{pathways.length === 1 ? "" : "s"}
          </h2>
          <p className="text-xs font-light leading-relaxed text-stone-500">
            Here&apos;s what&apos;s included before you check out.
          </p>
        </div>

        {isError && (
          <div className="mb-6 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-mono bg-red-50 border border-red-100 text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Some pathway details couldn&apos;t be loaded. You can still continue.</span>
          </div>
        )}

        <div className="space-y-6 mb-8">
          {pathways.map((pathway) => {
            const sortedCourses = [...(pathway.courses || [])].sort(
              (a, b) => a.order - b.order
            );

            return (
              <div
                key={pathway.id}
                className="border border-stone-200 rounded-2xl p-5 bg-stone-50/70"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="font-serif font-bold text-stone-900 text-lg">
                    {pathway.name}
                  </h3>
                  <span className="font-mono text-sm font-bold text-amber-800 shrink-0">
                    {formatCoursePrice(pathway.base_price)}
                  </span>
                </div>
                <p className="text-xs text-stone-500 font-light leading-relaxed mb-4">
                  {pathway.description || pathway.summary}
                </p>
                <div className="space-y-1.5">
                  {sortedCourses.map(({ course }) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-2.5 text-xs text-stone-700 bg-white border border-stone-200 rounded-lg px-3 py-2"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="font-medium truncate">{course.title}</span>
                      <span className="font-mono text-[10px] text-stone-400 ml-auto uppercase tracking-wider shrink-0">
                        {course.code}
                      </span>
                    </div>
                  ))}
                  {sortedCourses.length === 0 && (
                    <p className="text-[11px] text-stone-400 font-mono">
                      No courses attached yet.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 border border-stone-200 text-stone-600 hover:bg-stone-50 font-mono text-xs font-bold uppercase tracking-wider py-3.5 px-5 rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all duration-200"
          >
            Continue to Checkout
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
