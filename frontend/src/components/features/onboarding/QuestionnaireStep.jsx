"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, ClipboardList, RefreshCw } from "lucide-react";
import { getQuestionnaireQuestions, submitQuestionnaireAnswers } from "@/services/onboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import QuestionnaireQuestion from "./QuestionnaireQuestion";

// Single-select questions advance on their own so the flow feels like a
// conversation rather than a form; the delay lets the selected state land
// before the next question slides in.
const AUTO_ADVANCE_DELAY_MS = 320;

export default function QuestionnaireStep({ answers, onAnswersChange, onContinue }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const advanceTimer = useRef(null);

  const {
    data: questions = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["onboarding-questions"],
    queryFn: async () => {
      const response = await getQuestionnaireQuestions();
      return response?.data || [];
    },
  });

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions]
  );

  function isAnswered(question, source = answers) {
    const value = source[question.id];
    if (question.is_multi_select) return Array.isArray(value) && value.length > 0;
    return Boolean(value);
  }

  // If this user already answered (e.g. resuming after a refresh, or backend
  // progress put them back on this step), prefill from the server's record
  // rather than starting blank — runs once per questions load, and never
  // overwrites an answer the user has already changed locally in this
  // session (`answers[question.id] !== undefined` guard). The resume point is
  // the first still-unanswered question, so a returning visitor isn't walked
  // back through questions they already completed.
  const hasPrefilled = useRef(false);
  useEffect(() => {
    if (hasPrefilled.current || sortedQuestions.length === 0) return;
    hasPrefilled.current = true;

    const prefill = {};
    sortedQuestions.forEach((question) => {
      if (answers[question.id] !== undefined) return;
      const savedOptionIds = question.selected_option_ids || [];
      if (savedOptionIds.length === 0) return;
      prefill[question.id] = question.is_multi_select ? savedOptionIds : savedOptionIds[0];
    });

    const merged = { ...answers, ...prefill };
    if (Object.keys(prefill).length > 0) onAnswersChange(merged);

    const firstUnanswered = sortedQuestions.findIndex((q) => !isAnswered(q, merged));
    setCurrentIndex(firstUnanswered === -1 ? sortedQuestions.length - 1 : firstUnanswered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedQuestions]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const totalQuestions = sortedQuestions.length;
  const safeIndex = Math.min(currentIndex, Math.max(0, totalQuestions - 1));
  const currentQuestion = sortedQuestions[safeIndex];
  const isLastQuestion = safeIndex === totalQuestions - 1;

  const answeredCount = sortedQuestions.filter((question) => isAnswered(question)).length;
  const progressPercent = totalQuestions === 0 ? 100 : (answeredCount / totalQuestions) * 100;

  // If, for whatever reason, no questions are configured, don't strand the
  // visitor on an unpassable step — let them through.
  const allAnswered = totalQuestions === 0 || sortedQuestions.every((q) => isAnswered(q));
  const canAdvance = !currentQuestion || isAnswered(currentQuestion);

  function goToIndex(nextIndex) {
    clearTimeout(advanceTimer.current);
    setCurrentIndex(Math.min(Math.max(nextIndex, 0), Math.max(0, totalQuestions - 1)));
  }

  function handleSelect(optionId) {
    clearTimeout(advanceTimer.current);

    if (currentQuestion.is_multi_select) {
      const current = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      onAnswersChange({ ...answers, [currentQuestion.id]: next });
      return;
    }

    onAnswersChange({ ...answers, [currentQuestion.id]: optionId });
    if (!isLastQuestion) {
      advanceTimer.current = setTimeout(
        () => setCurrentIndex((index) => Math.min(index + 1, totalQuestions - 1)),
        AUTO_ADVANCE_DELAY_MS
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isLastQuestion && totalQuestions > 0) {
      if (canAdvance) goToIndex(safeIndex + 1);
      return;
    }

    if (!allAnswered) return;

    if (totalQuestions === 0) {
      onContinue();
      return;
    }

    const payload = sortedQuestions.flatMap((question) => {
      const value = answers[question.id];
      if (question.is_multi_select) {
        return (value || []).map((optionId) => ({ question: question.id, option: optionId }));
      }
      return value ? [{ question: question.id, option: value }] : [];
    });

    setIsSubmitting(true);
    try {
      await submitQuestionnaireAnswers(payload);
      onContinue();
    } catch (submitError) {
      toastError(
        getApiErrorMessage(submitError, "Unable to submit your answers. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader fullScreen={false} label="Loading questionnaire..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="border border-stone-200 bg-white rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold mb-2 text-stone-900">
            Failed to Load Questionnaire
          </h2>
          <p className="text-xs font-light mb-6 text-stone-500">
            {getApiErrorMessage(error, "Unable to load the questionnaire right now.")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-3 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition bg-stone-900 hover:bg-stone-800 text-stone-100"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="bg-white border border-stone-200/85 rounded-2xl shadow-xl relative overflow-hidden p-8 sm:p-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />

        <div className="text-center mb-7">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl border bg-amber-600/10 text-amber-700 border-amber-200/40 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold mb-1.5 text-stone-900">
            Tell Us About Your Goals
          </h2>
          <p className="text-xs font-light leading-relaxed text-stone-500">
            A few quick questions so we can recommend the right learning pathway for you.
          </p>
        </div>

        {totalQuestions > 0 && (
          <div className="mb-7">
            <div className="flex items-center justify-between mb-2 text-[10px] font-mono uppercase tracking-wider">
              <span className="text-stone-400">
                Question {safeIndex + 1} of {totalQuestions}
              </span>
              <span className="text-amber-700 font-bold">
                {Math.round(progressPercent)}% Complete
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-800 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {currentQuestion ? (
            // Keyed on the question so each one animates in as it becomes
            // the active question.
            <div key={currentQuestion.id} className="tt-enter">
              <QuestionnaireQuestion
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onSelect={handleSelect}
              />
            </div>
          ) : (
            <p className="text-center text-xs font-light text-stone-500">
              No questions are configured right now — continue to see your pathway
              recommendations.
            </p>
          )}

          <div className="flex items-center gap-3">
            {safeIndex > 0 && (
              <button
                type="button"
                onClick={() => goToIndex(safeIndex - 1)}
                className="flex items-center justify-center gap-2 border border-stone-200 text-stone-600 hover:bg-stone-50 font-mono text-xs font-bold uppercase tracking-wider py-3.5 px-5 rounded-xl transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={!canAdvance || (isLastQuestion && !allAnswered) || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Submitting..."
                : isLastQuestion || totalQuestions === 0
                  ? "Continue"
                  : "Next Question"}
              {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
