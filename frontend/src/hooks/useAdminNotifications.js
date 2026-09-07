"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getUnreadNotificationsCount } from "@/services/notificationsService";

/** Polled unread-notification count for the admin header bell badge — mirrors
 * useUnreadMessagesCount's polling pattern. */
export function useAdminNotificationsCount() {
  const { isAuthenticated, isAdmin } = useAuth();
  const enabled = isAuthenticated && isAdmin;

  const query = useQuery({
    queryKey: ["adminNotificationsUnreadCount"],
    queryFn: async () => {
      const response = await getUnreadNotificationsCount();
      return response?.data?.unread_count || 0;
    },
    enabled,
    refetchInterval: enabled ? 20000 : false,
  });

  return query.data || 0;
}
