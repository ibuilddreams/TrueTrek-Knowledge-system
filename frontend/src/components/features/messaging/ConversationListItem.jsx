"use client";

import { getInitials } from "@/lib/initials";

function formatTimestamp(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConversationListItem({ conversation, isSelected, onSelect }) {
  const other = conversation.other_participant;
  const lastMessage = conversation.last_message;
  const hasUnread = conversation.unread_count > 0;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition cursor-pointer ${
          isSelected ? "bg-cn-p-soft" : "hover:bg-cn-p-page"
        }`}
      >
        <span className="w-10 h-10 rounded-full bg-cn-p-neutral-bg border border-cn-p-line-2 text-cn-p-ink-2 flex items-center justify-center shrink-0 text-sm font-bold overflow-hidden">
          {other?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(other?.name)
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span
              className={`text-sm truncate ${
                hasUnread ? "font-bold text-cn-p-ink" : "font-semibold text-cn-p-ink"
              }`}
            >
              {other?.name || "Unknown"}
            </span>
            <span className="text-[11px] text-cn-p-muted shrink-0">
              {formatTimestamp(lastMessage?.created_at || conversation.created_at)}
            </span>
          </span>
          <span className="flex items-center justify-between gap-2 mt-0.5">
            <span
              className={`text-xs truncate ${
                hasUnread ? "text-cn-p-ink font-medium" : "text-cn-p-muted font-light"
              }`}
            >
              {lastMessage?.body || "No messages yet"}
            </span>
            {hasUnread && (
              <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-cn-p-accent text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {conversation.unread_count}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}
