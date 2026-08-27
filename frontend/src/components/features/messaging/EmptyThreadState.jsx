"use client";

import { MessageSquare } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function EmptyThreadState() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <EmptyState
        icon={MessageSquare}
        label="Select a conversation"
        description="Choose a conversation from the list, or start a new message."
      />
    </div>
  );
}
