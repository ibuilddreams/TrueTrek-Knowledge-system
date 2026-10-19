"use client";

import { useState } from "react";
import { Mic, UserRound } from "lucide-react";
import TabNav from "@/components/ui/TabNav";
import AdminSessionsSection from "@/components/features/admin/AdminSessionsSection";
import AdminSpeakersSection from "@/components/features/admin/AdminSpeakersSection";

const SECTIONS = [
  { id: "sessions", label: "Sessions", icon: Mic },
  { id: "speakers", label: "Speakers", icon: UserRound },
];

export default function LiveSessionsTab() {
  const [activeSection, setActiveSection] = useState("sessions");

  return (
    <div className="space-y-6">
      <TabNav
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
