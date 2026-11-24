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

export default function RoomListItem({ room, isSelected, onSelect }) {
  const lastMessage = room.last_message;

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
          {room.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={room.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(room.title)
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-cn-p-ink truncate">{room.title}</span>
            <span className="text-[11px] text-cn-p-muted shrink-0">
              {formatTimestamp(lastMessage?.created_at)}
            </span>
          </span>
          <span className="flex items-center justify-between gap-2 mt-0.5">
            <span className="text-xs truncate text-cn-p-muted font-light">
              {lastMessage
                ? lastMessage.is_deleted
                  ? "Message deleted"
                  : lastMessage.body || "Sent an attachment"
                : "No messages yet"}
            </span>
            <span className="text-[10px] text-cn-p-muted shrink-0">
              {room.participant_count} in room
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
