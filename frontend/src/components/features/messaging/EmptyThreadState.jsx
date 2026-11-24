"use client";

import { MessageSquare } from "lucide-react";
import { PortalEmpty } from "@/components/features/portal/shell/PortalUI";

export default function EmptyThreadState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <PortalEmpty
        icon={MessageSquare}
        title="Select a conversation"
        text="Choose a conversation from the list, or start a new message."
      />
    </div>
  );
}
