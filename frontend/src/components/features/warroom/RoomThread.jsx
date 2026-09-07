"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import { getInitials } from "@/lib/initials";
import { getRoomMessages } from "@/services/warRoomService";
import RoomMessageBubble from "./RoomMessageBubble";
import RoomComposer from "./RoomComposer";

export default function RoomThread({ room, onBack }) {
  const router = useRouter();
  const { isFaculty } = useAuth();
  const courseId = room.id;
  const bottomRef = useRef(null);

  const messagesQuery = useQuery({
    queryKey: ["warroomRooms", courseId, "messages"],
    queryFn: async () => {
      const response = await getRoomMessages(courseId, { pageSize: 50 });
      return response?.data?.results || [];
    },
    enabled: Boolean(courseId),
    refetchInterval: 4000,
  });

  // The API returns newest-first pages; the thread displays oldest -> newest.
  const messages = useMemo(() => [...(messagesQuery.data || [])].reverse(), [messagesQuery.data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3 shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to rooms"
            className="sm:hidden w-8 h-8 -ml-1 shrink-0 flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <span className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 text-stone-600 flex items-center justify-center shrink-0 text-xs font-bold font-mono overflow-hidden">
          {room.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={room.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            getInitials(room.title)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-stone-800 truncate">{room.title}</p>
          <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
            {room.participant_count} in room
          </p>
        </div>
        {isFaculty && (
          <button
            type="button"
            onClick={() => router.push(`${ROUTES.TEACHER_PORTAL}?tab=students`)}
            title="View course roster"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 hover:bg-stone-50 text-stone-600 text-[11px] font-mono uppercase tracking-wider rounded-lg transition shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            Roster
          </button>
        )}
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
              <RoomMessageBubble key={message.id} courseId={courseId} message={message} />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <RoomComposer courseId={courseId} />
    </div>
  );
}
