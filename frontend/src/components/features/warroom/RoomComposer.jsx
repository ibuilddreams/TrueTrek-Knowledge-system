"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Send } from "lucide-react";
import { sendRoomMessage } from "@/services/warRoomService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import AttachmentPreview from "@/components/features/messaging/AttachmentPreview";

const ATTACHMENT_ACCEPT =
  ".jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.webm,.mkv,.avi,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt";

export default function RoomComposer({ courseId }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState(null);

  const invalidateMessages = () => {
    queryClient.invalidateQueries({ queryKey: ["warroomRooms", courseId, "messages"] });
    queryClient.invalidateQueries({ queryKey: ["warroomRooms"] });
  };

  const sendMutation = useMutation({
    mutationFn: () => sendRoomMessage(courseId, { body: body.trim(), attachment }),
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

  const canSend = (body.trim() || attachment) && !sendMutation.isPending;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSend) return;
    sendMutation.mutate();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-stone-100 p-3 space-y-2 shrink-0">
      {attachment && <AttachmentPreview file={attachment} onRemove={() => setAttachment(null)} />}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          onChange={(event) => setAttachment(event.target.files?.[0] || null)}
          disabled={sendMutation.isPending}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={sendMutation.isPending}
          title="Attach a file"
          aria-label="Attach a file"
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Message the room..."
          disabled={sendMutation.isPending}
          className="flex-1 resize-none px-3.5 py-2.5 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600/20 focus:border-amber-500 disabled:opacity-60 max-h-28"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
