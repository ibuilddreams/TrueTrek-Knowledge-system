"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";
import { getQuestionnaireQuestions, submitQuestionnaireAnswers } from "@/services/onboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import Loader from "@/components/ui/Loader";

export default function QuestionnaireStep({ answers, onAnswersChange, onContinue }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  // If this user already answered (e.g. resuming after a refresh, or backend
  // progress put them back on this step), prefill from the server's record
  // rather than starting blank — runs once per questions load, and never
  // overwrites an answer the user has already changed locally in this
  // session (`answers[question.id] !== undefined` guard).
  const hasPrefilled = useRef(false);
  useEffect(() => {
    if (hasPrefilled.current || questions.length === 0) return;
    hasPrefilled.current = true;

    const prefill = {};
    questions.forEach((question) => {
      if (answers[question.id] !== undefined) return;
      const savedOptionIds = question.selected_option_ids || [];
      if (savedOptionIds.length === 0) return;
      prefill[question.id] = question.is_multi_select ? savedOptionIds : savedOptionIds[0];
    });

    if (Object.keys(prefill).length > 0) {
      onAnswersChange({ ...answers, ...prefill });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  function handleSingleSelect(questionId, optionId) {
    onAnswersChange({ ...answers, [questionId]: optionId });
  }

  function handleMultiToggle(questionId, optionId) {
    const current = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    onAnswersChange({ ...answers, [questionId]: next });
  }

  function isQuestionAnswered(question) {
    const value = answers[question.id];
    if (question.is_multi_select) return Array.isArray(value) && value.length > 0;
    return Boolean(value);
  }

  // If, for whatever reason, no questions are configured, don't strand the
  // visitor on an unpassable step — let them through.
  const allAnswered =
    sortedQuestions.length === 0 || sortedQuestions.every(isQuestionAnswered);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!allAnswered) return;

    if (sortedQuestions.length === 0) {
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

        <div className="text-center mb-8">
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {sortedQuestions.map((question) => {
            const sortedOptions = [...(question.options || [])].sort(
              (a, b) => a.order - b.order
            );

            return (
              <fieldset key={question.id} className="space-y-3">
                <legend className="text-sm font-serif font-bold text-stone-900 mb-1">
                  {question.text}
                </legend>
                <div className="space-y-2">
                  {sortedOptions.map((option) => {
                    const checked = question.is_multi_select
                      ? Array.isArray(answers[question.id]) &&
                        answers[question.id].includes(option.id)
                      : answers[question.id] === option.id;

                    return (
                      <label
                        key={option.id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-mono cursor-pointer transition ${
                          checked
                            ? "border-amber-600 bg-amber-50 text-stone-900"
                            : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300"
                        }`}
                      >
                        <input
                          type={question.is_multi_select ? "checkbox" : "radio"}
                          name={`onboarding-question-${question.id}`}
                          checked={checked}
                          onChange={() =>
                            question.is_multi_select
                              ? handleMultiToggle(question.id, option.id)
                              : handleSingleSelect(question.id, option.id)
                          }
                          className="accent-amber-600 w-3.5 h-3.5"
                        />
                        {option.text}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <button
            type="submit"
            disabled={!allAnswered || isSubmitting}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
