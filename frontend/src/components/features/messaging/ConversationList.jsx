"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import { getConversations } from "@/services/messagingService";
import ConversationListItem from "./ConversationListItem";

export default function ConversationList({ selectedConversationId, onSelectConversation }) {
  const conversationsQuery = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await getConversations({ pageSize: 50 });
      return response?.data?.results || [];
    },
    refetchInterval: 15000,
  });

  const conversations = conversationsQuery.data || [];

  if (conversationsQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader fullScreen={false} label="Loading conversations..." />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <EmptyState
          icon={MessageSquare}
          label="No conversations yet."
          description="Start a new message to begin a conversation."
          compact
        />
      </div>
    );
  }

  return (
    <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-stone-100">
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
