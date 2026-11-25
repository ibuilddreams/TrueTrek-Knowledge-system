"use client";

import { useEffect } from "react";
import { Mail } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { PortalEmpty } from "@/components/features/portal/shell/PortalUI";
import ConversationListItem from "./ConversationListItem";
import { useConversations } from "./useConversations";

export default function ConversationList({
  selectedConversationId,
  onSelectConversation,
  autoSelectConversationId,
  conversationType,
  emptyLabel = "No conversations yet",
  emptyDescription = "Start a new message to begin a conversation.",
}) {
  const conversationsQuery = useConversations(conversationType);

  const conversations = conversationsQuery.data || [];

  // Deep-linked from elsewhere (e.g. a teacher's "Message Student" action) —
  // select it as soon as it shows up in the loaded list.
  useEffect(() => {
    if (!autoSelectConversationId) return;
    const match = conversations.find(
      (conversation) => String(conversation.id) === String(autoSelectConversationId)
    );
    if (match) onSelectConversation(match);
  }, [autoSelectConversationId, conversations, onSelectConversation]);

  if (conversationsQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader fullScreen={false} tone="cobalt" label="Loading conversations..." />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <PortalEmpty icon={Mail} title={emptyLabel} text={emptyDescription} />
      </div>
    );
  }

  return (
    <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-cn-p-line">
      {conversations.map((conversation) => (
        <ConversationListItem
          key={conversation.id}
          conversation={conversation}
          isSelected={conversation.id === selectedConversationId}
          onSelect={() => onSelectConversation(conversation)}
        />
      ))}
    </ul>
  );
}
