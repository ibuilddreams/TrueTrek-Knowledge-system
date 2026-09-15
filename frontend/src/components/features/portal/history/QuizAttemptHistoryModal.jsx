"use client";

import { CheckCircle2, ListChecks, XCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import { formatDateTime } from "@/lib/adminFormatters";
import { useQuizAttemptMyDetail } from "@/hooks/student/useQuizAttempt";

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes === 0 ? `${remaining}s` : `${minutes}m ${remaining}s`;
}

function SummaryTile({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "rose"
        ? "text-rose-600"
        : "text-ink";
  return (
    <div className="rounded-xl border px-3 py-2.5 border-line bg-porcelain/80">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className={`text-base font-serif font-bold mt-0.5 ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function QuizAttemptHistoryModal({ attemptId, onClose }) {
  const isOpen = Boolean(attemptId);
  const { data, isLoading } = useQuizAttemptMyDetail(attemptId, { enabled: isOpen });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={ListChecks}
      title={data ? data.quiz.title : "Attempt detail"}
      subtitle={data ? `Attempt ${data.attempt_number} · ${data.status}` : ""}
      maxWidth="max-w-2xl"
    >
      {isLoading && <Loader fullScreen={false} label="Loading attempt..." />}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <SummaryTile
              label="Score"
              value={data.score !== null ? `${data.score}/${data.total_marks}` : "—"}
            />
            <SummaryTile
              label="Percentage"
              value={data.percentage !== null ? `${data.percentage}%` : "—"}
              tone={data.is_passed ? "emerald" : "rose"}
            />
            <SummaryTile
              label="Time taken"
              value={formatDuration(data.time_taken_seconds)}
            />
            <SummaryTile
              label="Result"
              value={data.is_passed === null ? "Pending" : data.is_passed ? "Passed" : "Failed"}
              tone={data.is_passed === null ? "neutral" : data.is_passed ? "emerald" : "rose"}
            />
          </div>

          <p className="text-xs font-mono uppercase tracking-wider text-muted">
            Submitted {formatDateTime(data.ended_at)}
          </p>

          <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {data.questions.map((question, index) => (
              <li
                key={question.id}
                className="rounded-xl border p-4 border-line"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold text-ink">
                    {index + 1}. {question.text}
                  </p>
                  <span className="text-[11px] font-mono uppercase shrink-0 text-muted">
                    {question.marks_awarded !== null
                      ? `${question.marks_awarded}/${question.marks} marks`
                      : `${question.marks} marks`}
                  </span>
                </div>

                {question.question_type === "SHORT_ANSWER" ? (
                  <div className="space-y-2">
                    <p className="text-sm border rounded-lg p-3 whitespace-pre-wrap text-muted bg-porcelain border-line">
                      {question.text_answer || "No answer provided."}
                    </p>
                    <span
                      className={`inline-block text-[11px] font-mono uppercase tracking-wider ${
                        question.grading_status === "PENDING_GRADING"
                          ? "text-gold"
                          : "text-emerald-700"
                      }`}
                    >
                      {question.grading_status === "PENDING_GRADING"
                        ? "Pending grading"
                        : "Graded"}
                    </span>
                    {question.feedback ? (
                      <p className="text-xs font-light text-muted">
                        {question.feedback}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {question.choices.map((choice) => (
                      <li
                        key={choice.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                          choice.is_correct
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : choice.is_selected
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-line bg-porcelain/60 text-muted"
                        }`}
                      >
                        {choice.is_correct && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        {!choice.is_correct && choice.is_selected && (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="flex-1">{choice.text}</span>
                        {choice.is_selected && (
                          <span className="text-[10px] font-mono uppercase tracking-wider shrink-0">
                            Selected
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
