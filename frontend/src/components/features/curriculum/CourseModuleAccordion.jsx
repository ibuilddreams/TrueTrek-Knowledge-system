"use client";

import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  FileQuestion,
  FileText,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "@/hooks/useTheme";

const LESSON_TYPE_META = {
  VIDEO: { icon: Video, label: "Video" },
  PDF: { icon: FileText, label: "PDF" },
  DOCUMENT: { icon: FileText, label: "Document" },
  IMAGE: { icon: ImageIcon, label: "Image" },
  TEXT: { icon: FileText, label: "Text" },
  DEFAULT: { icon: FileQuestion, label: "Lesson" },
};

function LessonRow({ lesson, isVault }) {
  const meta = LESSON_TYPE_META[lesson.content_type] || LESSON_TYPE_META.DEFAULT;
  const showCompletion = typeof lesson.is_completed === "boolean";

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
      <span
        className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${
          isVault
            ? "bg-stone-900 text-stone-400 border-stone-700"
            : "bg-stone-50 text-stone-500 border-stone-200"
        }`}
      >
        <meta.icon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[12.5px] font-medium truncate ${
            isVault ? "text-stone-200" : "text-stone-700"
          }`}
        >
          {lesson.title}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
          <span>{meta.label}</span>
          {lesson.duration_minutes ? (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-stone-300 shrink-0" />
              <span>{lesson.duration_minutes}m</span>
            </>
          ) : null}
        </span>
      </span>
      {showCompletion &&
        (lesson.is_completed ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-stone-200 shrink-0" />
        ))}
    </div>
  );
}

function ModuleRow({ module, isExpanded, onToggle, isVault }) {
  const lessons = module.lessons || [];
  const showProgress = typeof module.completion_percentage === "number";

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        isVault ? "border-stone-800 bg-stone-900/40" : "border-stone-200 bg-stone-50/60"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={`w-full text-left p-4 space-y-2 transition-colors ${
          isVault ? "hover:bg-stone-900/70" : "hover:bg-stone-100/70"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              Module {module.order}
            </p>
            <h5
              className={`font-serif font-bold mt-0.5 truncate ${
                isVault ? "text-stone-100" : "text-stone-900"
              }`}
            >
              {module.title}
            </h5>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showProgress && (
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
                  module.is_completed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : isVault
                      ? "bg-stone-800/60 text-stone-400 border-stone-700"
                      : "bg-stone-50 text-stone-500 border-stone-200"
                }`}
              >
                {Math.round(module.completion_percentage || 0)}%
              </span>
            )}
            {lessons.length > 0 &&
              (isExpanded ? (
                <ChevronUp className="w-4 h-4 text-stone-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-400" />
              ))}
          </div>
        </div>

        {module.description ? (
          <p className="text-[11px] text-stone-500 font-light leading-relaxed line-clamp-2">
            {module.description}
          </p>
        ) : null}

        <p className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-stone-400">
          <BookOpen className="w-3 h-3" />
          {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
        </p>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && lessons.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className={`px-2 pb-3 pt-1 space-y-0.5 border-t ${
                isVault ? "border-stone-800" : "border-stone-100"
              }`}
            >
              {lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} isVault={isVault} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseModuleAccordion({ modules }) {
  const { isVault } = useTheme();
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  function toggle(moduleId) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {modules.map((module) => (
        <ModuleRow
          key={module.id}
          module={module}
          isExpanded={expandedIds.has(module.id)}
          onToggle={() => toggle(module.id)}
          isVault={isVault}
        />
      ))}
    </div>
  );
}
