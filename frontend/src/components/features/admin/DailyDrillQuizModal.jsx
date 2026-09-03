"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, HelpCircle, Plus, Trash2, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { saveAdminDrillQuiz } from "@/services/dailyDrillService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const MAX_QUESTIONS = 5;

function emptyQuestion() {
  return {
    text: "",
    choices: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
    ],
  };
}

function questionsFromSchedule(schedule) {
  if (!schedule?.quiz_questions?.length) return [emptyQuestion()];
  return schedule.quiz_questions.map((question) => ({
    text: question.text,
    choices: question.choices.map((choice) => ({ text: choice.text, is_correct: choice.is_correct })),
  }));
}

export default function DailyDrillQuizModal({ isOpen, onClose, onSaved, schedule }) {
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload) => saveAdminDrillQuiz(schedule.id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-daily-drills"] }),
  });

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setQuestions(questionsFromSchedule(schedule));
  }, [isOpen, schedule]);

  const handleClose = () => {
    if (saveMutation.isPending) return;
    onClose();
  };

  const updateQuestionText = (index, text) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, text } : q)));
  };

  const updateChoiceText = (questionIndex, choiceIndex, text) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? { ...q, choices: q.choices.map((c, ci) => (ci === choiceIndex ? { ...c, text } : c)) }
          : q,
      ),
    );
  };

  const setCorrectChoice = (questionIndex, choiceIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === questionIndex
          ? { ...q, choices: q.choices.map((c, ci) => ({ ...c, is_correct: ci === choiceIndex })) }
          : q,
      ),
    );
  };

  const addChoice = (questionIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === questionIndex ? { ...q, choices: [...q.choices, { text: "", is_correct: false }] } : q)),
    );
  };

  const removeChoice = (questionIndex, choiceIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === questionIndex ? { ...q, choices: q.choices.filter((_, ci) => ci !== choiceIndex) } : q)),
    );
  };

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) return;
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    for (const question of questions) {
      if (!question.text.trim()) {
        setError("Every question needs text.");
        return;
      }
      if (question.choices.length < 2) {
        setError("Every question needs at least 2 choices.");
        return;
      }
      if (question.choices.some((choice) => !choice.text.trim())) {
        setError("Every choice needs text.");
        return;
      }
      if (question.choices.filter((choice) => choice.is_correct).length !== 1) {
        setError("Every question needs exactly one correct choice.");
        return;
      }
    }

    try {
      const response = await saveMutation.mutateAsync(
        questions.map((q) => ({
          text: q.text.trim(),
          choices: q.choices.map((c) => ({ text: c.text.trim(), is_correct: c.is_correct })),
        })),
      );
      toastSuccess(response?.message || "Quiz saved successfully.");
      onSaved?.();
      handleClose();
    } catch (err) {
      toastError(getApiErrorMessage(err, "Unable to save the quiz."));
    }
  };

  if (!schedule) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={HelpCircle}
      title="Manage Quiz"
      subtitle={`${schedule.title} — 1 to ${MAX_QUESTIONS} questions, one correct choice each.`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="border border-stone-200 rounded-xl p-4 space-y-3 bg-stone-50/60">
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={question.text}
                onChange={(event) => updateQuestionText(questionIndex, event.target.value)}
                disabled={saveMutation.isPending}
                placeholder={`Question ${questionIndex + 1}`}
                className="flex-1 px-3 py-2 bg-white border border-stone-200 focus:border-amber-600 focus:outline-none rounded-lg text-sm font-mono text-stone-800"
              />
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(questionIndex)}
                  disabled={saveMutation.isPending}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                  aria-label="Remove question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-2 pl-2">
              {question.choices.map((choice, choiceIndex) => (
                <div key={choiceIndex} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectChoice(questionIndex, choiceIndex)}
                    disabled={saveMutation.isPending}
                    title="Mark as correct"
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      choice.is_correct ? "bg-emerald-500 border-emerald-500" : "border-stone-300"
                    }`}
                  >
                    {choice.is_correct && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(event) => updateChoiceText(questionIndex, choiceIndex, event.target.value)}
                    disabled={saveMutation.isPending}
                    placeholder={`Choice ${choiceIndex + 1}`}
                    className="flex-1 px-3 py-1.5 bg-white border border-stone-200 focus:border-amber-600 focus:outline-none rounded-lg text-xs font-mono text-stone-800"
                  />
                  {question.choices.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeChoice(questionIndex, choiceIndex)}
                      disabled={saveMutation.isPending}
                      className="p-1.5 text-stone-400 hover:text-rose-500 transition"
                      aria-label="Remove choice"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addChoice(questionIndex)}
                disabled={saveMutation.isPending}
                className="text-[11px] font-mono uppercase tracking-wider text-amber-700 hover:text-amber-800 flex items-center gap-1 pt-1"
              >
                <Plus className="w-3 h-3" />
                Add Choice
              </button>
            </div>
          </div>
        ))}

        {error && <p className="text-[11px] font-mono text-red-600">{error}</p>}

        {questions.length < MAX_QUESTIONS && (
          <button
            type="button"
            onClick={addQuestion}
            disabled={saveMutation.isPending}
            className="w-full py-2.5 border-2 border-dashed border-stone-300 hover:border-amber-400 text-stone-500 hover:text-amber-700 rounded-xl text-xs font-mono uppercase tracking-wider transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Question
          </button>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={saveMutation.isPending}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2"
          >
            {saveMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Quiz"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
