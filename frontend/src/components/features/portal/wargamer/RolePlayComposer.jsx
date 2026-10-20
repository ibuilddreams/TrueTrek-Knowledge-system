"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { ABP_STEPS } from "./wargamerConstants";

const MAX_LENGTH = 2000;

/**
 * The athlete's reply box.
 *
 * Enter sends and Shift+Enter breaks the line, matching the portal's other
 * chat surfaces. The A.B.P. letters along the top are a reminder of the shape
 * of a good reply, not a form — the student types one message, in their own
 * words, exactly as they would say it out loud.
 */
export default function RolePlayComposer({
  onSend,
  isSending = false,
  disabled = false,
  turnsRemaining,
  restoreText = "",
  restoreToken = 0,
}) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  // Set when a send fails: the backend rolls the message back entirely (see
  // wargamer/services.py::submit_turn), so putting the text back in the box
  // is both safe and the only way the student doesn't lose what they wrote.
  //
  // Keyed on `restoreToken`, not the text: a student who sends the same words
  // twice and is unlucky twice must get them back both times, which a
  // value-keyed effect would skip the second time round.
  useEffect(() => {
    if (restoreToken > 0) setValue(restoreText);
  }, [restoreToken, restoreText]);

  const canSend = value.trim().length > 0 && !isSending && !disabled;

  const handleSend = () => {
    if (!canSend) return;
    const message = value.trim();
    setValue("");
    onSend?.(message);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-line bg-paper p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {ABP_STEPS.map((step) => (
          <span
            key={step.key}
            title={step.summary}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-porcelain border border-line text-[10px] font-mono uppercase tracking-widest text-muted"
          >
            <span className="font-bold text-pine">{step.letter}</span>
            {step.label}
          </span>
        ))}
        {typeof turnsRemaining === "number" && (
          <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted tabular-nums">
            {turnsRemaining} {turnsRemaining === 1 ? "reply" : "replies"} left
          </span>
        )}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          disabled={isSending || disabled}
          rows={2}
          placeholder={
            disabled
              ? "This conversation is finished."
              : "Say it the way you would actually say it out loud..."
          }
          aria-label="Your reply"
          className="flex-1 px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm text-ink placeholder:text-muted transition disabled:opacity-60 resize-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send reply"
          className="h-[52px] px-5 inline-flex items-center justify-center gap-2 bg-pine hover:bg-moss disabled:opacity-50 disabled:cursor-not-allowed text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-sm transition cursor-pointer shrink-0"
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      <p className="text-[10px] font-light text-muted">
        Enter to send &middot; Shift + Enter for a new line
      </p>
    </div>
  );
}
