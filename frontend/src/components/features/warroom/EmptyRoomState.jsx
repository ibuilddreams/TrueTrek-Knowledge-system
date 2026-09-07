"use client";

import { Scale } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function EmptyRoomState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <EmptyState
        icon={Scale}
        label="No War Room yet"
        description="A room appears here for every course you're enrolled in or teach."
        size="lg"
      />
    </div>
  );
}
