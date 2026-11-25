"use client";

import { Plus } from "lucide-react";
import { PortalButton } from "@/components/features/portal/shell/PortalUI";

/** The design's `btn("New message", …, "pri", "", "plus")`. */
export default function NewMessageButton({ onClick }) {
  return (
    <PortalButton onClick={onClick} className="flex-none">
      <Plus aria-hidden="true" className="h-[18px] w-[18px]" />
      New message
    </PortalButton>
  );
}
