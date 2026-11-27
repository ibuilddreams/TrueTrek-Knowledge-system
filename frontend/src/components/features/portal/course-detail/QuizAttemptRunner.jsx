"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Timer } from "lucide-react";
import { useAutosaveQuizAttempt } from "@/hooks/student/useQuizAttempt";
import { PortalButton, PortalPill } from "../shell/PortalUI";

const CHOICE_KEYS = "ABCDEFGH";

const AUTOSAVE_DEBOUNCE_MS = 2000;

// How long a picked answer stays on screen before the next question replaces
// it. Long enough to see which option took the highlight — answering and
// having the screen change in the same instant reads as a misclick — and short
// enough that it never feels like waiting.
const AUTO_ADVANCE_DELAY_MS = 450;

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function buildInitialAnswers(savedAnswers) {
  const initial = {};
  (savedAnswers || []).forEach((item) => {
    const hasChoice = item.selected_choice !== null && item.selected_choice !== undefined;
    const hasText = Boolean(item.text_answer && item.text_answer.trim());
    if (!hasChoice && !hasText) return;
    initial[item.question] = {
      selectedChoice: item.selected_choice ?? undefined,
      textAnswer: item.text_answer ?? "",
    };
  });
  return initial;
}

function buildAnswersPayload(answers) {
  return {
    answers: Object.entries(answers).map(([questionId, answer]) => ({
      question: Number(questionId),
      selected_choice: answer.selectedChoice ?? null,
      text_answer: answer.textAnswer ?? "",
    })),
  };
}

