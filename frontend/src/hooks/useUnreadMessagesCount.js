"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getUnreadMessagesCount } from "@/services/messagingService";

/** Polled unread-conversation count for the header badge. Swapping the poll for a
 * real-time push later just means replacing `refetchInterval` with a socket
 * event handler that calls queryClient.invalidateQueries on this same key. */
export function useUnreadMessagesCount() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ["messagingUnreadCount"],
    queryFn: async () => {
      const response = await getUnreadMessagesCount();
      return response?.data || { unread_messages: 0, unread_conversations: 0 };
    },
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 20000 : false,
  });

  return query.data?.unread_conversations || 0;
}
