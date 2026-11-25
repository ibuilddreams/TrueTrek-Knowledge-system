"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MessageAttachment from "@/components/features/messaging/MessageAttachment";
import { deleteRoomMessage } from "@/services/warRoomService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";

function formatTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function RoomMessageBubble({ courseId, message }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMine = message.sender?.id === user?.id;
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoomMessage(courseId, message.id),
    onSuccess: () => {
      setIsConfirmingDelete(false);
      queryClient.invalidateQueries({ queryKey: ["warroomRooms", courseId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["warroomRooms"] });
    },
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to delete message.")),
  });

  if (message.is_deleted) {
    return (
      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm italic text-cn-p-muted bg-cn-p-page border border-cn-p-line">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-center gap-1 max-w-[75%] ${isMine ? "flex-row" : "flex-row-reverse"}`}>
        {isMine && (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            title="Delete message"
            aria-label="Delete message"
            className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-cn-p-muted hover:text-cn-p-bad hover:bg-cn-p-page cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="min-w-0">
          {!isMine && (
            <p className="text-[11px] font-semibold text-cn-p-muted mb-1 px-1">
              {message.sender?.name || "Unknown"}
              {message.sender?.role ? ` · ${message.sender.role}` : ""}
            </p>
          )}
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed space-y-1.5 ${
              isMine
                ? "bg-cn-p-accent text-white rounded-br-sm"
                : "bg-cn-p-neutral-bg text-cn-p-ink rounded-bl-sm"
            }`}
          >
            <MessageAttachment message={message} />
            {message.body && <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>}
            <p className="text-[10px] text-cn-p-muted">{formatTime(message.created_at)}</p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        isConfirming={deleteMutation.isPending}
        title="Delete message"
        message="Are you sure you want to delete this message? This cannot be undone."
        confirmLabel="Delete"
        size="lg"
      />
    </div>
  );
}
