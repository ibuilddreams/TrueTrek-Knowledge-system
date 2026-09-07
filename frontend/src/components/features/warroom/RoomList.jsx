"use client";

import { Users } from "lucide-react";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import RoomListItem from "./RoomListItem";

export default function RoomList({ rooms, isLoading, selectedRoomId, onSelectRoom }) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader fullScreen={false} label="Loading rooms..." />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <EmptyState
          icon={Users}
          label="No War Rooms yet."
          description="You'll see a room here for every course you're enrolled in or teach."
          compact
          size="lg"
        />
      </div>
    );
  }

  return (
    <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-stone-100">
      {rooms.map((room) => (
        <RoomListItem
          key={room.id}
          room={room}
          isSelected={room.id === selectedRoomId}
          onSelect={() => onSelectRoom(room)}
        />
      ))}
    </ul>
  );
}
