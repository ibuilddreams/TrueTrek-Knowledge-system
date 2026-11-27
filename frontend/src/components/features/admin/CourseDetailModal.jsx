"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  ChevronDown,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  Layers,
  PlayCircle,
  Video,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import { getCourseById } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError } from "@/lib/toast";

const CONTENT_TYPE_ICONS = {
  VIDEO: Video,
  DOCUMENT: FileText,
  PDF: FileText,
};

function LessonRow({ lesson }) {
  const Icon = CONTENT_TYPE_ICONS[lesson.content_type] || FileText;
  const resourceUrl = lesson.content_type === "VIDEO" ? lesson.video_url || lesson.file : lesson.file;

  return (
    <li className="flex items-center gap-3 p-3">
      <div className="w-8 h-8 rounded-lg bg-cn-p-page border border-cn-p-line text-cn-p-ink-2 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-cn-p-ink truncate">{lesson.title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-cn-p-ink-2">
          <span>{lesson.content_type}</span>
          {lesson.duration_minutes != null && (
            <>
              <span className="text-cn-p-ink-2">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {lesson.duration_minutes}m
              </span>
            </>
          )}
        </div>
      </div>

    </li>
  );
}

function AssignmentRow({ assignment }) {
  return (
    <li className="flex items-center gap-3 p-3">
      <div className="w-8 h-8 rounded-lg bg-cn-p-page border border-cn-p-line text-cn-p-ink-2 flex items-center justify-center shrink-0">
        <ClipboardCheck className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-cn-p-ink truncate">{assignment.title}</p>
          <StatusBadge tone="cobalt" size="lg" status={assignment.status} />
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-cn-p-ink-2">
          <span className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(assignment.due_date)}
          </span>
          <span className="text-cn-p-ink-2">·</span>
          <span className="flex items-center gap-1">
            <Award className="w-2.5 h-2.5" />
            {assignment.total_marks} marks
          </span>
        </div>
      </div>
    </li>
  );
}

