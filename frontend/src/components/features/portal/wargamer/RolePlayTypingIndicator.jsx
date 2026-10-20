"use client";

/** The counterpart composing their pushback. */
export default function RolePlayTypingIndicator({ counterpartRole }) {
  return (
    <div className="flex justify-start">
      <div className="flex flex-col gap-1 items-start">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted px-1">
          {counterpartRole}
        </span>
        <div className="bg-porcelain border border-line rounded-2xl rounded-bl-md px-4 py-3.5 flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
