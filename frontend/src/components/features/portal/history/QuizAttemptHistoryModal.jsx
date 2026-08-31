"use client";

import { CheckCircle2, ListChecks, XCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import { formatDateTime } from "@/lib/adminFormatters";
import { useQuizAttemptMyDetail } from "@/hooks/student/useQuizAttempt";
import { useTheme } from "@/hooks/useTheme";

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes === 0 ? `${remaining}s` : `${minutes}m ${remaining}s`;
}

function SummaryTile({ label, value, tone = "neutral", isVault }) {
  const toneClass =
    tone === "emerald"
      ? isVault
        ? "text-emerald-400"
        : "text-emerald-700"
      : tone === "rose"
        ? isVault
          ? "text-rose-400"
          : "text-rose-600"
        : isVault
          ? "text-stone-50"
          : "text-stone-900";
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        isVault ? "border-stone-800 bg-white/5" : "border-stone-100 bg-stone-50/80"
      }`}
    >
      <p className={`text-[10px] font-mono uppercase tracking-wider ${isVault ? "text-stone-500" : "text-stone-400"}`}>
        {label}
      </p>
      <p className={`text-base font-serif font-bold mt-0.5 ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function QuizAttemptHistoryModal({ attemptId, onClose }) {
  const { isVault } = useTheme();
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
              isVault={isVault}
            />
            <SummaryTile
              label="Percentage"
              value={data.percentage !== null ? `${data.percentage}%` : "—"}
              tone={data.is_passed ? "emerald" : "rose"}
              isVault={isVault}
            />
            <SummaryTile
              label="Time taken"
              value={formatDuration(data.time_taken_seconds)}
              isVault={isVault}
            />
            <SummaryTile
              label="Result"
              value={data.is_passed === null ? "Pending" : data.is_passed ? "Passed" : "Failed"}
              tone={data.is_passed === null ? "neutral" : data.is_passed ? "emerald" : "rose"}
              isVault={isVault}
            />
          </div>

          <p className={`text-xs font-mono uppercase tracking-wider ${isVault ? "text-stone-500" : "text-stone-400"}`}>
            Submitted {formatDateTime(data.ended_at)}
          </p>

          <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {data.questions.map((question, index) => (
              <li
                key={question.id}
                className={`rounded-xl border p-4 ${isVault ? "border-stone-800" : "border-stone-200"}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className={`text-sm font-semibold ${isVault ? "text-stone-200" : "text-stone-800"}`}>
                    {index + 1}. {question.text}
                  </p>
                  <span
                    className={`text-[11px] font-mono uppercase shrink-0 ${
                      isVault ? "text-stone-500" : "text-stone-400"
                    }`}
                  >
                    {question.marks_awarded !== null
                      ? `${question.marks_awarded}/${question.marks} marks`
                      : `${question.marks} marks`}
                  </span>
                </div>

                {question.question_type === "SHORT_ANSWER" ? (
                  <div className="space-y-2">
                    <p
                      className={`text-sm border rounded-lg p-3 whitespace-pre-wrap ${
                        isVault
                          ? "text-stone-300 bg-white/5 border-stone-800"
                          : "text-stone-600 bg-stone-50 border-stone-100"
                      }`}
                    >
                      {question.text_answer || "No answer provided."}
                    </p>
                    <span
                      className={`inline-block text-[11px] font-mono uppercase tracking-wider ${
                        question.grading_status === "PENDING_GRADING"
                          ? isVault
                            ? "text-amber-400"
                            : "text-amber-700"
                          : isVault
                            ? "text-emerald-400"
                            : "text-emerald-700"
                      }`}
                    >
                      {question.grading_status === "PENDING_GRADING"
                        ? "Pending grading"
                        : "Graded"}
                    </span>
                    {question.feedback ? (
                      <p className={`text-xs font-light ${isVault ? "text-stone-400" : "text-stone-500"}`}>
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
                            ? isVault
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : choice.is_selected
                              ? isVault
                                ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                              : isVault
                                ? "border-stone-800 bg-white/5 text-stone-400"
                                : "border-stone-100 bg-stone-50/60 text-stone-600"
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