export default function QuizAttemptRunner({ attempt, isSubmitting, onSubmit }) {
  const questions = attempt.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => buildInitialAnswers(attempt.saved_answers));
  const timeLimitMinutes = attempt.quiz?.time_limit_minutes || 0;
  const [secondsLeft, setSecondsLeft] = useState(
    attempt.seconds_remaining ?? (timeLimitMinutes > 0 ? timeLimitMinutes * 60 : null)
  );

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const isAiGradedShortAnswer =
    attempt.quiz?.short_answer_grading_mode === "AI" &&
    questions.some((question) => question.question_type === "SHORT_ANSWER");

  const autosaveMutation = useAutosaveQuizAttempt();
  const answersRef = useRef(answers);
  const autosaveTimeoutRef = useRef(null);
  const skipNextAutosaveRef = useRef(true);
  const advanceTimerRef = useRef(null);
  // Questions this will not carry the student forward from. Answering moves
  // you on once; coming back to change an answer never does, because a student
  // who navigated back deliberately is reviewing, and throwing them forward
  // again fights them for control of the screen.
  //
  // Seeded with everything a resumed attempt already had answers for, for the
  // same reason: somebody picking their half-finished quiz back up is looking
  // over what they did last time, and correcting an old answer must not launch
  // them down the paper.
  const autoAdvancedRef = useRef(new Set(Object.keys(answers).map(Number)));

  function cancelPendingAdvance() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }

  // Every deliberate move between questions goes through here, so a pending
  // auto-advance can never land after the student has already moved
  // themselves — answering and immediately pressing Previous would otherwise
  // bounce them forward a moment later.
  function goToQuestion(index) {
    cancelPendingAdvance();
    setCurrentIndex(Math.min(Math.max(index, 0), questions.length - 1));
  }

  // Takes no index: it is only ever called for the question on screen, and its
  // call site sits inside the choices' `.map`, where `index` already means the
  // choice's position. Reading `currentIndex` here removes the chance of
  // handing it the wrong one.
  function selectChoice(question, choiceId) {
    setAnswer(question.id, { selectedChoice: choiceId });

    const isLastQuestion = currentIndex >= questions.length - 1;
    if (isLastQuestion || autoAdvancedRef.current.has(question.id)) return;

    // Re-armed rather than ignored when a second choice is picked inside the
    // window, so changing your mind resets the pause instead of being
    // overtaken by the first pick's timer.
    cancelPendingAdvance();
    advanceTimerRef.current = setTimeout(() => {
      advanceTimerRef.current = null;
      autoAdvancedRef.current.add(question.id);
      setCurrentIndex((current) => Math.min(questions.length - 1, current + 1));
    }, AUTO_ADVANCE_DELAY_MS);
  }

  useEffect(() => cancelPendingAdvance, []);

  function buildPayload() {
    return buildAnswersPayload(answers);
  }

  function autosaveNow(sourceAnswers, options) {
    if (Object.keys(sourceAnswers).length === 0) return;
    autosaveMutation.mutate({
      attemptId: attempt.attempt_id,
      payload: buildAnswersPayload(sourceAnswers),
      ...options,
    });
  }

  useEffect(() => {
    answersRef.current = answers;
    // The very first render just seeds state from the server — nothing to save yet.
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return undefined;
    }
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      autosaveNow(answers);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(autosaveTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  useEffect(() => {
    function saveBeforeLeaving() {
      autosaveNow(answersRef.current, { keepalive: true });
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") saveBeforeLeaving();
    }
    window.addEventListener("pagehide", saveBeforeLeaving);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", saveBeforeLeaving);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Also flush on unmount (e.g. the student explicitly closes the quiz modal),
      // so the very latest keystroke isn't lost to the debounce window.
      saveBeforeLeaving();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secondsLeft === null) return undefined;
    if (secondsLeft <= 0) {
      onSubmit(buildPayload());
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  if (!currentQuestion) {
    return <p className="text-sm text-cn-p-ink-2">This quiz has no questions yet.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {attempt.resumed ? (
        <p className="rounded-xl bg-cn-p-warn-bg px-3.5 py-2.5 text-[13px] text-cn-p-warn">
          Resumed from your last session — answers you&apos;d already saved are pre-filled.
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] text-cn-p-ink-2" aria-live="polite">
          Question {currentIndex + 1} of {questions.length} · {answeredCount} answered
        </span>
        {secondsLeft !== null ? (
          <PortalPill tone={secondsLeft <= 30 ? "bad" : "warn"}>
            <Timer aria-hidden="true" className="h-3.5 w-3.5" />
            {formatSeconds(secondsLeft)}
            {timeLimitMinutes ? " left" : ""}
          </PortalPill>
        ) : null}
      </div>

      {/* The design's `.steps` rail: one segment per question, lit up to the
          one being answered. */}
      <div className="flex items-center gap-2">
        {questions.map((question, index) => (
          // The rail is also how a student jumps back. The bar itself is 4px,
          // so the button is padded out to a 20px target and the padding is
          // pulled back out of the layout — a 4px tap target is unusable on a
          // phone, which is where most of these are answered.
          <button
            key={question.id}
            type="button"
            aria-label={`Go to question ${index + 1}${
              answers[question.id] !== undefined ? " (answered)" : ""
            }`}
            aria-current={index === currentIndex ? "step" : undefined}
            onClick={() => goToQuestion(index)}
            className="group -my-2 flex-1 cursor-pointer py-2"
          >
            <span
              className={`block h-1 rounded-[9px] transition-colors ${
                index === currentIndex
                  ? "bg-cn-p-accent"
                  : answers[question.id] !== undefined
                    ? "bg-cn-p-accent-soft group-hover:bg-cn-p-accent"
                    : "bg-cn-p-line group-hover:bg-cn-p-line-2"
              }`}
            />
          </button>
        ))}
      </div>

      <h3 className="text-[22px] leading-[1.35] font-bold text-cn-p-ink">
        {currentQuestion.text}
      </h3>

      {currentQuestion.question_type === "SHORT_ANSWER" ? (
        <textarea
          value={answers[currentQuestion.id]?.textAnswer || ""}
          onChange={(event) => setAnswer(currentQuestion.id, { textAnswer: event.target.value })}
          rows={5}
          placeholder="Type your answer..."
          className="min-h-[110px] w-full resize-y rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3 py-2.5 text-sm leading-[1.5] text-cn-p-ink outline-none placeholder:text-cn-p-muted focus:border-cn-p-accent focus:outline-2 focus:outline-cn-p-accent"
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {(currentQuestion.choices || []).map((choice, index) => {
            const isPicked = answers[currentQuestion.id]?.selectedChoice === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                aria-pressed={isPicked}
                onClick={() => selectChoice(currentQuestion, choice.id)}
                className={`flex w-full items-start gap-3.5 rounded-xl border-[1.5px] p-4 text-left transition-[border-color,background-color] duration-150 ${
                  isPicked
                    ? "border-cn-p-accent bg-cn-p-soft"
                    : "border-cn-p-line bg-cn-p-card hover:border-cn-p-accent-soft"
                }`}
              >
                <span
                  className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-lg font-bold ${
                    isPicked ? "bg-cn-p-accent text-white" : "bg-cn-p-neutral-bg text-cn-p-ink"
                  }`}
                >
                  {CHOICE_KEYS[index] || index + 1}
                </span>
                <span className="flex-1 pt-1 text-cn-p-ink">{choice.text}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {currentIndex > 0 ? (
          <PortalButton variant="sec" onClick={() => goToQuestion(currentIndex - 1)}>
            Previous
          </PortalButton>
        ) : (
          <span />
        )}

        {currentIndex < questions.length - 1 ? (
          // Kept even though answering moves you on by itself: it is how a
          // student skips a question they want to come back to, and the only
          // way forward from a short answer, which has no moment that counts
          // as "done".
          <PortalButton onClick={() => goToQuestion(currentIndex + 1)}>
            Next question
          </PortalButton>
        ) : (
          <PortalButton
            onClick={() => {
              cancelPendingAdvance();
              onSubmit(buildPayload());
            }}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting && isAiGradedShortAnswer ? "Evaluating your answer…" : "Submit quiz"}
          </PortalButton>
        )}
      </div>

      {isSubmitting && isAiGradedShortAnswer ? (
        <p className="text-center text-xs text-cn-p-ink-2">
          The Elite Coach is reviewing your short-answer response — this can take up to a
          minute. Please don&apos;t close this window.
        </p>
      ) : null}
    </div>
  );
}
