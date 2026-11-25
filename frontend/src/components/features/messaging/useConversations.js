"use client";

import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/services/messagingService";

/**
 * The signed-in user's conversations.
 *
 * Shared by `MessagesScreen` and `ConversationList` rather than owned by the
 * list, because the screen has to know the count before it can choose between
 * the design's two shapes — the split `.chat` card, or the single empty card
 * offering "New message". Both callers ask with the same key, so TanStack
 * serves them from one request rather than fetching the list twice.
 */
export function useConversations(conversationType) {
  return useQuery({
    queryKey: ["conversations", conversationType || "all"],
    queryFn: async () => {
      const response = await getConversations({ pageSize: 50, conversationType });
      return response?.data?.results || [];
    },
    refetchInterval: 15000,
  });
}
