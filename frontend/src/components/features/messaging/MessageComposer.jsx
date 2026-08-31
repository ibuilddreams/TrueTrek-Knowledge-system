"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Send, Smile, X } from "lucide-react";
import { editMessage, sendMessage } from "@/services/messagingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import AttachmentPreview from "./AttachmentPreview";
import AttachmentTypeMenu from "./AttachmentTypeMenu";
import EmojiPicker from "./EmojiPicker";

const DEFAULT_ATTACHMENT_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm,.mkv,.avi,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt";

export default function MessageComposer({ conversationId, editingMessage, onFinishEditing }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  const fileInputRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const attachButtonRef = useRef(null);
  const textareaRef = useRef(null);

  const isEditing = Boolean(editingMessage);

  // Entering edit mode replaces whatever draft was in progress with the
  // message being edited — mirrors the previous inline-edit behavior, which
  // only ever edited plain text, never an attachment.
  useEffect(() => {
    if (!editingMessage) return;
    setBody(editingMessage.body || "");
    setAttachment(null);
    setIsAttachMenuOpen(false);
    textareaRef.current?.focus();
  }, [editingMessage]);

  const invalidateMessages = () => {
    queryClient.invalidateQueries({ queryKey: ["conversations", conversationId, "messages"] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const sendMutation = useMutation({
    mutationFn: () => sendMessage(conversationId, { body: body.trim(), attachment }),
    onSuccess: () => {
      setBody("");
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      invalidateMessages();
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to send message."));
    },
  });

  const editMutation = useMutation({
    mutationFn: (trimmedBody) => editMessage(conversationId, editingMessage.id, trimmedBody),
    onSuccess: () => {
      setBody("");
      onFinishEditing();
      invalidateMessages();
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to edit message."));
    },
  });

  const isSubmitting = sendMutation.isPending || editMutation.isPending;
  const canSend = isEditing
    ? Boolean(body.trim()) && !isSubmitting
    : (body.trim() || attachment) && !isSubmitting;

  const handleCancelEdit = () => {
    setBody("");
    onFinishEditing();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSend) return;

    if (isEditing) {
      const trimmed = body.trim();
      if (!trimmed || trimmed === editingMessage.body) {
        handleCancelEdit();
        return;
      }
      editMutation.mutate(trimmed);
      return;
    }

    sendMutation.mutate();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
    if (event.key === "Escape" && isEditing) {
      handleCancelEdit();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setAttachment(file);
  };

  const handleAttachTypeSelect = (accept) => {
    if (!fileInputRef.current) return;
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-stone-100 p-3 space-y-2 shrink-0">
      {isEditing && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
          <span className="text-xs font-semibold text-amber-800">Editing message</span>
          <button
            type="button"
            onClick={handleCancelEdit}
            aria-label="Cancel edit"
            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-amber-700 hover:bg-amber-100 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {attachment && !isEditing && (
        <AttachmentPreview file={attachment} onRemove={() => setAttachment(null)} />
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={DEFAULT_ATTACHMENT_ACCEPT}
          onChange={handleFileChange}
          disabled={isSubmitting}
          className="hidden"
        />
        <button
          ref={attachButtonRef}
          type="button"
          onClick={() => setIsAttachMenuOpen((prev) => !prev)}
          disabled={isSubmitting || isEditing}
          title="Attach a file"
          aria-label="Attach a file"
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <button
          ref={emojiButtonRef}
          type="button"
          onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
          disabled={isSubmitting}
          title="Insert emoji"
          aria-label="Insert emoji"
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Smile className="w-4 h-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Write a message..."
          disabled={isSubmitting}
          className="flex-1 resize-none px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-500 disabled:opacity-60 max-h-28"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label={isEditing ? "Save edit" : "Send message"}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <AttachmentTypeMenu
        isOpen={isAttachMenuOpen}
        onClose={() => setIsAttachMenuOpen(false)}
        anchorRef={attachButtonRef}
        onSelect={handleAttachTypeSelect}
      />

      <EmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        anchorRef={emojiButtonRef}
        align="start"
        onSelect={(emoji) => setBody((prev) => prev + emoji)}
      />
    </form>
  );
}
