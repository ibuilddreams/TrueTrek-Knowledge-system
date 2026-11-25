"use client";

import { useState } from "react";
import { Mic, UserRound } from "lucide-react";
import TabNav from "@/components/ui/TabNav";
import AdminSessionsSection from "@/components/features/admin/AdminSessionsSection";
import AdminSpeakersSection from "@/components/features/admin/AdminSpeakersSection";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

const SECTIONS = [
  { id: "sessions", label: "Sessions", icon: Mic },
  { id: "speakers", label: "Speakers", icon: UserRound },
];

export default function LiveSessionsTab() {
  const [activeSection, setActiveSection] = useState("sessions");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="War room live"
        subtitle="Monthly audio sessions with current college athletes."
      />

      <TabNav tone="cobalt"
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={setActiveSection}
        ariaLabel="War Room Live sections"
        size="lg"
      />

      {activeSection === "sessions" && <AdminSessionsSection />}
      {activeSection === "speakers" && <AdminSpeakersSection />}
    </div>
  );
}
