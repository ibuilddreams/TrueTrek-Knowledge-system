"use client";

import { useState } from "react";
import { History, Swords } from "lucide-react";
import TabNav from "@/components/ui/TabNav";
import WargamerModule from "../wargamer/WargamerModule";
import SessionHistoryList from "../wargamer/SessionHistoryList";

const SECTIONS = [
  { id: "module", label: "Tactical Wargamer", icon: Swords },
  { id: "history", label: "Past Runs", icon: History },
];

/**
 * The student's entry point to LS-302 — the AI role-play boundary simulator.
 *
 * Not to be confused with the War Room tab (a course group chat), War Room
 * Live (monthly audio sessions with college athletes), or the Daily Drill
 * (a situational-judgement MCQ). This one is a conversation the student has
 * to hold their own in, and it is the only portal surface that scores how
 * they said something rather than what they picked.
 */
export default function WargamerTab() {
  const [activeSection, setActiveSection] = useState("module");
  const [openingSessionId, setOpeningSessionId] = useState(null);

  const handleOpenSession = (sessionId) => {
    setOpeningSessionId(sessionId);
    setActiveSection("module");
  };

  return (
    <div className="space-y-6">
      <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-80" />
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center shrink-0">
            <Swords className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-serif font-light text-ink">
              The &ldquo;No&rdquo; Muscle
            </h2>
            <p className="text-xs text-muted font-light mt-1 leading-relaxed">
              Practise turning down family, friends and your community &mdash; against someone
              who pushes back &mdash; before it happens for real.
            </p>
          </div>
        </div>
      </div>

      <TabNav
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={setActiveSection}
        ariaLabel="Tactical Wargamer sections"
        size="lg"
      />

      {activeSection === "module" && (
        <WargamerModule
          initialSessionId={openingSessionId}
          onSessionOpened={() => setOpeningSessionId(null)}
        />
      )}
      {activeSection === "history" && <SessionHistoryList onOpenSession={handleOpenSession} />}
    </div>
  );
}
