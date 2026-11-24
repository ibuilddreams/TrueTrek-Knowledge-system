"use client";

import TodaysQuestBoard from "../quests/TodaysQuestBoard";
import QuestHistoryTable from "../quests/QuestHistoryTable";

// The quests half of `DailyActivityTab`. It carries no heading and no tab
// strip of its own — the screen above owns both, and a second row of tabs
// inside the first is the thing the design does not do: its quests view is
// today's board with the history beneath it, in one scroll.
export default function QuestsTab({ onNotify, onOpenRewards }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <TodaysQuestBoard onNotify={onNotify} onOpenRewards={onOpenRewards} />
      <QuestHistoryTable />
    </div>
  );
}
