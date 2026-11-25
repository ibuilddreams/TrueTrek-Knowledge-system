"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getUnreadNotificationsCount } from "@/services/notificationsService";

/**
 * The signed-in user's unread-notification count, polled for the portal top
 * bar's bell — mirroring `useUnreadMessagesCount`'s pattern.
 *
 * Every role, not just admins: `notifications/views.py` filters on
 * `recipient=request.user`, and classes, War Room Live write-ups, teacher
 * application decisions and invitation feedback all notify students and
 * teachers too. It was admin-only while the admin header was the one place a
 * bell was rendered.
 */
export function useNotificationsCount() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ["notificationsUnreadCount"],
    queryFn: async () => {
      const response = await getUnreadNotificationsCount();
      return response?.data?.unread_count || 0;
    },
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 20000 : false,
  });

  return query.data || 0;
}
