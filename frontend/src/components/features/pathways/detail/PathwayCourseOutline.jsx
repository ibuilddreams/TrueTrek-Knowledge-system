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
      <p className="px-5 pb-5 text-xs text-muted">
        This course has no public outline yet.
      </p>
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-2 px-5 pb-5" aria-busy="true">
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-9 animate-pulse rounded-lg bg-porcelain" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <p role="alert" className="px-5 pb-5 text-xs text-clay">
        {getApiErrorMessage(query.error, "Unable to load this course outline.")}
      </p>
    );
  }

  const modules = [...(query.data?.modules || [])].sort((a, b) => a.order - b.order);
  const totals = summarizeOutline(modules);

  if (modules.length === 0) {
    return (
      <p className="px-5 pb-5 text-xs text-muted">
        The syllabus for this course is still being published.
      </p>
    );
  }

  return (
    <div className="px-5 pb-5">
      <p className="mb-3 text-[11px] font-sans uppercase tracking-widest text-muted">
        {pluralize(modules.length, "module")} · {pluralize(totals.lessons, "lesson")}
        {totals.quizzes > 0 && ` · ${pluralize(totals.quizzes, "quiz", "quizzes")}`}
        {totals.assignments > 0 && ` · ${pluralize(totals.assignments, "assignment")}`}
        {formatMinutesCompact(totals.minutes) && ` · ${formatMinutesCompact(totals.minutes)}`}
      </p>

      <ol className="space-y-2.5">
        {modules.map((module, moduleIdx) => {
          const lessons = [...(module.lessons || [])].sort((a, b) => a.order - b.order);
          return (
            <li
              key={module.id}
              className="overflow-hidden rounded-xl border border-line bg-porcelain/60"
            >
              <div className="flex items-baseline gap-2.5 px-4 py-3">
                <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted tabular-nums">
                  M{String(moduleIdx + 1).padStart(2, "0")}
                </span>
                <h5 className="min-w-0 flex-1 text-sm font-medium text-ink">{module.title}</h5>
                <span className="shrink-0 text-[11px] font-sans text-muted">
                  {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
                </span>
              </div>

              {(lessons.length > 0 ||
                module.quizzes?.length > 0 ||
                module.assignments?.length > 0) && (
                <ul className="divide-y divide-line border-t border-line bg-paper">
                  {lessons.map((lesson) => (
                    <li
                      key={`lesson-${lesson.id}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-ink/85"
                    >
                      <PlayCircle className="h-3.5 w-3.5 shrink-0 text-moss" />
                      <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                      {formatMinutesCompact(lesson.duration_minutes) && (
                        <span className="shrink-0 font-sans text-[11px] text-muted">
                          {formatMinutesCompact(lesson.duration_minutes)}
                        </span>
                      )}
                    </li>
                  ))}
                  {(module.quizzes || []).map((quiz) => (
                    <li
                      key={`quiz-${quiz.id}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-ink/85"
                    >
                      <FileQuestion className="h-3.5 w-3.5 shrink-0 text-gold" />
                      <span className="min-w-0 flex-1 truncate">{quiz.title}</span>
                      <span className="shrink-0 font-sans text-[11px] text-muted">Quiz</span>
                    </li>
                  ))}
                  {(module.assignments || []).map((assignment) => (
                    <li
                      key={`assignment-${assignment.id}`}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-ink/85"
                    >
                      <ClipboardList className="h-3.5 w-3.5 shrink-0 text-clay" />
                      <span className="min-w-0 flex-1 truncate">{assignment.title}</span>
                      <span className="shrink-0 font-sans text-[11px] text-muted">Assignment</span>
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
