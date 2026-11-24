"use client";

import { Scale } from "lucide-react";
import { PortalEmpty } from "@/components/features/portal/shell/PortalUI";

export default function EmptyRoomState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <PortalEmpty
        icon={Scale}
        title="No war room yet"
        text="A room appears here for every course you're enrolled in or teach."
      />
    </div>
  );
}
