"use client";

import { useState } from "react";
import { History, Swords } from "lucide-react";
import TabNav from "@/components/ui/TabNav";
import TodaysQuestBoard from "../quests/TodaysQuestBoard";
import QuestHistoryTable from "../quests/QuestHistoryTable";

const SECTIONS = [
  { id: "today", label: "Today's Quests", icon: Swords },
  { id: "history", label: "Quest History", icon: History },
];

export default function QuestsTab({ onNotify, onOpenRewards }) {
  const [activeSection, setActiveSection] = useState("today");

  return (
    <div className="space-y-6">
      <TabNav
        tabs={SECTIONS}
        activeTab={activeSection}
        onChange={setActiveSection}
        ariaLabel="Quest sections"
        size="lg"
      />

      {activeSection === "today" && (
        <TodaysQuestBoard onNotify={onNotify} onOpenRewards={onOpenRewards} />
      )}
      {activeSection === "history" && <QuestHistoryTable />}
    </div>
  );
}
