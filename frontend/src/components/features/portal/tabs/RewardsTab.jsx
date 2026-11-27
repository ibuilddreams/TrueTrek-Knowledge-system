"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Gift, TrendingUp } from "lucide-react";
import { getMyPointsSummary } from "@/services/pointsService";
import PortalCard, { PortalStat } from "../shell/PortalCard";
import { PortalPageHead, PortalTabs } from "../shell/PortalUI";
import RewardCatalogGrid from "../RewardCatalogGrid";
import PointsTransactionsTable from "../PointsTransactionsTable";
import RedemptionHistoryTable from "../RedemptionHistoryTable";

// The design's `SP.rewards`: the three figures that answer "what can I spend",
// then one card whose tabs swap the catalog, the ledger and what you have
// already asked for.
//
// The three panels render *bare* — this screen owns the card they sit in, as
// the design's `.card.p0` does, so the tab strip and the content below it read
// as one surface rather than a tab bar floating above a second box.
export default function RewardsTab() {
  const [tab, setTab] = useState("catalog");

  const { data: summary } = useQuery({
    queryKey: ["points", "summary"],
    queryFn: async () => {
      const response = await getMyPointsSummary();
      return response?.data || { balance: 0, total_earned: 0, total_spent: 0 };
    },
  });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Rewards"
        subtitle="Earn points from quizzes, quests, drills and streaks. Spend them on mentorship, merch and access."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <PortalStat
          label="Points balance"
          value={(summary?.balance ?? 0).toLocaleString()}
          hint="Available to spend"
          icon={Coins}
        />
        <PortalStat
          label="Total earned"
          value={(summary?.total_earned ?? 0).toLocaleString()}
          hint="All time"
          icon={TrendingUp}
          tone="ok"
        />
        <PortalStat
          label="Total spent"
          value={(summary?.total_spent ?? 0).toLocaleString()}
          hint="On rewards you redeemed"
          icon={Gift}
          tone="warn"
        />
      </div>

      <PortalCard>
        <div className="px-4">
          <PortalTabs
            ariaLabel="Rewards sections"
            options={[
              { value: "catalog", label: "Rewards catalog" },
              { value: "transactions", label: "Points history" },
              { value: "redemptions", label: "My redemptions" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "catalog" && <RewardCatalogGrid />}
        {tab === "transactions" && <PointsTransactionsTable />}
        {tab === "redemptions" && <RedemptionHistoryTable />}
      </PortalCard>
    </div>
  );
}