function QuizRow({ quiz }) {
  return (
    <li className="flex items-center gap-3 p-3">
      <div className="w-8 h-8 rounded-lg bg-cn-p-page border border-cn-p-line text-cn-p-ink-2 flex items-center justify-center shrink-0">
        <HelpCircle className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-cn-p-ink truncate">{quiz.title}</p>
          <StatusBadge tone="cobalt" size="lg" status={quiz.status} />
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-cn-p-ink-2">
          <span>Pass {quiz.passing_score}%</span>
          {quiz.time_limit_minutes ? (
            <>
              <span className="text-cn-p-ink-2">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {quiz.time_limit_minutes}m
              </span>
            </>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function ModuleContentSection({ title, icon: Icon, items, renderItem, emptyLabel }) {
  return (
    <div className="border-t border-cn-p-line">
      <p className="flex items-center gap-1.5 text-[11px] text-cn-p-ink-2 px-3 pt-3">
        <Icon className="w-3 h-3" />
        {title} · {items.length}
      </p>
      {items.length ? (
        <ul className="divide-y divide-cn-p-line">{items.map(renderItem)}</ul>
      ) : (
        <p className="text-xs text-cn-p-ink-2 font-light px-3 py-3">{emptyLabel}</p>
      )}
    </div>
  );
}

function ModuleAccordion({ module, defaultOpen }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const lessons = module.lessons || [];
  const assignments = module.assignments || [];
  const quizzes = module.quizzes || [];

  return (
    <div className="rounded-xl border border-cn-p-line overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 p-3 bg-cn-p-page hover:bg-cn-p-page transition"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="shrink-0 w-6 h-6 rounded-lg bg-cn-p-soft text-cn-p-soft-ink text-[11px] font-bold flex items-center justify-center">
            {module.order ?? 1}
          </span>
          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold text-cn-p-ink truncate">{module.title}</p>
            <p className="text-[11px] text-cn-p-ink-2 mt-0.5">
              {lessons.length} {lessons.length === 1 ? "Lesson" : "Lessons"} · {assignments.length}{" "}
              {assignments.length === 1 ? "Assignment" : "Assignments"} · {quizzes.length}{" "}
              {quizzes.length === 1 ? "Quiz" : "Quizzes"}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-cn-p-ink-2 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div>
          {module.description && (
            <p className="text-sm text-cn-p-ink-2 font-light leading-relaxed px-3 pt-3">{module.description}</p>
          )}

          <ModuleContentSection
            title="Lessons"
            icon={PlayCircle}
            items={lessons}
            renderItem={(lesson) => <LessonRow key={lesson.id} lesson={lesson} />}
            emptyLabel="No lessons in this module yet."
          />

          <ModuleContentSection
            title="Assignments"
            icon={ClipboardCheck}
            items={assignments}
            renderItem={(assignment) => <AssignmentRow key={assignment.id} assignment={assignment} />}
            emptyLabel="No assignments in this module yet."
          />

          <ModuleContentSection
            title="Quizzes"
            icon={HelpCircle}
            items={quizzes}
            renderItem={(quiz) => <QuizRow key={quiz.id} quiz={quiz} />}
            emptyLabel="No quizzes in this module yet."
          />
        </div>
      )}
    </div>
  );
}

export default function CourseDetailModal({ isOpen, onClose, courseId }) {
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !courseId) return;

    let isMounted = true;
    setIsLoading(true);
    setCourse(null);

    (async () => {
      try {
        const response = await getCourseById(courseId);
        if (isMounted) setCourse(response?.data || null);
      } catch (error) {
        if (isMounted) toastError(getApiErrorMessage(error, "Unable to load course details."));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, courseId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={BookOpen} title="Course details" maxWidth="max-w-2xl">
      {isLoading ? (
        <Loader tone="cobalt" fullScreen={false} label="Loading course..." />
      ) : course ? (
        <div className="space-y-4">
          <div className="relative w-full h-40 rounded-lg border border-cn-p-line overflow-hidden">
            {course.image ? (
              <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-cn-p-page flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-cn-p-ink-2" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 via-black/30 to-transparent p-3 flex items-center justify-between gap-3">
              <h4 className="text-base font-bold text-white">{course.title}</h4>
              <StatusBadge tone="cobalt" size="lg" status={course.status} />
            </div>
          </div>
          {course.description && (
            <p className="text-sm text-cn-p-ink-2 font-light leading-relaxed">{course.description}</p>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-cn-p-ink-2 mb-1">Category</p>
              <p className="text-cn-p-ink font-semibold">{course.category?.name || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-cn-p-ink-2 mb-1">Tags</p>
              <p className="text-cn-p-ink font-semibold">
                {course.tags?.length ? course.tags.map((tag) => tag.name).join(", ") : "—"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-cn-p-ink-2 mb-2">Instructors</p>
            {course.instructors?.length ? (
              <ul className="space-y-2">
                {course.instructors.map((instructor) => (
                  <li
                    key={instructor.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-cn-p-line bg-cn-p-page text-sm"
                  >
                    <span className="font-semibold text-cn-p-ink">{instructor.name}</span>
                    <span className="text-cn-p-ink-2">{instructor.email}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-cn-p-ink-2 font-light">No instructors assigned.</p>
            )}
          </div>
          <div>
            <p className="text-[11px] text-cn-p-ink-2 mb-2">Modules &amp; Content</p>
            {course.modules?.length ? (
              <div className="space-y-2">
                {course.modules.map((module, index) => (
                  <ModuleAccordion key={module.id} module={module} defaultOpen={index === 0} />
                ))}
              </div>
            ) : (
              <EmptyState tone="portal" size="lg" icon={Layers} label="No modules yet." compact />
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-cn-p-ink-2 font-light">Course details unavailable.</p>
      )}
    </Modal>
  );
}
