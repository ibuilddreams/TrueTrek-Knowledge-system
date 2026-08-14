"use client";

import { Plus, Trash2 } from "lucide-react";
import SearchableSelect from "@/components/ui/SearchableSelect";

// Deliberately excludes width so callers can pair it with their own (e.g.
// `w-full` for the option text input, `w-24` for the compact weight input) —
// combining this with a conflicting width utility on the same element leaves
// the winner up to Tailwind's stylesheet order rather than JSX order, which
// previously made the weight input silently claim the full row and squeeze
// the pathway dropdown next to it down to ~0px.
const FIELD_CLASS =
  "px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS = "text-[10px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[10px] font-mono text-red-600 mt-1";

export default function QuestionOptionRow({
  option,
  optionIndex,
  onChange,
  onRemove,
  pathwayOptions,
  isLoadingPathways,
  disabled,
  error,
}) {
  const updateText = (event) => {
    onChange({ ...option, text: event.target.value });
  };

  const addWeight = () => {
    onChange({
      ...option,
      pathwayWeights: [
        ...option.pathwayWeights,
        { uid: `${option.uid}-weight-${Date.now()}-${Math.random()}`, pathwayId: "", weight: "1" },
      ],
    });
  };

  const updateWeight = (weightUid, patch) => {
    onChange({
      ...option,
      pathwayWeights: option.pathwayWeights.map((weight) =>
        weight.uid === weightUid ? { ...weight, ...patch } : weight
      ),
    });
  };

  const removeWeight = (weightUid) => {
    onChange({
      ...option,
      pathwayWeights: option.pathwayWeights.filter((weight) => weight.uid !== weightUid),
    });
  };

  return (
    <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <label className={LABEL_CLASS}>Option {optionIndex + 1} Text</label>
          <input
            type="text"
            value={option.text}
            onChange={updateText}
            disabled={disabled}
            placeholder="Option text"
            className={`w-full ${FIELD_CLASS}`}
            autoComplete="off"
          />
          {error?.text && <p className={ERROR_CLASS}>{error.text}</p>}
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          title="Remove option"
          aria-label="Remove option"
          className="mt-6 w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div>
        <p className={LABEL_CLASS}>Pathway Weights</p>
        <div className="space-y-2">
          {option.pathwayWeights.map((weight) => (
            <div key={weight.uid} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <SearchableSelect
                  placeholder="Select a pathway"
                  searchPlaceholder="Search pathways..."
                  options={pathwayOptions}
                  value={weight.pathwayId}
                  onChange={(value) => updateWeight(weight.uid, { pathwayId: value })}
                  loading={isLoadingPathways}
                  disabled={disabled}
                  emptyLabel="No pathways found."
                />
              </div>
              <input
                type="number"
                min="1"
                step="1"
                value={weight.weight}
                onChange={(event) => updateWeight(weight.uid, { weight: event.target.value })}
                disabled={disabled}
                placeholder="Weight"
                className={`${FIELD_CLASS} w-24 shrink-0`}
              />
              <button
                type="button"
                onClick={() => removeWeight(weight.uid)}
                disabled={disabled}
                title="Remove pathway weight"
                aria-label="Remove pathway weight"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        {error?.pathwayWeights && <p className={ERROR_CLASS}>{error.pathwayWeights}</p>}

        <button
          type="button"
          onClick={addWeight}
          disabled={disabled}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 border border-dashed border-stone-300 rounded-lg text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Pathway Weight
        </button>
      </div>
    </div>
  );
}
