"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import { getInitials } from "@/lib/initials";
import { getConversationMessages, markConversationRead } from "@/services/messagingService";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";

export default function MessageThread({ conversation, onBack }) {
  const queryClient = useQueryClient();
  const conversationId = conversation.id;
  const bottomRef = useRef(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const messagesQuery = useQuery({
    queryKey: ["conversations", conversationId, "messages"],
    queryFn: async () => {
      const response = await getConversationMessages(conversationId, { pageSize: 50 });
      return response?.data?.results || [];
    },
    enabled: Boolean(conversationId),
    refetchInterval: 4000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messagingUnreadCount"] });
    },
  });

  useEffect(() => {
    if (conversation.unread_count > 0) {
      markReadMutation.mutate();
    }
    // Only re-run when the selected conversation changes, not on every
    // unread_count/mutation-identity change (which would loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // The API returns newest-first pages; the thread displays oldest -> newest.
  const messages = useMemo(() => [...(messagesQuery.data || [])].reverse(), [messagesQuery.data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Switching conversations should always drop any in-progress edit rather
  // than leaving the composer pointed at a message from the previous thread.
  useEffect(() => {
    setEditingMessage(null);
  }, [conversationId]);

  // If the message currently being edited disappears (e.g. deleted from
  // another session, or dropped by a refetch), close the edit composer
  // instead of letting it keep pointing at a message that no longer exists.
  useEffect(() => {
    if (editingMessage && !messages.some((message) => message.id === editingMessage.id)) {
      setEditingMessage(null);
    }
  }, [messages, editingMessage]);

  const other = conversation.other_participant;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3 shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to conversations"
            className="sm:hidden w-8 h-8 -ml-1 shrink-0 flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <span className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center shrink-0 text-xs font-bold font-mono overflow-hidden">
          {other?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={other.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(other?.name)
          )}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-stone-800 truncate">{other?.name || "Unknown"}</p>
          <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400">{other?.role}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {messagesQuery.isLoading ? (
          <Loader fullScreen={false} label="Loading messages..." />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            label="No messages yet."
            description="Send the first message below."
            compact
            size="lg"
          />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                conversationId={conversationId}
                message={message}
                isBeingEdited={editingMessage?.id === message.id}
                onStartEdit={setEditingMessage}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <MessageComposer
        conversationId={conversationId}
        editingMessage={editingMessage}
        onFinishEditing={() => setEditingMessage(null)}
      />
    </div>
  );
}
