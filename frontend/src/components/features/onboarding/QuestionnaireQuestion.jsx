"use client";

import { Check } from "lucide-react";

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * A single questionnaire question (legend + its options), rendered on its own
 * screen by QuestionnaireStep. Kept separate so the step component only owns
 * navigation/submission and this one owns the option UI.
 */
export default function QuestionnaireQuestion({ question, value, onSelect }) {
  const sortedOptions = [...(question.options || [])].sort((a, b) => a.order - b.order);
  const isMulti = Boolean(question.is_multi_select);

  function isChecked(optionId) {
    return isMulti ? Array.isArray(value) && value.includes(optionId) : value === optionId;
  }

  return (
    <fieldset className="space-y-4">
      <legend className="w-full">
        <span className="block text-lg sm:text-xl font-serif font-bold leading-snug text-stone-900">
          {question.text}
        </span>
        <span className="mt-1.5 block text-[10px] font-mono uppercase tracking-wider text-stone-400">
          {isMulti ? "Select all that apply" : "Select one"}
        </span>
      </legend>

      <div className="space-y-2.5">
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
                className={`flex items-center gap-3.5 rounded-xl border px-4 py-3.5 text-xs font-mono leading-relaxed transition-all duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-amber-600/40 peer-focus-visible:ring-offset-2 ${
                  checked
                    ? "border-amber-600 bg-amber-50 text-stone-900 shadow-sm"
                    : "border-stone-200 bg-stone-50/70 text-stone-600 hover:border-amber-300 hover:bg-white"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                    isMulti ? "rounded-md" : "rounded-full"
                  } ${
                    checked
                      ? "bg-amber-600 text-white"
                      : "border border-stone-300 bg-white text-stone-400"
                  }`}
                >
                  {checked ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
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
