"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ClipboardList,
  CircleHelp,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { getStudentGrades } from "@/services/studentLearningService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

export default function GradesTab() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["studentGrades"],
    queryFn: async () => {
      const response = await getStudentGrades();
      return response?.data || null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading grades..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
          Failed to Load Grades
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">
          {getApiErrorMessage(error, "Unable to load your grades.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary || {};
  const entries = data?.entries || [];

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
        <EmptyState
          icon={TrendingUp}
          label="No grades yet"
          description="Graded quizzes and assignments will show up here once results are available."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-700/80 mb-2">
          Performance
        </p>
        <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Grades
        </h2>
        <p className="text-sm text-stone-500 font-light mt-1.5">
          Your graded quiz and assignment results in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Overall average",
            value: `${Math.round(summary.overall_average || 0)}%`,
          },
          {
            label: "Quiz average",
            value: `${Math.round(summary.quiz_average || 0)}%`,
          },
          {
            label: "Assignment average",
            value: `${Math.round(summary.assignment_average || 0)}%`,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-stone-200/80 bg-white px-4 py-4"
          >
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              {item.label}
            </p>
            <p className="text-2xl font-serif font-bold text-stone-900 mt-1.5">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {entries.map((entry, index) => (
          <motion.article
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl border border-stone-200 bg-stone-50 text-stone-600 flex items-center justify-center shrink-0">
                {entry.type === "QUIZ" ? (
                  <CircleHelp className="w-4 h-4" />
                ) : (
                  <ClipboardList className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                  {entry.type} · {entry.course?.title || "Course"}
                </p>
                <h3 className="font-serif font-bold text-stone-900 mt-0.5 truncate">
                  {entry.title}
                </h3>
                <p className="text-[11px] text-stone-400 mt-1">
                  Graded {formatDate(entry.graded_at)}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-serif font-bold text-amber-800">
                {Math.round(entry.percentage || 0)}%
              </p>
              {entry.total_marks != null ? (
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {entry.score}/{entry.total_marks}
                </p>
              ) : null}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
