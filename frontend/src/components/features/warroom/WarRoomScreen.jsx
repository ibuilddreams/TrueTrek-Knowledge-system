"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getMyWarRoomRooms } from "@/services/warRoomService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import RoomList from "./RoomList";
import RoomThread from "./RoomThread";
import EmptyRoomState from "./EmptyRoomState";

export default function WarRoomScreen() {
  const [selectedRoom, setSelectedRoom] = useState(null);

  const roomsQuery = useQuery({
    queryKey: ["warroomRooms"],
    queryFn: async () => {
      const response = await getMyWarRoomRooms({ pageSize: 50 });
      return response?.data?.results || [];
    },
    refetchInterval: 15000,
  });

  const rooms = roomsQuery.data || [];

  // Most users only belong to one course's room — jump straight to the
  // thread instead of forcing a pointless one-item list in front of it.
  useEffect(() => {
    if (!selectedRoom && rooms.length > 0) {
      setSelectedRoom(rooms[0]);
    }
  }, [rooms, selectedRoom]);

  if (roomsQuery.isError) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-sm text-stone-500 font-light mb-6">
          {getApiErrorMessage(roomsQuery.error, "Unable to load War Room.")}
        </p>
        <button
          type="button"
          onClick={() => roomsQuery.refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-sm uppercase tracking-wider rounded-xl shadow-md transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const showList = rooms.length > 1;

  return (
    <div className="bg-white border border-stone-200/95 rounded-2xl shadow-xl overflow-hidden relative flex flex-col sm:flex-row min-h-120 h-[calc(100vh-16rem)]">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

      {showList && (
        <div
          className={`${selectedRoom ? "hidden" : "flex"} sm:flex flex-col w-full sm:w-80 flex-1 sm:flex-none min-h-0 border-b sm:border-b-0 sm:border-r border-stone-100`}
        >
          <RoomList
            rooms={rooms}
            isLoading={roomsQuery.isLoading}
            selectedRoomId={selectedRoom?.id}
            onSelectRoom={setSelectedRoom}
          />
        </div>
      )}

      <div
        className={`${!showList || selectedRoom ? "flex" : "hidden"} sm:flex flex-1 min-w-0 flex-col min-h-0`}
      >
        {roomsQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-stone-300 animate-spin" />
          </div>
        ) : selectedRoom ? (
          <RoomThread room={selectedRoom} onBack={showList ? () => setSelectedRoom(null) : undefined} />
        ) : (
          <EmptyRoomState />
        )}
      </div>
    </div>
  );
}
