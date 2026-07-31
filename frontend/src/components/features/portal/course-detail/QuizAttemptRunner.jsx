"use client";

import { useEffect, useState } from "react";
import { Loader2, Timer } from "lucide-react";

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function QuizAttemptRunner({ attempt, isSubmitting, onSubmit }) {
  const questions = attempt.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const timeLimitMinutes = attempt.quiz?.time_limit_minutes || 0;
  const [secondsLeft, setSecondsLeft] = useState(
    timeLimitMinutes > 0 ? timeLimitMinutes * 60 : null
  );

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  function buildPayload() {
    return {
      answers: Object.entries(answers).map(([questionId, answer]) => ({
        question: Number(questionId),
        selected_choice: answer.selectedChoice ?? null,
        text_answer: answer.textAnswer ?? "",
      })),
    };
  }

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
    return <p className="text-sm text-stone-500">This quiz has no questions yet.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
          Question {currentIndex + 1} of {questions.length} · {answeredCount} answered
        </p>
        {secondsLeft !== null ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold ${
              secondsLeft <= 30
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-stone-50 text-stone-600 border-stone-200"
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            {formatSeconds(secondsLeft)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {questions.map((question, index) => (
          <button
            key={question.id}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`w-7 h-7 rounded-lg text-[11px] font-mono font-bold border transition ${
              index === currentIndex
                ? "bg-stone-900 text-white border-stone-900"
                : answers[question.id] !== undefined
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-white text-stone-400 border-stone-200"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
        <p className="text-sm font-medium text-stone-900">{currentQuestion.text}</p>

        {currentQuestion.question_type === "SHORT_ANSWER" ? (
          <textarea
            value={answers[currentQuestion.id]?.textAnswer || ""}
            onChange={(event) => setAnswer(currentQuestion.id, { textAnswer: event.target.value })}
            rows={4}
            placeholder="Type your answer..."
            className="w-full px-3.5 py-3 bg-stone-50/90 border border-stone-200 focus:border-amber-500/70 focus:ring-4 focus:ring-amber-500/10 focus:outline-none rounded-xl text-sm text-stone-800 placeholder:text-stone-400 transition"
          />
        ) : (
          <div className="space-y-2">
            {(currentQuestion.choices || []).map((choice) => (
              <label
                key={choice.id}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-sm cursor-pointer transition ${
                  answers[currentQuestion.id]?.selectedChoice === choice.id
                    ? "border-amber-400 bg-amber-50/70 text-amber-900"
                    : "border-stone-200 hover:border-stone-300 text-stone-700"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  checked={answers[currentQuestion.id]?.selectedChoice === choice.id}
                  onChange={() => setAnswer(currentQuestion.id, { selectedChoice: choice.id })}
                  className="accent-amber-600"
                />
                {choice.text}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
          disabled={currentIndex === 0}
          className="px-4 py-2 border border-stone-200 disabled:opacity-40 text-stone-600 text-[11px] font-mono uppercase tracking-wider rounded-xl transition"
        >
          Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-mono uppercase tracking-wider rounded-xl transition"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSubmit(buildPayload())}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-[11px] font-mono uppercase tracking-wider rounded-xl transition"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Submit quiz
          </button>
        )}
      </div>
    </div>
  );
}
