"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { getStudentAssignments } from "@/services/studentLearningService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/ui/StatusBadge";

function submissionLabel(assignment) {
  if (!assignment.submission) {
    return assignment.is_overdue ? "OVERDUE" : "PENDING";
  }
  return assignment.submission.status;
}

export default function AssignmentsTab() {
  const { data = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["studentAssignments"],
    queryFn: async () => {
      const response = await getStudentAssignments();
      return response?.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading assignments..." />
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
          Failed to Load Assignments
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">
          {getApiErrorMessage(error, "Unable to load your assignments.")}
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
          icon={ClipboardList}
          label="No assignments yet"
          description="Published assignments from your enrolled courses will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-700/80 mb-2">
          Coursework
        </p>
        <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
          Assignments
        </h2>
        <p className="text-sm text-stone-500 font-light mt-1.5">
          Track due dates, submissions, and graded feedback across your courses.
        </p>
      </div>

      <div className="space-y-3">
        {data.map((assignment, index) => (
          <motion.article
            key={assignment.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 truncate">
                  {assignment.course?.title || "Course"}
                  {assignment.module?.title ? ` · ${assignment.module.title}` : ""}
                </p>
                <h3 className="font-serif font-bold text-lg text-stone-900 mt-1 truncate">
                  {assignment.title}
                </h3>
                {assignment.description ? (
                  <p className="text-xs text-stone-500 font-light mt-2 line-clamp-2 leading-relaxed">
                    {assignment.description}
                  </p>
                ) : null}
              </div>
              <StatusBadge status={submissionLabel(assignment)} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                Due {formatDateTime(assignment.due_date) || "—"}
              </span>
              <span>{assignment.total_marks} marks</span>
              {assignment.submission?.marks != null ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Score {assignment.submission.marks}/{assignment.total_marks}
                </span>
              ) : null}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
