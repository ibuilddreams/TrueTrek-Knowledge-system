"use client";

import { Trash2 } from "lucide-react";
import MessageAttachment from "@/components/features/messaging/MessageAttachment";
import { formatDateTime } from "@/lib/adminFormatters";

function initialsFor(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function FeedPostCard({ post, canDelete = false, onDelete, isDeleting = false }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-amber-600/10 border border-amber-600/30 flex items-center justify-center font-bold text-amber-750 text-xs shrink-0">
            {initialsFor(post.teacher?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-serif font-bold text-stone-900 truncate">
              {post.teacher?.name || "Instructor"}
            </p>
            <p className="text-[11px] font-mono text-stone-400">{formatDateTime(post.created_at)}</p>
          </div>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            title="Delete post"
            aria-label="Delete post"
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-40 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {post.title && (
        <h4 className="font-serif font-bold text-stone-900 text-base">{post.title}</h4>
      )}
      {post.caption && (
        <p className="text-sm text-stone-600 font-light leading-relaxed whitespace-pre-line">
          {post.caption}
        </p>
      )}
      {post.attachment && <MessageAttachment message={post} />}
    </div>
  );
}
