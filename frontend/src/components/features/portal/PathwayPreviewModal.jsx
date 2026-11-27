"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BookOpen, Layers, Route, ShoppingCart } from "lucide-react";
import { getPublicPathwayById } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatCoursePrice } from "@/lib/store";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";

// Read-only look inside a pathway before buying it: what it is, everything it
// includes, what it costs, and a single "Purchase" call to action.
export default function PathwayPreviewModal({ pathway, isOpen, onClose, onPurchase }) {
  const pathwayId = pathway?.id;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public-pathway-detail", pathwayId],
    queryFn: async () => {
      const response = await getPublicPathwayById(pathwayId);
      return response?.data || null;
    },
    enabled: isOpen && Boolean(pathwayId),
  });

  const courses = (data?.courses || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((entry) => entry.course);
  const description = data?.description || data?.summary || pathway?.summary;

  const bundlePrice = Number(data?.base_price ?? pathway?.base_price) || 0;
  const coursesValue = courses.reduce(
    (sum, entry) => sum + (Number(entry.course.amount) || 0),
    0,
  );
  const savings = coursesValue - bundlePrice;
  const showSavings = bundlePrice > 0 && savings > 0;
  const savingsPercent = showSavings ? Math.round((savings / coursesValue) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Route}
      title={pathway?.name}
      subtitle="Pathway preview"
      maxWidth="max-w-2xl"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader fullScreen={false} tone="portal" label="Loading pathway..." />
        </div>
      )}

      {isError && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-cn-p-bad-bg border border-cn-p-bad-bg text-cn-p-bad rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-cn-p-ink-2 mb-4">
            {getApiErrorMessage(error, "Unable to load this pathway right now.")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2.5 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="space-y-5">
          {description && (
            <p className="text-sm font-light leading-relaxed text-cn-p-ink-2 whitespace-pre-line">
              {description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-cn-p-line bg-cn-p-soft p-4">
            <div>
              <p className="text-[11px] font-semibold text-cn-p-ink-2">
                Pathway price
              </p>
              <div className="flex items-baseline flex-wrap gap-x-2.5 gap-y-0.5">
                <span className="text-2xl font-extrabold tracking-[-0.02em] text-cn-p-ink tabular-nums">
                  {formatCoursePrice(bundlePrice)}
                </span>
                {showSavings && (
                  <span className="text-xs font-light text-cn-p-ink-2">
                    <span className="line-through">{formatCoursePrice(coursesValue)}</span>
                    <span className="ml-1.5 font-semibold text-cn-p-ok">
                      Save {savingsPercent}%
                    </span>
                  </span>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-light text-cn-p-ink-2">
                <Layers className="w-3.5 h-3.5" />
                {courses.length} course{courses.length === 1 ? "" : "s"} included
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPurchase(pathway)}
              disabled={courses.length === 0}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-xs font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              Purchase pathway
            </button>
          </div>

          <div>
            <p className="text-[11px] font-semibold mb-3 text-cn-p-ink-2">
              What&apos;s inside
            </p>
            {courses.length === 0 ? (
              <p className="text-sm font-light text-cn-p-ink-2 py-6 text-center rounded-xl border border-dashed border-cn-p-line">
                No courses have been added to this pathway yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {courses.map((entry, index) => {
                  const course = entry.course;
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3.5 p-3 rounded-xl border border-cn-p-line bg-cn-p-page"
                    >
                      <span className="w-6 text-center text-[11px] font-semibold tabular-nums text-cn-p-ink-2 shrink-0">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="w-12 h-12 rounded-lg border border-cn-p-line shrink-0 bg-cn-p-card overflow-hidden flex items-center justify-center">
                        {course.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.image}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <BookOpen className="w-4 h-4 text-cn-p-ink-2" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-cn-p-ink line-clamp-2 leading-snug">
                          {course.title}
                        </p>
                        {course.code && (
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-cn-p-ink-2 mt-0.5">
                            {course.code}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-cn-p-ink-2 shrink-0">
                        {formatCoursePrice(course.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="text-xs font-light text-cn-p-ink-2">
            Purchasing enrolls you in every course above, ready to start right away in
            My courses.
          </p>
        </div>
      )}
    </Modal>
  );
}
