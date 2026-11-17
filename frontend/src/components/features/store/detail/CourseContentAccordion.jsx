"use client";

import { useState } from "react";
import {
  ChevronDown,
  ClipboardList,
  FileQuestion,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Video,
} from "lucide-react";
import { formatMinutesCompact, pluralize, summarizeOutline } from "@/lib/courseOutline";
import CourseSectionHeading from "./CourseSectionHeading";

const LESSON_META = {
  VIDEO: { icon: Video, label: "Video" },
  PDF: { icon: FileText, label: "PDF" },
  DOCUMENT: { icon: FileText, label: "Document" },
  IMAGE: { icon: ImageIcon, label: "Image" },
  TEXT: { icon: FileText, label: "Reading" },
};

function ItemRow({ icon: Icon, title, label, meta }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className="w-8 h-8 shrink-0 rounded-lg bg-cn-paper-2 text-cn-accent flex items-center justify-center">
        <Icon className="w-4 h-4" aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-cn-ink truncate">{title}</span>
        {label && (
          <span className="block text-xs font-semibold tracking-widest uppercase text-cn-muted mt-0.5">
            {label}
          </span>
        )}
      </span>
      {meta && <span className="shrink-0 text-xs text-cn-muted">{meta}</span>}
    </li>
  );
}

function ModuleSection({ module, index, isOpen, onToggle }) {
  const lessons = module.lessons || [];
  const assignments = module.assignments || [];
  const quizzes = module.quizzes || [];
  const itemCount = lessons.length + assignments.length + quizzes.length;
  const minutes = formatMinutesCompact(summarizeOutline([module]).minutes);
  const panelId = `module-panel-${module.id}`;

  return (
    <div className="border-b border-cn-rule last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full flex items-center gap-4 px-5 py-4 text-left bg-cn-paper-2 hover:bg-cn-paper-2 transition-colors focus:outline-none focus-visible:bg-cn-paper-2 focus-visible:shadow-[inset_0_0_0_2px_rgba(9,45,41,0.35)]"
      >
        <span
          aria-hidden="true"
          className="w-7 h-7 shrink-0 rounded-full bg-cn-accent text-white text-xs font-sans font-semibold flex items-center justify-center"
        >
          {index + 1}
        </span>
        <span className="flex-1 min-w-0 text-sm font-semibold text-cn-ink">{module.title}</span>
        <span className="hidden sm:block shrink-0 text-xs text-cn-muted">
          {pluralize(itemCount, "item")}
          {minutes ? ` • ${minutes}` : ""}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-cn-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div id={panelId} className="bg-white border-t border-cn-rule">
          {module.description && (
            <p className="px-5 py-4 text-xs leading-relaxed text-cn-muted whitespace-pre-line border-b border-cn-rule">
              {module.description}
            </p>
          )}
          {itemCount === 0 ? (
            <p className="px-5 py-4 text-xs text-cn-muted">No content has been added to this section yet.</p>
          ) : (
            <ul className="divide-y divide-cn-rule">
              {lessons.map((lesson) => {
                const meta = LESSON_META[lesson.content_type];
                return (
                  <ItemRow
                    key={`lesson-${lesson.id}`}
                    icon={meta?.icon || FileQuestion}
                    title={lesson.title}
                    label={meta?.label || "Lesson"}
                    meta={formatMinutesCompact(lesson.duration_minutes)}
                  />
                );
              })}
              {assignments.map((assignment) => (
                <ItemRow
                  key={`assignment-${assignment.id}`}
                  icon={ClipboardList}
                  title={assignment.title}
                  label="Assignment"
                  meta={assignment.total_marks != null ? `${assignment.total_marks} marks` : null}
                />
              ))}
              {quizzes.map((quiz) => (
                <ItemRow
                  key={`quiz-${quiz.id}`}
                  icon={ListChecks}
                  title={quiz.title}
                  label="Quiz"
                  meta={quiz.time_limit_minutes > 0 ? `${quiz.time_limit_minutes} min` : null}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// "Course content": collapsible sections with a lecture/duration summary and
// an expand-all toggle, like the lesson outline on Udemy.
export default function CourseContentAccordion({ modules, totals }) {
  const [openIds, setOpenIds] = useState(() => new Set(modules[0] ? [modules[0].id] : []));
  const allOpen = modules.length > 0 && openIds.size === modules.length;
  const totalTime = formatMinutesCompact(totals.minutes);

  const toggle = (moduleId) =>
    setOpenIds((previous) => {
      const next = new Set(previous);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });

  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(modules.map((module) => module.id)));

  return (
    <section aria-labelledby="course-content-heading">
      <CourseSectionHeading tone="cobalt" id="course-content-heading">Course content</CourseSectionHeading>

      {modules.length === 0 ? (
        <p className="rounded-cn border border-cn-rule bg-white p-6 text-sm text-cn-muted">
          Learning materials have not been added to this course yet.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-cn-muted">
            <span>
              {pluralize(modules.length, "section")} • {pluralize(totals.lessons, "lesson")}
              {totals.assignments > 0 ? ` • ${pluralize(totals.assignments, "assignment")}` : ""}
              {totals.quizzes > 0 ? ` • ${pluralize(totals.quizzes, "quiz", "quizzes")}` : ""}
              {totalTime ? ` • ${totalTime} total length` : ""}
            </span>
            <button
              type="button"
              onClick={toggleAll}
              className="font-semibold text-cn-accent hover:text-cn-accent-2 transition"
            >
              {allOpen ? "Collapse all sections" : "Expand all sections"}
            </button>
          </div>

          <div className="rounded-cn border border-cn-rule overflow-hidden shadow-cn-1 bg-white">
            {modules.map((module, index) => (
              <ModuleSection
                key={module.id}
                module={module}
                index={index}
                isOpen={openIds.has(module.id)}
                onToggle={() => toggle(module.id)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
