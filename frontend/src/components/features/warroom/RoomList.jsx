"use client";

import { Users } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { PortalEmpty } from "@/components/features/portal/shell/PortalUI";
import RoomListItem from "./RoomListItem";

export default function RoomList({ rooms, isLoading, selectedRoomId, onSelectRoom }) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader fullScreen={false} tone="portal" label="Loading rooms..." />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <PortalEmpty
          icon={Users}
          title="No war rooms yet"
          text="You'll see a room here for every course you're enrolled in or teach."
        />
      </div>
    );
  }

  return (
    <ul className="flex-1 min-h-0 overflow-y-auto divide-y divide-cn-p-line">
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
