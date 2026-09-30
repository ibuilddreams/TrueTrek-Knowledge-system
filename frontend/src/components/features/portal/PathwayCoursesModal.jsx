"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, BookOpen, Route } from "lucide-react";
import { getPublicPathwayById } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { ROUTES } from "@/constants/routes";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";

export default function PathwayCoursesModal({ pathway, isOpen, onClose }) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Route}
      title={pathway?.name}
      subtitle="Courses included in this pathway"
      maxWidth="max-w-2xl"
    >
      {description && (
        <p className="text-sm font-light leading-relaxed text-muted mb-5">
          {description}
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader fullScreen={false} label="Loading courses..." />
        </div>
      )}

      {isError && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted mb-4">
            {getApiErrorMessage(error, "Unable to load this pathway's courses right now.")}
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
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-pine/80">
              Included courses
            </p>
            <span className="text-xs font-light text-muted">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </span>
          </div>

          {courses.length === 0 ? (
            <p className="text-sm font-light text-muted py-6 text-center rounded-xl border border-dashed border-line">
              No courses have been added to this pathway yet.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {courses.map((entry, index) => {
                const course = entry.course;
                return (
                  <li key={entry.id}>
                    <Link
                      href={`${ROUTES.STUDENT_PORTAL}?tab=courses&course=${course.id}`}
                      className="group flex items-center gap-3.5 p-3 rounded-xl border border-line bg-porcelain transition hover:border-gold/50 hover:bg-paper hover:shadow-[0_10px_28px_-22px_rgba(28,25,23,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-pine"
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
                      <span className="hidden sm:inline text-[11px] font-mono uppercase tracking-wider text-muted group-hover:text-pine shrink-0">
                        Open course
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted group-hover:text-pine group-hover:translate-x-0.5 transition shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Modal>
  );
}
