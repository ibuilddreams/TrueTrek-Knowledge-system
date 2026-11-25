"use client";

import { Check } from "lucide-react";

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * A single questionnaire question (legend + its options), rendered on its own
 * screen by QuestionnaireStep. Kept separate so the step component only owns
 * navigation/submission and this one owns the option UI.
 *
 * Each option is the design's `.opt` row — a 1.5px rule that turns cobalt when
 * pressed, with the letter badge (`.k`) filling in — driven by a real radio or
 * checkbox so the keyboard and screen readers get the native control.
 */
export default function QuestionnaireQuestion({ question, value, onSelect }) {
  const sortedOptions = [...(question.options || [])].sort((a, b) => a.order - b.order);
  const isMulti = Boolean(question.is_multi_select);

  function isChecked(optionId) {
    return isMulti ? Array.isArray(value) && value.includes(optionId) : value === optionId;
  }

  return (
    <fieldset className="m-0 grid min-w-0 gap-4 border-0 p-0">
      <legend className="mb-1 w-full">
        <span className="block text-cn-xl font-extrabold tracking-[-0.02em] text-cn-ink">
          {question.text}
        </span>
        <span className="mt-1.5 block text-cn-sm text-cn-muted">
          {isMulti ? "Select all that apply" : "Select one"}
        </span>
      </legend>

      <div className="grid gap-2.5">
        {sortedOptions.map((option, index) => {
          const checked = isChecked(option.id);

          return (
            <label key={option.id} className="block cursor-pointer">
              <input
                type={isMulti ? "checkbox" : "radio"}
                name={`onboarding-question-${question.id}`}
                checked={checked}
                onChange={() => onSelect(option.id)}
                className="peer sr-only"
              />
              <span
                className={`flex items-center gap-3.5 rounded-cn-sm border-[1.5px] bg-white p-4 text-cn-base transition-[border-color,background-color] duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cn-accent ${
                  checked
                    ? "border-cn-accent bg-cn-paper-3 text-cn-ink"
                    : "border-cn-rule text-cn-ink-2 hover:border-cn-accent-soft"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-[30px] w-[30px] flex-none place-items-center text-cn-sm font-bold transition-colors duration-150 ${
                    isMulti ? "rounded-[8px]" : "rounded-full"
                  } ${
                    checked
                      ? "bg-cn-accent text-white"
                      : "bg-cn-paper-2 text-cn-muted"
                  }`}
                >
                  {checked ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    OPTION_LETTERS[index] || index + 1
                  )}
                </span>
                <span className="flex-1">{option.text}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
