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

// The design's `.kv` cell: a quiet label over the figure it names.
function SummaryTile({ label, value, tone = "neutral" }) {
  const toneClass =
    tone === "emerald"
      ? "text-cn-p-ok"
      : tone === "rose"
        ? "text-cn-p-bad"
        : "text-cn-p-ink";
  return (
    <div className="rounded-cn-p-sm bg-cn-p-page px-3.5 py-3">
      <p className="text-xs text-cn-p-ink-2">{label}</p>
      <p className={`mt-0.5 text-base font-bold tabular-nums ${toneClass}`}>{value}</p>
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
      variant="cobalt"
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

          <p className="text-sm text-cn-p-ink-2">
            Submitted {formatDateTime(data.ended_at)}
          </p>

          <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {data.questions.map((question, index) => (
              <li
                key={question.id}
                className="rounded-cn-p-sm border border-cn-p-line p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm font-semibold text-cn-p-ink">
                    {index + 1}. {question.text}
                  </p>
                  <span className="shrink-0 text-xs tabular-nums text-cn-p-ink-2">
                    {question.marks_awarded !== null
                      ? `${question.marks_awarded}/${question.marks} marks`
                      : `${question.marks} marks`}
                  </span>
                </div>

                {question.question_type === "SHORT_ANSWER" ? (
                  <div className="space-y-2">
                    <p className="rounded-cn-p-sm border border-cn-p-line bg-cn-p-page p-3 text-sm whitespace-pre-wrap text-cn-p-ink-2">
                      {question.text_answer || "No answer provided."}
                    </p>
                    <span
                      className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${
                        question.grading_status === "PENDING_GRADING"
                          ? "bg-cn-p-warn-bg text-cn-p-warn"
                          : "bg-cn-p-ok-bg text-cn-p-ok"
                      }`}
                    >
                      {question.grading_status === "PENDING_GRADING"
                        ? "Pending grading"
                        : "Graded"}
                    </span>
                    {question.feedback ? (
                      <p className="text-sm text-cn-p-ink-2">
                        {question.feedback}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {question.choices.map((choice) => (
                      <li
                        key={choice.id}
                        className={`flex items-center gap-2 rounded-cn-p-sm border px-3 py-2 text-sm ${
                          choice.is_correct
                            ? "border-transparent bg-cn-p-ok-bg text-cn-p-ok"
                            : choice.is_selected
                              ? "border-transparent bg-cn-p-bad-bg text-cn-p-bad"
                              : "border-cn-p-line bg-cn-p-page text-cn-p-ink-2"
                        }`}
                      >
                        {choice.is_correct && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        {!choice.is_correct && choice.is_selected && (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="flex-1">{choice.text}</span>
                        {choice.is_selected && (
                          <span className="shrink-0 text-xs font-semibold">
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
