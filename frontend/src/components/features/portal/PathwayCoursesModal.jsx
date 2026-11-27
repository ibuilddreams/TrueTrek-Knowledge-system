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
        <p className="text-sm font-light leading-relaxed text-cn-p-ink-2 mb-5">
          {description}
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader fullScreen={false} tone="portal" label="Loading courses..." />
        </div>
      )}

      {isError && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-cn-p-bad-bg border border-cn-p-bad-bg text-cn-p-bad rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm text-cn-p-ink-2 mb-4">
            {getApiErrorMessage(error, "Unable to load this pathway's courses right now.")}
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
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-cn-p-ink-2">
              Included courses
            </p>
            <span className="text-xs font-light text-cn-p-ink-2">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </span>
          </div>

          {courses.length === 0 ? (
            <p className="text-sm font-light text-cn-p-ink-2 py-6 text-center rounded-xl border border-dashed border-cn-p-line">
              No courses have been added to this pathway yet.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {courses.map((entry, index) => {
                const course = entry.course;
                return (
                  <li key={entry.id}>
                    <Link
                      href={`${ROUTES.STUDENT_PORTAL}/courses?course=${course.id}`}
                      className="group flex items-center gap-3.5 p-3 rounded-xl border border-cn-p-line bg-cn-p-page transition hover:border-cn-p-accent-soft hover:bg-cn-p-card hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cn-p-accent"
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
                      <span className="hidden sm:inline text-[11px] font-semibold text-cn-p-ink-2 group-hover:text-cn-p-accent shrink-0">
                        Open course
                      </span>
                      <ArrowRight className="w-4 h-4 text-cn-p-ink-2 group-hover:text-cn-p-accent group-hover:translate-x-0.5 transition shrink-0" />
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
