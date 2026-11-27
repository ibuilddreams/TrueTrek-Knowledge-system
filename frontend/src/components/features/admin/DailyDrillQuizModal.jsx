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
      title="Manage quiz"
      subtitle={`${schedule.title} — 1 to ${MAX_QUESTIONS} questions, one correct choice each.`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="border border-cn-p-line rounded-xl p-4 space-y-3 bg-cn-p-page">
            <div className="flex items-start gap-2">
              <input
                type="text"
                value={question.text}
                onChange={(event) => updateQuestionText(questionIndex, event.target.value)}
                disabled={saveMutation.isPending}
                placeholder={`Question ${questionIndex + 1}`}
                className="flex-1 px-3 py-2 bg-cn-p-card border border-cn-p-line focus:border-cn-p-accent focus:outline-none rounded-lg text-sm text-cn-p-ink"
              />
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(questionIndex)}
                  disabled={saveMutation.isPending}
                  className="p-2 text-cn-p-bad hover:bg-cn-p-bad-bg rounded-lg transition"
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
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${ choice.is_correct ? "bg-cn-p-ok border-cn-p-ok" : "border-cn-p-line" }`}
                  >
                    {choice.is_correct && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(event) => updateChoiceText(questionIndex, choiceIndex, event.target.value)}
                    disabled={saveMutation.isPending}
                    placeholder={`Choice ${choiceIndex + 1}`}
                    className="flex-1 px-3 py-1.5 bg-cn-p-card border border-cn-p-line focus:border-cn-p-accent focus:outline-none rounded-lg text-xs text-cn-p-ink"
                  />
                  {question.choices.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeChoice(questionIndex, choiceIndex)}
                      disabled={saveMutation.isPending}
                      className="p-1.5 text-cn-p-ink-2 hover:text-cn-p-bad transition"
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
                className="text-[11px] text-cn-p-accent hover:text-cn-p-accent-hover flex items-center gap-1 pt-1"
              >
                <Plus className="w-3 h-3" />
                Add choice
              </button>
            </div>
          </div>
        ))}

        {error && <p className="text-[11px] text-cn-p-bad">{error}</p>}

        {questions.length < MAX_QUESTIONS && (
          <button
            type="button"
            onClick={addQuestion}
            disabled={saveMutation.isPending}
            className="w-full py-2.5 border-2 border-dashed border-cn-p-line hover:border-cn-p-accent text-cn-p-ink-2 hover:text-cn-p-accent rounded-xl text-xs transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add question
          </button>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-cn-p-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={saveMutation.isPending}
            className="px-4 py-3 bg-transparent hover:bg-cn-p-page text-cn-p-ink text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2"
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
