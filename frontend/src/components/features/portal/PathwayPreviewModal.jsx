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
          <Loader fullScreen={false} label="Loading pathway..." />
        </div>
      )}

      {isError && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted mb-4">
            {getApiErrorMessage(error, "Unable to load this pathway right now.")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-pine hover:bg-moss text-paper text-xs font-mono uppercase tracking-wider rounded-lg transition"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="space-y-5">
          {description && (
            <p className="text-sm font-light leading-relaxed text-muted whitespace-pre-line">
              {description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gold/30 bg-gold/10 p-4">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted">
                Pathway price
              </p>
              <div className="flex items-baseline flex-wrap gap-x-2.5 gap-y-0.5">
                <span className="text-2xl font-serif font-bold text-ink">
                  {formatCoursePrice(bundlePrice)}
                </span>
                {showSavings && (
                  <span className="text-xs font-light text-muted">
                    <span className="line-through">{formatCoursePrice(coursesValue)}</span>
                    <span className="ml-1.5 font-semibold text-emerald-700">
                      Save {savingsPercent}%
                    </span>
                  </span>
                )}
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs font-light text-muted">
                <Layers className="w-3.5 h-3.5" />
                {courses.length} course{courses.length === 1 ? "" : "s"} included
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPurchase(pathway)}
              disabled={courses.length === 0}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-pine hover:bg-moss text-paper text-xs font-mono font-bold uppercase tracking-wider transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              Purchase pathway
            </button>
          </div>

          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] mb-3 text-pine/80">
              What&apos;s inside
            </p>
            {courses.length === 0 ? (
              <p className="text-sm font-light text-muted py-6 text-center rounded-xl border border-dashed border-line">
                No courses have been added to this pathway yet.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {courses.map((entry, index) => {
                  const course = entry.course;
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center gap-3.5 p-3 rounded-xl border border-line bg-porcelain"
                    >
                      <span className="w-6 text-center text-[11px] font-mono text-muted shrink-0">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="w-12 h-12 rounded-lg border border-line shrink-0 bg-paper overflow-hidden flex items-center justify-center">
                        {course.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.image}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <BookOpen className="w-4 h-4 text-muted" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink line-clamp-2 leading-snug">
                          {course.title}
                        </p>
                        {course.code && (
                          <p className="text-[11px] font-mono uppercase tracking-wide text-muted mt-0.5">
                            {course.code}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-muted shrink-0">
                        {formatCoursePrice(course.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="text-xs font-light text-muted">
            Purchasing enrolls you in every course above, ready to start right away in
            My Courses.
          </p>
        </div>
      )}
    </Modal>
  );
}
