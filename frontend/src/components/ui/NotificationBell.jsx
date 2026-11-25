"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Popover from "@/components/ui/Popover";
import Loader from "@/components/ui/Loader";
import { PortalEmpty, PortalIcon } from "@/components/features/portal/shell/PortalUI";
import { notificationHref } from "@/components/features/portal/shell/notificationRoutes";
import { formatDateTime } from "@/lib/adminFormatters";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationsService";
import { useNotificationsCount } from "@/hooks/useNotifications";

/**
 * The design's bell: the top bar's `.iconbtn` carrying a `.dot` when
 * something is unread, and the 360px `.pop` panel under it.
 *
 * A plain dot rather than a count, as the design has it — the number is in
 * the button's label for anyone who can't see the dot, and the panel itself
 * is one tap away for anyone who can.
 *
 * It routes by `related_object_type` through `notificationRoutes.js`, which
 * knows where each kind of event lives for each role.
 */
const POPOVER_WIDTH = 360;

export default function NotificationBell({ role }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const buttonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useNotificationsCount();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await getNotifications({ pageSize: 10 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });

  const notifications = notificationsQuery.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notificationsUnreadCount"] });
  };

  const handleSelect = async (notification) => {
    setIsOpen(false);

    const href = notificationHref(role, notification);
    if (href) router.push(href);

    if (notification.is_read) return;
    try {
      await markNotificationRead(notification.id);
      invalidate();
    } catch {
      // Best-effort: opening what it points at matters more than the receipt.
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      invalidate();
    } catch {
      // Ignore — the dot settles on the next poll.
    }
  };

  return (
    <div className="relative inline-block flex-none">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`Notifications, ${unreadCount} unread`}
        className="relative grid h-11 w-11 place-items-center rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card text-cn-p-ink transition-colors duration-150 hover:border-cn-p-ink"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-[9px] right-2.5 h-2 w-2 rounded-full bg-cn-live" />
        )}
      </button>

      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorRef={buttonRef}
        width={POPOVER_WIDTH}
        align="end"
        contentClassName="p-2"
      >
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <b className="text-sm text-cn-p-ink">Notifications</b>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="border-0 bg-transparent p-0 text-sm font-semibold whitespace-nowrap text-cn-p-accent hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[min(26rem,60vh)] overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <div className="p-4">
              <Loader fullScreen={false} tone="cobalt" label="Loading..." />
            </div>
          ) : notifications.length === 0 ? (
            <PortalEmpty
              icon={Bell}
              title="All caught up"
              text="New activity shows up here."
            />
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleSelect(notification)}
                className="flex w-full items-start gap-3 rounded-cn-p-sm p-3 text-left transition-colors duration-150 hover:bg-cn-p-page"
              >
                <PortalIcon icon={Bell} />
                <span className="grid min-w-0 gap-0.5">
                  <span className="text-[15px] font-semibold text-cn-p-ink">
                    {notification.title}
                    {/* The design marks an unread row with a cobalt dot after
                        its title rather than a tinted row. */}
                    {!notification.is_read && (
                      <span
                        aria-label="Unread"
                        className="ml-2 inline-block h-[7px] w-[7px] rounded-full bg-cn-p-accent align-middle"
                      />
                    )}
                  </span>
                  {notification.message && (
                    <span className="text-[13px] text-cn-p-ink-2">
                      {notification.message}
                    </span>
                  )}
                  <span className="text-xs text-cn-p-muted">
                    {formatDateTime(notification.created_at)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </Popover>
    </div>
  );
}
