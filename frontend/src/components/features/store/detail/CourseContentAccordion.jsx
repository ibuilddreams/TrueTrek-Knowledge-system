import { Check, Play, Plus, Zap } from "lucide-react";
import { pluralize } from "@/lib/courseOutline";

// The design's `.cdmods`. Native `<details>`, exactly as the design has it:
// the first module open, the rest shut, and the plus turning into a cross on
// open. Nothing here needs React state, so this stays a server component and
// the disclosure keeps working with JavaScript still loading.
const ROW_ICON = { lesson: Play, assignment: Zap, quiz: Check };

function itemsFor(module) {
  // The design lists what a module holds, in the order it shows them: the
  // lessons, then the practice, then the quiz. Real titles go in the design's
  // slots — the mock's generic "Video lessons" line is a placeholder standing
  // in for content it has no backend to read.
  return [
    ...(module.lessons || []).map((lesson) => ({
      key: `lesson-${lesson.id}`,
      kind: "lesson",
      title: lesson.title,
    })),
    ...(module.assignments || []).map((assignment) => ({
      key: `assignment-${assignment.id}`,
      kind: "assignment",
      title: assignment.title,
    })),
    ...(module.quizzes || []).map((quiz) => ({
      key: `quiz-${quiz.id}`,
      kind: "quiz",
      title: quiz.title,
    })),
  ];
}

export default function CourseContentAccordion({ modules = [] }) {
  if (modules.length === 0) {
    return (
      <section aria-labelledby="course-content-heading" className="grid gap-4">
        <h2
          id="course-content-heading"
          className="max-w-[20ch] text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.02em] text-balance text-cn-ink"
        >
          Course content
        </h2>
        <p className="rounded-cn-lg border border-cn-rule p-6 text-cn-sm text-cn-muted">
          Learning materials have not been added to this course yet.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="course-content-heading" className="grid gap-4">
      <h2
        id="course-content-heading"
        className="max-w-[20ch] text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.02em] text-balance text-cn-ink"
      >
        Course content
      </h2>
      <p className="text-cn-ink-2">
        {pluralize(modules.length, "module")}. Each one has video lessons, a
        practice drill and a short quiz in the portal.
      </p>

      <div className="overflow-hidden rounded-cn-lg border border-cn-rule">
        {modules.map((module, index) => {
          const items = itemsFor(module);
          return (
            <details
              key={module.id}
              open={index === 0}
              className="mb-3 rounded-cn border border-cn-rule bg-white transition-shadow duration-[240ms] ease-cn-out open:border-cn-paper-4 open:shadow-cn-2"
            >
              <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 bg-cn-paper-2 px-6 py-4 text-cn-lg leading-[1.55] font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cn-accent [&::-webkit-details-marker]:hidden">
                <span className="text-cn-xs font-semibold text-cn-muted">
                  Module {index + 1}
                </span>
                <b className="min-w-0 font-black">{module.title}</b>
                <span
                  aria-hidden="true"
                  className="cn-accordion-plus grid h-8 w-8 flex-none place-items-center rounded-full bg-cn-paper-3 text-cn-accent"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                </span>
              </summary>

              {items.length === 0 ? (
                <p className="py-3 pr-6 pb-4 pl-24 text-cn-sm text-cn-muted max-[60rem]:pl-6">
                  No content has been added to this module yet.
                </p>
              ) : (
                <ul className="m-0 grid list-none gap-3 py-3 pr-6 pb-4 pl-24 text-cn-sm text-cn-ink-2 max-[60rem]:pl-6">
                  {items.map((item) => {
                    const Icon = ROW_ICON[item.kind];
                    return (
                      <li key={item.key} className="flex items-center gap-3">
                        <Icon
                          aria-hidden="true"
                          className="h-3.5 w-3.5 flex-none text-cn-accent"
                          strokeWidth={item.kind === "quiz" ? 2.4 : 2.2}
                        />
                        <span className="min-w-0">{item.title}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </details>
          );
        })}
      </div>
    </section>
  );
}
