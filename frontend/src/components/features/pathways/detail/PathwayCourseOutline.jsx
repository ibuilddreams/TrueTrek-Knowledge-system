"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileQuestion, PlayCircle } from "lucide-react";
import { getPublicCourseBySlug } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatMinutesCompact, pluralize, summarizeOutline } from "@/lib/courseOutline";

// The syllabus for one course inside the pathway, fetched only once its stop is
// expanded so opening the page doesn't pull every course's outline at once.
// The query key matches the course page's, so a visitor who already viewed that
// course gets this from cache.
export default function PathwayCourseOutline({ slug, isOpen }) {
  const query = useQuery({
    queryKey: ["public-course-detail", slug],
    queryFn: async () => (await getPublicCourseBySlug(slug)).data,
    enabled: isOpen && Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });

  if (!slug) {
    return (
      <p className="px-6 pb-5 text-cn-sm text-cn-muted">
        This course has no public outline yet.
      </p>
    );
  }

  if (query.isLoading) {
    return (
      <div className="grid gap-2 px-6 py-5" aria-busy="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-9 animate-pulse rounded-cn-sm bg-cn-paper-2" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <p role="alert" className="px-6 pb-5 text-cn-sm text-cn-live">
        {getApiErrorMessage(query.error, "Unable to load this course outline.")}
      </p>
    );
  }

  const modules = [...(query.data?.modules || [])].sort((a, b) => a.order - b.order);
  const totals = summarizeOutline(modules);

  if (modules.length === 0) {
    return (
      <p className="px-6 pb-5 text-cn-sm text-cn-muted">
        The syllabus for this course is still being published.
      </p>
    );
  }

  return (
    <div className="px-6 pt-4 pb-5">
      <p className="mb-3 text-cn-xs text-cn-muted">
        {pluralize(modules.length, "module")} · {pluralize(totals.lessons, "lesson")}
        {totals.quizzes > 0 && ` · ${pluralize(totals.quizzes, "quiz", "quizzes")}`}
        {totals.assignments > 0 && ` · ${pluralize(totals.assignments, "assignment")}`}
        {formatMinutesCompact(totals.minutes) && ` · ${formatMinutesCompact(totals.minutes)}`}
      </p>

      <ol className="grid gap-2.5">
        {modules.map((module, moduleIdx) => {
          const lessons = [...(module.lessons || [])].sort((a, b) => a.order - b.order);
          return (
            <li
              key={module.id}
              className="overflow-hidden rounded-cn border border-cn-rule bg-cn-paper-2"
            >
              <div className="flex items-baseline gap-2.5 px-4 py-3">
                <span className="text-cn-xs font-bold text-cn-muted tabular-nums">
                  M{String(moduleIdx + 1).padStart(2, "0")}
                </span>
                <h5 className="min-w-0 flex-1 text-cn-sm font-semibold text-cn-ink">{module.title}</h5>
                <span className="shrink-0 text-cn-xs text-cn-muted">
                  {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
                </span>
              </div>

              {(lessons.length > 0 ||
                module.quizzes?.length > 0 ||
                module.assignments?.length > 0) && (
                <ul className="m-0 list-none divide-y divide-cn-rule border-t border-cn-rule bg-white p-0">
                  {lessons.map((lesson) => (
                    <li
                      key={`lesson-${lesson.id}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-cn-sm text-cn-ink-2"
                    >
                      <PlayCircle className="h-3.5 w-3.5 shrink-0 text-cn-accent" />
                      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                      {formatMinutesCompact(lesson.duration_minutes) && (
                        <span className="shrink-0 text-cn-xs text-cn-muted">
                          {formatMinutesCompact(lesson.duration_minutes)}
                        </span>
                      )}
                    </li>
                  ))}
                  {(module.quizzes || []).map((quiz) => (
                    <li
                      key={`quiz-${quiz.id}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-cn-sm text-cn-ink-2"
                    >
                      <FileQuestion className="h-3.5 w-3.5 shrink-0 text-cn-accent" />
                      <span className="min-w-0 flex-1 truncate">{quiz.title}</span>
                      <span className="shrink-0 text-cn-xs text-cn-muted">Quiz</span>
                    </li>
                  ))}
                  {(module.assignments || []).map((assignment) => (
                    <li
                      key={`assignment-${assignment.id}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-cn-sm text-cn-ink-2"
                    >
                      <ClipboardList className="h-3.5 w-3.5 shrink-0 text-cn-accent" />
                      <span className="min-w-0 flex-1 truncate">{assignment.title}</span>
                      <span className="shrink-0 text-cn-xs text-cn-muted">Assignment</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
