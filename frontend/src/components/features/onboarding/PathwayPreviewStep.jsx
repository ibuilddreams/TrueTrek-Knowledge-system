"use client";

import { useQueries } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { getPublicPathwayById } from "@/services/pathwaysService";
import { formatCoursePrice } from "@/lib/store";
import Loader from "@/components/ui/Loader";
import { CN_BTN_PRIMARY, CN_BTN_SECONDARY } from "@/components/ui/cobaltStyles";

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
      <div className="flex min-h-[320px] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} tone="cobalt" label="Loading pathway details..." />
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink">
          Here&apos;s what you&apos;re getting.
        </h2>
        <p className="mt-2 text-cn-ink-2">
          Every course in your {pathways.length === 1 ? "pathway" : "pathways"},
          before you check out.
        </p>
      </div>

      {isError && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-cn-sm bg-cn-warn-bg px-4 py-3 text-cn-sm text-cn-warn"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Some pathway details couldn&apos;t be loaded. You can still continue.
          </span>
        </p>
      )}

      <div className="grid gap-4">
        {pathways.map((pathway) => {
          const sortedCourses = [...(pathway.courses || [])].sort(
            (a, b) => a.order - b.order
          );

          return (
            <div
              key={pathway.id}
              className="grid gap-3 rounded-cn-lg border border-cn-rule bg-cn-paper-2 p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-cn-lg font-bold tracking-[-0.015em] text-cn-ink">
                  {pathway.name}
                </h3>
                <span className="shrink-0 text-cn-lg font-extrabold tracking-[-0.02em] tabular-nums text-cn-ink">
                  {formatCoursePrice(pathway.base_price)}
                </span>
              </div>

              <p className="text-cn-sm text-cn-ink-2">
                {pathway.description || pathway.summary}
              </p>

              <div className="grid gap-1.5">
                {sortedCourses.map(({ course }) => {
                  // Every pathway course is titled "MT-101: Identity Beyond the
                  // Jersey" — code first — so printing the code again on the
                  // right is the same string twice on one row. The CN academy
                  // courses are titled without one, and those keep the badge.
                  const code = course.code || "";
                  const titleCarriesCode = code && course.title?.startsWith(code);

                  return (
                    <div
                      key={course.id}
                      className="flex items-center gap-2.5 rounded-cn-sm border border-cn-rule bg-white px-3 py-2.5 text-cn-sm"
                    >
                      <BookOpen className="h-4 w-4 shrink-0 text-cn-accent" />
                      <span className="truncate font-medium text-cn-ink">
                        {course.title}
                      </span>
                      {code && !titleCarriesCode && (
                        <span className="ml-auto shrink-0 text-cn-xs text-cn-muted">
                          {code}
                        </span>
                      )}
                    </div>
                  );
                })}
                {sortedCourses.length === 0 && (
                  <p className="text-cn-sm text-cn-muted">No courses attached yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className={CN_BTN_SECONDARY}>
          <ArrowLeft className="h-[18px] w-[18px]" />
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          className={`${CN_BTN_PRIMARY} flex-1`}
        >
          Continue to checkout
          <ArrowRight className="h-[18px] w-[18px]" />
        </button>
      </div>
    </>
  );
}
