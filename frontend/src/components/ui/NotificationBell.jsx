"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ShieldAlert } from "lucide-react";
import Popover from "@/components/ui/Popover";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/adminFormatters";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationsService";
import { useAdminNotificationsCount } from "@/hooks/useAdminNotifications";

export default function NotificationBell({ onSelectNotification }) {
  const queryClient = useQueryClient();
  const buttonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = useAdminNotificationsCount();

  const notificationsQuery = useQuery({
    queryKey: ["adminNotifications"],
    queryFn: async () => {
      const response = await getNotifications({ pageSize: 10 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });

  const notifications = notificationsQuery.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
    queryClient.invalidateQueries({ queryKey: ["adminNotificationsUnreadCount"] });
  };

  const handleSelect = async (notification) => {
    setIsOpen(false);
    onSelectNotification?.(notification);
    if (notification.is_read) return;
    try {
      await markNotificationRead(notification.id);
      invalidate();
    } catch {
      // Best-effort — navigating to the concern matters more than the read receipt.
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      invalidate();
    } catch {
      // ignore — the badge will settle on the next poll
    }
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Notifications"
        aria-label="Notifications"
        className={`relative w-11 h-11 flex items-center justify-center rounded-xl border shadow-sm transition ${
          isOpen
            ? "bg-white border-amber-200 ring-2 ring-amber-600/15"
            : "bg-stone-50 hover:bg-white border-stone-200 hover:border-stone-300"
        }`}
      >
        <Bell className="w-4 h-4 text-stone-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold font-mono flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} anchorRef={buttonRef} width={320} align="end">
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-stone-100">
          <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">
            Notifications
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <div className="p-4">
              <Loader fullScreen={false} label="Loading..." />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4">
              <EmptyState icon={Bell} label="No notifications yet." compact size="base" />
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleSelect(notification)}
                className={`w-full text-left px-3.5 py-3 border-b border-stone-50 last:border-b-0 hover:bg-stone-50 transition cursor-pointer ${
                  !notification.is_read ? "bg-amber-50/40" : ""
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <ShieldAlert
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      !notification.is_read ? "text-amber-600" : "text-stone-300"
                    }`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-xs ${
                        !notification.is_read ? "font-bold text-stone-900" : "font-semibold text-stone-700"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-[11px] text-stone-500 font-light mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-stone-400 mt-1">
                      {formatDateTime(notification.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Popover>
    </div>
  );
}
