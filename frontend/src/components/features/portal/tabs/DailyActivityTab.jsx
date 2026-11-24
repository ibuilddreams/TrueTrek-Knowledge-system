"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PortalPageHead, PortalTabs } from "../shell/PortalUI";
import DrillTab from "./DrillTab";
import QuestsTab from "./QuestsTab";
import WarRoomScreen from "@/components/features/warroom/WarRoomScreen";

// The design's `SP.daily`: one screen holding the drill, the quests and the
// course chat rooms behind a strip of tabs.
//
// The tab is a **path segment, not component state** — `/studentportal/daily`,
// `/studentportal/daily/quests`, `/studentportal/daily/warroom` — which is the
// shape the design uses and the reason folding three sidebar entries into one
// costs nothing: every tab is still a real URL that can be linked, bookmarked
// and reached with the back button. The portal's route only reads the first
// segment (see the `[[...slug]]` page), so the second is read straight off the
// pathname here rather than threaded down as a prop.
const VIEWS = ["drill", "quests", "warroom"];
const DEFAULT_VIEW = "drill";

const TABS = [
  { value: "drill", label: "Daily drill" },
  { value: "quests", label: "Daily quests" },
  { value: "warroom", label: "War room chat" },
];

export default function DailyActivityTab({ onNotify, onOpenRewards }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const segment = (pathname || "").split("/").filter(Boolean)[2];
  const view = VIEWS.includes(segment) ? segment : DEFAULT_VIEW;

  function changeView(next) {
    const base = "/studentportal/daily";
    const href = next === DEFAULT_VIEW ? base : `${base}/${next}`;
    const query = searchParams.toString();
    router.replace(query ? `${href}?${query}` : href, { scroll: false });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Daily activity"
        subtitle="A drill, three quests and your course chat rooms. Resets every day at midnight."
      />

      <PortalTabs
        ariaLabel="Daily activity sections"
        options={TABS}
        value={view}
        onChange={changeView}
      />

      {view === "drill" && <DrillTab onNotify={onNotify} />}
      {view === "quests" && (
        <QuestsTab onNotify={onNotify} onOpenRewards={onOpenRewards} />
      )}
      {view === "warroom" && <WarRoomScreen />}
    </div>
  );
}
