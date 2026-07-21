"use client";

export default function PresetPromptPills({
  idPrefix,
  prompts,
  onSelect,
  className = "bg-stone-900 hover:bg-stone-800 border border-stone-850 text-stone-300 rounded px-2.5 py-1 text-[9px] font-mono uppercase tracking-wide shrink-0 cursor-pointer",
}) {
  return (
    <>
      {prompts.map((prompt, index) => (
        <button
          key={index}
          id={`${idPrefix}-${index}`}
          onClick={() => onSelect(prompt)}
          className={className}
        >
          {prompt}
        </button>
      ))}
    </>
  );
}
