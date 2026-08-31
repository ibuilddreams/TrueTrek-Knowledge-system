"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Smile } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { deleteMessage, reactToMessage } from "@/services/messagingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import EmojiPicker from "./EmojiPicker";
import MessageActionsMenu from "./MessageActionsMenu";
import MessageAttachment from "./MessageAttachment";
import MessageReactions from "./MessageReactions";

function formatTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ conversationId, message, isBeingEdited, onStartEdit }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMine = message.sender_id === user?.id;

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  const reactionButtonRef = useRef(null);
  const actionsButtonRef = useRef(null);

  const messagesQueryKey = ["conversations", conversationId, "messages"];

  const invalidateMessages = () => {
    queryClient.invalidateQueries({ queryKey: messagesQueryKey });
    // Deleting can change what the conversation list shows as its
    // last-message preview, so that query needs refreshing too.
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const deleteMutation = useMutation({
    mutationFn: () => deleteMessage(conversationId, message.id),
    onSuccess: () => {
      setIsConfirmingDelete(false);
      invalidateMessages();
    },
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to delete message.")),
  });

  const reactMutation = useMutation({
    mutationFn: (emoji) => reactToMessage(conversationId, message.id, emoji),
    onSuccess: invalidateMessages,
    onError: (error) => toastError(getApiErrorMessage(error, "Unable to react to message.")),
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.body || "");
      toastSuccess("Message copied.");
    } catch {
      toastError("Unable to copy message.");
    }
  };

  if (message.is_deleted) {
    return (
      <div data-message-id={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm italic text-stone-400 bg-stone-50 border border-stone-100">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div data-message-id={message.id} className={`group flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-center gap-1 max-w-[75%] ${isMine ? "flex-row" : "flex-row-reverse"}`}>
        {/* Hover toolbar sits on the inner side (toward the gutter between
            columns), not the outer screen edge — mirrors WhatsApp's
            per-message quick-react + more-actions icon placement. */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
          <button
            ref={reactionButtonRef}
            type="button"
            onClick={() => setIsReactionPickerOpen((prev) => !prev)}
            title="React"
            aria-label="React to message"
            className="w-6 h-6 flex items-center justify-center rounded-full text-stone-400 hover:text-amber-600 hover:bg-stone-100 transition cursor-pointer"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          <button
            ref={actionsButtonRef}
            type="button"
            onClick={() => setIsActionsMenuOpen((prev) => !prev)}
            title="More options"
            aria-label="More message options"
            className="w-6 h-6 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="min-w-0">
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed space-y-1.5 transition-shadow ${
              isMine
                ? "bg-stone-900 text-stone-100 rounded-br-sm"
                : "bg-stone-100 text-stone-800 rounded-bl-sm"
            } ${isBeingEdited ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-white" : ""}`}
          >
            <MessageAttachment message={message} />
            {message.body && <p className="whitespace-pre-wrap wrap-break-word">{message.body}</p>}
            <p className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
              {message.is_edited && <span>edited ·</span>}
              {formatTime(message.created_at)}
            </p>
          </div>

          <MessageReactions
            reactions={message.reactions}
            isMine={isMine}
            onToggle={(emoji) => reactMutation.mutate(emoji)}
          />
        </div>
      </div>

      <EmojiPicker
        isOpen={isReactionPickerOpen}
        onClose={() => setIsReactionPickerOpen(false)}
        anchorRef={reactionButtonRef}
        align={isMine ? "end" : "start"}
        onSelect={(emoji) => reactMutation.mutate(emoji)}
      />

      <MessageActionsMenu
        isOpen={isActionsMenuOpen}
        onClose={() => setIsActionsMenuOpen(false)}
        anchorRef={actionsButtonRef}
        isMine={isMine}
        onCopy={handleCopy}
        onEdit={() => onStartEdit(message)}
        onDelete={() => setIsConfirmingDelete(true)}
      />

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        isConfirming={deleteMutation.isPending}
        title="Delete Message"
        message="Are you sure you want to delete this message? This cannot be undone."
        confirmLabel="Delete"
        size="lg"
      />
    </div>
  );
}
