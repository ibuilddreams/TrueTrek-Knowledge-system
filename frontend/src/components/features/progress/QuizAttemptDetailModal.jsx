"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ListChecks, XCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { getQuizAttemptDetail, gradeQuizAnswer } from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const ATTEMPT_STATUS_NOTES = {
  EXPIRED: "This attempt ended automatically once its time limit ran out.",
  ABANDONED: "The student never submitted this attempt — it was auto-closed after a long period of inactivity.",
};

export default function QuizAttemptDetailModal({ attemptId, onClose, courseId }) {
  const queryClient = useQueryClient();
  const [gradingAnswerId, setGradingAnswerId] = useState(null);
  const [marksAwarded, setMarksAwarded] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState("");

  const detailQuery = useQuery({
    queryKey: ["quiz-attempt-detail", attemptId],
    queryFn: async () => {
      const response = await getQuizAttemptDetail(attemptId);
      return response?.data;
    },
    enabled: Boolean(attemptId),
  });

  const gradeAnswerMutation = useMutation({
    mutationFn: () =>
      gradeQuizAnswer(gradingAnswerId, {
        marks_awarded: Number(marksAwarded),
        feedback: answerFeedback,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempt-detail", attemptId] });
      queryClient.invalidateQueries({ queryKey: ["quiz-course-progress", courseId] });
      queryClient.invalidateQueries({ queryKey: ["quiz-student-attempts"] });
      toastSuccess(response?.message || "Answer graded successfully.");
      setGradingAnswerId(null);
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to grade answer."));
    },
  });

  const data = detailQuery.data;

  return (
    <Modal
      isOpen={Boolean(attemptId)}
      onClose={onClose}
      icon={ListChecks}
      title="Attempt Detail"
      subtitle={
        data ? `${data.student.name} · ${data.quiz.title} · Attempt ${data.attempt_number}` : ""
      }
      maxWidth="max-w-2xl"
    >
      {detailQuery.isLoading && <p className="text-xs text-stone-400">Loading...</p>}
      {data && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
            <StatusBadge status={data.status} />
            <span
              className={`font-bold ${data.is_passed ? "text-emerald-700" : "text-rose-600"}`}
            >
              {data.percentage !== null ? `${data.percentage}% Score` : "Not fully graded yet"}
            </span>
            <span className="text-stone-400">Passing: {data.quiz.passing_score}%</span>
          </div>
          {ATTEMPT_STATUS_NOTES[data.status] ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {ATTEMPT_STATUS_NOTES[data.status]}
            </p>
          ) : null}

          <ul className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {data.questions.map((question, index) => (
              <li key={question.id} className="rounded-xl border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-xs font-semibold text-stone-800">
                    {index + 1}. {question.text}
                  </p>
                  <span className="text-[10px] font-mono uppercase text-stone-400 shrink-0">
                    {question.marks} marks
                  </span>
                </div>

                {question.question_type === "SHORT_ANSWER" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-stone-600 bg-stone-50 border border-stone-100 rounded-lg p-3 whitespace-pre-wrap">
                      {question.text_answer || "No answer provided."}
                    </p>
                    {gradingAnswerId === question.answer_id ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          gradeAnswerMutation.mutate();
                        }}
                        className="flex flex-col sm:flex-row sm:items-end gap-2"
                      >
                        <div className="flex-1">
                          <label className="text-[10px] font-mono uppercase text-stone-450 block mb-1">
                            Marks (of {question.marks})
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={question.marks}
                            value={marksAwarded}
                            onChange={(event) => setMarksAwarded(event.target.value)}
                            required
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-lg text-xs font-mono transition"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] font-mono uppercase text-stone-450 block mb-1">
                            Feedback
                          </label>
                          <input
                            type="text"
                            value={answerFeedback}
                            onChange={(event) => setAnswerFeedback(event.target.value)}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-lg text-xs font-mono transition"
                          />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="submit"
                            disabled={gradeAnswerMutation.isPending}
                            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-[10px] font-mono font-semibold uppercase tracking-wider rounded-lg transition cursor-pointer"
                          >
                            {gradeAnswerMutation.isPending ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setGradingAnswerId(null)}
                            className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-700 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider ${
                            question.grading_status === "PENDING_GRADING"
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {question.marks_awarded !== null
                            ? `${question.marks_awarded}/${question.marks} marks`
                            : "Pending grading"}
                        </span>
                        {question.answer_id !== null ? (
                          <button
                            type="button"
                            onClick={() => {
                              setGradingAnswerId(question.answer_id);
                              setMarksAwarded(question.marks_awarded ?? "");
                              setAnswerFeedback(question.feedback || "");
                            }}
                            className="text-[11px] font-mono font-semibold text-amber-700 hover:text-amber-900 transition cursor-pointer"
                          >
                            {question.marks_awarded !== null ? "Edit Grade" : "Grade"}
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-stone-300">No answer recorded</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {question.choices.map((choice) => (
                      <li
                        key={choice.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                          choice.is_correct
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : choice.is_selected
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-stone-100 bg-stone-50/60 text-stone-600"
                        }`}
                      >
                        {choice.is_correct && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        {!choice.is_correct && choice.is_selected && (
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="flex-1">{choice.text}</span>
                        {choice.is_selected && (
                          <span className="text-[9px] font-mono uppercase tracking-wider shrink-0">
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
