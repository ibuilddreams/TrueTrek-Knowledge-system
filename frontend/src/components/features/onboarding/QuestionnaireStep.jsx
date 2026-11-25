"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getQuestionnaireQuestions, submitQuestionnaireAnswers } from "@/services/onboardingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import { CN_BTN_PRIMARY, CN_BTN_SECONDARY } from "@/components/ui/cobaltStyles";
import QuestionnaireQuestion from "./QuestionnaireQuestion";
import OnboardingErrorPanel from "./OnboardingErrorPanel";

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
      <div className="flex min-h-[320px] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} tone="cobalt" label="Loading questionnaire..." />
      </div>
    );
  }

  if (isError) {
    return (
      <OnboardingErrorPanel
        title="We couldn't load the questions."
        message={getApiErrorMessage(error, "Unable to load the questionnaire right now.")}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <>
      <div>
        <h2 className="text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink">
          Tell us where you are.
        </h2>
        <p className="mt-2 text-cn-ink-2">
          A few quick questions, so we can point you at the right pathway.
        </p>
      </div>

      {totalQuestions > 0 && (
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between text-cn-sm">
            <span className="text-cn-muted">
              Question {safeIndex + 1} of {totalQuestions}
            </span>
            <span className="font-semibold text-cn-accent">
              {Math.round(progressPercent)}% answered
            </span>
          </div>
          {/* The design's `.steps` bar — one segment per question, filled as
              far as the visitor has got. The continuous bar at the top of the
              card is the wizard's own five steps, so this one is deliberately
              a different shape. */}
          <div className="flex items-center gap-2" aria-hidden="true">
            {sortedQuestions.map((question, index) => (
              <i
                key={question.id}
                className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                  index <= safeIndex ? "bg-cn-accent" : "bg-cn-rule"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-8">
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
          <p className="text-cn-ink-2">
            No questions are set up right now — continue to see your pathway
            recommendations.
          </p>
        )}

        <div className="flex items-center gap-3">
          {safeIndex > 0 && (
            <button
              type="button"
              onClick={() => goToIndex(safeIndex - 1)}
              className={CN_BTN_SECONDARY}
            >
              <ArrowLeft className="h-[18px] w-[18px]" />
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={!canAdvance || (isLastQuestion && !allAnswered) || isSubmitting}
            className={`${CN_BTN_PRIMARY} flex-1`}
          >
            {isSubmitting
              ? "Submitting..."
              : isLastQuestion || totalQuestions === 0
                ? "Continue"
                : "Next question"}
            {!isSubmitting && <ArrowRight className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </form>
    </>
  );
}
