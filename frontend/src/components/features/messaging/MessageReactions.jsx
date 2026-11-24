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
              ? "bg-cn-p-soft border-cn-p-accent-soft text-cn-p-soft-ink"
              : "bg-cn-p-page border-cn-p-line-2 text-cn-p-ink-2 hover:bg-cn-p-page"
          }`}
        >
          <span>{reaction.emoji}</span>
          <span className="tabular-nums">{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
