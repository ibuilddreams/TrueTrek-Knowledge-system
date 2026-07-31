"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CircleHelp,
  Clock,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { getStudentQuizzes } from "@/services/studentLearningService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/ui/StatusBadge";

function quizStatus(quiz) {
  if (quiz.latest_attempt?.is_passed) return "PASSED";
  if (quiz.latest_attempt?.status === "GRADED") return "GRADED";
  if (quiz.latest_attempt?.status === "SUBMITTED") return "SUBMITTED";
  if (quiz.latest_attempt?.status === "IN_PROGRESS") return "IN PROGRESS";
  if (!quiz.is_available) return "CLOSED";
  return "AVAILABLE";
}

export default function QuizzesTab() {
  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["studentQuizzes"],
    queryFn: async () => {
      const response = await getStudentQuizzes();
      return response?.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading quizzes..." />
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
          Failed to Load Quizzes
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">
          {getApiErrorMessage(error, "Unable to load your quizzes.")}
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

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
        <EmptyState
          icon={CircleHelp}
          label="No quizzes yet"
          description="Published quizzes from your enrolled courses will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-700/80 mb-2">
          Assessments
        </p>
        <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Quizzes
        </h2>
        <p className="text-sm text-stone-500 font-light mt-1.5">
          See available quizzes, attempts used, and your latest results.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((quiz, index) => (
          <motion.article
            key={quiz.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 truncate">
                  {quiz.course?.title || "Course"}
                </p>
                <h3 className="font-serif font-bold text-lg text-stone-900 mt-1 truncate">
                  {quiz.title}
                </h3>
              </div>
              <StatusBadge status={quizStatus(quiz)} />
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                {quiz.time_limit_minutes
                  ? `${quiz.time_limit_minutes} min`
                  : "No time limit"}
              </span>
              <span>
                Attempts {quiz.attempts_used}/{quiz.attempts_allowed}
              </span>
              <span>Pass {quiz.passing_score}%</span>
              {quiz.latest_attempt?.percentage != null ? (
                <span className="text-amber-800 font-medium">
                  Latest {Math.round(quiz.latest_attempt.percentage)}%
                </span>
              ) : null}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
