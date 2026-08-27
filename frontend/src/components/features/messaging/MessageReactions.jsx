"use client";

export default function MessageReactions({ reactions, onToggle, isMine }) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          onClick={() => onToggle(reaction.emoji)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border transition cursor-pointer ${
            reaction.reacted_by_me
              ? "bg-amber-50 border-amber-300 text-amber-800"
              : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
          }`}
        >
          <span>{reaction.emoji}</span>
          <span className="font-mono">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
